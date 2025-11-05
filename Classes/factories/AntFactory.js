/**
 * @fileoverview AntFactory - Handles ant creation logic with job assignment
 * Part of Phase 6 refactoring - factories now depend on WorldService instead of managers.
 * 
 * Responsibilities:
 * - Job assignment (random or specific)
 * - Size calculations and variations
 * - Position calculations (random, jittered, or specified)
 * - Creates ant controllers directly (no manager delegation)
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 2.0.0 (Phase 6 - WorldService integration)
 */

/**
 * Factory class for creating ant entities with proper job assignment.
 * Follows Factory pattern - handles creation logic independently.
 * 
 * @class AntFactory
 * @example
 * const factory = new AntFactory();
 * 
 * // Create specific job ants
 * const scout = factory.createScout(100, 100, 'player');
 * const warrior = factory.createWarrior(200, 200, 'player');
 */
class AntFactory {
  /**
   * Creates a new AntFactory instance.
   * 
   * @param {WorldService} [worldService=null] - Optional WorldService for advanced features (Phase 6)
   */
  constructor(worldService = null) {
    /**
     * Optional reference to WorldService (Phase 6)
     * @type {WorldService|null}
     * @private
     */
    this._worldService = worldService;
    
    /**
     * Available job types for random selection
     * @type {Array<string>}
     * @private
     */
    this._jobList = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter'];
    
    /**
     * Special jobs (not assigned randomly)
     * @type {Array<string>}
     * @private
     */
    this._specialJobs = ['DeLozier', 'Queen'];
    
    /**
     * Flag tracking if DeLozier has been spawned
     * @type {boolean}
     * @private
     */
    this._hasDeLozier = false;
  }
  
  // ========================================
  // Core Creation Methods
  // ========================================
  
  /**
   * Spawn multiple ants with random job assignment.
   * Replaces legacy antsSpawn() function.
   * 
   * @param {number} count - Number of ants to spawn
   * @param {string} [faction='neutral'] - Faction for all ants
   * @param {number} [x=null] - X position (null for random)
   * @param {number} [y=null] - Y position (null for random)
   * @returns {Array<AntController>} Array of spawned ants
   * 
   * @example
   * // Spawn 5 player ants at random positions
   * const ants = factory.spawnAnts(5, 'player');
   * 
   * // Spawn 3 ants near a specific location
   * const ants = factory.spawnAnts(3, 'neutral', 100, 100);
   */
  spawnAnts(count, faction = 'neutral', x = null, y = null) {
    const spawnedAnts = [];
    
    for (let i = 0; i < count; i++) {
      // Random job selection
      const jobName = this._getRandomJob();
      
      // Calculate spawn position
      const position = this._calculateSpawnPosition(x, y);
      
      // Create ant directly
      const ant = this._createAntWithJob(position.x, position.y, jobName, faction);
      
      spawnedAnts.push(ant);
    }
    
    return spawnedAnts;
  }
  
  /**
   * Spawn a Queen ant.
   * Replaces legacy spawnQueen() function.
   * 
   * @param {number} [x=null] - X position (null for random 0-500)
   * @param {number} [y=null] - Y position (null for random 0-500)
   * @returns {AntController} Spawned Queen ant
   * 
   * @example
   * const queen = factory.spawnQueen();
   * cameraManager.followEntity(queen);
   */
  spawnQueen(x = null, y = null) {
    // Calculate spawn position
    const position = this._calculateSpawnPosition(x, y);
    
    // Calculate queen size (larger than normal ants)
    const size = this._calculateQueenSize();
    
    // Load AntController dynamically
    const AntController = this._getAntController();
    
    // Create Queen ant with special stats
    const queen = new AntController(
      0, // ID will be assigned by WorldService
      position.x,
      position.y,
      size,
      size,
      {
        jobName: 'Queen',
        faction: 'player',
        width: size,
        height: size,
        movementSpeed: 30,
        health: 10000,
        maxHealth: 10000
      }
    );
    
    return queen;
  }
  
  // ========================================
  // Job-Specific Factory Methods
  // ========================================
  
  /**
   * Create a Scout ant.
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string|Object} [factionOrOptions='neutral'] - Faction string OR options object
   * @returns {AntController} Scout ant
   */
  createScout(x, y, factionOrOptions = 'neutral') {
    const faction = typeof factionOrOptions === 'string' ? factionOrOptions : factionOrOptions.faction || 'neutral';
    return this._createAntWithJob(x, y, 'Scout', faction);
  }
  
  /**
   * Create a Warrior ant.
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string|Object} [factionOrOptions='neutral'] - Faction string OR options object
   * @returns {AntController} Warrior ant
   */
  createWarrior(x, y, factionOrOptions = 'neutral') {
    const faction = typeof factionOrOptions === 'string' ? factionOrOptions : factionOrOptions.faction || 'neutral';
    return this._createAntWithJob(x, y, 'Warrior', faction);
  }
  
  /**
   * Create a Builder ant.
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string|Object} [factionOrOptions='neutral'] - Faction string OR options object
   * @returns {AntController} Builder ant
   */
  createBuilder(x, y, factionOrOptions = 'neutral') {
    const faction = typeof factionOrOptions === 'string' ? factionOrOptions : factionOrOptions.faction || 'neutral';
    return this._createAntWithJob(x, y, 'Builder', faction);
  }
  
  /**
   * Create a Farmer ant.
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string|Object} [factionOrOptions='neutral'] - Faction string OR options object
   * @returns {AntController} Farmer ant
   */
  createFarmer(x, y, factionOrOptions = 'neutral') {
    const faction = typeof factionOrOptions === 'string' ? factionOrOptions : factionOrOptions.faction || 'neutral';
    return this._createAntWithJob(x, y, 'Farmer', faction);
  }
  
  /**
   * Create a Spitter ant.
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string|Object} [factionOrOptions='neutral'] - Faction string OR options object
   * @returns {AntController} Spitter ant
   */
  createSpitter(x, y, factionOrOptions = 'neutral') {
    const faction = typeof factionOrOptions === 'string' ? factionOrOptions : factionOrOptions.faction || 'neutral';
    return this._createAntWithJob(x, y, 'Spitter', faction);
  }
  
  // ========================================
  // Private Helper Methods
  // ========================================
  
  /**
   * Create ant with specific job.
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} jobName - Job type
   * @param {string} faction - Faction
   * @returns {AntController} Created ant
   * @private
   */
  _createAntWithJob(x, y, jobName, faction) {
    // Load AntController dynamically to avoid circular dependencies
    const AntController = this._getAntController();
    
    const size = this._calculateAntSize();
    
    // Create AntController directly (no manager needed in Phase 6)
    const ant = new AntController(
      0, // ID will be assigned by WorldService
      x,
      y,
      size,
      size,
      {
        jobName: jobName,
        faction: faction,
        width: size,
        height: size,
        movementSpeed: 30
      }
    );
    
    return ant;
  }
  
  /**
   * Get AntController class (lazy load to avoid circular dependencies)
   * @private
   */
  _getAntController() {
    if (!this._AntControllerClass) {
      // Browser environment
      if (typeof window !== 'undefined' && window.AntController) {
        this._AntControllerClass = window.AntController;
      }
      // Node.js environment
      else if (typeof require !== 'undefined') {
        try {
          this._AntControllerClass = require('../controllers/mvc/AntController');
        } catch (e) {
          throw new Error('AntController not available - ensure it is loaded before AntFactory');
        }
      }
    }
    return this._AntControllerClass;
  }
  
  /**
   * Get random job from available jobs list.
   * 
   * @returns {string} Random job name
   * @private
   */
  _getRandomJob() {
    // Build available jobs list (may include special jobs if conditions met)
    const availableJobs = [...this._jobList];
    
    // Add DeLozier if not yet spawned (rare special job)
    if (!this._hasDeLozier && Math.random() < 0.01) {
      availableJobs.push('DeLozier');
    }
    
    const selectedJob = availableJobs[Math.floor(Math.random() * availableJobs.length)];
    
    // Track special job spawns
    if (selectedJob === 'DeLozier') {
      this._hasDeLozier = true;
    }
    
    return selectedJob;
  }
  
  /**
   * Calculate spawn position with optional jitter.
   * 
   * @param {number|null} x - Base X position (null for random)
   * @param {number|null} y - Base Y position (null for random)
   * @returns {{x: number, y: number}} Calculated position
   * @private
   */
  _calculateSpawnPosition(x, y) {
    if (x !== null && y !== null) {
      // Jitter around specified position
      const jitter = 12;
      return {
        x: x + (Math.random() * jitter - jitter / 2),
        y: y + (Math.random() * jitter - jitter / 2)
      };
    }
    
    // Random position
    return {
      x: Math.random() * 500,
      y: Math.random() * 500
    };
  }
  
  /**
   * Calculate ant size with random variation.
   * 
   * @returns {number} Ant size (20-35px)
   * @private
   */
  _calculateAntSize() {
    const baseSize = 20;
    const variation = Math.random() * 15;
    return baseSize + variation;
  }
  
  /**
   * Calculate queen size with random variation.
   * 
   * @returns {number} Queen size (30-45px, larger than normal ants)
   * @private
   */
  _calculateQueenSize() {
    const baseSize = 30;
    const variation = Math.random() * 15;
    return baseSize + variation;
  }
  
  // ========================================
  // Utility Methods
  // ========================================
  
  /**
   * Get list of available job types.
   * 
   * @returns {Array<string>} Job type names
   */
  getAvailableJobs() {
    return [...this._jobList];
  }
  
  /**
   * Get list of special job types.
   * 
   * @returns {Array<string>} Special job names
   */
  getSpecialJobs() {
    return [...this._specialJobs];
  }
  
  /**
   * Reset special job flags (for testing or level restarts).
   */
  resetSpecialJobs() {
    this._hasDeLozier = false;
  }
}

// ========================================
// Module Exports
// ========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntFactory;
}

if (typeof window !== 'undefined') {
  window.AntFactory = AntFactory;
}
