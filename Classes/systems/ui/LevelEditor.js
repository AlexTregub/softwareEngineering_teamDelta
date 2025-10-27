/**
 * LevelEditor - Main controller for the terrain level editor
 * Integrates TerrainEditor, MaterialPalette, ToolBar, and other UI components
 */

class LevelEditor {
  constructor() {
    this.active = false;
    this.terrain = null;
    this.editor = null;
    this.palette = null;
    this.toolbar = null;
    this.brushControl = null;
    this.eventEditor = null; // NEW: Event editor panel
    this.minimap = null;
    this.propertiesPanel = null;
    this.gridOverlay = null;
    this.saveDialog = null;
    this.loadDialog = null;
    this.notifications = null;
    this.draggablePanels = null; // NEW: Draggable panel integration
    this.fileMenuBar = null; // NEW: File menu bar for save/load/export
    this.selectionManager = null; // NEW: Rectangle selection for select tool
    this.hoverPreviewManager = null; // NEW: Hover preview for all tools
    
    // UI state
    this.showGrid = true;
    this.showMinimap = true;
    
    // Camera for level editor
    this.editorCamera = null;
  }
  
  /**
   * Initialize the level editor with a terrain instance
   * @param {CustomTerrain} terrain - The terrain to edit
   */
  initialize(terrain) {
    if (!terrain) {
      console.error('LevelEditor: Cannot initialize without terrain');
      return false;
    }
    
    this.terrain = terrain;
    
    // Create terrain editor
    this.editor = new TerrainEditor(terrain);
    
    // Create material palette (auto-populates from TERRAIN_MATERIALS_RANGED)
    this.palette = new MaterialPalette();
    this.palette.selectMaterial('grass'); // Default selection
    
    // Create toolbar with tools
    this.toolbar = new ToolBar([
      { name: 'paint', icon: '🖌️', tooltip: 'Paint Tool' },
      { name: 'fill', icon: '🪣', tooltip: 'Fill Tool' },
      { name: 'eyedropper', icon: '💧', tooltip: 'Pick Material' },
      { name: 'select', icon: '⬚', tooltip: 'Select Region' }
    ]);
    this.toolbar.selectTool('paint');
    
    // Create brush size control (initialSize, minSize, maxSize)
    this.brushControl = new BrushSizeControl(1, 1, 9);
    
    // Create event editor panel
    this.eventEditor = new EventEditorPanel();
    this.eventEditor.initialize(); // Connect to EventManager
    
    // Create minimap
    this.minimap = new MiniMap(terrain, 200, 200);
    
    // Create properties panel
    this.propertiesPanel = new PropertiesPanel();
    this.propertiesPanel.setTerrain(terrain);
    this.propertiesPanel.setEditor(this.editor);
    
    // Create grid overlay (tileSize, width, height)
    const TILE_SIZE = 32; // Standard tile size
    this.gridOverlay = new GridOverlay(TILE_SIZE, terrain.width, terrain.height);
    
    // Create save/load dialogs
    this.saveDialog = new SaveDialog();
    this.loadDialog = new LoadDialog();
    
    // Enable native file dialogs (Windows file explorer instead of custom UI)
    this.saveDialog.useNativeDialogs = true;
    this.loadDialog.useNativeDialogs = true;
    
    // Wire up dialog callbacks
    this.saveDialog.onSave = () => {
      this.save();
      this.saveDialog.hide();
    };
    this.saveDialog.onCancel = () => {
      this.saveDialog.hide();
    };
    
    this.loadDialog.onLoad = (data) => {
      // When using native dialogs, data is passed directly to callback
      if (this.loadDialog.useNativeDialogs && data) {
        this.loadFromData(data);
        this.loadDialog.hide();
      } else {
        // Custom dialog flow
        const selectedFile = this.loadDialog.getSelectedFile();
        if (selectedFile) {
          this.load();
          this.loadDialog.hide();
        }
      }
    };
    this.loadDialog.onCancel = () => {
      this.loadDialog.hide();
    };
    
    // Create notification manager
    this.notifications = new NotificationManager();
    
    // Create file menu bar for save/load/export operations
    this.fileMenuBar = new FileMenuBar();
    this.fileMenuBar.setLevelEditor(this);
    
    // NEW: Initialize selection manager for select tool
    this.selectionManager = new SelectionManager();
    
    // NEW: Initialize hover preview manager for all tools
    this.hoverPreviewManager = new HoverPreviewManager();
    
    // Setup camera for editor
    this.editorCamera = cameraManager;
    
    // NEW: Initialize draggable panels
    this.draggablePanels = new LevelEditorPanels(this);
    this.draggablePanels.initialize();
    
    this.active = true;
    
    verboseLog('Level Editor initialized');
    return true;
  }
  
  /**
   * Activate the level editor
   */
  activate() {
    if (!this.terrain) {
      // Create a new terrain for editing
      const chunksX = 10;
      const chunksY = 10;
      this.terrain = new gridTerrain(chunksX, chunksY);
      this.initialize(this.terrain);
    }
    
    this.active = true;
    GameState.setState('LEVEL_EDITOR');
    
    // Show draggable panels
    if (this.draggablePanels) {
      this.draggablePanels.show();
    }
  }
  
  /**
   * Deactivate the level editor
   */
  deactivate() {
    this.active = false;
    this.draggablePanels.hide();
  }
  
  /**
   * Handle mouse clicks in the editor
   */
  handleClick(mouseX, mouseY) {
    if (!this.active) return;
    
    // FIRST: Check if dialogs are open and handle their clicks
    if (this.saveDialog && this.saveDialog.isVisible()) {
      const consumed = this.saveDialog.handleClick(mouseX, mouseY);
      if (consumed) {
        return; // Dialog consumed the click
      }
    }
    
    if (this.loadDialog && this.loadDialog.isVisible()) {
      const consumed = this.loadDialog.handleClick(mouseX, mouseY);
      if (consumed) {
        return; // Dialog consumed the click
      }
    }
    
    // SECOND: Check if file menu bar handled the click
    if (this.fileMenuBar) {
      const handled = this.fileMenuBar.handleClick(mouseX, mouseY);
      if (handled) {
        return; // Menu bar consumed the click
      }
    }
    
    // THIRD: Let draggable panels handle content clicks (buttons, swatches, etc.)
    if (this.draggablePanels) {
      const handled = this.draggablePanels.handleClick(mouseX, mouseY);
      if (handled) {
        return; // Panel content consumed the click
      }
    }
    
    // FOURTH: Check if draggable panel manager consumed the event (for dragging/title bar)
    if (typeof draggablePanelManager !== 'undefined' && draggablePanelManager) {
      const panelConsumed = draggablePanelManager.handleMouseEvents(mouseX, mouseY, true);
      if (panelConsumed) {
        return; // Panel consumed the click - don't paint terrain
      }
    }
    
    // If no UI was clicked, handle terrain editing
    const tool = this.toolbar.getSelectedTool();
    const material = this.palette.getSelectedMaterial();
    
    // Simple pixel-to-tile conversion (assuming tiles are TILE_SIZE pixels)
    const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
    const gridX = Math.floor(mouseX / tileSize);
    const gridY = Math.floor(mouseY / tileSize);
    
    // Apply tool action
    switch(tool) {
      case 'paint':
        const brushSize = this.brushControl.getSize();
        this.editor.setBrushSize(brushSize);
        this.editor.selectMaterial(material);
        this.editor.paint(gridX, gridY);
        this.notifications.show(`Painted ${material} at (${gridX}, ${gridY})`);
        
        // Notify minimap of terrain edit (debounced cache invalidation)
        if (this.minimap && this.minimap.notifyTerrainEditStart) {
          this.minimap.notifyTerrainEditStart();
        }
        
        // Update undo/redo states
        this.toolbar.setEnabled('undo', this.editor.canUndo());
        this.toolbar.setEnabled('redo', this.editor.canRedo());
        break;
        
      case 'fill':
        this.editor.selectMaterial(material);
        this.editor.fill(gridX, gridY);
        this.notifications.show(`Filled region with ${material}`);
        
        // Notify minimap of terrain edit (immediate invalidation for fill)
        if (this.minimap && this.minimap.invalidateCache) {
          this.minimap.invalidateCache();
        }
        
        // Update undo/redo states
        this.toolbar.setEnabled('undo', this.editor.canUndo());
        this.toolbar.setEnabled('redo', this.editor.canRedo());
        break;
        
      case 'eyedropper':
        try {
          const tile = this.terrain.getTile(gridX, gridY);
          if (tile && tile.getMaterial) {
            const pickedMaterial = tile.getMaterial();
            this.palette.selectMaterial(pickedMaterial);
            this.notifications.show(`Picked material: ${pickedMaterial}`);
          }
        } catch (e) {
          // Tile out of bounds
          this.notifications.show('Cannot pick material: tile out of bounds', 'error');
        }
        break;
        
      case 'select':
        // Start rectangle selection
        this.selectionManager.startSelection(gridX, gridY);
        this.notifications.show('Selection started - drag to define area');
        break;
        
      case 'undo':
        if (this.editor.canUndo()) {
          this.editor.undo();
          this.notifications.show('Undid last action');
          this.toolbar.setEnabled('undo', this.editor.canUndo());
          this.toolbar.setEnabled('redo', this.editor.canRedo());
          
          // Invalidate minimap cache after undo
          if (this.minimap && this.minimap.invalidateCache) {
            this.minimap.invalidateCache();
          }
        }
        break;
        
      case 'redo':
        if (this.editor.canRedo()) {
          this.editor.redo();
          this.notifications.show('Redid last action');
          this.toolbar.setEnabled('undo', this.editor.canUndo());
          this.toolbar.setEnabled('redo', this.editor.canRedo());
          
          // Invalidate minimap cache after redo
          if (this.minimap && this.minimap.invalidateCache) {
            this.minimap.invalidateCache();
          }
        }
        break;
    }
  }
  
  /**
   * Handle mouse dragging in the editor (for continuous painting)
   */
  handleDrag(mouseX, mouseY) {
    if (!this.active) return;
    
    // Check if draggable panel manager consumed the mouse event
    if (typeof draggablePanelManager !== 'undefined' && draggablePanelManager) {
      const panelConsumed = draggablePanelManager.handleMouseEvents(mouseX, mouseY, true);
      if (panelConsumed) {
        return; // Panel consumed the drag - don't paint terrain
      }
    }
    
    const tool = this.toolbar.getSelectedTool();
    const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
    const gridX = Math.floor(mouseX / tileSize);
    const gridY = Math.floor(mouseY / tileSize);
    
    // Handle select tool dragging
    if (tool === 'select') {
      this.selectionManager.updateSelection(gridX, gridY);
      return;
    }
    
    // Paint tool supports continuous dragging
    if (tool !== 'paint') {
      return; // Other tools don't support drag painting
    }
    
    // Paint at current mouse position
    const material = this.palette.getSelectedMaterial();
    
    const brushSize = this.brushControl.getSize();
    this.editor.setBrushSize(brushSize);
    this.editor.selectMaterial(material);
    this.editor.paint(gridX, gridY);
    
    // Notify minimap of terrain edit (debounced cache invalidation)
    if (this.minimap && this.minimap.scheduleInvalidation) {
      this.minimap.scheduleInvalidation();
    }
    
    // Update undo/redo buttons
    this.toolbar.setEnabled('undo', this.editor.canUndo());
    this.toolbar.setEnabled('redo', this.editor.canRedo());
  }
  
  /**
   * Handle mouse release (end of drag operation)
   */
  handleMouseRelease(mouseX, mouseY) {
    if (!this.active) return;
    
    const tool = this.toolbar.getSelectedTool();
    
    // Handle select tool completion
    if (tool === 'select' && this.selectionManager.isSelecting) {
      const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
      const gridX = Math.floor(mouseX / tileSize);
      const gridY = Math.floor(mouseY / tileSize);
      
      this.selectionManager.updateSelection(gridX, gridY);
      this.selectionManager.endSelection();
      
      // Paint all tiles in selection with current material
      const tiles = this.selectionManager.getTilesInSelection();
      const material = this.palette.getSelectedMaterial();
      
      if (tiles.length > 0) {
        this.editor.selectMaterial(material);
        
        // Paint each tile in selection
        tiles.forEach(tile => {
          this.terrain.setTile(tile.x, tile.y, material);
        });
        
        // Add to undo history
        this.editor._recordState();
        
        this.notifications.show(`Painted ${tiles.length} tiles with ${material}`);
        
        // Invalidate minimap cache
        if (this.minimap && this.minimap.invalidateCache) {
          this.minimap.invalidateCache();
        }
        
        // Update undo/redo states
        this.toolbar.setEnabled('undo', this.editor.canUndo());
        this.toolbar.setEnabled('redo', this.editor.canRedo());
        
        // Clear selection after painting
        this.selectionManager.clearSelection();
      }
    }
  }
  
  /**
   * Handle mouse hover (for preview highlighting)
   */
  handleHover(mouseX, mouseY) {
    if (!this.active) return;
    
    const tool = this.toolbar.getSelectedTool();
    const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
    const gridX = Math.floor(mouseX / tileSize);
    const gridY = Math.floor(mouseY / tileSize);
    
    // Update hover preview for current tool
    const brushSize = this.brushControl.getSize();
    this.hoverPreviewManager.updateHover(gridX, gridY, tool, brushSize);
  }
  
  /**
   * Clear hover preview when mouse leaves canvas
   */
  clearHover() {
    if (this.hoverPreviewManager) {
      this.hoverPreviewManager.clearHover();
    }
  }
  
  /**
   * Update editor state
   */
  update() {
    if (!this.active) return;
    
    // Update file menu bar states (undo/redo availability)
    if (this.fileMenuBar) {
      this.fileMenuBar.updateMenuStates();
    }
    
    // Update UI components
    if (this.minimap) {
      this.minimap.update();
    }
    
    if (this.notifications) {
      this.notifications.update();
    }
  }
  
  /**
   * Render the level editor UI
   */
  render() {
    if (!this.active) return;
    
    // Render terrain
    if (this.terrain) {
      this.terrain.render();
    }
    
    // Grid overlay (respects both showGrid flag and gridOverlay.visible)
    if (this.showGrid) {
      this.gridOverlay.render();
    }
    
    // File menu bar (has its own visible check)
    this.fileMenuBar.render();
    
    // Draggable panels (has its own visible check)
    this.draggablePanels.render();
    
    // Minimap (bottom right)
    if (this.showMinimap && this.minimap) {
      const minimapX = g_canvasX - 220;
      const minimapY = g_canvasY - 220;
      this.minimap.render(minimapX, minimapY);
    }
    
    // Notifications (bottom left, stacking upwards)
    if (this.notifications && this.notifications.visible) {
      const notifX = 10;
      const notifY = g_canvasY - 10; // Bottom of screen
      this.notifications.render(notifX, notifY);
    }
    
    // Render hover preview (tiles that will be affected)
    this.renderHoverPreview();
    
    // Render selection rectangle (if selecting)
    this.renderSelectionRectangle();
    
    // Render dialogs if active
    if (this.saveDialog.isVisible()) { this.saveDialog.render(); }
    if (this.loadDialog.isVisible()) { this.loadDialog.render(); }
    
    // Render back button
    //this.renderBackButton();
  }
  
  /**
   * Render hover preview (highlight tiles that will be affected)
   */
  renderHoverPreview() {
    if (!this.hoverPreviewManager) return;
    
    const tiles = this.hoverPreviewManager.getHoveredTiles();
    if (tiles.length === 0) return;
    
    const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
    
    push();
    noStroke();
    fill(255, 255, 0, 80); // Yellow semi-transparent overlay
    
    tiles.forEach(tile => {
      const pixelX = tile.x * tileSize;
      const pixelY = tile.y * tileSize;
      rect(pixelX, pixelY, tileSize, tileSize);
    });
    
    pop();
  }
  
  /**
   * Render selection rectangle (during drag)
   */
  renderSelectionRectangle() {
    if (!this.selectionManager) return;
    if (!this.selectionManager.hasSelection()) return;
    
    const bounds = this.selectionManager.getSelectionBounds();
    if (!bounds) return;
    
    const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
    
    // Calculate pixel coordinates
    const pixelX = bounds.minX * tileSize;
    const pixelY = bounds.minY * tileSize;
    const pixelWidth = (bounds.maxX - bounds.minX + 1) * tileSize;
    const pixelHeight = (bounds.maxY - bounds.minY + 1) * tileSize;
    
    push();
    
    // Fill with semi-transparent blue
    fill(100, 150, 255, 60);
    noStroke();
    rect(pixelX, pixelY, pixelWidth, pixelHeight);
    
    // Border with animated dashed line
    stroke(100, 150, 255, 200);
    strokeWeight(2);
    noFill();
    
    // Animated dashing effect
    const dashLength = 10;
    const offset = (frameCount * 2) % (dashLength * 2);
    
    drawingContext.setLineDash([dashLength, dashLength]);
    drawingContext.lineDashOffset = -offset;
    rect(pixelX, pixelY, pixelWidth, pixelHeight);
    drawingContext.setLineDash([]); // Reset
    
    pop();
  }
  
  /**
   * Render a button to return to main menu
   */
  renderBackButton() {
    // Position in top-left, slightly offset from edges
    const btnSize = 64; // Square button to match icon size
    const btnX = 32;  // Slightly offset from left edge
    const btnY = 32;  // Slightly offset from top edge
    
    // Check hover
    const isHovering = mouseX > btnX && mouseX < btnX + btnSize && 
                       mouseY > btnY && mouseY < btnY + btnSize;
    
    // Draw the textured button
    push();
    if (isHovering) { tint(255, 220); }

    image(backButtonImg, btnX, btnY, btnSize, btnSize);
    pop();
    
    // Handle click
    if (isHovering && mouseIsPressed) {
      GameState.goToMenu();
    }
  }
  
  /**
   * Save the current terrain
   */
  save() {
    if (!this.terrain) return;
    
    const exporter = new TerrainExporter(this.terrain);
    const data = exporter.exportToJSON();
    
    // Check if using native dialogs
    if (this.saveDialog.useNativeDialogs) {
      // Use native browser save dialog
      this.saveDialog.saveWithNativeDialog(data, 'my_level.json');
      this.notifications.show('Level downloaded!', 'success');
    } else {
      // Use custom dialog UI
      this.saveDialog.show();
      this.saveDialog.setFilename('my_level');
      this.saveDialog.setFormat('json');
      
      // For now, save to localStorage
      const storage = new LocalStorageManager('level_');
      const saved = storage.save('current', data);
      
      if (saved) {
        this.notifications.show('Level saved successfully!', 'success');
      } else {
        this.notifications.show('Failed to save level', 'error');
      }
    }
  }
  
  /**
   * Load a terrain from file data
   * @param {Object} data - Terrain data to load
   */
  loadFromData(data) {
    if (data && this.terrain) {
      const importer = new TerrainImporter(this.terrain);
      const success = importer.importFromJSON(data);
      
      if (success) {
        this.notifications.show('Level loaded successfully!', 'success');
      } else {
        this.notifications.show('Failed to load level', 'error');
      }
    }
  }
  
  /**
   * Load a terrain
   */
  load() {
    // Check if using native dialogs
    if (this.loadDialog.useNativeDialogs) {
      // Open native file picker (callback handles loading)
      this.loadDialog.openNativeFileDialog();
    } else {
      // Use custom dialog with localStorage
      const storage = new LocalStorageManager('level_');
      const data = storage.load('current');
      
      if (data && this.terrain) {
        this.loadFromData(data);
      }
    }
  }
  
  /**
   * Undo last action
   */
  undo() {
    if (this.editor && this.editor.canUndo()) {
      this.editor.undo();
      this.notifications.show('Undo', 'info');
    }
  }
  
  /**
   * Redo last undone action
   */
  redo() {
    if (this.editor && this.editor.canRedo()) {
      this.editor.redo();
      this.notifications.show('Redo', 'info');
    }
  }
  
  /**
   * Handle keyboard shortcuts
   */
  handleKeyPress(key) {
    if (!this.active) return;
    
    // FIRST: Check if save dialog is open and handle keyboard input
    if (this.saveDialog && this.saveDialog.isVisible()) {
      const consumed = this.saveDialog.handleKeyPress(key);
      if (consumed) {
        return; // Dialog consumed the key press
      }
    }
    
    // SECOND: Check if file menu bar handles the key press (keyboard shortcuts)
    if (this.fileMenuBar) {
      const modifiers = {
        ctrl: keyIsDown(CONTROL),
        shift: keyIsDown(SHIFT),
        alt: keyIsDown(ALT)
      };
      const handled = this.fileMenuBar.handleKeyPress(key, modifiers);
      if (handled) {
        return; // Menu bar consumed the key press
      }
    }
    
    // keyboard shortcuts
    switch(key.toLowerCase()) {
      case 's':
        if (keyIsDown(CONTROL)) {
          this.save();
        }
        break;
      case 'o':
        if (keyIsDown(CONTROL)) {
          this.load();
        }
        break;
      case 'z':
        if (keyIsDown(CONTROL)) {
          this.undo();
        }
        break;
      case 'y':
        if (keyIsDown(CONTROL)) {
          this.redo();
        }
        break;
      case 'g':
        this.showGrid = !this.showGrid;
        this.notifications.show(`Grid ${this.showGrid ? 'shown' : 'hidden'}`, 'info');
        break;
      case 'm':
        this.showMinimap = !this.showMinimap;
        this.notifications.show(`Minimap ${this.showMinimap ? 'shown' : 'hidden'}`, 'info');
        break;
    }
  }
  
  /**
   * Check if editor is active
   */
  isActive() {
    return this.active;
  }
}

// Create global instance
const levelEditor = new LevelEditor();

// Make globally available
if (typeof window !== 'undefined') {
  window.levelEditor = levelEditor;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelEditor;
  module.exports.levelEditor = levelEditor;
}
