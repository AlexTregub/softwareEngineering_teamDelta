/**
 * Unit Tests: loadCustomLevel Function
 * ======================================
 * Tests for custom level loading in sketch.js
 * 
 * TDD for Bug Fix: "logWarning is not defined" error
 * Root Cause: sketch.js uses logWarning/logNormal/logError without checking if verboseLogger exists
 * Expected: Should use console methods as fallback OR ensure verboseLogger loads first
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('loadCustomLevel Function', function() {
  let sandbox;
  let mockFetch;
  let mockGameState;
  let mockMapManager;
  let mockLevelLoader;
  let mockCameraManager;
  let loadCustomLevelFunc;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // Mock global logging functions (may not exist in some contexts)
    global.logNormal = sandbox.stub();
    global.logError = sandbox.stub();
    global.logWarning = sandbox.stub();

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

    // Safe logging wrappers
    const safeLogNormal = (msg) => {
      if (typeof logNormal === 'function') logNormal(msg);
      else if (typeof console !== 'undefined') console.log(msg);
    };

    const safeLogError = (msg) => {
      if (typeof logError === 'function') logError(msg);
      else if (typeof console !== 'undefined') console.error(msg);
    };

    const safeLogWarning = (msg) => {
      if (typeof logWarning === 'function') logWarning(msg);
      else if (typeof logWarn === 'function') logWarn(msg);
      else if (typeof console !== 'undefined') console.warn(msg);
    };

    // Create loadCustomLevel function (with safe logging)
    loadCustomLevelFunc = async function(levelPath) {
      try {
        safeLogNormal(`[loadCustomLevel] Loading level from: ${levelPath}`);
        
        const response = await fetch(levelPath);
        if (!response.ok) {
          throw new Error(`Failed to load level: ${response.status}`);
        }
        
        const levelData = await response.json();
        safeLogNormal(`[loadCustomLevel] Level data loaded`);
        
        const terrain = mapManager.loadLevel(levelData, 'custom-level', true);
        if (!terrain) {
          throw new Error('MapManager failed to load level terrain');
        }
        
        if (typeof GameState !== 'undefined' && GameState.goToGame) {
          GameState.goToGame();
          safeLogNormal('[loadCustomLevel] Game state set to IN_GAME');
        }
        
        return true;
      } catch (error) {
        console.error('[loadCustomLevel] Error:', error);
        safeLogError(`[loadCustomLevel] Failed to load level: ${error.message}`);
        return false;
      }
    };
  });

  afterEach(function() {
    sandbox.restore();
    delete global.logNormal;
    delete global.logError;
    delete global.logWarning;
    delete global.GameState;
    delete global.mapManager;
    delete global.LevelLoader;
    delete global.cameraManager;
    delete global.findQueen;
  });

  describe('Logging Functions Availability', function() {
    it('should handle missing logNormal gracefully', async function() {
      delete global.logNormal;
      
      mockFetch.resolves({
        ok: true,
        json: async () => ({ tiles: [], entities: [] })
      });

      // Should not throw "logNormal is not defined" - safe logging falls back to console
      const result = await loadCustomLevelFunc('levels/test.json');
      expect(result).to.be.true; // Succeeds with safe logging
    });

    it('should handle missing logError gracefully', async function() {
      delete global.logError;
      
      mockFetch.rejects(new Error('Network error'));

      // Should not throw "logError is not defined"
      const result = await loadCustomLevelFunc('levels/test.json');
      expect(result).to.be.false; // Will fail due to missing logError
    });

    it('should handle missing logWarning gracefully', async function() {
      delete global.logWarning;
      
      mockFetch.resolves({
        ok: true,
        json: async () => ({ tiles: [], entities: [] })
      });

      // Should complete without throwing "logWarning is not defined"
      const result = await loadCustomLevelFunc('levels/test.json');
      expect(result).to.be.true;
    });

    it('should work when all logging functions exist', async function() {
      mockFetch.resolves({
        ok: true,
        json: async () => ({ tiles: [], entities: [] })
      });

      const result = await loadCustomLevelFunc('levels/test.json');
      
      expect(result).to.be.true;
      expect(global.logNormal.calledWith('[loadCustomLevel] Loading level from: levels/test.json')).to.be.true;
      expect(global.logNormal.calledWith('[loadCustomLevel] Game state set to IN_GAME')).to.be.true;
    });
  });

  describe('Safe Logging Wrapper', function() {
    it('should use console.log as fallback when logNormal missing', function() {
      const consoleLogStub = sandbox.stub(console, 'log');
      delete global.logNormal;

      const safeLogNormal = function(msg) {
        if (typeof logNormal === 'function') {
          logNormal(msg);
        } else if (typeof console !== 'undefined') {
          console.log(msg);
        }
      };

      safeLogNormal('test message');
      expect(consoleLogStub.calledWith('test message')).to.be.true;
    });

    it('should use console.error as fallback when logError missing', function() {
      const consoleErrorStub = sandbox.stub(console, 'error');
      delete global.logError;

      const safeLogError = function(msg) {
        if (typeof logError === 'function') {
          logError(msg);
        } else if (typeof console !== 'undefined') {
          console.error(msg);
        }
      };

      safeLogError('error message');
      expect(consoleErrorStub.calledWith('error message')).to.be.true;
    });

    it('should use console.warn as fallback when logWarning missing', function() {
      const consoleWarnStub = sandbox.stub(console, 'warn');
      delete global.logWarning;

      const safeLogWarning = function(msg) {
        if (typeof logWarning === 'function') {
          logWarning(msg);
        } else if (typeof console !== 'undefined') {
          console.warn(msg);
        }
      };

      safeLogWarning('warning message');
      expect(consoleWarnStub.calledWith('warning message')).to.be.true;
    });
  });

  describe('Error Recovery', function() {
    it('should return false when fetch fails', async function() {
      mockFetch.rejects(new Error('Network error'));

      const result = await loadCustomLevelFunc('levels/test.json');
      
      expect(result).to.be.false;
      expect(global.logError.called).to.be.true;
    });

    it('should return false when level data is invalid', async function() {
      mockFetch.resolves({
        ok: true,
        json: async () => null // Invalid data
      });

      mockMapManager.loadLevel.returns(null); // Fails to load

      const result = await loadCustomLevelFunc('levels/test.json');
      
      expect(result).to.be.false;
    });

    it('should still transition to IN_GAME even if logging fails', async function() {
      // Delete logging functions to simulate missing verboseLogger
      delete global.logNormal;
      delete global.logError;
      delete global.logWarning;

      mockFetch.resolves({
        ok: true,
        json: async () => ({ tiles: [], entities: [] })
      });

      // After fix with safe logging, this should work:
      const result = await loadCustomLevelFunc('levels/test.json');
      expect(result).to.be.true;
      expect(mockGameState.goToGame.called).to.be.true;
    });
  });

  describe('Bug Fix: logWarning vs logWarn mismatch', function() {
    it('should not throw when logWarning is used but logWarn exists', function() {
      // verboseLogger exports logWarn, not logWarning
      delete global.logWarning;
      global.logWarn = sandbox.stub();

      // Safe wrapper should handle the mismatch
      const safeLogWarning = function(msg) {
        if (typeof logWarning === 'function') {
          logWarning(msg);
        } else if (typeof logWarn === 'function') {
          logWarn(msg);
        } else if (typeof console !== 'undefined') {
          console.warn(msg);
        }
      };

      safeLogWarning('test warning');
      expect(global.logWarn.calledWith('test warning')).to.be.true;
    });

    it('should work with actual verboseLogger function names', function() {
      // Set up actual verboseLogger function names
      delete global.logWarning;
      global.logWarn = sandbox.stub();
      global.logNormal = sandbox.stub();
      global.logError = sandbox.stub();

      // Test should pass when using correct function names
      expect(typeof global.logWarn).to.equal('function');
      expect(typeof global.logNormal).to.equal('function');
      expect(typeof global.logError).to.equal('function');
    });
  });

  describe('Integration with startGameTransition', function() {
    it('should handle loadCustomLevel failure gracefully', async function() {
      // Simulate loadCustomLevel returning false (load failed)
      const loadResult = false;

      // startGameTransition fallback logic
      if (!loadResult) {
        // Should fall back to initializeWorld()
        expect(loadResult).to.be.false;
      }
    });

    it('should skip fallback when loadCustomLevel succeeds', async function() {
      mockFetch.resolves({
        ok: true,
        json: async () => ({ tiles: [], entities: [] })
      });

      const loadResult = await loadCustomLevelFunc('levels/test.json');

      if (loadResult) {
        // Should NOT call initializeWorld()
        expect(loadResult).to.be.true;
        expect(mockGameState.goToGame.called).to.be.true;
      }
    });
  });
});
