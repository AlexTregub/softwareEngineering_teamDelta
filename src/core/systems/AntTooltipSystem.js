/**
 * Ant Tooltip System
 * Displays detailed ant information on hover with 2-second delay
 * Shows job, experience, level, stats, and special abilities
 */
class AntTooltipSystem {
  constructor() {
    this.hoveredAnt = null;
    this.hoverStartTime = 0;
    this.tooltipDelay = 500; // 500 milliseconds
    this.isTooltipVisible = false;
    this.tooltipPosition = { x: 0, y: 0 };
    this.tooltipContent = "";
    
    // Tooltip styling
    this.style = {
      backgroundColor: [40, 40, 40, 240],
      borderColor: [150, 150, 150, 255],
      textColor: [255, 255, 255, 255],
      headerColor: [100, 200, 100, 255],
      xpColor: [100, 150, 255, 255],
      statColor: [200, 200, 100, 255],
      fontSize: 12,
      padding: 10,
      lineHeight: 16,
      maxWidth: 250,
      borderRadius: 5
    };
  }
  
  /**
   * Update tooltip system - call this in your main update loop
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   */
  update(mouseX, mouseY) {
    const currentTime = Date.now();
    const antUnderMouse = this.findAntUnderMouse(mouseX, mouseY);
    
    // Check if we're hovering over a different ant or no ant
    if (antUnderMouse !== this.hoveredAnt) {
      this.hoveredAnt = antUnderMouse;
      this.hoverStartTime = currentTime;
      this.isTooltipVisible = false;
    }
    
    // Show tooltip after delay
    if (this.hoveredAnt && !this.isTooltipVisible) {
      const hoverDuration = currentTime - this.hoverStartTime;
      if (hoverDuration >= this.tooltipDelay) {
        this.showTooltip(mouseX, mouseY);
      }
    }
    
    // Hide tooltip if no ant is hovered
    if (!this.hoveredAnt) {
      this.isTooltipVisible = false;
    }
  }
  
  /**
   * Find ant under mouse cursor
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {Object|null} Ant object or null
   */
  findAntUnderMouse(mouseX, mouseY) {
    if (typeof ants === 'undefined' || !ants || ants.length === 0) return null;
    
    // Check each ant to see if mouse is over it
    for (let i = ants.length - 1; i >= 0; i--) {
      const ant = ants[i];
      if (!ant || !ant.isActive) continue;
      
      // Use ant's isMouseOver method if available
      if (ant.isMouseOver && ant.isMouseOver(mouseX, mouseY)) {
        return ant;
      }
      
      // Fallback to basic bounds checking
      const pos = ant.getPosition ? ant.getPosition() : { x: ant.posX || ant.x, y: ant.posY || ant.y };
      const size = ant.getSize ? ant.getSize() : { x: ant.sizeX || ant.width || 32, y: ant.sizeY || ant.height || 32 };
      
      if (mouseX >= pos.x && mouseX <= pos.x + size.x &&
          mouseY >= pos.y && mouseY <= pos.y + size.y) {
        return ant;
      }
    }
    
    return null;
  }
  
  /**
   * Show tooltip for the hovered ant
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   */
  showTooltip(mouseX, mouseY) {
    if (!this.hoveredAnt) return;
    
    this.isTooltipVisible = true;
    this.tooltipPosition = { 
      x: mouseX + 15, 
      y: mouseY - 20 
    };
    this.tooltipContent = this.generateTooltipContent(this.hoveredAnt);
  }
  
  /**
   * Generate detailed tooltip content for an ant
   * @param {Object} ant - Ant object
   * @returns {string} Formatted tooltip text
   */
  generateTooltipContent(ant) {
    if (!ant) return "";
    
    const lines = [];
    
    // Ant ID/Name
    const antId = ant.antIndex !== undefined ? `Ant #${ant.antIndex}` : 'Ant';
    lines.push(`🐜 ${antId}`);
    
    // Job Information
    const jobName = ant.jobName || ant.JobName || ant._JobName || 'Scout';
    lines.push(`💼 Job: ${jobName}`);
    
    // Experience and Level (if JobComponent system is available)
    if (typeof JobComponent !== 'undefined') {
      const antExperienceId = ant.antIndex || ant.id || `ant_${Math.random()}`;
      const experience = JobComponent.getExperience(antExperienceId);
      const level = JobComponent.getLevel(antExperienceId);
      const nextLevelExp = JobComponent.getLevelRequirements(level + 1);
      const expToNext = nextLevelExp - experience;
      
      lines.push(`⭐ Level: ${level}`);
      lines.push(`✨ XP: ${experience}${nextLevelExp > 0 ? ` (${expToNext} to next)` : ' (MAX)'}`);
      
      // Job-specific bonuses at current level
      if (level > 1) {
        const bonuses = JobComponent.getLevelBonus(jobName, level);
        const bonusTexts = [];
        
        if (bonuses.strength > 0) bonusTexts.push(`+${bonuses.strength} STR`);
        if (bonuses.health > 0) bonusTexts.push(`+${bonuses.health} HP`);
        if (bonuses.gatherSpeed > 0) bonusTexts.push(`+${bonuses.gatherSpeed} Gather`);
        if (bonuses.movementSpeed > 0) bonusTexts.push(`+${bonuses.movementSpeed} Speed`);
        
        if (bonusTexts.length > 0) {
          lines.push(`💪 Level ${level} Bonuses: ${bonusTexts.join(', ')} - Gained through specialized training and experience`);
        }
        
        // Special abilities
        if (bonuses.specialAbilities && bonuses.specialAbilities.length > 0) {
          lines.push(`🌟 Special Abilities: ${bonuses.specialAbilities.join(', ')} - Unlocked through mastery of this profession`);
        }
      }
    }
    
    // Base Stats
    let stats = [];
    
    // Health
    const health = ant._health || ant.health || 100;
    const maxHealth = ant._maxHealth || ant.maxHealth || 100;
    stats.push(`❤️ HP: ${health}/${maxHealth}`);
    
    // Movement speed
    const speed = ant._movementSpeed || ant.movementSpeed || ant.speed || 1;
    stats.push(`🏃 Speed: ${speed}`);
    
    // Damage/Strength
    const damage = ant._damage || ant.damage || ant.strength || 10;
    stats.push(`⚔️ Damage: ${damage}`);
    
    if (stats.length > 0) {
      lines.push(`📊 Stats: ${stats.join(', ')}`);
    }
    
    // Current State/Activity
    if (ant._stateMachine && ant._stateMachine.getCurrentState) {
      const state = ant._stateMachine.getCurrentState();
      const stateDescriptions = {
        'COMBAT': 'Actively engaged in battle with enemy forces',
        'GATHERING': 'Collecting resources for the colony',
        'BUILDING': 'Constructing structures and fortifications',
        'PATROL': 'Scouting territory and watching for threats',
        'IDLE': 'Awaiting orders or resting between tasks'
      };
      const description = stateDescriptions[state] || 'Performing assigned duties';
      lines.push(`🎯 Current Activity: ${state} - ${description}`);
    } else if (ant.state) {
      lines.push(`🎯 Current Activity: ${ant.state}`);
    }
    
    // Faction
    const faction = ant._faction || ant.faction || 'neutral';
    const factionDescriptions = {
      'player': 'Allied forces fighting for the colony',
      'enemy': 'Hostile forces threatening the colony',
      'neutral': 'Independent unit with no allegiance'
    };
    const factionDesc = factionDescriptions[faction] || 'Unknown allegiance';
    lines.push(`🏴 Allegiance: ${faction} - ${factionDesc}`);
    
    // Resource information (if carrying resources)
    if (ant._resourceManager && ant._resourceManager.getCurrentLoad) {
      const load = ant._resourceManager.getCurrentLoad();
      if (load > 0) {
        const capacity = ant._resourceManager.getMaxCapacity ? ant._resourceManager.getMaxCapacity() : 'Unknown';
        lines.push(`🎒 Inventory: Carrying ${load}/${capacity} units - Ready to deliver to storage`);
      }
    }
    
    return lines.join('\\n');
  }
  
  /**
   * Wrap text lines to fit within maxWidth
   * @param {Array} lines - Array of text lines
   * @returns {Array} Array of wrapped lines
   */
  wrapText(lines) {
    const wrappedLines = [];
    const maxLineWidth = this.style.maxWidth - this.style.padding * 2;
    
    for (let line of lines) {
      if (textWidth(line) <= maxLineWidth) {
        wrappedLines.push(line);
      } else {
        // Split long lines
        const words = line.split(' ');
        let currentLine = '';
        
        for (let word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          
          if (textWidth(testLine) <= maxLineWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              wrappedLines.push(currentLine);
              currentLine = word;
            } else {
              // Word is too long, break it
              wrappedLines.push(word);
            }
          }
        }
        
        if (currentLine) {
          wrappedLines.push(currentLine);
        }
      }
    }
    
    return wrappedLines;
  }
  
  /**
   * Calculate the maximum width of wrapped lines
   * @param {Array} lines - Array of text lines
   * @returns {number} Maximum line width
   */
  calculateMaxLineWidth(lines) {
    let maxWidth = 0;
    for (let line of lines) {
      const lineWidth = textWidth(line);
      if (lineWidth > maxWidth) maxWidth = lineWidth;
    }
    return maxWidth;
  }
  
  /**
   * Render the tooltip - call this in your main render loop
   */
  render() {
    if (!this.isTooltipVisible || !this.tooltipContent) return;
    
    push();
    
    // Calculate tooltip dimensions with text wrapping
    const originalLines = this.tooltipContent.split('\\n');
    textSize(this.style.fontSize);
    
    // Wrap text and calculate dimensions
    const wrappedLines = this.wrapText(originalLines);
    const tooltipWidth = Math.min(this.style.maxWidth, this.calculateMaxLineWidth(wrappedLines) + this.style.padding * 2);
    const tooltipHeight = wrappedLines.length * this.style.lineHeight + this.style.padding * 2;
    
    // Adjust position to keep tooltip on screen
    let x = this.tooltipPosition.x;
    let y = this.tooltipPosition.y;
    
    if (x + tooltipWidth > width) {
      x = width - tooltipWidth - 10;
    }
    if (y - tooltipHeight < 0) {
      y = this.tooltipPosition.y + 30; // Show below mouse instead
    }
    
    // Draw tooltip background
    fill(...this.style.backgroundColor);
    stroke(...this.style.borderColor);
    strokeWeight(1);
    rect(x, y - tooltipHeight, tooltipWidth, tooltipHeight, this.style.borderRadius);
    
    // Draw tooltip text
    fill(...this.style.textColor);
    textAlign(LEFT, TOP);
    textSize(this.style.fontSize);
    
    for (let i = 0; i < wrappedLines.length; i++) {
      const line = wrappedLines[i];
      const lineY = y - tooltipHeight + this.style.padding + i * this.style.lineHeight;
      
      // Color coding for different types of information
      if (line.includes('🐜') || line.includes('💼')) {
        fill(...this.style.headerColor);
      } else if (line.includes('⭐') || line.includes('✨')) {
        fill(...this.style.xpColor);
      } else if (line.includes('📊') || line.includes('💪')) {
        fill(...this.style.statColor);
      } else {
        fill(...this.style.textColor);
      }
      
      text(line, x + this.style.padding, lineY);
    }
    
    pop();
  }
  
  /**
   * Check if tooltip is currently visible
   * @returns {boolean} True if tooltip is showing
   */
  isVisible() {
    return this.isTooltipVisible;
  }
  
  /**
   * Force hide the tooltip
   */
  hide() {
    this.isTooltipVisible = false;
    this.hoveredAnt = null;
  }
  
  /**
   * Update tooltip delay (in milliseconds)
   * @param {number} delay - New delay in milliseconds
   */
  setDelay(delay) {
    this.tooltipDelay = Math.max(0, delay);
  }
}

// Create global instance
let antTooltipSystem = null;

/**
 * Initialize the ant tooltip system - call this in your setup function
 */
function initializeAntTooltipSystem() {
  antTooltipSystem = new AntTooltipSystem();
  console.log('🐜 Ant Tooltip System initialized');
}

/**
 * Update ant tooltips - call this in your main update/draw loop
 */
function updateAntTooltips() {
  if (antTooltipSystem && typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
    antTooltipSystem.update(mouseX, mouseY);
  }
}

/**
 * Render ant tooltips - call this in your main render/draw loop
 */
function renderAntTooltips() {
  if (antTooltipSystem) {
    antTooltipSystem.render();
  }
}

// Make system available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AntTooltipSystem, initializeAntTooltipSystem, updateAntTooltips, renderAntTooltips };
}