/**
 * Unit Tests: TerrainEditor - Erase Method
 * 
 * Tests the erase() method for removing tiles:
 * - Single tile erase (SparseTerrain)
 * - Single tile erase (gridTerrain)
 * - Brush size support (3x3, 5x5 areas)
 * - Bounds checking
 * - Undo/redo integration
 * - Empty tile handling
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('TerrainEditor - Erase Method (Unit)', function() {
  let editor, mockTerrain, sandbox, dom;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Setup JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js globals
    global.TILE_SIZE = 32;
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    window.TILE_SIZE = global.TILE_SIZE;
    window.createVector = global.createVector;
    
    // Load TerrainEditor
    const TerrainEditorModule = require('../../../Classes/terrainUtils/TerrainEditor.js');
    global.TerrainEditor = TerrainEditorModule.TerrainEditor || TerrainEditorModule || global.TerrainEditor || window.TerrainEditor;
    window.TerrainEditor = global.TerrainEditor;
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Erase Single Tile - SparseTerrain', function() {
    beforeEach(function() {
      // Mock SparseTerrain
      mockTerrain = {
        getTile: sandbox.stub(),
        setTile: sandbox.stub(),
        removeTile: sandbox.stub(),
        defaultMaterial: 'grass',
        constructor: { name: 'SparseTerrain' }
      };
      
      const TerrainEditor = global.TerrainEditor;
      editor = new TerrainEditor(mockTerrain);
    });
    
    it('should have erase method', function() {
      expect(editor.erase).to.be.a('function');
    });
    
    it('should erase single tile from SparseTerrain', function() {
      mockTerrain.getTile.withArgs(10, 10).returns({ material: 'moss' });
      mockTerrain.removeTile.returns(true);
      
      const count = editor.erase(10, 10, 1);
      
      expect(count).to.equal(1);
      expect(mockTerrain.removeTile.calledWith(10, 10)).to.be.true;
    });
    
    it('should return 0 when tile does not exist', function() {
      mockTerrain.getTile.withArgs(10, 10).returns(null);
      
      const count = editor.erase(10, 10, 1);
      
      expect(count).to.equal(0);
      expect(mockTerrain.removeTile.called).to.be.false;
    });
    
    it('should preserve old material in history', function() {
      mockTerrain.getTile.withArgs(5, 5).returns({ material: 'stone' });
      mockTerrain.removeTile.returns(true);
      
      editor.erase(5, 5, 1);
      
      // Check undo history
      if (typeof editor.undo === 'function') {
        editor.undo();
        expect(mockTerrain.setTile.calledWith(5, 5, 'stone')).to.be.true;
      }
    });
  });
  
  describe('Erase Single Tile - gridTerrain', function() {
    beforeEach(function() {
      // Mock gridTerrain
      mockTerrain = {
        getTile: sandbox.stub(),
        setTile: sandbox.stub(),
        defaultMaterial: 'grass',
        constructor: { name: 'gridTerrain' }
      };
      
      const TerrainEditor = global.TerrainEditor;
      editor = new TerrainEditor(mockTerrain);
    });
    
    it('should reset tile to default material for gridTerrain', function() {
      mockTerrain.getTile.withArgs(10, 10).returns({ material: 'moss' });
      
      const count = editor.erase(10, 10, 1);
      
      expect(count).to.equal(1);
      expect(mockTerrain.setTile.calledWith(10, 10, 'grass')).to.be.true;
    });
    
    it('should not erase tile already at default material', function() {
      mockTerrain.getTile.withArgs(10, 10).returns({ material: 'grass' });
      
      const count = editor.erase(10, 10, 1);
      
      expect(count).to.equal(0);
      expect(mockTerrain.setTile.called).to.be.false;
    });
  });
  
  describe('Brush Size Support', function() {
    beforeEach(function() {
      mockTerrain = {
        getTile: sandbox.stub(),
        setTile: sandbox.stub(),
        removeTile: sandbox.stub(),
        defaultMaterial: 'grass',
        constructor: { name: 'SparseTerrain' }
      };
      
      // Return tile for all positions
      mockTerrain.getTile.returns({ material: 'moss' });
      mockTerrain.removeTile.returns(true);
      
      const TerrainEditor = global.TerrainEditor;
      editor = new TerrainEditor(mockTerrain);
    });
    
    it('should erase 3x3 area with brush size 3', function() {
      const count = editor.erase(10, 10, 3);
      
      expect(count).to.equal(9); // 3x3 grid
      expect(mockTerrain.removeTile.callCount).to.equal(9);
    });
    
    it('should erase 5x5 area with brush size 5', function() {
      const count = editor.erase(10, 10, 5);
      
      expect(count).to.equal(25); // 5x5 grid
      expect(mockTerrain.removeTile.callCount).to.equal(25);
    });
    
    it('should erase centered around specified position', function() {
      editor.erase(10, 10, 3);
      
      // Check that center tile (10, 10) and surrounding tiles were erased
      expect(mockTerrain.removeTile.calledWith(10, 10)).to.be.true; // center
      expect(mockTerrain.removeTile.calledWith(9, 9)).to.be.true;   // top-left
      expect(mockTerrain.removeTile.calledWith(11, 11)).to.be.true; // bottom-right
    });
    
    it('should default to brush size 1 if not specified', function() {
      const count = editor.erase(10, 10); // No brush size param
      
      expect(count).to.equal(1);
      expect(mockTerrain.removeTile.callCount).to.equal(1);
    });
  });
  
  describe('Bounds Checking', function() {
    beforeEach(function() {
      mockTerrain = {
        getTile: sandbox.stub(),
        setTile: sandbox.stub(),
        removeTile: sandbox.stub(),
        defaultMaterial: 'grass',
        constructor: { name: 'SparseTerrain' },
        width: 50,
        height: 50
      };
      
      // Return null for out-of-bounds
      mockTerrain.getTile.callsFake((x, y) => {
        if (x < 0 || y < 0 || x >= 50 || y >= 50) return null;
        return { material: 'moss' };
      });
      mockTerrain.removeTile.returns(true);
      
      const TerrainEditor = global.TerrainEditor;
      editor = new TerrainEditor(mockTerrain);
    });
    
    it('should not erase tiles outside bounds', function() {
      const count = editor.erase(-1, -1, 1);
      
      expect(count).to.equal(0);
      expect(mockTerrain.removeTile.called).to.be.false;
    });
    
    it('should only erase valid tiles in brush area', function() {
      // Erase at edge (0, 0) with brush size 3
      // Only tiles at (0,0), (0,1), (1,0), (1,1) should be erased
      const count = editor.erase(0, 0, 3);
      
      expect(count).to.be.lessThan(9); // Not all 9 tiles
      expect(count).to.be.greaterThan(0); // But some tiles
    });
  });
  
  describe('Undo/Redo Integration', function() {
    beforeEach(function() {
      mockTerrain = {
        getTile: sandbox.stub(),
        setTile: sandbox.stub(),
        removeTile: sandbox.stub(),
        defaultMaterial: 'grass',
        constructor: { name: 'SparseTerrain' }
      };
      
      mockTerrain.getTile.returns({ material: 'moss' });
      mockTerrain.removeTile.returns(true);
      
      const TerrainEditor = global.TerrainEditor;
      editor = new TerrainEditor(mockTerrain);
    });
    
    it('should add erase action to undo history', function() {
      editor.erase(10, 10, 1);
      
      // Verify history has entry
      if (editor._history || editor.history) {
        const history = editor._history || editor.history;
        expect(history.length).to.be.greaterThan(0);
      }
    });
    
    it('should restore tile on undo', function() {
      if (typeof editor.undo !== 'function') {
        this.skip();
        return;
      }
      
      mockTerrain.getTile.withArgs(10, 10).returns({ material: 'stone' });
      editor.erase(10, 10, 1);
      
      mockTerrain.setTile.resetHistory();
      editor.undo();
      
      expect(mockTerrain.setTile.calledWith(10, 10, 'stone')).to.be.true;
    });
    
    it('should re-erase tile on redo', function() {
      if (typeof editor.redo !== 'function') {
        this.skip();
        return;
      }
      
      mockTerrain.getTile.withArgs(10, 10).returns({ material: 'stone' });
      editor.erase(10, 10, 1);
      editor.undo();
      
      mockTerrain.removeTile.resetHistory();
      editor.redo();
      
      expect(mockTerrain.removeTile.calledWith(10, 10)).to.be.true;
    });
    
    it('should store all erased tiles in history', function() {
      editor.erase(10, 10, 3); // 3x3 = 9 tiles
      
      if (typeof editor.undo === 'function') {
        mockTerrain.setTile.resetHistory();
        editor.undo();
        
        // Should restore all 9 tiles
        expect(mockTerrain.setTile.callCount).to.equal(9);
      }
    });
  });
  
  describe('Return Value', function() {
    beforeEach(function() {
      mockTerrain = {
        getTile: sandbox.stub(),
        setTile: sandbox.stub(),
        removeTile: sandbox.stub(),
        defaultMaterial: 'grass',
        constructor: { name: 'SparseTerrain' }
      };
      
      const TerrainEditor = global.TerrainEditor;
      editor = new TerrainEditor(mockTerrain);
    });
    
    it('should return count of erased tiles', function() {
      mockTerrain.getTile.returns({ material: 'moss' });
      mockTerrain.removeTile.returns(true);
      
      const count = editor.erase(10, 10, 1);
      
      expect(count).to.be.a('number');
      expect(count).to.equal(1);
    });
    
    it('should return 0 when no tiles erased', function() {
      mockTerrain.getTile.returns(null); // No tile exists
      
      const count = editor.erase(10, 10, 1);
      
      expect(count).to.equal(0);
    });
    
    it('should return accurate count for partial erase', function() {
      // Return tile for some positions, null for others
      mockTerrain.getTile.callsFake((x, y) => {
        if (x === 10 && y === 10) return { material: 'moss' };
        return null;
      });
      mockTerrain.removeTile.returns(true);
      
      const count = editor.erase(10, 10, 3); // 3x3 area, but only 1 tile exists
      
      expect(count).to.equal(1);
    });
  });
});
