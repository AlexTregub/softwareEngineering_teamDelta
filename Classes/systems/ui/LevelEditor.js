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
    
    // File management
    this.currentFilename = 'Untitled'; // Current filename (no extension)
    this.isModified = false; // Track if terrain has been modified
    this.isMenuOpen = false; // Track if menu dropdown is open
    
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
    
    logVerbose('Level Editor initialized');
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
   * Set menu open state (called by FileMenuBar)
   * @param {boolean} isOpen - Whether menu is open
   */
  setMenuOpen(isOpen) {
    this.isMenuOpen = isOpen;
  }
  
  /**
   * Handle mouse move for hover effects
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   */
  handleMouseMove(mouseX, mouseY) {
    if (!this.active) return;
    
    // Skip hover preview if menu is open
    if (this.isMenuOpen) {
      // Disable hover preview when menu is open
      if (this.hoverPreviewManager && typeof this.hoverPreviewManager.clear === 'function') {
        this.hoverPreviewManager.clear();
      }
      return;
    }
    
    // Normal hover behavior (hover preview, etc.)
    // This would be handled by the hover preview system
  }
  
  /**
   * Handle mouse wheel for brush size adjustment
   * @param {Object} event - Mouse wheel event with delta property
   * @param {boolean} shiftKey - Whether shift key is pressed
   * @returns {boolean} True if event was handled, false otherwise
   */
  handleMouseWheel(event, shiftKey) {
    if (!this.active) return false;
    if (!event) return false; // Null check
    if (!shiftKey) return false;
    
    // Get current tool from toolbar
    const currentTool = this.toolbar ? this.toolbar.getSelectedTool() : null;
    if (!currentTool || currentTool !== 'paint') return false;
    
    // Get current brush size from brushControl
    let currentSize = 1;
    if (this.brushControl && typeof this.brushControl.getSize === 'function') {
      currentSize = this.brushControl.getSize();
    } else if (this.editor && typeof this.editor.getBrushSize === 'function') {
      currentSize = this.editor.getBrushSize();
    }
    
    // Calculate new size (delta positive = scroll up = increase)
    const delta = event.delta || 0;
    let newSize = currentSize;
    if (delta > 0) {
      newSize = Math.min(currentSize + 1, 9);
    } else if (delta < 0) {
      newSize = Math.max(currentSize - 1, 1);
    }
    
    // Only update if size changed
    if (newSize !== currentSize) {
      // Update brush control if available
      if (this.brushControl && typeof this.brushControl.setSize === 'function') {
        this.brushControl.setSize(newSize);
      }
      
      // Update terrain editor brush size
      if (this.editor && typeof this.editor.setBrushSize === 'function') {
        this.editor.setBrushSize(newSize);
      }
      
      return true; // Event handled
    }
    
    return false;
  }
  
  /**
   * Handle mouse clicks in the editor
   */
  handleClick(mouseX, mouseY) {
    if (!this.active) return;
    
    // Check if menu is open - block all terrain editing
    if (this.isMenuOpen) {
      return false; // Menu is open, block terrain interaction
    }
    
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
    
    // Debug: Check if parameter mouseX/Y differs from global
    console.log(`🖱️ [MOUSE] Parameter: (${mouseX}, ${mouseY}), Global: (${window.mouseX}, ${window.mouseY})`);
    
    // Convert screen coordinates to world coordinates (accounts for camera)
    const worldCoords = this.convertScreenToWorld(mouseX, mouseY);
    const worldCoordsGlobal = this.convertScreenToWorld(window.mouseX, window.mouseY);
    
    console.log(`🎨 [PAINT] Screen: (${mouseX}, ${mouseY}) → World: (${worldCoords.worldX.toFixed(1)}, ${worldCoords.worldY.toFixed(1)})`);
    console.log(`🎨 [PAINT] Screen (global): (${window.mouseX}, ${window.mouseY}) → World: (${worldCoordsGlobal.worldX.toFixed(1)}, ${worldCoordsGlobal.worldY.toFixed(1)})`);
    console.log(`📷 [CAMERA] Position: (${this.editorCamera.cameraX.toFixed(1)}, ${this.editorCamera.cameraY.toFixed(1)}), Zoom: ${this.editorCamera.cameraZoom.toFixed(2)}`);
    
    // Convert world coordinates to tile coordinates
    const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
    const gridX = Math.floor(worldCoords.worldX / tileSize);
    const gridY = Math.floor(worldCoords.worldY / tileSize);
    
    console.log(`🔲 [TILE] Grid: (${gridX}, ${gridY})`);
    
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
    
    // FIRST: Check if EventEditorPanel is dragging an event for placement
    if (this.eventEditor && this.eventEditor.isDragging()) {
      this.eventEditor.updateDragPosition(mouseX, mouseY);
      return; // Event drag in progress, don't do terrain editing
    }
    
    // SECOND: Check if draggable panel manager consumed the mouse event
    if (typeof draggablePanelManager !== 'undefined' && draggablePanelManager) {
      const panelConsumed = draggablePanelManager.handleMouseEvents(mouseX, mouseY, true);
      if (panelConsumed) {
        return; // Panel consumed the drag - don't paint terrain
      }
    }
    
    const tool = this.toolbar.getSelectedTool();
    
    // Convert screen coordinates to world coordinates (accounts for camera)
    const worldCoords = this.convertScreenToWorld(mouseX, mouseY);
    const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
    const gridX = Math.floor(worldCoords.worldX / tileSize);
    const gridY = Math.floor(worldCoords.worldY / tileSize);
    
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
      // Convert screen coordinates to world coordinates (accounts for camera)
      const worldCoords = this.convertScreenToWorld(mouseX, mouseY);
      const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
      const gridX = Math.floor(worldCoords.worldX / tileSize);
      const gridY = Math.floor(worldCoords.worldY / tileSize);
      
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
        
        // Add to undo history (TerrainEditor uses _recordAction, not _recordState)
        // We need to manually record the action since we're bypassing TerrainEditor's paint method
        const affectedTiles = tiles.map(tile => ({
          x: tile.x,
          y: tile.y,
          oldMaterial: this.terrain.getTile(tile.x, tile.y),
          newMaterial: material
        }));
        
        if (this.editor && typeof this.editor._recordAction === 'function') {
          this.editor._recordAction({ type: 'paint', tiles: affectedTiles });
        }
        
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
    
    // Convert screen coordinates to world coordinates (accounts for camera)
    const worldCoords = this.convertScreenToWorld(mouseX, mouseY);
    const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
    const gridX = Math.floor(worldCoords.worldX / tileSize);
    const gridY = Math.floor(worldCoords.worldY / tileSize);
    
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
    
    // Update camera (panning, zooming, input)
    this.updateCamera();
    
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
   * Update camera for Level Editor
   * Enables panning and zooming in the editor
   */
  updateCamera() {
    if (!this.active || !this.editorCamera) return;
    
    // Update camera (handles input, following, bounds)
    if (typeof this.editorCamera.update === 'function') {
      this.editorCamera.update();
    }
  }
  
  /**
   * Apply camera transformation for rendering
   * Call before rendering world objects (terrain, grid)
   */
  applyCameraTransform() {
    if (!this.editorCamera) {
      console.warn('⚠️ [RENDER] No camera for transform!');
      return;
    }
    
    push();
    
    // Get camera position and zoom
    const zoom = typeof this.editorCamera.getZoom === 'function' 
      ? this.editorCamera.getZoom() 
      : (this.editorCamera.cameraZoom || 1);
    
    // CameraManager doesn't have getCameraPosition(), use properties directly
    const cameraPos = {
      x: this.editorCamera.cameraX !== undefined ? this.editorCamera.cameraX : 0,
      y: this.editorCamera.cameraY !== undefined ? this.editorCamera.cameraY : 0
    };
    
    // CRITICAL: Apply zoom FIRST, then translate
    // This prevents the translation from being scaled
    scale(zoom);
    translate(-cameraPos.x, -cameraPos.y);
  }
  
  /**
   * Restore transformation after rendering
   * Call after rendering world objects
   */
  restoreCameraTransform() {
    if (!this.editorCamera) return;
    pop();
  }
  
  /**
   * Convert screen coordinates to world coordinates
   * Accounts for camera position and zoom
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {{worldX: number, worldY: number}} World coordinates
   */
  convertScreenToWorld(screenX, screenY) {
    if (!this.editorCamera || typeof this.editorCamera.screenToWorld !== 'function') {
      // No camera - return screen coords as world coords
      return { worldX: screenX, worldY: screenY };
    }
    
    return this.editorCamera.screenToWorld(screenX, screenY);
  }
  
  /**
   * Get highlighted tile grid coordinates (uses screenToWorld for camera alignment)
   * @returns {Object} { gridX, gridY } - Grid coordinates of tile under mouse
   */
  getHighlightedTileCoords() {
    if (!this.editorCamera) {
      return { gridX: 0, gridY: 0 };
    }
    
    // Use screenToWorld to convert mouse position
    const worldCoords = this.editorCamera.screenToWorld(mouseX, mouseY);
    
    const tileSize = this.terrain?.tileSize || TILE_SIZE || 32;
    const gridX = Math.floor(worldCoords.worldX / tileSize);
    const gridY = Math.floor(worldCoords.worldY / tileSize);
    
    logNormal(`🎯 [HIGHLIGHT] Mouse: (${mouseX}, ${mouseY}) → World: (${worldCoords.worldX.toFixed(1)}, ${worldCoords.worldY.toFixed(1)}) → Grid: (${gridX}, ${gridY})`);
    
    return { gridX, gridY };
  }
  
  /**
   * Render single tile highlight under mouse cursor
   * Uses getHighlightedTileCoords() for camera-aligned positioning
   */
  renderTerrainHighlight() {
    if (!this.editorCamera || !this.currentTool) return;
    
    const coords = this.getHighlightedTileCoords();
    const tileSize = this.terrain?.tileSize || TILE_SIZE || 32;
    
    push();
    noStroke();
    fill(255, 255, 0, 100); // Yellow semi-transparent
    rect(coords.gridX * tileSize, coords.gridY * tileSize, tileSize, tileSize);
    pop();
  }
  
  /**
   * Handle camera input (arrow keys for panning)
   * Called from sketch.js keyboard handlers
   */
  handleCameraInput() {
    // Camera input is handled by cameraManager.update()
    // This method exists for explicit control if needed
    if (this.editorCamera && typeof this.editorCamera.handleInput === 'function') {
      this.editorCamera.handleInput();
    }
  }
  
  /**
   * Handle zoom input (mouse wheel)
   * @param {number} delta - Wheel delta (negative = zoom in, positive = zoom out)
   */
  handleZoom(delta) {
    if (!this.editorCamera) return;
    
    // Get current zoom
    const currentZoom = typeof this.editorCamera.getZoom === 'function'
      ? this.editorCamera.getZoom()
      : 1;
    
    // Calculate new zoom
    // Mouse wheel: negative delta = scroll up = zoom IN (increase zoom)
    // Mouse wheel: positive delta = scroll down = zoom OUT (decrease zoom)
    const zoomFactor = delta < 0 ? 1.1 : 0.9;
    const newZoom = currentZoom * zoomFactor;
    
    logNormal('🔍 [ZOOM]', delta < 0 ? 'IN' : 'OUT', '- Current:', currentZoom.toFixed(2), '→ New:', newZoom.toFixed(2));
    
    // Apply zoom centered on mouse position
    if (typeof this.editorCamera.setZoom === 'function') {
      this.editorCamera.setZoom(newZoom, mouseX, mouseY);
    }
  }
  
  /**
   * Render the level editor UI
   */
  render() {
    if (!this.active) return;
    
    // Apply camera transform for world-space rendering
    this.applyCameraTransform();
    
    // Render terrain
    if (this.terrain) {
      this.terrain.render();
    }
    
    // Grid overlay (respects both showGrid flag and gridOverlay.visible)
    if (this.showGrid) {
      this.gridOverlay.render();
    }
    
    // Render hover preview (tiles that will be affected) - MUST be inside camera transform
    this.renderHoverPreview();
    
    // Render selection rectangle (if selecting) - MUST be inside camera transform
    this.renderSelectionRectangle();
    
    // Restore camera transform
    this.restoreCameraTransform();
    
    // Render filename display (top-center)
    this.renderFilenameDisplay();
    
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
  /**
   * Handle File → New (creates blank terrain with unsaved prompt)
   */
  handleFileNew() {
    // Check if terrain has been modified
    if (this.isModified) {
      const confirmed = confirm("Discard unsaved changes?");
      if (!confirmed) {
        return false; // User cancelled
      }
    }
    
    // Create new blank terrain
    // Use CustomTerrain if available, otherwise gridTerrain
    if (typeof CustomTerrain !== 'undefined') {
      this.terrain = new CustomTerrain(50, 50);
    } else {
      this.terrain = new gridTerrain(10, 10);
    }
    
    // Reinitialize editor components with new terrain
    this.editor = new TerrainEditor(this.terrain);
    this.minimap = new MiniMap(this.terrain, 200, 200);
    this.propertiesPanel.setTerrain(this.terrain);
    
    // Reset filename to "Untitled"
    this.currentFilename = 'Untitled';
    
    // Clear undo/redo history
    if (this.editor && typeof this.editor.clearHistory === 'function') {
      this.editor.clearHistory();
    }
    
    // Reset modified flag
    this.isModified = false;
    
    this.notifications.show('New blank terrain created', 'info');
    return true;
  }
  
  /**
   * Handle File → Save (shows naming dialog, sets filename)
   */
  handleFileSave() {
    if (!this.terrain) return;
    
    // Show save dialog to get filename
    this.saveDialog.show();
    this.saveDialog.setFilename(this.currentFilename);
    this.saveDialog.setFormat('json');
    
    // Override the onSave callback for this workflow
    const originalCallback = this.saveDialog.onSave;
    this.saveDialog.onSave = () => {
      // Get filename from dialog (will be without extension)
      const filename = this.saveDialog.getFilename();
      if (filename) {
        // Store filename internally (strips .json if present)
        this.setFilename(filename);
        
        // Clear modified flag
        this.isModified = false;
        
        this.notifications.show(`Saved as "${this.currentFilename}"`, 'success');
      }
      
      this.saveDialog.hide();
      
      // Restore original callback
      this.saveDialog.onSave = originalCallback;
    };
  }
  
  /**
   * Handle File → Export (downloads file using current filename)
   */
  handleFileExport() {
    if (!this.terrain) return;
    
    // If no filename is set (still "Untitled"), prompt for one first
    if (this.currentFilename === 'Untitled') {
      this.handleFileSave();
      
      // After save dialog completes, export will happen
      const originalCallback = this.saveDialog.onSave;
      this.saveDialog.onSave = () => {
        originalCallback();
        // Now export with the new filename
        this._performExport();
      };
      return;
    }
    
    // Filename is set, proceed with export
    this._performExport();
  }
  
  /**
   * Perform the actual export/download
   * @private
   */
  _performExport() {
    if (!this.terrain) return;
    
    const exporter = new TerrainExporter(this.terrain);
    const data = exporter.exportToJSON();
    
    // Append .json extension for download
    const downloadFilename = `${this.currentFilename}.json`;
    
    // Use native browser save dialog
    this.saveDialog.saveWithNativeDialog(data, downloadFilename);
    this.notifications.show(`Exported as "${downloadFilename}"`, 'success');
  }
  
  /**
   * Save a terrain (legacy method - kept for compatibility)
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
   * Set the current filename (strips .json extension if present)
   * @param {string} name - Filename to set
   */
  setFilename(name) {
    // Strip .json extension if present (case insensitive)
    this.currentFilename = name.replace(/\.json$/i, '');
  }
  
  /**
   * Get the current filename (without extension)
   * @returns {string} Current filename
   */
  getFilename() {
    return this.currentFilename;
  }
  
  /**
   * Render the filename display at top-center of canvas
   */
  renderFilenameDisplay() {
    if (!this.currentFilename) return;
    
    const canvasWidth = g_canvasX || 800;
    const centerX = canvasWidth / 2;
    const topY = 40;
    
    push();
    
    // Semi-transparent background for readability
    fill(0, 0, 0, 150);
    noStroke();
    const textWidth = this.currentFilename.length * 10; // Rough estimate
    rect(centerX - textWidth/2 - 10, topY - 5, textWidth + 20, 30, 5);
    
    // Filename text
    fill(255, 255, 255);
    textAlign(CENTER, TOP);
    textSize(16);
    text(this.currentFilename, centerX, topY);
    
    pop();
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
