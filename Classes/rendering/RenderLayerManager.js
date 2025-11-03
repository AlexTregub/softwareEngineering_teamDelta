/**
 * @fileoverview RenderLayerManager - Centralized layered rendering system
 * @module RenderLayerManager
 * @see {@link docs/api/RenderLayerManager.md} Complete API documentation
 * @see {@link docs/quick-reference.md} Layer system reference
 */



// Visual timeline (per frame)
//
// render(gameState)
//   layersToRender = getLayersForState(gameState)
//   for each layerName in layersToRender:
//     // Skip disabled layers
//     if (disabledLayers.has(layerName)) -> continue
//
//     layerStart = now
//
//     // Get and call renderer for this layer (renderer usually handles push()/applyZoom()/pop())
//     renderer = layerRenderers.get(layerName)
//     if (renderer) {
//       renderer(gameState)
//     }
//
//     // Call any extra drawables registered for this layer (executed in global canvas state after renderer returned)
//     drawables = layerDrawables.get(layerName)
//     if (drawables && drawables.length) {
//       for each fn in drawables:
//         fn(gameState)
//     }
//
//     layerEnd = now
//     renderStats.layerTimes[layerName] = layerEnd - layerStart
//
// // After all layers: update button groups
// // Update renderStats (frameCount, lastFrameTime, etc.)

/**
 * Manages rendering layers from terrain to UI with performance optimization.
 * 
 * **Layers**: TERRAIN → ENTITIES → EFFECTS → UI_GAME → UI_DEBUG → UI_MENU
 * 
 * @class RenderLayerManager
 * @see {@link docs/api/RenderLayerManager.md} Full documentation and examples
 */
class RenderLayerManager {
  constructor() {
    /**
     * Rendering layers in order (bottom to top)
     */ 
    this.layers = {
      TERRAIN: 'terrain',      // Static terrain, cached
      ENTITIES: 'entities',    // Dynamic game objects (ants, resources)
      EFFECTS: 'effects',      // Particle effects, visual effects, screen effects
      UI_GAME: 'ui_game',     // In-game UI (currencies, selection, dropoff)
      UI_DEBUG: 'ui_debug',   // Debug overlays (console, performance)
      UI_MENU: 'ui_menu'      // Menu system and transitions
    };
    
    // Layer rendering functions
    this.layerRenderers = new Map();
    
    // Layer drawables (additional callbacks appended to a layer)
    this.layerDrawables = new Map();
    
    // Layer toggle state for debugging
    this.disabledLayers = new Set();
    
    // Performance tracking
    this.renderStats = {
      frameCount: 0,
      lastFrameTime: 0,
      layerTimes: {}
    };
    
    // Cache management
    this.cacheStatus = {
      terrainCacheValid: false,
      lastTerrainUpdate: 0
    };
    
    this.isInitialized = false;

  // Interactive drawables per layer (topmost last in array)
  this.layerInteractives = new Map();

  // Pointer capture info: { owner: interactiveObj, pointerId }
  this._pointerCapture = null;

    // set this to true in conjucntion with a seperate rendering function to skip the rendering pipeline
    // Temp fix for draggable panels
    this._RenderMangerOverwrite = false
    /** When the renderer is overwritten, set this to true, then once the
     * renderer overwrite is done, start a timer. when that timer is done
     * set _RendererOverwritten to false
    */
    this._RendererOverwritten = false 
    this.__RendererOverwriteTimer = 0
    this.__RendererOverwriteLast = 0;
    this._overwrittenRendererFn = null;
    this._RendererOverwriteTimerMax = 1; // seconds (default)
  }
  
  /**
   * Initialize the rendering system
   * Called once during setup
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Register default layer renderers
    this.registerLayerRenderer(this.layers.TERRAIN, this.renderTerrainLayer.bind(this));
    this.registerLayerRenderer(this.layers.ENTITIES, this.renderEntitiesLayer.bind(this));
    this.registerLayerRenderer(this.layers.EFFECTS, this.renderEffectsLayer.bind(this));
    this.registerLayerRenderer(this.layers.UI_GAME, this.renderGameUILayer.bind(this));
    this.registerLayerRenderer(this.layers.UI_DEBUG, this.renderDebugUILayer.bind(this));
    this.registerLayerRenderer(this.layers.UI_MENU, this.renderMenuUILayer.bind(this));
    
    // Ensure all layers are enabled by default
    this.enableAllLayers();
    
    this.isInitialized = true;


    // Register common drawables once (guarded to avoid double-registration)
  try {
    if (!RenderManager._registeredDrawables) RenderManager._registeredDrawables = {};

    // Register SelectionBoxController as an interactive so RenderManager dispatches pointer events to it
    try {
      if (g_selectionBoxController && !RenderManager._registeredDrawables.selectionBoxInteractive) {
        const selectionAdapter = {
          hitTest: function(pointer) {
            // Always allow selection adapter to receive events on the UI layer
            return true;
          },
          _toWorld: function(px, py) {
            try {
              const cam = (typeof window !== 'undefined' && window.g_cameraManager) ? window.g_cameraManager : (typeof cameraManager !== 'undefined' ? cameraManager : null);
              if (cam && typeof cam.screenToWorld === 'function') {
                const w = cam.screenToWorld(px, py);
                return { x: (w.worldX !== undefined ? w.worldX : (w.x !== undefined ? w.x : px)), y: (w.worldY !== undefined ? w.worldY : (w.y !== undefined ? w.y : py)) };
              }
              // fallback: use global camera offsets if present
              const camX = (typeof window !== 'undefined' && typeof window.cameraX !== 'undefined') ? window.cameraX : 0;
              const camY = (typeof window !== 'undefined' && typeof window.cameraY !== 'undefined') ? window.cameraY : 0;
              return { x: px + camX, y: py + camY };
            } catch (e) { return { x: px, y: py }; }
          },
          onPointerDown: function(pointer) {
            try {
              if (g_selectionBoxController && typeof g_selectionBoxController.handleClick === 'function') {
                // SelectionBoxController expects screen-local coordinates (it adds cameraX internally)
                g_selectionBoxController.handleClick(pointer.screen.x, pointer.screen.y, 'left');
                return true;
              }
            } catch (e) { console.warn('selectionAdapter.onPointerDown failed', e); }
            return false;
          },
          onPointerMove: function(pointer) {
            try {
              if (g_selectionBoxController && typeof g_selectionBoxController.handleDrag === 'function') {
                g_selectionBoxController.handleDrag(pointer.screen.x, pointer.screen.y);
                return true;
              }
            } catch (e) { /* ignore */ }
            return false;
          },
          onPointerUp: function(pointer) {
            try {
              if (g_selectionBoxController && typeof g_selectionBoxController.handleRelease === 'function') {
                g_selectionBoxController.handleRelease(pointer.screen.x, pointer.screen.y, 'left');
                return true;
              }
            } catch (e) { /* ignore */ }
            return false;
          }
        };
        RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, selectionAdapter);
        RenderManager._registeredDrawables.selectionBoxInteractive = true;
      }
    } catch (e) { console.warn('Failed to register selection adapter with RenderManager', e); }
    // Selection box should render in the UI_GAME layer
    if (g_selectionBoxController && !RenderManager._registeredDrawables.selectionBox) {
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, g_selectionBoxController.draw.bind(g_selectionBoxController));
      RenderManager._registeredDrawables.selectionBox = true;
    }

    // Gather debug renderer overlays (effects layer)
    if (typeof g_gatherDebugRenderer !== 'undefined' && g_gatherDebugRenderer && !RenderManager._registeredDrawables.gatherDebug) {
      if (typeof g_gatherDebugRenderer.render === 'function') {
        RenderManager.addDrawableToLayer(RenderManager.layers.EFFECTS, g_gatherDebugRenderer.render.bind(g_gatherDebugRenderer));
        RenderManager._registeredDrawables.gatherDebug = true;
      }
    }

    // Dropoff UI and pause menu UI belong to UI_GAME layer if available
    if (typeof window !== 'undefined') {
      if (typeof window.drawDropoffUI === 'function' && !RenderManager._registeredDrawables.drawDropoffUI) {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.drawDropoffUI.bind(window));
        RenderManager._registeredDrawables.drawDropoffUI = true;
      }
      if (typeof window.renderPauseMenuUI === 'function' && !RenderManager._registeredDrawables.renderPauseMenuUI) {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.renderPauseMenuUI.bind(window));
        RenderManager._registeredDrawables.renderPauseMenuUI = true;
      }
    }

    // Draggable panels: ensure the manager is registered to UI layer
    if (typeof window !== 'undefined' && window.draggablePanelManager && !RenderManager._registeredDrawables.draggablePanelManager) {
      if (typeof window.draggablePanelManager.render === 'function') {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.draggablePanelManager.render.bind(window.draggablePanelManager));
        RenderManager._registeredDrawables.draggablePanelManager = true;
      }
    }

    // Brush systems: register render methods to UI_GAME layer
    if (window.g_enemyAntBrush && !RenderManager._registeredDrawables.enemyAntBrush) {
      if (typeof window.g_enemyAntBrush.render === 'function') {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.g_enemyAntBrush.render.bind(window.g_enemyAntBrush));
        RenderManager._registeredDrawables.enemyAntBrush = true;
      }
    }
    
    if (window.g_resourceBrush && !RenderManager._registeredDrawables.resourceBrush) {
      if (typeof window.g_resourceBrush.render === 'function') {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.g_resourceBrush.render.bind(window.g_resourceBrush));
        RenderManager._registeredDrawables.resourceBrush = true;
      }
    }
    
    if (window.g_buildingBrush && !RenderManager._registeredDrawables.buildingBrush) {
      if (typeof window.g_buildingBrush.render === 'function') {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.g_buildingBrush.render.bind(window.g_buildingBrush));
        RenderManager._registeredDrawables.buildingBrush = true;
      }
    }
    
    if (window.g_lightningAimBrush && !RenderManager._registeredDrawables.lightningAimBrush) {
      if (typeof window.g_lightningAimBrush.render === 'function') {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.g_lightningAimBrush.render.bind(window.g_lightningAimBrush));
        RenderManager._registeredDrawables.lightningAimBrush = true;
      }
    }
  } catch (err) {
    console.error('❌ Error registering drawables with RenderManager:', err);
  }
  }
  
  /**
   * Register a custom renderer for a specific layer
   */
  registerLayerRenderer(layerName, rendererFunction) {
    this.layerRenderers.set(layerName, rendererFunction);
  }

  /**
   * Add a drawable callback to a layer (does not replace existing renderer).
   * Drawable signature: function(gameState) { ...drawing code... }
   * 
   * This stores callbacks per layer
   * Each frame, RenderLayerManager.render() will run the layer's registered
   * renderer first, then call each drawable callback for that layer in order.
   * All this is wrapped with the error handling and timing measurements
   */
  addDrawableToLayer(layerName, drawableFn) {
    if (!this.layerDrawables.has(layerName)) {
      this.layerDrawables.set(layerName, []);
    }
    this.layerDrawables.get(layerName).push(drawableFn);
  }

  /**
   * Register an interactive drawable object for a layer.
   * interactiveObj should implement:
   *  - hitTest(pointer) => boolean
   *  - onPointerDown(pointer) / onPointerMove(pointer) / onPointerUp(pointer) (optional)
   *  - update(pointer) (optional)
   *  - render(gameState, pointer) (optional)
   * The object will be considered in top-down order (last registered is topmost).
   */
  addInteractiveDrawable(layerName, interactiveObj) {
    if (!this.layerInteractives.has(layerName)) this.layerInteractives.set(layerName, []);
    this.layerInteractives.get(layerName).push(interactiveObj);
  }

  /**
   * Remove an interactive drawable from a layer.
   */
  removeInteractiveDrawable(layerName, interactiveObj) {
    const arr = this.layerInteractives.get(layerName);
    if (!arr) return false;
    const idx = arr.indexOf(interactiveObj);
    if (idx === -1) return false;
    arr.splice(idx, 1);
    return true;
  }

  /**
   * Remove a drawable callback from a layer.
   */
  removeDrawableFromLayer(layerName, drawableFn) {
    const arr = this.layerDrawables.get(layerName);
    if (!arr) return false;
    const idx = arr.indexOf(drawableFn);
    if (idx === -1) return false;
    arr.splice(idx, 1);
    return true;
  }
  
  /**
   * Main render call - renders all layers based on game state
   */
  render(gameState) {
    if (!this.isInitialized) {
      console.warn('RenderLayerManager not initialized');
      return;
    }
    // If an external temporary renderer has been installed, call it and
    // skip the normal pipeline until its timer expires. This supports
    // short-lived overrides (e.g., draggable-panel special rendering).
    if (this._RenderMangerOverwrite && this._RendererOverwritten && typeof this._overwrittenRendererFn === 'function') {
      const overwriteStart = performance.now();
      try {
        // Call the custom renderer. It is responsible for doing its own
        // push/pop and transforms as needed.
        this._overwrittenRendererFn(gameState);
      } catch (err) {
        console.error('Error in overwritten renderer function:', err);
      }

      // Update overwrite timer using elapsed time since last tick
      const now = performance.now();
      if (!this.__RendererOverwriteLast) this.__RendererOverwriteLast = now;
      const deltaSec = (now - this.__RendererOverwriteLast) / 1000.0;
      this.__RendererOverwriteLast = now;
      this.__RendererOverwriteTimer -= deltaSec;

      if (this.__RendererOverwriteTimer <= 0) {
        // Timer expired — clear overwrite state
        this._RenderMangerOverwrite = false;
        this._RendererOverwritten = false;
        this.__RendererOverwriteTimer = 0;
        this.__RendererOverwriteLast = 0;
        this._overwrittenRendererFn = null;
      }

      // Update performance stats minimally and return (skip normal pipeline)
      this.renderStats.frameCount++;
      this.renderStats.lastFrameTime = performance.now() - overwriteStart;
      return;
    }

    const frameStart = performance.now();
    
    // Determine which layers to render based on game state
    const layersToRender = this.getLayersForState(gameState);
    
    // Render each layer in order (skip disabled layers)
    for (const layerName of layersToRender) {
      // Skip disabled layers
      if (this.disabledLayers.has(layerName)) {
        if (layerName == this.layers.TERRAIN) { background(0); }
        continue;
      }
      
      const layerStart = performance.now();

      // Prepare pointer context for this layer (screen coords always available)
      const pointer = {
        screen: { x: mouseX, y: mouseY },
        isPressed: mouseIsPressed,
        // world will be populated below for layers that apply camera transforms
        world: null,
        // optional motion deltas for drag-aware interactives (world-space)
        dx: 0,
        dy: 0,
        layer: layerName,
        pointerId: 0
      };

      // If this layer applies camera zoom/translate, compute world coords
      // using cameraManager.screenToWorld so interactive hit tests can use
      // world coordinates without re-performing transforms in every adapter.
      try {
        if ([this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS].includes(layerName)) {
          try {
            const cam = (typeof cameraManager !== 'undefined') ? cameraManager : (typeof window !== 'undefined' ? window.g_cameraManager : null);
            if (cam && typeof cam.screenToWorld === 'function') {
              const w = cam.screenToWorld(pointer.screen.x, pointer.screen.y);
              if (w) {
                const wx = (w.worldX !== undefined) ? w.worldX : (w.x !== undefined ? w.x : null);
                const wy = (w.worldY !== undefined) ? w.worldY : (w.y !== undefined ? w.y : null);
                // compute world deltas based on last known pointer per layer/pointerId
                pointer.world = { x: wx, y: wy, worldX: wx, worldY: wy };
                // compute dx/dy if previous sample exists
                try {
                  this.__lastPointerSamples = this.__lastPointerSamples || {};
                  const key = `${layerName}:0`;
                  const last = this.__lastPointerSamples[key];
                  if (last && typeof last.x === 'number') {
                    pointer.dx = pointer.world.x - last.x;
                    pointer.dy = pointer.world.y - last.y;
                  } else {
                    pointer.dx = 0; pointer.dy = 0;
                  }
                  // store current sample for next frame
                  this.__lastPointerSamples[key] = { x: pointer.world.x, y: pointer.world.y };
                } catch (e) { /* non-fatal */ }
              } else {
                pointer.world = null;
              }
            } else {
              pointer.world = null;
            }
          } catch (err) {
            console.warn('Warning: failed to compute pointer.world for layer', layerName, err);
            pointer.world = null;
          }
        }
      } catch (err) {
        // non-fatal: leave pointer.world null if conversion fails
        console.warn('Warning: failed to compute pointer.world for layer', layerName, err);
        pointer.world = null;
      }

      // Call interactive update hooks before rendering so visuals reflect input state
      const interactives = this.layerInteractives.get(layerName);
      if (interactives && interactives.length) {
        // iterate in registration order; topmost being last in array
        for (const interactive of interactives) {
          try {
            if (typeof interactive.update === 'function') {
              interactive.update(pointer);
            }
          } catch (err) {
            console.error('Error updating interactive drawable:', err);
          }
        }
      }

      const renderer = this.layerRenderers.get(layerName);
      if (renderer) {
        try {
          renderer(gameState);
        } catch (error) {
          console.error(`Error rendering layer ${layerName}:`, error);
        }
      }
      
      // Call any extra drawables registered for this layer
      const drawables = this.layerDrawables.get(layerName);
      if (drawables && drawables.length) {
        for (const fn of drawables) {
          try {
            fn(gameState);
          } catch (err) {
            console.error(`Error in drawable for layer ${layerName}:`, err);
          }
        }
      }

      // After renderer and drawables, render interactive visuals if they implement render()
      if (interactives && interactives.length) {
        // render in registration order so topmost is drawn last
        for (const interactive of interactives) {
          try {
            if (typeof interactive.render === 'function') {
              interactive.render(gameState, pointer);
            }
          } catch (err) {
            console.error('Error rendering interactive drawable:', err);
          }
        }
      }
      
      const layerEnd = performance.now();
      this.renderStats.layerTimes[layerName] = layerEnd - layerStart;
    }
    
    // Update performance stats
    this.renderStats.frameCount++;
    this.renderStats.lastFrameTime = performance.now() - frameStart;
  }
  
  /**
   * Determine which layers should be rendered for the current game state
   */
  getLayersForState(gameState) {
    switch (gameState) {
      case 'MENU':
      case 'OPTIONS':
        return [this.layers.TERRAIN, this.layers.UI_MENU];
        
      case 'KANBAN':
        return [this.layers.TERRAIN, this.layers.UI_MENU];
        
      case 'DEBUG_MENU':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS, this.layers.UI_DEBUG, this.layers.UI_MENU];
        
      case 'PLAYING':
      case 'IN_GAME':
        // IN_GAME state for custom level gameplay - same layers as PLAYING
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS, this.layers.UI_GAME, this.layers.UI_DEBUG];
        
      case 'PAUSED':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS, this.layers.UI_GAME];
        
      case 'GAME_OVER':
        return [this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS, this.layers.UI_GAME, this.layers.UI_MENU];
        
      case 'LEVEL_EDITOR':
        // Level Editor needs UI layers for draggable panels
        return [this.layers.UI_GAME, this.layers.UI_DEBUG];
        
      default:
        console.warn(`Unknown game state: ${gameState}`);
        return [this.layers.TERRAIN, this.layers.UI_MENU];
    }
  }
  
  /**
   * TERRAIN LAYER - Cached background rendering
   */
  renderTerrainLayer(gameState) {
    // Skip terrain rendering for Level Editor - it handles its own background
    if (gameState === 'LEVEL_EDITOR') {
      return;
    }
    
    // Only render terrain for game states that need it
    if (!['PLAYING', 'IN_GAME', 'PAUSED', 'GAME_OVER', 'DEBUG_MENU', 'MENU', 'OPTIONS'].includes(gameState)) {
      background(0);
      return;
    }
    // Always draw a background to remove smearing pixels
    background(0);
    push();
    this.applyZoom();
    g_activeMap.render();
    pop();
    
  }
  /**
   * Applies camera transform (translation + zoom) for world-space rendering.
   * CRITICAL: Must apply BOTH camera position AND zoom.
   * Make sure you surround this with push() and pop() or everything will transform incorrectly.
   */
  applyZoom(){
    // Get camera position and zoom from cameraManager
    let cameraPos = null;
    let zoom = 1.0;
    
    if (typeof cameraManager !== 'undefined' && cameraManager) {
      // Try to get camera position
      if (typeof cameraManager.getCameraPosition === 'function') {
        cameraPos = cameraManager.getCameraPosition();
      }
      
      // Fallback to direct property access if method fails or returns null
      if (!cameraPos && typeof cameraManager.cameraX === 'number') {
        cameraPos = { x: cameraManager.cameraX, y: cameraManager.cameraY };
      }
      
      // Get zoom level
      if (typeof cameraManager.getZoom === 'function') {
        zoom = cameraManager.getZoom();
      } else if (typeof cameraManager.cameraZoom === 'number') {
        zoom = cameraManager.cameraZoom;
      }
    }
    
    // Final fallback if camera position is still null
    if (!cameraPos) {
      cameraPos = { x: 0, y: 0 };
    }
    
    // CRITICAL: Order matters! Translate camera position first, THEN scale
    // This matches CameraManager.applyTransform() behavior
    translate(-cameraPos.x, -cameraPos.y);
    scale(zoom);
    
    // Update global canvas dimensions (for other systems that depend on it)
    g_canvasX = windowWidth;
    g_canvasY = windowHeight;
  }
  
  /**
   * ENTITIES LAYER - Dynamic game objects
   */
  renderEntitiesLayer(gameState) {
    // Only render entities during gameplay states
    if (!['PLAYING', 'IN_GAME', 'PAUSED', 'GAME_OVER', 'DEBUG_MENU'].includes(gameState)) {
      return;
    }
    
    push();
    this.applyZoom();
    
    // Get the EntityRenderer instance (not the class)
    const entityRenderer = (typeof window !== 'undefined') ? window.EntityRenderer : 
                          (typeof global !== 'undefined') ? global.EntityRenderer : null;

    // Use EntityRenderer instance for all entity rendering
    if (entityRenderer && typeof entityRenderer.renderAllLayers === 'function') {
      entityRenderer.renderAllLayers(gameState);
    }
    pop();
  }

  /**
   * EFFECTS LAYER - Particle effects, visual effects, screen effects
   */
  renderEffectsLayer(gameState) {
    // Render effects in most game states
    if (!['PLAYING', 'IN_GAME', 'PAUSED', 'GAME_OVER', 'DEBUG_MENU', 'MAIN_MENU'].includes(gameState)) {
      return;
    }
    
    
    push();
    this.applyZoom();
    // Get the EffectsRenderer instance
    const effectsRenderer = (typeof window !== 'undefined') ? window.EffectsRenderer : 
                           (typeof global !== 'undefined') ? global.EffectsRenderer : null;

    // Use EffectsRenderer for all effect rendering
    if (effectsRenderer && typeof effectsRenderer.renderEffects === 'function') {
      effectsRenderer.renderEffects(gameState);
    }
    
    // Render Fireball System (projectile effects)
    this.renderFireballEffects(gameState);
    pop();
  }
  

  
  /**
   * GAME UI LAYER - In-game interface elements
   */
  renderGameUILayer(gameState) {
    if (!['PLAYING', 'IN_GAME', 'PAUSED', 'GAME_OVER'].includes(gameState)) { return; }
    
    // Use comprehensive UI renderer
    const uiRenderer = (typeof window !== 'undefined') ? window.UIRenderer : 
                      (typeof global !== 'undefined') ? global.UIRenderer : null;
    
    if (uiRenderer) {
      //uiRenderer.renderUI(gameState);
      this.renderBaseGameUI();
      this.renderInteractionUI(gameState);
      // Render state-specific overlays
      if (gameState === 'PAUSED') { this.renderPauseOverlay(); } 
      if (gameState === 'GAME_OVER') { this.renderGameOverOverlay();  }
          // Render Universal Button Group System (always on top of other UI)
      this.renderButtonGroups(gameState);
    
    // Render Queen Control Panel (part of UI_GAME layer)
    this.renderQueenControlPanel(gameState);
    } 
    

  }
  
  /**
   * Render base game UI elements (currencies, selection)
   * @private
   */
  renderBaseGameUI() {
    // Render currencies
    if (renderCurrencies) {
      renderCurrencies();
    }
    
    // Selection box
    if (g_selectionBoxController) {
      g_selectionBoxController.draw();
    }
  }
  
  /**
   * Render interaction UI elements (dropoff, spawn)
   * @private
   */
  renderInteractionUI(gameState) {
    // Only show interaction UI during active gameplay
    if (gameState !== 'PLAYING' && gameState !== 'IN_GAME') return;
    
    window.updateDropoffUI();
    window.drawDropoffUI();
  }
  
  /**
   * DEBUG UI LAYER - Development overlays
   */
  renderDebugUILayer(gameState) {
    // Debug elements can appear in any state except pure menu
    if (gameState === 'MENU' || gameState === 'OPTIONS') {
      return;
    }
    
    // Render existing PerformanceMonitor if enabled
    if (g_performanceMonitor && g_performanceMonitor.debugDisplay && g_performanceMonitor.debugDisplay.enabled &&
        typeof g_performanceMonitor.render === 'function') {
      g_performanceMonitor.render();
    }

    // Render dev console indicator if enabled
    if (isDevConsoleEnabled()) {
      drawDevConsoleIndicator();
    }
    
    // Render UIRenderer debug elements as fallback
    const uiRenderer = (typeof window !== 'undefined') ? window.UIRenderer : 
                      (typeof global !== 'undefined') ? global.UIRenderer : null;
    
    if (uiRenderer && uiRenderer.config.enableDebugUI) {
      if (uiRenderer.debugUI.entityInspector.enabled) {
        uiRenderer.renderEntityInspector();
      }
    }
    
    // Debug grid for playing state
    if ((gameState === 'PLAYING' || gameState === 'IN_GAME') && window.drawDebugGrid) {
      if (window.g_gridMap) {
        window.drawDebugGrid(window.TILE_SIZE, window.g_gridMap.width, window.g_gridMap.height);
      }
    }

         // Render existing debug console if active
    if (isCommandLineActive()) {
      drawCommandLine();
    }

    // Render mouse crosshair
    if (typeof g_mouseCrosshair !== 'undefined' && g_mouseCrosshair) {
      g_mouseCrosshair.update();
      g_mouseCrosshair.render();
    }

    // Render coordinate debug overlay
    if (typeof g_coordinateDebugOverlay !== 'undefined' && g_coordinateDebugOverlay) {
      g_coordinateDebugOverlay.render();
    }
  }
  
  /**
   * MENU UI LAYER - Menu system and transitions
   */
  renderMenuUILayer(gameState) {
    // Handle Kanban presentation state
    if (gameState === 'KANBAN') {
      if (typeof renderKanbanPresentation !== 'undefined') {
        renderKanbanPresentation();
      } else {
        // Fallback rendering if PresentationPanel.js not loaded
        background(20, 20, 30);
        fill(255, 0, 0);
        textAlign(LEFT, TOP);
        textSize(24);
        text('05:00', 20, 20);
        
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(32);
        text('Presentation', width / 2, height / 2);
      }
      return;
    }
    
    // Always use the legacy menu rendering directly - no UIRenderer fallback
    if (updateMenu) {
      updateMenu();
    }
    
    // Render menu if in menu states
    if (['MENU', 'OPTIONS', 'DEBUG_MENU', 'GAME_OVER'].includes(gameState)) {
      if (renderMenu) {
        renderMenu();
      }
    }
    
    // Render Sprint 5 image overlay if enabled and in MENU state
    if (gameState === 'MENU' && typeof renderSprintImageInMenu !== 'undefined') {
      renderSprintImageInMenu();
    }
  }
  
  /**
   * Pause overlay rendering
   */
  renderPauseOverlay() {
    /*
    fill(0, 0, 0, 150);
    rect(0, 0, g_canvasX, g_canvasY);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("PAUSED", g_canvasX / 2, g_canvasY / 2);
    textSize(24);
    text("Press ESC to resume", g_canvasX / 2, g_canvasY / 2 + 60);
    */
  }
  
  /**
   * Game over overlay rendering
   */
  renderGameOverOverlay() {
    fill(0, 0, 0, 180);
    rect(0, 0, g_canvasX, g_canvasY);
    
    fill(255, 100, 100);
    textAlign(CENTER, CENTER);
    textSize(64);
    text("GAME OVER", g_canvasX / 2, g_canvasY / 2 - 50);
    
    fill(255);
    textSize(24);
    text("Press R to restart or ESC for menu", g_canvasX / 2, g_canvasY / 2 + 50);
  }
  
  /**
   * Invalidate terrain cache (call when terrain changes)
   */
  invalidateTerrainCache() {
    this.cacheStatus.terrainCacheValid = false;
    this.cacheStatus.lastTerrainUpdate = Date.now();
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.renderStats,
      avgFrameTime: this.renderStats.frameCount > 0 ? 
        Object.values(this.renderStats.layerTimes).reduce((a, b) => a + b, 0) / this.renderStats.frameCount : 0
    };
  }
  
  /**
   * Reset performance tracking
   */
  resetStats() {
    this.renderStats = {
      frameCount: 0,
      lastFrameTime: 0,
      layerTimes: {}
    };
  }
  
  /**
   * Render Universal Button Group System
   * Integrated into the UI rendering pipeline
   * @private
   */
  renderButtonGroups(gameState) {
    // Only render buttons in appropriate game states (including MENU for testing)
    if (!['PLAYING', 'IN_GAME', 'PAUSED', 'GAME_OVER', 'MENU', 'DEBUG_MENU'].includes(gameState)) {
      return;
    }
    
    // ButtonGroupManager has been removed from the codebase
  }
  
  /**
   * Render Queen Control Panel on UI_GAME layer
   */
  renderQueenControlPanel(gameState) {
    // Only render in playing states
    if (!['PLAYING', 'IN_GAME', 'PAUSED'].includes(gameState)) {
      return;
    }
    
    // Check if Queen Control Panel is available and visible
    if (window.g_queenControlPanel && 
        typeof window.g_queenControlPanel.render === 'function') {
      
      try {
        // Render queen control panel visual effects (targeting cursor, range indicator)
        window.g_queenControlPanel.render();
      } catch (error) {
        console.error('❌ Error rendering queen control panel in UI layer:', error);
      }
    }
  }
  
  /**
   * Render Fireball System on EFFECTS layer
   */
  renderFireballEffects(gameState) {
    // Only render in playing states
    if (!['PLAYING', 'IN_GAME', 'PAUSED'].includes(gameState)) {
      return;
    }
    
    // Check if Fireball System is available
    if (window.g_fireballManager && 
        typeof window.g_fireballManager.render === 'function') {
      
      try {
        // Render fireball projectiles and effects
        window.g_fireballManager.render();
      } catch (error) {
        console.error('❌ Error rendering fireball system in effects layer:', error);
      }
    }

    // Also render Lightning System soot stains and effects if available
    if (window.g_lightningManager && typeof window.g_lightningManager.render === 'function') {
      try {
        window.g_lightningManager.render();
      } catch (error) {
        console.error('❌ Error rendering lightning system in effects layer:', error);
      }
    }
  }
  
  /**
   * Toggle a specific render layer on/off
   * @param {string} layerName - The layer to toggle
   */
  toggleLayer(layerName) {
    if (this.disabledLayers.has(layerName)) {
      this.disabledLayers.delete(layerName);
    } else {
      this.disabledLayers.add(layerName);
    }
    return !this.disabledLayers.has(layerName);
  }
  
  /**
   * Enable a specific render layer
   * @param {string} layerName - The layer to enable
   * @returns {boolean} True if layer is now enabled
   */
  enableLayer(layerName) {
    if (this.disabledLayers.has(layerName)) {
      this.disabledLayers.delete(layerName);
    }
    return true; // Layer is now enabled
  }
  
  /**
   * Disable a specific render layer
   * @param {string} layerName - The layer to disable
   * @returns {boolean} True if layer is now disabled
   */
  disableLayer(layerName) {
    if (!this.disabledLayers.has(layerName)) {
      this.disabledLayers.add(layerName);
    }
    return false; // Layer is now disabled (returns the enabled state)
  }
  
  /**
   * Check if a layer is enabled
   * @param {string} layerName - The layer to check
   * @returns {boolean} True if layer is enabled
   */
  isLayerEnabled(layerName) {
    return !this.disabledLayers.has(layerName);
  }
  
  /**
   * Get current layer toggle states for debugging
   * @returns {Object} Layer states
   */
  getLayerStates() {
    const states = {};
    Object.values(this.layers).forEach(layer => {
      states[layer] = this.isLayerEnabled(layer);
    });
    return states;
  }
  
  /**
   * Reset all layers to enabled
   */
  enableAllLayers() {
    this.disabledLayers.clear();
  }
  
  /**
   * Force all layers to be visible (console command)
   */
  forceAllLayersVisible() {
    this.enableAllLayers();
    logNormal('✅ All render layers forced visible:', this.getLayerStates());
    return this.getLayerStates();
  }

  /**
   * Dispatch a pointer event (down/move/up) to interactive drawables.
   * The dispatch proceeds top-down (topmost first) and stops when a handler
   * returns true (consumes the event).
   * eventType: 'pointerdown' | 'pointermove' | 'pointerup'
   * evt: original event or { x, y, pointerId }
   */
  dispatchPointerEvent(eventType, evt) {
    // Build a pointer object (screen coords for now)
    // Normalize incoming coordinates: Puppeteer/page may pass client (page) coordinates.
    // Convert to canvas-local coordinates (same coordinate space as p5 mouseX/mouseY)
    let screenX = (evt.x !== undefined && evt.x !== null) ? evt.x : mouseX;
    let screenY = (evt.y !== undefined && evt.y !== null) ? evt.y : mouseY;
    try {
      const canvas = (typeof document !== 'undefined') ? (document.getElementById('defaultCanvas0') || document.querySelector('canvas')) : null;
      if (canvas && (evt.x !== undefined && evt.x !== null)) {
        const rect = canvas.getBoundingClientRect();
        screenX = evt.x - rect.left;
        screenY = evt.y - rect.top;
      }
    } catch (e) { /* ignore normalization failures and fall back to provided coords */ }

    const pointer = {
      screen: { x: screenX, y: screenY },
      pointerId: evt.pointerId ?? 0,
      isPressed: !!evt.isPressed,
      world: null,
      layer: null,
      dx: evt.dx ?? 0,
      dy: evt.dy ?? 0
    };

    // If pointer is captured by something, forward directly
    if (this._pointerCapture && this._pointerCapture.owner) {
      const owner = this._pointerCapture.owner;
      const handlerName = this._mapEventToHandler(eventType);
      if (handlerName && typeof owner[handlerName] === 'function') {
        try {
          const consumed = owner[handlerName](pointer) === true;
          if (eventType === 'pointerup') {
            // release capture on pointerup
            this._pointerCapture = null;
          }
          return consumed;
        } catch (err) {
          console.error('Error in captured pointer handler:', err);
        }
      }
    }

    // otherwise iterate layers top-to-bottom (we want topmost layers first)
    const layers = Array.from(this.getLayersForState(window.GameState ? window.GameState.getState() : 'PLAYING'));
    // iterate layers in reverse so UI_MENU (top) is first
    for (let i = layers.length - 1; i >= 0; i--) {
      const layerName = layers[i];
      // compute layer-specific world coords for this event before dispatch
      pointer.layer = layerName;
      // compute layer-specific world coords and motion deltas
      try {
        const cam = (typeof cameraManager !== 'undefined') ? cameraManager : (typeof window !== 'undefined' ? window.g_cameraManager : null);
        if ([this.layers.TERRAIN, this.layers.ENTITIES, this.layers.EFFECTS].includes(layerName) && cam && typeof cam.screenToWorld === 'function') {
          const w = cam.screenToWorld(pointer.screen.x, pointer.screen.y);
          if (w) {
            const wx = (w.worldX !== undefined) ? w.worldX : (w.x !== undefined ? w.x : null);
            const wy = (w.worldY !== undefined) ? w.worldY : (w.y !== undefined ? w.y : null);
            pointer.world = { x: wx, y: wy, worldX: wx, worldY: wy };
            // compute dx/dy using last sample stored per layer and pointerId
            try {
              this.__lastPointerSamples = this.__lastPointerSamples || {};
              const key = `${layerName}:${pointer.pointerId}`;
              const last = this.__lastPointerSamples[key];
              if (last && typeof last.x === 'number') {
                pointer.dx = pointer.world.x - last.x;
                pointer.dy = pointer.world.y - last.y;
              } else {
                pointer.dx = 0; pointer.dy = 0;
              }
              this.__lastPointerSamples[key] = { x: pointer.world.x, y: pointer.world.y };
            } catch (e) { /* ignore sample errors */ }
          } else {
            pointer.world = null;
          }
        } else {
          pointer.world = null;
        }
      } catch (err) {
        pointer.world = null;
      }
      const interactives = this.layerInteractives.get(layerName);
      if (!interactives || !interactives.length) continue;

      // iterate interactives from last registered (topmost) to first
      for (let j = interactives.length - 1; j >= 0; j--) {
        const interactive = interactives[j];
        try {
          if (typeof interactive.hitTest === 'function' && interactive.hitTest(pointer)) {
            const handlerName = this._mapEventToHandler(eventType);
            if (handlerName && typeof interactive[handlerName] === 'function') {
              const consumed = interactive[handlerName](pointer) === true;
              if (consumed) {
                logNormal(`🎯 Event consumed by interactive on layer ${layerName}:`, interactive.id || interactive.constructor?.name || 'unknown');
                // If interactive wants pointer capture, it should set capture via return value or property
                if (interactive.capturePointer) {
                  this._pointerCapture = { owner: interactive, pointerId: pointer.pointerId };
                }
                return true; // stop propagation
              }
            }
          }
        } catch (err) {
          console.error('Error dispatching pointer event to interactive:', err);
        }
      }
    }

    return false; // not consumed
  }

  _mapEventToHandler(eventType) {
    switch (eventType) {
      case 'pointerdown': return 'onPointerDown';
      case 'pointermove': return 'onPointerMove';
      case 'pointerup': return 'onPointerUp';
      default: return null;
    }
  }

  /**
   * Start a temporary renderer overwrite.
   * @param {function} rendererFn - function(gameState) that performs rendering while overwrite is active
   * @param {number} durationSec - how many seconds the overwrite should run (optional, falls back to _RendererOverwriteTimerMax)
   */
  startRendererOverwrite(rendererFn, durationSec) {
    if (typeof rendererFn !== 'function') {
      console.warn('startRendererOverwrite requires a function');
      return false;
    }
    this._overwrittenRendererFn = rendererFn;
    this._RenderMangerOverwrite = true;
    this._RendererOverwritten = true;
    this.__RendererOverwriteTimer = typeof durationSec === 'number' ? durationSec : this._RendererOverwriteTimerMax;
    this.__RendererOverwriteLast = 0; // reset last tick
    return true;
  }

  /**
   * Stop any active renderer overwrite immediately.
   */
  stopRendererOverwrite() {
    this._RenderMangerOverwrite = false;
    this._RendererOverwritten = false;
    this.__RendererOverwriteTimer = 0;
    this.__RendererOverwriteLast = 0;
    this._overwrittenRendererFn = null;
  }

  /**
   * Set default overwrite duration (seconds) used when startRendererOverwrite is called without duration.
   */
  setOverwriteDuration(seconds) {
    if (typeof seconds === 'number' && seconds >= 0) {
      this._RendererOverwriteTimerMax = seconds;
      return true;
    }
    return false;
  }
}


function renderPipelineInit() {
// UI Debug System initialization
  // Create global UI Debug Manager instance
  // Disabled to avoid conflicts with other UI systems
  //
  window.g_uiDebugManager = new UIDebugManager();
  g_uiDebugManager = window.g_uiDebugManager; // Make globally available
  
  // Initialize dropoff UI if present (creates the Place Dropoff button)
  if (typeof window.initDropoffUI === 'function') {
    window.initDropoffUI();
  }

  // Seed at least one set of resources so the field isn't empty if interval hasn't fired yet
  try {
      if (g_resourceManager && typeof g_resourceManager.forceSpawn === 'function') {
        g_resourceManager.forceSpawn();
      }
  } catch (e) { /* non-fatal; spawner will populate via interval */ }
  
  // Initialize Draggable Panel System
  initializeDraggablePanelSystem();
  
  // Initialize ant control panel for spawning and state management
  if (typeof initializeAntControlPanel !== 'undefined') {
    initializeAntControlPanel();
  }
  
  // Initialize UI Selection Controller for effects layer selection box
  // This must happen after RenderManager.initialize() creates the EffectsRenderer
  if (UISelectionController && window.EffectsRenderer) {
    g_uiSelectionController = new UISelectionController(window.EffectsRenderer, g_mouseController);
  }
}


// Create global instance
const RenderManager = new RenderLayerManager();

// Create global variable for compatibility
if (typeof window !== 'undefined') {
  window.g_renderLayerManager = RenderManager;
  window.RenderManager = RenderManager;
  
  // Add global console command to force all layers visible
  window.forceAllLayersVisible = function() {
    return RenderManager.forceAllLayersVisible();
  };
  
  // Add global console command to check layer states
  window.checkLayerStates = function() {
    logNormal('🎨 Current layer states:', RenderManager.getLayerStates());
    return RenderManager.getLayerStates();
  };
  
} else if (typeof global !== 'undefined') {
  global.g_renderLayerManager = RenderManager;
  global.RenderManager = RenderManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RenderLayerManager, RenderManager };
}