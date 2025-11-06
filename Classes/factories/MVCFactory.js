/**
 * MVCFactory - Factory functions for easy MVC entity creation
 * 
 * **Purpose**: Simplify MVC entity instantiation
 * - Create complete MVC triad (model, view, controller) in one call
 * - Encapsulate default values and configuration
 * - Provide consistent entity creation across codebase
 * 
 * **Usage**:
 * ```javascript
 * // Create ant with job and faction
 * const ant = MVCFactory.createAntMVC(100, 200, 'Scout', 'player');
 * ant.view.render(ant.model, graphics);
 * ant.controller.update(ant.model, deltaTime);
 * 
 * // Create resource with amount
 * const resource = MVCFactory.createResourceMVC(300, 400, 'food', 50);
 * 
 * // Create building with level
 * const building = MVCFactory.createBuildingMVC(500, 600, 'anthill', 2);
 * ```
 * 
 * **Benefits**:
 * - One-line entity creation
 * - Guaranteed valid MVC triads
 * - Consistent defaults
 * - Easy to test and maintain
 */

// Load dependencies (Node.js environment)
if (typeof module !== 'undefined' && typeof require !== 'undefined') {
  var AntModel = require('../mvc/models/AntModel');
  var AntView = require('../mvc/views/AntView');
  var AntController = require('../mvc/controllers/AntController');
  var ResourceModel = require('../mvc/models/ResourceModel');
  var ResourceView = require('../mvc/views/ResourceView');
  var ResourceController = require('../mvc/controllers/ResourceController');
  var BuildingModel = require('../mvc/models/BuildingModel');
  var BuildingView = require('../mvc/views/BuildingView');
  var BuildingController = require('../mvc/controllers/BuildingController');
}

class MVCFactory {
  
  /**
   * Create complete ant MVC triad
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} jobName - Job name (Scout, Warrior, Builder, etc.)
   * @param {string} faction - Faction (player, enemy, neutral) - defaults to 'player'
   * @returns {Object} {model, view, controller} triad
   * 
   * @example
   * const ant = MVCFactory.createAntMVC(100, 200, 'Scout');
   * ant.controller.update(ant.model, 16);
   * ant.view.render(ant.model, graphics);
   */
  static createAntMVC(x, y, jobName, faction = 'player') {
    const model = new AntModel({
      position: { x, y },
      jobName: jobName,
      faction: faction
    });
    
    const view = new AntView();
    const controller = new AntController();
    
    return {
      model: model,
      view: view,
      controller: controller
    };
  }
  
  /**
   * Create complete resource MVC triad
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} resourceType - Resource type (food, wood, stone)
   * @param {number} amount - Resource amount - defaults to 50
   * @returns {Object} {model, view, controller} triad
   * 
   * @example
   * const resource = MVCFactory.createResourceMVC(300, 400, 'food', 100);
   * resource.controller.update(resource.model, 16);
   * resource.view.render(resource.model, graphics);
   */
  static createResourceMVC(x, y, resourceType, amount = 50) {
    // ResourceModel constructor takes object: {x, y, resourceType, amount}
    const model = new ResourceModel({ x, y, resourceType, amount });
    
    const view = new ResourceView();
    const controller = new ResourceController();
    
    return {
      model: model,
      view: view,
      controller: controller
    };
  }
  
  /**
   * Create complete building MVC triad
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} buildingType - Building type (anthill, storage, barracks)
   * @param {number} level - Building level - defaults to 1
   * @returns {Object} {model, view, controller} triad
   * 
   * @example
   * const building = MVCFactory.createBuildingMVC(500, 600, 'anthill', 2);
   * building.controller.update(building.model, 16);
   * building.view.render(building.model, graphics);
   */
  static createBuildingMVC(x, y, buildingType, level = 1) {
    // BuildingModel constructor takes object: {x, y, buildingType, level}
    const model = new BuildingModel({ x, y, buildingType, level });
    
    const view = new BuildingView();
    const controller = new BuildingController();
    
    return {
      model: model,
      view: view,
      controller: controller
    };
  }
  
  /**
   * Batch create multiple ants
   * 
   * @param {Array<Object>} antConfigs - Array of {x, y, jobName, faction}
   * @returns {Array<Object>} Array of MVC triads
   * 
   * @example
   * const ants = MVCFactory.createAntsBatch([
   *   { x: 100, y: 200, jobName: 'Scout', faction: 'player' },
   *   { x: 150, y: 250, jobName: 'Warrior', faction: 'player' }
   * ]);
   */
  static createAntsBatch(antConfigs) {
    return antConfigs.map(config => 
      this.createAntMVC(config.x, config.y, config.jobName, config.faction)
    );
  }
  
  /**
   * Batch create multiple resources
   * 
   * @param {Array<Object>} resourceConfigs - Array of {x, y, resourceType, amount}
   * @returns {Array<Object>} Array of MVC triads
   * 
   * @example
   * const resources = MVCFactory.createResourcesBatch([
   *   { x: 300, y: 400, resourceType: 'food', amount: 50 },
   *   { x: 350, y: 450, resourceType: 'wood', amount: 75 }
   * ]);
   */
  static createResourcesBatch(resourceConfigs) {
    return resourceConfigs.map(config =>
      this.createResourceMVC(config.x, config.y, config.resourceType, config.amount)
    );
  }
  
  /**
   * Batch create multiple buildings
   * 
   * @param {Array<Object>} buildingConfigs - Array of {x, y, buildingType, level}
   * @returns {Array<Object>} Array of MVC triads
   * 
   * @example
   * const buildings = MVCFactory.createBuildingsBatch([
   *   { x: 500, y: 600, buildingType: 'anthill', level: 1 },
   *   { x: 550, y: 650, buildingType: 'storage', level: 2 }
   * ]);
   */
  static createBuildingsBatch(buildingConfigs) {
    return buildingConfigs.map(config =>
      this.createBuildingMVC(config.x, config.y, config.buildingType, config.level)
    );
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MVCFactory;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.MVCFactory = MVCFactory;
}
