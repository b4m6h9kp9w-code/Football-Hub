// ─── Toast Notifications ──────────────────────────────────────────────────
let toastQueue = [];

export function toast(message, type = 'success', duration = 3000) {
  const container = getOrCreateToastContainer();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  container.appendChild(el);

  requestAnimationFrame(() => el.classList.add('toast--visible'));

  setTimeout(() => {
    el.classList.remove('toast--visible');
    el.addEventListener('transitionend', () => el.remove());
  }, duration);
}

function getOrCreateToastContainer() {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────
export function confirm(message, { confirmLabel = 'Confirm', danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal modal--confirm">
        <p class="modal__message">${message}</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" id="confirm-cancel">Cancel</button>
          <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" id="confirm-ok">${confirmLabel}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
  });
}

// ─── Position Helpers ─────────────────────────────────────────────────────
export const OFFENSE_POSITIONS = ['QB', 'RB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];
export const DEFENSE_POSITIONS = ['DE', 'DT', 'NT', 'MLB', 'OLB', 'ILB', 'CB', 'FS', 'SS', 'NB'];
export const ALL_POSITIONS = [...OFFENSE_POSITIONS, ...DEFENSE_POSITIONS];

export const POSITION_GROUPS = {
  'Offense': OFFENSE_POSITIONS,
  'Defense': DEFENSE_POSITIONS,
};

// ─── Availability Badge ───────────────────────────────────────────────────
export function availabilityBadge(status) {
  const map = {
    active:  { label: 'Active',   cls: 'badge--green'  },
    limited: { label: 'Limited',  cls: 'badge--yellow' },
    out:     { label: 'Out',      cls: 'badge--red'    },
  };
  const s = map[status] || map.active;
  return `<span class="badge ${s.cls}">${s.label}</span>`;
}

// ─── Date Formatting ──────────────────────────────────────────────────────
export function relativeTime(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Firestore helpers ────────────────────────────────────────────────────
export function generateId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// ─── Role Guards ──────────────────────────────────────────────────────────
export function isHeadCoach(AppState) {
  return AppState.userRole === 'head_coach';
}

export function canEdit(AppState) {
  return ['head_coach', 'assistant'].includes(AppState.userRole);
}

// ─── Empty State Helper ───────────────────────────────────────────────────
export function emptyState(icon, title, message, actionHtml = '') {
  return `
    <div class="empty-state">
      <div class="empty-state__icon">${icon}</div>
      <h3 class="empty-state__title">${title}</h3>
      <p class="empty-state__message">${message}</p>
      ${actionHtml}
    </div>
  `;
}

// ─── Debounce ─────────────────────────────────────────────────────────────
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
