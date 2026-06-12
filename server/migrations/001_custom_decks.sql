-- Custom user-created flashcard decks.
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Model: one deck per card. A saved word belongs to at most one custom deck;
-- deleting a deck un-assigns its cards (they fall back to "My <Language> Cards").

create table if not exists decks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  name       text not null,
  created_at timestamptz not null default now()
);

create index if not exists decks_user_idx on decks (user_id);

alter table saved_words
  add column if not exists deck_id uuid references decks(id) on delete set null;

create index if not exists saved_words_deck_idx on saved_words (deck_id);
