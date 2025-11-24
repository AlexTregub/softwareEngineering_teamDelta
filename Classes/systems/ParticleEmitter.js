/**
 * ParticleEmitter.js
 * ==================
 * Continuous particle emission system for fire, smoke, sparks, etc.
 * Spawns particles over time with randomized properties for natural effects.
 */

class ParticleEmitter {
  constructor(options = {}) {
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
    } else {
      // Continuous emission - velocity based on type
      vx = (Math.random() - 0.5) * this.drift;
      // Rain falls down (positive Y), fire/smoke rises up (negative Y)
      vy = type === 'rain' ? speed : -speed;
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
    
    for (const p of this.particles) {
      noStroke();
      fill(p.color[0], p.color[1], p.color[2], p.alpha);
      ellipse(p.x, p.y, p.size, p.size);
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
