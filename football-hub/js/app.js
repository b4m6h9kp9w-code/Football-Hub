import FIREBASE_CONFIG from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

import { renderDashboard } from './views/dashboard.js';
import { renderRoster } from './views/roster.js';
import { renderFormations } from './views/formations.js';
import { renderPlayDesigner } from './views/play-designer.js';
import { renderPlayLibrary } from './views/play-library.js';
import { renderGamePlans } from './views/game-plans.js';
import { renderOpponents } from './views/opponents.js';
import { renderSettings } from './views/settings.js';

// ─── Initialize Firebase ───────────────────────────────────────────────────
const firebaseApp = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// ─── App State ────────────────────────────────────────────────────────────
export const AppState = {
  currentUser: null,
  userRole: null,   // 'head_coach' | 'assistant'
  currentView: 'dashboard',
};

// ─── Route Map ────────────────────────────────────────────────────────────
const VIEWS = {
  dashboard:     { label: 'Dashboard',    icon: '⬡',  render: renderDashboard },
  roster:        { label: 'Roster',       icon: '👥', render: renderRoster },
  formations:    { label: 'Formations',   icon: '⬛', render: renderFormations },
  'play-designer':{ label: 'Play Designer', icon: '✏️', render: renderPlayDesigner },
  'play-library':{ label: 'Play Library', icon: '📋', render: renderPlayLibrary },
  'game-plans':  { label: 'Game Plans',   icon: '📅', render: renderGamePlans },
  opponents:     { label: 'Opponents',    icon: '🎯', render: renderOpponents },
  settings:      { label: 'Settings',     icon: '⚙️', render: renderSettings },
};

// ─── Auth Gate ────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Load role from Firestore
    const snap = await getDoc(doc(db, 'coaches', user.uid));
    const data = snap.exists() ? snap.data() : {};
    AppState.currentUser = user;
    AppState.userRole = data.role || 'assistant';

    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    buildNav();
    navigate(AppState.currentView);
    updateUserBadge(data.name || user.email, AppState.userRole);
  } else {
    AppState.currentUser = null;
    AppState.userRole = null;
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
  }
});

// ─── Navigation ───────────────────────────────────────────────────────────
function buildNav() {
  const nav = document.getElementById('main-nav');
  nav.innerHTML = '';
  Object.entries(VIEWS).forEach(([key, view]) => {
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.dataset.view = key;
    btn.innerHTML = `<span class="nav-icon">${view.icon}</span><span class="nav-label">${view.label}</span>`;
    btn.addEventListener('click', () => navigate(key));
    nav.appendChild(btn);
  });
}

export function navigate(viewKey) {
  if (!VIEWS[viewKey]) return;
  AppState.currentView = viewKey;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewKey);
  });

  // Update page title
  document.getElementById('page-title').textContent = VIEWS[viewKey].label;

  // Render view
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  VIEWS[viewKey].render(main, { db, auth, AppState });

  // Close sidebar on mobile after navigation
  document.getElementById('sidebar').classList.remove('open');
}

function updateUserBadge(name, role) {
  const badge = document.getElementById('user-badge');
  const roleLabel = role === 'head_coach' ? 'Head Coach' : 'Assistant';
  badge.innerHTML = `
    <div class="user-info">
      <span class="user-name">${name}</span>
      <span class="user-role">${roleLabel}</span>
    </div>
  `;
}

// ─── Login Form ───────────────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btn = e.target.querySelector('button[type="submit"]');

  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    errEl.textContent = friendlyAuthError(err.code);
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

function friendlyAuthError(code) {
  const map = {
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/invalid-credential': 'Invalid email or password.',
  };
  return map[code] || 'Sign-in failed. Please try again.';
}
