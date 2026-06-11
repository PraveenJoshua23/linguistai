import { Router } from 'express';
import { YoutubeTranscript } from 'youtube-transcript';
import Groq from 'groq-sdk';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractVideoId(input) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function groupIntoSentences(transcript) {
  const sentences = [];
  let buffer = '';
  let startTime = 0;
  let lastOffset = 0;
  let lastDuration = 0;

  for (const item of transcript) {
    if (!buffer) startTime = item.offset / 1000;
    buffer += (buffer ? ' ' : '') + item.text.replace(/\n/g, ' ').trim();
    lastOffset = item.offset / 1000;
    lastDuration = item.duration / 1000;

    const wordCount = buffer.split(' ').length;
    const endsNaturally = /[.!?]$/.test(buffer.trim());

    if (endsNaturally || wordCount >= 12) {
      sentences.push({
        text: buffer.trim(),
        startTime: Math.round(startTime),
        duration: Math.round((lastOffset + lastDuration) - startTime),
        originalText: null,
      });
      buffer = '';
    }
  }

  if (buffer.trim()) {
    sentences.push({
      text: buffer.trim(),
      startTime: Math.round(startTime),
      duration: Math.round((lastOffset + lastDuration) - startTime),
      originalText: null,
    });
  }

  return sentences;
}

// Align original-language chunks to grouped sentences by timestamp overlap
function alignOriginal(sentences, origChunks) {
  return sentences.map(sentence => {
    const endTime = sentence.startTime + sentence.duration;
    const matching = origChunks
      .filter(c => {
        const cStart = c.offset / 1000;
        const cEnd = cStart + (c.duration / 1000);
        return cStart < endTime + 0.5 && cEnd > sentence.startTime - 0.5;
      })
      .map(c => c.text.replace(/\n/g, ' ').trim())
      .join(' ')
      .trim();
    return { ...sentence, originalText: matching || null };
  });
}

// GET /api/transcript?url=...&lang=en&origLang=ko
router.get('/', async (req, res) => {
  const { url, lang = 'en', origLang } = req.query;

  if (!url) return res.status(400).json({ error: 'url is required' });

  const videoId = extractVideoId(url);
  if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL or video ID' });

  try {
    const [raw, origRaw, oEmbed] = await Promise.allSettled([
      YoutubeTranscript.fetchTranscript(videoId, { lang }),
      origLang && origLang !== lang
        ? YoutubeTranscript.fetchTranscript(videoId, { lang: origLang })
        : Promise.resolve(null),
      fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`),
    ]);

    if (raw.status === 'rejected') throw new Error(raw.reason?.message ?? 'Transcript fetch failed');

    let sentences = groupIntoSentences(raw.value);

    if (origRaw.status === 'fulfilled' && origRaw.value) {
      sentences = alignOriginal(sentences, origRaw.value);
    }

    let title = 'YouTube Video';
    if (oEmbed.status === 'fulfilled' && oEmbed.value.ok) {
      const data = await oEmbed.value.json();
      title = data.title;
    }

    res.json({ videoId, title, lang, origLang: origLang ?? null, sentences });
  } catch (err) {
    console.error('Transcript error:', err.message);
    if (err.message?.includes('disabled') || err.message?.includes('Could not get')) {
      return res.status(404).json({ error: 'This video does not have captions in the selected language.' });
    }
    res.status(500).json({ error: 'Could not fetch transcript. The video may not have captions.' });
  }
});

// POST /api/transcript/translate-sentence
router.post('/translate-sentence', async (req, res) => {
  const { text, targetLang = 'Spanish', context = 'General' } = req.body;

  if (!text) return res.status(400).json({ error: 'text is required' });

  const SYSTEM_PROMPT = `You are a precise translation engine. Return ONLY a valid JSON object with no markdown, no code fences, no extra text:
{
  "translation": string,
  "transliteration": string | null,
  "accuracy": "high" | "medium" | "low",
  "breakdown": [{ "word": string, "pos": string, "meaning": string, "explanation": string, "examples": string[] }]
}
transliteration: romanised pronunciation of the translation only. null if target language uses Latin alphabet.
pos values: NOUN, VERB, ADJ, ADV, PRON, PREP, CONJ, DET, INTJ.`;

  try {
    const chat = await groq.chat.completions.create({
      model: 'qwen/qwen3-32b',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Translate from English to ${targetLang}. Context: ${context}\nText: "${text}"`,
        },
      ],
    });

    const result = JSON.parse(chat.choices[0].message.content);
    res.json(result);
  } catch (err) {
    console.error('Sentence translate error:', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;
