/**
 * Integration tests for EntityManager selectAntsByJob function
 * Tests selection of ants by job type with real ant instances
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityManager.selectAntsByJob() Integration Tests', function() {
  let entityManager;
  let mockAnts;
  let mockSelectionController;
  
  beforeEach(function() {
    // Setup global environment
    global.window = global.window || {};
    global.ants = [];
    
    // Mock eventBus
    global.eventBus = {
      on: sinon.stub(),
      off: sinon.stub(),
      emit: sinon.stub()
    };
    
    // Create EntityManager instance
    const EntityManager = require('../../../Classes/globals/entityManager');
    entityManager = new EntityManager();
    
    // Create mock selection controller
    mockSelectionController = {
      deselectAll: sinon.stub(),
      selectedEntities: []
    };
    global.g_selectionBoxController = mockSelectionController;
    
    // Create mock ants with different jobs and factions
    mockAnts = [
      { _id: 'ant1', _isActive: true, _faction: 'player', jobName: 'Builder', isSelected: false },
      { _id: 'ant2', _isActive: true, _faction: 'player', jobName: 'Builder', isSelected: false },
      { _id: 'ant3', _isActive: true, _faction: 'player', jobName: 'Scout', isSelected: false },
      { _id: 'ant4', _isActive: true, _faction: 'player', jobName: 'Farmer', isSelected: false },
      { _id: 'ant5', _isActive: true, _faction: 'enemy', jobName: 'Builder', isSelected: false },
      { _id: 'ant6', _isActive: false, _faction: 'player', jobName: 'Builder', isSelected: false }
    ];
    
    global.ants = mockAnts;
    global.window.ants = mockAnts;
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.g_selectionBoxController;
    delete global.ants;
    delete global.window.ants;
    delete global.eventBus;
  });
  
  describe('Basic Functionality', function() {
    it('should select all player faction ants of specified job type', function() {
      const selected = entityManager.selectAntsByJob('Builder', 'player');
      
      expect(selected).to.have.lengthOf(2);
      expect(selected[0]._id).to.equal('ant1');
      expect(selected[1]._id).to.equal('ant2');
      expect(selected[0].isSelected).to.be.true;
      expect(selected[1].isSelected).to.be.true;
    });
    
    it('should only select active ants', function() {
      const selected = entityManager.selectAntsByJob('Builder', 'player');
      
      // Should not include inactive ant6
      expect(selected).to.have.lengthOf(2);
      expect(selected.find(a => a._id === 'ant6')).to.be.undefined;
    });
    
    it('should only select ants from specified faction', function() {
      const selected = entityManager.selectAntsByJob('Builder', 'player');
      
      // Should not include enemy ant5
      expect(selected).to.have.lengthOf(2);
      expect(selected.find(a => a._id === 'ant5')).to.be.undefined;
    });
    
    it('should handle different job types', function() {
      const scoutSelected = entityManager.selectAntsByJob('Scout', 'player');
      expect(scoutSelected).to.have.lengthOf(1);
      expect(scoutSelected[0]._id).to.equal('ant3');
      
      const farmerSelected = entityManager.selectAntsByJob('Farmer', 'player');
      expect(farmerSelected).to.have.lengthOf(1);
      expect(farmerSelected[0]._id).to.equal('ant4');
    });
  });
  
  describe('Edge Cases', function() {
    it('should return empty array when no ants match job type', function() {
      const selected = entityManager.selectAntsByJob('Warrior', 'player');
      
      expect(selected).to.be.an('array');
      expect(selected).to.have.lengthOf(0);
    });
    
    it('should return empty array when no ants match faction', function() {
      const selected = entityManager.selectAntsByJob('Builder', 'nonexistent');
      
      expect(selected).to.be.an('array');
      expect(selected).to.have.lengthOf(0);
    });
    
    it('should handle empty ants array', function() {
      global.ants = [];
      global.window.ants = [];
      
      const selected = entityManager.selectAntsByJob('Builder', 'player');
      
      expect(selected).to.be.an('array');
      expect(selected).to.have.lengthOf(0);
    });
    
    it('should handle missing ants array', function() {
      delete global.ants;
      delete global.window.ants;
      
      const selected = entityManager.selectAntsByJob('Builder', 'player');
      
      expect(selected).to.be.an('array');
      expect(selected).to.have.lengthOf(0);
    });
  });
  
  describe('Selection Controller Integration', function() {
    it('should call deselectAll before selecting new ants', function() {
      entityManager.selectAntsByJob('Builder', 'player');
      
      expect(mockSelectionController.deselectAll.calledOnce).to.be.true;
    });
    
    it('should update selection controller selectedEntities', function() {
      entityManager.selectAntsByJob('Builder', 'player');
      
      expect(mockSelectionController.selectedEntities).to.have.lengthOf(2);
      expect(mockSelectionController.selectedEntities[0]._id).to.equal('ant1');
      expect(mockSelectionController.selectedEntities[1]._id).to.equal('ant2');
    });
    
    it('should set isSelected property on matched ants', function() {
      entityManager.selectAntsByJob('Scout', 'player');
      
      expect(mockAnts[2].isSelected).to.be.true; // ant3 (Scout)
      expect(mockAnts[0].isSelected).to.be.false; // ant1 (Builder)
      expect(mockAnts[1].isSelected).to.be.false; // ant2 (Builder)
    });
    
    it('should work without selection controller', function() {
      delete global.g_selectionBoxController;
      
      const selected = entityManager.selectAntsByJob('Builder', 'player');
      
      expect(selected).to.have.lengthOf(2);
      // Should still return ants even if selection controller is missing
    });
  });
  
  describe('JobName Property Variants', function() {
    it('should match ants using jobName property', function() {
      const selected = entityManager.selectAntsByJob('Builder', 'player');
      
      expect(selected).to.have.lengthOf(2);
    });
    
    it('should match ants using JobName property (capitalized)', function() {
      mockAnts[0].JobName = 'Warrior';
      delete mockAnts[0].jobName;
      
      const selected = entityManager.selectAntsByJob('Warrior', 'player');
      
      expect(selected).to.have.lengthOf(1);
      expect(selected[0]._id).to.equal('ant1');
    });
  });
  
  describe('Multiple Selection Calls', function() {
    it('should deselect previous selection when selecting new job type', function() {
      // Select builders first
      entityManager.selectAntsByJob('Builder', 'player');
      expect(mockAnts[0].isSelected).to.be.true;
      expect(mockAnts[1].isSelected).to.be.true;
      
      // Then select scouts
      entityManager.selectAntsByJob('Scout', 'player');
      
      // Previous selection should be cleared via deselectAll
      expect(mockSelectionController.deselectAll.calledTwice).to.be.true;
      expect(mockAnts[2].isSelected).to.be.true; // Scout
    });
  });
});
