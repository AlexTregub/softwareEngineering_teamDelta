/**
 * Spawn Controls UI - Universal Button System Integration
 * ------------------------------------------------------
 * This file replaces the legacy spawnControlsUI.js system with
 * Universal Button System integration while maintaining compatibility.
 * 
 * The functionality is now provided through the button configuration
 * in config/button-groups/legacy-conversions.json
 */

(function(){
  const SpawnControlsUniversal = {
    // Legacy compatibility
    buttons: [],
    usingUniversalSystem: false,
    
    // Config preserved for fallback
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

  /**
   * Initialize spawn controls - now with Universal Button System integration
   */
  function initSpawnControls() {
    console.log('🔄 Initializing Spawn Controls (Universal Button System)');
    
    // Check if Universal Button System is available
    if (typeof window !== 'undefined' && 
        window.buttonGroupManager && 
        typeof window.buttonGroupManager.loadConfiguration === 'function') {
      
      console.log('✅ Spawn controls integrated with Universal Button System');
      SpawnControlsUniversal.usingUniversalSystem = true;
    } else {
      console.log('⚠️ Universal Button System not available, using legacy fallback');
      initLegacySpawnControls();
      SpawnControlsUniversal.usingUniversalSystem = false;
    }
  }

  /**
   * Legacy fallback implementation
   */
  function initLegacySpawnControls() {
    SpawnControlsUniversal.buttons = SpawnControlsUniversal.config.map(cfg => {
      const raw = cfg.type === 'spawn' ? (n => spawnCount(n)) : (n => deleteCount(n));
      const action = () => {
        try {
          const now = Date.now();
          const last = window._spawnControlsLastAction || 0;
          const DEBOUNCE = 150; // ms
          if (now - last < DEBOUNCE) return;
          window._spawnControlsLastAction = now;
        } catch (e) {}
        return raw(cfg.amount);
      };
      const style = cfg.type === 'kill' ? 'danger' : 'default';
      return createMenuButton(0, 0, SpawnControlsUniversal.width, SpawnControlsUniversal.height, cfg.label, style, action);
    });
  }

  // Action implementations: enhanced for Universal Button System
  function spawnCount(n) {
    try {
      // Try command-line handler first (keeps behavior consistent)
      if (typeof handleSpawnCommand === 'function') { 
        handleSpawnCommand([String(n), 'ant', 'player']); 
        return; 
      }
      // Direct function if available
      if (typeof antsSpawn === 'function') { 
        antsSpawn(n); 
        return; 
      }
      // Final fallback: executeCommand
      if (typeof executeCommand === 'function') { 
        executeCommand(`spawn ${n} ant player`); 
        return; 
      }
      console.warn('Spawn not available: expected handleSpawnCommand, antsSpawn or executeCommand');
    } catch (err) { 
      console.error('spawnCount error', err); 
    }
  }

  function deleteCount(n) {
    try {
      if (Array.isArray(ants) && ants.length > 0) {
        const toRemove = Math.min(n, ants.length);
        for (let i = 0; i < toRemove; i++) {
          try { ants.pop(); } catch (err) { console.error('Error popping ant', err); }
        }
        if (typeof antIndex === 'number') antIndex = ants.length;
        if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) {
          g_selectionBoxController.entities = ants;
        }
        console.log(`Deleted ${toRemove} ant(s). Remaining: ${antIndex}`);
        return;
      }
      console.warn('No ants to delete');
    } catch (err) { 
      console.error('deleteCount error', err); 
    }
  }

  /**
   * Update spawn controls UI - handles both Universal and legacy systems
   */
  function updateSpawnControls() {
    if (SpawnControlsUniversal.usingUniversalSystem) {
      // Universal Button System handles updates automatically
      return;
    }
    
    // Legacy system update
    updateLegacySpawnControlsPositions();
  }

  function updateLegacySpawnControlsPositions() {
    if (!SpawnControlsUniversal.buttons || SpawnControlsUniversal.buttons.length === 0) return;
    
    const cols = 2; 
    const rows = Math.ceil(SpawnControlsUniversal.buttons.length / cols);
    const leftX = SpawnControlsUniversal.margin;
    const rightX = leftX + SpawnControlsUniversal.width + SpawnControlsUniversal.spacing;
    const baseY = g_canvasY - SpawnControlsUniversal.margin - (SpawnControlsUniversal.height * rows) - (SpawnControlsUniversal.spacing * (rows - 1));

    for (let i = 0; i < SpawnControlsUniversal.buttons.length; i++) {
      const btn = SpawnControlsUniversal.buttons[i];
      const col = i < rows ? 0 : 1;
      const row = i % rows;
      const x = col === 0 ? leftX : rightX;
      const y = baseY + row * (SpawnControlsUniversal.height + SpawnControlsUniversal.spacing);
      if (typeof btn.setPosition === 'function') btn.setPosition(x, y);
      else if (btn.bounds && typeof btn.bounds.set === 'function') btn.bounds.set(x, y);
    }
  }

  /**
   * Render spawn controls UI - handles both Universal and legacy systems
   */
  function renderSpawnControlsUI() {
    if (SpawnControlsUniversal.usingUniversalSystem) {
      // Universal Button System handles rendering automatically
      return;
    }
    
    // Legacy system render
    renderLegacySpawnControls();
  }

  function renderLegacySpawnControls() {
    if (typeof createMenuButton === 'undefined') return;
    if (typeof GameState !== 'undefined') { 
      if (!GameState.isInGame || !GameState.isInGame()) return; 
    }
    
    if (SpawnControlsUniversal.buttons.length === 0) {
      initLegacySpawnControls();
    }
    updateLegacySpawnControlsPositions();

    // Draw background panel and header
    push();
    noStroke(); 
    fill(0, 140);
    const panelW = SpawnControlsUniversal.width * 2 + SpawnControlsUniversal.spacing + 12;
    const panelH = (SpawnControlsUniversal.height * 3) + (SpawnControlsUniversal.spacing * 2) + 12;
    const panelX = SpawnControlsUniversal.margin - 6;
    const panelY = g_canvasY - SpawnControlsUniversal.margin - (SpawnControlsUniversal.height * 3) - (SpawnControlsUniversal.spacing * 2) - 8;
    rect(panelX, panelY, panelW, panelH, 6);
    
    // Draw main label
    fill(255); 
    textSize(12); 
    textAlign(LEFT, TOP); 
    text('Spawn Controls', SpawnControlsUniversal.margin + 6, panelY - 4);

    // Column headings
    const leftX = SpawnControlsUniversal.margin;
    const rightX = leftX + SpawnControlsUniversal.width + SpawnControlsUniversal.spacing;
    const headingY = panelY + 8;
    textAlign(CENTER, TOP);
    textSize(13);
    fill(200, 255, 200); // light green for Spawn
    text('Spawn', leftX + SpawnControlsUniversal.width / 2, headingY);
    fill(255, 180, 180); // light red for Kill
    text('Kill', rightX + SpawnControlsUniversal.width / 2, headingY);
    pop();

    // Render buttons
    for (let i = 0; i < SpawnControlsUniversal.buttons.length; i++) {
      const btn = SpawnControlsUniversal.buttons[i];
      btn.update(mouseX, mouseY, mouseIsPressed);
      btn.render();
      
      // Draw icons
      try {
        const b = btn.getBounds ? btn.getBounds() : { x: btn.x, y: btn.y, width: btn.width, height: btn.height };
        const iconX = b.x + 10;
        const iconY = b.y + Math.round(b.height / 2);
        push();
        translate(iconX, iconY);
        const cap = String(btn.caption || '').toLowerCase();
        strokeWeight(2);
        if (cap.includes('+') || cap.includes('spawn')) {
          stroke(255); strokeWeight(3); noFill();
          line(-4, 0, 4, 0);
          line(0, -4, 0, 4);
        } else if (cap.includes('-') || cap.includes('delete') || cap.includes('kill')) {
          noFill(); stroke(255); strokeWeight(2);
          rect(-5, -4, 10, 8, 2);
          line(-6, -6, 6, -6);
        }
        pop();
      } catch (err) { /* ignore icon draw errors */ }
    }
  }

  // Initialize automatically when loaded
  if (typeof window !== 'undefined') {
    // Expose functions globally
    window.renderSpawnControlsUI = renderSpawnControlsUI;
    window.renderSpawnUI = renderSpawnControlsUI; // Compatibility alias
    window.updateSpawnControls = updateSpawnControls;
    window.initSpawnControls = initSpawnControls;
    
    // Auto-initialize
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSpawnControls);
    } else {
      // Try to initialize immediately, or defer if dependencies aren't ready
      setTimeout(initSpawnControls, 100);
    }
  }
})();