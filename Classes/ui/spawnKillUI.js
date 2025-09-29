// Minimal Spawn / Delete UI
(function(){
  const container = document.createElement('div');
  container.id = 'spawn-kill-ui';
  Object.assign(container.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    zIndex: 9999,
    display: 'flex',
    gap: '8px',
    pointerEvents: 'auto'
  });

  const btnSpawn = document.createElement('button');
  btnSpawn.textContent = 'Spawn Ant';
  btnSpawn.title = 'Spawn one ant (uses command-line spawn if available)';

  const btnKill = document.createElement('button');
  btnKill.textContent = 'Delete Ant';
  btnKill.title = 'Delete last ant (uses command-line kill if available)';

  container.appendChild(btnSpawn);
  container.appendChild(btnKill);
  document.body.appendChild(container);

  // Small style for buttons to be readable over canvas
  const css = document.createElement('style');
  css.innerHTML = `#spawn-kill-ui button{ padding:8px 12px; font-size:14px; border-radius:6px; border:1px solid rgba(0,0,0,0.2); background:rgba(255,255,255,0.9); cursor:pointer }`;
  document.head.appendChild(css);

  function spawnOne() {
    try {
      if (typeof handleSpawnCommand === 'function') {
        handleSpawnCommand(['1','ant','player']);
        return;
      }
      if (typeof antsSpawn === 'function') {
        antsSpawn(1);
        return;
      }
      console.warn('Spawn function not available');
    } catch (e) { console.error('spawnOne error', e); }
  }

  function deleteOne() {
    try {
      if (typeof handleKillCommand === 'function') {
        // remove last ant if possible
        const lastIndex = (typeof antIndex === 'number' && antIndex > 0) ? (antIndex - 1) : null;
        if (lastIndex !== null) {
          handleKillCommand([String(lastIndex)]);
          return;
        }
      }

      // fallback: pop from ants array
      if (Array.isArray(ants) && ants.length > 0) {
        ants.pop();
        if (typeof antIndex === 'number' && antIndex > 0) antIndex--;
        return;
      }
      console.warn('No ants to delete');
    } catch (e) { console.error('deleteOne error', e); }
  }

  btnSpawn.addEventListener('click', spawnOne);
  btnKill.addEventListener('click', deleteOne);

  // Show/hide based on GameState
  function updateVisibility() {
    try {
      if (typeof GameState !== 'undefined' && typeof GameState.isInGame === 'function') {
        container.style.display = GameState.isInGame() ? 'flex' : 'none';
      } else {
        // if no GameState, default to visible
        container.style.display = 'flex';
      }
    } catch (e) { container.style.display = 'flex'; }
  }

  // Hook into GameState callbacks if available
  if (typeof GameState !== 'undefined' && typeof GameState.onStateChange === 'function') {
    GameState.onStateChange(() => setTimeout(updateVisibility, 10));
  }

  // Initial visibility
  updateVisibility();

  // Make sure UI isn't focus-stealing when canvas is active
  container.addEventListener('mousedown', (e) => e.stopPropagation());
})();
