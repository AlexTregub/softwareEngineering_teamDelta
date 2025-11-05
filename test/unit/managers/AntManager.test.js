// /**
//  * @file AntManager.test.js
//  * @description Unit tests for AntManager registry pattern (Phase 3.4.1)
//  * 
//  * Test Coverage:
//  * - Constructor initialization
//  * - createAnt() with auto-ID generation
//  * - getAntById() O(1) lookup
//  * - getAllAnts() iteration
//  * - getAntCount() registry size
//  * - destroyAnt() cleanup
//  * - clearAll() mass removal
//  * 
//  * @author Software Engineering Team Delta
//  */

// const { expect } = require('chai');
// const sinon = require('sinon');
// const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// // Setup test environment (JSDOM, p5.js, CollisionBox2D, Sprite2d)
// setupTestEnvironment({ rendering: true, sprite: true });

// describe('AntManager - Core Registry (Phase 3.4.1)', function() {
//   let AntManager, AntController, BaseModel, BaseView, BaseController;
//   let manager;
  
//   before(function() {
//     // Load MVC base classes first
//     BaseModel = require('../../../Classes/models/BaseModel');
//     BaseView = require('../../../Classes/views/BaseView');
//     BaseController = require('../../../Classes/controllers/mvc/BaseController');
    
//     // Set as globals for browser-like environment
//     global.BaseModel = BaseModel;
//     global.BaseView = BaseView;
//     global.BaseController = BaseController;
    
//     // Load ant dependencies (state machine, job system, resource manager)
//     const AntStateMachine = require('../../../Classes/ants/antStateMachine');
//     const JobComponent = require('../../../Classes/ants/JobComponent');
//     const ResourceManager = require('../../../Classes/managers/ResourceManager');
    
//     global.AntStateMachine = AntStateMachine;
//     global.JobComponent = JobComponent;
//     global.ResourceManager = ResourceManager;
    
//     // Load entity classes (they use globals)
//     const AntModel = require('../../../Classes/models/AntModel');
//     const AntView = require('../../../Classes/views/AntView');
//     AntController = require('../../../Classes/controllers/mvc/AntController');
    
//     // Set entity classes as globals too
//     global.AntModel = AntModel;
//     global.AntView = AntView;
//     global.AntController = AntController;
    
//     // Mock spatialGridManager (required dependency)
//     global.spatialGridManager = {
//       addEntity: sinon.spy(),
//       removeEntity: sinon.spy()
//     };
    
//     // Load AntManager
//     AntManager = require('../../../Classes/managers/AntManager');
//   });
  
//   beforeEach(function() {
//     manager = new AntManager();
    
//     // Reset spatial grid spy calls
//     global.spatialGridManager.addEntity.resetHistory();
//     global.spatialGridManager.removeEntity.resetHistory();
//   });
  
//   afterEach(function() {
//     cleanupTestEnvironment();
//   });
  
//   // ========================================
//   // Constructor Tests
//   // ========================================
  
//   describe('Constructor', function() {
//     it('should initialize with empty registry', function() {
//       expect(manager.getAntCount()).to.equal(0);
//     });
    
//     it('should initialize with zero next ID', function() {
//       const ant = manager.createAnt(100, 100);
//       expect(ant.antIndex).to.equal(0);
//     });
//   });
  
//   // ========================================
//   // createAnt() Tests
//   // ========================================
  
//   describe('createAnt()', function() {
//     it('should create ant with auto-generated ID', function() {
//       const ant = manager.createAnt(100, 100);
      
//       expect(ant).to.be.instanceOf(AntController);
//       expect(ant.antIndex).to.equal(0);
//     });
    
//     it('should generate sequential IDs', function() {
//       const ant1 = manager.createAnt(100, 100);
//       const ant2 = manager.createAnt(200, 200);
//       const ant3 = manager.createAnt(300, 300);
      
//       expect(ant1.antIndex).to.equal(0);
//       expect(ant2.antIndex).to.equal(1);
//       expect(ant3.antIndex).to.equal(2);
//     });
    
//     it('should pass options to AntController', function() {
//       const ant = manager.createAnt(100, 100, {
//         jobName: 'Warrior',
//         faction: 'player',
//         health: 150
//       });
      
//       expect(ant.jobName).to.equal('Warrior');
//       expect(ant.model.faction).to.equal('player');
//       expect(ant.health).to.be.greaterThan(100); // Warrior has more base health
//     });
    
//     it('should store ant in registry', function() {
//       const ant = manager.createAnt(100, 100);
      
//       expect(manager.getAntCount()).to.equal(1);
//       expect(manager.getAntById(ant.antIndex)).to.equal(ant);
//     });
    
//     it('should auto-register with spatial grid', function() {
//       const ant = manager.createAnt(100, 100);
      
//       expect(global.spatialGridManager.addEntity.calledOnce).to.be.true;
//       expect(global.spatialGridManager.addEntity.firstCall.args[0]).to.equal(ant);
//     });
    
//     it('should increment count after creation', function() {
//       expect(manager.getAntCount()).to.equal(0);
      
//       manager.createAnt(100, 100);
//       expect(manager.getAntCount()).to.equal(1);
      
//       manager.createAnt(200, 200);
//       expect(manager.getAntCount()).to.equal(2);
//     });
//   });
  
//   // ========================================
//   // getAntById() Tests
//   // ========================================
  
//   describe('getAntById()', function() {
//     it('should return ant by ID (O(1) lookup)', function() {
//       const ant1 = manager.createAnt(100, 100);
//       const ant2 = manager.createAnt(200, 200);
      
//       const retrieved = manager.getAntById(ant1.antIndex);
      
//       expect(retrieved).to.equal(ant1);
//       expect(retrieved).to.not.equal(ant2);
//     });
    
//     it('should return undefined for non-existent ID', function() {
//       manager.createAnt(100, 100);
      
//       const retrieved = manager.getAntById(999);
      
//       expect(retrieved).to.be.undefined;
//     });
    
//     it('should return undefined for negative ID', function() {
//       const retrieved = manager.getAntById(-1);
      
//       expect(retrieved).to.be.undefined;
//     });
    
//     it('should work with multiple ants', function() {
//       const ants = [];
//       for (let i = 0; i < 10; i++) {
//         ants.push(manager.createAnt(i * 50, i * 50));
//       }
      
//       // Lookup each ant by ID
//       ants.forEach(ant => {
//         const retrieved = manager.getAntById(ant.antIndex);
//         expect(retrieved).to.equal(ant);
//       });
//     });
//   });
  
//   // ========================================
//   // getAllAnts() Tests
//   // ========================================
  
//   describe('getAllAnts()', function() {
//     it('should return empty array when no ants', function() {
//       const ants = manager.getAllAnts();
      
//       expect(ants).to.be.an('array');
//       expect(ants).to.have.lengthOf(0);
//     });
    
//     it('should return all ants as array', function() {
//       const ant1 = manager.createAnt(100, 100);
//       const ant2 = manager.createAnt(200, 200);
//       const ant3 = manager.createAnt(300, 300);
      
//       const ants = manager.getAllAnts();
      
//       expect(ants).to.be.an('array');
//       expect(ants).to.have.lengthOf(3);
//       expect(ants).to.include(ant1);
//       expect(ants).to.include(ant2);
//       expect(ants).to.include(ant3);
//     });
    
//     it('should return new array each call (not reference)', function() {
//       manager.createAnt(100, 100);
      
//       const ants1 = manager.getAllAnts();
//       const ants2 = manager.getAllAnts();
      
//       expect(ants1).to.not.equal(ants2); // Different array instances
//       expect(ants1).to.deep.equal(ants2); // Same contents
//     });
    
//     it('should not allow modification of internal registry', function() {
//       const ant = manager.createAnt(100, 100);
//       const ants = manager.getAllAnts();
      
//       // Modify returned array
//       ants.push(null);
//       ants[0] = null;
      
//       // Internal registry unchanged
//       expect(manager.getAntCount()).to.equal(1);
//       expect(manager.getAntById(ant.antIndex)).to.equal(ant);
//     });
//   });
  
//   // ========================================
//   // getAntCount() Tests
//   // ========================================
  
//   describe('getAntCount()', function() {
//     it('should return 0 for empty registry', function() {
//       expect(manager.getAntCount()).to.equal(0);
//     });
    
//     it('should return correct count after additions', function() {
//       expect(manager.getAntCount()).to.equal(0);
      
//       manager.createAnt(100, 100);
//       expect(manager.getAntCount()).to.equal(1);
      
//       manager.createAnt(200, 200);
//       expect(manager.getAntCount()).to.equal(2);
      
//       manager.createAnt(300, 300);
//       expect(manager.getAntCount()).to.equal(3);
//     });
    
//     it('should decrement after destroy', function() {
//       const ant1 = manager.createAnt(100, 100);
//       const ant2 = manager.createAnt(200, 200);
      
//       expect(manager.getAntCount()).to.equal(2);
      
//       manager.destroyAnt(ant1.antIndex);
//       expect(manager.getAntCount()).to.equal(1);
//     });
//   });
  
//   // ========================================
//   // destroyAnt() Tests
//   // ========================================
  
//   describe('destroyAnt()', function() {
//     it('should remove ant from registry', function() {
//       const ant = manager.createAnt(100, 100);
//       const id = ant.antIndex;
      
//       expect(manager.getAntById(id)).to.equal(ant);
      
//       manager.destroyAnt(id);
      
//       expect(manager.getAntById(id)).to.be.undefined;
//     });
    
//     it('should return true when ant destroyed', function() {
//       const ant = manager.createAnt(100, 100);
      
//       const result = manager.destroyAnt(ant.antIndex);
      
//       expect(result).to.be.true;
//     });
    
//     it('should return false for non-existent ID', function() {
//       const result = manager.destroyAnt(999);
      
//       expect(result).to.be.false;
//     });
    
//     it('should call ant.destroy() method', function() {
//       const ant = manager.createAnt(100, 100);
//       const destroySpy = sinon.spy(ant, 'destroy');
      
//       manager.destroyAnt(ant.antIndex);
      
//       expect(destroySpy.calledOnce).to.be.true;
//     });
    
//     it('should remove from spatial grid', function() {
//       const ant = manager.createAnt(100, 100);
//       global.spatialGridManager.removeEntity.resetHistory(); // Reset from createAnt call
      
//       manager.destroyAnt(ant.antIndex);
      
//       expect(global.spatialGridManager.removeEntity.calledOnce).to.be.true;
//       expect(global.spatialGridManager.removeEntity.firstCall.args[0]).to.equal(ant);
//     });
    
//     it('should decrement count', function() {
//       const ant = manager.createAnt(100, 100);
//       expect(manager.getAntCount()).to.equal(1);
      
//       manager.destroyAnt(ant.antIndex);
//       expect(manager.getAntCount()).to.equal(0);
//     });
    
//     it('should not affect other ants', function() {
//       const ant1 = manager.createAnt(100, 100);
//       const ant2 = manager.createAnt(200, 200);
//       const ant3 = manager.createAnt(300, 300);
      
//       manager.destroyAnt(ant2.antIndex);
      
//       expect(manager.getAntById(ant1.antIndex)).to.equal(ant1);
//       expect(manager.getAntById(ant2.antIndex)).to.be.undefined;
//       expect(manager.getAntById(ant3.antIndex)).to.equal(ant3);
//     });
//   });
  
//   // ========================================
//   // clearAll() Tests
//   // ========================================
  
//   describe('clearAll()', function() {
//     it('should remove all ants from registry', function() {
//       manager.createAnt(100, 100);
//       manager.createAnt(200, 200);
//       manager.createAnt(300, 300);
      
//       expect(manager.getAntCount()).to.equal(3);
      
//       manager.clearAll();
      
//       expect(manager.getAntCount()).to.equal(0);
//       expect(manager.getAllAnts()).to.have.lengthOf(0);
//     });
    
//     it('should call destroy() on all ants', function() {
//       const ant1 = manager.createAnt(100, 100);
//       const ant2 = manager.createAnt(200, 200);
      
//       const spy1 = sinon.spy(ant1, 'destroy');
//       const spy2 = sinon.spy(ant2, 'destroy');
      
//       manager.clearAll();
      
//       expect(spy1.calledOnce).to.be.true;
//       expect(spy2.calledOnce).to.be.true;
//     });
    
//     it('should work with empty registry', function() {
//       expect(() => {
//         manager.clearAll();
//       }).to.not.throw();
      
//       expect(manager.getAntCount()).to.equal(0);
//     });
//   });
  
//   // ========================================
//   // Selection Query Tests (No Internal State)
//   // ========================================
  
//   describe('Selection Queries', function() {
//     it('should return undefined when no ant is selected', function() {
//       manager.createAnt(100, 100);
//       manager.createAnt(200, 200);
      
//       // No ants selected
//       const selected = manager.getSelectedAnt();
      
//       expect(selected).to.be.undefined;
//     });
    
//     it('should find selected ant by querying ants', function() {
//       const ant1 = manager.createAnt(100, 100);
//       const ant2 = manager.createAnt(200, 200);
      
//       // Select ant2 directly via AntController
//       ant2.setSelected(true);
      
//       const selected = manager.getSelectedAnt();
      
//       expect(selected).to.equal(ant2);
//     });
    
//     it('should return first selected ant if multiple selected', function() {
//       const ant1 = manager.createAnt(100, 100);
//       const ant2 = manager.createAnt(200, 200);
//       const ant3 = manager.createAnt(300, 300);
      
//       // Select multiple ants
//       ant1.setSelected(true);
//       ant2.setSelected(true);
//       ant3.setSelected(true);
      
//       const selected = manager.getSelectedAnt();
      
//       // Should return first one found (ant1)
//       expect(selected).to.equal(ant1);
//     });
    
//     it('should clear all selections', function() {
//       const ant1 = manager.createAnt(100, 100);
//       const ant2 = manager.createAnt(200, 200);
//       const ant3 = manager.createAnt(300, 300);
      
//       // Select all ants
//       ant1.setSelected(true);
//       ant2.setSelected(true);
//       ant3.setSelected(true);
      
//       manager.clearSelection();
      
//       // All should be deselected
//       expect(ant1.isSelected()).to.be.false;
//       expect(ant2.isSelected()).to.be.false;
//       expect(ant3.isSelected()).to.be.false;
//       expect(manager.getSelectedAnt()).to.be.undefined;
//     });
    
//     it('should detect if any ant is selected', function() {
//       const ant = manager.createAnt(100, 100);
      
//       expect(manager.hasSelection()).to.be.false;
      
//       ant.setSelected(true);
      
//       expect(manager.hasSelection()).to.be.true;
//     });
//   });
  
//   // ========================================
//   // ID Management Tests
//   // ========================================
  
//   describe('ID Management', function() {
//     it('should never reuse IDs after destroy', function() {
//       const ant1 = manager.createAnt(100, 100);
//       const ant2 = manager.createAnt(200, 200);
      
//       expect(ant1.antIndex).to.equal(0);
//       expect(ant2.antIndex).to.equal(1);
      
//       manager.destroyAnt(ant1.antIndex);
      
//       const ant3 = manager.createAnt(300, 300);
//       expect(ant3.antIndex).to.equal(2); // Not 0!
//     });
    
//     it('should maintain ID sequence after clearAll', function() {
//       manager.createAnt(100, 100);
//       manager.createAnt(200, 200);
      
//       manager.clearAll();
      
//       const ant = manager.createAnt(300, 300);
//       expect(ant.antIndex).to.equal(2); // Continues from 2, not 0
//     });
    
//     it('should handle large ID sequences', function() {
//       // Create and destroy many ants
//       for (let i = 0; i < 100; i++) {
//         const ant = manager.createAnt(i, i);
//         if (i % 2 === 0) {
//           manager.destroyAnt(ant.antIndex);
//         }
//       }
      
//       // Next ant should have ID 100
//       const ant = manager.createAnt(0, 0);
//       expect(ant.antIndex).to.equal(100);
//     });
//   });
// });
