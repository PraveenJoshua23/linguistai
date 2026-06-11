import { Router } from 'express';
import Groq from 'groq-sdk';
import sql from '../db.js';
import { schedule, GRADES } from '../lib/sm2.js';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CATEGORIES = ['Food & Drink', 'Travel', 'Body & Health', 'Business', 'Emotions', 'Nature', 'Time', 'Greetings & Social', 'Other'];

async function classifyWord(word, pos, meaning, language) {
  try {
    const chat = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a word classifier. Return ONLY a valid JSON object: {"category": string}',
        },
        {
          role: 'user',
          content: `Language: ${language}\nWord: "${word}" (${pos})\nMeaning: "${meaning}"\nClassify into exactly one: ${CATEGORIES.join(' | ')}`,
        },
      ],
    });
    const { category } = JSON.parse(chat.choices[0].message.content);
    return CATEGORIES.includes(category) ? category : 'Other';
  } catch {
    return 'Other';
  }
}

router.get('/:userId', async (req, res) => {
  const dueOnly = req.query.due === 'true';
  try {
    const rows = dueOnly
      ? await sql`
          select * from saved_words
          where user_id = ${req.params.userId} and due_at <= now()
          order by due_at asc
        `
      : await sql`
          select * from saved_words
          where user_id = ${req.params.userId}
          order by created_at desc
        `;
    res.json(rows);
  } catch (err) {
    console.error('Saved words fetch error:', err.message);
    res.status(500).json({ error: 'Could not fetch saved words' });
  }
});

// Batch-apply SM-2 reviews collected over a study session.
router.post('/review-batch', async (req, res) => {
  const { userId, reviews } = req.body;

  if (!userId || !Array.isArray(reviews) || reviews.length === 0) {
    return res.status(400).json({ error: 'userId and a non-empty reviews array are required' });
  }

  const valid = reviews.filter(
    (r) => r && typeof r.cardId === 'string' && GRADES.includes(r.grade),
  );
  if (valid.length === 0) {
    return res.status(400).json({ error: 'No valid reviews provided' });
  }

  try {
    const ids = valid.map((r) => r.cardId);
    const current = await sql`
      select id, ease_factor, interval_days, repetitions
      from saved_words
      where user_id = ${userId} and id in ${sql(ids)}
    `;
    const stateById = new Map(current.map((row) => [row.id, row]));

    const now = new Date();
    const updated = [];

    for (const { cardId, grade } of valid) {
      const state = stateById.get(cardId);
      if (!state) continue; // not this user's card, or deleted — skip silently

      const next = schedule(state, grade, now);
      const [row] = await sql`
        update saved_words set
          ease_factor      = ${next.ease_factor},
          interval_days    = ${next.interval_days},
          repetitions      = ${next.repetitions},
          due_at           = ${next.due_at},
          last_reviewed_at = ${now.toISOString()}
        where id = ${cardId} and user_id = ${userId}
        returning *
      `;
      if (row) updated.push(row);
    }

    res.json(updated);
  } catch (err) {
    console.error('Review batch error:', err.message);
    res.status(500).json({ error: 'Could not save reviews' });
  }
});

router.post('/', async (req, res) => {
  const { userId, word, language, meaning, explanation, examples, pos } = req.body;

  if (!userId || !word || !language) {
    return res.status(400).json({ error: 'userId, word, and language are required' });
  }

  try {
    const [row] = await sql`
      insert into saved_words (user_id, word, language, meaning, explanation, examples, pos)
      values (${userId}, ${word}, ${language}, ${meaning}, ${explanation}, ${sql.json(examples ?? [])}, ${pos ?? null})
      on conflict (user_id, word, language) do update
        set meaning = excluded.meaning,
            explanation = excluded.explanation,
            examples = excluded.examples,
            pos = excluded.pos
      returning *
    `;
    res.status(201).json(row);

    // Classify in background — does not block the response
    classifyWord(word, pos ?? '', meaning ?? '', language).then(async (category) => {
      await sql`update saved_words set category = ${category} where id = ${row.id}`;
    });
  } catch (err) {
    console.error('Save word error:', err.message);
    res.status(500).json({ error: 'Could not save word' });
  }
});

router.delete('/:id', async (req, res) => {
  const { userId } = req.body;

  try {
    await sql`
      delete from saved_words
      where id = ${req.params.id} and user_id = ${userId}
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete word error:', err.message);
    res.status(500).json({ error: 'Could not delete word' });
  }
});

export default router;
