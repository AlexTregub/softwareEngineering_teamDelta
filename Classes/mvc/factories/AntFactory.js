/**
 * AntFactory
 * ==========
 * Factory for creating complete ant MVC triads.
 * 
 * RESPONSIBILITIES:
 * - Create model + view + controller as a unit
 * - Handle configuration and defaults
 * - Provide batch creation methods
 * - Provide job-specific creation shortcuts
 * - Encapsulate MVC wiring complexity
 * 
 * Usage:
 *   const ant = AntFactory.create({ x: 100, y: 100, jobName: 'Warrior' });
 *   const workers = AntFactory.createMultiple(5, { jobName: 'Worker' });
 *   const squad = AntFactory.createSquad({ workers: 3, warriors: 2 });
 */

// Load dependencies
if (typeof AntModel === 'undefined') {
  if (typeof require !== 'undefined') {
    const AntModel = require('../models/AntModel.js');
    if (typeof window !== 'undefined') window.AntModel = AntModel;
    if (typeof global !== 'undefined') global.AntModel = AntModel;
  }
}

if (typeof AntView === 'undefined') {
  if (typeof require !== 'undefined') {
    const AntView = require('../views/AntView.js');
    if (typeof window !== 'undefined') window.AntView = AntView;
    if (typeof global !== 'undefined') global.AntView = AntView;
  }
}

if (typeof AntController === 'undefined') {
  if (typeof require !== 'undefined') {
    const AntController = require('../controllers/AntController.js');
    if (typeof window !== 'undefined') window.AntController = AntController;
    if (typeof global !== 'undefined') global.AntController = AntController;
  }
}

class AntFactory {
  /**
   * Create a complete ant MVC triad
   * @param {Object} options - Configuration options
   * @param {number} options.x - X position
   * @param {number} options.y - Y position
   * @param {number} options.width - Width in pixels
   * @param {number} options.height - Height in pixels
   * @param {string} options.jobName - Job type (Worker, Warrior, Scout, Farmer, Builder)
   * @param {string} options.faction - Faction identifier
   * @param {number} options.health - Initial health
   * @param {number} options.maxHealth - Maximum health
   * @param {number} options.capacity - Resource capacity
   * @param {string} options.imagePath - Path to sprite image
   * @returns {{model: AntModel, view: AntView, controller: AntController}}
   */
  static create(options = {}) {
    // Get class references
    const AntModelClass = (typeof AntModel !== 'undefined') ? AntModel :
                          (typeof window !== 'undefined' && window.AntModel) || 
                          (typeof global !== 'undefined' && global.AntModel);
    
    const AntViewClass = (typeof AntView !== 'undefined') ? AntView :
                         (typeof window !== 'undefined' && window.AntView) || 
                         (typeof global !== 'undefined' && global.AntView);
    
    const AntControllerClass = (typeof AntController !== 'undefined') ? AntController :
                               (typeof window !== 'undefined' && window.AntController) || 
                               (typeof global !== 'undefined' && global.AntController);

    if (!AntModelClass || !AntViewClass || !AntControllerClass) {
      throw new Error('AntFactory requires AntModel, AntView, and AntController to be loaded');
    }

    // Apply defaults
    const config = {
      x: options.x !== undefined ? options.x : 0,
      y: options.y !== undefined ? options.y : 0,
      width: options.width || 32,
      height: options.height || 32,
      jobName: options.jobName || 'builder',
      faction: options.faction || 'player',
      health: options.health !== undefined ? options.health : 100,
      maxHealth: options.maxHealth !== undefined ? options.maxHealth : 100,
      capacity: options.capacity !== undefined ? options.capacity : 10,
      imagePath: options.imagePath || null,
      ...options // Allow additional options to pass through
    };

    // Create MVC triad
    const model = new AntModelClass(config);
    const view = new AntViewClass(model);
    const controller = new AntControllerClass(model, view, config);

    // Apply job stats if job was specified
    if (config.jobName && config.jobName !== 'Worker') {
      controller.setJob(config.jobName);
    }

    return { model, view, controller };
  }

  // ===== JOB-SPECIFIC CREATION =====

  /**
   * Create a Worker ant
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Additional options
   * @returns {{model: AntModel, view: AntView, controller: AntController}}
   */
  static createWorker(x, y, options = {}) {
    return AntFactory.create({ x, y, jobName: 'Worker', ...options });
  }

  /**
   * Create a Warrior ant
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Additional options
   * @returns {{model: AntModel, view: AntView, controller: AntController}}
   */
  static createWarrior(x, y, options = {}) {
    return AntFactory.create({ x, y, jobName: 'Warrior', ...options });
  }

  /**
   * Create a Scout ant
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Additional options
   * @returns {{model: AntModel, view: AntView, controller: AntController}}
   */
  static createScout(x, y, options = {}) {
    return AntFactory.create({ x, y, jobName: 'Scout', ...options });
  }

  /**
   * Create a Farmer ant
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Additional options
   * @returns {{model: AntModel, view: AntView, controller: AntController}}
   */
  static createFarmer(x, y, options = {}) {
    return AntFactory.create({ x, y, jobName: 'Farmer', ...options });
  }

  /**
   * Create a Builder ant
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Additional options
   * @returns {{model: AntModel, view: AntView, controller: AntController}}
   */
  static createBuilder(x, y, options = {}) {
    return AntFactory.create({ x, y, jobName: 'Builder', ...options });
  }

  // ===== BATCH CREATION =====

  /**
   * Create multiple ants with same configuration
   * @param {number} count - Number of ants to create
   * @param {Object} options - Configuration for all ants
   * @returns {Array<{model: AntModel, view: AntView, controller: AntController}>}
   */
  static createMultiple(count, options = {}) {
    const ants = [];
    const baseX = options.x || 0;
    const baseY = options.y || 0;
    const spacing = options.spacing || 10;

    for (let i = 0; i < count; i++) {
      // Offset position slightly for each ant
      const offsetX = baseX + (i % 5) * spacing;
      const offsetY = baseY + Math.floor(i / 5) * spacing;

      const ant = AntFactory.create({
        ...options,
        x: offsetX,
        y: offsetY
      });

      ants.push(ant);
    }

    return ants;
  }

  /**
   * Create a squad with mixed job types
   * @param {Object} config - Squad configuration
   * @param {number} config.workers - Number of workers
   * @param {number} config.warriors - Number of warriors
   * @param {number} config.scouts - Number of scouts
   * @param {number} config.farmers - Number of farmers
   * @param {number} config.builders - Number of builders
   * @param {number} config.x - Base X position
   * @param {number} config.y - Base Y position
   * @param {number} config.spacing - Spacing between ants
   * @returns {{workers: Array, warriors: Array, scouts: Array, farmers: Array, builders: Array}}
   */
  static createSquad(config = {}) {
    const {
      workers = 0,
      warriors = 0,
      scouts = 0,
      farmers = 0,
      builders = 0,
      x = 0,
      y = 0,
      spacing = 15,
      ...otherOptions
    } = config;

    const squad = {
      workers: [],
      warriors: [],
      scouts: [],
      farmers: [],
      builders: []
    };

    let currentX = x;
    let currentY = y;

    // Create workers
    for (let i = 0; i < workers; i++) {
      squad.workers.push(AntFactory.createWorker(currentX, currentY, otherOptions));
      currentX += spacing;
    }

    // Create warriors
    for (let i = 0; i < warriors; i++) {
      squad.warriors.push(AntFactory.createWarrior(currentX, currentY, otherOptions));
      currentX += spacing;
    }

    // Create scouts
    for (let i = 0; i < scouts; i++) {
      squad.scouts.push(AntFactory.createScout(currentX, currentY, otherOptions));
      currentX += spacing;
    }

    // Create farmers
    for (let i = 0; i < farmers; i++) {
      squad.farmers.push(AntFactory.createFarmer(currentX, currentY, otherOptions));
      currentX += spacing;
    }

    // Create builders
    for (let i = 0; i < builders; i++) {
      squad.builders.push(AntFactory.createBuilder(currentX, currentY, otherOptions));
      currentX += spacing;
    }

    return squad;
  }

  /**
   * Create ants in a grid pattern
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @param {Object} options - Configuration options
   * @param {number} options.x - Base X position
   * @param {number} options.y - Base Y position
   * @param {number} options.spacing - Spacing between ants (default 50)
   * @returns {Array<{model: AntModel, view: AntView, controller: AntController}>}
   */
  static createGrid(rows, cols, options = {}) {
    const ants = [];
    const baseX = options.x || 0;
    const baseY = options.y || 0;
    const spacing = options.spacing || 50;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = baseX + col * spacing;
        const y = baseY + row * spacing;

        const ant = AntFactory.create({
          ...options,
          x,
          y
        });

        ants.push(ant);
      }
    }

    return ants;
  }

  /**
   * Create ants in a circle pattern
   * @param {number} count - Number of ants
   * @param {Object} options - Configuration options
   * @param {number} options.x - Center X position
   * @param {number} options.y - Center Y position
   * @param {number} options.radius - Circle radius (default 100)
   * @returns {Array<{model: AntModel, view: AntView, controller: AntController}>}
   */
  static createCircle(count, options = {}) {
    const ants = [];
    const centerX = options.x || 0;
    const centerY = options.y || 0;
    const radius = options.radius || 100;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const ant = AntFactory.create({
        ...options,
        x,
        y
      });

      ants.push(ant);
    }

    return ants;
  }

  // ===== CONVENIENCE METHODS =====

  /**
   * Get list of all available job types
   * @returns {string[]} Array of job names
   */
  static getAllJobs() {
    return ['Worker', 'Warrior', 'Scout', 'Farmer', 'Builder'];
  }

  /**
   * Get default configuration
   * @returns {Object} Default configuration object
   */
  static getDefaultConfig() {
    return {
      x: 0,
      y: 0,
      width: 32,
      height: 32,
      jobName: 'Worker',
      faction: 'friendly',
      health: 100,
      maxHealth: 100,
      capacity: 10,
      imagePath: null
    };
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.AntFactory = AntFactory;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntFactory;
}
