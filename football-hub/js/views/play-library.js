export function renderPlayLibrary(container, { db, AppState }) {
  container.innerHTML = `
    <div class="coming-soon">
      <div class="coming-soon__icon">📋</div>
      <h2>Play Library</h2>
      <p>Coming in Phase 3 — Browse, search, and manage all published plays.</p>
    </div>
  `;
}
