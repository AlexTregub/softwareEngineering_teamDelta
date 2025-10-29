/**
 * Unit Tests - TerrainEditor Material Painting
 * 
 * Tests that TerrainEditor paints actual material types (moss, stone, dirt, grass)
 * not just colors
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('TerrainEditor - Material Painting', function() {
  let TerrainEditor;
  let editor;
  let mockTerrain;
  let mockTile;

  beforeEach(function() {
    // Mock tile
    mockTile = {
      _material: 'grass',
      getMaterial: sinon.stub().callsFake(function() { return this._material; }),
      setMaterial: sinon.stub().callsFake(function(mat) { this._material = mat; }),
      assignWeight: sinon.stub()
    };
    
    // Mock terrain
    mockTerrain = {
      _tileSize: 32,
      _chunkSize: 16,
      _gridSizeX: 4,
      _gridSizeY: 4,
      getArrPos: sinon.stub().returns(mockTile),
      getTile: sinon.stub().returns(mockTile),
      invalidateCache: sinon.stub()
    };
    
    // Load TerrainEditor
    TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
    
    // Create editor
    editor = new TerrainEditor(mockTerrain);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Material Selection', function() {
    it('should set material by name, not color', function() {
      editor.selectMaterial('moss');
      
      expect(editor._selectedMaterial).to.equal('moss');
      expect(editor._selectedMaterial).to.be.a('string');
      expect(editor._selectedMaterial).to.not.match(/^#[0-9A-F]{6}$/i);
    });
    
    it('should accept all terrain material types', function() {
      const materials = ['moss', 'moss_1', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        editor.selectMaterial(material);
        expect(editor._selectedMaterial).to.equal(material);
      });
    });
  });

  describe('Paint Tile with Material', function() {
    it('should paint tile with material name, not color', function() {
      editor.selectMaterial('stone');
      
      // Paint at tile position 5, 5
      editor.paintTile(5 * 32, 5 * 32);
      
      // Should have called setMaterial with 'stone'
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
      expect(mockTile.setMaterial.calledWith(sinon.match(/^#/))).to.be.false;
    });
    
    it('should paint with moss material', function() {
      editor.selectMaterial('moss');
      editor.paintTile(10 * 32, 10 * 32);
      
      expect(mockTile.setMaterial.calledWith('moss')).to.be.true;
    });
    
    it('should paint with dirt material', function() {
      editor.selectMaterial('dirt');
      editor.paintTile(8 * 32, 8 * 32);
      
      expect(mockTile.setMaterial.calledWith('dirt')).to.be.true;
    });
    
    it('should paint with grass material', function() {
      editor.selectMaterial('grass');
      editor.paintTile(12 * 32, 12 * 32);
      
      expect(mockTile.setMaterial.calledWith('grass')).to.be.true;
    });
    
    it('should call assignWeight after setting material', function() {
      editor.selectMaterial('stone');
      editor.paintTile(5 * 32, 5 * 32);
      
      expect(mockTile.assignWeight.called).to.be.true;
    });
    
    it('should invalidate terrain cache after painting', function() {
      editor.selectMaterial('moss');
      editor.paintTile(5 * 32, 5 * 32);
      
      expect(mockTerrain.invalidateCache.called).to.be.true;
    });
  });

  describe('Paint Method Integration', function() {
    it('should paint using the paint() method', function() {
      editor.selectMaterial('dirt');
      
      // paint() method uses tile coordinates directly
      editor.paint(5, 5);
      
      expect(mockTile.setMaterial.calledWith('dirt')).to.be.true;
    });
    
    it('should use selected material when painting', function() {
      editor.selectMaterial('stone');
      editor.paint(10, 10);
      
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
    });
  });

  describe('Material Type Verification', function() {
    it('should store material as string name', function() {
      editor.selectMaterial('moss');
      
      expect(typeof editor._selectedMaterial).to.equal('string');
      expect(editor._selectedMaterial).to.equal('moss');
    });
    
    it('should not store color codes', function() {
      const materials = ['moss', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        editor.selectMaterial(material);
        
        // Should be material name, not hex color
        expect(editor._selectedMaterial).to.not.match(/^#[0-9A-F]{6}$/i);
        expect(editor._selectedMaterial).to.not.match(/^rgb/i);
      });
    });
  });

  describe('Fill with Material', function() {
    it('should fill region with material name', function() {
      // Set tile to different material first
      mockTile._material = 'dirt';
      mockTile.getMaterial = sinon.stub().returns('dirt');
      
      editor.selectMaterial('grass');
      
      // Mock fill to check material
      mockTerrain.getArrPos = sinon.stub().returns(mockTile);
      
      editor.fill(5, 5);
      
      // Should have called setMaterial with 'grass'
      const setMaterialCalls = mockTile.setMaterial.getCalls();
      const grassCalls = setMaterialCalls.filter(call => call.args[0] === 'grass');
      expect(grassCalls.length).to.be.greaterThan(0);
    });
  });
});
