const SUPABASE_URL = 'https://jkhzzojucazfgepqnevi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraHp6b2p1Y2F6ZmdlcHFuZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDM4NzUsImV4cCI6MjA5NjU3OTg3NX0.wpI-5_qIuuwXsZUDMaJOY5GhVs3U2Q4-FM83DDhdiMA';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
];

// ── Elements ─────────────────────────────────────────────────────────────────

const loginView   = document.getElementById('login-view');
const mainView    = document.getElementById('main-view');
const emailEl     = document.getElementById('email');
const passwordEl  = document.getElementById('password');
const loginBtn    = document.getElementById('login-btn');
const loginError  = document.getElementById('login-error');
const userEmailEl = document.getElementById('user-email');
const signoutBtn  = document.getElementById('signout-btn');
const sourceLangEl = document.getElementById('source-lang');
const targetLangEl = document.getElementById('target-lang');
const savedCountEl = document.getElementById('saved-count');
const recentListEl = document.getElementById('recent-list');
const clearBtn    = document.getElementById('clear-btn');

// ── Boot ─────────────────────────────────────────────────────────────────────

populateSelects();

chrome.storage.local.get(['userId', 'userEmail', 'sourceLang', 'targetLang'], (data) => {
  if (data.userId) {
    showMain(data.userEmail, data);
  } else {
    showLogin();
  }
});

// ── Auth ──────────────────────────────────────────────────────────────────────

loginBtn.addEventListener('click', handleLogin);
[emailEl, passwordEl].forEach(el =>
  el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); })
);

async function handleLogin() {
  const email = emailEl.value.trim();
  const password = passwordEl.value;
  if (!email || !password) { showError('Enter your email and password.'); return; }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';
  loginError.textContent = '';

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Login failed');

    const userId = data.user.id;
    const userEmail = data.user.email;
    await chrome.storage.local.set({ userId, userEmail });
    showMain(userEmail, {});
  } catch (err) {
    showError(err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

signoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(['userId', 'userEmail']);
  await chrome.runtime.sendMessage({ type: 'CLEAR_RECENT' });
  passwordEl.value = '';
  showLogin();
});

function showLogin() {
  loginView.classList.remove('hidden');
  mainView.classList.add('hidden');
}

function showMain(email, stored) {
  loginView.classList.add('hidden');
  mainView.classList.remove('hidden');
  userEmailEl.textContent = email ?? '';
  if (stored.sourceLang) sourceLangEl.value = stored.sourceLang;
  if (stored.targetLang) targetLangEl.value = stored.targetLang;
  loadRecent();
}

function showError(msg) {
  loginError.textContent = msg;
}

// ── Settings ──────────────────────────────────────────────────────────────────

function populateSelects() {
  const sourceOptions = LANGUAGES.filter(l => l.code !== 'en');
  const targetOptions = LANGUAGES;

  sourceLangEl.innerHTML = sourceOptions
    .map(l => `<option value="${l.code}">${l.name}</option>`).join('');
  targetLangEl.innerHTML = targetOptions
    .map(l => `<option value="${l.code}">${l.name}</option>`).join('');

  sourceLangEl.value = 'es';
  targetLangEl.value = 'en';
}

sourceLangEl.addEventListener('change', () =>
  chrome.storage.local.set({ sourceLang: sourceLangEl.value })
);
targetLangEl.addEventListener('change', () =>
  chrome.storage.local.set({ targetLang: targetLangEl.value })
);

// ── Recent list ───────────────────────────────────────────────────────────────

clearBtn.addEventListener('click', () => {
  if (!confirm('Clear recent history?')) return;
  chrome.runtime.sendMessage({ type: 'CLEAR_RECENT' }, () => renderRecent([]));
});

function loadRecent() {
  chrome.runtime.sendMessage({ type: 'GET_RECENT' }, res => renderRecent(res?.recent ?? []));
}

function renderRecent(items) {
  savedCountEl.textContent = `${items.length} saved`;

  if (items.length === 0) {
    recentListEl.innerHTML = '<div class="empty-state">Nothing saved yet.<br/>Select text on any page to start.</div>';
    return;
  }

  recentListEl.innerHTML = items.slice(0, 30).map(item => `
    <div class="recent-item">
      <div class="recent-front">${escapeHtml(item.front)}</div>
      <div class="recent-back">${escapeHtml(item.back)}</div>
      <div class="recent-meta">
        <span class="recent-type">${item.type}</span>
        <span>${escapeHtml((item.sourceLang ?? '?').toUpperCase())} → ${escapeHtml((item.targetLang ?? '?').toUpperCase())}</span>
        <span>${timeAgo(item.savedAt)}</span>
      </div>
    </div>
  `).join('');
}

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
