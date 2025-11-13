/**
 * @fileoverview DraggablePanelManager - Complete draggable UI panel system
 */

/**
 * Comprehensive draggable panel management system with render integration.
 * 
 * **Features**: Panel lifecycle, render integration, game state visibility, button management
 * 
 * @class DraggablePanelManager
 */
class DraggablePanelManager {
  /**
   * Creates a new DraggablePanelManager instance
   */
  constructor() {
    // keep previous initialization
    this.panels = new Map();
    this.isInitialized = false;
  

    // Debug mode: Panel Train Mode (panels follow each other when dragged) 🚂
    this.debugMode = {
      panelTrainMode: false
    };
    
    // Track which panel is currently being dragged (for proper isolation)
    this.currentlyDragging = null;
    
    // Panel visibility by game state (from Integration class)
    // NOTE: 'combat' panel removed - Queen Powers now managed by QueenControlPanel (shows only when queen selected)
    this.stateVisibility = {
      'MENU': ['presentation-control', 'debug'],
      'PLAYING': ['ant_spawn', 'health_controls', 'debug', 'tasks','buildings',"resources", 'cheats', 'queen-powers-panel'],
      'PAUSED': ['ant_spawn', 'health_controls', 'debug'],
      'DEBUG_MENU': ['ant_spawn', 'health_controls', 'debug', 'cheats'],
      'GAME_OVER': ['stats', 'debug'],
      'KANBAN': ['presentation-kanban-transition', 'debug']
    };
    
    // Current game state for visibility management
    this.gameState = 'MENU';
  }

  /**
   * Initialize the panel manager and register with render pipeline
   * @returns {void}
   * @memberof DraggablePanelManager
   */
  initialize() {
    if (this.isInitialized) {
      console.warn('DraggablePanelManager already initialized');
      return;
    }

    // DISABLED FOR PRESENTATION
    this.createDefaultPanels();
    
    // Register with RenderLayerManager using addDrawableToLayer
    if (typeof RenderManager !== 'undefined' && RenderManager && typeof RenderManager.addDrawableToLayer === 'function') {
      // Bind the renderPanels method to this instance and add to UI_GAME layer (panels should render after base game UI)
      this._renderPanelsBound = this.renderPanels.bind(this);
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, this._renderPanelsBound);
    } else {
      console.warn('⚠️ RenderLayerManager not found - panels will need manual rendering');
    }

    this.isInitialized = true;

    // Auto-register a minimal interactive adapter so panels receive pointer events
    try {
      if (typeof RenderManager !== 'undefined' && RenderManager && typeof RenderManager.addInteractiveDrawable === 'function') {
        const adapter = {
          hitTest: (pointer) => {
            try {
              const x = pointer.screen.x;
              const y = pointer.screen.y;
              const panels = Array.from(this.panels.values()).reverse();
              for (const p of panels) {
                if (!p.state || !p.state.visible) continue;
                if (typeof p.isPointInBounds === 'function' && p.isPointInBounds(x, y)) return true;
              }
            } catch (e) {}
            return false;
          },
          onPointerDown: (pointer) => {
            try {
              const x = pointer.screen.x;
              const y = pointer.screen.y;
              const handled = this.handleMouseEvents(x, y, true);
              if (this.isAnyPanelBeingDragged && this.isAnyPanelBeingDragged()) return true;
              return !!handled;
            } catch (e) { return false; }
          },
          onPointerMove: (pointer) => {
            try {
              const x = pointer.screen.x;
              const y = pointer.screen.y;
              this.update(x, y, pointer.isPressed === true);
              return false;
            } catch (e) { return false; }
          },
          onPointerUp: (pointer) => {
            try {
              const x = pointer.screen.x;
              const y = pointer.screen.y;
              this.update(x, y, false);
            } catch (e) {}
            return false;
          },
          update: (pointer) => {
            try {
              const x = pointer.screen.x;
              const y = pointer.screen.y;
              this.update(x, y, pointer.isPressed === true);
            } catch (e) {}
          },
          render: (gameState, pointer) => {
            try {
              this.renderPanels(gameState);
            } catch (e) {}
          }
        };
        RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, adapter);
      }
    } catch (e) {
      console.warn('DraggablePanelManager: failed to auto-register interactive adapter', e);
    }
  }

  /**
   * Create the default example panels
   */
  createDefaultPanels() {
    console.log("create panel")
    // Ant Spawn Panel (vertical layout with ant spawning options)
    this.panels.set('ant_spawn', new DraggablePanel({
      id: 'ant-Spawn-panel',
      title: 'Ant Spawning',
      position: { x: 20, y: 80 },
      size: { width: 140, height: 280 },
      scale: 1.0, // Initial scale
      buttons: {
        layout: 'vertical',
        spacing: 3,
        buttonWidth: 120,
        buttonHeight: 24,
        autoSizeToContent: true,  // Enable auto-sizing for height
        verticalPadding: 10,
        horizontalPadding: 10,
        items: [
          {
            caption: 'Spawn 1 Ant',
            onClick: () => this.spawnAnts(1),
            style: ButtonStyles.SUCCESS
          },
          {
            caption: 'Spawn 10 Ants',
            onClick: () => this.spawnAnts(10),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#228B22' }
          },
          {
            caption: 'Spawn 100 Ants',
            onClick: () => this.spawnAnts(100),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#218221ff' }
          },
          {
            caption: 'Paint Enemy Brush',
            onClick: () => this.toggleEnemyBrush(),
            style: { ...ButtonStyles.WARNING, backgroundColor: '#FF4500', color: '#FFFFFF' }
          },
          {
            caption: 'Kill 1 Ant',
            onClick: () => this.killAnts(1),
            style: ButtonStyles.DANGER
          },
          {
            caption: 'Kill 10 Ants',
            onClick: () => this.killAnts(10),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#DC143C' }
          },
          {
            caption: 'Kill 100 Ants',
            onClick: () => this.killAnts(100),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#B22222' }
          },
          {
            caption: 'Clear All Ants',
            onClick: () => this.clearAnts(),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#8B0000' }
          }/*,
          {
            caption: 'Pause/Play',
            onClick: () => this.togglePause(),
            style: ButtonStyles.WARNING
          },
          {
            caption: 'Debug Info',
            onClick: () => this.toggleDebug(),
            style: ButtonStyles.PURPLE
          }*/
        ]
      }
    }));

    // Resources Panel (grid layout)
    this.panels.set('resources', new DraggablePanel({
      id: 'resources-spawn-panel',
      title: 'Resource Spawner',
      position: { x: 180, y: 80 },
      size: { width: 180, height: 150 },
      buttons: {
        layout: 'horizontal',
        columns: 2,
        spacing: 8,
        buttonWidth: 160,
        buttonHeight: 20,
        autoSizeToContent: true,  // Auto-resize to fit button content
        verticalPadding: 10,
        horizontalPadding: 10,
        items: [
          {
            caption: 'Paint Resource Brush',
            onClick: () => this.toggleResourceBrush(),
            style: { ...ButtonStyles.INFO, backgroundColor: '#32CD32', color: '#FFFFFF' }
          }
        ]
      }
    }));

    // Stats Panel (with mixed content and horizontal buttons)
    this.panels.set('stats', new DraggablePanel({
      id: 'stats-panel',
      title: 'Game Statistics',
      position: { x: 380, y: 80 },
      size: { width: 200, height: 160 },
      buttons: {
        layout: 'horizontal',
        spacing: 5,
        buttonWidth: 60,
        buttonHeight: 25,
        items: [
          {
            caption: 'Save',
            onClick: () => this.saveGame(),
            style: ButtonStyles.SUCCESS
          },
          {
            caption: 'Load',
            onClick: () => this.loadGame(),
            style: ButtonStyles.DEFAULT
          },
          {
            caption: 'Reset',
            onClick: () => this.resetGame(),
            style: ButtonStyles.DANGER
          }
        ]
      }
    }));

    // NOTE: Combat/Queen Powers panel has been moved to QueenControlPanel.js
    // It now only shows when the queen is selected (see Classes/systems/ui/QueenControlPanel.js)

    // Health Management Panel (horizontal layout with health controls)
    this.panels.set('health_controls', new DraggablePanel({
      id: 'health-controls-panel',
      title: 'Health Debug',
      position: { x: 20, y: 400 },
      size: { width: 130, height: 100 },
      buttons: {
        layout: 'vertical',
        spacing: 5,
        buttonWidth: 110,
        buttonHeight: 30,
        autoSizeToContent: true,  // Enable auto-sizing for height
        verticalPadding: 10,
        horizontalPadding: 10,
        items: [
          {
            caption: 'Select All',
            onClick: () => this.selectAllAnts(),
            style: { ...ButtonStyles.PURPLE, backgroundColor: '#9932CC' }
          },
          {
            caption: 'Damage 10',
            onClick: () => this.damageSelectedAnts(10),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#FF6B6B' }
          },
          {
            caption: 'Damage 25',
            onClick: () => this.damageSelectedAnts(25),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#FF4757' }
          },
          {
            caption: 'Damage 50',
            onClick: () => this.damageSelectedAnts(50),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#FF3742' }
          },
          {
            caption: 'Heal 10',
            onClick: () => this.healSelectedAnts(10),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#32CD32' }
          },
          {
            caption: 'Heal 25',
            onClick: () => this.healSelectedAnts(25),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#20B2AA' }
          },
          {
            caption: 'Heal 50',
            onClick: () => this.healSelectedAnts(50),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#228B22' }
          },
          {
            caption: 'Deselect',
            onClick: () => this.deselectAllAnts(),
            style: { ...ButtonStyles.DEFAULT, backgroundColor: '#808080' }
          }
        ]
      }
    }));

    // Debug Panel (only shown in debug mode)
    this.panels.set('debug', new DraggablePanel({
      id: 'debug-panel',
      title: 'Debug Controls',
      position: { x: 600, y: 80 },
      size: { width: 160, height: 450 },
      buttons: {
        layout: 'vertical',
        spacing: 3,
        buttonWidth: 140,
        buttonHeight: 25,
        autoSizeToContent: true,  // Auto-resize to fit button content
        verticalPadding: 10,
        horizontalPadding: 10,
        items: [
          /*{
            caption: 'Reset Scale',
            onClick: () => this.resetScale(),
            style: ButtonStyles.DEFAULT
          }, */
          // --- Ant State Control Buttons ---
          {
            caption: 'Set Idle',
            onClick: () => this.setSelectedAntsIdle(),
            style: { ...ButtonStyles.DEFAULT, backgroundColor: '#808080' }
          },
          {
            caption: 'Set Gathering',
            onClick: () => this.setSelectedAntsGathering(),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#228B22' }
          },          
          {
            caption: 'Gathering Visuals',
            onClick: () => g_gatherDebugRenderer.toggle(),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#228B22' }
          },
          {
            caption: 'Gathering All Lines',
            onClick: () => g_gatherDebugRenderer.toggleAllLines(),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#228B22' }
          },/*
          {
            caption: 'Set Patrol',
            onClick: () => this.setSelectedAntsPatrol(),
            style: { ...ButtonStyles.WARNING, backgroundColor: '#FFA500' }
          },
          {
            caption: 'Set Combat',
            onClick: () => this.setSelectedAntsCombat(),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#DC143C' }
          },
          {
            caption: 'Set Building',
            onClick: () => this.setSelectedAntsBuilding(),
            style: { ...ButtonStyles.PRIMARY, backgroundColor: '#4169E1' }
          },
          {
            caption: 'Apply Responsive',
            onClick: () => this.applyResponsiveScaling(true),
            style: ButtonStyles.SUCCESS
          },
          {
            caption: 'Console Log',
            onClick: () => this.dumpConsole(),
            style: ButtonStyles.DANGER
          } */
        ]
      }
    }));

    
    //task panel
    this.panels.set('tasks', new DraggablePanel({
      id: 'task-panel',
      title: 'Task objectives',
      position: { x: 600, y: 80 },
      size: { width: 160, height: 320 },
      buttons: {
        layout: 'vertical',
        spacing: 3,
        buttonWidth: 140,
        buttonHeight: 25,
        autoSizeToContent: true,  // Auto-resize to fit button content
        verticalPadding: 10,
        horizontalPadding: 10,
        items: [
          {
            caption: 'Gather 10 wood',
            style: ButtonStyles.SUCCESS,
            onClick: () => {
              logNormal('Gather 10 wood clicked');
              const lib = window.taskLibrary;
              if (!lib) { console.warn('No TaskLibrary available'); return; }
              const task = lib.availableTasks.find(t => (t.ID === 'T1') || (t.description && t.description.toLowerCase().includes('gather') && t.description.includes('10 wood')));
              if (!task) { console.warn('Task T1 not found'); return; }
              const satisfied = (typeof lib.isTaskResourcesSatisfied === 'function') ? lib.isTaskResourcesSatisfied(task.ID) : false;
              if (satisfied) {
                task.status = 'COMPLETE';
                logNormal(`Task ${task.ID} complete`);
                const panel = this.panels.get('tasks');
                if (panel && panel.buttons && Array.isArray(panel.buttons.items)) {
                  const btn = panel.buttons.items.find(b => b.caption && b.caption.includes('Gather 10 wood'));
                  if (btn) btn.caption = `${task.description} [COMPLETE]`;
                }
              } else {
                logNormal('Task not complete yet:', (lib.getTaskResourceProgress ? lib.getTaskResourceProgress(task.ID) : null));
              }
            }
          },
          {
            caption: 'spawn 5 new ants',
            style: ButtonStyles.SUCCESS,
            onClick: () => {
              logNormal('spawn 5 new ants clicked');
              const lib = window.taskLibrary;
              if (!lib) { console.warn('No TaskLibrary available'); return; }
              const task = lib.availableTasks.find(t => (t.ID === 'T2') || (t.description && t.description.toLowerCase().includes('spawn') && t.description.includes('5')));
              if (!task) { console.warn('Task T2 not found'); return; }
              const satisfied = (typeof lib.isTaskResourcesSatisfied === 'function') ? lib.isTaskResourcesSatisfied(task.ID) : false;
              if (satisfied) {
                task.status = 'COMPLETE';
                logNormal(`Task ${task.ID} complete`);
                const panel = this.panels.get('tasks');
                if (panel && panel.buttons && Array.isArray(panel.buttons.items)) {
                  const btn = panel.buttons.items.find(b => b.caption && b.caption.toLowerCase().includes('spawn 5'));
                  if (btn) btn.caption = `${task.description} [COMPLETE]`;
                }
              } else {
                logNormal('Task not complete yet:', (lib.getTaskResourceProgress ? lib.getTaskResourceProgress(task.ID) : null));
              }
            }
          },
          {
            caption: 'Kill 10 ants',
            style: ButtonStyles.SUCCESS,
            onClick: () => {
              logNormal('Kill 10 ants clicked');
              const lib = window.taskLibrary;
              if (!lib) { console.warn('No TaskLibrary available'); return; }
              const task = lib.availableTasks.find(t => (t.ID === 'T3') || (t.description && t.description.toLowerCase().includes('kill') && t.description.includes('10')));
              if (!task) { console.warn('Task T3 not found'); return; }
              const satisfied = (typeof lib.isTaskResourcesSatisfied === 'function') ? lib.isTaskResourcesSatisfied(task.ID) : false;
              if (satisfied) {
                task.status = 'COMPLETE';
                logNormal(`Task ${task.ID} complete`);
                const panel = this.panels.get('tasks');
                if (panel && panel.buttons && Array.isArray(panel.buttons.items)) {
                  const btn = panel.buttons.items.find(b => b.caption && b.caption.includes('Kill 10'));
                  if (btn) btn.caption = `${task.description} [COMPLETE]`;
                }
              } else {
                logNormal('Task not complete yet:', (lib.getTaskResourceProgress ? lib.getTaskResourceProgress(task.ID) : null));
              }
            }
          },
          {
            caption: 'Gather 20 leaves',
            style: ButtonStyles.SUCCESS,
            onClick: () => {
              logNormal('Gather 20 leaves clicked');
              const lib = window.taskLibrary;
              if (!lib) { console.warn('No TaskLibrary available'); return; }
              const task = lib.availableTasks.find(t => (t.ID === 'T4') || (t.description && t.description.toLowerCase().includes('gather') && t.description.includes('20 leaves')));
              if (!task) { console.warn('Task T4 not found'); return; }
              const satisfied = (typeof lib.isTaskResourcesSatisfied === 'function') ? lib.isTaskResourcesSatisfied(task.ID) : false;
              if (satisfied) {
                task.status = 'COMPLETE';
                logNormal(`Task ${task.ID} complete`);
                const panel = this.panels.get('tasks');
                if (panel && panel.buttons && Array.isArray(panel.buttons.items)) {
                  const btn = panel.buttons.items.find(b => b.caption && b.caption.includes('20 leaves'));
                  if (btn) btn.caption = `${task.description} [COMPLETE]`;
                }
              } else {
                logNormal('Task not complete yet:', (lib.getTaskResourceProgress ? lib.getTaskResourceProgress(task.ID) : null));
              }
            }
          }
        ]
      }
    }));

    // Building Panel (grid layout with building types)
    this.panels.set('buildings', new DraggablePanel({
      id: 'buildings-panel',
      title: 'Building Manager 🏗️',
      position: { x: 380, y: 80 },
      size: { width: 200, height: 180 },
      buttons: {
        layout: 'vertical',
        spacing: 5,
        buttonWidth: 180,
        buttonHeight: 35,
        autoSizeToContent: true,  // Enable auto-sizing for height
        verticalPadding: 10,
        horizontalPadding: 10,
        items: [
          {
            caption: 'Ant Cone (Paint)',
            onClick: () => this.toggleBuildingBrush('antcone'),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#8B4513', color: '#FFFFFF' }
          },
          {
            caption: 'Ant Hill (Paint)',
            onClick: () => this.toggleBuildingBrush('anthill'),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#A0522D', color: '#FFFFFF' }
          },
          {
            caption: 'Hive Source (Paint)',
            onClick: () => this.toggleBuildingBrush('hivesource'),
            style: { ...ButtonStyles.INFO, backgroundColor: '#DAA520', color: '#000000' }
          },
          {
            caption: 'Clear Buildings',
            onClick: () => this.clearBuildings(),
            style: { ...ButtonStyles.DANGER, backgroundColor: '#8B0000' }
          }
        ]
      }
    }));

    // Cheats Panel (unlock powers and other debug features)
    this.panels.set('cheats', new DraggablePanel({
      id: 'cheats-panel',
      title: '👑 Power Cheats',
      position: { x: 780, y: 80 },
      size: { width: 180, height: 220 },
      buttons: {
        layout: 'vertical',
        spacing: 4,
        buttonWidth: 160,
        buttonHeight: 32,
        autoSizeToContent: true,  // Auto-resize to fit button content
        verticalPadding: 10,
        horizontalPadding: 10,
        items: [
          {
            caption: '🔥 Unlock Fireball',
            onClick: () => this.unlockPower('fireball'),
            style: { ...ButtonStyles.WARNING, backgroundColor: '#FF4500', color: '#FFFFFF' }
          },
          {
            caption: '⚡ Unlock Lightning',
            onClick: () => this.unlockPower('lightning'),
            style: { ...ButtonStyles.INFO, backgroundColor: '#4DA6FF', color: '#FFFFFF' }
          },
          {
            caption: '🌀 Unlock Black Hole',
            onClick: () => this.unlockPower('blackhole'),
            style: { ...ButtonStyles.PURPLE, backgroundColor: '#9400D3', color: '#FFFFFF' }
          },
          {
            caption: '🧪 Unlock Sludge',
            onClick: () => this.unlockPower('sludge'),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#556B2F', color: '#FFFFFF' }
          },
          {
            caption: '🌊 Unlock Tidal Wave',
            onClick: () => this.unlockPower('tidalWave'),
            style: { ...ButtonStyles.PRIMARY, backgroundColor: '#1E90FF', color: '#FFFFFF' }
          },
          {
            caption: '🔆 Unlock Final Flash',
            onClick: () => this.unlockPower('finalFlash'),
            style: { ...ButtonStyles.PRIMARY, backgroundColor: '#ffff1aff', color: '#FFFFFF' }
          },
          {
            caption: '🔓 Unlock All Powers',
            onClick: () => this.unlockAllPowers(),
            style: { ...ButtonStyles.SUCCESS, backgroundColor: '#FFD700', color: '#000000' }
          }
        ]
      }
    }));
  }

  /**
   * Add a draggable panel
   * 
   * @param {Object} config - Panel configuration
   * @returns {DraggablePanel} Created panel instance
   */
  addPanel(config) {
    if (!this.isInitialized) {
      throw new Error('DraggablePanelManager must be initialized before adding panels');
    }

    if (this.panels.has(config.id)) {
      throw new Error(`Panel with ID '${config.id}' already exists`);
    }

    const panel = new DraggablePanel(config);
    this.panels.set(config.id, panel);
    

    return panel;
  }

  /**
   * Remove a panel by ID
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} True if panel was removed
   */
  removePanel(panelId) {
    const success = this.panels.delete(panelId);
    if (success) {

    }
    return success;
  }

  /**
   * Get a panel by ID
   * 
   * @param {string} panelId - Panel identifier
   * @returns {DraggablePanel|null} Panel instance or null if not found
   */
  getPanel(panelId) {
    return this.panels.get(panelId) || null;
  }

  /**
   * Get an existing panel or create a new one if it doesn't exist
   * 
   * This is a convenience method for the common pattern of "get or create" panels,
   * particularly useful for dialogue systems and other UI that needs to reuse panels.
   * 
   * @param {string} panelId - Panel identifier to get or create
   * @param {Object} config - Panel configuration (used if creating new panel)
   * @param {boolean} [updateIfExists=false] - If true, updates config of existing panel
   * @returns {DraggablePanel|undefined} Panel instance, or undefined if invalid parameters
   * 
   * @example
   * // Create or reuse dialogue panel
   * const panel = panelManager.getOrCreatePanel('dialogue-display', {
   *   id: 'dialogue-display',
   *   title: 'NPC Name',
   *   position: { x: 710, y: 880 },
   *   size: { width: 500, height: 160 }
   * });
   * 
   * @example
   * // Update existing panel with new config
   * const panel = panelManager.getOrCreatePanel('dialogue-display', {
   *   id: 'dialogue-display',
   *   title: 'Different NPC',
   *   buttons: { items: [{ caption: 'New Choice' }] }
   * }, true); // updateIfExists = true
   */
  getOrCreatePanel(panelId, config, updateIfExists = false) {
    // Validate parameters
    if (!panelId || !config) {
      return undefined;
    }

    // Check if panel already exists
    const existingPanel = this.getPanel(panelId);
    
    if (existingPanel) {
      // Panel exists - update config if requested
      if (updateIfExists) {
        // Merge new config with existing, ensuring ID stays the same
        existingPanel.config = { ...existingPanel.config, ...config, id: panelId };
      }
      return existingPanel;
    }

    // Panel doesn't exist - create it
    // Ensure config has correct ID (override config.id if different)
    const panelConfig = { ...config, id: panelId };
    return this.addPanel(panelConfig);
  }

  /**
   * Update all panels for mouse interaction
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   * @param {boolean} mousePressed - Whether mouse is currently pressed
   * @returns {void}
   * @memberof DraggablePanelManager
   */
  update(mouseX, mouseY, mousePressed) {
    if (!this.isInitialized) return;

    if (this.debugMode.panelTrainMode) {
      // 🚂 PANEL TRAIN MODE: All panels follow the leader!
      this.updatePanelTrainMode(mouseX, mouseY, mousePressed);
    } else {
      // Normal mode: Proper drag isolation (only one panel drags at a time)
      this.updateNormalMode(mouseX, mouseY, mousePressed);
    }
  }

  /**
   * Normal update mode with proper drag isolation
   */
  updateNormalMode(mouseX, mouseY, mousePressed) {
    // If mouse is released, clear the currently dragging panel
    if (!mousePressed) {
      this.currentlyDragging = null;
    }

    // If no panel is currently being dragged, check for new drag start
    if (!this.currentlyDragging && mousePressed) {
      // Find the topmost panel under the mouse (iterate in reverse order)
      const panelArray = Array.from(this.panels.values()).reverse();
      for (const panel of panelArray) {
        if (panel.state.visible && panel.config.behavior.draggable) {
          const titleBarBounds = panel.getTitleBarBounds();
          if (panel.isPointInBounds(mouseX, mouseY, titleBarBounds)) {
            this.currentlyDragging = panel.config.id;
            break;
          }
        }
      }
    }

    // Update only the currently dragging panel, or all panels if none are dragging
    for (const panel of this.panels.values()) {
      if (!this.currentlyDragging || panel.config.id === this.currentlyDragging) {
        panel.update(mouseX, mouseY, mousePressed);
      }
    }
  }

  /**
   * 🚂 Panel Train Mode: All panels follow each other in a fun chain!
   */
  updatePanelTrainMode(mouseX, mouseY, mousePressed) {
    // All panels update together - the bug becomes a feature! 
    for (const panel of this.panels.values()) {
      panel.update(mouseX, mouseY, mousePressed);
    }
  }

  /**
   * Handle mouse events for all panels and return if any consumed the event
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   * @param {boolean} mousePressed - Whether mouse button is currently pressed
   * @returns {boolean} True if any panel consumed the mouse event
   */
  handleMouseEvents(mouseX, mouseY, mousePressed) {
    if (!this.isInitialized) return false;
    
    // Update all panels and check if any consumed the mouse event
    // Process panels in reverse order (topmost panels first)
    const panelArray = Array.from(this.panels.values()).reverse();
    
    for (const panel of panelArray) {
      if (panel.update(mouseX, mouseY, mousePressed)) {
        // Panel consumed the event, no need to check other panels
        return true;
      }
    }
    
    return false;
  }

  /**
   * Render all visible panels
   * 
   * @param {Object} [contentRenderers={}] - Map of panel ID to content renderer functions
   * @returns {void}
   * @memberof DraggablePanelManager
   */
  render(contentRenderers = {}) {
    if (!this.isInitialized) return;

    // Render panels in creation order (panels added later appear on top)
    for (const [panelId, panel] of this.panels) {
      const contentRenderer = contentRenderers[panelId];
      panel.render(contentRenderer);
    }
  }

  /**
   * Toggle panel visibility
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} New visibility state, or null if panel not found
   */
  togglePanel(panelId) {
    const panel = this.panels.get(panelId);
    if (panel) {
      panel.toggleVisibility();
      return panel.isVisible();
    }
    return null;
  }

  /**
   * Show panel
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} True if panel was found and shown
   */
  showPanel(panelId) {
    const panel = this.panels.get(panelId);
    if (panel && !panel.isVisible()) {
      panel.toggleVisibility();
      return true;
    }
    return false;
  }

  /**
   * Hide panel
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} True if panel was found and hidden
   */
  hidePanel(panelId) {
    const panel = this.panels.get(panelId);
    if (panel && panel.isVisible()) {
      panel.toggleVisibility();
      return true;
    }
    return false;
  }

  /**
   * Get all panel IDs
   * 
   * @returns {Array<string>} Array of panel IDs
   */
  getPanelIds() {
    return Array.from(this.panels.keys());
  }

  /**
   * Get count of panels
   * 
   * @returns {number} Number of registered panels
   */
  getPanelCount() {
    return this.panels.size;
  }

  /**
   * Get count of visible panels
   * 
   * @returns {number} Number of visible panels
   */
  getVisiblePanelCount() {
    let count = 0;
    for (const panel of this.panels.values()) {
      if (panel.isVisible()) count++;
    }
    return count;
  }

  /**
   * Check if any panel is currently being dragged
   * 
   * @returns {boolean} True if any panel is being dragged
   */
  isAnyPanelBeingDragged() {
    for (const panel of this.panels.values()) {
      if (panel.isDragActive()) return true;
    }
    return false;
  }

  /**
   * Get diagnostic information
   * 
   * @returns {Object} Diagnostic information
   */
  getDiagnosticInfo() {
    const panelInfo = {};
    for (const [panelId, panel] of this.panels) {
      panelInfo[panelId] = {
        visible: panel.isVisible(),
        position: panel.getPosition(),
        dragging: panel.isDragActive()
      };
    }

    return {
      isInitialized: this.isInitialized,
      totalPanels: this.panels.size,
      visiblePanels: this.getVisiblePanelCount(),
      anyDragging: this.isAnyPanelBeingDragged(),
      panels: panelInfo
    };
  }

  /**
   * Reset all panels to default positions
   */
  resetAllPanels() {
    for (const panel of this.panels.values()) {
      // Reset to initial position from config
      panel.setPosition(panel.config.position.x, panel.config.position.y);
    }
    logNormal('🔄 Reset all panels to default positions');
  }

  /**
   * 🚂 Toggle Panel Train Mode (debug feature)
   * When enabled, all panels follow each other when one is dragged
   * 
   * @returns {boolean} New panel train mode state
   * @memberof DraggablePanelManager
   */
  togglePanelTrainMode() {
    this.debugMode.panelTrainMode = !this.debugMode.panelTrainMode;
    const status = this.debugMode.panelTrainMode ? 'ENABLED' : 'DISABLED';
    logNormal(`🚂 Panel Train Mode ${status}`);
    return this.debugMode.panelTrainMode;
  }

  /**
   * Get current Panel Train Mode state
   * 
   * @returns {boolean} Whether panel train mode is enabled
   */
  isPanelTrainModeEnabled() {
    return this.debugMode.panelTrainMode;
  }

  /**
   * Set Panel Train Mode state
   * 
   * @param {boolean} enabled - Whether to enable panel train mode
   */
  setPanelTrainMode(enabled) {
    this.debugMode.panelTrainMode = !!enabled;
    const status = this.debugMode.panelTrainMode ? 'ENABLED' : 'DISABLED';
    logNormal(`🚂 Panel Train Mode ${status}`);
  }

  /**
   * Set global scale for all panels
   * 
   * @param {number} scale - Scale factor (0.5 to 2.0)
   */
  setGlobalScale(scale) {
    this.globalScale = Math.max(this.minScale, Math.min(this.maxScale, scale));
    
    // Apply scale to all panels
    for (const panel of this.panels.values()) {
      if (typeof panel.setScale === 'function') {
        panel.setScale(this.globalScale);
      }
    }
    
    logNormal(`🔍 Global panel scale set to ${this.globalScale.toFixed(2)}x`);
  }

  /**
   * Get current global scale
   * 
   * @returns {number} Current global scale factor
   */
  getGlobalScale() {
    return this.globalScale;
  }

  /**
   * Scale panels up by 10%
   */
  scaleUp() {
    this.setGlobalScale(this.globalScale * 1.1);
  }

  /**
   * Scale panels down by 10%
   */
  scaleDown() {
    this.setGlobalScale(this.globalScale / 1.1);
  }

  /**
   * Reset scale to default (1.0)
   */
  resetScale() {
    this.setGlobalScale(1.0);
  }



  /**
   * Check if a panel exists
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} True if panel exists
   */
  hasPanel(panelId) {
    return this.panels.has(panelId);
  }

  /**
   * Check if a specific panel is visible
   * 
   * @param {string} panelId - Panel identifier
   * @returns {boolean} True if panel exists and is visible
   */
  isPanelVisible(panelId) {
    const panel = this.panels.get(panelId);
    return panel ? panel.isVisible() : false;
  }

  /**
   * Render all visible panels based on current game state
   */
  renderPanels(gameState) {
    // Update current game state
    if (gameState && gameState !== this.gameState) {
      this.gameState = gameState;
    }
    
    // Get panels that should be visible for current state
    const visiblePanelIds = this.stateVisibility[this.gameState] || [];
    
    // Update panel visibility
    for (const [panelId, panel] of this.panels) {
      const shouldBeVisible = visiblePanelIds.includes(panelId);
      if (shouldBeVisible && !panel.isVisible()) {
        panel.show();
      } else if (!shouldBeVisible && panel.isVisible()) {
        panel.hide();
      }
    }

    
    
    // Render all visible panels (skip panels managed externally)
    for (const panel of this.panels.values()) {
      if (panel.isVisible() && !panel.config.behavior.managedExternally) {
        panel.render();
      }
    }
  }

  /**
   * Update game state and adjust panel visibility
   */
  updateGameState(newState) {
    if (this.gameState !== newState) {
      this.gameState = newState;
      logNormal(`🎮 Panel visibility updated for state: ${newState}`);
    }
  }

  // =============================================================================
  // GAME ACTION METHODS (Button Callbacks)
  // =============================================================================

  /**
   * Spawn multiple ants at random positions or near mouse
   * Uses AntFactory (MVC pattern) which auto-registers with spatial grid
   */
  spawnAnts(count = 1) {
    logVerbose(`🐜 Spawning ${count} ant(s)...`);
    
    if (typeof AntFactory === 'undefined' || typeof AntFactory.createAnt !== 'function') {
      console.warn('⚠️ AntFactory not available - cannot spawn ants');
      return;
    }

    let spawned = 0;
    const centerX = (typeof g_canvasX !== 'undefined') ? g_canvasX / 2 : (typeof width !== 'undefined') ? width / 2 : 400;
    const centerY = (typeof g_canvasY !== 'undefined') ? g_canvasY / 2 : (typeof height !== 'undefined') ? height / 2 : 400;

    for (let i = 0; i < count; i++) {
      const spawnX = (typeof mouseX !== 'undefined' ? mouseX : centerX) + (Math.random() - 0.5) * 100;
      const spawnY = (typeof mouseY !== 'undefined' ? mouseY : centerY) + (Math.random() - 0.5) * 100;
      
      AntFactory.createAnt(spawnX, spawnY, {
        faction: 'player',
        job: 'Worker'
      });
      spawned++;
    }

    logVerbose(`✅ Successfully spawned ${spawned} ant(s) using AntFactory`);
  }

  /**
   * Spawn a single enemy ant near the mouse cursor or screen center
   * Uses AntFactory (MVC pattern) which auto-registers with spatial grid
   */
  spawnEnemyAnt() {
    logNormal('🔴 Spawning enemy ant...');
    
    if (typeof AntFactory === 'undefined' || typeof AntFactory.createAnt !== 'function') {
      console.warn('⚠️ AntFactory not available - cannot spawn enemy ant');
      return;
    }

    const centerX = (typeof g_canvasX !== 'undefined') ? g_canvasX / 2 : (typeof width !== 'undefined') ? width / 2 : 400;
    const centerY = (typeof g_canvasY !== 'undefined') ? g_canvasY / 2 : (typeof height !== 'undefined') ? height / 2 : 400;
    const spawnX = (typeof mouseX !== 'undefined' ? mouseX : centerX) + (Math.random() - 0.5) * 50;
    const spawnY = (typeof mouseY !== 'undefined' ? mouseY : centerY) + (Math.random() - 0.5) * 50;
    
    AntFactory.createAnt(spawnX, spawnY, {
      faction: 'enemy',
      job: 'Warrior'
    });

    logNormal('✅ Successfully spawned enemy ant using AntFactory');
  }

  /**
   * Spawn multiple enemy ants near the mouse cursor or screen center
   * Uses AntFactory (MVC pattern) which auto-registers with spatial grid
   */
  spawnEnemyAnts(count = 1) {
    logNormal(`🔴 Spawning ${count} enemy ant(s)...`);
    
    if (typeof AntFactory === 'undefined' || typeof AntFactory.createAnt !== 'function') {
      console.warn('⚠️ AntFactory not available - cannot spawn enemy ants');
      return;
    }

    let spawned = 0;
    const centerX = (typeof g_canvasX !== 'undefined') ? g_canvasX / 2 : (typeof width !== 'undefined') ? width / 2 : 400;
    const centerY = (typeof g_canvasY !== 'undefined') ? g_canvasY / 2 : (typeof height !== 'undefined') ? height / 2 : 400;
    
    for (let i = 0; i < count; i++) {
      const spawnX = (typeof mouseX !== 'undefined' ? mouseX : centerX) + (Math.random() - 0.5) * 100;
      const spawnY = (typeof mouseY !== 'undefined' ? mouseY : centerY) + (Math.random() - 0.5) * 100;
      
      AntFactory.createAnt(spawnX, spawnY, {
        faction: 'enemy',
        job: 'Warrior'
      });
      spawned++;
    }

    logNormal(`✅ Successfully spawned ${spawned} enemy ant(s) using AntFactory`);
  }

  /**
   * Toggle the enemy ant paint brush tool
   */
  toggleEnemyBrush() {
    // Initialize brush if not already done
    if (typeof g_enemyAntBrush === 'undefined' || !g_enemyAntBrush) {
      if (typeof initializeEnemyAntBrush === 'function') {
        window.g_enemyAntBrush = initializeEnemyAntBrush();
      } else {
        console.warn('⚠️ Enemy Ant Brush system not available');
        return;
      }
    }
    
    // Toggle the brush
    const isActive = g_enemyAntBrush.toggle();
    
    // Update button text to reflect current state
    const button = this.findButtonByCaption('Paint Brush');
    if (button) {
      button.caption = isActive ? 'Brush: ON' : 'Paint Brush';
      button.style.backgroundColor = isActive ? '#32CD32' : '#FF4500'; // Green when active, orange when inactive
    }
    
    logNormal(`🎨 Enemy Paint Brush ${isActive ? 'activated' : 'deactivated'}`);
  }

  /**
   * Toggle the resource paint brush tool
   */
  toggleResourceBrush() {
    // Initialize brush if not already done
    if (typeof g_resourceBrush === 'undefined' || !g_resourceBrush) {
      if (typeof initializeResourceBrush === 'function') {
        window.g_resourceBrush = initializeResourceBrush();
      } else {
        console.warn('⚠️ Resource Brush system not available');
        return;
      }
    }
    
    // Toggle the brush
    const isActive = g_resourceBrush.toggle();
    
    // Update button text to reflect current state
    const button = this.findButtonByCaption('Paint Resource Brush');
    if (button) {
      button.caption = isActive ? 'Resource Brush: ON' : 'Paint Resource Brush';
      button.style.backgroundColor = isActive ? '#228B22' : '#32CD32'; // Darker green when active
    }
    
    logNormal(`🎨 Resource Paint Brush ${isActive ? 'activated' : 'deactivated'}`);
  }

  /**
   * Toggle the building paint brush tool
   * @param {string} buildingType - Type of building to paint ('antcone', 'anthill', 'hivesource')
   */
  toggleBuildingBrush(buildingType) {
    // Initialize building brush if not already done
    if (typeof g_buildingBrush === 'undefined' || !g_buildingBrush) {
      if (typeof initializeBuildingBrush === 'function') {
        window.g_buildingBrush = initializeBuildingBrush();
      } else {
        console.warn('⚠️ Building Brush system not available');
        return;
      }
    }
    
    // Check if clicking the same building type that's already active
    const wasActive = g_buildingBrush.isActive;
    const wasSameType = g_buildingBrush.getBuildingType() === buildingType;
    
    if (wasActive && wasSameType) {
      // Deactivate if clicking the same brush again
      g_buildingBrush.deactivate();
    } else {
      // Activate with new building type
      g_buildingBrush.activate(buildingType);
    }
    
    const isActive = g_buildingBrush.isActive;
    
    // Update button states
    const buildingNames = {
      'antcone': '🏔️ Ant Cone',
      'anthill': '🏔️ Ant Hill',
      'hivesource': '🏠 Hive Source'
    };
    
    // Find and update all building buttons
    const panel = this.panels.get('buildings');
    if (panel && panel.buttons && panel.buttons.items) {
      panel.buttons.items.forEach(btn => {
        if (btn.caption.includes('🏔️') || btn.caption.includes('🏠')) {
          const btnType = btn.caption.includes('Cone') ? 'antcone' : 
                         btn.caption.includes('Hill') ? 'anthill' : 'hivesource';
          
          if (btnType === buildingType && isActive) {
            btn.caption = `${buildingNames[btnType]} (ON)`;
            btn.style.fontWeight = 'bold';
          } else {
            btn.caption = `${buildingNames[btnType]} (Paint)`;
            btn.style.fontWeight = 'normal';
          }
        }
      });
    }
    
    logNormal(`🏗️ Building Brush ${isActive ? 'activated' : 'deactivated'}: ${buildingType}`);
  }

  /**
   * Clear all buildings from the map
   */
  clearBuildings() {
    if (typeof Buildings !== 'undefined' && Array.isArray(Buildings)) {
      const count = Buildings.length;
      Buildings.length = 0; // Clear the array
      logNormal(`🏗️ Cleared ${count} building(s)`);
    }
  }

  /**
   * Unlock a specific power for the queen
   * @param {string} powerName - Name of the power to unlock
   */
  unlockPower(powerName) {
    const queen = typeof getQueen === 'function' ? getQueen() : null;
    if (!queen) {
      console.warn('⚠️ No queen found - cannot unlock powers');
      return;
    }

    if (typeof queen.unlockPower === 'function') {
      const success = queen.unlockPower(powerName);
      if (success) {
        logNormal(`✅ Unlocked power: ${powerName}`);
        
        // Update the button to show it's unlocked
        const button = this.findButtonByCaption(`Unlock ${powerName}`, true);
        if (button) {
          button.caption = `✅ ${powerName.charAt(0).toUpperCase() + powerName.slice(1)}`;
        }

        // Update the Use Power button state in QueenControlPanel if available
        if (typeof window.g_queenControlPanel !== 'undefined' && window.g_queenControlPanel) {
          window.g_queenControlPanel.updatePowerButtonState();
        }
      }
    } else {
      console.warn('⚠️ Queen does not support power unlocking (old queen class?)');
    }
  }

  /**
   * Unlock all powers for the queen
   */
  unlockAllPowers() {
    const queen = typeof getQueen === 'function' ? getQueen() : null;
    if (!queen) {
      console.warn('⚠️ No queen found - cannot unlock powers');
      return;
    }

    const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave', 'finalFlash'];
    let unlocked = 0;

    for (const power of powers) {
      if (typeof queen.unlockPower === 'function' && queen.unlockPower(power)) {
        unlocked++;
      }
    }

    logNormal(`✅ Unlocked ${unlocked}/${powers.length} powers`);

    // Update all unlock buttons to show they're unlocked
    const panel = this.panels.get('cheats');
    if (panel && panel.buttons && panel.buttons.items) {
      panel.buttons.items.forEach(btn => {
        if (btn.caption.includes('Unlock') && !btn.caption.includes('All')) {
          const powerName = btn.caption.replace('🔥 Unlock ', '').replace('⚡ Unlock ', '')
            .replace('🌀 Unlock ', '').replace('🧪 Unlock ', '').replace('🌊 Unlock ', '');
          btn.caption = `✅ ${powerName}`;
        }
      });
    }

    // Update the Use Power button state in QueenControlPanel if available
    if (typeof window.g_queenControlPanel !== 'undefined' && window.g_queenControlPanel) {
      window.g_queenControlPanel.updatePowerButtonState();
    }
  }

  /**
   * Helper method to find button by caption
   * @param {string} caption - Button caption to search for
   * @returns {Object|null} Button object or null if not found
   */
  findButtonByCaption(caption, partialMatch = false) {
    // Search through all panels and their buttons
    for (const panel of this.panels.values()) {
      if (panel.buttons && panel.buttons.items) {
        const button = panel.buttons.items.find(btn => {
          if (partialMatch) {
            return btn.caption && btn.caption.includes(caption);
          }
          return btn.caption === caption || 
            btn.caption.includes('Paint Brush') || 
            btn.caption.includes('Brush:') ||
            btn.caption.includes('Resource Brush') ||
            btn.caption.includes('Paint Resource Brush');
        });
        if (button) return button;
      }
    }
    return null;
  }
  
  /**
   * Kill/remove multiple ants from the game
   * Uses spatial grid as single source of truth
   */
  killAnts(count = 1) {
    logNormal(`💀 Killing ${count} ant(s)...`);
    
    if (typeof spatialGridManager === 'undefined' || !spatialGridManager) {
      console.warn('⚠️ SpatialGridManager not available - cannot kill ants');
      return;
    }

    // Get all ants from spatial grid
    const allAnts = spatialGridManager.getEntitiesByType('ant');
    
    if (allAnts.length === 0) {
      logNormal('⚠️ No ants found in spatial grid');
      return;
    }

    const toRemove = Math.min(count, allAnts.length);
    let killed = 0;

    // Remove from end of array
    for (let i = allAnts.length - 1; i >= allAnts.length - toRemove && i >= 0; i--) {
      const ant = allAnts[i];
      if (spatialGridManager.removeEntity(ant)) {
        killed++;
      }
    }

    logNormal(`✅ Successfully killed ${killed} ant(s)`);
  }

  /**
   * Clear all ants from the game
   * Uses spatial grid as single source of truth
   */
  clearAnts() {
    logNormal('🧹 Clearing all ants...');
    
    if (typeof spatialGridManager === 'undefined' || !spatialGridManager) {
      console.warn('⚠️ SpatialGridManager not available - cannot clear ants');
      return;
    }

    // Get all ants from spatial grid
    const allAnts = spatialGridManager.getEntitiesByType('ant');
    let cleared = 0;

    // Remove each ant from spatial grid
    for (const ant of allAnts) {
      if (spatialGridManager.removeEntity(ant)) {
        cleared++;
      }
    }

    logNormal(`✅ Cleared ${cleared} ant(s)`);
  }

  /**
   * Toggle game pause state
   */
  togglePause() {
    globalThis.logNormal('⏯️ Toggling pause state...');
    
    // Try multiple pause methods
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager && typeof g_gameStateManager.togglePause === 'function') {
      g_gameStateManager.togglePause();
      globalThis.logNormal('✅ Game pause toggled via GameStateManager');
    } else {
      console.warn('⚠️ No pause system available');
    }
  }

  /**
   * Handle the Shoot Lightning button from the combat panel
   * Target selection logic is handled by LightningSystem.findBestTarget()
   */
  handleShootLightning(target = null) {
    // Ensure LightningSystem exists
    if (typeof window.LightningManager === 'undefined' || !window.LightningManager) {
      if (typeof initializeLightningSystem === 'function') {
        window.g_lightningManager = initializeLightningSystem();
      } else {
        console.warn('⚠️ Lightning system not available');
        return;
      }
    }

    // Request strike (auto-targets via LightningSystem.findBestTarget())
    if (g_lightningManager && typeof g_lightningManager.requestStrike === 'function') {
      const executed = g_lightningManager.requestStrike(); // No target = auto-select
      const button = this.findButtonByCaption('Shoot Lightning');
      
      if (executed) {
        logNormal('⚡ Lightning strike executed');
        
        // Show cooldown on button
        if (button) {
          const cooldownMs = g_lightningManager.cooldown || 3000;
          const seconds = Math.ceil(cooldownMs / 1000);
          const originalCaption = button._originalCaption || button.caption;
          button._originalCaption = originalCaption;
          button.caption = `Cooldown (${seconds}s)`;
          button.style.backgroundColor = '#999999';
          
          // Restore after cooldown
          setTimeout(() => {
            try {
              button.caption = originalCaption;
              button.style.backgroundColor = '#4DA6FF';
            } catch (e) {}
          }, cooldownMs + 50);
        }
      } else {
        logNormal('⏳ Lightning on cooldown');
        
        // Flash button to indicate cooldown
        if (button) {
          const prevColor = button.style.backgroundColor;
          button.style.backgroundColor = '#555';
          setTimeout(() => { button.style.backgroundColor = prevColor; }, 200);
        }
      }
    } else {
      console.warn('⚠️ Lightning manager not initialized or missing requestStrike()');
    // Determine target: prefer selected ant, otherwise nearest ant under mouse or nearest overall
    let targetAnt = target;
    try {
      if (g_selectionBoxController && typeof g_selectionBoxController.getSelectedEntities === 'function') {
        const selected = g_selectionBoxController.getSelectedEntities();
        if (Array.isArray(selected) && selected.length > 0) {
          // Prefer first selected ant entity
          targetAnt = selected.find(e => e && e.isAnt) || selected[0];
        }
      }

      // If none selected, try nearest ant under mouse
      if (!targetAnt && typeof ants !== 'undefined' && Array.isArray(ants) && ants.length > 0) {
        // Find nearest to mouse position within reasonable radius
        const radius = 80;
        let best = null;
        let bestDist = Infinity;
        for (const ant of ants) {
          if (!ant || !ant.isActive) continue;
          const pos = (typeof ant.getPosition === 'function') ? ant.getPosition() : { x: ant.x || 0, y: ant.y || 0 };
          const d = Math.hypot(pos.x - mouseX, pos.y - mouseY);
          if (d < bestDist && d <= radius) {
            bestDist = d;
            best = ant;
          }
        }
        targetAnt = best || ants[0]; // fallback to first ant
      }

      // Ask lightning manager to strike (respects cooldown)
      if (g_lightningManager && typeof g_lightningManager.requestStrike === 'function') {
        const executed = g_lightningManager.requestStrike(targetAnt);
        const button = this.findButtonByCaption('Shoot Lightning');
        if (executed) {
          logNormal('⚡ Lightning strike executed', targetAnt && (targetAnt._antIndex || targetAnt.id || 'ant'));
          // Show cooldown on the button if available
          if (button) {
            const cooldownMs = g_lightningManager.cooldown || 3000;
            const seconds = Math.ceil(cooldownMs / 1000);
            const originalCaption = button._originalCaption || button.caption;
            button._originalCaption = originalCaption;
            button.caption = `Cooldown (${seconds}s)`;
            button.style.backgroundColor = '#999999';
            // Restore after cooldown
            setTimeout(() => {
              try {
                button.caption = originalCaption;
                button.style.backgroundColor = '#4DA6FF';
              } catch (e) {}
            }, cooldownMs + 50);
          }
        } else {
          logNormal('⏳ Lightning on cooldown');
          if (button) {
            // Briefly flash the button to indicate cooldown
            const prevColor = button.style.backgroundColor;
            button.style.backgroundColor = '#555';
            setTimeout(() => { button.style.backgroundColor = prevColor; }, 200);
          }
        }
      } else {
        console.warn('⚠️ Lightning manager not initialized or missing requestStrike()');
      }
    } catch (err) {
      console.error('❌ Error in handleShootLightning():', err);
    }
  }
  }
  /**
   * Toggle the lightning aim brush (LEGACY - replaced by power cycling)
   */
  toggleLightningAimBrush() {
    if (typeof g_lightningAimBrush === 'undefined' || !g_lightningAimBrush) {
      if (typeof initializeLightningAimBrush === 'function') {
        window.g_lightningAimBrush = initializeLightningAimBrush();
      } else {
        console.warn('⚠️ Lightning Aim Brush system not available');
        return;
      }
    }

    const active = g_lightningAimBrush.toggle();
    const button = this.findButtonByCaption('Aim Lightning');
    if (button) {
      button.caption = active ? 'Aim: ON' : 'Aim Lightning';
      button.style.backgroundColor = active ? '#1E90FF' : '#2E9AFE';
    }
  }

  /**
   * Toggle the final flash aim brush (LEGACY - replaced by power cycling)
   */
  toggleFlashAimBrush() {
    if (typeof g_flashAimBrush === 'undefined' || !g_flashAimBrush) {
      if (typeof initializeflashAimBrush === 'function') {
        window.g_flashAimBrush = initializeFlashAimBrush();
      } else {
        console.warn('⚠️ Final Flash Aim Brush system not available');
        return;
      }
    }

    const active = g_flashAimBrush.toggle();
    const button = this.findButtonByCaption('Aim Final Flash');
    if (button) {
      button.caption = active ? 'Aim: ON' : 'Aim Final Flash';
      button.style.backgroundColor = active ? '#1E90FF' : '#2E9AFE';
    }
  }
  handleShootFlash() {
    // Ensure FlashSystem exists
    if (typeof window.FlashManager === 'undefined' || !window.FlashManager) {
      if (typeof initializeFlashSystem === 'function') {
        window.g_flashManager = initializeFlashSystem();
      } else {
        console.warn('⚠️ Final Flash system not available');
        return;
      }
    }

    // Determine target: prefer selected ant, otherwise nearest ant under mouse or nearest overall
    let targetAnt = null;
    try {
      if (g_selectionBoxController && typeof g_selectionBoxController.getSelectedEntities === 'function') {
        const selected = g_selectionBoxController.getSelectedEntities();
        if (Array.isArray(selected) && selected.length > 0) {
          // Prefer first selected ant entity
          targetAnt = selected.find(e => e && e.isAnt) || selected[0];
        }
      }

      // If none selected, try nearest ant under mouse
      if (!targetAnt && typeof ants !== 'undefined' && Array.isArray(ants) && ants.length > 0) {
        // Find nearest to mouse position within reasonable radius
        const radius = 80;
        let best = null;
        let bestDist = Infinity;
        for (const ant of ants) {
          if (!ant || !ant.isActive) continue;
          const pos = (typeof ant.getPosition === 'function') ? ant.getPosition() : { x: ant.x || 0, y: ant.y || 0 };
          const d = Math.hypot(pos.x - mouseX, pos.y - mouseY);
          if (d < bestDist && d <= radius) {
            bestDist = d;
            best = ant;
          }
        }
        targetAnt = best || ants[0]; // fallback to first ant
      }

      // Ask flash manager to strike (respects cooldown)
      if (g_flashManager && typeof g_flashManager.requestStrike === 'function') {
        const executed = g_flashManager.requestStrike(targetAnt);
        const button = this.findButtonByCaption('Shoot Final Flash');
        if (executed) {
          logNormal('⚡ Final Flash strike executed', targetAnt && (targetAnt._antIndex || targetAnt.id || 'ant'));
          // Show cooldown on the button if available
          if (button) {
            const cooldownMs = g_flashManager.cooldown || 3000;
            const seconds = Math.ceil(cooldownMs / 1000);
            const originalCaption = button._originalCaption || button.caption;
            button._originalCaption = originalCaption;
            button.caption = `Cooldown (${seconds}s)`;
            button.style.backgroundColor = '#999999';
            // Restore after cooldown
            setTimeout(() => {
              try {
                button.caption = originalCaption;
                button.style.backgroundColor = '#4DA6FF';
              } catch (e) {}
            }, cooldownMs + 50);
          }
        } else {
          logNormal('⏳ Final Flash on cooldown');
          if (button) {
            // Briefly flash the button to indicate cooldown
            const prevColor = button.style.backgroundColor;
            button.style.backgroundColor = '#555';
            setTimeout(() => { button.style.backgroundColor = prevColor; }, 200);
          }
        }
      } else {
        console.warn('⚠️ Final Flash manager not initialized or missing requestStrike()');
      }
    } catch (err) {
      console.error('❌ Error in handleShootFlash():', err);
    }
  }
  // NOTE: handlePlaceDropoff, updatePowerButtonState, and cyclePower methods 
  // have been moved to QueenControlPanel.js (Classes/systems/ui/QueenControlPanel.js)
  // These methods are now part of the queen-specific panel that only shows when queen is selected

  /**
   * Toggle debug information display
   */
  toggleDebug() {
    logNormal('🔧 Toggling debug mode...');
    
    // Try multiple debug systems
    let debugToggled = false;
    
    // Method 1: Try g_uiDebugManager
    if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager && typeof g_uiDebugManager.toggleDebug === 'function') {
      g_uiDebugManager.toggleDebug();
      debugToggled = true;
    }
    
    // Method 2: Try global debug test runner
    if (typeof globalThis !== 'undefined' && typeof globalThis.toggleDebugTestRunner === 'function') {
      globalThis.toggleDebugTestRunner();
      debugToggled = true;
    }
    
    // Method 3: Try global verbosity toggle
    if (typeof globalThis !== 'undefined' && typeof globalThis.toggleVerbosity === 'function') {
      globalThis.toggleVerbosity();
      debugToggled = true;
    }
    
    // Method 4: Simple global debug flag toggle
    if (!debugToggled) {
      if (typeof globalThis.debugMode === 'undefined') {
        globalThis.debugMode = false;
      }
      globalThis.debugMode = !globalThis.debugMode;
      logNormal(`✅ Global debug mode ${globalThis.debugMode ? 'enabled' : 'disabled'}`);
      debugToggled = true;
    }
    
    if (!debugToggled) {
      console.warn('⚠️ No debug system available');
    }
  }

  /**
   * Select a resource type for interaction
   */
  selectResource(resourceType) {
    logNormal(`📦 Selected resource: ${resourceType}`);
    if (typeof g_entityInventoryManager !== 'undefined' && g_entityInventoryManager && typeof g_entityInventoryManager.selectResource === 'function') {
      g_entityInventoryManager.selectResource(resourceType);
    } else {
      console.warn('⚠️ EntityInventoryManager not found or selectResource method not available');
    }
  }

  /**
   * Show resource information panel
   */
  showResourceInfo() {
    logNormal('ℹ️ Showing resource information...');
    // TODO: Integrate with resource info system
  }

  /**
   * Save current game state
   */
  saveGame() {
    logNormal('💾 Saving game...');
    
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager && typeof g_gameStateManager.saveGame === 'function') {
      g_gameStateManager.saveGame();
      logNormal('✅ Game saved via GameStateManager');
    } else {
      // Fallback: Save basic game state to localStorage
      try {
        const antCount = (typeof spatialGridManager !== 'undefined' && spatialGridManager) 
          ? spatialGridManager.getEntityCountByType('ant') 
          : 0;
        const gameState = {
          timestamp: Date.now(),
          antCount: antCount,
          resourceCount: (typeof g_entityInventoryManager !== 'undefined' && g_entityInventoryManager) ? g_entityInventoryManager.getResourceList().length : 0
        };
        localStorage.setItem('gameState', JSON.stringify(gameState));
        logNormal('✅ Basic game state saved to localStorage');
      } catch (e) {
        console.warn('⚠️ Could not save game state:', e.message);
      }
    }
  }

  /**
   * Load saved game state
   */
  loadGame() {
    logNormal('📁 Loading game...');
    
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager && typeof g_gameStateManager.loadGame === 'function') {
      g_gameStateManager.loadGame();
      logNormal('✅ Game loaded via GameStateManager');
    } else {
      // Fallback: Load from localStorage
      try {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
          const gameState = JSON.parse(savedState);
          logNormal('📋 Found saved game state:', gameState);
          logNormal('✅ Basic game state loaded from localStorage');
        } else {
          logNormal('ℹ️ No saved game state found');
        }
      } catch (e) {
        console.warn('⚠️ Could not load game state:', e.message);
      }
    }
  }

  /**
   * Reset game to initial state
   */
  resetGame() {
    logNormal('🔄 Resetting game...');
    
    if (typeof g_gameStateManager !== 'undefined' && g_gameStateManager && typeof g_gameStateManager.resetGame === 'function') {
      g_gameStateManager.resetGame();
      logNormal('✅ Game reset via GameStateManager');
    } else {
      // Fallback: Manual reset
      this.clearAnts();
      if (typeof g_entityInventoryManager !== 'undefined' && g_entityInventoryManager && typeof g_entityInventoryManager.clearAllResources === 'function') {
        g_entityInventoryManager.clearAllResources();
      }
      logNormal('✅ Basic game reset completed');
    }
  }

  /**
   * Toggle rendering system on/off
   */
  toggleRendering() {
    logNormal('🎨 Toggling rendering system...');
    if (typeof g_renderController !== 'undefined' && g_renderController) {
      g_renderController.toggleRendering();
    } else {
      console.warn('⚠️ RenderController not found');
    }
  }

  /**
   * Toggle performance monitoring
   */
  togglePerformance() {
    logNormal('📊 Toggling performance monitor...');
    if (typeof g_performanceMonitor !== 'undefined' && g_performanceMonitor) {
      g_performanceMonitor.toggle();
    } else {
      console.warn('⚠️ PerformanceMonitor not found');
    }
  }

  /**
   * Toggle entity debug visualization
   */
  toggleEntityDebug() {
    logNormal('🔍 Toggling entity debug...');
    if (typeof g_entityDebugManager !== 'undefined' && g_entityDebugManager) {
      g_entityDebugManager.toggle();
    } else {
      console.warn('⚠️ EntityDebugManager not found');
    }
  }

  /**
   * Select all ants in the game
   */
  selectAllAnts() {
    logNormal('🎯 Selecting all ants...');
    
    // Method 1: Use selection box controller (preferred)
    if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) {
      if (typeof g_selectionBoxController.selectAllEntities === 'function') {
        g_selectionBoxController.selectAllEntities();
        logNormal('✅ Selected all ants via SelectionBoxController');
        return;
      }
    }

    // Method 2: Get all ants from spatial grid and set isSelected
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
      const allAnts = spatialGridManager.getEntitiesByType('ant');
      let selected = 0;
      allAnts.forEach(ant => {
        if (ant && typeof ant.isSelected !== 'undefined') {
          ant.isSelected = true;
          selected++;
        }
      });
      if (selected > 0) {
        logNormal(`✅ Selected ${selected} ants via spatial grid`);
        return;
      }
    }
    
    console.warn('⚠️ Could not select ants - no compatible selection system found');
  }

  /**
   * Deselect all ants in the game
   */
  deselectAllAnts() {
    logNormal('🎯 Deselecting all ants...');
    
    // Method 1: Use selection box controller (preferred)
    if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) {
      if (typeof g_selectionBoxController.deselectAll === 'function') {
        g_selectionBoxController.deselectAll();
        logNormal('✅ Deselected all ants via SelectionBoxController');
        return;
      }
    }

    // Method 2: Get all ants from spatial grid and clear isSelected
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
      const allAnts = spatialGridManager.getEntitiesByType('ant');
      let deselected = 0;
      allAnts.forEach(ant => {
        if (ant && typeof ant.isSelected !== 'undefined') {
          ant.isSelected = false;
          deselected++;
        }
      });
      if (deselected > 0) {
        logNormal(`✅ Deselected ${deselected} ants via spatial grid`);
        return;
      }
    }
    
    console.warn('⚠️ Could not deselect ants - no compatible selection system found');
  }

  /**
   * Damage selected ants by specified amount
   */
  damageSelectedAnts(amount) {
    logNormal(`💥 Damaging selected entities by ${amount} HP...`);

    // Use selection controller to get selected entities (ants/buildings)
    let selected = [];
    try {
      if (g_selectionBoxController && typeof g_selectionBoxController.getSelectedEntities === 'function') {
        selected = g_selectionBoxController.getSelectedEntities() || [];
      }
    } catch (e) { 
      console.warn('⚠️ SelectionBoxController not available');
      selected = []; 
    }

    // If nothing selected, warn and return
    if (!selected || selected.length === 0) {
      console.warn('⚠️ No selected entities found to damage');
      return;
    }

    // Apply damage to any selected entity that supports takeDamage()
    let damagedCount = 0;
    selected.forEach(entity => {
      if (entity && typeof entity.takeDamage === 'function') {
        try { entity.takeDamage(amount); damagedCount++; } catch (e) { console.warn('Damage call failed', e); }
      }
    });

    if (damagedCount > 0) logNormal(`✅ Damaged ${damagedCount} selected entities by ${amount} HP`);
    else console.warn('⚠️ No selected entities supported takeDamage()');
  }

  /**
   * Damage selected ants by specified amount
   */
  damageSelectedAnts(amount) {
    logNormal(`� Damaging selected entities by ${amount} HP...`);
    
    // Use selection controller to get selected entities
    let selected = [];
    if (g_selectionBoxController && typeof g_selectionBoxController.getSelectedEntities === 'function') {
      selected = g_selectionBoxController.getSelectedEntities() || [];
    }

    if (!selected || selected.length === 0) {
      console.warn('⚠️ No selected entities found to damage');
      return;
    }

    // Apply takeDamage() to any selected entity that supports it
    let damagedCount = 0;
    selected.forEach(entity => {
      if (entity && typeof entity.takeDamage === 'function') {
        try {
          entity.takeDamage(amount);
          damagedCount++;
        } catch (e) {
          console.warn('takeDamage call failed', e);
        }
      }
    });

    if (damagedCount > 0) logNormal(`✅ Damaged ${damagedCount} selected entities by ${amount} HP`);
    else console.warn('⚠️ No selected entities supported takeDamage()');
  }

  /**
   * Heal selected ants by specified amount
   */
  healSelectedAnts(amount) {
    logNormal(`💚 Healing selected entities by ${amount} HP...`);
    
    // Use selection controller to get selected entities
    let selected = [];
    if (g_selectionBoxController && typeof g_selectionBoxController.getSelectedEntities === 'function') {
      selected = g_selectionBoxController.getSelectedEntities() || [];
    }

    if (!selected || selected.length === 0) {
      console.warn('⚠️ No selected entities found to heal');
      return;
    }

    // Apply heal() to any selected entity that supports it
    let healedCount = 0;
    selected.forEach(entity => {
      if (entity && typeof entity.heal === 'function') {
        try {
          entity.heal(amount);
          healedCount++;
        } catch (e) {
          console.warn('Heal call failed', e);
        }
      }
    });

    if (healedCount > 0) logNormal(`✅ Healed ${healedCount} selected entities by ${amount} HP`);
    else console.warn('⚠️ No selected entities supported heal()');
  }

  // --- Ant State Control Methods ---

  /**
   * Set selected ants to IDLE state
   */
  setSelectedAntsIdle() {
    logNormal('😴 Setting selected ants to IDLE state...');
    this._setSelectedAntsState('IDLE', 'OUT_OF_COMBAT', 'DEFAULT');
  }

  /**
   * Set selected ants to PATROL state
   */
  setSelectedAntsPatrol() {
    logNormal('🚶 Setting selected ants to PATROL state...');
    this._setSelectedAntsState('PATROL', 'OUT_OF_COMBAT', 'DEFAULT');
  }

  /**
   * Set selected ants to combat state
   */
  setSelectedAntsCombat() {
    logNormal('⚔️ Setting selected ants to COMBAT state...');
    this._setSelectedAntsState('MOVING', 'IN_COMBAT', 'DEFAULT');
  }

  /**
   * Set selected ants to BUILDING state
   */
  setSelectedAntsBuilding() {
    logNormal('🏗️ Setting selected ants to BUILDING state...');
    this._setSelectedAntsState('BUILDING', 'OUT_OF_COMBAT', 'DEFAULT');
  }

  /**
   * Set selected ants to GATHERING state for autonomous resource collection
   */
  setSelectedAntsGathering() {
    logNormal('🔍 Setting selected ants to GATHERING state...');
    this._setSelectedAntsState('GATHERING', 'OUT_OF_COMBAT', 'DEFAULT');
  }

  /**
   * Internal method to set ant states
   * @param {string} primaryState - Primary state to set
   * @param {string} combatModifier - Combat modifier to set
   * @param {string} terrainModifier - Terrain modifier to set
   */
  _setSelectedAntsState(primaryState, combatModifier, terrainModifier) {
    // Get selected entities from selection controller
    let selected = [];
    if (g_selectionBoxController && typeof g_selectionBoxController.getSelectedEntities === 'function') {
      selected = g_selectionBoxController.getSelectedEntities() || [];
    }

    if (!selected || selected.length === 0) {
      console.warn(`⚠️ No selected ants found to change state to ${primaryState}`);
      return;
    }

    // Change state for each selected ant
    let changedCount = 0;
    selected.forEach(entity => {
      // Check if entity is an ant with a state machine
      if (entity && entity.type === 'Ant' && entity.stateMachine) {
        try {
          if (typeof entity.stateMachine.setState === 'function') {
            const success = entity.stateMachine.setState(primaryState, combatModifier, terrainModifier);
            if (success) changedCount++;
          }
        } catch (e) {
          console.warn('setState call failed', e);
        }
      }
    });

    if (changedCount > 0) {
      logNormal(`✅ Changed state of ${changedCount} ants to ${primaryState}`);
    } else {
      console.warn(`⚠️ Could not change ant states - no compatible state machines found`);
    }
  }

  /**
   * Dump debug information to console
   */
  dumpConsole() {
    logNormal('📝 Dumping debug information...');
    console.table({
      'Panel Manager': {
        initialized: this.isInitialized,
        panelCount: this.panels.size,
        currentlyDragging: (this.currentlyDragging && this.currentlyDragging.config && this.currentlyDragging.config.id) ? this.currentlyDragging.config.id : 'none',
        trainMode: this.debugMode.panelTrainMode
      },
      'Game State': this.gameState,
      'Visible Panels': this.stateVisibility[this.gameState]
    });
  }

  /**
   * Dispose of the panel manager and cleanup resources
   */
  dispose() {
    this.panels.clear();
    this.isInitialized = false;
    logNormal('🗑️ DraggablePanelManager disposed');
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.DraggablePanelManager = DraggablePanelManager;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DraggablePanelManager;
}