import { Router } from 'express';
import sql from '../db.js';

const router = Router();

const DEFAULTS = {
  source_lang: 'English',
  target_lang: 'Spanish',
  default_context: 'General',
  default_tone: 'Formal',
  sidebar_collapsed: false,
  show_breakdown: true,
  show_transliteration: true,
  flashcard_shuffle: false,
  flashcard_auto_advance: true,
  display_name: '',
};

router.get('/:userId', async (req, res) => {
  try {
    const [row] = await sql`
      select * from user_preferences where user_id = ${req.params.userId}
    `;
    res.json(row ?? { user_id: req.params.userId, ...DEFAULTS });
  } catch (err) {
    console.error('Preferences fetch error:', err.message);
    res.status(500).json({ error: 'Could not fetch preferences' });
  }
});

router.put('/:userId', async (req, res) => {
  const {
    source_lang, target_lang, default_context, default_tone,
    sidebar_collapsed, show_breakdown, show_transliteration,
    flashcard_shuffle, flashcard_auto_advance, display_name,
  } = req.body;

  try {
    const [row] = await sql`
      insert into user_preferences (
        user_id, source_lang, target_lang, default_context, default_tone,
        sidebar_collapsed, show_breakdown, show_transliteration,
        flashcard_shuffle, flashcard_auto_advance, display_name
      ) values (
        ${req.params.userId}, ${source_lang}, ${target_lang}, ${default_context}, ${default_tone},
        ${sidebar_collapsed}, ${show_breakdown}, ${show_transliteration},
        ${flashcard_shuffle}, ${flashcard_auto_advance}, ${display_name}
      )
      on conflict (user_id) do update set
        source_lang           = excluded.source_lang,
        target_lang           = excluded.target_lang,
        default_context       = excluded.default_context,
        default_tone          = excluded.default_tone,
        sidebar_collapsed     = excluded.sidebar_collapsed,
        show_breakdown        = excluded.show_breakdown,
        show_transliteration  = excluded.show_transliteration,
        flashcard_shuffle     = excluded.flashcard_shuffle,
        flashcard_auto_advance = excluded.flashcard_auto_advance,
        display_name          = excluded.display_name,
        updated_at            = now()
      returning *
    `;
    res.json(row);
  } catch (err) {
    console.error('Preferences save error:', err.message);
    res.status(500).json({ error: 'Could not save preferences' });
  }
});

export default router;
