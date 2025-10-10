/**
 * TooltipController - Complete Standalone Tooltip System
 * Manages tooltip display for individual entities with advanced persistence and rendering
 * Combines all tooltip functionality into a single, comprehensive controller
 */
class TooltipController {
  // Static global tooltip management
  static currentTooltip = null;
  static tooltipRenderer = null;
  
  constructor(entity) {
    this.entity = entity;
    
    // Tooltip configuration
    this.enabled = true;
    this.delay = 250; // milliseconds
    this.customData = null;
    
    // State tracking
    this.isHovered = false;
    this.hoverStartTime = 0;
    this.lastMousePosition = { x: -1, y: -1 };
    this.isTooltipVisible = false;
    
    // Advanced tooltip persistence
    this.lastTooltipInteractionTime = 0;
    this.tooltipGracePeriod = 3000; // 3 seconds grace period
    this.tooltipBounds = { x: 0, y: 0, width: 0, height: 0 };
    this.isMouseOverTooltip = false;
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.updateThreshold = 16; // ~60fps limit
    
    // Tooltip content and positioning
    this.tooltipContent = null;
    this.tooltipPosition = { x: 0, y: 0 };
    
    // Recursion prevention
    this._generatingContent = false;
    
    // Content caching
    this.contentCache = null;
    this.cacheTimestamp = 0;
    this.cacheTimeout = 1000; // 1 second cache
    
    // Tooltip styling
    this.style = {
      backgroundColor: [40, 40, 40, 240],
      borderColor: [150, 150, 150, 255],
      textColor: [255, 255, 255, 255],
      headerColor: [100, 200, 100, 255],
      valueColor: [100, 150, 255, 255],
      statColor: [200, 200, 100, 255],
      warningColor: [255, 150, 100, 255],
      fontSize: 12,
      padding: 10,
      lineHeight: 16,
      maxWidth: 300,
      borderRadius: 5,
      shadowOffset: 2,
      shadowColor: [0, 0, 0, 100]
    };
    
    // Initialize global renderer if needed
    if (!TooltipController.tooltipRenderer) {
      TooltipController.tooltipRenderer = new TooltipRenderer();
    }
  }
  
  /**
   * Update tooltip state - comprehensive tooltip management
   */
  update() {
    if (!this.enabled) return;
    
    const currentTime = Date.now();
    
    // Throttle updates for performance
    if (currentTime - this.lastUpdateTime < this.updateThreshold) return;
    this.lastUpdateTime = currentTime;
    
    // Check if mouse is over this entity
    const wasHovered = this.isHovered;
    this.isHovered = this.entity.isMouseOver && this.entity.isMouseOver(mouseX, mouseY);
    
    // Handle hover state changes
    if (this.isHovered && !wasHovered) {
      // Started hovering - take control of global tooltip
      this._takeTooltipControl();
      this.hoverStartTime = currentTime;
      this.lastMousePosition = { x: mouseX, y: mouseY };
    } else if (!this.isHovered && wasHovered) {
      // Stopped hovering - but don't immediately hide due to grace period
      this._releaseTooltipControl();
    }
    
    // Track mouse movement while hovering
    if (this.isHovered) {
      const mouseDelta = Math.abs(mouseX - this.lastMousePosition.x) + Math.abs(mouseY - this.lastMousePosition.y);
      
      // If mouse moved significantly, reset hover timer
      if (mouseDelta > 3) {
        this.hoverStartTime = currentTime;
        this.lastMousePosition = { x: mouseX, y: mouseY };
      }
    }
    
    // Show tooltip after delay if we control it
    if (TooltipController.currentTooltip === this && this.isHovered && !this.isTooltipVisible) {
      const hoverDuration = currentTime - this.hoverStartTime;
      if (hoverDuration >= this.delay) {
        this._showTooltip(mouseX, mouseY);
      }
    }
    
    // Update tooltip interaction tracking
    if (this.isHovered || this.isMouseOverTooltip) {
      this.lastTooltipInteractionTime = currentTime;
    }
    
    // Check if mouse is over tooltip (if we're showing it)
    if (this.isTooltipVisible && TooltipController.currentTooltip === this) {
      this.isMouseOverTooltip = this._isPointInTooltipBounds(mouseX, mouseY);
    }
    
    // Handle tooltip visibility with grace period
    this._updateTooltipVisibility(currentTime);
  }
  
  /**
   * Take control of the global tooltip system
   * @private
   */
  _takeTooltipControl() {
    if (TooltipController.currentTooltip && TooltipController.currentTooltip !== this) {
      TooltipController.currentTooltip._forceHideTooltip();
    }
    TooltipController.currentTooltip = this;
  }
  
  /**
   * Release control of the global tooltip system
   * @private
   */
  _releaseTooltipControl() {
    // Don't immediately release - let grace period handle it
  }
  
  /**
   * Show tooltip for this entity
   * @private
   */
  _showTooltip(mouseX, mouseY) {
    this.isTooltipVisible = true;
    this.tooltipPosition = { 
      x: mouseX + 15, 
      y: mouseY - 20 
    };
    
    // Generate or use cached content
    this.tooltipContent = this._getCachedTooltipContent();
    
    // Calculate bounds for mouse interaction
    this._calculateTooltipBounds();
  }
  
  /**
   * Force hide tooltip immediately
   * @private
   */
  _forceHideTooltip() {
    this.isTooltipVisible = false;
    this.isMouseOverTooltip = false;
    if (TooltipController.currentTooltip === this) {
      TooltipController.currentTooltip = null;
    }
  }
  
  /**
   * Update tooltip visibility with grace period logic
   * @private
   */
  _updateTooltipVisibility(currentTime) {
    if (!this.isTooltipVisible || TooltipController.currentTooltip !== this) return;
    
    const timeSinceLastInteraction = currentTime - this.lastTooltipInteractionTime;
    
    // Keep tooltip visible if:
    // 1. Mouse is currently over the tooltip
    // 2. Mouse was over tooltip/entity within the grace period
    const shouldKeepVisible = this.isMouseOverTooltip || 
                             timeSinceLastInteraction < this.tooltipGracePeriod;
    
    if (!shouldKeepVisible) {
      this._forceHideTooltip();
    }
  }
  
  /**
   * Check if point is within tooltip bounds
   * @private
   */
  _isPointInTooltipBounds(x, y) {
    return x >= this.tooltipBounds.x && 
           x <= this.tooltipBounds.x + this.tooltipBounds.width &&
           y >= this.tooltipBounds.y && 
           y <= this.tooltipBounds.y + this.tooltipBounds.height;
  }
  
  /**
   * Calculate tooltip bounds for mouse interaction
   * @private
   */
  _calculateTooltipBounds() {
    if (!this.tooltipContent || !this.tooltipContent.lines) {
      this.tooltipBounds = { x: 0, y: 0, width: 0, height: 0 };
      return;
    }
    
    const padding = this.style.padding;
    const lineHeight = this.style.lineHeight;
    const lines = this.tooltipContent.lines;
    
    // Estimate width based on text content
    let maxWidth = 0;
    const avgCharWidth = this.style.fontSize * 0.6;
    
    for (const line of lines) {
      const textWidth = (line.text || '').length * avgCharWidth;
      maxWidth = Math.max(maxWidth, textWidth);
    }
    
    const tooltipWidth = Math.min(maxWidth + padding * 2, this.style.maxWidth);
    const tooltipHeight = lines.length * lineHeight + padding * 2;
    
    // Set bounds with extra padding for easier interaction
    const extraPadding = 5;
    this.tooltipBounds = {
      x: this.tooltipPosition.x - extraPadding,
      y: this.tooltipPosition.y - extraPadding,
      width: tooltipWidth + extraPadding * 2,
      height: tooltipHeight + extraPadding * 2
    };
  }
  
  /**
   * Generate tooltip content for this entity
   * @returns {Object} Tooltip content object
   */
  generateTooltipContent() {
    // Recursion guard - prevent infinite loops
    if (this._generatingContent) {
      console.warn('TooltipController: Prevented recursion in generateTooltipContent');
      return { lines: [{ text: 'Error: Tooltip recursion detected', style: 'error' }] };
    }
    this._generatingContent = true;
    
    try {
      const lines = [];
      
      // Entity identification
      const entityName = this.entity.getName ? this.entity.getName() : 
                        this.entity._type || this.entity.type || 'Entity';
      const entityId = this.entity._id || this.entity.id || 'Unknown';
      lines.push({ text: `🔹 ${entityName}`, style: 'header' });
      
      // Position and basic info
      const pos = this.entity.getPosition ? this.entity.getPosition() : 
                  { x: this.entity.x || 0, y: this.entity.y || 0 };
      lines.push({ text: `📍 Position: (${Math.round(pos.x)}, ${Math.round(pos.y)})`, style: 'normal' });
      
      // Health (if available)
      if (this.entity._health !== undefined || this.entity.health !== undefined) {
        const health = this.entity._health || this.entity.health;
        const maxHealth = this.entity._maxHealth || this.entity.maxHealth || health;
        const healthPercent = maxHealth > 0 ? Math.round((health / maxHealth) * 100) : 100;
        const healthStyle = healthPercent > 75 ? 'stat' : healthPercent > 25 ? 'warning' : 'warning';
        lines.push({ text: `❤️ Health: ${health}/${maxHealth} (${healthPercent}%)`, style: healthStyle });
      }
      
      // Movement speed (if available)
      if (this.entity.movementSpeed !== undefined) {
        lines.push({ text: `🏃 Speed: ${this.entity.movementSpeed}`, style: 'stat' });
      }
      
      // Faction (if available)
      if (this.entity._faction !== undefined || this.entity.faction !== undefined) {
        const faction = this.entity._faction || this.entity.faction;
        const factionEmoji = faction === 'player' ? '🟢' : faction === 'enemy' ? '🔴' : '⚪';
        lines.push({ text: `${factionEmoji} Faction: ${faction}`, style: 'normal' });
      }
      
      // State (if available)
      if (this.entity._stateMachine && this.entity._stateMachine.getCurrentState) {
        const state = this.entity._stateMachine.getCurrentState();
        lines.push({ text: `🎯 State: ${state}`, style: 'value' });
      }
      
      // Custom tooltip data from entity (with recursion prevention)
      if (this.entity.getTooltipData && typeof this.entity.getTooltipData === 'function') {
        try {
          const customData = this.entity.getTooltipData();
          if (Array.isArray(customData) && customData.length > 0) {
            lines.push(...customData);
          }
        } catch (error) {
          console.warn('Error getting custom tooltip data:', error);
          lines.push({ text: '⚠️ Custom data error', style: 'error' });
        }
      }
      
      // Custom data from controller
      if (this.customData) {
        if (Array.isArray(this.customData)) {
          lines.push(...this.customData);
        } else if (typeof this.customData === 'function') {
          try {
            const data = this.customData(this.entity);
            if (Array.isArray(data)) {
              lines.push(...data);
            }
          } catch (error) {
            console.warn('Error executing custom tooltip data function:', error);
          }
        }
      }
      
      return { lines, maxWidth: 300 };
      
    } finally {
      // Reset recursion guard
      this._generatingContent = false;
    }
  }
  
  /**
   * Get cached tooltip content or generate new content
   * @private
   */
  _getCachedTooltipContent() {
    const currentTime = Date.now();
    
    // Check cache
    if (this.contentCache && (currentTime - this.cacheTimestamp < this.cacheTimeout)) {
      return this.contentCache;
    }
    
    // Generate new content
    const content = this.generateTooltipContent();
    
    // Cache it
    this.contentCache = content;
    this.cacheTimestamp = currentTime;
    
    return content;
  }
  
  /**
   * Enable or disable tooltips for this entity
   * @param {boolean} enabled - Whether tooltips should be shown
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this._forceHideTooltip();
    }
  }
  
  /**
   * Check if tooltips are enabled
   * @returns {boolean} True if tooltips are enabled
   */
  isEnabled() {
    return this.enabled;
  }
  
  /**
   * Set tooltip delay
   * @param {number} delay - Delay in milliseconds
   */
  setDelay(delay) {
    this.delay = Math.max(0, delay);
  }
  
  /**
   * Get tooltip delay
   * @returns {number} Delay in milliseconds
   */
  getDelay() {
    return this.delay;
  }
  
  /**
   * Set custom tooltip data
   * @param {Array|Function} data - Array of tooltip lines or function that returns them
   */
  setCustomData(data) {
    this.customData = data;
  }
  
  /**
   * Get custom tooltip data
   * @returns {Array|Function|null} Custom tooltip data
   */
  getCustomData() {
    return this.customData;
  }
  
  /**
   * Set entity-specific tooltip style overrides
   * @param {Object} style - Style overrides
   */
  setStyle(style) {
    this.style = style;
  }
  
  /**
   * Get entity-specific tooltip style overrides
   * @returns {Object|null} Style overrides
   */
  getStyle() {
    return this.style;
  }
  
  /**
   * Get hover state information
   * @returns {Object} Hover state data
   */
  getHoverState() {
    return {
      isHovered: this.isHovered,
      hoverDuration: this.isHovered ? Date.now() - this.hoverStartTime : 0,
      shouldShow: this.shouldShowTooltip(),
      enabled: this.enabled,
      delay: this.delay
    };
  }
  
  /**
   * Force show tooltip (for testing/debugging)
   */
  forceShowTooltip() {
    if (!this.enabled) return;
    
    // Simulate hover conditions
    this.isHovered = true;
    this.hoverStartTime = Date.now() - this.delay - 1;
    
    // Trigger tooltip display via global system
    if (typeof g_entityTooltipSystem !== 'undefined' && g_entityTooltipSystem) {
      g_entityTooltipSystem.hoveredEntity = this.entity;
      g_entityTooltipSystem.showTooltip(mouseX, mouseY);
    }
  }
  
  /**
   * Force hide tooltip (for testing/debugging)
   */
  forceHideTooltip() {
    this.isHovered = false;
    this._hideTooltip();
  }
  
  /**
   * Get debug information about this tooltip controller
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      entityId: this.entity._id || this.entity.id,
      entityType: this.entity._type || this.entity.type,
      enabled: this.enabled,
      isHovered: this.isHovered,
      hoverDuration: this.isHovered ? Date.now() - this.hoverStartTime : 0,
      shouldShow: this.shouldShowTooltip(),
      delay: this.delay,
      hasCustomData: !!this.customData,
      hasStyle: !!this.style,
      lastUpdateTime: this.lastUpdateTime
    };
  }
  
  /**
   * Set custom tooltip style for this entity
   * @param {Object} styleOverrides - Style properties to override
   */
  setStyle(styleOverrides) {
    this.style = { ...this.style, ...styleOverrides };
    this.contentCache = null; // Clear cache when style changes
  }
  
  /**
   * Render tooltip if this controller is active
   */
  render() {
    if (this.isTooltipVisible && TooltipController.currentTooltip === this && this.tooltipContent) {
      TooltipController.tooltipRenderer.render(
        this.tooltipPosition,
        this.tooltipContent,
        this.style
      );
    }
  }
  
  /**
   * Clean up when entity is destroyed
   */
  destroy() {
    // Force hide any active tooltip
    if (TooltipController.currentTooltip === this) {
      this._forceHideTooltip();
    }
    
    // Clear references
    this.entity = null;
    this.customData = null;
    this.contentCache = null;
  }
  
  /**
   * Static method to render the current active tooltip
   */
  static renderCurrentTooltip() {
    if (TooltipController.currentTooltip) {
      TooltipController.currentTooltip.render();
    }
  }
  
  /**
   * Static method to hide any current tooltip
   */
  static hideCurrentTooltip() {
    if (TooltipController.currentTooltip) {
      TooltipController.currentTooltip._forceHideTooltip();
    }
  }
}

/**
 * TooltipRenderer - Handles the visual rendering of tooltips
 */
class TooltipRenderer {
  constructor() {
    this.lastRenderTime = 0;
    this.renderCooldown = 16; // 60fps limit
  }
  
  /**
   * Render a tooltip with given content and style
   */
  render(position, content, style) {
    if (!content || !content.lines || content.lines.length === 0) return;
    
    const currentTime = Date.now();
    if (currentTime - this.lastRenderTime < this.renderCooldown) return;
    this.lastRenderTime = currentTime;
    
    if (typeof push === 'function' && typeof pop === 'function') {
      push();
      
      // Calculate tooltip dimensions
      const padding = style.padding;
      const lineHeight = style.lineHeight;
      const lines = content.lines;
      
      let maxWidth = 0;
      const avgCharWidth = style.fontSize * 0.6;
      
      for (const line of lines) {
        const textWidth = (line.text || '').length * avgCharWidth;
        maxWidth = Math.max(maxWidth, textWidth);
      }
      
      const tooltipWidth = Math.min(maxWidth + padding * 2, style.maxWidth);
      const tooltipHeight = lines.length * lineHeight + padding * 2;
      
      // Adjust position to keep tooltip on screen
      let x = position.x;
      let y = position.y;
      
      if (typeof width !== 'undefined' && typeof height !== 'undefined') {
        if (x + tooltipWidth > width) x = width - tooltipWidth - 10;
        if (y + tooltipHeight > height) y = height - tooltipHeight - 10;
        if (x < 0) x = 10;
        if (y < 0) y = 10;
      }
      
      // Draw shadow
      if (style.shadowOffset > 0) {
        fill(...style.shadowColor);
        noStroke();
        rect(x + style.shadowOffset, y + style.shadowOffset, tooltipWidth, tooltipHeight, style.borderRadius);
      }
      
      // Draw background
      fill(...style.backgroundColor);
      stroke(...style.borderColor);
      strokeWeight(1);
      rect(x, y, tooltipWidth, tooltipHeight, style.borderRadius);
      
      // Draw text
      textAlign(LEFT, TOP);
      textSize(style.fontSize);
      
      let currentY = y + padding;
      for (const line of lines) {
        // Set color based on style
        switch (line.style) {
          case 'header':
            fill(...style.headerColor);
            break;
          case 'value':
            fill(...style.valueColor);
            break;
          case 'stat':
            fill(...style.statColor);
            break;
          case 'warning':
          case 'error':
            fill(...style.warningColor);
            break;
          default:
            fill(...style.textColor);
        }
        
        text(line.text || '', x + padding, currentY);
        currentY += lineHeight;
      }
      
      pop();
    }
  }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TooltipController, TooltipRenderer };
}