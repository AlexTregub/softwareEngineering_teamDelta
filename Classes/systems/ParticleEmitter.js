/**
 * ParticleEmitter.js
 * ==================
 * Continuous particle emission system for fire, smoke, sparks, etc.
 * Spawns particles over time with randomized properties for natural effects.
 * 
 * Usage:
 * - Direct config: new ParticleEmitter({ x: 100, y: 200, emissionRate: 50, ... })
 * - Preset: new ParticleEmitter({ preset: 'explosion', x: 100, y: 100 })
 * - Preset with overrides: new ParticleEmitter({ preset: 'explosion', x: 100, y: 100, maxParticles: 200 })
 */

class ParticleEmitter {
  // Static property to cache loaded presets
  static presets = null;
  
  // Static method to load presets from config file
  static async loadPresets() {
    if (ParticleEmitter.presets) return ParticleEmitter.presets;
    
    try {
      const response = await fetch('config/particle-effects.json');
      ParticleEmitter.presets = await response.json();
      console.log('✅ Particle effect presets loaded:', Object.keys(ParticleEmitter.presets));
      return ParticleEmitter.presets;
    } catch (error) {
      console.warn('⚠️ Failed to load particle presets:', error);
      ParticleEmitter.presets = {};
      return {};
    }
  }
  
  // Static method to get a preset (synchronous, requires presets to be loaded)
  static getPreset(presetName) {
    if (!ParticleEmitter.presets) {
      console.warn('⚠️ Particle presets not loaded. Call ParticleEmitter.loadPresets() first.');
      return null;
    }
    return ParticleEmitter.presets[presetName] || null;
  }
  
  constructor(options = {}) {
    // Load from preset if specified
    if (options.preset) {
      const preset = ParticleEmitter.getPreset(options.preset);
      if (preset) {
        // Merge preset with options (options override preset)
        options = { ...preset, ...options };
        delete options.preset; // Remove preset key
      } else {
        console.warn(`⚠️ Particle preset "${options.preset}" not found`);
      }
    }
    
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.active = false;
    
    // Emission settings
    this.emissionRate = options.emissionRate || 10; // particles per second
    this.maxParticles = options.maxParticles || 50;
    this.spawnRadius = options.spawnRadius || 10;
    
    // Particle properties
    this.particles = [];
    this.lastEmitTime = 0;
    this.emitInterval = 1000 / this.emissionRate; // ms between spawns
    
    // Particle lifecycle settings
    this.particleLifetime = options.lifetime || 1500; // ms
    this.particleTypes = options.types || ['fire']; // 'fire', 'smoke', 'spark'
    
    // Visual properties
    this.sizeRange = options.sizeRange || [3, 8];
    this.speedRange = options.speedRange || [0.5, 2.0];
    this.colors = options.colors || {
      fire: [[255, 150, 0], [255, 100, 0], [255, 200, 50]],
      smoke: [[80, 80, 80], [100, 100, 100], [120, 120, 120]],
      spark: [[255, 220, 100], [255, 255, 200], [255, 200, 0]],
      rain: [[150, 180, 220], [180, 200, 230], [200, 220, 240]] // Light blue/white rain
    };
    
    // Movement properties
    this.gravity = options.gravity || -0.05; // negative = upward
    this.drift = options.drift || 0.3; // horizontal randomness
    this.turbulence = options.turbulence || 0.02; // random movement
    
    // Emission mode: 'continuous' (default) or 'explosion' (radial burst)
    this.emissionMode = options.emissionMode || 'continuous';
    
    // Coordinate mode: 'screen' (default, particles in screen space) or 'world' (particles in world space, affected by camera)
    this.coordinateMode = options.coordinateMode || 'screen';
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  start() {
    this.active = true;
    this.lastEmitTime = millis();
  }

  stop() {
    this.active = false;
  }

  clear() {
    this.particles = [];
  }

  update() {
    const now = millis();
    
    // Emit new particles if active
    if (this.active && this.particles.length < this.maxParticles && (now - this.lastEmitTime) >= this.emitInterval) {
      this.emitParticle();
      this.lastEmitTime = now;
    }
    
    // Calculate deltaTime from frame timing
    const frameTime = (typeof deltaTime !== 'undefined' && deltaTime > 0) ? deltaTime : 16;
    const dt = frameTime / 16; // Normalize to 60fps (16ms frame)
    
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update lifetime using frame time
      p.age += frameTime;
      const lifeRatio = p.age / p.lifetime;
      
      // Remove dead particles
      if (p.age >= p.lifetime) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Update position (framerate-independent)
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Apply forces (framerate-independent)
      p.vy += this.gravity * dt;
      p.vx += (Math.random() - 0.5) * this.turbulence * dt;
      
      // Update visual properties
      // Fade in over first 20% of life, then fade out
      if (lifeRatio < 0.2) {
        p.alpha = 255 * (lifeRatio / 0.2); // Fade in
      } else {
        p.alpha = 255 * (1 - (lifeRatio - 0.2) / 0.8); // Fade out over remaining 80%
      }
      
      // Size changes based on type (framerate-independent)
      if (p.type === 'smoke') {
        p.size += 0.05 * dt; // Smoke grows as it rises
      } else if (p.type === 'fire') {
        p.size = p.baseSize * (1 - lifeRatio * 0.5); // Fire shrinks slightly
      }
    }
  }

  emitParticle() {
    // Random spawn position within radius
    const angle = Math.random() * TWO_PI;
    const dist = Math.random() * this.spawnRadius;
    const spawnX = this.x + Math.cos(angle) * dist;
    const spawnY = this.y + Math.sin(angle) * dist;
    
    // Random particle type
    const type = this.particleTypes[Math.floor(Math.random() * this.particleTypes.length)];
    
    // Random color from type
    const colorOptions = this.colors[type] || [[255, 255, 255]];
    const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    
    // Random size
    const size = this.sizeRange[0] + Math.random() * (this.sizeRange[1] - this.sizeRange[0]);
    
    // Random velocity based on emission mode
    const speed = this.speedRange[0] + Math.random() * (this.speedRange[1] - this.speedRange[0]);
    let vx, vy;
    
    if (this.emissionMode === 'explosion') {
      // Radial explosion - velocity points outward from center
      const explosionAngle = Math.random() * TWO_PI;
      vx = Math.cos(explosionAngle) * speed;
      vy = Math.sin(explosionAngle) * speed;
    } else if (this.emissionMode === 'orbital') {
      // Orbital/swirl - particles move in circular pattern around center
      const angleFromCenter = Math.atan2(spawnY - this.y, spawnX - this.x);
      const distFromCenter = Math.hypot(spawnX - this.x, spawnY - this.y);
      
      // Tangential velocity for orbital motion (perpendicular to radius)
      // Speed scales with distance - inner particles move slower, outer faster (like a vortex)
      const distanceScale = Math.max(0.3, distFromCenter / this.spawnRadius);
      const orbitalAngle = angleFromCenter + HALF_PI; // 90 degrees offset for tangent
      vx = Math.cos(orbitalAngle) * speed * distanceScale * 1.5; // 1.5x multiplier for faster orbit
      vy = Math.sin(orbitalAngle) * speed * distanceScale * 1.5;
      
      // Strong inward spiral for tighter effect
      const radialSpeed = (type === 'rain') ? -speed * 0.8 : -speed * 0.5; // Much stronger inward pull
      vx += Math.cos(angleFromCenter) * radialSpeed;
      vy += Math.sin(angleFromCenter) * radialSpeed;
    } else {
      // Continuous emission - velocity based on type
      vx = (Math.random() - 0.5) * this.drift;
      // Rain falls down (positive Y), fire/smoke/dirt rises up (negative Y) or settles slowly
      if (type === 'rain') {
        vy = speed;
      } else if (type === 'dirt') {
        vy = speed * 0.3; // Dirt settles slowly downward
      } else {
        vy = -speed; // Fire/smoke rises
      }
    }
    
    // Random lifetime variation (±20%)
    const lifetime = this.particleLifetime * (0.8 + Math.random() * 0.4);
    
    this.particles.push({
      x: spawnX,
      y: spawnY,
      vx: vx,
      vy: vy,
      size: size,
      baseSize: size,
      alpha: 255,
      color: color,
      type: type,
      age: 0,
      lifetime: lifetime
    });
  }

  render() {
    if (this.particles.length === 0) return;
    
    push();
    
    // Convert particle positions based on coordinate mode
    for (const p of this.particles) {
      noStroke();
      fill(p.color[0], p.color[1], p.color[2], p.alpha);
      
      let renderX = p.x;
      let renderY = p.y;
      
      // If in screen mode and CameraManager exists, convert world coords to screen coords
      if (this.coordinateMode === 'screen' && typeof window !== 'undefined' && window.g_cameraManager) {
        const screenPos = window.g_cameraManager.worldToScreen(p.x, p.y);
        renderX = screenPos.screenX;
        renderY = screenPos.screenY;
      }
      // If in world mode, convert world coords to screen coords using terrain system
      else if (this.coordinateMode === 'world' && typeof g_activeMap !== 'undefined' && g_activeMap && 
               g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
        // Convert world pixel coordinates to tile coordinates
        const tileX = p.x / TILE_SIZE;
        const tileY = p.y / TILE_SIZE;
        
        // Use terrain's converter to get screen position (handles Y inversion and camera)
        const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX+0.5, tileY+1]); // +1 to align with ground level
        renderX = screenPos[0];
        renderY = screenPos[1];
      }
      
      ellipse(renderX, renderY, p.size, p.size);
    }
    
    pop();
  }

  getParticleCount() {
    return this.particles.length;
  }

  isActive() {
    return this.active;
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParticleEmitter;
}

// Global initialization function
function initializeParticleEmitter() {
  if (typeof window.ParticleEmitter === 'undefined') {
    window.ParticleEmitter = ParticleEmitter;
    console.log('✅ ParticleEmitter class registered globally');
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initializeParticleEmitter();
}
