/**
 * @fileoverview EntityLayerRenderer - Enhanced rendering system for dynamic game entities
 * @module EntityLayerRenderer
 * @see {@link docs/api/EntityLayerRenderer.md} Complete API documentation
 * @see {@link docs/quick-reference.md} Entity rendering reference
 */

/**
 * Enhanced rendering system for dynamic game entities with depth sorting and culling.
 * 
 * **Features**: Render groups, depth sorting, frustum culling, batch rendering
 * 
 * @class EntityRenderer
 * @see {@link docs/api/EntityLayerRenderer.md} Full documentation and examples
 */
class EntityRenderer {
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
      enableFrustumCulling: false,
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
    
    // Start preparation phase tracking
    if (g_performanceMonitor) {
      g_performanceMonitor.startRenderPhase('preparation');
    }
    
    // Clear previous frame data
    this.clearRenderGroups();
    this.stats.totalEntities = 0;
    this.stats.renderedEntities = 0;
    this.stats.culledEntities = 0;
    
    // Collect entities based on game state
    this.collectEntities(gameState);
    
    // End preparation, start culling phase
    if (g_performanceMonitor) {
      g_performanceMonitor.endRenderPhase();
      g_performanceMonitor.startRenderPhase('culling');
    }
    
    // Sort entities by depth if enabled
    if (this.config.enableDepthSorting) {
      this.sortEntitiesByDepth();
    }
    
    // End culling, start rendering phase
    if (g_performanceMonitor) {
      g_performanceMonitor.endRenderPhase();
      g_performanceMonitor.startRenderPhase('rendering');
    }
    
    // Render each group in order
    this.renderGroup(this.renderGroups.BACKGROUND, 'BACKGROUND');
    this.renderGroup(this.renderGroups.RESOURCES, 'RESOURCES');
    this.renderGroup(this.renderGroups.ANTS, 'ANTS');
    this.renderGroup(this.renderGroups.EFFECTS, 'EFFECTS');
    this.renderGroup(this.renderGroups.FOREGROUND, 'FOREGROUND');
    
    // End rendering phase, start post-processing
    if (g_performanceMonitor) {
      g_performanceMonitor.endRenderPhase();
      g_performanceMonitor.startRenderPhase('postProcessing');
    }
    
    // Update performance stats
    this.stats.renderTime = performance.now() - startTime;
    
    // Record entity stats in performance monitor and finalize
    if (g_performanceMonitor) {
      g_performanceMonitor.recordEntityStats(
        this.stats.totalEntities,
        this.stats.renderedEntities, 
        this.stats.culledEntities,
        this.getEntityTypeBreakdown()
      );
      g_performanceMonitor.finalizeEntityPerformance();
      g_performanceMonitor.endRenderPhase();
    }
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
    // Clear previous entities before collecting new ones
    this.clearRenderGroups();
    
    // Collect resources
    if (g_resourceList) {
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
      this.stats.totalEntities++;
      
      if (this.shouldRenderEntity(resource)) {
        this.renderGroups.RESOURCES.push({
          entity: resource,
          type: 'resource',
          depth: this.getEntityDepth(resource),
          position: this.getEntityPosition(resource)
        });
      } else {
        this.stats.culledEntities++;
      }
    }
    
    // Update resources if in playing state
    if (gameState === 'PLAYING' && g_resourceList.updateAll) {
      g_resourceList.updateAll();
    }
  }
  
  /**
   * Collect ant entities
   */
  collectAnts(gameState) {
    // Try EntityManager first (MVC entities)
    let antsList = [];
    
    if (typeof window !== 'undefined' && window.entityManager) {
      antsList = window.entityManager.getByType('ant');
    } 
    // Fallback to global ants array (legacy entities)
    else if (typeof ants !== 'undefined' && Array.isArray(ants)) {
      antsList = ants;
    }
    
    for (let i = 0; i < antsList.length; i++) {
      if (antsList[i]) {
        const ant = antsList[i];
        this.stats.totalEntities++;
        
        if (this.shouldRenderEntity(ant)) {
          const entityData = {
            entity: ant,
            type: 'ant',
            depth: this.getEntityDepth(ant),
            position: this.getEntityPosition(ant)
          };
          this.renderGroups.ANTS.push(entityData);
        } else {
          this.stats.culledEntities++;
        }
      }
    }
    
    // Update ants if in playing state  
    if (gameState === 'PLAYING' && antsUpdate) {
      antsUpdate();
    }
  }
  
  /**
   * Collect other entities (expandable for future entity types)
   */
  collectOtherEntities(gameState) {
    // Collect buildings
    if (typeof Buildings !== 'undefined' && Array.isArray(Buildings)) {
      for (const building of Buildings) {
        if (building) {
          this.stats.totalEntities++;
          
          if (this.shouldRenderEntity(building)) {
            this.renderGroups.BACKGROUND.push({
              entity: building,
              type: 'building',
              depth: this.getEntityDepth(building),
              position: this.getEntityPosition(building)
            });
            
            // Update building if in playing state
            if (gameState === 'PLAYING' && building.update) {
              building.update();
            }
          } else {
            this.stats.culledEntities++;
          }
        }
      }
    }
    
    // Placeholder for additional entity types like:
    // - Projectiles
    // - Environmental objects
    // - Particle effects
  }
  
  /**
   * Check if an entity should be rendered
   */
  shouldRenderEntity(entity) {
    if (!entity) {
      return false;
    }
    
    // Check if entity is active
    if (entity.isActive === false) {
      return false;
    }
    
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
    
    if (!pos) {
      return true; // Render if we can't determine position
    }
    
    const size = this.getEntitySize(entity);
    const margin = this.config.cullMargin;
    
    // Check bounds with margin
    return (pos.x + size.width + margin >= 0 && 
            pos.x - margin <= g_canvasX &&
            pos.y + size.height + margin >= 0 && 
            pos.y - margin <= g_canvasY);
  }
  
  /**
   * Get entity position - Uses standardized EntityAccessor
   */
  getEntityPosition(entity) {
    return EntityAccessor.getPosition(entity);
  }
  
  /**
   * Get entity size for culling - Uses standardized EntityAccessor with width/height format
   */
  getEntitySize(entity) {
    return EntityAccessor.getSizeWH(entity);
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
    if (!this.config.enableDepthSorting) return; // Skip if depth sorting disabled
    
    Object.keys(this.renderGroups).forEach(groupName => {
      this.renderGroups[groupName].sort((a, b) => a.depth - b.depth);
    });
  }
  
  /**
   * Render a specific entity group
   */
  renderGroup(entityGroup, groupName) {
    if (!entityGroup || entityGroup.length === 0) return;
    
    if (this.config.enableBatching && entityGroup.length > this.config.maxBatchSize) {
      // Batch render for large groups
      this.renderEntityGroupBatched(entityGroup);
    } else {
      // Standard render for small groups
      this.renderEntityGroupStandard(entityGroup, groupName);
    }
  }
  
  /**
   * Standard rendering for entity groups
   */
  renderEntityGroupStandard(entityGroup, groupName) {
    for (const entityData of entityGroup) {
      try {
        if (entityData.entity && entityData.entity.render) {
          // Start entity performance tracking
          if (g_performanceMonitor) {
            g_performanceMonitor.startEntityRender(entityData.entity);
          }
          
          entityData.entity.render();
          this.stats.renderedEntities++;
          
          // End entity performance tracking
          if (g_performanceMonitor) {
            g_performanceMonitor.endEntityRender();
          }
        }
      } catch (error) {
        console.warn('EntityRenderer: Error rendering entity:', error);
        
        // End tracking even on error
        if (g_performanceMonitor) {
          g_performanceMonitor.endEntityRender();
        }
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

  /**
   * Get breakdown of entities by type for performance monitoring
   * @returns {Object} Type breakdown
   */
  getEntityTypeBreakdown() {
    const breakdown = {};
    
    // Count entities in each render group
    Object.entries(this.renderGroups).forEach(([groupName, entities]) => {
      entities.forEach(entityData => {
        const entityType = entityData.type || entityData.entity?.constructor?.name || 'Unknown';
        breakdown[entityType] = (breakdown[entityType] || 0) + 1;
      });
    });
    
    return breakdown;
  }
}

// Create global instance for browser use
if (typeof window !== 'undefined') {
  window.EntityRenderer = new EntityRenderer();
} else if (typeof global !== 'undefined') {
  global.EntityRenderer = new EntityRenderer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityRenderer;
}
