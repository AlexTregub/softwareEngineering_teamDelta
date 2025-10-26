const { expect } = require('chai');

// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });

// Mock terrain systems
global.mapManager = null;
global.g_activeMap = null;
global.TILE_SIZE = 32;
global.window = { DEBUG_TERRAIN: false };

// Load the module
const TerrainController = require('../../../Classes/controllers/TerrainController.js');

describe('TerrainController', function() {
  let mockEntity;
  let controller;
  
  beforeEach(function() {
    // Reset global terrain systems
    global.mapManager = null;
    global.g_activeMap = null;
    
    // Create minimal mock entity
    mockEntity = {
      _type: 'Ant',
      _id: 'test-ant-1',
      _stateMachine: {
        setTerrainModifier: function(terrain) { this.terrainModifier = terrain; },
        terrainModifier: null
      },
      getPosition: function() { return { x: 100, y: 100 }; }
    };
    
    controller = new TerrainController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller._entity).to.equal(mockEntity);
    });
    
    it('should initialize current terrain to DEFAULT', function() {
      expect(controller._currentTerrain).to.equal('DEFAULT');
    });
    
    it('should initialize last position', function() {
      expect(controller._lastPosition).to.deep.equal({ x: -1, y: -1 });
    });
    
    it('should initialize terrain check interval to 200ms', function() {
      expect(controller._terrainCheckInterval).to.equal(200);
    });
    
    it('should initialize empty terrain cache', function() {
      expect(controller._terrainCache).to.be.instanceof(Map);
      expect(controller._terrainCache.size).to.equal(0);
    });
  });
  
  describe('getCurrentTerrain()', function() {
    it('should return current terrain type', function() {
      expect(controller.getCurrentTerrain()).to.equal('DEFAULT');
    });
    
    it('should reflect terrain changes', function() {
      controller._currentTerrain = 'IN_WATER';
      expect(controller.getCurrentTerrain()).to.equal('IN_WATER');
    });
  });
  
  describe('setCheckInterval()', function() {
    it('should set terrain check interval', function() {
      controller.setCheckInterval(500);
      expect(controller._terrainCheckInterval).to.equal(500);
    });
    
    it('should handle zero interval', function() {
      controller.setCheckInterval(0);
      expect(controller._terrainCheckInterval).to.equal(0);
    });
    
    it('should handle large intervals', function() {
      controller.setCheckInterval(10000);
      expect(controller._terrainCheckInterval).to.equal(10000);
    });
  });
  
  describe('Terrain Detection', function() {
    describe('detectTerrain()', function() {
      it('should return DEFAULT when no map available', function() {
        global.mapManager = { getActiveMap: () => null };
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('DEFAULT');
      });
      
      it('should detect WATER terrain', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'water' })
        };
        
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('IN_WATER');
      });
      
      it('should detect MUD terrain', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'mud' })
        };
        
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('IN_MUD');
      });
      
      it('should detect SLIPPERY terrain', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'ice' })
        };
        
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('ON_SLIPPERY');
      });
      
      it('should detect ROUGH terrain', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'stone' })
        };
        
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('ON_ROUGH');
      });
      
      it('should cache terrain lookups', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'water' })
        };
        
        controller.detectTerrain();
        expect(controller._terrainCache.size).to.be.greaterThan(0);
      });
      
      it('should use cached terrain', function() {
        const cacheKey = '3,3';
        controller._terrainCache.set(cacheKey, 'IN_WATER');
        
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('IN_WATER');
      });
    });
    
    describe('_mapTerrainType()', function() {
      it('should map water types', function() {
        expect(controller._mapTerrainType({ material: 'water' })).to.equal('IN_WATER');
        expect(controller._mapTerrainType({ material: 'river' })).to.equal('IN_WATER');
        expect(controller._mapTerrainType({ material: 'lake' })).to.equal('IN_WATER');
      });
      
      it('should map mud types', function() {
        expect(controller._mapTerrainType({ material: 'mud' })).to.equal('IN_MUD');
        expect(controller._mapTerrainType({ material: 'moss' })).to.equal('IN_MUD');
        expect(controller._mapTerrainType({ material: 'swamp' })).to.equal('IN_MUD');
      });
      
      it('should map slippery types', function() {
        expect(controller._mapTerrainType({ material: 'ice' })).to.equal('ON_SLIPPERY');
        expect(controller._mapTerrainType({ material: 'slippery' })).to.equal('ON_SLIPPERY');
      });
      
      it('should map rough types', function() {
        expect(controller._mapTerrainType({ material: 'stone' })).to.equal('ON_ROUGH');
        expect(controller._mapTerrainType({ material: 'rocks' })).to.equal('ON_ROUGH');
        expect(controller._mapTerrainType({ material: 'mountain' })).to.equal('ON_ROUGH');
      });
      
      it('should map grass to DEFAULT', function() {
        expect(controller._mapTerrainType({ material: 'grass' })).to.equal('DEFAULT');
      });
      
      it('should default unknown types to DEFAULT', function() {
        expect(controller._mapTerrainType({ material: 'unknown' })).to.equal('DEFAULT');
      });
      
      it('should be case insensitive', function() {
        expect(controller._mapTerrainType({ material: 'WATER' })).to.equal('IN_WATER');
        expect(controller._mapTerrainType({ material: 'MUD' })).to.equal('IN_MUD');
      });
    });
  });
  
  describe('Terrain Effects', function() {
    describe('getSpeedModifier()', function() {
      it('should return base speed for DEFAULT terrain', function() {
        controller._currentTerrain = 'DEFAULT';
        expect(controller.getSpeedModifier(100)).to.equal(100);
      });
      
      it('should apply 50% penalty in water', function() {
        controller._currentTerrain = 'IN_WATER';
        expect(controller.getSpeedModifier(100)).to.equal(50);
      });
      
      it('should apply 70% penalty in mud', function() {
        controller._currentTerrain = 'IN_MUD';
        expect(controller.getSpeedModifier(100)).to.equal(30);
      });
      
      it('should apply 20% bonus on slippery', function() {
        controller._currentTerrain = 'ON_SLIPPERY';
        expect(controller.getSpeedModifier(100)).to.equal(120);
      });
      
      it('should apply 20% penalty on rough', function() {
        controller._currentTerrain = 'ON_ROUGH';
        expect(controller.getSpeedModifier(100)).to.equal(80);
      });
      
      it('should work with fractional speeds', function() {
        controller._currentTerrain = 'IN_WATER';
        expect(controller.getSpeedModifier(2.5)).to.equal(1.25);
      });
    });
    
    describe('canMove()', function() {
      it('should allow movement on DEFAULT terrain', function() {
        controller._currentTerrain = 'DEFAULT';
        expect(controller.canMove()).to.be.true;
      });
      
      it('should allow movement in water', function() {
        controller._currentTerrain = 'IN_WATER';
        expect(controller.canMove()).to.be.true;
      });
      
      it('should prevent movement on slippery terrain', function() {
        controller._currentTerrain = 'ON_SLIPPERY';
        expect(controller.canMove()).to.be.false;
      });
      
      it('should allow movement on rough terrain', function() {
        controller._currentTerrain = 'ON_ROUGH';
        expect(controller.canMove()).to.be.true;
      });
    });
    
    describe('getVisualEffects()', function() {
      it('should return empty object for DEFAULT', function() {
        controller._currentTerrain = 'DEFAULT';
        expect(controller.getVisualEffects()).to.deep.equal({});
      });
      
      it('should return ripples for water', function() {
        controller._currentTerrain = 'IN_WATER';
        const effects = controller.getVisualEffects();
        expect(effects.ripples).to.be.true;
        expect(effects.colorTint).to.exist;
      });
      
      it('should return particles for mud', function() {
        controller._currentTerrain = 'IN_MUD';
        const effects = controller.getVisualEffects();
        expect(effects.particles).to.equal('mud');
      });
      
      it('should return sparkles for slippery', function() {
        controller._currentTerrain = 'ON_SLIPPERY';
        const effects = controller.getVisualEffects();
        expect(effects.sparkles).to.be.true;
      });
      
      it('should return dust particles for rough', function() {
        controller._currentTerrain = 'ON_ROUGH';
        const effects = controller.getVisualEffects();
        expect(effects.dustParticles).to.be.true;
      });
    });
  });
  
  describe('Update and Detection', function() {
    describe('update()', function() {
      it('should check terrain periodically', function(done) {
        controller._lastTerrainCheck = Date.now() - 300; // Force check
        
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'water' })
        };
        
        controller.update();
        
        setTimeout(() => {
          expect(controller._currentTerrain).to.equal('IN_WATER');
          done();
        }, 10);
      });
      
      it('should respect check interval', function() {
        global.mapManager = { getActiveMap: () => null };
        controller._lastTerrainCheck = Date.now();
        const originalTerrain = controller._currentTerrain;
        
        controller.update();
        
        expect(controller._currentTerrain).to.equal(originalTerrain);
      });
      
      it('should check when position changes significantly', function() {
        controller._lastPosition = { x: 0, y: 0 };
        mockEntity.getPosition = () => ({ x: 50, y: 50 });
        
        expect(controller._hasPositionChanged()).to.be.true;
      });
    });
    
    describe('forceTerrainCheck()', function() {
      it('should check terrain immediately', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'mud' })
        };
        
        controller.forceTerrainCheck();
        expect(controller._currentTerrain).to.equal('IN_MUD');
      });
      
      it('should update last position', function() {
        global.mapManager = { getActiveMap: () => null };
        controller._lastPosition = { x: -1, y: -1 };
        controller.forceTerrainCheck();
        expect(controller._lastPosition.x).to.equal(100);
        expect(controller._lastPosition.y).to.equal(100);
      });
    });
    
    describe('detectAndUpdateTerrain()', function() {
      it('should update state machine on terrain change', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'water' })
        };
        
        controller.detectAndUpdateTerrain();
        expect(mockEntity._stateMachine.terrainModifier).to.equal('IN_WATER');
      });
      
      it('should not update if terrain unchanged', function() {
        global.mapManager = { getActiveMap: () => null };
        let updateCount = 0;
        mockEntity._stateMachine.setTerrainModifier = () => updateCount++;
        
        controller.detectAndUpdateTerrain();
        controller.detectAndUpdateTerrain();
        
        expect(updateCount).to.equal(0); // No change from DEFAULT
      });
      
      it('should trigger callback on terrain change', function() {
        let oldTerrain = null;
        let newTerrain = null;
        
        controller.setTerrainChangeCallback((old, current) => {
          oldTerrain = old;
          newTerrain = current;
        });
        
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'water' })
        };
        
        controller.detectAndUpdateTerrain();
        expect(oldTerrain).to.equal('DEFAULT');
        expect(newTerrain).to.equal('IN_WATER');
      });
    });
  });
  
  describe('Position Tracking', function() {
    describe('_hasPositionChanged()', function() {
      it('should detect significant position change', function() {
        controller._lastPosition = { x: 0, y: 0 };
        mockEntity.getPosition = () => ({ x: 50, y: 0 });
        expect(controller._hasPositionChanged()).to.be.true;
      });
      
      it('should ignore small position changes', function() {
        controller._lastPosition = { x: 100, y: 100 };
        mockEntity.getPosition = () => ({ x: 105, y: 105 });
        expect(controller._hasPositionChanged()).to.be.false;
      });
      
      it('should use 16 pixel threshold', function() {
        controller._lastPosition = { x: 100, y: 100 };
        mockEntity.getPosition = () => ({ x: 115, y: 100 });
        expect(controller._hasPositionChanged()).to.be.false;
        
        mockEntity.getPosition = () => ({ x: 117, y: 100 });
        expect(controller._hasPositionChanged()).to.be.true;
      });
    });
    
    describe('_updateLastPosition()', function() {
      it('should update last known position', function() {
        controller._updateLastPosition();
        expect(controller._lastPosition.x).to.equal(100);
        expect(controller._lastPosition.y).to.equal(100);
      });
    });
    
    describe('_getEntityPosition()', function() {
      it('should use transform controller if available', function() {
        mockEntity._transformController = {
          getPosition: () => ({ x: 200, y: 200 })
        };
        
        const pos = controller._getEntityPosition();
        expect(pos.x).to.equal(200);
        expect(pos.y).to.equal(200);
      });
      
      it('should fallback to getPosition method', function() {
        const pos = controller._getEntityPosition();
        expect(pos.x).to.equal(100);
        expect(pos.y).to.equal(100);
      });
    });
  });
  
  describe('Cache Management', function() {
    it('should clear terrain cache', function() {
      controller._terrainCache.set('1,1', 'IN_WATER');
      controller._terrainCache.set('2,2', 'IN_MUD');
      
      controller.clearCache();
      expect(controller._terrainCache.size).to.equal(0);
    });
    
    it('should limit cache size to 100 entries', function() {
      global.mapManager = {
        getActiveMap: () => true,
        getTileAtPosition: () => ({ material: 'grass' })
      };
      
      // Fill cache beyond limit
      for (let i = 0; i < 150; i++) {
        mockEntity.getPosition = () => ({ x: i * 32, y: i * 32 });
        controller.detectTerrain();
      }
      
      expect(controller._terrainCache.size).to.be.at.most(100);
    });
  });
  
  describe('Callback System', function() {
    it('should register terrain change callback', function() {
      const callback = function() {};
      controller.setTerrainChangeCallback(callback);
      expect(controller._onTerrainChangeCallback).to.equal(callback);
    });
    
    it('should invoke callback on terrain change', function() {
      let invoked = false;
      controller.setTerrainChangeCallback(() => invoked = true);
      
      global.mapManager = {
        getActiveMap: () => true,
        getTileAtPosition: () => ({ material: 'water' })
      };
      
      controller.detectAndUpdateTerrain();
      expect(invoked).to.be.true;
    });
  });
  
  describe('Debug Info', function() {
    it('should return comprehensive debug info', function() {
      const info = controller.getDebugInfo();
      expect(info.currentTerrain).to.exist;
      expect(info.lastPosition).to.exist;
      expect(info.cacheSize).to.exist;
      expect(info.checkInterval).to.exist;
      expect(info.canMove).to.exist;
      expect(info.visualEffects).to.exist;
    });
    
    it('should include terrain-specific info', function() {
      controller._currentTerrain = 'IN_WATER';
      const info = controller.getDebugInfo();
      expect(info.currentTerrain).to.equal('IN_WATER');
      expect(info.canMove).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entity without state machine', function() {
      global.mapManager = { getActiveMap: () => null };
      mockEntity._stateMachine = null;
      expect(() => controller.detectAndUpdateTerrain()).to.not.throw();
    });
    
    it('should handle malformed tile data', function() {
      global.mapManager = {
        getActiveMap: () => true,
        getTileAtPosition: () => ({})
      };
      
      const terrain = controller.detectTerrain();
      expect(terrain).to.equal('DEFAULT');
    });
    
    it('should handle null tile', function() {
      global.mapManager = {
        getActiveMap: () => true,
        getTileAtPosition: () => null
      };
      
      const terrain = controller.detectTerrain();
      expect(terrain).to.equal('DEFAULT');
    });
    
    it('should handle callback throwing exception', function() {
      controller.setTerrainChangeCallback(() => {
        throw new Error('Callback error');
      });
      
      global.mapManager = {
        getActiveMap: () => true,
        getTileAtPosition: () => ({ material: 'water' })
      };
      
      expect(() => controller.detectAndUpdateTerrain()).to.throw();
    });
    
    it('should handle very rapid terrain checks', function() {
      global.mapManager = { getActiveMap: () => null };
      controller.setCheckInterval(0);
      
      for (let i = 0; i < 100; i++) {
        controller.update();
      }
      
      expect(controller._currentTerrain).to.be.a('string');
    });
  });
});
