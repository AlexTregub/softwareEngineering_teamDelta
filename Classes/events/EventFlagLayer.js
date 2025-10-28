/**
 * EventFlagLayer - Collection manager for EventFlags in Level Editor
 * Manages multiple flags, selection state, spatial queries, and rendering
 * 
 * Features:
 * - Add/remove flags from collection
 * - Select flags for editing
 * - Spatial queries (find flags at position)
 * - Batch rendering of all flags
 * - JSON import/export for save/load
 * 
 * @author Software Engineering Team Delta
 */

class EventFlagLayer {
  /**
   * Create EventFlagLayer
   * @param {Object} terrain - Optional terrain reference for bounds checking
   */
  constructor(terrain = null) {
    /**
     * Collection of flags (Map: flagId => EventFlag)
     * @type {Map<string, EventFlag>}
     */
    this.flags = new Map();
    
    /**
     * Currently selected flag ID
     * @type {string|null}
     */
    this.selectedFlagId = null;
    
    /**
     * Optional terrain reference
     * @type {Object|null}
     */
    this.terrain = terrain;
  }
  
  /**
   * Add flag to collection
   * @param {EventFlag} flag - Flag to add
   * @returns {EventFlag} The added flag
   * @throws {Error} If flag is null or invalid
   */
  addFlag(flag) {
    if (!flag) {
      throw new Error('EventFlagLayer: Cannot add null flag');
    }
    
    if (!flag.id) {
      throw new Error('EventFlagLayer: Flag must have an ID');
    }
    
    this.flags.set(flag.id, flag);
    return flag;
  }
  
  /**
   * Remove flag from collection
   * @param {string} flagId - ID of flag to remove
   * @returns {boolean} True if flag was removed, false if not found
   */
  removeFlag(flagId) {
    // Clear selection if removing selected flag
    if (this.selectedFlagId === flagId) {
      this.selectedFlagId = null;
    }
    
    return this.flags.delete(flagId);
  }
  
  /**
   * Get flag by ID
   * @param {string} flagId - Flag ID
   * @returns {EventFlag|null} Flag instance or null if not found
   */
  getFlag(flagId) {
    return this.flags.get(flagId) || null;
  }
  
  /**
   * Get all flags as array
   * @returns {EventFlag[]} Array of all flags
   */
  getAllFlags() {
    return Array.from(this.flags.values());
  }
  
  /**
   * Find all flags at given position
   * Uses containsPoint() to check if position is within flag trigger zone
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {EventFlag[]} Array of flags at position (may be empty)
   */
  findFlagsAtPosition(x, y) {
    const flagsAtPosition = [];
    
    for (const flag of this.flags.values()) {
      if (flag.containsPoint(x, y)) {
        flagsAtPosition.push(flag);
      }
    }
    
    return flagsAtPosition;
  }
  
  /**
   * Select flag by ID
   * @param {string|null} flagId - Flag ID to select, or null to deselect
   * @returns {boolean} True if flag exists (or null passed), false if not found
   */
  selectFlag(flagId) {
    // Allow null to deselect
    if (flagId === null) {
      this.selectedFlagId = null;
      return true;
    }
    
    // Check if flag exists
    if (this.flags.has(flagId)) {
      this.selectedFlagId = flagId;
      return true;
    }
    
    // Flag not found, don't change selection
    return false;
  }
  
  /**
   * Get currently selected flag
   * @returns {EventFlag|null} Selected flag instance or null
   */
  getSelectedFlag() {
    if (!this.selectedFlagId) {
      return null;
    }
    
    return this.getFlag(this.selectedFlagId);
  }
  
  /**
   * Render all flags
   * Calls render() on each flag, passing editorMode parameter
   * @param {boolean} editorMode - True to render flags, false to skip
   */
  render(editorMode) {
    for (const flag of this.flags.values()) {
      flag.render(editorMode);
    }
  }
  
  /**
   * Export all flags to JSON array
   * @returns {Object[]} Array of flag JSON objects
   */
  exportToJSON() {
    const flagsArray = [];
    
    for (const flag of this.flags.values()) {
      flagsArray.push(flag.exportToJSON());
    }
    
    return flagsArray;
  }
  
  /**
   * Import flags from JSON array
   * Clears existing flags before importing
   * @param {Object[]} data - Array of flag JSON objects
   */
  importFromJSON(data) {
    // Clear existing flags
    this.clear();
    
    // Import each flag
    if (Array.isArray(data)) {
      for (const flagData of data) {
        // Use EventFlag.importFromJSON to create instance
        const flag = (typeof EventFlag !== 'undefined') 
          ? EventFlag.importFromJSON(flagData)
          : null;
        
        if (flag) {
          this.addFlag(flag);
        }
      }
    }
  }
  
  /**
   * Clear all flags and selection
   */
  clear() {
    this.flags.clear();
    this.selectedFlagId = null;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.EventFlagLayer = EventFlagLayer;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventFlagLayer;
}
