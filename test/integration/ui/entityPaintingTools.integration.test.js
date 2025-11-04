/**
 * Integration Tests: Entity Painting & Toolbar Tools
 * 
 * Tests the integration of EntitySelectionTool, EntityPainter, ToolBar,
 * and mode toggle systems working together.
 */

const { expect } = require('chai');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');
const sinon = require('sinon');

// Mock global constants
global.TILE_SIZE = 32;

setupTestEnvironment({ rendering: true });

describe('Entity Painting Tools - Integration', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let EntitySelectionTool, EntityPainter, ToolBar, ToolModeToggle;
  let entityPainter, entitySelectionTool, toolbar, mockP5, mockTerrain, mockEvents;
  
  beforeEach(function() {
    // Mock console methods
    if (!global.console.warn) global.console.warn = sinon.stub();
    if (!global.console.error) global.console.error = sinon.stub();
    if (!global.console.log) global.console.log = sinon.stub();
    
    // Mock p5.js functions
    mockP5 = {
      fill: sinon.stub(),
      noFill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      strokeWeight: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      createVector: sinon.stub().callsFake((x, y) => ({ x, y }))
    };
    
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      if (typeof window !== 'undefined') window[key] = mockP5[key];
    });
    
    // Mock terrain
    mockTerrain = {
      getTileAtGridCoords: sinon.stub().returns({ type: 0 }),
      setTileAtGridCoords: sinon.stub()
    };
    
    // Mock events array
    mockEvents = [];
    
    // Load classes
    try {
      EntitySelectionTool = require('../../../Classes/ui/painter/entity/EntitySelectionTool');
      EntityPainter = require('../../../Classes/ui/painter/entity/EntityPainter');
      ToolBar = require('../../../Classes/ui/_baseObjects/bar/toolBar/ToolBar');
      ToolModeToggle = require('../../../Classes/ui/_baseObjects/bar/toolBar/ToolModeToggle');
    } catch (e) {
      console.error('Failed to load classes:', e);
    }
    
    // Create EntityPainter with terrain and events
    if (EntityPainter) {
      entityPainter = new EntityPainter(null, mockTerrain, mockEvents);
    }
    
    // Create EntitySelectionTool with painter's entities
    if (EntitySelectionTool && entityPainter) {
      entitySelectionTool = new EntitySelectionTool(
        entityPainter.placedEntities,
        mockEvents
      );
    }
    
    // Create ToolBar with modes
    if (ToolBar) {
      toolbar = new ToolBar([
        { name: 'paint', id: 'paint', icon: 'ðŸ–Œï¸', tooltip: 'Paint' },
        { 
          name: 'eraser', 
          id: 'eraser', 
          icon: 'ðŸ§±', 
          tooltip: 'Eraser',
          hasModes: true,
          modes: ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']
        },
        { 
          name: 'select', 
          id: 'select', 
          icon: 'â¬š', 
          tooltip: 'Select',
          hasModes: true,
          modes: ['PAINT', 'ENTITY', 'EVENT']
        }
      ]);
    }
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('EntitySelectionTool + EntityPainter Integration', function() {
    it('should select and delete entities from EntityPainter', function() {
      if (!EntitySelectionTool || !EntityPainter) {
        this.skip();
      }
      
      // Add entities to painter
      entityPainter.placedEntities.push(
        { 
          x: 64, y: 64, w: 32, h: 32, type: 'Ant',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        },
        { 
          x: 128, y: 128, w: 32, h: 32, type: 'Resource',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        }
      );
      
      // Set to ENTITY mode
      entitySelectionTool.setMode('ENTITY');
      
      // Select entities with box
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      entitySelectionTool.handleMouseReleased(150, 150);
      
      // Verify selection
      const selected = entitySelectionTool.getSelectedEntities();
      expect(selected.length).to.be.greaterThan(0);
      
      // Delete selected entities
      entitySelectionTool.deleteSelectedEntities();
      
      // Verify deletion from painter's array
      expect(entityPainter.placedEntities.length).to.be.lessThan(2);
    });
    
    it('should only delete entities in ENTITY mode, not events', function() {
      if (!EntitySelectionTool || !EntityPainter) {
        this.skip();
      }
      
      // Add entities and events
      entityPainter.placedEntities.push(
        { 
          x: 64, y: 64, w: 32, h: 32, type: 'Ant',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        }
      );
      
      mockEvents.push(
        { 
          x: 96, y: 96, w: 32, h: 32, eventType: 'spawn',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        }
      );
      
      const initialEventCount = mockEvents.length;
      
      // Set to ENTITY mode
      entitySelectionTool.setMode('ENTITY');
      
      // Select and delete
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      entitySelectionTool.handleMouseReleased(150, 150);
      entitySelectionTool.deleteSelectedEntities();
      
      // Entities deleted, events intact
      expect(entityPainter.placedEntities.length).to.equal(0);
      expect(mockEvents.length).to.equal(initialEventCount);
    });
    
    it('should only delete events in EVENT mode, not entities', function() {
      if (!EntitySelectionTool || !EntityPainter) {
        this.skip();
      }
      
      // Add entities and events
      entityPainter.placedEntities.push(
        { 
          x: 64, y: 64, w: 32, h: 32, type: 'Ant',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        }
      );
      
      mockEvents.push(
        { 
          x: 96, y: 96, w: 32, h: 32, eventType: 'spawn',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        }
      );
      
      const initialEntityCount = entityPainter.placedEntities.length;
      
      // Set to EVENT mode
      entitySelectionTool.setMode('EVENT');
      
      // Select and delete
      entitySelectionTool.handleMousePressed(80, 80);
      entitySelectionTool.handleMouseDragged(180, 180);
      entitySelectionTool.handleMouseReleased(180, 180);
      entitySelectionTool.deleteSelectedEntities();
      
      // Events deleted, entities intact
      expect(mockEvents.length).to.equal(0);
      expect(entityPainter.placedEntities.length).to.equal(initialEntityCount);
    });
  });
  
  describe('EntityPainter Eraser Modes Integration', function() {
    it('should erase only entities in ENTITY mode', function() {
      if (!EntityPainter) {
        this.skip();
      }
      
      // Add entities
      entityPainter.placedEntities.push(
        { 
          x: 64, y: 64, w: 32, h: 32, type: 'Ant',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        }
      );
      
      // Set eraser mode to ENTITY
      entityPainter.setEraserMode('ENTITY');
      
      // Erase at grid position (2, 2) -> world coords (64, 64)
      entityPainter.handleErase(2, 2);
      
      // Entity removed
      expect(entityPainter.placedEntities.length).to.equal(0);
      
      // Terrain not modified (no call to setTileAtGridCoords)
      expect(mockTerrain.setTileAtGridCoords.called).to.be.false;
    });
    
    it('should erase only terrain in TERRAIN mode', function() {
      if (!EntityPainter) {
        this.skip();
      }
      
      // Add entities
      entityPainter.placedEntities.push(
        { 
          x: 64, y: 64, w: 32, h: 32, type: 'Ant',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        }
      );
      
      const initialEntityCount = entityPainter.placedEntities.length;
      
      // Setup terrain grid with a tile
      mockTerrain.grid = new Map();
      mockTerrain.grid.set('2,2', { type: 'STONE' });
      
      // Set eraser mode to TERRAIN
      entityPainter.setEraserMode('TERRAIN');
      
      // Erase at grid position
      entityPainter.handleErase(2, 2);
      
      // Terrain modified (tile type changed to GRASS)
      const tile = mockTerrain.grid.get('2,2');
      expect(tile.type).to.equal('GRASS');
      
      // Entities not removed
      expect(entityPainter.placedEntities.length).to.equal(initialEntityCount);
    });
    
    it('should erase all layers in ALL mode', function() {
      if (!EntityPainter) {
        this.skip();
      }
      
      // Add entities and events at grid position (2, 2) -> world coords (64, 64)
      entityPainter.placedEntities.push(
        { 
          x: 64, y: 64, w: 32, h: 32, type: 'Ant',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        }
      );
      
      mockEvents.push(
        { 
          x: 64, y: 64, w: 32, h: 32, eventType: 'spawn',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; },
          gridX: 2,
          gridY: 2
        }
      );
      
      // Setup terrain grid with a tile
      mockTerrain.grid = new Map();
      mockTerrain.grid.set('2,2', { type: 'STONE' });
      
      // Set eraser mode to ALL
      entityPainter.setEraserMode('ALL');
      
      // Erase at grid position
      entityPainter.handleErase(2, 2);
      
      // All layers affected
      expect(entityPainter.placedEntities.length).to.equal(0);
      expect(mockEvents.length).to.equal(0);
      
      // Terrain modified
      const tile = mockTerrain.grid.get('2,2');
      expect(tile.type).to.equal('GRASS');
    });
  });
  
  describe('ToolBar + Mode System Integration', function() {
    it('should provide mode data for FileMenuBar rendering', function() {
      if (!ToolBar) {
        this.skip();
      }
      
      // Select tool with modes
      toolbar.selectTool('eraser');
      
      // Get render data
      const renderData = toolbar.getModeRenderData();
      
      expect(renderData).to.exist;
      expect(renderData.hasModes).to.be.true;
      expect(renderData.modes).to.deep.equal(['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']);
      expect(renderData.currentMode).to.equal('ALL'); // Default
    });
    
    it('should update mode when setToolMode called', function() {
      if (!ToolBar) {
        this.skip();
      }
      
      toolbar.selectTool('eraser');
      toolbar.setToolMode('ENTITY');
      
      const renderData = toolbar.getModeRenderData();
      expect(renderData.currentMode).to.equal('ENTITY');
    });
    
    it('should persist mode when switching tools', function() {
      if (!ToolBar) {
        this.skip();
      }
      
      // Set eraser to TERRAIN mode
      toolbar.selectTool('eraser');
      toolbar.setToolMode('TERRAIN');
      
      // Switch to paint tool
      toolbar.selectTool('paint');
      
      // Switch back to eraser
      toolbar.selectTool('eraser');
      
      // Mode should be persisted
      expect(toolbar.getCurrentMode()).to.equal('TERRAIN');
    });
    
    it('should handle selection tool with PAINT/ENTITY/EVENT modes', function() {
      if (!ToolBar) {
        this.skip();
      }
      
      toolbar.selectTool('select');
      
      const renderData = toolbar.getModeRenderData();
      expect(renderData.modes).to.deep.equal(['PAINT', 'ENTITY', 'EVENT']);
      expect(renderData.currentMode).to.equal('PAINT'); // Default
    });
  });
  
  describe('ToolModeToggle Integration', function() {
    it('should create mode toggle for eraser tool', function() {
      if (!ToolModeToggle) {
        this.skip();
      }
      
      const modeToggle = new ToolModeToggle(
        200,  // x
        10,   // y
        ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS'],  // modes
        (newMode) => {
          // Callback
        }
      );
      
      expect(modeToggle.getCurrentMode()).to.equal('ALL');
      expect(modeToggle.modes).to.deep.equal(['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']);
    });
    
    it('should trigger callback on mode change', function() {
      if (!ToolModeToggle) {
        this.skip();
      }
      
      const callback = sinon.stub();
      const modeToggle = new ToolModeToggle(
        200,  // x
        10,   // y
        ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS'],  // modes
        callback  // onModeChange
      );
      
      modeToggle.setMode('ENTITY');
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.equal('ENTITY');
    });
  });
  
  describe('Multiple Entities Selection and Deletion', function() {
    it('should select multiple entities with box selection', function() {
      if (!EntitySelectionTool || !EntityPainter) {
        this.skip();
      }
      
      // Add 5 entities in a grid
      for (let i = 0; i < 5; i++) {
        entityPainter.placedEntities.push({
          x: 64 + (i * 32),
          y: 64 + (i * 32),
          w: 32,
          h: 32,
          type: 'Ant',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        });
      }
      
      // Set to ENTITY mode
      entitySelectionTool.setMode('ENTITY');
      
      // Large selection box
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(300, 300);
      entitySelectionTool.handleMouseReleased(300, 300);
      
      // All 5 entities selected
      const selected = entitySelectionTool.getSelectedEntities();
      expect(selected.length).to.equal(5);
    });
    
    it('should delete all selected entities at once', function() {
      if (!EntitySelectionTool || !EntityPainter) {
        this.skip();
      }
      
      // Add 3 entities
      for (let i = 0; i < 3; i++) {
        entityPainter.placedEntities.push({
          x: 64 + (i * 32),
          y: 64,
          w: 32,
          h: 32,
          type: 'Ant',
          getPosition: function() { return { x: this.x, y: this.y }; },
          getSize: function() { return { x: this.w, y: this.h }; }
        });
      }
      
      // Set to ENTITY mode
      entitySelectionTool.setMode('ENTITY');
      
      // Select all
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(200, 100);
      entitySelectionTool.handleMouseReleased(200, 100);
      
      // Delete all selected
      entitySelectionTool.deleteSelectedEntities();
      
      // All entities removed
      expect(entityPainter.placedEntities.length).to.equal(0);
    });
  });
  
  describe('Mode Switching Workflow', function() {
    it('should clear selection when switching from ENTITY to EVENT mode', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }
      
      // Add entities and events
      entityPainter.placedEntities.push({
        x: 64, y: 64, w: 32, h: 32, type: 'Ant',
        getPosition: function() { return { x: this.x, y: this.y }; },
        getSize: function() { return { x: this.w, y: this.h }; }
      });
      
      // Select entity
      entitySelectionTool.setMode('ENTITY');
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(100, 100);
      entitySelectionTool.handleMouseReleased(100, 100);
      
      expect(entitySelectionTool.getSelectedEntities().length).to.be.greaterThan(0);
      
      // Switch to EVENT mode
      entitySelectionTool.setMode('EVENT');
      
      // Selection cleared
      expect(entitySelectionTool.getSelectedEntities().length).to.equal(0);
    });
    
    it('should not select in PAINT mode', function() {
      if (!EntitySelectionTool) {
        this.skip();
      }
      
      // Add entities
      entityPainter.placedEntities.push({
        x: 64, y: 64, w: 32, h: 32, type: 'Ant',
        getPosition: function() { return { x: this.x, y: this.y }; },
        getSize: function() { return { x: this.w, y: this.h }; }
      });
      
      // Set to PAINT mode
      entitySelectionTool.setMode('PAINT');
      
      // Try to select
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(100, 100);
      entitySelectionTool.handleMouseReleased(100, 100);
      
      // No selection made
      expect(entitySelectionTool.getSelectedEntities().length).to.equal(0);
      expect(entitySelectionTool.isSelecting).to.be.false;
    });
  });
});
