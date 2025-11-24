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
    
    if (typeof PowerButtonPanel === 'undefined') {
        console.error('❌ PowerButtonPanel class not found');
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
      height: 40 
    });
    
    window.powerButtonPanel = new PowerButtonPanel(p5Instance, {
      y: 60,
      powers: ['lightning', 'fireball', 'finalFlash']
    });
    
    console.log('✅ PowerButtonPanel created:', window.powerButtonPanel);

    UIRegisterWithRenderer(p5Instance);
    
    // Mark as initialized
    window.g_gameUIOverlay = {
        antCountDropdown: window.antCountDropdown,
        resourceCountDisplay: window.resourceCountDisplay,
        powerButtonPanel: window.powerButtonPanel
    };
    
    return window.g_gameUIOverlay;
}

/**
 * Initialize UI components
 * Should be called after managers are initialized
 */
function UIRegisterWithRenderer(p5Instance) {   
    console.log('📋 Registering UI components with RenderManager...');
    
    RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
        window.antCountDropdown.render();
        window.resourceCountDisplay.render();
        if (window.powerButtonPanel) {
            window.powerButtonPanel.update();
            window.powerButtonPanel.render();
        }
    });
    
    console.log('✅ UI components registered with RenderManager');
    
    // Register interactive panel
    if (window.powerButtonPanel && window.powerButtonPanel.registerInteractive) {
        window.powerButtonPanel.registerInteractive();
        console.log('✅ PowerButtonPanel interactive registration complete');
    } else {
        console.warn('⚠️ PowerButtonPanel.registerInteractive not available');
    }
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
