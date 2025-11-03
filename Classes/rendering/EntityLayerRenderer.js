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
      enableFrustumCulling: false, // TEMPORARILY DISABLED FOR DEBUGGING
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
    this.renderGroup(this.renderGroups.BACKGROUND);
    this.renderGroup(this.renderGroups.RESOURCES);
    this.renderGroup(this.renderGroups.ANTS);
    this.renderGroup(this.renderGroups.EFFECTS);
    this.renderGroup(this.renderGroups.FOREGROUND);
    
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
    console.log(`[EntityRenderer] collectAnts() - ants.length: ${ants.length}, gameState: ${gameState}`);
    
    for (let i = 0; i < ants.length; i++) {
      if (ants[i]) {
        const ant = ants[i];
        this.stats.totalEntities++;
        
        const pos = this.getEntityPosition(ant);
        console.log(`[EntityRenderer] Ant ${i}: type=${ant.type}, pos=(${Math.round(pos.x)}, ${Math.round(pos.y)})`);
        
        if (this.shouldRenderEntity(ant)) {
          const entityData = {
            entity: ant,
            type: 'ant',
            depth: this.getEntityDepth(ant),
            position: this.getEntityPosition(ant)
          };
          this.renderGroups.ANTS.push(entityData);
          console.log(`[EntityRenderer]   ✅ Added to render group (total: ${this.renderGroups.ANTS.length})`);
        } else {
          this.stats.culledEntities++;
          console.log(`[EntityRenderer]   ❌ CULLED (not in viewport)`);
        }
      }
    }
    
    console.log(`[EntityRenderer] collectAnts() complete - Collected: ${this.renderGroups.ANTS.length}, Culled: ${this.stats.culledEntities}`);
    
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
   * CRITICAL: Must convert world coordinates to screen coordinates using camera transform
   */
  isEntityInViewport(entity) {
    const worldPos = this.getEntityPosition(entity);
    
    if (!worldPos) {
      return true; // Render if we can't determine position
    }
    
    const size = this.getEntitySize(entity);
    const margin = this.config.cullMargin;
    
    // Convert world coordinates to screen coordinates using camera transform
    let screenX, screenY;
    
    if (typeof cameraManager !== 'undefined' && cameraManager && 
        typeof cameraManager.worldToScreen === 'function') {
      // Use camera transform to convert world → screen coords
      const screenPos = cameraManager.worldToScreen(worldPos.x, worldPos.y);
      screenX = screenPos.screenX;
      screenY = screenPos.screenY;
      
      // DEBUG: Log first entity's conversion
      if (entity.type === 'Queen') {
        const camPos = cameraManager.getCameraPosition ? cameraManager.getCameraPosition() : { x: 0, y: 0, zoom: 1 };
        console.log(`[Culling] Queen: world=(${Math.round(worldPos.x)}, ${Math.round(worldPos.y)}) → screen=(${Math.round(screenX)}, ${Math.round(screenY)})`);
        console.log(`[Culling]   Camera: pos=(${Math.round(camPos.x)}, ${Math.round(camPos.y)}), zoom=${camPos.zoom}`);
        console.log(`[Culling]   Viewport: ${g_canvasX}x${g_canvasY}, margin=${margin}`);
        console.log(`[Culling]   Check: screenX+margin(${Math.round(screenX+margin)}) >= 0 && screenX-margin(${Math.round(screenX-margin)}) <= ${g_canvasX}`);
        console.log(`[Culling]   Check: screenY+margin(${Math.round(screenY+margin)}) >= 0 && screenY-margin(${Math.round(screenY-margin)}) <= ${g_canvasY}`);
      }
    } else {
      // Fallback: use world coords directly (no camera transform)
      screenX = worldPos.x;
      screenY = worldPos.y;
      console.log(`[Culling] WARNING: No cameraManager.worldToScreen() - using world coords directly`);
    }
    
    // Check if screen position is within viewport bounds (with margin)
    const inViewport = (screenX + size.width + margin >= 0 && 
                        screenX - margin <= g_canvasX &&
                        screenY + size.height + margin >= 0 && 
                        screenY - margin <= g_canvasY);
    
    if (entity.type === 'Queen') {
      console.log(`[Culling]   Result: ${inViewport ? '✅ IN VIEWPORT' : '❌ CULLED'}`);
    }
    
    return inViewport;
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
    console.log(`[EntityRenderer] renderEntityGroupStandard() - Rendering ${entityGroup.length} entities`);
    
    for (const entityData of entityGroup) {
      try {
        if (entityData.entity && entityData.entity.render) {
          const pos = entityData.position || { x: 0, y: 0 };
          console.log(`[EntityRenderer]   Rendering ${entityData.type} at (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
          
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
        } else {
          console.warn(`[EntityRenderer]   Entity missing render method:`, entityData.entity);
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
