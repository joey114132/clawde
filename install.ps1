# Clawde — one-line installer for Windows.
#   irm https://raw.githubusercontent.com/joey114132/clawde/main/install.ps1 | iex
# Downloads the latest desktop app from the GitHub Release, installs it silently, and
# launches Clawde. The app adds itself to login startup, so he returns every session.
$ErrorActionPreference = "Stop"
$repo = "joey114132/clawde"
Write-Host "Installing Clawde..."

$headers = @{ "User-Agent" = "clawde-installer" }
$rel = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest" -Headers $headers
$asset = $rel.assets | Where-Object { $_.name -match "Setup.*\.exe$" } | Select-Object -First 1
if (-not $asset) { throw "no Windows build in the latest release" }

$exe = Join-Path $env:TEMP $asset.name
Invoke-WebRequest $asset.browser_download_url -OutFile $exe -Headers $headers
Start-Process -FilePath $exe -ArgumentList "/S" -Wait     # NSIS silent, per-user install

$app = Join-Path $env:LOCALAPPDATA "Programs\clawde\Clawde.exe"
if (-not (Test-Path $app)) {
  $found = Get-ChildItem "$env:LOCALAPPDATA\Programs" -Recurse -Filter "Clawde.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($found) { $app = $found.FullName }
}
if (Test-Path $app) { Start-Process $app }
Write-Host "Clawde is wandering. He'll be back at every login."
