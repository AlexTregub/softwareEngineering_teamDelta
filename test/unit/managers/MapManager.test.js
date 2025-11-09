const { expect } = require('chai');
const sinon = require('sinon');

// Mock logging functions BEFORE requiring MapManager
global.console.log = sinon.stub();
global.logDebug = sinon.stub();
global.logWarning = sinon.stub();
global.logError = sinon.stub();

const MapManager = require('../../../Classes/managers/MapManager.js');

describe('MapManager', function() {
  let manager;
  let mockMap1, mockMap2, mockMap3;
  
  beforeEach(function() {
    manager = new MapManager();
    
    // Create mock maps with minimal gridTerrain interface
    mockMap1 = {
      chunkArray: {
        rawArray: [
          {
            tileData: {
              getSpanRange: () => [[0, 7], [7, 0]],
              convRelToArrPos: (pos) => [pos[0], pos[1]],
              convToFlat: (arrPos) => arrPos[1] * 8 + arrPos[0],
              rawArray: new Array(64).fill({ material: 'grass' }),
              get: (pos) => ({ material: 'grass', x: pos[0], y: pos[1] })
            }
          }
        ]
      },
      renderConversion: {
        convCanvasToPos: (canvasPos) => [canvasPos[0] / 32, canvasPos[1] / 32],
        alignToCanvas: function() {}
      },
      invalidateCache: function() { this.cacheInvalidated = true; },
      cacheInvalidated: false
    };
    
    mockMap2 = {
      chunkArray: { rawArray: [] },
      renderConversion: {
        convCanvasToPos: (canvasPos) => [canvasPos[0] / 32, canvasPos[1] / 32]
      },
      invalidateCache: function() { this.cacheInvalidated = true; },
      cacheInvalidated: false
    };
    
    mockMap3 = {
      chunkArray: { rawArray: [] },
      renderConversion: {
        convCanvasToPos: (canvasPos) => [canvasPos[0] / 32, canvasPos[1] / 32]
      }
    };
  });
  
  describe('Constructor', function() {
    it('should initialize with empty maps', function() {
      expect(manager._maps.size).to.equal(0);
    });
    
    it('should initialize activeMap to null', function() {
      expect(manager._activeMap).to.be.null;
    });
    
    it('should initialize activeMapId to null', function() {
      expect(manager._activeMapId).to.be.null;
    });
    
    it('should set default tile size to 32', function() {
      expect(manager._defaultTileSize).to.equal(32);
    });
    
    it('should initialize _maps as a Map', function() {
      expect(manager._maps).to.be.instanceOf(Map);
    });
  });
  
  describe('registerMap()', function() {
    it('should register a valid map', function() {
      const result = manager.registerMap('level1', mockMap1);
      expect(result).to.be.true;
      expect(manager._maps.has('level1')).to.be.true;
    });
    
    it('should return false for invalid mapId', function() {
      expect(manager.registerMap('', mockMap1)).to.be.false;
      expect(manager.registerMap(null, mockMap1)).to.be.false;
      expect(manager.registerMap(undefined, mockMap1)).to.be.false;
    });
    
    it('should return false for non-string mapId', function() {
      expect(manager.registerMap(123, mockMap1)).to.be.false;
      expect(manager.registerMap({}, mockMap1)).to.be.false;
    });
    
    it('should return false for invalid map object', function() {
      expect(manager.registerMap('level1', null)).to.be.false;
      expect(manager.registerMap('level1', {})).to.be.false;
      expect(manager.registerMap('level1', { noChunkArray: true })).to.be.false;
    });
    
    it('should replace existing map with warning', function() {
      manager.registerMap('level1', mockMap1);
      const result = manager.registerMap('level1', mockMap2);
      expect(result).to.be.true;
      expect(manager._maps.get('level1')).to.equal(mockMap2);
    });
    
    it('should set map as active when setActive is true', function() {
      manager.registerMap('level1', mockMap1, true);
      expect(manager._activeMapId).to.equal('level1');
      expect(manager._activeMap).to.equal(mockMap1);
    });
    
    it('should not set map as active when setActive is false', function() {
      manager.registerMap('level1', mockMap1, false);
      expect(manager._activeMapId).to.be.null;
      expect(manager._activeMap).to.be.null;
    });
    
    it('should default setActive to false', function() {
      manager.registerMap('level1', mockMap1);
      expect(manager._activeMapId).to.be.null;
    });
    
    it('should register multiple maps', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      manager.registerMap('level3', mockMap3);
      expect(manager._maps.size).to.equal(3);
    });
  });
  
  describe('unregisterMap()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
    });
    
    it('should unregister a map', function() {
      const result = manager.unregisterMap('level1');
      expect(result).to.be.true;
      expect(manager._maps.has('level1')).to.be.false;
    });
    
    it('should return false for non-existent map', function() {
      const result = manager.unregisterMap('nonexistent');
      expect(result).to.be.false;
    });
    
    it('should not allow removing active map', function() {
      manager.setActiveMap('level1');
      const result = manager.unregisterMap('level1');
      expect(result).to.be.false;
      expect(manager._maps.has('level1')).to.be.true;
    });
    
    it('should allow removing non-active map', function() {
      manager.setActiveMap('level1');
      const result = manager.unregisterMap('level2');
      expect(result).to.be.true;
      expect(manager._maps.has('level2')).to.be.false;
    });
    
    it('should reduce map count', function() {
      expect(manager._maps.size).to.equal(2);
      manager.unregisterMap('level1');
      expect(manager._maps.size).to.equal(1);
    });
  });
  
  describe('setActiveMap()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
    });
    
    it('should set active map by ID', function() {
      const result = manager.setActiveMap('level1');
      expect(result).to.be.true;
      expect(manager._activeMapId).to.equal('level1');
      expect(manager._activeMap).to.equal(mockMap1);
    });
    
    it('should return false for non-existent map', function() {
      const result = manager.setActiveMap('nonexistent');
      expect(result).to.be.false;
    });
    
    it('should switch active maps', function() {
      manager.setActiveMap('level1');
      expect(manager._activeMapId).to.equal('level1');
      
      manager.setActiveMap('level2');
      expect(manager._activeMapId).to.equal('level2');
      expect(manager._activeMap).to.equal(mockMap2);
    });
    
    it('should invalidate cache when map has invalidateCache method', function() {
      manager.setActiveMap('level1');
      expect(mockMap1.cacheInvalidated).to.be.true;
    });
    
    it('should handle map without invalidateCache method', function() {
      expect(() => manager.setActiveMap('level2')).to.not.throw();
    });
  });
  
  describe('getActiveMap()', function() {
    it('should return null when no active map', function() {
      expect(manager.getActiveMap()).to.be.null;
    });
    
    it('should return active map instance', function() {
      manager.registerMap('level1', mockMap1, true);
      expect(manager.getActiveMap()).to.equal(mockMap1);
    });
    
    it('should return updated active map after switch', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      
      manager.setActiveMap('level1');
      expect(manager.getActiveMap()).to.equal(mockMap1);
      
      manager.setActiveMap('level2');
      expect(manager.getActiveMap()).to.equal(mockMap2);
    });
  });
  
  describe('getActiveMapId()', function() {
    it('should return null when no active map', function() {
      expect(manager.getActiveMapId()).to.be.null;
    });
    
    it('should return active map ID', function() {
      manager.registerMap('level1', mockMap1, true);
      expect(manager.getActiveMapId()).to.equal('level1');
    });
  });
  
  describe('getMap()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
    });
    
    it('should return map by ID', function() {
      expect(manager.getMap('level1')).to.equal(mockMap1);
      expect(manager.getMap('level2')).to.equal(mockMap2);
    });
    
    it('should return null for non-existent map', function() {
      expect(manager.getMap('nonexistent')).to.be.null;
    });
    
    it('should return null for invalid ID types', function() {
      expect(manager.getMap(null)).to.be.null;
      expect(manager.getMap(undefined)).to.be.null;
    });
  });
  
  describe('hasMap()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1);
    });
    
    it('should return true for registered map', function() {
      expect(manager.hasMap('level1')).to.be.true;
    });
    
    it('should return false for non-existent map', function() {
      expect(manager.hasMap('nonexistent')).to.be.false;
    });
    
    it('should return false after unregistration', function() {
      expect(manager.hasMap('level1')).to.be.true;
      manager.unregisterMap('level1');
      expect(manager.hasMap('level1')).to.be.false;
    });
  });
  
  describe('getMapIds()', function() {
    it('should return empty array when no maps', function() {
      expect(manager.getMapIds()).to.deep.equal([]);
    });
    
    it('should return array of map IDs', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      manager.registerMap('level3', mockMap3);
      
      const ids = manager.getMapIds();
      expect(ids).to.be.an('array');
      expect(ids).to.have.lengthOf(3);
      expect(ids).to.include('level1');
      expect(ids).to.include('level2');
      expect(ids).to.include('level3');
    });
    
    it('should update after adding map', function() {
      manager.registerMap('level1', mockMap1);
      expect(manager.getMapIds()).to.have.lengthOf(1);
      
      manager.registerMap('level2', mockMap2);
      expect(manager.getMapIds()).to.have.lengthOf(2);
    });
    
    it('should update after removing map', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      expect(manager.getMapIds()).to.have.lengthOf(2);
      
      manager.unregisterMap('level1');
      expect(manager.getMapIds()).to.have.lengthOf(1);
      expect(manager.getMapIds()).to.not.include('level1');
    });
  });
  
  describe('getTileAtPosition()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1, true);
    });
    
    it('should return null when no active map', function() {
      manager._activeMap = null;
      expect(manager.getTileAtPosition(100, 100)).to.be.null;
    });
    
    it('should return tile at world position', function() {
      const tile = manager.getTileAtPosition(64, 64);
      expect(tile).to.not.be.null;
      expect(tile).to.have.property('material');
    });
    
    it('should use renderConversion for coordinate conversion', function() {
      const tile = manager.getTileAtPosition(32, 32);
      expect(tile).to.not.be.null;
    });
    
    it('should handle errors gracefully', function() {
      // Mock map with broken renderConversion
      const brokenMap = {
        chunkArray: { rawArray: [] },
        renderConversion: {
          convCanvasToPos: () => { throw new Error('Test error'); }
        }
      };
      manager.registerMap('broken', brokenMap, true);
      
      expect(manager.getTileAtPosition(100, 100)).to.be.null;
    });
  });
  
  describe('getTileAtGridCoords()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1, true);
    });
    
    it('should return null when no active map', function() {
      manager._activeMap = null;
      expect(manager.getTileAtGridCoords(5, 5)).to.be.null;
    });
    
    it('should return null when chunkArray missing', function() {
      manager._activeMap = {};
      expect(manager.getTileAtGridCoords(5, 5)).to.be.null;
    });
    
    it('should return tile at grid coordinates', function() {
      const tile = manager.getTileAtGridCoords(3, 3);
      expect(tile).to.not.be.null;
      expect(tile).to.have.property('material', 'grass');
    });
    
    it('should return null for out-of-bounds coordinates', function() {
      const tile = manager.getTileAtGridCoords(100, 100);
      expect(tile).to.be.null;
    });
    
    it('should handle negative coordinates', function() {
      const tile = manager.getTileAtGridCoords(-1, -1);
      expect(tile).to.be.null;
    });
  });
  
  describe('getTileAtCoords() [deprecated]', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1, true);
    });
    
    it('should call getTileAtGridCoords', function() {
      const tile = manager.getTileAtCoords(3, 3);
      expect(tile).to.not.be.null;
    });
    
    it('should return same result as getTileAtGridCoords', function() {
      const tile1 = manager.getTileAtCoords(2, 2);
      const tile2 = manager.getTileAtGridCoords(2, 2);
      expect(tile1).to.deep.equal(tile2);
    });
  });
  
  describe('getTileMaterial()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1, true);
    });
    
    it('should return null when no tile found', function() {
      manager._activeMap = null;
      expect(manager.getTileMaterial(100, 100)).to.be.null;
    });
    
    it('should return material of tile at position', function() {
      const material = manager.getTileMaterial(64, 64);
      expect(material).to.equal('grass');
    });
    
    it('should return null for out-of-bounds position', function() {
      const material = manager.getTileMaterial(10000, 10000);
      expect(material).to.be.null;
    });
  });
  
  describe('getInfo()', function() {
    it('should return info object with all properties', function() {
      const info = manager.getInfo();
      expect(info).to.have.property('totalMaps');
      expect(info).to.have.property('activeMapId');
      expect(info).to.have.property('mapIds');
      expect(info).to.have.property('hasActiveMap');
    });
    
    it('should reflect empty state', function() {
      const info = manager.getInfo();
      expect(info.totalMaps).to.equal(0);
      expect(info.activeMapId).to.be.null;
      expect(info.mapIds).to.deep.equal([]);
      expect(info.hasActiveMap).to.be.false;
    });
    
    it('should reflect registered maps', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      
      const info = manager.getInfo();
      expect(info.totalMaps).to.equal(2);
      expect(info.mapIds).to.have.lengthOf(2);
    });
    
    it('should reflect active map', function() {
      manager.registerMap('level1', mockMap1, true);
      
      const info = manager.getInfo();
      expect(info.activeMapId).to.equal('level1');
      expect(info.hasActiveMap).to.be.true;
    });
    
    it('should update after changes', function() {
      manager.registerMap('level1', mockMap1, true);
      let info = manager.getInfo();
      expect(info.totalMaps).to.equal(1);
      
      manager.registerMap('level2', mockMap2);
      info = manager.getInfo();
      expect(info.totalMaps).to.equal(2);
    });
  });
  
  describe('clearAll()', function() {
    beforeEach(function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      manager.setActiveMap('level1');
    });
    
    it('should clear all maps', function() {
      manager.clearAll();
      expect(manager._maps.size).to.equal(0);
    });
    
    it('should clear active map', function() {
      manager.clearAll();
      expect(manager._activeMap).to.be.null;
      expect(manager._activeMapId).to.be.null;
    });
    
    it('should result in empty getInfo', function() {
      manager.clearAll();
      const info = manager.getInfo();
      expect(info.totalMaps).to.equal(0);
      expect(info.hasActiveMap).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle registering same map twice', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level1', mockMap1);
      expect(manager._maps.size).to.equal(1);
    });
    
    it('should handle rapid map switching', function() {
      manager.registerMap('level1', mockMap1);
      manager.registerMap('level2', mockMap2);
      manager.registerMap('level3', mockMap3);
      
      for (let i = 0; i < 50; i++) {
        manager.setActiveMap('level1');
        manager.setActiveMap('level2');
        manager.setActiveMap('level3');
      }
      
      expect(manager._activeMapId).to.equal('level3');
    });
    
    it('should handle tile queries on empty map', function() {
      const emptyMap = {
        chunkArray: { rawArray: [] },
        renderConversion: {
          convCanvasToPos: (pos) => [pos[0] / 32, pos[1] / 32]
        }
      };
      manager.registerMap('empty', emptyMap, true);
      
      const tile = manager.getTileAtGridCoords(0, 0);
      expect(tile).to.be.null;
    });
    
    it('should handle unregister after clearAll', function() {
      manager.registerMap('level1', mockMap1);
      manager.clearAll();
      
      expect(() => manager.unregisterMap('level1')).to.not.throw();
    });
    
    it('should handle getMap after clearAll', function() {
      manager.registerMap('level1', mockMap1);
      manager.clearAll();
      
      expect(manager.getMap('level1')).to.be.null;
    });
  });
});
