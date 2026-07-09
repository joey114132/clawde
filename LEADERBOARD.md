# Leaderboard setup (Supabase + GitHub sign-in)

The website leaderboard uses **Supabase** for storage and **"Sign in with GitHub"**
for identity — so every entry is a verified GitHub account with its real avatar, and
each account keeps only its **best** score. It's free and takes ~10 minutes.

> Sign-in only works on the **deployed site** (e.g. `https://<you>.github.io/clawde/`) —
> the OAuth redirect and the Supabase SDK can't run inside the sandboxed demo/artifact.

## 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → **New project**. Note your project's
**URL** and **anon public key** (Settings → API) for the last step.

## 2. Create a GitHub OAuth app

GitHub → Settings → Developer settings → **OAuth Apps** → **New OAuth App**:

- **Homepage URL:** `https://<you>.github.io/clawde/`
- **Authorization callback URL:** `https://<project-ref>.supabase.co/auth/v1/callback`
  (copy this exact callback from Supabase → Authentication → Providers → GitHub)

Save, then generate a **client secret**. Keep the **Client ID** + **secret**.

## 3. Enable the GitHub provider in Supabase

Supabase → **Authentication → Providers → GitHub** → enable, and paste the
**Client ID** and **Client secret** from step 2. Save.

## 4. Set the redirect URLs

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://<you>.github.io/clawde/`
- **Redirect URLs:** add `https://<you>.github.io/clawde/**`

## 5. Create the table, policy, and score function

Supabase → **SQL Editor** → run:

```sql
-- one row per GitHub account, holding their best score
create table if not exists scores (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  username   text not null,
  avatar_url text,
  country    text,                                  -- 2-letter code, auto-detected
  score      integer not null default 0 check (score >= 0),
  updated_at timestamptz default now()
);

alter table scores enable row level security;

-- anyone can read the board
create policy "public read" on scores for select using (true);

-- writes go only through this function. It resolves your GitHub username/avatar
-- SERVER-SIDE from your auth identity (so they can't be spoofed) and keeps your best score.
create or replace function submit_score(p_country text, p_score int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := (select raw_user_meta_data from auth.users where id = auth.uid());
begin
  insert into scores (user_id, username, avatar_url, country, score)
  values (
    auth.uid(),
    coalesce(meta->>'user_name', meta->>'preferred_username', 'user'),
    meta->>'avatar_url',
    p_country,
    least(greatest(p_score, 0), 1000000)
  )
  on conflict (user_id) do update
    set score      = greatest(scores.score, excluded.score),
        username   = excluded.username,
        avatar_url = excluded.avatar_url,
        country    = excluded.country,
        updated_at = now();
end;
$$;

revoke execute on function submit_score(text, int) from public;   -- least-privilege: no anon
grant  execute on function submit_score(text, int) to authenticated;
```

Because `submit_score` runs as `auth.uid()`, a signed-in user can only write **their
own** row, and `greatest(...)` means a later lower score never overwrites a better one.

## 6. Wire up the site

In `docs/index.html`, find these two lines and paste your values:

```js
const SB_URL = "https://YOUR-PROJECT.supabase.co";
const SB_KEY = "YOUR-ANON-KEY";
```

Commit + push. On the live site the board now shows a **Sign in with GitHub** button;
after signing in, **Submit my score** posts your best. The anon key is safe to ship —
reads are public by design and writes are gated by the function + your GitHub login.

## Notes

- **Cheating:** sign-in verifies *who* you are, not the score itself (a client-side game
  can always forge a number). It just ties scores to real accounts and dedupes them.
- **Country flag** is auto-detected via a free, key-less geo-IP lookup.
- Already had the old nickname table? Drop it (`drop table scores;`) and re-run step 5.
