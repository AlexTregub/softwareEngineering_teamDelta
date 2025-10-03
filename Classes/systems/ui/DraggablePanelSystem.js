/**
 * @fileoverview Draggable Panel System Initialization
 * Sets up draggable panels for UI elements like resource display and performance monitor
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Initialize the Draggable Panel System
 * Call this from your main setup function after the Universal Button System
 */
async function initializeDraggablePanelSystem() {
  try {
    console.log('🪟 Starting Draggable Panel System initialization...');
    
    // Check if DraggablePanelManager is available
    if (typeof DraggablePanelManager === 'undefined') {
      console.error('❌ DraggablePanelManager not loaded. Check index.html script tags.');
      return false;
    }
    console.log('✅ DraggablePanelManager class found');
    
    // Create panel manager instance
    window.draggablePanelManager = new DraggablePanelManager();
    console.log('✅ DraggablePanelManager instance created');
    
    // Initialize the manager
    window.draggablePanelManager.initialize();
    console.log('✅ DraggablePanelManager initialized');
    
    // Create the resource display panel
    const resourceDisplayPanel = window.draggablePanelManager.addPanel({
      id: 'resource-display',
      title: 'Resources',
      position: { x: 20, y: 20 },
      size: { width: 180, height: 100 },
      style: {
        backgroundColor: [0, 0, 0, 150],
        titleColor: [255, 255, 255],
        textColor: [255, 255, 255],
        borderColor: [100, 100, 100],
        titleBarHeight: 25,
        padding: 10,
        fontSize: 14
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        snapToEdges: true
      }
    });
    console.log('✅ Resource display panel created');
    
    // Create the performance monitor panel
    const performancePanel = window.draggablePanelManager.addPanel({
      id: 'performance-monitor',
      title: 'Performance Monitor',
      position: { x: 20, y: 140 },
      size: { width: 220, height: 180 },
      style: {
        backgroundColor: [0, 0, 0, 180],
        titleColor: [0, 255, 0],
        textColor: [0, 255, 0],
        borderColor: [0, 150, 0],
        titleBarHeight: 25,
        padding: 10,
        fontSize: 12
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        snapToEdges: true
      },
      visible: true // Start visible, can be toggled with Ctrl+Shift+1
    });
    console.log('✅ Performance monitor panel created');
    
    // Set up content renderers
    window.draggablePanelContentRenderers = {
      'resource-display': renderResourceDisplayContent,
      'performance-monitor': renderPerformanceMonitorContent
    };
    console.log('✅ Panel content renderers configured');
    
    // Add keyboard shortcuts for toggling panels
    setupPanelKeyboardShortcuts();
    console.log('✅ Panel keyboard shortcuts configured');
    
    // Coordinate with UILayerRenderer to avoid double rendering
    coordinateWithUIRenderer();
    
    console.log('🎉 Draggable Panel System initialization complete!');
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
  // Get current resource values
  const wood = (typeof g_resourceList !== 'undefined' && g_resourceList.wood) ? g_resourceList.wood.length : 0;
  const food = (typeof g_resourceList !== 'undefined' && g_resourceList.food) ? g_resourceList.food.length : 0;
  const population = (typeof ants !== 'undefined') ? ants.length : 0;
  
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
    
    // Entity counts
    const entityCount = (typeof ants !== 'undefined') ? ants.length : 0;
    text(`Entities: ${entityCount} total`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    // UI elements (estimated)
    const uiElements = (window.buttonGroupManager ? window.buttonGroupManager.getActiveGroupCount() : 0) + 
                      (window.draggablePanelManager ? window.draggablePanelManager.getVisiblePanelCount() : 0);
    text(`UI Elements: ${uiElements}`, contentArea.x, contentArea.y + yOffset);
    yOffset += lineHeight;
    
    // Memory usage (if available)
    if (typeof performance !== 'undefined' && performance.memory) {
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
        // Ctrl+Shift+1: Toggle Performance Monitor
        if (keyCode === 49 && keyIsDown(CONTROL) && keyIsDown(SHIFT)) { // '1' key
          const visible = window.draggablePanelManager.togglePanel('performance-monitor');
          console.log(`Performance Monitor ${visible ? 'ENABLED' : 'DISABLED'}`);
        }
        
        // Ctrl+Shift+2: Toggle Resource Display
        if (keyCode === 50 && keyIsDown(CONTROL) && keyIsDown(SHIFT)) { // '2' key
          const visible = window.draggablePanelManager.togglePanel('resource-display');
          console.log(`Resource Display ${visible ? 'ENABLED' : 'DISABLED'}`);
        }
        
        // Ctrl+Shift+R: Reset all panels to default positions
        if (keyCode === 82 && keyIsDown(CONTROL) && keyIsDown(SHIFT)) { // 'R' key
          window.draggablePanelManager.resetAllPanels();
          console.log('All panels reset to default positions');
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
  if (typeof window !== 'undefined' && window.uiLayerRenderer) {
    // Disable the static performance overlay since we're using draggable panels
    if (window.uiLayerRenderer.debugUI && window.uiLayerRenderer.debugUI.performanceOverlay) {
      window.uiLayerRenderer.debugUI.performanceOverlay.enabled = false;
      console.log('✅ Static performance overlay disabled - using draggable panel');
    }
  }
  
  // If UILayerRenderer isn't available yet, set up a delayed check
  setTimeout(() => {
    if (typeof window !== 'undefined' && window.uiLayerRenderer && 
        window.uiLayerRenderer.debugUI && window.uiLayerRenderer.debugUI.performanceOverlay) {
      window.uiLayerRenderer.debugUI.performanceOverlay.enabled = false;
      console.log('✅ Static performance overlay disabled (delayed) - using draggable panel');
    }
  }, 1000);
}

/**
 * Update draggable panels (call this from your main draw loop)
 */
function updateDraggablePanels() {
  if (window.draggablePanelManager && typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
    const isPressed = typeof mouseIsPressed !== 'undefined' ? mouseIsPressed : false;
    window.draggablePanelManager.update(mouseX, mouseY, isPressed);
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