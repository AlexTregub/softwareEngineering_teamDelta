/**
 * Fireball Aim Brush
 * Charge-and-release fireball that must be fully charged before firing.
 */
class FireballAimBrush extends BrushBase {
  constructor() {
    super();
    this.cursor = { x: 0, y: 0 };
    this.tileRange = 7; // tiles from queen
    this.rangePx = this.tileRange * TILE_SIZE;
    this.pulse = 0;
    this.pulseSpeed = 0.06;
    
    // Charging mechanics
    this.isCharging = false;
    this.chargeStartTime = 0;
    this.chargeTime = 1000; // 1 second to fully charge
    this.chargeProgress = 0; // 0.0 to 1.0
    
    // Particle emitter for fire/smoke effects
    this.particleEmitter = null;
    if (typeof ParticleEmitter !== 'undefined') {
      this.particleEmitter = new ParticleEmitter({
        x: 0,
        y: 0,
        emissionRate: 120,
        maxParticles: 240,
        spawnRadius: 30,
        lifetime: 900,
        types: ['fire', 'smoke', 'spark'],
        sizeRange: [2, 14],
        speedRange: [0.9, 4.0], // Adjusted for dt normalization
        gravity: -0.12, // Adjusted for dt normalization
        drift: 0.6, // Adjusted for dt normalization
        turbulence: 0.06 // Adjusted for dt normalization
      });
    }
  }

  toggle() {
    this.isActive = !this.isActive;
    // Reset charge state when toggling off
    if (!this.isActive) {
      this.isCharging = false;
      this.chargeProgress = 0;
    }
    logNormal(`${this.isActive ? '🔥' : '⚪'} Fireball Aim Brush ${this.isActive ? 'activated' : 'deactivated'}`);
    return this.isActive;
  }

  activate() { 
    this.isActive = true;
  }
  
  deactivate() { 
    this.isActive = false;
    this.isCharging = false;
    this.chargeProgress = 0;
  }
  
  /**
   * Update range based on power level (like lightning)
   */
  updateRangeForLevel(level) {
    this.tileRange = 7 + ((level - 1) * 7);
    this.rangePx = this.tileRange * TILE_SIZE;
    logNormal(`🔥 Fireball range updated to ${this.tileRange} tiles (Level ${level})`);
  }

  update() {
    if (!this.isActive) return;
    super.update();
    
    this.cursor.x = (typeof mouseX !== 'undefined') ? mouseX : this.cursor.x;
    this.cursor.y = (typeof mouseY !== 'undefined') ? mouseY : this.cursor.y;
    
    // Framerate-independent pulse animation
    const dt = (deltaTime || 16) / 16; // Normalize to 60fps
    this.pulse += this.pulseSpeed * dt;
    if (this.pulse > Math.PI * 2) this.pulse = 0;
    
    // Update charge progress if charging
    if (this.isCharging) {
      const elapsed = millis() - this.chargeStartTime;
      this.chargeProgress = Math.min(1.0, elapsed / this.chargeTime);
      
      // Update particle emitter position and state
      if (this.particleEmitter) {
        this.particleEmitter.setPosition(this.cursor.x, this.cursor.y);
        if (this.chargeProgress >= 1.0 && !this.particleEmitter.isActive()) {
          this.particleEmitter.start();
        } else if (this.chargeProgress < 1.0 && this.particleEmitter.isActive()) {
          this.particleEmitter.stop();
        }
      }
    } else if (this.particleEmitter && this.particleEmitter.isActive()) {
      this.particleEmitter.stop();
    }
    
    // Update particles
    if (this.particleEmitter) {
      this.particleEmitter.update();
    }
  }

  render() {
    if (!this.isActive) return;
    const queen = typeof getQueen === 'function' ? getQueen() : null;
    
    let queenScreenX = 0;
    let queenScreenY = 0;
    
    if (queen) {
      if (typeof queen.getScreenPosition === 'function') {
        const screenPos = queen.getScreenPosition();
        queenScreenX = screenPos.x;
        queenScreenY = screenPos.y;
      } else {
        queenScreenX = queen.x || 0;
        queenScreenY = queen.y || 0;
      }
    }

    push();
    
    // Range circle around queen
    if (queen) {
      noFill();
      stroke(255, 100, 0, 140); // Orange for fireball
      strokeWeight(2);
      ellipse(queenScreenX, queenScreenY, this.rangePx * 2, this.rangePx * 2);
    }

    // Check if target is in range
    const dx = (this.cursor.x - queenScreenX);
    const dy = (this.cursor.y - queenScreenY);
    const dist = Math.hypot(dx, dy);
    const valid = dist <= this.rangePx;

    // Charging visual indicator at cursor
    if (this.isCharging) {
      // Charging ring that fills up
      const chargeSize = 30 + (this.chargeProgress * 20);
      
      // Background circle
      noFill();
      stroke(50, 50, 50, 200);
      strokeWeight(6);
      ellipse(this.cursor.x, this.cursor.y, chargeSize * 2);
      
      // Charge progress arc
      noFill();
      const chargeColor = this.chargeProgress >= 1.0 ? [255, 200, 0] : [255, 100, 0];
      stroke(chargeColor[0], chargeColor[1], chargeColor[2], 255);
      strokeWeight(5);
      
      // Draw arc from top, clockwise
      const startAngle = -HALF_PI;
      const endAngle = startAngle + (this.chargeProgress * TWO_PI);
      arc(this.cursor.x, this.cursor.y, chargeSize * 2, chargeSize * 2, startAngle, endAngle);
      
      // Fully charged indicator
      if (this.chargeProgress >= 1.0) {
        // Pulsing glow when ready
        fill(255, 200, 0, 100 + Math.sin(this.pulse * 3) * 100);
        noStroke();
        ellipse(this.cursor.x, this.cursor.y, chargeSize * 1.5);
        
        // Render particle emitter (fire and smoke)
        if (this.particleEmitter) {
          this.particleEmitter.render();
        }
      }
      
      // Inner fireball growing
      fill(255, Math.floor(100 + this.chargeProgress * 155), 0, 200);
      noStroke();
      ellipse(this.cursor.x, this.cursor.y, chargeSize * this.chargeProgress * 1.2);
    } else {
      // Normal cursor when not charging
      noFill();
      stroke(valid ? [255, 150, 0] : [200, 70, 70], 200);
      strokeWeight(2);
      const size = 12 + Math.sin(this.pulse) * 3;
      ellipse(this.cursor.x, this.cursor.y, size * 2, size * 2);
      
      // Crosshair
      strokeWeight(1);
      line(this.cursor.x - size, this.cursor.y, this.cursor.x + size, this.cursor.y);
      line(this.cursor.x, this.cursor.y - size, this.cursor.x, this.cursor.y + size);
    }

    // Instruction text
    noStroke();
    fill(255);
    textAlign(CENTER, TOP);
    textSize(11);
    
    let instructionText;
    if (!valid) {
      instructionText = `Out of range (${this.tileRange} tiles)`;
    } else if (this.isCharging) {
      if (this.chargeProgress >= 1.0) {
        instructionText = 'Release to fire!';
      } else {
        instructionText = `Charging... ${Math.floor(this.chargeProgress * 100)}%`;
      }
    } else {
      instructionText = 'Hold to charge fireball';
    }
    
    text(instructionText, this.cursor.x, this.cursor.y + 50);
    pop();
  }

  /**
   * Handle mouse press - start charging
   */
  onMousePressed(mx, my, button = 'LEFT') {
    if (!this.isActive) return false;

    if (button === 'RIGHT') {
      this.isCharging = false;
      this.chargeProgress = 0;
      this.deactivate();
      return true;
    }

    if (button !== 'LEFT') return false;

    // Start charging
    if (!this.isCharging) {
      this.isCharging = true;
      this.chargeStartTime = millis();
      this.chargeProgress = 0;
      logNormal('🔥 Charging fireball...');
    }
    
    return true;
  }

  /**
   * Handle mouse release - fire if fully charged
   */
  onMouseReleased(mx, my, button = 'LEFT') {
    if (!this.isActive) return false;
    if (button !== 'LEFT') return false;

    // Only fire if fully charged
    if (this.isCharging && this.chargeProgress >= 1.0) {
      this.tryStrikeAt(mx, my);
    } else if (this.isCharging) {
      logNormal('🔥 Fireball not fully charged - release failed');
    }
    
    // Reset charge state
    this.isCharging = false;
    this.chargeProgress = 0;
    
    // Stop and clear particles
    if (this.particleEmitter) {
      this.particleEmitter.stop();
      this.particleEmitter.clear();
    }
    
    return true;
  }

  tryStrikeAt(mx, my) {
    const queen = typeof getQueen === 'function' ? getQueen() : null;
    if (!queen) {
      console.warn('⚠️ No queen found - cannot aim fireball');
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

    // Check range
    const dx = mx - queenScreenX;
    const dy = my - queenScreenY;
    const dist = Math.hypot(dx, dy);
    if (dist > this.rangePx) {
      console.warn('⚠️ Fireball target out of range');
      return false;
    }

    // Convert screen coordinates to world coordinates
    let worldX = mx;
    let worldY = my;
    
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      const tilePos = g_activeMap.renderConversion.convCanvasToPos([mx, my]);
      worldX = (tilePos[0] - 0.5) * TILE_SIZE;
      worldY = (tilePos[1] - 0.5) * TILE_SIZE;
    }

    logNormal(`🔥 Fireball launched at (${worldX.toFixed(1)}, ${worldY.toFixed(1)})!`);
    console.log('🔥 FIREBALL STRIKE!', { worldX, worldY, screenX: mx, screenY: my });
    
    // Damage nearby entities (area of effect)
    const damage = 150; // 3x lightning damage
    const blastRadius = TILE_SIZE * 3; // 3 tile radius
    let entitiesHit = 0;
    
    const playerQueen = (typeof getQueen === 'function') ? getQueen() : null;
    
    // Damage ants
    if (typeof ants !== 'undefined' && Array.isArray(ants)) {
      for (const ant of ants) {
        if (!ant || !ant._isActive) continue;
        
        // Skip player queen (no friendly fire)
        const isPlayerQueen = (ant === playerQueen || ant.jobName === 'Queen' || ant.job === 'Queen');
        if (isPlayerQueen) continue;
        
        // Get ant position
        const antPos = (typeof ant.getPosition === 'function') ? ant.getPosition() : { x: ant.x || 0, y: ant.y || 0 };
        
        // Check if ant is in blast radius
        const dx = antPos.x - worldX;
        const dy = antPos.y - worldY;
        const dist = Math.hypot(dx, dy);
        
        if (dist <= blastRadius && typeof ant.takeDamage === 'function') {
          ant.takeDamage(damage);
          entitiesHit++;
          logNormal(`🔥 Fireball hit ant for ${damage} damage (${dist.toFixed(1)}px away)`);
        }
      }
    }
    
    // Damage buildings
    if (typeof Buildings !== 'undefined' && Array.isArray(Buildings)) {
      for (const building of Buildings) {
        if (!building || !building._isActive) continue;
        
        // Skip player buildings (no friendly fire)
        if (building._faction === 'player') continue;
        
        // Get building position
        const buildingPos = (typeof building.getPosition === 'function') ? building.getPosition() : { x: building.x || 0, y: building.y || 0 };
        
        // Check if building is in blast radius
        const dx = buildingPos.x - worldX;
        const dy = buildingPos.y - worldY;
        const dist = Math.hypot(dx, dy);
        
        if (dist <= blastRadius && typeof building.takeDamage === 'function') {
          building.takeDamage(damage);
          entitiesHit++;
          logNormal(`🔥 Fireball hit building for ${damage} damage (${dist.toFixed(1)}px away)`);
        }
      }
    }
    
    if (entitiesHit > 0) {
      logNormal(`🔥 Fireball hit ${entitiesHit} entity(s)!`);
    } else {
      logNormal('🔥 Fireball missed - no entities in blast radius');
    }
    
    // Visual effects
    if (typeof window.EffectsRenderer !== 'undefined' && window.EffectsRenderer) {
      window.EffectsRenderer.flash(worldX, worldY, { color: [255, 150, 0], intensity: 0.8, radius: 64 });
      if (typeof window.EffectsRenderer.spawnParticleBurst === 'function') {
        window.EffectsRenderer.spawnParticleBurst(worldX, worldY, { 
          count: 20, 
          color: [255, 100, 0], 
          size: 8,
          speed: 3
        });
      }
    }
    
    return true;
  }
}

function initializeFireballAimBrush() {
  if (!window.g_fireballAimBrush) {
    window.g_fireballAimBrush = new FireballAimBrush();
  }
  return window.g_fireballAimBrush;
}

if (typeof window !== 'undefined') {
  window.initializeFireballAimBrush = initializeFireballAimBrush;
}
