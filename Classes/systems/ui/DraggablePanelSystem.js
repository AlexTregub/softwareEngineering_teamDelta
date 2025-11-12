/**
 * @fileoverview Draggable Panel System Initialization
 * Sets up draggable panels for UI});
    
    if (typeof globalThis.logVerbose === 'function') {
      globalThis.logVerbose('✅ Debug info panel created');s like resource display and performance monitor
 * 
 */

/**
 * Initialize the Draggable Panel System
 * Call this from your main setup function after the Universal Button System
 */
async function initializeDraggablePanelSystem() {
  try {
    // Check if DraggablePanelManager is available
    if (typeof DraggablePanelManager === 'undefined') {
      console.error('❌ DraggablePanelManager not loaded. Check index.html script tags.');
      return false;
    }

    
    // Create panel manager instance
    window.draggablePanelManager = new DraggablePanelManager();
    window.draggablePanelManager.initialize();

    // Add keyboard shortcuts for toggling panels
    setupPanelKeyboardShortcuts();
    
    // Coordinate with UILayerRenderer to avoid double rendering
    coordinateWithUIRenderer();
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Draggable Panel System:', error);
    return false;
  }
}

/**
 * Content renderer for the resource display panel
 */
function renderResourceDisplayContent(contentArea, style) {
  // Get current resource values from the new resource system
  let wood = 0, food = 0;
  
  if (g_entityInventoryManager && typeof g_entityInventoryManager.getResourcesByType === 'function') {
    wood = g_entityInventoryManager.getResourcesByType('wood').length;
    food = g_entityInventoryManager.getResourcesByType('food').length + 
           g_entityInventoryManager.getResourcesByType('greenLeaf').length + 
           g_entityInventoryManager.getResourcesByType('mapleLeaf').length;
  } else if (g_resourceList && g_resourceList.wood) {
    // Fallback to old system
    wood = g_resourceList.wood.length;
    food = g_resourceList.food.length;
  }
  
  const population = ants ? ants.length : 0;
  
  // Render resource text
  if (typeof text === 'function') {
    let yOffset = 0;
    const lineHeight = 18;
    
    text(`Wood: ${wood}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    text(`Food: ${food}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    text(`Population: ${population}`, contentArea.x, contentArea.y + yOffset);
  }
}

/**
 * Content renderer for the performance monitor panel
 */
function renderPerformanceMonitorContent(contentArea, style) {
  if (typeof text === 'function') {
    let yOffset = 0;
    const lineHeight = 16;
    
    // FPS
    const fps = (typeof frameRate === 'function' ? frameRate() : 60).toFixed(1);
    text(`FPS: ${fps}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    // Frame time
    const frameTime = (1000 / (typeof frameRate === 'function' ? frameRate() : 60)).toFixed(1);
    text(`Frame Time: ${frameTime}ms`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    // Entity counts (from spatial grid)
    let entityCount = 0;
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
      entityCount = spatialGridManager.getEntityCountByType('ant');
    }
    text(`Entities: ${entityCount} total`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    // UI elements (estimated)
    const uiElements = (window.draggablePanelManager ? window.draggablePanelManager.getVisiblePanelCount() : 0);
    text(`UI Elements: ${uiElements}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    // Memory usage (if available)
    if (performance && performance.memory) {
      const memoryMB = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
      text(`Memory: ${memoryMB}MB`, contentArea.x, contentArea.y + yOffset);
      yOffset += lineHeight;
    }
    
    // Panel system status
    if (window.draggablePanelManager) {
      const panelCount = window.draggablePanelManager.getPanelCount();
      text(`Panels: ${panelCount} registered`, contentArea.x, contentArea.y + yOffset);
    }
  }
}

/**
 * Content renderer for the debug info panel
 */
function renderDebugInfoContent(contentArea, style) {
  if (typeof text === 'function') {
    let yOffset = 0;
    const lineHeight = 16;
    
    // Game State
    text(`Game State: ${GameState ? GameState.getState() : 'Unknown'}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    // Canvas info
    text(`Canvas: ${g_canvasX}x${g_canvasY}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    // Tile size
    text(`Tile Size: ${TILE_SIZE}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    // Entity counts
    if (ants) {
      text(`Ants: ${ants.length || 0}`, contentArea.x, contentArea.y + yOffset);
      yOffset += lineHeight;
    }
    
    // Resources count from new system
    if (g_entityInventoryManager && typeof g_entityInventoryManager.getResourceList === 'function') {
      text(`Resources: ${g_entityInventoryManager.getResourceList().length || 0}`, contentArea.x, contentArea.y + yOffset);
      yOffset += lineHeight;
    } else if (g_resourceList && g_resourceList.resources) {
      text(`Resources: ${g_resourceList.resources.length || 0}`, contentArea.x, contentArea.y + yOffset);
      yOffset += lineHeight;
    }
    
    // Layer toggles info (compact version)
    if (g_renderLayerManager) {
      yOffset += 5; // Extra spacing
      text('Layer Toggles (Shift+Key):', contentArea.x, contentArea.y + yOffset);
      yOffset += lineHeight;
      
      const layerStates = g_renderLayerManager.getLayerStates();
      text(`C=Terrain:${layerStates.TERRAIN ? 'ON' : 'OFF'}`, contentArea.x, contentArea.y + yOffset);
      yOffset += lineHeight;
      text(`V=Entities:${layerStates.ENTITIES ? 'ON' : 'OFF'}`, contentArea.x, contentArea.y + yOffset);
      yOffset += lineHeight;
      text(`B=Effects:${layerStates.EFFECTS ? 'ON' : 'OFF'}`, contentArea.x, contentArea.y + yOffset);
    }
  }
}

/**
 * Set up keyboard shortcuts for panel management
 */
function setupPanelKeyboardShortcuts() {
  // Add to existing keyboard handler or create one
  if (typeof window !== 'undefined') {
    // Store original keyPressed if it exists
    const originalKeyPressed = window.keyPressed;
    
    window.keyPressed = function() {
      // Call original keyPressed first
      if (originalKeyPressed && typeof originalKeyPressed === 'function') {
        originalKeyPressed();
      }
      
      // Handle panel shortcuts
      if (window.draggablePanelManager) {
        // Shift+N: Toggle All UI Panels (handled by UIController now)
        if (keyCode === 78 && keyIsDown(SHIFT) && !keyIsDown(CONTROL)) { // 'N' key
          // Let UIController handle this via g_keyboardController
          return;
        }
        
        // Ctrl+Shift+R: Reset all panels to default positions
        if (keyCode === 82 && keyIsDown(CONTROL) && keyIsDown(SHIFT)) { // 'R' key
          window.draggablePanelManager.resetAllPanels();
          logNormal('All panels reset to default positions');
        }
      }
    };
  }
}

/**
 * Coordinate with UILayerRenderer to avoid double rendering
 */
function coordinateWithUIRenderer() {
  // Try to access the UILayerRenderer instance and disable static performance overlay
  if (window.uiLayerRenderer) {
    // Disable the static performance overlay since we're using draggable panels
    if (window.uiLayerRenderer.debugUI && window.uiLayerRenderer.debugUI.performanceOverlay) {
      window.uiLayerRenderer.debugUI.performanceOverlay.enabled = false;
      logNormal('✅ Static performance overlay disabled - using draggable panel');
    }
  }
  
  // If UILayerRenderer isn't available yet, set up a delayed check
  setTimeout(() => {
    if (window.uiLayerRenderer && 
        window.uiLayerRenderer.debugUI && window.uiLayerRenderer.debugUI.performanceOverlay) {
      window.uiLayerRenderer.debugUI.performanceOverlay.enabled = false;
      logNormal('✅ Static performance overlay disabled (delayed) - using draggable panel');
    }
  }, 1000);
}

/**
 * Update draggable panels (call this from your main draw loop)
 */
function updateDraggablePanels() {
  if (window.draggablePanelManager && mouseX !== undefined && mouseY !== undefined) {
    if (mouseIsPressed || true) {
      RenderManager.startRendererOverwrite(window.draggablePanelManager.update(mouseX, mouseY, mouse),1)
    }
  }
}

/**
 * Render draggable panels (call this from your main draw loop)
 */
function renderDraggablePanels() {
  if (window.draggablePanelManager && window.draggablePanelContentRenderers) {
    window.draggablePanelManager.render(window.draggablePanelContentRenderers);
  }
}

// Export functions for browser environment
if (typeof window !== 'undefined') {
  window.initializeDraggablePanelSystem = initializeDraggablePanelSystem;
  window.updateDraggablePanels = updateDraggablePanels;
  window.renderDraggablePanels = renderDraggablePanels;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeDraggablePanelSystem,
    updateDraggablePanels,
    renderDraggablePanels
  };
}