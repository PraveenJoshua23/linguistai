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

  -- Optional custom deck assignment (one deck per card). See decks below.
  deck_id uuid references decks(id) on delete set null,

  unique (user_id, word, language)
);

-- Fast lookup of cards due for review.
create index if not exists saved_words_due_idx on saved_words (user_id, due_at);
create index if not exists saved_words_deck_idx on saved_words (deck_id);

-- Custom user-created decks. A saved word belongs to at most one deck;
-- deleting a deck un-assigns its cards (deck_id -> null). See
-- server/migrations/001_custom_decks.sql for the applied migration.
create table if not exists decks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  name       text not null,
  created_at timestamptz not null default now()
);

create index if not exists decks_user_idx on decks (user_id);
