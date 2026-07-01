import {
  collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, setDoc, serverTimestamp, getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { toast, confirm, generateId, isHeadCoach, emptyState, debounce } from '../modules/utils.js';
import { navigate } from '../app.js';
import { renderPlayThumbnail } from './play-thumbnail.js';

const SITUATION_TAGS = ['Base', 'Red Zone', 'Goal Line', 'Short Yardage', 'Two Minute', 'Third and Long'];
const PLAY_TYPES_OFF = ['Run', 'Pass', 'Screen', 'Play Action', 'RPO'];
const PLAY_TYPES_DEF = ['Base Defense', 'Blitz', 'Zone', 'Man', 'Prevent'];

let unsubscribe = null;
let allPlays = [];

export function renderPlayLibrary(container, { db, AppState }) {
  const headCoach = isHeadCoach(AppState);

  container.innerHTML = `
    <div class="library-layout">
      <div class="library-filters">
        <div class="lib-tabs">
          <button class="lib-tab active" data-side="all">All</button>
          <button class="lib-tab" data-side="offense">Offense</button>
          <button class="lib-tab" data-side="defense">Defense</button>
          <button class="lib-tab" data-side="archived">Archived</button>
        </div>
        <div class="lib-search-row">
          <input type="search" class="search-input" id="lib-search" placeholder="Search plays, formations, tags…" style="flex:1">
          <select class="select-sm" id="lib-type-filter">
            <option value="">All Types</option>
            ${[...PLAY_TYPES_OFF, ...PLAY_TYPES_DEF].map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
          <select class="select-sm" id="lib-tag-filter">
            <option value="">All Situations</option>
            ${SITUATION_TAGS.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div id="lib-pending-bar" class="pending-bar hidden"></div>
      </div>
      <div id="lib-grid" class="lib-grid"></div>
    </div>
  `;

  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(
    query(collection(db, 'plays'), orderBy('updatedAt', 'desc')),
    snap => {
      allPlays = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderLibrary(container, { db, AppState, headCoach });
      renderPendingBar(container, { db, AppState, headCoach });
    }
  );

  container.querySelectorAll('.lib-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.lib-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLibrary(container, { db, AppState, headCoach });
    });
  });

  const doSearch = debounce(() => renderLibrary(container, { db, AppState, headCoach }), 200);
  container.querySelector('#lib-search').addEventListener('input', doSearch);
  container.querySelector('#lib-type-filter').addEventListener('change', () => renderLibrary(container, { db, AppState, headCoach }));
  container.querySelector('#lib-tag-filter').addEventListener('change', () => renderLibrary(container, { db, AppState, headCoach }));
}

function renderPendingBar(container, { db, AppState, headCoach }) {
  if (!headCoach) return;
  const pending = allPlays.filter(p => p.status === 'pending_approval');
  const bar = container.querySelector('#lib-pending-bar');
  if (pending.length === 0) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  bar.innerHTML = `
    <span>⏳ ${pending.length} play${pending.length > 1 ? 's' : ''} awaiting your approval</span>
    <div class="pending-actions">
      ${pending.map(p => `
        <div class="pending-item">
          <span>${p.name}</span>
          <button class="btn btn--primary btn--sm" data-action="approve" data-id="${p.id}">Publish</button>
          <button class="btn btn--ghost btn--sm" data-action="reject" data-id="${p.id}">Send Back</button>
        </div>
      `).join('')}
    </div>
  `;

  bar.querySelectorAll('[data-action="approve"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await updateDoc(doc(db, 'plays', btn.dataset.id), { status: 'published', updatedAt: serverTimestamp() });
      toast('Play published ✓');
    });
  });

  bar.querySelectorAll('[data-action="reject"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await updateDoc(doc(db, 'plays', btn.dataset.id), { status: 'draft', updatedAt: serverTimestamp() });
      toast('Play sent back to draft');
    });
  });
}

function renderLibrary(container, { db, AppState, headCoach }) {
  const side    = container.querySelector('.lib-tab.active')?.dataset.side || 'all';
  const search  = container.querySelector('#lib-search').value.toLowerCase();
  const typeF   = container.querySelector('#lib-type-filter').value;
  const tagF    = container.querySelector('#lib-tag-filter').value;

  let filtered = allPlays.filter(p => {
    if (side === 'archived') return p.status === 'archived';
    if (side === 'all')     return ['published', 'draft', 'pending_approval'].includes(p.status);
    return p.side === side && ['published', 'draft', 'pending_approval'].includes(p.status);
  });

  if (search)  filtered = filtered.filter(p =>
    p.name?.toLowerCase().includes(search) ||
    p.formation?.toLowerCase().includes(search) ||
    p.tags?.some(t => t.toLowerCase().includes(search)) ||
    Object.values(p.playerNotes || {}).some(n => n?.toLowerCase().includes(search))
  );
  if (typeF) filtered = filtered.filter(p => p.playType === typeF);
  if (tagF)  filtered = filtered.filter(p => p.tags?.includes(tagF));

  const grid = container.querySelector('#lib-grid');

  if (filtered.length === 0) {
    grid.innerHTML = emptyState('📋', 'No plays found', 'Try adjusting your filters or create a new play in the Play Designer.');
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const statusCls = { published: 'badge--green', draft: 'badge--gray', pending_approval: 'badge--yellow', archived: 'badge--red' }[p.status] || 'badge--gray';
    return `
      <div class="play-lib-card" data-id="${p.id}">
        <div class="play-lib-card__diagram">
          ${renderPlayThumbnail(p)}
        </div>
        <div class="play-lib-card__body">
          <div class="play-lib-card__header">
            <span class="play-lib-card__name">${p.name || 'Untitled'}</span>
            <span class="badge ${statusCls}">${(p.status || 'draft').replace('_', ' ')}</span>
          </div>
          <div class="play-lib-card__meta">
            <span>${p.formation || 'No formation'}</span>
            <span>${p.playType || ''}</span>
          </div>
          ${p.tags?.length ? `<div class="play-lib-card__tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
        </div>
        <div class="play-lib-card__actions">
          <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${p.id}">Edit</button>
          <button class="btn btn--ghost btn--sm" data-action="duplicate" data-id="${p.id}">⧉</button>
          ${headCoach && p.status === 'published' ? `<button class="btn btn--ghost btn--sm" data-action="archive" data-id="${p.id}">Archive</button>` : ''}
          ${headCoach && p.status === 'archived'  ? `<button class="btn btn--ghost btn--sm" data-action="restore" data-id="${p.id}">Restore</button>` : ''}
          ${headCoach && p.status !== 'published' ? `<button class="btn btn--primary btn--sm" data-action="publish" data-id="${p.id}">Publish</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Edit → open in play designer
  grid.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      window._editPlayId = btn.dataset.id;
      navigate('play-designer');
    });
  });

  grid.querySelectorAll('[data-action="duplicate"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const p = allPlays.find(x => x.id === btn.dataset.id);
      if (!p) return;
      const id = generateId();
      await setDoc(doc(db, 'plays', id), { ...p, id, name: p.name + ' (Copy)', status: 'draft', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      toast('Play duplicated');
    });
  });

  grid.querySelectorAll('[data-action="archive"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm('Archive this play? It will be hidden from players but can be restored.', { confirmLabel: 'Archive' });
      if (ok) { await updateDoc(doc(db, 'plays', btn.dataset.id), { status: 'archived', updatedAt: serverTimestamp() }); toast('Play archived'); }
    });
  });

  grid.querySelectorAll('[data-action="restore"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await updateDoc(doc(db, 'plays', btn.dataset.id), { status: 'draft', updatedAt: serverTimestamp() });
      toast('Play restored to draft');
    });
  });

  grid.querySelectorAll('[data-action="publish"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm('Publish this play? It will become visible to players.', { confirmLabel: 'Publish' });
      if (ok) { await updateDoc(doc(db, 'plays', btn.dataset.id), { status: 'published', updatedAt: serverTimestamp() }); toast('Play published ✓'); }
    });
  });
}

  const playerDots = players.map(p => {
    const x = (p.x / 100) * W;
    const y = (p.y / 100) * H;
    const color = play.side === 'offense' ? '#4caf74' : '#d94f3d';
    return `<circle cx="${x}" cy="${y}" r="7" fill="${color}" stroke="#0f1b12" stroke-width="1.5"/>
            <text x="${x}" y="${y+3}" text-anchor="middle" font-size="5" fill="#fff" font-family="sans-serif" font-weight="bold">${p.pos}</text>`;
  }).join('');

  const routeLines = routes.map(r => {
    if (!r.points || r.points.length < 2) return '';
    const pts = r.points.map(p => `${(p.x/100)*W},${(p.y/100)*H}`).join(' ');
    const dash = r.tool === 'option' ? 'stroke-dasharray="3,4"' : '';
    return `<polyline points="${pts}" fill="none" stroke="${r.color || '#f0d04e'}" stroke-width="1.5" stroke-linecap="round" ${dash}/>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    <rect width="${W}" height="${H}" fill="#0f1b12"/>
    <line x1="0" y1="${H*0.52}" x2="${W}" y2="${H*0.52}" stroke="#e8c84b" stroke-width="1" stroke-dasharray="5,4" opacity="0.5"/>
    ${routeLines}
    ${playerDots}
  </svg>`;
}
