export function validateTranslateRequest(req, res, next) {
  const { text, sourceLang, targetLang } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (text.length > 2000) {
    return res.status(400).json({ error: 'text must be under 2000 characters' });
  }
  if (!sourceLang || !targetLang) {
    return res.status(400).json({ error: 'sourceLang and targetLang are required' });
  }

  next();
}
