# RenderLayerManager API Documentation

> **Module**: `Classes/rendering/RenderLayerManager.js`  
> **Version**: 1.0.0  
> **Last Updated**: October 2025

## Overview

The `RenderLayerManager` class provides a centralized layered rendering system that manages rendering order from terrain to UI layers. It ensures consistent render order, performance optimization through caching, and provides layer-specific controls for debugging and optimization.

## Class: RenderLayerManager

### Layer System Architecture

The rendering system uses a strict layer hierarchy from bottom to top:

```javascript
layers = {
  TERRAIN: 'terrain',      // Static terrain, cached for performance
  ENTITIES: 'entities',    // Dynamic game objects (ants, resources) 
  EFFECTS: 'effects',      // Particle effects, visual effects, screen effects
  UI_GAME: 'ui_game',     // In-game UI (currencies, selection, dropoff)
  UI_DEBUG: 'ui_debug',   // Debug overlays (console, performance)
  UI_MENU: 'ui_menu'      // Menu system and transitions
}
```

### Constructor

#### `new RenderLayerManager()`

Creates a new RenderLayerManager with initialized layer system, performance tracking, and cache management.

**Implementation Details:**
```javascript
constructor() {
  // Layer rendering functions
  this.layerRenderers = new Map();
  
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
}
```

---

## Core Layer Management

### `initialize()`

Initializes the rendering system with default layer renderers.

**Implementation:**
```javascript
initialize() {
  if (this.isInitialized) return;
  
  // Register default layer renderers
  this.registerLayerRenderer(this.layers.TERRAIN, this.renderTerrainLayer.bind(this));
  this.registerLayerRenderer(this.layers.ENTITIES, this.renderEntitiesLayer.bind(this));
  this.registerLayerRenderer(this.layers.EFFECTS, this.renderEffectsLayer.bind(this));
  this.registerLayerRenderer(this.layers.UI_GAME, this.renderGameUILayer.bind(this));
  this.registerLayerRenderer(this.layers.UI_DEBUG, this.renderDebugUILayer.bind(this));
  this.registerLayerRenderer(this.layers.UI_MENU, this.renderMenuUILayer.bind(this));
  
  this.isInitialized = true;
}
```

### `registerLayerRenderer(layerName, renderFunction)`

**Parameters:**
- `layerName` (string): Name of the layer to register
- `renderFunction` (Function): Function to call when rendering this layer

Registers a custom rendering function for a specific layer.

**Usage Example:**
```javascript
// Register custom terrain renderer
renderLayerManager.registerLayerRenderer('terrain', (gameState) => {
  // Custom terrain rendering logic
  drawTerrain(gameState.world);
});

// Register custom UI layer
renderLayerManager.registerLayerRenderer('custom_hud', (gameState) => {
  drawCustomHUD(gameState.ui);
});
```

### `renderAllLayers(gameState)`

**Parameters:**
- `gameState` (Object): Current game state containing all render data

Main rendering method that draws all layers in correct order with performance tracking.

**Implementation Details:**
```javascript
renderAllLayers(gameState) {
  const frameStart = performance.now();
  
  // Render layers in order
  Object.values(this.layers).forEach(layerName => {
    if (this.disabledLayers.has(layerName)) return;
    
    const layerStart = performance.now();
    
    const renderer = this.layerRenderers.get(layerName);
    if (renderer) {
      renderer(gameState);
    }
    
    // Track layer performance
    const layerTime = performance.now() - layerStart;
    this.renderStats.layerTimes[layerName] = layerTime;
  });
  
  this.renderStats.lastFrameTime = performance.now() - frameStart;
  this.renderStats.frameCount++;
}
```

**Performance Features:**
- Layer-specific performance timing
- Disabled layer skipping for debugging
- Frame time tracking
- Integration with PerformanceMonitor if available

---

## Layer-Specific Rendering Methods

### `renderTerrainLayer(gameState)`

**Parameters:**
- `gameState` (Object): Game state with terrain data

Renders the terrain layer with intelligent caching for performance optimization.

**Caching Strategy:**
```javascript
renderTerrainLayer(gameState) {
  // Check if terrain cache is valid
  if (!this.cacheStatus.terrainCacheValid || 
      gameState.terrain.lastModified > this.cacheStatus.lastTerrainUpdate) {
    
    // Regenerate terrain cache
    this.generateTerrainCache(gameState.terrain);
    this.cacheStatus.terrainCacheValid = true;
    this.cacheStatus.lastTerrainUpdate = gameState.terrain.lastModified;
  }
  
  // Draw cached terrain
  this.drawCachedTerrain();
}
```

**Terrain Elements Rendered:**
- Base terrain tiles (grass, dirt, stone)
- Terrain features (rocks, vegetation)
- Pathfinding grid (if debug mode enabled)
- Terrain collision boundaries

### `renderEntitiesLayer(gameState)`

**Parameters:**
- `gameState` (Object): Game state with entity collections

Renders all dynamic game entities with depth sorting and culling.

**Entity Rendering Process:**
```javascript
renderEntitiesLayer(gameState) {
  // Performance tracking
  if (g_performanceMonitor) {
    g_performanceMonitor.startLayerTiming('entities');
  }
  
  // Get all entities
  const allEntities = [
    ...(gameState.ants || []),
    ...(gameState.resources || []),
    ...(gameState.buildings || [])
  ];
  
  // Depth sort entities
  const sortedEntities = this.depthSortEntities(allEntities);
  
  // Render each entity
  sortedEntities.forEach(entity => {
    if (this.isEntityVisible(entity)) {
      entity.render();
    }
  });
  
  if (g_performanceMonitor) {
    g_performanceMonitor.endLayerTiming('entities');
  }
}
```

**Entity Types Handled:**
- Ants (workers, queens, soldiers)
- Resources (food, wood, materials)
- Buildings (colonies, storage, production)
- Interactive objects (dropoff points, spawn points)

### `renderEffectsLayer(gameState)`

**Parameters:**
- `gameState` (Object): Game state with active effects

Renders visual effects, particles, and screen-space effects.

**Effects Rendered:**
```javascript
renderEffectsLayer(gameState) {
  // Particle systems
  if (gameState.particleSystem) {
    gameState.particleSystem.render();
  }
  
  // Combat effects
  if (gameState.combatEffects) {
    gameState.combatEffects.forEach(effect => effect.render());
  }
  
  // Environmental effects
  this.renderEnvironmentalEffects(gameState.environment);
  
  // Screen-space effects (overlays, filters)
  this.renderScreenEffects(gameState.screenEffects);
}
```

### `renderGameUILayer(gameState)`

**Parameters:**
- `gameState` (Object): Game state with UI data

Renders in-game UI elements that are part of gameplay.

**UI Elements Rendered:**
```javascript
renderGameUILayer(gameState) {
  // Resource counters (wood, food, population)
  this.renderResourceCounters(gameState.resources);
  
  // Selection indicators
  this.renderSelectionUI(gameState.selectedEntities);
  
  // Dropoff location indicators  
  this.renderDropoffLocations(gameState.dropoffLocations);
  
  // Minimap (if enabled)
  if (gameState.ui.minimapEnabled) {
    this.renderMinimap(gameState);
  }
  
  // Draggable panels from DraggablePanelManager
  if (window.draggablePanelManager) {
    window.draggablePanelManager.renderPanels();
  }
}
```

### `renderDebugUILayer(gameState)`

**Parameters:**
- `gameState` (Object): Game state with debug information

Renders debug overlays and development tools.

**Debug Elements:**
```javascript
renderDebugUILayer(gameState) {
  // Performance monitor overlay
  if (g_performanceMonitor && g_performanceMonitor.debugDisplay.enabled) {
    g_performanceMonitor.render();
  }
  
  // Entity debug information
  if (gameState.debug.entityInspector) {
    this.renderEntityDebugInfo(gameState.selectedEntities);
  }
  
  // Debug console
  if (gameState.debug.consoleVisible) {
    this.renderDebugConsole();
  }
  
  // FPS and timing information
  this.renderPerformanceStats();
}
```

### `renderMenuUILayer(gameState)`

**Parameters:**
- `gameState` (Object): Game state with menu information

Renders menu systems and state transitions.

**Menu Elements:**
```javascript
renderMenuUILayer(gameState) {
  switch (gameState.currentState) {
    case 'MENU':
      this.renderMainMenu(gameState.menu);
      break;
    case 'PAUSED':
      this.renderPauseMenu(gameState.pauseMenu);
      break;
    case 'LOADING':
      this.renderLoadingScreen(gameState.loading);
      break;
    case 'GAME_OVER':
      this.renderGameOverScreen(gameState.gameOver);
      break;
  }
}
```

---

## Performance Optimization

### Cache Management

#### `invalidateTerrainCache()`

Forces terrain cache regeneration on next render.

```javascript
invalidateTerrainCache() {
  this.cacheStatus.terrainCacheValid = false;
  console.log('RenderLayerManager: Terrain cache invalidated');
}
```

#### `generateTerrainCache(terrainData)`

**Parameters:**
- `terrainData` (Object): Terrain data to cache

Generates optimized terrain rendering cache.

**Caching Process:**
```javascript
generateTerrainCache(terrainData) {
  // Create offscreen canvas for terrain
  this.terrainCache = createGraphics(width, height);
  
  // Render terrain to cache
  this.terrainCache.background(terrainData.backgroundColor);
  
  // Draw tiles efficiently
  terrainData.tiles.forEach(tile => {
    this.terrainCache.image(tile.image, tile.x, tile.y);
  });
  
  console.log('RenderLayerManager: Terrain cache generated');
}
```

### Viewport Culling

#### `isEntityVisible(entity)`

**Parameters:**
- `entity` (Object): Entity to test for visibility

**Returns:** `boolean` - Whether entity is within viewport

Determines if an entity should be rendered based on viewport bounds.

**Implementation:**
```javascript
isEntityVisible(entity) {
  const pos = EntityAccessor.getPosition(entity);
  const size = EntityAccessor.getSize(entity);
  
  // Check if entity bounds intersect with viewport
  return !(pos.x + size.width < 0 || 
           pos.x > width || 
           pos.y + size.height < 0 || 
           pos.y > height);
}
```

### Depth Sorting

#### `depthSortEntities(entities)`

**Parameters:**
- `entities` (Array): Array of entities to sort

**Returns:** `Array` - Sorted entities array

Sorts entities by depth for proper rendering order.

**Sorting Algorithm:**
```javascript
depthSortEntities(entities) {
  return entities.sort((a, b) => {
    const posA = EntityAccessor.getPosition(a);
    const posB = EntityAccessor.getPosition(b);
    
    // Sort by Y position (entities lower on screen drawn last)
    if (posA.y !== posB.y) {
      return posA.y - posB.y;
    }
    
    // Secondary sort by entity type priority
    const priorityA = this.getEntityRenderPriority(a);
    const priorityB = this.getEntityRenderPriority(b);
    
    return priorityA - priorityB;
  });
}
```

---

## Debug Controls

### `toggleLayer(layerName)`

**Parameters:**
- `layerName` (string): Name of layer to toggle

Toggles visibility of a specific rendering layer for debugging.

**Implementation:**
```javascript
toggleLayer(layerName) {
  if (this.disabledLayers.has(layerName)) {
    this.disabledLayers.delete(layerName);
    console.log(`RenderLayerManager: Enabled layer ${layerName}`);
  } else {
    this.disabledLayers.add(layerName);
    console.log(`RenderLayerManager: Disabled layer ${layerName}`);
  }
}
```

### `enableAllLayers()`

Enables all rendering layers.

### `disableAllLayers()`

Disables all rendering layers (useful for performance testing).

### `getLayerStats()`

**Returns:** `Object` - Performance statistics for all layers

Returns detailed performance statistics for each layer.

**Statistics Provided:**
```javascript
getLayerStats() {
  return {
    frameCount: this.renderStats.frameCount,
    lastFrameTime: this.renderStats.lastFrameTime,
    averageFrameTime: this.calculateAverageFrameTime(),
    layerTimes: { ...this.renderStats.layerTimes },
    disabledLayers: Array.from(this.disabledLayers),
    cacheStatus: { ...this.cacheStatus }
  };
}
```

---

## Integration Patterns

### PerformanceMonitor Integration

```javascript
renderLayer(layerName, gameState) {
  // Start timing if performance monitor available
  if (g_performanceMonitor) {
    g_performanceMonitor.startLayerTiming(layerName);
  }
  
  // Render layer
  const renderer = this.layerRenderers.get(layerName);
  if (renderer) {
    renderer(gameState);
  }
  
  // End timing
  if (g_performanceMonitor) {
    g_performanceMonitor.endLayerTiming(layerName);
  }
}
```

### DraggablePanelManager Integration

```javascript
renderGameUILayer(gameState) {
  // Render draggable panels if available
  if (window.draggablePanelManager) {
    window.draggablePanelManager.renderPanels();
  }
  
  // Continue with other UI rendering...
}
```

### EntityAccessor Integration

```javascript
renderEntitiesLayer(gameState) {
  entities.forEach(entity => {
    // Use EntityAccessor for consistent property access
    const position = EntityAccessor.getPosition(entity);
    const size = EntityAccessor.getSize(entity);
    
    if (this.isInViewport(position, size)) {
      entity.render();
    }
  });
}
```

---

## TODO Enhancements

### Advanced Caching System
- **Multi-Level Caching**: Cache static entities separately from terrain
- **Partial Cache Updates**: Update only changed regions of cached content
- **Cache Compression**: Compress cached content for memory efficiency
- **Smart Cache Invalidation**: Invalidate only affected cache regions

### Enhanced Layer System
- **Dynamic Layer Creation**: Runtime creation of custom layers
- **Layer Compositing**: Blend modes and opacity for layers
- **Layer Masking**: Mask layers based on game state or regions
- **Conditional Layers**: Layers that render based on game conditions

### Performance Optimizations
- **Frustum Culling**: More sophisticated viewport culling algorithms
- **Level of Detail**: Reduce rendering quality based on distance
- **Batch Rendering**: Group similar entities for efficient rendering
- **GPU Acceleration**: Utilize WebGL for hardware-accelerated rendering

### Debug Enhancements
- **Layer Inspector**: Visual debugging tool for layer contents
- **Performance Visualizer**: Real-time graphs of layer performance
- **Render Order Debugger**: Visualize rendering order and depth sorting
- **Cache Visualizer**: Visual representation of cached content and validity

---

## Error Handling

### Layer Registration Validation
```javascript
registerLayerRenderer(layerName, renderFunction) {
  if (typeof renderFunction !== 'function') {
    throw new Error(`RenderLayerManager: Invalid renderer for layer ${layerName}`);
  }
  
  this.layerRenderers.set(layerName, renderFunction);
}
```

### Render Error Recovery
```javascript
renderAllLayers(gameState) {
  Object.values(this.layers).forEach(layerName => {
    try {
      const renderer = this.layerRenderers.get(layerName);
      if (renderer) {
        renderer(gameState);
      }
    } catch (error) {
      console.error(`RenderLayerManager: Error rendering layer ${layerName}:`, error);
      // Continue rendering other layers
    }
  });
}
```

### Cache Error Handling
```javascript
generateTerrainCache(terrainData) {
  try {
    this.terrainCache = createGraphics(width, height);
    // ... cache generation logic
  } catch (error) {
    console.error('RenderLayerManager: Failed to generate terrain cache:', error);
    this.cacheStatus.terrainCacheValid = false;
  }
}
```

---

## Usage Examples

### Basic Layer Management
```javascript
// Initialize rendering system
const renderManager = new RenderLayerManager();
renderManager.initialize();

// Main game loop
function draw() {
  renderManager.renderAllLayers(gameState);
}
```

### Custom Layer Registration
```javascript
// Register custom background layer
renderManager.registerLayerRenderer('background', (gameState) => {
  background(gameState.environment.skyColor);
  drawClouds(gameState.environment.clouds);
});

// Register custom overlay layer
renderManager.registerLayerRenderer('overlay', (gameState) => {
  if (gameState.weather.isRaining) {
    drawRainOverlay();
  }
});
```

### Debug Layer Control
```javascript
// Toggle layers for debugging
function keyPressed() {
  switch (key) {
    case '1': renderManager.toggleLayer('terrain'); break;
    case '2': renderManager.toggleLayer('entities'); break;
    case '3': renderManager.toggleLayer('effects'); break;
    case '4': renderManager.toggleLayer('ui_game'); break;
    case '5': renderManager.toggleLayer('ui_debug'); break;
  }
}
```

### Performance Monitoring Integration
```javascript
// Check layer performance
function displayLayerStats() {
  const stats = renderManager.getLayerStats();
  
  console.log(`Frame Time: ${stats.lastFrameTime.toFixed(2)}ms`);
  Object.entries(stats.layerTimes).forEach(([layer, time]) => {
    console.log(`  ${layer}: ${time.toFixed(2)}ms`);
  });
}
```

---

## See Also

- **[RenderController API Documentation](RenderController.md)** - Entity-specific rendering control
- **[EntityLayerRenderer API Documentation](EntityLayerRenderer.md)** - Entity layer implementation
- **[PerformanceMonitor API Documentation](PerformanceMonitor.md)** - Performance tracking integration  
- **[UILayerRenderer API Documentation](UILayerRenderer.md)** - UI layer implementation
- **[EffectsLayerRenderer API Documentation](EffectsLayerRenderer.md)** - Effects layer implementation