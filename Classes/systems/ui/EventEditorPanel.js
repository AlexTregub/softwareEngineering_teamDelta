/**
 * EventEditorPanel - UI for managing random events in Level Editor
 * 
 * Provides interface to:
 * - View all registered events
 * - Add new events (dialogue, spawn, tutorial, boss)
 * - Edit existing events
 * - Delete events
 * - Configure triggers (time, flag, spatial, conditional)
 * - Export/import JSON configurations
 * 
 * Integrates with EventManager and DraggablePanelManager
 * 
 * @author Software Engineering Team Delta
 */

class EventEditorPanel {
  constructor() {
    this.eventManager = null;
    this.selectedEventId = null;
    this.selectedTriggerId = null;
    this.editMode = null; // 'add-event', 'edit-event', 'add-trigger', 'edit-trigger', null
    
    // Template system
    this.templates = typeof getEventTemplates !== 'undefined' ? getEventTemplates() : [];
    this.templateScrollOffset = 0;
    this.templateCardWidth = 60;
    this.templateCardHeight = 80;
    this.templateAreaHeight = 90; // Height of template browser area
    
    // UI state
    this.scrollOffset = 0;
    this.maxScrollOffset = 0;
    this.listItemHeight = 30;
    this.listPadding = 5;
    
    // Edit form state
    this.editForm = {
      id: '',
      type: 'dialogue',
      priority: 5,
      content: {}
    };
    
    this.triggerForm = {
      eventId: '',
      type: 'time',
      oneTime: true,
      condition: {}
    };
    
    // Dialogue Creation Panel (for dialogue template)
    this.dialoguePanel = null;
    this.dialoguePanelActive = false;
    
    // Drag-to-place state
    this.dragState = {
      isDragging: false,
      eventId: null,
      cursorX: 0,
      cursorY: 0,
      triggerRadius: 64 // Default trigger radius in pixels
    };
    
    // Placement mode state (double-click to enable)
    this.placementMode = {
      isActive: false,
      eventId: null,
      cursorX: 0,
      cursorY: 0
    };
  }
  
  /**
   * Initialize the panel with EventManager
   */
  initialize() {
    if (typeof EventManager === 'undefined') {
      console.error('EventEditorPanel: EventManager not found');
      return false;
    }
    
    this.eventManager = EventManager.getInstance();
    logNormal('✅ EventEditorPanel initialized');
    return true;
  }
  
  /**
   * Get content size for DraggablePanel auto-sizing
   * @returns {{width: number, height: number}}
   */
  getContentSize() {
    if (this.editMode) {
      // Edit mode: larger panel for forms
      return { width: 300, height: 400 };
    } else {
      // List mode: smaller panel
      return { width: 250, height: 300 };
    }
  }
  
  /**
   * Render the panel content
   * @param {number} x - Content area X position
   * @param {number} y - Content area Y position
   * @param {number} width - Content area width
   * @param {number} height - Content area height
   */
  render(x, y, width, height) {
    if (!this.eventManager) {
      push();
      fill(255, 100, 100);
      textAlign(LEFT, TOP);
      textSize(12);
      text('EventManager not initialized', x + 5, y + 5);
      pop();
      return;
    }
    
    push();
    
    if (this.editMode === 'add-event' || this.editMode === 'edit-event') {
      this._renderEventForm(x, y, width, height);
    } else if (this.editMode === 'add-trigger' || this.editMode === 'edit-trigger') {
      this._renderTriggerForm(x, y, width, height);
    } else {
      this._renderEventList(x, y, width, height);
    }
    
    pop();
    
    // Render DialogueCreationPanel on top if active
    if (this.dialoguePanelActive && this.dialoguePanel) {
      // Draw dark overlay to focus attention on modal (full canvas)
      push();
      fill(0, 0, 0, 180); // Semi-transparent black
      noStroke();
      const canvasWidth = (typeof window.width !== 'undefined' ? window.width : window.innerWidth);
      const canvasHeight = (typeof window.height !== 'undefined' ? window.height : window.innerHeight);
      rect(0, 0, canvasWidth, canvasHeight);
      pop();
      
      this.dialoguePanel.render();
    }
  }
  
  /**
   * Render event list view
   * @private
   */
  _renderEventList(x, y, width, height) {
    const events = this.eventManager.getAllEvents();
    
    // Render template browser at top
    this._renderTemplates(x, y, width);
    
    // Adjust list area to be below templates
    const listStartY = y + this.templateAreaHeight + 5;
    
    // Header with Add button
    fill(80);
    textAlign(LEFT, TOP);
    textSize(12);
    text(`Events (${events.length})`, x + 5, listStartY + 5);
    
    // Add button
    const addBtnX = x + width - 35;
    const addBtnY = listStartY + 2;
    fill(this.selectedEventId === null ? 100 : 60, 150, 100);
    rect(addBtnX, addBtnY, 30, 20, 3);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    text('+', addBtnX + 15, addBtnY + 10);
    
    // Export/Import buttons
    const exportBtnX = x + 5;
    const exportBtnY = listStartY + (height - this.templateAreaHeight - 5) - 25;
    fill(70, 120, 180);
    rect(exportBtnX, exportBtnY, 60, 20, 3);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(10);
    text('Export', exportBtnX + 30, exportBtnY + 10);
    
    const importBtnX = exportBtnX + 65;
    fill(180, 120, 70);
    rect(importBtnX, exportBtnY, 60, 20, 3);
    fill(255);
    text('Import', importBtnX + 30, exportBtnY + 10);
    
    // Event list (scrollable)
    const listY = listStartY + 30;
    const listHeight = (height - this.templateAreaHeight - 5) - 60;
    
    // Clip region for scrolling
    push();
    noStroke();
    
    let itemY = listY - this.scrollOffset;
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      // Skip if outside visible area
      if (itemY + this.listItemHeight < listY || itemY > listY + listHeight) {
        itemY += this.listItemHeight + this.listPadding;
        continue;
      }
      
      const isSelected = event.id === this.selectedEventId;
      const isActive = event.active || false;
      
      // Background
      if (isSelected) {
        fill(100, 150, 200, 150);
      } else if (isActive) {
        fill(100, 200, 100, 100);
      } else {
        fill(60, 60, 70, 150);
      }
      rect(x + this.listPadding, itemY, width - 2 * this.listPadding, this.listItemHeight, 3);
      
      // Event info
      fill(255);
      textAlign(LEFT, CENTER);
      textSize(11);
      
      // ID and type
      text(`${event.id}`, x + this.listPadding + 5, itemY + 10);
      
      textSize(9);
      fill(180);
      text(`(${event.type})`, x + this.listPadding + 5, itemY + 22);
      
      // Drag button (🚩 icon) on the right side
      const dragBtnX = x + width - 55;
      const dragBtnY = itemY + 5;
      const dragBtnSize = 20;
      
      // Drag button background
      fill(70, 120, 180, 200);
      rect(dragBtnX, dragBtnY, dragBtnSize, dragBtnSize, 3);
      
      // Drag icon (flag emoji or simple triangle)
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(14);
      text('🚩', dragBtnX + dragBtnSize / 2, dragBtnY + dragBtnSize / 2);
      
      // Priority badge
      fill(200, 150, 50);
      const priorityX = x + width - 25;
      rect(priorityX, itemY + 5, 20, 20, 2);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(10);
      text(event.priority || 5, priorityX + 10, itemY + 15);
      
      itemY += this.listItemHeight + this.listPadding;
    }
    
    pop();
    
    // Update max scroll
    this.maxScrollOffset = Math.max(0, events.length * (this.listItemHeight + this.listPadding) - listHeight);
    
    // Scrollbar if needed
    if (this.maxScrollOffset > 0) {
      const scrollbarX = x + width - 8;
      const scrollbarHeight = listHeight;
      const thumbHeight = Math.max(20, scrollbarHeight * (listHeight / (listHeight + this.maxScrollOffset)));
      const thumbY = listY + (this.scrollOffset / this.maxScrollOffset) * (scrollbarHeight - thumbHeight);
      
      fill(100, 100, 110, 100);
      rect(scrollbarX, listY, 6, scrollbarHeight, 3);
      
      fill(150, 150, 160, 200);
      rect(scrollbarX, thumbY, 6, thumbHeight, 3);
    }
  }
  
  /**
   * Render template browser at top of panel
   * @private
   */
  _renderTemplates(x, y, width) {
    if (this.templates.length === 0) return;
    
    push();
    
    // Background for template area
    fill(50, 50, 60, 200);
    rect(x, y, width, this.templateAreaHeight, 3);
    
    // Header
    fill(180);
    textAlign(LEFT, TOP);
    textSize(10);
    text('Templates', x + 5, y + 5);
    
    // Template cards (horizontal scrollable row)
    const templateY = y + 25;
    const cardSpacing = 5;
    let cardX = x + 5 - this.templateScrollOffset;
    
    for (let i = 0; i < this.templates.length; i++) {
      const template = this.templates[i];
      
      // Skip if outside visible area
      if (cardX + this.templateCardWidth < x || cardX > x + width) {
        cardX += this.templateCardWidth + cardSpacing;
        continue;
      }
      
      // Card background
      fill(70, 90, 120, 200);
      stroke(100, 120, 150);
      strokeWeight(1);
      rect(cardX, templateY, this.templateCardWidth, this.templateCardHeight, 3);
      noStroke();
      
      // Icon (emoji)
      fill(255);
      textAlign(CENTER, TOP);
      textSize(24);
      text(template.icon || '📝', cardX + this.templateCardWidth / 2, templateY + 10);
      
      // Name
      textSize(9);
      text(template.name, cardX + this.templateCardWidth / 2, templateY + 45);
      
      // Type badge
      fill(80, 100, 130, 200);
      rect(cardX + 5, templateY + this.templateCardHeight - 18, this.templateCardWidth - 10, 14, 2);
      fill(200);
      textSize(8);
      text(template.type, cardX + this.templateCardWidth / 2, templateY + this.templateCardHeight - 11);
      
      cardX += this.templateCardWidth + cardSpacing;
    }
    
    pop();
  }
  
  /**
   * Select a template and populate edit form
   * @param {string} templateId - Template ID to select
   * @private
   */
  _selectTemplate(templateId) {
    const template = typeof getTemplateById !== 'undefined' ? 
      getTemplateById(templateId) : 
      this.templates.find(t => t.id === templateId + '_template');
    
    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return;
    }
    
    // Generate unique event ID
    const timestamp = Date.now();
    const uniqueId = `${template.type}_${timestamp}`;
    
    // SPECIAL CASE: Dialogue template opens DialogueCreationPanel
    if (template.type === 'dialogue') {
      this._openDialoguePanel(uniqueId, template);
      return;
    }
    
    // Populate edit form with template defaults
    this.editForm = {
      id: uniqueId,
      type: template.type,
      priority: template.priority,
      content: { ...template.defaultContent }
    };
    
    // Switch to add-event mode
    this.editMode = 'add-event';
    
    logNormal(`📝 Template selected: ${template.name}`);
  }
  
  /**
   * Open DialogueCreationPanel for dialogue template
   * @private
   */
  _openDialoguePanel(eventId, template) {
    // Create event data for panel
    const eventData = {
      id: eventId,
      type: 'dialogue',
      priority: template.priority,
      content: template.defaultContent || {}
    };
    
    // Calculate responsive panel dimensions
    const maxPanelWidth = 700;
    const maxPanelHeight = 650;
    const padding = 40; // Padding from screen edges
    
    // Get canvas dimensions (use window size as fallback)
    const canvasWidth = (typeof width !== 'undefined' ? width : window.innerWidth);
    const canvasHeight = (typeof height !== 'undefined' ? height : window.innerHeight);
    
    // Scale panel to fit within canvas with padding
    let panelWidth = Math.min(maxPanelWidth, canvasWidth - padding * 2);
    let panelHeight = Math.min(maxPanelHeight, canvasHeight - padding * 2);
    
    // Maintain aspect ratio if needed
    if (panelHeight < maxPanelHeight) {
      panelWidth = Math.min(panelWidth, panelHeight * (maxPanelWidth / maxPanelHeight));
    }
    
    // Center panel on canvas
    const panelX = (canvasWidth - panelWidth) / 2;
    const panelY = (canvasHeight - panelHeight) / 2;
    
    // Create panel if it doesn't exist
    if (!this.dialoguePanel) {
      if (typeof DialogueCreationPanel === 'undefined') {
        console.error('DialogueCreationPanel not loaded');
        return;
      }
      
      this.dialoguePanel = new DialogueCreationPanel(
        panelX, 
        panelY, 
        panelWidth, 
        panelHeight, 
        eventData, 
        this.eventManager
      );
    } else {
      // Reuse existing panel with new event data and recalculate position
      this.dialoguePanel.eventData = eventData;
      this.dialoguePanel.dialogueLines = eventData.content.dialogueLines || [];
      this.dialoguePanel.x = panelX;
      this.dialoguePanel.y = panelY;
      this.dialoguePanel.width = panelWidth;
      this.dialoguePanel.height = panelHeight;
    }
    
    this.dialoguePanelActive = true;
    this.dialoguePanel.isVisible = true;
    
    logNormal(`💬 Dialogue panel opened for event: ${eventId} at (${panelX}, ${panelY}), size: ${panelWidth}x${panelHeight}`);
  }
  
  /**
   * Close DialogueCreationPanel
   * @private
   */
  _closeDialoguePanel() {
    if (this.dialoguePanel) {
      this.dialoguePanel.isVisible = false;
      this.dialoguePanelActive = false;
      logNormal('💬 Dialogue panel closed');
    }
  }
  
  /**
   * Render event add/edit form
   * @private
   */
  _renderEventForm(x, y, width, height) {
    fill(80);
    textAlign(LEFT, TOP);
    textSize(12);
    text(this.editMode === 'add-event' ? 'Add Event' : 'Edit Event', x + 5, y + 5);
    
    let formY = y + 30;
    const fieldHeight = 25;
    const labelWidth = 80;
    
    // Event ID
    fill(180);
    textSize(10);
    text('ID:', x + 5, formY + 5);
    
    fill(60);
    rect(x + labelWidth, formY, width - labelWidth - 5, fieldHeight, 3);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(11);
    text(this.editForm.id || '(enter id)', x + labelWidth + 5, formY + fieldHeight / 2);
    
    formY += fieldHeight + 10;
    
    // Event Type
    fill(180);
    textAlign(LEFT, TOP);
    textSize(10);
    text('Type:', x + 5, formY + 5);
    
    const types = ['dialogue', 'spawn', 'tutorial', 'boss'];
    const typeWidth = (width - labelWidth - 15) / types.length;
    
    for (let i = 0; i < types.length; i++) {
      const typeX = x + labelWidth + i * (typeWidth + 2);
      const isSelected = this.editForm.type === types[i];
      
      if (isSelected) {
        fill(100, 150, 200);
      } else {
        fill(60);
      }
      rect(typeX, formY, typeWidth, fieldHeight, 3);
      
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(9);
      text(types[i].slice(0, 4), typeX + typeWidth / 2, formY + fieldHeight / 2);
    }
    
    formY += fieldHeight + 10;
    
    // Priority
    fill(180);
    textAlign(LEFT, TOP);
    textSize(10);
    text('Priority:', x + 5, formY + 5);
    
    fill(60);
    rect(x + labelWidth, formY, 50, fieldHeight, 3);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(11);
    text(this.editForm.priority, x + labelWidth + 25, formY + fieldHeight / 2);
    
    // +/- buttons
    fill(100);
    rect(x + labelWidth + 55, formY, 20, fieldHeight, 3);
    rect(x + labelWidth + 78, formY, 20, fieldHeight, 3);
    fill(255);
    textSize(14);
    text('-', x + labelWidth + 65, formY + fieldHeight / 2);
    text('+', x + labelWidth + 88, formY + fieldHeight / 2);
    
    formY += fieldHeight + 20;
    
    // Buttons
    const btnWidth = (width - 15) / 2;
    
    // Cancel button
    fill(150, 70, 70);
    rect(x + 5, formY, btnWidth, 30, 3);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    text('Cancel', x + 5 + btnWidth / 2, formY + 15);
    
    // Save button
    fill(70, 150, 70);
    rect(x + 10 + btnWidth, formY, btnWidth, 30, 3);
    fill(255);
    text(this.editMode === 'add-event' ? 'Create' : 'Save', x + 10 + btnWidth + btnWidth / 2, formY + 15);
  }
  
  /**
   * Render trigger add/edit form
   * @private
   */
  _renderTriggerForm(x, y, width, height) {
    fill(80);
    textAlign(LEFT, TOP);
    textSize(12);
    text(this.editMode === 'add-trigger' ? 'Add Trigger' : 'Edit Trigger', x + 5, y + 5);
    
    let formY = y + 30;
    const fieldHeight = 25;
    const labelWidth = 80;
    
    // Trigger Type Selector
    fill(180);
    textSize(10);
    text('Type:', x + 5, formY + 5);
    
    // Type buttons
    const types = ['spatial', 'time', 'flag', 'viewport'];
    const typeLabels = ['Spatial', 'Time', 'Flag', 'Viewport'];
    const typeWidth = (width - labelWidth - 15) / types.length;
    
    for (let i = 0; i < types.length; i++) {
      const btnX = x + labelWidth + (i * typeWidth);
      const isSelected = this.triggerForm.type === types[i];
      
      // Button background
      fill(isSelected ? 100 : 60);
      rect(btnX, formY, typeWidth - 5, fieldHeight, 3);
      
      // Button text
      fill(isSelected ? 255 : 180);
      textAlign(CENTER, CENTER);
      textSize(10);
      text(typeLabels[i], btnX + (typeWidth - 5) / 2, formY + fieldHeight / 2);
    }
    
    formY += fieldHeight + 15;
    
    // Render fields based on trigger type
    if (this.triggerForm.type === 'spatial') {
      formY = this._renderSpatialTriggerFields(x, formY, width, fieldHeight, labelWidth);
    } else if (this.triggerForm.type === 'time') {
      formY = this._renderTimeTriggerFields(x, formY, width, fieldHeight, labelWidth);
    } else if (this.triggerForm.type === 'flag') {
      formY = this._renderFlagTriggerFields(x, formY, width, fieldHeight, labelWidth);
    } else if (this.triggerForm.type === 'viewport') {
      formY = this._renderViewportTriggerFields(x, formY, width, fieldHeight, labelWidth);
    }
    
    formY += 10;
    
    // One-Time checkbox (common for all types)
    fill(180);
    textAlign(LEFT, CENTER);
    textSize(10);
    text('One-Time:', x + 5, formY + fieldHeight / 2);
    
    // Checkbox
    fill(this.triggerForm.oneTime ? 100 : 60);
    rect(x + labelWidth, formY, 20, 20, 3);
    
    if (this.triggerForm.oneTime) {
      fill(0, 255, 0);
      textAlign(CENTER, CENTER);
      textSize(14);
      text('✓', x + labelWidth + 10, formY + 10);
    }
    
    formY += fieldHeight + 20;
    
    // Cancel and Create/Save buttons
    const buttonWidth = 80;
    const buttonSpacing = 10;
    
    // Cancel button
    fill(80, 40, 40);
    rect(x + width - (buttonWidth * 2 + buttonSpacing) - 5, formY, buttonWidth, fieldHeight, 3);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(11);
    text('Cancel', x + width - (buttonWidth * 2 + buttonSpacing) - 5 + buttonWidth / 2, formY + fieldHeight / 2);
    
    // Create/Save button
    fill(40, 80, 40);
    rect(x + width - buttonWidth - 5, formY, buttonWidth, fieldHeight, 3);
    fill(255);
    text(this.editMode === 'add-trigger' ? 'Create' : 'Save', x + width - buttonWidth - 5 + buttonWidth / 2, formY + fieldHeight / 2);
  }
  
  /**
   * Render spatial trigger fields
   * @private
   */
  _renderSpatialTriggerFields(x, formY, width, fieldHeight, labelWidth) {
    // X coordinate
    fill(180);
    textAlign(LEFT, CENTER);
    textSize(10);
    text('X:', x + 5, formY + fieldHeight / 2);
    
    fill(60);
    rect(x + labelWidth, formY, width - labelWidth - 5, fieldHeight, 3);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(11);
    text(this.triggerForm.condition.x || 0, x + labelWidth + 5, formY + fieldHeight / 2);
    
    formY += fieldHeight + 10;
    
    // Y coordinate
    fill(180);
    textAlign(LEFT, CENTER);
    textSize(10);
    text('Y:', x + 5, formY + fieldHeight / 2);
    
    fill(60);
    rect(x + labelWidth, formY, width - labelWidth - 5, fieldHeight, 3);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(11);
    text(this.triggerForm.condition.y || 0, x + labelWidth + 5, formY + fieldHeight / 2);
    
    formY += fieldHeight + 10;
    
    // Radius
    fill(180);
    textAlign(LEFT, CENTER);
    textSize(10);
    text('Radius:', x + 5, formY + fieldHeight / 2);
    
    fill(60);
    rect(x + labelWidth, formY, width - labelWidth - 5, fieldHeight, 3);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(11);
    text(this.triggerForm.condition.radius || 64, x + labelWidth + 5, formY + fieldHeight / 2);
    
    formY += fieldHeight + 10;
    
    // Shape radio buttons
    fill(180);
    textAlign(LEFT, CENTER);
    textSize(10);
    text('Shape:', x + 5, formY + fieldHeight / 2);
    
    const shapes = ['circle', 'rectangle'];
    const shapeWidth = (width - labelWidth - 5) / 2;
    
    for (let i = 0; i < shapes.length; i++) {
      const btnX = x + labelWidth + (i * shapeWidth);
      const isSelected = this.triggerForm.condition.shape === shapes[i];
      
      fill(isSelected ? 100 : 60);
      rect(btnX, formY, shapeWidth - 5, fieldHeight, 3);
      
      fill(isSelected ? 255 : 180);
      textAlign(CENTER, CENTER);
      textSize(10);
      text(shapes[i].charAt(0).toUpperCase() + shapes[i].slice(1), btnX + (shapeWidth - 5) / 2, formY + fieldHeight / 2);
    }
    
    formY += fieldHeight + 10;
    
    return formY;
  }
  
  /**
   * Render time trigger fields
   * @private
   */
  _renderTimeTriggerFields(x, formY, width, fieldHeight, labelWidth) {
    // Delay
    fill(180);
    textAlign(LEFT, CENTER);
    textSize(10);
    text('Delay (ms):', x + 5, formY + fieldHeight / 2);
    
    fill(60);
    rect(x + labelWidth, formY, width - labelWidth - 5, fieldHeight, 3);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(11);
    text(this.triggerForm.condition.delay || 5000, x + labelWidth + 5, formY + fieldHeight / 2);
    
    formY += fieldHeight + 10;
    
    return formY;
  }
  
  /**
   * Render flag trigger fields
   * @private
   */
  _renderFlagTriggerFields(x, formY, width, fieldHeight, labelWidth) {
    // Required Flags label
    fill(180);
    textAlign(LEFT, TOP);
    textSize(10);
    text('Required Flags:', x + 5, formY + 5);
    
    formY += 20;
    
    // Get all available flags
    const allFlags = this.eventManager ? this.eventManager.getAllFlags() : [];
    const requiredFlags = this.triggerForm.condition.requiredFlags || [];
    
    // Render flag checkboxes
    for (let i = 0; i < allFlags.length; i++) {
      const flag = allFlags[i];
      const isChecked = requiredFlags.includes(flag);
      
      // Checkbox
      fill(isChecked ? 100 : 60);
      rect(x + 10, formY, 15, 15, 3);
      
      if (isChecked) {
        fill(0, 255, 0);
        textAlign(CENTER, CENTER);
        textSize(12);
        text('✓', x + 10 + 7.5, formY + 7.5);
      }
      
      // Flag name
      fill(180);
      textAlign(LEFT, CENTER);
      textSize(10);
      text(flag, x + 30, formY + 7.5);
      
      formY += 20;
    }
    
    formY += 5;
    
    // All Required checkbox
    fill(180);
    textAlign(LEFT, CENTER);
    textSize(10);
    text('All Required:', x + 5, formY + 10);
    
    fill(this.triggerForm.condition.allRequired ? 100 : 60);
    rect(x + labelWidth, formY, 20, 20, 3);
    
    if (this.triggerForm.condition.allRequired) {
      fill(0, 255, 0);
      textAlign(CENTER, CENTER);
      textSize(14);
      text('✓', x + labelWidth + 10, formY + 10);
    }
    
    formY += 30;
    
    return formY;
  }
  
  /**
   * Render viewport trigger fields
   * @private
   */
  _renderViewportTriggerFields(x, formY, width, fieldHeight, labelWidth) {
    const fields = [
      { label: 'X:', key: 'x', default: 0 },
      { label: 'Y:', key: 'y', default: 0 },
      { label: 'Width:', key: 'width', default: 300 },
      { label: 'Height:', key: 'height', default: 200 }
    ];
    
    for (const field of fields) {
      fill(180);
      textAlign(LEFT, CENTER);
      textSize(10);
      text(field.label, x + 5, formY + fieldHeight / 2);
      
      fill(60);
      rect(x + labelWidth, formY, width - labelWidth - 5, fieldHeight, 3);
      fill(255);
      textAlign(LEFT, CENTER);
      textSize(11);
      text(this.triggerForm.condition[field.key] || field.default, x + labelWidth + 5, formY + fieldHeight / 2);
      
      formY += fieldHeight + 10;
    }
    
    return formY;
  }
  
  /**
   * Handle click event
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {number} contentX - Content area X position
   * @param {number} contentY - Content area Y position
   * @returns {boolean} - True if click was handled
   */
  handleClick(mouseX, mouseY, contentX, contentY) {
    // Check DialogueCreationPanel first (on top)
    if (this.dialoguePanelActive && this.dialoguePanel) {
      const handled = this.dialoguePanel.handleClick(mouseX, mouseY);
      if (handled) {
        return handled;
      }
      // Click outside dialogue panel - check if clicking close area
      // For now, let clicks fall through to panel below
    }
    
    const relX = mouseX - contentX;
    const relY = mouseY - contentY;
    
    if (this.editMode === 'add-event' || this.editMode === 'edit-event') {
      return this._handleFormClick(relX, relY);
    } else if (this.editMode === 'add-trigger' || this.editMode === 'edit-trigger') {
      return this._handleTriggerFormClick(relX, relY);
    } else {
      return this._handleListClick(relX, relY);
    }
  }
  
  /**
   * Handle click in list view
   * @private
   */
  _handleListClick(relX, relY) {
    const width = this.getContentSize().width;
    const height = this.getContentSize().height;
    
    // Check template browser area (top section)
    if (relY < this.templateAreaHeight) {
      const templateY = 25; // Start of template cards
      const cardSpacing = 5;
      let cardX = 5 - this.templateScrollOffset;
      
      for (let i = 0; i < this.templates.length; i++) {
        const template = this.templates[i];
        
        // Check if click is within this template card
        if (relX >= cardX && relX <= cardX + this.templateCardWidth &&
            relY >= templateY && relY <= templateY + this.templateCardHeight) {
          
          // Template clicked - select it
          this._selectTemplate(template.id.replace('_template', ''));
          return { type: 'template', template: template };
        }
        
        cardX += this.templateCardWidth + cardSpacing;
      }
      
      // Click in template browser area but not on a template
      return null;
    }
    
    // Adjust list coordinates to account for template area
    const listStartY = this.templateAreaHeight + 5;
    
    // Add button
    const addBtnX = width - 35;
    const addBtnY = listStartY + 2;
    if (relX >= addBtnX && relX <= addBtnX + 30 && relY >= addBtnY && relY <= addBtnY + 20) {
      this.editMode = 'add-event';
      this.editForm = { id: '', type: 'dialogue', priority: 5, content: {} };
      return true;
    }
    
    // Export button
    const exportBtnX = 5;
    const exportBtnY = listStartY + (height - this.templateAreaHeight - 5) - 25;
    if (relX >= exportBtnX && relX <= exportBtnX + 60 && relY >= exportBtnY && relY <= exportBtnY + 20) {
      this._exportEvents();
      return true;
    }
    
    // Import button
    const importBtnX = exportBtnX + 65;
    if (relX >= importBtnX && relX <= importBtnX + 60 && relY >= exportBtnY && relY <= exportBtnY + 20) {
      this._importEvents();
      return true;
    }
    
    // Event list items
    const listY = listStartY + 30;
    const listHeight = (height - this.templateAreaHeight - 5) - 60;
    
    if (relY >= listY && relY <= listY + listHeight) {
      const events = this.eventManager.getAllEvents();
      let itemY = listY - this.scrollOffset;
      
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        
        if (relY >= itemY && relY <= itemY + this.listItemHeight) {
          // Check if clicking drag button
          const dragBtnX = width - 55;
          const dragBtnY = itemY + 5;
          const dragBtnSize = 20;
          
          if (relX >= dragBtnX && relX <= dragBtnX + dragBtnSize &&
              relY >= dragBtnY && relY <= dragBtnY + dragBtnSize) {
            // Start drag operation
            this.startDragPlacement(event.id);
            logNormal(`Starting drag for event: ${event.id}`);
            return true;
          }
          
          // Otherwise, just select the event
          this.selectedEventId = event.id;
          logNormal('Selected event:', event.id);
          return true;
        }
        
        itemY += this.listItemHeight + this.listPadding;
      }
    }
    
    return false;
  }
  
  /**
   * Handle click in event form
   * @private
   */
  _handleFormClick(relX, relY) {
    const width = this.getContentSize().width;
    let formY = 30;
    const fieldHeight = 25;
    const labelWidth = 80;
    
    // Type buttons
    formY += fieldHeight + 10;
    const types = ['dialogue', 'spawn', 'tutorial', 'boss'];
    const typeWidth = (width - labelWidth - 15) / types.length;
    
    if (relY >= formY && relY <= formY + fieldHeight) {
      for (let i = 0; i < types.length; i++) {
        const typeX = labelWidth + i * (typeWidth + 2);
        if (relX >= typeX && relX <= typeX + typeWidth) {
          this.editForm.type = types[i];
          return true;
        }
      }
    }
    
    formY += fieldHeight + 10;
    
    // Priority +/- buttons
    if (relY >= formY && relY <= formY + fieldHeight) {
      const minusBtn = labelWidth + 55;
      const plusBtn = labelWidth + 78;
      
      if (relX >= minusBtn && relX <= minusBtn + 20) {
        this.editForm.priority = Math.max(0, this.editForm.priority - 1);
        return true;
      }
      
      if (relX >= plusBtn && relX <= plusBtn + 20) {
        this.editForm.priority = Math.min(10, this.editForm.priority + 1);
        return true;
      }
    }
    
    formY += fieldHeight + 20;
    
    // Cancel/Save buttons
    const btnWidth = (width - 15) / 2;
    
    if (relY >= formY && relY <= formY + 30) {
      // Cancel
      if (relX >= 5 && relX <= 5 + btnWidth) {
        this.editMode = null;
        this.selectedEventId = null;
        return true;
      }
      
      // Save
      if (relX >= 10 + btnWidth && relX <= 10 + 2 * btnWidth) {
        this._saveEvent();
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle click in trigger form
   * @private
   */
  _handleTriggerFormClick(relX, relY) {
    const width = this.getContentSize().width;
    let formY = 30;
    const fieldHeight = 25;
    const labelWidth = 80;
    
    // Trigger Type buttons
    const types = ['spatial', 'time', 'flag', 'viewport'];
    const typeWidth = (width - labelWidth - 15) / types.length;
    
    if (relY >= formY && relY <= formY + fieldHeight) {
      for (let i = 0; i < types.length; i++) {
        const btnX = labelWidth + (i * typeWidth);
        if (relX >= btnX && relX <= btnX + typeWidth - 5) {
          this.triggerForm.type = types[i];
          
          // Reset condition based on type
          if (types[i] === 'spatial') {
            this.triggerForm.condition = { x: 100, y: 100, radius: 64, shape: 'circle' };
          } else if (types[i] === 'time') {
            this.triggerForm.condition = { delay: 5000 };
          } else if (types[i] === 'flag') {
            this.triggerForm.condition = { requiredFlags: [], allRequired: true };
          } else if (types[i] === 'viewport') {
            this.triggerForm.condition = { x: 100, y: 100, width: 300, height: 200 };
          }
          
          return true;
        }
      }
    }
    
    formY += fieldHeight + 15;
    
    // Handle clicks based on trigger type
    if (this.triggerForm.type === 'spatial') {
      // Skip X, Y, Radius fields (3 fields × spacing)
      formY += (fieldHeight + 10) * 3;
      
      // Shape radio buttons
      const shapes = ['circle', 'rectangle'];
      const shapeWidth = (width - labelWidth - 5) / 2;
      
      if (relY >= formY && relY <= formY + fieldHeight) {
        for (let i = 0; i < shapes.length; i++) {
          const btnX = labelWidth + (i * shapeWidth);
          if (relX >= btnX && relX <= btnX + shapeWidth - 5) {
            this.triggerForm.condition.shape = shapes[i];
            return true;
          }
        }
      }
      
      formY += fieldHeight + 10;
      
    } else if (this.triggerForm.type === 'time') {
      formY += fieldHeight + 10;
      
    } else if (this.triggerForm.type === 'flag') {
      formY += 20; // "Required Flags:" label
      
      // Flag checkboxes
      const allFlags = this.eventManager ? this.eventManager.getAllFlags() : [];
      const requiredFlags = this.triggerForm.condition.requiredFlags || [];
      
      for (let i = 0; i < allFlags.length; i++) {
        const flag = allFlags[i];
        
        if (relY >= formY && relY <= formY + 15) {
          if (relX >= 10 && relX <= 25) {
            // Toggle flag
            const index = requiredFlags.indexOf(flag);
            if (index === -1) {
              requiredFlags.push(flag);
            } else {
              requiredFlags.splice(index, 1);
            }
            return true;
          }
        }
        
        formY += 20;
      }
      
      formY += 5;
      
      // All Required checkbox
      if (relY >= formY && relY <= formY + 20) {
        if (relX >= labelWidth && relX <= labelWidth + 20) {
          this.triggerForm.condition.allRequired = !this.triggerForm.condition.allRequired;
          return true;
        }
      }
      
      formY += 30;
      
    } else if (this.triggerForm.type === 'viewport') {
      formY += (fieldHeight + 10) * 4; // 4 fields
    }
    
    formY += 10;
    
    // One-Time checkbox
    if (relY >= formY && relY <= formY + 20) {
      if (relX >= labelWidth && relX <= labelWidth + 20) {
        this.triggerForm.oneTime = !this.triggerForm.oneTime;
        return true;
      }
    }
    
    formY += fieldHeight + 20;
    
    // Cancel and Create/Save buttons
    const buttonWidth = 80;
    const buttonSpacing = 10;
    
    if (relY >= formY && relY <= formY + fieldHeight) {
      // Cancel button
      const cancelX = width - (buttonWidth * 2 + buttonSpacing) - 5;
      if (relX >= cancelX && relX <= cancelX + buttonWidth) {
        this.editMode = null;
        this.triggerForm = { eventId: '', type: 'time', oneTime: true, condition: {} };
        return true;
      }
      
      // Create/Save button
      const createX = width - buttonWidth - 5;
      if (relX >= createX && relX <= createX + buttonWidth) {
        this._saveTrigger();
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Save trigger (add or update)
   * @private
   */
  _saveTrigger() {
    if (!this.triggerForm.eventId) {
      console.error('Event ID required for trigger');
      return;
    }
    
    // Generate unique trigger ID
    const timestamp = Date.now();
    const triggerId = `trigger_${timestamp}`;
    
    const triggerConfig = {
      id: triggerId,
      eventId: this.triggerForm.eventId,
      type: this.triggerForm.type,
      oneTime: this.triggerForm.oneTime,
      condition: { ...this.triggerForm.condition }
    };
    
    if (this.eventManager) {
      // Register trigger with EventManager
      const success = this.eventManager.registerTrigger(triggerConfig);
      
      if (success) {
        logNormal('Trigger saved:', triggerConfig);
        
        // Reset form and mode
        this.editMode = null;
        this.triggerForm = { eventId: '', type: 'time', oneTime: true, condition: {} };
        
        return true;
      } else {
        console.error('Failed to register trigger');
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Enter edit mode for existing trigger (property editor)
   * @param {string} triggerId - Trigger ID to edit
   * @returns {boolean} - True if trigger found and loaded
   * @private
   */
  _enterEditMode(triggerId) {
    if (!this.eventManager || !this.eventManager.triggers) {
      return false;
    }
    
    const trigger = this.eventManager.triggers.get(triggerId);
    if (!trigger) {
      return false;
    }
    
    // Load trigger into editForm
    this.editForm = {
      triggerId: triggerId,
      eventId: trigger.eventId,
      triggerType: trigger.type,
      condition: { ...trigger.condition },
      oneTime: trigger.oneTime || false
    };
    
    // Set edit mode
    this.editMode = 'edit';
    
    return true;
  }
  
  /**
   * Render property editor for existing trigger
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} width - Panel width
   * @param {number} height - Panel height
   * @private
   */
  _renderPropertyEditor(x, y, width, height) {
    push();
    
    let currentY = y + 10;
    
    // Header
    fill(255);
    textAlign(LEFT, TOP);
    textSize(16);
    text('Edit Trigger', x + 10, currentY);
    currentY += 30;
    
    // Event ID (readonly)
    textSize(12);
    fill(150);
    text('Event ID:', x + 10, currentY);
    fill(255);
    text(this.editForm.eventId, x + 90, currentY);
    currentY += 25;
    
    // Trigger Type (readonly)
    fill(150);
    text('Type:', x + 10, currentY);
    fill(255);
    text(this.editForm.triggerType, x + 90, currentY);
    currentY += 35;
    
    // Render trigger-specific fields (editable)
    if (this.editForm.triggerType === 'spatial') {
      currentY = this._renderSpatialFields(x, currentY, width);
    } else if (this.editForm.triggerType === 'time') {
      currentY = this._renderTimeFields(x, currentY, width);
    } else if (this.editForm.triggerType === 'flag') {
      currentY = this._renderFlagFields(x, currentY, width);
    } else if (this.editForm.triggerType === 'viewport') {
      currentY = this._renderViewportFields(x, currentY, width);
    }
    
    currentY += 20;
    
    // One-Time checkbox
    const checkboxSize = 18;
    const checkboxX = x + 10;
    const checkboxY = currentY;
    
    noFill();
    stroke(200);
    strokeWeight(2);
    rect(checkboxX, checkboxY, checkboxSize, checkboxSize);
    
    // Fill checkbox if one-time
    if (this.editForm.oneTime) {
      fill(100, 200, 100);
      noStroke();
      rect(checkboxX + 3, checkboxY + 3, checkboxSize - 6, checkboxSize - 6);
    }
    
    fill(255);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(12);
    text('One-Time (non-repeatable)', checkboxX + checkboxSize + 10, checkboxY + checkboxSize / 2);
    currentY += 40;
    
    // Buttons at bottom
    const buttonY = y + height - 50;
    const buttonHeight = 30;
    const buttonSpacing = 10;
    const buttonWidth = (width - 40) / 3;
    
    // Cancel button
    fill(100);
    noStroke();
    rect(x + 10, buttonY, buttonWidth, buttonHeight, 4);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    text('Cancel', x + 10 + buttonWidth / 2, buttonY + buttonHeight / 2);
    
    // Delete button
    fill(200, 50, 50);
    rect(x + 20 + buttonWidth, buttonY, buttonWidth, buttonHeight, 4);
    fill(255);
    text('Delete Trigger', x + 20 + buttonWidth + buttonWidth / 2, buttonY + buttonHeight / 2);
    
    // Save Changes button
    fill(50, 150, 50);
    rect(x + 30 + buttonWidth * 2, buttonY, buttonWidth, buttonHeight, 4);
    fill(255);
    text('Save Changes', x + 30 + buttonWidth * 2 + buttonWidth / 2, buttonY + buttonHeight / 2);
    
    pop();
  }
  
  /**
   * Render spatial trigger fields (for property editor)
   * @private
   */
  _renderSpatialFields(x, currentY, width) {
    push();
    
    fill(255);
    textAlign(LEFT, TOP);
    textSize(12);
    
    // X coordinate
    text('X:', x + 10, currentY);
    fill(50);
    rect(x + 90, currentY - 2, 100, 20);
    fill(255);
    textAlign(LEFT, CENTER);
    text(this.editForm.condition.x || 0, x + 95, currentY + 8);
    currentY += 30;
    
    // Y coordinate
    textAlign(LEFT, TOP);
    text('Y:', x + 10, currentY);
    fill(50);
    rect(x + 90, currentY - 2, 100, 20);
    fill(255);
    textAlign(LEFT, CENTER);
    text(this.editForm.condition.y || 0, x + 95, currentY + 8);
    currentY += 30;
    
    // Radius
    textAlign(LEFT, TOP);
    text('Radius:', x + 10, currentY);
    fill(50);
    rect(x + 90, currentY - 2, 100, 20);
    fill(255);
    textAlign(LEFT, CENTER);
    text(this.editForm.condition.radius || 64, x + 95, currentY + 8);
    currentY += 35;
    
    // Shape radio buttons
    textAlign(LEFT, TOP);
    text('Shape:', x + 10, currentY);
    currentY += 25;
    
    const radioSize = 14;
    const radioSpacing = 80;
    
    // Circle radio
    const circleX = x + 20;
    const circleY = currentY;
    noFill();
    stroke(200);
    strokeWeight(2);
    ellipse(circleX + radioSize / 2, circleY + radioSize / 2, radioSize, radioSize);
    
    if (this.editForm.condition.shape === 'circle') {
      fill(100, 200, 100);
      noStroke();
      ellipse(circleX + radioSize / 2, circleY + radioSize / 2, radioSize - 6, radioSize - 6);
    }
    
    fill(255);
    noStroke();
    textAlign(LEFT, CENTER);
    text('Circle', circleX + radioSize + 8, circleY + radioSize / 2);
    
    // Rectangle radio
    const rectX = circleX + radioSpacing;
    noFill();
    stroke(200);
    strokeWeight(2);
    ellipse(rectX + radioSize / 2, circleY + radioSize / 2, radioSize, radioSize);
    
    if (this.editForm.condition.shape === 'rectangle') {
      fill(100, 200, 100);
      noStroke();
      ellipse(rectX + radioSize / 2, circleY + radioSize / 2, radioSize - 6, radioSize - 6);
    }
    
    fill(255);
    noStroke();
    textAlign(LEFT, CENTER);
    text('Rectangle', rectX + radioSize + 8, circleY + radioSize / 2);
    
    currentY += 30;
    
    pop();
    return currentY;
  }
  
  /**
   * Render time trigger fields (for property editor)
   * @private
   */
  _renderTimeFields(x, currentY, width) {
    push();
    
    fill(255);
    textAlign(LEFT, TOP);
    textSize(12);
    
    // Delay
    text('Delay (ms):', x + 10, currentY);
    fill(50);
    rect(x + 90, currentY - 2, 100, 20);
    fill(255);
    textAlign(LEFT, CENTER);
    text(this.editForm.condition.delay || 0, x + 95, currentY + 8);
    currentY += 35;
    
    pop();
    return currentY;
  }
  
  /**
   * Render flag trigger fields (for property editor)
   * @private
   */
  _renderFlagFields(x, currentY, width) {
    push();
    
    fill(255);
    textAlign(LEFT, TOP);
    textSize(12);
    text('Required Flags:', x + 10, currentY);
    currentY += 25;
    
    // Flag checkboxes (mock for now)
    const flags = this.editForm.condition.flags || [];
    flags.forEach(flag => {
      const checkboxSize = 16;
      noFill();
      stroke(200);
      strokeWeight(2);
      rect(x + 20, currentY, checkboxSize, checkboxSize);
      
      fill(100, 200, 100);
      noStroke();
      rect(x + 23, currentY + 3, checkboxSize - 6, checkboxSize - 6);
      
      fill(255);
      noStroke();
      textAlign(LEFT, CENTER);
      text(flag, x + 20 + checkboxSize + 8, currentY + checkboxSize / 2);
      currentY += 25;
    });
    
    currentY += 10;
    
    pop();
    return currentY;
  }
  
  /**
   * Render viewport trigger fields (for property editor)
   * @private
   */
  _renderViewportFields(x, currentY, width) {
    push();
    
    fill(255);
    textAlign(LEFT, TOP);
    textSize(12);
    
    const fields = ['x', 'y', 'width', 'height'];
    fields.forEach(field => {
      text(field.toUpperCase() + ':', x + 10, currentY);
      fill(50);
      rect(x + 90, currentY - 2, 100, 20);
      fill(255);
      textAlign(LEFT, CENTER);
      text(this.editForm.condition[field] || 0, x + 95, currentY + 8);
      currentY += 30;
      textAlign(LEFT, TOP);
    });
    
    pop();
    return currentY;
  }
  
  /**
   * Handle property editor click events
   * @param {number} relX - Relative X coordinate
   * @param {number} relY - Relative Y coordinate
   * @returns {Object|null} - Click result or null
   * @private
   */
  _handlePropertyEditorClick(relX, relY) {
    // Button positions (relative to panel)
    const buttonY = this.contentHeight - 50;
    const buttonHeight = 30;
    const buttonWidth = (this.contentWidth - 40) / 3;
    
    // Check Cancel button
    if (relY >= buttonY && relY <= buttonY + buttonHeight &&
        relX >= 10 && relX <= 10 + buttonWidth) {
      this.editMode = 'list';
      return { action: 'cancel' };
    }
    
    // Check Delete button
    if (relY >= buttonY && relY <= buttonY + buttonHeight &&
        relX >= 20 + buttonWidth && relX <= 20 + buttonWidth + buttonWidth) {
      return { action: 'delete' };
    }
    
    // Check Save Changes button
    if (relY >= buttonY && relY <= buttonY + buttonHeight &&
        relX >= 30 + buttonWidth * 2 && relX <= 30 + buttonWidth * 3) {
      return { action: 'save' };
    }
    
    // Check One-Time checkbox (approximate position)
    const checkboxY = buttonY - 90;
    const checkboxSize = 18;
    if (relY >= checkboxY && relY <= checkboxY + checkboxSize &&
        relX >= 10 && relX <= 10 + checkboxSize) {
      this.editForm.oneTime = !this.editForm.oneTime;
      return { action: 'toggleOneTime' };
    }
    
    // Check shape radio buttons (spatial triggers only)
    if (this.editForm.triggerType === 'spatial') {
      const shapeY = 150; // Approximate position
      const radioSize = 14;
      const radioSpacing = 80;
      
      // Circle radio
      const circleX = 20;
      if (relY >= shapeY && relY <= shapeY + radioSize &&
          relX >= circleX && relX <= circleX + radioSize) {
        this.editForm.condition.shape = 'circle';
        return { action: 'setShape', shape: 'circle' };
      }
      
      // Rectangle radio
      const rectX = circleX + radioSpacing;
      if (relY >= shapeY && relY <= shapeY + radioSize &&
          relX >= rectX && relX <= rectX + radioSize) {
        this.editForm.condition.shape = 'rectangle';
        return { action: 'setShape', shape: 'rectangle' };
      }
    }
    
    return null;
  }
  
  /**
   * Update trigger in EventManager
   * @returns {boolean} - True if successful
   * @private
   */
  _updateTrigger() {
    if (!this.eventManager || !this.editForm.triggerId) {
      return false;
    }
    
    const trigger = this.eventManager.triggers.get(this.editForm.triggerId);
    if (!trigger) {
      return false;
    }
    
    // Update trigger properties
    trigger.condition = { ...this.editForm.condition };
    trigger.oneTime = this.editForm.oneTime;
    
    logNormal('Trigger updated:', this.editForm.triggerId);
    
    // Reset edit mode
    this.editMode = 'list';
    
    return true;
  }
  
  /**
   * Delete trigger from EventManager
   * @returns {boolean} - True if successful
   * @private
   */
  _deleteTrigger() {
    if (!this.eventManager || !this.editForm.triggerId) {
      return false;
    }
    
    const deleted = this.eventManager.triggers.delete(this.editForm.triggerId);
    
    if (deleted) {
      logNormal('Trigger deleted:', this.editForm.triggerId);
      // Reset edit mode
      this.editMode = 'list';
    }
    
    return deleted;
  }
  
  /**
   * Save event (add or update)
   * @private
   */
  _saveEvent() {
    if (!this.editForm.id) {
      console.error('Event ID required');
      return;
    }
    
    const eventConfig = {
      id: this.editForm.id,
      type: this.editForm.type,
      priority: this.editForm.priority,
      content: this.editForm.content
    };
    
    const success = this.eventManager.registerEvent(eventConfig);
    
    if (success) {
      logNormal('Event saved:', eventConfig.id);
      this.editMode = null;
      this.selectedEventId = eventConfig.id;
    } else {
      console.error('Failed to save event');
    }
  }
  
  /**
   * Export events to JSON
   * @private
   */
  _exportEvents() {
    try {
      // Use EventManager's exportToJSON method
      const json = this.eventManager.exportToJSON(false);
      
      logNormal('Event Configuration:\n', json);
      
      // Copy to clipboard if available
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(json).then(() => {
          logNormal('✅ Configuration copied to clipboard');
        }).catch(err => {
          console.error('Failed to copy to clipboard:', err);
        });
      }
      
      // Also trigger download
      this._downloadJSON(json, 'events-config.json');
      
      return { type: 'event_exported', success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { type: 'event_exported', success: false, error: error.message };
    }
  }
  
  /**
   * Download JSON as file
   * @private
   */
  _downloadJSON(json, filename) {
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      logNormal('✅ Downloaded:', filename);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }
  
  /**
   * Import events from JSON
   * @private
   */
  _importEvents() {
    // Create file input for JSON upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target.result;
          const success = this.eventManager.loadFromJSON(json);
          
          if (success) {
            logNormal('✅ Events imported successfully');
            this.selectedEventId = null;
            this.editMode = null;
            return { type: 'event_imported', success: true };
          } else {
            console.error('❌ Failed to import events');
            return { type: 'event_imported', success: false };
          }
        } catch (error) {
          console.error('Import error:', error);
          return { type: 'event_imported', success: false, error: error.message };
        }
      };
      
      reader.onerror = (error) => {
        console.error('File read error:', error);
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }
  
  /**
   * Check if point is within panel bounds
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} contentX - Content area X
   * @param {number} contentY - Content area Y
   * @returns {boolean}
   */
  containsPoint(x, y, contentX, contentY) {
    const size = this.getContentSize();
    return x >= contentX && x <= contentX + size.width &&
           y >= contentY && y <= contentY + size.height;
  }
  
  /**
   * Handle mouse wheel for scrolling
   * @param {number} delta - Scroll delta
   */
  handleScroll(delta) {
    // Check if dialogue panel is active and should handle scroll
    if (this.dialoguePanelActive && this.dialoguePanel) {
      this.dialoguePanel.handleMouseWheel(delta);
      return;
    }
    
    if (this.editMode) return; // No scrolling in edit mode
    
    this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset + delta * 20));
  }
  
  /**
   * Handle mouse drag event
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   */
  handleMouseDrag(mouseX, mouseY) {
    if (this.dialoguePanelActive && this.dialoguePanel) {
      this.dialoguePanel.handleMouseDrag(mouseX, mouseY);
    }
  }
  
  /**
   * Handle mouse release event
   */
  handleMouseRelease() {
    if (this.dialoguePanelActive && this.dialoguePanel) {
      this.dialoguePanel.handleMouseRelease();
    }
  }
  
  /**
   * Handle keyboard input
   * @param {string} key - Key pressed
   */
  handleKeyPress(key) {
    if (this.dialoguePanelActive && this.dialoguePanel) {
      // Close dialogue panel on Escape
      if (key === 'Escape') {
        this._closeDialoguePanel();
        return;
      }
      this.dialoguePanel.handleKeyPress(key);
    }
  }
  
  // ========================================
  // DRAG-TO-PLACE FUNCTIONALITY
  // ========================================
  
  /**
   * Start drag operation for placing an event on the map
   * @param {string} eventId - Event ID to place
   * @returns {boolean} - True if drag started successfully
   */
  startDragPlacement(eventId) {
    // Validate event ID
    if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
      return false;
    }
    
    // Prevent multiple simultaneous drags
    if (this.dragState.isDragging) {
      return false;
    }
    
    // Initialize drag state
    this.dragState.isDragging = true;
    this.dragState.eventId = eventId;
    this.dragState.cursorX = 0;
    this.dragState.cursorY = 0;
    
    logNormal(`EventEditorPanel: Started drag for event '${eventId}'`);
    return true;
  }
  
  /**
   * Update cursor position during drag
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   */
  updateDragPosition(mouseX, mouseY) {
    if (!this.dragState.isDragging) {
      return;
    }
    
    this.dragState.cursorX = mouseX;
    this.dragState.cursorY = mouseY;
  }
  
  /**
   * Get current drag position
   * @returns {Object|null} - {x, y} position or null if not dragging
   */
  getDragPosition() {
    if (!this.dragState.isDragging) {
      return null;
    }
    
    return {
      x: this.dragState.cursorX,
      y: this.dragState.cursorY
    };
  }
  
  /**
   * Complete drag operation and create spatial trigger
   * @param {number} worldX - World X coordinate for trigger placement
   * @param {number} worldY - World Y coordinate for trigger placement
   * @returns {Object} - Result object {success, eventId, worldX, worldY}
   */
  completeDrag(worldX, worldY) {
    if (!this.dragState.isDragging) {
      return { success: false, error: 'Not currently dragging' };
    }
    
    const eventId = this.dragState.eventId;
    const radius = this.dragState.triggerRadius;
    
    // Create unique trigger ID
    const triggerId = `${eventId}_spatial_${Date.now()}`;
    
    // Create EventFlag configuration for Level Editor
    const flagConfig = {
      id: triggerId,
      x: worldX,
      y: worldY,
      radius: radius,
      shape: 'circle',
      eventId: eventId,
      oneTime: true
    };
    
    // Create spatial trigger configuration for EventManager
    const triggerConfig = {
      id: triggerId,
      eventId: eventId,
      type: 'spatial',
      oneTime: true,
      condition: {
        x: worldX,
        y: worldY,
        radius: radius
      }
    };
    
    // Register trigger with EventManager
    const success = this.eventManager.registerTrigger(triggerConfig);
    
    if (success) {
      logNormal(`EventEditorPanel: Placed trigger for '${eventId}' at (${worldX}, ${worldY}) with radius ${radius}`);
      
      // Reset drag state
      this._resetDragState();
      
      return {
        success: true,
        eventId: eventId,
        worldX: worldX,
        worldY: worldY,
        triggerId: triggerId,
        flagConfig: flagConfig // Return EventFlag config for Level Editor
      };
    } else {
      // Registration failed, but still reset drag state
      this._resetDragState();
      
      return {
        success: false,
        error: 'Failed to register trigger with EventManager'
      };
    }
  }
  
  /**
   * Cancel drag operation without creating trigger
   */
  cancelDrag() {
    if (this.dragState.isDragging) {
      logNormal(`EventEditorPanel: Cancelled drag for '${this.dragState.eventId}'`);
    }
    this._resetDragState();
  }
  
  /**
   * Check if currently dragging an event
   * @returns {boolean} - True if dragging
   */
  isDragging() {
    return this.dragState.isDragging === true;
  }
  
  /**
   * Get event ID being dragged
   * @returns {string|null} - Event ID or null if not dragging
   */
  getDragEventId() {
    return this.dragState.isDragging ? this.dragState.eventId : null;
  }
  
  /**
   * Get current cursor position during drag
   * @returns {{x: number, y: number}|null} - Cursor position or null if not dragging
   */
  getDragCursorPosition() {
    if (!this.dragState.isDragging) {
      return null;
    }
    
    return {
      x: this.dragState.cursorX,
      y: this.dragState.cursorY
    };
  }
  
  /**
   * Set trigger radius for next placement
   * @param {number} radius - Radius in pixels (must be > 0)
   */
  setTriggerRadius(radius) {
    if (typeof radius === 'number' && radius > 0) {
      this.dragState.triggerRadius = radius;
    }
  }
  
  /**
   * Reset drag state to defaults (private)
   * @private
   */
  _resetDragState() {
    this.dragState.isDragging = false;
    this.dragState.eventId = null;
    this.dragState.cursorX = 0;
    this.dragState.cursorY = 0;
    this.dragState.triggerRadius = 64; // Reset to default
  }
  
  // ========================================
  // PLACEMENT MODE (DOUBLE-CLICK)
  // ========================================
  
  /**
   * Check if in placement mode
   * @returns {boolean}
   */
  isInPlacementMode() {
    return this.placementMode.isActive === true;
  }
  
  /**
   * Get event ID in placement mode
   * @returns {string|null}
   */
  getPlacementEventId() {
    return this.placementMode.isActive ? this.placementMode.eventId : null;
  }
  
  /**
   * Get cursor position in placement mode
   * @returns {{x: number, y: number}|null}
   */
  getPlacementCursor() {
    if (!this.placementMode.isActive) {
      return null;
    }
    return {
      x: this.placementMode.cursorX,
      y: this.placementMode.cursorY
    };
  }
  
  /**
   * Enter placement mode (double-click on drag button)
   * @param {string} eventId - Event ID to place
   * @returns {boolean} Success
   */
  enterPlacementMode(eventId) {
    if (!eventId) {
      return false;
    }
    
    // Cancel any active drag first
    if (this.dragState.isDragging) {
      this.cancelDrag();
    }
    
    this.placementMode.isActive = true;
    this.placementMode.eventId = eventId;
    this.placementMode.cursorX = 0;
    this.placementMode.cursorY = 0;
    
    logNormal(`✅ Entered placement mode for event: ${eventId}`);
    return true;
  }
  
  /**
   * Exit placement mode
   */
  exitPlacementMode() {
    this.placementMode.isActive = false;
    this.placementMode.eventId = null;
    this.placementMode.cursorX = 0;
    this.placementMode.cursorY = 0;
  }
  
  /**
   * Update cursor position in placement mode
   * @param {number} x - Screen X
   * @param {number} y - Screen Y
   */
  updatePlacementCursor(x, y) {
    if (!this.placementMode.isActive) {
      return;
    }
    
    this.placementMode.cursorX = x;
    this.placementMode.cursorY = y;
  }
  
  /**
   * Complete placement (single click in placement mode)
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {{success: boolean, eventId: string, worldX: number, worldY: number}}
   */
  completePlacement(worldX, worldY) {
    if (!this.placementMode.isActive) {
      return { success: false };
    }
    
    const eventId = this.placementMode.eventId;
    
    // Exit placement mode
    this.exitPlacementMode();
    
    // Return success
    return {
      success: true,
      eventId: eventId,
      worldX: worldX,
      worldY: worldY
    };
  }
  
  /**
   * Cancel placement mode (ESC key)
   */
  cancelPlacement() {
    if (this.placementMode.isActive) {
      logNormal('Cancelled placement mode');
    }
    this.exitPlacementMode();
  }
  
  /**
   * Handle double-click on panel content
   * @param {number} mouseX - Mouse X (absolute)
   * @param {number} mouseY - Mouse Y (absolute)
   * @param {number} contentX - Content area X
   * @param {number} contentY - Content area Y
   * @returns {boolean} True if handled
   */
  handleDoubleClick(mouseX, mouseY, contentX, contentY) {
    const relX = mouseX - contentX;
    const relY = mouseY - contentY;
    
    // Only handle in list mode
    if (this.editMode) {
      return false;
    }
    
    const width = this.getContentSize().width;
    const height = this.getContentSize().height;
    const listY = 30;
    const listHeight = height - 60;
    
    if (relY >= listY && relY <= listY + listHeight) {
      const events = this.eventManager.getAllEvents();
      let itemY = listY - this.scrollOffset;
      
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        
        if (relY >= itemY && relY <= itemY + this.listItemHeight) {
          // Check if double-clicking drag button
          const dragBtnX = width - 55;
          const dragBtnY = itemY + 5;
          const dragBtnSize = 20;
          
          if (relX >= dragBtnX && relX <= dragBtnX + dragBtnSize &&
              relY >= dragBtnY && relY <= dragBtnY + dragBtnSize) {
            // Enter placement mode
            this.enterPlacementMode(event.id);
            return true;
          }
        }
        
        itemY += this.listItemHeight + this.listPadding;
      }
    }
    
    return false;
  }
  
  /**
   * Render flag cursor and trigger radius preview during placement mode
   * Should be called from Level Editor's render loop
   */
  renderPlacementCursor() {
    // Only render when placement mode is active
    if (!this.placementMode.isActive) {
      return;
    }
    
    const cursorX = this.placementMode.cursorX;
    const cursorY = this.placementMode.cursorY;
    
    // If no cursor position set, don't render
    if (cursorX === 0 && cursorY === 0) {
      return;
    }
    
    push();
    
    // Draw trigger radius preview circle
    stroke(100, 200, 255, 150); // Semi-transparent blue
    strokeWeight(2);
    noFill();
    const radiusPixels = 64; // Default trigger radius
    circle(cursorX, cursorY, radiusPixels * 2); // diameter = radius * 2
    
    // Draw flag emoji at offset position (not covering cursor)
    fill(255);
    noStroke();
    textSize(24);
    textAlign(LEFT, TOP);
    text('🚩', cursorX + 15, cursorY - 25); // Offset: +15x, -25y
    
    pop();
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.EventEditorPanel = EventEditorPanel;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventEditorPanel;
}
