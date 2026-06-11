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
  const data = await chrome.storage.local.get(['targetLang', 'sourceLang', 'userId']);
  return {
    targetLang: data.targetLang || 'en',
    sourceLang: data.sourceLang || 'es',
    userId: data.userId || null
  };
}

async function translateText(text, sourceLang, targetLang) {
  const res = await fetch(`${API_BASE}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      sourceLang: LANG_NAMES[sourceLang] ?? sourceLang,
      targetLang: LANG_NAMES[targetLang] ?? targetLang
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }

  const data = await res.json();
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

async function saveWord(text, { sourceLang, targetLang, userId }) {
  if (!userId) throw new Error('User ID not set — add it in the extension popup settings.');

  const result = await translateText(text, sourceLang, targetLang);
  const info = result.breakdown[0] ?? {};

  const res = await fetch(`${API_BASE}/api/saved-words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      word: text,
      language: LANG_NAMES[sourceLang] ?? sourceLang,
      meaning: info.meaning ?? result.translation,
      explanation: info.explanation ?? null,
      examples: info.examples ?? [],
      pos: info.pos ?? null
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }

  await pushRecent({ type: 'word', front: text, back: result.translation, sourceLang, targetLang });
}

async function savePhrase(text, sourceUrl, { sourceLang, targetLang, userId }) {
  if (!userId) throw new Error('User ID not set — add it in the extension popup settings.');

  const result = await translateText(text, sourceLang, targetLang);

  const res = await fetch(`${API_BASE}/api/saved-phrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      phrase: text,
      language: LANG_NAMES[sourceLang] ?? sourceLang,
      translation: result.translation,
      transliteration: result.transliteration,
      source: sourceUrl ?? null
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }

  await pushRecent({ type: 'phrase', front: text, back: result.translation, sourceLang, targetLang });
}

async function pushRecent(item) {
  const { recent = [] } = await chrome.storage.local.get('recent');
  recent.unshift({ ...item, savedAt: new Date().toISOString() });
  await chrome.storage.local.set({ recent: recent.slice(0, 50) });
}
