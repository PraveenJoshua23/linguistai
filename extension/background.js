importScripts('supabase.js');

const API_BASE = 'http://localhost:3000';

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', ar: 'Arabic', ru: 'Russian', hi: 'Hindi',
  nl: 'Dutch', sv: 'Swedish', tr: 'Turkish'
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'linguistai-translate',
    title: 'Translate & Add to LinguistAI',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'linguistai-translate' && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'CONTEXT_MENU_TRANSLATE',
      text: info.selectionText
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TRANSLATE') {
    getSettings()
      .then(s => translateText(message.text, s.sourceLang, s.targetLang))
      .then(result => sendResponse({ success: true, ...result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'SAVE_WORD') {
    getSettings()
      .then(s => saveWord(message.text, s))
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'SAVE_PHRASE') {
    getSettings()
      .then(s => savePhrase(message.text, message.sourceUrl, s))
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'GET_RECENT') {
    chrome.storage.local.get('recent')
      .then(({ recent = [] }) => sendResponse({ success: true, recent }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'CLEAR_RECENT') {
    chrome.storage.local.set({ recent: [] })
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function getSettings() {
  const data = await chrome.storage.local.get(['targetLang', 'sourceLang']);
  return {
    targetLang: data.targetLang || 'en',
    sourceLang: data.sourceLang || 'es'
  };
}

// Returns a valid Supabase access token, refreshing it when it is about to expire.
async function getAccessToken() {
  const { session } = await chrome.storage.local.get('session');
  if (!session) throw new Error('Not signed in. Sign in from the LinguistAI extension popup.');
  if (Date.now() / 1000 < session.expires_at - 60) return session.access_token;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    await chrome.storage.local.remove('session');
    throw new Error('Session expired. Sign in again from the LinguistAI extension popup.');
  }
  await chrome.storage.local.set({ session: toSession(data) });
  return data.access_token;
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getAccessToken()}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  return res.json();
}

async function translateText(text, sourceLang, targetLang) {
  const data = await apiPost('/api/translate', {
    text,
    sourceLang: LANG_NAMES[sourceLang] ?? sourceLang,
    targetLang: LANG_NAMES[targetLang] ?? targetLang
  });
  return {
    original: text,
    sourceLang,
    targetLang,
    translation: data.translation,
    transliteration: data.transliteration ?? null,
    accuracy: data.accuracy,
    breakdown: data.breakdown ?? []
  };
}

async function saveWord(text, { sourceLang, targetLang }) {
  const result = await translateText(text, sourceLang, targetLang);
  const info = result.breakdown[0] ?? {};

  await apiPost('/api/saved-words', {
    word: text,
    language: LANG_NAMES[sourceLang] ?? sourceLang,
    meaning: info.meaning ?? result.translation,
    explanation: info.explanation ?? null,
    examples: info.examples ?? [],
    pos: info.pos ?? null
  });

  await pushRecent({ type: 'word', front: text, back: result.translation, sourceLang, targetLang });
}

async function savePhrase(text, sourceUrl, { sourceLang, targetLang }) {
  const result = await translateText(text, sourceLang, targetLang);

  await apiPost('/api/saved-phrases', {
    phrase: text,
    language: LANG_NAMES[sourceLang] ?? sourceLang,
    translation: result.translation,
    transliteration: result.transliteration,
    source: sourceUrl ?? null
  });

  await pushRecent({ type: 'phrase', front: text, back: result.translation, sourceLang, targetLang });
}

async function pushRecent(item) {
  const { recent = [] } = await chrome.storage.local.get('recent');
  recent.unshift({ ...item, savedAt: new Date().toISOString() });
  await chrome.storage.local.set({ recent: recent.slice(0, 50) });
}
