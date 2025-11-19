/**
 * AntView
 * ========
 * Presentation layer for ant entities.
 * Extends EntityView with ant-specific rendering.
 * 
 * RESPONSIBILITIES:
 * - Render ant sprites (job-specific)
 * - Health bar rendering (above ant, color-coded)
 * - Resource indicator (count/capacity)
 * - Highlight effects (selected, hover, boxHover, combat)
 * - State-based visual effects (moving, gathering, attacking)
 * - Species label (job name below ant)
 * 
 * STRICT RULES:
 * - Read from AntModel ONLY (NEVER modify state)
 * - NO update() methods
 * - NO state changes
 * - NO system calls
 */

class AntView extends EntityView {
  /**
   * Create an ant view
   * @param {AntModel} model - The ant data model to visualize
   */
  constructor(model) {
    super(model);
  }

  // ===== MAIN RENDERING =====
  /**
   * Render the ant
   * Main entry point for drawing the ant to the canvas
   */
  render() {
    // Call parent render (handles sprite, opacity, inactive/invisible checks)
    super.render();

    // Ant-specific rendering
    this.renderHealthBar();
    this.renderResourceIndicator();
    this.renderHighlights();
    this.renderStateEffects();
    this.renderSpeciesLabel();
  }

  // ===== HEALTH BAR RENDERING =====
  /**
   * Render health bar above ant
   * Color-coded: green (healthy) → yellow (moderate) → red (critical)
   * Optimization: Don't render at 100% health
   */
  renderHealthBar() {
    const health = this.model.getHealth();
    const maxHealth = this.model.getMaxHealth();
    
    // Optimization: Don't render full health bar
    if (health >= maxHealth) {
      return;
    }

    const healthPercent = maxHealth > 0 ? health / maxHealth : 0;
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    // Health bar dimensions
    const barWidth = size.x;
    const barHeight = 4;
    const barX = pos.x - barWidth / 2;
    const barY = pos.y - size.y / 2 - 8; // 8px above ant

    push();
    
    // Background (dark gray)
    fill(50);
    noStroke();
    rect(barX, barY, barWidth, barHeight);
    
    // Foreground (health - color-coded)
    const healthWidth = barWidth * healthPercent;
    
    // Color based on health percentage
    if (healthPercent > 0.6) {
      fill(0, 255, 0); // Green (healthy)
    } else if (healthPercent > 0.3) {
      fill(255, 255, 0); // Yellow (moderate)
    } else {
      fill(255, 0, 0); // Red (critical)
    }
    
    rect(barX, barY, healthWidth, barHeight);
    
    pop();
  }

  // ===== RESOURCE INDICATOR RENDERING =====
  /**
   * Render resource count indicator
   * Shows: "3/5" (3 resources carried, 5 capacity)
   * Optimization: Don't render if no resources
   */
  renderResourceIndicator() {
    const resourceCount = this.model.getResourceCount();
    
    // Optimization: Don't render empty indicator
    if (resourceCount <= 0) {
      return;
    }

    const capacity = this.model.getCapacity();
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    // Position: top-right of ant
    const textX = pos.x + size.x / 2 + 5;
    const textY = pos.y - size.y / 2;

    push();
    
    // Text style
    fill(255, 255, 0); // Yellow
    stroke(0);
    strokeWeight(2);
    textAlign(LEFT, CENTER);
    textSize(10);
    
    // Draw text
    text(`${resourceCount}/${capacity}`, textX, textY);
    
    pop();
  }

  // ===== HIGHLIGHT EFFECTS =====
  /**
   * Render highlight based on ant state
   * Priority: selected > boxHover > hover
   */
  renderHighlights() {
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    push();
    noFill();
    strokeWeight(2);
    
    // Priority: selected > boxHover
    if (this.model.getSelected && this.model.getSelected()) {
      // Selected: Blue outline
      stroke(0, 100, 255);
      rect(pos.x - size.x / 2, pos.y - size.y / 2, size.x, size.y);
    } else if (this.model.getIsBoxHovered && this.model.getIsBoxHovered()) {
      // Box hovered: Green outline
      stroke(0, 255, 0);
      rect(pos.x - size.x / 2, pos.y - size.y / 2, size.x, size.y);
    }
    
    pop();
  }

  /**
   * Render combat-specific highlight
   * Red flashing outline when in combat
   */
  renderCombatHighlight() {
    const combatModifier = this.model.getCombatModifier();
    
    if (combatModifier === 'IN_COMBAT' || combatModifier === 'ATTACKING') {
      const pos = this.model.getPosition();
      const size = this.model.getSize();
      
      push();
      noFill();
      stroke(255, 0, 0); // Red
      strokeWeight(2);
      rect(pos.x - size.x / 2, pos.y - size.y / 2, size.x, size.y);
      pop();
    }
  }

  // ===== STATE-BASED VISUAL EFFECTS =====
  /**
   * Render visual effects based on ant state
   * - MOVING: Line to destination
   * - GATHERING: Circle indicator
   * - ATTACKING: Combat flash
   */
  renderStateEffects() {
    const primaryState = this.model.getPrimaryState();
    const combatModifier = this.model.getCombatModifier();
    
    // Movement line
    if (primaryState === 'MOVING') {
      this._renderMovementLine();
    }
    
    // Gathering indicator
    if (primaryState === 'GATHERING') {
      this._renderGatheringIndicator();
    }
    
    // Combat flash
    if (combatModifier === 'ATTACKING') {
      this._renderCombatFlash();
    }
  }

  /**
   * Render line to movement destination
   * @private
   */
  _renderMovementLine() {
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    // Note: We don't have access to destination in pure view
    // This would need to be passed from controller if needed
    // For now, just render a simple indicator
    
    push();
    stroke(255);
    strokeWeight(2);
    // Draw movement indicator (small line below ant)
    const centerX = pos.x;
    const centerY = pos.y;
    line(centerX - 5, centerY + size.y / 2 + 2, centerX + 5, centerY + size.y / 2 + 2);
    pop();
  }

  /**
   * Render gathering radius indicator
   * @private
   */
  _renderGatheringIndicator() {
    const pos = this.model.getPosition();
    
    push();
    noFill();
    stroke(100, 255, 100, 100); // Light green, semi-transparent
    strokeWeight(1);
    ellipse(pos.x, pos.y, 224, 224); // 7-tile radius = 224px
    pop();
  }

  /**
   * Render combat attack flash
   * @private
   */
  _renderCombatFlash() {
    const pos = this.model.getPosition();
    const size = this.model.getSize();
    
    push();
    // Red tint/flash effect
    tint(255, 100, 100);
    fill(255, 0, 0, 50);
    rect(pos.x - size.x / 2, pos.y - size.y / 2, size.x, size.y);
    pop();
  }

  // ===== SPECIES LABEL RENDERING =====
  /**
   * Render job name and faction below ant
   * Job name on first line, faction on second line
   * Faction color: white (player) or red (enemy)
   */
  renderSpeciesLabel() {
    const jobName = this.model.getJobName();
    const faction = this.model.getFaction();
    
    // Handle missing job name
    if (!jobName) {
      return;
    }

    const screenPos = this._getScreenPosition();
    const size = this.model.getSize();
    
    // Position: below ant (in screen coordinates)
    const labelX = screenPos.x;
    const jobLabelY = screenPos.y + size.y / 2 + 12;
    const factionLabelY = jobLabelY + 14; // 14px below job name

    push();
    
    // Job name text style
    fill(255);
    stroke(0);
    strokeWeight(3);
    textAlign(CENTER, TOP);
    textSize(11);
    
    // Draw job name
    text(jobName, labelX, jobLabelY);
    
    // Draw faction if available
    if (faction) {
      // Set faction color: white for player, red for enemy
      if (faction.toLowerCase() === 'player') {
        fill(255); // White
      } else {
        fill(255, 0, 0); // Red
      }
      
      textSize(10);
      text(faction, labelX, factionLabelY);
    }
    
    pop();
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntView;
}
