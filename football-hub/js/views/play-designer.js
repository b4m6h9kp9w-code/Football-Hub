import {
  collection, query, orderBy, onSnapshot, getDocs,
  doc, setDoc, getDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { toast, confirm, generateId, isHeadCoach, OFFENSE_POSITIONS, DEFENSE_POSITIONS } from '../modules/utils.js';

const SITUATION_TAGS = ['Base', 'Red Zone', 'Goal Line', 'Short Yardage', 'Two Minute', 'Third and Long'];
const PLAY_TYPES_OFF = ['Run', 'Pass', 'Screen', 'Play Action', 'RPO'];
const PLAY_TYPES_DEF = ['Base Defense', 'Blitz', 'Zone', 'Man', 'Prevent'];
const TOOLS = [
  { id: 'select',   label: 'Select',   icon: '↖' },
  { id: 'route',    label: 'Route',    icon: '→' },
  { id: 'curve',    label: 'Curve',    icon: '⌒' },
  { id: 'motion',   label: 'Motion',   icon: '〜' },
  { id: 'option',   label: 'Option',   icon: '⋯' },
  { id: 'block',    label: 'Block',    icon: '⬛' },
  { id: 'erase',    label: 'Erase',    icon: '✕' },
];

const FIELD_VIEWS = {
  offensiveHalf: {
    label: 'Offensive Half',
    yardsShown: 50,
    endZoneYards: 10,
    losFromTop: 40,
    aspectW: 53.33,
    aspectH: 50,
  },
  redZone: {
    label: 'Red Zone',
    yardsShown: 30,
    endZoneYards: 10,
    losFromTop: 20,
    aspectW: 53.33,
    aspectH: 30,
  },
};
let currentFieldView = 'offensiveHalf';
let currentPlay = null;
let formations = [];
let history = [];
let historyIndex = -1;
let autoSaveTimer = null;

export function renderPlayDesigner(container, { db, AppState }) {
  loadFormations(db).then(f => { formations = f; });

  const editPlayId = window._editPlayId;
  window._editPlayId = null;

  container.innerHTML = `
    <div class="pd-layout">
      <div class="pd-sidebar-left">
        <div class="pd-sidebar-header">
          <span class="pd-sidebar-title">Plays</span>
          <button class="btn btn--primary btn--sm" id="pd-new-play">+ New</button>
        </div>
        <div class="pd-play-tabs">
          <button class="pd-tab active" data-filter="all">All</button>
          <button class="pd-tab" data-filter="offense">OFF</button>
          <button class="pd-tab" data-filter="defense">DEF</button>
        </div>
        <input type="search" class="pd-search" id="pd-search" placeholder="Search plays…">
        <div id="pd-play-list" class="pd-play-list"></div>
      </div>

      <div class="pd-canvas-area" id="pd-canvas-area">
        <div class="pd-empty-state" id="pd-empty-state">
          <div style="font-size:48px;opacity:.3">✏️</div>
          <p>Select a play or create a new one</p>
        </div>
        <div class="pd-editor" id="pd-editor" style="display:none">
          <div class="pd-toolbar">
            ${TOOLS.map(t => `<button class="pd-tool" data-tool="${t.id}" title="${t.label}">${t.icon} <span>${t.label}</span></button>`).join('')}
            <div class="pd-toolbar-sep"></div>
            <button class="pd-tool" id="pd-undo" title="Undo">↩</button>
            <button class="pd-tool" id="pd-redo" title="Redo">↪</button>
            <button class="pd-tool" id="pd-clear-routes" title="Clear Routes">🗑 Routes</button>
            <div class="pd-toolbar-sep"></div>
            <button class="pd-tool pd-view-toggle active" data-view="offensiveHalf" id="view-off-half" title="Offensive Half">OFF Half</button>
            <button class="pd-tool pd-view-toggle" data-view="redZone" id="view-red-zone" title="Red Zone">Red Zone</button>
          </div>
          <div class="pd-canvas-wrap">
            <canvas id="pd-canvas"></canvas>
          </div>
          <div class="pd-status-bar">
            <span id="pd-autosave-status">All changes saved</span>
            <div class="pd-status-actions">
              <button class="btn btn--ghost btn--sm" id="pd-duplicate">⧉ Duplicate</button>
              ${isHeadCoach(AppState) ? `<button class="btn btn--primary btn--sm" id="pd-publish">Publish</button>` : `<button class="btn btn--primary btn--sm" id="pd-submit">Submit for Approval</button>`}
            </div>
          </div>
        </div>
      </div>

      <div class="pd-sidebar-right" id="pd-sidebar-right" style="display:none">
        <div class="pd-details-scroll">
          <div class="pd-detail-section">
            <label class="form-label">Play Name</label>
            <input class="form-input" id="pd-play-name" placeholder="e.g. Slant Right">
          </div>
          <div class="pd-detail-section">
            <label class="form-label">Formation</label>
            <select class="form-select" id="pd-formation-select">
              <option value="">Select formation…</option>
            </select>
          </div>
          <div class="pd-detail-section">
            <label class="form-label">Side</label>
            <div class="toggle-group">
              <button class="toggle-btn active" data-side="offense">Offense</button>
              <button class="toggle-btn" data-side="defense">Defense</button>
            </div>
          </div>
          <div class="pd-detail-section">
            <label class="form-label">Play Type</label>
            <select class="form-select" id="pd-play-type"></select>
          </div>
          <div class="pd-detail-section">
            <label class="form-label">Situation Tags</label>
            <div class="tag-checkboxes" id="pd-tags">
              ${SITUATION_TAGS.map(t => `
                <label class="tag-check">
                  <input type="checkbox" value="${t}"> ${t}
                </label>
              `).join('')}
            </div>
          </div>
          <div class="pd-detail-section">
            <label class="form-label">Status</label>
            <span class="badge badge--gray" id="pd-status-badge">Draft</span>
          </div>
          <div class="pd-detail-section">
            <label class="form-label">Player Notes</label>
            <div class="player-notes-grid" id="pd-player-notes"></div>
          </div>
          <div class="pd-detail-section">
            <label class="form-label">Coach Notes <span style="color:var(--signal);font-size:10px">PRIVATE</span></label>
            <textarea class="form-input pd-textarea" id="pd-coach-notes" placeholder="Scout notes, adjustments…" rows="3"></textarea>
          </div>
        </div>
      </div>
    </div>
  `;

  const unsubscribe = onSnapshot(
    query(collection(db, 'plays'), orderBy('updatedAt', 'desc')),
    snap => {
      const plays = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderPlayList(plays, container, { db, AppState });
      if (editPlayId) {
        const play = plays.find(p => p.id === editPlayId);
        if (play) openPlay(play, container, { db, AppState });
      }
    }
  );

  container.querySelector('#pd-new-play').addEventListener('click', () => {
    openNewPlayDialog(container, { db, AppState });
  });

  container.querySelectorAll('.pd-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.pd-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

async function loadFormations(db) {
  const snap = await getDocs(collection(db, 'formations'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function renderPlayList(plays, container, ctx) {
  const list = container.querySelector('#pd-play-list');
  const search = container.querySelector('#pd-search').value.toLowerCase();
  const filter = container.querySelector('.pd-tab.active')?.dataset.filter || 'all';

  const filtered = plays.filter(p => {
    const matchSide = filter === 'all' || p.side === filter;
    const matchSearch = !search || p.name?.toLowerCase().includes(search) || p.formation?.toLowerCase().includes(search);
    return matchSide && matchSearch && p.status !== 'archived';
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="pd-list-empty">No plays yet</div>`;
    return;
  }

  list.innerHTML = filtered.map(p => {
    const statusCls = { published: 'badge--green', draft: 'badge--gray', pending_approval: 'badge--yellow' }[p.status] || 'badge--gray';
    return `
      <div class="pd-list-item ${currentPlay?.id === p.id ? 'active' : ''}" data-id="${p.id}">
        <div class="pd-list-item__name">${p.name || 'Untitled'}</div>
        <div class="pd-list-item__meta">
          <span>${p.formation || '—'}</span>
          <span class="badge ${statusCls}" style="font-size:9px">${p.status?.replace('_', ' ') || 'draft'}</span>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.pd-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const play = plays.find(p => p.id === item.dataset.id);
      if (play) openPlay(play, container, ctx);
    });
  });

  container.querySelector('#pd-search').addEventListener('input', () => renderPlayList(plays, container, ctx));
}

function openNewPlayDialog(container, { db, AppState }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal--form" style="max-width:420px">
      <div class="modal__header">
        <h2>New Play</h2>
        <button class="modal__close" id="np-close">✕</button>
      </div>
      <div class="modal__body">
        <div class="form-grid" style="grid-template-columns:1fr">
          <div class="form-group">
            <label class="form-label">Play Name</label>
            <input class="form-input" id="np-name" placeholder="e.g. Slant Right">
          </div>
          <div class="form-group">
            <label class="form-label">Side</label>
            <div class="toggle-group">
              <button class="toggle-btn active" data-side="offense">Offense</button>
              <button class="toggle-btn" data-side="defense">Defense</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Formation (optional)</label>
            <select class="form-select" id="np-formation">
              <option value="">Blank canvas</option>
              ${formations.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" id="np-cancel">Cancel</button>
        <button class="btn btn--primary" id="np-create">Create Play</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  let selectedSide = 'offense';
  overlay.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSide = btn.dataset.side;
      const sel = overlay.querySelector('#np-formation');
      const opts = formations.filter(f => f.side === selectedSide);
      sel.innerHTML = `<option value="">Blank canvas</option>` + opts.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    });
  });

  overlay.querySelector('#np-close').onclick  = () => overlay.remove();
  overlay.querySelector('#np-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#np-create').onclick = async () => {
    const name = overlay.querySelector('#np-name').value.trim();
    if (!name) { toast('Play name is required', 'error'); return; }
    const formationId = overlay.querySelector('#np-formation').value;
    const formation = formations.find(f => f.id === formationId);

    const id = generateId();
    const play = {
      id, name,
      side: selectedSide,
      formationId: formationId || null,
      formation: formation?.name || '',
      players: formation ? JSON.parse(JSON.stringify(formation.players || [])) : getDefaultPlayers(selectedSide),
      routes: [],
      tags: [],
      playType: selectedSide === 'offense' ? 'Pass' : 'Base Defense',
      playerNotes: {},
      coachNotes: '',
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'plays', id), play);
    overlay.remove();
    openPlay({ ...play, id }, container, { db, AppState });
    toast('Play created');
  };
}

function getDefaultPlayers(side) {
  if (side === 'offense') return [
    { id: 'lt', pos: 'LT', x: 28, y: 55 }, { id: 'lg', pos: 'LG', x: 36, y: 55 },
    { id: 'c',  pos: 'C',  x: 44, y: 55 }, { id: 'rg', pos: 'RG', x: 52, y: 55 },
    { id: 'rt', pos: 'RT', x: 60, y: 55 }, { id: 'qb', pos: 'QB', x: 44, y: 65 },
    { id: 'rb', pos: 'RB', x: 44, y: 76 }, { id: 'wr1', pos: 'WR', x: 10, y: 55 },
    { id: 'wr2', pos: 'WR', x: 82, y: 55 }, { id: 'te', pos: 'TE', x: 68, y: 55 },
  ];
  return [
    { id: 'de1', pos: 'DE',  x: 28, y: 45 }, { id: 'dt1', pos: 'DT', x: 38, y: 45 },
    { id: 'nt',  pos: 'NT',  x: 48, y: 45 }, { id: 'dt2', pos: 'DT', x: 58, y: 45 },
    { id: 'de2', pos: 'DE',  x: 68, y: 45 }, { id: 'mlb', pos: 'MLB',x: 48, y: 56 },
    { id: 'olb1',pos: 'OLB', x: 30, y: 56 }, { id: 'olb2',pos: 'OLB',x: 66, y: 56 },
    { id: 'cb1', pos: 'CB',  x: 12, y: 45 }, { id: 'cb2', pos: 'CB', x: 84, y: 45 },
    { id: 'fs',  pos: 'FS',  x: 48, y: 70 },
  ];
}

function openPlay(play, container, { db, AppState }) {
  currentPlay = JSON.parse(JSON.stringify(play));
  history = [JSON.parse(JSON.stringify(currentPlay))];
  historyIndex = 0;

  container.querySelector('#pd-empty-state').style.display = 'none';
  container.querySelector('#pd-editor').style.display = 'flex';
  container.querySelector('#pd-sidebar-right').style.display = 'flex';

  container.querySelectorAll('.pd-list-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id === play.id);
  });

  populateDetails(container, { db, AppState });
  initCanvas(container, { db, AppState });
}

function populateDetails(container, { db, AppState }) {
  const p = currentPlay;

  container.querySelector('#pd-play-name').value = p.name || '';
  container.querySelector('#pd-coach-notes').value = p.coachNotes || '';
  container.querySelector('#pd-status-badge').textContent = (p.status || 'draft').replace('_', ' ');
  container.querySelector('#pd-status-badge').className = `badge ${{ published: 'badge--green', draft: 'badge--gray', pending_approval: 'badge--yellow', archived: 'badge--red' }[p.status] || 'badge--gray'}`;

  container.querySelectorAll('.toggle-btn[data-side]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.side === p.side);
    btn.addEventListener('click', () => {
      container.querySelectorAll('.toggle-btn[data-side]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPlay.side = btn.dataset.side;
      updatePlayTypeOptions(container);
      scheduleAutoSave(db);
    });
  });

  const formSel = container.querySelector('#pd-formation-select');
  const offFormations = formations.filter(f => f.side === p.side);
  formSel.innerHTML = `<option value="">No formation</option>` + offFormations.map(f => `<option value="${f.id}" ${f.id === p.formationId ? 'selected' : ''}>${f.name}</option>`).join('');
  formSel.addEventListener('change', () => {
    const f = formations.find(x => x.id === formSel.value);
    if (f) {
      currentPlay.formationId = f.id;
      currentPlay.formation = f.name;
      currentPlay.players = JSON.parse(JSON.stringify(f.players));
      redrawCanvas(container);
    }
    scheduleAutoSave(db);
  });

  updatePlayTypeOptions(container);

  container.querySelectorAll('#pd-tags input').forEach(cb => {
    cb.checked = (p.tags || []).includes(cb.value);
    cb.addEventListener('change', () => {
      currentPlay.tags = [...container.querySelectorAll('#pd-tags input:checked')].map(c => c.value);
      scheduleAutoSave(db);
    });
  });

  const notesGrid = container.querySelector('#pd-player-notes');
  const noteGroups = p.side === 'offense'
    ? ['QB', 'RB', 'WR', 'TE', 'OL']
    : ['DL', 'LB', 'DB'];
  notesGrid.innerHTML = noteGroups.map(g => `
    <div class="form-group" style="grid-column:1/-1">
      <label class="form-label">${g}</label>
      <textarea class="form-input pd-textarea" data-group="${g}" rows="2" placeholder="${g} assignment…">${p.playerNotes?.[g] || ''}</textarea>
    </div>
  `).join('');

  notesGrid.querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', () => {
      if (!currentPlay.playerNotes) currentPlay.playerNotes = {};
      currentPlay.playerNotes[ta.dataset.group] = ta.value;
      scheduleAutoSave(db);
    });
  });

  container.querySelector('#pd-play-name').addEventListener('input', () => {
    currentPlay.name = container.querySelector('#pd-play-name').value;
    scheduleAutoSave(db);
  });
  container.querySelector('#pd-coach-notes').addEventListener('input', () => {
    currentPlay.coachNotes = container.querySelector('#pd-coach-notes').value;
    scheduleAutoSave(db);
  });

  const publishBtn = container.querySelector('#pd-publish');
  const submitBtn  = container.querySelector('#pd-submit');

  if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
      const ok = await confirm(`Publish "${currentPlay.name}"? It will become visible to players.`, { confirmLabel: 'Publish' });
      if (!ok) return;
      currentPlay.status = 'published';
      await savePlay(db);
      toast('Play published ✓', 'success');
      populateDetails(container, { db, AppState });
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      currentPlay.status = 'pending_approval';
      await savePlay(db);
      toast('Submitted for approval');
      populateDetails(container, { db, AppState });
    });
  }

  container.querySelector('#pd-duplicate').addEventListener('click', async () => {
    const id = generateId();
    const copy = { ...currentPlay, id, name: currentPlay.name + ' (Copy)', status: 'draft', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await setDoc(doc(db, 'plays', id), copy);
    toast('Play duplicated');
    openPlay(copy, container, { db, AppState });
  });
}

function updatePlayTypeOptions(container) {
  const sel = container.querySelector('#pd-play-type');
  const types = currentPlay.side === 'offense' ? PLAY_TYPES_OFF : PLAY_TYPES_DEF;
  sel.innerHTML = types.map(t => `<option value="${t}" ${currentPlay.playType === t ? 'selected' : ''}>${t}</option>`).join('');
  sel.onchange = () => { currentPlay.playType = sel.value; scheduleAutoSave(db); };
}

// ─── Canvas Engine ────────────────────────────────────────────────────────
let activeTool = 'select';
let isDrawing = false;
let currentStroke = null;
let selectedPlayer = null;
let isDraggingPlayer = false;

function initCanvas(container, { db, AppState }) {
  const canvas = container.querySelector('#pd-canvas');
  const wrap   = container.querySelector('.pd-canvas-wrap');

  function resizeCanvas() {
  const rect = wrap.getBoundingClientRect();
  const view = FIELD_VIEWS[currentFieldView];
  const aspectRatio = view.aspectH / view.aspectW;
  canvas.width  = rect.width;
  canvas.height = rect.width * aspectRatio;
  redrawCanvas(container);
}

  resizeCanvas();
  new ResizeObserver(resizeCanvas).observe(wrap);

  container.querySelectorAll('.pd-tool[data-tool]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === activeTool);
    btn.addEventListener('click', () => {
      activeTool = btn.dataset.tool;
      container.querySelectorAll('.pd-tool[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === activeTool));
      canvas.style.cursor = activeTool === 'select' ? 'default' : 'crosshair';
    });
  });

  container.querySelectorAll('.pd-view-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFieldView = btn.dataset.view;
    container.querySelectorAll('.pd-view-toggle').forEach(b => b.classList.toggle('active', b.dataset.view === currentFieldView));
    resizeCanvas();
  });
});

  container.querySelector('#pd-undo').addEventListener('click', () => undo(container));
  container.querySelector('#pd-redo').addEventListener('click', () => redo(container));
  container.querySelector('#pd-clear-routes').addEventListener('click', async () => {
    const ok = await confirm('Clear all routes?', { confirmLabel: 'Clear', danger: true });
    if (!ok) return;
    currentPlay.routes = [];
    pushHistory();
    redrawCanvas(container);
    scheduleAutoSave(db);
  });

  canvas.addEventListener('mousedown',  e => onPointerDown(e, canvas, container, db));
  canvas.addEventListener('mousemove',  e => onPointerMove(e, canvas, container, db));
  canvas.addEventListener('mouseup',    e => onPointerUp(e, canvas, container, db));
  canvas.addEventListener('mouseleave', () => { isDrawing = false; isDraggingPlayer = false; });

  canvas.addEventListener('touchstart', e => { e.preventDefault(); onPointerDown(e.touches[0], canvas, container, db); }, { passive: false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); onPointerMove(e.touches[0], canvas, container, db); }, { passive: false });
  canvas.addEventListener('touchend',   e => { e.preventDefault(); onPointerUp(e.changedTouches[0], canvas, container, db); }, { passive: false });

  redrawCanvas(container);
}

function getPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width  / rect.width),
    y: (e.clientY - rect.top)  * (canvas.height / rect.height),
  };
}

function findPlayerAt(x, y, canvas) {
  const W = canvas.width, H = canvas.height;
  const players = currentPlay.players || [];
  for (let i = players.length - 1; i >= 0; i--) {
    const px = (players[i].x / 100) * W;
    const py = (players[i].y / 100) * H;
    if (Math.hypot(x - px, y - py) < 18) return i;
  }
  return -1;
}

function onPointerDown(e, canvas, container, db) {
  const pos = getPos(e, canvas);

  if (activeTool === 'select') {
    const idx = findPlayerAt(pos.x, pos.y, canvas);
    if (idx >= 0) { selectedPlayer = idx; isDraggingPlayer = true; }
    else { selectedPlayer = null; isDraggingPlayer = false; }
    redrawCanvas(container);
    return;
  }

  if (activeTool === 'erase') {
    eraseAt(pos, canvas, container, db);
    return;
  }

  isDrawing = true;
  const playerIdx = findPlayerAt(pos.x, pos.y, canvas);
  const W = canvas.width, H = canvas.height;
  const player = playerIdx >= 0 ? currentPlay.players[playerIdx] : null;

  currentStroke = {
    tool: activeTool,
    points: [{ x: pos.x / W * 100, y: pos.y / H * 100 }],
    fromPlayer: playerIdx >= 0 ? playerIdx : null,
    playerId: player?.id || null,
    color: getToolColor(activeTool),
  };
}

function onPointerMove(e, canvas, container, db) {
  const pos = getPos(e, canvas);
  const W = canvas.width, H = canvas.height;

  if (isDraggingPlayer && selectedPlayer !== null) {
    currentPlay.players[selectedPlayer].x = Math.max(2, Math.min(98, (pos.x / W) * 100));
    currentPlay.players[selectedPlayer].y = Math.max(2, Math.min(98, (pos.y / H) * 100));
    redrawCanvas(container);
    scheduleAutoSave(db);
    return;
  }

  if (!isDrawing || !currentStroke) return;
  currentStroke.points.push({ x: pos.x / W * 100, y: pos.y / H * 100 });
  redrawCanvas(container, currentStroke);
}

function onPointerUp(e, canvas, container, db) {
  if (isDraggingPlayer) {
    isDraggingPlayer = false;
    pushHistory();
    scheduleAutoSave(db);
    return;
  }

  if (!isDrawing || !currentStroke) return;
  isDrawing = false;

  if (currentStroke.points.length > 1) {
    if (!currentPlay.routes) currentPlay.routes = [];
    currentPlay.routes.push({ ...currentStroke });
    pushHistory();
    scheduleAutoSave(db);
  }

  currentStroke = null;
  redrawCanvas(container);
}

function eraseAt(pos, canvas, container, db) {
  const W = canvas.width, H = canvas.height;
  if (!currentPlay.routes) return;
  currentPlay.routes = currentPlay.routes.filter(route => {
    return !route.points.some(p => {
      const px = (p.x / 100) * W;
      const py = (p.y / 100) * H;
      return Math.hypot(pos.x - px, pos.y - py) < 16;
    });
  });
  pushHistory();
  redrawCanvas(container);
  scheduleAutoSave(db);
}

function getToolColor(tool) {
  const colors = {
    route:  '#f0d04e',
    curve:  '#f0d04e',
    motion: '#4caf74',
    option: '#e8855a',
    block:  '#aaaaaa',
  };
  return colors[tool] || '#f0d04e';
}

// ─── Canvas Rendering ─────────────────────────────────────────────────────
function redrawCanvas(container, liveStroke = null) {
  const canvas = container.querySelector('#pd-canvas');
  if (!canvas || !currentPlay) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  drawField(ctx, W, H);
  drawRoutes(ctx, W, H, currentPlay.routes || []);
  if (liveStroke) drawSingleRoute(ctx, W, H, liveStroke);
  drawPlayers(ctx, W, H);
}

function drawField(ctx, W, H) {
  const view = FIELD_VIEWS[currentFieldView];

  ctx.fillStyle = '#0f1b12';
  ctx.fillRect(0, 0, W, H);

  const pxPerYard  = H / view.yardsShown;
  const ezH        = view.endZoneYards * pxPerYard;
  const fieldYards = view.yardsShown - view.endZoneYards;
  const losY       = view.losFromTop * pxPerYard;

  // End zone
  ctx.fillStyle = '#162a1b';
  ctx.fillRect(0, 0, W, ezH);
  ctx.fillStyle = '#2a5a35';
  ctx.font = `bold ${Math.max(10, W * 0.02)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('END ZONE', W / 2, ezH / 2);

  // Yard lines every 5 yards
  const fontSize = Math.max(8, W * 0.013);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.setLineDash([]);

  for (let yd = 0; yd <= fieldYards; yd += 5) {
    const lineY  = ezH + yd * pxPerYard;
    const yardNum = 10 + yd;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(W, lineY);
    if (yd % 10 === 0) {
      ctx.strokeStyle = '#2a5a34';
      ctx.lineWidth = 1.5;
    } else {
      ctx.strokeStyle = '#1a3020';
      ctx.lineWidth = 0.8;
    }
    ctx.stroke();

    if (yd > 0 && yardNum <= 50) {
      ctx.fillStyle = '#3a6040';
      ctx.textAlign = 'left';
      ctx.fillText(`${yardNum}`, 5, lineY);
      ctx.textAlign = 'right';
      ctx.fillText(`${yardNum}`, W - 5, lineY);
    }
  }

  // Hash marks: high school / college
  // 53'4" from each sideline = 33.3% from each side
  const hashLeft  = W * 0.333;
  const hashRight = W * 0.667;
  const hashLen   = pxPerYard * 0.5;

  ctx.strokeStyle = '#4a7a50';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);

  for (let yd = 0; yd <= fieldYards; yd++) {
    const lineY = ezH + yd * pxPerYard;
    ctx.beginPath();
    ctx.moveTo(hashLeft - hashLen, lineY);
    ctx.lineTo(hashLeft + hashLen, lineY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hashRight - hashLen, lineY);
    ctx.lineTo(hashRight + hashLen, lineY);
    ctx.stroke();
  }

  // Subtle vertical hash column guides
  ctx.strokeStyle = '#1e3020';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 8]);
  ctx.beginPath(); ctx.moveTo(hashLeft, ezH); ctx.lineTo(hashLeft, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hashRight, ezH); ctx.lineTo(hashRight, H); ctx.stroke();
  ctx.setLineDash([]);

  // Sidelines
  ctx.strokeStyle = '#4a7a50';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(1, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - 1, 0); ctx.lineTo(W - 1, H); ctx.stroke();

  // Goal line
  ctx.strokeStyle = '#5a9a65';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, ezH); ctx.lineTo(W, ezH); ctx.stroke();

  // LOS
  ctx.strokeStyle = '#e8c84b';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(0, losY);
  ctx.lineTo(W, losY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#b09a30';
  ctx.font = `bold ${Math.max(8, W * 0.013)}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('LOS', 5, losY - 2);

  // View label
  ctx.fillStyle = '#2a4a35';
  ctx.font = `${Math.max(8, W * 0.011)}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(view.label, W - 5, H - 3);
}

function drawRoutes(ctx, W, H, routes) {
  routes.forEach(route => drawSingleRoute(ctx, W, H, route));
}

function drawSingleRoute(ctx, W, H, route) {
  if (!route.points || route.points.length < 2) return;
  const pts = route.points.map(p => ({ x: (p.x / 100) * W, y: (p.y / 100) * H }));

  ctx.strokeStyle = route.color || '#f0d04e';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (route.tool === 'motion') {
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cp = { x: (pts[i-1].x + pts[i].x) / 2, y: pts[i-1].y - 8 };
      ctx.quadraticCurveTo(cp.x, cp.y, pts[i].x, pts[i].y);
    }
    ctx.stroke();
  } else if (route.tool === 'option') {
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (route.tool === 'block') {
    const last = pts[pts.length - 1];
    const r = 8;
    ctx.strokeStyle = route.color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(last.x - r, last.y - r); ctx.lineTo(last.x + r, last.y + r); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(last.x + r, last.y - r); ctx.lineTo(last.x - r, last.y + r); ctx.stroke();
  } else if (route.tool === 'curve') {
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i+1].x) / 2;
      const my = (pts[i].y + pts[i+1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
    ctx.stroke();
    drawArrowhead(ctx, pts[pts.length-2], pts[pts.length-1], route.color);
  } else {
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    if (pts.length >= 2) drawArrowhead(ctx, pts[pts.length-2], pts[pts.length-1], route.color);
  }
}

function drawArrowhead(ctx, from, to, color) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const size = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(angle - 0.4), to.y - size * Math.sin(angle - 0.4));
  ctx.lineTo(to.x - size * Math.cos(angle + 0.4), to.y - size * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

function drawPlayers(ctx, W, H) {
  const players = currentPlay?.players || [];
  players.forEach((p, i) => {
    const x = (p.x / 100) * W;
    const y = (p.y / 100) * H;
    const r = Math.max(7, W * 0.013);
    const isOff = currentPlay.side === 'offense';
    const isSelected = selectedPlayer === i;

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240,208,78,0.3)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = isOff ? '#4caf74' : '#d94f3d';
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#f0d04e' : '#131f12';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(8, r * 0.7)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.pos, x, y);
  });
}

// ─── History ──────────────────────────────────────────────────────────────
function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.parse(JSON.stringify(currentPlay)));
  historyIndex = history.length - 1;
}

function undo(container) {
  if (historyIndex <= 0) return;
  historyIndex--;
  currentPlay = JSON.parse(JSON.stringify(history[historyIndex]));
  redrawCanvas(container);
  toast('Undone', 'success', 1000);
}

function redo(container) {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  currentPlay = JSON.parse(JSON.stringify(history[historyIndex]));
  redrawCanvas(container);
  toast('Redone', 'success', 1000);
}

// ─── Auto Save ────────────────────────────────────────────────────────────
function scheduleAutoSave(db) {
  const statusEl = document.getElementById('pd-autosave-status');
  if (statusEl) statusEl.textContent = 'Saving…';
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => savePlay(db), 1500);
}

async function savePlay(db) {
  if (!currentPlay) return;
  const statusEl = document.getElementById('pd-autosave-status');
  try {
    await setDoc(doc(db, 'plays', currentPlay.id), {
      ...currentPlay,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    if (statusEl) statusEl.textContent = 'All changes saved';
  } catch (e) {
    if (statusEl) statusEl.textContent = 'Save failed';
    console.error('Save error:', e);
  }
}
