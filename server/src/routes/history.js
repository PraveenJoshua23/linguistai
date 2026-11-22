import { Router } from 'express';
import sql from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { userId } = req;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (parseInt(req.query.page) || 0) * limit;
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const lang = typeof req.query.lang === 'string' ? req.query.lang : '';

  try {
    const rows = await sql`
      select id, source_text, source_lang, target_lang, result_json, created_at
      from translations
      where user_id = ${userId}
        ${q ? sql`and (source_text ilike ${'%' + q + '%'} or result_json->>'translation' ilike ${'%' + q + '%'})` : sql``}
        ${lang ? sql`and (source_lang = ${lang} or target_lang = ${lang})` : sql``}
      order by created_at desc
      limit ${limit} offset ${offset}
    `;
    res.json(rows);
  } catch (err) {
    console.error('History fetch error:', err.message);
    res.status(500).json({ error: 'Could not fetch history' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req;

  try {
    await sql`
      delete from translations
      where id = ${id} and user_id = ${userId}
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('History delete error:', err.message);
    res.status(500).json({ error: 'Could not delete entry' });
  }
});

export default router;
