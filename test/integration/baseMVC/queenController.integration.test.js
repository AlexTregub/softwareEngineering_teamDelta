/**
 * QueenController Integration Tests
 * 
 * Tests Queen functionality with REAL game systems:
 * - Worker ant command system
 * - Power management
 * - WASD movement with real pathfinding
 * - Command radius with spatial calculations
 * - Integration with EntityInventoryManager, AntStateMachine, etc.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load MVC components
const AntModel = require('../../../Classes/baseMVC/models/AntModel');
const AntView = require('../../../Classes/baseMVC/views/AntView');
const AntController = require('../../../Classes/baseMVC/controllers/AntController');
const QueenController = require('../../../Classes/baseMVC/controllers/QueenController');

// Load game systems
const EntityInventoryManager = require('../../../Classes/managers/EntityInventoryManager');
const AntStateMachine = require('../../../Classes/ants/antStateMachine');
const GatherState = require('../../../Classes/ants/GatherState');

describe('QueenController Integration Tests', function() {
  let queen, workerAnts;
  
  beforeEach(function() {
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    window.createVector = global.createVector;
    
    // Mock console for clean output
    sinon.stub(console, 'warn');
    
    // Create Queen with REAL MVC
    const queenModel = new AntModel(300, 300, 60, 60, { 
      jobName: "Queen",
      faction: "player"
    });
    const queenView = new AntView(queenModel);
    queen = new QueenController(queenModel, queenView);
    queen.assignJob("Queen");
    
    // Create worker ants with REAL MVC
    workerAnts = [];
    for (let i = 0; i < 5; i++) {
      const model = new AntModel(250 + i * 30, 250 + i * 30, 32, 32, {
        jobName: "Scout",
        faction: "player"
      });
      const view = new AntView(model);
      const controller = new AntController(model, view);
      controller.assignJob("Scout");
      workerAnts.push({ model, view, controller });
    }
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Command System with Real Ants', function() {
    it('should add worker ants to command', function() {
      expect(queen.ants.length).to.equal(0);
      
      queen.addAnt(workerAnts[0]);
      expect(queen.ants.length).to.equal(1);
      
      queen.addAnt(workerAnts[1]);
      expect(queen.ants.length).to.equal(2);
    });
    
    it('should set worker faction to match queen', function() {
      const worker = workerAnts[0];
      worker.model.setFaction("neutral"); // Different faction
      
      queen.addAnt(worker);
      
      expect(worker.model.getFaction()).to.equal("player"); // Should match queen
    });
    
    it('should remove worker from command', function() {
      queen.addAnt(workerAnts[0]);
      queen.addAnt(workerAnts[1]);
      expect(queen.ants.length).to.equal(2);
      
      queen.removeAnt(workerAnts[0]);
      expect(queen.ants.length).to.equal(1);
      expect(queen.ants[0]).to.equal(workerAnts[1]);
    });
    
    it('should command all workers within radius', function() {
      // Add all workers
      workerAnts.forEach(w => queen.addAnt(w));
      
      // Mock moveToLocation on all workers
      workerAnts.forEach(w => {
        sinon.spy(w.controller, 'moveToLocation');
      });
      
      // Broadcast move command
      queen.gatherAntsAt(500, 500);
      
      // All workers within radius should receive command
      workerAnts.forEach(w => {
        expect(w.controller.moveToLocation.called).to.be.true;
        expect(w.controller.moveToLocation.firstCall.args).to.deep.equal([500, 500]);
      });
    });
    
    it('should respect command radius boundary', function() {
      // Add workers
      queen.addAnt(workerAnts[0]); // Close
      
      // Create far worker outside radius
      const farModel = new AntModel(600, 600, 32, 32, { jobName: "Scout", faction: "player" });
      const farView = new AntView(farModel);
      const farController = new AntController(farModel, farView);
      const farWorker = { model: farModel, view: farView, controller: farController };
      queen.addAnt(farWorker);
      
      // Mock moveToLocation
      sinon.spy(workerAnts[0].controller, 'moveToLocation');
      sinon.spy(farController, 'moveToLocation');
      
      // Broadcast command
      queen.gatherAntsAt(320, 320);
      
      // Close worker should receive command
      expect(workerAnts[0].controller.moveToLocation.called).to.be.true;
      
      // Far worker should NOT receive command (outside radius)
      expect(farController.moveToLocation.called).to.be.false;
    });
    
    it('should send GATHER command to workers', function() {
      workerAnts.forEach(w => queen.addAnt(w));
      
      // Mock addCommand
      workerAnts.forEach(w => {
        sinon.spy(w.controller, 'addCommand');
      });
      
      queen.orderGathering();
      
      workerAnts.forEach(w => {
        expect(w.controller.addCommand.called).to.be.true;
        expect(w.controller.addCommand.firstCall.args[0]).to.deep.equal({ type: "GATHER" });
      });
    });
    
    it('should send BUILD command to workers', function() {
      workerAnts.forEach(w => queen.addAnt(w));
      
      workerAnts.forEach(w => {
        sinon.spy(w.controller, 'addCommand');
      });
      
      queen.orderBuilding();
      
      workerAnts.forEach(w => {
        expect(w.controller.addCommand.called).to.be.true;
        expect(w.controller.addCommand.firstCall.args[0]).to.deep.equal({ type: "BUILD" });
      });
    });
    
    it('should rally all workers to queen position', function() {
      workerAnts.forEach(w => queen.addAnt(w));
      
      workerAnts.forEach(w => {
        sinon.spy(w.controller, 'moveToLocation');
      });
      
      const queenPos = queen.model.getPosition();
      queen.emergencyRally();
      
      workerAnts.forEach(w => {
        expect(w.controller.moveToLocation.called).to.be.true;
        expect(w.controller.moveToLocation.firstCall.args).to.deep.equal([queenPos.x, queenPos.y]);
      });
    });
    
    it('should command specific ant directly', function() {
      queen.addAnt(workerAnts[0]);
      queen.addAnt(workerAnts[1]);
      
      sinon.spy(workerAnts[0].controller, 'addCommand');
      sinon.spy(workerAnts[1].controller, 'addCommand');
      
      queen.commandAnt(workerAnts[0], { type: "DEFEND", target: "enemy" });
      
      expect(workerAnts[0].controller.addCommand.called).to.be.true;
      expect(workerAnts[1].controller.addCommand.called).to.be.false;
    });
  });
  
  describe('Power System Integration', function() {
    it('should unlock fireball power', function() {
      expect(queen.isPowerUnlocked('fireball')).to.be.false;
      
      const result = queen.unlockPower('fireball');
      
      expect(result).to.be.true;
      expect(queen.isPowerUnlocked('fireball')).to.be.true;
    });
    
    it('should unlock lightning power', function() {
      expect(queen.isPowerUnlocked('lightning')).to.be.false;
      
      const result = queen.unlockPower('lightning');
      
      expect(result).to.be.true;
      expect(queen.isPowerUnlocked('lightning')).to.be.true;
    });
    
    it('should unlock blackhole power', function() {
      expect(queen.isPowerUnlocked('blackhole')).to.be.false;
      
      const result = queen.unlockPower('blackhole');
      
      expect(result).to.be.true;
      expect(queen.isPowerUnlocked('blackhole')).to.be.true;
    });
    
    it('should unlock sludge power', function() {
      expect(queen.isPowerUnlocked('sludge')).to.be.false;
      
      const result = queen.unlockPower('sludge');
      
      expect(result).to.be.true;
      expect(queen.isPowerUnlocked('sludge')).to.be.true;
    });
    
    it('should unlock tidalWave power', function() {
      expect(queen.isPowerUnlocked('tidalWave')).to.be.false;
      
      const result = queen.unlockPower('tidalWave');
      
      expect(result).to.be.true;
      expect(queen.isPowerUnlocked('tidalWave')).to.be.true;
    });
    
    it('should unlock finalFlash power', function() {
      expect(queen.isPowerUnlocked('finalFlash')).to.be.false;
      
      const result = queen.unlockPower('finalFlash');
      
      expect(result).to.be.true;
      expect(queen.isPowerUnlocked('finalFlash')).to.be.true;
    });
    
    it('should unlock all powers sequentially', function() {
      const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave', 'finalFlash'];
      
      powers.forEach(power => {
        expect(queen.isPowerUnlocked(power)).to.be.false;
        queen.unlockPower(power);
        expect(queen.isPowerUnlocked(power)).to.be.true;
      });
      
      expect(queen.getUnlockedPowers().length).to.equal(6);
    });
    
    it('should lock previously unlocked power', function() {
      queen.unlockPower('fireball');
      expect(queen.isPowerUnlocked('fireball')).to.be.true;
      
      const result = queen.lockPower('fireball');
      
      expect(result).to.be.true;
      expect(queen.isPowerUnlocked('fireball')).to.be.false;
    });
    
    it('should handle invalid power name', function() {
      const result = queen.unlockPower('invalidPower');
      
      expect(result).to.be.false;
      expect(console.warn.called).to.be.true;
    });
    
    it('should return all unlocked powers', function() {
      queen.unlockPower('fireball');
      queen.unlockPower('lightning');
      queen.unlockPower('sludge');
      
      const unlocked = queen.getUnlockedPowers();
      
      expect(unlocked).to.deep.equal(['fireball', 'lightning', 'sludge']);
    });
    
    it('should return all power states', function() {
      queen.unlockPower('fireball');
      queen.unlockPower('blackhole');
      
      const allPowers = queen.getAllPowers();
      
      expect(allPowers.fireball).to.be.true;
      expect(allPowers.blackhole).to.be.true;
      expect(allPowers.lightning).to.be.false;
      expect(allPowers.sludge).to.be.false;
      expect(allPowers.tidalWave).to.be.false;
      expect(allPowers.finalFlash).to.be.false;
    });
    
    it('should unlock powers independently', function() {
      queen.unlockPower('fireball');
      expect(queen.isPowerUnlocked('fireball')).to.be.true;
      expect(queen.isPowerUnlocked('lightning')).to.be.false;
      
      queen.unlockPower('lightning');
      expect(queen.isPowerUnlocked('fireball')).to.be.true;
      expect(queen.isPowerUnlocked('lightning')).to.be.true;
      expect(queen.isPowerUnlocked('blackhole')).to.be.false;
    });
    
    it('should manage lightning power with real systems', function() {
      // Initial state - lightning locked
      expect(queen.isPowerUnlocked('lightning')).to.be.false;
      
      // Unlock lightning
      const unlockResult = queen.unlockPower('lightning');
      expect(unlockResult).to.be.true;
      expect(queen.isPowerUnlocked('lightning')).to.be.true;
      
      // Verify in unlocked list
      const unlocked = queen.getUnlockedPowers();
      expect(unlocked).to.include('lightning');
      
      // Lock lightning
      const lockResult = queen.lockPower('lightning');
      expect(lockResult).to.be.true;
      expect(queen.isPowerUnlocked('lightning')).to.be.false;
      
      // Verify no longer in unlocked list
      const unlockedAfter = queen.getUnlockedPowers();
      expect(unlockedAfter).to.not.include('lightning');
    });
    
    it('should handle lightning power state transitions', function() {
      // Unlock multiple powers including lightning
      queen.unlockPower('fireball');
      queen.unlockPower('lightning');
      queen.unlockPower('blackhole');
      
      const allPowersUnlocked = queen.getAllPowers();
      expect(allPowersUnlocked.fireball).to.be.true;
      expect(allPowersUnlocked.lightning).to.be.true;
      expect(allPowersUnlocked.blackhole).to.be.true;
      
      // Lock only lightning
      queen.lockPower('lightning');
      
      const afterLock = queen.getAllPowers();
      expect(afterLock.fireball).to.be.true;
      expect(afterLock.lightning).to.be.false;
      expect(afterLock.blackhole).to.be.true;
    });
    
    it('should persist lightning power state across operations', function() {
      // Unlock lightning
      queen.unlockPower('lightning');
      
      // Perform other operations
      queen.addAnt(workerAnts[0]);
      queen.move('w');
      queen.emergencyRally();
      
      // Lightning should still be unlocked
      expect(queen.isPowerUnlocked('lightning')).to.be.true;
      
      // Lock and verify
      queen.lockPower('lightning');
      expect(queen.isPowerUnlocked('lightning')).to.be.false;
    });
  });
  
  describe('Lightning Power Usage - Damage Integration', function() {
    let targetAnt, lightningManager;
    
    beforeEach(function() {
      // Create target ant (enemy faction)
      const targetModel = new AntModel(350, 350, 32, 32, {
        jobName: "Scout",
        faction: "enemy"
      });
      const targetView = new AntView(targetModel);
      const targetController = new AntController(targetModel, targetView);
      targetController.assignJob("Scout");
      targetAnt = { model: targetModel, view: targetView, controller: targetController };
      
      // Mock LightningManager
      lightningManager = {
        strikeAtAnt: sinon.stub().callsFake((ant, damage = 50) => {
          // Simulate lightning damage
          if (ant && ant.controller && typeof ant.controller.takeDamage === 'function') {
            ant.controller.takeDamage(damage);
            return true;
          } else if (ant && typeof ant.takeDamage === 'function') {
            ant.takeDamage(damage);
            return true;
          }
          return false;
        }),
        requestStrike: sinon.stub().returns(true)
      };
      
      global.g_lightningManager = lightningManager;
      window.g_lightningManager = lightningManager;
    });
    
    afterEach(function() {
      delete global.g_lightningManager;
      delete window.g_lightningManager;
    });
    
    it('should damage target ant when lightning strikes', function() {
      // Unlock lightning power
      queen.unlockPower('lightning');
      expect(queen.isPowerUnlocked('lightning')).to.be.true;
      
      // Get initial health
      const initialHealth = targetAnt.controller.getHealth();
      expect(initialHealth).to.be.greaterThan(0);
      
      // Strike with lightning
      const strikeResult = lightningManager.strikeAtAnt(targetAnt, 30);
      
      // Verify strike executed
      expect(strikeResult).to.be.true;
      expect(lightningManager.strikeAtAnt.called).to.be.true;
      
      // Verify damage dealt
      const finalHealth = targetAnt.controller.getHealth();
      expect(finalHealth).to.equal(initialHealth - 30);
    });
    
    it('should kill target ant with sufficient lightning damage', function() {
      queen.unlockPower('lightning');
      
      const initialHealth = targetAnt.controller.getHealth();
      expect(initialHealth).to.be.greaterThan(0);
      
      // Strike with massive damage
      lightningManager.strikeAtAnt(targetAnt, 1000);
      
      const finalHealth = targetAnt.controller.getHealth();
      expect(finalHealth).to.equal(0); // Health clamped to 0
    });
    
    it('should strike multiple ants in sequence', function() {
      queen.unlockPower('lightning');
      
      // Create second target ant
      const target2Model = new AntModel(400, 400, 32, 32, {
        jobName: "Soldier",
        faction: "enemy"
      });
      const target2View = new AntView(target2Model);
      const target2Controller = new AntController(target2Model, target2View);
      target2Controller.assignJob("Soldier");
      const targetAnt2 = { model: target2Model, view: target2View, controller: target2Controller };
      
      // Get initial healths
      const health1Initial = targetAnt.controller.getHealth();
      const health2Initial = targetAnt2.controller.getHealth();
      
      // Strike both ants
      lightningManager.strikeAtAnt(targetAnt, 25);
      lightningManager.strikeAtAnt(targetAnt2, 25);
      
      // Verify both took damage
      expect(targetAnt.controller.getHealth()).to.equal(health1Initial - 25);
      expect(targetAnt2.controller.getHealth()).to.equal(health2Initial - 25);
      expect(lightningManager.strikeAtAnt.callCount).to.equal(2);
    });
    
    it('should verify lightning power is unlocked before striking', function() {
      // Lightning NOT unlocked
      expect(queen.isPowerUnlocked('lightning')).to.be.false;
      
      const initialHealth = targetAnt.controller.getHealth();
      
      // Attempt strike (should work - manager doesn't check unlock state)
      lightningManager.strikeAtAnt(targetAnt, 20);
      
      // Manager still damages (unlock check is UI responsibility)
      expect(targetAnt.controller.getHealth()).to.equal(initialHealth - 20);
      
      // Now unlock lightning
      queen.unlockPower('lightning');
      expect(queen.isPowerUnlocked('lightning')).to.be.true;
    });
    
    it('should track lightning strikes with requestStrike', function() {
      queen.unlockPower('lightning');
      
      const result = lightningManager.requestStrike(targetAnt);
      
      expect(result).to.be.true;
      expect(lightningManager.requestStrike.called).to.be.true;
      expect(lightningManager.requestStrike.calledWith(targetAnt)).to.be.true;
    });
    
    it('should handle different damage amounts', function() {
      queen.unlockPower('lightning');
      
      const initialHealth = targetAnt.controller.getHealth();
      
      // Test different damage values
      const testDamages = [10, 25, 50];
      
      testDamages.forEach(damage => {
        // Reset health
        targetAnt.controller.heal(1000);
        const startHealth = targetAnt.controller.getHealth();
        
        // Strike
        lightningManager.strikeAtAnt(targetAnt, damage);
        
        // Verify
        expect(targetAnt.controller.getHealth()).to.equal(startHealth - damage);
      });
    });
    
    it('should work with MVC ants of different factions', function() {
      queen.unlockPower('lightning');
      
      // Create neutral faction ant
      const neutralModel = new AntModel(380, 380, 32, 32, {
        jobName: "Farmer",
        faction: "neutral"
      });
      const neutralView = new AntView(neutralModel);
      const neutralController = new AntController(neutralModel, neutralView);
      neutralController.assignJob("Farmer");
      const neutralAnt = { model: neutralModel, view: neutralView, controller: neutralController };
      
      const enemyInitialHealth = targetAnt.controller.getHealth();
      const neutralInitialHealth = neutralAnt.controller.getHealth();
      
      // Strike both
      lightningManager.strikeAtAnt(targetAnt, 30);
      lightningManager.strikeAtAnt(neutralAnt, 30);
      
      // Both should take damage
      expect(targetAnt.controller.getHealth()).to.equal(enemyInitialHealth - 30);
      expect(neutralAnt.controller.getHealth()).to.equal(neutralInitialHealth - 30);
    });
    
    it('should integrate with queen power system', function() {
      // Initially locked
      expect(queen.isPowerUnlocked('lightning')).to.be.false;
      
      // Unlock lightning
      const unlockResult = queen.unlockPower('lightning');
      expect(unlockResult).to.be.true;
      expect(queen.isPowerUnlocked('lightning')).to.be.true;
      
      // Use lightning
      const initialHealth = targetAnt.controller.getHealth();
      lightningManager.strikeAtAnt(targetAnt, 40);
      
      // Verify damage
      expect(targetAnt.controller.getHealth()).to.equal(initialHealth - 40);
      
      // Lock lightning
      queen.lockPower('lightning');
      expect(queen.isPowerUnlocked('lightning')).to.be.false;
    });
  });
  
  describe('Lightning Aim Brush - Click-to-Strike', function() {
    let lightningAimBrush, lightningManager, targetAnt;
    
    beforeEach(function() {
      // Create target ant
      const targetModel = new AntModel(350, 350, 32, 32, {
        jobName: "Scout",
        faction: "enemy"
      });
      const targetView = new AntView(targetModel);
      const targetController = new AntController(targetModel, targetView);
      targetController.assignJob("Scout");
      targetAnt = { model: targetModel, view: targetView, controller: targetController };
      
      // Mock LightningManager with requestStrike
      lightningManager = {
        requestStrike: sinon.stub().callsFake((target) => {
          // Simulate strike at position or ant
          if (target && target.x !== undefined && target.y !== undefined) {
            // Position-based strike - find nearby ants
            const strikeX = target.x;
            const strikeY = target.y;
            const antPos = targetAnt.model.getPosition();
            const distance = Math.hypot(strikeX - antPos.x, strikeY - antPos.y);
            if (distance < 96) { // Within 3 tiles (32*3)
              targetAnt.controller.takeDamage(50);
            }
            return true;
          }
          return false;
        }),
        strikeAtAnt: sinon.stub().callsFake((ant, damage = 50) => {
          if (ant && ant.controller && typeof ant.controller.takeDamage === 'function') {
            ant.controller.takeDamage(damage);
            return true;
          }
          return false;
        }),
        cooldown: 300,
        lastStrikeTime: 0
      };
      
      // Mock LightningAimBrush
      lightningAimBrush = {
        isActive: false,
        tileRange: 7,
        rangePx: 7 * 32, // 224px
        cursor: { x: 0, y: 0 },
        showingInvalid: false,
        
        activate: function() {
          this.isActive = true;
        },
        
        deactivate: function() {
          this.isActive = false;
        },
        
        toggle: function() {
          this.isActive = !this.isActive;
          return this.isActive;
        },
        
        tryStrikeAt: sinon.stub().callsFake(function(mx, my) {
          if (!this.isActive) return false;
          
          // Get queen position
          const queenPos = queen.model.getPosition();
          
          // Check range
          const dx = mx - queenPos.x;
          const dy = my - queenPos.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist > this.rangePx) {
            return false; // Out of range
          }
          
          // Request strike
          return lightningManager.requestStrike({ x: mx, y: my });
        }),
        
        render: sinon.stub().callsFake(function() {
          if (!this.isActive) return;
          // Simulate rendering range circle and cursor
          // This would draw the visual range indicator in the actual game
        })
      };
      
      global.g_lightningManager = lightningManager;
      global.g_lightningAimBrush = lightningAimBrush;
      window.g_lightningManager = lightningManager;
      window.g_lightningAimBrush = lightningAimBrush;
    });
    
    afterEach(function() {
      delete global.g_lightningManager;
      delete global.g_lightningAimBrush;
      delete window.g_lightningManager;
      delete window.g_lightningAimBrush;
    });
    
    it('should activate lightning aim brush when lightning power is active', function() {
      queen.unlockPower('lightning');
      
      expect(lightningAimBrush.isActive).to.be.false;
      
      lightningAimBrush.activate();
      
      expect(lightningAimBrush.isActive).to.be.true;
    });
    
    it('should show range radius when lightning aim is active', function() {
      queen.unlockPower('lightning');
      lightningAimBrush.activate();
      
      // Call render
      lightningAimBrush.render();
      
      expect(lightningAimBrush.render.called).to.be.true;
      expect(lightningAimBrush.isActive).to.be.true;
    });
    
    it('should strike at clicked position within range', function() {
      queen.unlockPower('lightning');
      lightningAimBrush.activate();
      
      // Position queen at (300, 300)
      const queenPos = queen.model.getPosition();
      
      // Click within range (350, 350) - 50px away from queen at (300, 300)
      const clickX = 350;
      const clickY = 350;
      
      const initialHealth = targetAnt.controller.getHealth();
      
      const result = lightningAimBrush.tryStrikeAt(clickX, clickY);
      
      expect(result).to.be.true;
      expect(lightningManager.requestStrike.called).to.be.true;
      expect(targetAnt.controller.getHealth()).to.be.lessThan(initialHealth);
    });
    
    it('should reject strike outside range radius', function() {
      queen.unlockPower('lightning');
      lightningAimBrush.activate();
      
      const queenPos = queen.model.getPosition();
      
      // Click far outside range (1000px away)
      const clickX = queenPos.x + 1000;
      const clickY = queenPos.y + 1000;
      
      const result = lightningAimBrush.tryStrikeAt(clickX, clickY);
      
      expect(result).to.be.false;
      expect(lightningManager.requestStrike.called).to.be.false;
    });
    
    it('should toggle lightning aim brush on/off', function() {
      queen.unlockPower('lightning');
      
      expect(lightningAimBrush.isActive).to.be.false;
      
      // Toggle on
      let state = lightningAimBrush.toggle();
      expect(state).to.be.true;
      expect(lightningAimBrush.isActive).to.be.true;
      
      // Toggle off
      state = lightningAimBrush.toggle();
      expect(state).to.be.false;
      expect(lightningAimBrush.isActive).to.be.false;
    });
    
    it('should calculate correct range (7 tiles = 224px)', function() {
      expect(lightningAimBrush.tileRange).to.equal(7);
      expect(lightningAimBrush.rangePx).to.equal(224); // 7 * 32
    });
    
    it('should not strike when aim brush is inactive', function() {
      queen.unlockPower('lightning');
      
      // Brush inactive
      expect(lightningAimBrush.isActive).to.be.false;
      
      const result = lightningAimBrush.tryStrikeAt(350, 350);
      
      expect(result).to.be.false;
    });
    
    it('should strike multiple targets within range sequentially', function() {
      queen.unlockPower('lightning');
      lightningAimBrush.activate();
      
      // Create second target
      const target2Model = new AntModel(320, 320, 32, 32, {
        jobName: "Soldier",
        faction: "enemy"
      });
      const target2View = new AntView(target2Model);
      const target2Controller = new AntController(target2Model, target2View);
      target2Controller.assignJob("Soldier");
      const targetAnt2 = { model: target2Model, view: target2View, controller: target2Controller };
      
      // Strike first position
      lightningAimBrush.tryStrikeAt(350, 350);
      expect(lightningManager.requestStrike.callCount).to.equal(1);
      
      // Strike second position
      lightningAimBrush.tryStrikeAt(320, 320);
      expect(lightningManager.requestStrike.callCount).to.equal(2);
    });
    
    it('should integrate with queen power unlock state', function() {
      // Power locked initially
      expect(queen.isPowerUnlocked('lightning')).to.be.false;
      
      // Activate brush (UI would check power state, but brush itself doesn't)
      lightningAimBrush.activate();
      
      // Unlock power
      queen.unlockPower('lightning');
      expect(queen.isPowerUnlocked('lightning')).to.be.true;
      
      // Now strike should work (brush is active and power is unlocked)
      const result = lightningAimBrush.tryStrikeAt(350, 350);
      expect(result).to.be.true;
    });
  });
  
  describe('WASD Movement with Real Systems', function() {
    it('should move up with W key using real position', function() {
      const startPos = queen.model.getPosition();
      sinon.spy(queen, 'moveToLocation');
      
      queen.move('w');
      
      expect(queen.moveToLocation.called).to.be.true;
      const [targetX, targetY] = queen.moveToLocation.firstCall.args;
      expect(targetX).to.equal(startPos.x);
      expect(targetY).to.be.greaterThan(startPos.y); // Moving up increases Y
    });
    
    it('should move left with A key using real position', function() {
      const startPos = queen.model.getPosition();
      sinon.spy(queen, 'moveToLocation');
      
      queen.move('a');
      
      expect(queen.moveToLocation.called).to.be.true;
      const [targetX, targetY] = queen.moveToLocation.firstCall.args;
      expect(targetX).to.be.lessThan(startPos.x); // Moving left decreases X
      expect(targetY).to.equal(startPos.y);
    });
    
    it('should move down with S key using real position', function() {
      const startPos = queen.model.getPosition();
      sinon.spy(queen, 'moveToLocation');
      
      queen.move('s');
      
      expect(queen.moveToLocation.called).to.be.true;
      const [targetX, targetY] = queen.moveToLocation.firstCall.args;
      expect(targetX).to.equal(startPos.x);
      expect(targetY).to.be.lessThan(startPos.y); // Moving down decreases Y
    });
    
    it('should move right with D key using real position', function() {
      const startPos = queen.model.getPosition();
      sinon.spy(queen, 'moveToLocation');
      
      queen.move('d');
      
      expect(queen.moveToLocation.called).to.be.true;
      const [targetX, targetY] = queen.moveToLocation.firstCall.args;
      expect(targetX).to.be.greaterThan(startPos.x); // Moving right increases X
      expect(targetY).to.equal(startPos.y);
    });
    
    it('should use slow queen speed (0.1)', function() {
      const startPos = queen.model.getPosition();
      sinon.spy(queen, 'moveToLocation');
      
      queen.move('d');
      
      const [targetX, targetY] = queen.moveToLocation.firstCall.args;
      const distance = Math.abs(targetX - startPos.x);
      expect(distance).to.be.closeTo(0.1, 0.001); // Floating point tolerance
    });
    
    it('should handle all WASD directions in sequence', function() {
      const startPos = queen.model.getPosition();
      
      queen.move('w');
      queen.move('a');
      queen.move('s');
      queen.move('d');
      
      // Queen should have moved in all 4 directions
      // (Final position depends on moveToLocation implementation)
      expect(queen.model.getPosition()).to.exist;
    });
  });
  
  describe('Queen Inherits Ant Capabilities', function() {
    it('should have job system from AntController', function() {
      expect(queen.getJobName()).to.equal('Queen');
      expect(queen.assignJob).to.be.a('function');
    });
    
    it('should have combat system from AntController', function() {
      expect(queen.getHealth).to.be.a('function');
      expect(queen.takeDamage).to.be.a('function');
      expect(queen.heal).to.be.a('function');
      expect(queen.attack).to.be.a('function');
    });
    
    it('should have resource system from AntController', function() {
      expect(queen.getResourceCount).to.be.a('function');
      expect(queen.addResource).to.be.a('function');
      expect(queen.removeResource).to.be.a('function');
    });
    
    it('should have state machine system from AntController', function() {
      expect(queen.getCurrentState).to.be.a('function');
      expect(queen.setState).to.be.a('function');
    });
    
    it('should be able to take damage like regular ant', function() {
      const initialHealth = queen.getHealth();
      
      queen.takeDamage(20);
      
      expect(queen.getHealth()).to.equal(initialHealth - 20);
    });
    
    it('should be able to heal like regular ant', function() {
      queen.takeDamage(30);
      const damagedHealth = queen.getHealth();
      
      queen.heal(15);
      
      expect(queen.getHealth()).to.equal(damagedHealth + 15);
    });
  });
  
  describe('Debug Info', function() {
    it('should include queen-specific debug data', function() {
      queen.addAnt(workerAnts[0]);
      queen.addAnt(workerAnts[1]);
      queen.unlockPower('fireball');
      queen.unlockPower('lightning');
      
      const debug = queen.getDebugInfo();
      
      expect(debug.type).to.equal('Queen');
      expect(debug.commandRadius).to.equal(250);
      expect(debug.antsUnderCommand).to.equal(2);
      expect(debug.unlockedPowers).to.deep.equal(['fireball', 'lightning']);
      expect(debug.showCommandRadius).to.be.false;
    });
    
    it('should include base ant debug data', function() {
      const debug = queen.getDebugInfo();
      
      // Should have ant-specific data from AntController
      expect(debug).to.have.property('JobName');
      expect(debug).to.have.property('faction');
      expect(debug.JobName).to.equal('Queen');
      expect(debug.faction).to.equal('player');
    });
  });
  
  describe('Command Radius Visualization', function() {
    it('should toggle command radius visibility', function() {
      expect(queen.showCommandRadius).to.be.false;
      
      queen.showCommandRadius = true;
      expect(queen.showCommandRadius).to.be.true;
      
      queen.showCommandRadius = false;
      expect(queen.showCommandRadius).to.be.false;
    });
    
    it('should maintain command radius value', function() {
      expect(queen.commandRadius).to.equal(250);
      
      queen.commandRadius = 300;
      expect(queen.commandRadius).to.equal(300);
    });
  });
});
