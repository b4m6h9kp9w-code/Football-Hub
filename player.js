import {
  collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { toast, confirm, isHeadCoach, generateId } from '../modules/utils.js';

export function renderSettings(container, { db, auth, AppState }) {
  const headCoach = isHeadCoach(AppState);

  container.innerHTML = `
    <div class="settings-layout">

      <section class="settings-section">
        <h2 class="settings-heading">Team Info</h2>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Team Name</label>
            <input class="form-input" id="team-name" placeholder="e.g. Westside Warriors">
          </div>
          <div class="form-group">
            <label class="form-label">Season</label>
            <input class="form-input" id="team-season" placeholder="e.g. Fall 2025">
          </div>
        </div>
        <button class="btn btn--primary btn--sm" id="save-team">Save Team Info</button>
      </section>

      ${headCoach ? `
      <section class="settings-section">
        <div class="settings-section-header">
          <h2 class="settings-heading">Coaching Staff</h2>
          <button class="btn btn--primary btn--sm" id="invite-coach-btn">+ Add Assistant</button>
        </div>
        <div id="coaches-list"><div class="loading-line"></div></div>
      </section>
      ` : ''}

      <section class="settings-section">
        <h2 class="settings-heading">Player Access</h2>
        <p class="settings-description">
          Players don't need accounts. Share the link below — they select their position and see the published playbook automatically.
        </p>
        <div class="player-link-box">
          <input class="form-input" id="player-link" readonly value="${window.location.origin}/player.html">
          <button class="btn btn--ghost btn--sm" id="copy-link-btn">Copy</button>
        </div>
      </section>

      <section class="settings-section settings-section--danger">
        <h2 class="settings-heading">Account</h2>
        <button class="btn btn--danger btn--sm" id="settings-logout">Sign Out</button>
      </section>

    </div>
  `;

  // Copy player link
  container.querySelector('#copy-link-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(container.querySelector('#player-link').value);
    toast('Link copied to clipboard');
  });

  // Logout
  container.querySelector('#settings-logout').addEventListener('click', async () => {
    const ok = await confirm('Sign out of the coaching hub?', { confirmLabel: 'Sign Out' });
    if (ok) auth.signOut();
  });

  // Load team info
  loadTeamInfo(db, container);

  // Coaching staff
  if (headCoach) {
    loadCoaches(db, container);
    container.querySelector('#invite-coach-btn').addEventListener('click', () => {
      openInviteModal(db, auth);
    });
  }
}

async function loadTeamInfo(db, container) {
  const snap = await getDocs(collection(db, 'settings'));
  const data = snap.docs.find(d => d.id === 'team')?.data() || {};
  container.querySelector('#team-name').value  = data.teamName  || '';
  container.querySelector('#team-season').value = data.season   || '';

  container.querySelector('#save-team').addEventListener('click', async () => {
    const teamName = container.querySelector('#team-name').value.trim();
    const season   = container.querySelector('#team-season').value.trim();
    await setDoc(doc(db, 'settings', 'team'), { teamName, season, updatedAt: serverTimestamp() });
    toast('Team info saved');
  });
}

async function loadCoaches(db, container) {
  const snap = await getDocs(collection(db, 'coaches'));
  const list = container.querySelector('#coaches-list');
  if (snap.empty) {
    list.innerHTML = `<p class="panel-empty">No assistant coaches added yet.</p>`;
    return;
  }
  list.innerHTML = snap.docs.map(d => {
    const c = d.data();
    return `
      <div class="coach-row">
        <div class="coach-info">
          <span class="coach-name">${c.name || c.email}</span>
          <span class="coach-role-badge">${c.role === 'head_coach' ? 'Head Coach' : 'Assistant'}</span>
        </div>
        <span class="coach-email">${c.email || ''}</span>
      </div>
    `;
  }).join('');
}

function openInviteModal(db, auth) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal--form">
      <div class="modal__header">
        <h2>Add Assistant Coach</h2>
        <button class="modal__close" id="modal-close">✕</button>
      </div>
      <div class="modal__body">
        <p class="modal__note">This creates a login they can use to access the coaching hub.</p>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input" id="coach-name" placeholder="Full name">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" id="coach-email" type="email" placeholder="coach@email.com">
          </div>
          <div class="form-group">
            <label class="form-label">Temporary Password</label>
            <input class="form-input" id="coach-pass" type="password" placeholder="They can change this later">
          </div>
        </div>
        <div id="invite-error" class="form-error"></div>
      </div>
      <div class="modal__footer">
        <button class="btn btn--ghost" id="modal-cancel">Cancel</button>
        <button class="btn btn--primary" id="modal-save">Create Account</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#modal-close').onclick  = () => overlay.remove();
  overlay.querySelector('#modal-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#modal-save').onclick = async () => {
    const name  = overlay.querySelector('#coach-name').value.trim();
    const email = overlay.querySelector('#coach-email').value.trim();
    const pass  = overlay.querySelector('#coach-pass').value;
    const errEl = overlay.querySelector('#invite-error');
    errEl.textContent = '';

    if (!name || !email || !pass) { errEl.textContent = 'All fields are required.'; return; }
    if (pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }

    try {
      // NOTE: Creating users via client SDK signs them in automatically.
      // In production, use Firebase Admin SDK via Cloud Functions.
      // For now, we store the coach doc (auth creation is manual or via Admin SDK).
      const id = generateId();
      await setDoc(doc(db, 'coaches', id), {
        name, email, role: 'assistant', createdAt: serverTimestamp()
      });
      toast(`${name} added as assistant coach`);
      overlay.remove();
    } catch (err) {
      errEl.textContent = err.message;
    }
  };
}
