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
      <div class="play-card__diagram">
        ${renderPlayThumbnail(play, position)}
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

function renderPlayThumbnail(play, highlightPosition) {
  const players = play.players || [];
  const routes  = play.routes  || [];
  const W = 300, H = 200;

  // Group map to match position to group
  const groupMap = {
    QB: 'QB', RB: 'RB', FB: 'RB',
    WR: 'WR', TE: 'TE',
    LT: 'OL', LG: 'OL', C: 'OL', RG: 'OL', RT: 'OL',
    DE: 'DL', DT: 'DL', NT: 'DL',
    MLB: 'LB', OLB: 'LB', ILB: 'LB',
    CB: 'DB', FS: 'DB', SS: 'DB', NB: 'DB',
  };
  const highlightGroup = highlightPosition ? groupMap[highlightPosition] : null;

  // Find which player indices match the highlighted position
  const highlightedPlayerIds = new Set(
    players
      .filter(p => p.pos === highlightPosition || p.pos === highlightGroup)
      .map(p => p.id)
  );

  const playerDots = players.map(p => {
    const x = (p.x / 100) * W;
    const y = (p.y / 100) * H;
    const isHighlighted = highlightedPlayerIds.has(p.id);
    const baseColor = play.side === 'offense' ? '#4caf74' : '#d94f3d';
    const fillColor = isHighlighted ? '#f0d04e' : baseColor;
    const strokeColor = isHighlighted ? '#fff' : '#0f1b12';
    const radius = isHighlighted ? 9 : 7;
    return `
      <circle cx="${x}" cy="${y}" r="${radius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>
      <text x="${x}" y="${y+3}" text-anchor="middle" font-size="5" fill="${isHighlighted ? '#000' : '#fff'}" font-family="sans-serif" font-weight="bold">${p.pos}</text>
    `;
  }).join('');

  const routeLines = routes.map(r => {
    if (!r.points || r.points.length < 2) return '';
    const pts = r.points.map(p => `${(p.x/100)*W},${(p.y/100)*H}`).join(' ');
    const dash = r.tool === 'option' ? 'stroke-dasharray="3,4"' : '';
    // Check if this route belongs to a highlighted player
    const isHighlightedRoute = r.playerId && highlightedPlayerIds.has(r.playerId);
    const strokeColor = isHighlightedRoute ? '#f0d04e' : (r.color || '#f0d04e');
    const strokeWidth = isHighlightedRoute ? '2.5' : '1.5';
    const opacity = (highlightPosition && !isHighlightedRoute) ? 'opacity="0.35"' : '';
    return `<polyline points="${pts}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" ${dash} ${opacity}/>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;border-radius:6px">
    <rect width="${W}" height="${H}" fill="#0f1b12"/>
    <line x1="0" y1="${H*0.52}" x2="${W}" y2="${H*0.52}" stroke="#e8c84b" stroke-width="1" stroke-dasharray="5,4" opacity="0.5"/>
    ${routeLines}
    ${playerDots}
  </svg>`;
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
  const SECTIONS = ['Opening Script', 'Run Game', 'Pass Game', 'Red Zone', 'Goal Line', 'Situational', 'Specials'];

  // Fetch all plays referenced in the game plan so we can show their details
  const allPlayIds = SECTIONS.flatMap(s => (gp.sections?.[s] || []).map(entry => entry.playId)).filter(Boolean);
  let playsById = {};
  if (allPlayIds.length > 0) {
    // Fetch in chunks of 10 (Firestore 'in' limit)
    const chunks = [];
    for (let i = 0; i < allPlayIds.length; i += 10) chunks.push(allPlayIds.slice(i, i + 10));
    for (const chunk of chunks) {
      const snap2 = await getDocs(query(collection(db, 'plays'), where('__name__', 'in', chunk)));
      snap2.docs.forEach(d => { playsById[d.id] = { id: d.id, ...d.data() }; });
    }
  }

  const sectionsHTML = SECTIONS.map(sectionName => {
    const entries = gp.sections?.[sectionName] || [];
    if (entries.length === 0) return '';
    const playsHTML = entries.map((entry, i) => {
      const play = playsById[entry.playId];
      if (!play) return '';
      const myNote = getNoteForPosition(play, position);
      return `
        <div class="gp-play-row">
          <div class="gp-play-num">${i + 1}</div>
          <div class="gp-play-diagram">${renderPlayThumbnail(play, position)}</div>
          <div class="gp-play-info">
            <div class="gp-play-name">${play.name || 'Untitled'}</div>
            <div class="gp-play-formation">${play.formation || ''}</div>
            ${entry.coachNote ? `<div class="gp-play-coach-note">${entry.coachNote}</div>` : ''}
            ${myNote ? `<div class="play-card__my-note"><strong>Your assignment:</strong> ${myNote}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    if (!playsHTML.trim()) return '';
    return `
      <div class="gp-section">
        <div class="gp-section-title">${sectionName}</div>
        ${playsHTML}
      </div>
    `;
  }).join('');

  main.innerHTML = `
    <div class="gp-player-header">
      <h2 class="gp-player-name">${gp.name || "This Week's Game Plan"}</h2>
      ${gp.opponent ? `<div class="gp-player-vs">vs. ${gp.opponent}</div>` : ''}
      ${gp.playerNotes ? `<div class="gp-player-notes">${gp.playerNotes}</div>` : ''}
    </div>
    ${sectionsHTML || '<div class="player-empty">No plays added to this game plan yet.</div>'}
  `;
}
