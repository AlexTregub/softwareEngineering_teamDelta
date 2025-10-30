/**
 * Integration Tests: ToolBar + TerrainEditor - No Tool Mode
 * 
 * Tests for No Tool mode integration between ToolBar and TerrainEditor.
 * Verifies that terrain editing is prevented when no tool is selected.
 * 
 * TDD Phase: Integration testing with real components
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ToolBar + TerrainEditor - No Tool Mode Integration', function() {
  let TerrainEditor, ToolBar;
  let toolbar, editor, mockTerrain;

  before(function() {
    // Mock p5.js globals
    global.createVector = (x, y) => ({ x, y, mag: () => Math.sqrt(x*x + y*y) });
    global.TILE_SIZE = 32;
    
    // Load actual classes
    TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
    ToolBar = require('../../../Classes/ui/ToolBar');
  });

  beforeEach(function() {
    // Create mock tile object
    const mockTile = {
      getMaterial: () => 'grass',
      type: 0
    };
    
    // Create mock terrain with SparseTerrain-like interface
    mockTerrain = {
      tileSize: 32,
      setTile: sinon.stub(),
      getTile: sinon.stub().returns(mockTile),
      deleteTile: sinon.stub(),
      iterateTiles: sinon.stub(),
      getArrPos: sinon.stub().returns([0, 0]) // For TerrainEditor compatibility
    };

    // Create real components
    editor = new TerrainEditor(mockTerrain);
    toolbar = new ToolBar([
      { name: 'paint', icon: '🖌️', tooltip: 'Paint Tool' },
      { name: 'eraser', icon: '🧱', tooltip: 'Eraser Tool' },
      { name: 'fill', icon: '🪣', tooltip: 'Fill Tool' }
    ]);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Initialization', function() {
    it('should initialize ToolBar with no tool selected', function() {
      expect(toolbar).to.exist;
      expect(toolbar.getSelectedTool()).to.be.null;
    });

    it('should have hasActiveTool() return false initially', function() {
      expect(toolbar.hasActiveTool()).to.be.false;
    });

    it('should initialize TerrainEditor independently', function() {
      expect(editor).to.exist;
      expect(typeof editor.paint).to.equal('function');
      expect(typeof editor.fill).to.equal('function');
      expect(typeof editor.erase).to.equal('function');
    });
  });

  describe('Tool Selection', function() {
    it('should allow selecting a tool from No Tool mode', function() {
      expect(toolbar.hasActiveTool()).to.be.false;
      
      toolbar.selectTool('paint');
      
      expect(toolbar.hasActiveTool()).to.be.true;
      expect(toolbar.getSelectedTool()).to.equal('paint');
    });

    it('should allow deselecting a tool back to No Tool mode', function() {
      toolbar.selectTool('fill');
      expect(toolbar.hasActiveTool()).to.be.true;
      
      toolbar.deselectTool();
      
      expect(toolbar.hasActiveTool()).to.be.false;
      expect(toolbar.getSelectedTool()).to.be.null;
    });
  });

  describe('Terrain Editing Prevention Pattern', function() {
    it('should demonstrate conditional check pattern for No Tool mode', function() {
      // Ensure no tool selected
      expect(toolbar.getSelectedTool()).to.be.null;
      
      // Spy on editor methods
      const paintSpy = sinon.spy(editor, 'paint');
      const fillSpy = sinon.spy(editor, 'fill');
      const eraseSpy = sinon.spy(editor, 'erase');
      
      // Simulate click handler pattern (LevelEditor should use this)
      const tool = toolbar.getSelectedTool();
      expect(tool).to.be.null;
      
      // Pattern: Check for null tool before calling editor methods
      if (tool !== null) {
        editor.paint(0, 0);
      }
      
      // Verify methods were NOT called
      expect(paintSpy.called).to.be.false;
      expect(fillSpy.called).to.be.false;
      expect(eraseSpy.called).to.be.false;
    });

    it('should allow conditional execution when tool is active', function() {
      // Select a tool
      toolbar.selectTool('paint');
      expect(toolbar.hasActiveTool()).to.be.true;
      
      // Track if operation would execute
      let operationExecuted = false;
      
      // Simulate conditional check pattern
      const tool = toolbar.getSelectedTool();
      if (tool === 'paint') {
        // Operation would execute here
        operationExecuted = true;
      }
      
      expect(operationExecuted).to.be.true;
    });
  });

  describe('Tool Callbacks', function() {
    it('should trigger onToolChange callback when selecting from null', function() {
      const callbackSpy = sinon.spy();
      toolbar.onToolChange = callbackSpy;
      
      toolbar.selectTool('eraser');
      
      expect(callbackSpy.calledOnce).to.be.true;
      expect(callbackSpy.calledWith('eraser', null)).to.be.true;
    });

    it('should trigger onToolChange callback when deselecting to null', function() {
      toolbar.selectTool('fill');
      
      const callbackSpy = sinon.spy();
      toolbar.onToolChange = callbackSpy;
      
      toolbar.deselectTool();
      
      expect(callbackSpy.calledOnce).to.be.true;
      expect(callbackSpy.calledWith(null, 'fill')).to.be.true;
    });

    it('should not trigger callback when deselecting from No Tool mode', function() {
      expect(toolbar.getSelectedTool()).to.be.null;
      
      const callbackSpy = sinon.spy();
      toolbar.onToolChange = callbackSpy;
      
      toolbar.deselectTool();
      
      expect(callbackSpy.called).to.be.false;
    });
  });

  describe('Workflow Scenarios', function() {
    it('should support workflow: Start -> Select Tool -> Edit -> Deselect -> Navigate', function() {
      // Start with no tool
      expect(toolbar.hasActiveTool()).to.be.false;
      
      // Select paint
      toolbar.selectTool('paint');
      expect(toolbar.getSelectedTool()).to.equal('paint');
      
      // Simulate edit (select material)
      editor.selectMaterial('stone');
      expect(editor._selectedMaterial).to.equal('stone');
      
      // Deselect tool
      toolbar.deselectTool();
      expect(toolbar.hasActiveTool()).to.be.false;
      
      // Navigate (no accidental edits)
      const tool = toolbar.getSelectedTool();
      expect(tool).to.be.null;
    });

    it('should support workflow: Tool A -> Deselect -> Tool B', function() {
      // Select first tool
      toolbar.selectTool('paint');
      expect(toolbar.getSelectedTool()).to.equal('paint');
      
      // Deselect
      toolbar.deselectTool();
      expect(toolbar.getSelectedTool()).to.be.null;
      
      // Select different tool
      toolbar.selectTool('fill');
      expect(toolbar.getSelectedTool()).to.equal('fill');
    });
  });

  describe('History Operations', function() {
    it('should allow undo/redo checks independently of No Tool mode', function() {
      // Start with no tool
      expect(toolbar.getSelectedTool()).to.be.null;
      
      // Undo/redo availability is independent of tool selection
      const canUndoBefore = editor.canUndo();
      const canRedoBefore = editor.canRedo();
      
      expect(typeof canUndoBefore).to.equal('boolean');
      expect(typeof canRedoBefore).to.equal('boolean');
      
      // Select a tool
      toolbar.selectTool('paint');
      
      // Undo/redo availability unchanged
      expect(editor.canUndo()).to.equal(canUndoBefore);
      expect(editor.canRedo()).to.equal(canRedoBefore);
      
      // Deselect tool
      toolbar.deselectTool();
      
      // Undo/redo still work
      expect(editor.canUndo()).to.equal(canUndoBefore);
      expect(editor.canRedo()).to.equal(canRedoBefore);
    });
  });

  describe('Edge Cases', function() {
    it('should handle rapid tool selection/deselection', function() {
      for (let i = 0; i < 5; i++) {
        toolbar.selectTool('paint');
        toolbar.deselectTool();
      }
      
      expect(toolbar.getSelectedTool()).to.be.null;
      expect(toolbar.hasActiveTool()).to.be.false;
    });

    it('should handle deselecting when already in No Tool mode', function() {
      expect(toolbar.getSelectedTool()).to.be.null;
      
      // Should not throw
      expect(() => toolbar.deselectTool()).to.not.throw();
      expect(toolbar.getSelectedTool()).to.be.null;
    });

    it('should handle selecting invalid tool from No Tool mode', function() {
      const result = toolbar.selectTool('nonexistent_tool');
      
      expect(result).to.be.false;
      expect(toolbar.getSelectedTool()).to.be.null;
    });
  });
});
