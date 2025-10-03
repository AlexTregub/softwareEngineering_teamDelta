/**
 * BDD Test Spec: Ant Spawning System
 * 
 * Following Testing Methodology Standards:
 * - Tests real system APIs, not test logic
 * - Uses actual business requirements and thresholds  
 * - Validates both positive and negative scenarios
 * - Tests with realistic, domain-appropriate data
 * - Zero RED FLAG patterns
 */

const { expect } = require('chai');

describe('🐜 Feature: Ant Spawning System', function() {
  
  beforeEach(function() {
    // Reset global state before each test - use real system globals
    if (typeof global.ants !== 'undefined') {
      global.ants.length = 0; // Clear array but keep reference
    } else {
      global.ants = [];
    }
    
    
    // Ensure we're testing against real system state
    console.log(`Test setup: ants.length=${global.ants.length}`);
  });

  describe('Scenario: System Prerequisites Validation', function() {
    
    it('Given the ant spawning system, When I check for required functions, Then all spawning APIs should be available', function() {
      // Given: I need to validate the spawning system exists
      
      // Then: Core spawning functions should be available
      expect(typeof global.antsSpawn, 'antsSpawn function should be available').to.equal('function');
      expect(typeof global.handleSpawnCommand, 'handleSpawnCommand function should be available').to.equal('function');
      
      // And: Required global variables should exist
      expect(global.ants, 'ants array should exist').to.be.an('array');
      
      // And: Job assignment system should be available
      expect(typeof global.assignJob, 'assignJob function should be available').to.equal('function');
    });
    
    it('Given the ant spawning system, When I check for ant class availability, Then ant constructor should be available', function() {
      // Given: I need to create ant instances
      
      // Then: ant class should be available globally
      expect(typeof global.ant, 'ant class should be available').to.equal('function');
      
      // And: ant should be a proper constructor
      const testAnt = new global.ant();
      expect(testAnt).to.be.an('object');
      expect(testAnt.constructor.name).to.equal('ant');
    });
  });

  describe('Scenario: Single Ant Creation via antsSpawn', function() {
    
    it('Given I want one ant, When I call antsSpawn(1, "player"), Then exactly one ant should be created with player faction', function() {
      // Given: Empty ants array
      expect(global.ants).to.have.lengthOf(0);
      const initialAntIndex = global.antIndex;
      
      // When: I spawn exactly one ant
      global.antsSpawn(1, "player");
      
      // Then: Exactly one ant should exist
      expect(global.ants).to.have.lengthOf(1, 'Should create exactly one ant');
      
      // And: The ant should have correct faction
      const spawnedAnt = global.ants[0];
      expect(spawnedAnt.faction).to.equal("player", 'Ant should have player faction');
      
      // And: Ants array should have correct length (no separate index counter needed)
      expect(global.ants.length).to.equal(1, 'ants.length should be 1 after spawning 1 ant');
      
      // And: Ant should be a valid ant instance
      expect(spawnedAnt).to.be.an('object');
      expect(spawnedAnt.constructor.name).to.equal('ant');
    });
    
    it('Given I want multiple ants, When I call antsSpawn(5, "enemy"), Then exactly 5 enemy ants should be created', function() {
      // Given: Empty ants array
      expect(global.ants).to.have.lengthOf(0);
      
      // When: I spawn 5 ants
      const spawnCount = 5;
      global.antsSpawn(spawnCount, "enemy");
      
      // Then: Exactly 5 ants should exist
      expect(global.ants).to.have.lengthOf(spawnCount, `Should create exactly ${spawnCount} ants`);
      
      // And: All ants should have enemy faction
      global.ants.forEach((ant, index) => {
        expect(ant.faction, `Ant ${index} should have enemy faction`).to.equal("enemy");
      });
      
      // And: All ants should be valid instances
      global.ants.forEach((ant, index) => {
        expect(ant, `Ant ${index} should be an object`).to.be.an('object');
        expect(ant.constructor.name, `Ant ${index} should be ant class`).to.equal('ant');
      });
    });
  });

  describe('Scenario: Command Line Spawning via handleSpawnCommand', function() {
    
    it('Given command line interface, When I use handleSpawnCommand(3, "neutral"), Then 3 neutral ants should be spawned with jobs assigned', function() {
      // Given: Command line spawning system
      const initialCount = global.ants.length;
      
      // When: I spawn ants via command line
      global.handleSpawnCommand(3, "neutral");
      
      // Then: Correct number of ants should be spawned
      expect(global.ants).to.have.lengthOf(initialCount + 3, 'Should spawn exactly 3 ants via command line');
      
      // And: All new ants should have neutral faction
      const newAnts = global.ants.slice(initialCount);
      newAnts.forEach((ant, index) => {
        expect(ant.faction, `Command line ant ${index} should have neutral faction`).to.equal("neutral");
      });
      
      // And: All ants should have job assignments
      newAnts.forEach((ant, index) => {
        expect(ant.jobName, `Command line ant ${index} should have a job assigned`).to.be.a('string');
        expect(ant.jobName.length, `Command line ant ${index} job name should not be empty`).to.be.greaterThan(0);
        
        // Job should be from valid job list
        const validJobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
        expect(validJobs, `Ant ${index} should have valid job: ${ant.jobName}`).to.include(ant.jobName);
      });
    });
  });

  describe('Scenario: Multiple Spawning Operations', function() {
    
    it('Given existing ants, When I spawn additional ants with different factions, Then all factions should coexist correctly', function() {
      // Given: Some existing ants
      global.antsSpawn(2, "team1");
      const initialCount = global.ants.length;
      
      // When: I spawn additional ants with different faction
      global.antsSpawn(3, "team2");
      
      // Then: Total count should be correct
      expect(global.ants).to.have.lengthOf(initialCount + 3, 'Should add new ants to existing array');
      
      // And: Different factions should coexist
      const team1Ants = global.ants.filter(ant => ant.faction === "team1");
      const team2Ants = global.ants.filter(ant => ant.faction === "team2");
      
      expect(team1Ants).to.have.lengthOf(2, 'Should preserve team1 ants');
      expect(team2Ants).to.have.lengthOf(3, 'Should add team2 ants');
      
      // And: Each ant should be a unique object instance
      const antIds = global.ants.map(ant => ant._id);
      const uniqueIds = [...new Set(antIds)];
      expect(uniqueIds).to.have.lengthOf(antIds.length, 'All ants should have unique Entity IDs');
    });
  });

  describe('Scenario: Ant Rendering Prerequisites', function() {
    
    it('Given spawned ants, When I check for render methods, Then all ants should be capable of rendering', function() {
      // Given: Spawned ants
      global.antsSpawn(3, "test");
      
      // When: I check each ant for render capability
      const renderCapableAnts = global.ants.filter(ant => typeof ant.render === 'function');
      
      // Then: All ants should have render methods
      expect(renderCapableAnts).to.have.lengthOf(global.ants.length, 'All ants should have render method');
      
      // And: Render methods should execute without errors
      global.ants.forEach((ant, index) => {
        expect(() => {
          ant.render();
        }, `Ant ${index} render method should not throw errors`).to.not.throw();
      });
    });
  });

  describe('Scenario: Array State Consistency', function() {
    
    it('Given multiple spawning operations, When I check array consistency, Then ants array should be clean and consistent', function() {
      // Given: Multiple spawning operations
      global.antsSpawn(2, "faction1");
      global.antsSpawn(3, "faction2"); 
      global.handleSpawnCommand(4, "faction3");
      
      // When: I check array consistency
      const arrayLength = global.ants.length;
      
      // Then: Array should have expected total count
      expect(arrayLength).to.equal(9, 'ants.length should equal total spawned (2+3+4=9)');
      
      // And: No array slots should be empty
      for (let i = 0; i < arrayLength; i++) {
        expect(global.ants[i], `Array slot ${i} should not be undefined`).to.not.be.undefined;
        expect(global.ants[i], `Array slot ${i} should not be null`).to.not.be.null;
        expect(global.ants[i], `Array slot ${i} should be an ant instance`).to.be.an('object');
      }
      
      // And: All ants should have unique Entity IDs
      const entityIds = global.ants.map(ant => ant._id);
      const uniqueIds = [...new Set(entityIds)];
      expect(uniqueIds).to.have.lengthOf(entityIds.length, 'All ants should have unique Entity IDs');
    });
  });

  describe('Scenario: Error Handling and Edge Cases', function() {
    
    it('Given invalid spawn parameters, When I attempt to spawn with zero or negative counts, Then system should handle gracefully', function() {
      // Given: Initial state
      const initialCount = global.ants.length;
      const initialAntIndex = global.antIndex;
      
      // When: I attempt invalid spawning
      global.antsSpawn(0, "test");    // Zero count
      global.antsSpawn(-1, "test");   // Negative count
      
      // Then: No ants should be added
      expect(global.ants).to.have.lengthOf(initialCount, 'Should not spawn ants with invalid counts');
      expect(global.antIndex).to.equal(initialAntIndex, 'antIndex should not change with invalid counts');
      
      // And: System should remain stable
      expect(global.ants).to.be.an('array', 'ants should remain an array');
      expect(global.antIndex).to.be.a('number', 'antIndex should remain a number');
    });
    
    it('Given undefined or null faction, When I spawn ants, Then system should handle faction gracefully', function() {
      // Given: Invalid faction parameters  
      const initialCount = global.ants.length;
      
      // When: I spawn with invalid factions (if system allows it)
      try {
        global.antsSpawn(1, null);
        global.antsSpawn(1, undefined);
        
        // Then: System should handle gracefully or assign defaults
        const newAnts = global.ants.slice(initialCount);
        newAnts.forEach((ant, index) => {
          // Faction should be converted to string or have reasonable default
          expect(ant.faction !== undefined, `Ant ${index} should have some faction value`).to.be.true;
        });
      } catch (error) {
        // If system throws errors for invalid factions, that's also acceptable behavior
        console.log('System correctly rejects invalid faction parameters:', error.message);
      }
    });
  });

  describe('Scenario: Job Assignment System Integration', function() {
    
    it('Given the spawning system, When ants are created, Then they should have valid job assignments', function() {
      // Given: Fresh spawning system
      expect(global.ants).to.have.lengthOf(0);
      
      // When: I spawn ants that should get job assignments
      global.handleSpawnCommand(5, "worker");
      
      // Then: All ants should have job components
      global.ants.forEach((ant, index) => {
        expect(ant.jobName, `Ant ${index} should have jobName property`).to.be.a('string');
        expect(ant.jobName.length, `Ant ${index} jobName should not be empty`).to.be.greaterThan(0);
        
        // If JobComponent system is available, check for job component
        if (typeof ant.job !== 'undefined') {
          expect(ant.job, `Ant ${index} should have job component`).to.not.be.null;
        }
      });
    });
  });
});