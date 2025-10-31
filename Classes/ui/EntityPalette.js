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
    
    // Create ModalDialog instance for add/rename/delete operations
    if (typeof ModalDialog !== 'undefined') {
      this._modal = new ModalDialog();
    } else {
      this._modal = null;
    }
    
    // Create ToastNotification instance for user feedback
    if (typeof ToastNotification !== 'undefined') {
      this._toast = new ToastNotification();
    } else {
      this._toast = null;
    }
    
    // Create CategoryRadioButtons instance with onChange callback
    if (typeof CategoryRadioButtons !== 'undefined') {
      this.categoryButtons = new CategoryRadioButtons((categoryId) => {
        this.setCategory(categoryId);
        this._selectedTemplateId = null; // Clear selection on category change
      });
    }
  }
  
  // TODO: Make this section load dynamicly, we want users to be able
  // create entities in game, store them in JSON, and have the game 
  // be able to load them later.
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
      ],
      
      custom: this._loadCustomEntities()
    };
  }
  
  /**
   * Load custom entities from localStorage
   * @returns {Array} Array of custom entity objects
   * @private
   */
  _loadCustomEntities() {
    try {
      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        return [];
      }
      
      const stored = localStorage.getItem('antGame_customEntities');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading custom entities:', error);
    }
    return [];
  }
  
  /**
   * Save custom entities to localStorage
   * @private
   */
  _saveCustomEntities() {
    try {
      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      const customEntities = this._templates.custom || [];
      localStorage.setItem('antGame_customEntities', JSON.stringify(customEntities));
    } catch (error) {
      console.error('Error saving custom entities:', error);
    }
  }
  
  /**
   * Get selected entities from Level Editor
   * @returns {Array} Array of selected entity objects with grid positions
   */
  getSelectedEntitiesFromLevelEditor() {
    // Check if Level Editor exists and has selection
    if (typeof levelEditor !== 'undefined' && levelEditor && typeof levelEditor.getSelectedEntities === 'function') {
      return levelEditor.getSelectedEntities();
    }
    return [];
  }
  
  /**
   * Calculate relative positions for a group of entities
   * First entity (topmost-leftmost) becomes origin at (0, 0)
   * @param {Array} selectedEntities - Array of selected entities with grid positions
   * @returns {Array} Array of entities with relative positions
   * @private
   */
  _calculateRelativePositions(selectedEntities) {
    if (!selectedEntities || selectedEntities.length === 0) {
      return [];
    }
    
    // Single entity - position is (0, 0)
    if (selectedEntities.length === 1) {
      const entity = selectedEntities[0];
      return [{
        baseTemplateId: entity.entity.templateId,
        position: { x: 0, y: 0 },
        properties: entity.entity.getProperties ? entity.entity.getProperties() : {}
      }];
    }
    
    // Find origin (topmost-leftmost entity)
    let minX = Infinity;
    let minY = Infinity;
    
    selectedEntities.forEach(sel => {
      if (sel.gridY < minY || (sel.gridY === minY && sel.gridX < minX)) {
        minX = sel.gridX;
        minY = sel.gridY;
      }
    });
    
    // Calculate offsets from origin
    return selectedEntities.map(sel => ({
      baseTemplateId: sel.entity.templateId,
      position: {
        x: sel.gridX - minX,
        y: sel.gridY - minY
      },
      properties: sel.entity.getProperties ? sel.entity.getProperties() : {}
    }));
  }
  
  /**
   * Create group data structure from selected entities
   * @param {string} customName - Custom name for the entity/group
   * @returns {Object} Entity or group data structure
   */
  createGroupDataStructure(customName) {
    const selected = this.getSelectedEntitiesFromLevelEditor();
    const relativePositions = this._calculateRelativePositions(selected);
    
    // Generate unique ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const id = selected.length === 1 
      ? `custom_${timestamp}_${randomStr}`
      : `custom_group_${timestamp}_${randomStr}`;
    
    const createdAt = new Date().toISOString();
    
    // Single entity
    if (selected.length === 1) {
      return {
        id: id,
        customName: customName,
        isGroup: false,
        baseTemplateId: relativePositions[0].baseTemplateId,
        properties: relativePositions[0].properties,
        createdAt: createdAt,
        lastModified: createdAt
      };
    }
    
    // Group
    return {
      id: id,
      customName: customName,
      isGroup: true,
      entities: relativePositions,
      createdAt: createdAt,
      lastModified: createdAt
    };
  }
  
  /**
   * Get dynamic button text based on Level Editor selection
   * @returns {string} Button text
   */
  getAddButtonText() {
    const selected = this.getSelectedEntitiesFromLevelEditor();
    
    if (selected.length === 0) {
      return '➕ Add New Custom Entity';
    } else if (selected.length === 1) {
      return '💾 Store Selected Entity';
    } else {
      return `💾 Store Selected Entities (${selected.length})`;
    }
  }
  
  /**
   * Add a single custom entity to the custom category
   * @param {string} customName - User-defined name for the entity
   * @param {string} baseTemplateId - ID of the base template (e.g., 'ant_worker')
   * @param {Object} properties - Custom properties to override
   * @returns {Object|null} Created entity object or null if duplicate name
   */
  addCustomEntity(customName, baseTemplateId, properties) {
    // Validate name
    if (!customName || customName.trim() === '') {
      if (this._toast) {
        this._toast.show('Entity name cannot be empty', 'error');
      }
      return null;
    }
    
    // Check for duplicate names
    if (this._templates.custom && this._templates.custom.some(e => e.customName === customName)) {
      if (this._toast) {
        this._toast.show(`An entity named "${customName}" already exists`, 'error');
      }
      return null;
    }
    
    const entity = {
      id: `custom_entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customName: customName,
      baseTemplateId: baseTemplateId,
      isGroup: false,
      properties: properties || {},
      createdAt: new Date().toISOString()
    };
    
    // Add to custom templates
    if (!this._templates.custom) {
      this._templates.custom = [];
    }
    this._templates.custom.push(entity);
    
    // Save to LocalStorage
    this._saveCustomEntities();
    
    // Show success toast
    if (this._toast) {
      this._toast.show(`Custom entity "${customName}" saved!`, 'success');
    }
    
    return entity;
  }
  
  /**
   * Get a custom entity or group by ID
   * @param {string} entityId - ID of the entity/group to retrieve
   * @returns {Object|null} Entity/group object or null if not found
   */
  getCustomEntity(entityId) {
    if (!this._templates.custom) {
      return null;
    }
    
    const entity = this._templates.custom.find(e => e.id === entityId);
    return entity || null;
  }
  
  /**
   * Add a custom entity group to the custom category
   * @param {string} customName - User-defined name for the group
   * @param {Array} entities - Array of entity data with position offsets
   * @returns {Object} Created group object
   */
  addCustomEntityGroup(customName, entities) {
    const group = {
      id: `custom_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customName: customName,
      isGroup: true,
      entities: entities,
      createdAt: new Date().toISOString()
    };
    
    // Add to custom templates
    if (!this._templates.custom) {
      this._templates.custom = [];
    }
    this._templates.custom.push(group);
    
    // Save to LocalStorage
    this._saveCustomEntities();
    
    return group;
  }
  
  /**
   * Delete a custom entity or group
   * @param {string} entityId - ID of the entity/group to delete
   * @returns {boolean} True if deleted successfully, false otherwise
   */
  deleteCustomEntity(entityId) {
    if (!this._templates.custom) {
      if (this._toast) {
        this._toast.show('Entity not found', 'error');
      }
      return false;
    }
    
    const index = this._templates.custom.findIndex(e => e.id === entityId);
    if (index !== -1) {
      const entityName = this._templates.custom[index].customName;
      this._templates.custom.splice(index, 1);
      this._saveCustomEntities();
      
      // Show success toast
      if (this._toast) {
        this._toast.show(`Entity "${entityName}" deleted`, 'success');
      }
      
      return true;
    }
    
    if (this._toast) {
      this._toast.show('Entity not found', 'error');
    }
    return false;
  }
  
  /**
   * Rename a custom entity or group
   * @param {string} entityId - ID of the entity/group to rename
   * @param {string} newName - New name for the entity/group
   * @returns {boolean} True if renamed successfully, false otherwise
   */
  renameCustomEntity(entityId, newName) {
    if (!this._templates.custom) {
      if (this._toast) {
        this._toast.show('Entity not found', 'error');
      }
      return false;
    }
    
    // Validate name
    if (!newName || newName.trim() === '') {
      if (this._toast) {
        this._toast.show('Entity name cannot be empty', 'error');
      }
      return false;
    }
    
    // Check for duplicate names (excluding the entity being renamed)
    const duplicate = this._templates.custom.find(e => e.id !== entityId && e.customName === newName);
    if (duplicate) {
      if (this._toast) {
        this._toast.show(`An entity named "${newName}" already exists`, 'error');
      }
      return false;
    }
    
    const entity = this._templates.custom.find(e => e.id === entityId);
    if (entity) {
      const oldName = entity.customName;
      entity.customName = newName;
      entity.lastModified = new Date().toISOString();
      this._saveCustomEntities();
      
      // Show success toast
      if (this._toast) {
        this._toast.show(`Entity renamed from "${oldName}" to "${newName}"`, 'success');
      }
      
      return true;
    }
    
    if (this._toast) {
      this._toast.show('Entity not found', 'error');
    }
    return false;
  }
  
  /**
   * Set the current category
   * @param {string} category - Category to switch to ('entities', 'buildings', 'resources', 'custom')
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
  
  /**
   * Get the current category (alias for getCurrentCategory)
   * @returns {string} Current category name
   */
  getCategory() {
    return this.currentCategory;
  }
  
  /**
   * Get the selected template ID
   * @returns {string|null} Selected template ID or null
   */
  getSelectedTemplateId() {
    return this._selectedTemplateId;
  }
  
  /**
   * Get content size for panel auto-sizing
   * @param {number} width - Available width
   * @returns {Object} Size object with width and height
   */
  getContentSize(width = 200) {
    // Calculate dynamic height based on template count and LIST layout
    const templates = this.getCurrentTemplates();
    const itemHeight = 80; // 64px sprite + 16px padding
    const padding = 8;
    const listHeight = templates.length * (itemHeight + padding);
    
    const radioButtonsHeight = this.categoryButtons ? this.categoryButtons.height : 30;
    const addButtonHeight = this.currentCategory === 'custom' ? 50 : 0;
    const totalHeight = radioButtonsHeight + listHeight + addButtonHeight + 16;
    
    return {
      width: width,
      height: totalHeight
    };
  }
  
  /**
   * Render EntityPalette UI with CategoryRadioButtons and template LIST view
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   */
  render(x, y, width, height) {
    if (typeof push === 'undefined') return;
    
    push();
    
    // Render CategoryRadioButtons at top
    if (this.categoryButtons) {
      this.categoryButtons.render(x, y, width);
    }
    
    // Render template LIST below radio buttons
    const templates = this.getCurrentTemplates();
    const itemHeight = 80; // 64px sprite + 16px padding
    const padding = 8;
    const buttonHeight = this.categoryButtons ? this.categoryButtons.height : 30;
    
    let listY = y + buttonHeight + padding;
    
    // Custom category: Render empty state if no custom entities
    if (this.currentCategory === 'custom' && templates.length === 0) {
      fill('#888');
      textSize(14);
      if (typeof textAlign === 'function') {
        textAlign(CENTER, CENTER);
      }
      text('No custom entities yet', x + width / 2, listY + 30);
      listY += 60; // Space for empty message
    } else {
      // Render list items
      templates.forEach((template, i) => {
        const isSelected = template.id === this._selectedTemplateId;
        
        // Custom category: Render custom entity header
        if (this.currentCategory === 'custom') {
          // Custom name header background
          fill('#2a2a2a');
          noStroke();
          rect(x + padding, listY, width - padding * 2, 20, 6, 6, 0, 0);
          
          // Custom name text
          fill('#ffd700');
          textSize(12);
          if (typeof textAlign === 'function') {
            textAlign(LEFT, CENTER);
          }
          text(template.customName || template.name, x + padding + 8, listY + 10);
          
          // Rename button (✏️)
          fill('#888');
          textSize(14);
          if (typeof textAlign === 'function') {
            textAlign(RIGHT, CENTER);
          }
          text('✏️', x + width - padding - 30, listY + 10);
          
          // Delete button (✕)
          fill('#c44');
          textSize(14);
          text('✕', x + width - padding - 10, listY + 10);
          
          listY += 20; // Move down for entity body
        }
        
        // Background
        fill(isSelected ? '#4a4a00' : '#383838');
        stroke(isSelected ? '#ffd700' : 'transparent');
        strokeWeight(2);
        rect(x + padding, listY, width - padding * 2, itemHeight, this.currentCategory === 'custom' ? 0 : 6, this.currentCategory === 'custom' ? 0 : 6, 6, 6);
        
        // Sprite rendering: Group 2x2 grid OR single 64x64
        if (this.currentCategory === 'custom' && template.isGroup && template.entities) {
          // Group: Render 2x2 mini sprite grid (first 4 entities)
          this._renderGroupSprites(x + padding + 8, listY + 8, template.entities);
        } else {
          // Single entity: 64x64 sprite placeholder
          fill(100);
          noStroke();
          rect(x + padding + 8, listY + 8, 64, 64);
          // TODO: Render actual sprite image when available
        }
        
        // Text info
        const textX = x + padding + 8 + 64 + 12;
        let textY = listY + 12;
        
        // Line 1: Full entity name (16px, bold, gold)
        fill('#ffd700');
        textSize(16);
        if (typeof textAlign === 'function') {
          textAlign(LEFT, LEFT);
        }
        text(template.name || template.customName, textX, textY);
        textY += 20;
        
        // Line 2: Entity type OR group badge (13px, gray)
        fill('#aaa');
        textSize(13);
        if (this.currentCategory === 'custom' && template.isGroup) {
          const entityCount = template.entities ? template.entities.length : 0;
          text(`GROUP (${entityCount})`, textX, textY);
        } else {
          text(`Entity: ${template.type}`, textX, textY);
        }
        textY += 16;
        
        // Line 3: Custom info from properties (12px, italic, gray)
        if (template.properties) {
          fill('#888');
          textSize(12);
          const faction = template.properties.faction || template.properties.JobName || 'N/A';
          const health = template.properties.health !== undefined ? `, Health: ${template.properties.health}` : '';
          text(`Faction: ${faction}${health}`, textX, textY);
          textY += 14;
        }
        
        // Line 4: Additional description (11px, light gray)
        if (template.additionalInfo) {
          fill('#666');
          textSize(11);
          text(template.additionalInfo, textX, textY);
        }
        
        listY += itemHeight + padding;
      });
    }
    
    // Custom category: Render "Add New / Store Selected" button at bottom
    if (this.currentCategory === 'custom') {
      const addButtonHeight = 40;
      const addButtonY = listY + 8;
      const buttonText = this.getAddButtonText();
      
      // Button background (green for "Add New", blue for "Store Selected")
      const isStoreAction = buttonText.includes('Store');
      fill(isStoreAction ? '#2a4a6a' : '#2a5a2a'); // Blue for store, green for add
      noStroke();
      rect(x + padding, addButtonY, width - padding * 2, addButtonHeight, 6);
      
      // Button text
      fill(isStoreAction ? '#99ccff' : '#9f9');
      textSize(14);
      if (typeof textAlign === 'function') {
        textAlign(CENTER, CENTER);
      }
      text(buttonText, x + width / 2, addButtonY + addButtonHeight / 2);
    }
    
    pop();
    
    // Update and render toasts (independent of EntityPalette rendering)
    if (this._toast) {
      this._toast.update();
      this._toast.render();
    }
  }
  
  /**
   * Render 2x2 mini sprite grid for entity groups
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Array} entities - Array of entities in the group
   * @private
   */
  _renderGroupSprites(x, y, entities) {
    const miniSize = 28; // Each mini sprite is 28x28
    const gap = 4; // Gap between sprites
    const maxSprites = 4; // Show first 4 entities in 2x2 grid
    
    push();
    
    for (let i = 0; i < Math.min(entities.length, maxSprites); i++) {
      const entity = entities[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const spriteX = x + col * (miniSize + gap);
      const spriteY = y + row * (miniSize + gap);
      
      // Mini sprite placeholder (different shades for different entities)
      const shade = 80 + (i * 30);
      fill(shade);
      noStroke();
      rect(spriteX, spriteY, miniSize, miniSize, 2);
      
      // TODO: Render actual mini sprite based on entity.baseTemplateId
    }
    
    // If more than 4 entities, show "+N" indicator
    if (entities.length > maxSprites) {
      const moreX = x + miniSize + gap;
      const moreY = y + miniSize + gap;
      fill(0, 0, 0, 180); // Semi-transparent overlay
      noStroke();
      rect(moreX, moreY, miniSize, miniSize, 2);
      
      fill('#fff');
      textSize(12);
      if (typeof textAlign === 'function') {
        textAlign(CENTER, CENTER);
      }
      text(`+${entities.length - maxSprites}`, moreX + miniSize / 2, moreY + miniSize / 2);
    }
    
    pop();
  }
  
  /**
   * Handle click events - delegates to CategoryRadioButtons and template LIST view
   * @param {number} clickX - Mouse X position
   * @param {number} clickY - Mouse Y position
   * @param {number} panelX - Content area X position
   * @param {number} panelY - Content area Y position
   * @param {number} panelWidth - Panel width
   * @returns {Object|null} Action object or null
   */
  handleClick(clickX, clickY, panelX, panelY, panelWidth) {
    // Check toast clicks first (toasts are rendered at absolute positions)
    if (this._toast && this._toast.handleClick(clickX, clickY)) {
      return { type: 'toast', dismissed: true };
    }
    
    const relX = clickX - panelX;
    const relY = clickY - panelY;
    
    // Check CategoryRadioButtons first (top 30px - smaller buttons)
    const buttonHeight = this.categoryButtons ? this.categoryButtons.height : 30;
    if (relY < buttonHeight && this.categoryButtons) {
      // CategoryRadioButtons.handleClick expects (mouseX, mouseY, x, y, width)
      // We have relative coords, so x=0, y=0 for the button area
      const categoryClicked = this.categoryButtons.handleClick(relX, relY, 0, 0, panelWidth);
      if (categoryClicked) {
        return { type: 'category', category: categoryClicked.id };
      }
    }
    
    // Check template LIST (below button height)
    if (relY > buttonHeight + 8) {
      const templates = this.getCurrentTemplates();
      const itemHeight = 80;
      const headerHeight = 20; // Custom entity header height
      const padding = 8;
      
      // Calculate Y position relative to list start
      let cumulativeY = 0;
      
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const itemStartY = buttonHeight + padding + cumulativeY;
        const itemWithHeaderHeight = (this.currentCategory === 'custom' ? headerHeight : 0) + itemHeight;
        
        // Check if click is within this item's bounds
        if (relY >= itemStartY && relY < itemStartY + itemWithHeaderHeight) {
          // Custom category: Check for rename/delete button clicks in header
          if (this.currentCategory === 'custom') {
            const headerRelY = relY - itemStartY;
            
            // Click is in header area (top 20px)
            if (headerRelY < headerHeight) {
              // Delete button (far right, ~15px width)
              if (relX > panelWidth - padding - 20) {
                return { type: 'delete', entity: template };
              }
              
              // Rename button (right side, before delete, ~40px width)
              if (relX > panelWidth - padding - 60 && relX < panelWidth - padding - 20) {
                return { type: 'rename', entity: template };
              }
              
              // Header click (but not on buttons) - still selects template
            }
          }
          
          // Click is in body area - select template
          this._selectedTemplateId = template.id;
          return { type: 'template', template: template };
        }
        
        cumulativeY += itemWithHeaderHeight + padding;
      }
      
      // Check for "Add New" button at bottom
      if (this.currentCategory === 'custom') {
        const addButtonHeight = 40;
        const addButtonY = buttonHeight + cumulativeY + 16;
        
        if (relY >= addButtonY && relY < addButtonY + addButtonHeight) {
          return { type: 'addCustomEntity' };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Check if point is within EntityPalette bounds
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {number} contentX - Content area X position
   * @param {number} contentY - Content area Y position
   * @returns {boolean} True if point is within bounds
   */
  containsPoint(mouseX, mouseY, contentX, contentY) {
    const size = this.getContentSize();
    return mouseX >= contentX && mouseX <= contentX + size.width &&
           mouseY >= contentY && mouseY <= contentY + size.height;
  }
  
  // ============================================================
  // MODAL DIALOG METHODS
  // ============================================================
  
  /**
   * Show "Add New Custom Entity" modal
   * @param {Function} onConfirm - Callback with (name, baseTemplateId, properties)
   */
  showAddCustomEntityModal(onConfirm) {
    if (!this._modal) return;
    
    this._modal.show({
      title: '➕ Add New Custom Entity',
      message: 'Enter a name for this custom entity',
      hasInput: true,
      inputPlaceholder: 'Enter name here',
      inputValue: '',
      validateInput: (value) => {
        const trimmed = value.trim();
        if (trimmed.length === 0) return false;
        
        // Check for duplicate names
        const duplicate = this._templates.custom.find(e => e.customName === trimmed);
        return !duplicate;
      },
      validationError: 'Name cannot be empty or duplicate',
      buttons: [
        {
          label: 'Cancel',
          callback: () => {},
          type: 'secondary'
        },
        {
          label: 'Save',
          callback: (name) => {
            if (onConfirm) {
              onConfirm(name.trim());
            }
          },
          type: 'primary'
        }
      ]
    });
  }
  
  /**
   * Show "Rename Custom Entity" modal
   * @param {Object} entity - Entity to rename
   * @param {Function} onConfirm - Callback with (entityId, newName)
   */
  showRenameEntityModal(entity, onConfirm) {
    if (!this._modal) return;
    
    this._modal.show({
      title: '✏️ Rename Custom Entity',
      message: `Rename "${entity.customName || entity.name}"`,
      hasInput: true,
      inputPlaceholder: 'Enter new name',
      inputValue: entity.customName || entity.name || '',
      validateInput: (value) => {
        const trimmed = value.trim();
        if (trimmed.length === 0) return false;
        
        // Check for duplicate names (excluding this entity)
        const duplicate = this._templates.custom.find(e => 
          e.customName === trimmed && e.id !== entity.id
        );
        return !duplicate;
      },
      validationError: 'Name cannot be empty or duplicate',
      buttons: [
        {
          label: 'Cancel',
          callback: () => {},
          type: 'secondary'
        },
        {
          label: 'Save',
          callback: (newName) => {
            if (onConfirm) {
              onConfirm(entity.id, newName.trim());
            }
          },
          type: 'primary'
        }
      ]
    });
  }
  
  /**
   * Show "Delete Custom Entity" confirmation modal
   * @param {Object} entity - Entity to delete
   * @param {Function} onConfirm - Callback with (entityId)
   */
  showDeleteEntityModal(entity, onConfirm) {
    if (!this._modal) return;
    
    const entityName = entity.customName || entity.name || 'this entity';
    const entityType = entity.isGroup ? 'group' : 'entity';
    
    this._modal.show({
      title: '⚠️ Delete Custom ' + (entity.isGroup ? 'Group' : 'Entity') + '?',
      message: `Are you sure you want to delete "${entityName}"? This action cannot be undone.`,
      hasInput: false,
      buttons: [
        {
          label: 'Cancel',
          callback: () => {},
          type: 'secondary'
        },
        {
          label: 'Delete',
          callback: () => {
            if (onConfirm) {
              onConfirm(entity.id);
            }
          },
          type: 'primary'
        }
      ]
    });
  }
  
  /**
   * Get modal instance (for rendering and input handling)
   * @returns {ModalDialog|null}
   */
  getModal() {
    return this._modal;
  }
  
  /**
   * Get toast notification instance
   * @returns {ToastNotification|null}
   */
  getToast() {
    return this._toast;
  }
  
  /**
   * Select an entity by ID
   * @param {string} entityId - Entity ID to select
   */
  selectEntity(entityId) {
    this._selectedTemplateId = entityId;
  }
  
  /**
   * Get currently selected entity
   * @returns {Object|null} Selected entity or null
   */
  getSelectedEntity() {
    if (!this._selectedTemplateId) {
      return null;
    }
    
    // Check custom category first
    if (this.currentCategory === 'custom' && this._templates.custom) {
      const entity = this._templates.custom.find(e => e.id === this._selectedTemplateId);
      if (entity) return entity;
    }
    
    // Check current category templates
    const templates = this.getCurrentTemplates();
    return templates.find(t => t.id === this._selectedTemplateId) || null;
  }
  
  /**
   * Clear entity selection
   */
  clearSelection() {
    this._selectedTemplateId = null;
  }
  
  /**
   * Delete the currently selected custom entity
   * @returns {boolean} True if deleted, false otherwise
   */
  deleteSelectedEntity() {
    const selected = this.getSelectedEntity();
    if (!selected) {
      return false;
    }
    
    // Only allow deletion in custom category
    if (this.currentCategory !== 'custom') {
      return false;
    }
    
    const result = this.deleteCustomEntity(selected.id);
    if (result) {
      this.clearSelection();
    }
    return result;
  }
  
  /**
   * Register keyboard shortcuts with ShortcutManager
   * This is a static method that should be called once during setup
   */
  static registerKeyboardShortcuts() {
    if (typeof ShortcutManager === 'undefined') {
      console.warn('ShortcutManager not available - keyboard shortcuts disabled');
      return;
    }
    
    // Delete key - delete selected custom entity
    ShortcutManager.register({
      id: 'entity-palette-delete',
      trigger: { event: 'keypress', key: 'Delete' },
      tools: ['entity-palette'],
      action: (context) => {
        const palette = context.getEntityPalette ? context.getEntityPalette() : null;
        if (palette && palette.currentCategory === 'custom') {
          palette.deleteSelectedEntity();
        }
      }
    });
    
    // Escape key - clear selection
    ShortcutManager.register({
      id: 'entity-palette-escape',
      trigger: { event: 'keypress', key: 'Escape' },
      tools: ['entity-palette'],
      action: (context) => {
        const palette = context.getEntityPalette ? context.getEntityPalette() : null;
        if (palette) {
          palette.clearSelection();
        }
      }
    });
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
