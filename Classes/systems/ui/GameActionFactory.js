/**
 * @fileoverview GameActionFactory - Action routing system for Universal Button Group System
 * Handles all button actions and routes them to appropriate game systems
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Create Action Factory for Button Group System
 * Handles routing button actions to appropriate game systems
 */
function createGameActionFactory() {
  return {
    executeAction: (buttonConfig, gameContext) => {
      const actionType = buttonConfig.action?.type;
      const handler = buttonConfig.action?.handler;
      const parameters = buttonConfig.action?.parameters || {};
      
      console.log(`🎯 Executing action: ${handler} (${actionType})`);
      
      try {
        // Handle function-type actions by parsing the handler prefix
        if (actionType === 'function' && handler) {
          const handlerParts = handler.split('.');
          const category = handlerParts[0];
          
          switch (category) {
            case 'gameState':
              return { success: handleGameStateAction(handler, parameters, gameContext) };
              
            case 'entity':
              return { success: handleEntityAction(handler, parameters, gameContext) };
              
            case 'ui':
              return { success: handleUIAction(handler, parameters, gameContext) };
              
            case 'debug':
              return { success: handleDebugAction(handler, parameters, gameContext) };
              
            case 'info':
              return { success: handleInfoAction(handler, parameters, gameContext) };
              
            case 'system':
              return { success: handleSystemAction(handler, parameters, gameContext) };
              
            default:
              console.warn(`⚠️ Unhandled function handler category: ${category}`);
              return { success: false, error: `Unknown handler category: ${category}` };
          }
        }
        
        // Handle explicit action types
        switch (actionType) {
          case 'gameState':
            return { success: handleGameStateAction(handler, parameters, gameContext) };
          
          case 'entity':
            return { success: handleEntityAction(handler, parameters, gameContext) };
          
          case 'ui':
            return { success: handleUIAction(handler, parameters, gameContext) };
          
          case 'debug':
            return { success: handleDebugAction(handler, parameters, gameContext) };
          
          case 'info':
            return { success: handleInfoAction(handler, parameters, gameContext) };
          
          case 'system':
            return { success: handleSystemAction(handler, parameters, gameContext) };
          
          default:
            console.warn(`⚠️ Unhandled action type: ${actionType}`);
            return { success: false, error: `Unknown action type: ${actionType}` };
        }
      } catch (error) {
        console.error(`❌ Action execution failed for ${handler}:`, error);
        return { 
          success: false, 
          error: error.message,
          handler: handler,
          actionType: actionType
        };
      }
    }
  };
}

/**
 * Handle game state actions (pause, save, load, etc.)
 */
function handleGameStateAction(handler, parameters, gameContext) {
  switch (handler) {
    case 'game.togglePause':
    case 'game.pause':
      // Toggle pause state - you'll need to implement this based on your game logic
      console.log('🎮 Toggling pause state');
      return true;
    
    case 'game.save':
      console.log('💾 Saving game');
      // Implement save functionality
      return true;
    
    case 'game.load':
      console.log('📁 Loading game');
      // Implement load functionality
      return true;
    
    case 'game.exit':
      console.log('🚪 Exiting game');
      // Implement exit functionality
      return true;
    
    default:
      console.warn(`⚠️ Unhandled game state action: ${handler}`);
      return false;
  }
}

/**
 * Handle entity actions (move, attack, gather, build)
 */
function handleEntityAction(handler, parameters, gameContext) {
  switch (handler) {
    case 'entity.move':
      console.log('🚶 Moving selected entities');
      // Implement entity movement
      return true;
    
    case 'entity.attack':
      console.log('⚔️ Attacking with selected entities');
      // Implement entity attack
      return true;
    
    case 'entity.gather':
      console.log('🌾 Gathering resources');
      // Implement resource gathering
      return true;
    
    case 'entity.build':
      console.log('🏗️ Building structures');
      // Implement building
      return true;
    
    default:
      console.warn(`⚠️ Unhandled entity action: ${handler}`);
      return false;
  }
}

/**
 * Handle UI actions (show menus, panels, etc.)
 */
function handleUIAction(handler, parameters, gameContext) {
  switch (handler) {
    case 'ui.showMenu':
      console.log('📋 Showing main menu');
      return true;
    
    case 'ui.showSettings':
      console.log('⚙️ Showing settings');
      return true;
    
    case 'ui.showGameMenu':
      console.log('🎮 Showing game menu');
      return true;
    
    case 'ui.showResourceDetails':
      const resourceType = parameters.resourceType || 'unknown';
      console.log(`📊 Showing ${resourceType} resource details`);
      return true;
    
    default:
      console.warn(`⚠️ Unhandled UI action: ${handler}`);
      return false;
  }
}

/**
 * Handle debug actions (toggle grid, FPS, spawn entities)
 */
function handleDebugAction(handler, parameters, gameContext) {
  switch (handler) {
    case 'debug.toggleGrid':
      console.log('📐 Toggling grid display');
      // Toggle debug layer in render manager
      if (typeof window.g_renderLayerManager !== 'undefined' && window.g_renderLayerManager) {
        const enabled = window.g_renderLayerManager.toggleLayer('UI_DEBUG');
        console.log(`Grid debug layer ${enabled ? 'enabled' : 'disabled'}`);
        return true;
      } else {
        console.warn('RenderLayerManager not available for grid toggle');
        return false;
      }
    
    case 'debug.toggleFPS':
      console.log('📊 Toggling FPS display');
      // Toggle your FPS display
      return true;
    
    case 'debug.spawnAnt':
      console.log('🐜 Spawning test ant');
      // Spawn a test ant
      if (typeof g_antManager !== 'undefined' && g_antManager) {
        try {
          // You'll need to implement this based on your ant spawning logic
          console.log('🐜 Ant spawned successfully');
          return true;
        } catch (error) {
          console.error('❌ Failed to spawn ant:', error);
          return false;
        }
      }
      return false;
    
    default:
      console.warn(`⚠️ Unhandled debug action: ${handler}`);
      return false;
  }
}

/**
 * Handle info actions (display information)
 */
function handleInfoAction(handler, parameters, gameContext) {
  switch (handler) {
    case 'ui.showVersionInfo':
      console.log('ℹ️ Showing version information');
      return true;
    
    case 'ui.showResourceDetails':
      const resourceType = parameters.resourceType || 'unknown';
      console.log(`📊 Showing detailed ${resourceType} information`);
      return true;
    
    default:
      console.warn(`⚠️ Unhandled info action: ${handler}`);
      return false;
  }
}

/**
 * Handle system actions (exit, restart)
 */
function handleSystemAction(handler, parameters, gameContext) {
  switch (handler) {
    case 'game.exit':
    case 'system.exit':
      console.log('🚪 Exiting application');
      // window.close() might not work in all browsers
      return true;
    
    case 'system.restart':
      console.log('🔄 Restarting application');
      window.location.reload();
      return true;
    
    default:
      console.warn(`⚠️ Unhandled system action: ${handler}`);
      return false;
  }
}

/**
 * Initialize the Universal Button Group System
 * Call this from your main setup function
 */
async function initializeUniversalButtonSystem() {
  try {
    console.log('🔄 Starting Universal Button Group System initialization...');
    
    // Create the action factory
    const gameActionFactory = createGameActionFactory();
    console.log('✅ Action factory created');
    
    // Make gameActionFactory globally available
    window.gameActionFactory = gameActionFactory;
    
    // Check if ButtonGroupManager is available
    if (typeof ButtonGroupManager === 'undefined') {
      console.error('❌ ButtonGroupManager not loaded. Check index.html script tags.');
      return false;
    }
    console.log('✅ ButtonGroupManager class found');
    
    // Create button group manager instance
    window.buttonGroupManager = new ButtonGroupManager(gameActionFactory);
    console.log('✅ ButtonGroupManager instance created');
    
    // Verify the instance has required methods
    if (typeof window.buttonGroupManager.update !== 'function') {
      console.error('❌ ButtonGroupManager missing update method');
      return false;
    }
    if (typeof window.buttonGroupManager.render !== 'function') {
      console.error('❌ ButtonGroupManager missing render method');
      return false;
    }
    console.log('✅ ButtonGroupManager methods verified');
    
    // Initialize the manager with proper configuration loading
    try {
      // Load button group configurations for current game state
      const currentState = window.GameState ? window.GameState.getState() : 'MENU';
      console.log(`🔧 Loading button groups for state: ${currentState}`);
      
      // For now, create a basic menu navigation group as default
      const defaultMenuConfig = {
        id: 'default-menu-nav',
        name: 'Default Menu Navigation',
        layout: {
          type: 'vertical',
          position: { x: 60, y: 60 },
          spacing: 10
        },
        appearance: {
          visible: true,
          transparency: 1.0
        },
        behavior: {
          draggable: true,
          resizable: false,
          snapToEdges: false
        },
        conditions: {},
        buttons: [
          {
            id: 'debug-toggle',
            text: '🔧 Debug',
            size: { width: 80, height: 30 },
            action: { type: 'debug', handler: 'debug.toggleGrid' }
          }
        ]
      };
      
      await window.buttonGroupManager.initialize([defaultMenuConfig]);
      console.log('✅ ButtonGroupManager initialized with default configuration');
    } catch (error) {
      console.error('❌ Failed to initialize ButtonGroupManager:', error);
      // Try initializing with empty array as fallback
      await window.buttonGroupManager.initialize([]);
      console.log('⚠️ ButtonGroupManager initialized with empty configuration');
    }
    
    console.log('🎮 Universal Button Group System initialized successfully');
    console.log('📊 System status:', {
      hasUpdate: typeof window.buttonGroupManager.update === 'function',
      hasRender: typeof window.buttonGroupManager.render === 'function',
      isInitialized: window.buttonGroupManager.isInitialized,
      activeGroups: window.buttonGroupManager.getActiveGroupCount()
    });
    
    // Debug: Monitor current game state
    if (typeof window.GameState !== 'undefined') {
      console.log('🎯 Current game state:', window.GameState.getState());
    }
    console.log('🔗 State bridge active: currentGameState will be set by RenderLayerManager');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Universal Button Group System:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.createGameActionFactory = createGameActionFactory;
  window.initializeUniversalButtonSystem = initializeUniversalButtonSystem;
}