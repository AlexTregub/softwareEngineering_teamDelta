/**
 * SpawnGreenLeafButton - Universal Button System Integration
 * -------------------------------------------------------
 * This file replaces the legacy spawnGreenLeafButton.js system with
 * Universal Button System integration while maintaining compatibility.
 * 
 * The functionality is now provided through the button configuration
 * in config/button-groups/legacy-conversions.json
 */

let spawnLeafUI = {
  // Legacy compatibility object
  button: null,
  prevMousePressed: false,
  tileSize: (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32),
  count: 10,
  // Flag to indicate this is now handled by Universal Button System
  usingUniversalSystem: true
};

/**
 * Initialize the spawn leaf button system
 * Now integrates with Universal Button System
 */
function initSpawnGreenLeafButton() {
  // Use verbose logging for initialization details
  if (typeof globalThis.logVerbose === 'function') {
    globalThis.logVerbose('🔄 Initializing Spawn Green Leaf Button (Universal Button System)');
  } else {
    console.log('🔄 Initializing Spawn Green Leaf Button (Universal Button System)');
  }
  
  // Check if Universal Button System is available
  if (window.buttonGroupManager && 
      typeof window.buttonGroupManager.loadConfiguration === 'function') {
    
    // The button is now configured via JSON in legacy-conversions.json
    // Update the button text to reflect current count
    updateSpawnLeafButtonText();
    
    // Use verbose logging for successful integration
    if (typeof globalThis.logVerbose === 'function') {
      globalThis.logVerbose('✅ Spawn leaf button integrated with Universal Button System');
    } else {
      console.log('✅ Spawn leaf button integrated with Universal Button System');
    }
    spawnLeafUI.usingUniversalSystem = true;
  } else {
    // Fallback to legacy implementation - use normal logging for warnings
    if (typeof globalThis.logNormal === 'function') {
      globalThis.logNormal('⚠️ Universal Button System not available, using legacy fallback');
    } else {
      console.log('⚠️ Universal Button System not available, using legacy fallback');
    }
    initLegacySpawnGreenLeafButton();
    spawnLeafUI.usingUniversalSystem = false;
  }
  
  // Expose for debug
  if (typeof window !== 'undefined') {
    window.spawnLeafUI = spawnLeafUI;
  }
}

/**
 * Update the spawn leaf button text with current count
 */
function updateSpawnLeafButtonText() {
  if (window.buttonGroupManager && 
      typeof window.buttonGroupManager.updateButtonText === 'function') {
    
    const newText = `Spawn ${spawnLeafUI.count} leaves`;
    try {
      // Try to update the button text in the Universal Button System
      window.buttonGroupManager.updateButtonText('spawn-leaf-control', 'spawn-leaves', newText);
    } catch (error) {
      console.warn('Could not update spawn leaf button text:', error);
    }
  }
}

/**
 * Legacy fallback implementation
 */
function initLegacySpawnGreenLeafButton() {
  // createMenuButton is used elsewhere; fallback to simple object if missing
  if (typeof createMenuButton === 'function') {
    spawnLeafUI.button = createMenuButton(10, 10, 160, 34, `Spawn ${spawnLeafUI.count} leaves`, 'default', () => {
      spawnGreenLeaves(spawnLeafUI.count);
    });
  } else {
    spawnLeafUI.button = {
      x: 10, y: 10, width: 160, height: 34,
      label: `Spawn ${spawnLeafUI.count} leaves`,
      setPosition(x, y) { this.x = x; this.y = y; },
      update(mx, my, pressed) { if (pressed && !spawnLeafUI.prevMousePressed && mx >= this.x && mx <= this.x+this.width && my >= this.y && my <= this.y+this.height) spawnGreenLeaves(spawnLeafUI.count); },
      render() { push(); fill(40); stroke(200); rect(this.x, this.y, this.width, this.height, 6); fill(255); noStroke(); textSize(14); textAlign(LEFT, CENTER); text(this.label, this.x+10, this.y+this.height/2); pop(); },
      isMouseOver(mx,my) { return mx >= this.x && mx <= this.x+this.width && my >= this.y && my <= this.y+this.height; }
    };
  }
}

/**
 * Spawn green leaves function - enhanced for Universal Button System integration
 */
function spawnGreenLeaves(n = 10) {
  if (typeof resources === 'undefined' || !Array.isArray(resources)) {
    console.log("❌ Global 'resources' array not found.");
    return;
  }
  
  const img = (typeof leafImg !== 'undefined') ? leafImg : (typeof greenLeaf !== 'undefined' ? greenLeaf : null);
  let spawned = 0;
  
  for (let i = 0; i < n; i++) {
    const px = random(0, (typeof g_canvasX !== 'undefined' ? g_canvasX : width) - 20);
    const py = random(0, (typeof g_canvasY !== 'undefined' ? g_canvasY : height) - 20);
    const size = createVector(20, 20);
    const pos = createVector(px, py);
    
    try {
      const r = new Resource(pos, size, 'greenLeaf', img);
      resources.push(r);
      spawned++;
    } catch (e) {
      // fallback to older Resource constructor signatures
      try { 
        resources.push(new Resource(px, py, size.x, size.y, 'greenLeaf', img)); 
        spawned++;
      } catch (err) { 
        console.warn("Spawn fallback failed:", err); 
      }
    }
  }
  
  console.log(`✅ Spawned ${spawned} greenLeaf resource(s). Total resources: ${resources.length}`);
  
  // Update resource counters if available
  if (window && window.buttonGroupManager) {
    // Trigger resource counter updates if they exist
    try {
      if (typeof updateResourceDisplays === 'function') {
        updateResourceDisplays();
      }
    } catch (error) {
      // Resource display updates are optional
    }
  }
}

/**
 * Update spawn leaf UI - now handles both Universal and legacy systems
 */
function updateSpawnGreenLeafUI() {
  if (spawnLeafUI.usingUniversalSystem) {
    // Universal Button System handles positioning and updates automatically
    // We just need to update the count if it changed
    updateSpawnLeafButtonText();
    return;
  }
  
  // Legacy system update
  if (!spawnLeafUI.button) return;
  
  const bx = 10;
  const by = Math.max(10, height - 50);
  spawnLeafUI.button.setPosition(bx, by);
  spawnLeafUI.button.update(mouseX, mouseY, mouseIsPressed);
  spawnLeafUI.prevMousePressed = !!mouseIsPressed;
}

/**
 * Draw spawn leaf UI - now handles both Universal and legacy systems
 */
function drawSpawnGreenLeafUI() {
  if (spawnLeafUI.usingUniversalSystem) {
    // Universal Button System handles rendering automatically
    return;
  }
  
  // Legacy system render
  if (!spawnLeafUI.button) return;
  spawnLeafUI.button.render();
}

/**
 * Set spawn count - updates both systems
 */
function setSpawnLeafCount(count) {
  spawnLeafUI.count = Math.max(1, count);
  updateSpawnLeafButtonText();
  
  // Update legacy button if active
  if (!spawnLeafUI.usingUniversalSystem && spawnLeafUI.button) {
    spawnLeafUI.button.label = `Spawn ${spawnLeafUI.count} leaves`;
  }
}

// expose
if (typeof window !== 'undefined') {
  window.initSpawnGreenLeafButton = initSpawnGreenLeafButton;
  window.updateSpawnGreenLeafUI = updateSpawnGreenLeafUI;
  window.drawSpawnGreenLeafUI = drawSpawnGreenLeafUI;
  window.spawnGreenLeaves = spawnGreenLeaves;
  window.setSpawnLeafCount = setSpawnLeafCount;
}