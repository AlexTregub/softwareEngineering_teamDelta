/**
 * @fileoverview AntGroupManager - Core ant group management system
 * @module AntGroupManager  
 * @author Software Engineering Team Delta
 * @version 1.0.0
 * @see {@link test/unit/antGroupManager.test.js} Unit tests and specifications
 */

/**
 * Manages ant control groups for player convenience.
 * Allows assignment of ants to groups 1-9 and quick selection via hotkeys.
 * Integrates with AntManager and DraggablePanelManager for full functionality.
 * 
 * @class AntGroupManager
 * @example
 * const groupManager = new AntGroupManager();
 * groupManager.initialize();
 * 
 * // Assign selected ants to group 1
 * const selectedAnts = [ant1, ant2, ant3];
 * groupManager.assignGroup(1, selectedAnts);
 * 
 * // Select group 1
 * groupManager.selectGroup(1);
 */
class AntGroupManager {
  /**
   * Creates a new AntGroupManager instance.
   */
  constructor() {
    /** @type {Map<number, Set<Object>>} Groups storage (1-9) */
    this.groups = new Map();
    
    /** @type {number} Maximum number of groups supported */
    this.maxGroups = 9;
    
    /** @type {boolean} Whether the manager has been initialized */
    this.initialized = false;
    
    /** @type {number} Performance tracking - operations count */
    this.operationsCount = 0;
    
    /** @type {Date} Performance tracking - last operation time */
    this.lastOperationTime = new Date();
  }

  /**
   * Initialize the group manager.
   * Must be called before using any other methods.
   * 
   * @returns {boolean} True if initialization succeeded
   * @example
   * const success = groupManager.initialize();
   * if (success) {
   *   console.log('Group manager ready');
   * }
   */
  initialize() {
    if (this.initialized) {
      console.warn('AntGroupManager already initialized');
      return true;
    }

    try {
      // Initialize empty groups 1-9
      for (let i = 1; i <= this.maxGroups; i++) {
        this.groups.set(i, new Set());
      }
      
      this.initialized = true;
      this.operationsCount = 0;
      this.lastOperationTime = new Date();
      
      console.log('✅ AntGroupManager initialized with', this.maxGroups, 'groups');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AntGroupManager:', error);
      return false;
    }
  }

  /**
   * Assign ants to a specific group.
   * Ants can belong to multiple groups simultaneously for flexible formations.
   * 
   * @param {number} groupNumber - Group number (1-9)
   * @param {Array<Object>} ants - Array of ant objects to assign
   * @returns {boolean} True if assignment succeeded
   * @example
   * const success = groupManager.assignGroup(3, [ant1, ant2]);
   * if (success) {
   *   console.log('Ants assigned to group 3');
   * }
   */
  assignGroup(groupNumber, ants) {
    if (!this._validateGroupNumber(groupNumber)) return false;
    if (!this._validateAntsArray(ants)) return false;
    if (!this.initialized) {
      console.error('AntGroupManager not initialized');
      return false;
    }

    this._trackOperation();

    try {
      const group = this.groups.get(groupNumber);
      
      // Add valid ants to the target group (allowing multi-group membership)
      let addedCount = 0;
      for (const ant of ants) {
        if (ant && !ant.isDestroyed) {
          // Add to this group (ant can be in multiple groups)
          if (!group.has(ant)) {
            group.add(ant);
            addedCount++;
          }
        }
      }
      
      if (addedCount > 0) {
        console.log(`Assigned ${addedCount} ants to group ${groupNumber} (multi-group enabled)`);
        return true;
      } else {
        console.warn(`No new ants to assign to group ${groupNumber} (may already be in group)`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to assign group ${groupNumber}:`, error);
      return false;
    }
  }

  /**
   * Select all ants in a specific group.
   * Deselects other ants first for exclusive selection.
   * 
   * @param {number} groupNumber - Group number (1-9)
   * @returns {boolean} True if selection succeeded
   * @example
   * const success = groupManager.selectGroup(2);
   * if (success) {
   *   console.log('Group 2 selected');
   * }
   */
  selectGroup(groupNumber) {
    if (!this._validateGroupNumber(groupNumber)) return false;
    if (!this.initialized) {
      console.error('AntGroupManager not initialized');
      return false;
    }

    this._trackOperation();

    try {
      const group = this.groups.get(groupNumber);
      const ants = Array.from(group);
      
      if (ants.length === 0) {
        console.log(`Group ${groupNumber} is empty`);
        return false;
      }

      // Deselect all ants first
      this.deselectAllAnts();

      // Select ants in this group
      let selectedCount = 0;
      for (const ant of ants) {
        if (ant && !ant.isDestroyed && typeof ant.setSelected === 'function') {
          ant.setSelected(true);
          selectedCount++;
        }
      }

      if (selectedCount > 0) {
        console.log(`Selected ${selectedCount} ants from group ${groupNumber}`);
        return true;
      } else {
        console.warn(`No valid ants to select in group ${groupNumber}`);
        return false;
      }
    } catch (error) {
      console.error(`Failed to select group ${groupNumber}:`, error);
      return false;
    }
  }

  /**
   * Toggle selection state of a group.
   * If any ants in the group are selected, deselects all.
   * If no ants in the group are selected, selects all.
   * 
   * @param {number} groupNumber - Group number (1-9)
   * @returns {boolean} True if toggle succeeded
   * @example
   * groupManager.toggleGroup(1); // First press selects
   * groupManager.toggleGroup(1); // Second press deselects
   */
  toggleGroup(groupNumber) {
    if (!this._validateGroupNumber(groupNumber)) return false;
    if (!this.initialized) {
      console.error('AntGroupManager not initialized');
      return false;
    }

    this._trackOperation();

    try {
      const group = this.groups.get(groupNumber);
      const ants = Array.from(group);
      
      if (ants.length === 0) {
        console.log(`Group ${groupNumber} is empty`);
        return false;
      }

      // Check if any ants in this group are currently selected
      const anySelected = ants.some(ant => 
        ant && !ant.isDestroyed && ant.isSelected
      );

      if (anySelected) {
        // Deselect all ants in this group
        for (const ant of ants) {
          if (ant && !ant.isDestroyed && typeof ant.setSelected === 'function') {
            ant.setSelected(false);
          }
        }
        console.log(`Deselected group ${groupNumber}`);
      } else {
        // Select all ants in this group (deselect others first)
        this.deselectAllAnts();
        for (const ant of ants) {
          if (ant && !ant.isDestroyed && typeof ant.setSelected === 'function') {
            ant.setSelected(true);
          }
        }
        console.log(`Selected group ${groupNumber}`);
      }

      return true;
    } catch (error) {
      console.error(`Failed to toggle group ${groupNumber}:`, error);
      return false;
    }
  }

  /**
   * Remove an ant from a specific group.
   * Used for removing ants from individual groups while keeping them in others.
   * 
   * @param {number} groupNumber - Group number (1-9)
   * @param {Object} ant - Ant object to remove
   * @returns {boolean} True if ant was found and removed from the group
   * @example
   * groupManager.removeAntFromGroup(2, ant1);
   */
  removeAntFromGroup(groupNumber, ant) {
    if (!this._validateGroupNumber(groupNumber)) return false;
    if (!ant) return false;
    if (!this.initialized) return false;

    this._trackOperation();

    const group = this.groups.get(groupNumber);
    if (group.has(ant)) {
      group.delete(ant);
      console.log(`Removed ant from group ${groupNumber}`);
      return true;
    }
    
    return false;
  }

  /**
   * Remove an ant from all groups.
   * Used when ants are destroyed or need to be completely unassigned.
   * 
   * @param {Object} ant - Ant object to remove
   * @returns {boolean} True if ant was found and removed
   * @example
   * groupManager.removeAntFromAllGroups(destroyedAnt);
   */
  removeAntFromAllGroups(ant) {
    if (!ant) return false;
    if (!this.initialized) return false;

    this._trackOperation();

    let removed = false;
    for (const group of this.groups.values()) {
      if (group.has(ant)) {
        group.delete(ant);
        removed = true;
      }
    }

    return removed;
  }

  /**
   * Get the number of ants in a specific group.
   * 
   * @param {number} groupNumber - Group number (1-9)
   * @returns {number} Number of ants in the group, or 0 if invalid
   * @example
   * const count = groupManager.getGroupSize(3);
   * console.log(`Group 3 has ${count} ants`);
   */
  getGroupSize(groupNumber) {
    if (!this._validateGroupNumber(groupNumber)) return 0;
    if (!this.initialized) return 0;

    const group = this.groups.get(groupNumber);
    return group ? group.size : 0;
  }

  /**
   * Check if an ant belongs to a specific group.
   * 
   * @param {number} groupNumber - Group number (1-9)
   * @param {Object} ant - Ant object to check
   * @returns {boolean} True if ant is in the group
   * @example
   * if (groupManager.isAntInGroup(2, myAnt)) {
   *   console.log('Ant is in group 2');
   * }
   */
  isAntInGroup(groupNumber, ant) {
    if (!this._validateGroupNumber(groupNumber)) return false;
    if (!ant || !this.initialized) return false;

    const group = this.groups.get(groupNumber);
    return group ? group.has(ant) : false;
  }

  /**
   * Get all groups that an ant belongs to.
   * 
   * @param {Object} ant - Ant object to check
   * @returns {Array<number>} Array of group numbers the ant belongs to
   * @example
   * const antGroups = groupManager.getAntGroups(myAnt);
   * console.log(`Ant belongs to groups: ${antGroups.join(', ')}`);
   */
  getAntGroups(ant) {
    if (!ant || !this.initialized) return [];

    const antGroups = [];
    for (const [groupNumber, group] of this.groups) {
      if (group.has(ant)) {
        antGroups.push(groupNumber);
      }
    }

    return antGroups;
  }

  /**
   * Get display information for all groups.
   * Used by UI components to show group status.
   * 
   * @returns {Array<Object>} Array of group display objects
   * @example
   * const display = groupManager.getGroupDisplay();
   * display.forEach(group => {
   *   console.log(`Group ${group.number}: ${group.count} ants`);
   * });
   */
  getGroupDisplay() {
    if (!this.initialized) return [];

    this._trackOperation();

    const display = [];
    for (let i = 1; i <= this.maxGroups; i++) {
      const group = this.groups.get(i);
      const validAnts = Array.from(group).filter(ant => ant && !ant.isDestroyed);
      
      // Update group to remove destroyed ants
      if (validAnts.length !== group.size) {
        group.clear();
        validAnts.forEach(ant => group.add(ant));
      }

      if (validAnts.length > 0) {
        const selectedCount = validAnts.filter(ant => ant.isSelected).length;
        display.push({
          number: i,
          count: validAnts.length,
          selected: selectedCount,
          allSelected: selectedCount === validAnts.length,
          someSelected: selectedCount > 0 && selectedCount < validAnts.length,
          multiGroup: true // Indicate multi-group support is enabled
        });
      }
    }

    return display;
  }

  /**
   * Get comprehensive group membership statistics.
   * Shows which ants belong to which groups for analysis.
   * 
   * @returns {Object} Detailed group membership information
   * @example
   * const stats = groupManager.getGroupMembershipStats();
   * console.log('Multi-group ants:', stats.multiGroupAnts.length);
   */
  getGroupMembershipStats() {
    if (!this.initialized) return null;

    this._trackOperation();

    const stats = {
      totalGroups: 0,
      totalAnts: new Set(),
      multiGroupAnts: [],
      groupOverlaps: {},
      averageGroupsPerAnt: 0
    };

    // Count active groups and collect all ants
    for (const [groupNumber, group] of this.groups) {
      const validAnts = Array.from(group).filter(ant => ant && !ant.isDestroyed);
      if (validAnts.length > 0) {
        stats.totalGroups++;
        validAnts.forEach(ant => stats.totalAnts.add(ant));
      }
    }

    // Find ants in multiple groups
    const totalAntGroupMemberships = [];
    for (const ant of stats.totalAnts) {
      const antGroups = this.getAntGroups(ant);
      totalAntGroupMemberships.push(antGroups.length);
      
      if (antGroups.length > 1) {
        stats.multiGroupAnts.push({
          ant: ant,
          groups: antGroups,
          id: ant.id || ant._testId || ant.antIndex
        });
      }

      // Track group overlaps
      for (let i = 0; i < antGroups.length; i++) {
        for (let j = i + 1; j < antGroups.length; j++) {
          const pair = `${antGroups[i]}-${antGroups[j]}`;
          stats.groupOverlaps[pair] = (stats.groupOverlaps[pair] || 0) + 1;
        }
      }
    }

    // Calculate average groups per ant
    if (totalAntGroupMemberships.length > 0) {
      stats.averageGroupsPerAnt = totalAntGroupMemberships.reduce((sum, count) => sum + count, 0) / totalAntGroupMemberships.length;
    }

    stats.totalUniqueAnts = stats.totalAnts.size;
    
    return stats;
  }

  /**
   * Deselect all ants across all groups.
   * Helper method for exclusive selection.
   * 
   * @returns {number} Number of ants deselected
   */
  deselectAllAnts() {
    if (!this.initialized) return 0;

    let deselectedCount = 0;
    for (const group of this.groups.values()) {
      for (const ant of group) {
        if (ant && !ant.isDestroyed && ant.isSelected && typeof ant.setSelected === 'function') {
          ant.setSelected(false);
          deselectedCount++;
        }
      }
    }

    return deselectedCount;
  }

  /**
   * Get all currently selected ants from all groups.
   * 
   * @returns {Array<Object>} Array of selected ant objects
   * @example
   * const selected = groupManager.getSelectedAnts();
   * console.log(`${selected.length} ants are currently selected`);
   */
  getSelectedAnts() {
    if (!this.initialized) return [];

    const selected = [];
    for (const group of this.groups.values()) {
      for (const ant of group) {
        if (ant && !ant.isDestroyed && ant.isSelected) {
          selected.push(ant);
        }
      }
    }

    return selected;
  }

  /**
   * Serialize group data for persistence.
   * 
   * @returns {Object} Serialized group data
   * @example
   * const data = groupManager.serializeGroups();
   * localStorage.setItem('antGroups', JSON.stringify(data));
   */
  serializeGroups() {
    if (!this.initialized) return null;

    this._trackOperation();

    const serialized = {
      timestamp: new Date().toISOString(),
      groups: {}
    };

    for (const [groupNumber, group] of this.groups) {
      const validAnts = Array.from(group).filter(ant => ant && !ant.isDestroyed);
      if (validAnts.length > 0) {
        // Store ant IDs for reconstruction
        serialized.groups[groupNumber] = validAnts.map(ant => ({
          id: ant.id || ant._testId || ant.antIndex,
          position: ant.getPosition ? ant.getPosition() : { x: ant.posX, y: ant.posY }
        }));
      }
    }

    return serialized;
  }

  /**
   * Deserialize group data from persistence.
   * 
   * @param {Object} data - Serialized group data
   * @param {Function} antLookupFn - Function to find ants by ID
   * @returns {boolean} True if deserialization succeeded
   * @example
   * const data = JSON.parse(localStorage.getItem('antGroups'));
   * const success = groupManager.deserializeGroups(data, (id) => findAntById(id));
   */
  deserializeGroups(data, antLookupFn) {
    if (!this.initialized) return false;
    if (!data || !data.groups) return false;
    if (typeof antLookupFn !== 'function') return false;

    this._trackOperation();

    try {
      // Clear existing groups
      for (const group of this.groups.values()) {
        group.clear();
      }

      // Reconstruct groups
      for (const [groupNumberStr, antData] of Object.entries(data.groups)) {
        const groupNumber = parseInt(groupNumberStr);
        if (!this._validateGroupNumber(groupNumber)) continue;

        const group = this.groups.get(groupNumber);
        for (const antInfo of antData) {
          const ant = antLookupFn(antInfo.id);
          if (ant && !ant.isDestroyed) {
            group.add(ant);
          }
        }
      }

      console.log('✅ Groups deserialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to deserialize groups:', error);
      return false;
    }
  }

  /**
   * Get performance and diagnostic information.
   * 
   * @returns {Object} Performance statistics
   * @example
   * const stats = groupManager.getPerformanceStats();
   * console.log('Operations:', stats.operationsCount);
   */
  getPerformanceStats() {
    const now = new Date();
    const timeSinceLastOp = now - this.lastOperationTime;

    return {
      initialized: this.initialized,
      operationsCount: this.operationsCount,
      timeSinceLastOperation: timeSinceLastOp,
      groupSizes: Array.from(this.groups.entries()).map(([num, group]) => ({
        group: num,
        size: group.size
      })),
      totalAntsInGroups: Array.from(this.groups.values())
        .reduce((total, group) => total + group.size, 0)
    };
  }

  /**
   * Clean up destroyed ants from all groups.
   * Should be called periodically to maintain memory efficiency.
   * 
   * @returns {number} Number of destroyed ants removed
   * @example
   * const cleaned = groupManager.cleanupDestroyedAnts();
   * console.log(`Cleaned up ${cleaned} destroyed ants`);
   */
  cleanupDestroyedAnts() {
    if (!this.initialized) return 0;

    this._trackOperation();

    let removedCount = 0;
    for (const group of this.groups.values()) {
      const toRemove = [];
      for (const ant of group) {
        if (!ant || ant.isDestroyed) {
          toRemove.push(ant);
        }
      }
      
      for (const ant of toRemove) {
        group.delete(ant);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} destroyed ants from groups`);
    }

    return removedCount;
  }

  // --- Private Helper Methods ---

  /**
   * Validate group number is within valid range.
   * @private
   */
  _validateGroupNumber(groupNumber) {
    if (typeof groupNumber !== 'number' || groupNumber < 1 || groupNumber > this.maxGroups) {
      console.error(`Invalid group number: ${groupNumber}. Must be 1-${this.maxGroups}`);
      return false;
    }
    return true;
  }

  /**
   * Validate ants array parameter.
   * @private
   */
  _validateAntsArray(ants) {
    if (!Array.isArray(ants)) {
      console.error('Ants parameter must be an array');
      return false;
    }
    if (ants.length === 0) {
      console.warn('No ants selected for group assignment');
      return false;
    }
    return true;
  }

  /**
   * Track operation for performance monitoring.
   * @private
   */
  _trackOperation() {
    this.operationsCount++;
    this.lastOperationTime = new Date();
  }

  // --- Debugging and Development ---

  /**
   * Get detailed debug information.
   * 
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    const debug = {
      initialized: this.initialized,
      maxGroups: this.maxGroups,
      operationsCount: this.operationsCount,
      multiGroupEnabled: true,
      groups: {},
      antMemberships: {}
    };

    // Build group information
    for (const [groupNumber, group] of this.groups) {
      const ants = Array.from(group);
      debug.groups[groupNumber] = {
        count: ants.length,
        ants: ants.map(ant => ({
          id: ant.id || ant._testId || ant.antIndex,
          isDestroyed: ant.isDestroyed || false,
          isSelected: ant.isSelected || false,
          position: ant.getPosition ? ant.getPosition() : { x: ant.posX, y: ant.posY }
        }))
      };
    }

    // Build ant membership information (which groups each ant belongs to)
    const allAnts = new Set();
    for (const group of this.groups.values()) {
      for (const ant of group) {
        if (ant && !ant.isDestroyed) {
          allAnts.add(ant);
        }
      }
    }

    for (const ant of allAnts) {
      const antId = ant.id || ant._testId || ant.antIndex;
      debug.antMemberships[antId] = {
        groups: this.getAntGroups(ant),
        isSelected: ant.isSelected || false,
        position: ant.getPosition ? ant.getPosition() : { x: ant.posX, y: ant.posY }
      };
    }

    return debug;
  }

  /**
   * Reset the group manager to initial state.
   * Used for testing and debugging.
   * 
   * @returns {boolean} True if reset succeeded
   */
  reset() {
    try {
      this.groups.clear();
      this.initialized = false;
      this.operationsCount = 0;
      this.lastOperationTime = new Date();
      
      console.log('🔄 AntGroupManager reset');
      return true;
    } catch (error) {
      console.error('❌ Failed to reset AntGroupManager:', error);
      return false;
    }
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.AntGroupManager = AntGroupManager;
}

// Export for Node.js environments  
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntGroupManager;
}