import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, where
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { toast, confirm, generateId, isHeadCoach, emptyState } from '../modules/utils.js';

let unsubscribe = null;
let activeOpponentId = null;
let publishedPlays = [];

export function renderOpponents(container, { db, AppState }) {
  const headCoach = isHeadCoach(AppState);

  container.innerHTML = `
    <div class="opponents-layout">
      <div class="opponents-sidebar">
        <div class="opponents-sidebar-header">
          <span class="opponents-sidebar-title">Opponents</span>
          ${headCoach ? `<button class="btn btn--primary btn--sm" id="opp-new-btn">+ Add</button>` : ''}
        </div>
        <div id="opp-list" class="opp-list"></div>
      </div>
      <div class="opponents-main" id="opponents-main">
        <div class="coming-soon" style="min-height:400px">
          <div style="font-size:40px;opacity:.3">🎯</div>
          <p>Select or add an opponent</p>
        </div>
      </div>
    </div>
  `;

  getDocs(query(collection(db, 'plays'), where('status', '==', 'published'), orderBy('name'))).then(snap => {
    publishedPlays = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  if (unsubscribe) unsubscribe();
  unsubscribe = onSnapshot(
    query(collection(db, 'opponents'), orderBy('name')),
    snap => {
      const opponents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderOppList(opponents, container, { db, AppState, headCoach });
      if (activeOpponentId) {
        const opp = opponents.find(o => o.id === activeOpponentId);
        if (opp) renderOppDetail(opp, container, { db, AppState, headCoach });
      }
    }
  );

  if (headCoach) {
    container.querySelector('#opp-new-btn').addEventListener('click', () => openOppModal(null, { db }));
  }
}

function renderOppList(opponents, container, { db, AppState, headCoach }) {
  const list = container.querySelector('#opp-list');
  if (opponents.length === 0) {
    list.innerHTML = `<div class="opp-list-empty">No opponents added</div>`;
    return;
  }
  list.innerHTML = opponents.map(o => `
    <div class="opp-list-item ${activeOpponentId === o.id ? 'active' : ''}" data-id="${o.id}">
      <span class="opp-list-item__name">${o.name}</span>
      ${o.record ? `<span class="opp-list-item__record">${o.record}</span>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.opp-list-item').forEach(item => {
    item.addEventListener('click', () => {
      activeOpponentId = item.dataset.id;
      list.querySelectorAll('.opp-list-item').forEach(i => i.classList.toggle('active', i.dataset.id === activeOpponentId));
      const opp = opponents.find(o => o.id === activeOpponentId);
      if (opp) renderOppDetail(opp, container, { db, AppState, headCoach });
    });
  });
}

function renderOppDetail(opp, container, { db, AppState, headCoach }) {
  const main = container.querySelector('#opponents-main');
  const assocPlays = opp.associatedPlays || [];

  main.innerHTML = `
    <div class="opp-detail">
      <div class="opp-detail-header">
        <div>
          <h2 class="opp-detail-name">${opp.name}</h2>
          ${opp.record ? `<span class="opp-detail-record">${opp.record}</span>` : ''}
        </div>
        ${headCoach ? `
          <div style="display:flex;gap:8px">
            <button class="btn btn--ghost btn--sm" id="opp-edit-btn">Edit</button>
            <button class="btn btn--danger btn--sm" id="opp-delete-btn">Delete</button>
          </div>
        ` : ''}
      </div>

      <div class="opp-sections">
        <div class="opp-section">
          <h3 class="opp-section-title">Tendencies</h3>
          ${headCoach
            ? `<textarea class="form-input" id="opp-tendencies" rows="4" placeholder="Offensive tendencies, defensive schemes, key players…">${opp.tendencies || ''}</textarea>`
            : `<p class="opp-text">${opp.tendencies || 'No tendencies noted.'}</p>`
          }
        </div>

        <div class="opp-section">
          <h3 class="opp-section-title">Coach Notes</h3>
          ${headCoach
            ? `<textarea class="form-input" id="opp-notes" rows="4" placeholder="Game plan notes, matchup concerns…">${opp.coachNotes || ''}</textarea>`
            : `<p class="opp-text">${opp.coachNotes || 'No notes.'}</p>`
          }
        </div>

        <div class="opp-section">
          <div class="opp-section-header-row">
            <h3 class="opp-section-title">Associated Plays</h3>
            ${headCoach ? `<button class="btn btn--ghost btn--sm" id="opp-add-play">+ Add Play</button>` : ''}
          </div>
          <div class="opp-plays-list">
            ${assocPlays.length === 0
              ? `<p class="opp-empty-plays">No plays associated yet.</p>`
              : assocPlays.map((p, i) => `
                <div class="opp-play-row">
                  <div class="opp-play-info">
                    <span class="opp-play-name">${p.playName}</span>
                    ${p.note ? `<span class="opp-play-note">${p.note}</span>` : ''}
                  </div>
                  ${headCoach ? `<button class="icon-btn icon-btn--danger" data-remove-play="${i}">✕</button>` : ''}
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    </div>
  `;

  if (headCoach) {
    let saveTimer;
    const schedSave = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        const tendencies = main.querySelector('#opp-tendencies')?.value || '';
        const coachNotes = main.querySelector('#opp-notes')?.value || '';
        await updateDoc(doc(db, 'opponents', opp.id), { tendencies, coachNotes, updatedAt: serverTimestamp() });
      }, 1500);
    };
    main.querySelector('#opp-tendencies')?.addEventListener('input', schedSave);
    main.querySelector('#opp-notes')?.addEventListener('input', schedSave);

    main.querySelector('#opp-edit-btn').addEventListener('click', () => openOppModal(opp, { db }));

    main.querySelector('#opp-delete-btn').addEventListener('click', async () => {
      const ok = await confirm(`Delete ${opp.name}? This cannot be undone.`, { confirmLabel: 'Delete', danger: true });
      if (!ok) return;
      await deleteDoc(doc(db, 'opponents', opp.id));
      activeOpponentId = null;
      container.querySelector('#opponents-main').innerHTML = `<div class="coming-soon" style="min-height:400px"><div style="font-size:40px;opacity:.3">🎯</div><p>Select or add an opponent</p></div>`;
      toast('Opponent deleted');
    });

    main.querySelector('#opp-add-play')?.addEventListener('click', () => {
      openAssocPlayModal(opp, container, { db });
    });

    main.querySelectorAll('[data-remove-play]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.removePlay);
        const updated = [...assocPlays];
        updated.splice(idx, 1);
        await updateDoc(doc(db, 'opponents', opp.id), { associatedPlays: updated, updatedAt: serverTimestamp() });
        toast('Play removed');
      });
    });
  }
}

function openOppModal(opp, { db }) {
  const isEdit = !!opp;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal--form" style="max-width:420px">
      <div class="modal__header">
        <h2>${isEdit ? 'Edit Opponent' : 'Add Opponent'}</h2>
        <button class="modal__close" id="om-close">✕</button>
      </div>
      <div class="modal__body">
        <div class="form-grid" style="grid-template-columns:1fr">
          <div class="form-group">
            <label class="form-label">Team Name *</label>
            <input class="form-input" id="om-name" value="${opp?.name || ''}" placeholder="e.g. Eastside Eagles">
          </div>
          <div class="form-group">
            <label class="form-label">Record</label>
            <input class="form-input" id="om-record" value="${opp?.record || ''}" placeholder="e.g. 3-1">
          </div>
        </div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" id="om-cancel">Cancel</button>
        <button class="btn btn--primary" id="om-save">${isEdit ? 'Save' : 'Add Opponent'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#om-close').onclick  = () => overlay.remove();
  overlay.querySelector('#om-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#om-save').onclick = async () => {
    const name   = overlay.querySelector('#om-name').value.trim();
    const record = overlay.querySelector('#om-record').value.trim();
    if (!name) { toast('Team name is required', 'error'); return; }
    const id = opp?.id || generateId();
    await setDoc(doc(db, 'opponents', id), {
      name, record,
      tendencies: opp?.tendencies || '',
      coachNotes: opp?.coachNotes || '',
      associatedPlays: opp?.associatedPlays || [],
      createdAt: opp?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    toast(isEdit ? 'Opponent updated' : 'Opponent added');
    overlay.remove();
  };
}

function openAssocPlayModal(opp, container, { db }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal--form" style="max-width:420px">
      <div class="modal__header">
        <h2>Associate a Play</h2>
        <button class="modal__close" id="ap2-close">✕</button>
      </div>
      <div class="modal__body">
        <div class="form-group">
          <label class="form-label">Play</label>
          <select class="form-select" id="ap2-select">
            <option value="">Choose a published play…</option>
            ${publishedPlays.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Note (optional)</label>
          <input class="form-input" id="ap2-note" placeholder="e.g. Good vs. their zone coverage">
        </div>
        ${publishedPlays.length === 0 ? `<p class="form-error">No published plays yet.</p>` : ''}
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" id="ap2-cancel">Cancel</button>
        <button class="btn btn--primary" id="ap2-add">Associate</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#ap2-close').onclick  = () => overlay.remove();
  overlay.querySelector('#ap2-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#ap2-add').onclick = async () => {
    const sel    = overlay.querySelector('#ap2-select');
    const playId = sel.value;
    if (!playId) { toast('Select a play', 'error'); return; }
    const playName = sel.selectedOptions[0].dataset.name;
    const note     = overlay.querySelector('#ap2-note').value.trim();
    const updated  = [...(opp.associatedPlays || []), { playId, playName, note }];
    await updateDoc(doc(db, 'opponents', opp.id), { associatedPlays: updated, updatedAt: serverTimestamp() });
    toast('Play associated');
    overlay.remove();
  };
}
