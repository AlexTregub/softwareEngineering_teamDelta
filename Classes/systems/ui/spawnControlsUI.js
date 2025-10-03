/*
 * Spawn Controls UI
 * -----------------
 * Clean, easy-to-extend in-game controls for spawning and deleting ants.
 * - Creates a small bottom-left panel with spawn (+1/+5/+10) and delete (-1/-5/-10)
 * - Uses the existing createMenuButton factory so styling and behavior remain consistent
 * - Tries multiple fallback call paths (command handlers, direct functions) when executing actions
 * - Exposes `renderSpawnControlsUI()` and also aliases `renderSpawnUI()` for compatibility
 */
(function(){
  const Controls = {
    buttons: [],
    // Config is intentionally simple and declarative so adding more buttons is trivial.
    config: [
      { label: '+1',  type: 'spawn', amount: 1 },
      { label: '+5',  type: 'spawn', amount: 5 },
      { label: '+10', type: 'spawn', amount: 10 },

      { label: '-1',  type: 'kill', amount: 1 },
      { label: '-5',  type: 'kill', amount: 5 },
      { label: '-10', type: 'kill', amount: 10 }
    ],
    width: 110,
    height: 36,
    margin: 12,
    spacing: 8
  };

  // Action implementations: keep them small and try canonical codepaths first.
  function spawnCount(n) {
    try {
      // Preferred: command-line handler (keeps behavior consistent)
      if (typeof handleSpawnCommand === 'function') { handleSpawnCommand([String(n), 'ant', 'player']); return; }
      // Next: direct function if available
      if (typeof antsSpawn === 'function') { antsSpawn(n); return; }
      // Final fallback: executeCommand
      if (typeof executeCommand === 'function') { executeCommand(`spawn ${n} ant player`); return; }
      console.warn('Spawn not available: expected handleSpawnCommand, antsSpawn or executeCommand');
    } catch (err) { console.error('spawnCount error', err); }
  }

  function deleteCount(n) {
    try {
      // There is no canonical "delete N" command, so remove from the end of the array.
      if (Array.isArray(ants) && ants.length > 0) {
        const toRemove = Math.min(n, ants.length);
        for (let i = 0; i < toRemove; i++) {
          try { ants.pop(); } catch (err) { console.error('Error popping ant', err); }
        }
        if (typeof antIndex === 'number') antIndex = ants.length;
        if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) g_selectionBoxController.entities = ants;
        console.log(`Deleted ${toRemove} ant(s). Remaining: ${antIndex}`);
        return;
      }
      console.warn('No ants to delete');
    } catch (err) { console.error('deleteCount error', err); }
  }

  // Build buttons from declarative config. Each button's action calls the small helpers above.
  function ensureButtons() {
    if (Controls.buttons && Controls.buttons.length > 0) return;
    Controls.buttons = Controls.config.map(cfg => {
      // Keep the raw handler and wrap it so we can mark a timestamp when it runs.
      const raw = cfg.type === 'spawn' ? (n => spawnCount(n)) : (n => deleteCount(n));
      const action = () => {
        try {
          const now = Date.now();
          const last = window._spawnControlsLastAction || 0;
          const DEBOUNCE = 150; // ms
          if (now - last < DEBOUNCE) return; // already handled recently
          window._spawnControlsLastAction = now;
        } catch (e) {}
        return raw(cfg.amount);
      };
      const style = cfg.type === 'kill' ? 'danger' : 'default';
      const button = createMenuButton(0, 0, Controls.width, Controls.height, cfg.label, style, action);
      
      // Register with UI Debug System if available
      if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager) {
        const elementId = `spawn-control-${cfg.label.replace(/[^a-zA-Z0-9]/g, '')}`;
        g_uiDebugManager.registerElement(
          elementId,
          { x: 0, y: 0, width: Controls.width, height: Controls.height },
          (x, y) => {
            if (button && button.setPosition) {
              button.setPosition(x, y);
            }
          },
          {
            label: `Spawn Control ${cfg.label}`,
            isDraggable: true,
            persistKey: `spawnControl_${cfg.label.replace(/[^a-zA-Z0-9]/g, '')}`
          }
        );
      }
      
      return button;
    });
  }

  function updateButtonPositions() {
    if (!Controls.buttons || Controls.buttons.length === 0) return;
    // Layout: two columns of three buttons (spawn on left, delete on right)
    const cols = 2; const rows = Math.ceil(Controls.buttons.length / cols);
    const leftX = Controls.margin;
    const rightX = leftX + Controls.width + Controls.spacing;
    const baseY = g_canvasY - Controls.margin - (Controls.height * rows) - (Controls.spacing * (rows - 1));

    // spawn buttons are first half, kill buttons second half grouped by column
    // We'll place indexes 0..2 in left column, 3..5 in right column
    for (let i = 0; i < Controls.buttons.length; i++) {
      const btn = Controls.buttons[i];
      const col = i < rows ? 0 : 1;
      const row = i % rows;
      const x = col === 0 ? leftX : rightX;
      const y = baseY + row * (Controls.height + Controls.spacing);
      if (typeof btn.setPosition === 'function') btn.setPosition(x, y);
      else if (btn.bounds && typeof btn.bounds.set === 'function') btn.bounds.set(x, y);
    }
  }

  function renderSpawnControlsUI() {
    if (typeof createMenuButton === 'undefined') return; // Button system not loaded
    if (typeof GameState !== 'undefined') { if (!GameState.isInGame || !GameState.isInGame()) return; }
    ensureButtons();
    updateButtonPositions();

  // Draw background panel and header
  push();
  noStroke(); fill(0, 140);
  const panelW = Controls.width * 2 + Controls.spacing + 12;
  const panelH = (Controls.height * 3) + (Controls.spacing * 2) + 12;
  const panelX = Controls.margin - 6;
  const panelY = g_canvasY - Controls.margin - (Controls.height * 3) - (Controls.spacing * 2) - 8;
  rect(panelX, panelY, panelW, panelH, 6);
  // Draw main label
  fill(255); textSize(12); textAlign(LEFT, TOP); text('Spawn Controls', Controls.margin + 6, panelY - 4);

  // Column headings: compute column centers
  const rows = Math.ceil(Controls.buttons.length / 2);
  const leftX = Controls.margin;
  const rightX = leftX + Controls.width + Controls.spacing;
  // Put headings slightly above the top-most buttons
  const headingY = panelY + 8;
  textAlign(CENTER, TOP);
  textSize(13);
  fill(200, 255, 200); // light green for Spawn
  text('Spawn', leftX + Controls.width / 2, headingY);
  fill(255, 180, 180); // light red for Kill
  text('Kill', rightX + Controls.width / 2, headingY);
  pop();

    // Render buttons and dispatch clicks via wasClickedThisFrame fallback
    for (let i = 0; i < Controls.buttons.length; i++) {
      const btn = Controls.buttons[i];
      btn.update(mouseX, mouseY, mouseIsPressed);
      // rely on the Button.update/onClick to invoke the handler; avoid calling
      // it again here to prevent duplicate activations
      btn.render();
      // draw a small icon on the left side of the button label for quick affordance
      try {
        const b = btn.getBounds ? btn.getBounds() : { x: btn.x, y: btn.y, width: btn.width, height: btn.height };
        const iconX = b.x + 10; // left padding
        const iconY = b.y + Math.round(b.height / 2);
        push();
        translate(iconX, iconY);
        // Determine icon type based on caption or known config mapping
        const cap = String(btn.caption || '').toLowerCase();
        strokeWeight(2);
        if (cap.includes('+') || cap.includes('spawn')) {
          // plus icon
          stroke(255); strokeWeight(3); noFill();
          line(-4, 0, 4, 0);
          line(0, -4, 0, 4);
        } else if (cap.includes('-') || cap.includes('delete') || cap.includes('kill')) {
          // simple trash can icon
          noFill(); stroke(255); strokeWeight(2);
          rect(-5, -4, 10, 8, 2);
          line(-6, -6, 6, -6); // lid
        }
        pop();
      } catch (err) { /* ignore icon draw errors */ }
    }
  }

  // Expose the render function; alias to previous name for compatibility with sketch.js
  window.renderSpawnControlsUI = renderSpawnControlsUI;
  window.renderSpawnUI = renderSpawnControlsUI;
})();
