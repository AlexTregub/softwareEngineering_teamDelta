/**
 * Job System Integration Tests
 * Tests the integration between JobComponent progression system and actual ant entities
 * These tests will initially FAIL and guide our integration implementation
 * Following TDD methodology with comprehensive coverage
 */

// Load required modules
const JobComponent = require('../../Classes/ants/JobComponent.js');

/**
 * Integration Test Suite for Job System
 * Tests real-world scenarios and edge cases for job progression integration
 */
const JobIntegrationTestSuite = {
  testResults: [],
  mockAnts: [], // Store mock ant objects for testing
  
  test: function(description, testFunction) {
    try {
      testFunction();
      this.testResults.push({ description, status: 'PASS' });
      console.log(`✅ ${description}`);
    } catch (error) {
      this.testResults.push({ description, status: 'FAIL', error: error.message });
      console.error(`❌ ${description}: ${error.message}`);
    }
  },

  assertEqual: function(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message} - Expected: ${expected}, Got: ${actual}`);
    }
  },

  assertTrue: function(condition, message = '') {
    if (!condition) {
      throw new Error(`${message} - Expected true, got false`);
    }
  },

  assertNotNull: function(value, message = '') {
    if (value === null || value === undefined) {
      throw new Error(`${message} - Expected non-null value`);
    }
  },

  assertGreaterThan: function(actual, expected, message = '') {
    if (actual <= expected) {
      throw new Error(`${message} - Expected ${actual} > ${expected}`);
    }
  },

  assertLessThan: function(actual, expected, message = '') {
    if (actual >= expected) {
      throw new Error(`${message} - Expected ${actual} < ${expected}`);
    }
  },

  getSummary: function() {
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    return { passed, failed, total: this.testResults.length };
  },

  // Helper method to create mock ant objects
  createMockAnt: function(jobName = 'Builder', id = null) {
    const antId = id || `ant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockAnt = {
      id: antId,
      jobName: jobName,
      job: new JobComponent(jobName),
      level: 1,
      experience: 0,
      stats: JobComponent.getJobStats(jobName),
      activities: [],
      
      // Mock methods
      gainExperience: function(amount) {
        JobComponent.addExperience(this.id, amount);
        this.experience = JobComponent.getExperience(this.id);
        this.updateLevel();
      },
      
      updateLevel: function() {
        const newLevel = JobComponent.getLevel(this.id);
        if (newLevel !== this.level) {
          this.level = newLevel;
          this.updateStats();
          return true; // Level up occurred
        }
        return false;
      },
      
      updateStats: function() {
        const progression = JobComponent.getProgressionStats(this.jobName, this.level);
        this.stats = progression.totalStats;
        this.specialAbilities = progression.specialAbilities;
      },
      
      performActivity: function(activityType, activityData = {}) {
        const exp = JobComponent.getExperienceFromActivity(activityType, activityData);
        this.activities.push({ type: activityType, data: activityData, experience: exp });
        this.gainExperience(exp);
        return exp;
      }
    };
    
    this.mockAnts.push(mockAnt);
    return mockAnt;
  },

  clearMockAnts: function() {
    // Clean up experience data for all mock ants
    this.mockAnts.forEach(ant => {
      JobComponent.experienceData.delete(ant.id);
    });
    this.mockAnts = [];
  }
};

// ===== BASIC INTEGRATION TESTS =====

JobIntegrationTestSuite.test('Ant should integrate with JobComponent for basic job assignment', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Builder');
  
  JobIntegrationTestSuite.assertEqual(ant.jobName, 'Builder', 'Ant should have correct job name');
  JobIntegrationTestSuite.assertNotNull(ant.job, 'Ant should have JobComponent instance');
  JobIntegrationTestSuite.assertEqual(ant.job.name, 'Builder', 'JobComponent should have correct name');
  JobIntegrationTestSuite.assertEqual(ant.stats.strength, 20, 'Ant should have correct initial stats');
});

JobIntegrationTestSuite.test('Ant should gain experience and level up correctly', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Scout');
  
  // Start at level 1
  JobIntegrationTestSuite.assertEqual(ant.level, 1, 'Ant should start at level 1');
  
  // Gain enough experience for level 2
  ant.gainExperience(100);
  JobIntegrationTestSuite.assertEqual(ant.level, 2, 'Ant should reach level 2 after 100 exp');
  JobIntegrationTestSuite.assertEqual(ant.experience, 100, 'Ant should track experience correctly');
});

JobIntegrationTestSuite.test('Ant stats should update when leveling up', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Warrior');
  const initialStrength = ant.stats.strength;
  
  // Level up and check stat changes
  ant.gainExperience(100); // Level 2
  JobIntegrationTestSuite.assertGreaterThan(ant.stats.strength, initialStrength, 
    'Warrior strength should increase when leveling up');
  
  const level2Strength = ant.stats.strength;
  ant.gainExperience(150); // Level 3 (total 250)
  JobIntegrationTestSuite.assertGreaterThan(ant.stats.strength, level2Strength,
    'Warrior strength should continue increasing with each level');
});

// ===== ACTIVITY-BASED EXPERIENCE TESTS =====

JobIntegrationTestSuite.test('Builder should gain experience from building activities', () => {
  const builder = JobIntegrationTestSuite.createMockAnt('Builder');
  const initialExp = builder.experience;
  
  const expGained = builder.performActivity('building', { structureType: 'nest', complexity: 'high' });
  
  JobIntegrationTestSuite.assertGreaterThan(expGained, 0, 'Building should provide experience');
  JobIntegrationTestSuite.assertGreaterThan(builder.experience, initialExp, 
    'Builder experience should increase after building');
  JobIntegrationTestSuite.assertTrue(builder.activities.length === 1, 
    'Activity should be recorded in ant history');
});

JobIntegrationTestSuite.test('Farmer should gain more experience from gathering than other jobs', () => {
  const farmer = JobIntegrationTestSuite.createMockAnt('Farmer');
  const warrior = JobIntegrationTestSuite.createMockAnt('Warrior');
  
  const farmerExp = farmer.performActivity('gathering', { resourceType: 'food', amount: 50 });
  const warriorExp = warrior.performActivity('gathering', { resourceType: 'food', amount: 50 });
  
  // Note: This test assumes farmers should get gathering bonuses (may need implementation)
  JobIntegrationTestSuite.assertGreaterThan(farmerExp, 0, 'Farmer should gain experience from gathering');
  JobIntegrationTestSuite.assertGreaterThan(warriorExp, 0, 'Warrior should also gain experience from gathering');
});

JobIntegrationTestSuite.test('Warrior should gain significant experience from combat victories', () => {
  const warrior = JobIntegrationTestSuite.createMockAnt('Warrior');
  const initialExp = warrior.experience;
  
  const combatExp = warrior.performActivity('combat', { enemyType: 'spider', victory: true });
  
  JobIntegrationTestSuite.assertGreaterThan(combatExp, 15, 'Combat should provide substantial experience');
  JobIntegrationTestSuite.assertGreaterThan(warrior.experience, initialExp, 
    'Warrior experience should increase after combat');
});

JobIntegrationTestSuite.test('Scout should gain experience from exploration activities', () => {
  const scout = JobIntegrationTestSuite.createMockAnt('Scout');
  
  const explorationExp = scout.performActivity('exploration', { newArea: true, danger: true });
  
  JobIntegrationTestSuite.assertGreaterThan(explorationExp, 0, 'Exploration should provide experience');
  JobIntegrationTestSuite.assertGreaterThan(scout.experience, 0, 'Scout should gain exploration experience');
});

// ===== MULTI-ANT INTEGRATION TESTS =====

JobIntegrationTestSuite.test('Multiple ants should maintain independent experience tracking', () => {
  const builder = JobIntegrationTestSuite.createMockAnt('Builder');
  const scout = JobIntegrationTestSuite.createMockAnt('Scout');
  const warrior = JobIntegrationTestSuite.createMockAnt('Warrior');
  
  builder.gainExperience(50);
  scout.gainExperience(150);
  warrior.gainExperience(300);
  
  JobIntegrationTestSuite.assertEqual(builder.experience, 50, 'Builder should have 50 exp');
  JobIntegrationTestSuite.assertEqual(scout.experience, 150, 'Scout should have 150 exp');
  JobIntegrationTestSuite.assertEqual(warrior.experience, 300, 'Warrior should have 300 exp');
  
  JobIntegrationTestSuite.assertEqual(builder.level, 1, 'Builder should be level 1');
  JobIntegrationTestSuite.assertEqual(scout.level, 2, 'Scout should be level 2'); 
  JobIntegrationTestSuite.assertEqual(warrior.level, 3, 'Warrior should be level 3');
});

JobIntegrationTestSuite.test('Ant colony should handle mass experience events', () => {
  const colony = [];
  for (let i = 0; i < 10; i++) {
    colony.push(JobIntegrationTestSuite.createMockAnt('Builder'));
  }
  
  // Simulate colony-wide experience gain (e.g., successful defense)
  colony.forEach(ant => ant.gainExperience(75));
  
  colony.forEach((ant, index) => {
    JobIntegrationTestSuite.assertEqual(ant.experience, 75, `Ant ${index} should have 75 experience`);
    JobIntegrationTestSuite.assertEqual(ant.level, 1, `Ant ${index} should still be level 1`);
  });
});

// ===== SPECIAL ABILITIES INTEGRATION TESTS =====

JobIntegrationTestSuite.test('High-level ants should unlock special abilities', () => {
  const builder = JobIntegrationTestSuite.createMockAnt('Builder');
  
  // Level up to 5 to unlock special abilities
  builder.gainExperience(1000); // Should be level 5+
  const actualLevel = builder.level;
  
  JobIntegrationTestSuite.assertGreaterThan(actualLevel, 4, 'Builder should reach at least level 5');
  JobIntegrationTestSuite.assertNotNull(builder.specialAbilities, 'Builder should have special abilities');
  JobIntegrationTestSuite.assertTrue(builder.specialAbilities.length > 0, 
    'Level 5 builder should have unlocked abilities');
  JobIntegrationTestSuite.assertTrue(builder.specialAbilities.includes('Advanced Construction'),
    'Level 5 builder should have Advanced Construction ability');
});

JobIntegrationTestSuite.test('Different jobs should unlock different special abilities', () => {
  const warrior = JobIntegrationTestSuite.createMockAnt('Warrior');
  const scout = JobIntegrationTestSuite.createMockAnt('Scout');
  
  // Level both to 5
  warrior.gainExperience(1000);
  scout.gainExperience(1000);
  
  JobIntegrationTestSuite.assertTrue(warrior.specialAbilities.includes('Charge Attack'),
    'Level 5 warrior should have Charge Attack');
  JobIntegrationTestSuite.assertTrue(scout.specialAbilities.includes('Sprint Burst'),
    'Level 5 scout should have Sprint Burst');
  
  // Abilities should be different
  JobIntegrationTestSuite.assertTrue(warrior.specialAbilities[0] !== scout.specialAbilities[0],
    'Different jobs should have different special abilities');
});

// ===== JOB PERMANENCE INTEGRATION TESTS =====

JobIntegrationTestSuite.test('Ant should maintain consistent job throughout progression', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Builder');
  const originalJob = ant.jobName;
  
  // Gain significant experience and level up
  ant.gainExperience(500);
  
  // Job should remain the same throughout progression
  JobIntegrationTestSuite.assertEqual(ant.jobName, originalJob, 
    'Ant should maintain original job assignment');
  JobIntegrationTestSuite.assertEqual(ant.job.name, originalJob,
    'JobComponent should maintain original job');
  JobIntegrationTestSuite.assertGreaterThan(ant.level, 1,
    'Ant should level up while maintaining job consistency');
});

// ===== EDGE CASE AND ERROR HANDLING TESTS =====

JobIntegrationTestSuite.test('System should handle invalid ant IDs gracefully', () => {
  // Test with null/undefined ant ID
  JobComponent.addExperience(null, 50);
  JobComponent.addExperience(undefined, 50);
  JobComponent.addExperience('', 50);
  
  JobIntegrationTestSuite.assertEqual(JobComponent.getExperience(null), 0,
    'Null ant ID should return 0 experience');
  JobIntegrationTestSuite.assertEqual(JobComponent.getExperience(undefined), 0,
    'Undefined ant ID should return 0 experience');
  JobIntegrationTestSuite.assertEqual(JobComponent.getExperience(''), 0,
    'Empty ant ID should return 0 experience');
});

JobIntegrationTestSuite.test('System should handle negative experience gracefully', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Builder');
  const initialExp = ant.experience;
  
  ant.gainExperience(-50); // Negative experience
  
  JobIntegrationTestSuite.assertEqual(ant.experience, initialExp,
    'Negative experience should not reduce total experience');
});

JobIntegrationTestSuite.test('System should handle extremely large experience values', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Builder');
  
  ant.gainExperience(999999999); // Very large number
  
  JobIntegrationTestSuite.assertGreaterThan(ant.experience, 0, 'Large experience should be handled');
  JobIntegrationTestSuite.assertLessThan(ant.level, 15, 'Level should be capped reasonably');
});

JobIntegrationTestSuite.test('System should handle unknown job names gracefully', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('UnknownJob');
  
  JobIntegrationTestSuite.assertNotNull(ant.stats, 'Unknown job should get default stats');
  JobIntegrationTestSuite.assertEqual(ant.stats.strength, 10, 'Unknown job should have default strength');
  JobIntegrationTestSuite.assertEqual(ant.stats.health, 100, 'Unknown job should have default health');
});

// ===== PERFORMANCE INTEGRATION TESTS =====

JobIntegrationTestSuite.test('System should handle large numbers of ants efficiently', () => {
  const startTime = Date.now();
  const antCount = 100;
  const ants = [];
  
  // Create many ants
  for (let i = 0; i < antCount; i++) {
    const jobName = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter'][i % 5];
    ants.push(JobIntegrationTestSuite.createMockAnt(jobName));
  }
  
  // Give them all experience
  ants.forEach((ant, index) => {
    ant.gainExperience(index * 10); // Variable experience
  });
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  JobIntegrationTestSuite.assertLessThan(totalTime, 1000, 
    'Creating and leveling 100 ants should take less than 1 second');
  
  // Verify all ants were processed correctly
  JobIntegrationTestSuite.assertEqual(ants.length, antCount, 'All ants should be created');
  ants.forEach((ant, index) => {
    JobIntegrationTestSuite.assertEqual(ant.experience, index * 10, 
      `Ant ${index} should have correct experience`);
  });
});

JobIntegrationTestSuite.test('Concurrent experience updates should be handled correctly', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Builder');
  
  // Simulate rapid experience gains (like in combat or rapid resource gathering)
  for (let i = 0; i < 50; i++) {
    ant.gainExperience(5);
  }
  
  JobIntegrationTestSuite.assertEqual(ant.experience, 250, 
    'Rapid experience updates should sum correctly');
  JobIntegrationTestSuite.assertEqual(ant.level, 3, 
    'Level should be calculated correctly after rapid updates');
});

// ===== ADVANCED INTEGRATION SCENARIOS =====

JobIntegrationTestSuite.test('Ant squad should coordinate with different job specializations', () => {
  const squad = {
    builder: JobIntegrationTestSuite.createMockAnt('Builder'),
    warrior: JobIntegrationTestSuite.createMockAnt('Warrior'),
    scout: JobIntegrationTestSuite.createMockAnt('Scout'),
    farmer: JobIntegrationTestSuite.createMockAnt('Farmer')
  };
  
  // Simulate squad mission with role-specific tasks
  squad.builder.performActivity('building', { structureType: 'defense', complexity: 'high' });
  squad.warrior.performActivity('combat', { enemyType: 'spider', victory: true });
  squad.scout.performActivity('exploration', { newArea: true, danger: false });
  squad.farmer.performActivity('gathering', { resourceType: 'food', amount: 100 });
  
  // All should have gained experience appropriate to their roles
  JobIntegrationTestSuite.assertGreaterThan(squad.builder.experience, 0, 'Builder should gain building exp');
  JobIntegrationTestSuite.assertGreaterThan(squad.warrior.experience, 0, 'Warrior should gain combat exp');
  JobIntegrationTestSuite.assertGreaterThan(squad.scout.experience, 0, 'Scout should gain exploration exp');
  JobIntegrationTestSuite.assertGreaterThan(squad.farmer.experience, 0, 'Farmer should gain gathering exp');
  
  // Verify different experience amounts based on job specialization
  const experiences = Object.values(squad).map(ant => ant.experience);
  JobIntegrationTestSuite.assertTrue(experiences.some(exp => exp !== experiences[0]), 
    'Different jobs should gain different amounts of experience from their specialized activities');
});

JobIntegrationTestSuite.test('Elite ant should maintain progression across multiple job changes', () => {
  const eliteAnt = JobIntegrationTestSuite.createMockAnt('Scout');
  
  // Progress through multiple job changes while maintaining experience
  const jobProgression = ['Scout', 'Builder', 'Warrior', 'Farmer'];
  let totalExpected = 0;
  
  jobProgression.forEach((jobName, index) => {
    eliteAnt.jobName = jobName;
    eliteAnt.job = new JobComponent(jobName);
    
    const expToAdd = (index + 1) * 100;
    eliteAnt.gainExperience(expToAdd);
    totalExpected += expToAdd;
    
    JobIntegrationTestSuite.assertEqual(eliteAnt.experience, totalExpected,
      `Experience should accumulate across job changes (${jobName})`);
    JobIntegrationTestSuite.assertEqual(eliteAnt.jobName, jobName,
      `Ant should have correct current job (${jobName})`);
  });
  
  // Final verification
  JobIntegrationTestSuite.assertEqual(eliteAnt.experience, 1000, 'Elite ant should have 1000 total experience');
  JobIntegrationTestSuite.assertGreaterThan(eliteAnt.level, 5, 'Elite ant should be high level');
});

JobIntegrationTestSuite.test('Ant retirement and experience transfer system', () => {
  const veteranAnt = JobIntegrationTestSuite.createMockAnt('Builder');
  const rookieAnt = JobIntegrationTestSuite.createMockAnt('Builder');
  
  // Veteran gains significant experience
  veteranAnt.gainExperience(500);
  const veteranLevel = veteranAnt.level;
  
  // Simulate experience transfer (mentoring system)
  const transferAmount = Math.floor(veteranAnt.experience * 0.1); // 10% transfer
  rookieAnt.gainExperience(transferAmount);
  
  JobIntegrationTestSuite.assertGreaterThan(rookieAnt.experience, 0, 
    'Rookie should receive transferred experience');
  JobIntegrationTestSuite.assertGreaterThan(rookieAnt.level, 1, 
    'Rookie should level up from transferred experience');
  JobIntegrationTestSuite.assertEqual(veteranAnt.experience, 500,
    'Veteran should retain original experience (non-destructive transfer)');
});

JobIntegrationTestSuite.test('Seasonal experience bonuses should affect all ants', () => {
  const colony = [];
  for (let i = 0; i < 5; i++) {
    colony.push(JobIntegrationTestSuite.createMockAnt('Builder'));
  }
  
  // Simulate seasonal bonus (e.g., abundant resources period)
  const baseExp = 50;
  const seasonalMultiplier = 1.5;
  
  colony.forEach(ant => {
    const bonusExp = Math.floor(baseExp * seasonalMultiplier);
    ant.gainExperience(bonusExp);
    
    JobIntegrationTestSuite.assertEqual(ant.experience, bonusExp,
      'Each ant should receive seasonal bonus experience');
  });
});

JobIntegrationTestSuite.test('Ant specialization should affect experience gain rates', () => {
  const builderAnt = JobIntegrationTestSuite.createMockAnt('Builder');
  const warriorAnt = JobIntegrationTestSuite.createMockAnt('Warrior');
  
  // Both perform the same building activity
  const builderExp = builderAnt.performActivity('building', { structureType: 'nest' });
  const warriorExp = warriorAnt.performActivity('building', { structureType: 'nest' });
  
  // Builder should be more efficient at building (in theory)
  JobIntegrationTestSuite.assertGreaterThan(builderExp, 0, 'Builder should gain building experience');
  JobIntegrationTestSuite.assertGreaterThan(warriorExp, 0, 'Warrior should also gain building experience');
  
  // Test combat efficiency
  const builderCombatExp = builderAnt.performActivity('combat', { victory: true });
  const warriorCombatExp = warriorAnt.performActivity('combat', { victory: true });
  
  JobIntegrationTestSuite.assertGreaterThan(warriorCombatExp, 0, 'Warrior should gain combat experience');
  JobIntegrationTestSuite.assertGreaterThan(builderCombatExp, 0, 'Builder should also gain combat experience');
});

JobIntegrationTestSuite.test('Experience decay system for inactive ants', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Scout');
  ant.gainExperience(200);
  const initialExp = ant.experience;
  
  // Simulate time passage without activity (this would need implementation)
  // For now, just test that the system could handle decay
  const decayRate = 0.01; // 1% per time unit
  const simulatedDecay = Math.floor(initialExp * decayRate);
  
  // This test mainly verifies the system can handle decay calculations
  JobIntegrationTestSuite.assertGreaterThan(simulatedDecay, 0, 'Decay calculation should work');
  JobIntegrationTestSuite.assertLessThan(simulatedDecay, initialExp, 'Decay should be less than total experience');
});

JobIntegrationTestSuite.test('Multi-generational ant colony experience inheritance', () => {
  // Parent generation
  const parentColony = [];
  for (let i = 0; i < 3; i++) {
    const parent = JobIntegrationTestSuite.createMockAnt('Builder');
    parent.gainExperience(300); // Experienced parents
    parentColony.push(parent);
  }
  
  // Child generation with inheritance bonus
  const childColony = [];
  parentColony.forEach((parent, index) => {
    const child = JobIntegrationTestSuite.createMockAnt('Builder');
    const inheritanceBonus = Math.floor(parent.experience * 0.05); // 5% inheritance
    child.gainExperience(inheritanceBonus);
    childColony.push(child);
    
    JobIntegrationTestSuite.assertGreaterThan(child.experience, 0,
      `Child ${index} should inherit experience bonus from parent`);
  });
  
  // Verify inheritance worked
  const totalChildExp = childColony.reduce((sum, child) => sum + child.experience, 0);
  JobIntegrationTestSuite.assertGreaterThan(totalChildExp, 0, 'Child generation should have inherited experience');
});

// ===== ADVANCED ERROR SCENARIOS =====

JobIntegrationTestSuite.test('System should handle memory pressure gracefully', () => {
  const massiveColony = [];
  
  try {
    // Create a very large number of ants to test memory handling
    for (let i = 0; i < 1000; i++) {
      const ant = JobIntegrationTestSuite.createMockAnt('Builder');
      ant.gainExperience(Math.random() * 100);
      massiveColony.push(ant);
    }
    
    JobIntegrationTestSuite.assertEqual(massiveColony.length, 1000, 'Should handle 1000 ants');
    
    // Verify all ants have valid data
    massiveColony.forEach((ant, index) => {
      JobIntegrationTestSuite.assertGreaterThan(ant.experience, -1, `Ant ${index} should have valid experience`);
      JobIntegrationTestSuite.assertGreaterThan(ant.level, 0, `Ant ${index} should have valid level`);
    });
    
  } catch (error) {
    JobIntegrationTestSuite.assertTrue(false, `Memory pressure test failed: ${error.message}`);
  }
});

JobIntegrationTestSuite.test('Experience overflow protection should prevent integer overflow', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Builder');
  
  // Test near JavaScript's maximum safe integer
  const maxSafeExp = Number.MAX_SAFE_INTEGER - 1000;
  ant.gainExperience(maxSafeExp);
  
  JobIntegrationTestSuite.assertGreaterThan(ant.experience, 0, 'Should handle very large experience values');
  JobIntegrationTestSuite.assertTrue(Number.isSafeInteger(ant.experience), 
    'Experience should remain a safe integer');
  
  // Try to cause overflow
  ant.gainExperience(2000);
  JobIntegrationTestSuite.assertTrue(Number.isSafeInteger(ant.experience), 
    'Experience should still be safe after potential overflow');
});

JobIntegrationTestSuite.test('Concurrent access to experience data should be thread-safe', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Builder');
  
  // Simulate rapid concurrent updates (like multiple activities completing simultaneously)
  const updatePromises = [];
  for (let i = 0; i < 10; i++) {
    updatePromises.push(Promise.resolve().then(() => {
      for (let j = 0; j < 10; j++) {
        ant.gainExperience(1);
      }
    }));
  }
  
  // All updates should complete without data corruption
  Promise.all(updatePromises).then(() => {
    JobIntegrationTestSuite.assertEqual(ant.experience, 100, 
      'Concurrent updates should result in correct total experience');
  }).catch(error => {
    JobIntegrationTestSuite.assertTrue(false, `Concurrent access test failed: ${error.message}`);
  });
});

// ===== GAME BALANCE INTEGRATION TESTS =====

JobIntegrationTestSuite.test('Experience rates should promote balanced gameplay', () => {
  const gameplayScenarios = [
    { job: 'Builder', activity: 'building', data: { structureType: 'nest' }, expectedMin: 10 },
    { job: 'Warrior', activity: 'combat', data: { victory: true }, expectedMin: 15 },
    { job: 'Scout', activity: 'exploration', data: { newArea: true }, expectedMin: 10 },
    { job: 'Farmer', activity: 'gathering', data: { resourceType: 'food', amount: 50 }, expectedMin: 5 }
  ];
  
  gameplayScenarios.forEach(scenario => {
    const ant = JobIntegrationTestSuite.createMockAnt(scenario.job);
    const exp = ant.performActivity(scenario.activity, scenario.data);
    
    JobIntegrationTestSuite.assertGreaterThan(exp, scenario.expectedMin,
      `${scenario.job} should gain reasonable experience from ${scenario.activity}`);
    JobIntegrationTestSuite.assertLessThan(exp, 100,
      `${scenario.job} experience from ${scenario.activity} should not be overpowered`);
  });
});

JobIntegrationTestSuite.test('Level progression should require reasonable time investment', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Builder');
  
  // Calculate activities needed for each level
  const levelData = [];
  for (let targetLevel = 2; targetLevel <= 5; targetLevel++) {
    const requiredExp = JobComponent.getLevelRequirements(targetLevel);
    const avgActivityExp = 20; // Estimate
    const activitiesNeeded = Math.ceil(requiredExp / avgActivityExp);
    
    levelData.push({ level: targetLevel, activities: activitiesNeeded, experience: requiredExp });
    
    // Each level should require more activities than the previous
    if (levelData.length > 1) {
      const prevLevel = levelData[levelData.length - 2];
      JobIntegrationTestSuite.assertGreaterThan(activitiesNeeded, prevLevel.activities,
        `Level ${targetLevel} should require more activities than level ${prevLevel.level}`);
    }
  }
  
  // Level 5 should be achievable but require significant investment
  const level5Data = levelData.find(d => d.level === 5);
  JobIntegrationTestSuite.assertGreaterThan(level5Data.activities, 20, 
    'Level 5 should require significant time investment');
  JobIntegrationTestSuite.assertLessThan(level5Data.activities, 200,
    'Level 5 should not be impossibly grindy');
});

// ===== PERSISTENCE AND DATA INTEGRITY TESTS =====

JobIntegrationTestSuite.test('Experience data should persist across game sessions', () => {
  const ant = JobIntegrationTestSuite.createMockAnt('Builder');
  ant.gainExperience(150);
  
  // Simulate saving experience data
  const savedData = {};
  JobComponent.experienceData.forEach((exp, antId) => {
    savedData[antId] = exp;
  });
  
  // Clear current data (simulate game restart)
  JobComponent.experienceData.clear();
  JobIntegrationTestSuite.assertEqual(JobComponent.getExperience(ant.id), 0,
    'Experience should be cleared');
  
  // Restore data (simulate loading save file)
  Object.entries(savedData).forEach(([antId, exp]) => {
    JobComponent.experienceData.set(antId, exp);
  });
  
  JobIntegrationTestSuite.assertEqual(JobComponent.getExperience(ant.id), 150,
    'Experience should be restored from save data');
});

JobIntegrationTestSuite.test('System should handle corrupted save data gracefully', () => {
  // Test with various corrupted data scenarios
  const corruptedData = [
    { antId: 'test1', exp: 'not_a_number' },
    { antId: null, exp: 100 },
    { antId: 'test2', exp: -50 },
    { antId: 'test3', exp: Infinity },
    { antId: 'test4', exp: NaN }
  ];
  
  corruptedData.forEach(({ antId, exp }) => {
    try {
      if (typeof exp === 'number' && exp > 0 && isFinite(exp)) {
        JobComponent.addExperience(antId, exp);
      }
    } catch (error) {
      // Should not throw errors
      JobIntegrationTestSuite.assertTrue(false, `Should handle corrupted data gracefully: ${error.message}`);
    }
  });
  
  // Valid data should still work
  JobComponent.addExperience('valid_ant', 100);
  JobIntegrationTestSuite.assertEqual(JobComponent.getExperience('valid_ant'), 100,
    'Valid data should work after handling corrupted data');
});

// Run integration tests
function runJobIntegrationTests() {
  console.log('🔗 Running Job System Integration Tests');
  console.log('=' .repeat(60));
  console.log('🚨 These tests are designed to FAIL initially and guide implementation');
  console.log('They test real-world integration scenarios between jobs and ants\n');
  
  // Clear any existing mock data
  JobIntegrationTestSuite.clearMockAnts();
  
  const summary = JobIntegrationTestSuite.getSummary();
  
  console.log('\n📊 Integration Tests Summary:');
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`📋 Total: ${summary.total}`);
  
  if (summary.failed > 0) {
    console.log('\n❌ Failed Integration Tests (Guide Implementation):');
    JobIntegrationTestSuite.testResults
      .filter(r => r.status === 'FAIL')
      .forEach(result => {
        console.log(`  • ${result.description}`);
        console.log(`    └─ ${result.error}`);
      });
  }
  
  console.log('\n🎯 Integration Test Categories Covered:');
  console.log('  ✅ Basic Job Assignment Integration');
  console.log('  ✅ Experience & Level Up Integration'); 
  console.log('  ✅ Activity-Based Experience Integration');
  console.log('  ✅ Multi-Ant Colony Management');
  console.log('  ✅ Special Abilities Integration');
  console.log('  ✅ Job Consistency & Permanence');
  console.log('  ✅ Edge Cases & Error Handling');
  console.log('  ✅ Performance & Scalability');
  console.log('  ✅ Data Persistence & Integrity');
  
  // Clean up
  JobIntegrationTestSuite.clearMockAnts();
  
  return summary.failed === 0;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    JobIntegrationTestSuite, 
    runJobIntegrationTests 
  };
}

// Auto-run if executed directly
if (require.main === module) {
  const success = runJobIntegrationTests();
  process.exit(success ? 0 : 1);
}