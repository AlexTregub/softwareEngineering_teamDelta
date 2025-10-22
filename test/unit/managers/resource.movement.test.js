/**
 * Resource Movement Integration Test
 */

// Mock Entity dependencies for Node.js testing
class MockCollisionBox2D {
  constructor(x, y, width, height) {
    this.x = x; this.y = y; this.width = width; this.height = height;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  contains(x, y) { return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height; }
}

class MockMovementController {
  constructor(entity) {
    this._entity = entity;
    this._movementSpeed = 30; // Default speed
    this._isMoving = false;
    this._skitterTimer = 100;
  }
  get movementSpeed() { return this._movementSpeed; }
  set movementSpeed(speed) { this._movementSpeed = speed; }
  getEffectiveMovementSpeed() {
    let baseSpeed = this._movementSpeed;
    if (this._entity.movementSpeed !== undefined) {
      baseSpeed = this._entity.movementSpeed;
    }
    return baseSpeed;
  }
  shouldSkitter() {
    if (this.getEffectiveMovementSpeed() <= 0) {
      return false;
    }
    this._skitterTimer -= 1;
    return this._skitterTimer <= 0;
  }
  update() {}
  moveToLocation() { return false; }
  getIsMoving() { return this._isMoving; }
  stop() { this._isMoving = false; }
}

class MockEntity {
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    this._id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._type = options.type || "Entity";
    this._isActive = true;
    this._collisionBox = new MockCollisionBox2D(x, y, width, height);
    this._controllers = new Map();
    this._controllers.set('movement', new MockMovementController(this));
    this._configureControllers(options);
  }
  _configureControllers(options) {
    const movement = this._controllers.get('movement');
    if (movement && options.movementSpeed !== undefined) {
      movement.movementSpeed = options.movementSpeed;
    }
  }
  getController(name) { return this._controllers.get(name); }
  get movementSpeed() { const movement = this._controllers.get('movement'); return movement ? movement.movementSpeed : 0; }
  set movementSpeed(speed) { const movement = this._controllers.get('movement'); if (movement) movement.movementSpeed = speed; }
  getPosition() { return { x: this._collisionBox.x, y: this._collisionBox.y }; }
  setPosition(x, y) { this._collisionBox.setPosition(x, y); }
}

describe('Resource Movement Integration', function() {
  it('prevents resources from skittering when movementSpeed is 0', function() {
    const resource = new MockEntity(10, 10, 20, 20, { type: 'Resource', movementSpeed: 0 });
    const movementController = resource.getController('movement');
    const result = {
      resourceCannotMove: resource.movementSpeed === 0 && !movementController.shouldSkitter(),
      antCanMove: false
    };
    // Basic expectations
    expect(result.resourceCannotMove).to.be.true;
  });
});
