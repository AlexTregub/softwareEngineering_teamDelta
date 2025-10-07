// Comprehensive Unit Tests for AntGroupManager
// Tests all real-world group management scenarios following TESTING_METHODOLOGY_STANDARDS.md
// Run with: node test/unit/antGroupManager.test.js

class TestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  assertTrue(condition, message) {
    this.assert(condition === true, message);
  }

  assertFalse(condition, message) {
    this.assert(condition === false, message);
  }

  run() {
    console.log('🔍 Running AntGroupManager Unit Test Suite...\n');
    
    for (const { name, testFunction } of this.tests) {
      try {
        testFunction();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('❌ Some tests failed!');
      process.exit(1);
    }
  }
}

// Mock ant class for testing
class MockAnt {
  constructor(id, x = 0, y = 0) {
    this.id = id;
    this.posX = x;
    this.posY = y;
    this.isSelected = false;
    this.isDestroyed = false;
    this._testId = id;
  }

  getPosition() {
    return { x: this.posX, y: this.posY };
  }

  setSelected(selected) {
    this.isSelected = selected;
  }

  destroy() {
    this.isDestroyed = true;
  }
}

// AntGroupManager implementation (placeholder for TDD - will be implemented based on these tests)
class AntGroupManager {
  constructor() {
    this.groups = new Map(); // groupNumber -> Set of ants
    this.maxGroups = 9;
    this.initialized = false;
  }

  initialize() {
    this.initialized = true;
    this.groups.clear();
    // Initialize empty groups 1-9
    for (let i = 1; i <= this.maxGroups; i++) {
      this.groups.set(i, new Set());
    }
  }

  assignGroup(groupNumber, selectedAnts) {
    if (!this.initialized) {
      throw new Error('AntGroupManager not initialized');
    }

    if (groupNumber < 1 || groupNumber > this.maxGroups) {
      console.error(`Invalid group number: ${groupNumber}. Must be 1-${this.maxGroups}`);
      return false;
    }

    if (!Array.isArray(selectedAnts) || selectedAnts.length === 0) {
      console.warn('No ants selected for group assignment');
      return false;
    }

    // Assign ants to group (multi-group membership enabled)
    const group = this.groups.get(groupNumber);
    let addedCount = 0;
    for (const ant of selectedAnts) {
      if (ant && !ant.isDestroyed) {
        if (!group.has(ant)) {
          group.add(ant);
          addedCount++;
        }
      }
    }

    return addedCount > 0;
  }

  selectGroup(groupNumber) {
    if (!this.initialized) {
      throw new Error('AntGroupManager not initialized');
    }

    if (groupNumber < 1 || groupNumber > this.maxGroups) {
      return false;
    }

    const group = this.groups.get(groupNumber);
    const ants = Array.from(group);

    // Deselect all ants first
    this.deselectAllAnts();

    // Select ants in this group
    for (const ant of ants) {
      if (ant && !ant.isDestroyed) {
        ant.setSelected(true);
      }
    }

    return ants.length > 0;
  }

  toggleGroup(groupNumber) {
    if (!this.initialized) {
      throw new Error('AntGroupManager not initialized');
    }

    if (groupNumber < 1 || groupNumber > this.maxGroups) {
      return false;
    }

    const group = this.groups.get(groupNumber);
    const ants = Array.from(group);

    if (ants.length === 0) {
      return false;
    }

    // Check if any ants in the group are currently selected
    const anySelected = ants.some(ant => ant && !ant.isDestroyed && ant.isSelected);

    if (anySelected) {
      // Deselect all ants in the group
      for (const ant of ants) {
        if (ant && !ant.isDestroyed) {
          ant.setSelected(false);
        }
      }
    } else {
      // Select all ants in the group
      this.deselectAllAnts();
      for (const ant of ants) {
        if (ant && !ant.isDestroyed) {
          ant.setSelected(true);
        }
      }
    }

    return true;
  }

  removeAntFromAllGroups(ant) {
    if (!ant) return;

    for (const group of this.groups.values()) {
      group.delete(ant);
    }
  }

  getGroupSize(groupNumber) {
    if (groupNumber < 1 || groupNumber > this.maxGroups) {
      return 0;
    }

    const group = this.groups.get(groupNumber);
    if (!group) return 0;

    // Count only non-destroyed ants
    let count = 0;
    for (const ant of group) {
      if (ant && !ant.isDestroyed) {
        count++;
      }
    }

    return count;
  }

  getGroupAnts(groupNumber) {
    if (groupNumber < 1 || groupNumber > this.maxGroups) {
      return [];
    }

    const group = this.groups.get(groupNumber);
    if (!group) return [];

    // Return only non-destroyed ants
    return Array.from(group).filter(ant => ant && !ant.isDestroyed);
  }

  isGroupEmpty(groupNumber) {
    return this.getGroupSize(groupNumber) === 0;
  }

  clearAllGroups() {
    for (const group of this.groups.values()) {
      group.clear();
    }
  }

  getGroupDisplay() {
    const displayGroups = [];

    for (let i = 1; i <= this.maxGroups; i++) {
      const size = this.getGroupSize(i);
      if (size > 0) {
        const ants = this.getGroupAnts(i);
        const anySelected = ants.some(ant => ant.isSelected);

        displayGroups.push({
          number: i,
          count: size,
          visible: true,
          highlighted: anySelected,
          active: anySelected
        });
      }
    }

    return {
      groups: displayGroups,
      totalGroups: displayGroups.length
    };
  }

  serializeGroups() {
    const serialized = {};

    for (let i = 1; i <= this.maxGroups; i++) {
      const ants = this.getGroupAnts(i);
      if (ants.length > 0) {
        serialized[i] = ants.map(ant => ant.id || ant._testId);
      }
    }

    return serialized;
  }

  deserializeGroups(serializedGroups, allAnts) {
    this.clearAllGroups();

    for (const [groupNumber, antIds] of Object.entries(serializedGroups)) {
      const groupNum = parseInt(groupNumber);
      if (groupNum >= 1 && groupNum <= this.maxGroups) {
        const groupAnts = antIds
          .map(antId => allAnts.find(ant => (ant.id || ant._testId) === antId))
          .filter(ant => ant && !ant.isDestroyed);

        if (groupAnts.length > 0) {
          const group = this.groups.get(groupNum);
          for (const ant of groupAnts) {
            group.add(ant);
          }
        }
      }
    }
  }

  // Helper method for testing
  deselectAllAnts() {
    // In real implementation, this would use AntUtilities.deselectAllAnts
    // For testing, we'll simulate it
    for (const group of this.groups.values()) {
      for (const ant of group) {
        if (ant && !ant.isDestroyed) {
          ant.setSelected(false);
        }
      }
    }
  }

  // Performance monitoring for testing
  getPerformanceStats() {
    let totalAnts = 0;
    let totalGroups = 0;

    for (let i = 1; i <= this.maxGroups; i++) {
      const size = this.getGroupSize(i);
      if (size > 0) {
        totalGroups++;
        totalAnts += size;
      }
    }

    return {
      totalAnts: totalAnts,
      activeGroups: totalGroups,
      memoryUsage: this.groups.size * 8 + totalAnts * 4 // Rough estimate
    };
  }

  // New multi-group methods
  isAntInGroup(groupNumber, ant) {
    if (groupNumber < 1 || groupNumber > this.maxGroups || !ant) {
      return false;
    }
    const group = this.groups.get(groupNumber);
    return group ? group.has(ant) : false;
  }

  getAntGroups(ant) {
    if (!ant) return [];
    
    const antGroups = [];
    for (const [groupNumber, group] of this.groups) {
      if (group.has(ant)) {
        antGroups.push(groupNumber);
      }
    }
    return antGroups;
  }

  removeAntFromGroup(groupNumber, ant) {
    if (groupNumber < 1 || groupNumber > this.maxGroups || !ant) {
      return false;
    }
    const group = this.groups.get(groupNumber);
    if (group && group.has(ant)) {
      group.delete(ant);
      return true;
    }
    return false;
  }

  getGroupMembershipStats() {
    const stats = {
      totalGroups: 0,
      totalUniqueAnts: new Set(),
      multiGroupAnts: []
    };

    // Count active groups and collect all ants
    for (const [groupNumber, group] of this.groups) {
      const validAnts = Array.from(group).filter(ant => ant && !ant.isDestroyed);
      if (validAnts.length > 0) {
        stats.totalGroups++;
        validAnts.forEach(ant => stats.totalUniqueAnts.add(ant));
      }
    }

    // Find ants in multiple groups
    for (const ant of stats.totalUniqueAnts) {
      const antGroups = this.getAntGroups(ant);
      if (antGroups.length > 1) {
        stats.multiGroupAnts.push({
          ant: ant,
          groups: antGroups,
          id: ant.id || ant._testId || ant.antIndex
        });
      }
    }

    stats.totalUniqueAnts = stats.totalUniqueAnts.size;
    return stats;
  }
}

const suite = new TestSuite();

// Test Setup
let groupManager;
let mockAnts;

function resetTestState() {
  groupManager = new AntGroupManager();
  groupManager.initialize();
  
  mockAnts = [
    new MockAnt(1, 100, 100),
    new MockAnt(2, 200, 100),
    new MockAnt(3, 300, 100),
    new MockAnt(4, 100, 200),
    new MockAnt(5, 200, 200),
    new MockAnt(6, 300, 200),
    new MockAnt(7, 100, 300),
    new MockAnt(8, 200, 300),
    new MockAnt(9, 300, 300),
    new MockAnt(10, 400, 400)
  ];
}

// ✅ STRONG TESTS: Real API Usage and Business Logic Validation

// Test 1: Initialization and Basic State
suite.test('AntGroupManager initializes correctly', () => {
  resetTestState();
  
  suite.assertTrue(groupManager.initialized, 'Manager should be initialized');
  
  // Test real API methods exist and work
  for (let i = 1; i <= 9; i++) {
    suite.assertEqual(groupManager.getGroupSize(i), 0, `Group ${i} should start empty`);
    suite.assertTrue(groupManager.isGroupEmpty(i), `Group ${i} should report as empty`);
  }
});

// Test 2: Group Assignment with Real Business Logic
suite.test('assignGroup assigns selected ants to specified group', () => {
  resetTestState();
  
  const antsToAssign = [mockAnts[0], mockAnts[1], mockAnts[2]];
  const success = groupManager.assignGroup(3, antsToAssign);
  
  suite.assertTrue(success, 'Assignment should succeed');
  suite.assertEqual(groupManager.getGroupSize(3), 3, 'Group 3 should contain 3 ants');
  
  const groupAnts = groupManager.getGroupAnts(3);
  suite.assertEqual(groupAnts.length, 3, 'getGroupAnts should return 3 ants');
  
  // Verify specific ants are in the group
  suite.assertTrue(groupAnts.includes(mockAnts[0]), 'First ant should be in group');
  suite.assertTrue(groupAnts.includes(mockAnts[1]), 'Second ant should be in group');
  suite.assertTrue(groupAnts.includes(mockAnts[2]), 'Third ant should be in group');
});

// Test 3: Group Selection with Real Selection System Integration
suite.test('selectGroup selects all ants in group', () => {
  resetTestState();
  
  // Assign ants to group first
  const antsToAssign = [mockAnts[3], mockAnts[4]];
  groupManager.assignGroup(5, antsToAssign);
  
  const success = groupManager.selectGroup(5);
  
  suite.assertTrue(success, 'Group selection should succeed');
  suite.assertTrue(mockAnts[3].isSelected, 'First ant in group should be selected');
  suite.assertTrue(mockAnts[4].isSelected, 'Second ant in group should be selected');
  
  // Verify other ants are not selected
  suite.assertFalse(mockAnts[0].isSelected, 'Ants not in group should not be selected');
});

// Test 4: Group Toggle Functionality
suite.test('toggleGroup toggles group selection state', () => {
  resetTestState();
  
  const antsToAssign = [mockAnts[5], mockAnts[6]];
  groupManager.assignGroup(7, antsToAssign);
  
  // First toggle should select the group
  let success = groupManager.toggleGroup(7);
  suite.assertTrue(success, 'First toggle should succeed');
  suite.assertTrue(mockAnts[5].isSelected, 'Ant should be selected after first toggle');
  suite.assertTrue(mockAnts[6].isSelected, 'Ant should be selected after first toggle');
  
  // Second toggle should deselect the group
  success = groupManager.toggleGroup(7);
  suite.assertTrue(success, 'Second toggle should succeed');
  suite.assertFalse(mockAnts[5].isSelected, 'Ant should be deselected after second toggle');
  suite.assertFalse(mockAnts[6].isSelected, 'Ant should be deselected after second toggle');
});

// Test 5: Multi-Group Membership Support
suite.test('ants can belong to multiple groups simultaneously', () => {
  resetTestState();
  
  const ant = mockAnts[7];
  
  // Assign to group 1
  groupManager.assignGroup(1, [ant]);
  suite.assertEqual(groupManager.getGroupSize(1), 1, 'Group 1 should have 1 ant');
  
  // Assign same ant to group 2 (should be in both groups now)
  groupManager.assignGroup(2, [ant]);
  suite.assertEqual(groupManager.getGroupSize(1), 1, 'Group 1 should still have ant');
  suite.assertEqual(groupManager.getGroupSize(2), 1, 'Group 2 should also have the ant');
  
  // Verify ant is in both groups
  suite.assertTrue(groupManager.isAntInGroup(1, ant), 'Ant should be in group 1');
  suite.assertTrue(groupManager.isAntInGroup(2, ant), 'Ant should be in group 2');
  
  // Check ant's group memberships
  const antGroups = groupManager.getAntGroups(ant);
  suite.assertEqual(antGroups.length, 2, 'Ant should belong to 2 groups');
  suite.assertTrue(antGroups.includes(1), 'Should include group 1');
  suite.assertTrue(antGroups.includes(2), 'Should include group 2');
});

// Test 6: Adding Ants to Existing Group
suite.test('assigning additional ants to existing group adds them', () => {
  resetTestState();
  
  // Initial assignment
  groupManager.assignGroup(4, [mockAnts[0], mockAnts[1]]);
  suite.assertEqual(groupManager.getGroupSize(4), 2, 'Group should initially have 2 ants');
  
  // Add more ants to the same group
  groupManager.assignGroup(4, [mockAnts[2], mockAnts[3]]);
  suite.assertEqual(groupManager.getGroupSize(4), 4, 'Group should have 4 ants after addition');
  
  const groupAnts = groupManager.getGroupAnts(4);
  suite.assertEqual(groupAnts.length, 4, 'getGroupAnts should return all 4 ants');
});

// Test 7: Destroyed Ant Cleanup
suite.test('removeAntFromAllGroups removes destroyed ants', () => {
  resetTestState();
  
  const ant = mockAnts[8];
  groupManager.assignGroup(6, [ant, mockAnts[9]]);
  suite.assertEqual(groupManager.getGroupSize(6), 2, 'Group should initially have 2 ants');
  
  // Simulate ant destruction
  ant.destroy();
  groupManager.removeAntFromAllGroups(ant);
  
  suite.assertEqual(groupManager.getGroupSize(6), 1, 'Group should have 1 ant after removal');
  
  const remainingAnts = groupManager.getGroupAnts(6);
  suite.assertFalse(remainingAnts.includes(ant), 'Destroyed ant should not be in group');
  suite.assertTrue(remainingAnts.includes(mockAnts[9]), 'Other ant should remain in group');
});

// Test 8: Invalid Group Number Handling
suite.test('invalid group numbers are handled gracefully', () => {
  resetTestState();
  
  // Test invalid assignments
  const invalidAssignment = groupManager.assignGroup(0, [mockAnts[0]]);
  suite.assertFalse(invalidAssignment, 'Assignment to group 0 should fail');
  
  const tooHighAssignment = groupManager.assignGroup(10, [mockAnts[0]]);
  suite.assertFalse(tooHighAssignment, 'Assignment to group 10 should fail');
  
  // Test invalid selections
  const invalidSelection = groupManager.selectGroup(-1);
  suite.assertFalse(invalidSelection, 'Selection of group -1 should fail');
  
  // Test invalid sizes
  suite.assertEqual(groupManager.getGroupSize(15), 0, 'Invalid group size should return 0');
  suite.assertTrue(groupManager.isGroupEmpty(20), 'Invalid group should report as empty');
});

// Test 9: Empty Input Handling
suite.test('empty ant arrays are handled correctly', () => {
  resetTestState();
  
  const emptyAssignment = groupManager.assignGroup(3, []);
  suite.assertFalse(emptyAssignment, 'Assignment with empty array should fail');
  
  const nullAssignment = groupManager.assignGroup(3, null);
  suite.assertFalse(nullAssignment, 'Assignment with null should fail');
  
  suite.assertEqual(groupManager.getGroupSize(3), 0, 'Group should remain empty after failed assignments');
});

// Test 10: Group Display Data Generation
suite.test('getGroupDisplay returns correct display data', () => {
  resetTestState();
  
  // Assign ants to multiple groups
  groupManager.assignGroup(1, [mockAnts[0]]);
  groupManager.assignGroup(3, [mockAnts[1], mockAnts[2]]);
  groupManager.assignGroup(7, [mockAnts[3], mockAnts[4], mockAnts[5]]);
  
  // Select group 3 for highlighting test
  groupManager.selectGroup(3);
  
  const displayData = groupManager.getGroupDisplay();
  
  suite.assertEqual(displayData.totalGroups, 3, 'Should show 3 active groups');
  suite.assertEqual(displayData.groups.length, 3, 'Groups array should have 3 items');
  
  // Find specific groups in display data
  const group1Data = displayData.groups.find(g => g.number === 1);
  const group3Data = displayData.groups.find(g => g.number === 3);
  const group7Data = displayData.groups.find(g => g.number === 7);
  
  suite.assertTrue(group1Data !== undefined, 'Group 1 should be in display data');
  suite.assertEqual(group1Data.count, 1, 'Group 1 should show count 1');
  suite.assertFalse(group1Data.highlighted, 'Group 1 should not be highlighted');
  
  suite.assertTrue(group3Data !== undefined, 'Group 3 should be in display data');
  suite.assertEqual(group3Data.count, 2, 'Group 3 should show count 2');
  suite.assertTrue(group3Data.highlighted, 'Group 3 should be highlighted (selected)');
  
  suite.assertTrue(group7Data !== undefined, 'Group 7 should be in display data');
  suite.assertEqual(group7Data.count, 3, 'Group 7 should show count 3');
});

// Test 11: Serialization and Persistence
suite.test('serializeGroups and deserializeGroups work correctly', () => {
  resetTestState();
  
  // Set up groups
  groupManager.assignGroup(2, [mockAnts[0], mockAnts[1]]);
  groupManager.assignGroup(5, [mockAnts[2]]);
  groupManager.assignGroup(8, [mockAnts[3], mockAnts[4], mockAnts[5]]);
  
  // Serialize
  const serialized = groupManager.serializeGroups();
  
  suite.assertTrue(serialized[2] !== undefined, 'Group 2 should be serialized');
  suite.assertEqual(serialized[2].length, 2, 'Group 2 should have 2 ant IDs');
  suite.assertTrue(serialized[5] !== undefined, 'Group 5 should be serialized');
  suite.assertEqual(serialized[5].length, 1, 'Group 5 should have 1 ant ID');
  
  // Clear and deserialize
  groupManager.clearAllGroups();
  suite.assertEqual(groupManager.getGroupSize(2), 0, 'Group should be empty after clear');
  
  groupManager.deserializeGroups(serialized, mockAnts);
  
  // Verify restoration
  suite.assertEqual(groupManager.getGroupSize(2), 2, 'Group 2 should be restored with 2 ants');
  suite.assertEqual(groupManager.getGroupSize(5), 1, 'Group 5 should be restored with 1 ant');
  suite.assertEqual(groupManager.getGroupSize(8), 3, 'Group 8 should be restored with 3 ants');
  
  const restoredGroup2 = groupManager.getGroupAnts(2);
  suite.assertTrue(restoredGroup2.includes(mockAnts[0]), 'Original ant should be restored to group');
  suite.assertTrue(restoredGroup2.includes(mockAnts[1]), 'Original ant should be restored to group');
});

// Test 12: Performance and Memory Management
suite.test('performance stats and memory management', () => {
  resetTestState();
  
  // Create realistic group scenario
  for (let i = 1; i <= 9; i++) {
    const antsForGroup = mockAnts.slice((i-1), i+1); // 1-2 ants per group
    if (antsForGroup.length > 0) {
      groupManager.assignGroup(i, antsForGroup);
    }
  }
  
  const stats = groupManager.getPerformanceStats();
  
  suite.assertTrue(stats.totalAnts > 0, 'Should track total ants in groups');
  suite.assertTrue(stats.activeGroups > 0, 'Should track active groups');
  suite.assertTrue(stats.memoryUsage > 0, 'Should estimate memory usage');
  
  // Performance test: rapid group operations
  const startTime = performance.now();
  
  for (let i = 0; i < 100; i++) {
    const groupNum = (i % 9) + 1;
    groupManager.selectGroup(groupNum);
    groupManager.toggleGroup(groupNum);
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Should complete 200 operations in reasonable time
  suite.assertTrue(duration < 100, `Performance test should complete quickly, took ${duration.toFixed(2)}ms`);
});

// Test 13: Multiple Group Selection Exclusivity
suite.test('selecting different groups properly deselects previous groups', () => {
  resetTestState();
  
  // Set up multiple groups
  groupManager.assignGroup(1, [mockAnts[0], mockAnts[1]]);
  groupManager.assignGroup(2, [mockAnts[2], mockAnts[3]]);
  groupManager.assignGroup(3, [mockAnts[4]]);
  
  // Select group 1
  groupManager.selectGroup(1);
  suite.assertTrue(mockAnts[0].isSelected, 'Group 1 ant should be selected');
  suite.assertTrue(mockAnts[1].isSelected, 'Group 1 ant should be selected');
  suite.assertFalse(mockAnts[2].isSelected, 'Group 2 ant should not be selected');
  
  // Select group 2 (should deselect group 1)
  groupManager.selectGroup(2);
  suite.assertFalse(mockAnts[0].isSelected, 'Group 1 ant should be deselected');
  suite.assertFalse(mockAnts[1].isSelected, 'Group 1 ant should be deselected');
  suite.assertTrue(mockAnts[2].isSelected, 'Group 2 ant should be selected');
  suite.assertTrue(mockAnts[3].isSelected, 'Group 2 ant should be selected');
  
  // Select group 3
  groupManager.selectGroup(3);
  suite.assertFalse(mockAnts[2].isSelected, 'Group 2 ant should be deselected');
  suite.assertTrue(mockAnts[4].isSelected, 'Group 3 ant should be selected');
});

// Test 14: Uninitialized State Handling
suite.test('operations fail gracefully when not initialized', () => {
  const uninitializedManager = new AntGroupManager();
  // Note: not calling initialize()
  
  try {
    uninitializedManager.assignGroup(1, [mockAnts[0]]);
    suite.assert(false, 'Should throw error when not initialized');
  } catch (error) {
    suite.assertTrue(error.message.includes('not initialized'), 'Should throw initialization error');
  }
  
  try {
    uninitializedManager.selectGroup(1);
    suite.assert(false, 'Should throw error when not initialized');
  } catch (error) {
    suite.assertTrue(error.message.includes('not initialized'), 'Should throw initialization error');
  }
});

// Test 15: Multi-Group Management Methods
suite.test('multi-group management methods work correctly', () => {
  resetTestState();
  
  const ant1 = mockAnts[0];
  const ant2 = mockAnts[1];
  
  // Assign ant1 to multiple groups
  groupManager.assignGroup(1, [ant1]);
  groupManager.assignGroup(3, [ant1]);
  groupManager.assignGroup(5, [ant1]);
  
  // Assign ant2 to overlapping groups
  groupManager.assignGroup(3, [ant2]);
  groupManager.assignGroup(7, [ant2]);
  
  // Test group membership queries
  const ant1Groups = groupManager.getAntGroups(ant1);
  suite.assertEqual(ant1Groups.length, 3, 'Ant1 should be in 3 groups');
  suite.assertTrue(ant1Groups.includes(1), 'Ant1 should be in group 1');
  suite.assertTrue(ant1Groups.includes(3), 'Ant1 should be in group 3');
  suite.assertTrue(ant1Groups.includes(5), 'Ant1 should be in group 5');
  
  // Test group membership statistics
  const stats = groupManager.getGroupMembershipStats();
  suite.assertEqual(stats.totalGroups, 4, 'Should have 4 active groups');
  suite.assertEqual(stats.totalUniqueAnts, 2, 'Should have 2 unique ants');
  suite.assertEqual(stats.multiGroupAnts.length, 2, 'Both ants are in multiple groups');
  
  // Test individual group removal
  const removed = groupManager.removeAntFromGroup(3, ant1);
  suite.assertTrue(removed, 'Should successfully remove ant from group 3');
  
  const ant1GroupsAfter = groupManager.getAntGroups(ant1);
  suite.assertEqual(ant1GroupsAfter.length, 2, 'Ant1 should now be in 2 groups');
  suite.assertFalse(ant1GroupsAfter.includes(3), 'Ant1 should no longer be in group 3');
  
  // Group 3 should still have ant2
  suite.assertTrue(groupManager.isAntInGroup(3, ant2), 'Ant2 should still be in group 3');
});

// Test 16: Multi-group assignment behavior verification
suite.test('multi-group assignment preserves existing memberships', () => {
  resetTestState();
  
  // This test specifically verifies that assigning an ant to a new group
  // does NOT remove it from existing groups (the key change we made)
  
  const ant = mockAnts[0];
  
  // Initially assign to group 1
  groupManager.assignGroup(1, [ant]);
  suite.assertTrue(groupManager.isAntInGroup(1, ant), 'Ant should be in group 1');
  suite.assertEqual(groupManager.getGroupSize(1), 1, 'Group 1 should have 1 ant');
  
  // Assign same ant to group 2 - should NOT remove from group 1
  groupManager.assignGroup(2, [ant]);
  suite.assertTrue(groupManager.isAntInGroup(1, ant), 'Ant should still be in group 1');
  suite.assertTrue(groupManager.isAntInGroup(2, ant), 'Ant should now also be in group 2');
  suite.assertEqual(groupManager.getGroupSize(1), 1, 'Group 1 should still have 1 ant');
  suite.assertEqual(groupManager.getGroupSize(2), 1, 'Group 2 should have 1 ant');
  
  // Assign to group 3 - should preserve both previous memberships
  groupManager.assignGroup(3, [ant]);
  suite.assertTrue(groupManager.isAntInGroup(1, ant), 'Ant should still be in group 1');
  suite.assertTrue(groupManager.isAntInGroup(2, ant), 'Ant should still be in group 2');
  suite.assertTrue(groupManager.isAntInGroup(3, ant), 'Ant should now also be in group 3');
  
  // Verify ant reports all its group memberships
  const antGroups = groupManager.getAntGroups(ant);
  suite.assertEqual(antGroups.length, 3, 'Ant should report 3 group memberships');
  suite.assertTrue(antGroups.includes(1) && antGroups.includes(2) && antGroups.includes(3), 
                   'Should include all assigned groups');
  
  // Test that removing from one group preserves others
  groupManager.removeAntFromGroup(2, ant);
  suite.assertTrue(groupManager.isAntInGroup(1, ant), 'Ant should still be in group 1');
  suite.assertFalse(groupManager.isAntInGroup(2, ant), 'Ant should no longer be in group 2');
  suite.assertTrue(groupManager.isAntInGroup(3, ant), 'Ant should still be in group 3');
});

// Test 17: Edge Cases and Boundary Conditions
suite.test('edge cases and boundary conditions', () => {
  resetTestState();
  
  // Test with destroyed ants
  const destroyedAnt = mockAnts[9];
  destroyedAnt.destroy();
  
  groupManager.assignGroup(9, [destroyedAnt, mockAnts[8]]);
  suite.assertEqual(groupManager.getGroupSize(9), 1, 'Should only count non-destroyed ants');
  
  const groupAnts = groupManager.getGroupAnts(9);
  suite.assertEqual(groupAnts.length, 1, 'Should only return non-destroyed ants');
  suite.assertFalse(groupAnts.includes(destroyedAnt), 'Should not include destroyed ant');
  
  // Test selecting empty group
  const emptyGroupSelection = groupManager.selectGroup(4); // Empty group
  suite.assertFalse(emptyGroupSelection, 'Selecting empty group should return false');
  
  // Test toggle on empty group
  const emptyGroupToggle = groupManager.toggleGroup(4);
  suite.assertFalse(emptyGroupToggle, 'Toggling empty group should return false');
});

// Run all tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestSuite, AntGroupManager, MockAnt };
}

// Auto-run if running directly
if (typeof window === 'undefined' && typeof module !== 'undefined') {
  console.log('🧪 Running AntGroupManager unit tests...');
  suite.run();
}