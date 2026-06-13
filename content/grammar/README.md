# Grammar content authoring

Grammar lessons live here as **markdown** and are compiled into the JSON the app
serves. **These markdown files are the source of truth** — always edit them, never
the generated `public/grammar/*.json` (those are overwritten on every build).

- [Quick start](#quick-start)
- [How it fits together](#how-it-fits-together)
- [Directory layout](#directory-layout)
- [Lesson file reference](#lesson-file-reference)
- [`_meta.json` reference](#_metajson-reference)
- [Editing an existing lesson](#editing-an-existing-lesson)
- [Adding a new lesson](#adding-a-new-lesson)
- [Adding a new language](#adding-a-new-language)
- [Reordering](#reordering)
- [Building & previewing](#building--previewing)
- [Validation rules](#validation-rules)
- [Writing good exercises](#writing-good-exercises)
- [Troubleshooting](#troubleshooting)

---

## Quick start

```bash
# 1. Edit or add a markdown lesson under content/grammar/<lang>/
# 2. Compile it to the served JSON (run from the server/ folder):
cd server && npm run build:grammar
# 3. Reload the app — the new content appears under /grammar
```

The build **validates** every lesson and **fails loudly** on bad content, so a
broken lesson can never reach the app.

---

## How it fits together

```
content/grammar/**           →   npm run build:grammar   →   public/grammar/*.json
(source of truth, you edit)      (server/scripts/             (generated, the app
                                  build-grammar.mjs)           fetches these — do not edit)
```

- **Source:** `content/grammar/<lang>/*.md` + `_meta.json`.
- **Build:** `server/scripts/build-grammar.mjs` (wired to `npm run build:grammar`).
  It parses each lesson's frontmatter, renders the markdown explanation body to
  HTML, validates everything, and writes `public/grammar/<lang>.json` plus
  `index.json` (the manifest the app loads first).
- **App:** the Angular `/grammar` page reads `public/grammar/index.json`, then
  loads each language's JSON on demand.

There is also an optional drafting helper, `server/scripts/scaffold-lesson.mjs`,
that asks the LLM to write a first draft of a lesson for you to edit (see
[Adding a new lesson](#adding-a-new-lesson)).

---

## Directory layout

```
content/grammar/
  README.md                     ← this file
  korean/
    _meta.json                  ← language metadata
    01-topic-particle.md        ← one lesson per file
    02-subject-particle.md      ← the NN- number prefix sets the order
    …
  japanese/
    _meta.json
    01-topic-particle-wa.md
    …
```

- One folder per language. The folder name is the language **id** (lowercase,
  no spaces) and becomes the file name in `public/grammar/` (e.g. `korean` →
  `korean.json`).
- One `.md` file per lesson/topic. The `NN-` prefix controls topic order within
  the language; the rest of the file name should match the lesson `id`.

---

## Lesson file reference

A lesson is a markdown file: **YAML frontmatter** (between the `---` fences) holds
the structured data, and the **markdown body** (after the closing `---`) is the
explanation shown at the top of the lesson.

```markdown
---
id: topic-particle
title: Topic Particle 은/는
level: Beginner
summary: Marks the topic of a sentence — 은 after a consonant, 는 after a vowel.
examples:
  - text: 저는 학생이에요.
    romanization: jeoneun haksaeng-ieyo.
    translation: I am a student.
  - text: 책은 책상 위에 있어요.
    romanization: chaegeun chaeksang wie isseoyo.
    translation: The book is on the desk.
exercises:
  - prompt: 저___ 한국 사람이에요.
    promptTranslation: I am Korean.
    options: [은, 는, 이, 가]
    answerIndex: 1
    explanation: 저 ends in a vowel, so 는 is used.
---

은/는 marks the **topic** of a sentence — what it is about, often with a sense
of contrast. Attach 은 after a consonant and 는 after a vowel.

You can use **bold**, _italics_, `code`, and bullet lists here; they render as
formatted text in the lesson.
```

### Frontmatter fields

| Field        | Required | Type   | Notes |
|--------------|----------|--------|-------|
| `id`         | yes      | string | Unique **within the language**. Kebab-case. Should match the file name after the `NN-` prefix. |
| `title`      | yes      | string | Shown in the topic list and lesson header. |
| `level`      | yes      | string | `Beginner` renders a green badge; any other value (e.g. `Intermediate`, `Advanced`) renders an amber badge. |
| `summary`    | yes      | string | One line shown under the title in the topic list. |
| `examples`   | yes      | list   | May be empty (`[]`), but include 2–3. Each item: `text`, `romanization`, `translation` (all strings; missing ones default to empty). |
| `exercises`  | yes      | list   | The practice questions. See below. |

### Exercise fields

| Field               | Required | Type     | Notes |
|---------------------|----------|----------|-------|
| `prompt`            | yes      | string   | The question sentence. Must contain **exactly one** `___` where the answer goes. Keep the rest of the sentence complete; the noun/word being tested should appear **bare** (don't pre-attach the particle). |
| `promptTranslation` | no       | string   | English gloss shown under the prompt. |
| `options`           | yes      | list     | **2–4** answer choices (4 is standard). |
| `answerIndex`       | yes      | integer  | **0-based** index into `options` of the correct answer (`0` = first option). |
| `explanation`       | no       | string   | Shown after the learner checks their answer. Explain *why* it's correct. |

### The explanation body

Everything after the closing `---` is the explanation, written in markdown and
rendered to HTML at build time. Plain paragraphs, `**bold**`, `_italics_`,
`` `code` ``, and `- bullet lists` are supported.

---

## `_meta.json` reference

One per language folder. Controls the language tab and ordering.

```json
{
  "order": 1,
  "language": "Korean",
  "name": "Korean Grammar",
  "romanizationLabel": "Revised Romanization",
  "flag": "🇰🇷"
}
```

| Field               | Required | Notes |
|---------------------|----------|-------|
| `order`             | no       | Number controlling language tab order (lower = earlier). Defaults to the bottom, then alphabetical. |
| `language`          | yes      | Display name shown on the tab and lesson badges (e.g. `Korean`). |
| `name`              | yes      | Longer title for the deck (e.g. `Korean Grammar`). |
| `romanizationLabel` | no       | Only used by `scaffold-lesson.mjs` to tell the LLM which romanization system to use (e.g. `Revised Romanization`, `Romaji`, `Pinyin`). Not shown in the app. |
| `flag`              | no       | Emoji flag shown on the language tab. |

---

## Editing an existing lesson

1. Open the lesson file, e.g. `content/grammar/korean/03-object-particle.md`.
2. Change the text, examples, options, `answerIndex`, or the explanation body.
3. `cd server && npm run build:grammar`.
4. Reload the app.

---

## Adding a new lesson

**Option A — write it by hand (recommended for accuracy):**

1. Create a new file in the language folder, numbered after the last one, e.g.
   `content/grammar/korean/13-future-tense.md`.
2. Fill in the frontmatter + explanation following the
   [lesson reference](#lesson-file-reference).
3. `cd server && npm run build:grammar`.

**Option B — draft it with the LLM, then edit:**

```bash
node server/scripts/scaffold-lesson.mjs korean future-tense "Future Tense -(으)ㄹ 거예요" "expressing future intention"
#                                        ^lang   ^id          ^title                      ^teaching focus
```

This writes a draft `content/grammar/korean/NN-future-tense.md` (next number in
sequence). It needs `GROQ_API_KEY` in `server/.env`.

> ⚠️ **Always review LLM drafts**, especially for Korean. The model cannot
> reliably track 받침 (whether a noun ends in a consonant or vowel), which
> 은/는, 이/가, and 을/를 depend on — it will produce wrong answers and
> sometimes pre-attach the particle to the noun. Particle rules are
> deterministic; verify every answer by hand.

After either option, run `npm run build:grammar` and reload.

---

## Adding a new language

Say you want to add **Spanish**:

1. Create the folder and metadata file `content/grammar/spanish/_meta.json`:

   ```json
   {
     "order": 3,
     "language": "Spanish",
     "name": "Spanish Grammar",
     "romanizationLabel": "none",
     "flag": "🇪🇸"
   }
   ```

2. Add lesson files: `content/grammar/spanish/01-<topic>.md`,
   `02-<topic>.md`, … (write by hand, or scaffold each with
   `node server/scripts/scaffold-lesson.mjs spanish <id> "<Title>" "<focus>"`).

3. Build:

   ```bash
   cd server && npm run build:grammar
   ```

That's it — no app code changes. The build picks up the new folder, writes
`public/grammar/spanish.json`, adds it to the manifest, and the **Spanish tab
appears automatically** with its flag, ordered by `order`.

> For languages that don't use romanization (e.g. Spanish, French), set
> `romanizationLabel` to `"none"` and simply leave each example's
> `romanization` empty — the app hides it when blank.

---

## Reordering

- **Topics within a language:** change the `NN-` number prefixes on the files
  (they're sorted by file name). Renaming `13-future-tense.md` →
  `05-future-tense.md` moves it earlier.
- **Languages (tabs):** change the `order` field in each `_meta.json`.

Rebuild after any rename.

---

## Building & previewing

```bash
cd server
npm run build:grammar      # compiles content/grammar/** → public/grammar/*.json
```

(Equivalently, from the repo root: `node server/scripts/build-grammar.mjs`.)

Then reload the app. Note the `/grammar` page caches topic data per browser
session, so do a **full page reload** to pick up changes (not just an in-app
navigation).

The build prints how many topics it compiled per language and writes the
manifest. If anything is wrong it prints the errors and exits without writing
the manifest (see below).

---

## Validation rules

The build **fails** (and ships nothing) if any lesson breaks these rules:

- `id`, `title`, `level`, `summary` are present and non-empty.
- The explanation body is non-empty.
- `examples` and `exercises` are lists.
- Every exercise has a `prompt` containing **exactly one** `___`.
- Every exercise has **at least 2** `options`.
- Every exercise's `answerIndex` is an integer **within range** of its options.
- No two lessons in the same language share an `id`.

Example failure output:

```
Build failed with 1 error(s):
  - korean/01-topic-particle.md: exercise 1: answerIndex 9 out of range
```

---

## Writing good exercises

- **One blank, bare noun.** The `prompt` should have a single `___` that
  *replaces* the tested word/particle. Don't write `사과를 ___ 먹어요` (the
  particle is already attached) — write `사과___ 먹어요`.
- **Plausible distractors.** Make the wrong `options` the same grammatical
  category (e.g. all particles), so the choice actually tests understanding.
- **Explain the why.** A good `explanation` states the rule, not just the
  answer — e.g. "사과 ends in a vowel, so 를 is used."
- **Keep sentences natural and at the lesson's level.**

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| New lesson/language doesn't appear | Did you run `npm run build:grammar`? Then do a **full** page reload. |
| Build prints errors and stops | Read the listed file/exercise; fix the field it names and rebuild. |
| Tab order looks wrong | Check the `order` values in each `_meta.json`. |
| Topic order looks wrong | Check the `NN-` file-name prefixes. |
| `scaffold-lesson.mjs` fails | Ensure `GROQ_API_KEY` is set in `server/.env`. |
| Romanization line missing in the app | That's expected when `romanization` is empty; fine for languages that don't use it. |
