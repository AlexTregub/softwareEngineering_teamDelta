// EffectsLayerRenderer - Advanced particle and visual effects system
class EffectsLayerRenderer {
  constructor() {
    this.config = {
      enableParticles: true,
      enableVisualEffects: true,
      enableAudioEffects: true,
      maxParticles: 500,
      particlePoolSize: 1000,
      enablePerformanceScaling: true
    };

    // Particle pools for efficiency
    this.particlePools = {
      combat: [],
      environment: [],
      interactive: [],
      magical: []
    };

    // Active effects
    this.activeParticleEffects = [];
    this.activeVisualEffects = [];
    this.activeAudioEffects = [];

    // Effect types registry
    this.effectTypes = new Map([
      // Combat Effects
      ['BLOOD_SPLATTER', { type: 'particle', category: 'combat', duration: 1000 }],
      ['IMPACT_SPARKS', { type: 'particle', category: 'combat', duration: 500 }],
      ['WEAPON_TRAIL', { type: 'particle', category: 'combat', duration: 800 }],
      
      // Environmental Effects  
      ['DUST_CLOUD', { type: 'particle', category: 'environment', duration: 2000 }],
      ['FALLING_LEAVES', { type: 'particle', category: 'environment', duration: 3000 }],
      ['WEATHER_RAIN', { type: 'particle', category: 'environment', duration: -1 }], // Continuous
      
      // Interactive Effects
      ['SELECTION_SPARKLE', { type: 'particle', category: 'interactive', duration: 1500 }],
      ['MOVEMENT_TRAIL', { type: 'particle', category: 'interactive', duration: 1000 }],
      ['GATHERING_SPARKLE', { type: 'particle', category: 'interactive', duration: 800 }],
      
      // Visual Effects
      ['SCREEN_SHAKE', { type: 'visual', category: 'screen', duration: 300 }],
      ['FADE_TRANSITION', { type: 'visual', category: 'screen', duration: 1000 }],
      ['HIGHLIGHT_GLOW', { type: 'visual', category: 'entity', duration: -1 }], // Continuous
      ['DAMAGE_FLASH', { type: 'visual', category: 'screen', duration: 150 }],
      
      // Audio Effects
      ['COMBAT_SOUND', { type: 'audio', category: '3d', duration: 500 }],
      ['FOOTSTEP_SOUND', { type: 'audio', category: '3d', duration: 200 }],
      ['UI_CLICK', { type: 'audio', category: 'ui', duration: 100 }],
      ['AMBIENT_NATURE', { type: 'audio', category: 'ambient', duration: -1 }] // Continuous
    ]);

    // Screen effect state
    this.screenEffects = {
      shake: { active: false, intensity: 0, timeLeft: 0 },
      fade: { active: false, alpha: 0, direction: 1, timeLeft: 0 },
      flash: { active: false, color: [255, 255, 255], alpha: 0, timeLeft: 0 }
    };

    // Performance tracking
    this.stats = {
      activeParticles: 0,
      activeVisualEffects: 0,
      activeAudioEffects: 0,
      lastRenderTime: 0,
      poolHits: 0,
      poolMisses: 0
    };
  }

  /**
   * Main render method - renders all effect layers
   */
  renderEffects(gameState) {
    const startTime = performance.now();

    push();
    
    // Update and render particle effects
    if (this.config.enableParticles) {
      this.updateParticleEffects();
      this.renderParticleEffects();
    }

    // Update and render visual effects
    if (this.config.enableVisualEffects) {
      this.updateVisualEffects();
      this.renderVisualEffects();
    }

    // Update audio effects (no rendering needed)
    if (this.config.enableAudioEffects) {
      this.updateAudioEffects();
    }

    pop();

    // Clean up expired effects
    this.cleanupExpiredEffects();

    this.stats.lastRenderTime = performance.now() - startTime;
  }

  /**
   * PARTICLE EFFECTS SYSTEM
   */
  updateParticleEffects() {
    this.stats.activeParticles = 0;
    
    for (let i = this.activeParticleEffects.length - 1; i >= 0; i--) {
      const effect = this.activeParticleEffects[i];
      
      if (this.updateParticleEffect(effect)) {
        this.stats.activeParticles++;
      } else {
        // Effect expired, return to pool
        this.returnParticleToPool(effect);
        this.activeParticleEffects.splice(i, 1);
      }
    }
  }

  updateParticleEffect(effect) {
    effect.timeLeft -= 16; // Approximate frame time
    
    // Update particle positions and properties
    switch(effect.effectType) {
      case 'BLOOD_SPLATTER':
        return this.updateBloodSplatter(effect);
      case 'IMPACT_SPARKS':
        return this.updateImpactSparks(effect);
      case 'DUST_CLOUD':
        return this.updateDustCloud(effect);
      case 'FALLING_LEAVES':
        return this.updateFallingLeaves(effect);
      case 'SELECTION_SPARKLE':
        return this.updateSelectionSparkle(effect);
      case 'MOVEMENT_TRAIL':
        return this.updateMovementTrail(effect);
      case 'GATHERING_SPARKLE':
        return this.updateGatheringSparkle(effect);
      default:
        return this.updateGenericParticle(effect);
    }
  }

  updateBloodSplatter(effect) {
    if (effect.timeLeft <= 0) return false;
    
    for (let particle of effect.particles) {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += 0.2; // Gravity
      particle.alpha -= 2; // Fade out
      
      if (particle.alpha <= 0) particle.dead = true;
    }
    
    effect.particles = effect.particles.filter(p => !p.dead);
    return effect.particles.length > 0;
  }

  updateImpactSparks(effect) {
    if (effect.timeLeft <= 0) return false;
    
    for (let particle of effect.particles) {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityX *= 0.95; // Friction
      particle.velocityY *= 0.95;
      particle.size *= 0.98; // Shrink
      
      if (particle.size < 1) particle.dead = true;
    }
    
    effect.particles = effect.particles.filter(p => !p.dead);
    return effect.particles.length > 0;
  }

  updateDustCloud(effect) {
    if (effect.timeLeft <= 0) return false;
    
    for (let particle of effect.particles) {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.alpha -= 1; // Slow fade
      particle.size += 0.5; // Expand
      
      if (particle.alpha <= 0) particle.dead = true;
    }
    
    effect.particles = effect.particles.filter(p => !p.dead);
    return effect.particles.length > 0;
  }

  updateFallingLeaves(effect) {
    if (effect.timeLeft <= 0) return false;
    
    for (let particle of effect.particles) {
      particle.x += particle.velocityX + Math.sin(particle.time * 0.1) * 0.5; // Swaying
      particle.y += particle.velocityY;
      particle.rotation += particle.rotationSpeed;
      particle.time++;
      
      // Remove when off screen
      if (particle.y > height + 50) particle.dead = true;
    }
    
    effect.particles = effect.particles.filter(p => !p.dead);
    return effect.particles.length > 0 || effect.timeLeft > 0; // Continuous spawning
  }

  updateSelectionSparkle(effect) {
    if (effect.timeLeft <= 0) return false;
    
    for (let particle of effect.particles) {
      particle.angle += 0.1;
      particle.x = effect.centerX + Math.cos(particle.angle) * particle.radius;
      particle.y = effect.centerY + Math.sin(particle.angle) * particle.radius;
      particle.radius += particle.radiusGrowth;
      particle.alpha -= 3;
      
      if (particle.alpha <= 0) particle.dead = true;
    }
    
    effect.particles = effect.particles.filter(p => !p.dead);
    return effect.particles.length > 0;
  }

  updateMovementTrail(effect) {
    if (effect.timeLeft <= 0) return false;
    
    // Follow entity if still exists
    if (effect.entity && effect.entity.x !== undefined) {
      effect.lastX = effect.entity.x;
      effect.lastY = effect.entity.y;
    }
    
    for (let particle of effect.particles) {
      particle.alpha -= 5;
      if (particle.alpha <= 0) particle.dead = true;
    }
    
    effect.particles = effect.particles.filter(p => !p.dead);
    return effect.particles.length > 0;
  }

  updateGatheringSparkle(effect) {
    if (effect.timeLeft <= 0) return false;
    
    for (let particle of effect.particles) {
      // Spiral inward
      particle.angle += 0.2;
      particle.radius *= 0.98;
      particle.x = effect.centerX + Math.cos(particle.angle) * particle.radius;
      particle.y = effect.centerY + Math.sin(particle.angle) * particle.radius;
      
      if (particle.radius < 5) particle.dead = true;
    }
    
    effect.particles = effect.particles.filter(p => !p.dead);
    return effect.particles.length > 0;
  }

  updateGenericParticle(effect) {
    if (effect.timeLeft <= 0) return false;
    
    for (let particle of effect.particles) {
      particle.x += particle.velocityX || 0;
      particle.y += particle.velocityY || 0;
      particle.alpha -= particle.fadeRate || 2;
      
      if (particle.alpha <= 0) particle.dead = true;
    }
    
    effect.particles = effect.particles.filter(p => !p.dead);
    return effect.particles.length > 0;
  }

  renderParticleEffects() {
    for (const effect of this.activeParticleEffects) {
      this.renderParticleEffect(effect);
    }
  }

  renderParticleEffect(effect) {
    push();
    
    for (const particle of effect.particles) {
      if (particle.dead) continue;
      
      push();
      translate(particle.x, particle.y);
      
      if (particle.rotation) {
        rotate(particle.rotation);
      }
      
      // Set particle color and alpha
      if (particle.color) {
        fill(particle.color[0], particle.color[1], particle.color[2], particle.alpha || 255);
      } else {
        fill(255, 255, 255, particle.alpha || 255);
      }
      
      noStroke();
      
      // Render particle based on type
      if (particle.shape === 'circle') {
        circle(0, 0, particle.size || 5);
      } else if (particle.shape === 'rect') {
        rect(-particle.size/2, -particle.size/2, particle.size, particle.size);
      } else if (particle.image) {
        image(particle.image, -particle.size/2, -particle.size/2, particle.size, particle.size);
      } else {
        // Default circle
        circle(0, 0, particle.size || 3);
      }
      
      pop();
    }
    
    pop();
  }

  /**
   * VISUAL EFFECTS SYSTEM
   */
  updateVisualEffects() {
    this.stats.activeVisualEffects = 0;
    
    // Update screen shake
    if (this.screenEffects.shake.active) {
      this.screenEffects.shake.timeLeft -= 16;
      if (this.screenEffects.shake.timeLeft <= 0) {
        this.screenEffects.shake.active = false;
        this.screenEffects.shake.intensity = 0;
      }
      this.stats.activeVisualEffects++;
    }
    
    // Update screen fade
    if (this.screenEffects.fade.active) {
      this.screenEffects.fade.timeLeft -= 16;
      const progress = 1 - (this.screenEffects.fade.timeLeft / 1000);
      this.screenEffects.fade.alpha = progress * this.screenEffects.fade.direction * 255;
      
      if (this.screenEffects.fade.timeLeft <= 0) {
        this.screenEffects.fade.active = false;
      }
      this.stats.activeVisualEffects++;
    }
    
    // Update screen flash
    if (this.screenEffects.flash.active) {
      this.screenEffects.flash.timeLeft -= 16;
      this.screenEffects.flash.alpha = (this.screenEffects.flash.timeLeft / 150) * 100;
      
      if (this.screenEffects.flash.timeLeft <= 0) {
        this.screenEffects.flash.active = false;
      }
      this.stats.activeVisualEffects++;
    }
  }

  renderVisualEffects() {
    // Apply screen shake
    if (this.screenEffects.shake.active) {
      const shakeX = (Math.random() - 0.5) * this.screenEffects.shake.intensity;
      const shakeY = (Math.random() - 0.5) * this.screenEffects.shake.intensity;
      translate(shakeX, shakeY);
    }
    
    // Render screen fade
    if (this.screenEffects.fade.active) {
      push();
      fill(0, 0, 0, this.screenEffects.fade.alpha);
      noStroke();
      rect(0, 0, width, height);
      pop();
    }
    
    // Render screen flash
    if (this.screenEffects.flash.active) {
      push();
      const color = this.screenEffects.flash.color;
      fill(color[0], color[1], color[2], this.screenEffects.flash.alpha);
      noStroke();
      rect(0, 0, width, height);
      pop();
    }
  }

  /**
   * AUDIO EFFECTS SYSTEM
   */
  updateAudioEffects() {
    this.stats.activeAudioEffects = 0;
    
    for (let i = this.activeAudioEffects.length - 1; i >= 0; i--) {
      const audioEffect = this.activeAudioEffects[i];
      
      audioEffect.timeLeft -= 16;
      
      if (audioEffect.timeLeft <= 0) {
        // Stop and cleanup audio
        if (audioEffect.sound && audioEffect.sound.stop) {
          audioEffect.sound.stop();
        }
        this.activeAudioEffects.splice(i, 1);
      } else {
        this.stats.activeAudioEffects++;
      }
    }
  }

  /**
   * EFFECT CREATION API
   */
  addEffect(effectType, options = {}) {
    const effectDef = this.effectTypes.get(effectType);
    if (!effectDef) {
      console.warn(`Unknown effect type: ${effectType}`);
      return null;
    }

    switch(effectDef.type) {
      case 'particle':
        return this.createParticleEffect(effectType, effectDef, options);
      case 'visual':
        return this.createVisualEffect(effectType, effectDef, options);
      case 'audio':
        return this.createAudioEffect(effectType, effectDef, options);
      default:
        console.warn(`Unknown effect category: ${effectDef.type}`);
        return null;
    }
  }

  createParticleEffect(effectType, effectDef, options) {
    const effect = this.getParticleFromPool(effectDef.category) || this.createNewParticleEffect();
    
    effect.effectType = effectType;
    effect.category = effectDef.category;
    effect.timeLeft = effectDef.duration;
    effect.particles = [];
    
    // Set position
    effect.x = options.x || 0;
    effect.y = options.y || 0;
    effect.centerX = effect.x;
    effect.centerY = effect.y;
    
    // Create particles based on effect type
    this.initializeParticles(effect, effectType, options);
    
    this.activeParticleEffects.push(effect);
    return effect;
  }

  initializeParticles(effect, effectType, options) {
    const count = options.particleCount || 10;
    
    switch(effectType) {
      case 'BLOOD_SPLATTER':
        this.createBloodSplatterParticles(effect, count, options);
        break;
      case 'IMPACT_SPARKS':
        this.createImpactSparksParticles(effect, count, options);
        break;
      case 'DUST_CLOUD':
        this.createDustCloudParticles(effect, count, options);
        break;
      case 'SELECTION_SPARKLE':
        this.createSelectionSparkleParticles(effect, count, options);
        break;
      default:
        this.createGenericParticles(effect, count, options);
    }
  }

  createBloodSplatterParticles(effect, count, options) {
    for (let i = 0; i < count; i++) {
      effect.particles.push({
        x: effect.x,
        y: effect.y,
        velocityX: (Math.random() - 0.5) * 10,
        velocityY: (Math.random() - 0.5) * 10 - 2,
        size: Math.random() * 8 + 2,
        alpha: 255,
        color: options.color || [150, 0, 0],
        shape: 'circle'
      });
    }
  }

  createImpactSparksParticles(effect, count, options) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      
      effect.particles.push({
        x: effect.x,
        y: effect.y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size: Math.random() * 4 + 1,
        alpha: 255,
        color: options.color || [255, 255, 0],
        shape: 'circle'
      });
    }
  }

  createDustCloudParticles(effect, count, options) {
    for (let i = 0; i < count; i++) {
      effect.particles.push({
        x: effect.x + (Math.random() - 0.5) * 20,
        y: effect.y + (Math.random() - 0.5) * 20,
        velocityX: (Math.random() - 0.5) * 2,
        velocityY: (Math.random() - 0.5) * 2 - 1,
        size: Math.random() * 15 + 5,
        alpha: 100,
        color: options.color || [139, 115, 85],
        shape: 'circle'
      });
    }
  }

  createSelectionSparkleParticles(effect, count, options) {
    for (let i = 0; i < count; i++) {
      effect.particles.push({
        x: effect.x,
        y: effect.y,
        angle: (i / count) * Math.PI * 2,
        radius: 20,
        radiusGrowth: 0.5,
        alpha: 255,
        color: options.color || [255, 255, 0],
        shape: 'circle',
        size: 3
      });
    }
  }

  createGenericParticles(effect, count, options) {
    for (let i = 0; i < count; i++) {
      effect.particles.push({
        x: effect.x + (Math.random() - 0.5) * 10,
        y: effect.y + (Math.random() - 0.5) * 10,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: (Math.random() - 0.5) * 4,
        size: Math.random() * 5 + 2,
        alpha: 255,
        fadeRate: 3,
        color: options.color || [255, 255, 255],
        shape: options.shape || 'circle'
      });
    }
  }

  createVisualEffect(effectType, effectDef, options) {
    switch(effectType) {
      case 'SCREEN_SHAKE':
        this.screenEffects.shake.active = true;
        this.screenEffects.shake.intensity = options.intensity || 5;
        this.screenEffects.shake.timeLeft = effectDef.duration;
        break;
        
      case 'FADE_TRANSITION':
        this.screenEffects.fade.active = true;
        this.screenEffects.fade.direction = options.direction || 1; // 1 = fade in, -1 = fade out
        this.screenEffects.fade.timeLeft = effectDef.duration;
        break;
        
      case 'DAMAGE_FLASH':
        this.screenEffects.flash.active = true;
        this.screenEffects.flash.color = options.color || [255, 0, 0];
        this.screenEffects.flash.timeLeft = effectDef.duration;
        break;
    }
  }

  createAudioEffect(effectType, effectDef, options) {
    // Audio effects would be implemented here
    // For now, just track the effect
    const audioEffect = {
      effectType: effectType,
      timeLeft: effectDef.duration,
      volume: options.volume || 1.0,
      position: options.position || null // For 3D positioning
    };
    
    this.activeAudioEffects.push(audioEffect);
    return audioEffect;
  }

  /**
   * PARTICLE POOLING SYSTEM
   */
  getParticleFromPool(category) {
    const pool = this.particlePools[category] || [];
    if (pool.length > 0) {
      this.stats.poolHits++;
      return pool.pop();
    }
    this.stats.poolMisses++;
    return null;
  }

  returnParticleToPool(effect) {
    const category = effect.category || 'interactive';
    if (!this.particlePools[category]) {
      this.particlePools[category] = [];
    }
    
    // Reset effect for reuse
    effect.particles = [];
    effect.timeLeft = 0;
    
    this.particlePools[category].push(effect);
  }

  createNewParticleEffect() {
    return {
      effectType: null,
      category: null,
      timeLeft: 0,
      particles: [],
      x: 0,
      y: 0
    };
  }

  /**
   * CLEANUP AND UTILITIES
   */
  cleanupExpiredEffects() {
    // Particle effects cleanup is handled in updateParticleEffects
    // Audio effects cleanup is handled in updateAudioEffects
    // Visual effects are state-based and cleanup themselves
  }

  /**
   * CONVENIENCE METHODS
   */
  // Combat Effects
  bloodSplatter(x, y, options = {}) {
    return this.addEffect('BLOOD_SPLATTER', { x, y, ...options });
  }

  impactSparks(x, y, options = {}) {
    return this.addEffect('IMPACT_SPARKS', { x, y, ...options });
  }

  // Environmental Effects
  dustCloud(x, y, options = {}) {
    return this.addEffect('DUST_CLOUD', { x, y, ...options });
  }

  // Interactive Effects
  selectionSparkle(x, y, options = {}) {
    return this.addEffect('SELECTION_SPARKLE', { x, y, ...options });
  }

  gatheringSparkle(x, y, options = {}) {
    return this.addEffect('GATHERING_SPARKLE', { x, y, ...options });
  }

  // Visual Effects
  screenShake(intensity = 5) {
    return this.addEffect('SCREEN_SHAKE', { intensity });
  }

  damageFlash(color = [255, 0, 0]) {
    return this.addEffect('DAMAGE_FLASH', { color });
  }

  fadeTransition(direction = 1) {
    return this.addEffect('FADE_TRANSITION', { direction });
  }

  /**
   * ADD VISUAL EFFECT - Specialized visual effects (different from particles)
   * Handles UI animations, screen effects, and non-particle visuals
   */
  addVisualEffect(config) {
    const visualEffect = {
      id: `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: config.type || 'generic',
      timeLeft: config.duration || 1000,
      startTime: performance.now(),
      ...config
    };

    // Handle different visual effect types
    switch (visualEffect.type) {
      case 'screen_shake':
        this.screenEffects.shake.active = true;
        this.screenEffects.shake.intensity = config.intensity || 5;
        this.screenEffects.shake.timeLeft = config.duration || 300;
        break;
        
      case 'screen_flash':
        this.screenEffects.flash.active = true;
        this.screenEffects.flash.color = config.color || [255, 255, 255];
        this.screenEffects.flash.timeLeft = config.duration || 150;
        break;
        
      case 'fade_transition':
        this.screenEffects.fade.active = true;
        this.screenEffects.fade.direction = config.direction || 1;
        this.screenEffects.fade.timeLeft = config.duration || 1000;
        break;
        
      default:
        // Store as active visual effect for custom rendering
        this.activeVisualEffects.push(visualEffect);
    }

    return visualEffect.id;
  }

  /**
   * CONFIGURATION AND STATS
   */
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }

  getStats() {
    return { ...this.stats };
  }

  clearAllEffects() {
    this.activeParticleEffects = [];
    this.activeVisualEffects = [];
    this.activeAudioEffects = [];
    
    this.screenEffects.shake.active = false;
    this.screenEffects.fade.active = false;
    this.screenEffects.flash.active = false;
  }
}

// Create global instance for browser use
if (typeof window !== 'undefined') {
  window.EffectsRenderer = new EffectsLayerRenderer();
} else if (typeof global !== 'undefined') {
  global.EffectsRenderer = new EffectsLayerRenderer();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EffectsLayerRenderer;
}