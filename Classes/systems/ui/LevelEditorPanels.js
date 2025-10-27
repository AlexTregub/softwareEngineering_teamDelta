/**
 * LevelEditorPanels - Draggable panel integration for Level Editor
 * Wraps MaterialPalette, ToolBar, and BrushSizeControl in DraggablePanels
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
      properties: null   // NEW: Properties panel
    };
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

    // Add panels to the manager
    manager.panels.set('level-editor-materials', this.panels.materials);
    manager.panels.set('level-editor-tools', this.panels.tools);
    manager.panels.set('level-editor-brush', this.panels.brush);
    manager.panels.set('level-editor-events', this.panels.events);
    manager.panels.set('level-editor-properties', this.panels.properties);

    // Add to LEVEL_EDITOR state visibility
    // NOTE: Properties and Events panels are NOT added here - they're hidden by default (Features 7 & 8)
    // Properties: Toggle via View menu
    // Events: Toggle via Tools panel button
    if (!manager.stateVisibility.LEVEL_EDITOR) {
      manager.stateVisibility.LEVEL_EDITOR = [];
    }
    manager.stateVisibility.LEVEL_EDITOR.push(
      'level-editor-materials',
      'level-editor-tools',
      'level-editor-brush'
      // 'level-editor-events' - Hidden by default (Feature 8)
      // 'level-editor-properties' - Hidden by default (Feature 7)
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

    // Tools Panel
    if (this.panels.tools && this.panels.tools.state.visible) {
      const toolPanel = this.panels.tools;
      const toolPos = toolPanel.getPosition();
      const titleBarHeight = toolPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolPanel.config.style.padding;
      
      // Check if click is in the content area of tools panel
      if (this.levelEditor.toolbar && this.levelEditor.toolbar.containsPoint(mouseX, mouseY, contentX, contentY)) {
        const tool = this.levelEditor.toolbar.handleClick(mouseX, mouseY, contentX, contentY);
        if (tool) {
          this.levelEditor.notifications.show(`Selected tool: ${tool}`);
          
          // Update undo/redo button states
          this.levelEditor.toolbar.setEnabled('undo', this.levelEditor.editor.canUndo());
          this.levelEditor.toolbar.setEnabled('redo', this.levelEditor.editor.canRedo());
          
          return true;
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
          // Pass absolute coordinates directly (no translate)
          // This fixes coordinate offset bug with TERRAIN_MATERIALS_RANGED image() calls
          this.levelEditor.palette.render(contentArea.x, contentArea.y);
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
          // Pass absolute coordinates directly (no translate)
          this.levelEditor.eventEditor.render(contentArea.x, contentArea.y);
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
  }

  /**
   * Show all level editor panels
   */
  show() {
    Object.values(this.panels).forEach(panel => {
      if (panel) panel.show();
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
