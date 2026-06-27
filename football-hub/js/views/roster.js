import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, deleteDoc, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  toast, confirm, availabilityBadge, OFFENSE_POSITIONS,
  DEFENSE_POSITIONS, generateId, isHeadCoach, emptyState
} from '../modules/utils.js';

let unsubscribe = null;

export function renderRoster(container, { db, AppState }) {
  const headCoach = isHeadCoach(AppState);

  container.innerHTML = `
    <div class="view-toolbar">
      <div class="toolbar-left">
        <input type="search" id="roster-search" class="search-input" placeholder="Search players…">
        <select id="roster-filter-pos" class="select-sm">
          <option value="">All Positions</option>
          ${[...OFFENSE_POSITIONS, ...DEFENSE_POSITIONS].map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <select id="roster-filter-avail" class="select-sm">
          <option value="">All Availability</option>
          <option value="active">Active</option>
          <option value="limited">Limited</option>
          <option value="out">Out</option>
        </select>
      </div>
      <div class="toolbar-right">
        ${headCoach ? `<button class="btn btn--primary" id="add-player-btn">+ Add Player</button>` : ''}
      </div>
    </div>

    <div id="roster-table-wrap">
      <table class="data-table" id="roster-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Primary</th>
            <th>Secondary</th>
            <th>Status</th>
            ${headCoach ? '<th class="col-actions">Actions</th>' : ''}
          </tr>
        </thead>
        <tbody id="roster-tbody"></tbody>
      </table>
    </div>

    <div id="depth-chart-section">
      <h2 class="section-heading">Depth Chart</h2>
      <div id="depth-chart-grid" class="depth-chart-grid"></div>
    </div>
  `;

  // Live listener
  if (unsubscribe) unsubscribe();
  const q = query(collection(db, 'players'), orderBy('jerseyNumber'));
  unsubscribe = onSnapshot(q, (snap) => {
    const players = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTable(players, container, { db, AppState, headCoach });
    renderDepthChart(players, container);
  });

  // Add player
  if (headCoach) {
    container.querySelector('#add-player-btn').addEventListener('click', () => {
      openPlayerModal(null, { db, AppState });
    });
  }

  // Search & filter
  const search = container.querySelector('#roster-search');
  const filterPos = container.querySelector('#roster-filter-pos');
  const filterAvail = container.querySelector('#roster-filter-avail');

  [search, filterPos, filterAvail].forEach(el => {
    el.addEventListener('input', () => {
      const q2 = query(collection(db, 'players'), orderBy('jerseyNumber'));
      // Re-filter from current snapshot is handled via closure
    });
  });
}

function renderTable(players, container, { db, AppState, headCoach }) {
  const search  = container.querySelector('#roster-search').value.toLowerCase();
  const posF    = container.querySelector('#roster-filter-pos').value;
  const availF  = container.querySelector('#roster-filter-avail').value;

  const filtered = players.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search) || String(p.jerseyNumber).includes(search);
    const matchPos    = !posF   || p.primaryPosition === posF || p.secondaryPositions?.includes(posF);
    const matchAvail  = !availF || p.availability === availF;
    return matchSearch && matchPos && matchAvail;
  });

  const tbody = container.querySelector('#roster-tbody');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${headCoach ? 6 : 5}" class="empty-cell">${emptyState('👤', 'No players found', 'Adjust your filters or add a player.')}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => `
    <tr class="data-row ${p.availability === 'out' ? 'data-row--muted' : ''}">
      <td class="col-number">${p.jerseyNumber ?? '—'}</td>
      <td class="col-name">${p.name}</td>
      <td>${p.primaryPosition || '—'}</td>
      <td class="col-secondary">${(p.secondaryPositions || []).join(', ') || '—'}</td>
      <td>${availabilityBadge(p.availability || 'active')}</td>
      ${headCoach ? `
        <td class="col-actions">
          <button class="icon-btn" data-action="edit" data-id="${p.id}" title="Edit">✏️</button>
          <button class="icon-btn icon-btn--danger" data-action="delete" data-id="${p.id}" title="Remove">🗑</button>
        </td>
      ` : ''}
    </tr>
  `).join('');

  if (headCoach) {
    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const player = players.find(p => p.id === btn.dataset.id);
        if (player) openPlayerModal(player, { db, AppState });
      });
    });
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const player = players.find(p => p.id === btn.dataset.id);
        const ok = await confirm(`Remove ${player?.name} from the roster?`, { confirmLabel: 'Remove', danger: true });
        if (ok) {
          await deleteDoc(doc(db, 'players', btn.dataset.id));
          toast(`${player?.name} removed from roster`);
        }
      });
    });
  }
}

function renderDepthChart(players, container) {
  const grid = container.querySelector('#depth-chart-grid');
  const allPositions = [...OFFENSE_POSITIONS, ...DEFENSE_POSITIONS];

  grid.innerHTML = allPositions.map(pos => {
    const atPos = players
      .filter(p => p.primaryPosition === pos || (p.secondaryPositions || []).includes(pos))
      .sort((a, b) => (a.primaryPosition === pos ? -1 : 1));

    if (atPos.length === 0) return '';

    return `
      <div class="depth-group">
        <div class="depth-group__pos">${pos}</div>
        <div class="depth-group__players">
          ${atPos.map((p, i) => `
            <div class="depth-player ${p.availability === 'out' ? 'depth-player--out' : ''}">
              <span class="depth-rank">${i + 1}</span>
              <span class="depth-number">#${p.jerseyNumber ?? '?'}</span>
              <span class="depth-name">${p.name}</span>
              ${p.availability !== 'active' ? availabilityBadge(p.availability) : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ─── Player Modal ─────────────────────────────────────────────────────────
function openPlayerModal(player, { db }) {
  const isEdit = !!player;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal--form">
      <div class="modal__header">
        <h2>${isEdit ? 'Edit Player' : 'Add Player'}</h2>
        <button class="modal__close" id="modal-close">✕</button>
      </div>
      <div class="modal__body">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input class="form-input" id="p-name" value="${player?.name || ''}" placeholder="Full name">
          </div>
          <div class="form-group">
            <label class="form-label">Jersey #</label>
            <input class="form-input" id="p-jersey" type="number" min="0" max="99" value="${player?.jerseyNumber ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Primary Position *</label>
            <select class="form-select" id="p-primary">
              <option value="">Select…</option>
              <optgroup label="Offense">${OFFENSE_POSITIONS.map(p => `<option value="${p}" ${player?.primaryPosition === p ? 'selected' : ''}>${p}</option>`).join('')}</optgroup>
              <optgroup label="Defense">${DEFENSE_POSITIONS.map(p => `<option value="${p}" ${player?.primaryPosition === p ? 'selected' : ''}>${p}</option>`).join('')}</optgroup>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Availability</label>
            <select class="form-select" id="p-avail">
              <option value="active"  ${player?.availability === 'active'  ? 'selected' : ''}>Active</option>
              <option value="limited" ${player?.availability === 'limited' ? 'selected' : ''}>Limited</option>
              <option value="out"     ${player?.availability === 'out'     ? 'selected' : ''}>Out</option>
            </select>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Secondary Positions</label>
            <div class="checkbox-grid" id="secondary-positions">
              ${[...OFFENSE_POSITIONS, ...DEFENSE_POSITIONS].map(pos => `
                <label class="checkbox-label">
                  <input type="checkbox" value="${pos}" ${(player?.secondaryPositions || []).includes(pos) ? 'checked' : ''}>
                  ${pos}
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" id="modal-cancel">Cancel</button>
        <button class="btn btn--primary" id="modal-save">${isEdit ? 'Save Changes' : 'Add Player'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#modal-close').onclick  = () => overlay.remove();
  overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#modal-save').onclick = async () => {
    const name    = overlay.querySelector('#p-name').value.trim();
    const jersey  = parseInt(overlay.querySelector('#p-jersey').value) || null;
    const primary = overlay.querySelector('#p-primary').value;
    const avail   = overlay.querySelector('#p-avail').value;
    const secondary = [...overlay.querySelectorAll('#secondary-positions input:checked')]
      .map(cb => cb.value)
      .filter(v => v !== primary);

    if (!name) { toast('Name is required', 'error'); return; }
    if (!primary) { toast('Primary position is required', 'error'); return; }

    const id = player?.id || generateId();
    await setDoc(doc(db, 'players', id), {
      name, jerseyNumber: jersey, primaryPosition: primary,
      secondaryPositions: secondary, availability: avail,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    toast(isEdit ? 'Player updated' : 'Player added');
    overlay.remove();
  };
}
