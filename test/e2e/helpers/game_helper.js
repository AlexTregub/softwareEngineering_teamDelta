/**
 * Game Helper Utilities for E2E Tests
 * Provides high-level game interaction functions
 */

const cameraHelper = require('../camera_helper');
const { saveScreenshot } = require('../puppeteer_helper');

/**
 * Sleep helper for compatibility
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ensure game is started and on PLAYING screen
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} Game start status
 */
async function ensureGameStarted(page) {
  // First check if already in game
  const alreadyPlaying = await page.evaluate(() => {
    return window.GameState && window.GameState.getState() === 'PLAYING';
  });
  
  if (alreadyPlaying) {
    return { started: true, reason: 'Already in PLAYING state' };
  }
  
  // Try to start the game using GameStateManager
  const result = await page.evaluate(() => {
    try {
      // Check if GameState exists
      if (!window.GameState) {
        return { started: false, reason: 'GameState manager not found' };
      }
      
      // Set state to PLAYING
      const success = window.GameState.setState('PLAYING');
      
      if (success) {
        // Force redraw to show game
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
        
        return { started: true, reason: 'GameState.setState("PLAYING") succeeded' };
      } else {
        return { started: false, reason: 'GameState.setState("PLAYING") failed' };
      }
    } catch (error) {
      return { started: false, reason: 'Error: ' + error.message };
    }
  });
  
  // Wait a moment for state to stabilize
  await sleep(500);
  
  // Verify the state changed
  const finalState = await page.evaluate(() => {
    return window.GameState ? window.GameState.getState() : 'UNKNOWN';
  });
  
  if (finalState === 'PLAYING') {
    return { started: true, reason: 'Confirmed PLAYING state' };
  } else {
    return { 
      started: false, 
      reason: `State is ${finalState}, not PLAYING`,
      details: result
    };
  }
}

/**
 * Force redraw of game canvas
 * Critical for ensuring state changes are visible
 * @param {Page} page - Puppeteer page
 * @param {number} times - Number of redraws (default 3)
 */
async function forceRedraw(page, times = 3) {
  await page.evaluate((count) => {
    window.gameState = 'PLAYING';
    if (window.draggablePanelManager) {
      window.draggablePanelManager.renderPanels('PLAYING');
    }
    if (typeof window.redraw === 'function') {
      for (let i = 0; i < count; i++) {
        window.redraw();
      }
    }
  }, times);
  await sleep(500);
}

/**
 * Spawn a single ant at specified location
 * @param {Page} page - Puppeteer page
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} jobType - Job type (Scout, Builder, Warrior, Farmer, Spitter)
 * @returns {Promise<Object>} Ant data including index
 */
async function spawnAnt(page, x, y, jobType = 'Scout') {
  const result = await page.evaluate(({x, y, jobType}) => {
    // Check if spawn functions exist
    if (!window.antsSpawn) {
      throw new Error('antsSpawn function not available');
    }
    
    // Spawn ant
    const initialCount = window.ants.length;
    window.antsSpawn(x, y, 20, 20, 30, 0, null, jobType, null);
    
    // Get the newly spawned ant
    const newAnt = window.ants[window.ants.length - 1];
    if (!newAnt) {
      throw new Error('Failed to spawn ant');
    }
    
    return {
      antIndex: window.ants.length - 1,
      id: newAnt.id,
      position: newAnt.getPosition(),
      jobType: newAnt.JobName,
      health: newAnt.health,
      success: true
    };
  }, {x, y, jobType});
  
  await forceRedraw(page, 2);
  return result;
}

/**
 * Spawn multiple ants
 * @param {Page} page - Puppeteer page
 * @param {number} count - Number of ants to spawn
 * @param {string} jobType - Job type for all ants
 * @returns {Promise<Array>} Array of spawned ant data
 */
async function spawnMultipleAnts(page, count, jobType = 'Scout') {
  const ants = [];
  for (let i = 0; i < count; i++) {
    const x = 100 + (i * 50);
    const y = 100 + (Math.floor(i / 10) * 50);
    const ant = await spawnAnt(page, x, y, jobType);
    ants.push(ant);
  }
  return ants;
}

/**
 * Get ant state and properties
 * @param {Page} page - Puppeteer page
 * @param {number} antIndex - Index in ants array
 * @returns {Promise<Object>} Ant state data
 */
async function getAntState(page, antIndex) {
  return await page.evaluate((index) => {
    const ant = window.ants[index];
    if (!ant) {
      throw new Error(`Ant at index ${index} not found`);
    }
    
    return {
      id: ant.id,
      position: ant.getPosition(),
      size: ant.getSize(),
      health: ant.health,
      maxHealth: ant.maxHealth,
      resources: ant.getResourceCount ? ant.getResourceCount() : 0,
      maxResources: ant.getMaxResources ? ant.getMaxResources() : 0,
      currentState: ant.getCurrentState ? ant.getCurrentState() : null,
      jobType: ant.JobName,
      isMoving: ant.isMoving(),
      isSelected: ant.isSelected(),
      isActive: ant.isActive,
      faction: ant.faction
    };
  }, antIndex);
}

/**
 * Select an ant
 * @param {Page} page - Puppeteer page
 * @param {number} antIndex - Index in ants array
 * @returns {Promise<Object>} Updated ant state
 */
async function selectAnt(page, antIndex) {
  await page.evaluate((index) => {
    const ant = window.ants[index];
    if (!ant) {
      throw new Error(`Ant at index ${index} not found`);
    }
    ant.setSelected(true);
  }, antIndex);
  
  await forceRedraw(page);
  return await getAntState(page, antIndex);
}

/**
 * Create a test entity (not an ant)
 * @param {Page} page - Puppeteer page
 * @param {Object} config - Entity configuration
 * @returns {Promise<Object>} Entity data
 */
async function createTestEntity(page, config = {}) {
  const defaults = {
    x: 100,
    y: 100,
    width: 32,
    height: 32,
    type: 'TestEntity',
    movementSpeed: 2.0,
    selectable: true,
    faction: 'player'
  };
  
  const entityConfig = { ...defaults, ...config };
  
  const result = await page.evaluate((cfg) => {
    // Create entity
    const entity = new Entity(cfg.x, cfg.y, cfg.width, cfg.height, {
      type: cfg.type,
      movementSpeed: cfg.movementSpeed,
      selectable: cfg.selectable,
      faction: cfg.faction
    });
    
    // Store in window for access
    if (!window.testEntities) {
      window.testEntities = [];
    }
    window.testEntities.push(entity);
    
    return {
      entityIndex: window.testEntities.length - 1,
      id: entity.id,
      type: entity.type,
      position: entity.getPosition(),
      size: entity.getSize(),
      isActive: entity.isActive,
      hasCollisionBox: !!entity._collisionBox,
      hasSprite: !!entity._sprite,
      hasDebugger: !!entity._debugger,
      controllers: Array.from(entity._controllers.keys())
    };
  }, entityConfig);
  
  await forceRedraw(page);
  return result;
}

/**
 * Get entity state
 * @param {Page} page - Puppeteer page
 * @param {number} entityIndex - Index in testEntities array
 * @returns {Promise<Object>} Entity state
 */
async function getEntityState(page, entityIndex) {
  return await page.evaluate((index) => {
    if (!window.testEntities || !window.testEntities[index]) {
      throw new Error(`Entity at index ${index} not found`);
    }
    
    const entity = window.testEntities[index];
    
    return {
      id: entity.id,
      type: entity.type,
      position: entity.getPosition(),
      size: entity.getSize(),
      center: entity.getCenter(),
      isActive: entity.isActive,
      isSelected: entity.isSelected(),
      isMoving: entity.isMoving(),
      hasImage: entity.hasImage ? entity.hasImage() : false,
      controllers: Array.from(entity._controllers.keys())
    };
  }, entityIndex);
}

/**
 * Spawn a resource
 * @param {Page} page - Puppeteer page
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} type - Resource type (food, wood, stone)
 * @returns {Promise<Object>} Resource data
 */
async function spawnResource(page, x, y, type = 'food') {
  const result = await page.evaluate(({x, y, type}) => {
    if (!window.resourcesSpawn) {
      throw new Error('resourcesSpawn function not available');
    }
    
    const initialCount = window.resources.length;
    window.resourcesSpawn(x, y, type);
    
    const newResource = window.resources[window.resources.length - 1];
    if (!newResource) {
      throw new Error('Failed to spawn resource');
    }
    
    return {
      resourceIndex: window.resources.length - 1,
      position: { x: newResource.x, y: newResource.y },
      type: type,
      success: true
    };
  }, {x, y, type});
  
  await forceRedraw(page);
  return result;
}

/**
 * Spawn a dropoff location
 * @param {Page} page - Puppeteer page
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {Promise<Object>} Dropoff data
 */
async function spawnDropoff(page, x, y) {
  const result = await page.evaluate(({x, y}) => {
    if (!window.spawnDropoffLocation) {
      throw new Error('spawnDropoffLocation function not available');
    }
    
    window.spawnDropoffLocation(x, y);
    
    return {
      position: { x, y },
      success: true
    };
  }, {x, y});
  
  await forceRedraw(page);
  return result;
}

/**
 * Get game state information
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} Game state
 */
async function getGameState(page) {
  return await page.evaluate(() => {
    return {
      gameState: window.gameState,
      antCount: window.ants ? window.ants.length : 0,
      resourceCount: window.resources ? window.resources.length : 0,
      dropoffCount: window.dropoffLocations ? window.dropoffLocations.length : 0,
      cameraPosition: window.cameraManager ? window.cameraManager.getPosition() : null,
      cameraZoom: window.cameraManager ? window.cameraManager.zoom : null
    };
  });
}

/**
 * Wait for condition to be true
 * @param {Page} page - Puppeteer page
 * @param {Function} condition - Condition function to evaluate
 * @param {number} timeout - Timeout in ms (default 5000)
 * @param {number} interval - Check interval in ms (default 100)
 * @returns {Promise<boolean>} True if condition met, false if timeout
 */
async function waitForCondition(page, condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await page.evaluate(condition);
    if (result) {
      return true;
    }
    await sleep(interval);
  }
  
  return false;
}

/**
 * Clear all test entities
 * @param {Page} page - Puppeteer page
 */
async function clearTestEntities(page) {
  await page.evaluate(() => {
    if (window.testEntities) {
      window.testEntities.forEach(entity => {
        if (entity.destroy) {
          entity.destroy();
        }
      });
      window.testEntities = [];
    }
  });
}

/**
 * Get spatial grid stats
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} Spatial grid statistics
 */
async function getSpatialGridStats(page) {
  return await page.evaluate(() => {
    if (!window.spatialGridManager) {
      return null;
    }
    
    return window.getSpatialGridStats ? window.getSpatialGridStats() : {
      error: 'getSpatialGridStats not available'
    };
  });
}

module.exports = {
  ensureGameStarted,
  forceRedraw,
  spawnAnt,
  spawnMultipleAnts,
  getAntState,
  selectAnt,
  createTestEntity,
  getEntityState,
  spawnResource,
  spawnDropoff,
  getGameState,
  waitForCondition,
  clearTestEntities,
  getSpatialGridStats
};
