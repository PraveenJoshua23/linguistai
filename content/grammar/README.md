# Grammar content

Grammar lessons live here as markdown and are compiled to the JSON the app
serves. **These files are the source of truth** — edit them, not the generated
`public/grammar/*.json`.

## Layout

```
content/grammar/
  <lang>/
    _meta.json            # language metadata (order, name, flag, …)
    01-<topic-id>.md      # one lesson per file; number prefix sets order
    02-<topic-id>.md
```

## Lesson file format

Frontmatter (YAML) holds the metadata, examples, and exercises. The markdown
**body** is the lesson explanation (supports **bold**, _italics_, lists, and
`code`).

```markdown
---
id: topic-particle              # unique within the language
title: Topic Particle 은/는
level: Beginner                 # "Beginner" → green badge, anything else → amber
summary: One-line teaser shown in the topic list.
examples:
  - text: 저는 학생이에요.
    romanization: jeoneun haksaeng-ieyo.
    translation: I am a student.
exercises:
  - prompt: 저___ 한국 사람이에요.   # EXACTLY one ___ , and the noun must be bare
    promptTranslation: I am Korean.
    options: [은, 는, 이, 가]
    answerIndex: 1                  # 0-based → "는"
    explanation: 저 ends in a vowel, so 는 is used.
---

은/는 marks the **topic** of a sentence. Attach 은 after a consonant and 는
after a vowel.
```

`_meta.json`:

```json
{ "order": 1, "language": "Korean", "name": "Korean Grammar", "romanizationLabel": "Revised Romanization", "flag": "🇰🇷" }
```

## Workflow

- **Edit a lesson** — change the `.md` file.
- **Add a lesson** — create a new numbered `.md` file (or scaffold a draft with
  the LLM: `node server/scripts/scaffold-lesson.mjs <lang> <id> "<Title>" "<focus>"`,
  then review and edit it).
- **Add a language** — create a new `content/grammar/<lang>/` folder with a
  `_meta.json` and lesson files. The language tab appears automatically.
- **Reorder** — change the number prefixes (topics) or `order` (languages).

Then build:

```bash
cd server && npm run build:grammar
```

The build **validates** every lesson (required fields, exactly one `___` per
prompt, in-range `answerIndex`, unique ids) and **fails loudly** on bad content,
so nothing broken ever ships. Reload the app to see changes (a full page reload
is needed — topic data is cached per session).

> ⚠️ Always review LLM-drafted lessons. The model is unreliable on Korean
> particle rules (it can't track 받침, the consonant/vowel ending that 은/는,
> 이/가, 을/를 depend on). Particle answers are deterministic — verify them.
