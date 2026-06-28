import FIREBASE_CONFIG from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore, collection, query, where, getDocs, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { OFFENSE_POSITIONS, DEFENSE_POSITIONS } from './modules/utils.js';

const app = initializeApp(FIREBASE_CONFIG);
const db  = getFirestore(app);

const STORAGE_KEY = 'football_hub_player_pos';
let playerPosition = localStorage.getItem(STORAGE_KEY);

// ─── Init ─────────────────────────────────────────────────────────────────
if (!playerPosition) {
  showPositionPicker();
} else {
  showPlayerApp(playerPosition);
}

// ─── Position Picker ──────────────────────────────────────────────────────
function showPositionPicker() {
  document.getElementById('position-picker').classList.remove('hidden');
  const grid = document.getElementById('picker-grid');

  const sections = [
    { label: 'Offense', positions: OFFENSE_POSITIONS },
    { label: 'Defense', positions: DEFENSE_POSITIONS },
  ];

  grid.innerHTML = sections.map(s => `
    <div class="picker-section">
      <div class="picker-section-label">${s.label}</div>
      <div class="picker-pos-row">
        ${s.positions.map(p => `<button class="pos-chip" data-pos="${p}">${p}</button>`).join('')}
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.pos-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const pos = btn.dataset.pos;
      localStorage.setItem(STORAGE_KEY, pos);
      document.getElementById('position-picker').classList.add('hidden');
      showPlayerApp(pos);
    });
  });
}

// ─── Player App ───────────────────────────────────────────────────────────
function showPlayerApp(position) {
  playerPosition = position;
  document.getElementById('player-app').classList.remove('hidden');
  document.getElementById('player-pos-badge').textContent = position;

  document.getElementById('change-pos-btn').addEventListener('click', () => {
    document.getElementById('player-app').classList.add('hidden');
    document.getElementById('position-picker').classList.remove('hidden');
  });

  document.querySelectorAll('.player-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.player-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.tab === 'playbook') loadPlaybook(position);
      else loadGamePlan(position);
    });
  });

  loadPlaybook(position);
}

// ─── Playbook ─────────────────────────────────────────────────────────────
async function loadPlaybook(position) {
  const main = document.getElementById('player-main');
  main.innerHTML = `<div class="loading-line"></div>`;

  const snap = await getDocs(
    query(collection(db, 'plays'), where('status', '==', 'published'), orderBy('name'))
  );

  if (snap.empty) {
    main.innerHTML = `<div class="player-empty">No plays published yet. Check back soon.</div>`;
    return;
  }

  const plays = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const offense = plays.filter(p => p.side === 'offense');
  const defense = plays.filter(p => p.side === 'defense');

  main.innerHTML = `
    <div class="playbook-tabs">
      <button class="pb-tab active" data-side="offense">Offense (${offense.length})</button>
      <button class="pb-tab" data-side="defense">Defense (${defense.length})</button>
    </div>
    <div id="play-list" class="play-list"></div>
  `;

  function renderPlays(side) {
    const list = side === 'offense' ? offense : defense;
    const el = document.getElementById('play-list');
    if (list.length === 0) {
      el.innerHTML = `<div class="player-empty">No ${side} plays published yet.</div>`;
      return;
    }
    el.innerHTML = list.map(p => renderPlayCard(p, position)).join('');
  }

  renderPlays('offense');

  main.querySelectorAll('.pb-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      main.querySelectorAll('.pb-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPlays(btn.dataset.side);
    });
  });
}

function renderPlayCard(play, position) {
  const myNote = getNoteForPosition(play, position);
  return `
    <div class="play-card">
      <div class="play-card__header">
        <span class="play-card__name">${play.name || 'Untitled'}</span>
        <span class="play-card__formation">${play.formation || ''}</span>
      </div>
      ${play.tags?.length ? `<div class="play-card__tags">${play.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
      <div class="play-card__diagram play-card__diagram--placeholder">
        <span>Diagram coming in Phase 2</span>
      </div>
      ${myNote ? `
        <div class="play-card__my-note">
          <strong>Your Assignment (${position}):</strong>
          <p>${myNote}</p>
        </div>
      ` : ''}
    </div>
  `;
}

function getNoteForPosition(play, position) {
  if (!play.playerNotes) return null;
  // Match exact position or group (e.g. WR, QB, OL)
  const groupMap = {
    QB: 'QB', RB: 'RB', FB: 'RB',
    WR: 'WR', TE: 'TE',
    LT: 'OL', LG: 'OL', C: 'OL', RG: 'OL', RT: 'OL',
    DE: 'DL', DT: 'DL', NT: 'DL',
    MLB: 'LB', OLB: 'LB', ILB: 'LB',
    CB: 'DB', FS: 'DB', SS: 'DB', NB: 'DB',
  };
  const group = groupMap[position];
  return play.playerNotes[position] || play.playerNotes[group] || null;
}

// ─── Game Plan ────────────────────────────────────────────────────────────
async function loadGamePlan(position) {
  const main = document.getElementById('player-main');
  main.innerHTML = `<div class="loading-line"></div>`;

  const snap = await getDocs(
    query(collection(db, 'game_plans'), where('current', '==', true), limit(1))
  );

  if (snap.empty) {
    main.innerHTML = `<div class="player-empty">No active game plan yet.</div>`;
    return;
  }

  const gp = snap.docs[0].data();
  main.innerHTML = `
    <div class="gp-player-header">
      <h2 class="gp-player-name">${gp.name || 'This Week\'s Game Plan'}</h2>
      ${gp.opponent ? `<div class="gp-player-vs">vs. ${gp.opponent}</div>` : ''}
      ${gp.playerNotes ? `<div class="gp-player-notes">${gp.playerNotes}</div>` : ''}
    </div>
    <div class="player-empty">Full game plan display coming in Phase 3.</div>
  `;
}
