import {
  collection, query, where, orderBy, onSnapshot, getDocs,
  doc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { toast, confirm, generateId, isHeadCoach, emptyState } from '../modules/utils.js';

const SECTIONS = ['Opening Script', 'Run Game', 'Pass Game', 'Red Zone', 'Goal Line', 'Situational', 'Specials'];

let unsubGP = null;
let allGamePlans = [];
let publishedPlays = [];
let activeGPId = null;

export function renderGamePlans(container, { db, AppState }) {
  const headCoach = isHeadCoach(AppState);

  container.innerHTML = `
    <div class="gp-layout">
      <div class="gp-sidebar">
        <div class="gp-sidebar-header">
          <span class="gp-sidebar-title">Game Plans</span>
          ${headCoach ? `<button class="btn btn--primary btn--sm" id="gp-new-btn">+ New</button>` : ''}
        </div>
        <div id="gp-list" class="gp-list"></div>
      </div>
      <div class="gp-main" id="gp-main">
        <div class="coming-soon" style="min-height:400px">
          <div style="font-size:40px;opacity:.3">📅</div>
          <p>Select or create a game plan</p>
        </div>
      </div>
    </div>
  `;

  // Load published plays for adding to game plans
  getDocs(query(collection(db, 'plays'), where('status', '==', 'published'), orderBy('name'))).then(snap => {
    publishedPlays = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  if (unsubGP) unsubGP();
  unsubGP = onSnapshot(
    query(collection(db, 'game_plans'), orderBy('createdAt', 'desc')),
    snap => {
      allGamePlans = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderGPList(container, { db, AppState, headCoach });
      if (activeGPId) {
        const gp = allGamePlans.find(g => g.id === activeGPId);
        if (gp) renderGPDetail(gp, container, { db, AppState, headCoach });
      }
    }
  );

  if (headCoach) {
    container.querySelector('#gp-new-btn').addEventListener('click', () => openNewGPModal({ db, AppState }));
  }
}

function renderGPList(container, { db, AppState, headCoach }) {
  const list = container.querySelector('#gp-list');
  if (allGamePlans.length === 0) {
    list.innerHTML = `<div class="gp-list-empty">No game plans yet</div>`;
    return;
  }
  list.innerHTML = allGamePlans.map(gp => `
    <div class="gp-list-item ${activeGPId === gp.id ? 'active' : ''}" data-id="${gp.id}">
      <div class="gp-list-item__name">${gp.name || 'Untitled'}</div>
      <div class="gp-list-item__meta">
        ${gp.opponent ? `<span>vs. ${gp.opponent}</span>` : ''}
        ${gp.current ? `<span class="badge badge--green" style="font-size:9px">CURRENT</span>` : ''}
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.gp-list-item').forEach(item => {
    item.addEventListener('click', () => {
      activeGPId = item.dataset.id;
      list.querySelectorAll('.gp-list-item').forEach(i => i.classList.toggle('active', i.dataset.id === activeGPId));
      const gp = allGamePlans.find(g => g.id === activeGPId);
      if (gp) renderGPDetail(gp, container, { db, AppState, headCoach });
    });
  });
}

function renderGPDetail(gp, container, { db, AppState, headCoach }) {
  const main = container.querySelector('#gp-main');
  main.innerHTML = `
    <div class="gp-detail">
      <div class="gp-detail-header">
        <div class="gp-detail-header-left">
          <input class="gp-title-input" id="gp-name" value="${gp.name || ''}" placeholder="Game Plan Name" ${headCoach ? '' : 'readonly'}>
          <input class="gp-subtitle-input" id="gp-opponent" value="${gp.opponent || ''}" placeholder="Opponent" ${headCoach ? '' : 'readonly'}>
        </div>
        <div class="gp-detail-header-right">
          ${headCoach ? `
            <button class="btn ${gp.current ? 'btn--ghost' : 'btn--primary'} btn--sm" id="gp-set-current">
              ${gp.current ? '✓ Current Plan' : 'Set as Current'}
            </button>
            <button class="btn btn--danger btn--sm" id="gp-delete">Delete</button>
          ` : gp.current ? `<span class="badge badge--green">Current Game Plan</span>` : ''}
        </div>
      </div>

      <div class="gp-notes-row">
        <div class="form-group" style="flex:1">
          <label class="form-label">Coach Notes <span style="color:var(--signal);font-size:10px">PRIVATE</span></label>
          <textarea class="form-input" id="gp-coach-notes" rows="2" placeholder="Coaching strategy…" ${headCoach ? '' : 'readonly'}>${gp.coachNotes || ''}</textarea>
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Player Notes <span style="color:var(--go);font-size:10px">VISIBLE TO PLAYERS</span></label>
          <textarea class="form-input" id="gp-player-notes" rows="2" placeholder="Week's focus, key points…" ${headCoach ? '' : 'readonly'}>${gp.playerNotes || ''}</textarea>
        </div>
      </div>

      <div class="gp-sections" id="gp-sections">
        ${SECTIONS.map(section => renderSection(section, gp, headCoach)).join('')}
      </div>
    </div>
  `;

  // Auto-save on text changes
  if (headCoach) {
    let saveTimer;
    const schedSave = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveGP(gp.id, container, db), 1500);
    };
    main.querySelector('#gp-name').addEventListener('input', schedSave);
    main.querySelector('#gp-opponent').addEventListener('input', schedSave);
    main.querySelector('#gp-coach-notes').addEventListener('input', schedSave);
    main.querySelector('#gp-player-notes').addEventListener('input', schedSave);

    main.querySelector('#gp-set-current').addEventListener('click', async () => {
      // Unset all others
      for (const g of allGamePlans) {
        if (g.current) await updateDoc(doc(db, 'game_plans', g.id), { current: false });
      }
      await updateDoc(doc(db, 'game_plans', gp.id), { current: true });
      toast('Set as current game plan ✓');
    });

    main.querySelector('#gp-delete').addEventListener('click', async () => {
      const ok = await confirm(`Delete "${gp.name}"? This cannot be undone.`, { confirmLabel: 'Delete', danger: true });
      if (!ok) return;
      await deleteDoc(doc(db, 'game_plans', gp.id));
      activeGPId = null;
      container.querySelector('#gp-main').innerHTML = `<div class="coming-soon" style="min-height:400px"><div style="font-size:40px;opacity:.3">📅</div><p>Select or create a game plan</p></div>`;
      toast('Game plan deleted');
    });

    // Add play buttons
    main.querySelectorAll('[data-add-section]').forEach(btn => {
      btn.addEventListener('click', () => openAddPlayModal(gp, btn.dataset.addSection, container, { db, AppState }));
    });

    // Remove play buttons
    main.querySelectorAll('[data-remove-play]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const section = btn.dataset.section;
        const idx = parseInt(btn.dataset.idx);
        const updatedPlays = [...(gp.plays?.[section] || [])];
        updatedPlays.splice(idx, 1);
        const plays = { ...(gp.plays || {}), [section]: updatedPlays };
        await updateDoc(doc(db, 'game_plans', gp.id), { plays, updatedAt: serverTimestamp() });
        toast('Play removed');
      });
    });
  }
}

function renderSection(section, gp, headCoach) {
  const sectionPlays = gp.plays?.[section] || [];
  const isScript = section === 'Opening Script';

  return `
    <div class="gp-section">
      <div class="gp-section-header">
        <h3 class="gp-section-title">${section}</h3>
        ${headCoach ? `<button class="btn btn--ghost btn--sm" data-add-section="${section}">+ Add Play</button>` : ''}
      </div>
      <div class="gp-section-plays">
        ${sectionPlays.length === 0
          ? `<div class="gp-section-empty">No plays added</div>`
          : sectionPlays.map((entry, idx) => `
            <div class="gp-play-row">
              ${isScript ? `<span class="gp-play-order">${idx + 1}</span>` : ''}
              <div class="gp-play-info">
                <span class="gp-play-name">${entry.playName || '—'}</span>
                <span class="gp-play-formation">${entry.formation || ''}</span>
              </div>
              ${entry.note ? `<span class="gp-play-note">${entry.note}</span>` : ''}
              ${headCoach ? `<button class="icon-btn icon-btn--danger" data-remove-play data-section="${section}" data-idx="${idx}">✕</button>` : ''}
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}

async function saveGP(gpId, container, db) {
  const main = container.querySelector('#gp-main');
  const name        = main.querySelector('#gp-name')?.value || '';
  const opponent    = main.querySelector('#gp-opponent')?.value || '';
  const coachNotes  = main.querySelector('#gp-coach-notes')?.value || '';
  const playerNotes = main.querySelector('#gp-player-notes')?.value || '';
  await updateDoc(doc(db, 'game_plans', gpId), { name, opponent, coachNotes, playerNotes, updatedAt: serverTimestamp() });
}

function openAddPlayModal(gp, section, container, { db }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal--form" style="max-width:460px">
      <div class="modal__header">
        <h2>Add Play to ${section}</h2>
        <button class="modal__close" id="ap-close">✕</button>
      </div>
      <div class="modal__body">
        <div class="form-group">
          <label class="form-label">Select Play</label>
          <select class="form-select" id="ap-play-select">
            <option value="">Choose a published play…</option>
            <optgroup label="Offense">${publishedPlays.filter(p=>p.side==='offense').map(p=>`<option value="${p.id}" data-name="${p.name}" data-formation="${p.formation||''}">${p.name}${p.formation ? ` — ${p.formation}` : ''}</option>`).join('')}</optgroup>
            <optgroup label="Defense">${publishedPlays.filter(p=>p.side==='defense').map(p=>`<option value="${p.id}" data-name="${p.name}" data-formation="${p.formation||''}">${p.name}${p.formation ? ` — ${p.formation}` : ''}</option>`).join('')}</optgroup>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Note (optional)</label>
          <input class="form-input" id="ap-note" placeholder="e.g. vs. man coverage">
        </div>
        ${publishedPlays.length === 0 ? `<p class="form-error">No published plays yet. Publish plays in the Play Library first.</p>` : ''}
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" id="ap-cancel">Cancel</button>
        <button class="btn btn--primary" id="ap-add">Add to ${section}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#ap-close').onclick  = () => overlay.remove();
  overlay.querySelector('#ap-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#ap-add').onclick = async () => {
    const sel = overlay.querySelector('#ap-play-select');
    const playId = sel.value;
    if (!playId) { toast('Select a play first', 'error'); return; }
    const opt = sel.selectedOptions[0];
    const note = overlay.querySelector('#ap-note').value.trim();

    const sectionPlays = [...(gp.plays?.[section] || [])];
    sectionPlays.push({ playId, playName: opt.dataset.name, formation: opt.dataset.formation, note });
    const plays = { ...(gp.plays || {}), [section]: sectionPlays };
    await updateDoc(doc(db, 'game_plans', gp.id), { plays, updatedAt: serverTimestamp() });
    toast(`Play added to ${section}`);
    overlay.remove();
  };
}

function openNewGPModal({ db }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal--form" style="max-width:420px">
      <div class="modal__header">
        <h2>New Game Plan</h2>
        <button class="modal__close" id="ng-close">✕</button>
      </div>
      <div class="modal__body">
        <div class="form-grid" style="grid-template-columns:1fr">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input" id="ng-name" placeholder="e.g. Week 3 vs Eagles">
          </div>
          <div class="form-group">
            <label class="form-label">Opponent</label>
            <input class="form-input" id="ng-opponent" placeholder="Opponent team name">
          </div>
          <div class="form-group">
            <label class="form-label">Game Date</label>
            <input class="form-input" id="ng-date" type="date">
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" id="ng-cancel">Cancel</button>
        <button class="btn btn--primary" id="ng-create">Create</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#ng-close').onclick  = () => overlay.remove();
  overlay.querySelector('#ng-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#ng-create').onclick = async () => {
    const name     = overlay.querySelector('#ng-name').value.trim();
    const opponent = overlay.querySelector('#ng-opponent').value.trim();
    const gameDate = overlay.querySelector('#ng-date').value;
    if (!name) { toast('Name is required', 'error'); return; }
    const id = generateId();
    await setDoc(doc(db, 'game_plans', id), {
      id, name, opponent, gameDate, plays: {}, coachNotes: '', playerNotes: '',
      current: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    activeGPId = id;
    toast('Game plan created');
    overlay.remove();
  };
}
