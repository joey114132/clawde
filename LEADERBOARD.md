# 🏆 Enabling the website leaderboard

The [live demo](https://joey114132.github.io/clawde/) has a Clawde-hitting mini-game with
a **shared leaderboard**. It's off until you connect a free [Supabase](https://supabase.com)
project — the site is static (GitHub Pages), so it needs a tiny hosted database to store
scores. Setup is ~2 minutes.

## 1. Create a Supabase project

Sign up at [supabase.com](https://supabase.com) (free tier is plenty) and create a project.

## 2. Create the `scores` table

In the project's **SQL Editor**, run:

```sql
create table if not exists scores (
  id         bigint generated always as identity primary key,
  nick       text    not null check (char_length(nick) between 1 and 24),
  score      integer not null check (score >= 0),
  country    text,                                    -- 2-letter code like 'KR' (auto-detected)
  created_at timestamptz default now()
);

-- Row-Level Security: anyone may read the board and insert a score, nothing else.
alter table scores enable row level security;
create policy "read all"  on scores for select using (true);
create policy "insert any" on scores for insert
  with check (char_length(nick) between 1 and 24 and score >= 0);

create index if not exists scores_score_idx on scores (score desc);
```

> Already created the table before the country column existed? Just add it:
> `alter table scores add column if not exists country text;`
> The board auto-detects each visitor's country (via a free, key-less geo-IP lookup) and
> shows a flag — no login or manual pick needed.

## 3. Paste your keys into the site

In **Settings → API**, copy the **Project URL** and the **anon public** key, then edit
[`docs/index.html`](docs/index.html) — find these two lines near the bottom and fill them in:

```js
const SB_URL = "https://YOUR-PROJECT.supabase.co";   // ← your Project URL
const SB_KEY = "YOUR-ANON-KEY";                       // ← your anon public key
```

Commit and push — GitHub Pages redeploys, and the leaderboard goes live.

## Is it safe to put the anon key in the page?

Yes — the **anon key is designed to be public** in front-end code. The Row-Level Security
policies above are what actually protect the table: visitors can only *read* the board and
*insert* a score row. They can't read anything else, update, or delete.

## Known limit

Scores are submitted from the browser, so a determined user could POST a fake score — fine
for a fun mascot board, not for a real tournament. If you ever want it tamper-proof, move
scoring behind a Supabase Edge Function that validates the run server-side.
