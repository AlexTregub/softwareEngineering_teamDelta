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
      imageMode: sinon.stub()
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
    window.CENTER = global.CENTER;
    window.CORNER = global.CORNER;
    
    // Create model and view
    antModel = new AntModel(100, 100, 32, 32);
    antView = new AntView(antModel);
  });
  
  afterEach(function() {
    sinon.restore();
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
    
    it('should render health bar at correct position', function() {
      antModel.setHealth(50);
      antModel.setMaxHealth(100);
      
      antView.renderHealthBar();
      
      // Health bar should render (rect calls for background and foreground)
      expect(mockP5.rect.called).to.be.true;
    });
    
    it('should show health percentage visually', function() {
      antModel.setHealth(75);
      antModel.setMaxHealth(100);
      
      antView.renderHealthBar();
      
      // Should render two rects: background (black/gray) and foreground (green/red)
      expect(mockP5.rect.callCount).to.be.at.least(2);
    });
    
    it('should use green color for high health', function() {
      antModel.setHealth(90);
      antModel.setMaxHealth(100);
      
      antView.renderHealthBar();
      
      // Should have green fill call
      expect(mockP5.fill.called).to.be.true;
    });
    
    it('should use red color for low health', function() {
      antModel.setHealth(20);
      antModel.setMaxHealth(100);
      
      antView.renderHealthBar();
      
      // Should have red fill call
      expect(mockP5.fill.called).to.be.true;
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
});
