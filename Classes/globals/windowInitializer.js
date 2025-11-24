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
  
  if (typeof window !== 'undefined') {
    // Register helper functions
    window.spawnAnts = spawnAnts;
    window.addTestResources = addTestResources;
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
  window.initializeGlobalFunctions = initializeGlobalFunctions;
  window.initializeAllWindowObjects = initializeAllWindowObjects;
  
  // Export helper functions directly too (for use before initialization)
  window.spawnAnts = spawnAnts;
  window.addTestResources = addTestResources;
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
  module.exports = {
    initializeWindowManagers,
    initializeGlobalFunctions,
    initializeAllWindowObjects,
    spawnAnts,
    addTestResources
  };
}
