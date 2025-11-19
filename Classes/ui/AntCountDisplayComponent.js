/**
 * AntCountDisplayComponent - Population Display
 * 
 * Displays total ant count and breakdown by job type (Worker, Warrior, Scout)
 * Features expandable section and real-time updates via EventManager
 * 
 * Based on PopulationDisplayComponent pattern from AntRedo fork
 * 
 * @class AntCountDisplayComponent
 */

class AntCountDisplayComponent {
  /**
   * Create an AntCountDisplayComponent
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} [options={}] - Configuration options
   * @param {EventManager} [options.eventManager] - EventManager for auto-updates
   * @param {EntityManager} [options.entityManager] - EntityManager for querying ants
   * @param {Object} [options.sprites] - Ant sprites for icons
   */
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    
    // Manager references
    this.eventManager = options.eventManager;
    this.entityManager = options.entityManager;
    
    // Ant counts
    this.currentAnts = 0;
    this.maxAnts = 50; // Default cap
    this.isExpanded = false;
    
    // Ant type counts - all types from spriteMapping
    this.antTypes = [
      { type: 'Worker', count: 0, icon: null, color: [255, 215, 0] },    // Gold
      { type: 'Builder', count: 0, icon: null, color: [139, 90, 43] },   // Brown
      { type: 'Farmer', count: 0, icon: null, color: [76, 175, 80] },    // Green
      { type: 'Scout', count: 0, icon: null, color: [33, 150, 243] },    // Blue
      { type: 'Soldier', count: 0, icon: null, color: [255, 68, 68] },   // Red
      { type: 'Spitter', count: 0, icon: null, color: [156, 39, 176] },  // Purple
      { type: 'Queen', count: 0, icon: null, color: [255, 193, 7] }      // Amber
    ];
    
    // Layout properties
    this.panelWidth = 180;
    this.panelHeight = 60; // Collapsed height
    this.expandedHeight = 240; // Expanded height (more types now)
    this.padding = 12;
    this.lineSpacing = 25;
    this.fontSize = 14;
    this.iconSize = 20;
    
    // Visual settings
    this.backgroundColor = [44, 44, 44]; // #2C2C2C
    this.backgroundAlpha = 200;
    this.hoverAlpha = 230;
    this.isHovering = false;
    
    // Animation
    this.currentHeight = this.panelHeight;
    this.animationSpeed = 0.2; // Lerp speed
    
    // Sprites (will be loaded asynchronously by GameUIOverlay)
    this.antSprite = options.sprites?.ant || null;
    this.sprites = options.sprites || {};
    
    // Assign sprites to ant types
    if (options.sprites?.worker) this.antTypes[0].icon = options.sprites.worker;
    if (options.sprites?.builder) this.antTypes[1].icon = options.sprites.builder;
    if (options.sprites?.farmer) this.antTypes[2].icon = options.sprites.farmer;
    if (options.sprites?.scout) this.antTypes[3].icon = options.sprites.scout;
    if (options.sprites?.soldier) this.antTypes[4].icon = options.sprites.soldier;
    if (options.sprites?.spitter) this.antTypes[5].icon = options.sprites.spitter;
    if (options.sprites?.queen) this.antTypes[6].icon = options.sprites.queen;
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  /**
   * Subscribe to population-related events
   * @private
   */
  setupEventListeners() {
    if (!this.eventManager || !window.EntityEvents) return;
    
    // Update on ant creation
    this.eventManager.on(EntityEvents.ANT_CREATED, (data) => {
      this.updateFromEntityManager();
    });
    
    // Update on ant destruction
    this.eventManager.on(EntityEvents.ANT_DESTROYED, (data) => {
      this.updateFromEntityManager();
    });
    
    // Update on ant job change
    if (EntityEvents.ANT_JOB_CHANGED) {
      this.eventManager.on(EntityEvents.ANT_JOB_CHANGED, (data) => {
        this.updateFromEntityManager();
      });
    }
  }
  
  /**
   * Query EntityManager for real-time ant counts
   * @private
   */
  updateFromEntityManager() {
    if (!this.entityManager) return;
    
    // Get all ants
    const allAnts = this.entityManager.getByType('ant');
    
    // Filter for player faction only
    const playerAnts = allAnts.filter(ant => {
      // Check model.faction first (MVC ants)
      if (ant.model && ant.model.faction === 'player') return true;
      // Check _faction for legacy Entity ants
      if (ant._faction === 'player') return true;
      // Check faction getter
      if (typeof ant.faction !== 'undefined' && ant.faction === 'player') return true;
      return false;
    });
    
    this.currentAnts = playerAnts.length;
    
    // Reset type counts
    this.antTypes.forEach(type => type.count = 0);
    
    // Count by job type (only player ants)
    playerAnts.forEach(ant => {
      if (!ant.model) return;
      
      const jobName = ant.model.jobName || 'Worker';
      
      // Map job names to display types (exact match)
      const antType = this.antTypes.find(t => t.type === jobName);
      if (antType) {
        antType.count++;
      } else {
        // Fallback mappings for aliases
        if (jobName === 'Gatherer') {
          this.antTypes[0].count++; // Worker
        } else if (jobName === 'Warrior' || jobName === 'Fighter') {
          this.antTypes[4].count++; // Soldier
        } else {
          this.antTypes[0].count++; // Default to Worker
        }
      }
    });
  }
  
  /**
   * Update total ant count manually
   * @param {number} current - Current ant count
   * @param {number} max - Maximum ant capacity
   */
  updateTotal(current, max) {
    this.currentAnts = current;
    this.maxAnts = max;
  }
  
  /**
   * Update count for specific ant type
   * @param {string} type - Type name (Worker, Warrior, Scout)
   * @param {number} count - New count
   */
  updateTypeCount(type, count) {
    const antType = this.antTypes.find(t => t.type === type);
    if (antType) {
      antType.count = count;
    }
  }
  
  /**
   * Set expanded state
   * @param {boolean} expanded - Whether expanded
   */
  setExpanded(expanded) {
    this.isExpanded = expanded;
  }
  
  /**
   * Toggle expanded state
   */
  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }
  
  /**
   * Check if mouse is over the panel
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if mouse over panel
   */
  isMouseOver(mouseX, mouseY) {
    return (
      mouseX >= this.x &&
      mouseX <= this.x + this.panelWidth &&
      mouseY >= this.y &&
      mouseY <= this.y + this.currentHeight
    );
  }
  
  /**
   * Handle mouse click
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if click was on panel
   */
  handleClick(mouseX, mouseY) {
    if (this.isMouseOver(mouseX, mouseY)) {
      this.toggleExpanded();
      return true;
    }
    return false;
  }
  
  /**
   * Set hover state
   * @param {boolean} hovered - Whether panel is hovered
   */
  setHovered(hovered) {
    this.isHovering = hovered;
  }
  
  /**
   * Set position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  /**
   * Update animation state and query real-time ant counts
   */
  update() {
    // Query real-time counts from EntityManager
    this.updateFromEntityManager();
    
    // Smooth height animation
    const targetHeight = this.isExpanded ? this.expandedHeight : this.panelHeight;
    const diff = targetHeight - this.currentHeight;
    
    if (Math.abs(diff) > 1) {
      this.currentHeight += diff * this.animationSpeed;
    } else {
      this.currentHeight = targetHeight;
    }
  }
  
  /**
   * Render population display
   * @param {string} [gameState='PLAYING'] - Current game state
   */
  render(gameState = 'PLAYING') {
    if (gameState !== 'PLAYING') return;
    
    push();
    
    // Draw background panel with border for better visibility
    const alpha = this.isHovering ? this.hoverAlpha : this.backgroundAlpha;
    this.drawPanel(this.x, this.y, this.panelWidth, this.currentHeight, this.backgroundColor, alpha);
    
    // Draw total ant count (always visible)
    let currentY = this.y + this.padding;
    
    fill(255, 255, 255);
    textAlign(LEFT, TOP);
    textSize(this.fontSize);
    
    // Ant icon - use worker sprite or fallback to emoji
    const titleSprite = this.antSprite || (this.sprites && this.sprites.worker);
    if (titleSprite && titleSprite.width > 0) {
      push();
      imageMode(CORNER);
      image(titleSprite, this.x + this.padding, currentY, this.iconSize, this.iconSize);
      pop();
    } else {
      textSize(this.iconSize);
      text('🐜', this.x + this.padding, currentY);
    }
    
    // Total count text
    textSize(this.fontSize);
    const totalText = `Total Ants: ${this.currentAnts}/${this.maxAnts}`;
    text(totalText, this.x + this.padding + this.iconSize + 5, currentY + 3);
    
    currentY += this.lineSpacing;
    
    // Draw expand/collapse indicator
    const indicator = this.isExpanded ? '▼' : '▶';
    textSize(12);
    fill(200, 200, 200);
    text(indicator, this.x + this.padding, currentY);
    fill(255, 255, 255);
    textSize(12);
    text('Breakdown', this.x + this.padding + 15, currentY + 2);
    
    currentY += this.lineSpacing;
    
    // Draw breakdown (only if expanded)
    if (this.currentHeight > this.panelHeight + 10) {
      // Calculate fade-in alpha
      const fadeProgress = (this.currentHeight - this.panelHeight) / (this.expandedHeight - this.panelHeight);
      const textAlpha = Math.floor(255 * fadeProgress);
      
      // Draw separator line
      stroke(100, 100, 100, textAlpha);
      strokeWeight(1);
      line(
        this.x + this.padding,
        currentY - 5,
        this.x + this.panelWidth - this.padding,
        currentY - 5
      );
      noStroke();
      
      // Draw each ant type
      this.antTypes.forEach(antType => {
        // Icon - check if sprite is loaded (width > 0)
        if (antType.icon && antType.icon.width > 0) {
          push();
          tint(255, 255, 255, textAlpha);
          imageMode(CORNER);
          image(antType.icon, this.x + this.padding + 10, currentY, this.iconSize - 4, this.iconSize - 4);
          noTint();
          pop();
        } else if (antType.icon) {
          // Sprite is loading, show colored circle placeholder
          push();
          fill(antType.color[0], antType.color[1], antType.color[2], textAlpha);
          noStroke();
          circle(this.x + this.padding + 10 + (this.iconSize - 4) / 2, currentY + (this.iconSize - 4) / 2, (this.iconSize - 4) * 0.7);
          pop();
        } else {
          // No sprite provided, fallback emoji
          fill(255, 255, 255, textAlpha);
          textSize(this.iconSize - 4);
          const fallbackIcon = antType.type === 'Worker' ? '🐜' : antType.type === 'Warrior' ? '⚔️' : '👁️';
          text(fallbackIcon, this.x + this.padding + 10, currentY);
        }
        
        // Type name and count
        textSize(this.fontSize - 2);
        fill(antType.color[0], antType.color[1], antType.color[2], textAlpha);
        const typeText = `${antType.type}: ${antType.count}`;
        text(typeText, this.x + this.padding + 35, currentY + 2);
        
        currentY += this.lineSpacing;
      });
    }
    
    pop();
  }
  
  /**
   * Draw UI panel with rounded corners
   * @private
   */
  drawPanel(x, y, w, h, bgColor, alpha) {
    push();
    fill(bgColor[0], bgColor[1], bgColor[2], alpha);
    noStroke();
    rect(x, y, w, h, 8); // 8px corner radius
    pop();
  }
  
  /**
   * Cleanup event listeners
   */
  destroy() {
    // Event listeners will be garbage collected
    this.eventManager = null;
    this.entityManager = null;
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntCountDisplayComponent;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.AntCountDisplayComponent = AntCountDisplayComponent;
}
