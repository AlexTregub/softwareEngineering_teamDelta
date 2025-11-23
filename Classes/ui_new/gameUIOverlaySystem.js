/**
 * Game UI Overlay System
 * @module ui_new/gameUIOverlaySystem
 * 
 * Initializes and manages the main game UI overlay with all components.
 * Integrates with RenderLayerManager for automatic rendering.
 */

/**
 * Initialize the game UI overlay system
 * Creates overlay with AntCountDropDown and registers with RenderLayerManager
 * 
 * @returns {Object} The created overlay instance
 */
function initializeGameUIOverlay() {
    // Check if already initialized
    if (window.g_gameUIOverlay) {
        console.warn('⚠️ Game UI Overlay already initialized');
        return window.g_gameUIOverlay;
    }
    
    // Ensure dependencies are available
    if (typeof GameUIOverlay === 'undefined') {
        console.error('❌ GameUIOverlay class not found');
        return null;
    }
    
    if (typeof AntCountDropDown === 'undefined') {
        console.error('❌ AntCountDropDown class not found');
        return null;
    }
    
    if (typeof RenderManager === 'undefined') {
        console.error('❌ RenderManager not found');
        return null;
    }
    
    // Get p5 instance (sketch.js uses global p5 functions)
    const p5Instance = window;
    
    // Create overlay
    const overlay = new GameUIOverlay(p5Instance, {
        visible: true
    });
    
    // Create and add AntCountDropDown
    const antCountDropDown = new AntCountDropDown(p5Instance, {
        position: { x: -350, y: -250 }
    });
    overlay.addComponent('antCount', antCountDropDown);
    
    // Store globally
    window.g_gameUIOverlay = overlay;
    
    // Register with RenderLayerManager for automatic rendering
    if (RenderManager && RenderManager.addDrawableToLayer) {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
            if (window.g_gameUIOverlay && window.g_gameUIOverlay.isVisible) {
                window.g_gameUIOverlay.render();
            }
        });
        console.log('✅ Game UI Overlay registered with RenderLayerManager (UI_GAME layer)');
    }
    
    console.log('✅ Game UI Overlay initialized with AntCountDropDown');
    
    return overlay;
}

/**
 * Toggle the game UI overlay visibility
 */
function toggleGameUIOverlay() {
    if (window.g_gameUIOverlay) {
        window.g_gameUIOverlay.toggle();
        console.log(`UI Overlay ${window.g_gameUIOverlay.isVisible ? 'shown' : 'hidden'}`);
    }
}

/**
 * Show the game UI overlay
 */
function showGameUIOverlay() {
    if (window.g_gameUIOverlay) {
        window.g_gameUIOverlay.show();
    }
}

/**
 * Hide the game UI overlay
 */
function hideGameUIOverlay() {
    if (window.g_gameUIOverlay) {
        window.g_gameUIOverlay.hide();
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.initializeGameUIOverlay = initializeGameUIOverlay;
    window.toggleGameUIOverlay = toggleGameUIOverlay;
    window.showGameUIOverlay = showGameUIOverlay;
    window.hideGameUIOverlay = hideGameUIOverlay;
}
