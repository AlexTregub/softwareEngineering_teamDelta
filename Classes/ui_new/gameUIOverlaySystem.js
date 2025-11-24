/**
 * Game UI Overlay System
 * @module ui_new/gameUIOverlaySystem
 * 
 * Initializes and manages the main game UI overlay with all components.
 * Integrates with RenderLayerManager for automatic rendering.
 */

/**
 * Initialize the game UI overlay system
 */
function initializeGameUIOverlay() {
    // Check if already initialized
    if (window.g_gameUIOverlay) {
        console.warn('⚠️ Game UI Overlay already initialized');
        return window.g_gameUIOverlay;
    }
    
    if (typeof AntCountDropDown === 'undefined') {
        console.error('❌ AntCountDropDown class not found');
        return null;
    }

    if (typeof ResourceCountDisplay === 'undefined') {
        console.error('❌ ResourceCountDisplay class not found');
        return null;
    }
    
    if (typeof RenderManager === 'undefined') {
        console.error('❌ RenderManager not found');
        return null;
    }

    // Get p5 instance (sketch.js uses global p5 functions)
    const p5Instance = window;

    window.antCountDropdown = new AntCountDropDown(p5Instance, {
      x: 20,
      y: 80,
      faction: 'player'
    });
  
    window.resourceCountDisplay = new ResourceCountDisplay(p5Instance, {
      height: 40 })
    

    UIRegisterWithRenderer(p5Instance);
}

/**
 * Initialize UI components
 * Should be called after managers are initialized
 */
function UIRegisterWithRenderer(p5Instance) {   
    RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
        window.antCountDropdown.render();
        window.resourceCountDisplay.render();
    });
}

/**
 * Initialize the entire game UI system
 * Combines overlay and UI components initialization
 */
function initializeGameUISystem() {
    initializeGameUIOverlay();
}


// Make functions globally available
if (typeof window !== 'undefined') {
    window.initializeGameUIOverlay = initializeGameUIOverlay;
    window.UIRegisterWithRenderer = UIRegisterWithRenderer;
}
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
    module.exports = {
        initializeGameUIOverlay,
        UIRegisterWithRenderer
    };
}
