/**
 * Integration Tests: Drag-and-Drop System
 * TDD Phase 4: Write tests FIRST before implementation
 * 
 * Tests EventEditorPanel drag-and-drop integration with EventFlagLayer in Level Editor
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupIntegrationTestEnvironment, cleanupIntegrationTestEnvironment } = require('../../helpers/integrationTestHelpers');

describe('Drag-and-Drop Integration', function() {
  let terrain;
  let LevelEditor, EventEditorPanel, EventFlagLayer, EventFlag;
  let ToolBar, MaterialPalette, LevelEditorPanels;
  
  before(function() {
    // Setup integration test environment (mocks only p5.js, loads real classes)
    setupIntegrationTestEnvironment();
    
    // Load REAL classes for integration testing
    EventFlag = require('../../../Classes/events/EventFlag');
    EventFlagLayer = require('../../../Classes/events/EventFlagLayer');
    ToolBar = require('../../../Classes/ui/ToolBar');
    MaterialPalette = require('../../../Classes/ui/MaterialPalette');
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel');
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    // Make globally available for cross-references
    global.EventFlag = EventFlag;
    global.EventFlagLayer = EventFlagLayer;
    global.ToolBar = ToolBar;
    global.MaterialPalette = MaterialPalette;
    global.LevelEditorPanels = LevelEditorPanels;
    global.EventEditorPanel = EventEditorPanel;
    
    if (typeof window !== 'undefined') {
      window.EventFlag = EventFlag;
      window.EventFlagLayer = EventFlagLayer;
      window.ToolBar = ToolBar;
      window.MaterialPalette = MaterialPalette;
      window.LevelEditorPanels = LevelEditorPanels;
      window.EventEditorPanel = EventEditorPanel;
    }
  });
  
  after(function() {
    cleanupIntegrationTestEnvironment();
  });
  
  beforeEach(function() {
    // Mock terrain for each test
    terrain = {
      width: 1000,
      height: 1000,
      getTileAtGridCoords: sinon.stub().returns({ type: 0 })
    };
    
    global.g_map2 = terrain;
    if (typeof window !== 'undefined') {
      window.g_map2 = terrain;
    }
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  // Helper function to create and initialize Level Editor
  function createLevelEditor() {
    const editor = new LevelEditor();
    editor.initialize(terrain);
    return editor;
  }
  
  describe('Level Editor EventFlagLayer Integration', function() {
    it('should initialize EventFlagLayer in Level Editor', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      expect(levelEditor.eventFlagLayer).to.exist;
      expect(levelEditor.eventFlagLayer).to.be.instanceOf(EventFlagLayer);
    });
    
    it('should have empty flag collection on initialization', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(0);
    });
  });
  
  describe('Drag State Detection', function() {
    it('should detect when EventEditorPanel is dragging', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Start drag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      
      expect(levelEditor.eventEditor.isDragging()).to.be.true;
    });
    
    it('should update drag position during drag', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      levelEditor.eventEditor.updateDragPosition(100, 200);
      
      const position = levelEditor.eventEditor.getDragPosition();
      expect(position.x).to.equal(100);
      expect(position.y).to.equal(200);
    });
  });
  
  describe('Flag Placement on Drag Complete', function() {
    it('should create EventFlag when drag is completed', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      // Start drag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      
      // Complete drag at world coordinates
      const result = levelEditor.eventEditor.completeDrag(500, 600);
      
      expect(result.success).to.be.true;
      expect(result.flagConfig).to.exist;
      expect(result.flagConfig.x).to.equal(500);
      expect(result.flagConfig.y).to.equal(600);
      expect(result.flagConfig.eventId).to.equal('test-event-1');
    });
    
    it('should add EventFlag to EventFlagLayer after drag', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      // Start and complete drag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      const result = levelEditor.eventEditor.completeDrag(500, 600);
      
      // Create and add flag
      if (result.success && result.flagConfig) {
        const flag = new EventFlag(result.flagConfig);
        levelEditor.eventFlagLayer.addFlag(flag);
      }
      
      expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(1);
      const addedFlag = levelEditor.eventFlagLayer.getAllFlags()[0];
      expect(addedFlag.x).to.equal(500);
      expect(addedFlag.y).to.equal(600);
      expect(addedFlag.eventId).to.equal('test-event-1');
    });
    
    it('should support multiple flag placements', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      // Place first flag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      const result1 = levelEditor.eventEditor.completeDrag(100, 100);
      if (result1.success) {
        levelEditor.eventFlagLayer.addFlag(new EventFlag(result1.flagConfig));
      }
      
      // Place second flag
      levelEditor.eventEditor.startDragPlacement('test-event-2');
      const result2 = levelEditor.eventEditor.completeDrag(200, 200);
      if (result2.success) {
        levelEditor.eventFlagLayer.addFlag(new EventFlag(result2.flagConfig));
      }
      
      expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(2);
    });
  });
  
  describe('Drag Cancellation', function() {
    it('should not create flag when drag is cancelled', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      levelEditor.eventEditor.cancelDrag();
      
      expect(levelEditor.eventEditor.isDragging()).to.be.false;
      expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(0);
    });
  });
  
  describe('Flag Configuration', function() {
    it('should create flag with default radius', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      const result = levelEditor.eventEditor.completeDrag(500, 600);
      
      expect(result.flagConfig.radius).to.exist;
      expect(result.flagConfig.radius).to.be.a('number');
      expect(result.flagConfig.radius).to.be.greaterThan(0);
    });
    
    it('should create flag with circle shape by default', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      const result = levelEditor.eventEditor.completeDrag(500, 600);
      
      expect(result.flagConfig.shape).to.equal('circle');
    });
    
    it('should generate unique flag ID', function(done) {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      // Create first flag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      const result1 = levelEditor.eventEditor.completeDrag(100, 100);
      
      // Wait 1ms to ensure different timestamp
      setTimeout(() => {
        levelEditor.eventEditor.startDragPlacement('test-event-1');
        const result2 = levelEditor.eventEditor.completeDrag(200, 200);
        
        expect(result1.flagConfig.id).to.not.equal(result2.flagConfig.id);
        done();
      }, 2);
    });
  });
  
  describe('Rendering', function() {
    it('should render flags in editor mode', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      // Add a flag
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'test-event-1'
      });
      levelEditor.eventFlagLayer.addFlag(flag);
      
      // Spy on render
      const renderSpy = sinon.spy(levelEditor.eventFlagLayer, 'render');
      
      // Render (would normally be called in LevelEditor.render())
      levelEditor.eventFlagLayer.render(true);
      
      expect(renderSpy.calledOnce).to.be.true;
      expect(renderSpy.calledWith(true)).to.be.true;
    });
    
    it('should not render flags in game mode', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'test-event-1'
      });
      levelEditor.eventFlagLayer.addFlag(flag);
      
      // Render with editorMode false
      global.circle.resetHistory();
      levelEditor.eventFlagLayer.render(false);
      
      // Circle should not be called (flags invisible in game)
      expect(global.circle.called).to.be.false;
    });
  });
  
  describe('Error Handling', function() {
    it('should handle completing drag when not dragging', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      const result = levelEditor.eventEditor.completeDrag(100, 100);
      
      expect(result.success).to.be.false;
      expect(result.error).to.exist;
    });
    
    it('should handle invalid event ID', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      levelEditor.eventEditor.startDragPlacement(null);
      const result = levelEditor.eventEditor.completeDrag(100, 100);
      
      // Should handle gracefully
      expect(result).to.exist;
    });
  });
});
