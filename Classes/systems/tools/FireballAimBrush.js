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
        preset: 'fireballCharge',
        x: 0,
        y: 0
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
      
      // Gradually increase charge sound volume (0.2 to 1.0)
      if (typeof soundManager !== 'undefined' && soundManager.setVolume) {
        const chargeVolume = 0.2 + (this.chargeProgress * 0.8); // 0.2 to 1.0
        soundManager.setVolume('fireCharge', chargeVolume);
      }
      
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
    
    // Screen darkening when charging
    if (this.isCharging && this.chargeProgress > 0.3) {
      const darkenAmount = (this.chargeProgress - 0.3) / 0.7; // 0.0 to 1.0 over last 70% of charge
      fill(0, 0, 0, darkenAmount * 120);
      noStroke();
      rect(0, 0, width, height);
    }
    
    // Radial light around charging fireball
    if (this.isCharging && this.chargeProgress > 0.5) {
      const lightIntensity = (this.chargeProgress - 0.5) / 0.5; // 0.0 to 1.0 over last 50%
      const glowRadius = 80 + (lightIntensity * 120);
      
      // Outer glow
      const gradient = drawingContext.createRadialGradient(
        this.cursor.x, this.cursor.y, 0,
        this.cursor.x, this.cursor.y, glowRadius
      );
      gradient.addColorStop(0, `rgba(255, 200, 100, ${lightIntensity * 0.6})`);
      gradient.addColorStop(0.4, `rgba(255, 150, 50, ${lightIntensity * 0.3})`);
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      
      drawingContext.fillStyle = gradient;
      drawingContext.fillRect(0, 0, width, height);
    }
    
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

    pop();
    
    // Render temporary explosion emitters (after main rendering, outside push/pop)
    if (window.g_tempParticleEmitters) {
      for (const temp of window.g_tempParticleEmitters) {
        temp.emitter.render();
      }
    }
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
      soundManager.stop('fireCharge');
      soundManager.play('fireFail', 1);
      return true;
    }

    if (button !== 'LEFT') return false;

    // Start charging
    if (!this.isCharging) {
        soundManager.play('fireCharge', 0.2,1.0,true);
        this.isCharging = true;
        this.chargeStartTime = millis();
        this.chargeProgress = 0;
    }
    
    return true;
  }

  /**
   * Handle mouse release - fire if fully charged
   */
  onMouseReleased(mx, my, button = 'LEFT') {
    if (!this.isActive) return false;
    if (button !== 'LEFT') return false;

    // Check if target is in range
    const queen = typeof getQueen === 'function' ? getQueen() : null;
    let inRange = true;
    
    if (queen) {
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
      
      const dx = mx - queenScreenX;
      const dy = my - queenScreenY;
      const dist = Math.hypot(dx, dy);
      inRange = dist <= this.rangePx;
    }

    // Only fire if fully charged and in range
    if (this.isCharging && this.chargeProgress >= 1.0 && inRange) {
        soundManager.play('fireball', 0.6);
        soundManager.stop('fireCharge');
      this.tryStrikeAt(mx, my);
    } else if (this.isCharging) {
      soundManager.play('fireFail', 1);
      soundManager.stop('fireCharge');
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
    
    if (typeof CoordinateConverter !== 'undefined') {
      const worldPos = CoordinateConverter.screenToWorld(mx, my);
      worldX = worldPos.x;
      worldY = worldPos.y;
    }

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
    
    // Visual effects - flash and explosion particles
    if (typeof window.EffectsRenderer !== 'undefined' && window.EffectsRenderer) {
      window.EffectsRenderer.flash(worldX, worldY, { color: [255, 150, 0], intensity: 0.8, radius: 64 });
    }
    
    // Create explosion particle burst using ParticleEmitter
    if (typeof ParticleEmitter !== 'undefined') {
      // Convert world coords to screen coords for particle emitter
      let screenX = mx;
      let screenY = my;
      
      if (typeof CoordinateConverter !== 'undefined') {
        const screenPos = CoordinateConverter.worldToScreen(worldX, worldY);
        screenX = screenPos.x;
        screenY = screenPos.y;
      }
      
      const explosionEmitter = new ParticleEmitter({
        preset: 'explosion',
        x: screenX,
        y: screenY
      });
      
      // Emit burst of particles
      explosionEmitter.start();
      for (let i = 0; i < explosionEmitter.maxParticles; i++) {
        explosionEmitter.emitParticle();
      }
      explosionEmitter.stop();
      
      // Store emitter temporarily for rendering (it will auto-cleanup when particles die)
      if (!window.g_tempParticleEmitters) {
        window.g_tempParticleEmitters = [];
      }
      window.g_tempParticleEmitters.push({
        emitter: explosionEmitter,
        created: millis(),
        lifetime: 2000 // Clean up after 2 seconds
      });
    }
    
    // Create multiple overlapping soot stains at impact for darker appearance
    if (typeof SootStain !== 'undefined' && typeof g_lightningManager !== 'undefined' && g_lightningManager) {
      // Create 5-8 overlapping stains for a darker, more opaque effect
      const numStains = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numStains; i++) {
        const offsetX = (Math.random() - 0.5) * 40; // Spread within 40px
        const offsetY = (Math.random() - 0.5) * 40;
        const stainRadius = 35 + Math.random() * 25; // 35-60px radius
        const stain = new SootStain(worldX + offsetX, worldY + offsetY, stainRadius, 8000 + Math.random() * 4000);
        g_lightningManager.sootStains.push(stain);
      }
      logNormal(`🔥 Created ${numStains} overlapping soot stains at impact`);
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
