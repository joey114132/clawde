// 터미널 창만 골라 화면 좌표를 반환 — 데스크톱 배경에는 Clawde가 나가지 않게 함
const { execFileSync } = require("child_process");
const os = require("os");

// wm_class / 프로세스명 / 창 제목에 이 문자열이 있으면 터미널로 취급
const TERMINALS = [
  "terminal", "gnome-terminal", "org.gnome.terminal", "org.gnome.console",
  "terminator", "ghostty", "kitty", "alacritty", "konsole", "xterm", "wezterm",
  "foot", "tilix", "rio", "contour", "hyper", "iterm", "tabby",
  "powershell", "pwsh", "windowsterminal", "windows terminal",
  "com.apple.terminal", "com.googlecode.iterm2",
];

function isTerminal(name) {
  const n = (name || "").toLowerCase();
  return TERMINALS.some(t => n.includes(t));
}

function run(cmd, args, enc = "utf8") {
  try { return execFileSync(cmd, args, { encoding: enc, timeout: 2500, windowsHide: true }); }
  catch (_) { return ""; }
}

// Linux (X11): wmctrl -lG → {x,y,w,h,label}
function linuxRects() {
  const out = run("wmctrl", ["-lG"]);
  if (!out) return linuxXdotool();
  const rects = [];
  for (const line of out.trim().split("\n")) {
    const p = line.trim().split(/\s+/);
    if (p.length < 8) continue;
    const x = +p[2], y = +p[3], w = +p[4], h = +p[5];
    const label = p.slice(7).join(" ").toLowerCase();
    if (w < 80 || h < 60) continue;
    if (isTerminal(label)) rects.push({ x, y, w, h });
  }
  return rects.length ? rects : linuxXdotool();
}

function linuxXdotool() {
  const ids = run("xdotool", ["search", "--onlyvisible", "--class", ""]).trim().split(/\s+/).filter(Boolean);
  const rects = [];
  for (const id of ids) {
    const name = run("xdotool", ["getwindowname", id]).trim().toLowerCase();
    const cls = run("xdotool", ["getwindowclassname", id]).trim().toLowerCase();
    if (!isTerminal(name) && !isTerminal(cls)) continue;
    const g = run("xdotool", ["getwindowgeometry", "--shell", id]);
    const m = Object.fromEntries(g.split("\n").filter(Boolean).map(l => l.split("=")));
    const w = +(m.WIDTH || 0), h = +(m.HEIGHT || 0);
    if (w < 80 || h < 0) continue;
    rects.push({ x: +(m.X || 0), y: +(m.Y || 0), w, h });
  }
  return rects;
}

// macOS: osascript로 터미널 앱 창 bounds 수집
function darwinRects() {
  const script = `
set out to ""
repeat with proc in (every application process whose background only is false)
  set pname to name of proc
  repeat with win in (every window of proc)
    try
      set {px, py} to position of win
      set {ww, wh} to size of win
      set out to out & pname & tab & px & tab & py & tab & ww & tab & wh & linefeed
    end try
  end repeat
end repeat
return out`;
  const out = run("osascript", ["-e", script]);
  const rects = [];
  for (const line of out.trim().split("\n")) {
    if (!line.trim()) continue;
    const [name, x, y, w, h] = line.split("\t");
    if (!name || !isTerminal(name)) continue;
    if (+w < 80 || +h < 60) continue;
    rects.push({ x: +x, y: +y, w: +w, h: +h });
  }
  return rects;
}

// Windows: PowerShell로 터미널 프로세스 MainWindow RECT
function win32Rects() {
  const ps = `
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text;
public class W {
  public delegate bool EWP(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EWP f, IntPtr l);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  public struct RECT { public int L,T,R,B; }
  public static System.Collections.Generic.List<string> L = new System.Collections.Generic.List<string>();
  static bool CB(IntPtr h, IntPtr l) {
    if (!IsWindowVisible(h)) return true;
  var t=new StringBuilder(256); GetWindowText(h,t,256);
  var c=new StringBuilder(256); GetClassName(h,c,256);
  var title=t.ToString(); var cls=c.ToString();
  var low=(title+" "+cls).ToLower();
  var terms=@("terminal","powershell","pwsh","windowsterminal","windowsterminalapp","conhost","iterm","hyper","alacritty","kitty","wezterm","tabby");
  var hit=false; foreach(var term in terms){ if(low.Contains(term)){ hit=true; break; } }
  if(!hit) return true;
  RECT r; GetWindowRect(h,out r);
  int w=r.R-r.L, h=r.B-r.T; if(w<80||h<60) return true;
  L.Add(r.L+"\\t"+r.T+"\\t"+w+"\\t"+h); return true;
  }
}
"@
[W]::EnumWindows([W+EWP]{param($a,$b)[W]::CB($a,$b)},[IntPtr]::Zero)
[W]::L -join [char]10
`;
  const out = run("powershell", ["-NoProfile", "-Command", ps]);
  return out.trim().split("\n").filter(Boolean).map(l => {
    const [x, y, w, h] = l.split("\t").map(Number);
    return { x, y, w, h };
  });
}

function getTerminalRects() {
  switch (os.platform()) {
    case "linux": return linuxRects();
    case "darwin": return darwinRects();
    case "win32": return win32Rects();
    default: return [];
  }
}

module.exports = { getTerminalRects, TERMINALS };
