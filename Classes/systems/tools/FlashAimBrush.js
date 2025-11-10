/**
 * Final Flash Aim Brush
 * Allows the player to aim a final flash strike within a limited radius from the queen.
 */
class FlashAimBrush extends BrushBase {
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
  }

  toggle() {
    this.isActive = !this.isActive;
    logNormal(`${this.isActive ? '🔵' : '⚪'} Final Flash Aim Brush ${this.isActive ? 'activated' : 'deactivated'}`);
    return this.isActive;
  }

  activate() { this.isActive = true; }
  deactivate() { this.isActive = false; }

  update() {
    if (!this.isActive) return;
    super.update();
    this.cursor.x = (typeof mouseX !== 'undefined') ? mouseX : this.cursor.x;
    this.cursor.y = (typeof mouseY !== 'undefined') ? mouseY : this.cursor.y;
    this.pulse += this.pulseSpeed;
    if (this.pulse > Math.PI * 2) this.pulse = 0;
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

    push();
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

    // Instruction text
    noStroke();
    fill(255);
    textAlign(CENTER, TOP);
    textSize(11);
    text(valid ? 'Left click to strike' : `Out of range (${this.tileRange} tiles)`, this.cursor.x, this.cursor.y + size + 6);
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
      console.warn('⚠️ No queen found - cannot aim final flash');
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

    // Request final flash at the world position
    if (typeof g_flashManager !== 'undefined' && g_flashManager && typeof g_flashManager.requestStrike === 'function') {
      const executed = g_flashManager.requestStrike({ x: worldX, y: worldY });
      if (executed) {
        this.lastSpawnTime = now;
        return true;
      }
      return false;
    }

    return false;
  }
}

function initializeFlashAimBrush() {
  if (!window.g_flashAimBrush) {
    window.g_flashAimBrush = new FlashAimBrush();
  }
  return window.g_flashAimBrush;
}

if (typeof window !== 'undefined') {
  window.initializeFlashAimBrush = initializeFlashAimBrush;
}