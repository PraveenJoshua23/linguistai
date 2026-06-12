import { Router } from 'express';
import sql from '../db.js';

const router = Router();

// List a user's custom decks (newest first). Card counts are computed
// client-side from the already-loaded saved words.
router.get('/:userId', async (req, res) => {
  try {
    const rows = await sql`
      select * from decks
      where user_id = ${req.params.userId}
      order by created_at desc
    `;
    res.json(rows);
  } catch (err) {
    console.error('Decks fetch error:', err.message);
    res.status(500).json({ error: 'Could not fetch decks' });
  }
});

router.post('/', async (req, res) => {
  const { userId, name } = req.body;

  if (!userId || !name || !String(name).trim()) {
    return res.status(400).json({ error: 'userId and name are required' });
  }

  try {
    const [row] = await sql`
      insert into decks (user_id, name)
      values (${userId}, ${String(name).trim()})
      returning *
    `;
    res.status(201).json(row);
  } catch (err) {
    console.error('Create deck error:', err.message);
    res.status(500).json({ error: 'Could not create deck' });
  }
});

// Deleting a deck un-assigns its cards via the deck_id FK (on delete set null).
router.delete('/:id', async (req, res) => {
  const { userId } = req.body;

  try {
    await sql`
      delete from decks
      where id = ${req.params.id} and user_id = ${userId}
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete deck error:', err.message);
    res.status(500).json({ error: 'Could not delete deck' });
  }
});

export default router;
