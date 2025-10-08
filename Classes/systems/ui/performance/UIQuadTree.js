/**
 * @fileoverview QuadTree Implementation for Spatial Partitioning
 * Optimizes button group rendering and interaction by spatially organizing UI elements
 * Part of the Universal Button Group System performance optimizations
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * QuadTree Node for spatial partitioning of UI elements
 * Efficiently organizes button groups by their spatial location
 */
class QuadTreeNode {
  /**
   * Creates a new QuadTree node
   * 
   * @param {Object} bounds - Bounding rectangle {x, y, width, height}
   * @param {number} maxObjects - Maximum objects before subdivision
   * @param {number} maxLevels - Maximum subdivision levels
   * @param {number} level - Current subdivision level
   */
  constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
    this.bounds = { ...bounds };
    this.objects = [];
    this.nodes = [];
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
    this.level = level;
  }

  /**
   * Clear all objects and child nodes
   */
  clear() {
    this.objects = [];
    
    // Clear child nodes recursively
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i]) {
        this.nodes[i].clear();
        this.nodes[i] = null;
      }
    }
    
    this.nodes = [];
  }

  /**
   * Split the node into four quadrants
   */
  split() {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    // Top-right
    this.nodes[0] = new QuadTreeNode(
      { x: x + subWidth, y: y, width: subWidth, height: subHeight },
      this.maxObjects, this.maxLevels, this.level + 1
    );

    // Top-left
    this.nodes[1] = new QuadTreeNode(
      { x: x, y: y, width: subWidth, height: subHeight },
      this.maxObjects, this.maxLevels, this.level + 1
    );

    // Bottom-left
    this.nodes[2] = new QuadTreeNode(
      { x: x, y: y + subHeight, width: subWidth, height: subHeight },
      this.maxObjects, this.maxLevels, this.level + 1
    );

    // Bottom-right
    this.nodes[3] = new QuadTreeNode(
      { x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight },
      this.maxObjects, this.maxLevels, this.level + 1
    );
  }

  /**
   * Determine which quadrant(s) an object belongs to
   * 
   * @param {Object} bounds - Object bounds {x, y, width, height}
   * @returns {Array<number>} Array of quadrant indices
   */
  getIndex(bounds) {
    const indexes = [];
    const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
    const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

    const startIsNorth = bounds.y < horizontalMidpoint;
    const startIsWest = bounds.x < verticalMidpoint;
    const endIsEast = bounds.x + bounds.width > verticalMidpoint;
    const endIsSouth = bounds.y + bounds.height > horizontalMidpoint;

    // Top-right quadrant
    if (startIsNorth && endIsEast) {
      indexes.push(0);
    }

    // Top-left quadrant
    if (startIsNorth && startIsWest) {
      indexes.push(1);
    }

    // Bottom-left quadrant
    if (endIsSouth && startIsWest) {
      indexes.push(2);
    }

    // Bottom-right quadrant
    if (endIsSouth && endIsEast) {
      indexes.push(3);
    }

    return indexes;
  }

  /**
   * Insert an object into the quadtree
   * 
   * @param {Object} object - Object to insert with bounds property
   */
  insert(object) {
    // If we have child nodes, insert into appropriate child
    if (this.nodes.length > 0) {
      const indexes = this.getIndex(object.bounds);
      
      for (const index of indexes) {
        this.nodes[index].insert(object);
      }
      
      return;
    }

    // Add object to this node
    this.objects.push(object);

    // If we exceed capacity and haven't reached max level, split
    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      // Split the node if not already split
      if (this.nodes.length === 0) {
        this.split();
      }

      // Move all objects to child nodes
      let i = 0;
      while (i < this.objects.length) {
        const indexes = this.getIndex(this.objects[i].bounds);
        let moved = false;

        for (const index of indexes) {
          this.nodes[index].insert(this.objects[i]);
          moved = true;
        }

        if (moved) {
          this.objects.splice(i, 1);
        } else {
          i++;
        }
      }
    }
  }

  /**
   * Retrieve all objects that could collide with the given bounds
   * 
   * @param {Object} bounds - Query bounds {x, y, width, height}
   * @param {Array} returnObjects - Array to populate with results
   * @returns {Array} Array of objects in the query area
   */
  retrieve(bounds, returnObjects = []) {
    // Check if query bounds intersect with node bounds
    if (!this.intersects(bounds, this.bounds)) {
      return returnObjects;
    }

    // Add objects from this node
    returnObjects.push(...this.objects);

    // If we have child nodes, check them too
    if (this.nodes.length > 0) {
      const indexes = this.getIndex(bounds);
      
      for (const index of indexes) {
        this.nodes[index].retrieve(bounds, returnObjects);
      }
    }

    return returnObjects;
  }

  /**
   * Check if two rectangles intersect
   * 
   * @param {Object} rect1 - First rectangle
   * @param {Object} rect2 - Second rectangle
   * @returns {boolean} True if rectangles intersect
   */
  intersects(rect1, rect2) {
    return !(rect1.x > rect2.x + rect2.width ||
             rect1.x + rect1.width < rect2.x ||
             rect1.y > rect2.y + rect2.height ||
             rect1.y + rect1.height < rect2.y);
  }

  /**
   * Get total number of objects in the tree
   * 
   * @returns {number} Total object count
   */
  getTotalObjects() {
    let total = this.objects.length;
    
    for (const node of this.nodes) {
      if (node) {
        total += node.getTotalObjects();
      }
    }
    
    return total;
  }

  /**
   * Get diagnostic information about the tree structure
   * 
   * @returns {Object} Diagnostic information
   */
  getDiagnostics() {
    const diagnostics = {
      level: this.level,
      objects: this.objects.length,
      totalObjects: this.getTotalObjects(),
      bounds: { ...this.bounds },
      hasChildren: this.nodes.length > 0,
      children: []
    };

    for (const node of this.nodes) {
      if (node) {
        diagnostics.children.push(node.getDiagnostics());
      }
    }

    return diagnostics;
  }
}

/**
 * QuadTree implementation for UI spatial partitioning
 * Manages spatial organization of button groups for efficient queries
 */
class UIQuadTree {
  /**
   * Creates a new UIQuadTree
   * 
   * @param {Object} bounds - World bounds {x, y, width, height}
   * @param {Object} options - QuadTree options
   */
  constructor(bounds, options = {}) {
    this.root = new QuadTreeNode(
      bounds,
      options.maxObjects || 10,
      options.maxLevels || 5
    );
    
    this.options = {
      enableDebug: options.enableDebug || false,
      trackStatistics: options.trackStatistics !== false,
      ...options
    };

    // Performance tracking
    this.statistics = {
      insertCount: 0,
      queryCount: 0,
      totalObjects: 0,
      lastRebuild: 0,
      averageQueryTime: 0,
      queryTimes: []
    };
  }

  /**
   * Clear the quadtree
   */
  clear() {
    this.root.clear();
    this.statistics.totalObjects = 0;
  }

  /**
   * Insert a button group into the quadtree
   * 
   * @param {Object} buttonGroup - Button group with getBounds() method
   */
  insertButtonGroup(buttonGroup) {
    if (!buttonGroup || typeof buttonGroup.getBounds !== 'function') {
      console.warn('QuadTree: Invalid button group provided to insert');
      return;
    }

    const bounds = buttonGroup.getBounds();
    const object = {
      id: buttonGroup.getId(),
      buttonGroup: buttonGroup,
      bounds: bounds,
      insertTime: Date.now()
    };

    this.root.insert(object);
    
    if (this.options.trackStatistics) {
      this.statistics.insertCount++;
      this.statistics.totalObjects++;
    }
  }

  /**
   * Query button groups within a specific area
   * 
   * @param {Object} queryBounds - Query area {x, y, width, height}
   * @returns {Array<Object>} Array of button groups in the query area
   */
  queryArea(queryBounds) {
    const startTime = this.options.trackStatistics ? Date.now() : 0;
    
    const objects = this.root.retrieve(queryBounds);
    const buttonGroups = objects.map(obj => obj.buttonGroup);

    if (this.options.trackStatistics) {
      const queryTime = Date.now() - startTime;
      this.statistics.queryCount++;
      this.statistics.queryTimes.push(queryTime);
      
      // Keep only last 100 query times for average calculation
      if (this.statistics.queryTimes.length > 100) {
        this.statistics.queryTimes.shift();
      }
      
      this.statistics.averageQueryTime = 
        this.statistics.queryTimes.reduce((sum, time) => sum + time, 0) / 
        this.statistics.queryTimes.length;
    }

    return buttonGroups;
  }

  /**
   * Query button groups at a specific point
   * 
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Array<Object>} Array of button groups at the point
   */
  queryPoint(x, y) {
    return this.queryArea({ x: x, y: y, width: 1, height: 1 });
  }

  /**
   * Query visible button groups within viewport
   * 
   * @param {Object} viewport - Viewport bounds {x, y, width, height}
   * @returns {Array<Object>} Array of visible button groups
   */
  queryVisible(viewport) {
    const candidates = this.queryArea(viewport);
    
    // Filter for actually visible groups
    return candidates.filter(group => {
      if (typeof group.isVisible === 'function') {
        return group.isVisible();
      }
      return true;
    });
  }

  /**
   * Rebuild the quadtree with current objects
   * Useful when many objects have moved or changed bounds
   */
  rebuild() {
    // Collect all current objects
    const allObjects = [];
    this.collectAllObjects(this.root, allObjects);

    // Clear and rebuild
    this.clear();
    
    for (const obj of allObjects) {
      // Update bounds in case they changed
      if (obj.buttonGroup && typeof obj.buttonGroup.getBounds === 'function') {
        obj.bounds = obj.buttonGroup.getBounds();
        this.root.insert(obj);
      }
    }

    this.statistics.lastRebuild = Date.now();
    this.statistics.totalObjects = allObjects.length;
  }

  /**
   * Collect all objects from the tree recursively
   * 
   * @param {QuadTreeNode} node - Node to collect from
   * @param {Array} objects - Array to collect objects into
   */
  collectAllObjects(node, objects) {
    objects.push(...node.objects);
    
    for (const childNode of node.nodes) {
      if (childNode) {
        this.collectAllObjects(childNode, objects);
      }
    }
  }

  /**
   * Get performance statistics
   * 
   * @returns {Object} Performance statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      totalObjects: this.root.getTotalObjects()
    };
  }

  /**
   * Get diagnostic information about the tree
   * 
   * @returns {Object} Diagnostic information
   */
  getDiagnostics() {
    return {
      statistics: this.getStatistics(),
      structure: this.root.getDiagnostics(),
      options: { ...this.options }
    };
  }

  /**
   * Render debug visualization of the quadtree
   * Only works in environments with drawing capabilities
   */
  renderDebug() {
    if (!this.options.enableDebug) {
      return;
    }

    // Check if we have drawing functions available (p5.js)
    if (typeof stroke === 'function' && typeof line === 'function') {
      this.renderDebugNode(this.root);
    }
  }

  /**
   * Render debug visualization for a specific node
   * 
   * @param {QuadTreeNode} node - Node to render
   */
  renderDebugNode(node) {
    // Draw node bounds
    if (typeof stroke === 'function' && typeof noFill === 'function' && typeof rect === 'function') {
      stroke(255, 0, 0, 100); // Red with transparency
      noFill();
      strokeWeight(1);
      rect(node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height);
    }

    // Draw object positions
    if (typeof fill === 'function' && typeof circle === 'function') {
      fill(0, 255, 0, 150); // Green with transparency
      noStroke();
      
      for (const obj of node.objects) {
        const centerX = obj.bounds.x + obj.bounds.width / 2;
        const centerY = obj.bounds.y + obj.bounds.height / 2;
        circle(centerX, centerY, 4);
      }
    }

    // Recursively render child nodes
    for (const childNode of node.nodes) {
      if (childNode) {
        this.renderDebugNode(childNode);
      }
    }
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.UIQuadTree = UIQuadTree;
  window.QuadTreeNode = QuadTreeNode;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UIQuadTree, QuadTreeNode };
}