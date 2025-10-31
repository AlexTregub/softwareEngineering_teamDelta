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
    
    // Tooltip state
    this._tooltipVisible = false;
    this._tooltipContent = null;
    this._tooltipX = 0;
    this._tooltipY = 0;
    this._tooltipWidth = 0;
    this._tooltipHeight = 0;
    
    // Loading spinner state
    this._loadingSpinnerVisible = false;
    this._spinnerRotation = 0;
    
    // Search/filter state
    this._searchQuery = '';
    
    // Drag-to-reorder state
    this._isDragging = false;
    this._draggedEntity = null;
    this._dragStartY = 0;
    this._dragCurrentY = 0;
    
    // Scroll support (limit viewport to 4 entries)
    this.scrollOffset = 0;
    this.maxScrollOffset = 0;
    this.viewportHeight = 320; // 4 entries * 80px per entry
    
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
    this.showLoadingSpinner();
    
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
    } finally {
      this.hideLoadingSpinner();
    }
    return [];
  }
  
  /**
   * Save custom entities to localStorage
   * @private
   */
  _saveCustomEntities() {
    this.showLoadingSpinner();
    
    try {
      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        return;
      }
      
      const customEntities = this._templates.custom || [];
      localStorage.setItem('antGame_customEntities', JSON.stringify(customEntities));
    } catch (error) {
      console.error('Error saving custom entities:', error);
    } finally {
      this.hideLoadingSpinner();
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
    
    // Update scroll bounds (content height changed)
    this.updateScrollBounds();
    
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
    this.updateScrollBounds(); // Update scroll bounds when category changes
  }
  
  /**
   * Get templates for the current category
   * @returns {Array} Array of template objects
   */
  getCurrentTemplates() {
    const templates = this._templates[this.currentCategory] || [];
    
    // Apply search filter only to custom category
    if (this.currentCategory === 'custom' && this._searchQuery) {
      return this.filterTemplates(templates, this._searchQuery);
    }
    
    return templates;
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
    const searchBoxHeight = this.currentCategory === 'custom' ? 30 + padding : 0;
    const addButtonHeight = this.currentCategory === 'custom' ? 50 : 0;
    const totalHeight = radioButtonsHeight + searchBoxHeight + listHeight + addButtonHeight + 16;
    
    return {
      width: width,
      height: totalHeight
    };
  }
  
  /**
   * Update scroll bounds based on content height vs viewport height
   * Called when content changes (category switch, add/remove entities, search)
   */
  updateScrollBounds() {
    const contentSize = this.getContentSize(220); // Use standard width
    const totalContentHeight = contentSize.height;
    
    // Calculate max scroll: max(0, totalHeight - viewportHeight)
    this.maxScrollOffset = Math.max(0, totalContentHeight - this.viewportHeight);
    
    // Clamp current scroll to new bounds
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
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
    
    // Render CategoryRadioButtons at top (always visible, not scrolled)
    if (this.categoryButtons) {
      this.categoryButtons.render(x, y, width);
    }
    
    const buttonHeight = this.categoryButtons ? this.categoryButtons.height : 30;
    const padding = 8;
    
    // Render search box (only in custom category, always visible, not scrolled)
    let searchBoxHeight = 0;
    if (this.currentCategory === 'custom') {
      const searchY = y + buttonHeight + padding;
      this.renderSearchBox(x + padding, searchY, width - padding * 2);
      searchBoxHeight = 30 + padding; // Search box height + padding
    }
    
    // Update scroll bounds before rendering scrollable content
    this.updateScrollBounds();
    
    // Setup scrollable content area with clipping
    const scrollableY = y + buttonHeight + padding + searchBoxHeight;
    const scrollableHeight = Math.min(this.viewportHeight, height - buttonHeight - padding - searchBoxHeight);
    
    // Use canvas clipping to constrain content to viewport
    if (typeof drawingContext !== 'undefined' && drawingContext) {
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.rect(x, scrollableY, width, scrollableHeight);
      drawingContext.clip();
    }
    
    // Render template LIST below radio buttons (and search box if present)
    // Apply scroll offset to Y coordinate
    const templates = this.getCurrentTemplates();
    const itemHeight = 80; // 64px sprite + 16px padding
    
    let listY = scrollableY - this.scrollOffset;
    
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
    
    // Restore canvas state (removes clipping)
    if (typeof drawingContext !== 'undefined' && drawingContext) {
      drawingContext.restore();
    }
    
    pop(); // End main render
    
    // Update and render toasts (independent of EntityPalette rendering)
    if (this._toast) {
      this._toast.update();
      this._toast.render();
    }
    
    // Update and render loading spinner
    this.updateLoadingSpinner();
    this.renderLoadingSpinner(x, y, width, height);
    
    // Render drag-to-reorder visuals
    if (this._isDragging) {
      this.renderDropIndicator(x, y, width, height);
      this.renderDragGhost(x, y, width);
      this.updateCursor();
    }
    
    // Render tooltip (always last, on top of everything)
    this._renderTooltip();
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
    
    const padding = 8;
    
    // Check search box (only in custom category)
    let searchBoxHeight = 0;
    if (this.currentCategory === 'custom') {
      const searchY = buttonHeight + padding;
      const searchBoxH = 30;
      
      if (relY >= searchY && relY < searchY + searchBoxH) {
        // Clear button (far right)
        if (this._searchQuery && relX > panelWidth - padding - 40 && relX < panelWidth - padding) {
          this.handleClearSearch();
          return { type: 'clearSearch' };
        }
        
        // Search box clicked (could trigger keyboard input in real implementation)
        return { type: 'searchBoxClick' };
      }
      
      searchBoxHeight = searchBoxH + padding;
    }
    
    // Adjust Y coordinate for scroll offset in scrollable content area
    const scrollableStartY = buttonHeight + padding + searchBoxHeight;
    const adjustedRelY = relY >= scrollableStartY ? relY + this.scrollOffset : relY;
    
    // Check template LIST (below button height and search box)
    // Use adjustedRelY for all comparisons in scrollable area
    if (adjustedRelY > buttonHeight + padding + searchBoxHeight) {
      const templates = this.getCurrentTemplates();
      const itemHeight = 80;
      const headerHeight = 20; // Custom entity header height
      
      // Calculate Y position relative to list start
      let cumulativeY = 0;
      
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const itemStartY = buttonHeight + padding + searchBoxHeight + cumulativeY;
        const itemWithHeaderHeight = (this.currentCategory === 'custom' ? headerHeight : 0) + itemHeight;
        
        // Check if click is within this item's bounds (using adjusted Y)
        if (adjustedRelY >= itemStartY && adjustedRelY < itemStartY + itemWithHeaderHeight) {
          // Custom category: Check for rename/delete button clicks in header
          if (this.currentCategory === 'custom') {
            const headerRelY = adjustedRelY - itemStartY;
            
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
      
      // Check for "Add New" button at bottom (using adjusted Y)
      if (this.currentCategory === 'custom') {
        const addButtonHeight = 40;
        const addButtonY = buttonHeight + padding + searchBoxHeight + cumulativeY + 8;
        
        if (adjustedRelY >= addButtonY && adjustedRelY < addButtonY + addButtonHeight) {
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
  
  /**
   * Handle mouse wheel events for scrolling
   * @param {number} delta - Wheel delta (positive = scroll down, negative = scroll up)
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {number} contentX - Content area X position
   * @param {number} contentY - Content area Y position
   * @param {number} panelWidth - Panel width
   * @returns {boolean} True if wheel event was handled
   */
  handleMouseWheel(delta, mouseX, mouseY, contentX, contentY, panelWidth) {
    // Only scroll if mouse is over the panel
    if (!this.containsPoint(mouseX, mouseY, contentX, contentY)) {
      return false;
    }
    
    // Update scroll offset
    const scrollSpeed = 20;
    this.scrollOffset += delta > 0 ? scrollSpeed : -scrollSpeed;
    
    // Clamp to valid range
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
    
    return true; // Event consumed
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
  
  // ============================================================
  // TOOLTIP METHODS
  // ============================================================
  
  /**
   * Show tooltip with content at cursor position
   * @param {string} content - Tooltip text content
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   */
  showTooltip(content, mouseX, mouseY) {
    this._tooltipContent = content;
    this._tooltipVisible = true;
    
    // Calculate tooltip dimensions based on content
    const lines = content.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    this._tooltipWidth = Math.min(300, Math.max(150, maxLineLength * 7));
    this._tooltipHeight = lines.length * 16 + 12; // Line height + padding
    
    // Position tooltip offset from cursor
    let tooltipX = mouseX + 15;
    let tooltipY = mouseY + 15;
    
    // Avoid right screen edge
    if (typeof window !== 'undefined' && window.width) {
      if (tooltipX + this._tooltipWidth > window.width) {
        tooltipX = mouseX - this._tooltipWidth - 15;
      }
    } else if (typeof global !== 'undefined' && global.width) {
      if (tooltipX + this._tooltipWidth > global.width) {
        tooltipX = mouseX - this._tooltipWidth - 15;
      }
    }
    
    // Avoid bottom screen edge
    if (typeof window !== 'undefined' && window.height) {
      if (tooltipY + this._tooltipHeight > window.height) {
        tooltipY = mouseY - this._tooltipHeight - 15;
      }
    } else if (typeof global !== 'undefined' && global.height) {
      if (tooltipY + this._tooltipHeight > global.height) {
        tooltipY = mouseY - this._tooltipHeight - 15;
      }
    }
    
    this._tooltipX = tooltipX;
    this._tooltipY = tooltipY;
  }
  
  /**
   * Hide tooltip and clear content
   */
  hideTooltip() {
    this._tooltipVisible = false;
    this._tooltipContent = null;
  }
  
  /**
   * Generate tooltip content for a template
   * @param {Object} template - Entity template
   * @returns {string} Formatted tooltip content
   */
  getTooltipContent(template) {
    if (!template) {
      return 'Unknown Entity';
    }
    
    let content = '';
    
    // Name
    if (template.customName) {
      content += `${template.customName}\n`;
      content += `(Custom)\n`;
    } else if (template.name) {
      content += `${template.name}\n`;
    }
    
    // Type
    if (template.type) {
      content += `Type: ${template.type}\n`;
    }
    
    // Group info
    if (template.isGroup && template.entities) {
      content += `Group: ${template.entities.length} entities\n`;
    }
    
    // Properties
    if (template.properties) {
      content += '\n'; // Blank line before properties
      
      // Key properties to show
      const keyProps = ['faction', 'health', 'movementSpeed', 'buildingType', 'capacity'];
      
      keyProps.forEach(prop => {
        if (template.properties[prop] !== undefined) {
          // Format property name (camelCase to Title Case)
          const formattedName = prop.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          content += `${formattedName}: ${template.properties[prop]}\n`;
        }
      });
    }
    
    return content.trim();
  }
  
  /**
   * Handle mouse move for tooltip hover detection
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {number} panelX - Panel X position
   * @param {number} panelY - Panel Y position
   * @param {number} panelWidth - Panel width
   * @returns {Object|null} Hovered template or null
   */
  handleMouseMove(mouseX, mouseY, panelX, panelY, panelWidth) {
    const templates = this.getCurrentTemplates();
    const buttonHeight = 30;
    const itemHeight = 80;
    const itemPadding = 8;
    
    // Calculate content area start
    const contentY = panelY + buttonHeight;
    
    // Check if mouse is within panel bounds
    if (mouseX < panelX || mouseX > panelX + panelWidth || mouseY < contentY) {
      this.hideTooltip();
      return null;
    }
    
    // Calculate which item is being hovered
    const relativeY = mouseY - contentY;
    const itemIndex = Math.floor(relativeY / (itemHeight + itemPadding));
    
    if (itemIndex >= 0 && itemIndex < templates.length) {
      const template = templates[itemIndex];
      const tooltipContent = this.getTooltipContent(template);
      this.showTooltip(tooltipContent, mouseX, mouseY);
      return template;
    } else {
      this.hideTooltip();
      return null;
    }
  }
  
  /**
   * Render tooltip if visible
   * @private
   */
  _renderTooltip() {
    if (!this._tooltipVisible || !this._tooltipContent) {
      return;
    }
    
    push();
    
    // Background
    fill(40, 40, 45, 240);
    stroke(200, 200, 200);
    strokeWeight(1);
    rect(this._tooltipX, this._tooltipY, this._tooltipWidth, this._tooltipHeight, 4);
    
    // Text
    fill(255);
    noStroke();
    textSize(12);
    textAlign(LEFT, TOP);
    
    const lines = this._tooltipContent.split('\n');
    const lineHeight = 16;
    const padding = 6;
    
    lines.forEach((line, index) => {
      text(line, this._tooltipX + padding, this._tooltipY + padding + (index * lineHeight));
    });
    
    pop();
  }
  
  // ============================================================
  // LOADING SPINNER METHODS
  // ============================================================
  
  /**
   * Show loading spinner overlay
   */
  showLoadingSpinner() {
    this._loadingSpinnerVisible = true;
  }
  
  /**
   * Hide loading spinner overlay
   */
  hideLoadingSpinner() {
    this._loadingSpinnerVisible = false;
  }
  
  /**
   * Update loading spinner animation
   */
  updateLoadingSpinner() {
    if (!this._loadingSpinnerVisible) {
      return;
    }
    
    // Rotate spinner (about 180 degrees per second at 60fps)
    this._spinnerRotation += 0.1;
    
    // Wrap at TWO_PI (use global constant if available, otherwise Math.PI * 2)
    const twoPi = (typeof TWO_PI !== 'undefined') ? TWO_PI : Math.PI * 2;
    if (this._spinnerRotation >= twoPi) {
      this._spinnerRotation -= twoPi;
    }
  }
  
  /**
   * Render loading spinner overlay
   * @param {number} x - Panel X position
   * @param {number} y - Panel Y position
   * @param {number} width - Panel width
   * @param {number} height - Panel height
   */
  renderLoadingSpinner(x, y, width, height) {
    if (!this._loadingSpinnerVisible) {
      return;
    }
    
    push();
    
    // Semi-transparent overlay
    fill(0, 0, 0, 180);
    noStroke();
    rect(x, y, width, height);
    
    // Center position
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    translate(centerX, centerY);
    rotate(this._spinnerRotation);
    
    // Draw spinner arcs (3 arcs at different angles)
    noFill();
    strokeWeight(4);
    
    // Constants (use global p5 constants if available, otherwise Math.PI)
    const pi = (typeof PI !== 'undefined') ? PI : Math.PI;
    const halfPi = (typeof HALF_PI !== 'undefined') ? HALF_PI : Math.PI / 2;
    const twoPi = (typeof TWO_PI !== 'undefined') ? TWO_PI : Math.PI * 2;
    const radius = (typeof RADIUS !== 'undefined') ? RADIUS : 'radius';
    
    // Arc 1 - Gold
    stroke(255, 215, 0, 255);
    arc(0, 0, 40, 40, 0, halfPi, radius);
    
    // Arc 2 - Yellow
    stroke(255, 255, 100, 200);
    arc(0, 0, 40, 40, pi, pi + halfPi, radius);
    
    // Arc 3 - Light Gold
    stroke(255, 230, 100, 150);
    arc(0, 0, 40, 40, pi + pi / 2, twoPi - pi / 4, radius);
    
    pop();
    
    // "Loading..." text
    push();
    fill(255);
    noStroke();
    textSize(14);
    textAlign(CENTER, CENTER);
    text('Loading...', centerX, centerY + 40);
    pop();
  }
  
  // ============================================================
  // SEARCH/FILTER METHODS
  // ============================================================
  
  /**
   * Set search query for filtering custom entities
   * @param {string} query - Search query
   */
  setSearchQuery(query) {
    this._searchQuery = (query || '').trim().toLowerCase();
    this.updateScrollBounds(); // Update scroll bounds when search filter changes
  }
  
  /**
   * Clear search query
   */
  clearSearch() {
    this._searchQuery = '';
  }
  
  /**
   * Filter templates based on search query
   * @param {Array} templates - Templates to filter
   * @param {string} query - Search query
   * @returns {Array} Filtered templates
   */
  filterTemplates(templates, query) {
    if (!templates || !Array.isArray(templates)) {
      return [];
    }
    
    if (!query || query.trim() === '') {
      return templates;
    }
    
    const searchLower = query.toLowerCase();
    
    return templates.filter(template => {
      // Search in custom name
      if (template.customName && template.customName.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in base template ID
      if (template.baseTemplateId && template.baseTemplateId.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
  }
  
  /**
   * Render search box (only in custom category)
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   */
  renderSearchBox(x, y, width) {
    if (this.currentCategory !== 'custom') {
      return;
    }
    
    push();
    
    const height = 30;
    
    // Background
    fill(45, 45, 50);
    stroke(80, 80, 85);
    strokeWeight(1);
    rect(x, y, width, height, 4);
    
    // Search icon (🔍)
    fill(150);
    noStroke();
    textSize(14);
    textAlign(LEFT, CENTER);
    text('🔍', x + 8, y + height / 2);
    
    // Search text or placeholder
    textSize(13);
    if (this._searchQuery) {
      fill(255);
      text(this._searchQuery, x + 28, y + height / 2);
      
      // Clear button (X)
      const clearX = x + width - 25;
      fill(180, 180, 180);
      textSize(16);
      textAlign(CENTER, CENTER);
      text('×', clearX, y + height / 2);
    } else {
      fill(120);
      text('Search...', x + 28, y + height / 2);
    }
    
    pop();
  }
  
  /**
   * Handle search input
   * @param {string} input - Input text
   */
  handleSearchInput(input) {
    this.setSearchQuery(input);
  }
  
  /**
   * Handle clear search button click
   */
  handleClearSearch() {
    this.clearSearch();
  }
  
  // ============================================================
  // DRAG-TO-REORDER METHODS
  // ============================================================
  
  /**
   * Start dragging an entity
   * @param {Object} entity - Entity to drag
   * @param {number} startY - Starting Y position
   */
  startDrag(entity, startY) {
    this._isDragging = true;
    this._draggedEntity = entity;
    this._dragStartY = startY;
    this._dragCurrentY = startY;
  }
  
  /**
   * End dragging and clear state
   */
  endDrag() {
    this._isDragging = false;
    this._draggedEntity = null;
    this._dragStartY = 0;
    this._dragCurrentY = 0;
  }
  
  /**
   * Update drag position
   * @param {number} currentY - Current Y position
   */
  updateDragPosition(currentY) {
    this._dragCurrentY = currentY;
  }
  
  /**
   * Handle mouse pressed for drag start
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {number} panelX - Panel X position
   * @param {number} panelY - Panel Y position
   * @param {number} panelWidth - Panel width
   * @param {number} panelHeight - Panel height
   * @returns {Object|null} Drag start result
   */
  handleMousePressed(mouseX, mouseY, panelX, panelY, panelWidth, panelHeight) {
    if (this.currentCategory !== 'custom') {
      return null;
    }
    
    const relX = mouseX - panelX;
    const relY = mouseY - panelY;
    
    // Use getCurrentTemplates to respect search filtering
    const templates = this.getCurrentTemplates();
    if (templates.length === 0) {
      return null;
    }
    
    const buttonHeight = this.categoryButtons ? this.categoryButtons.height : 30;
    const padding = 8;
    
    // Include search box only in custom category
    const hasSearchBox = this.currentCategory === 'custom';
    const searchBoxHeight = hasSearchBox ? 30 + padding : 0;
    
    const itemHeight = 80;
    const headerHeight = 20;
    
    let cumulativeY = 0;
    
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const itemStartY = buttonHeight + padding + searchBoxHeight + cumulativeY;
      const itemTotalHeight = headerHeight + itemHeight;
      
      if (relY >= itemStartY && relY < itemStartY + itemTotalHeight) {
        this.startDrag(template, relY);
        return { type: 'dragStart', entity: template };
      }
      
      cumulativeY += itemTotalHeight + padding;
    }
    
    return null;
  }
  
  /**
   * Handle mouse dragged
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {number} panelX - Panel X position
   * @param {number} panelY - Panel Y position
   * @param {number} panelWidth - Panel width
   * @param {number} panelHeight - Panel height
   */
  handleMouseDragged(mouseX, mouseY, panelX, panelY, panelWidth, panelHeight) {
    if (!this._isDragging) {
      return;
    }
    
    const relY = mouseY - panelY;
    this.updateDragPosition(relY);
  }
  
  /**
   * Handle mouse released for drag end
   * @returns {Object|null} Drag end result with reorder info
   */
  handleMouseReleased() {
    if (!this._isDragging) {
      return null;
    }
    
    const draggedEntity = this._draggedEntity;
    const dropIndex = this.getDropIndex(this._dragCurrentY);
    
    this.endDrag();
    
    if (draggedEntity && dropIndex !== -1) {
      this.reorderCustomEntity(draggedEntity.id, dropIndex);
      return { type: 'dragEnd', entity: draggedEntity, newIndex: dropIndex };
    }
    
    return null;
  }
  
  /**
   * Get drop index based on Y position
   * @param {number} y - Y position
   * @returns {number} Drop index
   */
  getDropIndex(y) {
    const templates = this.getCurrentTemplates();
    
    if (templates.length === 0) {
      return 0;
    }
    
    const buttonHeight = this.categoryButtons ? this.categoryButtons.height : 30;
    const padding = 8;
    const searchBoxHeight = 30 + padding;
    const itemHeight = 80;
    const headerHeight = 20;
    const itemTotalHeight = headerHeight + itemHeight + padding;
    
    const listStartY = buttonHeight + padding + searchBoxHeight;
    const relativeY = y - listStartY;
    
    if (relativeY <= 0) {
      return 0;
    }
    
    const index = Math.floor(relativeY / itemTotalHeight);
    
    // Clamp to valid range
    return Math.min(Math.max(0, index), templates.length);
  }
  
  /**
   * Reorder custom entity to new position
   * @param {string} entityId - Entity ID
   * @param {number} newIndex - New index position (0-based, desired final position)
   * @returns {boolean} Success
   */
  reorderCustomEntity(entityId, newIndex) {
    if (!this._templates.custom) {
      return false;
    }
    
    const entities = this._templates.custom;
    const currentIndex = entities.findIndex(e => e.id === entityId);
    
    if (currentIndex === -1) {
      return false;
    }
    
    // Validate bounds
    if (newIndex < 0 || newIndex >= entities.length) {
      return false;
    }
    
    // No-op if same position
    if (currentIndex === newIndex) {
      return true;
    }
    
    // Remove from current position
    const [entity] = entities.splice(currentIndex, 1);
    
    // Insert at new position
    // After removal, use newIndex directly
    // Example: [A, B, C] move A (0) to position 2
    //  Remove: [B, C]
    //  Insert at 2: [B, C, A] (splice appends if index >= length)
    entities.splice(newIndex, 0, entity);
    
    // Persist to LocalStorage
    this._saveCustomEntities();
    
    return true;
  }
  
  /**
   * Render drag ghost (semi-transparent preview)
   * @param {number} panelX - Panel X position
   * @param {number} panelY - Panel Y position
   * @param {number} panelWidth - Panel width
   */
  renderDragGhost(panelX, panelY, panelWidth) {
    if (!this._isDragging || !this._draggedEntity) {
      return;
    }
    
    push();
    
    const itemHeight = 80;
    const headerHeight = 20;
    const padding = 8;
    const ghostY = panelY + this._dragCurrentY;
    
    // Semi-transparent background
    fill(60, 60, 70, 150);
    stroke(255, 215, 0, 180);
    strokeWeight(2);
    rect(panelX + padding, ghostY, panelWidth - padding * 2, headerHeight + itemHeight, 6);
    
    // Entity name
    fill(255, 215, 0, 200);
    noStroke();
    textSize(12);
    textAlign(LEFT, CENTER);
    text(this._draggedEntity.customName || this._draggedEntity.name, 
         panelX + padding + 8, ghostY + 10);
    
    pop();
  }
  
  /**
   * Render drop indicator line
   * @param {number} panelX - Panel X position
   * @param {number} panelY - Panel Y position
   * @param {number} panelWidth - Panel width
   * @param {number} panelHeight - Panel height
   */
  renderDropIndicator(panelX, panelY, panelWidth, panelHeight) {
    if (!this._isDragging) {
      return;
    }
    
    const dropIndex = this.getDropIndex(this._dragCurrentY);
    const buttonHeight = this.categoryButtons ? this.categoryButtons.height : 30;
    const padding = 8;
    const searchBoxHeight = 30 + padding;
    const itemHeight = 80;
    const headerHeight = 20;
    const itemTotalHeight = headerHeight + itemHeight + padding;
    
    const listStartY = buttonHeight + padding + searchBoxHeight;
    const dropY = panelY + listStartY + (dropIndex * itemTotalHeight);
    
    push();
    stroke(255, 215, 0);
    strokeWeight(3);
    line(panelX + padding, dropY, panelX + panelWidth - padding, dropY);
    
    // Arrow indicators
    fill(255, 215, 0);
    noStroke();
    triangle(
      panelX + padding, dropY,
      panelX + padding + 8, dropY - 4,
      panelX + padding + 8, dropY + 4
    );
    triangle(
      panelX + panelWidth - padding, dropY,
      panelX + panelWidth - padding - 8, dropY - 4,
      panelX + panelWidth - padding - 8, dropY + 4
    );
    pop();
  }
  
  /**
   * Update cursor based on drag state
   */
  updateCursor() {
    if (typeof cursor === 'undefined') {
      return;
    }
    
    if (this._isDragging) {
      cursor(MOVE);
    }
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
        if (!palette || palette.currentCategory !== 'custom') {
          return false; // Not handled - invalid context
        }
        palette.deleteSelectedEntity();
        return true; // Handled successfully
      }
    });
    
    // Escape key - clear selection
    ShortcutManager.register({
      id: 'entity-palette-escape',
      trigger: { event: 'keypress', key: 'Escape' },
      tools: ['entity-palette'],
      action: (context) => {
        const palette = context.getEntityPalette ? context.getEntityPalette() : null;
        if (!palette) {
          return false; // Not handled - invalid context
        }
        palette.clearSelection();
        return true; // Handled successfully
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
