/**
 * @file AntManager.lifecycle.test.js
 * @description Unit tests for AntManager lifecycle management methods (Phase 3.4.3)
 * 
 * Tests pauseAnt(), resumeAnt(), pauseAll(), resumeAll(), and isPaused() methods.
 * These methods control the update cycle of individual or all ants without destroying them.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment, loadAntMVCStack } = require('../../helpers/mvcTestHelpers');

setupTestEnvironment({ rendering: true, sprite: true });

describe('AntManager - Lifecycle Management (Phase 3.4.3)', function() {
  let AntManager, antManager;

  before(function() {
    // Load complete Ant MVC stack using helper
    const loadedClasses = loadAntMVCStack();
    AntManager = loadedClasses.AntManager;
  });

  beforeEach(function() {
    antManager = AntManager.getInstance();
    antManager._ants.clear(); // Clear registry
    antManager._pausedAnts = new Set(); // Initialize paused set
  });

  afterEach(function() {
    cleanupTestEnvironment();
  });

  describe('pauseAnt()', function() {
    it('should pause an individual ant by ID', function() {
      const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });

      antManager.pauseAnt(ant.antIndex);

      expect(antManager.isPaused(ant.antIndex)).to.be.true;
    });

    it('should add ant ID to paused set', function() {
      const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });

      antManager.pauseAnt(ant.antIndex);

      expect(antManager._pausedAnts.has(ant.antIndex)).to.be.true;
    });

    it('should not throw error if ant ID does not exist', function() {
      expect(() => antManager.pauseAnt(99999)).to.not.throw();
    });

    it('should handle pausing already paused ant (idempotent)', function() {
      const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });

      antManager.pauseAnt(ant.antIndex);
      antManager.pauseAnt(ant.antIndex); // Pause again

      expect(antManager.isPaused(ant.antIndex)).to.be.true;
      expect(antManager._pausedAnts.size).to.equal(1);
    });
  });

  describe('resumeAnt()', function() {
    it('should resume an individual paused ant by ID', function() {
      const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });
      antManager.pauseAnt(ant.antIndex);

      antManager.resumeAnt(ant.antIndex);

      expect(antManager.isPaused(ant.antIndex)).to.be.false;
    });

    it('should remove ant ID from paused set', function() {
      const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });
      antManager.pauseAnt(ant.antIndex);

      antManager.resumeAnt(ant.antIndex);

      expect(antManager._pausedAnts.has(ant.antIndex)).to.be.false;
    });

    it('should not throw error if ant ID does not exist', function() {
      expect(() => antManager.resumeAnt(99999)).to.not.throw();
    });

    it('should handle resuming already active ant (idempotent)', function() {
      const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });

      antManager.resumeAnt(ant.antIndex); // Resume without pausing

      expect(antManager.isPaused(ant.antIndex)).to.be.false;
    });
  });

  describe('pauseAll()', function() {
    it('should pause all registered ants', function() {
      const ant1 = antManager.createAnt(100, 100, { jobName: 'Worker' });
      const ant2 = antManager.createAnt(200, 200, { jobName: 'Warrior' });
      const ant3 = antManager.createAnt(300, 300, { jobName: 'Scout' });

      antManager.pauseAll();

      expect(antManager.isPaused(ant1.antIndex)).to.be.true;
      expect(antManager.isPaused(ant2.antIndex)).to.be.true;
      expect(antManager.isPaused(ant3.antIndex)).to.be.true;
    });

    it('should add all ant IDs to paused set', function() {
      const ant1 = antManager.createAnt(100, 100, { jobName: 'Worker' });
      const ant2 = antManager.createAnt(200, 200, { jobName: 'Warrior' });

      antManager.pauseAll();

      expect(antManager._pausedAnts.size).to.equal(2);
      expect(antManager._pausedAnts.has(ant1.antIndex)).to.be.true;
      expect(antManager._pausedAnts.has(ant2.antIndex)).to.be.true;
    });

    it('should handle empty ant registry gracefully', function() {
      expect(() => antManager.pauseAll()).to.not.throw();
      expect(antManager._pausedAnts.size).to.equal(0);
    });
  });

  describe('resumeAll()', function() {
    it('should resume all paused ants', function() {
      const ant1 = antManager.createAnt(100, 100, { jobName: 'Worker' });
      const ant2 = antManager.createAnt(200, 200, { jobName: 'Warrior' });
      const ant3 = antManager.createAnt(300, 300, { jobName: 'Scout' });
      antManager.pauseAll();

      antManager.resumeAll();

      expect(antManager.isPaused(ant1.antIndex)).to.be.false;
      expect(antManager.isPaused(ant2.antIndex)).to.be.false;
      expect(antManager.isPaused(ant3.antIndex)).to.be.false;
    });

    it('should clear paused set completely', function() {
      antManager.createAnt(100, 100, { jobName: 'Worker' });
      antManager.createAnt(200, 200, { jobName: 'Warrior' });
      antManager.pauseAll();

      antManager.resumeAll();

      expect(antManager._pausedAnts.size).to.equal(0);
    });

    it('should handle empty paused set gracefully', function() {
      expect(() => antManager.resumeAll()).to.not.throw();
      expect(antManager._pausedAnts.size).to.equal(0);
    });
  });

  describe('isPaused()', function() {
    it('should return true for paused ant', function() {
      const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });
      antManager.pauseAnt(ant.antIndex);

      expect(antManager.isPaused(ant.antIndex)).to.be.true;
    });

    it('should return false for active ant', function() {
      const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });

      expect(antManager.isPaused(ant.antIndex)).to.be.false;
    });

    it('should return false for nonexistent ant ID', function() {
      expect(antManager.isPaused(99999)).to.be.false;
    });
  });

  describe('Integration with update cycle', function() {
    it('should skip update() for paused ants during updateAll()', function() {
      const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });
      const updateSpy = sinon.spy(ant, 'update');

      antManager.pauseAnt(ant.antIndex);
      antManager.updateAll();

      expect(updateSpy.called).to.be.false;
    });

    it('should call update() for active ants during updateAll()', function() {
      const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });
      const updateSpy = sinon.spy(ant, 'update');

      antManager.updateAll();

      expect(updateSpy.calledOnce).to.be.true;
    });
  });
});
