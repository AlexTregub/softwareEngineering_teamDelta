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
    this.minimap = null;
    this.propertiesPanel = null;
    this.gridOverlay = null;
    this.saveDialog = null;
    this.loadDialog = null;
    this.notifications = null;
    this.draggablePanels = null; // NEW: Draggable panel integration
    
    // Available materials from TERRAIN_MATERIALS_RANGED
    this.materials = ['moss', 'moss_1', 'stone', 'dirt', 'grass'];
    
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
    
    // Create material palette
    this.palette = new MaterialPalette(this.materials);
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
    
    // Create minimap
    this.minimap = new MiniMap(terrain, 200, 200);
    
    // Create properties panel
    this.propertiesPanel = new PropertiesPanel();
    
    // Create grid overlay
    this.gridOverlay = new GridOverlay(terrain);
    
    // Create save/load dialogs
    this.saveDialog = new SaveDialog();
    this.loadDialog = new LoadDialog();
    
    // Create notification manager
    this.notifications = new NotificationManager();
    
    // Setup camera for editor
    if (typeof cameraManager !== 'undefined') {
      this.editorCamera = cameraManager;
    }
    
    // NEW: Initialize draggable panels
    if (typeof LevelEditorPanels !== 'undefined') {
      this.draggablePanels = new LevelEditorPanels(this);
      this.draggablePanels.initialize();
    } else {
      console.warn('LevelEditorPanels not found - panels will not be draggable');
    }
    
    this.active = true;
    
    console.log('Level Editor initialized');
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
    
    // Hide draggable panels
    if (this.draggablePanels) {
      this.draggablePanels.hide();
    }
  }
  
  /**
   * Handle mouse clicks in the editor
   */
  handleClick(mouseX, mouseY) {
    if (!this.active) return;
    
    // NEW: Let draggable panels handle clicks first
    if (this.draggablePanels) {
      const handled = this.draggablePanels.handleClick(mouseX, mouseY);
      if (handled) {
        return; // Panel consumed the click
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
        
        // Update undo/redo states
        this.toolbar.setEnabled('undo', this.editor.canUndo());
        this.toolbar.setEnabled('redo', this.editor.canRedo());
        break;
        
      case 'fill':
        this.editor.selectMaterial(material);
        this.editor.fill(gridX, gridY);
        this.notifications.show(`Filled region with ${material}`);
        
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
        
      case 'undo':
        if (this.editor.canUndo()) {
          this.editor.undo();
          this.notifications.show('Undid last action');
          this.toolbar.setEnabled('undo', this.editor.canUndo());
          this.toolbar.setEnabled('redo', this.editor.canRedo());
        }
        break;
        
      case 'redo':
        if (this.editor.canRedo()) {
          this.editor.redo();
          this.notifications.show('Redid last action');
          this.toolbar.setEnabled('undo', this.editor.canUndo());
          this.toolbar.setEnabled('redo', this.editor.canRedo());
        }
        break;
    }
  }
  
  /**
   * Update editor state
   */
  update() {
    if (!this.active) return;
    
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
    
    // Render grid overlay
    if (this.showGrid && this.gridOverlay) {
      this.gridOverlay.render();
    }
    
    // NEW: Render draggable panels (replaces old hardcoded panel rendering)
    if (this.draggablePanels) {
      this.draggablePanels.render();
    }
    
    // Properties panel (right side)
    if (this.propertiesPanel) {
      const propsX = g_canvasX - 220;
      this.propertiesPanel.render(propsX, 10);
    }
    
    // Minimap (bottom right)
    if (this.showMinimap && this.minimap) {
      const minimapX = g_canvasX - 220;
      const minimapY = g_canvasY - 220;
      this.minimap.render(minimapX, minimapY);
    }
    
    // Notifications (bottom left, stacking upwards)
    if (this.notifications) {
      const notifX = 10;
      const notifY = g_canvasY - 10; // Bottom of screen
      this.notifications.render(notifX, notifY);
    }
    
    // Render dialogs if active
    if (this.saveDialog && this.saveDialog.isVisible()) {
      this.saveDialog.render();
    }
    
    if (this.loadDialog && this.loadDialog.isVisible()) {
      this.loadDialog.render();
    }
    
    // Render back button
    this.renderBackButton();
  }
  
  /**
   * Render a button to return to main menu
   */
  renderBackButton() {
    const btnW = 120;
    const btnH = 40;
    const btnX = g_canvasX - btnW - 10;
    const btnY = 10;
    
    // Check hover
    const isHovering = mouseX > btnX && mouseX < btnX + btnW && 
                       mouseY > btnY && mouseY < btnY + btnH;
    
    fill(isHovering ? color(220, 80, 80) : color(180, 50, 50));
    stroke(255);
    strokeWeight(2);
    rect(btnX, btnY, btnW, btnH, 5);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('Back to Menu', btnX + btnW / 2, btnY + btnH / 2);
    
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
    
    // Show save dialog
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
  
  /**
   * Load a terrain
   */
  load() {
    const storage = new LocalStorageManager('level_');
    const data = storage.load('current');
    
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
