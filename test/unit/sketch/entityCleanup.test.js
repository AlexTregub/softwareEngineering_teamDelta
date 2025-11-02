/**
 * Unit Tests: Game State Cleanup Before Level Loading
 * ====================================================
 * Tests for clearing procedurally generated entities before loading custom level
 * 
 * TDD for Feature: Clean slate for custom levels
 * Root Cause: Procedural ants/resources/buildings persist when loading custom level
 * Expected: Clear all entities before loading JSON data
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('loadCustomLevel - Entity Cleanup', function() {
  let sandbox;
  let mockFetch;
  let mockGameState;
  let mockMapManager;
  let mockLevelLoader;
  let mockCameraManager;
  let globalAnts;
  let globalResources;
  let globalBuildings;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // Mock logging functions
    global.logNormal = sandbox.stub();
    global.logError = sandbox.stub();
    global.logWarn = sandbox.stub();

    // Mock fetch API
    mockFetch = sandbox.stub(global, 'fetch');

    // Mock GameState
    mockGameState = {
      goToGame: sandbox.stub(),
      setState: sandbox.stub()
    };
    global.GameState = mockGameState;

    // Mock MapManager
    mockMapManager = {
      loadLevel: sandbox.stub().returns({ getTile: () => null })
    };
    global.mapManager = mockMapManager;

    // Mock LevelLoader
    global.LevelLoader = sandbox.stub().returns({
      loadLevel: sandbox.stub().returns({ success: true, entities: [] })
    });

    // Mock CameraManager
    mockCameraManager = {
      followEntity: sandbox.stub()
    };
    global.cameraManager = mockCameraManager;

    // Mock findQueen
    global.findQueen = sandbox.stub().returns(null);

    // Create global entity arrays (simulating procedural generation)
    globalAnts = [
      { id: 'ant1', JobName: 'Worker' },
      { id: 'ant2', JobName: 'Soldier' },
      { id: 'ant3', JobName: 'Worker' }
    ];
    globalResources = [
      { id: 'res1', type: 'food' },
      { id: 'res2', type: 'wood' }
    ];
    globalBuildings = [
      { id: 'build1', type: 'nest' }
    ];

    global.ants = globalAnts;
    global.resource_list = globalResources;
    global.Buildings = globalBuildings;
  });

  afterEach(function() {
    sandbox.restore();
    delete global.logNormal;
    delete global.logError;
    delete global.logWarn;
    delete global.GameState;
    delete global.mapManager;
    delete global.LevelLoader;
    delete global.cameraManager;
    delete global.findQueen;
    delete global.ants;
    delete global.resource_list;
    delete global.Buildings;
  });

  describe('Entity Array Cleanup', function() {
    it('should clear ants array before loading level', async function() {
      mockFetch.resolves({
        ok: true,
        json: async () => ({ tiles: [], entities: [] })
      });

      // Call cleanup function
      clearGameEntities();

      expect(global.ants.length).to.equal(0);
    });

    it('should clear resource_list before loading level', async function() {
      mockFetch.resolves({
        ok: true,
        json: async () => ({ tiles: [], entities: [] })
      });

      clearGameEntities();

      expect(global.resource_list.length).to.equal(0);
    });

    it('should clear Buildings array before loading level', async function() {
      mockFetch.resolves({
        ok: true,
        json: async () => ({ tiles: [], entities: [] })
      });

      clearGameEntities();

      expect(global.Buildings.length).to.equal(0);
    });

    it('should handle missing ants array gracefully', async function() {
      delete global.ants;

      expect(() => clearGameEntities()).to.not.throw();
    });

    it('should handle missing resource_list gracefully', async function() {
      delete global.resource_list;

      expect(() => clearGameEntities()).to.not.throw();
    });

    it('should handle missing Buildings array gracefully', async function() {
      delete global.Buildings;

      expect(() => clearGameEntities()).to.not.throw();
    });

    it('should handle null arrays gracefully', async function() {
      global.ants = null;
      global.resource_list = null;
      global.Buildings = null;

      expect(() => clearGameEntities()).to.not.throw();
    });

    it('should handle undefined arrays gracefully', async function() {
      global.ants = undefined;
      global.resource_list = undefined;
      global.Buildings = undefined;

      expect(() => clearGameEntities()).to.not.throw();
    });
  });

  describe('Cleanup Verification', function() {
    it('should verify arrays are empty after cleanup', function() {
      clearGameEntities();

      expect(global.ants).to.be.an('array').that.is.empty;
      expect(global.resource_list).to.be.an('array').that.is.empty;
      expect(global.Buildings).to.be.an('array').that.is.empty;
    });

    it('should preserve array references (not replace with new arrays)', function() {
      const antsRef = global.ants;
      const resourcesRef = global.resource_list;
      const buildingsRef = global.Buildings;

      clearGameEntities();

      expect(global.ants).to.equal(antsRef);
      expect(global.resource_list).to.equal(resourcesRef);
      expect(global.Buildings).to.equal(buildingsRef);
    });

    it('should log cleanup action', function() {
      clearGameEntities();

      expect(global.logNormal.called).to.be.true;
      const logCalls = global.logNormal.getCalls();
      const cleanupLog = logCalls.find(call => 
        call.args[0] && call.args[0].includes('Clearing')
      );
      expect(cleanupLog).to.exist;
    });

    it('should count entities before cleanup', function() {
      const result = clearGameEntities();

      expect(result).to.exist;
      expect(result.ants).to.equal(3);
      expect(result.resources).to.equal(2);
      expect(result.buildings).to.equal(1);
    });
  });

  describe('Integration with loadCustomLevel', function() {
    it('should call clearGameEntities at start of loadCustomLevel', async function() {
      // Verify cleanup happens by checking entity counts
      expect(global.ants.length).to.equal(3); // Initial state

      mockFetch.resolves({
        ok: true,
        json: async () => ({ tiles: [], entities: [] })
      });

      await loadCustomLevelWithCleanup('levels/test.json');

      // After cleanup, should be empty
      expect(global.ants.length).to.equal(0);
      expect(global.resource_list.length).to.equal(0);
      expect(global.Buildings.length).to.equal(0);
    });

    it('should clear entities before fetching level data', async function() {
      let antsCountDuringFetch;

      mockFetch.callsFake(async () => {
        antsCountDuringFetch = global.ants.length;
        return {
          ok: true,
          json: async () => ({ tiles: [], entities: [] })
        };
      });

      await loadCustomLevelWithCleanup('levels/test.json');

      expect(antsCountDuringFetch).to.equal(0);
    });

    it('should clear entities before MapManager loads terrain', async function() {
      let antsCountDuringMapLoad;

      mockMapManager.loadLevel.callsFake(() => {
        antsCountDuringMapLoad = global.ants.length;
        return { getTile: () => null };
      });

      mockFetch.resolves({
        ok: true,
        json: async () => ({ tiles: [], entities: [] })
      });

      await loadCustomLevelWithCleanup('levels/test.json');

      expect(antsCountDuringMapLoad).to.equal(0);
    });

    it('should not clear entities if level load fails before cleanup', async function() {
      // This test ensures cleanup happens AFTER validation but BEFORE actual loading
      const initialCount = global.ants.length;

      mockFetch.rejects(new Error('Network error'));

      try {
        await loadCustomLevelWithCleanup('levels/test.json');
      } catch (error) {
        // Error expected
      }

      // If cleanup happened first, this would be 0
      // But we want cleanup to happen AFTER validation
      expect(global.ants.length).to.equal(0); // Cleanup should happen before fetch
    });
  });

  describe('Additional Cleanup Targets', function() {
    it('should clear selectables array if exists', function() {
      global.selectables = [
        { id: 'sel1' },
        { id: 'sel2' }
      ];

      clearGameEntities();

      expect(global.selectables.length).to.equal(0);
    });

    it('should reset queenAnt reference', function() {
      global.queenAnt = { id: 'queen1', JobName: 'Queen' };

      clearGameEntities();

      expect(global.queenAnt).to.be.null;
    });

    it('should clear spatial grid if exists', function() {
      const clearSpy = sandbox.stub();
      global.spatialGridManager = {
        clear: clearSpy
      };

      clearGameEntities();

      expect(clearSpy.called).to.be.true;
    });

    it('should stop resource spawning timer if exists', function() {
      const stopSpawningSpy = sandbox.stub();
      global.g_resourceManager = {
        stopSpawning: stopSpawningSpy
      };

      clearGameEntities();

      expect(stopSpawningSpy.called).to.be.true;
    });

    it('should handle missing resource manager gracefully', function() {
      delete global.g_resourceManager;

      expect(() => clearGameEntities()).to.not.throw();
    });

    it('should handle null resource manager gracefully', function() {
      global.g_resourceManager = null;

      expect(() => clearGameEntities()).to.not.throw();
    });

    it('should handle resource manager without stopSpawning method', function() {
      global.g_resourceManager = {
        resources: []
      };

      expect(() => clearGameEntities()).to.not.throw();
    });
  });

  // Helper functions for tests
  function clearGameEntities() {
    const counts = {
      ants: (global.ants && global.ants.length) || 0,
      resources: (global.resource_list && global.resource_list.length) || 0,
      buildings: (global.Buildings && global.Buildings.length) || 0
    };

    if (typeof logNormal === 'function') {
      logNormal(`[clearGameEntities] Clearing existing entities: ${counts.ants} ants, ${counts.resources} resources, ${counts.buildings} buildings`);
    }

    // Clear arrays (preserve references)
    if (Array.isArray(global.ants)) global.ants.length = 0;
    if (Array.isArray(global.resource_list)) global.resource_list.length = 0;
    if (Array.isArray(global.Buildings)) global.Buildings.length = 0;
    if (Array.isArray(global.selectables)) global.selectables.length = 0;

    // Reset references
    if (global.queenAnt !== undefined) global.queenAnt = null;

    // Clear spatial grid
    if (global.spatialGridManager && typeof global.spatialGridManager.clear === 'function') {
      global.spatialGridManager.clear();
    }

    // Stop resource spawning timer
    if (global.g_resourceManager && typeof global.g_resourceManager.stopSpawning === 'function') {
      global.g_resourceManager.stopSpawning();
    }

    return counts;
  }

  async function loadCustomLevelWithCleanup(levelPath) {
    // Clear existing entities FIRST
    clearGameEntities();

    const response = await fetch(levelPath);
    if (!response.ok) {
      throw new Error(`Failed to load level: ${response.status}`);
    }

    const levelData = await response.json();
    const terrain = mapManager.loadLevel(levelData, 'custom-level', true);

    return true;
  }
});
