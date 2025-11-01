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
    // this.brushControl = null; // REMOVED: Brush size now controlled via menu bar (Enhancement 9)
    this.eventEditor = null; // NEW: Event editor panel
    this.eventFlagLayer = null; // NEW: EventFlag collection manager
    this.minimap = null;
    this.propertiesPanel = null;
    this.gridOverlay = null;
    this.saveDialog = null;
    this.loadDialog = null;
    this.newMapDialog = null; // NEW: New map dimensions dialog
    this.notifications = null;
    this.levelEditorPanels = null; // NEW: Draggable panel integration
    this.fileMenuBar = null; // NEW: File menu bar for save/load/export
    this.selectionManager = null; // NEW: Rectangle selection for select tool
    this.hoverPreviewManager = null; // NEW: Hover preview for all tools
    this.sidebar = null; // NEW: Sidebar menu (wired from levelEditorPanels)
    this.entityPainter = null; // NEW: Entity Painter tool for placing ants/buildings/resources
    this.eventPropertyWindow = null; // NEW: Event property editor window
    
    // File management
    this.currentFilename = 'Untitled'; // Current filename (no extension)
    this.isModified = false; // Track if terrain has been modified
    this.isMenuOpen = false; // Track if menu dropdown is open
    
    // UI state
    this.showGrid = true;
    this.showMinimap = true;
    this.isDragging = false; // Track if user is actively dragging (paint/erase)
    
    // Camera for level editor
    this.editorCamera = null;
    
    // Cursor attachment for entity placement (sprites follow mouse)
    this._cursorAttachment = null;
    
    // Entity spawn data storage (for JSON export)
    this._entitySpawnData = [];
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
    
    // BUGFIX: Set g_activeMap for Level Editor terrain
    if (typeof window !== 'undefined') {
      window.g_activeMap = terrain;
    }
    
    // Create terrain editor
    this.editor = new TerrainEditor(terrain);
    
    // Create material palette (auto-populates from TERRAIN_MATERIALS_RANGED)
    this.palette = new MaterialPalette();
    
    // Load categories from config
    if (typeof fetch !== 'undefined') {
      fetch('config/material-categories.json')
        .then(response => response.json())
        .then(categoryConfig => {
          this.palette.loadCategories(categoryConfig);
        })
        .catch(error => {
          console.warn('Failed to load material categories:', error);
        });
    }
    
    this.palette.selectMaterial('grass'); // Default selection
    
    // Create toolbar with tools (starts in No Tool mode)
    this.toolbar = new ToolBar([
      { name: 'paint', icon: '🖌️', tooltip: 'Paint Tool' },
      { 
        name: 'eraser', 
        id: 'eraser',
        icon: '🧱', 
        tooltip: 'Eraser Tool', 
        shortcut: 'E',
        hasModes: true,
        modes: ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']
      },
      { name: 'fill', icon: '🪣', tooltip: 'Fill Tool' },
      { name: 'eyedropper', icon: '💧', tooltip: 'Pick Material' },
      { 
        name: 'select', 
        id: 'select',
        icon: '⬚', 
        tooltip: 'Select Region',
        hasModes: true,
        modes: ['PAINT', 'ENTITY', 'EVENT']
      },
      { name: 'entity_painter', icon: '🐜', tooltip: 'Entity Painter (Place Ants/Buildings/Resources)', shortcut: 'P' }
    ]);
    // No tool selected by default - user must explicitly choose a tool
    
    // Listen for tool changes to update brush size visibility
    this.toolbar.onToolChange = (newTool, oldTool) => {
      if (this.fileMenuBar && typeof this.fileMenuBar.updateBrushSizeVisibility === 'function') {
        this.fileMenuBar.updateBrushSizeVisibility(newTool);
      }
      
      // Update tool mode toggle (show modes for tools that have them)
      if (this.fileMenuBar && typeof this.fileMenuBar.updateToolModeToggle === 'function') {
        this.fileMenuBar.updateToolModeToggle(newTool);
      }
    };
    
    // REMOVED: BrushSizeControl - brush size now controlled via menu bar (Enhancement 9)
    // this.brushControl = new BrushSizeControl(1, 1, 99);
    
    // Create event editor panel
    this.eventEditor = new EventEditorPanel();
    this.eventEditor.initialize(); // Connect to EventManager
    
    // Create event flag layer for managing placed flags
    this.eventFlagLayer = new EventFlagLayer(terrain);
    
    // Create Entity Painter (for placing ants, buildings, resources)
    if (typeof EntityPainter !== 'undefined' && typeof EntityPalette !== 'undefined') {
      this.entityPalette = new EntityPalette(); // Store for panel access
      this.entityPainter = new EntityPainter(this.entityPalette);
      
      // Wire terrain and events references for eraser functionality
      this.entityPainter.terrain = this.terrain;
      this.entityPainter.events = this.eventFlagLayer; // EventFlagLayer instance
    }
    
    // Initialize panels BEFORE adding custom buttons (panels needs to exist first)
    this.levelEditorPanels = new LevelEditorPanels(this);
    this.levelEditorPanels.initialize();
    
    // Wire up sidebar instance from levelEditorPanels
    this.sidebar = this.levelEditorPanels && this.levelEditorPanels.sidebar ? this.levelEditorPanels.sidebar : null;
    
    // Add Events button to toolbar (toggles EventEditorPanel)
    this.toolbar.addButton({
      name: 'events',
      icon: '🚩',
      tooltip: 'Events (Toggle Events Panel)',
      group: 'panels',
      onClick: () => {
        if (this.levelEditorPanels) {
          this.levelEditorPanels.toggleEventsPanel();
        }
      }
    });
    
    // Add onClick handler to entity_painter tool (toggles EntityPalette panel)
    if (this.toolbar.tools && this.toolbar.tools['entity_painter']) {
      this.toolbar.tools['entity_painter'].onClick = () => {
        if (this.fileMenuBar) {
          // Use FileMenuBar to toggle panel (ensures menu state syncs)
          this.fileMenuBar._handleTogglePanel('entity-painter');
        }
      };
    }
    
    // Create minimap
    this.minimap = new MiniMap(terrain, 200, 200);
    
    // Create properties panel
    this.propertiesPanel = new PropertiesPanel();
    this.propertiesPanel.setTerrain(terrain);
    this.propertiesPanel.setEditor(this.editor);
    
    // Create grid overlay - use DynamicGridOverlay for SparseTerrain, regular GridOverlay otherwise
    const TILE_SIZE = 32; // Standard tile size
    if (terrain.getAllTiles && typeof terrain.getAllTiles === 'function') {
      // SparseTerrain - use DynamicGridOverlay
      // Constructor: (terrain, tileSize, bufferSize)
      this.gridOverlay = new DynamicGridOverlay(terrain, TILE_SIZE, 2); // 32px tiles, 2-tile buffer
    } else {
      // Legacy terrain - use GridOverlay
      this.gridOverlay = new GridOverlay(TILE_SIZE, terrain.width, terrain.height);
    }
    
    // Create map boundary overlay
    if (typeof MapBoundaryOverlay !== 'undefined') {
      this.mapBoundaryOverlay = new MapBoundaryOverlay(terrain);
    }
    
    // Create save/load dialogs
    this.saveDialog = new SaveDialog();
    this.loadDialog = new LoadDialog();
    this.newMapDialog = new NewMapDialog();
    
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
    
    // Wire up new map dialog callbacks
    this.newMapDialog.onConfirm = (width, height) => {
      this._createNewTerrain(width, height);
      this.newMapDialog.hide();
    };
    this.newMapDialog.onCancel = () => {
      this.newMapDialog.hide();
    };
    
    // Create notification manager
    this.notifications = new NotificationManager();
    
    // Create file menu bar for save/load/export operations
    this.fileMenuBar = new FileMenuBar();
    this.fileMenuBar.setLevelEditor(this);
    
    // Set initial brush size visibility (paint tool is selected by default)
    if (this.fileMenuBar && typeof this.fileMenuBar.updateBrushSizeVisibility === 'function') {
      this.fileMenuBar.updateBrushSizeVisibility('paint');
    }
    
    // NEW: Initialize selection manager for select tool
    this.selectionManager = new SelectionManager();
    
    // NEW: Initialize hover preview manager for all tools
    this.hoverPreviewManager = new HoverPreviewManager();
    
    // NEW: Setup shortcut context for ShortcutManager
    this._setupShortcutContext();
    this._registerShortcuts();
    
    // Setup camera for editor
    this.editorCamera = cameraManager;
    
    // levelEditorPanels already initialized earlier (before adding Events button)
    
    this.active = true;
    
    logVerbose('Level Editor initialized');
    return true;
  }
  
  /**
   * Activate the level editor
   */
  activate() {
    if (!this.terrain) {
      // Create a new terrain for editing (sparse terrain for lazy loading)
      if (typeof SparseTerrain !== 'undefined') {
        this.terrain = new SparseTerrain(32, 'dirt');
      } else {
        const chunksX = 10;
        const chunksY = 10;
        this.terrain = new gridTerrain(chunksX, chunksY);
      }
      this.initialize(this.terrain);
    }
    
    this.active = true;
    GameState.setState('LEVEL_EDITOR');
    
    // Show draggable panels
    if (this.levelEditorPanels) {
      this.levelEditorPanels.show();
    }
  }
  
  /**
   * Deactivate the level editor
   */
  deactivate() {
    this.active = false;
    this.levelEditorPanels.hide();
  }
  
  // ========================================
  // Cursor Attachment System (Entity Placement)
  // ========================================
  
  /**
   * Attach a single entity template to the cursor
   * @param {string} templateId - Entity template ID
   * @param {Object} properties - Entity properties
   */
  attachToMouseSingle(templateId, properties) {
    this._cursorAttachment = {
      type: 'single',
      templateId: templateId,
      properties: properties || {},
      active: true
    };
  }
  
  /**
   * Attach an entity group to the cursor
   * @param {Array} entities - Array of entity objects with baseTemplateId, position, properties
   */
  attachToMouseGroup(entities) {
    this._cursorAttachment = {
      type: 'group',
      entities: entities || [],
      active: true
    };
  }
  
  /**
   * Get current cursor attachment
   * @returns {Object|null} Attachment object or null
   */
  getCursorAttachment() {
    return this._cursorAttachment;
  }
  
  /**
   * Clear cursor attachment (cancel placement)
   */
  clearCursorAttachment() {
    this._cursorAttachment = null;
  }
  
  /**
   * Handle grid click for entity placement
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @param {boolean} shiftPressed - Whether shift key is pressed
   * @returns {boolean} True if click was handled, false otherwise
   */
  handleGridClick(gridX, gridY, shiftPressed = false) {
    if (!this._cursorAttachment || !this._cursorAttachment.active) {
      return false;
    }
    
    if (this._cursorAttachment.type === 'group') {
      this._placeGroup(gridX, gridY, this._cursorAttachment.entities);
    } else {
      this._placeSingleEntity(gridX, gridY, this._cursorAttachment.templateId, this._cursorAttachment.properties);
    }
    
    // Only clear attachment if shift is NOT pressed (allows multiple placements)
    if (!shiftPressed) {
      this.clearCursorAttachment();
    }
    
    return true;
  }
  
  /**
   * Place a single entity on the grid
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @param {string} templateId - Entity template ID
   * @param {Object} properties - Entity properties
   * @private
   */
  _placeSingleEntity(gridX, gridY, templateId, properties) {
    // Get template to merge properties
    const template = this.entityPalette?._findTemplateById(templateId);
    if (!template) {
      console.warn(`[LevelEditor] Template not found: ${templateId}`);
      return;
    }
    
    // Create spawn entry with merged properties
    const spawnEntry = {
      id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: templateId,
      gridX: gridX,
      gridY: gridY,
      properties: { ...(template.properties || {}), ...(properties || {}) }
    };
    
    this._entitySpawnData.push(spawnEntry);
    console.log(`✅ [LevelEditor] Stored spawn data for ${templateId} at grid (${gridX}, ${gridY})`, spawnEntry);
  }
  
  /**
   * Place an entity group on the grid
   * @param {number} gridX - Grid X coordinate (anchor point)
   * @param {number} gridY - Grid Y coordinate (anchor point)
   * @param {Array} entities - Array of entity objects with offsets
   * @private
   */
  _placeGroup(gridX, gridY, entities) {
    // TODO: Actual group placement logic
    console.log(`Placing entity group at (${gridX}, ${gridY}) with ${entities.length} entities`);
    
    // Place each entity with offset from anchor point
    entities.forEach(entityData => {
      const finalX = gridX + (entityData.position ? entityData.position.x : 0);
      const finalY = gridY + (entityData.position ? entityData.position.y : 0);
      this._placeSingleEntity(finalX, finalY, entityData.baseTemplateId, entityData.properties);
    });
  }
  
  /**
   * Render cursor attachment (sprites following mouse)
   * Called during Level Editor render loop
   */
  renderCursorAttachment() {
    if (!this._cursorAttachment || !this._cursorAttachment.active) {
      return;
    }
    
    // Get mouse position in grid coordinates
    const TILE_SIZE = typeof window !== 'undefined' && window.TILE_SIZE ? window.TILE_SIZE : 32;
    const mouseGridX = Math.floor((typeof mouseX !== 'undefined' ? mouseX : 0) / TILE_SIZE);
    const mouseGridY = Math.floor((typeof mouseY !== 'undefined' ? mouseY : 0) / TILE_SIZE);
    
    if (typeof push === 'undefined') return;
    
    push();
    
    // Render with transparency to show it's a preview
    if (typeof tint !== 'undefined') {
      tint(255, 255, 255, 180); // 70% opacity
    }
    
    if (this._cursorAttachment.type === 'group') {
      // Render group with offsets
      this._cursorAttachment.entities.forEach(entityData => {
        const drawX = (mouseGridX + (entityData.position ? entityData.position.x : 0)) * TILE_SIZE;
        const drawY = (mouseGridY + (entityData.position ? entityData.position.y : 0)) * TILE_SIZE;
        this._renderEntitySprite(entityData.baseTemplateId, drawX, drawY);
      });
    } else {
      // Render single entity
      const drawX = mouseGridX * TILE_SIZE;
      const drawY = mouseGridY * TILE_SIZE;
      this._renderEntitySprite(this._cursorAttachment.templateId, drawX, drawY);
    }
    
    pop();
  }
  
  /**
   * Render an entity sprite at the given position
   * @param {string} templateId - Entity template ID
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @private
   */
  _renderEntitySprite(templateId, x, y) {
    // Get template from EntityPalette
    const template = this.entityPalette ? this.entityPalette._findTemplateById(templateId) : null;
    
    if (!template) {
      // Fallback: render placeholder rect
      if (typeof fill !== 'undefined') {
        fill(100, 100, 255, 180);
        rect(x, y, 32, 32);
      }
      return;
    }
    
    // Try to get cached image
    const img = template.image && this.entityPalette ? this.entityPalette._imageCache.get(template.image) : null;
    
    if (img && img.width > 0 && typeof image !== 'undefined') {
      // Render sprite image
      imageMode(typeof CORNER !== 'undefined' ? CORNER : 'CORNER');
      image(img, x, y, 32, 32);
    } else {
      // Fallback: render placeholder rect
      if (typeof fill !== 'undefined') {
        fill(100, 100, 255, 180);
        rect(x, y, 32, 32);
      }
    }
  }
  
  /**
   * Setup shortcut context for ShortcutManager
   * @private
   */
  _setupShortcutContext() {
    this._shortcutContext = {
      getCurrentTool: () => this.toolbar ? this.toolbar.getSelectedTool() : null,
      getBrushSize: () => {
        if (this.fileMenuBar && this.fileMenuBar.brushSizeModule) {
          return this.fileMenuBar.brushSizeModule.getSize();
        }
        if (this.editor && typeof this.editor.getBrushSize === 'function') {
          return this.editor.getBrushSize();
        }
        return 1;
      },
      setBrushSize: (size) => {
        // Update menu bar brush size module
        if (this.fileMenuBar && this.fileMenuBar.brushSizeModule) {
          this.fileMenuBar.brushSizeModule.setSize(size);
        }
        // Update terrain editor
        if (this.editor && typeof this.editor.setBrushSize === 'function') {
          this.editor.setBrushSize(size);
        }
      },
      refreshHoverPreview: () => {
        // Re-trigger hover preview with last known mouse position
        if (this._lastHoverX !== undefined && this._lastHoverY !== undefined) {
          this.handleHover(this._lastHoverX, this._lastHoverY);
          this._hoverRecalledAfterSizeChange = true; // Flag for testing
        }
      }
    };
  }
  
  /**
   * Register shortcuts with ShortcutManager
   * @private
   */
  _registerShortcuts() {
    if (typeof ShortcutManager === 'undefined') {
      console.warn('ShortcutManager not available - shortcuts disabled');
      return;
    }
    
    // Shift+Scroll Up: Increase brush size (paint and eraser)
    ShortcutManager.register({
      id: 'leveleditor-brush-size-increase',
      trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
      tools: ['paint', 'eraser'],
      action: (context) => {
        const currentSize = context.getBrushSize();
        const newSize = Math.min(currentSize + 1, 99);
        context.setBrushSize(newSize);
        context.refreshHoverPreview(); // Immediately update cursor preview
      }
    });
    
    // Shift+Scroll Down: Decrease brush size (paint and eraser)
    ShortcutManager.register({
      id: 'leveleditor-brush-size-decrease',
      trigger: { modifier: 'shift', event: 'mousewheel', direction: 'down' },
      tools: ['paint', 'eraser'],
      action: (context) => {
        const currentSize = context.getBrushSize();
        const newSize = Math.max(currentSize - 1, 1);
        context.setBrushSize(newSize);
        context.refreshHoverPreview(); // Immediately update cursor preview
      }
    });
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
    
    // Update file menu bar hover effects
    if (this.fileMenuBar && typeof this.fileMenuBar.handleMouseMove === 'function') {
      this.fileMenuBar.handleMouseMove(mouseX, mouseY);
    }
    
    // Check if mouse is over menu bar - disable hover preview
    if (this.fileMenuBar && this.fileMenuBar.containsPoint(mouseX, mouseY)) {
      // Disable hover preview when over menu bar
      if (this.hoverPreviewManager && typeof this.hoverPreviewManager.clearHover === 'function') {
        this.hoverPreviewManager.clearHover();
      }
      return;
    }
    
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
   * @param {number} mouseX - Mouse X position (optional, uses global if not provided)
   * @param {number} mouseY - Mouse Y position (optional, uses global if not provided)
   * @returns {boolean} True if event was handled, false otherwise
   */
  handleMouseWheel(event, shiftKey, mouseX, mouseY) {
    if (!this.active) return false;
    if (!event) return false; // Null check
    
    // Use global mouse position if not provided
    if (mouseX === undefined && typeof window !== 'undefined') mouseX = window.mouseX;
    if (mouseY === undefined && typeof window !== 'undefined') mouseY = window.mouseY;
    
    // Check sidebar delegation FIRST (before shift key check)
    // Sidebar handles scrolling even without shift key
    if (this.levelEditorPanels && this.levelEditorPanels.panels && this.levelEditorPanels.panels.sidebar) {
      const sidebarPanel = this.levelEditorPanels.panels.sidebar;
      
      // Only delegate if sidebar is visible and not minimized
      if (sidebarPanel.state && sidebarPanel.state.visible && !sidebarPanel.state.minimized && this.sidebar) {
        const pos = sidebarPanel.state.position;
        // Get size from Sidebar dimensions or use default
        const width = this.sidebar.width || 250;
        const height = this.sidebar.height || 600;
        
        // Check if mouse is over sidebar
        if (mouseX >= pos.x && mouseX <= pos.x + width &&
            mouseY >= pos.y && mouseY <= pos.y + height) {
          // Delegate to sidebar
          const delta = event.deltaY || event.delta || 0;
          const handled = this.sidebar.handleMouseWheel(delta, mouseX, mouseY);
          if (handled) return true; // Sidebar consumed the event
        }
      }
    }
    
    // Check Entity Palette delegation (EntityPalette scrolling)
    if (this.levelEditorPanels && this.levelEditorPanels.handleMouseWheel) {
      const delta = event.deltaY || event.delta || 0;
      const handled = this.levelEditorPanels.handleMouseWheel(delta, mouseX, mouseY);
      if (handled) return true; // Panel consumed the event
    }
    
    // Check materials panel delegation (MaterialPalette scrolling)
    if (this.levelEditorPanels && this.levelEditorPanels.panels && this.levelEditorPanels.panels.materials) {
      const materialsPanel = this.levelEditorPanels.panels.materials;
      
      // Only delegate if materials panel is visible and not minimized
      if (materialsPanel.state && materialsPanel.state.visible && !materialsPanel.state.minimized && this.palette) {
        const pos = materialsPanel.state.position;
        // Get size from MaterialPalette dimensions or use default
        const width = this.palette.width || 400;
        const height = this.palette.height || 500;
        
        // Check if mouse is over materials panel
        if (mouseX >= pos.x && mouseX <= pos.x + width &&
            mouseY >= pos.y && mouseY <= pos.y + height) {
          // Delegate to MaterialPalette
          const delta = event.deltaY || event.delta || 0;
          this.palette.handleMouseWheel(delta);
          return true; // MaterialPalette consumed the event
        }
      }
    }
    
    // Delegate to ShortcutManager for registered shortcuts
    if (shiftKey && typeof ShortcutManager !== 'undefined') {
      const modifiers = { shift: shiftKey, ctrl: false, alt: false };
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, this._shortcutContext);
      if (handled) return true;
    }
    
    return false;
  }
  
  /**
   * Open the event property window for editing a trigger
   * @param {Object} trigger - The trigger to edit
   */
  openEventPropertyWindow(trigger) {
    if (!trigger) {
      console.warn('[LevelEditor] Cannot open property window without trigger');
      return;
    }
    
    // Close existing window if open
    if (this.eventPropertyWindow && this.eventPropertyWindow.isVisible) {
      this.closeEventPropertyWindow();
    }
    
    // Create new window (positioned at a reasonable screen location)
    if (typeof EventPropertyWindow !== 'undefined') {
      this.eventPropertyWindow = new EventPropertyWindow(
        50,  // x
        50,  // y
        300, // width
        400, // height
        trigger,
        window.eventManager // Use global EventManager instance
      );
      
      console.log('[LevelEditor] Opened property window for trigger:', trigger.id);
    } else {
      console.error('[LevelEditor] EventPropertyWindow class not available');
    }
  }
  
  /**
   * Close the event property window
   */
  closeEventPropertyWindow() {
    if (this.eventPropertyWindow) {
      this.eventPropertyWindow.close();
      this.eventPropertyWindow = null;
      console.log('[LevelEditor] Closed property window');
    }
  }
  
  /**
   * Handle mouse clicks in the editor
   */
  handleClick(mouseX, mouseY) {
    console.log('[LevelEditor.handleClick] Called with:', { mouseX, mouseY, active: this.active });
    if (!this.active) {
      console.log('[LevelEditor.handleClick] Not active, returning');
      return;
    }
    
    // PRIORITY 1: Check if dialogs are open and block ALL terrain interaction
    if (this.saveDialog && this.saveDialog.isVisible()) {
      const consumed = this.saveDialog.handleClick(mouseX, mouseY);
      return; // Dialog is visible - block terrain interaction regardless of consumption
    }
    
    if (this.loadDialog && this.loadDialog.isVisible()) {
      const consumed = this.loadDialog.handleClick(mouseX, mouseY);
      return; // Dialog is visible - block terrain interaction regardless of consumption
    }
    
    if (this.newMapDialog && this.newMapDialog.isVisible()) {
      const consumed = this.newMapDialog.handleClick(mouseX, mouseY);
      return; // Dialog is visible - block terrain interaction regardless of consumption
    }
    
    // PRIORITY 1.5: Check sidebar click delegation (before menu bar)
    if (this.levelEditorPanels && this.levelEditorPanels.panels && this.levelEditorPanels.panels.sidebar) {
      const sidebarPanel = this.levelEditorPanels.panels.sidebar;
      
      // Only delegate if sidebar is visible and not minimized
      if (sidebarPanel.state && sidebarPanel.state.visible && this.sidebar) {
        const pos = sidebarPanel.getPosition();
        const size = sidebarPanel.getSize();
        
        // Check if mouse is over sidebar
        if (mouseX >= pos.x && mouseX <= pos.x + size.width &&
            mouseY >= pos.y && mouseY <= pos.y + size.height) {
          // Delegate to sidebar
          const handled = this.sidebar.handleClick(mouseX, mouseY, pos.x, pos.y);
          if (handled) return true; // Sidebar consumed the event
        }
      }
    }
    
    // PRIORITY 2: Check if file menu bar handled the click (ALWAYS check, even if menu open)
    if (this.fileMenuBar) {
      const handled = this.fileMenuBar.handleClick(mouseX, mouseY);
      if (handled) {
        return; // Menu bar consumed the click (could be menu switching or closing)
      }
    }
    
    // PRIORITY 3: If menu is open but click wasn't handled by menu bar, block terrain interaction
    // (User clicked on canvas while menu was open - this closes menu but doesn't paint)
    if (this.isMenuOpen) {
      return false; // Menu was open, click consumed (terrain blocked)
    }
    
    // PRIORITY 3.5: Check if mouse is over menu bar - block terrain painting
    // (Even if menu bar didn't consume the click, we don't want to paint over the menu bar area)
    if (this.fileMenuBar && this.fileMenuBar.containsPoint(mouseX, mouseY)) {
      return; // Mouse over menu bar, don't paint terrain
    }
    
    // PRIORITY 4: Let draggable panels handle content clicks (buttons, swatches, etc.)
    console.log('[LevelEditor.handleClick] Checking levelEditorPanels...', { hasPanels: !!this.levelEditorPanels });
    if (this.levelEditorPanels) {
      console.log('[LevelEditor.handleClick] Calling levelEditorPanels.handleClick...');
      const handled = this.levelEditorPanels.handleClick(mouseX, mouseY);
      console.log('[LevelEditor.handleClick] Panel handled:', handled);
      if (handled) {
        return; // Panel content consumed the click - STOP processing
      }
    }
    
    // PRIORITY 5: Check if draggable panel manager consumed the event (for dragging/title bar)
    if (typeof draggablePanelManager !== 'undefined' && draggablePanelManager) {
      const panelConsumed = draggablePanelManager.handleMouseEvents(mouseX, mouseY, true);
      if (panelConsumed) {
        return; // Panel consumed the click - don't paint terrain
      }
    }
    
    // PRIORITY 5.5: Check if event property window is open and handle its clicks
    if (this.eventPropertyWindow && this.eventPropertyWindow.isVisible) {
      // Convert screen to relative coordinates
      const relX = mouseX - this.eventPropertyWindow.x;
      const relY = mouseY - this.eventPropertyWindow.y;
      
      // Check if click is inside window
      if (this.eventPropertyWindow.containsPoint(mouseX, mouseY)) {
        this.eventPropertyWindow.handleClick(relX, relY);
        return; // Property window consumed the click
      }
    }
    
    // PRIORITY 5.6: Check if event flag was clicked (opens property window)
    if (this.eventFlagLayer && typeof EventFlagRenderer !== 'undefined') {
      // Create EventFlagRenderer instance if not exists
      if (!this._eventFlagRenderer) {
        this._eventFlagRenderer = new EventFlagRenderer();
      }
      
      // Check if any flag was clicked (pass screen coords and camera)
      const clickedTrigger = this._eventFlagRenderer.checkFlagClick(mouseX, mouseY, this.editorCamera);
      
      if (clickedTrigger) {
        console.log('[LevelEditor] Flag clicked, opening property window:', clickedTrigger.id);
        this.openEventPropertyWindow(clickedTrigger);
        return; // Flag click consumed
      }
    }
    
    // PRIORITY 6: Check if cursor attachment is active (entity placement mode)
    if (this._cursorAttachment && this._cursorAttachment.active) {
      // Convert screen coordinates to world coordinates
      const worldCoords = this.convertScreenToWorld(mouseX, mouseY);
      const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
      const gridX = Math.floor(worldCoords.worldX / tileSize);
      const gridY = Math.floor(worldCoords.worldY / tileSize);
      
      // Check if shift is pressed (keyIsDown is a p5.js function)
      const shiftPressed = typeof keyIsDown !== 'undefined' && keyIsDown(SHIFT);
      
      // Handle entity placement
      const placed = this.handleGridClick(gridX, gridY, shiftPressed);
      if (placed) {
        console.log(`✅ [ENTITY] Placed entity at grid (${gridX}, ${gridY}), shift=${shiftPressed}`);
        return; // Entity placement handled, don't process terrain tools
      }
    }
    
    // If no UI was clicked, handle terrain editing
    const tool = this.toolbar.getSelectedTool();
    
    // CRITICAL: Early return if no tool active (No Tool mode)
    if (tool === null) {
      console.log('🚫 [NO TOOL] No tool active - click ignored');
      return; // Do nothing, prevent terrain edits
    }
    
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
        // Mark as dragging for darker highlight
        this.isDragging = true;
        
        const brushSize = this.fileMenuBar && this.fileMenuBar.brushSizeModule ? 
          this.fileMenuBar.brushSizeModule.getSize() : 1;
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
        
      case 'eraser':
        // Mark as dragging for darker highlight
        this.isDragging = true;
        
        const eraserBrushSize = this.fileMenuBar && this.fileMenuBar.brushSizeModule ? 
          this.fileMenuBar.brushSizeModule.getSize() : 1;
        
        // Erase terrain tiles
        const erasedCount = this.editor.erase(gridX, gridY, eraserBrushSize);
        
        // Also erase entities at this position (using EntityPainter)
        if (this.entityPainter && this.entityPainter.handleErase) {
          const worldX = gridX * (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32);
          const worldY = gridY * (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32);
          this.entityPainter.handleErase(worldX, worldY);
        }
        
        if (erasedCount > 0) {
          this.notifications.show(`Erased ${erasedCount} tile(s)`);
        } else {
          this.notifications.show('Nothing to erase');
        }
        
        // Notify minimap of terrain edit (debounced cache invalidation)
        if (this.minimap && this.minimap.notifyTerrainEditStart) {
          this.minimap.notifyTerrainEditStart();
        }
        
        // Update undo/redo states
        this.toolbar.setEnabled('undo', this.editor.canUndo());
        this.toolbar.setEnabled('redo', this.editor.canRedo());
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
        
      case 'entity_painter':
        // Place entity or group at grid coordinates
        if (this.entityPainter) {
          const template = this.entityPainter.palette.getSelectedTemplate();
          
          // Check if template is a group
          if (template && template.isGroup && template.entities && typeof GroupPlacer !== 'undefined') {
            // Use GroupPlacer for group placement
            const placedEntities = GroupPlacer.placeGroup(gridX, gridY, template);
            
            if (placedEntities && placedEntities.length > 0) {
              // Add all entities to entityPainter tracking
              placedEntities.forEach(entity => {
                this.entityPainter.placedEntities.push(entity);
                // Register with spatial grid if available
                if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
                  spatialGridManager.addEntity(entity);
                }
              });
              
              const groupName = template.customName || 'Group';
              this.notifications.show(`Placed ${groupName} (${placedEntities.length} entities) at (${gridX}, ${gridY})`);
              this.isModified = true;
            }
          } else {
            // Single entity placement
            const entity = this.entityPainter.placeEntity(gridX, gridY);
            if (entity) {
              const templateName = template ? (template.name || template.customName) : 'Entity';
              this.notifications.show(`Placed ${templateName} at (${gridX}, ${gridY})`);
              this.isModified = true;
            } else {
              this.notifications.show('Select an entity from the palette first', 'warning');
            }
          }
        }
        break;
    }
    
    return false; // No UI consumed the click
  }
  
  /**
   * Handle double-click events in the editor
   * Delegates to panels for special actions (e.g., placement mode)
   */
  handleDoubleClick(mouseX, mouseY) {
    if (!this.active) return;
    
    // PRIORITY 1: Check if dialogs are open and block interaction
    if ((this.saveDialog && this.saveDialog.isVisible()) || 
        (this.loadDialog && this.loadDialog.isVisible()) ||
        (this.newMapDialog && this.newMapDialog.isVisible())) {
      return; // Dialog is visible - block interaction
    }
    
    // PRIORITY 2: Check if file menu bar is open
    if (this.isMenuOpen) {
      return; // Menu is open, block interaction
    }
    
    // PRIORITY 3: Let draggable panels handle double-click events
    if (this.levelEditorPanels) {
      const handled = this.levelEditorPanels.handleDoubleClick(mouseX, mouseY);
      if (handled) {
        return; // Panel consumed the double-click
      }
    }
    
    // PRIORITY 4: Check for entity at mouse position (for property editing)
    const tool = this.toolbar.getSelectedTool();
    if (tool === 'entity_painter' && this.entityPainter) {
      // Convert screen to world coordinates
      const worldCoords = this.convertScreenToWorld(mouseX, mouseY);
      
      // Find entity near click position (32px radius)
      const entity = this.entityPainter.getEntityAtPosition(worldCoords.worldX, worldCoords.worldY, 32);
      
      if (entity && typeof EntityPropertyEditor !== 'undefined') {
        // Open property editor for this entity
        if (!this.entityPropertyEditor) {
          this.entityPropertyEditor = new EntityPropertyEditor();
        }
        this.entityPropertyEditor.open(entity);
        this.notifications.show('Double-click to edit entity properties');
        return; // Consumed
      }
    }
    
    // No UI consumed the double-click, default behavior
  }
  
  /**
   * Handle mouse dragging in the editor (for continuous painting)
   */
  handleDrag(mouseX, mouseY) {
    if (!this.active) return;
    
    // PRIORITY 0: Check if dialogs are open - block ALL terrain interaction
    if ((this.saveDialog && this.saveDialog.isVisible()) || 
        (this.loadDialog && this.loadDialog.isVisible()) ||
        (this.newMapDialog && this.newMapDialog.isVisible())) {
      return; // Dialog is visible, block terrain interaction
    }
    
    // FIRST: Check if mouse is over menu bar - block ALL terrain interaction
    if (this.fileMenuBar && this.fileMenuBar.containsPoint(mouseX, mouseY)) {
      return; // Don't paint over menu bar
    }
    
    // SECOND: Block terrain interaction if menu is open
    if (this.isMenuOpen) {
      return; // Menu is open, don't paint terrain
    }
    
    // THIRD: Check if EventEditorPanel is dragging an event for placement
    if (this.eventEditor && this.eventEditor.isDragging()) {
      this.eventEditor.updateDragPosition(mouseX, mouseY);
      return; // Event drag in progress, don't do terrain editing
    }
    
    // FOURTH: Check if draggable panel manager consumed the mouse event
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
    
    // Paint and eraser tools support continuous dragging
    if (tool === 'paint') {
      // Mark as dragging for darker highlight
      this.isDragging = true;
      
      // Update hover preview to follow mouse during drag
      this.handleHover(mouseX, mouseY);
      
      // Paint at current mouse position
      const material = this.palette.getSelectedMaterial();
      
      const brushSize = this.fileMenuBar && this.fileMenuBar.brushSizeModule ? 
        this.fileMenuBar.brushSizeModule.getSize() : 1;
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
    } else if (tool === 'eraser') {
      // Mark as dragging for darker highlight
      this.isDragging = true;
      
      // Update hover preview to follow mouse during drag
      this.handleHover(mouseX, mouseY);
      
      // Erase at current mouse position
      const brushSize = this.fileMenuBar && this.fileMenuBar.brushSizeModule ? 
        this.fileMenuBar.brushSizeModule.getSize() : 1;
      
      const erasedCount = this.editor.erase(gridX, gridY, brushSize);
      
      // Notify minimap of terrain edit (debounced cache invalidation)
      if (this.minimap && this.minimap.scheduleInvalidation) {
        this.minimap.scheduleInvalidation();
      }
      
      // Update undo/redo buttons
      this.toolbar.setEnabled('undo', this.editor.canUndo());
      this.toolbar.setEnabled('redo', this.editor.canRedo());
    }
  }
  
  /**
   * Handle mouse release (end of drag operation)
   */
  handleMouseRelease(mouseX, mouseY) {
    if (!this.active) return;
    
    // Reset dragging flag to restore normal highlight opacity
    this.isDragging = false;
    
    // Priority 1: Complete placement if in placement mode
    if (this.eventEditor && this.eventEditor.isInPlacementMode && this.eventEditor.isInPlacementMode()) {
      // Convert screen to world coordinates
      const worldCoords = this.convertScreenToWorld(mouseX, mouseY);
      const worldX = worldCoords.x !== undefined ? worldCoords.x : worldCoords.worldX;
      const worldY = worldCoords.y !== undefined ? worldCoords.y : worldCoords.worldY;
      
      // Complete placement operation
      const result = this.eventEditor.completePlacement(worldX, worldY);
      
      if (result.success) {
        logNormal(`Event placed at (${worldX}, ${worldY}) for event: ${result.eventId}`);
      }
      return; // Don't process other tools
    }
    
    // Priority 2: Complete drag if EventEditorPanel is dragging
    if (this.eventEditor && this.eventEditor.isDragging()) {
      // Convert screen to world coordinates
      const worldCoords = this.convertScreenToWorld(mouseX, mouseY);
      
      // Handle both {x, y} and {worldX, worldY} formats
      const worldX = worldCoords.x !== undefined ? worldCoords.x : worldCoords.worldX;
      const worldY = worldCoords.y !== undefined ? worldCoords.y : worldCoords.worldY;
      
      // Complete drag operation
      const result = this.eventEditor.completeDrag(worldX, worldY);
      
      // Create and add EventFlag if successful
      if (result.success && result.flagConfig && this.eventFlagLayer) {
        const flag = new EventFlag(result.flagConfig);
        this.eventFlagLayer.addFlag(flag);
        logNormal(`EventFlag placed at (${worldX}, ${worldY}) for event: ${result.eventId}`);
      }
      return; // Don't process other tools
    }
    
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
    
    // Store last hover position for refreshHoverPreview()
    this._lastHoverX = mouseX;
    this._lastHoverY = mouseY;
    
    // Don't show hover preview if hovering over menu bar
    if (this.fileMenuBar && this.fileMenuBar.containsPoint(mouseX, mouseY)) {
      this.hoverPreviewManager.clearHover();
      return;
    }
    
    // Don't show hover preview if menu is open
    if (this.isMenuOpen) {
      this.hoverPreviewManager.clearHover();
      return;
    }
    
    const tool = this.toolbar.getSelectedTool();
    
    // Convert screen coordinates to world coordinates (accounts for camera)
    const worldCoords = this.convertScreenToWorld(mouseX, mouseY);
    const tileSize = this.terrain.tileSize || TILE_SIZE || 32;
    const gridX = Math.floor(worldCoords.worldX / tileSize);
    const gridY = Math.floor(worldCoords.worldY / tileSize);
    
    // Update hover preview for current tool
    const brushSize = this.fileMenuBar && this.fileMenuBar.brushSizeModule ? 
      this.fileMenuBar.brushSizeModule.getSize() : 1;
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
   * Handle mouse moved (for drag operations and hover preview)
   * @param {number} mouseX - Screen X coordinate
   * @param {number} mouseY - Screen Y coordinate
   */
  handleMouseMoved(mouseX, mouseY) {
    if (!this.active) return;
    
    // Update drag position if EventEditorPanel is dragging
    if (this.eventEditor && this.eventEditor.isDragging()) {
      this.eventEditor.updateDragPosition(mouseX, mouseY);
    }
    
    // Update placement cursor if in placement mode
    if (this.eventEditor && this.eventEditor.isInPlacementMode && this.eventEditor.isInPlacementMode()) {
      this.eventEditor.updatePlacementCursor(mouseX, mouseY);
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
      // DynamicGridOverlay needs mouse position to show grid at hover
      if (this.gridOverlay.update && typeof this.gridOverlay.update === 'function') {
        // Convert screen mouse to world coordinates
        const worldCoords = this.convertScreenToWorld(mouseX, mouseY);
        const tileSize = this.terrain.tileSize || 32;
        const gridMouseX = Math.floor(worldCoords.worldX / tileSize);
        const gridMouseY = Math.floor(worldCoords.worldY / tileSize);
        
        // Update grid with mouse position
        this.gridOverlay.update({ x: gridMouseX, y: gridMouseY });
      }
      
      this.gridOverlay.render();
    }
    
    // Map boundary overlay (world space)
    if (this.mapBoundaryOverlay && this.mapBoundaryOverlay.visible) {
      this.mapBoundaryOverlay.render();
    }
    
    // Render placed entities (world space)
    if (this.entityPainter && this.entityPainter.placedEntities) {
      push();
      this.entityPainter.placedEntities.forEach(entity => {
        if (entity && entity.render && typeof entity.render === 'function') {
          entity.render();
        }
      });
      pop();
    }
    
    // Render entity spawn points (visual feedback for entity placement)
    this.renderEntitySpawnPoints();
    
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
    this.levelEditorPanels.render();
    
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
    if (this.newMapDialog && this.newMapDialog.isVisible()) { this.newMapDialog.render(); }
    
    // Render event property window if visible
    if (this.eventPropertyWindow && this.eventPropertyWindow.isVisible) {
      this.eventPropertyWindow.render();
    }
    
    // Render flag cursor if in placement mode
    if (this.eventEditor && this.eventEditor.renderPlacementCursor && typeof this.eventEditor.renderPlacementCursor === 'function') {
      this.eventEditor.renderPlacementCursor();
    }
    
    // CURSOR ATTACHMENT: Render entity sprites following cursor
    this.renderCursorAttachment();
    
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
    const tool = this.toolbar.getSelectedTool();
    
    // Tool-specific colors for better UX
    let r = 255, g = 255, b = 0; // Default: Yellow
    switch(tool) {
      case 'paint':
        r = 255; g = 255; b = 0; // Yellow
        break;
      case 'eraser':
        r = 255; g = 0; b = 0; // Red (destructive action)
        break;
      case 'fill':
        r = 100; g = 150; b = 255; // Blue
        break;
      case 'eyedropper':
        r = 255; g = 255; b = 255; // White
        break;
      case 'select':
        r = 100; g = 150; b = 255; // Blue (matches selection rectangle)
        break;
    }
    
    // Darker highlight when actively dragging (painting/erasing)
    const alpha = this.isDragging ? 150 : 80;
    
    push();
    noStroke();
    fill(r, g, b, alpha); // Semi-transparent overlay (darker when dragging)
    
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
   * Handle File → New (shows dialog for map dimensions)
   */
  handleFileNew() {
    // Check if terrain has been modified
    if (this.isModified) {
      const confirmed = confirm("Discard unsaved changes?");
      if (!confirmed) {
        return false; // User cancelled
      }
    }
    
    // Show new map dialog
    this.newMapDialog.show();
    return true;
  }
  
  /**
   * Create new terrain with specified dimensions
   * Called from NewMapDialog onConfirm callback
   * @param {number} width - Width in tiles
   * @param {number} height - Height in tiles
   * @private
   */
  _createNewTerrain(width, height) {
    console.log(`[LevelEditor] Creating new terrain:`, { width, height });
    
    const tileSize = 32; // Standard tile size
    
    // Create new blank terrain based on available terrain types
    if (typeof SparseTerrain !== 'undefined') {
      console.log(`[LevelEditor] Using SparseTerrain with maxMapSize:`, Math.max(width, height));
      // SparseTerrain uses maxMapSize option to set bounds limit
      const maxMapSize = Math.max(width, height); // Use larger dimension as limit
      this.terrain = new SparseTerrain(tileSize, 'dirt', { maxMapSize });
    } else if (typeof CustomTerrain !== 'undefined') {
      this.terrain = new CustomTerrain(width, height);
    } else {
      // gridTerrain uses chunk-based sizing, convert tile count to chunks
      const chunksX = Math.ceil(width / 16);
      const chunksY = Math.ceil(height / 16);
      this.terrain = new gridTerrain(chunksX, chunksY);
    }
    
    // Reinitialize editor components with new terrain
    this.editor = new TerrainEditor(this.terrain);
    this.minimap = new MiniMap(this.terrain, 200, 200);
    this.propertiesPanel.setTerrain(this.terrain);
    
    // Reset grid overlay to match new terrain type
    if (this.terrain.getAllTiles && typeof this.terrain.getAllTiles === 'function') {
      // Constructor: (terrain, tileSize, bufferSize)
      this.gridOverlay = new DynamicGridOverlay(this.terrain, tileSize, 2); // 32px tiles, 2-tile buffer
    } else {
      this.gridOverlay = new GridOverlay(tileSize, this.terrain.width, this.terrain.height);
    }
    
    // Update map boundary overlay with new terrain
    if (this.mapBoundaryOverlay) {
      this.mapBoundaryOverlay.updateTerrain(this.terrain);
    }
    
    // Reset filename to "Untitled"
    this.currentFilename = 'Untitled';
    
    // Clear undo/redo history
    if (this.editor && typeof this.editor.clearHistory === 'function') {
      this.editor.clearHistory();
    }
    
    // Reset modified flag
    this.isModified = false;
    
    this.notifications.show(`New ${width}x${height} terrain created`, 'info');
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
   * Build complete export data (terrain + entities)
   * @returns {Object} Complete level data for export
   * @private
   */
  _getExportData() {
    // Start with terrain data (or empty object if no terrain)
    const terrainData = this.terrain ? this.terrain.exportToJSON() : {};
    
    // Create a new object to avoid modifying original terrain data
    const data = { ...terrainData };
    
    // Add entity spawn data (always include, even if empty)
    data.entities = this._entitySpawnData || [];
    
    return data;
  }
  
  /**
   * Perform the actual export/download
   * @private
   */
  _performExport() {
    if (!this.terrain) return;
    
    // Get complete export data (terrain + entities)
    const data = this._getExportData();
    
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
    
    // Get complete export data (terrain + entities)
    const levelData = this._getExportData();
    
    // Check if using native dialogs
    if (this.saveDialog.useNativeDialogs) {
      // Use native browser save dialog
      this.saveDialog.saveWithNativeDialog(levelData, 'my_level.json');
      this.notifications.show('Level downloaded!', 'success');
    } else {
      // Use custom dialog UI
      this.saveDialog.show();
      this.saveDialog.setFilename('my_level');
      this.saveDialog.setFormat('json');
      
      // For now, save to localStorage
      const storage = new LocalStorageManager('level_');
      const saved = storage.save('current', levelData);
      
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
        // Import entities if present
        if (data.entities && this.entityPainter) {
          this.entityPainter.importFromJSON({ entities: data.entities });
        }
        
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
    
    // PRIORITY: Handle new map dialog keyboard input FIRST
    if (this.newMapDialog && this.newMapDialog.isVisible()) {
      const consumed = this.newMapDialog.handleKeyPress(key, keyCode);
      if (consumed) return;
    }
    
    // PRIORITY: Cancel event drag on Escape key
    if (key === 'Escape' || keyCode === 27) {
      // Cancel placement mode first (higher priority)
      if (this.eventEditor && this.eventEditor.isInPlacementMode && this.eventEditor.isInPlacementMode()) {
        this.eventEditor.cancelPlacement();
        logNormal('Event placement mode cancelled');
        return; // Don't process other Escape handlers
      }
      
      // Then cancel drag mode
      if (this.eventEditor && this.eventEditor.isDragging()) {
        this.eventEditor.cancelDrag();
        logNormal('Event drag cancelled');
        return; // Don't process other Escape handlers
      }
      
      // Then deselect tool (No Tool mode)
      if (this.toolbar && this.toolbar.hasActiveTool()) {
        this.toolbar.deselectTool();
        if (this.notifications) {
          this.notifications.show('Tool deselected (No Tool mode)');
        }
        logNormal('Tool deselected via ESC key');
        return; // Don't process other Escape handlers
      }
    }
    
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
    
    // THIRD: Check if MaterialPalette handles the key press (search bar input)
    if (this.palette && this.palette.handleKeyPress) {
      const consumed = this.palette.handleKeyPress(key, keyCode);
      if (consumed) {
        return; // MaterialPalette consumed the key press
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
      case 'b':
        if (this.mapBoundaryOverlay) {
          this.mapBoundaryOverlay.toggle();
          const isVisible = this.mapBoundaryOverlay.visible;
          this.notifications.show(`Map Boundary ${isVisible ? 'shown' : 'hidden'}`, 'info');
        }
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
  
  /**
   * Get all entity spawn data
   * @returns {Array} Array of spawn data entries
   */
  getEntitySpawnData() {
    return this._entitySpawnData;
  }
  
  /**
   * Clear all entity spawn data
   */
  clearEntitySpawnData() {
    this._entitySpawnData = [];
  }
  
  /**
   * Remove entity spawn data by ID
   * @param {string} id - Entity spawn data ID to remove
   */
  removeEntitySpawnData(id) {
    const index = this._entitySpawnData.findIndex(e => e.id === id);
    if (index !== -1) {
      this._entitySpawnData.splice(index, 1);
    }
  }
  
  /**
   * Render entity spawn points (visual feedback)
   * Shows semi-transparent sprites at spawn locations
   */
  renderEntitySpawnPoints() {
    if (!this.active) return;
    if (!this._entitySpawnData || this._entitySpawnData.length === 0) return;
    
    const TILE_SIZE = this.terrain?.tileSize || (typeof window !== 'undefined' && window.TILE_SIZE) || 32;
    
    if (typeof push === 'undefined') return;
    
    push();
    
    // Apply transparency for spawn point preview
    if (typeof tint !== 'undefined') {
      tint(255, 255, 255, 150); // 60% opacity
    }
    
    // Render each spawn point
    this._entitySpawnData.forEach(spawnData => {
      const worldX = spawnData.gridX * TILE_SIZE;
      const worldY = spawnData.gridY * TILE_SIZE;
      
      // Get template to render sprite
      const template = this.entityPalette?._findTemplateById(spawnData.templateId);
      
      if (template && template.image && this.entityPalette) {
        // Try to get cached image
        const img = this.entityPalette._imageCache?.get(template.image);
        
        if (img && img.width > 0 && typeof image !== 'undefined') {
          // Render sprite image
          if (typeof imageMode !== 'undefined') {
            imageMode(typeof CORNER !== 'undefined' ? CORNER : 'CORNER');
          }
          noSmooth();
          image(img, worldX, worldY, TILE_SIZE, TILE_SIZE);
        } else {
          // Fallback: render placeholder rect
          this._renderSpawnPointFallback(worldX, worldY, TILE_SIZE);
        }
      } else {
        // Fallback: render placeholder rect
        this._renderSpawnPointFallback(worldX, worldY, TILE_SIZE);
      }
    });
    
    if (typeof noTint !== 'undefined') {
      noTint();
    }
    
    pop();
  }
  
  /**
   * Render fallback placeholder for spawn point
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @param {number} size - Tile size
   * @private
   */
  _renderSpawnPointFallback(x, y, size) {
    if (typeof fill !== 'undefined') {
      fill(100, 200, 255, 150); // Light blue semi-transparent
    }
    if (typeof noStroke !== 'undefined') {
      noStroke();
    }
    if (typeof rect !== 'undefined') {
      rect(x, y, size, size);
    }
  }
}

// Create global instance
const levelEditor = new LevelEditor();

// Make globally available
if (typeof window !== 'undefined') {
  window.LevelEditor = LevelEditor; // Export class
  window.levelEditor = levelEditor; // Export instance
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelEditor;
  module.exports.levelEditor = levelEditor;
}
