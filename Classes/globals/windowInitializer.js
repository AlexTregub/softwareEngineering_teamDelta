/**
 * Window Initializer
 * @module globals/windowInitializer
 * 
 * Centralized initialization of all window-level objects and managers.
 * This file ensures proper initialization order and provides a single place
 * to manage all global window assignments.
 */

console.log('Loading windowInitializer.js');

/**
 * Initialize all window-level managers and systems
 * Should be called during setup() after all classes are loaded
 */
function initializeWindowManagers() {
  console.log('🔧 Initializing window managers...');
  
  // Spatial Grid Manager - for entity spatial queries
  if (typeof SpatialGridManager !== 'undefined' && typeof TILE_SIZE !== 'undefined') {
    window.spatialGridManager = new SpatialGridManager(TILE_SIZE);
    console.log('✅ SpatialGridManager initialized');
  } else {
    console.warn('⚠️ SpatialGridManager not available');
  }
  
  // Entity Manager - tracks all entities and emits events
  if (typeof EntityManager !== 'undefined') {
    window.entityManager = new EntityManager();
    console.log('✅ EntityManager initialized');
  } else {
    console.warn('⚠️ EntityManager not available');
  }
  
  // Event Manager - handles game events
  if (typeof EventManager !== 'undefined') {
    window.eventManager = EventManager.getInstance();
    console.log('✅ EventManager initialized');
  } else {
    console.warn('⚠️ EventManager not available');
  }
  
  // Event Debug Manager
  if (typeof EventDebugManager !== 'undefined' && window.eventManager) {
    window.eventDebugManager = new EventDebugManager();
    window.eventManager.setEventDebugManager(window.eventDebugManager);
    console.log('✅ EventDebugManager initialized');
  } else {
    console.warn('⚠️ EventDebugManager not available');
  }
  
  // BUI Manager - button UI system
  if (typeof BUIManager !== 'undefined') {
    window.BUIManager = new BUIManager();
    console.log('✅ BUIManager initialized');
  } else {
    console.warn('⚠️ BUIManager not available');
  }
  
  console.log('✅ Window managers initialization complete');
}

/**
 * Initialize UI components
 * Should be called after managers are initialized
 */
function initializeUIComponents(p5Instance) {
  console.log('🎨 Initializing UI components...');
  
  // AntCountDropDown
  if (typeof AntCountDropDown !== 'undefined') {
    window.antCountDropdown = new AntCountDropDown(p5Instance, {
      x: 20,
      y: 80,
      faction: 'player'
    });
    console.log('✅ AntCountDropDown initialized');
    
    // Register with RenderLayerManager
    if (typeof RenderManager !== 'undefined') {
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
        if (window.antCountDropdown) {
          window.antCountDropdown.render();
        }
      });
      console.log('✅ AntCountDropDown registered with RenderLayerManager');
    }
  } else {
    console.error('❌ AntCountDropDown class not found');
  }
  
  // ResourceCountDisplay
  if (typeof ResourceCountDisplay !== 'undefined') {
    window.resourceCountDisplay = new ResourceCountDisplay(p5Instance, {
      height: 40
    });
    console.log('✅ ResourceCountDisplay initialized');
    
    // Register with RenderLayerManager
    if (typeof RenderManager !== 'undefined') {
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
        if (window.resourceCountDisplay) {
          window.resourceCountDisplay.render();
        }
      });
      console.log('✅ ResourceCountDisplay registered with RenderLayerManager');
    }
  } else {
    console.error('❌ ResourceCountDisplay class not found');
  }
  
  console.log('✅ UI components initialization complete');
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Spawn initial ants when game starts
 * Called automatically when gameState changes to PLAYING
 * @private
 */
function spawnInitialAnts() {
  if (typeof LegacyAntFactory === 'undefined') {
    console.warn('⚠️ LegacyAntFactory not available - skipping initial ant spawn');
    return;
  }
  
  const centerX = typeof width !== 'undefined' ? width / 2 : 400;
  const centerY = typeof height !== 'undefined' ? height / 2 : 400;
  const spacing = 40;
  
  // Spawn 1-3 of each job type (except Queen)
  const jobs = ['Scout', 'Builder', 'Farmer', 'Warrior', 'Spitter'];
  let xOffset = -(jobs.length * spacing) / 2; // Center the group
  
  jobs.forEach(jobName => {
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 ants
    
    LegacyAntFactory.createMultiple(count, {
      x: centerX + xOffset,
      y: centerY,
      jobName: jobName,
      faction: 'player',
      spacing: 25
    });
    
    xOffset += spacing;
  });
  
  console.log('🐜 Initial player ants spawned');
}

/**
 * Spawn test ants - one of each job type
 * Usage in console: spawnTestAnts()
 */
function spawnTestAnts() {
  if (typeof LegacyAntFactory === 'undefined') {
    console.error('❌ LegacyAntFactory not loaded');
    return;
  }
  
  const centerX = typeof width !== 'undefined' ? width / 2 : 400;
  const centerY = typeof height !== 'undefined' ? height / 2 : 400;
  
  const squad = LegacyAntFactory.createTestSquad(centerX - 100, centerY, { faction: 'player' });
  
  // Add all squad members to global ants array
  if (typeof ants !== 'undefined') {
    if (squad.scout) ants.push(squad.scout);
    if (squad.builder) ants.push(squad.builder);
    if (squad.farmer) ants.push(squad.farmer);
    if (squad.warrior) ants.push(squad.warrior);
    if (squad.spitter) ants.push(squad.spitter);
  }
  
  console.log('✅ Spawned test squad:');
  console.log('  - Scout:', squad.scout?.id);
  console.log('  - Builder:', squad.builder?.id);
  console.log('  - Farmer:', squad.farmer?.id);
  console.log('  - Warrior:', squad.warrior?.id);
  console.log('  - Spitter:', squad.spitter?.id);
  console.log(`  - Total ants in game: ${typeof ants !== 'undefined' ? ants.length : 'N/A'}`);
  
  return squad;
}

/**
 * Spawn multiple ants of a specific job
 * Usage: spawnAnts(5, 'Scout') or spawnAnts(3, 'Warrior')
 */
function spawnAnts(count, jobName = 'Scout') {
  if (typeof LegacyAntFactory === 'undefined') {
    console.error('❌ LegacyAntFactory not loaded');
    return;
  }
  
  const centerX = typeof width !== 'undefined' ? width / 2 : 400;
  const centerY = typeof height !== 'undefined' ? height / 2 : 400;
  
  const spawnedAnts = LegacyAntFactory.createMultiple(count, {
    x: centerX,
    y: centerY,
    jobName: jobName,
    faction: 'player'
  });
  
  // Add spawned ants to global array
  if (typeof ants !== 'undefined' && Array.isArray(spawnedAnts)) {
    spawnedAnts.forEach(ant => {
      if (ant) ants.push(ant);
    });
  }
  
  console.log(`✅ Spawned ${count} ${jobName} ants`);
  console.log(`  - Total ants in game: ${typeof ants !== 'undefined' ? ants.length : 'N/A'}`);
  return spawnedAnts;
}

/**
 * Add test resources to see ResourceCountDisplay working
 * Usage in console: addTestResources()
 */
function addTestResources() {
  if (typeof window !== 'undefined' && typeof window.addGlobalResource === 'undefined') {
    console.error('❌ addGlobalResource not available');
    return;
  }
  
  // Add some resources using actual resource types
  window.addGlobalResource('stick', 50);      // Wood/building materials
  window.addGlobalResource('stone', 30);      // Stone
  window.addGlobalResource('greenLeaf', 40);  // Food (green leaves)
  window.addGlobalResource('mapleLeaf', 35);  // Food (maple leaves)
  
  console.log('✅ Test resources added:', window.getResourceTotals());
  return window.getResourceTotals();
}

/**
 * Initialize global utility functions
 * These are helper functions for console/debugging
 */
function initializeGlobalFunctions() {
  console.log('🔧 Initializing global functions...');
  
  if (typeof window !== 'undefined') {
    // Register helper functions
    window.spawnTestAnts = spawnTestAnts;
    window.spawnAnts = spawnAnts;
    window.addTestResources = addTestResources;
    
    console.log('✅ Global helper functions registered');
  }
}

/**
 * Master initialization function
 * Call this from setup() to initialize everything in the correct order
 */
function initializeAllWindowObjects(p5Instance) {
  console.log('🚀 Starting window object initialization...');
  
  // Step 1: Initialize managers
  initializeWindowManagers();
  
  // Step 2: Initialize UI components
  initializeUIComponents(p5Instance);
  
  // Step 3: Initialize global helper functions
  initializeGlobalFunctions();
  
  console.log('✅ All window objects initialized successfully');
}

// Export for browser
if (typeof window !== 'undefined') {
  window.initializeWindowManagers = initializeWindowManagers;
  window.initializeUIComponents = initializeUIComponents;
  window.initializeGlobalFunctions = initializeGlobalFunctions;
  window.initializeAllWindowObjects = initializeAllWindowObjects;
  
  // Export helper functions directly too (for use before initialization)
  window.spawnInitialAnts = spawnInitialAnts;
  window.spawnTestAnts = spawnTestAnts;
  window.spawnAnts = spawnAnts;
  window.addTestResources = addTestResources;
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
  module.exports = {
    initializeWindowManagers,
    initializeUIComponents,
    initializeGlobalFunctions,
    initializeAllWindowObjects,
    spawnInitialAnts,
    spawnTestAnts,
    spawnAnts,
    addTestResources
  };
}
