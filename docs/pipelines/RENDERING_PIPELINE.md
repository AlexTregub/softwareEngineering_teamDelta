# Rendering Pipeline Documentation

## Overview
The ant game uses a sophisticated layered rendering system with two main components working together to handle different types of visual elements efficiently.

## Architecture Components

### 1. RenderLayerManager (Top-Level Orchestrator)
**Location:** `Classes/rendering/RenderLayerManager.js`

The RenderLayerManager acts as the central coordinator for all rendering operations, organizing visual elements into distinct layers that render in a specific order.

#### Layer Structure (Bottom to Top)
```javascript
this.layers = {
  TERRAIN: 'terrain',      // Static terrain, cached
  ENTITIES: 'entities',    // Dynamic game objects (ants, resources)
  EFFECTS: 'effects',      // Particle effects, visual effects, screen effects
  UI_GAME: 'ui_game',     // In-game UI (currencies, selection, dropoff)
  UI_DEBUG: 'ui_debug',   // Debug overlays (console, performance)
  UI_MENU: 'ui_menu'      // Menu system and transitions
}
```

#### State-Based Rendering
Different game states show different layer combinations:
- **PLAYING**: TERRAIN + ENTITIES + EFFECTS + UI_GAME + UI_DEBUG
- **PAUSED**: TERRAIN + ENTITIES + EFFECTS + UI_GAME
- **MENU**: TERRAIN + UI_MENU
- **DEBUG_MENU**: TERRAIN + ENTITIES + EFFECTS + UI_DEBUG + UI_MENU

### 2. EntityRenderer (Entity-Specific Handler)
**Location:** `Classes/rendering/EntityLayerRenderer.js`

The EntityRenderer specializes in managing dynamic game entities with advanced features like depth sorting, frustum culling, and performance optimization.

#### Entity Groups (Rendering Order)
```javascript
this.renderGroups = {
  BACKGROUND: [], // Large background elements (currently unused)
  RESOURCES: [],  // Resource objects
  ANTS: [],      // Ant entities  
  EFFECTS: [],   // Visual effects, particles (placeholder)
  FOREGROUND: [] // UI elements above entities (placeholder)
}
```

## Rendering Flow

### Main Render Pipeline
```
RenderLayerManager.render(gameState)
├── Determine layers for current state
├── For each active layer:
│   ├── TERRAIN Layer → g_map2.render()
│   ├── ENTITIES Layer → EntityLayerRenderer.renderAllLayers()
│   ├── UI_GAME Layer → renderBaseGameUI() + renderInteractionUI()
│   ├── UI_DEBUG Layer → debugRender() + drawDebugGrid()
│   └── UI_MENU Layer → updateMenu() + renderMenu()
└── Update performance statistics
```

### Entity Rendering Subpipeline
```
EntityLayerRenderer.renderAllLayers(gameState)
├── clearRenderGroups()
├── collectEntities(gameState)
│   ├── collectResources() → Add to RESOURCES group
│   ├── collectAnts() → Add to ANTS group
│   └── collectOtherEntities() → Placeholder
├── sortEntitiesByDepth() (Y-position based)
├── Render each group in order:
│   ├── BACKGROUND (empty)
│   ├── RESOURCES
│   ├── ANTS
│   ├── EFFECTS (empty)
│   └── FOREGROUND (empty)
└── Update performance stats
```

## Detailed Layer Analysis

### TERRAIN Layer
- **Rendering Method**: Direct call to `g_map2.render()`
- **Characteristics**: 
  - Static background rendering
  - No entity collection or sorting
  - Renders entire terrain (no culling)
  - Cached for performance
- **Fallback**: None (terrain must exist)

### ENTITIES Layer
- **Rendering Method**: EntityLayerRenderer with sophisticated entity management
- **Ant Rendering**:
  ```javascript
  // Collection from global ants[] array
  for (let i = 0; i < antIndex; i++) {
    const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
    if (this.shouldRenderEntity(antObj)) {
      this.renderGroups.ANTS.push({
        entity: antObj,
        wrapper: ants[i],
        type: 'ant',
        depth: this.getEntityDepth(antObj),
        position: this.getEntityPosition(antObj)
      });
    }
  }
  ```
- **Resource Rendering**:
  ```javascript
  // Collection from g_resourceList.resources
  for (const resource of g_resourceList.resources) {
    if (this.shouldRenderEntity(resource)) {
      this.renderGroups.RESOURCES.push({
        entity: resource,
        type: 'resource',
        depth: this.getEntityDepth(resource),
        position: this.getEntityPosition(resource)
      });
    }
  }
  ```
- **Features**:
  - Viewport frustum culling
  - Depth sorting by Y-position
  - Performance tracking
  - Batch rendering for large entity counts
- **Fallback**: Direct function calls (`antsUpdate()`, `g_resourceList.updateAll()`)

### UI Layers
- **UI_GAME**: In-game interface (currencies, selection boxes, dropoff UI)
- **UI_DEBUG**: Development overlays (debug console, grid, performance stats)
- **UI_MENU**: Menu system and overlays (pause, game over, main menu)

## Performance Features

### EntityLayerRenderer Optimizations
1. **Frustum Culling**: Only renders entities within viewport + margin
2. **Depth Sorting**: Y-position based depth sorting for proper layering
3. **Batch Rendering**: Groups large entity collections for efficient rendering
4. **Performance Tracking**: Monitors render times and entity counts

### Culling Logic
```javascript
isEntityInViewport(entity) {
  const pos = this.getEntityPosition(entity);
  const size = this.getEntitySize(entity);
  const margin = this.config.cullMargin; // 50px default
  
  return (pos.x + size.width + margin >= 0 && 
          pos.x - margin <= g_canvasX &&
          pos.y + size.height + margin >= 0 && 
          pos.y - margin <= g_canvasY);
}
```

## State Management Integration

### Game State Responsiveness
- **PLAYING**: Full rendering with updates
- **PAUSED**: Rendering without entity updates
- **MENU**: Minimal rendering (terrain + menus)
- **DEBUG**: Full rendering + debug overlays

### Update vs Render Separation
- **Updates**: Only occur during 'PLAYING' state
- **Rendering**: Occurs in all states but with different layer combinations

## Extension Points

### Adding New Entity Types
```javascript
// In EntityLayerRenderer.collectOtherEntities()
collectBuildings(gameState) {
  // Add buildings to BACKGROUND or new BUILDINGS group
}

collectProjectiles(gameState) {
  // Add projectiles to EFFECTS group
}
```

### Adding New Layers
```javascript
// In RenderLayerManager
this.layers.PARTICLES = 'particles';
this.registerLayerRenderer(this.layers.PARTICLES, this.renderParticlesLayer.bind(this));
```

## Performance Monitoring

### Available Statistics
```javascript
// EntityLayerRenderer stats
{
  totalEntities: number,
  renderedEntities: number,
  culledEntities: number,
  renderTime: milliseconds,
  cullEfficiency: percentage,
  renderEfficiency: percentage
}

// RenderLayerManager stats
{
  frameCount: number,
  lastFrameTime: milliseconds,
  layerTimes: { layerName: milliseconds },
  avgFrameTime: milliseconds
}
```

### Accessing Performance Data
```javascript
// Get entity rendering stats
const entityStats = EntityRenderer.getPerformanceStats();

// Get overall rendering stats
const renderStats = RenderManager.getPerformanceStats();
```

## Configuration Options

### EntityLayerRenderer Configuration
```javascript
this.config = {
  enableDepthSorting: true,     // Y-position based sorting
  enableFrustumCulling: true,   // Viewport culling
  enableBatching: true,         // Batch rendering
  maxBatchSize: 100,           // Entities per batch
  cullMargin: 50               // Extra pixels for culling
};
```

### Updating Configuration
```javascript
EntityRenderer.updateConfig({
  cullMargin: 100,
  enableFrustumCulling: false
});
```

## Troubleshooting

### Common Issues
1. **Entities not rendering**: Check if entity passes `shouldRenderEntity()` filters
2. **Wrong render order**: Verify entity depth values and sorting
3. **Performance issues**: Check entity counts and enable culling/batching
4. **Missing terrain**: Ensure `g_map2` exists and has `render()` method
5. **UI not showing**: Verify correct game state and layer configuration

### Debug Information
Enable debug rendering to see culling bounds and entity counts:
```javascript
EntityRenderer.config.showDebugInfo = true;
```

## Future Improvements

### Planned Features
- Sprite batching for improved performance
- Instanced rendering for identical entities
- Level-of-detail (LOD) system for distant entities
- Terrain caching and dirty region tracking
- Multi-threaded rendering preparation

### Architecture Evolution
- Move terrain rendering into EntityLayerRenderer BACKGROUND group
- Implement proper particle system in EFFECTS group
- Add animation system integration
- Develop shader-based rendering pipeline