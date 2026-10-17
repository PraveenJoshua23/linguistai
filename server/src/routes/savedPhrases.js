import { Router } from 'express';
import sql from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const rows = await sql`
      select * from saved_phrases
      where user_id = ${req.userId}
      order by created_at desc
    `;
    res.json(rows);
  } catch (err) {
    console.error('Saved phrases fetch error:', err.message);
    res.status(500).json({ error: 'Could not fetch saved phrases' });
  }
});

router.post('/', async (req, res) => {
  const { phrase, language, translation, transliteration, source, videoId, videoTitle } = req.body;
  const { userId } = req;

  if (!phrase || !language) {
    return res.status(400).json({ error: 'phrase and language are required' });
  }

  try {
    const [row] = await sql`
      insert into saved_phrases
        (user_id, phrase, language, translation, transliteration, source, video_id, video_title)
      values
        (${userId}, ${phrase}, ${language}, ${translation ?? null}, ${transliteration ?? null},
         ${source ?? null}, ${videoId ?? null}, ${videoTitle ?? null})
      on conflict (user_id, phrase, language) do update
        set translation     = excluded.translation,
            transliteration = excluded.transliteration,
            source          = excluded.source,
            video_id        = excluded.video_id,
            video_title     = excluded.video_title
      returning *
    `;
    res.status(201).json(row);
  } catch (err) {
    console.error('Save phrase error:', err.message);
    res.status(500).json({ error: 'Could not save phrase' });
  }
});

router.delete('/:id', async (req, res) => {
  const { userId } = req;
  try {
    await sql`
      delete from saved_phrases
      where id = ${req.params.id} and user_id = ${userId}
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete phrase error:', err.message);
    res.status(500).json({ error: 'Could not delete phrase' });
  }
});

export default router;
