import {
  collection, query, where, getDocs, orderBy, limit, onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { relativeTime, availabilityBadge } from '../modules/utils.js';
import { navigate } from '../app.js';

export function renderDashboard(container, { db, AppState }) {
  container.innerHTML = `
    <div class="dashboard">
      <div class="stat-grid" id="stat-grid">
        <div class="stat-card skeleton"></div>
        <div class="stat-card skeleton"></div>
        <div class="stat-card skeleton"></div>
        <div class="stat-card skeleton"></div>
      </div>

      <div class="dashboard-grid">
        <section class="dashboard-panel" id="panel-players-out">
          <h2 class="panel-title">Players Out / Limited</h2>
          <div class="panel-body" id="players-out-list"><div class="loading-line"></div></div>
        </section>

        <section class="dashboard-panel" id="panel-recent-plays">
          <h2 class="panel-title">Recently Edited Plays</h2>
          <div class="panel-body" id="recent-plays-list"><div class="loading-line"></div></div>
        </section>

        <section class="dashboard-panel" id="panel-game-plan">
          <h2 class="panel-title">Current Game Plan</h2>
          <div class="panel-body" id="current-game-plan"><div class="loading-line"></div></div>
        </section>
      </div>
    </div>
  `;

  loadStats(db, container);
  loadPlayersOut(db, container);
  loadRecentPlays(db, container);
  loadCurrentGamePlan(db, container);
}

async function loadStats(db, container) {
  const [rosterSnap, playsSnap, draftsSnap, gamePlansSnap] = await Promise.all([
    getDocs(collection(db, 'players')),
    getDocs(query(collection(db, 'plays'), where('status', '==', 'published'))),
    getDocs(query(collection(db, 'plays'), where('status', '==', 'pending_approval'))),
    getDocs(query(collection(db, 'game_plans'), where('current', '==', true))),
  ]);

  const stats = [
    { label: 'Rostered Players', value: rosterSnap.size, icon: '👥', view: 'roster' },
    { label: 'Published Plays',  value: playsSnap.size,  icon: '📋', view: 'play-library' },
    { label: 'Pending Approval', value: draftsSnap.size, icon: '⏳', view: 'play-library', alert: draftsSnap.size > 0 },
    { label: 'Active Game Plans', value: gamePlansSnap.size, icon: '📅', view: 'game-plans' },
  ];

  const grid = container.querySelector('#stat-grid');
  grid.innerHTML = stats.map(s => `
    <button class="stat-card ${s.alert ? 'stat-card--alert' : ''}" data-view="${s.view}">
      <span class="stat-icon">${s.icon}</span>
      <span class="stat-value">${s.value}</span>
      <span class="stat-label">${s.label}</span>
    </button>
  `).join('');

  grid.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });
}

async function loadPlayersOut(db, container) {
  const snap = await getDocs(
    query(collection(db, 'players'), where('availability', 'in', ['out', 'limited']))
  );
  const el = container.querySelector('#players-out-list');
  if (snap.empty) {
    el.innerHTML = `<p class="panel-empty">All players are active ✓</p>`;
    return;
  }
  el.innerHTML = snap.docs.map(d => {
    const p = d.data();
    return `
      <div class="player-row">
        <span class="player-number">#${p.jerseyNumber || '—'}</span>
        <span class="player-name">${p.name}</span>
        <span class="player-pos">${p.primaryPosition || ''}</span>
        ${availabilityBadge(p.availability)}
      </div>
    `;
  }).join('');
}

async function loadRecentPlays(db, container) {
  const snap = await getDocs(
    query(collection(db, 'plays'), orderBy('updatedAt', 'desc'), limit(5))
  );
  const el = container.querySelector('#recent-plays-list');
  if (snap.empty) {
    el.innerHTML = `<p class="panel-empty">No plays yet. <button class="link-btn" data-view="play-designer">Create your first play →</button></p>`;
    el.querySelector('[data-view]')?.addEventListener('click', () => navigate('play-designer'));
    return;
  }
  el.innerHTML = snap.docs.map(d => {
    const p = d.data();
    const statusCls = { published: 'badge--green', draft: 'badge--gray', pending_approval: 'badge--yellow', archived: 'badge--red' }[p.status] || 'badge--gray';
    return `
      <div class="play-row">
        <div class="play-row__info">
          <span class="play-row__name">${p.name || 'Untitled Play'}</span>
          <span class="play-row__meta">${p.formation || ''} · ${relativeTime(p.updatedAt)}</span>
        </div>
        <span class="badge ${statusCls}">${p.status?.replace('_', ' ') || 'draft'}</span>
      </div>
    `;
  }).join('');
}

async function loadCurrentGamePlan(db, container) {
  const snap = await getDocs(
    query(collection(db, 'game_plans'), where('current', '==', true), limit(1))
  );
  const el = container.querySelector('#current-game-plan');
  if (snap.empty) {
    el.innerHTML = `<p class="panel-empty">No active game plan. <button class="link-btn" data-view="game-plans">Create one →</button></p>`;
    el.querySelector('[data-view]')?.addEventListener('click', () => navigate('game-plans'));
    return;
  }
  const gp = snap.docs[0].data();
  el.innerHTML = `
    <div class="game-plan-summary">
      <div class="gp-name">${gp.name || 'Game Plan'}</div>
      ${gp.opponent ? `<div class="gp-opponent">vs. ${gp.opponent}</div>` : ''}
      ${gp.gameDate ? `<div class="gp-date">${gp.gameDate}</div>` : ''}
      <button class="btn btn--ghost btn--sm" data-view="game-plans">Open →</button>
    </div>
  `;
  el.querySelector('[data-view]')?.addEventListener('click', () => navigate('game-plans'));
}
