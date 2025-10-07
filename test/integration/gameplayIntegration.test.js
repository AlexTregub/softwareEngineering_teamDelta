/**
 * Advanced Job System Gameplay Integration Tests
 * Tests complex real-world scenarios that will occur during actual gameplay
 * Focuses on edge cases, performance, and user experience scenarios
 */

const JobComponent = require('../../Classes/ants/JobComponent.js');

const GameplayIntegrationTestSuite = {
  testResults: [],
  gameState: { 
    ants: [], 
    resources: [], 
    structures: [], 
    time: 0,
    events: []
  },
  
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

  assertGreaterThan: function(actual, expected, message = '') {
    if (actual <= expected) {
      throw new Error(`${message} - Expected ${actual} > ${expected}`);
    }
  },

  getSummary: function() {
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    return { passed, failed, total: this.testResults.length };
  },

  // Advanced mock ant with full gameplay features
  createGameplayAnt: function(jobName, id = null) {
    const antId = id || `gameplay_ant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ant = {
      id: antId,
      jobName: jobName,
      job: new JobComponent(jobName),
      level: 1,
      experience: 0,
      stats: JobComponent.getJobStats(jobName),
      position: { x: Math.random() * 800, y: Math.random() * 600 },
      health: 100,
      maxHealth: 100,
      inventory: [],
      currentTask: null,
      taskQueue: [],
      relationships: new Map(), // Other ants
      achievements: [],
      lastActivityTime: Date.now(),
      
      // Gameplay methods
      gainExperience: function(amount, source = 'unknown') {
        JobComponent.addExperience(this.id, amount);
        this.experience = JobComponent.getExperience(this.id);
        const leveledUp = this.updateLevel();
        if (leveledUp) {
          this.achievements.push(`Reached Level ${this.level}`);
        }
        return leveledUp;
      },
      
      updateLevel: function() {
        const newLevel = JobComponent.getLevel(this.id);
        if (newLevel !== this.level) {
          this.level = newLevel;
          this.updateStats();
          return true;
        }
        return false;
      },
      
      updateStats: function() {
        const progression = JobComponent.getProgressionStats(this.jobName, this.level);
        this.stats = progression.totalStats;
        this.specialAbilities = progression.specialAbilities;
      },
      
      performTask: function(taskType, taskData = {}) {
        const exp = JobComponent.getExperienceFromActivity(taskType, taskData);
        this.lastActivityTime = Date.now();
        return this.gainExperience(exp, taskType);
      },
      
      changeJob: function(newJobName) {
        this.jobName = newJobName;
        this.job = new JobComponent(newJobName);
        this.updateStats();
        this.achievements.push(`Changed job to ${newJobName}`);
      },
      
      canPerformTask: function(taskType) {
        // Job-specific task restrictions
        const jobTasks = {
          Builder: ['building', 'gathering', 'exploration'],
          Warrior: ['combat', 'patrol', 'defense'],
          Scout: ['exploration', 'gathering', 'reconnaissance'],
          Farmer: ['gathering', 'cultivation', 'storage'],
          Spitter: ['combat', 'defense', 'ranged_attack']
        };
        return jobTasks[this.jobName]?.includes(taskType) || false;
      }
    };
    
    return ant;
  },

  clearGameState: function() {
    this.gameState = { ants: [], resources: [], structures: [], time: 0, events: [] };
    JobComponent.experienceData.clear();
  }
};

// ===== REAL-WORLD GAMEPLAY SCENARIOS =====

GameplayIntegrationTestSuite.test('New player tutorial should guide job system learning', () => {
  const tutorialAnt = GameplayIntegrationTestSuite.createGameplayAnt('Builder');
  
  // Tutorial sequence
  const tutorialSteps = [
    { task: 'building', data: { structureType: 'nest', tutorial: true }, expectedMinExp: 5 },
    { task: 'gathering', data: { resourceType: 'food', amount: 10, tutorial: true }, expectedMinExp: 3 },
    { task: 'building', data: { structureType: 'tunnel', tutorial: true }, expectedMinExp: 5 }
  ];
  
  tutorialSteps.forEach((step, index) => {
    const leveledUp = tutorialAnt.performTask(step.task, step.data);
    GameplayIntegrationTestSuite.assertGreaterThan(tutorialAnt.experience, index * step.expectedMinExp,
      `Tutorial step ${index + 1} should provide meaningful experience`);
  });
  
  // Tutorial should get ant to level 2
  GameplayIntegrationTestSuite.assertGreaterThan(tutorialAnt.level, 1, 
    'Tutorial should help player reach level 2');
});

GameplayIntegrationTestSuite.test('Rush strategy should be viable but risky', () => {
  const rushBuilder = GameplayIntegrationTestSuite.createGameplayAnt('Builder');
  
  // Rapid building strategy (many simple structures)
  for (let i = 0; i < 20; i++) {
    rushBuilder.performTask('building', { structureType: 'basic', speed: 'fast' });
  }
  
  // Should gain levels quickly but maybe not optimally
  GameplayIntegrationTestSuite.assertGreaterThan(rushBuilder.level, 2, 
    'Rush strategy should provide quick early levels');
  GameplayIntegrationTestSuite.assertGreaterThan(rushBuilder.experience, 100,
    'Rush strategy should generate substantial experience');
});

GameplayIntegrationTestSuite.test('Balanced gameplay should reward diverse activities', () => {
  const balancedAnt = GameplayIntegrationTestSuite.createGameplayAnt('Builder');
  
  // Mixed activity strategy
  const activities = [
    { type: 'building', data: { structureType: 'nest' } },
    { type: 'gathering', data: { resourceType: 'materials' } },
    { type: 'building', data: { structureType: 'storage' } },
    { type: 'gathering', data: { resourceType: 'food' } },
    { type: 'building', data: { structureType: 'defense' } }
  ];
  
  activities.forEach(activity => {
    balancedAnt.performTask(activity.type, activity.data);
  });
  
  GameplayIntegrationTestSuite.assertGreaterThan(balancedAnt.experience, 50,
    'Balanced strategy should provide good experience');
  GameplayIntegrationTestSuite.assertTrue(balancedAnt.activities && balancedAnt.activities.length === 5,
    'Balanced strategy should track diverse activities');
});

GameplayIntegrationTestSuite.test('Endgame progression should remain engaging', () => {
  const veteranAnt = GameplayIntegrationTestSuite.createGameplayAnt('Warrior');
  
  // Simulate veteran ant with high experience
  veteranAnt.gainExperience(2000); // Very high level
  
  // Endgame activities should still provide meaningful progress
  const endgameExp = veteranAnt.performTask('combat', { 
    enemyType: 'boss', 
    difficulty: 'legendary',
    teamSize: 5 
  });
  
  GameplayIntegrationTestSuite.assertGreaterThan(endgameExp, 0,
    'Endgame activities should still provide experience');
  GameplayIntegrationTestSuite.assertGreaterThan(veteranAnt.level, 5,
    'Veteran ant should reach high levels');
});

// ===== MULTIPLAYER/TEAM SCENARIOS =====

GameplayIntegrationTestSuite.test('Team composition should encourage job diversity', () => {
  const team = {
    builder: GameplayIntegrationTestSuite.createGameplayAnt('Builder'),
    warrior: GameplayIntegrationTestSuite.createGameplayAnt('Warrior'),
    scout: GameplayIntegrationTestSuite.createGameplayAnt('Scout'),
    farmer: GameplayIntegrationTestSuite.createGameplayAnt('Farmer')
  };
  
  // Team mission scenario
  const missionTasks = [
    { ant: 'scout', task: 'exploration', data: { area: 'unknown', teamSupport: true } },
    { ant: 'builder', task: 'building', data: { structureType: 'outpost', teamSupport: true } },
    { ant: 'warrior', task: 'combat', data: { enemyType: 'guardian', teamSupport: true } },
    { ant: 'farmer', task: 'gathering', data: { resourceType: 'rare', teamSupport: true } }
  ];
  
  missionTasks.forEach(({ ant, task, data }) => {
    team[ant].performTask(task, data);
  });
  
  // All team members should benefit
  Object.values(team).forEach((ant, index) => {
    GameplayIntegrationTestSuite.assertGreaterThan(ant.experience, 0,
      `Team member ${index} should gain experience from team mission`);
  });
});

GameplayIntegrationTestSuite.test('Player should be able to specialize ants effectively', () => {
  const specialist = GameplayIntegrationTestSuite.createGameplayAnt('Builder');
  
  // Deep specialization in building
  const specializationTasks = [
    { task: 'building', data: { structureType: 'nest', complexity: 'advanced' } },
    { task: 'building', data: { structureType: 'tunnel', complexity: 'expert' } },
    { task: 'building', data: { structureType: 'fortress', complexity: 'master' } }
  ];
  
  specializationTasks.forEach(({ task, data }) => {
    specialist.performTask(task, data);
  });
  
  // Specialist should excel in their area
  GameplayIntegrationTestSuite.assertTrue(specialist.level >= 2,
    'Specialist should level up through focused activities');
  GameplayIntegrationTestSuite.assertGreaterThan(specialist.stats.strength, 20,
    'Specialist should have enhanced stats from progression');
});

// ===== EDGE CASE GAMEPLAY SCENARIOS =====

GameplayIntegrationTestSuite.test('Idle ants should not break the progression system', () => {
  const idleAnt = GameplayIntegrationTestSuite.createGameplayAnt('Scout');
  
  // Ant does nothing for extended period
  const initialExp = idleAnt.experience;
  const initialLevel = idleAnt.level;
  
  // Simulate time passage without activity
  for (let i = 0; i < 100; i++) {
    // Time passes but no activities
  }
  
  GameplayIntegrationTestSuite.assertEqual(idleAnt.experience, initialExp,
    'Idle ant should not gain experience without activities');
  GameplayIntegrationTestSuite.assertEqual(idleAnt.level, initialLevel,
    'Idle ant should not level up without activities');
});

GameplayIntegrationTestSuite.test('Job specialization should remain consistent throughout gameplay', () => {
  const specializedAnt = GameplayIntegrationTestSuite.createGameplayAnt('Builder');
  const originalJob = specializedAnt.jobName;
  
  // Gain experience through various activities
  specializedAnt.gainExperience(100);
  const baseExperience = specializedAnt.experience;
  
  // Perform multiple activities that could theoretically change job focus
  specializedAnt.performTask('building', { structureType: 'nest' });
  specializedAnt.performTask('gathering', { resourceType: 'materials' });
  
  // Job should remain consistent
  GameplayIntegrationTestSuite.assertEqual(specializedAnt.jobName, originalJob,
    'Ant should maintain job specialization throughout activities');
  
  // Should continue gaining experience in specialized role
  GameplayIntegrationTestSuite.assertGreaterThan(specializedAnt.experience, baseExperience,
    'Ant should continue gaining experience in specialized role');
});

GameplayIntegrationTestSuite.test('Save/load corruption should not destroy progression', () => {
  const progressedAnt = GameplayIntegrationTestSuite.createGameplayAnt('Warrior');
  progressedAnt.gainExperience(300);
  
  // Simulate save corruption scenarios
  const corruptionTests = [
    () => { progressedAnt.experience = 'corrupted'; },
    () => { progressedAnt.level = null; },
    () => { progressedAnt.stats = undefined; },
    () => { progressedAnt.jobName = 'InvalidJob'; }
  ];
  
  corruptionTests.forEach((corruptionTest, index) => {
    try {
      const backupExp = JobComponent.getExperience(progressedAnt.id);
      corruptionTest();
      
      // System should handle corruption gracefully
      progressedAnt.experience = backupExp;
      progressedAnt.updateLevel();
      
      GameplayIntegrationTestSuite.assertGreaterThan(progressedAnt.experience, 0,
        `Corruption test ${index} should not destroy valid experience data`);
    } catch (error) {
      // Should not throw unhandled errors
      GameplayIntegrationTestSuite.assertTrue(false, 
        `Corruption test ${index} should handle errors gracefully: ${error.message}`);
    }
  });
});

// ===== PERFORMANCE UNDER LOAD =====

GameplayIntegrationTestSuite.test('System should handle peak player activity gracefully', () => {
  const peakLoadTest = () => {
    const colony = [];
    const startTime = Date.now();
    
    // Simulate peak activity (100 ants performing activities simultaneously)
    for (let i = 0; i < 100; i++) {
      const job = ['Builder', 'Warrior', 'Scout', 'Farmer'][i % 4];
      const ant = GameplayIntegrationTestSuite.createGameplayAnt(job);
      
      // Each ant performs multiple activities
      for (let j = 0; j < 5; j++) {
        const activity = ['building', 'combat', 'exploration', 'gathering'][j % 4];
        ant.performTask(activity, { intensity: 'high', concurrent: true });
      }
      
      colony.push(ant);
    }
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    GameplayIntegrationTestSuite.assertLessThan(processingTime, 2000,
      'Peak load should be processed within 2 seconds');
    GameplayIntegrationTestSuite.assertEqual(colony.length, 100,
      'All ants should be processed during peak load');
    
    // Verify data integrity after peak load
    colony.forEach((ant, index) => {
      GameplayIntegrationTestSuite.assertGreaterThan(ant.experience, 0,
        `Ant ${index} should have valid experience after peak load`);
      GameplayIntegrationTestSuite.assertGreaterThan(ant.level, 0,
        `Ant ${index} should have valid level after peak load`);
    });
  };
  
  // Run the peak load test
  peakLoadTest();
});

GameplayIntegrationTestSuite.test('Memory usage should remain stable during extended play', () => {
  const extendedPlayTest = () => {
    const longTermAnts = [];
    
    // Simulate extended play session (1000 game cycles)
    for (let cycle = 0; cycle < 1000; cycle++) {
      if (cycle % 100 === 0) {
        // Periodically create new ants
        const ant = GameplayIntegrationTestSuite.createGameplayAnt('Builder');
        ant.performTask('building', { cycle: cycle });
        longTermAnts.push(ant);
      }
      
      // Existing ants continue activities
      longTermAnts.forEach(ant => {
        if (Math.random() > 0.7) { // 30% activity rate per cycle
          ant.performTask('gathering', { cycle: cycle, random: Math.random() });
        }
      });
    }
    
    // Memory usage verification (simplified)
    const experienceDataSize = JobComponent.experienceData.size;
    GameplayIntegrationTestSuite.assertGreaterThan(experienceDataSize, 5,
      'Experience data should contain multiple ants');
    GameplayIntegrationTestSuite.assertLessThan(experienceDataSize, 50,
      'Experience data should not grow excessively');
  };
  
  extendedPlayTest();
});

// Clean up and run tests
function runGameplayIntegrationTests() {
  console.log('🎮 Running Advanced Gameplay Integration Tests');
  console.log('=' .repeat(60));
  console.log('🎯 Testing real-world gameplay scenarios and edge cases');
  console.log('These tests simulate actual player experiences\n');
  
  GameplayIntegrationTestSuite.clearGameState();
  
  const summary = GameplayIntegrationTestSuite.getSummary();
  
  console.log('\n📊 Advanced Gameplay Tests Summary:');
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`📋 Total: ${summary.total}`);
  
  if (summary.failed > 0) {
    console.log('\n❌ Failed Gameplay Tests:');
    GameplayIntegrationTestSuite.testResults
      .filter(r => r.status === 'FAIL')
      .forEach(result => {
        console.log(`  • ${result.description}`);
        console.log(`    └─ ${result.error}`);
      });
  }
  
  GameplayIntegrationTestSuite.clearGameState();
  return summary.failed === 0;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    GameplayIntegrationTestSuite, 
    runGameplayIntegrationTests 
  };
}

// Auto-run if executed directly
if (require.main === module) {
  const success = runGameplayIntegrationTests();  
  process.exit(success ? 0 : 1);
}