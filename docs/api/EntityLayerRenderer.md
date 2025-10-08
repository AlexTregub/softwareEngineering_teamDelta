# EntityLayerRenderer API Documentation

> **Module**: `Classes/rendering/EntityLayerRenderer.js`  
> **Version**: 1.0.0  
> **Dependencies**: EntityAccessor.js  
> **Last Updated**: October 2025

## Overview

The `EntityLayerRenderer` class provides enhanced rendering for dynamic game entities with depth sorting, frustum culling, and batch rendering optimizations. It organizes entities into render groups and provides comprehensive performance tracking.

## Class: EntityRenderer

### Constructor

```javascript
constructor() {
  // Entity rendering groups for depth sorting
  this.renderGroups = {
    BACKGROUND: [], // Large background elements
    RESOURCES: [],  // Resource objects
    ANTS: [],      // Ant entities  
    EFFECTS: [],   // Visual effects, particles
    FOREGROUND: [] // UI elements that should appear above entities
  };
  
  // Rendering configuration
  this.config = {
    enableDepthSorting: true,
    enableFrustumCulling: true,
    enableBatching: true,
    maxBatchSize: 100,
    cullMargin: 50 // Extra pixels outside view for culling
  };
  
  // Performance tracking
  this.stats = {
    totalEntities: 0,
    renderedEntities: 0,
    culledEntities: 0,
    renderTime: 0,
    lastFrameStats: {}
  };
}
```

## Core Rendering Methods

### `renderAllLayers(gameState)`

**Parameters:**

- `gameState` (Object): Current game state with entity collections

Main rendering method that processes all entity layers with performance optimization.

**Implementation:**

```javascript
renderAllLayers(gameState) {
  const startTime = performance.now();
  
  // Performance tracking integration
  if (g_performanceMonitor) {
    g_performanceMonitor.startRenderPhase('preparation');
  }
  
  // Clear previous frame data
  this.clearRenderGroups();
  this.stats.totalEntities = 0;
  this.stats.renderedEntities = 0;
  this.stats.culledEntities = 0;
  
  // Collect and categorize all entities
  this.collectEntities(gameState);
  
  // Apply frustum culling if enabled
  if (this.config.enableFrustumCulling) {
    this.applyCulling();
  }
  
  // Depth sort entities within groups
  if (this.config.enableDepthSorting) {
    this.depthSortGroups();
  }
  
  // Render each group in order
  this.renderGroups.BACKGROUND.forEach(entity => this.renderEntity(entity));
  this.renderGroups.RESOURCES.forEach(entity => this.renderEntity(entity));
  this.renderGroups.ANTS.forEach(entity => this.renderEntity(entity));
  this.renderGroups.EFFECTS.forEach(entity => this.renderEntity(entity));
  this.renderGroups.FOREGROUND.forEach(entity => this.renderEntity(entity));
  
  // Update performance statistics
  this.stats.renderTime = performance.now() - startTime;
  if (g_performanceMonitor) {
    g_performanceMonitor.updateEntityStats(this.stats);
  }
}
```

### `collectEntities(gameState)`

Collects entities from game state and categorizes them into render groups.

**Entity Categorization:**

```javascript
collectEntities(gameState) {
  // Collect ants
  if (gameState.ants) {
    gameState.ants.forEach(ant => {
      this.renderGroups.ANTS.push(ant);
      this.stats.totalEntities++;
    });
  }
  
  // Collect resources
  if (gameState.resources) {
    gameState.resources.forEach(resource => {
      this.renderGroups.RESOURCES.push(resource);
      this.stats.totalEntities++;
    });
  }
  
  // Collect buildings/structures
  if (gameState.buildings) {
    gameState.buildings.forEach(building => {
      this.renderGroups.BACKGROUND.push(building);
      this.stats.totalEntities++;
    });
  }
}
```

### `applyCulling()`

Removes entities outside the viewport to improve performance.

**Culling Algorithm:**

```javascript
applyCulling() {
  Object.keys(this.renderGroups).forEach(groupName => {
    const group = this.renderGroups[groupName];
    
    for (let i = group.length - 1; i >= 0; i--) {
      const entity = group[i];
      
      if (!this.isEntityVisible(entity)) {
        group.splice(i, 1);
        this.stats.culledEntities++;
      }
    }
  });
}

isEntityVisible(entity) {
  const pos = EntityAccessor.getPosition(entity);
  const size = EntityAccessor.getSize(entity);
  
  return !(pos.x + size.width < -this.config.cullMargin ||
           pos.x > width + this.config.cullMargin ||
           pos.y + size.height < -this.config.cullMargin ||
           pos.y > height + this.config.cullMargin);
}
```

### `depthSortGroups()`

Sorts entities within each group by depth for proper rendering order.

**Sorting Implementation:**

```javascript
depthSortGroups() {
  Object.values(this.renderGroups).forEach(group => {
    group.sort((a, b) => {
      const posA = EntityAccessor.getPosition(a);
      const posB = EntityAccessor.getPosition(b);
      
      // Primary sort by Y position (entities lower on screen drawn last)
      if (Math.abs(posA.y - posB.y) > 1) {
        return posA.y - posB.y;
      }
      
      // Secondary sort by entity priority
      return this.getEntityPriority(a) - this.getEntityPriority(b);
    });
  });
}
```

## Entity Rendering

### `renderEntity(entity)`

**Parameters:**

- `entity` (Object): Entity to render

Renders a single entity with proper error handling and performance tracking.

**Implementation:**

```javascript
renderEntity(entity) {
  try {
    // Use entity's render controller if available
    if (entity.renderController) {
      entity.renderController.render();
    }
    // Fallback to entity's own render method
    else if (entity.render) {
      entity.render();
    }
    // Basic sprite rendering
    else if (entity.sprite || entity._sprite) {
      this.renderSprite(entity);
    }
    // Geometric shape fallback
    else {
      this.renderShape(entity);
    }
    
    this.stats.renderedEntities++;
  } catch (error) {
    console.error('EntityLayerRenderer: Error rendering entity:', error);
  }
}
```

### Performance Statistics

#### `getStats()`

Returns comprehensive rendering statistics for performance analysis.

**Statistics Provided:**

```javascript
{
  totalEntities: 150,
  renderedEntities: 120,
  culledEntities: 30,
  renderTime: 8.5,
  cullEfficiency: 0.2,
  averageEntityRenderTime: 0.07,
  groupBreakdown: {
    ANTS: { count: 80, renderTime: 5.2 },
    RESOURCES: { count: 30, renderTime: 2.1 },
    BACKGROUND: { count: 10, renderTime: 1.2 }
  }
}
```

## Configuration Options

### `configure(options)`

**Parameters:**

- `options` (Object): Configuration options to update

Updates renderer configuration with new options.

**Configuration Properties:**

- `enableDepthSorting`: Enable/disable depth sorting
- `enableFrustumCulling`: Enable/disable viewport culling  
- `enableBatching`: Enable/disable batch rendering
- `maxBatchSize`: Maximum entities per batch
- `cullMargin`: Extra culling margin in pixels

## TODO Enhancements

### Advanced Culling

- **Hierarchical Culling**: Multi-level culling for complex scenes
- **Occlusion Culling**: Skip entities hidden behind others
- **Distance Culling**: Skip distant entities based on importance

### Batch Rendering

- **Sprite Batching**: Group similar sprites for efficient rendering
- **Instanced Rendering**: Use WebGL instancing for identical entities
- **Dynamic Batching**: Automatically group compatible entities

### Performance Optimizations

- **Level of Detail**: Reduce quality for distant entities
- **Temporal Culling**: Skip rendering every N frames for some entities
- **Adaptive Quality**: Adjust rendering quality based on performance

---

## See Also

- **[RenderController API Documentation](RenderController.md)** - Entity-specific rendering
- **[EntityAccessor API Documentation](EntityAccessor.md)** - Entity property access
- **[PerformanceMonitor API Documentation](PerformanceMonitor.md)** - Performance tracking
