# LinguistAI Roadmap

Product loop: **encounter** (Translator, YouTube Subtitles) → **understand** (Breakdown, Grammar) → **retain** (Flashcards / SM-2).
Every item below is judged by whether it strengthens that loop.

Work order: **1. Improvements to existing features → 2. MVP gaps → 3. Future pipeline.**

---

## Current features (baseline, Sept 2026)

- **Translator**: Qwen-MT with Groq fallback, 15 languages, context and tone controls, transliteration, accuracy badge, on-demand word breakdown.
- **YouTube Subtitle Learner**: transcript fetch, synced sentence highlighting, per-sentence translation and breakdown, dual-language view, save words and phrases.
- **Flashcards**: SM-2 spaced repetition, due queue, prebuilt decks, custom decks (one deck per card), manual card creation, batch review submit.
- **Grammar**: static JSON lessons for Korean and Japanese, with examples, romanization and multiple-choice exercises.
- **History**: saved translations, click to reuse.
- **Saved Words / Glossary (phrases)**: two separate saved collections.
- **Settings**: display name, default languages, context and tone, display toggles, flashcard behavior.

---

## 1. Improvements to existing features (do first)

- [x] **API auth (security, MVP-blocking).** `/history/:userId`, `/saved-words/:userId` and the other routes trust a client-supplied `userId`, so anyone can read or write another user's data. Verify the Supabase JWT on the server and take the user id from the token. *(Shipped in PR #7.)*
- [x] **Single shared language list.** `LANGUAGES` is duplicated in `translate.service.ts` and `settings.component.ts`, and the subtitles page keeps a third list with ISO codes. Replace them with one shared constant that includes ISO codes, which TTS will also need.
- [x] **Auto-detect source language.** Add an "Auto-detect" option to the source dropdown. This is a prompt/API change.
- [x] **Accuracy badge.** The same model grades its own output, so the rating means little. Either remove it or relabel it as "confidence". *(Removed.)*
- [x] **Flashcard dedup normalization.** `isAdded()` / `createCard()` compare raw strings, so "Casa" and "casa" become two cards. Normalize case and whitespace, and enforce the same rule in the DB.
- [x] **Merge Saved Words + Glossary.** Replace the two nav items with one "Saved" page that has Words and Phrases tabs.
- [x] **Persist breakdown to history.** `translate.js` saves `breakdown: []`, and the breakdown fetched later is never written back. Reusing a history entry therefore pays for the breakdown again. Save it when it is fetched.
- [x] **Honest flashcard errors.** Optimistic add, delete and review failures only `console.warn`, so the UI shows success when nothing was saved. Add a toast and either roll back or retry.
- [x] **History search, filter and delete.** The list is flat, with no search, no language filter, no pagination and no way to delete entries.

## 2. MVP gaps (after improvements)

- [ ] **Forgot password flow.** Add a "Forgot password?" link on the login page that calls `supabase.auth.resetPasswordForEmail()`, plus a `/reset-password` page that handles the recovery link and calls `updateUser({ password })`. Needs the site URL and redirect URL set in Supabase Auth settings. Right now anyone who forgets their password is locked out.
- [ ] **Text-to-speech.** Use the browser's `speechSynthesis` on translation results, word cards and flashcards. It is free and needs no backend. Best value for the effort.
- [ ] **Flashcard reverse mode.** Add meaning → word recall alongside word → meaning. This is mostly a UI flag.
- [ ] **Due count + streak.** Show "N cards due today" in the sidebar and a simple daily streak. Retention is what makes SRS work.
- [ ] **Grammar → flashcards.** Make the vocabulary in grammar examples savable as cards.

## 3. Future pipeline (post-MVP)

- LLM conversation tutor (needs guardrails, personas and evals)
- Speech input and pronunciation scoring (browser ASR is flaky; scoring needs real ASR)
- OCR / image translation, browser extension, mobile app
- Social features: shared decks, leaderboards (only once retention exists)
- More grammar languages (validate usage of KO/JA first)
- Podcast / audio transcript learner (wait for YouTube learner usage data)
