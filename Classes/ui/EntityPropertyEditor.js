/**
 * EntityPropertyEditor
 * Modal dialog for editing entity properties
 * Supports property editing for Ants, Resources, and Buildings
 */

class EntityPropertyEditor {
  constructor() {
    this._visible = false;
    this.currentEntity = null;
    this._pendingChanges = {};
    this._originalValues = {};
    
    // Valid options for validation
    this._validJobNames = ['Worker', 'Soldier', 'Scout', 'Queen', 'Builder', 'Gatherer', 'Carrier'];
    this._validFactions = ['player', 'enemy', 'neutral'];
  }
  
  /**
   * Open the editor for an entity
   * @param {Object} entity - Entity to edit
   */
  open(entity) {
    if (!entity) {
      return;
    }
    
    this.currentEntity = entity;
    this._visible = true;
    this._pendingChanges = {};
    this._originalValues = {};
    
    // Store original values for cancel operation
    this._storeOriginalValues();
  }
  
  /**
   * Close the editor
   */
  close() {
    this._visible = false;
    this.currentEntity = null;
    this._pendingChanges = {};
    this._originalValues = {};
  }
  
  /**
   * Check if the editor is visible
   * @returns {boolean} True if visible
   */
  isVisible() {
    return this._visible;
  }
  
  /**
   * Get a property value from the current entity
   * @param {string} propertyName - Property name
   * @returns {*} Property value or null
   */
  getProperty(propertyName) {
    if (!this.currentEntity) {
      return null;
    }
    
    // Check pending changes first
    if (this._pendingChanges.hasOwnProperty(propertyName)) {
      return this._pendingChanges[propertyName];
    }
    
    // Check direct properties
    if (this.currentEntity.hasOwnProperty(propertyName)) {
      return this.currentEntity[propertyName];
    }
    
    // Check properties object
    if (this.currentEntity.properties && this.currentEntity.properties.hasOwnProperty(propertyName)) {
      return this.currentEntity.properties[propertyName];
    }
    
    return null;
  }
  
  /**
   * Set a property value (staged, not applied until save)
   * @param {string} propertyName - Property name
   * @param {*} value - New value
   * @throws {Error} If validation fails
   */
  setProperty(propertyName, value) {
    // Validate the value
    this._validateProperty(propertyName, value);
    
    // Stage the change
    this._pendingChanges[propertyName] = value;
  }
  
  /**
   * Validate a property value
   * @param {string} propertyName - Property name
   * @param {*} value - Value to validate
   * @throws {Error} If validation fails
   * @private
   */
  _validateProperty(propertyName, value) {
    switch (propertyName) {
      case 'health':
        if (value < 0) {
          throw new Error('Health cannot be negative');
        }
        break;
        
      case 'JobName':
        if (!this._validJobNames.includes(value)) {
          throw new Error(`Invalid JobName: ${value}`);
        }
        break;
        
      case 'faction':
        if (!this._validFactions.includes(value)) {
          throw new Error(`Invalid faction: ${value}`);
        }
        break;
    }
  }
  
  /**
   * Check if there are pending changes
   * @returns {boolean} True if there are unsaved changes
   */
  hasPendingChanges() {
    return Object.keys(this._pendingChanges).length > 0;
  }
  
  /**
   * Store original values for cancel operation
   * @private
   */
  _storeOriginalValues() {
    if (!this.currentEntity) return;
    
    // Store direct properties
    const propertiesToStore = ['JobName', 'faction', 'health', 'movementSpeed', 'type', 
                                'canBePickedUp', 'weight', 'buildingType', 'size'];
    
    propertiesToStore.forEach(prop => {
      if (this.currentEntity.hasOwnProperty(prop)) {
        this._originalValues[prop] = this.currentEntity[prop];
      } else if (this.currentEntity.properties && this.currentEntity.properties.hasOwnProperty(prop)) {
        this._originalValues[prop] = this.currentEntity.properties[prop];
      }
    });
  }
  
  /**
   * Apply pending changes to the entity
   */
  save() {
    if (!this.currentEntity) {
      return;
    }
    
    // Apply all pending changes
    Object.keys(this._pendingChanges).forEach(propertyName => {
      const value = this._pendingChanges[propertyName];
      
      // For read-only properties (health, faction), use private properties
      if (propertyName === 'health' && this.currentEntity.hasOwnProperty('_health')) {
        this.currentEntity._health = value;
      } else if (propertyName === 'faction' && this.currentEntity.hasOwnProperty('_faction')) {
        this.currentEntity._faction = value;
      }
      // Apply to direct property if it exists and is writable
      else if (this.currentEntity.hasOwnProperty(propertyName)) {
        this.currentEntity[propertyName] = value;
      }
      // Otherwise apply to properties object
      else if (this.currentEntity.properties) {
        this.currentEntity.properties[propertyName] = value;
      }
      // Create properties object if needed
      else {
        this.currentEntity.properties = {};
        this.currentEntity.properties[propertyName] = value;
      }
    });
    
    // Close the editor
    this.close();
  }
  
  /**
   * Cancel changes and close the editor
   */
  cancel() {
    if (!this.currentEntity) {
      this.close();
      return;
    }
    
    // Restore original values (no changes applied)
    // Since we never modified currentEntity until save(), no restoration needed
    
    // Close the editor
    this.close();
  }
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.EntityPropertyEditor = EntityPropertyEditor;
}

// Module export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityPropertyEditor;
}
