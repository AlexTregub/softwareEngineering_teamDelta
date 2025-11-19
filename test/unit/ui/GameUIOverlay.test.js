/**
 * GameUIOverlay Unit Tests
 * =========================
 * TDD Phase 7: Write tests BEFORE implementing GameUIOverlay
 * 
 * GameUIOverlay orchestrates UI components:
 * - Creates and manages ResourceDisplayComponent
 * - Registers components with RenderLayerManager
 * - Handles lifecycle (init, update, cleanup)
 * - Manages EventManager integration
 * 
 * This is the "controller" that ties everything together
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('GameUIOverlay - Unit Tests (Phase 7)', function() {
  let GameUIOverlay;
  let EventManager;
  let RenderLayerManager;
  let ResourceDisplayComponent;
  let overlay;
  let eventManager;
  let renderManager;

  before(function() {
    // Setup global mocks
    global.logNormal = sinon.stub();
    global.logWarn = sinon.stub();
    global.logError = sinon.stub();

    // Load dependencies
    EventManager = require('../../../Classes/managers/EventManager.js');
    const renderModule = require('../../../Classes/rendering/RenderLayerManager.js');
    RenderLayerManager = renderModule.RenderLayerManager;
    ResourceDisplayComponent = require('../../../Classes/ui/ResourceDisplayComponent.js');
    GameUIOverlay = require('../../../Classes/ui/GameUIOverlay.js');
  });

  beforeEach(function() {
    eventManager = new EventManager();
    renderManager = new RenderLayerManager();
  });

  afterEach(function() {
    if (overlay && overlay.destroy) {
      overlay.destroy();
    }
  });

  after(function() {
    delete global.logNormal;
    delete global.logWarn;
    delete global.logError;
  });

  describe('Constructor and Initialization', function() {
    it('should create GameUIOverlay instance', function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });

      expect(overlay).to.be.an('object');
      expect(overlay).to.be.instanceOf(GameUIOverlay);
    });

    it('should store eventManager reference', function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });

      expect(overlay.eventManager).to.equal(eventManager);
    });

    it('should store renderManager reference', function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });

      expect(overlay.renderManager).to.equal(renderManager);
    });

    it('should initialize with no components by default', function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });

      expect(overlay.components).to.be.an('array');
      expect(overlay.components.length).to.equal(0);
    });

    it('should have initialized flag set to false initially', function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });

      expect(overlay.initialized).to.be.false;
    });
  });

  describe('Component Management', function() {
    beforeEach(function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });
    });

    it('should have initialize() method', function() {
      expect(overlay.initialize).to.be.a('function');
    });

    it('should create ResourceDisplayComponent on initialize()', function() {
      overlay.initialize();

      expect(overlay.resourceDisplay).to.exist;
      expect(overlay.resourceDisplay).to.be.instanceOf(ResourceDisplayComponent);
    });

    it('should add ResourceDisplayComponent to components array', function() {
      overlay.initialize();

      expect(overlay.components).to.include(overlay.resourceDisplay);
    });

    it('should set initialized flag to true after initialize()', function() {
      overlay.initialize();

      expect(overlay.initialized).to.be.true;
    });

    it('should not re-initialize if already initialized', function() {
      overlay.initialize();
      const firstResourceDisplay = overlay.resourceDisplay;

      overlay.initialize();
      const secondResourceDisplay = overlay.resourceDisplay;

      expect(secondResourceDisplay).to.equal(firstResourceDisplay);
    });

    it('should allow custom position for ResourceDisplayComponent', function() {
      overlay.initialize({
        resourceDisplay: { x: 100, y: 200 }
      });

      const pos = overlay.resourceDisplay.getPosition();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
    });

    it('should allow custom factionId', function() {
      overlay.initialize({
        factionId: 'enemy'
      });

      expect(overlay.resourceDisplay.factionId).to.equal('enemy');
    });
  });

  describe('RenderLayerManager Integration', function() {
    beforeEach(function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });
    });

    it('should register ResourceDisplayComponent with RenderLayerManager', function() {
      const drawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      const initialCount = drawables.length;

      overlay.initialize();

      const finalDrawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      const finalCount = finalDrawables.length;
      expect(finalCount).to.be.greaterThan(initialCount);
    });

    it('should store drawable function references for cleanup', function() {
      overlay.initialize();

      expect(overlay._drawableFunctions).to.be.an('array');
      expect(overlay._drawableFunctions.length).to.be.greaterThan(0);
    });

    it('should unregister drawables on destroy()', function() {
      overlay.initialize();
      const drawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      const countAfterInit = drawables.length;

      overlay.destroy();

      const drawablesAfterDestroy = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      const countAfterDestroy = drawablesAfterDestroy.length;
      expect(countAfterDestroy).to.be.lessThan(countAfterInit);
    });
  });

  describe('EventManager Integration', function() {
    beforeEach(function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });
    });

    it('should pass eventManager to ResourceDisplayComponent', function() {
      overlay.initialize();

      expect(overlay.resourceDisplay.eventManager).to.equal(eventManager);
    });

    it('should allow ResourceDisplayComponent to subscribe to events', function() {
      const initialListeners = eventManager.listenerCount('RESOURCE_UPDATED');

      overlay.initialize();

      const finalListeners = eventManager.listenerCount('RESOURCE_UPDATED');
      expect(finalListeners).to.be.greaterThan(initialListeners);
    });
  });

  describe('Lifecycle Management', function() {
    beforeEach(function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });
    });

    it('should have destroy() method', function() {
      expect(overlay.destroy).to.be.a('function');
    });

    it('should call destroy() on all components', function() {
      overlay.initialize();

      const destroySpy = sinon.spy(overlay.resourceDisplay, 'destroy');

      overlay.destroy();

      expect(destroySpy.called).to.be.true;
    });

    it('should clear components array on destroy()', function() {
      overlay.initialize();
      expect(overlay.components.length).to.be.greaterThan(0);

      overlay.destroy();

      expect(overlay.components.length).to.equal(0);
    });

    it('should reset initialized flag on destroy()', function() {
      overlay.initialize();
      expect(overlay.initialized).to.be.true;

      overlay.destroy();

      expect(overlay.initialized).to.be.false;
    });

    it('should allow re-initialization after destroy()', function() {
      overlay.initialize();
      overlay.destroy();

      expect(() => overlay.initialize()).to.not.throw();
      expect(overlay.initialized).to.be.true;
    });
  });

  describe('Update Method', function() {
    beforeEach(function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });
    });

    it('should have update() method', function() {
      expect(overlay.update).to.be.a('function');
    });

    it('should not throw if update() called before initialize()', function() {
      expect(() => overlay.update()).to.not.throw();
    });

    it('should not throw if update() called after initialize()', function() {
      overlay.initialize();

      expect(() => overlay.update()).to.not.throw();
    });

    it('should handle deltaTime parameter', function() {
      overlay.initialize();

      expect(() => overlay.update(16.67)).to.not.throw();
    });
  });

  describe('Error Handling', function() {
    it('should handle missing eventManager gracefully', function() {
      expect(() => {
        overlay = new GameUIOverlay({ renderManager });
        overlay.initialize();
      }).to.not.throw();
    });

    it('should handle missing renderManager gracefully', function() {
      expect(() => {
        overlay = new GameUIOverlay({ eventManager });
        overlay.initialize();
      }).to.not.throw();
    });

    it('should handle empty options object', function() {
      expect(() => {
        overlay = new GameUIOverlay({});
        overlay.initialize();
      }).to.not.throw();
    });

    it('should handle destroy() called multiple times', function() {
      overlay = new GameUIOverlay({ eventManager, renderManager });
      overlay.initialize();

      expect(() => {
        overlay.destroy();
        overlay.destroy();
        overlay.destroy();
      }).to.not.throw();
    });
  });

  describe('Component Access', function() {
    beforeEach(function() {
      overlay = new GameUIOverlay({
        eventManager,
        renderManager
      });
      overlay.initialize();
    });

    it('should provide access to ResourceDisplayComponent', function() {
      expect(overlay.resourceDisplay).to.exist;
      expect(overlay.resourceDisplay).to.be.instanceOf(ResourceDisplayComponent);
    });

    it('should allow direct manipulation of ResourceDisplayComponent', function() {
      overlay.resourceDisplay.updateResourceCount('food', 100);

      expect(overlay.resourceDisplay.getResources().food).to.equal(100);
    });

    it('should maintain component state across update() calls', function() {
      overlay.resourceDisplay.updateResourceCount('food', 50);

      overlay.update();

      expect(overlay.resourceDisplay.getResources().food).to.equal(50);
    });
  });

  describe('Multiple Instances', function() {
    it('should support multiple GameUIOverlay instances', function() {
      const overlay1 = new GameUIOverlay({
        eventManager,
        renderManager
      });
      overlay1.initialize({ factionId: 'player' });

      const overlay2 = new GameUIOverlay({
        eventManager,
        renderManager
      });
      overlay2.initialize({ factionId: 'enemy' });

      expect(overlay1.resourceDisplay.factionId).to.equal('player');
      expect(overlay2.resourceDisplay.factionId).to.equal('enemy');

      overlay1.destroy();
      overlay2.destroy();
    });
  });
});
