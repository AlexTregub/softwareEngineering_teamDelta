/**
 * BuildingFactory
 * ---------------
 * Factory for creating building instances using MVC pattern.
 * 
 * Provides static methods to create different building types:
 * - AntCone: Small spawn building (fast spawn, low health)
 * - AntHill: Medium spawn building (moderate stats)
 * - HiveSource: Large spawn building (slow spawn, high health)
 * 
 * Each method returns a fully configured BuildingController instance.
 * 
 * Usage:
 * ```javascript
 * const cone = BuildingFactory.createAntCone(x, y, 'player');
 * const hill = BuildingFactory.createAntHill(x, y, 'enemy');
 * const hive = BuildingFactory.createHiveSource(x, y, 'neutral');
 * ```
 */

/**
 * Building type configurations.
 * Each type has specific stats, spawn rates, and dimensions.
 */
const BUILDING_CONFIGS = {
  AntCone: {
    type: 'AntCone',
    width: 64,
    height: 64,
    health: 80,
    maxHealth: 80,
    spawnInterval: 8,
    spawnCount: 1,
    imagePath: 'Images/Buildings/Cone/Cone1.png',
    upgradeTree: {
      progressions: {
        1: { 
          cost: 50,
          imagePath: 'Images/Buildings/Cone/Cone2.png'
        },
        2: { 
          cost: 100,
          imagePath: 'Images/Buildings/Cone/Cone3.png'
        }
      }
    }
  },
  
  AntHill: {
    type: 'AntHill',
    width: 96,
    height: 96,
    health: 150,
    maxHealth: 150,
    spawnInterval: 12,
    spawnCount: 2,
    imagePath: 'Images/Buildings/AntHill/Hill1.png',
    upgradeTree: {
      progressions: {
        1: { 
          cost: 100,
          imagePath: 'Images/Buildings/AntHill/Hill2.png'
        },
        2: { 
          cost: 200,
          imagePath: 'Images/Buildings/AntHill/Hill3.png'
        }
      }
    }
  },
  
  HiveSource: {
    type: 'HiveSource',
    width: 128,
    height: 128,
    health: 250,
    maxHealth: 250,
    spawnInterval: 15,
    spawnCount: 3,
    imagePath: 'Images/Buildings/HiveSource/Hive1.png',
    upgradeTree: {
      progressions: {
        1: { 
          cost: 150,
          imagePath: 'Images/Buildings/HiveSource/Hive2.png'
        },
        2: { 
          cost: 300,
          imagePath: 'Images/Buildings/HiveSource/Hive3.png'
        }
      }
    }
  }
};

class BuildingFactory {
  /**
   * Create a new BuildingFactory instance.
   * @param {WorldService} [worldService=null] - Optional WorldService (Phase 6)
   */
  constructor(worldService = null) {
    this._worldService = worldService;
  }
  
  /**
   * Create an AntCone building.
   * Small spawn building with fast spawn rate and low health.
   * 
   * @param {number} x - X position in world coordinates
   * @param {number} y - Y position in world coordinates
   * @param {string|Object} [factionOrOptions='neutral'] - Building faction OR options object
   * @returns {BuildingController} AntCone controller
   */
  createAntCone(x, y, factionOrOptions = 'neutral') {
    const faction = typeof factionOrOptions === 'string' ? factionOrOptions : factionOrOptions.faction || 'neutral';
    const config = BUILDING_CONFIGS.AntCone;
    return new BuildingController(x, y, config.width, config.height, {
      ...config,
      faction
    });
  }
  
  /**
   * Static version for backward compatibility
   */
  static createAntCone(x, y, faction = 'neutral') {
    const config = BUILDING_CONFIGS.AntCone;
    return new BuildingController(x, y, config.width, config.height, {
      ...config,
      faction
    });
  }
  
  /**
   * Create an AntHill building.
   * Medium spawn building with moderate stats.
   * 
   * @param {number} x - X position in world coordinates
   * @param {number} y - Y position in world coordinates
   * @param {string|Object} [factionOrOptions='neutral'] - Building faction OR options object
   * @returns {BuildingController} AntHill controller
   */
  createAntHill(x, y, factionOrOptions = 'neutral') {
    const faction = typeof factionOrOptions === 'string' ? factionOrOptions : factionOrOptions.faction || 'neutral';
    const config = BUILDING_CONFIGS.AntHill;
    return new BuildingController(x, y, config.width, config.height, {
      ...config,
      faction
    });
  }
  
  /**
   * Static version for backward compatibility
   */
  static createAntHill(x, y, faction = 'neutral') {
    const config = BUILDING_CONFIGS.AntHill;
    return new BuildingController(x, y, config.width, config.height, {
      ...config,
      faction
    });
  }
  
  /**
   * Create a HiveSource building.
   * Large spawn building with slow spawn rate and high health.
   * 
   * @param {number} x - X position in world coordinates
   * @param {number} y - Y position in world coordinates
   * @param {string|Object} [factionOrOptions='neutral'] - Building faction OR options object
   * @returns {BuildingController} HiveSource controller
   */
  createHiveSource(x, y, factionOrOptions = 'neutral') {
    const faction = typeof factionOrOptions === 'string' ? factionOrOptions : factionOrOptions.faction || 'neutral';
    const config = BUILDING_CONFIGS.HiveSource;
    return new BuildingController(x, y, config.width, config.height, {
      ...config,
      faction
    });
  }
  
  /**
   * Static version for backward compatibility
   */
  static createHiveSource(x, y, faction = 'neutral') {
    const config = BUILDING_CONFIGS.HiveSource;
    return new BuildingController(x, y, config.width, config.height, {
      ...config,
      faction
    });
  }
  
  /**
   * Get building configuration by type.
   * @param {string} type - Building type (AntCone, AntHill, HiveSource)
   * @returns {Object} Building configuration
   */
  static getConfig(type) {
    return BUILDING_CONFIGS[type];
  }
}

// Export for Node.js testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BuildingFactory;
}

if (typeof window !== 'undefined') {
  window.BuildingFactory = BuildingFactory;
}
