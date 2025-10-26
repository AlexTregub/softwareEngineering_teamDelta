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
      brush: null
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
    // Size: 2 cols × 40px swatches, 3 materials = 2 rows, height = 2×(40+10)+10 = 110px
    this.panels.materials = new DraggablePanel({
      id: 'level-editor-materials',
      title: 'Materials',
      position: { x: 10, y: 80 },
      size: { width: 120, height: 115 },
      buttons: {
        layout: 'vertical',
        spacing: 0,
        items: [] // We'll render MaterialPalette directly in content
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
        items: [] // We'll render ToolBar directly in content
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
        items: [] // We'll render BrushSizeControl directly in content
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        managedExternally: true // Don't auto-render, LevelEditorPanels handles it
      }
    });

    // Add panels to the manager
    manager.panels.set('level-editor-materials', this.panels.materials);
    manager.panels.set('level-editor-tools', this.panels.tools);
    manager.panels.set('level-editor-brush', this.panels.brush);

    // Add to LEVEL_EDITOR state visibility
    if (!manager.stateVisibility.LEVEL_EDITOR) {
      manager.stateVisibility.LEVEL_EDITOR = [];
    }
    manager.stateVisibility.LEVEL_EDITOR.push(
      'level-editor-materials',
      'level-editor-tools',
      'level-editor-brush'
    );

    console.log('✅ Level Editor panels initialized and added to DraggablePanelManager');
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
          push();
          translate(contentArea.x, contentArea.y);
          this.levelEditor.palette.render(0, 0);
          pop();
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
          push();
          translate(contentArea.x, contentArea.y);
          this.levelEditor.toolbar.render(0, 0);
          pop();
        }
      });
    } else if (this.panels.tools && this.panels.tools.state.visible) {
      this.panels.tools.render();
    }

    // Brush Size Panel
    if (this.panels.brush && this.panels.brush.state.visible && !this.panels.brush.state.minimized) {
      this.panels.brush.render((contentArea, style) => {
        if (this.levelEditor.brushControl) {
          push();
          translate(contentArea.x, contentArea.y);
          this.levelEditor.brushControl.render(0, 0);
          pop();
        }
      });
    } else if (this.panels.brush && this.panels.brush.state.visible) {
      this.panels.brush.render();
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
    }

    this.panels = {
      materials: null,
      tools: null,
      brush: null
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
