/**
 * LevelEditorPanels - Draggable panel integration for Level Editor
 * Wraps MaterialPalette, ToolBar in DraggablePanels
 * NOTE: BrushSizeControl panel deprecated - brush size now controlled via menu bar (Enhancement 9)
 * 
 * @author Software Engineering Team Delta
 */

class LevelEditorPanels {
  constructor(levelEditor) {
    this.levelEditor = levelEditor;
    this.panels = {
      materials: null,
      tools: null,
      brush: null,
      events: null,      // Event editor panel
      properties: null,  // Properties panel
      sidebar: null      // Scrollable sidebar menu
    };
    
    // Sidebar instance (composition pattern)
    this.sidebar = null;
  }

  /**
   * Initialize level editor draggable panels
   * Adds them to the global draggablePanelManager
   */
  initialize() {
    const manager = (typeof window !== 'undefined') ? window.draggablePanelManager : global.draggablePanelManager;
    
    if (!manager) {
      console.error('LevelEditorPanels: DraggablePanelManager not found');
      return false;
    }

    // Material Palette Panel
    // Size: 2 cols × 40px swatches, 3 materials = 2 rows, height = 2×(40+5)+5 = 95px
    this.panels.materials = new DraggablePanel({
      id: 'level-editor-materials',
      title: 'Materials',
      position: { x: 10, y: 80 },
      size: { width: 120, height: 115 },
      buttons: {
        layout: 'vertical',
        spacing: 0,
        items: [], // We'll render MaterialPalette directly in content
        autoSizeToContent: true, // Enable auto-sizing
        verticalPadding: 10, // Padding above/below content
        horizontalPadding: 10, // Padding left/right of content
        contentSizeCallback: () => {
          // Get size from MaterialPalette instance
          return this.levelEditor?.palette ? this.levelEditor.palette.getContentSize() : { width: 95, height: 95 };
        }
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        managedExternally: true // Don't auto-render, LevelEditorPanels handles it
      }
    });

    // Tool Bar Panel
    // Size: 4 tools × (35px + 5px spacing) + 5px = 165px
    this.panels.tools = new DraggablePanel({
      id: 'level-editor-tools',
      title: 'Tools',
      position: { x: 10, y: 210 },
      size: { width: 70, height: 170 },
      buttons: {
        layout: 'vertical',
        spacing: 0,
        items: [], // We'll render ToolBar directly in content
        autoSizeToContent: true, // Enable auto-sizing
        verticalPadding: 10, // Padding above/below content
        horizontalPadding: 10, // Padding left/right of content
        contentSizeCallback: () => {
          // Get size from ToolBar instance
          return this.levelEditor?.toolbar ? this.levelEditor.toolbar.getContentSize() : { width: 45, height: 285 };
        }
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        managedExternally: true // Don't auto-render, LevelEditorPanels handles it
      }
    });

    // Brush Size Panel
    // Size: 90px width × 50px height
    this.panels.brush = new DraggablePanel({
      id: 'level-editor-brush',
      title: 'Brush Size',
      position: { x: 10, y: 395 },
      size: { width: 110, height: 60 },
      buttons: {
        layout: 'vertical',
        spacing: 0,
        items: [], // We'll render BrushSizeControl directly in content
        autoSizeToContent: true, // Enable auto-sizing
        verticalPadding: 10, // Padding above/below content
        horizontalPadding: 10, // Padding left/right of content
        contentSizeCallback: () => {
          // Get size from BrushSizeControl instance
          return this.levelEditor?.brushSizeControl ? this.levelEditor.brushSizeControl.getContentSize() : { width: 90, height: 50 };
        }
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        managedExternally: true // Don't auto-render, LevelEditorPanels handles it
      }
    });

    // Event Editor Panel (NEW)
    this.panels.events = new DraggablePanel({
      id: 'level-editor-events',
      title: 'Events',
      position: { x: window.width - 270, y: 80 }, // Right side of screen
      size: { width: 260, height: 310 },
      visible: false, // Hidden by default - toggled via Events button
      buttons: {
        layout: 'vertical',
        spacing: 0,
        items: [],
        autoSizeToContent: true,
        verticalPadding: 10,
        horizontalPadding: 10,
        contentSizeCallback: () => {
          return this.levelEditor?.eventEditor ? this.levelEditor.eventEditor.getContentSize() : { width: 250, height: 300 };
        }
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        managedExternally: true
      }
    });

    // Properties Panel (NEW)
    this.panels.properties = new DraggablePanel({
      id: 'level-editor-properties',
      title: 'Properties',
      position: { x: window.width - 270, y: 405 }, // Right side, below events
      size: { width: 200, height: 380 },
      visible: false, // Hidden by default - toggled via View menu
      buttons: {
        layout: 'vertical',
        spacing: 0,
        items: [],
        autoSizeToContent: true,
        verticalPadding: 10,
        horizontalPadding: 10,
        contentSizeCallback: () => {
          return this.levelEditor?.propertiesPanel ? this.levelEditor.propertiesPanel.getContentSize() : { width: 180, height: 360 };
        }
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        managedExternally: true
      }
    });

    // Scrollable Sidebar Menu (Phase 4 integration)
    // Create LevelEditorSidebar instance
    this.sidebar = new LevelEditorSidebar({
      width: 300,
      height: 600,
      title: 'Level Editor Tools'
    });
    
    // Add sample content to demonstrate scrolling
    this.sidebar.addText('header-terrain', 'Terrain', { fontSize: 16, height: 40 });
    this.sidebar.addButton('btn-grass', 'Grass', () => console.log('Grass selected'));
    this.sidebar.addButton('btn-stone', 'Stone', () => console.log('Stone selected'));
    this.sidebar.addButton('btn-dirt', 'Dirt', () => console.log('Dirt selected'));
    this.sidebar.addButton('btn-sand', 'Sand', () => console.log('Sand selected'));
    this.sidebar.addButton('btn-water', 'Water', () => console.log('Water selected'));
    
    this.sidebar.addText('header-tools', 'Tools', { fontSize: 16, height: 40 });
    this.sidebar.addButton('btn-paint', 'Paint Brush', () => console.log('Paint selected'));
    this.sidebar.addButton('btn-fill', 'Fill Tool', () => console.log('Fill selected'));
    this.sidebar.addButton('btn-eyedropper', 'Eyedropper', () => console.log('Eyedropper selected'));
    this.sidebar.addButton('btn-eraser', 'Eraser', () => console.log('Eraser selected'));
    this.sidebar.addButton('btn-select', 'Select', () => console.log('Select selected'));
    
    this.sidebar.addText('header-entities', 'Entities', { fontSize: 16, height: 40 });
    this.sidebar.addButton('btn-ant', 'Place Ant', () => console.log('Ant placed'));
    this.sidebar.addButton('btn-food', 'Place Food', () => console.log('Food placed'));
    this.sidebar.addButton('btn-nest', 'Place Nest', () => console.log('Nest placed'));
    this.sidebar.addButton('btn-enemy', 'Place Enemy', () => console.log('Enemy placed'));
    
    this.sidebar.addText('header-view', 'View Options', { fontSize: 16, height: 40 });
    this.sidebar.addButton('btn-grid', 'Toggle Grid', () => console.log('Grid toggled'));
    this.sidebar.addButton('btn-minimap', 'Toggle Minimap', () => console.log('Minimap toggled'));
    this.sidebar.addButton('btn-debug', 'Toggle Debug', () => console.log('Debug toggled'));
    
    this.sidebar.addText('header-actions', 'Actions', { fontSize: 16, height: 40 });
    this.sidebar.addButton('btn-undo', 'Undo', () => console.log('Undo'));
    this.sidebar.addButton('btn-redo', 'Redo', () => console.log('Redo'));
    this.sidebar.addButton('btn-clear', 'Clear All', () => console.log('Clear all'));
    this.sidebar.addButton('btn-save', 'Save Map', () => console.log('Save map'));
    this.sidebar.addButton('btn-load', 'Load Map', () => console.log('Load map'));
    
    // Create DraggablePanel wrapper for sidebar (NO title - sidebar has its own menu bar)
    this.panels.sidebar = new DraggablePanel({
      id: 'level-editor-sidebar',
      title: '', // Empty title - LevelEditorSidebar has its own menu bar
      position: { x: window.width - 320, y: 80 }, // Right side of screen
      size: { width: 300, height: 600 },
      visible: false, // Hidden by default - toggled via View menu
      buttons: {
        layout: 'vertical',
        spacing: 0,
        items: [],
        autoSizeToContent: false, // Fixed size
        verticalPadding: 0, // No padding (sidebar handles its own)
        horizontalPadding: 0
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        managedExternally: true
      }
    });

    // Add panels to the manager
    manager.panels.set('level-editor-materials', this.panels.materials);
    manager.panels.set('level-editor-tools', this.panels.tools);
    manager.panels.set('level-editor-brush', this.panels.brush);
    manager.panels.set('level-editor-events', this.panels.events);
    manager.panels.set('level-editor-properties', this.panels.properties);
    manager.panels.set('level-editor-sidebar', this.panels.sidebar);

    // Add to LEVEL_EDITOR state visibility
    // NOTE: Properties, Events, Sidebar, and Brush panels are NOT added here - they're hidden by default
    // Properties: Toggle via View menu (Feature 7)
    // Events: Toggle via Tools panel button (Feature 8)
    // Sidebar: Toggle via View menu (Phase 4)
    // Brush: Redundant - brush size controlled via menu bar inline controls (Enhancement 9)
    if (!manager.stateVisibility.LEVEL_EDITOR) {
      manager.stateVisibility.LEVEL_EDITOR = [];
    }
    manager.stateVisibility.LEVEL_EDITOR.push(
      'level-editor-materials',
      'level-editor-tools'
      // 'level-editor-brush' - Hidden by default, menu bar controls used instead (Enhancement 9)
      // 'level-editor-events' - Hidden by default (Feature 8)
      // 'level-editor-properties' - Hidden by default (Feature 7)
      // 'level-editor-sidebar' - Hidden by default (Phase 4)
    );

    logNormal('✅ Level Editor panels initialized and added to DraggablePanelManager');
    return true;
  }

  /**
   * Update panels with mouse interaction
   * This should be called from LevelEditor.update()
   */
  update(mouseX, mouseY, mousePressed) {
    // The panels are now managed by DraggablePanelManager
    // which gets updated through sketch.js, so we don't need to do anything here
    // unless we want to handle custom interactions
    
    // Check if mouse is over any panel
    for (const panel of Object.values(this.panels)) {
      if (panel.isMouseOver(mouseX, mouseY)) {
        return true; // Mouse is over a panel, consume the event
      }
    }
    
    return false;
  }

  /**
   * Handle click events on the panels
   * Delegates to the appropriate component (MaterialPalette, ToolBar, BrushSizeControl)
   */
  handleClick(mouseX, mouseY) {
    // Materials Panel
    if (this.panels.materials && this.panels.materials.state.visible) {
      const matPanel = this.panels.materials;
      const matPos = matPanel.getPosition();
      const titleBarHeight = matPanel.calculateTitleBarHeight();
      const contentX = matPos.x + matPanel.config.style.padding;
      const contentY = matPos.y + titleBarHeight + matPanel.config.style.padding;
      
      // Check if click is in the content area of materials panel
      if (this.levelEditor.palette && this.levelEditor.palette.containsPoint(mouseX, mouseY, contentX, contentY)) {
        const handled = this.levelEditor.palette.handleClick(mouseX, mouseY, contentX, contentY);
        if (handled) {
          this.levelEditor.notifications.show(`Selected material: ${this.levelEditor.palette.getSelectedMaterial()}`);
          return true;
        }
      }
    }

    // Tools Panel - CRITICAL: Check toolbar FIRST before checking panel visibility
    // The main Level Editor toolbar (with Events button) is rendered in the Tools panel
    // We need to check toolbar clicks even if the Tools panel is hidden, because
    // the toolbar buttons (like Events) might toggle panels on/off
    if (this.panels.tools) {
      const toolPanel = this.panels.tools;
      const toolPos = toolPanel.getPosition();
      const titleBarHeight = toolPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolPanel.config.style.padding;
      
      // Check if click is in the toolbar area (regardless of panel visibility)
      if (this.levelEditor.toolbar && this.levelEditor.toolbar.containsPoint(mouseX, mouseY, contentX, contentY)) {
        const tool = this.levelEditor.toolbar.handleClick(mouseX, mouseY, contentX, contentY);
        if (tool) {
          this.levelEditor.notifications.show(`Selected tool: ${tool}`);
          
          // Update undo/redo button states
          this.levelEditor.toolbar.setEnabled('undo', this.levelEditor.editor.canUndo());
          this.levelEditor.toolbar.setEnabled('redo', this.levelEditor.editor.canRedo());
          
          return true; // Consume the click so draggablePanelManager doesn't see it
        }
      }
    }

    // Brush Size Panel
    if (this.panels.brush && this.panels.brush.state.visible) {
      const brushPanel = this.panels.brush;
      const brushPos = brushPanel.getPosition();
      const titleBarHeight = brushPanel.calculateTitleBarHeight();
      const contentX = brushPos.x + brushPanel.config.style.padding;
      const contentY = brushPos.y + titleBarHeight + brushPanel.config.style.padding;
      
      // Check if click is in the content area of brush panel
      if (this.levelEditor.brushControl && this.levelEditor.brushControl.containsPoint(mouseX, mouseY, contentX, contentY)) {
        const action = this.levelEditor.brushControl.handleClick(mouseX, mouseY, contentX, contentY);
        if (action) {
          const newSize = this.levelEditor.brushControl.getSize();
          this.levelEditor.editor.setBrushSize(newSize);
          this.levelEditor.notifications.show(`Brush size: ${newSize}`);
          return true;
        }
      }
    }

    // Events Panel
    if (this.panels.events && this.panels.events.state.visible) {
      const eventPanel = this.panels.events;
      const eventPos = eventPanel.getPosition();
      const titleBarHeight = eventPanel.calculateTitleBarHeight();
      const contentX = eventPos.x + eventPanel.config.style.padding;
      const contentY = eventPos.y + titleBarHeight + eventPanel.config.style.padding;
      
      // Check if click is in the content area of events panel
      if (this.levelEditor.eventEditor && this.levelEditor.eventEditor.containsPoint(mouseX, mouseY, contentX, contentY)) {
        const action = this.levelEditor.eventEditor.handleClick(mouseX, mouseY, contentX, contentY);
        if (action) {
          // Handle different event editor actions
          if (action.type === 'event_selected') {
            this.levelEditor.notifications.show(`Selected event: ${action.eventId}`);
          } else if (action.type === 'event_added') {
            this.levelEditor.notifications.show(`Event added: ${action.eventId}`);
          } else if (action.type === 'event_exported') {
            this.levelEditor.notifications.show('Events exported to clipboard');
          }
          return true;
        }
      }
    }

    // Sidebar Panel (Phase 4 integration)
    if (this.panels.sidebar && this.panels.sidebar.state.visible && this.sidebar) {
      const sidebarPanel = this.panels.sidebar;
      const sidebarPos = sidebarPanel.getPosition();
      const titleBarHeight = sidebarPanel.calculateTitleBarHeight();
      const contentX = sidebarPos.x;
      const contentY = sidebarPos.y + titleBarHeight;
      
      // Check if click is in sidebar area
      const sidebarWidth = this.sidebar.getWidth();
      const sidebarHeight = this.sidebar.getHeight();
      
      if (mouseX >= contentX && mouseX <= contentX + sidebarWidth &&
          mouseY >= contentY && mouseY <= contentY + sidebarHeight) {
        const clicked = this.sidebar.handleClick(mouseX, mouseY, contentX, contentY);
        if (clicked) {
          // Handle sidebar actions
          if (clicked.type === 'minimize') {
            this.panels.sidebar.toggleMinimize();
          }
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Handle double-click events on the panels
   * Delegates to panel content (e.g., EventEditorPanel for placement mode)
   */
  handleDoubleClick(mouseX, mouseY) {
    // Events Panel - Check if double-clicking panel content
    if (this.panels.events && this.panels.events.state.visible && !this.panels.events.state.minimized) {
      const eventPanel = this.panels.events;
      const eventPos = eventPanel.getPosition();
      const titleBarHeight = eventPanel.calculateTitleBarHeight();
      const contentX = eventPos.x + eventPanel.config.style.padding;
      const contentY = eventPos.y + titleBarHeight + eventPanel.config.style.padding;
      
      // Check if double-click is in the content area of events panel
      if (this.levelEditor.eventEditor && this.levelEditor.eventEditor.handleDoubleClick) {
        const handled = this.levelEditor.eventEditor.handleDoubleClick(mouseX, mouseY, contentX, contentY);
        if (handled) {
          return true; // EventEditor consumed the double-click
        }
      }
    }
    
    return false;
  }

  /**
   * Handle mouse wheel events on the panels
   * Delegates to scrollable panels (e.g., sidebar)
   * @param {number} delta - Mouse wheel delta
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if event was handled
   */
  handleMouseWheel(delta, mouseX, mouseY) {
    // Sidebar Panel (Phase 4 integration)
    if (this.panels.sidebar && this.panels.sidebar.state.visible && this.sidebar) {
      const sidebarPanel = this.panels.sidebar;
      const sidebarPos = sidebarPanel.getPosition();
      const titleBarHeight = sidebarPanel.calculateTitleBarHeight();
      const contentX = sidebarPos.x;
      const contentY = sidebarPos.y + titleBarHeight;
      
      // Check if mouse is over sidebar
      const sidebarWidth = this.sidebar.getWidth();
      const sidebarHeight = this.sidebar.getHeight();
      
      if (mouseX >= contentX && mouseX <= contentX + sidebarWidth &&
          mouseY >= contentY && mouseY <= contentY + sidebarHeight) {
        // Delegate to sidebar
        const handled = this.sidebar.handleMouseWheel(delta, mouseX, mouseY);
        if (handled) {
          return true; // Consumed
        }
      }
    }
    
    return false;
  }

  /**
   * Render the panels with their content
   * This should be called from LevelEditor.render()
   */
  render() {
    // Materials Panel
    if (this.panels.materials && this.panels.materials.state.visible && !this.panels.materials.state.minimized) {
      this.panels.materials.render((contentArea, style) => {
        if (this.levelEditor.palette) {
          // Pass absolute coordinates AND dimensions for proper categorization, scrolling, responsive layout
          // MaterialPalette.render(x, y, width, height) requires all parameters
          this.levelEditor.palette.render(contentArea.x, contentArea.y, contentArea.width, contentArea.height);
        }
      });
    } else if (this.panels.materials && this.panels.materials.state.visible) {
      // Just render the minimized title bar
      this.panels.materials.render();
    }

    // Tools Panel
    if (this.panels.tools && this.panels.tools.state.visible && !this.panels.tools.state.minimized) {
      this.panels.tools.render((contentArea, style) => {
        if (this.levelEditor.toolbar) {
          // Pass absolute coordinates directly (no translate)
          this.levelEditor.toolbar.render(contentArea.x, contentArea.y);
        }
      });
    } else if (this.panels.tools && this.panels.tools.state.visible) {
      this.panels.tools.render();
    }

    // Brush Size Panel
    if (this.panels.brush && this.panels.brush.state.visible && !this.panels.brush.state.minimized) {
      this.panels.brush.render((contentArea, style) => {
        if (this.levelEditor.brushControl) {
          // Pass absolute coordinates directly (no translate)
          this.levelEditor.brushControl.render(contentArea.x, contentArea.y);
        }
      });
    } else if (this.panels.brush && this.panels.brush.state.visible) {
      this.panels.brush.render();
    }

    // Events Panel
    if (this.panels.events && this.panels.events.state.visible && !this.panels.events.state.minimized) {
      this.panels.events.render((contentArea, style) => {
        if (this.levelEditor.eventEditor) {
          // Pass absolute coordinates AND dimensions for proper layout
          this.levelEditor.eventEditor.render(contentArea.x, contentArea.y, contentArea.width, contentArea.height);
        }
      });
    } else if (this.panels.events && this.panels.events.state.visible) {
      this.panels.events.render();
    }

    // Properties Panel (NEW)
    if (this.panels.properties && this.panels.properties.state.visible && !this.panels.properties.state.minimized) {
      this.panels.properties.render((contentArea, style) => {
        if (this.levelEditor.propertiesPanel) {
          // Update panel data before rendering
          this.levelEditor.propertiesPanel.update();
          // Pass absolute coordinates and flag as panel content (no background)
          this.levelEditor.propertiesPanel.render(contentArea.x, contentArea.y, { isPanelContent: true });
        }
      });
    } else if (this.panels.properties && this.panels.properties.state.visible) {
      this.panels.properties.render();
    }

    // Sidebar Panel (Phase 4 integration)
    if (this.panels.sidebar && this.panels.sidebar.state.visible && !this.panels.sidebar.state.minimized) {
      this.panels.sidebar.render((contentArea, style) => {
        if (this.sidebar) {
          // Delegate rendering to LevelEditorSidebar instance
          this.sidebar.render(contentArea.x, contentArea.y);
        }
      });
    } else if (this.panels.sidebar && this.panels.sidebar.state.visible) {
      this.panels.sidebar.render();
    }
  }

  /**
   * Toggle Events panel visibility
   * Called by Events button in Tools panel
   * CRITICAL: Must update stateVisibility to prevent renderPanels() from hiding it
   */
  toggleEventsPanel() {
    const manager = (typeof window !== 'undefined') ? window.draggablePanelManager : global.draggablePanelManager;
    if (manager) {
      const panelId = 'level-editor-events';
      const panel = manager.panels.get(panelId);
      
      if (!panel) {
        console.warn('[LevelEditorPanels] Events panel not found');
        return;
      }
      
      // Check if panel is currently visible (handle both method and property)
      const isVisible = typeof panel.isVisible === 'function' ? panel.isVisible() : panel.visible;
      
      if (isVisible) {
        // Hide panel and remove from stateVisibility
        panel.hide();
        const index = manager.stateVisibility.LEVEL_EDITOR.indexOf(panelId);
        if (index > -1) {
          manager.stateVisibility.LEVEL_EDITOR.splice(index, 1);
        }
      } else {
        // Show panel and add to stateVisibility
        panel.show();
        if (!manager.stateVisibility.LEVEL_EDITOR.includes(panelId)) {
          manager.stateVisibility.LEVEL_EDITOR.push(panelId);
        }
      }
    }
  }

  /**
   * Show all level editor panels
   * Only shows panels that are in LEVEL_EDITOR state visibility
   * (Events panel should remain hidden until user clicks Events button)
   */
  show() {
    const manager = (typeof window !== 'undefined') ? window.draggablePanelManager : global.draggablePanelManager;
    
    if (!manager) {
      // Fallback to showing all panels if manager not available
      Object.values(this.panels).forEach(panel => {
        if (panel) panel.show();
      });
      return;
    }
    
    // Only show panels that are in LEVEL_EDITOR state visibility
    const visiblePanelIds = manager.stateVisibility.LEVEL_EDITOR || [];
    
    Object.entries(this.panels).forEach(([key, panel]) => {
      if (panel && visiblePanelIds.includes(panel.config.id)) {
        panel.show();
      }
    });
  }

  /**
   * Hide all level editor panels
   */
  hide() {
    Object.values(this.panels).forEach(panel => {
      if (panel) panel.hide();
    });
  }

  /**
   * Cleanup and remove panels from manager
   */
  destroy() {
    const manager = (typeof window !== 'undefined') ? window.draggablePanelManager : global.draggablePanelManager;
    
    if (manager) {
      manager.removePanel('level-editor-materials');
      manager.removePanel('level-editor-tools');
      manager.removePanel('level-editor-brush');
      manager.removePanel('level-editor-events');
      manager.removePanel('level-editor-properties');
    }

    this.panels = {
      materials: null,
      tools: null,
      brush: null,
      events: null,
      properties: null
    };
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.LevelEditorPanels = LevelEditorPanels;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelEditorPanels;
}
