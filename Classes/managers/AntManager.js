/**
 * @fileoverview AntManager class with Map-based registry pattern (Phase 3.4)
 * Provides centralized ant lifecycle management with O(1) lookups.
 * 
 * Features:
 * - Map-based registry (no global arrays or counters)
 * - Auto-ID generation (sequential, never reused)
 * - O(1) lookup by ID
 * - Type-safe queries (job, faction, spatial)
 * - Auto-integration with SpatialGridManager
 * - Selection as query (no internal state)
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 2.1.0 (Phase 3.4 - Selection Query Pattern)
 */

/**
 * Manages all ants in the game with Map-based registry pattern.
 * Single source of truth for ant creation, lookup, and destruction.
 * 
 * @class AntManager
 * @example
 * // Create ant with auto-ID
 * const ant = manager.createAnt(100, 100, { jobName: 'Warrior' });
 * 
 * // O(1) lookup
 * const retrieved = manager.getAntById(ant.antIndex);
 * 
 * // Type queries
 * const warriors = manager.getAntsByJob('Warrior');
 * const playerAnts = manager.getAntsByFaction('player');
 * 
 * // Selection queries (no internal state)
 * const selected = manager.getSelectedAnt(); // Queries ants
 */
class AntManager {
  /**
   * Creates a new AntManager instance with empty registry.
   */
  constructor() {
    /**
     * Map-based registry (ID → AntController)
     * @type {Map<number, AntController>}
     * @private
     */
    this._ants = new Map();
    
    /**
     * Next ant ID (auto-incremented, never reused)
     * @type {number}
     * @private
     */
    this._nextId = 0;
    
    /**
     * Set of paused ant IDs (for lifecycle management)
     * @type {Set<number>}
     * @private
     */
    this._pausedAnts = new Set();
  }
  
  // ========================================
  // Singleton Pattern
  // ========================================
  
  /**
   * Get singleton instance of AntManager.
   * Creates instance on first call.
   * 
   * @returns {AntManager} Singleton instance
   * @static
   * 
   * @example
   * const manager = AntManager.getInstance();
   */
  static getInstance() {
    if (!AntManager._instance) {
      AntManager._instance = new AntManager();
    }
    return AntManager._instance;
  }
  
  // ========================================
  // Core Registry Methods
  // ========================================
  
  /**
   * Create ant with auto-generated ID.
   * Automatically registers with spatial grid if available.
   * 
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {Object} [options={}] - Ant configuration
   * @param {string} [options.jobName='Scout'] - Job type
   * @param {string} [options.faction='neutral'] - Faction
   * @param {number} [options.health] - Initial health
   * @param {number} [options.maxHealth] - Max health
   * @returns {AntController} Created ant with auto-generated ID
   * 
   * @example
   * const ant = manager.createAnt(100, 100, {
   *   jobName: 'Warrior',
   *   faction: 'player'
   * });
   */
  createAnt(x, y, options = {}) {
    // Generate unique ID
    const id = this._nextId++;
    
    // Add ID to options for AntController
    const antOptions = { ...options, antIndex: id };
    
    // Create AntController (which creates AntModel + AntView)
    const ant = new AntController(id, x, y, 32, 32, antOptions);
    
    // Store in registry
    this._ants.set(id, ant);
    
    // Auto-register with spatial grid
    spatialGridManager.addEntity(ant);
    
    return ant;
  }
  
  /**
   * Get ant by ID (O(1) lookup).
   * 
   * @param {number} id - Ant ID
   * @returns {AntController|undefined} Ant or undefined if not found
   * 
   * @example
   * const ant = manager.getAntById(5);
   * if (ant) {
   *   console.log(ant.position);
   * }
   */
  getAntById(id) {
    return this._ants.get(id);
  }
  
  /**
   * Get all ants as array (for iteration).
   * Returns new array each call (does not expose internal Map).
   * 
   * @returns {Array<AntController>} All ants
   * 
   * @example
   * manager.getAllAnts().forEach(ant => {
   *   ant.update(deltaTime);
   * });
   */
  getAllAnts() {
    return Array.from(this._ants.values());
  }
  
  /**
   * Get ant count.
   * 
   * @returns {number} Total ants in registry
   * 
   * @example
   * console.log(`Total ants: ${manager.getAntCount()}`);
   */
  getAntCount() {
    return this._ants.size;
  }
  
  /**
   * Destroy ant and cleanup resources.
   * Removes from registry, calls ant.destroy(), removes from spatial grid.
   * 
   * @param {number} id - Ant ID
   * @returns {boolean} True if destroyed, false if not found
   * 
   * @example
   * const destroyed = manager.destroyAnt(ant.antIndex);
   * if (destroyed) {
   *   console.log('Ant destroyed');
   * }
   */
  destroyAnt(id) {
    const ant = this._ants.get(id);
    if (!ant) return false;
    
    // Remove from spatial grid
    spatialGridManager.removeEntity(ant);
    
    // Cleanup ant
    ant.destroy();
    
    // Remove from registry
    this._ants.delete(id);
    
    return true;
  }
  
  /**
   * Clear all ants from registry.
   * Calls destroy() on all ants.
   * 
   * @example
   * manager.clearAll(); // Remove all ants
   */
  clearAll() {
    // Destroy all ants
    this._ants.forEach(ant => {
      // Remove from spatial grid
      spatialGridManager.removeEntity(ant);
      
      // Cleanup ant
      ant.destroy();
    });
    
    // Clear registry
    this._ants.clear();
  }

  // ========================================
  // Query Methods
  // ========================================
  
  /**
   * Get all ants with specific job name.
   * 
   * @param {string} jobName - Job name to filter by
   * @returns {Array<AntController>} Ants with matching job
   * 
   * @example
   * const workers = manager.getAntsByJob('Worker');
   */
  getAntsByJob(jobName) {
    return this.filterAnts(ant => ant.jobName === jobName);
  }
  
  /**
   * Get all ants with specific faction.
   * 
   * @param {string} faction - Faction to filter by
   * @returns {Array<AntController>} Ants with matching faction
   * 
   * @example
   * const playerAnts = manager.getAntsByFaction('player');
   */
  getAntsByFaction(faction) {
    return this.filterAnts(ant => ant.faction === faction);
  }
  
  /**
   * Get ants within radius of position.
   * 
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} radius - Search radius
   * @returns {Array<AntController>} Ants within radius
   * 
   * @example
   * const nearby = manager.getNearbyAnts(100, 100, 50);
   */
  getNearbyAnts(x, y, radius) {
    const radiusSquared = radius * radius;
    return this.filterAnts(ant => {
      const pos = ant.position;
      const dx = pos.x - x;
      const dy = pos.y - y;
      return (dx * dx + dy * dy) <= radiusSquared;
    });
  }
  
  /**
   * Find first ant matching predicate.
   * 
   * @param {Function} predicate - Test function (ant) => boolean
   * @returns {AntController|undefined} First matching ant or undefined
   * 
   * @example
   * const firstWorker = manager.findAnt(ant => ant.jobName === 'Worker');
   */
  findAnt(predicate) {
    for (const ant of this._ants.values()) {
      if (predicate(ant)) return ant;
    }
    return undefined;
  }
  
  /**
   * Filter ants by predicate.
   * 
   * @param {Function} predicate - Test function (ant) => boolean
   * @returns {Array<AntController>} All matching ants
   * 
   * @example
   * const healthyWorkers = manager.filterAnts(ant => 
   *   ant.jobName === 'Worker' && ant.health > 50
   * );
   */
  filterAnts(predicate) {
    const result = [];
    for (const ant of this._ants.values()) {
      if (predicate(ant)) result.push(ant);
    }
    return result;
  }

  // ========================================
  // Lifecycle Management (Phase 3.4.3)
  // ========================================
  
  /**
   * Pause an individual ant by ID.
   * Paused ants are skipped during updateAll().
   * 
   * @param {number} id - Ant ID to pause
   * 
   * @example
   * manager.pauseAnt(ant.antIndex);
   */
  pauseAnt(id) {
    if (this._ants.has(id)) {
      this._pausedAnts.add(id);
    }
  }
  
  /**
   * Resume an individual ant by ID.
   * Resumes update cycle for the specified ant.
   * 
   * @param {number} id - Ant ID to resume
   * 
   * @example
   * manager.resumeAnt(ant.antIndex);
   */
  resumeAnt(id) {
    this._pausedAnts.delete(id);
  }
  
  /**
   * Pause all registered ants.
   * Adds all ant IDs to paused set.
   * 
   * @example
   * manager.pauseAll(); // Pause all ants
   */
  pauseAll() {
    for (const id of this._ants.keys()) {
      this._pausedAnts.add(id);
    }
  }
  
  /**
   * Resume all paused ants.
   * Clears the paused set completely.
   * 
   * @example
   * manager.resumeAll(); // Resume all ants
   */
  resumeAll() {
    this._pausedAnts.clear();
  }
  
  /**
   * Check if an ant is currently paused.
   * 
   * @param {number} id - Ant ID to check
   * @returns {boolean} True if ant is paused, false otherwise
   * 
   * @example
   * if (manager.isPaused(ant.antIndex)) {
   *   console.log('Ant is paused');
   * }
   */
  isPaused(id) {
    return this._pausedAnts.has(id);
  }
  
  /**
   * Update all active (non-paused) ants.
   * Skips ants in the paused set.
   * 
   * @example
   * manager.updateAll(); // Called in game loop
   */
  updateAll() {
    for (const [id, ant] of this._ants.entries()) {
      if (!this._pausedAnts.has(id)) {
        ant.update();
      }
    }
  }

  // ========================================
  // Selection Queries (Convenience Methods)
  // ========================================
  
  /**
   * Get currently selected ant (queries ants directly).
   * 
   * @returns {AntController|undefined} Selected ant or undefined if none selected
   * 
   * @example
   * const selected = manager.getSelectedAnt();
   * if (selected) console.log(selected.position);
   */
  getSelectedAnt() {
    return this.findAnt(ant => ant.isSelected());
  }

  /**
   * Get all currently selected ants (queries ants directly).
   * 
   * @returns {AntController[]} Array of all selected ants
   * 
   * @example
   * const selected = manager.getSelectedAnts();
   * console.log(`${selected.length} ants selected`);
   */
  getSelectedAnts() {
    return this.getAllAnts().filter(ant => ant.isSelected());
  }

  /**
   * Clear all selections (bulk operation).
   * 
   * @example
   * manager.clearSelection();
   */
  clearSelection() {
    this.getAllAnts().forEach(ant => ant.setSelected(false));
  }

  /**
   * Check if any ant is selected.
   * 
   * @returns {boolean} True if any ant is selected
   * 
   * @example
   * if (manager.hasSelection()) 
   */
  hasSelection() {
    return this.getSelectedAnt() !== undefined;
  }
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntManager;
}
if (typeof window !== 'undefined') {
  window.AntManager = AntManager;
}