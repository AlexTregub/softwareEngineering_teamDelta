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
    console.log('✅ EventEditorPanel initialized');
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
  }
  
  /**
   * Render event list view
   * @private
   */
  _renderEventList(x, y, width, height) {
    const events = this.eventManager.getAllEvents();
    
    // Header with Add button
    fill(80);
    textAlign(LEFT, TOP);
    textSize(12);
    text(`Events (${events.length})`, x + 5, y + 5);
    
    // Add button
    const addBtnX = x + width - 35;
    const addBtnY = y + 2;
    fill(this.selectedEventId === null ? 100 : 60, 150, 100);
    rect(addBtnX, addBtnY, 30, 20, 3);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    text('+', addBtnX + 15, addBtnY + 10);
    
    // Export/Import buttons
    const exportBtnX = x + 5;
    const exportBtnY = y + height - 25;
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
    const listY = y + 30;
    const listHeight = height - 60;
    
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
    text('Add Trigger', x + 5, y + 5);
    
    // TODO: Implement trigger form UI
    fill(180);
    textSize(10);
    text('Trigger configuration UI', x + 5, y + 30);
    text('Coming soon...', x + 5, y + 50);
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
    
    // Add button
    const addBtnX = width - 35;
    const addBtnY = 2;
    if (relX >= addBtnX && relX <= addBtnX + 30 && relY >= addBtnY && relY <= addBtnY + 20) {
      this.editMode = 'add-event';
      this.editForm = { id: '', type: 'dialogue', priority: 5, content: {} };
      return true;
    }
    
    // Export button
    const exportBtnX = 5;
    const exportBtnY = height - 25;
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
    const listY = 30;
    const listHeight = height - 60;
    
    if (relY >= listY && relY <= listY + listHeight) {
      const events = this.eventManager.getAllEvents();
      let itemY = listY - this.scrollOffset;
      
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        
        if (relY >= itemY && relY <= itemY + this.listItemHeight) {
          this.selectedEventId = event.id;
          console.log('Selected event:', event.id);
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
    // TODO: Implement trigger form click handling
    return false;
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
      console.log('Event saved:', eventConfig.id);
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
      
      console.log('Event Configuration:\n', json);
      
      // Copy to clipboard if available
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(json).then(() => {
          console.log('✅ Configuration copied to clipboard');
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
      console.log('✅ Downloaded:', filename);
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
            console.log('✅ Events imported successfully');
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
    if (this.editMode) return; // No scrolling in edit mode
    
    this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset + delta * 20));
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.EventEditorPanel = EventEditorPanel;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventEditorPanel;
}
