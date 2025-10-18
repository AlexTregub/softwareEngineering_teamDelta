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
    this.rangePx = this.tileRange * this.tileSize;
    this.brushSize = 16; // visual size of cursor
    this.spawnCooldown = 200; // ms between allowed strikes while holding
    this.lastSpawnTime = 0;
    this.isMousePressed = false;
    this.pulse = 0;
    this.pulseSpeed = 0.06;
  }

  toggle() {
    this.isActive = !this.isActive;
    console.log(`${this.isActive ? '🔵' : '⚪'} Lightning Aim Brush ${this.isActive ? 'activated' : 'deactivated'}`);
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
    const queenPos = queen && typeof queen.getPosition === 'function' ? queen.getPosition() : (queen ? { x: queen.x || 0, y: queen.y || 0 } : null);

    push();
    // Range circle around queen
    if (queenPos) {
      noFill();
      stroke(100, 180, 255, 140);
      strokeWeight(2);
      ellipse(queenPos.x, queenPos.y, this.rangePx * 2, this.rangePx * 2);
    }

    // Crosshair and validity
    const dx = queenPos ? (this.cursor.x - queenPos.x) : 0;
    const dy = queenPos ? (this.cursor.y - queenPos.y) : 0;
    const dist = queenPos ? Math.hypot(dx, dy) : Infinity;
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
    const queenPos = queen && typeof queen.getPosition === 'function' ? queen.getPosition() : (queen ? { x: queen.x || 0, y: queen.y || 0 } : null);
    if (!queenPos) {
      console.warn('⚠️ No queen found - cannot aim lightning');
      return false;
    }

    const dx = mx - queenPos.x;
    const dy = my - queenPos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.rangePx) {
      // Out of range
      // brief visual feedback could be added
      this.lastSpawnTime = now; // still consume spawn tick to prevent spam of logs
      return false;
    }

    // Request lightning at the position
    if (typeof g_lightningManager !== 'undefined' && g_lightningManager && typeof g_lightningManager.requestStrike === 'function') {
      const executed = g_lightningManager.requestStrike({ x: mx, y: my });
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
