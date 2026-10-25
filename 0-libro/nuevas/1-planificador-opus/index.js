function finishJobAndNext() {
  const job = state.queue.find(j => j.id === state.activeJobId);
  if (!job) return;
  if (!hasWarehouseEntry(job.id)) {
    if (!confirm('Aún no hay documento ESENCIAL. ¿Terminar de todos modos? (Perderás la conversación)')) return;
  }
  job.status = 'done';
  state.messages = [];
  state.locked = null;
  state.activeJobId = null;
  state.error = null;
  saveState();
  // Try next
  const next = state.queue.find(j => j.status === 'pending' || !j.status);
  if (next) {
    renderAll();
    if (confirm('¿Procesar el siguiente trabajo: ' + next.name + '?')) {
      startJob(next.id);
      return;
    }
  }
  renderAll();
}