/* ═══════════════════════════════════════════════════════════════
   9V9 Football Hub — Design System
   Palette: deep turf + chalk white + signal yellow + alert red
   Type: Barlow Condensed (headings) + Inter (body) + JetBrains Mono (data)
   ═══════════════════════════════════════════════════════════════ */

/* ─── Tokens ─────────────────────────────────────────────────── */
:root {
  /* Core */
  --turf:        #0f1b12;   /* near-black with a green cast */
  --turf-mid:    #192b1d;
  --turf-light:  #243828;
  --turf-line:   #2f4a34;
  --chalk:       #f0f4f1;   /* field chalk white */
  --chalk-dim:   #9aaa9e;
  --chalk-muted: #5a6b5e;

  /* Accent */
  --signal:      #e8c84b;   /* scoreboard yellow */
  --signal-dim:  #a08c2a;
  --alert:       #d94f3d;   /* penalty red */
  --alert-dim:   #8a2d23;
  --go:          #4caf74;   /* first-down green */
  --go-dim:      #2c6644;

  /* Surface */
  --surface-0:   #131f16;
  --surface-1:   #1a2a1e;
  --surface-2:   #213328;
  --surface-3:   #283e30;
  --border:      #2f4a34;
  --border-light:#3a5c42;

  /* Type */
  --font-head:   'Barlow Condensed', sans-serif;
  --font-body:   'Inter', sans-serif;
  --font-mono:   'JetBrains Mono', monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* Radius */
  --r-sm:  4px;
  --r-md:  8px;
  --r-lg:  12px;

  /* Sidebar width */
  --sidebar-w: 220px;

  /* Transition */
  --t-fast: 120ms ease;
  --t-std:  220ms ease;
}

/* ─── Reset ──────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; -webkit-text-size-adjust: 100%; }

body {
  background: var(--surface-0);
  color: var(--chalk);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
}

a { color: var(--signal); text-decoration: none; }
a:hover { text-decoration: underline; }

img, svg { display: block; max-width: 100%; }

button { font: inherit; cursor: pointer; border: none; background: none; }
input, select, textarea { font: inherit; }

/* ─── Utility ────────────────────────────────────────────────── */
.hidden { display: none !important; }

/* ─── Auth Screen ────────────────────────────────────────────── */
.auth-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 59px,
      var(--turf-line) 59px,
      var(--turf-line) 60px
    ),
    var(--surface-0);
}

.auth-card {
  width: 100%;
  max-width: 380px;
  background: var(--surface-2);
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  padding: var(--space-8);
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.auth-brand__mark {
  font-family: var(--font-head);
  font-size: 28px;
  font-weight: 700;
  color: var(--signal);
  background: var(--turf-mid);
  border: 2px solid var(--signal);
  border-radius: var(--r-sm);
  padding: 4px 10px;
  letter-spacing: 1px;
}

.auth-brand__title {
  display: block;
  font-family: var(--font-head);
  font-size: 22px;
  font-weight: 700;
  color: var(--chalk);
  letter-spacing: 0.5px;
  line-height: 1;
}

.auth-brand__sub {
  display: block;
  font-size: 11px;
  color: var(--chalk-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.auth-form { display: flex; flex-direction: column; gap: var(--space-4); }

.auth-footer {
  margin-top: var(--space-6);
  text-align: center;
  font-size: 13px;
  color: var(--chalk-dim);
}

.auth-link { color: var(--signal); }

/* ─── App Shell ──────────────────────────────────────────────── */
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ─── Sidebar ────────────────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--surface-1);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  transition: transform var(--t-std);
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.sidebar__mark {
  font-family: var(--font-head);
  font-size: 18px;
  font-weight: 700;
  color: var(--signal);
  background: var(--turf-mid);
  border: 1.5px solid var(--signal);
  border-radius: var(--r-sm);
  padding: 2px 7px;
  letter-spacing: 1px;
}

.sidebar__title {
  font-family: var(--font-head);
  font-size: 16px;
  font-weight: 600;
  color: var(--chalk);
  letter-spacing: 0.3px;
}

.main-nav {
  flex: 1;
  padding: var(--space-3) 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-5);
  width: 100%;
  text-align: left;
  color: var(--chalk-dim);
  font-size: 13px;
  font-weight: 500;
  border-radius: 0;
  transition: background var(--t-fast), color var(--t-fast);
}

.nav-item:hover {
  background: var(--surface-3);
  color: var(--chalk);
}

.nav-item.active {
  background: var(--turf-light);
  color: var(--signal);
  border-right: 3px solid var(--signal);
}

.nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.nav-label { font-family: var(--font-head); font-size: 15px; letter-spacing: 0.3px; }

.sidebar__footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.user-info { display: flex; flex-direction: column; gap: 2px; }
.user-name  { font-size: 13px; font-weight: 600; color: var(--chalk); }
.user-role  { font-size: 11px; color: var(--chalk-muted); text-transform: uppercase; letter-spacing: 0.5px; }

.logout-btn {
  font-size: 12px;
  color: var(--chalk-muted);
  text-align: left;
  padding: var(--space-1) 0;
  transition: color var(--t-fast);
}
.logout-btn:hover { color: var(--alert); }

/* ─── Main Area ──────────────────────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  background: var(--surface-1);
  border-bottom: 1px solid var(--border);
  height: 56px;
  flex-shrink: 0;
}

.menu-toggle {
  font-size: 20px;
  color: var(--chalk-dim);
  display: none;
  padding: var(--space-2);
}

.page-title {
  font-family: var(--font-head);
  font-size: 22px;
  font-weight: 700;
  color: var(--chalk);
  letter-spacing: 0.5px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}

/* ─── Toolbar ────────────────────────────────────────────────── */
.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.toolbar-left  { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.toolbar-right { display: flex; align-items: center; gap: var(--space-3); }

/* ─── Forms ──────────────────────────────────────────────────── */
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-group--full { grid-column: 1 / -1; }

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--chalk-dim);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.form-input, .form-select {
  background: var(--surface-0);
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  color: var(--chalk);
  padding: var(--space-2) var(--space-3);
  font-size: 14px;
  transition: border-color var(--t-fast);
  width: 100%;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--signal);
}

.form-input::placeholder { color: var(--chalk-muted); }

.form-error {
  color: var(--alert);
  font-size: 13px;
  min-height: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.search-input {
  background: var(--surface-0);
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  color: var(--chalk);
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  width: 220px;
}

.search-input:focus { outline: none; border-color: var(--signal); }

.select-sm {
  background: var(--surface-0);
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  color: var(--chalk);
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
}

.select-sm:focus { outline: none; border-color: var(--signal); }

/* ─── Buttons ────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-weight: 600;
  transition: background var(--t-fast), color var(--t-fast), opacity var(--t-fast);
  white-space: nowrap;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn--primary  { background: var(--signal); color: var(--turf); }
.btn--primary:hover  { background: #f0d04e; }

.btn--ghost    { background: transparent; border: 1px solid var(--border-light); color: var(--chalk-dim); }
.btn--ghost:hover    { border-color: var(--chalk-dim); color: var(--chalk); }

.btn--danger   { background: var(--alert); color: white; }
.btn--danger:hover   { background: var(--alert-dim); }

.btn--full { width: 100%; }
.btn--sm   { padding: var(--space-1) var(--space-3); font-size: 12px; }

.link-btn { color: var(--signal); font-size: 13px; }
.link-btn:hover { text-decoration: underline; }

.icon-btn {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--r-sm);
  font-size: 14px;
  transition: background var(--t-fast);
}
.icon-btn:hover { background: var(--surface-3); }
.icon-btn--danger:hover { background: var(--alert-dim); }

/* ─── Badges ─────────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.badge--green  { background: var(--go-dim);   color: #a5f0c0; }
.badge--yellow { background: #4a3a0a;          color: var(--signal); }
.badge--red    { background: var(--alert-dim); color: #ffb3ab; }
.badge--gray   { background: var(--surface-3); color: var(--chalk-dim); }

/* ─── Tables ─────────────────────────────────────────────────── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead th {
  background: var(--surface-2);
  color: var(--chalk-muted);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.data-table tbody td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.data-row { transition: background var(--t-fast); }
.data-row:hover { background: var(--surface-2); }
.data-row--muted { opacity: 0.6; }

.col-number  { font-family: var(--font-mono); font-size: 13px; color: var(--chalk-dim); width: 48px; }
.col-name    { font-weight: 600; }
.col-secondary { color: var(--chalk-dim); font-size: 12px; }
.col-actions { width: 80px; text-align: right; white-space: nowrap; }
.empty-cell  { text-align: center; padding: var(--space-10) !important; }

/* ─── Dashboard ──────────────────────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  transition: border-color var(--t-fast), transform var(--t-fast);
  text-align: left;
}

.stat-card:hover {
  border-color: var(--signal);
  transform: translateY(-1px);
}

.stat-card--alert { border-color: var(--signal); background: var(--turf-light); }

.stat-icon  { font-size: 22px; }
.stat-value { font-family: var(--font-head); font-size: 36px; font-weight: 700; color: var(--chalk); line-height: 1; }
.stat-label { font-size: 12px; color: var(--chalk-muted); text-transform: uppercase; letter-spacing: 0.4px; }

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-5);
}

.dashboard-panel {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
}

.panel-title {
  font-family: var(--font-head);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--chalk-muted);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
  background: var(--surface-3);
}

.panel-body { padding: var(--space-3) 0; }
.panel-empty { padding: var(--space-4) var(--space-5); color: var(--chalk-muted); font-size: 13px; }

.player-row, .play-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

.player-row:last-child, .play-row:last-child { border-bottom: none; }
.player-number { font-family: var(--font-mono); color: var(--chalk-muted); width: 28px; }
.player-name   { flex: 1; font-weight: 600; }
.player-pos    { color: var(--chalk-muted); font-size: 12px; }

.play-row__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.play-row__name { font-weight: 600; }
.play-row__meta { font-size: 11px; color: var(--chalk-muted); }

.game-plan-summary {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.gp-name     { font-family: var(--font-head); font-size: 18px; font-weight: 600; }
.gp-opponent { color: var(--chalk-dim); font-size: 13px; }
.gp-date     { font-size: 12px; color: var(--chalk-muted); }

/* ─── Roster ─────────────────────────────────────────────────── */
#roster-table-wrap {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
  margin-bottom: var(--space-8);
}

.section-heading {
  font-family: var(--font-head);
  font-size: 18px;
  font-weight: 700;
  color: var(--chalk-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--space-4);
}

.depth-chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-4);
}

.depth-group {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
}

.depth-group__pos {
  background: var(--surface-3);
  border-bottom: 1px solid var(--border);
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-head);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: var(--signal);
}

.depth-group__players { display: flex; flex-direction: column; }

.depth-player {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
}

.depth-player:last-child { border-bottom: none; }
.depth-player--out { opacity: 0.5; }

.depth-rank   { color: var(--chalk-muted); width: 14px; font-family: var(--font-mono); font-size: 11px; }
.depth-number { font-family: var(--font-mono); color: var(--chalk-muted); width: 28px; }
.depth-name   { flex: 1; font-weight: 600; }

/* ─── Checkbox Grid ──────────────────────────────────────────── */
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
  gap: var(--space-2);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--r-sm);
  transition: background var(--t-fast);
}

.checkbox-label:hover { background: var(--surface-3); }
.checkbox-label input { accent-color: var(--signal); }

/* ─── Settings ───────────────────────────────────────────────── */
.settings-layout { display: flex; flex-direction: column; gap: var(--space-8); max-width: 720px; }

.settings-section {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.settings-section--danger { border-color: var(--alert-dim); }

.settings-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings-heading {
  font-family: var(--font-head);
  font-size: 17px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--chalk-dim);
}

.settings-description { font-size: 13px; color: var(--chalk-muted); line-height: 1.6; }

.player-link-box { display: flex; gap: var(--space-3); align-items: center; }
.player-link-box .form-input { flex: 1; font-family: var(--font-mono); font-size: 12px; }

.coach-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}
.coach-row:last-child { border-bottom: none; }
.coach-info { display: flex; align-items: center; gap: var(--space-3); }
.coach-name { font-weight: 600; font-size: 14px; }
.coach-role-badge {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  background: var(--turf-light);
  border-radius: 999px;
  color: var(--chalk-dim);
}
.coach-email { font-size: 12px; color: var(--chalk-muted); }

/* ─── Modal ──────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
  backdrop-filter: blur(2px);
}

.modal {
  background: var(--surface-2);
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal--form { max-width: 560px; }
.modal--confirm { max-width: 380px; }

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border);
}

.modal__header h2 {
  font-family: var(--font-head);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.modal__close {
  color: var(--chalk-muted);
  font-size: 16px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-sm);
  transition: background var(--t-fast);
}

.modal__close:hover { background: var(--surface-3); color: var(--chalk); }

.modal__body    { padding: var(--space-6); }
.modal__message { padding: var(--space-5) var(--space-6); font-size: 14px; color: var(--chalk-dim); }
.modal__note    { font-size: 13px; color: var(--chalk-muted); margin-bottom: var(--space-4); }

.modal__footer, .modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6) var(--space-5);
  border-top: 1px solid var(--border);
}

/* ─── Toasts ─────────────────────────────────────────────────── */
#toast-container {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  z-index: 2000;
}

.toast {
  background: var(--surface-3);
  border-left: 3px solid var(--go);
  border-radius: var(--r-sm);
  padding: var(--space-3) var(--space-5);
  font-size: 13px;
  font-weight: 500;
  color: var(--chalk);
  opacity: 0;
  transform: translateX(20px);
  transition: opacity var(--t-std), transform var(--t-std);
  max-width: 320px;
}

.toast--error   { border-left-color: var(--alert); }
.toast--warning { border-left-color: var(--signal); }
.toast--visible { opacity: 1; transform: translateX(0); }

/* ─── Empty State ────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-10) var(--space-6);
  text-align: center;
}

.empty-state__icon  { font-size: 40px; opacity: 0.5; }
.empty-state__title { font-family: var(--font-head); font-size: 20px; font-weight: 700; color: var(--chalk-dim); }
.empty-state__message { font-size: 13px; color: var(--chalk-muted); max-width: 280px; }

/* ─── Coming Soon ────────────────────────────────────────────── */
.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 60vh;
  text-align: center;
  color: var(--chalk-muted);
}

.coming-soon__icon { font-size: 56px; opacity: 0.4; }
.coming-soon h2    { font-family: var(--font-head); font-size: 28px; font-weight: 700; color: var(--chalk-dim); }
.coming-soon p     { font-size: 14px; max-width: 360px; line-height: 1.6; }

/* ─── Loading skeletons ──────────────────────────────────────── */
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

.skeleton {
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--r-md);
  min-height: 88px;
}

.loading-line {
  height: 14px;
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--r-sm);
  margin: var(--space-4) var(--space-5);
}

/* ─── Responsive ─────────────────────────────────────────────── */
@media (max-width: 768px) {
  :root { --sidebar-w: 260px; }

  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 200;
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0,0,0,0.5);
  }

  .menu-toggle { display: flex; }

  .main-content { padding: var(--space-4); }

  .form-grid { grid-template-columns: 1fr; }

  .view-toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-left { flex-wrap: wrap; }
  .search-input { width: 100%; }

  .depth-chart-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }

  .modal--form { max-width: 100%; }

  #toast-container { bottom: var(--space-4); right: var(--space-4); left: var(--space-4); }
}

@media (max-width: 480px) {
  .stat-grid { grid-template-columns: 1fr 1fr; }
  .dashboard-grid { grid-template-columns: 1fr; }
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 2 — Play Designer & Formations
   ═══════════════════════════════════════════════════════════════ */

/* ─── Tab Buttons ────────────────────────────────────────────── */
.tab-btn {
  padding: var(--space-2) var(--space-4);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-family: var(--font-head);
  font-size: 14px;
  font-weight: 600;
  color: var(--chalk-dim);
  transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
}
.tab-btn.active {
  background: var(--turf-light);
  border-color: var(--signal);
  color: var(--signal);
}

/* ─── Toggle Group ───────────────────────────────────────────── */
.toggle-group {
  display: flex;
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  overflow: hidden;
}
.toggle-btn {
  flex: 1;
  padding: var(--space-2) var(--space-4);
  font-size: 13px;
  font-weight: 600;
  color: var(--chalk-muted);
  background: var(--surface-0);
  transition: background var(--t-fast), color var(--t-fast);
}
.toggle-btn.active {
  background: var(--turf-light);
  color: var(--signal);
}

/* ─── Formations Grid ────────────────────────────────────────── */
.formations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-5);
}

.formation-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
  transition: border-color var(--t-fast), transform var(--t-fast);
}
.formation-card:hover {
  border-color: var(--signal);
  transform: translateY(-2px);
}

.formation-card__preview {
  aspect-ratio: 10/7;
  background: var(--surface-1);
  overflow: hidden;
}

.formation-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border);
}

.formation-card__name {
  font-family: var(--font-head);
  font-size: 15px;
  font-weight: 700;
  color: var(--chalk);
}

.formation-card__actions {
  display: flex;
  gap: var(--space-1);
}

/* ─── Formation Editor Modal ─────────────────────────────────── */
.modal--formation-editor {
  max-width: 820px;
  width: 100%;
}

.formation-editor-body {
  display: flex;
  gap: 0;
  min-height: 420px;
}

.fe-sidebar {
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.fe-player-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  overflow-y: auto;
  margin-top: var(--space-2);
}

.fe-player-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.fe-pos-select {
  flex: 1;
  background: var(--surface-0);
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  color: var(--chalk);
  padding: 4px 6px;
  font-size: 12px;
}

.fe-canvas-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: var(--surface-0);
}

.fe-canvas-wrap canvas {
  max-width: 100%;
  border-radius: var(--r-sm);
  cursor: grab;
}
.fe-canvas-wrap canvas:active { cursor: grabbing; }

.fe-canvas-hint {
  font-size: 11px;
  color: var(--chalk-muted);
  margin-top: var(--space-2);
}

/* ─── Play Designer Layout ───────────────────────────────────── */
.pd-layout {
  display: grid;
  grid-template-columns: 200px 1fr 240px;
  gap: 0;
  height: calc(100vh - 56px);
  margin: calc(-1 * var(--space-6));
  overflow: hidden;
}

.pd-sidebar-left {
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface-1);
}

.pd-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.pd-sidebar-title {
  font-family: var(--font-head);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--chalk-dim);
}

.pd-play-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.pd-tab {
  flex: 1;
  padding: var(--space-2);
  font-size: 12px;
  font-weight: 600;
  color: var(--chalk-muted);
  border-bottom: 2px solid transparent;
  transition: color var(--t-fast), border-color var(--t-fast);
}
.pd-tab.active { color: var(--signal); border-bottom-color: var(--signal); }

.pd-search {
  margin: var(--space-3);
  background: var(--surface-0);
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  color: var(--chalk);
  padding: var(--space-2) var(--space-3);
  font-size: 12px;
  flex-shrink: 0;
}
.pd-search:focus { outline: none; border-color: var(--signal); }

.pd-play-list {
  flex: 1;
  overflow-y: auto;
}

.pd-list-item {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background var(--t-fast);
}
.pd-list-item:hover  { background: var(--surface-2); }
.pd-list-item.active { background: var(--turf-light); border-left: 3px solid var(--signal); }

.pd-list-item__name { font-weight: 600; font-size: 13px; color: var(--chalk); margin-bottom: 2px; }
.pd-list-item__meta { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--chalk-muted); }
.pd-list-empty { padding: var(--space-6); text-align: center; color: var(--chalk-muted); font-size: 13px; }

/* ─── Canvas Area ────────────────────────────────────────────── */
.pd-canvas-area {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface-0);
}

.pd-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  color: var(--chalk-muted);
  font-size: 14px;
}

.pd-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ─── Play Designer Toolbar ──────────────────────────────────── */
.pd-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: var(--surface-1);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.pd-tool {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--r-sm);
  font-size: 12px;
  font-weight: 600;
  color: var(--chalk-muted);
  background: transparent;
  border: 1px solid transparent;
  transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
  white-space: nowrap;
}
.pd-tool:hover { background: var(--surface-3); color: var(--chalk); }
.pd-tool.active {
  background: var(--turf-light);
  border-color: var(--signal);
  color: var(--signal);
}

.pd-toolbar-sep {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 var(--space-2);
}

/* ─── Canvas Wrap ────────────────────────────────────────────── */
.pd-canvas-wrap {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: stretch;
}

#pd-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
}

/* ─── Status Bar ─────────────────────────────────────────────── */
.pd-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  background: var(--surface-1);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  font-size: 12px;
  color: var(--chalk-muted);
}

.pd-status-actions { display: flex; gap: var(--space-3); }

/* ─── Right Sidebar ──────────────────────────────────────────── */
.pd-sidebar-right {
  border-left: 1px solid var(--border);
  background: var(--surface-1);
  flex-direction: column;
  overflow: hidden;
}

.pd-details-scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.pd-detail-section { display: flex; flex-direction: column; gap: var(--space-2); }

.tag-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  background: var(--surface-3);
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  transition: border-color var(--t-fast);
}
.tag-check:has(input:checked) {
  border-color: var(--signal);
  color: var(--signal);
  background: var(--turf-light);
}
.tag-check input { display: none; }

.player-notes-grid { display: flex; flex-direction: column; gap: var(--space-3); }
.pd-textarea { resize: vertical; min-height: 52px; font-size: 13px; }

/* ─── Responsive Play Designer ───────────────────────────────── */
@media (max-width: 900px) {
  .pd-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    height: auto;
  }
  .pd-sidebar-left  { max-height: 180px; }
  .pd-sidebar-right { max-height: 320px; }
  .pd-canvas-wrap   { min-height: 300px; }
}
