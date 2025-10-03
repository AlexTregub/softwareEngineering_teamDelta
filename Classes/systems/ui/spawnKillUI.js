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
      console.log('Spawn button pressed');
      if (typeof handleSpawnCommand === 'function') {
        handleSpawnCommand(['1','ant','player']);
        return;
      }
      if (typeof antsSpawn === 'function') {
        antsSpawn(1);
        return;
      }
      if (typeof executeCommand === 'function') {
        executeCommand('spawn 1 ant player');
        return;
      }
      console.warn('Spawn function not available');
    } catch (e) { console.error('spawnOne error', e); }
  }

  function deleteOne() {
    try {
      console.log('Delete button pressed');
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
    
    // Register with UI Debug System if available
    if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager) {
      g_uiDebugManager.registerElement(
        'spawn-ant-button',
        { x: 0, y: 0, width: spawnUI.width, height: spawnUI.height },
        (x, y) => {
          if (b1 && b1.setPosition) {
            b1.setPosition(x, y);
          }
        },
        {
          label: 'Spawn Ant Button',
          isDraggable: true,
          persistKey: 'spawnAntButton'
        }
      );
      
      g_uiDebugManager.registerElement(
        'delete-ant-button',
        { x: 0, y: spawnUI.height + 8, width: spawnUI.width, height: spawnUI.height },
        (x, y) => {
          if (b2 && b2.setPosition) {
            b2.setPosition(x, y);
          }
        },
        {
          label: 'Delete Ant Button',
          isDraggable: true,
          persistKey: 'deleteAntButton'
        }
      );
    }

    // Attach a one-time global mouseup listener to capture clicks even when
    // other controllers consume p5 mouse events. This converts client coords
    // into canvas-local coordinates and dispatches to the same handlers.
    if (!window._spawnKillMouseListenerAttached) {
      window._spawnKillMouseListenerAttached = true;
      window.addEventListener('mouseup', function _spawnKillMouseUp(e) {
        try {
          const canvas = document.querySelector('canvas');
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          // Iterate buttons and call handler for the first one that contains point
          for (let i = 0; i < spawnUI.buttons.length; i++) {
            const btn = spawnUI.buttons[i];
            if (!btn) continue;
            try {
              if (typeof btn.isMouseOver === 'function' ? btn.isMouseOver(x, y) : btn.bounds.contains(x, y)) {
                if (i === 0) spawnOne(); else deleteOne();
                e.stopPropagation(); e.preventDefault();
                return;
              }
            } catch (err) { /* ignore button check errors */ }
          }
        } catch (err) { console.error('spawnKillUI mouseup handler error', err); }
      }, { passive: false });
    }
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
    if (typeof devConsoleEnabled !== 'undefined' && !devConsoleEnabled) {
      // Print a one-time hint so developers know why the UI is hidden
      if (!renderSpawnUI._hintShown) {
        try { console.info("spawnKillUI hidden: enable dev console (press `) or call toggleDevConsole() to show spawn/delete buttons."); } catch (e) {}
        renderSpawnUI._hintShown = true;
      }
      return;
    }
    if (typeof GameState !== 'undefined') {
      if (!GameState.isInGame || !GameState.isInGame()) return; // only show in-game
    }
    ensureButtons();
    updateButtonPositions();
    // Debug instrumentation removed: avoid noisy per-frame logs. Click handlers still log on activation.

    for (let i = 0; i < spawnUI.buttons.length; i++) {
      const btn = spawnUI.buttons[i];
      // Update button state; no per-frame logging to avoid console spam.
      btn.update(mouseX, mouseY, mouseIsPressed);
      // Fallback: some systems expect a legacy .action; ensure click triggers
      if (typeof btn.wasClickedThisFrame === 'function' && btn.wasClickedThisFrame()) {
        try {
          if (i === 0) spawnOne();
          else if (i === 1) deleteOne();
        } catch (e) { console.error('spawnKillUI fallback handler error', e); }
      }
      btn.render();
    }
  }

  // Expose renderer to the global scope so sketch.js can call it during uiRender
  window.renderSpawnUI = renderSpawnUI;
})();
