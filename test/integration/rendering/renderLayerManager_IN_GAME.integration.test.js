/**
 * Integration Tests: RenderLayerManager with IN_GAME State
 * ==========================================================
 * Tests for rendering custom level gameplay state
 * 
 * TDD for Bug Fix: "Unknown game state: IN_GAME" error
 * Root Cause: RenderLayerManager doesn't recognize IN_GAME state
 * Expected: Should render same layers as PLAYING state
 */

const { expect } = require('chai');
const sinon = require('sinon');

const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');


setupTestEnvironment({ rendering: true });

describe('RenderLayerManager - IN_GAME State Integration', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let dom, document, window;
  let RenderLayerManager;
  let mockP5;
  let sandbox;

  before(function() {
    // Create JSDOM environment
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    document = dom.window.document;
    window = dom.window;

    // Set up global canvas properties
    window.g_canvasX = 800;
    window.g_canvasY = 600;

    // Mock p5.js globals
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.rect = sinon.stub();
    global.stroke = sinon.stub();
    global.noStroke = sinon.stub();
    global.strokeWeight = sinon.stub();

    // Sync with window
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.rect = global.rect;
    window.stroke = global.stroke;
    window.noStroke = global.noStroke;
    window.strokeWeight = global.strokeWeight;

    // Load RenderLayerManager
    const RenderLayerManagerPath = require.resolve('../../../Classes/rendering/RenderLayerManager.js');
    delete require.cache[RenderLayerManagerPath];
    RenderLayerManager = require('../../../Classes/rendering/RenderLayerManager.js');
  });

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Reset RenderLayerManager state
    if (RenderLayerManager.reset) {
      RenderLayerManager.reset();
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  after(function() {
    // Clean up
    cleanupTestEnvironment();
  });

  describe('State Recognition', function() {
    it('should recognize IN_GAME as valid state', function() {
      // RenderLayerManager should have IN_GAME in valid states
      const validStates = ['MENU', 'PLAYING', 'IN_GAME', 'PAUSED', 'LEVEL_EDITOR'];
      
      // Test that IN_GAME doesn't throw "Unknown game state" error
      expect(() => {
        RenderLayerManager.render('IN_GAME');
      }).to.not.throw();
    });

    it('should not log unknown state warning for IN_GAME', function() {
      const consoleWarnStub = sandbox.stub(console, 'warn');
      
      RenderLayerManager.render('IN_GAME');
      
      // Should not warn about unknown state
      const unknownStateWarnings = consoleWarnStub.getCalls().filter(call => 
        call.args.some(arg => typeof arg === 'string' && arg.includes('Unknown game state'))
      );
      
      expect(unknownStateWarnings.length).to.equal(0);
    });

    it('should still warn for truly unknown states', function() {
      const consoleWarnStub = sandbox.stub(console, 'warn');
      
      RenderLayerManager.render('INVALID_STATE');
      
      // Should warn about invalid state
      const unknownStateWarnings = consoleWarnStub.getCalls().filter(call => 
        call.args.some(arg => typeof arg === 'string' && arg.includes('Unknown game state'))
      );
      
      expect(unknownStateWarnings.length).to.be.greaterThan(0);
    });
  });

  describe('Layer Visibility - IN_GAME State', function() {
    it('should show TERRAIN layer in IN_GAME', function() {
      const terrainDrawable = sandbox.stub();
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.TERRAIN, terrainDrawable);
      
      RenderLayerManager.render('IN_GAME');
      
      expect(terrainDrawable.called).to.be.true;
    });

    it('should show ENTITIES layer in IN_GAME', function() {
      const entitiesDrawable = sandbox.stub();
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.ENTITIES, entitiesDrawable);
      
      RenderLayerManager.render('IN_GAME');
      
      expect(entitiesDrawable.called).to.be.true;
    });

    it('should show EFFECTS layer in IN_GAME', function() {
      const effectsDrawable = sandbox.stub();
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.EFFECTS, effectsDrawable);
      
      RenderLayerManager.render('IN_GAME');
      
      expect(effectsDrawable.called).to.be.true;
    });

    it('should show UI_GAME layer in IN_GAME', function() {
      const uiGameDrawable = sandbox.stub();
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.UI_GAME, uiGameDrawable);
      
      RenderLayerManager.render('IN_GAME');
      
      expect(uiGameDrawable.called).to.be.true;
    });

    it('should hide UI_MENU layer in IN_GAME', function() {
      const uiMenuDrawable = sandbox.stub();
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.UI_MENU, uiMenuDrawable);
      
      RenderLayerManager.render('IN_GAME');
      
      expect(uiMenuDrawable.called).to.be.false;
    });
  });

  describe('Comparison with PLAYING State', function() {
    it('should render same layers as PLAYING state', function() {
      const terrainDrawable = sandbox.stub();
      const entitiesDrawable = sandbox.stub();
      const effectsDrawable = sandbox.stub();
      const uiGameDrawable = sandbox.stub();

      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.TERRAIN, terrainDrawable);
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.ENTITIES, entitiesDrawable);
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.EFFECTS, effectsDrawable);
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.UI_GAME, uiGameDrawable);

      // Render PLAYING
      RenderLayerManager.render('PLAYING');
      const playingCalls = {
        terrain: terrainDrawable.callCount,
        entities: entitiesDrawable.callCount,
        effects: effectsDrawable.callCount,
        uiGame: uiGameDrawable.callCount
      };

      // Reset call counts
      terrainDrawable.resetHistory();
      entitiesDrawable.resetHistory();
      effectsDrawable.resetHistory();
      uiGameDrawable.resetHistory();

      // Render IN_GAME
      RenderLayerManager.render('IN_GAME');
      const inGameCalls = {
        terrain: terrainDrawable.callCount,
        entities: entitiesDrawable.callCount,
        effects: effectsDrawable.callCount,
        uiGame: uiGameDrawable.callCount
      };

      // Should match PLAYING state rendering
      expect(inGameCalls.terrain).to.equal(playingCalls.terrain);
      expect(inGameCalls.entities).to.equal(playingCalls.entities);
      expect(inGameCalls.effects).to.equal(playingCalls.effects);
      expect(inGameCalls.uiGame).to.equal(playingCalls.uiGame);
    });

    it('should use same layer order as PLAYING', function() {
      const renderOrder = [];
      
      const terrainDrawable = () => renderOrder.push('TERRAIN');
      const entitiesDrawable = () => renderOrder.push('ENTITIES');
      const effectsDrawable = () => renderOrder.push('EFFECTS');
      const uiGameDrawable = () => renderOrder.push('UI_GAME');

      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.TERRAIN, terrainDrawable);
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.ENTITIES, entitiesDrawable);
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.EFFECTS, effectsDrawable);
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.UI_GAME, uiGameDrawable);

      RenderLayerManager.render('IN_GAME');

      // Expected order: TERRAIN â†’ ENTITIES â†’ EFFECTS â†’ UI_GAME
      expect(renderOrder).to.deep.equal(['TERRAIN', 'ENTITIES', 'EFFECTS', 'UI_GAME']);
    });
  });

  describe('State Transitions', function() {
    it('should handle MENU â†’ IN_GAME transition', function() {
      const menuDrawable = sandbox.stub();
      const gameDrawable = sandbox.stub();

      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.UI_MENU, menuDrawable);
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.ENTITIES, gameDrawable);

      // Render MENU
      RenderLayerManager.render('MENU');
      expect(menuDrawable.called).to.be.true;
      expect(gameDrawable.called).to.be.false;

      // Reset
      menuDrawable.resetHistory();
      gameDrawable.resetHistory();

      // Render IN_GAME
      RenderLayerManager.render('IN_GAME');
      expect(menuDrawable.called).to.be.false;
      expect(gameDrawable.called).to.be.true;
    });

    it('should handle IN_GAME â†’ PAUSED transition', function() {
      const entitiesDrawable = sandbox.stub();
      
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.ENTITIES, entitiesDrawable);

      // IN_GAME should render entities
      RenderLayerManager.render('IN_GAME');
      expect(entitiesDrawable.called).to.be.true;

      entitiesDrawable.resetHistory();

      // PAUSED should also render entities (frozen state)
      RenderLayerManager.render('PAUSED');
      expect(entitiesDrawable.called).to.be.true;
    });
  });

  describe('Debug Layer - IN_GAME', function() {
    it('should show UI_DEBUG layer in IN_GAME when debug enabled', function() {
      const debugDrawable = sandbox.stub();
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.UI_DEBUG, debugDrawable);

      // Simulate debug mode enabled
      global.globalDebugMode = true;
      
      RenderLayerManager.render('IN_GAME');
      
      expect(debugDrawable.called).to.be.true;

      delete global.globalDebugMode;
    });
  });

  describe('Integration with GameStateManager', function() {
    it('should work with GameStateManager IN_GAME state', function() {
      // Mock GameStateManager
      const GameState = {
        getState: () => 'IN_GAME',
        isInGame: () => true,
        isPlayingGame: () => true
      };

      const gameDrawable = sandbox.stub();
      RenderLayerManager.addDrawableToLayer(RenderLayerManager.layers.ENTITIES, gameDrawable);

      // Use GameState to determine render state
      RenderLayerManager.render(GameState.getState());

      expect(gameDrawable.called).to.be.true;
    });
  });
});
