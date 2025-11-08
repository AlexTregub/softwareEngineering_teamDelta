/**
 * AntFactory.js
 * 
 * Factory for creating Ant MVC instances with clean API.
 * Replaces the old "new ant()" constructor pattern.
 * 
 * @class AntFactory
 */

if (typeof require !== 'undefined') {
  var AntModel = require('../models/AntModel');
  var AntView = require('../views/AntView');
  var AntController = require('../controllers/AntController');
  var QueenController = require('../controllers/QueenController');
}

class AntFactory {
  /**
   * Creates an ant MVC instance with flexible parameters.
   * Supports both legacy positional parameters and modern options object.
   * 
   * @param {number} posX - X position
   * @param {number} posY - Y position
   * @param {number|object} sizex - Width OR options object {faction, job, size, etc.}
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
   * // Modern style (options object)
   * AntFactory.createAnt(100, 100, { faction: "enemy", job: "Warrior" });
   */
  static createAnt(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = null, JobName = "Worker", faction = "player") {
    // Support options object as 3rd parameter
    let options = {};
    if (typeof sizex === 'object' && sizex !== null) {
      options = sizex;
      sizex = options.size || options.width || 32;
      sizey = options.size || options.height || 32;
      JobName = options.job || options.jobName || "Worker";
      faction = options.faction || "player";
      movementSpeed = options.movementSpeed || 1;
      rotation = options.rotation || 0;
    }
    
    // Create MVC components
    const model = new AntModel(posX, posY, sizex, sizey, { 
      jobName: JobName,
      faction: faction,
      rotation: rotation,
      movementSpeed: movementSpeed
    });
    
    const view = new AntView(model);
    const controller = new AntController(model, view);
    
    // Initialize job (applies stats, sets up systems)
    controller.assignJob(JobName);
    
    return { model, view, controller };
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
   * 
   * @param {number} posX - X position
   * @param {number} posY - Y position
   * @param {number|object} sizex - Width (default: 60) OR options object
   * @param {number} sizey - Height (default: 60)
   * @param {number} movementSpeed - Movement speed (default: 30)
   * @param {number} rotation - Initial rotation (default: 0)
   * @param {*} img - Sprite image
   * @param {string} faction - Faction (default: "player")
   * @returns {{model: AntModel, view: AntView, controller: QueenController}} Queen MVC components
   * 
   * @example
   * // Modern style (options object)
   * AntFactory.createQueen(100, 100, { faction: "player" });
   */
  static createQueen(posX = 0, posY = 0, sizex = 60, sizey = 60, movementSpeed = 30, rotation = 0, img = null, faction = "player") {
    // Support options object as 3rd parameter
    let options = {};
    if (typeof sizex === 'object' && sizex !== null) {
      options = sizex;
      sizex = options.size || options.width || 60;
      sizey = options.size || options.height || 60;
      faction = options.faction || "player";
      movementSpeed = options.movementSpeed || 30;
      rotation = options.rotation || 0;
    }
    
    // Create MVC components
    const model = new AntModel(posX, posY, sizex, sizey, { 
      jobName: "Queen",
      faction: faction,
      rotation: rotation,
      movementSpeed: movementSpeed
    });
    
    const view = new AntView(model);
    const controller = new QueenController(model, view); // Use QueenController instead of AntController
    
    // Initialize queen job
    controller.assignJob("Queen");
    
    // Queen should not perform idle random skitter movements
    model._idleTimer = 0;
    model._idleTimerTimeout = Infinity; // Disable skitter
    
    return { model, view, controller };
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
