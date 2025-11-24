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
    
    // Convert world coordinates to screen coordinates
    let screenX = this.x;
    let screenY = this.y;
    
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      const tileX = this.x / TILE_SIZE;
      const tileY = this.y / TILE_SIZE;
      const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
      screenX = screenPos[0];
      screenY = screenPos[1];
    }
    
    push();
    noStroke();
    fill(30, 30, 30, this.alpha * 180);
    ellipse(screenX, screenY, this.radius * 2, this.radius * 2);
    pop();
  }
}

class LightningManager {
  constructor() {
    this.sootStains = [];
    this.bolts = []; // transient bolt animations
    this.cooldown = 300; // milliseconds between strikes
    this.lastStrikeTime = 0;
    this.level = 1; // Power level (1 = single strike, 2 = triple strike)
    // Knockback in pixels applied to ants hit by lightning
    // Default: push back ~1.5 tiles
    this.knockbackPx = (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32) * 1.5;
  // Duration (ms) for knockback tween
  this.knockbackDurationMs = 180;
  // Active tweened knockbacks
  this._activeKnockbacks = [];
    // Expose simple runtime tuning API (methods will be attached to instance)
    this.setKnockbackPx = (v) => { this.knockbackPx = Number(v) || this.knockbackPx; return this.knockbackPx; };
    this.getKnockbackPx = () => this.knockbackPx;
    this.setKnockbackDurationMs = (v) => { this.knockbackDurationMs = Number(v) || this.knockbackDurationMs; return this.knockbackDurationMs; };
    this.getKnockbackDurationMs = () => this.knockbackDurationMs;
    this.getActiveKnockbacks = () => (this._activeKnockbacks || []).map(k => ({ startX: k.startX, startY: k.startY, targetX: k.targetX, targetY: k.targetY, progress: Math.min(1, (millis() - k.startTime) / (k.duration || 1)) }));
    // Level management
    this.setLevel = (v) => { this.level = Math.max(1, Math.min(3, Number(v) || 1)); return this.level; };
    this.getLevel = () => this.level;
    // Default playback volume (0.0 - 1.0)
    this.volume = 1.0; // lower default so strikes aren't too loud
    
    this.lastUpdate = null;
      
    logNormal('⚡ Lightning system initialized');
  }

  strikeAtAnt(ant, damage = 50, radius = 3) {
    try {
      if (!ant) {  return;  }

      // Determine position
      const pos = (typeof ant.getPosition === 'function') ? ant.getPosition() : { x: ant.x || 0, y: ant.y || 0 };

      // Check if this is the player queen - if so, skip damage
      const playerQueen = (typeof getQueen === 'function') ? getQueen() : null;
      const isPlayerQueen = (ant === playerQueen || ant.jobName === 'Queen' || ant.job === 'Queen');

      // Visual flash / instantaneous strike effect - can be expanded
      this.createFlash(pos.x, pos.y);

      // Deal damage to ant (skip if it's the player queen)
      if (!isPlayerQueen && typeof ant.takeDamage === 'function') {
        ant.takeDamage(damage);
        logNormal(`⚡ Lightning struck ant ${ant._antIndex || ''} for ${damage} damage`);
      } else if (isPlayerQueen) {
        logNormal(`👑 Lightning skipped player queen (no friendly fire)`);
      } else {
        console.warn(`⚠️ Ant doesn't have takeDamage() method, skipping damage`);
      }

      // Create explosion visuals (optional particle spawn)
      this.createExplosion(pos.x, pos.y);

      // Damage nearby ants as well (area effect)
      try {
        const aoeRadius = TILE_SIZE * radius; // radius in tiles
        const playerQueen = (typeof getQueen === 'function') ? getQueen() : null;
        if (typeof ants !== 'undefined' && Array.isArray(ants)) {
          for (const other of ants) {
            if (!other || !other.isActive) continue;
            if (other === ant) continue; // already handled
            // Skip the player queen
            if (other === playerQueen || other.jobName === 'Queen' || other.job === 'Queen') continue;
            const p = (typeof other.getPosition === 'function') ? other.getPosition() : { x: other.x || 0, y: other.y || 0 };
            const d = Math.hypot(p.x - pos.x, p.y - pos.y);
            if (d <= aoeRadius) {
              // Apply damage to nearby ants
              if (typeof other.takeDamage === 'function') {
                try { 
                  other.takeDamage(damage); 
                  logNormal(`  ⚡ AoE damaged ant at ${d.toFixed(1)}px for ${damage} damage`);
                } catch (e) { 
                  console.warn(`  ⚠️ Failed to damage ant:`, e.message);
                }
              }
              // apply a small knockback to nearby ants (visual feedback)
              try { this.applyKnockback(other, pos.x, pos.y, this.knockbackPx); } catch (e) { /* ignore */ }
            }
          }
        }
      } catch (e) {
        console.error('❌ Error applying AoE damage in strikeAtAnt:', e);
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
   * Apply a small knockback to an entity (ant) away from the source point.
   * Moves via setPosition() when available, falls back to posX/posY or sprite position.
   */
  applyKnockback(entity, sourceX, sourceY, magnitudePx = null) {
    // Enqueue a tweened knockback for the entity. Returns true if enqueued.
    if (!entity) return false;
    const mag = (typeof magnitudePx === 'number') ? magnitudePx : this.knockbackPx;
    const pos = (typeof entity.getPosition === 'function') ? entity.getPosition() : (entity.sprite && entity.sprite.pos ? entity.sprite.pos : { x: entity.x || 0, y: entity.y || 0 });
    if (!pos) return false;
    let dx = pos.x - sourceX;
    let dy = pos.y - sourceY;
    const dist = Math.hypot(dx, dy) || 1;
    dx = (dx / dist) * mag;
    dy = (dy / dist) * mag;

    const targetX = pos.x + dx;
    const targetY = pos.y + dy;

    // Remove any existing knockback for the same entity
    this._activeKnockbacks = this._activeKnockbacks.filter(k => k.entity !== entity);

    this._activeKnockbacks.push({
      entity,
      startX: pos.x,
      startY: pos.y,
      targetX,
      targetY,
      startTime: millis(),
      duration: this.knockbackDurationMs || 180
    });
    return true;
  }

  // Internal: step active knockbacks and apply interpolated positions
  _processKnockbacks() {
    if (!this._activeKnockbacks || this._activeKnockbacks.length === 0) return;
    const now = millis();
    const remaining = [];
    for (const k of this._activeKnockbacks) {
      const entity = k.entity;
      // Skip if entity not present or inactive
      if (!entity || (typeof entity.isActive !== 'undefined' && !entity.isActive)) continue;
      const tRaw = (now - k.startTime) / (k.duration || 1);
      const t = Math.max(0, Math.min(1, tRaw));

      // easeOutQuad
      const eased = 1 - (1 - t) * (1 - t);
      const x = k.startX + (k.targetX - k.startX) * eased;
      const y = k.startY + (k.targetY - k.startY) * eased;

      try {
        if (typeof entity.setPosition === 'function') {
          entity.setPosition(x, y);
        } else if (typeof entity.posX !== 'undefined' && typeof entity.posY !== 'undefined') {
          try { entity.posX = x; entity.posY = y; } catch (e) { /* ignore */ }
        } else if (entity.sprite && typeof entity.sprite.setPosition === 'function') {
          try { entity.sprite.setPosition(createVector(x, y)); } catch (e) { /* ignore */ }
        } else {
          entity.x = x; entity.y = y;
        }
      } catch (e) {
        // applying position failed; skip
      }

      if (t < 1) remaining.push(k);
    }
    this._activeKnockbacks = remaining;
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

    // Get target position
    const pos = (targetAnt && typeof targetAnt.getPosition === 'function') ? targetAnt.getPosition() : (targetAnt || { x: mouseX, y: mouseY });
    
    // Level 2+: Execute multiple strikes in sequence
    if (this.level >= 2) {
      const strikeCount = 3; // Triple strike at level 2
      const delayBetweenStrikes = 250; // ms between each strike
      
      for (let i = 0; i < strikeCount; i++) {
        const strikeDelay = 80 + (i * delayBetweenStrikes);
        
        // Create bolt animation for each strike
        setTimeout(() => {
          const bolt = {
            x: pos.x,
            y: pos.y,
            created: millis(),
            duration: 220,
            executed: false
          };
          this.bolts.push(bolt);
          
          // Execute the strike
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
        }, strikeDelay);
      }
      
      logNormal(`⚡⚡⚡ Level ${this.level} lightning: ${strikeCount} strikes!`);
    } else {
      // Level 1: Single strike (original behavior)
      const bolt = {
        x: pos.x,
        y: pos.y,
        created: millis(),
        duration: 220,
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
    }

    return true;
  }


  createFlash(x, y) {
    soundManager.play('lightningStrike');
    window.EffectsRenderer.flash(x, y, { color: [100, 150, 255], intensity: 0.5, radius: 48 });
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
      logNormal(`⚡ strikeAtPosition called at (${x.toFixed(1)}, ${y.toFixed(1)}) with radius ${radius} tiles, damage ${damage}`);
      this.createFlash(x, y);
      this.createExplosion(x, y);
      // Damage nearby ants (area effect)
      try {
        const aoeRadius = TILE_SIZE*radius;
        const playerQueen = (typeof getQueen === 'function') ? getQueen() : null;
        logNormal(`⚡ AOE radius: ${aoeRadius}px, checking ${typeof ants !== 'undefined' && Array.isArray(ants) ? ants.length : 0} ants`);
        if (typeof ants !== 'undefined' && Array.isArray(ants)) {
          let hitCount = 0;
          for (const ant of ants) {
            if (!ant || !ant.isActive) continue;
            // Skip the player queen
            if (ant === playerQueen || ant.jobName === 'Queen' || ant.job === 'Queen') continue;
            const p = (typeof ant.getPosition === 'function') ? ant.getPosition() : { x: ant.x || 0, y: ant.y || 0 };
            const d = Math.hypot(p.x - x, p.y - y);
            if (d <= aoeRadius) {
              hitCount++;
              logNormal(`  ⚡ Hit ant at distance ${d.toFixed(1)}px (ant pos: ${p.x.toFixed(1)}, ${p.y.toFixed(1)})`);
              try {
                if (typeof ant.takeDamage === 'function') {
                  ant.takeDamage(damage);
                  logNormal(`    ✓ Dealt ${damage} damage to ant`);
                } else {
                  logNormal(`    ⚠️ Ant has no takeDamage() method, skipping`);
                }
              } catch (e) {
                logNormal(`    ⚠️ Exception damaging ant: ${e.message}`);
              }
              // Apply knockback tween for AoE victims
              try { this.applyKnockback(ant, x, y, this.knockbackPx); } catch (e) { /* ignore */ }
            }
          }
          logNormal(`⚡ Total ants hit: ${hitCount}`);
        }
      } catch (e) {
        console.error('❌ Error applying AoE damage in strikeAtPosition:', e);
      }

      // Play sounds
      if (this.sound && typeof this.sound.play === 'function') {
        // Use the class property for volume
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

    // Process active knockback tweens
    this._processKnockbacks();

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
      
      // Convert world coordinates to screen coordinates
      let screenX = b.x;
      let screenY = b.y;
      
      if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
        const tileX = b.x / TILE_SIZE;
        const tileY = b.y / TILE_SIZE;
        const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
        screenX = screenPos[0];
        screenY = screenPos[1];
      }
      
      push();
      stroke(200, 230, 255, 255 * (1 - t));
      strokeWeight(3);
      // Simple top-to-target lightning line (jittered)
      const startX = screenX + (Math.random() - 0.5) * 8;
      const startY = -10; // from above the canvas
      const midX = screenX + (Math.random() - 0.5) * 20;
      const midY = screenY - (50 * (1 - t));
      line(startX, startY, midX, midY);
      line(midX, midY, screenX, screenY);
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
  soundManager.registerSound('lightningStrike', 'sounds/lightning_strike.wav', 'SoundEffects');
  return window.g_lightningManager;
}

if (typeof window !== 'undefined') {
  window.initializeLightningSystem = initializeLightningSystem;
  window.g_lightningManager = initializeLightningSystem();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LightningManager, initializeLightningSystem, SootStain };
}
