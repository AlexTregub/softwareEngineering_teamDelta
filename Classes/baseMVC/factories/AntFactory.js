/**
 * AntFactory.js
 * 
 * Factory for creating Ant MVC instances with clean API.
 * Replaces the old "new ant()" constructor pattern.
 * 
 * @class AntFactory
 */

// Node.js: Load dependencies
if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
  const AntModel = require('../models/AntModel');
  const AntView = require('../views/AntView');
  const AntController = require('../controllers/AntController');
  const QueenController = require('../controllers/QueenController');
  global.AntModel = AntModel;
  global.AntView = AntView;
  global.AntController = AntController;
  global.QueenController = QueenController;
}


// Helper to get class from window or require context
function getClass(name) {
  if (typeof window !== 'undefined' && window[name]) {
    return window[name];
  }
  // In Node, use the loaded variables
  switch (name) {
    case 'AntModel': return AntModel;
    case 'AntView': return AntView;
    case 'AntController': return AntController;
    case 'QueenController': return QueenController;
    default: throw new Error(`Unknown class: ${name}`);
  }
}

class AntFactory {
  /**
   * Register an ant MVC instance with all game systems.
   * Uses SpatialGridManager as single source of truth for entity tracking.
   * 
   * @param {Object} antMVC - Ant MVC object {model, view, controller}
   * @private
   */
  static _registerWithSystems(antMVC) {
    // Register FULL MVC OBJECT with spatial grid (not just model)
    // EntityLayerRenderer expects MVC objects with .model, .view, .controller
    // Spatial grid provides O(1) queries and type filtering
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager && antMVC) {
      spatialGridManager.addEntity(antMVC);
    }
    
    // Register with selectables array (for selection system)
    if (typeof selectables !== 'undefined' && Array.isArray(selectables)) {
      selectables.push(antMVC);
    }
    
    // Register with tile interaction manager if available
    if (typeof g_tileInteractionManager !== 'undefined' && g_tileInteractionManager && 
        typeof g_tileInteractionManager.addObject === 'function') {
      g_tileInteractionManager.addObject(antMVC, 'ant');
    }
  }

  /**
   * Creates an ant MVC instance with flexible parameters.
   * Supports both legacy positional parameters and modern options object.
   * AUTOMATICALLY REGISTERS with all game systems (spatialGridManager, etc.)
   * 
   * @param {number} posX - X position
   * @param {number} posY - Y position
   * @param {number|object} sizex - Width OR options object {faction, job, size, autoRegister, etc.}
   * @param {number} sizey - Height (if sizex is number)
   * @param {number} movementSpeed - Movement speed (legacy, unused in MVC)
   * @param {number} rotation - Initial rotation
   * @param {*} img - Sprite image (legacy, handled by view)
   * @param {string} JobName - Job name (Scout, Farmer, Builder, Soldier, Warrior, Spitter, Queen)
   * @param {string} faction - Faction (player, enemy, neutral)
   * @returns {{model: AntModel, view: AntView, controller: AntController}} MVC components
   * 
   * @example
   * // Legacy style (positional parameters)
   * AntFactory.createAnt(100, 100, 32, 32, 1, 0, null, "Scout", "player");
   * 
   * // Modern style (options object) - auto-registers with systems
   * AntFactory.createAnt(100, 100, { faction: "enemy", job: "Warrior" });
   * 
   * // Disable auto-registration if needed
   * AntFactory.createAnt(100, 100, { faction: "player", autoRegister: false });
   */
  static createAnt(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = null, JobName = "Worker", faction = "player") {
    // Support options object as 3rd parameter
    let options = {};
    let autoRegister = true; // Default: automatically register with systems
    
    if (typeof sizex === 'object' && sizex !== null) {
      options = sizex;
      sizex = options.size || options.width || 32;
      sizey = options.size || options.height || 32;
      JobName = options.job || options.jobName || "Worker";
      faction = options.faction || "player";
      movementSpeed = options.movementSpeed || 1;
      rotation = options.rotation || 0;
      autoRegister = options.autoRegister !== false; // Allow opt-out
    }
    
    // Get classes from appropriate context (window for browser, require for Node)
    const AntModelClass = getClass('AntModel');
    const AntViewClass = getClass('AntView');
    const AntControllerClass = getClass('AntController');
    
    // Create MVC components
    const model = new AntModelClass(posX, posY, sizex, sizey, { 
      jobName: JobName,
      faction: faction,
      rotation: rotation,
      movementSpeed: movementSpeed
    });
    
    const view = new AntViewClass(model);
    const controller = new AntControllerClass(model, view);
    
    // Initialize job (applies stats, sets up systems)
    controller.assignJob(JobName);
    
    // Create MVC wrapper object with delegation methods for SpatialGrid compatibility
    const antMVC = { 
      model, 
      view, 
      controller,
      // Delegate spatial methods to model (required by SpatialGrid)
      getPosition: () => model.getPosition(),
      getX: () => model.getPosition().x,
      getY: () => model.getPosition().y,
      // Delegate type property (required by SpatialGridManager)
      get type() { return model.getType(); }
    };
    
    // Automatically register with game systems
    if (autoRegister) {
      this._registerWithSystems(antMVC);
    }
    
    return antMVC;
  }
  
  /**
   * Shorthand creation with minimal parameters.
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} job - Job name (default: "Scout")
   * @param {string} faction - Faction (default: "player")
   * @returns {{model: AntModel, view: AntView, controller: AntController}} MVC components
   */
  static create(x, y, job = "Scout", faction = "player") {
    return AntFactory.createAnt(x, y, 32, 32, 1, 0, null, job, faction);
  }
  
  /**
   * Creates a Queen ant with queen-specific controller.
   * Supports both legacy positional parameters and modern options object.
   * AUTOMATICALLY REGISTERS with all game systems (spatialGridManager, etc.)
   * 
   * @param {number} posX - X position
   * @param {number} posY - Y position
   * @param {number|object} sizex - Width (default: 60) OR options object {faction, autoRegister, etc.}
   * @param {number} sizey - Height (default: 60)
   * @param {number} movementSpeed - Movement speed (default: 30)
   * @param {number} rotation - Initial rotation (default: 0)
   * @param {*} img - Sprite image
   * @param {string} faction - Faction (default: "player")
   * @returns {{model: AntModel, view: AntView, controller: QueenController}} Queen MVC components
   * 
   * @example
   * // Modern style (options object) - auto-registers with systems
   * AntFactory.createQueen(100, 100, { faction: "player" });
   * 
   * // Disable auto-registration if needed
   * AntFactory.createQueen(100, 100, { faction: "player", autoRegister: false });
   */
  static createQueen(posX = 0, posY = 0, sizex = 60, sizey = 60, movementSpeed = 30, rotation = 0, img = null, faction = "player") {
    // Support options object as 3rd parameter
    let options = {};
    let autoRegister = true; // Default: automatically register with systems
    
    if (typeof sizex === 'object' && sizex !== null) {
      options = sizex;
      sizex = options.size || options.width || 60;
      sizey = options.size || options.height || 60;
      faction = options.faction || "player";
      movementSpeed = options.movementSpeed || 30;
      rotation = options.rotation || 0;
      autoRegister = options.autoRegister !== false; // Allow opt-out
    }
    
    // Get classes from appropriate context (window for browser, require for Node)
    const AntModelClass = getClass('AntModel');
    const AntViewClass = getClass('AntView');
    const QueenControllerClass = getClass('QueenController');
    
    // Create MVC components
    const model = new AntModelClass(posX, posY, sizex, sizey, { 
      jobName: "Queen",
      faction: faction,
      rotation: rotation,
      movementSpeed: movementSpeed
    });
    
    const view = new AntViewClass(model);
    const controller = new QueenControllerClass(model, view); // Use QueenController instead of AntController
    
    // Initialize queen job
    controller.assignJob("Queen");
    
    // Queen should not perform idle random skitter movements
    model._idleTimer = 0;
    model._idleTimerTimeout = Infinity; // Disable skitter
    
    // Create MVC wrapper object with delegation methods for SpatialGrid compatibility
    const queenMVC = { 
      model, 
      view, 
      controller,
      // Delegate spatial methods to model (required by SpatialGrid)
      getPosition: () => model.getPosition(),
      getX: () => model.getPosition().x,
      getY: () => model.getPosition().y,
      // Delegate type property (required by SpatialGridManager)
      get type() { return model.getType(); }
    };
    
    // Automatically register with game systems
    if (autoRegister) {
      this._registerWithSystems(queenMVC);
    }
    
    return queenMVC;
  }
  
  /**
   * Manually register an ant with all game systems.
   * Use this if you created an ant with autoRegister: false
   * 
   * @param {Object} antMVC - Ant MVC object {model, view, controller}
   * @example
   * const ant = AntFactory.createAnt(100, 100, { autoRegister: false });
   * // ... do custom setup ...
   * AntFactory.registerWithSystems(ant);
   */
  static registerWithSystems(antMVC) {
    this._registerWithSystems(antMVC);
  }
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.AntFactory = AntFactory;
  // Provide legacy shorthand
  window.createAnt = AntFactory.createAnt.bind(AntFactory);
  window.createQueen = AntFactory.createQueen.bind(AntFactory);
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntFactory;
}
