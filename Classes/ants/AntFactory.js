/**
 * Legacy Ant Factory
 * Creates instances of the Entity-based ant class with proper job types
 */

class LegacyAntFactory {
  /**
   * Create a single ant with specified job
   * @param {Object} options - Configuration options
   * @param {number} options.x - X position
   * @param {number} options.y - Y position
   * @param {string} options.jobName - Job type (Scout, Builder, Farmer, Warrior, Spitter, Queen)
   * @param {string} options.faction - Faction (default: 'player')
   * @param {number} options.movementSpeed - Movement speed
   * @returns {ant} Ant instance
   */
  static create(options = {}) {
    const x = options.x || 0;
    const y = options.y || 0;
    const jobName = options.jobName || 'Scout';
    const faction = options.faction || 'player';
    const movementSpeed = options.movementSpeed || 1;
    
    // Get job-specific image if available
    const img = (typeof JobImages !== 'undefined' && JobImages[jobName]) || antBaseSprite;
    
    // Create ant with proper parameters
    const newAnt = new ant(x, y, 20, 20, movementSpeed, 0, img, jobName, faction);
    
    return newAnt;
  }
  
  /**
   * Create a Scout ant
   */
  static createScout(x, y, options = {}) {
    return LegacyAntFactory.create({ x, y, jobName: 'Scout', ...options });
  }
  
  /**
   * Create a Builder ant
   */
  static createBuilder(x, y, options = {}) {
    return LegacyAntFactory.create({ x, y, jobName: 'Builder', ...options });
  }
  
  /**
   * Create a Farmer ant
   */
  static createFarmer(x, y, options = {}) {
    return LegacyAntFactory.create({ x, y, jobName: 'Farmer', ...options });
  }
  
  /**
   * Create a Warrior ant
   */
  static createWarrior(x, y, options = {}) {
    return LegacyAntFactory.create({ x, y, jobName: 'Warrior', ...options });
  }
  
  /**
   * Create a Spitter ant
   */
  static createSpitter(x, y, options = {}) {
    return LegacyAntFactory.create({ x, y, jobName: 'Spitter', ...options });
  }
  
  /**
   * Create a Queen ant
   */
  static createQueen(x, y, options = {}) {
    return LegacyAntFactory.create({ x, y, jobName: 'Queen', ...options });
  }
  
  /**
   * Create multiple ants with spacing
   * @param {number} count - Number of ants
   * @param {Object} options - Configuration options
   * @returns {Array<ant>} Array of ant instances
   */
  static createMultiple(count, options = {}) {
    const ants = [];
    const baseX = options.x || 0;
    const baseY = options.y || 0;
    const spacing = options.spacing || 30;
    
    for (let i = 0; i < count; i++) {
      const offsetX = baseX + (i % 5) * spacing;
      const offsetY = baseY + Math.floor(i / 5) * spacing;
      
      const newAnt = LegacyAntFactory.create({
        ...options,
        x: offsetX,
        y: offsetY
      });
      
      ants.push(newAnt);
    }
    
    return ants;
  }
  
  /**
   * Create one of each job type for testing
   * @param {number} x - Base X position
   * @param {number} y - Base Y position
   * @param {Object} options - Additional options
   * @returns {Object} Object with arrays for each job type
   */
  static createTestSquad(x = 100, y = 100, options = {}) {
    const spacing = options.spacing || 50;
    
    return {
      scout: LegacyAntFactory.createScout(x, y, options),
      builder: LegacyAntFactory.createBuilder(x + spacing, y, options),
      farmer: LegacyAntFactory.createFarmer(x + spacing * 2, y, options),
      warrior: LegacyAntFactory.createWarrior(x + spacing * 3, y, options),
      spitter: LegacyAntFactory.createSpitter(x + spacing * 4, y, options)
    };
  }
  
  /**
   * Get list of available job types
   * @returns {string[]} Array of job names
   */
  static getJobTypes() {
    return ['Scout', 'Builder', 'Farmer', 'Warrior', 'Spitter', 'Queen'];
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.LegacyAntFactory = LegacyAntFactory;
}

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
  module.exports = LegacyAntFactory;
}
