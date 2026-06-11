import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import translateRouter from './routes/translate.js';
import historyRouter from './routes/history.js';
import savedWordsRouter from './routes/savedWords.js';
import savedPhrasesRouter from './routes/savedPhrases.js';
import preferencesRouter from './routes/preferences.js';
import transcriptRouter from './routes/transcript.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'http://localhost:4200' || origin.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  }
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/translate', translateRouter);
app.use('/api/history', historyRouter);
app.use('/api/saved-words', savedWordsRouter);
app.use('/api/saved-phrases', savedPhrasesRouter);
app.use('/api/preferences', preferencesRouter);
app.use('/api/transcript', transcriptRouter);

app.listen(PORT, () => {
  console.log(`LinguistAI server running on http://localhost:${PORT}`);
});
