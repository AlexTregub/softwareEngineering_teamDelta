/**
 * Full System Integration Tests - Phase 8
 * ========================================
 * Tests complete integration of:
 * - GameUIOverlay (orchestrator)
 * - ResourceDisplayComponent (UI component)
 * - EventManager (event system)
 * - RenderLayerManager (rendering pipeline)
 * 
 * TDD: Write tests FIRST, verify system integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('Full System Integration - Phase 8', function() {
  let dom, window, document;
  let ResourceDisplayComponent, GameUIOverlay;
  let eventManager, renderManager;
  let gameUIOverlay;

  // Setup JSDOM environment
  before(function() {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock p5.js drawing functions
    const p5Functions = [
      'push', 'pop', 'fill', 'noStroke', 'rect', 'stroke',
      'strokeWeight', 'textAlign', 'textSize', 'text',
      'image', 'imageMode', 'LEFT', 'CENTER', 'TOP', 'BOTTOM'
    ];
    
    p5Functions.forEach(fn => {
      if (typeof fn === 'string') {
        global[fn] = sinon.stub();
        window[fn] = global[fn];
      }
    });

    // Mock constants
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    window.LEFT = global.LEFT;
    window.CENTER = global.CENTER;
    window.TOP = global.TOP;
    window.BOTTOM = global.BOTTOM;

    // Load real classes
    const componentPath = path.resolve(__dirname, '../../../Classes/ui/ResourceDisplayComponent.js');
    const overlayPath = path.resolve(__dirname, '../../../Classes/ui/GameUIOverlay.js');
    
    delete require.cache[require.resolve(componentPath)];
    delete require.cache[require.resolve(overlayPath)];
    
    ResourceDisplayComponent = require(componentPath);
    GameUIOverlay = require(overlayPath);
    
    global.ResourceDisplayComponent = ResourceDisplayComponent;
    window.ResourceDisplayComponent = ResourceDisplayComponent;
    global.GameUIOverlay = GameUIOverlay;
    window.GameUIOverlay = GameUIOverlay;
  });

  beforeEach(function() {
    // Reset all p5 stubs
    Object.keys(global).forEach(key => {
      if (global[key] && typeof global[key].resetHistory === 'function') {
        global[key].resetHistory();
      }
    });

    // Create real EventManager
    eventManager = {
      listeners: new Map(),
      on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
          this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
      },
      off(eventName, callback) {
        if (!this.listeners.has(eventName)) return;
        const callbacks = this.listeners.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      },
      emit(eventName, data) {
        if (!this.listeners.has(eventName)) return;
        this.listeners.get(eventName).forEach(cb => cb(data));
      },
      listenerCount(eventName) {
        return this.listeners.has(eventName) ? this.listeners.get(eventName).length : 0;
      },
      removeAllListeners(eventName) {
        if (eventName) {
          this.listeners.delete(eventName);
        } else {
          this.listeners.clear();
        }
      }
    };

    // Create real RenderLayerManager
    renderManager = {
      layers: {
        TERRAIN: 'TERRAIN',
        ENTITIES: 'ENTITIES',
        EFFECTS: 'EFFECTS',
        UI_GAME: 'UI_GAME',
        UI_DEBUG: 'UI_DEBUG',
        UI_MENU: 'UI_MENU'
      },
      layerDrawables: new Map(),
      
      addDrawableToLayer(layer, drawableFn) {
        if (!this.layerDrawables.has(layer)) {
          this.layerDrawables.set(layer, []);
        }
        this.layerDrawables.get(layer).push(drawableFn);
      },
      
      removeDrawableFromLayer(layer, drawableFn) {
        if (!this.layerDrawables.has(layer)) return;
        const drawables = this.layerDrawables.get(layer);
        const index = drawables.indexOf(drawableFn);
        if (index !== -1) {
          drawables.splice(index, 1);
        }
      },
      
      render(gameState) {
        const layers = ['TERRAIN', 'ENTITIES', 'EFFECTS', 'UI_GAME', 'UI_DEBUG', 'UI_MENU'];
        layers.forEach(layer => {
          const drawables = this.layerDrawables.get(layer) || [];
          drawables.forEach(fn => fn(gameState));
        });
      }
    };

    // Initialize GameUIOverlay
    gameUIOverlay = new GameUIOverlay({
      eventManager,
      renderManager
    });
  });

  afterEach(function() {
    if (gameUIOverlay) {
      gameUIOverlay.destroy();
    }
    eventManager.removeAllListeners();
    renderManager.layerDrawables.clear();
  });

  after(function() {
    // Cleanup global scope
    delete global.ResourceDisplayComponent;
    delete global.GameUIOverlay;
    delete global.window;
    delete global.document;
  });

  describe('System Initialization', function() {
    it('should initialize complete UI system', function() {
      gameUIOverlay.initialize({
        factionId: 'player',
        resourceDisplay: { x: 10, y: 10 }
      });

      expect(gameUIOverlay.initialized).to.be.true;
      expect(gameUIOverlay.resourceDisplay).to.exist;
      expect(gameUIOverlay.components.length).to.equal(1);
    });

    it('should create ResourceDisplayComponent with correct configuration', function() {
      gameUIOverlay.initialize({
        factionId: 'testFaction',
        resourceDisplay: { x: 50, y: 100 }
      });

      const component = gameUIOverlay.resourceDisplay;
      expect(component.factionId).to.equal('testFaction');
      expect(component.x).to.equal(50);
      expect(component.y).to.equal(100);
    });

    it('should connect ResourceDisplayComponent to EventManager', function() {
      gameUIOverlay.initialize();

      const component = gameUIOverlay.resourceDisplay;
      expect(component.eventManager).to.equal(eventManager);
      expect(eventManager.listenerCount('RESOURCE_UPDATED')).to.be.greaterThan(0);
    });

    it('should register ResourceDisplayComponent with RenderLayerManager', function() {
      const initialDrawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      const initialCount = initialDrawables.length;

      gameUIOverlay.initialize();

      const finalDrawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      expect(finalDrawables.length).to.be.greaterThan(initialCount);
    });
  });

  describe('Event-Driven Updates', function() {
    beforeEach(function() {
      gameUIOverlay.initialize({ factionId: 'player' });
    });

    it('should update ResourceDisplayComponent when RESOURCE_UPDATED event fires', function() {
      const component = gameUIOverlay.resourceDisplay;
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'food',
        amount: 100
      });

      expect(component.getResources().food).to.equal(100);
    });

    it('should handle multiple resource updates via events', function() {
      const component = gameUIOverlay.resourceDisplay;
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'food',
        amount: 50
      });
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'wood',
        amount: 75
      });
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'stone',
        amount: 25
      });

      const resources = component.getResources();
      expect(resources.food).to.equal(50);
      expect(resources.wood).to.equal(75);
      expect(resources.stone).to.equal(25);
    });

    it('should ignore events for different factions', function() {
      const component = gameUIOverlay.resourceDisplay;
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'enemy',
        resourceType: 'food',
        amount: 999
      });

      expect(component.getResources().food).to.equal(0);
    });

    it('should handle rapid successive events', function() {
      const component = gameUIOverlay.resourceDisplay;
      
      for (let i = 0; i < 100; i++) {
        eventManager.emit('RESOURCE_UPDATED', {
          factionId: 'player',
          resourceType: 'food',
          amount: i
        });
      }

      expect(component.getResources().food).to.equal(99);
    });
  });

  describe('Rendering Pipeline Integration', function() {
    beforeEach(function() {
      gameUIOverlay.initialize({ factionId: 'player' });
    });

    it('should render ResourceDisplayComponent through RenderLayerManager', function() {
      renderManager.render('PLAYING');

      // Verify p5.js drawing functions were called
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
      expect(global.rect.called).to.be.true;
    });

    it('should render with updated resource data', function() {
      const component = gameUIOverlay.resourceDisplay;
      component.setResources({ food: 100, wood: 50, stone: 25 });

      global.text.resetHistory();
      renderManager.render('PLAYING');

      // Should render resource counts
      expect(global.text.called).to.be.true;
      const textCalls = global.text.getCalls();
      const renderedText = textCalls.map(call => call.args[0]).join(' ');
      expect(renderedText).to.include('100'); // food
      expect(renderedText).to.include('50');  // wood
      expect(renderedText).to.include('25');  // stone
    });

    it('should render at correct position', function() {
      gameUIOverlay.destroy();
      gameUIOverlay = new GameUIOverlay({ eventManager, renderManager });
      gameUIOverlay.initialize({
        factionId: 'player',
        resourceDisplay: { x: 200, y: 150 }
      });

      global.rect.resetHistory();
      renderManager.render('PLAYING');

      const rectCalls = global.rect.getCalls();
      expect(rectCalls.length).to.be.greaterThan(0);
      
      // Check that rendering happened near the specified position
      const firstRect = rectCalls[0];
      const x = firstRect.args[0];
      const y = firstRect.args[1];
      expect(x).to.be.closeTo(200, 50);
      expect(y).to.be.closeTo(150, 50);
    });

    it('should handle multiple render calls', function() {
      for (let i = 0; i < 10; i++) {
        renderManager.render('PLAYING');
      }

      expect(global.push.callCount).to.equal(10);
      expect(global.pop.callCount).to.equal(10);
    });
  });

  describe('Complete Workflow: Event → Data → Render', function() {
    beforeEach(function() {
      gameUIOverlay.initialize({ factionId: 'player' });
    });

    it('should complete full workflow: event emission → data update → rendering', function() {
      const component = gameUIOverlay.resourceDisplay;
      
      // Step 1: Emit event
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'food',
        amount: 250
      });
      
      // Step 2: Verify data updated
      expect(component.getResources().food).to.equal(250);
      
      // Step 3: Render and verify
      global.text.resetHistory();
      renderManager.render('PLAYING');
      
      const textCalls = global.text.getCalls();
      const renderedText = textCalls.map(call => call.args[0]).join(' ');
      expect(renderedText).to.include('250');
    });

    it('should handle bulk resource updates in workflow', function() {
      const component = gameUIOverlay.resourceDisplay;
      
      // Bulk update via events
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resources: { food: 100, wood: 200, stone: 300 }
      });
      
      // Verify data
      const resources = component.getResources();
      expect(resources.food).to.equal(100);
      expect(resources.wood).to.equal(200);
      expect(resources.stone).to.equal(300);
      
      // Render and verify all values present
      global.text.resetHistory();
      renderManager.render('PLAYING');
      
      const textCalls = global.text.getCalls();
      const renderedText = textCalls.map(call => call.args[0]).join(' ');
      expect(renderedText).to.include('100');
      expect(renderedText).to.include('200');
      expect(renderedText).to.include('300');
    });

    it('should maintain consistency across multiple workflow cycles', function() {
      const component = gameUIOverlay.resourceDisplay;
      
      for (let cycle = 1; cycle <= 5; cycle++) {
        // Update via event
        eventManager.emit('RESOURCE_UPDATED', {
          factionId: 'player',
          resourceType: 'food',
          amount: cycle * 10
        });
        
        // Verify data
        expect(component.getResources().food).to.equal(cycle * 10);
        
        // Render
        renderManager.render('PLAYING');
      }
      
      // Final state check
      expect(component.getResources().food).to.equal(50);
    });
  });

  describe('Multiple GameUIOverlay Instances', function() {
    let playerOverlay, enemyOverlay;

    beforeEach(function() {
      playerOverlay = new GameUIOverlay({ eventManager, renderManager });
      enemyOverlay = new GameUIOverlay({ eventManager, renderManager });
      
      playerOverlay.initialize({
        factionId: 'player',
        resourceDisplay: { x: 10, y: 10 }
      });
      
      enemyOverlay.initialize({
        factionId: 'enemy',
        resourceDisplay: { x: 600, y: 10 }
      });
    });

    afterEach(function() {
      playerOverlay.destroy();
      enemyOverlay.destroy();
    });

    it('should support multiple overlays for different factions', function() {
      expect(playerOverlay.resourceDisplay.factionId).to.equal('player');
      expect(enemyOverlay.resourceDisplay.factionId).to.equal('enemy');
    });

    it('should handle faction-specific events independently', function() {
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'food',
        amount: 100
      });
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'enemy',
        resourceType: 'food',
        amount: 200
      });

      expect(playerOverlay.resourceDisplay.getResources().food).to.equal(100);
      expect(enemyOverlay.resourceDisplay.getResources().food).to.equal(200);
    });

    it('should render both overlays through shared RenderLayerManager', function() {
      renderManager.render('PLAYING');

      // Both overlays should render
      expect(global.push.callCount).to.be.greaterThan(1);
      expect(global.pop.callCount).to.be.greaterThan(1);
    });

    it('should clean up independently when destroyed', function() {
      const beforeDestroy = eventManager.listenerCount('RESOURCE_UPDATED');
      
      playerOverlay.destroy();
      
      const afterFirstDestroy = eventManager.listenerCount('RESOURCE_UPDATED');
      expect(afterFirstDestroy).to.be.lessThan(beforeDestroy);
      
      enemyOverlay.destroy();
      
      const afterSecondDestroy = eventManager.listenerCount('RESOURCE_UPDATED');
      expect(afterSecondDestroy).to.be.lessThan(afterFirstDestroy);
    });
  });

  describe('Lifecycle Management', function() {
    it('should properly initialize system', function() {
      expect(gameUIOverlay.initialized).to.be.false;
      
      gameUIOverlay.initialize();
      
      expect(gameUIOverlay.initialized).to.be.true;
      expect(gameUIOverlay.resourceDisplay).to.exist;
      expect(eventManager.listenerCount('RESOURCE_UPDATED')).to.be.greaterThan(0);
    });

    it('should allow update() calls throughout lifecycle', function() {
      expect(() => gameUIOverlay.update(16)).to.not.throw();
      
      gameUIOverlay.initialize();
      expect(() => gameUIOverlay.update(16)).to.not.throw();
      
      gameUIOverlay.destroy();
      expect(() => gameUIOverlay.update(16)).to.not.throw();
    });

    it('should properly clean up entire system on destroy()', function() {
      gameUIOverlay.initialize({ factionId: 'player' });
      
      const listenersBefore = eventManager.listenerCount('RESOURCE_UPDATED');
      const uiDrawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      const drawablesBefore = uiDrawables.length;
      
      gameUIOverlay.destroy();
      
      const listenersAfter = eventManager.listenerCount('RESOURCE_UPDATED');
      const uiDrawablesAfter = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      const drawablesAfter = uiDrawablesAfter.length;
      
      expect(listenersAfter).to.be.lessThan(listenersBefore);
      expect(drawablesAfter).to.be.lessThan(drawablesBefore);
      expect(gameUIOverlay.initialized).to.be.false;
      expect(gameUIOverlay.components.length).to.equal(0);
    });

    it('should support re-initialization after destroy()', function() {
      gameUIOverlay.initialize({ factionId: 'player' });
      gameUIOverlay.destroy();
      
      expect(() => {
        gameUIOverlay.initialize({ factionId: 'player2' });
      }).to.not.throw();
      
      expect(gameUIOverlay.initialized).to.be.true;
      expect(gameUIOverlay.resourceDisplay.factionId).to.equal('player2');
    });
  });

  describe('Error Handling and Edge Cases', function() {
    it('should handle missing EventManager gracefully', function() {
      const overlay = new GameUIOverlay({ renderManager });
      
      expect(() => overlay.initialize()).to.not.throw();
      expect(overlay.resourceDisplay).to.exist;
    });

    it('should handle missing RenderLayerManager gracefully', function() {
      const overlay = new GameUIOverlay({ eventManager });
      
      expect(() => overlay.initialize()).to.not.throw();
      expect(overlay.resourceDisplay).to.exist;
    });

    it('should handle events without initialized overlay', function() {
      expect(() => {
        eventManager.emit('RESOURCE_UPDATED', {
          factionId: 'player',
          resourceType: 'food',
          amount: 100
        });
      }).to.not.throw();
    });

    it('should handle rendering with no components', function() {
      expect(() => renderManager.render('PLAYING')).to.not.throw();
    });

    it('should handle destroy() without initialization', function() {
      const overlay = new GameUIOverlay({ eventManager, renderManager });
      expect(() => overlay.destroy()).to.not.throw();
    });

    it('should handle invalid resource types in events', function() {
      gameUIOverlay.initialize({ factionId: 'player' });
      
      expect(() => {
        eventManager.emit('RESOURCE_UPDATED', {
          factionId: 'player',
          resourceType: 'invalid',
          amount: 100
        });
      }).to.not.throw();
    });
  });

  describe('Performance Characteristics', function() {
    beforeEach(function() {
      gameUIOverlay.initialize({ factionId: 'player' });
    });

    it('should handle 1000 events efficiently', function() {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        eventManager.emit('RESOURCE_UPDATED', {
          factionId: 'player',
          resourceType: 'food',
          amount: i
        });
      }
      
      const duration = Date.now() - start;
      expect(duration).to.be.lessThan(1000); // Should complete in <1 second
    });

    it('should handle 100 render calls efficiently', function() {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        renderManager.render('PLAYING');
      }
      
      const duration = Date.now() - start;
      expect(duration).to.be.lessThan(500); // Should complete in <500ms
    });

    it('should not leak memory on repeated create/destroy cycles', function() {
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const overlay = new GameUIOverlay({ eventManager, renderManager });
        overlay.initialize({ factionId: `faction${i}` });
        overlay.destroy();
      }
      
      // Verify minimal lingering listeners (beforeEach creates one overlay)
      const remainingListeners = eventManager.listenerCount('RESOURCE_UPDATED');
      expect(remainingListeners).to.be.lessThan(3); // Allow some tolerance
    });
  });
});
