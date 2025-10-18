/**
 * LightningSystem - Instant lightning strike that detonates ants and leaves a soot stain
 *
 * Provides LightningManager with strikeAtAnt(ant) which handles damage, explosion, and soot stain creation.
 */

class SootStain {
  constructor(x, y, radius = 24, duration = 8000) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.duration = duration; // milliseconds
    this.created = millis();
    this.alpha = 1.0;
    this.isActive = true;
  }

  update() {
    const elapsed = millis() - this.created;
    if (elapsed >= this.duration) {
      this.isActive = false;
      return;
    }
    // Fade out over time
    this.alpha = 1 - (elapsed / this.duration);
  }

  render() {
    if (!this.isActive) return;
    push();
    noStroke();
    fill(30, 30, 30, this.alpha * 180);
    ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    pop();
  }
}

class LightningManager {
  constructor() {
    this.sootStains = [];
    this.bolts = []; // transient bolt animations
    this.cooldown = 300; // milliseconds between strikes
    this.lastStrikeTime = 0;
    // Default playback volume (0.0 - 1.0)
    this.volume = 0.25; // lower default so strikes aren't too loud
    // Try to load a simple sound using HTMLAudioElement if available
    try {
      this.sound = new Audio('Images/sounds/lightning_strike.wav');
      this.explosionSound = new Audio('Images/sounds/explosion_small.wav');
      // Apply initial volume if supported
      try { if (typeof this.sound.volume !== 'undefined') this.sound.volume = this.volume; } catch (e) {}
      try { if (typeof this.explosionSound.volume !== 'undefined') this.explosionSound.volume = this.volume; } catch (e) {}
    } catch (err) {
      this.sound = null;
      this.explosionSound = null;
    }
    this.lastUpdate = null;
    console.log('⚡ Lightning system initialized');
  }

  strikeAtAnt(ant, damage = 50, radius = 3) {
    try {
      if (!ant) {
        console.warn('⚡ No target ant provided for lightning strike');
        return;
      }

      // Determine position
      const pos = (typeof ant.getPosition === 'function') ? ant.getPosition() : { x: ant.x || 0, y: ant.y || 0 };

      // Visual flash / instantaneous strike effect - can be expanded
      this.createFlash(pos.x, pos.y);

      // Deal damage or kill ant
      if (typeof ant.takeDamage === 'function') {
        ant.takeDamage(damage);
        console.log(`⚡ Lightning struck ant ${ant._antIndex || ''} for ${damage} damage`);
      } else if (typeof ant.kill === 'function') {
        ant.kill();
        console.log(`⚡ Lightning killed ant ${ant._antIndex || ''}`);
      } else {
        // Fallback: set inactive
        ant.isActive = false;
      }

      // Create explosion visuals (optional particle spawn)
      this.createExplosion(pos.x, pos.y);

      // Play sounds if available
      if (this.sound && typeof this.sound.play === 'function') {
        try { if (typeof this.sound.volume !== 'undefined') this.sound.volume = this.volume; this.sound.currentTime = 0; this.sound.play(); } catch (e) {}
      }
      if (this.explosionSound && typeof this.explosionSound.play === 'function') {
        try { if (typeof this.explosionSound.volume !== 'undefined') this.explosionSound.volume = this.volume; this.explosionSound.currentTime = 0; this.explosionSound.play(); } catch (e) {}
      }
      
      // Kill nearby ants as well (area effect)
      try {
        const aoeRadius = TILE_SIZE * radius; // 1.5 tiles radius
        if (typeof ants !== 'undefined' && Array.isArray(ants)) {
          for (const other of ants) {
            if (!other || !other.isActive) continue;
            if (other === ant) continue; // already handled
            const p = (typeof other.getPosition === 'function') ? other.getPosition() : { x: other.x || 0, y: other.y || 0 };
            const d = Math.hypot(p.x - pos.x, p.y - pos.y);
            if (d <= aoeRadius) {
              // Prefer kill() if available
              if (typeof other.kill === 'function') {
                try { other.kill(); } catch (e) { other.isActive = false; }
              } else if (typeof other.takeDamage === 'function') {
                try { other.takeDamage(damage); } catch (e) { other.isActive = false; }
              } else {
                // Force-remove fallback
                other.isActive = false;
                if (typeof other.health !== 'undefined') other.health = 0;
              }
            }
          }
        }
      } catch (e) {
        console.error('❌ Error applying AoE kills in strikeAtAnt:', e);
      }

      // Create a soot stain that fades
      const stain = new SootStain(pos.x, pos.y, 18 + Math.random() * 12, 6000 + Math.random() * 4000);
      this.sootStains.push(stain);

      // Keep small list
      this.sootStains = this.sootStains.filter(s => s && s.isActive);
    } catch (err) {
      console.error('❌ Error in LightningManager.strikeAtAnt:', err);
    }
  }

  /**
   * Request a strike while respecting cooldown. Returns true if strike executed.
   */
  requestStrike(targetAnt) {
    const now = millis();
    if (now - this.lastStrikeTime < this.cooldown) {
      // On cooldown
      return false;
    }
    this.lastStrikeTime = now;

    // Create a bolt animation (sky -> target) and schedule the actual strike at the impact moment
    const pos = (targetAnt && typeof targetAnt.getPosition === 'function') ? targetAnt.getPosition() : (targetAnt || { x: mouseX, y: mouseY });
    const bolt = {
      x: pos.x,
      y: pos.y,
      created: millis(),
      duration: 220, // ms to show bolt
      executed: false
    };
    this.bolts.push(bolt);

    // Execute the strike slightly after bolt creation to sync visuals
    setTimeout(() => {
      try {
        if (targetAnt && typeof targetAnt.getPosition === 'function') {
          this.strikeAtAnt(targetAnt);
        } else if (targetAnt && typeof targetAnt.x === 'number' && typeof targetAnt.y === 'number') {
          this.strikeAtPosition(targetAnt.x, targetAnt.y);
        } else {
          this.strikeAtPosition(pos.x, pos.y);
        }
      } catch (err) {
        console.error('❌ Error executing delayed strike:', err);
      }
    }, 80);

    return true;
  }


  createFlash(x, y) {
    // If EffectsRenderer exists use it for a short flash, otherwise we just log
    if (typeof window.EffectsRenderer !== 'undefined' && window.EffectsRenderer && typeof window.EffectsRenderer.flash === 'function') {
      window.EffectsRenderer.flash(x, y, { color: [180, 220, 255], intensity: 1.2, radius: 48 });
    }
  }

  createExplosion(x, y) {
    // Basic circle explosion via EffectsRenderer if available
    if (typeof window.EffectsRenderer !== 'undefined' && window.EffectsRenderer && typeof window.EffectsRenderer.spawnParticleBurst === 'function') {
      window.EffectsRenderer.spawnParticleBurst(x, y, { count: 12, color: [255, 240, 200], size: 6 });
    }
  }

  /**
   * Strike at an arbitrary position and apply area damage to nearby ants
   */
  strikeAtPosition(x, y, damage = 50, radius = 3) {
    try {
      this.createFlash(x, y);
      this.createExplosion(x, y);
      // Kill nearby ants (area effect). Prefer kill(), otherwise force health to 0 and deactivate.
      try {
        const aoeRadius = TILE_SIZE*radius
        if (typeof ants !== 'undefined' && Array.isArray(ants)) {
          for (const ant of ants) {
            if (!ant || !ant.isActive) continue;
            const p = (typeof ant.getPosition === 'function') ? ant.getPosition() : { x: ant.x || 0, y: ant.y || 0 };
            const d = Math.hypot(p.x - x, p.y - y);
            if (d <= aoeRadius) {
              try {
                if (typeof ant.kill === 'function') {
                  ant.kill();
                } else if (typeof ant.takeDamage === 'function') {
                  // As a fallback, set health to zero then call takeDamage if needed
                  if (typeof ant.health !== 'undefined') ant.health = 0;
                  try { ant.takeDamage(damage); } catch (e) { /* ignore */ }
                } else {
                  // Force-remove fallback
                  ant.isActive = false;
                  if (typeof ant.health !== 'undefined') ant.health = 0;
                }
              } catch (e) {
                // Ensure the ant is deactivated even if kill() throws
                ant.isActive = false;
                if (typeof ant.health !== 'undefined') ant.health = 0;
              }
            }
          }
        }
      } catch (e) {
        console.error('❌ Error applying AoE kills in strikeAtPosition:', e);
      }

      // Play sounds
      if (this.sound && typeof this.sound.play === 'function') {
        this.volume = .25
        try { if (typeof this.sound.volume !== 'undefined') this.sound.volume = this.volume; this.sound.currentTime = 0; this.sound.play(); } catch (e) {}
      }

      // Soot stain
      const stain = new SootStain(x, y, 18 + Math.random() * 12, 6000 + Math.random() * 4000);
      this.sootStains.push(stain);
    } catch (err) {
      console.error('❌ Error in strikeAtPosition:', err);
    }
  }

  update() {
    const now = millis();
    const dt = this.lastUpdate ? (now - this.lastUpdate) : 16;
    this.lastUpdate = now;

    for (const s of this.sootStains) {
      if (s && s.isActive) s.update();
    }

    // Update bolts
    for (const b of this.bolts) {
      // bolts are transient; mark inactive after duration
      if (millis() - b.created >= b.duration) b.executed = true;
    }
    this.bolts = this.bolts.filter(b => !b.executed);

    // Remove inactive stains
    this.sootStains = this.sootStains.filter(s => s && s.isActive);
  }

  render() {
    // Render bolt visuals first (soot stains render beneath if needed)
    for (const b of this.bolts) {
      const t = (millis() - b.created) / b.duration;
      push();
      stroke(200, 230, 255, 255 * (1 - t));
      strokeWeight(3);
      // Simple top-to-target lightning line (jittered)
      const startX = b.x + (Math.random() - 0.5) * 8;
      const startY = -10; // from above the canvas
      const midX = b.x + (Math.random() - 0.5) * 20;
      const midY = b.y - (50 * (1 - t));
      line(startX, startY, midX, midY);
      line(midX, midY, b.x, b.y);
      pop();
    }
    for (const s of this.sootStains) {
      if (s && s.isActive) s.render();
    }
  }

  clear() {
    this.sootStains.length = 0;
  }
}

// Global initializer
function initializeLightningSystem() {
  if (!window.g_lightningManager) {
    window.g_lightningManager = new LightningManager();
    window.LightningManager = LightningManager; // export class
  }
  return window.g_lightningManager;
}

if (typeof window !== 'undefined') {
  window.initializeLightningSystem = initializeLightningSystem;
  window.g_lightningManager = initializeLightningSystem();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LightningManager, initializeLightningSystem, SootStain };
}
