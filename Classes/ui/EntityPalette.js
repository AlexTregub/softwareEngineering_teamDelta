/**
 * EntityPalette
 * Manages entity templates organized by category (entities, buildings, resources)
 * Provides template selection and retrieval for Entity Painter tool
 */

class EntityPalette {
  constructor() {
    this.currentCategory = 'entities';
    this._selectedTemplateId = null;
    this._templates = this._loadTemplates();
  }
  
  /**
   * Load entity templates organized by category
   * @returns {Object} Templates organized by category
   * @private
   */
  _loadTemplates() {
    return {
      entities: [
        {
          id: 'ant_worker',
          name: 'Worker Ant',
          type: 'Ant',
          job: 'Worker',
          image: 'Images/Ants/gray_ant.png',
          properties: {
            JobName: 'Worker',
            faction: 'player',
            health: 100,
            movementSpeed: 30
          }
        },
        {
          id: 'ant_soldier',
          name: 'Soldier Ant',
          type: 'Ant',
          job: 'Soldier',
          image: 'Images/Ants/gray_ant_2.png',
          properties: {
            JobName: 'Soldier',
            faction: 'player',
            health: 150,
            movementSpeed: 35
          }
        },
        {
          id: 'ant_scout',
          name: 'Scout Ant',
          type: 'Ant',
          job: 'Scout',
          image: 'Images/Ants/gray_ant_3.png',
          properties: {
            JobName: 'Scout',
            faction: 'player',
            health: 80,
            movementSpeed: 45
          }
        },
        {
          id: 'ant_queen',
          name: 'Queen Ant',
          type: 'Ant',
          job: 'Queen',
          image: 'Images/Ants/queen.png',
          properties: {
            JobName: 'Queen',
            faction: 'player',
            health: 300,
            movementSpeed: 20
          }
        },
        {
          id: 'ant_builder',
          name: 'Builder Ant',
          type: 'Ant',
          job: 'Builder',
          image: 'Images/Ants/builder.png',
          properties: {
            JobName: 'Builder',
            faction: 'player',
            health: 120,
            movementSpeed: 25
          }
        },
        {
          id: 'ant_gatherer',
          name: 'Gatherer Ant',
          type: 'Ant',
          job: 'Gatherer',
          image: 'Images/Ants/gray_ant_4.png',
          properties: {
            JobName: 'Gatherer',
            faction: 'player',
            health: 90,
            movementSpeed: 32
          }
        },
        {
          id: 'ant_carrier',
          name: 'Carrier Ant',
          type: 'Ant',
          job: 'Carrier',
          image: 'Images/Ants/gray_ant_5.png',
          properties: {
            JobName: 'Carrier',
            faction: 'player',
            health: 100,
            movementSpeed: 28
          }
        }
      ],
      
      buildings: [
        {
          id: 'building_hill',
          name: 'Ant Hill',
          type: 'Building',
          size: { w: 64, h: 64 },
          image: 'Images/Buildings/Hill/hill.png',
          properties: {
            buildingType: 'colony',
            size: { w: 64, h: 64 },
            capacity: 50
          }
        },
        {
          id: 'building_hive',
          name: 'Hive',
          type: 'Building',
          size: { w: 48, h: 48 },
          image: 'Images/Buildings/Hive/hive.png',
          properties: {
            buildingType: 'storage',
            size: { w: 48, h: 48 },
            capacity: 100
          }
        },
        {
          id: 'building_cone',
          name: 'Cone Structure',
          type: 'Building',
          size: { w: 32, h: 48 },
          image: 'Images/Buildings/Cone/cone.png',
          properties: {
            buildingType: 'defense',
            size: { w: 32, h: 48 },
            capacity: 10
          }
        }
      ],
      
      resources: [
        {
          id: 'resource_leaf',
          name: 'Green Leaf',
          type: 'Resource',
          category: 'food',
          resourceType: 'greenLeaf',
          image: 'Images/Resources/leaf.png',
          properties: {
            canBePickedUp: true,
            weight: 0.5,
            nutritionValue: 10
          }
        },
        {
          id: 'resource_maple',
          name: 'Maple Leaf',
          type: 'Resource',
          category: 'food',
          resourceType: 'mapleLeaf',
          image: 'Images/Resources/maple_leaf.png',
          properties: {
            canBePickedUp: true,
            weight: 0.4,
            nutritionValue: 8
          }
        },
        {
          id: 'resource_stick',
          name: 'Stick',
          type: 'Resource',
          category: 'materials',
          resourceType: 'stick',
          image: 'Images/Resources/stick.png',
          properties: {
            canBePickedUp: true,
            weight: 0.6,
            nutritionValue: 0
          }
        },
        {
          id: 'resource_stone',
          name: 'Stone',
          type: 'Resource',
          category: 'materials',
          resourceType: 'stone',
          image: 'Images/Resources/stone.png',
          properties: {
            canBePickedUp: false,
            weight: 5.0,
            nutritionValue: 0
          }
        }
      ]
    };
  }
  
  /**
   * Set the current category
   * @param {string} category - Category to switch to ('entities', 'buildings', 'resources')
   */
  setCategory(category) {
    this.currentCategory = category;
    this._selectedTemplateId = null; // Clear selection when switching categories
  }
  
  /**
   * Get templates for the current category
   * @returns {Array} Array of template objects
   */
  getCurrentTemplates() {
    return this._templates[this.currentCategory] || [];
  }
  
  /**
   * Get templates for a specific category
   * @param {string} category - Category name
   * @returns {Array} Array of templates or empty array if invalid
   */
  getTemplates(category) {
    return this._templates[category] || [];
  }
  
  /**
   * Get templates for a specific category (alias for getTemplates)
   * @param {string} category - Category name
   * @returns {Array|null} Array of templates or null if invalid category
   */
  getTemplatesByCategory(category) {
    if (!this._templates[category]) {
      return null;
    }
    return this._templates[category];
  }
  
  /**
   * Select a template by ID
   * @param {string} templateId - Template ID to select
   * @returns {boolean} True if selection successful, false otherwise
   */
  selectTemplate(templateId) {
    // Find template in current category
    const templates = this.getCurrentTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      this._selectedTemplateId = templateId;
      return true;
    }
    
    return false;
  }
  
  /**
   * Clear the current selection
   */
  clearSelection() {
    this._selectedTemplateId = null;
  }
  
  /**
   * Get the currently selected template
   * @returns {Object|null} Selected template object or null
   */
  getSelectedTemplate() {
    if (!this._selectedTemplateId) {
      return null;
    }
    
    // Search all categories for the selected template
    for (const category in this._templates) {
      const template = this._templates[category].find(t => t.id === this._selectedTemplateId);
      if (template) {
        return template;
      }
    }
    
    return null;
  }
  
  /**
   * Check if a template is currently selected
   * @returns {boolean} True if a template is selected
   */
  hasSelection() {
    return this._selectedTemplateId !== null;
  }
  
  /**
   * Get the current category
   * @returns {string} Current category name
   */
  getCurrentCategory() {
    return this.currentCategory;
  }
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.EntityPalette = EntityPalette;
}

// Module export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityPalette;
}
