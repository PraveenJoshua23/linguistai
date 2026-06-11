let lastSelection = '';
let lastSelectionRect = null;

function isWord(text) {
  return text.trim().split(/\s+/).length === 1;
}

// ── DOM helpers ──────────────────────────────────────────────────────────────

function getActionsEl() {
  let el = document.getElementById('linguistai-actions');
  if (!el) {
    el = document.createElement('div');
    el.id = 'linguistai-actions';

    const translateBtn = document.createElement('button');
    translateBtn.className = 'lai-btn';
    translateBtn.id = 'lai-translate-btn';
    translateBtn.textContent = 'Translate';
    translateBtn.addEventListener('click', handleTranslate);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'lai-btn lai-btn-save';
    saveBtn.id = 'lai-save-btn';
    saveBtn.addEventListener('click', handleQuickSave);

    el.appendChild(translateBtn);
    el.appendChild(saveBtn);
    document.body.appendChild(el);
  }
  return el;
}

function getCard() {
  let el = document.getElementById('linguistai-card');
  if (!el) {
    el = document.createElement('div');
    el.id = 'linguistai-card';
    document.body.appendChild(el);
  }
  return el;
}

// ── Selection listener ───────────────────────────────────────────────────────

document.addEventListener('mouseup', (e) => {
  if (e.target.closest('#linguistai-actions') || e.target.closest('#linguistai-card')) return;

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 2) { hideUI(); return; }

    lastSelection = text;
    lastSelectionRect = selection.getRangeAt(0).getBoundingClientRect();

    const word = isWord(text);
    const actions = getActionsEl();
    const translateBtn = document.getElementById('lai-translate-btn');
    const saveBtn = document.getElementById('lai-save-btn');

    translateBtn.textContent = 'Translate';
    translateBtn.disabled = false;
    saveBtn.textContent = word ? 'Save Word' : 'Save';
    saveBtn.disabled = false;

    positionActions(actions, lastSelectionRect);
    actions.classList.add('visible');
    getCard().classList.remove('visible');
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  if (!e.target.closest('#linguistai-actions') && !e.target.closest('#linguistai-card')) {
    hideUI();
  }
});

function positionActions(el, rect) {
  el.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
  el.style.top = `${rect.top + window.scrollY - 44}px`;
}

function hideUI() {
  document.getElementById('linguistai-actions')?.classList.remove('visible');
  document.getElementById('linguistai-card')?.classList.remove('visible');
}

// ── Safe message helper ──────────────────────────────────────────────────────
// chrome.runtime.sendMessage throws synchronously when the extension is
// reloaded but the content script is still running on the old page.
// Wrapping every call here prevents unhandled errors and surfaces a clear message.

function sendMsg(message, callback) {
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        const msg = chrome.runtime.lastError.message ?? 'Extension disconnected';
        const isInvalidated = msg.toLowerCase().includes('context') || msg.toLowerCase().includes('invalidated');
        callback?.({
          success: false,
          error: isInvalidated
            ? 'Extension was reloaded — refresh this page to reconnect.'
            : msg
        });
        return;
      }
      callback?.(response);
    });
  } catch (err) {
    callback?.({
      success: false,
      error: 'Extension was reloaded — refresh this page to reconnect.'
    });
  }
}

// ── Translate (show card) ────────────────────────────────────────────────────

function handleTranslate() {
  const translateBtn = document.getElementById('lai-translate-btn');
  translateBtn.disabled = true;
  translateBtn.textContent = 'Translating…';

  sendMsg({ type: 'TRANSLATE', text: lastSelection }, (res) => {
    document.getElementById('linguistai-actions')?.classList.remove('visible');
    if (res?.success) {
      showCard(res);
    } else {
      translateBtn.textContent = 'Error';
      translateBtn.classList.add('error');
      document.getElementById('linguistai-actions').classList.add('visible');

      // Show the error message in a card if it's about reconnecting
      if (res?.error) showErrorCard(res.error);

      setTimeout(() => {
        translateBtn.classList.remove('error');
        translateBtn.textContent = 'Translate';
        translateBtn.disabled = false;
      }, 3000);
    }
  });
}

function showCard(result) {
  const card = getCard();
  const word = isWord(result.original);
  const info = result.breakdown?.[0];

  const posLabel = info?.pos ? `<span class="lai-pos">${escapeHtml(info.pos)}</span>` : '';
  const meaning = word && info?.meaning
    ? `<p class="lai-meaning">${escapeHtml(info.meaning)}</p>`
    : '';
  const transliteration = result.transliteration
    ? `<p class="lai-translit">${escapeHtml(result.transliteration)}</p>`
    : '';
  const saveLabel = word ? 'Save Word' : 'Save';
  const saveType = word ? 'SAVE_WORD' : 'SAVE_PHRASE';

  card.innerHTML = `
    <div class="lai-header">
      <span class="lai-langs">${escapeHtml(result.sourceLang.toUpperCase())} → ${escapeHtml(result.targetLang.toUpperCase())}</span>
      <button class="lai-close">✕</button>
    </div>
    <p class="lai-original">${escapeHtml(result.original)}</p>
    <div class="lai-translation-row">
      <p class="lai-translation">${escapeHtml(result.translation)}</p>${posLabel}
    </div>
    ${meaning}
    ${transliteration}
    <button class="lai-save-action">${saveLabel}</button>
    <p class="lai-msg"></p>
  `;

  // Position below the selection
  const rect = lastSelectionRect;
  const cardWidth = 300;
  let left = rect.left + window.scrollX + rect.width / 2 - cardWidth / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - cardWidth - 8));
  card.style.left = `${left}px`;
  card.style.top = `${rect.bottom + window.scrollY + 8}px`;
  card.classList.add('visible');

  card.querySelector('.lai-close').addEventListener('click', () => card.classList.remove('visible'));
  card.querySelector('.lai-save-action').addEventListener('click', () => {
    saveFromCard(result, saveType, card);
  });
}

function saveFromCard(result, type, card) {
  const btn = card.querySelector('.lai-save-action');
  const msg = card.querySelector('.lai-msg');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const message = type === 'SAVE_WORD'
    ? { type: 'SAVE_WORD', text: result.original }
    : { type: 'SAVE_PHRASE', text: result.original, sourceUrl: location.href };

  sendMsg(message, (res) => {
    if (res?.success) {
      btn.textContent = '✓ Saved!';
      msg.textContent = 'Added to LinguistAI';
      msg.className = 'lai-msg success';
      setTimeout(() => card.classList.remove('visible'), 1500);
    } else {
      btn.disabled = false;
      btn.textContent = type === 'SAVE_WORD' ? 'Save Word' : 'Save';
      msg.textContent = res?.error || 'Save failed';
      msg.className = 'lai-msg error';
    }
  });
}

// ── Quick save (no card, one click) ─────────────────────────────────────────

function handleQuickSave() {
  const saveBtn = document.getElementById('lai-save-btn');
  const translateBtn = document.getElementById('lai-translate-btn');
  saveBtn.disabled = true;
  translateBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  const word = isWord(lastSelection);
  const message = word
    ? { type: 'SAVE_WORD', text: lastSelection }
    : { type: 'SAVE_PHRASE', text: lastSelection, sourceUrl: location.href };

  sendMsg(message, (res) => {
    if (res?.success) {
      saveBtn.textContent = '✓ Saved!';
      setTimeout(() => hideUI(), 1200);
    } else {
      saveBtn.textContent = word ? 'Save Word' : 'Save';
      saveBtn.disabled = false;
      translateBtn.disabled = false;
      saveBtn.classList.add('error');
      if (res?.error) showErrorCard(res.error);
      setTimeout(() => saveBtn.classList.remove('error'), 2000);
    }
  });
}

// ── Context menu trigger ─────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CONTEXT_MENU_TRANSLATE') {
    lastSelection = message.text;
    lastSelectionRect = {
      left: window.innerWidth / 2, top: 80,
      right: window.innerWidth / 2, bottom: 88,
      width: 0, height: 8
    };
    sendMsg({ type: 'TRANSLATE', text: message.text }, (res) => {
      if (res?.success) showCard(res);
    });
  }
});

function showErrorCard(message) {
  const card = getCard();
  const rect = lastSelectionRect ?? { left: window.innerWidth / 2, bottom: 100, width: 0 };
  const cardWidth = 300;
  let left = rect.left + window.scrollX + rect.width / 2 - cardWidth / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - cardWidth - 8));
  card.style.left = `${left}px`;
  card.style.top = `${(rect.bottom ?? 100) + window.scrollY + 8}px`;
  card.innerHTML = `
    <div class="lai-header">
      <span class="lai-langs">LinguistAI</span>
      <button class="lai-close">✕</button>
    </div>
    <p class="lai-msg error" style="padding:10px 12px 12px">${escapeHtml(message)}</p>
  `;
  card.classList.add('visible');
  card.querySelector('.lai-close').addEventListener('click', () => card.classList.remove('visible'));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
