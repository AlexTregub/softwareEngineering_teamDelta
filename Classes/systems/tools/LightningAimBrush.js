/**
 * Lightning Aim Brush
 * Allows the player to aim a lightning strike within a limited radius from the queen.
 */
class LightningAimBrush extends BrushBase {
  constructor() {
    super();
    this.cursor = { x: 0, y: 0 };
    this.showingInvalid = false;
    this.tileRange = 7; // tiles from queen
    this.tileSize = (typeof g_tileInteractionManager !== 'undefined' && g_tileInteractionManager.tileSize) ? g_tileInteractionManager.tileSize : 32;
    this.rangePx = this.tileRange*TILE_SIZE;
    this.brushSize = 16; // visual size of cursor
    this.spawnCooldown = 200; // ms between allowed strikes while holding
    this.lastSpawnTime = 0;
    this.isMousePressed = false;
    this.pulse = 0;
    this.pulseSpeed = 0.06;
    
    // Darkening effect
    this.activationTime = 0;
    this.darkenProgress = 0; // 0.0 to 1.0 over 1 second
    
    // Particle emitters for swirling rain effect
    this.queenEmitter = null;
    this.cursorEmitter = null;
    if (typeof ParticleEmitter !== 'undefined') {
      this.queenEmitter = new ParticleEmitter({
        preset: 'lightningSwirl',
        x: 0,
        y: 0
      });
      
      this.cursorEmitter = new ParticleEmitter({
        preset: 'lightningCursorSwirl',
        x: 0,
        y: 0
      });
    }
  }

  toggle() {
    this.isActive = !this.isActive;
    
    // Sync range with lightning manager level when activating
    if (this.isActive && typeof window.g_lightningManager !== 'undefined' && window.g_lightningManager) {
      const level = window.g_lightningManager.getLevel();
      this.updateRangeForLevel(level);
    }
    
    // Start/stop particle emitters and darkening effect
    if (this.isActive) {
      this.activationTime = millis();
      this.darkenProgress = 0;
      if (this.queenEmitter) this.queenEmitter.start();
      if (this.cursorEmitter) this.cursorEmitter.start();
    } else {
      this.darkenProgress = 0;
      if (this.queenEmitter) this.queenEmitter.stop();
      if (this.cursorEmitter) this.cursorEmitter.stop();
    }
    
    logNormal(`${this.isActive ? '🔵' : '⚪'} Lightning Aim Brush ${this.isActive ? 'activated' : 'deactivated'}`);
    return this.isActive;
  }

  activate() { 
    this.isActive = true;
    if (this.queenEmitter) this.queenEmitter.start();
    if (this.cursorEmitter) this.cursorEmitter.start();
  }
  
  deactivate() { 
    this.isActive = false;
    if (this.queenEmitter) this.queenEmitter.stop();
    if (this.cursorEmitter) this.cursorEmitter.stop();
  }
  
  /**
   * Update range based on lightning power level
   * Base: 7 tiles, +7 tiles per level
   */
  updateRangeForLevel(level) {
    this.tileRange = 7 + ((level - 1) * 7); // Level 1: 7 tiles, Level 2: 14 tiles, Level 3: 21 tiles
    this.rangePx = this.tileRange * TILE_SIZE;
    logNormal(`⚡ Lightning range updated to ${this.tileRange} tiles (Level ${level})`);
  }

  update() {
    if (!this.isActive) return;
    super.update();
    this.cursor.x = (typeof mouseX !== 'undefined') ? mouseX : this.cursor.x;
    this.cursor.y = (typeof mouseY !== 'undefined') ? mouseY : this.cursor.y;
    this.pulse += this.pulseSpeed;
    if (this.pulse > Math.PI * 2) this.pulse = 0;
    
    // Update darkening progress (fade in over 1 second)
    const timeSinceActivation = millis() - this.activationTime;
    this.darkenProgress = Math.min(1.0, timeSinceActivation / 1000);
    
    // Update particle emitter positions
    const queen = typeof getQueen === 'function' ? getQueen() : null;
    if (queen && this.queenEmitter) {
      let queenScreenX = 0;
      let queenScreenY = 0;
      
      if (typeof queen.getScreenPosition === 'function') {
        const screenPos = queen.getPosition();
        queenScreenX = screenPos.x;
        queenScreenY = screenPos.y;
      } else {
        queenScreenX = queen.x || 0;
        queenScreenY = queen.y || 0;
      }
      
      this.queenEmitter.setPosition(queenScreenX, queenScreenY);
      this.queenEmitter.update();
    }
    
    if (this.cursorEmitter) {
      this.cursorEmitter.setPosition(this.cursor.x, this.cursor.y);
      this.cursorEmitter.update();
    }
    
    // If mouse held, attempt repeated strikes (respect cooldown)
    if (this.isMousePressed) {
      this.tryStrikeAt(this.cursor.x, this.cursor.y);
    }
  }

  render() {
    if (!this.isActive) return;
    const queen = typeof getQueen === 'function' ? getQueen() : null;
    
    // Get queen's screen position (uses sprite coordinate transformation)
    let queenScreenX = 0;
    let queenScreenY = 0;
    
    if (queen) {
      if (typeof queen.getScreenPosition === 'function') {
        // Use Entity's getScreenPosition for proper coordinate conversion
        const screenPos = queen.getScreenPosition();
        queenScreenX = screenPos.x;
        queenScreenY = screenPos.y;
      } else {
        // Fallback for non-Entity objects
        queenScreenX = queen.x || 0;
        queenScreenY = queen.y || 0;
      }
    }

    // Render particle emitters FIRST (behind UI elements)
    if (this.queenEmitter) {
      this.queenEmitter.render();
    }
    if (this.cursorEmitter) {
      this.cursorEmitter.render();
    }

    push();
    
    // Screen darkening effect (subtle blue tint) - fades in over 1 second
    const darkenAlpha = this.darkenProgress * 150; // 0 to 150 over 1 second (darker than before)
    fill(0, 10, 30, darkenAlpha); // Dark blue-black with gradual transparency
    noStroke();
    rect(0, 0, width, height);
    
    // Pulsating blue light around queen
    if (queen) {
      const pulseIntensity = 0.5 + Math.sin(this.pulse * 2) * 0.3; // 0.2 to 0.8 pulse
      const queenGlowRadius = 100 + (pulseIntensity * 60);
      
      const queenGradient = drawingContext.createRadialGradient(
        queenScreenX, queenScreenY, 0,
        queenScreenX, queenScreenY, queenGlowRadius
      );
      queenGradient.addColorStop(0, `rgba(100, 150, 255, ${pulseIntensity * 0.5})`);
      queenGradient.addColorStop(0.4, `rgba(80, 120, 255, ${pulseIntensity * 0.3})`);
      queenGradient.addColorStop(1, 'rgba(50, 100, 255, 0)');
      
      drawingContext.fillStyle = queenGradient;
      drawingContext.fillRect(0, 0, width, height);
    }
    
    // Pulsating blue light around cursor
    const cursorPulseIntensity = 0.4 + Math.sin(this.pulse * 2.5) * 0.3; // Slightly different pulse rate
    const cursorGlowRadius = 70 + (cursorPulseIntensity * 50);
    
    const cursorGradient = drawingContext.createRadialGradient(
      this.cursor.x, this.cursor.y, 0,
      this.cursor.x, this.cursor.y, cursorGlowRadius
    );
    cursorGradient.addColorStop(0, `rgba(150, 200, 255, ${cursorPulseIntensity * 0.6})`);
    cursorGradient.addColorStop(0.4, `rgba(100, 150, 255, ${cursorPulseIntensity * 0.3})`);
    cursorGradient.addColorStop(1, 'rgba(50, 100, 255, 0)');
    
    drawingContext.fillStyle = cursorGradient;
    drawingContext.fillRect(0, 0, width, height);
    
    // Range circle around queen (in screen coordinates)
    if (queen) {
      noFill();
      stroke(100, 0, 255, 140);
      strokeWeight(2);
      ellipse(queenScreenX, queenScreenY, this.rangePx * 2, this.rangePx * 2);
    }

    // Crosshair and validity (cursor is already in screen coordinates from mouseX/mouseY)
    const dx = (this.cursor.x - queenScreenX);
    const dy = (this.cursor.y - queenScreenY);
    const dist = Math.hypot(dx, dy);
    const valid = dist <= this.rangePx;

    // Cursor indicator
    noFill();
    stroke(valid ? 0 : 200, valid ? 255 : 70, 0, 200);
    strokeWeight(2);
    const size = 12 + Math.sin(this.pulse) * 3;
    ellipse(this.cursor.x, this.cursor.y, size * 2, size * 2);
    // inner lines
    strokeWeight(1);
    line(this.cursor.x - size, this.cursor.y, this.cursor.x + size, this.cursor.y);
    line(this.cursor.x, this.cursor.y - size, this.cursor.x, this.cursor.y + size);
    line(this.cursor.x, this.cursor.y - size, this.cursor.x, this.cursor.y + size);
    pop();
  }

  /**
   * Handle mouse press while brush active
   */
  onMousePressed(mx, my, button = 'LEFT') {
    if (!this.isActive) return false;

    const buttonName = button;
    if (buttonName === 'RIGHT') {
      this.isMousePressed = false;
      this.deactivate();
      return true;
    }

    if (buttonName !== 'LEFT') return false;

    // Start hold behavior
    this.isMousePressed = true;
    this.tryStrikeAt(mx, my);
    return true;
  }

  onMouseReleased(mx, my, button = 'LEFT') {
    if (!this.isActive) return false;
    if (button === 'LEFT') {
      this.isMousePressed = false;
      return true;
    }
    return false;
  }

  tryStrikeAt(mx, my) {
    const now = Date.now();
    if (now - this.lastSpawnTime < this.spawnCooldown) return false;

    const queen = typeof getQueen === 'function' ? getQueen() : null;
    if (!queen) {
      console.warn('⚠️ No queen found - cannot aim lightning');
      return false;
    }
    
    // Get queen's screen position for range check
    let queenScreenX = 0;
    let queenScreenY = 0;
    
    if (typeof queen.getScreenPosition === 'function') {
      const screenPos = queen.getScreenPosition();
      queenScreenX = screenPos.x;
      queenScreenY = screenPos.y;
    } else {
      queenScreenX = queen.x || 0;
      queenScreenY = queen.y || 0;
    }

    // Check range using screen coordinates (mouse is in screen coords)
    const dx = mx - queenScreenX;
    const dy = my - queenScreenY;
    const dist = Math.hypot(dx, dy);
    if (dist > this.rangePx) {
      // Out of range
      this.lastSpawnTime = now; // still consume spawn tick to prevent spam of logs
      return false;
    }

    // Convert screen coordinates to world coordinates for the actual strike
    let worldX = mx;
    let worldY = my;
    
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      // Convert screen position back to tile coordinates
      const tilePos = g_activeMap.renderConversion.convCanvasToPos([mx, my]);
      // Convert tile coordinates to world pixels (subtract 0.5 to reverse the centering)
      worldX = (tilePos[0] - 0.5) * TILE_SIZE;
      worldY = (tilePos[1] - 0.5) * TILE_SIZE;
    }

    // Request lightning at the world position
    if (typeof g_lightningManager !== 'undefined' && g_lightningManager && typeof g_lightningManager.requestStrike === 'function') {
      const executed = g_lightningManager.requestStrike({ x: worldX, y: worldY });
      if (executed) {
        this.lastSpawnTime = now;
        return true;
      }
      return false;
    }

    return false;
  }
}

function initializeLightningAimBrush() {
  if (!window.g_lightningAimBrush) {
    window.g_lightningAimBrush = new LightningAimBrush();
  }
  return window.g_lightningAimBrush;
}

if (typeof window !== 'undefined') {
  window.initializeLightningAimBrush = initializeLightningAimBrush;
}
