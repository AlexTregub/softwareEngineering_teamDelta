/**
 * UI Selection Box Integration
 * Initializes and configures the UI selection box system for the effects layer
 */

/**
 * Initialize the UI selection box system
 * Called after all controllers and systems are set up
 */
function initializeUISelectionBox() {
  // Check if required components exist
  if (typeof g_uiSelectionController === 'undefined' || !g_uiSelectionController) {
    console.warn('UISelectionController not available - selection box integration skipped');
    return;
  }
  
  if (typeof globalThis.logNormal === 'function') {
    globalThis.logNormal('🎯 Initializing UI Selection Box system...');
  } else {
    console.log('🎯 Initializing UI Selection Box system...');
  }
  
  // Configure selection box appearance
  g_uiSelectionController.updateConfig({
    enableSelection: true,
    selectionColor: [0, 200, 255], // Cyan blue
    strokeWidth: 2,
    fillAlpha: 30,
    minSelectionSize: 10
  });
  
  // Set up selection callbacks
  g_uiSelectionController.setCallbacks({
    onSelectionStart: onUISelectionStart,
    onSelectionUpdate: onUISelectionUpdate,
    onSelectionEnd: onUISelectionEnd,
    onSingleClick: onUISelectionClick
  });
  
  // Set selectable entities (ants by default)
  updateUISelectionEntities();

  if (globalDebugVerbosity >= 1) {
    console.log('✅ UI Selection Box system initialized');
  }
}

/**
 * Update the entities that can be selected by the UI selection box
 */
function updateUISelectionEntities() {
  if (!g_uiSelectionController) return;
  
  // Get all current ants
  const selectableAnts = [];
  if (ants && Array.isArray(ants)) {
    for (const ant of ants) {
      if (ant && ant.antObject) {
        selectableAnts.push(ant.antObject);
      } else if (ant) {
        selectableAnts.push(ant);
      }
    }
  }
  
  g_uiSelectionController.setSelectableEntities(selectableAnts);
}

/**
 * Selection start callback
 * @param {number} x - Start X position
 * @param {number} y - Start Y position
 * @param {Array} entities - Initial entities (empty array)
 */
function onUISelectionStart(x, y, entities) {
  console.log(`🎯 Selection started at (${x}, ${y})`);
  
  // Clear existing selections on ants
  if (ants && Array.isArray(ants)) {
    for (const ant of ants) {
      const antObj = ant.antObject || ant;
      if (antObj && antObj.isSelected !== undefined) {
        antObj.isSelected = false;
      }
    }
  }
  
  // Show selection feedback effect
  if (typeof window.EffectsRenderer !== 'undefined') {
    window.EffectsRenderer.selectionSparkle(x, y, {
      color: [0, 255, 255],
      particleCount: 3
    });
  }
}

/**
 * Selection update callback
 * @param {Object} bounds - Selection bounds {x1, y1, x2, y2, width, height}
 * @param {Array} entitiesInBox - Entities currently in selection box
 */
function onUISelectionUpdate(bounds, entitiesInBox) {
  if (!bounds) return;
  
  // Update hover states for entities
  if (ants && Array.isArray(ants)) {
    for (const ant of ants) {
      const antObj = ant.antObject || ant;
      if (antObj && antObj.isBoxHovered !== undefined) {
        antObj.isBoxHovered = entitiesInBox.includes(antObj);
      }
    }
  }
  
  // Optional: Show selection area indicator
  const area = bounds.width * bounds.height;
  if (area > 1000) { // Only show for reasonably sized selections
    // Could add visual feedback here
  }
}

/**
 * Selection end callback
 * @param {Object} bounds - Final selection bounds
 * @param {Array} selectedEntities - Final selected entities
 */
function onUISelectionEnd(bounds, selectedEntities) {
  console.log(`🎯 Selection ended: ${selectedEntities.length} entities selected`);
  
  // Set selection state on ants
  if (ants && Array.isArray(ants)) {
    for (const ant of ants) {
      const antObj = ant.antObject || ant;
      if (antObj) {
        antObj.isSelected = selectedEntities.includes(antObj);
        antObj.isBoxHovered = false; // Clear hover state
      }
    }
  }
  
  // Show selection confirmation effect
  if (selectedEntities.length > 0 && typeof window.EffectsRenderer !== 'undefined') {
    const centerX = bounds.x1 + bounds.width / 2;
    const centerY = bounds.y1 + bounds.height / 2;
    
    window.EffectsRenderer.selectionSparkle(centerX, centerY, {
      color: [0, 255, 0],
      particleCount: selectedEntities.length,
      duration: 800
    });
  }
  
  // Update global selected ant for compatibility with existing systems
  if (typeof window !== 'undefined') {
    if (selectedEntities.length === 1) {
      window.selectedAnt = selectedEntities[0];
    } else if (selectedEntities.length === 0) {
      window.selectedAnt = null;
    }
    // For multiple selections, keep selectedAnt as null or the first one
  }
  
  // Call existing selection handlers if they exist
  if (typeof onAntsSelected === 'function') {
    onAntsSelected(selectedEntities);
  }
}

/**
 * Single click callback
 * @param {number} x - Click X position
 * @param {number} y - Click Y position
 * @param {number|string} button - Mouse button
 * @param {Object|null} clickedEntity - Entity that was clicked (null if none)
 */
function onUISelectionClick(x, y, button, clickedEntity) {
  console.log(`🎯 Single click at (${x}, ${y}) on entity:`, clickedEntity ? 'Yes' : 'No');
  
  if (clickedEntity) {
    // Single entity selection
    if (ants && Array.isArray(ants)) {
      for (const ant of ants) {
        const antObj = ant.antObject || ant;
        if (antObj) {
          antObj.isSelected = (antObj === clickedEntity);
        }
      }
    }
    
    // Update global selected ant
    if (typeof window !== 'undefined') {
      window.selectedAnt = clickedEntity;
    }
    
    // Show click effect
    if (typeof window.EffectsRenderer !== 'undefined') {
      window.EffectsRenderer.selectionSparkle(x, y, {
        color: [255, 255, 0],
        particleCount: 5
      });
    }
  } else {
    // Clicked empty space - deselect all
    if (ants && Array.isArray(ants)) {
      for (const ant of ants) {
        const antObj = ant.antObject || ant;
        if (antObj && antObj.isSelected !== undefined) {
          antObj.isSelected = false;
        }
      }
    }
    
    if (typeof window !== 'undefined') {
      window.selectedAnt = null;
    }
  }
  
  // Call existing click handlers if they exist
  if (typeof onAntClicked === 'function') {
    onAntClicked(clickedEntity, x, y, button);
  }
}

/**
 * Get currently selected ants from the UI selection system
 * @returns {Array} Array of selected ant objects
 */
function getUISelectedAnts() {
  if (!g_uiSelectionController) return [];
  return g_uiSelectionController.getSelectedEntities();
}

/**
 * Clear the UI selection
 */
function clearUISelection() {
  if (!g_uiSelectionController) return;
  g_uiSelectionController.clearSelection();
  
  // Clear ant selection states
  if (ants && Array.isArray(ants)) {
    for (const ant of ants) {
      const antObj = ant.antObject || ant;
      if (antObj && antObj.isSelected !== undefined) {
        antObj.isSelected = false;
      }
    }
  }
  
  if (typeof window !== 'undefined') {
    window.selectedAnt = null;
  }
}

/**
 * Toggle UI selection box on/off
 * @param {boolean} enabled - Whether to enable selection
 */
function setUISelectionEnabled(enabled) {
  if (!g_uiSelectionController) return;
  g_uiSelectionController.setEnabled(enabled);
  console.log(`🎯 UI Selection Box ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Get debug information about the UI selection system
 * @returns {Object} Debug information
 */
function getUISelectionDebugInfo() {
  if (!g_uiSelectionController) {
    return { error: 'UISelectionController not available' };
  }
  
  return {
    controller: g_uiSelectionController.getDebugInfo(),
    selectedAnts: getUISelectedAnts().length,
    totalAnts: (ants && Array.isArray(ants)) ? ants.length : 0,
    effectsRenderer: typeof window.EffectsRenderer !== 'undefined'
  };
}

// Auto-initialize when components are ready
function checkUISelectionReadiness() {
  if (typeof g_uiSelectionController !== 'undefined' && 
      g_uiSelectionController && 
      typeof ants !== 'undefined') {
    initializeUISelectionBox();
    return true;
  }
  return false;
}

// Try to initialize after a short delay to ensure all systems are loaded
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!checkUISelectionReadiness()) {
      // Try again after another delay
      setTimeout(checkUISelectionReadiness, 1000);
    }
  }, 500);
}

// Expose functions to global scope for debugging and integration
if (typeof window !== 'undefined') {
  window.initializeUISelectionBox = initializeUISelectionBox;
  window.updateUISelectionEntities = updateUISelectionEntities;
  window.getUISelectedAnts = getUISelectedAnts;
  window.clearUISelection = clearUISelection;
  window.setUISelectionEnabled = setUISelectionEnabled;
  window.getUISelectionDebugInfo = getUISelectionDebugInfo;
}