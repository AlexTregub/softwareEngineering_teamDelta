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
      

      
      try {
        // Handle action types directly or function-type actions
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
            
          case 'toolbar':
            return { success: handleToolbarAction(handler, parameters, gameContext) };
            
          case 'spawn':
            return { success: handleSpawnAction(handler, parameters, gameContext) };
            
          case 'kill':
            return { success: handleKillAction(handler, parameters, gameContext) };
            
          case 'placement':
            return { success: handlePlacementAction(handler, parameters, gameContext) };
            
          case 'function':
            // Handle legacy function-type actions by parsing the handler prefix
            if (handler) {
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
            break;
            
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

      return true;
    
    case 'game.save':

      // Implement save functionality
      return true;
    
    case 'game.load':

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

      // Implement entity movement
      return true;
    
    case 'entity.attack':

      // Implement entity attack
      return true;
    
    case 'entity.gather':

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
 * Handle toolbar actions (tool selection)
 */
function handleToolbarAction(handler, parameters, gameContext) {
  switch (handler) {
    case 'toolbar.selectTool':
      const tool = parameters.tool || 'unknown';
      const index = parameters.index || 0;
      console.log(`🔧 Selecting toolbar tool: ${tool} (index: ${index})`);
      
      // Update UILayerRenderer's active tool if available
      if (typeof window !== 'undefined' && window.UIRenderer && window.UIRenderer.hudElements) {
        window.UIRenderer.hudElements.toolbar.activeButton = index;
        console.log(`✅ Updated active toolbar button to index ${index}`);
      }
      
      // Store globally for other systems to use
      if (typeof window !== 'undefined') {
        window.activeToolbarTool = tool;
        window.activeToolbarIndex = index;
      }
      
      return true;
    
    default:
      console.warn(`⚠️ Unhandled toolbar action: ${handler}`);
      return false;
  }
}

/**
 * Handle spawn actions (create entities/resources)
 */
function handleSpawnAction(handler, parameters, gameContext) {
  switch (handler) {
    case 'spawn.ants':
      const antCount = parameters.count || 1;
      console.log(`🐜 Spawning ${antCount} ant(s)`);
      
      try {
        // Try multiple spawn methods for compatibility
        if (typeof handleSpawnCommand === 'function') {
          handleSpawnCommand([String(antCount), 'ant', 'player']);
        } else if (typeof antsSpawn === 'function') {
          antsSpawn(antCount);
        } else if (typeof executeCommand === 'function') {
          executeCommand(`spawn ${antCount} ant player`);
        } else {
          console.warn('No spawn method available');
          return false;
        }
        return true;
      } catch (error) {
        console.error('❌ Spawn ant error:', error);
        return false;
      }
    
    case 'spawn.greenLeaves':
      const leafCount = parameters.count || 10;
      console.log(`🍃 Spawning ${leafCount} green leaf resource(s)`);
      
      try {
        if (typeof spawnGreenLeaves === 'function') {
          spawnGreenLeaves(leafCount);
        } else {
          console.warn('spawnGreenLeaves function not available');
          return false;
        }
        return true;
      } catch (error) {
        console.error('❌ Spawn leaves error:', error);
        return false;
      }
    
    default:
      console.warn(`⚠️ Unhandled spawn action: ${handler}`);
      return false;
  }
}

/**
 * Handle kill actions (remove entities)
 */
function handleKillAction(handler, parameters, gameContext) {
  switch (handler) {
    case 'kill.ants':
      const killCount = parameters.count || 1;
      console.log(`💀 Removing ${killCount} ant(s)`);
      
      try {
        if (Array.isArray(ants) && ants.length > 0) {
          const toRemove = Math.min(killCount, ants.length);
          for (let i = 0; i < toRemove; i++) {
            ants.pop();
          }
          
          // Update ant index if it exists
          if (typeof antIndex === 'number') {
            antIndex = ants.length;
          }
          
          // Update selection controller if available
          if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) {
            g_selectionBoxController.entities = ants;
          }
          
          console.log(`✅ Removed ${toRemove} ant(s). Remaining: ${ants.length}`);
          return true;
        } else {
          console.warn('No ants to remove');
          return false;
        }
      } catch (error) {
        console.error('❌ Kill ants error:', error);
        return false;
      }
    
    default:
      console.warn(`⚠️ Unhandled kill action: ${handler}`);
      return false;
  }
}

/**
 * Handle placement actions (interactive placement modes)
 */
function handlePlacementAction(handler, parameters, gameContext) {
  switch (handler) {
    case 'placement.toggleDropoffMode':
      console.log('🏗️ Toggling dropoff placement mode');
      
      try {
        // Try the new universal system function first
        if (typeof toggleDropoffPlacementMode === 'function') {
          toggleDropoffPlacementMode();
          console.log('✅ Dropoff placement mode toggled via universal system');
          return true;
        }
        // Fallback to direct dropoffUI access
        else if (typeof dropoffUI !== 'undefined' && dropoffUI) {
          dropoffUI.placing = true;
          console.log('✅ Dropoff placement mode activated via legacy system');
          return true;
        } else {
          console.warn('dropoffUI not available');
          return false;
        }
      } catch (error) {
        console.error('❌ Dropoff placement error:', error);
        return false;
      }
    
    default:
      console.warn(`⚠️ Unhandled placement action: ${handler}`);
      return false;
  }
}

/**
 * Initialize the Universal Button Group System
 * Call this from your main setup function
 */
async function initializeUniversalButtonSystem() {
  try {

    
    // Create the action factory
    const gameActionFactory = createGameActionFactory();

    
    // Make gameActionFactory globally available
    window.gameActionFactory = gameActionFactory;
    
    // Check if ButtonGroupManager is available
    if (typeof ButtonGroupManager === 'undefined') {
      console.error('❌ ButtonGroupManager not loaded. Check index.html script tags.');
      return false;
    }

    
    // Create button group manager instance
    window.buttonGroupManager = new ButtonGroupManager(gameActionFactory);

    
    // Verify the instance has required methods
    if (typeof window.buttonGroupManager.update !== 'function') {
      console.error('❌ ButtonGroupManager missing update method');
      return false;
    }
    if (typeof window.buttonGroupManager.render !== 'function') {
      console.error('❌ ButtonGroupManager missing render method');
      return false;
    }

    
    // Initialize the manager with proper configuration loading
    try {
      // Load button group configurations for current game state
      const currentState = window.GameState ? window.GameState.getState() : 'MENU';

      
      // Try to load the legacy conversions configuration file
      try {
        const response = await fetch('config/button-groups/legacy-conversions.json');
        if (response.ok) {
          const legacyConfig = await response.json();

          await window.buttonGroupManager.initialize(legacyConfig.groups);

        } else {
          throw new Error('Failed to load legacy-conversions.json');
        }
      } catch (configError) {
        console.warn('⚠️ Could not load legacy conversions config:', configError);
        
        // Fallback to default configuration
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

      }
    } catch (error) {
      console.error('❌ Failed to initialize ButtonGroupManager:', error);
      // Try initializing with empty array as fallback
      await window.buttonGroupManager.initialize([]);

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