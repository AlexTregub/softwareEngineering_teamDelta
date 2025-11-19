/**
 * Integration Test: AntFactory → EntityManager → RenderLayerManager → EntityLayerRenderer
 * 
 * This test validates the COMPLETE rendering pipeline from ant creation to visual output.
 * It should reveal where ants fail to appear in the actual game.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('AntFactory → Render Pipeline Integration', function() {
  let sandbox;
  let dom;
  let document;
  let window;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="defaultCanvas0"></canvas></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    document = dom.window.document;
    window = dom.window;
    
    // Setup global references
    global.window = window;
    global.document = document;
    global.Image = window.Image;
    
    // Mock p5.js drawing functions
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.translate = sandbox.stub();
    global.scale = sandbox.stub();
    global.rect = sandbox.stub();
    global.ellipse = sandbox.stub();
    global.fill = sandbox.stub();
    global.stroke = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.noFill = sandbox.stub();
    global.image = sandbox.stub();
    global.imageMode = sandbox.stub();
    global.rectMode = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.text = sandbox.stub();
    
    // p5.js constants
    global.CENTER = 'center';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    global.LEFT = 'left';
    global.RIGHT = 'right';
    global.CORNER = 'corner';
    
    // Mock performance monitor
    global.g_performanceMonitor = {
      startMeasure: sandbox.stub(),
      endMeasure: sandbox.stub(),
      recordStat: sandbox.stub(),
      startRenderPhase: sandbox.stub(),
      endRenderPhase: sandbox.stub(),
      startEntityRender: sandbox.stub(),
      endEntityRender: sandbox.stub(),
      recordEntityStats: sandbox.stub(),
      finalizeEntityPerformance: sandbox.stub()
    };
    
    // Mock SpriteMapping
    global.SpriteMapping = {
      getAntSpritePath: () => 'Images/Ants/gray_ant.png'
    };
    
    // Mock EntityAccessor
    global.EntityAccessor = {
      getPosition: (entity) => {
        if (entity.model && entity.model.getPosition) {
          return entity.model.getPosition();
        }
        return { x: entity.x || 0, y: entity.y || 0 };
      }
    };
    window.EntityAccessor = global.EntityAccessor;
    
    // Mock MapManager
    global.g_activeMap = {
      renderConversion: {
        convPosToCanvas: (pos) => [pos[0], pos[1]]
      },
      getTileAtGridCoords: () => ({ type: 0, material: 'grass' })
    };
    
    global.TILE_SIZE = 32;
    global.Buildings = [];
    global.ants = [];
    global.antsUpdate = sandbox.stub();
    global.g_resourceList = {
      resources: [],
      updateAll: sandbox.stub()
    };
  });

  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
    delete global.Image;
  });

  describe('Complete Rendering Flow', function() {
    it('should create ants via AntFactory and render them through pipeline', function() {
      // Load modules IN CORRECT ORDER (base classes first) and assign to global
      global.EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      global.EntityView = require('../../../Classes/mvc/views/EntityView.js');
      global.EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      global.AntModel = require('../../../Classes/mvc/models/AntModel.js');
      global.AntView = require('../../../Classes/mvc/views/AntView.js');
      global.AntController = require('../../../Classes/mvc/controllers/AntController.js');
      
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const AntFactory = require('../../../Classes/mvc/factories/AntFactory.js');
      const EntityRenderer = require('../../../Classes/rendering/EntityLayerRenderer.js');
      const RenderManager = require('../../../Classes/rendering/RenderLayerManager.js');
      
      // STEP 1: Create EntityManager
      const entityManager = EntityManager.getInstance();
      window.entityManager = entityManager;
      global.entityManager = entityManager;
      
      console.log('Step 1: EntityManager created');
      
      // STEP 2: Create ants via AntFactory
      const ants = [];
      for (let i = 0; i < 5; i++) {
        const ant = AntFactory.create({
          jobName: 'Worker',
          x: i * 100,
          y: i * 100,
          faction: 'player'
        });
        ants.push(ant);
      }
      
      console.log(`Step 2: Created ${ants.length} ants via AntFactory`);
      console.log('First ant structure:', {
        hasModel: !!ants[0].model,
        hasView: !!ants[0].view,
        hasController: !!ants[0].controller,
        hasRenderMethod: typeof ants[0].render === 'function',
        hasUpdateMethod: typeof ants[0].update === 'function'
      });
      
      // STEP 3: Verify EntityManager registration
      const registeredAnts = entityManager.getByType('ant');
      console.log(`Step 3: EntityManager has ${registeredAnts.length} ants`);
      expect(registeredAnts.length).to.equal(5);
      
      // STEP 4: Verify ant structure
      const firstAnt = registeredAnts[0];
      expect(firstAnt.model).to.exist;
      expect(firstAnt.view).to.exist;
      expect(firstAnt.controller).to.exist;
      expect(firstAnt.render).to.be.a('function');
      console.log('Step 4: Ant structure validated');
      
      // STEP 5: Setup EntityRenderer (class instance)
      const EntityRendererClass = require('../../../Classes/rendering/EntityLayerRenderer.js');
      const entityRenderer = new EntityRendererClass();
      global.EntityRenderer = entityRenderer;
      global.window.EntityRenderer = entityRenderer;
      console.log('Step 5: EntityRenderer instance created');
      
      // STEP 6: Collect ants (manual collection for testing)
      window.GameState = { getState: () => 'PLAYING' };
      entityRenderer.collectAnts('PLAYING');
      console.log('Step 6: EntityRenderer.collectAnts() called');
      console.log('Render groups:', Object.keys(entityRenderer.renderGroups));
      console.log('ANTS group count:', entityRenderer.renderGroups.ANTS.length);
      
      // STEP 7: Verify ants are in render groups
      expect(entityRenderer.renderGroups.ANTS.length).to.be.at.least(5);
      console.log('Step 7: Ants collected into render groups');
      
      // STEP 8: Spy on render calls
      ants.forEach(ant => {
        if (ant.render) {
          sandbox.spy(ant, 'render');
        }
      });
      
      // STEP 9: Render entities manually (bypass RenderLayerManager for now)
      entityRenderer.renderAllLayers('PLAYING');
      console.log('Step 9: EntityRenderer.renderAllLayers() called');
      
      // STEP 10: Verify render was called on entities
      let renderCallCount = 0;
      ants.forEach(ant => {
        if (ant.render && ant.render.called) {
          renderCallCount++;
        }
      });
      
      console.log(`Step 10: ${renderCallCount} ants had render() called`);
      
      // CRITICAL: At least some ants should have been rendered
      expect(renderCallCount).to.be.at.least(1, 
        'At least one ant should have render() called through the pipeline');
      
      // STEP 11: Verify p5.js drawing functions were called
      const drawingCallsMade = {
        push: global.push.called,
        pop: global.pop.called,
        translate: global.translate.called,
        image: global.image.called,
        rect: global.rect.called,
        ellipse: global.ellipse.called
      };
      
      console.log('Step 11: p5.js drawing calls:', drawingCallsMade);
      
      // At minimum, push/pop should be called for camera transforms
      expect(global.push.called).to.be.true('push() should be called for rendering');
      expect(global.pop.called).to.be.true('pop() should be called for rendering');
    });

    it('should show exactly where rendering breaks', function() {
      // Load base classes first and assign to global
      global.EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      global.EntityView = require('../../../Classes/mvc/views/EntityView.js');
      global.EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      global.AntModel = require('../../../Classes/mvc/models/AntModel.js');
      global.AntView = require('../../../Classes/mvc/views/AntView.js');
      global.AntController = require('../../../Classes/mvc/controllers/AntController.js');
      
      // Load modules
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const AntFactory = require('../../../Classes/mvc/factories/AntFactory.js');
      const EntityRenderer = require('../../../Classes/rendering/EntityLayerRenderer.js');
      const RenderManager = require('../../../Classes/rendering/RenderLayerManager.js');
      
      // Create minimal setup
      const entityManager = EntityManager.getInstance();
      window.entityManager = entityManager;
      global.entityManager = entityManager;
      global.EntityRenderer = EntityRenderer;
      global.RenderManager = RenderManager;
      window.EntityRenderer = EntityRenderer;
      window.RenderManager = RenderManager;
      
      const ant = AntFactory.create({ jobName: 'Worker', x: 100, y: 100, faction: 'player' });
      
      // Track each step
      const steps = {
        antCreated: !!ant,
        antHasModel: !!ant.model,
        antHasView: !!ant.view,
        antHasController: !!ant.controller,
        antHasRender: typeof ant.render === 'function',
        antRegistered: entityManager.getCount('ant') > 0,
        entityRendererExists: !!global.EntityRenderer,
        renderManagerExists: !!global.RenderManager,
        canCollectAnts: false,
        antsInRenderGroup: false,
        renderCalled: false,
        viewRenderCalled: false
      };
      
      // Test collection
      const EntityRendererClass = require('../../../Classes/rendering/EntityLayerRenderer.js');
      const entityRenderer = new EntityRendererClass();
      global.EntityRenderer = entityRenderer;
      global.window.EntityRenderer = entityRenderer;
      
      if (entityRenderer) {
        entityRenderer.collectAnts('PLAYING');
        steps.canCollectAnts = true;
        steps.antsInRenderGroup = entityRenderer.renderGroups.ANTS.length > 0;
      }
      
      // Spy on render methods
      if (ant.render) sandbox.spy(ant, 'render');
      if (ant.view && ant.view.render) sandbox.spy(ant.view, 'render');
      
      // Test render pipeline
      if (entityRenderer) {
        window.GameState = { getState: () => 'PLAYING' };
        entityRenderer.renderAllLayers('PLAYING');
        
        steps.renderCalled = ant.render && ant.render.called;
        steps.viewRenderCalled = ant.view && ant.view.render && ant.view.render.called;
      }
      
      console.log('\n=== RENDERING PIPELINE DIAGNOSTIC ===');
      console.log('Step-by-step validation:');
      Object.entries(steps).forEach(([step, passed]) => {
        console.log(`  ${passed ? '✓' : '✗'} ${step}`);
      });
      console.log('=====================================\n');
      
      // Find first failure
      const failures = Object.entries(steps).filter(([_, passed]) => !passed);
      if (failures.length > 0) {
        const [firstFailure] = failures[0];
        throw new Error(`Rendering breaks at: ${firstFailure}. All steps: ${JSON.stringify(steps, null, 2)}`);
      }
      
      // All steps should pass
      Object.entries(steps).forEach(([step, passed]) => {
        expect(passed).to.be.true(`Step failed: ${step}`);
      });
    });
  });

  describe('EntityLayerRenderer Integration', function() {
    it('should call ant.render() when rendering ENTITIES layer', function() {
      // Load base classes first and assign to global
      global.EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      global.EntityView = require('../../../Classes/mvc/views/EntityView.js');
      global.EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      global.AntModel = require('../../../Classes/mvc/models/AntModel.js');
      global.AntView = require('../../../Classes/mvc/views/AntView.js');
      global.AntController = require('../../../Classes/mvc/controllers/AntController.js');
      
      // Load modules
      const EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
      const AntFactory = require('../../../Classes/mvc/factories/AntFactory.js');
      const EntityRendererClass = require('../../../Classes/rendering/EntityLayerRenderer.js');
      
      const entityManager = EntityManager.getInstance();
      window.entityManager = entityManager;
      global.entityManager = entityManager;
      
      const entityRenderer = new EntityRendererClass();
      global.EntityRenderer = entityRenderer;
      window.EntityRenderer = entityRenderer;
      
      const ant = AntFactory.create({ jobName: 'Worker', x: 100, y: 100, faction: 'player' });
      
      // Spy on render
      sandbox.spy(ant, 'render');
      
      // Initialize and render
      window.GameState = { getState: () => 'PLAYING' };
      
      // Render ENTITIES layer specifically
      entityRenderer.renderAllLayers('PLAYING');
      
      // Verify
      expect(ant.render.called).to.be.true('ant.render() should be called during ENTITIES layer rendering');
      
      if (ant.render.called) {
        console.log('✓ ant.render() was called successfully');
        console.log('  Call count:', ant.render.callCount);
      } else {
        console.log('✗ ant.render() was NOT called');
        console.log('  EntityManager ant count:', entityManager.getCount('ant'));
        console.log('  Render groups:', entityRenderer.renderGroups);
      }
    });
  });
});
