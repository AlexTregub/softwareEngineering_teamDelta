/**
 * @fileoverview Example usage and test file for the Universal Entity Debugger system
 * Demonstrates how to use the debugger with entities and the global debug controls.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Example function to demonstrate debugger usage with entities.
 * This shows how the debugger automatically integrates with Entity instances.
 */
function demonstrateEntityDebugger() {
  console.log('=== Entity Debugger Demo ===');
  
  // Create some example entities (this would normally happen in your game code)
  if (typeof Entity !== 'undefined') {
    // Create entities with different configurations
    const antEntity = new Entity(100, 100, 32, 32, {
      type: "Ant",
      movementSpeed: 50,
      selectable: true,
      debugBorderColor: '#FF0000',  // Red for ants
      showDebugPanel: true
    });
    
    const resourceEntity = new Entity(200, 150, 20, 20, {
      type: "Resource", 
      movementSpeed: 0,
      selectable: false,
      debugBorderColor: '#00FF00',  // Green for resources
      showDebugPanel: false
    });
    
    const queenEntity = new Entity(300, 200, 48, 48, {
      type: "Queen",
      movementSpeed: 25,
      selectable: true,
      debugBorderColor: '#FFD700',  // Gold for queen
      debugFontSize: 12
    });
    
    console.log('Created 3 test entities with debuggers');
    console.log('- Ant at (100,100) with red debug border');
    console.log('- Resource at (200,150) with green debug border'); 
    console.log('- Queen at (300,200) with gold debug border');
    
    // Demonstrate manual debugger control
    console.log('\n=== Manual Debugger Control ===');
    console.log('antEntity.toggleDebugger():', antEntity.toggleDebugger()); // Enable
    console.log('antEntity.isDebuggerActive():', antEntity.isDebuggerActive());
    console.log('resourceEntity.toggleDebugger(true):', resourceEntity.toggleDebugger(true)); // Force enable
    
    // Get debug information
    console.log('\n=== Debug Information ===');
    console.log('Ant debug info:', antEntity.getDebugInfo());
    
    return { antEntity, resourceEntity, queenEntity };
  } else {
    console.warn('Entity class not available - cannot demonstrate debugger');
    return null;
  }
}

/**
 * Demonstrates the global debug manager functionality.
 */
function demonstrateGlobalDebugManager() {
  console.log('\n=== Global Debug Manager Demo ===');
  
  const manager = getEntityDebugManager();
  if (!manager) {
    console.warn('EntityDebugManager not available');
    return;
  }
  
  // Show current stats
  console.log('Debug stats:', manager.getDebugStats());
  
  // Demonstrate global controls
  console.log('\n=== Keyboard Controls ===');
  console.log('Press ` (backtick) to toggle debug for nearest entities');
  console.log('Press Shift+` to show ALL entity debuggers');
  console.log('Press Alt+` to hide all entity debuggers');
  console.log('Press Ctrl+` to cycle through selected entity debuggers');
  
  return manager;
}

/**
 * Example of how to programmatically control debuggers for specific scenarios.
 */
function debugSelectedEntities() {
  const manager = getEntityDebugManager();
  if (!manager) return;
  
  const selectedEntities = manager.getAllEntities().filter(entity => 
    entity.isSelected && entity.isSelected()
  );
  
  console.log(`Found ${selectedEntities.length} selected entities`);
  
  // Hide all debuggers first
  manager.hideAllDebuggers();
  
  // Show debuggers only for selected entities
  selectedEntities.forEach(entity => entity.toggleDebugger(true));
  
  console.log('Enabled debuggers for selected entities only');
}

/**
 * Example of how to debug entities near a specific location.
 */
function debugNearestEntities(x, y, radius = 100) {
  const manager = getEntityDebugManager();
  if (!manager) return;
  
  const entities = manager.getAllEntities();
  const nearbyEntities = entities.filter(entity => {
    const pos = entity.getPosition();
    const dx = pos.x - x;
    const dy = pos.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= radius;
  });
  
  console.log(`Found ${nearbyEntities.length} entities within ${radius}px of (${x}, ${y})`);
  
  // Hide all debuggers first
  manager.hideAllDebuggers();
  
  // Show debuggers for nearby entities
  nearbyEntities.forEach(entity => entity.toggleDebugger(true));
  
  console.log('Enabled debuggers for nearby entities');
}

/**
 * Example of how to create custom debug configurations for different entity types.
 */
function setupCustomDebugConfigurations() {
  // Define debug configurations for different entity types
  const debugConfigs = {
    'Ant': {
      borderColor: '#FF4444',
      fillColor: 'rgba(255, 68, 68, 0.1)',
      fontSize: 10,
      showPropertyPanel: true,
      autoRefresh: true
    },
    'Resource': {
      borderColor: '#44FF44', 
      fillColor: 'rgba(68, 255, 68, 0.1)',
      fontSize: 8,
      showPropertyPanel: false,
      autoRefresh: false
    },
    'Queen': {
      borderColor: '#FFD700',
      fillColor: 'rgba(255, 215, 0, 0.2)',
      fontSize: 12,
      showPropertyPanel: true,
      autoRefresh: true
    }
  };
  
  const manager = getEntityDebugManager();
  if (!manager) return;
  
  // Apply configurations to existing entities
  manager.getAllEntities().forEach(entity => {
    const config = debugConfigs[entity.type];
    if (config) {
      const entityDebugger = entity.getDebugger();
      if (entityDebugger) {
        Object.assign(entityDebugger.config, config);
        console.log(`Applied custom debug config to ${entity.type}`);
      }
    }
  });
}

// --- Integration with existing game systems ---

/**
 * Integration function that can be called from sketch.js or main game loop.
 * This shows how to integrate the debugger with your existing game update cycle.
 */
function updateEntityDebuggers() {
  const manager = getEntityDebugManager();
  if (manager) {
    manager.update(); // Handle auto-hide and cleanup
  }
}

/**
 * Example of how to add debug commands to your existing command system.
 * This integrates with the existing debug command line interface.
 */
function setupDebugCommands() {
  // Add commands to existing debug command system if available
  if (typeof addDebugCommand === 'function') {
    addDebugCommand('debug-entities', 'Toggle entity debuggers', () => {
      const manager = getEntityDebugManager();
      if (manager) manager.toggleGlobalDebug();
    });
    
    addDebugCommand('debug-selected', 'Debug selected entities only', debugSelectedEntities);
    
    addDebugCommand('debug-near', 'Debug entities near mouse', () => {
      const x = (typeof mouseX !== 'undefined') ? mouseX : 400;
      const y = (typeof mouseY !== 'undefined') ? mouseY : 300;
      debugNearestEntities(x, y, 150);
    });
    
    addDebugCommand('debug-stats', 'Show debugger statistics', () => {
      const manager = getEntityDebugManager();
      if (manager) console.log('Debugger stats:', manager.getDebugStats());
    });
    
    addDebugCommand('debug-limit', 'Set debug limit (e.g., debug-limit 25)', (args) => {
      const manager = getEntityDebugManager();
      if (manager) {
        const limit = parseInt(args[0]) || 50;
        manager.setDebugLimit(limit);
        console.log(`Debug limit set to ${limit}`);
      }
    });
    
    addDebugCommand('debug-all-force', 'Force show ALL entity debuggers (ignores limits)', () => {
      const manager = getEntityDebugManager();
      if (manager) manager.showAllDebuggers(true);
    });
    
    addDebugCommand('debug-performance', 'Show performance data for all active debuggers', () => {
      const manager = getEntityDebugManager();
      if (manager) {
        const activeEntities = manager.getActiveDebugEntities();
        activeEntities.forEach(entity => {
          const entityDebugger = entity.getDebugger();
          if (entityDebugger) {
            const perfData = entityDebugger.getPerformanceData();
            console.log(`Performance for ${perfData.targetObjectType}:`, perfData);
          }
        });
      }
    });
    
    addDebugCommand('debug-perf-reset', 'Reset performance data for all debuggers', () => {
      const manager = getEntityDebugManager();
      if (manager) {
        const activeEntities = manager.getActiveDebugEntities();
        activeEntities.forEach(entity => {
          const entityDebugger = entity.getDebugger();
          if (entityDebugger) entityDebugger.resetPerformanceData();
        });
        console.log('Performance data reset for all active debuggers');
      }
    });
    
    console.log('Entity debugger commands added to debug system');
  }
}

// --- Auto-initialization ---

/**
 * Auto-setup function that runs when this file loads.
 * Demonstrates the debugger and sets up integration.
 */
function initializeDebuggerDemo() {
  console.log('🔍 Universal Entity Debugger loaded!');
  console.log('');
  console.log('=== Quick Start Guide ===');
  console.log('1. Press ` (backtick) to toggle entity debugging');
  console.log('2. Use Shift+`, Alt+`, Ctrl+` for advanced controls');
  console.log('3. Call demonstrateEntityDebugger() to see examples');
  console.log('4. Check console for debug information');
  console.log('');
  
  // Setup debug commands if available
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(setupDebugCommands, 1000); // Wait for other systems
    });
  }
  
  // Auto-run demo if in development mode
  if (window.location.hostname === 'localhost') {
    setTimeout(() => {
      console.log('Running automatic demo...');
      demonstrateEntityDebugger();
      demonstrateGlobalDebugManager();
    }, 2000);
  }
}

// Run initialization
initializeDebuggerDemo();

/**
 * Export functions for manual testing and integration
 */
if (typeof window !== 'undefined') {
  // Make functions available globally for console testing
  window.demonstrateEntityDebugger = demonstrateEntityDebugger;
  window.demonstrateGlobalDebugManager = demonstrateGlobalDebugManager;
  window.debugSelectedEntities = debugSelectedEntities;
  window.debugNearestEntities = debugNearestEntities;
  window.setupCustomDebugConfigurations = setupCustomDebugConfigurations;
  window.updateEntityDebuggers = updateEntityDebuggers;
  
  // Debug limit control functions
  window.setDebugLimit = (limit) => {
    const manager = getEntityDebugManager();
    if (manager) {
      manager.setDebugLimit(limit);
      console.log(`Debug limit set to ${limit}`);
    }
  };
  
  window.getDebugLimit = () => {
    const manager = getEntityDebugManager();
    return manager ? manager.getDebugLimit() : 0;
  };
  
  window.forceShowAllDebuggers = () => {
    const manager = getEntityDebugManager();
    if (manager) {
      manager.showAllDebuggers(true);
      console.log('Forced showing all entity debuggers');
    }
  };
  
  // Performance monitoring functions
  window.showPerformanceData = () => {
    const manager = getEntityDebugManager();
    if (manager) {
      const activeEntities = manager.getActiveDebugEntities();
      console.log(`Performance data for ${activeEntities.length} active debuggers:`);
      activeEntities.forEach(entity => {
        const entityDebugger = entity.getDebugger();
        if (entityDebugger) {
          const perfData = entityDebugger.getPerformanceData();
          console.log(`${perfData.targetObjectType} (${perfData.targetObjectId}):`, perfData);
        }
      });
    }
  };
  
  window.resetPerformanceData = () => {
    const manager = getEntityDebugManager();
    if (manager) {
      const activeEntities = manager.getActiveDebugEntities();
      activeEntities.forEach(entity => {
        const entityDebugger = entity.getDebugger();
        if (entityDebugger) entityDebugger.resetPerformanceData();
      });
      console.log(`Performance data reset for ${activeEntities.length} debuggers`);
    }
  };
  
  window.togglePerformanceGraphs = (show = true) => {
    const manager = getEntityDebugManager();
    if (manager) {
      const activeEntities = manager.getActiveDebugEntities();
      activeEntities.forEach(entity => {
        const entityDebugger = entity.getDebugger();
        if (entityDebugger) {
          entityDebugger.config.showPerformanceGraph = show;
        }
      });
      console.log(`Performance graphs ${show ? 'enabled' : 'disabled'} for ${activeEntities.length} debuggers`);
    }
  };

  // Individual graph toggle functions
  window.toggleUpdateGraphs = (state) => {
    const manager = getEntityDebugManager();
    if (manager) {
      const activeEntities = manager.getActiveDebugEntities();
      activeEntities.forEach(entity => {
        const entityDebugger = entity.getDebugger();
        if (entityDebugger) {
          entityDebugger.toggleGraph('update', state);
        }
      });
      console.log(`Update graphs ${typeof state === 'boolean' ? (state ? 'enabled' : 'disabled') : 'toggled'} for ${activeEntities.length} debuggers`);
    }
  };

  window.toggleRenderGraphs = (state) => {
    const manager = getEntityDebugManager();
    if (manager) {
      const activeEntities = manager.getActiveDebugEntities();
      activeEntities.forEach(entity => {
        const entityDebugger = entity.getDebugger();
        if (entityDebugger) {
          entityDebugger.toggleGraph('render', state);
        }
      });
      console.log(`Render graphs ${typeof state === 'boolean' ? (state ? 'enabled' : 'disabled') : 'toggled'} for ${activeEntities.length} debuggers`);
    }
  };

  window.toggleMemoryGraphs = (state) => {
    const manager = getEntityDebugManager();
    if (manager) {
      const activeEntities = manager.getActiveDebugEntities();
      activeEntities.forEach(entity => {
        const entityDebugger = entity.getDebugger();
        if (entityDebugger) {
          entityDebugger.toggleGraph('memory', state);
        }
      });
      console.log(`Memory graphs ${typeof state === 'boolean' ? (state ? 'enabled' : 'disabled') : 'toggled'} for ${activeEntities.length} debuggers`);
    }
  };

  window.toggleSummaryGraphs = (state) => {
    const manager = getEntityDebugManager();
    if (manager) {
      const activeEntities = manager.getActiveDebugEntities();
      activeEntities.forEach(entity => {
        const entityDebugger = entity.getDebugger();
        if (entityDebugger) {
          entityDebugger.toggleGraph('summary', state);
        }
      });
      console.log(`Summary graphs ${typeof state === 'boolean' ? (state ? 'enabled' : 'disabled') : 'toggled'} for ${activeEntities.length} debuggers`);
    }
  };

  window.setAllGraphs = (state) => {
    const manager = getEntityDebugManager();
    if (manager) {
      const activeEntities = manager.getActiveDebugEntities();
      activeEntities.forEach(entity => {
        const entityDebugger = entity.getDebugger();
        if (entityDebugger) {
          entityDebugger.setAllGraphs(state);
        }
      });
      console.log(`All graphs ${state ? 'enabled' : 'disabled'} for ${activeEntities.length} debuggers`);
    }
  };

  window.getGraphStates = () => {
    const manager = getEntityDebugManager();
    if (manager) {
      const activeEntities = manager.getActiveDebugEntities();
      const states = {};
      activeEntities.forEach(entity => {
        const entityDebugger = entity.getDebugger();
        if (entityDebugger) {
          const entityType = entityDebugger.introspectionData?.objectType?.constructor || 'Unknown';
          states[entityType] = entityDebugger.getGraphStates();
        }
      });
      console.log('Current graph states by entity type:', states);
      return states;
    }
  };

  // Global performance summary functions
  window.showGlobalPerformance = () => {
    const manager = getEntityDebugManager();
    if (manager) {
      const globalData = manager.getGlobalPerformanceData();
      console.log('Global Performance Summary:', globalData);
      return globalData;
    }
  };

  window.drawGlobalSummary = (x = 10, y = 10, width = 300, height = 200) => {
    const manager = getEntityDebugManager();
    if (manager) {
      // This would typically be called in the draw() function
      console.log(`Call manager.drawGlobalPerformanceSummary(${x}, ${y}, ${width}, ${height}) in your draw() function to display the global summary graph.`);
      console.log('Alternatively, add it to an entity\'s render method or main rendering loop.');
    }
  };

  // Global performance toggle functions
  window.toggleGlobalPerformance = (state) => {
    const manager = getEntityDebugManager();
    if (manager) {
      const newState = manager.toggleGlobalPerformance(state);
      console.log(`Global performance summary ${newState ? 'enabled' : 'disabled'}`);
      return newState;
    }
  };

  window.getGlobalPerformanceState = () => {
    const manager = getEntityDebugManager();
    if (manager) {
      const state = manager.getGlobalPerformanceState();
      console.log(`Global performance summary is currently ${state ? 'enabled' : 'disabled'}`);
      return state;
    }
  };

  // Standalone global performance graph functions
  window.drawGlobalPerformanceGraph = (x = 10, y = 10, width = 350, height = 200, options = {}) => {
    const manager = getEntityDebugManager();
    if (manager) {
      console.log(`Call manager.drawGlobalPerformanceGraph(${x}, ${y}, ${width}, ${height}, options) in your draw() function.`);
      console.log('Available options: backgroundColor, borderColor, titleColor, textColor, highlightColor, showEntityBreakdown');
      console.log('Example: manager.drawGlobalPerformanceGraph(10, 10, 350, 200, {showEntityBreakdown: true})');
      return true;
    }
    return false;
  };

  window.getGlobalPerformanceData = () => {
    const manager = getEntityDebugManager();
    if (manager) {
      const data = manager.getGlobalPerformanceData();
      console.log('Global Performance Data:', data);
      return data;
    }
  };
}