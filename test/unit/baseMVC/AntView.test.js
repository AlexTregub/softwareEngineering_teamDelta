/**
 * AntView.test.js
 * 
 * Unit tests for AntView - ant-specific rendering
 * Tests cover ALL ant visual elements: resource indicators, health bars,
 * job sprites, state indicators, coordinate conversions
 * 
 * TDD Implementation: Phase 2 - Ant MVC Conversion
 * Target: 40+ tests ensuring complete visual parity with ant class
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('AntView', function() {
  let AntModel, AntView, EntityView;
  let antModel, antView;
  let mockP5;
  
  before(function() {
    // Setup Node.js environment
    if (typeof window === 'undefined') {
      global.window = {};
    }
    
    // Load dependencies
    EntityView = require('../../../Classes/baseMVC/views/EntityView');
    AntModel = require('../../../Classes/baseMVC/models/AntModel');
    AntView = require('../../../Classes/baseMVC/views/AntView');
  });
  
  beforeEach(function() {
    // Mock p5.js global functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      noFill: sinon.stub(),
      rect: sinon.stub(),
      ellipse: sinon.stub(),
      image: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      translate: sinon.stub(),
      rotate: sinon.stub(),
      imageMode: sinon.stub(),
      noSmooth: sinon.stub(),
      noTint: sinon.stub(),
      tint: sinon.stub(),
      scale: sinon.stub()
    };
    
    // Global p5 functions
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.fill = mockP5.fill;
    global.stroke = mockP5.stroke;
    global.noStroke = mockP5.noStroke;
    global.noFill = mockP5.noFill;
    global.rect = mockP5.rect;
    global.ellipse = mockP5.ellipse;
    global.image = mockP5.image;
    global.text = mockP5.text;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.translate = mockP5.translate;
    global.rotate = mockP5.rotate;
    global.imageMode = mockP5.imageMode;
    global.noSmooth = mockP5.noSmooth;
    global.noTint = mockP5.noTint;
    global.tint = mockP5.tint;
    global.scale = mockP5.scale;
    
    // Constants
    global.CENTER = 'CENTER';
    global.CORNER = 'CORNER';
    
    // Sync with window
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.noStroke = global.noStroke;
    window.noFill = global.noFill;
    window.rect = global.rect;
    window.ellipse = global.ellipse;
    window.image = global.image;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.translate = global.translate;
    window.rotate = global.rotate;
    window.imageMode = global.imageMode;
    window.noSmooth = global.noSmooth;
    window.noTint = global.noTint;
    window.tint = global.tint;
    window.scale = global.scale;
    window.CENTER = global.CENTER;
    window.CORNER = global.CORNER;
    
    // Mock AntSprites for all tests (required by AntView constructor)
    const defaultMockSprite = { width: 32, height: 32, name: 'default' };
    global.AntSprites = {
      getSprite: sinon.stub().returns(defaultMockSprite)
    };
    window.AntSprites = global.AntSprites;
    
    // Mock camera for coordinate conversion
    const mockCamera = {
      worldToScreen: sinon.stub().callsFake((wx, wy) => ({ x: wx + 10, y: wy + 10 })),
      screenToWorld: sinon.stub().callsFake((sx, sy) => ({ x: sx - 10, y: sy - 10 })),
      getZoom: sinon.stub().returns(1.0)
    };
    
    // Create model and view with camera
    antModel = new AntModel(100, 100, 32, 32);
    antView = new AntView(antModel, { camera: mockCamera });
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.AntSprites;
    delete window.AntSprites;
  });
  
  describe('Constructor', function() {
    it('should extend EntityView', function() {
      expect(antView).to.be.an.instanceof(EntityView);
    });
    
    it('should store reference to AntModel', function() {
      expect(antView.model).to.equal(antModel);
    });
    
    it('should initialize with default sprite', function() {
      expect(antView.sprite).to.exist;
    });
  });
  
  describe('Sprite Loading', function() {
    let mockAntSprites;
    let mockScoutSprite, mockFarmerSprite, mockQueenSprite;
    
    beforeEach(function() {
      // Create mock sprite images
      mockScoutSprite = { width: 32, height: 32, name: 'scout' };
      mockFarmerSprite = { width: 32, height: 32, name: 'farmer' };
      mockQueenSprite = { width: 60, height: 60, name: 'queen' };
      
      // Mock AntSprites system
      mockAntSprites = {
        player: {
          Scout: mockScoutSprite,
          Farmer: mockFarmerSprite,
          Queen: mockQueenSprite
        },
        enemy: {
          Scout: mockScoutSprite
        },
        getSprite: sinon.stub().callsFake((job, faction) => {
          const factionSprites = mockAntSprites[faction] || mockAntSprites.player;
          return factionSprites[job];
        })
      };
      
      global.AntSprites = mockAntSprites;
      window.AntSprites = mockAntSprites;
    });
    
    afterEach(function() {
      delete global.AntSprites;
      delete window.AntSprites;
    });
    
    it('should load sprite on construction', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      expect(view.sprite).to.exist;
      expect(view.sprite.img).to.equal(mockScoutSprite);
    });
    
    it('should load correct sprite for job type', function() {
      const farmerModel = new AntModel(100, 100, 32, 32, { jobName: 'Farmer', faction: 'player' });
      const farmerView = new AntView(farmerModel);
      
      expect(farmerView.sprite.img).to.equal(mockFarmerSprite);
    });
    
    it('should load correct sprite for faction', function() {
      const enemyModel = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'enemy' });
      const enemyView = new AntView(enemyModel);
      
      expect(mockAntSprites.getSprite.calledWith('Scout', 'enemy')).to.be.true;
    });
    
    it('should call AntSprites.getSprite with job and faction', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Queen', faction: 'player' });
      const view = new AntView(model);
      
      expect(mockAntSprites.getSprite.calledOnce).to.be.true;
      expect(mockAntSprites.getSprite.firstCall.args[0]).to.equal('Queen');
      expect(mockAntSprites.getSprite.firstCall.args[1]).to.equal('player');
    });
    
    it('should wrap sprite image in object with img property', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      expect(view.sprite).to.be.an('object');
      expect(view.sprite).to.have.property('img');
      expect(view.sprite).to.have.property('width', 32);
      expect(view.sprite).to.have.property('height', 32);
    });
    
    it('should track last job name and faction', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      expect(view._lastJobName).to.equal('Scout');
      expect(view._lastFaction).to.equal('player');
    });
    
    it('should update sprite when job changes', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      // Change job
      model.setJobName('Farmer');
      
      // Update sprite
      view.updateSprite();
      
      expect(view.sprite.img).to.equal(mockFarmerSprite);
      expect(view._lastJobName).to.equal('Farmer');
    });
    
    it('should update sprite when faction changes', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      const initialSprite = view.sprite;
      
      // Change faction
      model._faction = 'enemy';
      
      // Update sprite
      view.updateSprite();
      
      expect(mockAntSprites.getSprite.calledWith('Scout', 'enemy')).to.be.true;
      expect(view._lastFaction).to.equal('enemy');
    });
    
    it('should not reload sprite if job and faction unchanged', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      const initialCallCount = mockAntSprites.getSprite.callCount;
      
      // Call updateSprite without changes
      view.updateSprite();
      
      expect(mockAntSprites.getSprite.callCount).to.equal(initialCallCount);
    });
  });
  
  describe('Resource Indicator', function() {
    it('should render resource count when ant carries resources', function() {
      // Set up resource manager with resources
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(5)
      };
      antModel.setResourceManager(mockResourceManager);
      
      antView.renderResourceIndicator();
      
      expect(mockP5.text.called).to.be.true;
      expect(mockP5.text.firstCall.args[0]).to.equal(5);
    });
    
    it('should not render indicator when no resources', function() {
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(0)
      };
      antModel.setResourceManager(mockResourceManager);
      
      antView.renderResourceIndicator();
      
      expect(mockP5.text.called).to.be.false;
    });
    
    it('should position indicator above ant sprite', function() {
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(3)
      };
      antModel.setResourceManager(mockResourceManager);
      
      antView.renderResourceIndicator();
      
      // Check Y coordinate is above ant (y - offset)
      const textY = mockP5.text.firstCall.args[2];
      expect(textY).to.be.below(antModel.getPosition().y);
    });
    
    it('should use yellow color for resource indicator', function() {
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(2)
      };
      antModel.setResourceManager(mockResourceManager);
      
      antView.renderResourceIndicator();
      
      expect(mockP5.fill.called).to.be.true;
      // Yellow: (255, 255, 0)
      expect(mockP5.fill.firstCall.args[0]).to.equal(255);
      expect(mockP5.fill.firstCall.args[1]).to.equal(255);
      expect(mockP5.fill.firstCall.args[2]).to.equal(0);
    });
    
    it('should center-align resource text', function() {
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(1)
      };
      antModel.setResourceManager(mockResourceManager);
      
      antView.renderResourceIndicator();
      
      expect(mockP5.textAlign.calledWith(CENTER)).to.be.true;
    });
    
    it('should handle terrain coordinate conversion', function() {
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(4)
      };
      antModel.setResourceManager(mockResourceManager);
      
      // Mock terrain system
      global.g_activeMap = {
        renderConversion: {
          convPosToCanvas: sinon.stub().returns([150, 150])
        }
      };
      global.TILE_SIZE = 32;
      
      antView.renderResourceIndicator();
      
      expect(mockP5.text.called).to.be.true;
      
      // Cleanup
      delete global.g_activeMap;
      delete global.TILE_SIZE;
    });
  });
  
  describe('Health Bar Rendering', function() {
    it('should render health bar when health controller exists', function() {
      const mockHealthController = {
        render: sinon.stub()
      };
      antModel._healthController = mockHealthController;
      
      antView.renderHealthBar();
      
      expect(mockHealthController.render.called).to.be.true;
    });
    
    it('should not error when health controller missing', function() {
      antModel._healthController = null;
      
      expect(() => antView.renderHealthBar()).to.not.throw();
    });
    
    it('should delegate health bar rendering to HealthController', function() {
      const mockHealthController = {
        render: sinon.stub()
      };
      antModel._healthController = mockHealthController;
      
      antView.renderHealthBar();
      
      // Should delegate to HealthController.render()
      expect(mockHealthController.render.called).to.be.true;
    });
    
    it('should pass model context to HealthController render', function() {
      antModel.setHealth(50);
      antModel.setMaxHealth(100);
      
      const mockHealthController = {
        render: sinon.stub()
      };
      antModel._healthController = mockHealthController;
      
      antView.renderHealthBar();
      
      // HealthController render should be called
      expect(mockHealthController.render.called).to.be.true;
    });
    
    it('should work with different health values', function() {
      const testCases = [
        { health: 90, maxHealth: 100 },
        { health: 50, maxHealth: 100 },
        { health: 20, maxHealth: 100 }
      ];
      
      testCases.forEach(({ health, maxHealth }) => {
        antModel.setHealth(health);
        antModel.setMaxHealth(maxHealth);
        
        const mockHealthController = {
          render: sinon.stub()
        };
        antModel._healthController = mockHealthController;
        
        antView.renderHealthBar();
        
        expect(mockHealthController.render.called).to.be.true;
      });
    });
  });
  
  describe('Box Hover State', function() {
    it('should render highlight when box is hovered', function() {
      antModel.setBoxHovered(true);
      
      antView.renderBoxHover();
      
      expect(mockP5.stroke.called).to.be.true;
      expect(mockP5.rect.called).to.be.true;
    });
    
    it('should not render when box not hovered', function() {
      antModel.setBoxHovered(false);
      
      antView.renderBoxHover();
      
      // No rendering calls if not hovered
      expect(mockP5.rect.called).to.be.false;
    });
    
    it('should use highlight color for box hover', function() {
      antModel.setBoxHovered(true);
      
      antView.renderBoxHover();
      
      // Should use stroke for border
      expect(mockP5.stroke.called).to.be.true;
    });
  });
  
  describe('Job-Specific Sprites', function() {
    it('should load Scout sprite', function() {
      antModel.setJobName('Scout');
      
      const sprite = antView.getJobSprite();
      
      expect(sprite).to.exist;
    });
    
    it('should load Farmer sprite', function() {
      antModel.setJobName('Farmer');
      
      const sprite = antView.getJobSprite();
      
      expect(sprite).to.exist;
    });
    
    it('should load Builder sprite', function() {
      antModel.setJobName('Builder');
      
      const sprite = antView.getJobSprite();
      
      expect(sprite).to.exist;
    });
    
    it('should load Soldier sprite', function() {
      antModel.setJobName('Soldier');
      
      const sprite = antView.getJobSprite();
      
      expect(sprite).to.exist;
    });
    
    it('should fall back to default sprite for unknown job', function() {
      antModel.setJobName('UnknownJob');
      
      const sprite = antView.getJobSprite();
      
      expect(sprite).to.exist;
    });
    
    it('should cache sprites for performance', function() {
      antModel.setJobName('Scout');
      
      const sprite1 = antView.getJobSprite();
      const sprite2 = antView.getJobSprite();
      
      expect(sprite1).to.equal(sprite2);
    });
  });
  
  describe('Complete Render Method', function() {
    it('should call base EntityView render', function() {
      const renderSpy = sinon.spy(EntityView.prototype, 'render');
      
      antView.render();
      
      expect(renderSpy.called).to.be.true;
      
      renderSpy.restore();
    });
    
    it('should render all ant-specific elements', function() {
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(2)
      };
      antModel.setResourceManager(mockResourceManager);
      antModel.setBoxHovered(true);
      
      antView.render();
      
      // Should have multiple render calls (push/pop for isolation)
      expect(mockP5.push.called).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });
    
    it('should not render when model is inactive', function() {
      antModel.setActive(false);
      
      antView.render();
      
      // No rendering should occur
      expect(mockP5.image.called).to.be.false;
    });
    
    it('should render in correct order', function() {
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(1)
      };
      antModel.setResourceManager(mockResourceManager);
      
      antView.render();
      
      // push should be called before rendering
      expect(mockP5.push.calledBefore(mockP5.image)).to.be.true;
      // pop should be called after rendering
      expect(mockP5.pop.called).to.be.true;
    });
  });
  
  describe('Coordinate Conversion', function() {
    it('should convert world to screen coordinates', function() {
      const worldPos = { x: 100, y: 100 };
      
      const screenPos = antView.worldToScreen(worldPos.x, worldPos.y);
      
      expect(screenPos).to.have.property('x');
      expect(screenPos).to.have.property('y');
    });
    
    it('should convert screen to world coordinates', function() {
      const screenPos = { x: 200, y: 200 };
      
      const worldPos = antView.screenToWorld(screenPos.x, screenPos.y);
      
      expect(worldPos).to.have.property('x');
      expect(worldPos).to.have.property('y');
    });
    
    it('should handle terrain coordinate system', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convPosToCanvas: sinon.stub().returns([250, 250]),
          convCanvasToPos: sinon.stub().returns([7.8125, 7.8125])
        }
      };
      
      const screenPos = antView.worldToScreen(100, 100);
      
      expect(screenPos.x).to.be.a('number');
      expect(screenPos.y).to.be.a('number');
      
      // Cleanup
      delete global.TILE_SIZE;
      delete global.g_activeMap;
    });
  });
  
  describe('State Indicators', function() {
    it('should show gathering indicator when gathering', function() {
      const mockStateMachine = {
        getCurrentState: sinon.stub().returns('gathering')
      };
      antModel.setStateMachine(mockStateMachine);
      
      const indicator = antView.getStateIndicator();
      
      expect(indicator).to.include('gathering');
    });
    
    it('should show combat indicator when in combat', function() {
      const mockStateMachine = {
        getCurrentState: sinon.stub().returns('combat')
      };
      antModel.setStateMachine(mockStateMachine);
      
      const indicator = antView.getStateIndicator();
      
      expect(indicator).to.include('combat');
    });
    
    it('should show idle indicator when idle', function() {
      const mockStateMachine = {
        getCurrentState: sinon.stub().returns('idle')
      };
      antModel.setStateMachine(mockStateMachine);
      
      const indicator = antView.getStateIndicator();
      
      expect(indicator).to.include('idle');
    });
  });
  
  describe('Integration with EntityView', function() {
    it('should inherit render method from EntityView', function() {
      expect(antView.render).to.be.a('function');
    });
    
    it('should have model reference from EntityView', function() {
      expect(antView.model).to.equal(antModel);
    });
    
    it('should override render method with ant-specific logic', function() {
      expect(antView.render).to.not.equal(EntityView.prototype.render);
    });
  });
  
  describe('Render Method with Sprites', function() {
    let mockAntSprites;
    let mockScoutSprite;
    
    beforeEach(function() {
      // Create mock sprite image
      mockScoutSprite = { width: 32, height: 32, name: 'scout' };
      
      // Mock AntSprites system
      mockAntSprites = {
        getSprite: sinon.stub().returns(mockScoutSprite)
      };
      
      global.AntSprites = mockAntSprites;
      window.AntSprites = mockAntSprites;
      
      // Mock noTint for opacity tests
      global.noTint = sinon.stub();
      global.tint = sinon.stub();
      window.noTint = global.noTint;
      window.tint = global.tint;
    });
    
    afterEach(function() {
      delete global.AntSprites;
      delete window.AntSprites;
      delete global.noTint;
      delete global.tint;
      delete window.noTint;
      delete window.tint;
    });
    
    it('should call updateSprite during render', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      const updateSpriteSpy = sinon.spy(view, 'updateSprite');
      
      view.render();
      
      expect(updateSpriteSpy.calledOnce).to.be.true;
    });
    
    it('should pass sprite to parent EntityView render', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      view.render();
      
      // Verify EntityView render was called (via push/pop and image)
      expect(mockP5.push.called).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });
    
    it('should have sprite.img property set after construction', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      expect(view.sprite).to.exist;
      expect(view.sprite.img).to.equal(mockScoutSprite);
    });
    
    it('should store sprite for rendering (subclass responsibility)', function() {
      // NOTE: EntityView.render() is now a stub - AntView manages its own sprite rendering
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      // AntView should have sprite reference for its own rendering logic
      expect(view.sprite).to.exist;
      expect(view.sprite.img).to.equal(mockScoutSprite);
    });
    
    it('should update sprite when job changes before render', function() {
      const mockFarmerSprite = { width: 32, height: 32, name: 'farmer' };
      mockAntSprites.getSprite.onSecondCall().returns(mockFarmerSprite);
      
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      // Change job
      model.setJobName('Farmer');
      
      // Render should update sprite
      view.render();
      
      expect(view.sprite.img).to.equal(mockFarmerSprite);
    });
    
    it('should not render if model is inactive', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', faction: 'player' });
      const view = new AntView(model);
      
      // Deactivate model
      model._isActive = false;
      
      view.render();
      
      // Should not call rendering functions
      expect(mockP5.push.called).to.be.false;
      expect(mockP5.image.called).to.be.false;
    });
  });
});
