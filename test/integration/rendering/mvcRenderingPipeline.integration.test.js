/**
 * MVC Rendering Pipeline Integration Tests
 * =========================================
 * Tests the complete rendering flow:
 * EntityManager → EntityLayerRenderer → RenderLayerManager
 * 
 * TDD: Write tests FIRST, then fix implementation
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

describe('MVC Rendering Pipeline Integration', function() {
  let sandbox;
  let mockP5;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Clear any cached modules
    delete require.cache[require.resolve('../../../Classes/mvc/managers/EntityManager.js')];
    delete require.cache[require.resolve('../../../Classes/rendering/EntityLayerRenderer.js')];
    delete require.cache[require.resolve('../../../Classes/mvc/models/EntityModel.js')];
    delete require.cache[require.resolve('../../../Classes/mvc/views/EntityView.js')];
    delete require.cache[require.resolve('../../../Classes/mvc/controllers/EntityController.js')];
    delete require.cache[require.resolve('../../../Classes/mvc/factories/AntFactory.js')];
    
    // Setup p5.js mocks
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      translate: sandbox.stub(),
      scale: sandbox.stub(),
      rect: sandbox.stub(),
      ellipse: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      noStroke: sandbox.stub(),
      noFill: sandbox.stub(),
      image: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      loadImage: sandbox.stub().returns({ width: 32, height: 32 }),
      createImage: sandbox.stub().returns({ width: 32, height: 32 }),
      rectMode: sandbox.stub(),
      CENTER: 'center',
      TOP: 'top',
      BOTTOM: 'bottom',
      LEFT: 'left',
      RIGHT: 'right'
    };
    
    // Set up global/window environment
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.translate = mockP5.translate;
    global.scale = mockP5.scale;
    global.rect = mockP5.rect;
    global.ellipse = mockP5.ellipse;
    global.fill = mockP5.fill;
    global.stroke = mockP5.stroke;
    global.strokeWeight = mockP5.strokeWeight;
    global.noStroke = mockP5.noStroke;
    global.noFill = mockP5.noFill;
    global.image = mockP5.image;
    global.text = mockP5.text;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.loadImage = mockP5.loadImage;
    global.rectMode = mockP5.rectMode;
    global.CENTER = mockP5.CENTER;
    global.TOP = mockP5.TOP;
    global.BOTTOM = mockP5.BOTTOM;
    global.LEFT = mockP5.LEFT;
    global.RIGHT = mockP5.RIGHT;
    
    global.window = global;
    global.TILE_SIZE = 32;
    global.Buildings = [];
    global.ants = [];
    
    // Mock global functions and objects
    global.antsUpdate = sandbox.stub();
    global.g_resourceList = {
      resources: [],
      updateAll: sandbox.stub()
    };
    global.CORNER = 'corner';
    
    // Mock MapManager with renderConversion
    global.g_activeMap = {
      renderConversion: {
        convPosToCanvas: (pos) => [pos[0], pos[1]]
      },
      getTileAtGridCoords: () => ({ type: 0, material: 'grass' })
    };
    
    global.performance = {
      now: () => Date.now()
    };
    
    // Mock performance monitor
    global.g_performanceMonitor = null;
    
    // Load EntityAccessor
    const EntityAccessor = require('../../../Classes/rendering/EntityAccessor.js');
    global.EntityAccessor = EntityAccessor;
  });
  
  afterEach(function() {
    sandbox.restore();
    
    // Clean up globals
    delete global.push;
    delete global.pop;
    delete global.translate;
    delete global.scale;
    delete global.rect;
    delete global.ellipse;
    delete global.fill;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.noStroke;
    delete global.noFill;
    delete global.image;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.loadImage;
    delete global.window;
    delete global.TILE_SIZE;
    delete global.Buildings;
    delete global.ants;
    delete global.g_activeMap;
    delete global.performance;
    delete global.g_performanceMonitor;
    delete global.EntityAccessor;
    delete global.rectMode;
    delete global.CENTER;
    delete global.CORNER;
    delete global.antsUpdate;
    delete global.g_resourceList;
    
    // Clear EntityManager singleton
    if (global.EntityManager && global.EntityManager._instance) {
      global.EntityManager._instance = null;
    }
  });
  
  describe('EntityManager → EntityLayerRenderer Integration', function() {
    it('should retrieve MVC ants from EntityManager', function() {
      // Load required modules
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      const EntityRenderer = require('../../../Classes/rendering/EntityLayerRenderer.js');
      
      // Set up EntityManager instance
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      // Create MVC entities
      const model = new EntityModel({ x: 100, y: 200, width: 32, height: 32 });
      const view = new EntityView(model);
      const controller = new EntityController(model, view);
      
      // Register with EntityManager
      entityManager.register(controller, 'ant');
      
      // Verify EntityManager has the entity
      expect(entityManager.getCount('ant')).to.equal(1);
      
      // Create EntityRenderer instance
      const renderer = new EntityRenderer();
      
      // Collect ants (this is what EntityLayerRenderer.collectAnts does)
      renderer.collectAnts('PLAYING');
      
      // Verify ants were collected
      expect(renderer.renderGroups.ANTS.length).to.equal(1);
      expect(renderer.stats.totalEntities).to.equal(1);
    });
    
    it('should handle multiple MVC ants', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      const EntityRenderer = require('../../../Classes/rendering/EntityLayerRenderer.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      // Create 10 ants
      for (let i = 0; i < 10; i++) {
        const model = new EntityModel({ x: i * 50, y: i * 50, width: 32, height: 32 });
        const view = new EntityView(model);
        const controller = new EntityController(model, view);
        entityManager.register(controller, 'ant');
      }
      
      expect(entityManager.getCount('ant')).to.equal(10);
      
      const renderer = new EntityRenderer();
      renderer.collectAnts('PLAYING');
      
      expect(renderer.renderGroups.ANTS.length).to.equal(10);
      expect(renderer.stats.totalEntities).to.equal(10);
    });
    
    it('should call render() on each MVC entity', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      const EntityRenderer = require('../../../Classes/rendering/EntityLayerRenderer.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      // Create ant with spied render method
      const model = new EntityModel({ x: 100, y: 200, width: 32, height: 32 });
      const view = new EntityView(model);
      const controller = new EntityController(model, view);
      
      // Spy on render method
      const renderSpy = sandbox.spy(controller, 'render');
      
      entityManager.register(controller, 'ant');
      
      const renderer = new EntityRenderer();
      renderer.renderAllLayers('PLAYING');
      
      // Verify render was called
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should verify EntityController has render method', function() {
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      
      const model = new EntityModel({ x: 100, y: 200 });
      const view = new EntityView(model);
      const controller = new EntityController(model, view);
      
      expect(controller.render).to.be.a('function');
      expect(controller.update).to.be.a('function');
    });
    
    it('should delegate render to view', function() {
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      
      const model = new EntityModel({ x: 100, y: 200 });
      const view = new EntityView(model);
      const viewRenderSpy = sandbox.spy(view, 'render');
      
      const controller = new EntityController(model, view);
      
      controller.render();
      
      expect(viewRenderSpy.calledOnce).to.be.true;
    });
  });
  
  describe('EntityLayerRenderer → RenderLayerManager Integration', function() {
    it('should be accessible from RenderLayerManager', function() {
      const EntityRenderer = require('../../../Classes/rendering/EntityLayerRenderer.js');
      
      // Verify EntityRenderer was set on window
      expect(global.window.EntityRenderer).to.exist;
      expect(global.window.EntityRenderer.renderAllLayers).to.be.a('function');
    });
    
    it('should render entities when called by RenderLayerManager', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      require('../../../Classes/rendering/EntityLayerRenderer.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      // Create entities
      for (let i = 0; i < 5; i++) {
        const model = new EntityModel({ x: i * 50, y: i * 50, width: 32, height: 32 });
        const view = new EntityView(model);
        const controller = new EntityController(model, view);
        sandbox.spy(controller, 'render');
        entityManager.register(controller, 'ant');
      }
      
      // Simulate RenderLayerManager calling EntityRenderer
      global.window.EntityRenderer.renderAllLayers('PLAYING');
      
      // Verify all entities were rendered
      const allAnts = entityManager.getByType('ant');
      allAnts.forEach(ant => {
        expect(ant.render.calledOnce).to.be.true;
      });
    });
  });
  
  describe('AntFactory Integration', function() {
    it('should auto-register ants with EntityManager', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const AntFactory = require('../../../Classes/mvc/factories/AntFactory.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      // Mock SpriteMapping
      global.SpriteMapping = {
        getAntSpritePath: () => 'Images/Ants/worker_gray.png',
        getPreloadedSprite: () => null
      };
      
      // Create ant via factory
      const ant = AntFactory.create({
        jobName: 'Worker',
        x: 100,
        y: 200,
        faction: 'player'
      });
      
      // Verify auto-registration
      expect(entityManager.getCount('ant')).to.equal(1);
      expect(ant.controller).to.exist;
      expect(ant.model).to.exist;
      expect(ant.view).to.exist;
      
      // Verify render method exists
      expect(ant.controller.render).to.be.a('function');
    });
    
    it('should render factory-created ants', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const AntFactory = require('../../../Classes/mvc/factories/AntFactory.js');
      require('../../../Classes/rendering/EntityLayerRenderer.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      global.SpriteMapping = {
        getAntSpritePath: () => 'Images/Ants/worker_gray.png',
        getPreloadedSprite: () => null
      };
      
      // Create multiple ants
      const ants = [];
      for (let i = 0; i < 3; i++) {
        const ant = AntFactory.create({
          jobName: 'Worker',
          x: i * 100,
          y: i * 100,
          faction: 'player'
        });
        sandbox.spy(ant.controller, 'render');
        ants.push(ant);
      }
      
      // Render all layers
      global.window.EntityRenderer.renderAllLayers('PLAYING');
      
      // Verify all ants were rendered
      ants.forEach(ant => {
        expect(ant.controller.render.calledOnce).to.be.true;
      });
    });
  });
  
  describe('UILayerRenderer Integration', function() {
    it('should get ant count from EntityManager', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      // Create ants
      for (let i = 0; i < 7; i++) {
        const model = new EntityModel({ x: i * 50, y: i * 50 });
        const view = new EntityView(model);
        const controller = new EntityController(model, view);
        entityManager.register(controller, 'ant');
      }
      
      // Simulate UILayerRenderer getting count
      const count = entityManager.getCount('ant');
      
      expect(count).to.equal(7);
    });
    
    it('should get ant positions for minimap', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      const positions = [
        { x: 100, y: 200 },
        { x: 300, y: 400 },
        { x: 500, y: 600 }
      ];
      
      positions.forEach(pos => {
        const model = new EntityModel(pos);
        const view = new EntityView(model);
        const controller = new EntityController(model, view);
        entityManager.register(controller, 'ant');
      });
      
      // Simulate UILayerRenderer getting ants for minimap
      const allAnts = entityManager.getByType('ant');
      
      expect(allAnts.length).to.equal(3);
      allAnts.forEach((ant, i) => {
        const antPos = ant.model.getPosition();
        expect(antPos.x).to.equal(positions[i].x);
        expect(antPos.y).to.equal(positions[i].y);
      });
    });
  });
  
  describe('GameEvents Integration', function() {
    it('should filter ants by faction', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      // Create player ants
      for (let i = 0; i < 3; i++) {
        const model = new EntityModel({ x: i * 50, y: i * 50, faction: 'player' });
        const view = new EntityView(model);
        const controller = new EntityController(model, view);
        entityManager.register(controller, 'ant');
      }
      
      // Create enemy ants
      for (let i = 0; i < 2; i++) {
        const model = new EntityModel({ x: i * 50 + 500, y: i * 50 + 500, faction: 'waveEnemy' });
        const view = new EntityView(model);
        const controller = new EntityController(model, view);
        entityManager.register(controller, 'ant');
      }
      
      // Simulate GameEvents filtering
      const allAnts = entityManager.getByType('ant');
      const enemies = allAnts.filter(ant => ant.model.getFaction() === 'waveEnemy');
      
      expect(allAnts.length).to.equal(5);
      expect(enemies.length).to.equal(2);
    });
  });
  
  describe('BuildingManager Integration', function() {
    it('should get ants filtered by faction', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      // Create ants of different factions
      const factions = ['player', 'player', 'enemy', 'player'];
      factions.forEach((faction, i) => {
        const model = new EntityModel({ x: i * 50, y: i * 50, faction });
        const view = new EntityView(model);
        const controller = new EntityController(model, view);
        entityManager.register(controller, 'ant');
      });
      
      // Simulate BuildingManager.getAnts('player')
      const allAnts = entityManager.getByType('ant');
      const playerAnts = allAnts.filter(ant => {
        const faction = ant.model.getFaction();
        return faction === 'player' || faction === 'neutral';
      });
      
      expect(playerAnts.length).to.equal(3); // 3 player ants
    });
  });
  
  describe('Complete Rendering Pipeline', function() {
    it('should render complete MVC pipeline end-to-end', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const AntFactory = require('../../../Classes/mvc/factories/AntFactory.js');
      require('../../../Classes/rendering/EntityLayerRenderer.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      global.SpriteMapping = {
        getAntSpritePath: () => 'Images/Ants/worker_gray.png',
        getPreloadedSprite: () => null
      };
      
      // 1. Create ants via factory (auto-registers)
      const ants = [];
      for (let i = 0; i < 5; i++) {
        const ant = AntFactory.create({
          jobName: 'Worker',
          x: i * 100,
          y: i * 100,
          faction: 'player'
        });
        sandbox.spy(ant.controller, 'render');
        ants.push(ant);
      }
      
      // 2. Verify EntityManager has them
      expect(entityManager.getCount('ant')).to.equal(5);
      
      // 3. Render via EntityRenderer
      global.window.EntityRenderer.renderAllLayers('PLAYING');
      
      // 4. Verify all rendered
      ants.forEach(ant => {
        expect(ant.controller.render.calledOnce).to.be.true;
      });
      
      // 5. Verify stats (renderEntityGroupStandard catches errors, so rendered count is what matters)
      expect(global.window.EntityRenderer.stats.totalEntities).to.be.at.least(5);
    });
    
    it('should collect and render ants from EntityManager', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const AntFactory = require('../../../Classes/mvc/factories/AntFactory.js');
      require('../../../Classes/rendering/EntityLayerRenderer.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      global.SpriteMapping = {
        getAntSpritePath: () => 'Images/Ants/worker_gray.png',
        getPreloadedSprite: () => null
      };
      
      // Create ants
      for (let i = 0; i < 3; i++) {
        AntFactory.create({
          jobName: 'Worker',
          x: i * 50,
          y: i * 50,
          faction: 'player'
        });
      }
      
      // Manually collect ants (what EntityLayerRenderer does)
      const renderer = global.window.EntityRenderer;
      renderer.collectAnts('PLAYING');
      
      // Verify collection
      expect(renderer.renderGroups.ANTS.length).to.equal(3);
      expect(renderer.stats.totalEntities).to.equal(3);
      
      // Each should have entity reference
      renderer.renderGroups.ANTS.forEach(entityData => {
        expect(entityData.entity).to.exist;
        expect(entityData.entity.render).to.be.a('function');
        expect(entityData.type).to.equal('ant');
      });
    });
    
    it('should verify render delegation chain: Controller -> View', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      const EntityView = require('../../../Classes/mvc/views/EntityView.js');
      const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      // Create MVC triad
      const model = new EntityModel({ x: 100, y: 100, width: 32, height: 32 });
      const view = new EntityView(model);
      const viewRenderSpy = sandbox.spy(view, 'render');
      const controller = new EntityController(model, view);
      
      entityManager.register(controller, 'ant');
      
      // Call controller.render()
      controller.render();
      
      // Verify delegation
      expect(viewRenderSpy.calledOnce).to.be.true;
    });
    
    it('should handle empty entity list gracefully', function() {
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      require('../../../Classes/rendering/EntityLayerRenderer.js');
      
      const entityManager = EntityManager.getInstance();
      global.window.entityManager = entityManager;
      
      const renderer = global.window.EntityRenderer;
      
      // Render with no entities
      expect(() => renderer.renderAllLayers('PLAYING')).to.not.throw();
      
      // Verify empty groups
      expect(renderer.renderGroups.ANTS.length).to.equal(0);
      expect(renderer.stats.totalEntities).to.equal(0);
    });
  });
});

