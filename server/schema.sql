-- LinguistAI database schema (Supabase Postgres).
-- This file documents the tables; they are managed in the Supabase dashboard.

create table if not exists saved_words (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  word        text not null,
  language    text not null,
  meaning     text,
  explanation text,
  examples    jsonb not null default '[]',
  pos         text,
  category    text default 'Other',
  created_at  timestamptz not null default now(),

  -- SM-2 spaced-repetition state (see server/src/lib/sm2.js)
  ease_factor      real        not null default 2.5,
  interval_days    real        not null default 0,
  repetitions      integer     not null default 0,
  due_at           timestamptz not null default now(),
  last_reviewed_at timestamptz,

  unique (user_id, word, language)
);

-- Fast lookup of cards due for review.
create index if not exists saved_words_due_idx on saved_words (user_id, due_at);
