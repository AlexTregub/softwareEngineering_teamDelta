/**
 * Mock Entity Factories for WorldService Testing
 * 
 * Provides lightweight mock implementations of entity factories
 * for isolated WorldService testing without real entity dependencies.
 */

/**
 * Mock Ant Factory
 * 
 * Creates mock ant controllers with minimal API surface
 */
class MockAntFactory {
  constructor() {
    this._idCounter = 1;
  }
  
  /**
   * Create mock scout ant
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Ant options
   * @returns {Object} Mock ant controller
   */
  createScout(x, y, options = {}) {
    return this._createMockAnt('Scout', x, y, options);
  }
  
  /**
   * Create mock worker ant
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Ant options
   * @returns {Object} Mock ant controller
   */
  createWorker(x, y, options = {}) {
    return this._createMockAnt('Worker', x, y, options);
  }
  
  /**
   * Create generic mock ant
   * @private
   */
  _createMockAnt(jobName, x, y, options) {
    const ant = {
      id: this._idCounter++,
      type: 'Ant',
      faction: options.faction || 'player',
      jobName: jobName,
      position: { x, y },
      size: { width: 32, height: 32 },
      isSelected: false,
      isActive: true,
      isPaused: false,
      state: 'idle',
      
      // Getters
      getPosition: function() { return this.position; },
      getSize: function() { return this.size; },
      getJobName: function() { return this.jobName; },
      getSelected: function() { return this.isSelected; },
      getType: function() { return this.type; },
      getFaction: function() { return this.faction; },
      getState: function() { return this.state; },
      
      // Setters
      setPosition: function(pos) { this.position = pos; },
      setSelected: function(selected) { this.isSelected = selected; },
      setState: function(state) { this.state = state; },
      setPaused: function(paused) { this.isPaused = paused; },
      
      // Actions
      moveToLocation: function(targetX, targetY) {
        this.targetPosition = { x: targetX, y: targetY };
      },
      
      // Lifecycle
      update: function(deltaTime) {
        // Move towards target if set
        if (this.targetPosition) {
          const dx = this.targetPosition.x - this.position.x;
          const dy = this.targetPosition.y - this.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 5) {
            this.position = { ...this.targetPosition };
            this.targetPosition = null;
          } else {
            const speed = 100 * deltaTime;
            this.position.x += (dx / dist) * speed;
            this.position.y += (dy / dist) * speed;
          }
        }
      },
      
      render: function() {
        // Mock render (no-op)
      },
      
      destroy: function() {
        this.isActive = false;
      }
    };
    
    return ant;
  }
}

/**
 * Mock Building Factory
 * 
 * Creates mock building controllers
 */
class MockBuildingFactory {
  constructor() {
    this._idCounter = 1000;
  }
  
  /**
   * Create mock ant cone building
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Building options
   * @returns {Object} Mock building controller
   */
  createAntCone(x, y, options = {}) {
    return this._createMockBuilding('AntCone', x, y, 64, 64, options);
  }
  
  /**
   * Create mock storage building
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Building options
   * @returns {Object} Mock building controller
   */
  createStorage(x, y, options = {}) {
    return this._createMockBuilding('Storage', x, y, 96, 96, options);
  }
  
  /**
   * Create generic mock building
   * @private
   */
  _createMockBuilding(buildingType, x, y, width, height, options) {
    const building = {
      id: this._idCounter++,
      type: 'Building',
      buildingType: buildingType,
      faction: options.faction || 'player',
      position: { x, y },
      size: { width, height },
      isActive: true,
      health: 100,
      maxHealth: 100,
      
      // Getters
      getPosition: function() { return this.position; },
      getSize: function() { return this.size; },
      getType: function() { return this.type; },
      getBuildingType: function() { return this.buildingType; },
      getFaction: function() { return this.faction; },
      getHealth: function() { return this.health; },
      
      // Setters
      setPosition: function(pos) { this.position = pos; },
      setHealth: function(hp) { this.health = Math.max(0, Math.min(this.maxHealth, hp)); },
      
      // Lifecycle
      update: function(deltaTime) {
        // Mock update
      },
      
      render: function() {
        // Mock render
      },
      
      destroy: function() {
        this.isActive = false;
      }
    };
    
    return building;
  }
}

/**
 * Mock Resource Factory
 * 
 * Creates mock resource controllers
 */
class MockResourceFactory {
  constructor() {
    this._idCounter = 2000;
  }
  
  /**
   * Create mock resource
   * 
   * @param {string} resourceType - Resource type ('food', 'wood', 'stone')
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} options - Resource options
   * @returns {Object} Mock resource controller
   */
  createResource(resourceType, x, y, options = {}) {
    const resource = {
      id: this._idCounter++,
      type: 'Resource',
      resourceType: resourceType,
      position: { x, y },
      size: { width: 32, height: 32 },
      amount: options.amount || 100,
      maxAmount: options.maxAmount || 100,
      isActive: true,
      
      // Getters
      getPosition: function() { return this.position; },
      getSize: function() { return this.size; },
      getType: function() { return this.resourceType; }, // Return resourceType for filtering
      getResourceType: function() { return this.resourceType; },
      getAmount: function() { return this.amount; },
      
      // Setters
      setPosition: function(pos) { this.position = pos; },
      setAmount: function(amt) { 
        this.amount = Math.max(0, Math.min(this.maxAmount, amt));
        if (this.amount === 0) {
          this.isActive = false;
        }
      },
      
      // Actions
      gather: function(amount) {
        const gathered = Math.min(this.amount, amount);
        this.setAmount(this.amount - gathered);
        return gathered;
      },
      
      // Lifecycle
      update: function(deltaTime) {
        // Mock update
      },
      
      render: function() {
        // Mock render
      },
      
      destroy: function() {
        this.isActive = false;
      }
    };
    
    return resource;
  }
}

// Export factories
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MockAntFactory,
    MockBuildingFactory,
    MockResourceFactory
  };
}
if (typeof window !== 'undefined') {
  window.MockAntFactory = MockAntFactory;
  window.MockBuildingFactory = MockBuildingFactory;
  window.MockResourceFactory = MockResourceFactory;
}
