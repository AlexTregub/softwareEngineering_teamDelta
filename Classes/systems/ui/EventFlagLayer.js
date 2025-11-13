/**
 * EventFlagLayer - Manages collection of EventFlags in the Level Editor
 * Handles adding, removing, rendering, and serialization of event flags
 */
class EventFlagLayer {
  constructor(terrain) {
    this.terrain = terrain;
    this.flags = [];
    this.selectedFlag = null;
    this.tempFlag = null;
  }
  
  /**
   * Add a flag to the layer
   */
  addFlag(eventFlag) {
    if (!eventFlag) {
      console.warn('[EventFlagLayer] Cannot add null flag');
      return false;
    }
    
    // Check for duplicate IDs
    const existing = this.flags.find(f => f.id === eventFlag.id);
    if (existing) {
      console.warn(`[EventFlagLayer] Flag with ID ${eventFlag.id} already exists`);
      return false;
    }
    
    this.flags.push(eventFlag);
    console.log(`[EventFlagLayer] Added flag ${eventFlag.id} at (${eventFlag.x}, ${eventFlag.y})`);
    return true;
  }
  
  /**
   * Remove a flag by ID
   */
  removeFlag(flagId) {
    const index = this.flags.findIndex(f => f.id === flagId);
    if (index === -1) {
      console.warn(`[EventFlagLayer] Flag ${flagId} not found`);
      return false;
    }
    
    this.flags.splice(index, 1);
    console.log(`[EventFlagLayer] Removed flag ${flagId}`);
    
    // Clear selection if removed flag was selected
    if (this.selectedFlag && this.selectedFlag.id === flagId) {
      this.selectedFlag = null;
    }
    
    return true;
  }
  
  /**
   * Get a flag by ID
   */
  getFlag(flagId) {
    return this.flags.find(f => f.id === flagId);
  }
  
  /**
   * Get all flags
   */
  getAllFlags() {
    return [...this.flags];
  }
  
  /**
   * Clear all flags
   */
  clear() {
    this.flags = [];
    this.selectedFlag = null;
    this.tempFlag = null;
    console.log('[EventFlagLayer] Cleared all flags');
  }
  
  /**
   * Render all flags (editor mode)
   */
  render() {
    // Render all placed flags
    for (const flag of this.flags) {
      flag.render(true);
      
      // Highlight selected flag
      if (this.selectedFlag && flag.id === this.selectedFlag.id) {
        push();
        noFill();
        stroke(255, 255, 0);
        strokeWeight(3);
        circle(flag.x, flag.y, flag.radius * 2);
        pop();
      }
    }
    
    // Render temp flag (being placed)
    if (this.tempFlag) {
      this.tempFlag.render(true);
    }
  }
  
  /**
   * Export flags to JSON
   */
  exportToJSON() {
    return {
      flags: this.flags.map(f => f.toJSON()),
      count: this.flags.length
    };
  }
  
  /**
   * Import flags from JSON
   */
  importFromJSON(data) {
    if (!data || !data.flags) {
      console.warn('[EventFlagLayer] Invalid import data');
      return false;
    }
    
    this.clear();
    
    for (const flagData of data.flags) {
      const flag = EventFlag.fromJSON(flagData);
      this.addFlag(flag);
    }
    
    console.log(`[EventFlagLayer] Imported ${this.flags.length} flags`);
    return true;
  }
  
  /**
   * Find flag at given position (for clicking)
   */
  getFlagAtPosition(x, y) {
    // Search in reverse order (top-most flag first)
    for (let i = this.flags.length - 1; i >= 0; i--) {
      if (this.flags[i].containsPoint(x, y)) {
        return this.flags[i];
      }
    }
    return null;
  }
  
  /**
   * Select a flag for editing
   */
  selectFlag(flagId) {
    const flag = this.getFlag(flagId);
    if (flag) {
      this.selectedFlag = flag;
      console.log(`[EventFlagLayer] Selected flag ${flagId}`);
      return true;
    }
    return false;
  }
  
  /**
   * Deselect current flag
   */
  deselectFlag() {
    this.selectedFlag = null;
  }
}

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventFlagLayer;
}
if (typeof window !== 'undefined') {
  window.EventFlagLayer = EventFlagLayer;
}
