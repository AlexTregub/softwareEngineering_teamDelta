// Minimal Spawn / Delete UI
// Minimal Spawn / Delete UI
(function(){
  // Canvas-based spawn UI using the Button class
  const spawnUI = {
    buttons: [],
    margin: 12,
    width: 140,
    height: 40
  };

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
      // Prefer using the centralized command system if present
      if (typeof executeCommand === 'function') {
        executeCommand('kill all');
        return;
      }

      // Fallback: call handleKillCommand to remove last ant
      if (typeof handleKillCommand === 'function') {
        const lastIndex = (typeof antIndex === 'number' && antIndex > 0) ? (antIndex - 1) : null;
        if (lastIndex !== null) {
          handleKillCommand([String(lastIndex)]);
          return;
        }
      }

      // Final fallback: pop from ants array and adjust antIndex
      if (Array.isArray(ants) && ants.length > 0) {
        ants.pop();
        if (typeof antIndex === 'number' && antIndex > 0) antIndex--;
        return;
      }

      console.warn('No ants to delete');
    } catch (e) { console.error('deleteOne error', e); }
  }

  function ensureButtons() {
    if (spawnUI.buttons && spawnUI.buttons.length === 2) return;
    spawnUI.buttons = [];
    // positions will be updated in render
    const b1 = createMenuButton(0, 0, spawnUI.width, spawnUI.height, 'Spawn Ant', 'default', spawnOne);
  const b2 = createMenuButton(0, 0, spawnUI.width, spawnUI.height, 'Delete Ant', 'danger', deleteOne);
    spawnUI.buttons.push(b1, b2);
  }

  function updateButtonPositions() {
    if (!spawnUI.buttons || spawnUI.buttons.length < 2) return;
    const spacing = 8;
    // Position bottom-left
    const startX = spawnUI.margin;
    const startY = g_canvasY - spawnUI.margin - spawnUI.height * 2 - spacing;
    spawnUI.buttons[0].setPosition(startX, startY);
    spawnUI.buttons[1].setPosition(startX, startY + spawnUI.height + spacing);
  }

  function renderSpawnUI() {
    if (typeof createMenuButton === 'undefined') return; // Button system not loaded
    // show only while developer console / debug overlay is enabled
    if (typeof devConsoleEnabled !== 'undefined' && !devConsoleEnabled) return;
    if (typeof GameState !== 'undefined') {
      if (!GameState.isInGame || !GameState.isInGame()) return; // only show in-game
    }
    ensureButtons();
    updateButtonPositions();

    for (let i = 0; i < spawnUI.buttons.length; i++) {
      const btn = spawnUI.buttons[i];
      btn.update(mouseX, mouseY, mouseIsPressed);
      btn.render();
    }
  }

  // Expose renderer to the global scope so sketch.js can call it during uiRender
  window.renderSpawnUI = renderSpawnUI;
})();
