// EntityLayerRenderer - Enhanced rendering system for dynamic game entities
class EntityLayerRenderer {
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
  
  /**
   * Main render method - renders all entity layers
   */
  renderAllLayers(gameState) {
    const startTime = performance.now();
    
    // Clear previous frame data
    this.clearRenderGroups();
    this.stats.totalEntities = 0;
    this.stats.renderedEntities = 0;
    this.stats.culledEntities = 0;
    
    // Collect entities based on game state
    this.collectEntities(gameState);
    
    // Sort entities by depth if enabled
    if (this.config.enableDepthSorting) {
      this.sortEntitiesByDepth();
    }
    
    // Render each group in order
    this.renderGroup(this.renderGroups.BACKGROUND);
    this.renderGroup(this.renderGroups.RESOURCES);
    this.renderGroup(this.renderGroups.ANTS);
    this.renderGroup(this.renderGroups.EFFECTS);
    this.renderGroup(this.renderGroups.FOREGROUND);
    
    // Update performance stats
    this.stats.renderTime = performance.now() - startTime;
    this.stats.lastFrameStats = { ...this.stats };
  }
  
  /**
   * Clear all render groups
   */
  clearRenderGroups() {
    Object.keys(this.renderGroups).forEach(group => {
      this.renderGroups[group].length = 0;
    });
  }
  
  /**
   * Collect entities for rendering based on game state
   */
  collectEntities(gameState) {
    // Collect resources
    if (typeof g_resourceList !== 'undefined' && g_resourceList) {
      this.collectResources(gameState);
    }
    
    // Collect ants
    this.collectAnts(gameState);
    
    // Collect other entities if they exist
    this.collectOtherEntities(gameState);
  }
  
  /**
   * Collect resource entities
   */
  collectResources(gameState) {
    if (!g_resourceList || !g_resourceList.resources) return;
    
    for (const resource of g_resourceList.resources) {
      if (this.shouldRenderEntity(resource)) {
        this.renderGroups.RESOURCES.push({
          entity: resource,
          type: 'resource',
          depth: this.getEntityDepth(resource),
          position: this.getEntityPosition(resource)
        });
        this.stats.totalEntities++;
      }
    }
    
    // Update resources if in playing state
    if (gameState === 'PLAYING' && typeof g_resourceList.updateAll === 'function') {
      g_resourceList.updateAll();
    }
  }
  
  /**
   * Collect ant entities
   */
  collectAnts(gameState) {    
    for (let i = 0; i < antIndex; i++) {
      if (ants[i]) {
        const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
        
        if (this.shouldRenderEntity(antObj)) {
          this.renderGroups.ANTS.push({
            entity: antObj,
            wrapper: ants[i], // Keep reference to wrapper for updates
            type: 'ant',
            depth: this.getEntityDepth(antObj),
            position: this.getEntityPosition(antObj)
          });
          this.stats.totalEntities++;
        }
      }
    }
    
    // Update ants if in playing state  
    if (gameState === 'PLAYING' && typeof antsUpdate === 'function') {
      antsUpdate();
    }
  }
  
  /**
   * Collect other entities (expandable for future entity types)
   */
  collectOtherEntities(gameState) {
    // Placeholder for additional entity types like:
    // - Buildings/structures
    // - Projectiles
    // - Environmental objects
    // - Particle effects
  }
  
  /**
   * Check if an entity should be rendered
   */
  shouldRenderEntity(entity) {
    if (!entity) return false;
    
    // Check if entity is active
    if (entity.isActive === false) return false;
    
    // Frustum culling - check if entity is within viewport
    if (this.config.enableFrustumCulling) {
      return this.isEntityInViewport(entity);
    }
    
    return true;
  }
  
  /**
   * Check if entity is within the viewport (frustum culling)
   */
  isEntityInViewport(entity) {
    const pos = this.getEntityPosition(entity);
    if (!pos) return true; // Render if we can't determine position
    
    const size = this.getEntitySize(entity);
    const margin = this.config.cullMargin;
    
    // Check bounds with margin
    return (pos.x + size.width + margin >= 0 && 
            pos.x - margin <= g_canvasX &&
            pos.y + size.height + margin >= 0 && 
            pos.y - margin <= g_canvasY);
  }
  
  /**
   * Get entity position
   */
  getEntityPosition(entity) {
    if (!entity) return { x: 0, y: 0 };
    
    // Try different position accessor methods
    if (typeof entity.getPosition === 'function') {
      return entity.getPosition();
    }
    if (entity.position) {
      return entity.position;
    }
    if (entity.sprite && entity.sprite.pos) {
      return entity.sprite.pos;
    }
    if (entity.x !== undefined && entity.y !== undefined) {
      return { x: entity.x, y: entity.y };
    }
    
    return { x: 0, y: 0 };
  }
  
  /**
   * Get entity size for culling
   */
  getEntitySize(entity) {
    if (!entity) return { width: 32, height: 32 }; // Default size
    
    if (typeof entity.getSize === 'function') {
      const size = entity.getSize();
      return { width: size.x || size.width || 32, height: size.y || size.height || 32 };
    }
    if (entity.size) {
      return { width: entity.size.x || entity.size.width || 32, height: entity.size.y || entity.size.height || 32 };
    }
    if (entity.width !== undefined && entity.height !== undefined) {
      return { width: entity.width, height: entity.height };
    }
    
    return { width: 32, height: 32 };
  }
  
  /**
   * Get entity depth for sorting
   */
  getEntityDepth(entity) {
    const pos = this.getEntityPosition(entity);
    
    // Use Y position as depth (entities lower on screen render in front)
    return pos.y || 0;
  }
  
  /**
   * Sort entities within each group by depth
   */
  sortEntitiesByDepth() {
    Object.keys(this.renderGroups).forEach(groupName => {
      this.renderGroups[groupName].sort((a, b) => a.depth - b.depth);
    });
  }
  
  /**
   * Render a specific entity group
   */
  renderGroup(entityGroup) {
    if (!entityGroup || entityGroup.length === 0) return;
    
    if (this.config.enableBatching && entityGroup.length > this.config.maxBatchSize) {
      // Batch render for large groups
      this.renderEntityGroupBatched(entityGroup);
    } else {
      // Standard render for small groups
      this.renderEntityGroupStandard(entityGroup);
    }
  }
  
  /**
   * Standard rendering for entity groups
   */
  renderEntityGroupStandard(entityGroup) {
    for (const entityData of entityGroup) {
      try {
        if (entityData.entity && typeof entityData.entity.render === 'function') {
          entityData.entity.render();
          this.stats.renderedEntities++;
        }
      } catch (error) {
        console.warn('EntityLayerRenderer: Error rendering entity:', error);
      }
    }
  }
  
  /**
   * Batched rendering for large entity groups (future optimization)
   */
  renderEntityGroupBatched(entityGroup) {
    // For now, fall back to standard rendering
    // In the future, this could implement sprite batching or instanced rendering
    this.renderEntityGroupStandard(entityGroup);
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.stats,
      cullEfficiency: this.stats.totalEntities > 0 ? 
        (this.stats.culledEntities / this.stats.totalEntities) * 100 : 0,
      renderEfficiency: this.stats.totalEntities > 0 ? 
        (this.stats.renderedEntities / this.stats.totalEntities) * 100 : 0
    };
  }
  
  /**
   * Update rendering configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Debug rendering - show culling bounds and entity info
   */
  renderDebugInfo() {
    if (!this.config.showDebugInfo) return;
    
    // Render viewport bounds
    stroke(255, 0, 0);
    strokeWeight(2);
    noFill();
    rect(-this.config.cullMargin, -this.config.cullMargin, 
         g_canvasX + (2 * this.config.cullMargin), 
         g_canvasY + (2 * this.config.cullMargin));
    
    // Render entity counts
    fill(255, 255, 0);
    textAlign(LEFT, TOP);
    textSize(12);
    text(`Entities: ${this.stats.totalEntities} | Rendered: ${this.stats.renderedEntities} | Culled: ${this.stats.culledEntities}`, 10, 30);
    text(`Render Time: ${this.stats.renderTime.toFixed(2)}ms`, 10, 45);
  }
}

// Create global instance
const EntityRenderer = new EntityLayerRenderer();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EntityLayerRenderer, EntityRenderer };
}
