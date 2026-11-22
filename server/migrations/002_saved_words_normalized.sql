-- Flashcard dedup: "Casa", "casa" and " casa " are the same card.
-- Words are stored trimmed with single spaces (enforced by a check), and
-- uniqueness is case-insensitive per user + language.
-- Run in the Supabase SQL editor. The server's insert relies on the new index.

update saved_words
  set word = regexp_replace(btrim(word), '\s+', ' ', 'g')
  where word <> regexp_replace(btrim(word), '\s+', ' ', 'g');

alter table saved_words
  add constraint saved_words_word_normalized
  check (word = regexp_replace(btrim(word), '\s+', ' ', 'g'));

create unique index if not exists saved_words_user_lang_word_ci
  on saved_words (user_id, language, lower(word));

alter table saved_words drop constraint if exists saved_words_user_id_word_language_key;
