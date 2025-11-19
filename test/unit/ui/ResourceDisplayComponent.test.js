/**
 * ResourceDisplayComponent Unit Tests
 * ====================================
 * TDD Phase 1: Data Layer Tests (NO rendering)
 * 
 * Tests verify:
 * - Constructor initialization
 * - Position management
 * - Resource count storage and updates
 * - Scale property
 * - Sprite storage
 * - Data integrity (NO render logic)
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ResourceDisplayComponent - Data Layer (Unit)', function() {
  let ResourceDisplayComponent;

  before(function() {
    // Setup minimal global mocks
    global.logNormal = sinon.stub();
    global.logWarn = sinon.stub();
    global.logError = sinon.stub();

    // Load the component (will be created in Phase 2)
    ResourceDisplayComponent = require('../../../Classes/ui/ResourceDisplayComponent.js');
  });

  after(function() {
    delete global.logNormal;
    delete global.logWarn;
    delete global.logError;
  });

  describe('Constructor', function() {
    it('should initialize with position and factionId', function() {
      const component = new ResourceDisplayComponent(100, 200, 'player');

      expect(component.x).to.equal(100);
      expect(component.y).to.equal(200);
      expect(component.factionId).to.equal('player');
    });

    it('should initialize resource counts to zero', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      const resources = component.getResources();
      expect(resources.food).to.equal(0);
      expect(resources.wood).to.equal(0);
      expect(resources.stone).to.equal(0);
    });

    it('should initialize scale to 1.0 by default', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      expect(component.scale).to.equal(1.0);
    });

    it('should accept optional sprites parameter', function() {
      const mockSprites = {
        food: { path: 'food.png' },
        wood: { path: 'wood.png' },
        stone: { path: 'stone.png' }
      };

      const component = new ResourceDisplayComponent(0, 0, 'player', mockSprites);

      expect(component.sprites).to.deep.equal(mockSprites);
    });

    it('should initialize with empty sprites if not provided', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      expect(component.sprites).to.be.an('object');
      expect(Object.keys(component.sprites).length).to.equal(0);
    });
  });

  describe('Position Management', function() {
    it('should update position with setPosition()', function() {
      const component = new ResourceDisplayComponent(100, 200, 'player');

      component.setPosition(300, 400);

      expect(component.x).to.equal(300);
      expect(component.y).to.equal(400);
    });

    it('should return position with getPosition()', function() {
      const component = new ResourceDisplayComponent(150, 250, 'player');

      const position = component.getPosition();

      expect(position).to.deep.equal({ x: 150, y: 250 });
    });

    it('should handle negative positions', function() {
      const component = new ResourceDisplayComponent(100, 100, 'player');

      component.setPosition(-50, -75);

      expect(component.x).to.equal(-50);
      expect(component.y).to.equal(-75);
    });

    it('should handle zero positions', function() {
      const component = new ResourceDisplayComponent(100, 100, 'player');

      component.setPosition(0, 0);

      expect(component.x).to.equal(0);
      expect(component.y).to.equal(0);
    });
  });

  describe('Resource Count Updates', function() {
    it('should update specific resource with updateResourceCount()', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      component.updateResourceCount('food', 50);

      const resources = component.getResources();
      expect(resources.food).to.equal(50);
      expect(resources.wood).to.equal(0);
      expect(resources.stone).to.equal(0);
    });

    it('should update multiple resources independently', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      component.updateResourceCount('food', 100);
      component.updateResourceCount('wood', 75);
      component.updateResourceCount('stone', 25);

      const resources = component.getResources();
      expect(resources.food).to.equal(100);
      expect(resources.wood).to.equal(75);
      expect(resources.stone).to.equal(25);
    });

    it('should handle case-insensitive resource types', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      component.updateResourceCount('FOOD', 50);
      component.updateResourceCount('Wood', 30);
      component.updateResourceCount('stone', 10);

      const resources = component.getResources();
      expect(resources.food).to.equal(50);
      expect(resources.wood).to.equal(30);
      expect(resources.stone).to.equal(10);
    });

    it('should ignore invalid resource types', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      component.updateResourceCount('invalid', 100);

      const resources = component.getResources();
      expect(resources.food).to.equal(0);
      expect(resources.wood).to.equal(0);
      expect(resources.stone).to.equal(0);
    });

    it('should allow setting resources to zero', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');
      component.updateResourceCount('food', 100);

      component.updateResourceCount('food', 0);

      const resources = component.getResources();
      expect(resources.food).to.equal(0);
    });

    it('should handle negative resource counts (allow for testing)', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      component.updateResourceCount('food', -50);

      const resources = component.getResources();
      expect(resources.food).to.equal(-50);
    });
  });

  describe('Bulk Resource Updates', function() {
    it('should update all resources with setResources()', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      component.setResources({ food: 100, wood: 75, stone: 50 });

      const resources = component.getResources();
      expect(resources.food).to.equal(100);
      expect(resources.wood).to.equal(75);
      expect(resources.stone).to.equal(50);
    });

    it('should update partial resources with setResources()', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');
      component.setResources({ food: 50, wood: 50, stone: 50 });

      component.setResources({ food: 100 }); // Only update food

      const resources = component.getResources();
      expect(resources.food).to.equal(100);
      expect(resources.wood).to.equal(50);
      expect(resources.stone).to.equal(50);
    });

    it('should handle empty setResources() call', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');
      component.setResources({ food: 50, wood: 50, stone: 50 });

      component.setResources({});

      const resources = component.getResources();
      expect(resources.food).to.equal(50);
      expect(resources.wood).to.equal(50);
      expect(resources.stone).to.equal(50);
    });
  });

  describe('Scale Property', function() {
    it('should allow setting scale', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      component.scale = 1.5;

      expect(component.scale).to.equal(1.5);
    });

    it('should allow fractional scale values', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      component.scale = 0.75;

      expect(component.scale).to.equal(0.75);
    });

    it('should allow scale greater than 1.0', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      component.scale = 2.0;

      expect(component.scale).to.equal(2.0);
    });
  });

  describe('Sprite Storage', function() {
    it('should store sprites passed to constructor', function() {
      const mockSprites = {
        food: { path: 'food.png' },
        wood: { path: 'wood.png' }
      };

      const component = new ResourceDisplayComponent(0, 0, 'player', mockSprites);

      expect(component.sprites.food).to.deep.equal({ path: 'food.png' });
      expect(component.sprites.wood).to.deep.equal({ path: 'wood.png' });
    });

    it('should not mutate original sprites object', function() {
      const originalSprites = { food: { path: 'food.png' } };
      const component = new ResourceDisplayComponent(0, 0, 'player', originalSprites);

      component.sprites.wood = { path: 'wood.png' };

      expect(originalSprites.wood).to.be.undefined;
    });
  });

  describe('Data Integrity', function() {
    it('should return copy of resources (prevent external mutation)', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');
      component.setResources({ food: 100, wood: 50, stone: 25 });

      const resources1 = component.getResources();
      resources1.food = 999;

      const resources2 = component.getResources();
      expect(resources2.food).to.equal(100); // Original unchanged
    });

    it('should maintain separate state per instance', function() {
      const component1 = new ResourceDisplayComponent(0, 0, 'player');
      const component2 = new ResourceDisplayComponent(100, 100, 'enemy');

      component1.setResources({ food: 100, wood: 0, stone: 0 });
      component2.setResources({ food: 0, wood: 200, stone: 0 });

      expect(component1.getResources().food).to.equal(100);
      expect(component2.getResources().wood).to.equal(200);
    });
  });

  describe('Method Existence', function() {
    it('should have render() method (Phase 4 complete)', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      expect(component.render).to.be.a('function');
    });

    it('should NOT subscribe to events yet (Phase 6)', function() {
      const component = new ResourceDisplayComponent(0, 0, 'player');

      expect(component._setupEventListeners).to.be.undefined;
      expect(component._eventUnsubscribers).to.be.undefined;
    });
  });
});
