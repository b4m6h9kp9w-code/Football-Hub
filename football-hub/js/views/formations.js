import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, deleteDoc, serverTimestamp, getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { toast, confirm, generateId, isHeadCoach, emptyState, OFFENSE_POSITIONS, DEFENSE_POSITIONS } from '../modules/utils.js';

let unsubscribe = null;

export function renderFormations(container, { db, AppState }) {
  container.innerHTML = `
    <div class="view-toolbar">
      <div class="toolbar-left">
        <button class="tab-btn active" data-side="offense">Offense</button>
        <button class="tab-btn" data-side="defense">Defense</button>
      </div>
      <div class="toolbar-right">
        <button class="btn btn--primary" id="new-formation-btn">+ New Formation</button>
      </div>
    </div>
    <div id="formations-grid" class="formations-grid"></div>
  `;

  let currentSide = 'offense';

  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSide = btn.dataset.side;
    });
  });

  container.querySelector('#new-formation-btn').addEventListener('click', () => {
    openFormationEditor(null, currentSide, { db, AppState });
  });

  if (unsubscribe) unsubscribe();
  const q = query(collection(db, 'formations'), orderBy('createdAt', 'desc'));
  unsubscribe = onSnapshot(q, snap => {
    const formations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderGrid(formations, container, { db, AppState });
  });
}

function renderGrid(formations, container, { db, AppState }) {
  const grid = container.querySelector('#formations-grid');
  const activeSide = container.querySelector('.tab-btn.active')?.dataset.side || 'offense';
  const filtered = formations.filter(f => f.side === activeSide && !f.archived);

  if (filtered.length === 0) {
    grid.innerHTML = emptyState('⬛', 'No formations yet', `Create your first ${activeSide} formation.`);
    return;
  }

  grid.innerHTML = filtered.map(f => `
    <div class="formation-card" data-id="${f.id}">
      <div class="formation-card__preview">
        ${renderFormationSVG(f)}
      </div>
      <div class="formation-card__footer">
        <span class="formation-card__name">${f.name}</span>
        <div class="formation-card__actions">
          <button class="icon-btn" data-action="edit" data-id="${f.id}" title="Edit">✏️</button>
          <button class="icon-btn" data-action="duplicate" data-id="${f.id}" title="Duplicate">⧉</button>
          <button class="icon-btn icon-btn--danger" data-action="delete" data-id="${f.id}" title="Delete">🗑</button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = formations.find(x => x.id === btn.dataset.id);
      if (f) openFormationEditor(f, f.side, { db, AppState });
    });
  });

  grid.querySelectorAll('[data-action="duplicate"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const f = formations.find(x => x.id === btn.dataset.id);
      if (!f) return;
      const id = generateId();
      await setDoc(doc(db, 'formations', id), {
        ...f, id, name: f.name + ' (Copy)', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      toast('Formation duplicated');
    });
  });

  grid.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const f = formations.find(x => x.id === btn.dataset.id);
      const ok = await confirm(`Delete "${f?.name}"? This cannot be undone.`, { confirmLabel: 'Delete', danger: true });
      if (ok) { await deleteDoc(doc(db, 'formations', btn.dataset.id)); toast('Formation deleted'); }
    });
  });
}

function renderFormationSVG(formation) {
  const players = formation.players || [];
  const W = 200, H = 140;
  const dots = players.map(p => {
    const x = (p.x / 100) * W;
    const y = (p.y / 100) * H;
    const isCenter = p.pos === 'C';
    return `<g>
      <circle cx="${x}" cy="${y}" r="${isCenter ? 7 : 6}" fill="${formation.side === 'offense' ? '#4caf74' : '#d94f3d'}" stroke="#131f12" stroke-width="1.5"/>
      <text x="${x}" y="${y+4}" text-anchor="middle" font-size="6" fill="#fff" font-family="sans-serif" font-weight="bold">${p.pos || ''}</text>
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="${W}" height="${H}" fill="#192b1d"/>
    <line x1="0" y1="${H*0.5}" x2="${W}" y2="${H*0.5}" stroke="#2f4a34" stroke-width="1"/>
    ${dots}
  </svg>`;
}

// ─── Formation Editor ─────────────────────────────────────────────────────
function openFormationEditor(formation, side, { db }) {
  const isEdit = !!formation;
  const positions = side === 'offense' ? OFFENSE_POSITIONS : DEFENSE_POSITIONS;

  // Default alignments
  const defaultPlayers = side === 'offense' ? [
    { pos: 'LT', x: 28, y: 55 }, { pos: 'LG', x: 36, y: 55 },
    { pos: 'C',  x: 44, y: 55 }, { pos: 'RG', x: 52, y: 55 },
    { pos: 'RT', x: 60, y: 55 }, { pos: 'QB', x: 44, y: 68 },
    { pos: 'RB', x: 44, y: 80 }, { pos: 'WR', x: 10, y: 55 },
    { pos: 'WR', x: 80, y: 55 }, { pos: 'TE', x: 68, y: 55 },
  ] : [
    { pos: 'DE',  x: 28, y: 45 }, { pos: 'DT', x: 38, y: 45 },
    { pos: 'NT',  x: 48, y: 45 }, { pos: 'DT', x: 58, y: 45 },
    { pos: 'DE',  x: 68, y: 45 }, { pos: 'MLB',x: 48, y: 58 },
    { pos: 'OLB', x: 30, y: 58 }, { pos: 'OLB',x: 66, y: 58 },
    { pos: 'CB',  x: 12, y: 45 }, { pos: 'CB', x: 84, y: 45 },
    { pos: 'FS',  x: 48, y: 72 },
  ];

  let players = formation ? JSON.parse(JSON.stringify(formation.players || defaultPlayers)) : [...defaultPlayers];
  let dragging = null;
  let dragOffset = { x: 0, y: 0 };

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal--formation-editor">
      <div class="modal__header">
        <h2>${isEdit ? 'Edit Formation' : 'New Formation'}</h2>
        <button class="modal__close" id="fe-close">✕</button>
      </div>
      <div class="formation-editor-body">
        <div class="fe-sidebar">
          <div class="form-group">
            <label class="form-label">Formation Name</label>
            <input class="form-input" id="fe-name" value="${formation?.name || ''}" placeholder="e.g. Shotgun Spread">
          </div>
          <div class="fe-positions-label form-label" style="margin-top:12px">Players</div>
          <div id="fe-player-list" class="fe-player-list">
            ${players.map((p, i) => `
              <div class="fe-player-item" data-idx="${i}">
                <select class="fe-pos-select" data-idx="${i}">
                  ${positions.map(pos => `<option value="${pos}" ${p.pos === pos ? 'selected' : ''}>${pos}</option>`).join('')}
                </select>
                <button class="icon-btn icon-btn--danger fe-remove-player" data-idx="${i}">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn--ghost btn--sm" id="fe-add-player" style="margin-top:8px">+ Add Player</button>
        </div>
        <div class="fe-canvas-wrap">
          <canvas id="fe-canvas" width="560" height="420"></canvas>
          <div class="fe-canvas-hint">Drag players to reposition</div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" id="fe-cancel">Cancel</button>
        <button class="btn btn--primary" id="fe-save">Save Formation</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const canvas = overlay.querySelector('#fe-canvas');
  const ctx = canvas.getContext('2d');

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Field background
    ctx.fillStyle = '#192b1d';
    ctx.fillRect(0, 0, W, H);

    // LOS
    ctx.strokeStyle = '#3a5c42';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, H * 0.52);
    ctx.lineTo(W, H * 0.52);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#4a6b50';
    ctx.font = '11px sans-serif';
    ctx.fillText('Line of Scrimmage', 8, H * 0.52 - 5);

    // Players
    players.forEach((p, i) => {
      const x = (p.x / 100) * W;
      const y = (p.y / 100) * H;
      const r = 14;
      const color = side === 'offense' ? '#4caf74' : '#d94f3d';

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = dragging === i ? '#f0d04e' : color;
      ctx.fill();
      ctx.strokeStyle = '#131f12';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.pos, x, y);
    });
  }

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  }

  function findPlayerAt(x, y) {
    const W = canvas.width, H = canvas.height;
    for (let i = players.length - 1; i >= 0; i--) {
      const px = (players[i].x / 100) * W;
      const py = (players[i].y / 100) * H;
      if (Math.hypot(x - px, y - py) < 16) return i;
    }
    return -1;
  }

  canvas.addEventListener('mousedown', e => {
    const pos = getCanvasPos(e);
    const idx = findPlayerAt(pos.x, pos.y);
    if (idx >= 0) { dragging = idx; dragOffset = { x: pos.x - (players[idx].x / 100) * canvas.width, y: pos.y - (players[idx].y / 100) * canvas.height }; }
  });

  canvas.addEventListener('mousemove', e => {
    if (dragging === null) return;
    const pos = getCanvasPos(e);
    players[dragging].x = Math.max(2, Math.min(98, ((pos.x - dragOffset.x) / canvas.width)  * 100));
    players[dragging].y = Math.max(2, Math.min(98, ((pos.y - dragOffset.y) / canvas.height) * 100));
    draw();
  });

  canvas.addEventListener('mouseup', () => { dragging = null; draw(); });
  canvas.addEventListener('mouseleave', () => { dragging = null; });

  // Touch support
  canvas.addEventListener('touchstart', e => { e.preventDefault(); const pos = getCanvasPos(e); const idx = findPlayerAt(pos.x, pos.y); if (idx >= 0) { dragging = idx; dragOffset = { x: pos.x - (players[idx].x / 100) * canvas.width, y: pos.y - (players[idx].y / 100) * canvas.height }; } }, { passive: false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); if (dragging === null) return; const pos = getCanvasPos(e); players[dragging].x = Math.max(2, Math.min(98, ((pos.x - dragOffset.x) / canvas.width) * 100)); players[dragging].y = Math.max(2, Math.min(98, ((pos.y - dragOffset.y) / canvas.height) * 100)); draw(); }, { passive: false });
  canvas.addEventListener('touchend',   () => { dragging = null; draw(); });

  // Position selects
  function rebuildPlayerList() {
    const list = overlay.querySelector('#fe-player-list');
    list.innerHTML = players.map((p, i) => `
      <div class="fe-player-item" data-idx="${i}">
        <select class="fe-pos-select" data-idx="${i}">
          ${positions.map(pos => `<option value="${pos}" ${p.pos === pos ? 'selected' : ''}>${pos}</option>`).join('')}
        </select>
        <button class="icon-btn icon-btn--danger fe-remove-player" data-idx="${i}">✕</button>
      </div>
    `).join('');
    list.querySelectorAll('.fe-pos-select').forEach(sel => {
      sel.addEventListener('change', () => { players[+sel.dataset.idx].pos = sel.value; draw(); });
    });
    list.querySelectorAll('.fe-remove-player').forEach(btn => {
      btn.addEventListener('click', () => { players.splice(+btn.dataset.idx, 1); rebuildPlayerList(); draw(); });
    });
  }

  overlay.querySelector('#fe-add-player').addEventListener('click', () => {
    players.push({ pos: positions[0], x: 50, y: 30 });
    rebuildPlayerList();
    draw();
  });

  rebuildPlayerList();
  draw();

  overlay.querySelector('#fe-close').onclick  = () => overlay.remove();
  overlay.querySelector('#fe-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#fe-save').onclick = async () => {
    const name = overlay.querySelector('#fe-name').value.trim();
    if (!name) { toast('Formation name is required', 'error'); return; }
    const id = formation?.id || generateId();
    await setDoc(doc(db, 'formations', id), {
      name, side, players, archived: false,
      createdAt: formation?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    toast(isEdit ? 'Formation saved' : 'Formation created');
    overlay.remove();
  };
}
