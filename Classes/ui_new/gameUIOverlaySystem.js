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
    
    if (typeof g_powerButtonPanel === 'undefined') {
        console.error('❌ g_powerButtonPanel class not found');
        return null;
    }
    
    if (typeof MiniMap === 'undefined') {
        console.error('❌ MiniMap class not found');
        return null;
    }
    
    if (typeof DayNightCycleBox === 'undefined') {
        console.error('❌ DayNightCycleBox class not found');
        return null;
    }
    
    if (typeof WeatherBox === 'undefined') {
        console.error('❌ WeatherBox class not found');
        return null;
    }
    
    if (typeof AntSelectionBar === 'undefined') {
        console.error('❌ AntSelectionBar class not found');
        return null;
    }
    
    if (typeof RenderManager === 'undefined') {
        console.error('❌ RenderManager not found');
        return null;
    }

    // Get p5 instance (sketch.js uses global p5 functions)
    const p5Instance = window;

    window.antCountDropdown = new AntCountDropDown(p5Instance, {
      normalizedX: -0.8,  // 80% left from center
      normalizedY: 0.85,  // 85% up from center
      faction: 'player'
    });
  
    window.resourceCountDisplay = new ResourceCountDisplay(p5Instance, {
      normalizedX: 0,     // Centered horizontally
      normalizedY: 0.95,  // 95% up from center (near top)
      height: 40 
    });
    
    window.g_powerButtonPanel = new g_powerButtonPanel(p5Instance, {
      normalizedX: 0,  // 70% right from center (right side)
      normalizedY: -.9,  // 80% up from center (near top)
      powers: ['lightning', 'fireball']
    });
    
    // Initialize MiniMap with active terrain
    if (window.g_activeMap) {

    } else {
        console.warn('⚠️ No terrain map available for MiniMap');
    }
    
    // Initialize Day/Night Cycle Box
    window.g_dayNightCycleBox = new DayNightCycleBox(p5Instance, {
        normalizedX: 0.9,  // 90% right from center
        normalizedY: 0.8, // 80% up from center
        width: 120,
        height: 90
    });
    
    // Initialize Weather Box (next to day/night cycle box)
    window.g_weatherBox = new WeatherBox(p5Instance, {
        normalizedX: 0.75,  // 75% right from center (left of day/night box)
        normalizedY: 0.8,   // 80% up from center (same height as day/night box)
        width: 100,
        height: 90
    });
    
    // Initialize Ant Selection Bar (bottom-left for quick ant group selection)
    window.g_antSelectionBar = new AntSelectionBar(p5Instance, {
        normalizedX: -0.6,  // 60% left from center
        normalizedY: -0.85, // 85% down from center (bottom area)
        faction: 'player'
        // jobTypes uses default (Queen first with proper keybinds)
    });

    UIRegisterWithRenderer(p5Instance);
    
    // Mark as initialized
    window.g_gameUIOverlay = {
        antCountDropdown: window.antCountDropdown,
        resourceCountDisplay: window.resourceCountDisplay,
        g_powerButtonPanel: window.g_powerButtonPanel,
        miniMap: window.g_miniMap,
        dayNightCycleBox: window.g_dayNightCycleBox,
        weatherBox: window.g_weatherBox,
        antSelectionBar: window.g_antSelectionBar
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
        if (window.g_powerButtonPanel) {
            window.g_powerButtonPanel.update();
            window.g_powerButtonPanel.render();
        }
        if (window.g_miniMap) {
            window.g_miniMap.update();
            // Render using normalized position stored in minimap
            window.g_miniMap.render(window.g_miniMap.x, window.g_miniMap.y);
        }
        if (window.g_dayNightCycleBox) {
            window.g_dayNightCycleBox.update();
            window.g_dayNightCycleBox.render();
        }
        if (window.g_weatherBox) {
            window.g_weatherBox.update();
            window.g_weatherBox.render();
        }
        if (window.g_antSelectionBar) {
            window.g_antSelectionBar.update();
            window.g_antSelectionBar.render();
        }
    });

    // Register ant count dropdown
    if (window.antCountDropdown && window.antCountDropdown.registerInteractive) {
        window.antCountDropdown.registerInteractive();
        console.log('✅ AntCountDropDown interactive registration complete');
    }
    
    // Register interactive panel
    if (window.g_powerButtonPanel && window.g_powerButtonPanel.registerInteractive) {
        window.g_powerButtonPanel.registerInteractive();
        console.log('✅ g_powerButtonPanel interactive registration complete');
    } else {
        console.warn('⚠️ g_powerButtonPanel.registerInteractive not available');
    }
    
    // Register minimap interactive
    if (window.g_miniMap && window.g_miniMap.registerInteractive) {
        window.g_miniMap.registerInteractive();
        console.log('✅ MiniMap interactive registration complete');
    } else {
        console.warn('⚠️ MiniMap.registerInteractive not available');
    }
    
    // Register day/night cycle box interactive
    if (window.g_dayNightCycleBox && window.g_dayNightCycleBox.registerInteractive) {
        window.g_dayNightCycleBox.registerInteractive();
        console.log('✅ DayNightCycleBox interactive registration complete');
    } else {
        console.warn('⚠️ DayNightCycleBox.registerInteractive not available');
    }
    
    // Register weather box interactive
    if (window.g_weatherBox && window.g_weatherBox.registerInteractive) {
        window.g_weatherBox.registerInteractive();
        console.log('✅ WeatherBox interactive registration complete');
    } else {
        console.warn('⚠️ WeatherBox.registerInteractive not available');
    }
    
    // Register ant selection bar interactive
    if (window.g_antSelectionBar && window.g_antSelectionBar.registerInteractive) {
        window.g_antSelectionBar.registerInteractive();
        console.log('✅ AntSelectionBar interactive registration complete');
    } else {
        console.warn('⚠️ AntSelectionBar.registerInteractive not available');
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
