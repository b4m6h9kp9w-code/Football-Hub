export function renderGamePlans(container, { db, AppState }) {
  container.innerHTML = `
    <div class="coming-soon">
      <div class="coming-soon__icon">📅</div>
      <h2>Game Plans</h2>
      <p>Coming in Phase 3 — Build weekly game plans from published plays.</p>
    </div>
  `;
}
