const { expect } = require('chai');

// Load minimal test environment
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

// Load the class under test
const DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');

describe('DraggablePanelManager (unit)', function() {
  let manager;

  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock RenderManager
    global.RenderManager = {
      layers: { UI_GAME: 'UI_GAME' },
      _drawables: {},
      clear: function() { this._drawables = {}; },
      addDrawableToLayer: function(layer, drawable) {
        if (!this._drawables[layer]) this._drawables[layer] = [];
        this._drawables[layer].push(drawable);
      }
    };
    
    // Clear globals that manager may reuse
    global.ants = [];
    global.RenderManager.clear();
    manager = new DraggablePanelManager();
  });

  afterEach(function() {
    if (manager && typeof manager.dispose === 'function') manager.dispose();
    manager = null;
    cleanupUITestEnvironment();
  });

  it('constructs with defaults', function() {
    expect(manager).to.be.an('object');
    expect(manager.panels).to.be.instanceOf(Map);
    expect(manager.isInitialized).to.be.false;
    expect(manager.gameState).to.equal('MENU');
  });

  it('initializes and registers with RenderManager', function() {
    manager.initialize();
    expect(manager.isInitialized).to.be.true;
    expect(RenderManager._drawables[RenderManager.layers.UI_GAME]).to.exist;
  });

  it('creates default panels', function() {
    manager.createDefaultPanels();
    expect(manager.hasPanel('ant_spawn')).to.be.true;
    expect(manager.hasPanel('resources')).to.be.true;
    expect(manager.hasPanel('stats')).to.be.true;
  });

  it('can add, get, and remove a panel', function() {
    manager.initialize();
    const cfg = { id: 'test-panel', title: 'Test', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, buttons: { items: [] } };
    const panel = manager.addPanel(cfg);
    expect(manager.hasPanel('test-panel')).to.be.true;
    const fetched = manager.getPanel('test-panel');
    expect(fetched).to.equal(panel);
    manager.removePanel('test-panel');
    expect(manager.hasPanel('test-panel')).to.be.false;
  });

  it('tracks panel counts and visible counts', function() {
    manager.createDefaultPanels();
    const ids = manager.getPanelIds();
    expect(ids.length).to.be.greaterThan(0);
    expect(manager.getPanelCount()).to.equal(ids.length);
    // Ensure visible count equals panelCount initially
    expect(manager.getVisiblePanelCount()).to.be.a('number');
  });

  it('toggles, shows, and hides panels', function() {
    manager.initialize();
    manager.createDefaultPanels();
    manager.addPanel({ id: 'toggle-me', title: 'Toggle', position: { x:0,y:0 }, size: { width: 10, height: 10 }, buttons: { items: [] } });
    expect(manager.hasPanel('toggle-me')).to.be.true;
    manager.hidePanel('toggle-me');
    expect(manager.isPanelVisible('toggle-me')).to.be.false;
    manager.showPanel('toggle-me');
    expect(manager.isPanelVisible('toggle-me')).to.be.true;
    manager.togglePanel('toggle-me');
    expect(manager.isPanelVisible('toggle-me')).to.be.false;
  });

  it('scales globally', function() {
    // Ensure min/max/defaults exist to avoid NaN
    manager.minScale = 0.5;
    manager.maxScale = 2.0;
    manager.globalScale = 1.0;
    manager.setGlobalScale(1.5);
    expect(manager.getGlobalScale()).to.equal(1.5);
    manager.scaleUp();
    expect(manager.getGlobalScale()).to.be.above(1.5);
    manager.scaleDown();
    manager.resetScale();
    expect(manager.getGlobalScale()).to.equal(1.0);
  });

  it('spawns ants via spawn commands', function() {
    manager.spawnAnts(3);
    // executeCommand should have created ants
    expect(global.ants.length).to.be.at.least(3);
  });

  it('selects and deselects ants via commands', function() {
    // spawn some ants
    manager.spawnAnts(5);
    expect(global.ants.length).to.equal(5);
    manager.selectAllAnts();
    expect(global.ants.every(a => a.isSelected)).to.be.true;
    manager.deselectAllAnts();
    expect(global.ants.every(a => !a.isSelected)).to.be.true;
  });

  it('saves and loads game using g_gameStateManager', function() {
    manager.saveGame();
    expect(g_gameStateManager._saved).to.be.true;
    manager.loadGame();
    expect(g_gameStateManager._loaded).to.be.true;
  });

  it('can dispose and clear panels', function() {
    manager.createDefaultPanels();
    expect(manager.getPanelCount()).to.be.greaterThan(0);
    manager.dispose();
    expect(manager.getPanelCount()).to.equal(0);
    expect(manager.isInitialized).to.be.false;
  });

  it('toggles debug and train mode flags', function() {
    manager.togglePanelTrainMode();
    expect(manager.debugMode.panelTrainMode).to.be.true;
    manager.togglePanelTrainMode();
    expect(manager.debugMode.panelTrainMode).to.be.false;
    manager.setPanelTrainMode(true);
    expect(manager.isPanelTrainModeEnabled()).to.be.true;
    manager.setPanelTrainMode(false);
    expect(manager.isPanelTrainModeEnabled()).to.be.false;
  });

});
