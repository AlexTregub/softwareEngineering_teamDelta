# EffectsLayerRenderer API Documentation

> **Module**: `Classes/rendering/EffectsLayerRenderer.js`  
> **Version**: 1.0.0  
> **Last Updated**: October 2025

## Overview

The `EffectsLayerRenderer` class provides advanced particle and visual effects system with pooling, performance scaling, and multiple effect categories.

## Class: EffectsLayerRenderer

### Constructor

```javascript
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

  this.activeEffects = [];
  this.particleSystems = new Map();
}
```

## Particle System

### `createParticleEffect(type, options)`

**Parameters:**
- `type` (string): Effect type ('combat', 'environment', 'interactive', 'magical')
- `options` (Object): Effect configuration

Creates new particle effect with specified parameters.

**Effect Types:**

**Combat Effects:**
```javascript
createParticleEffect('combat', {
  position: { x: 100, y: 100 },
  particleCount: 20,
  color: [255, 0, 0],
  velocity: { min: 2, max: 8 },
  lifetime: 1000,
  fadeOut: true
});
```

**Environment Effects:**
```javascript
createParticleEffect('environment', {
  position: { x: 200, y: 150 },
  particleCount: 50,
  color: [255, 255, 0],
  pattern: 'explosion',
  gravity: 0.2,
  lifetime: 2000
});
```

### `updateParticles(deltaTime)`

**Parameters:**
- `deltaTime` (number): Time since last update in milliseconds

Updates all active particle systems and removes expired particles.

### `renderParticles()`

Renders all active particles with appropriate blending modes and effects.

## Visual Effects

### `addScreenEffect(effectType, duration, options)`

**Parameters:**
- `effectType` (string): Screen effect type
- `duration` (number): Effect duration in milliseconds
- `options` (Object): Effect-specific options

Adds screen-space effects like flashes, fades, and overlays.

**Screen Effect Types:**
- **Flash**: Screen flash for impacts
- **Fade**: Screen fade transitions  
- **Shake**: Camera shake effects
- **Blur**: Screen blur effects

### `addEntityEffect(entity, effectType, options)`

**Parameters:**
- `entity` (Object): Target entity
- `effectType` (string): Entity effect type
- `options` (Object): Effect configuration

Attaches visual effects to specific entities.

## Performance Management

### `setPerformanceLevel(level)`

**Parameters:**
- `level` (number): Performance level 0-3 (0=lowest, 3=highest)

Adjusts effect quality and quantity based on performance requirements.

**Performance Scaling:**
```javascript
setPerformanceLevel(level) {
  switch (level) {
    case 0: // Minimal effects
      this.config.maxParticles = 50;
      this.config.enableParticles = false;
      break;
    case 1: // Basic effects
      this.config.maxParticles = 150;
      this.config.enableParticles = true;
      break;
    case 2: // Standard effects  
      this.config.maxParticles = 300;
      break;
    case 3: // Maximum effects
      this.config.maxParticles = 500;
      break;
  }
}
```

## Effect Pooling

### `getParticleFromPool(type)`

**Parameters:**
- `type` (string): Particle pool type

Retrieves recycled particle from pool or creates new one if pool empty.

### `returnParticleToPool(particle, type)`

**Parameters:**
- `particle` (Object): Particle to recycle
- `type` (string): Pool type

Returns expired particle to pool for reuse.

## Audio Integration

### `playEffectAudio(effectType, position)`

**Parameters:**
- `effectType` (string): Audio effect type
- `position` (Object): 3D position for spatial audio

Plays audio effects synchronized with visual effects.

## Usage Examples

### Basic Effect Creation
```javascript
const effectsRenderer = new EffectsLayerRenderer();

// Combat effect on hit
function onEntityHit(entity, damage) {
  const pos = EntityAccessor.getPosition(entity);
  
  effectsRenderer.createParticleEffect('combat', {
    position: pos,
    particleCount: damage * 2,
    color: [255, 0, 0],
    velocity: { min: 1, max: 5 },
    lifetime: 800
  });
}

// Environment effect
function createExplosion(x, y) {
  effectsRenderer.createParticleEffect('environment', {
    position: { x, y },
    particleCount: 30,
    pattern: 'explosion',
    color: [255, 165, 0],
    lifetime: 1500
  });
  
  effectsRenderer.addScreenEffect('shake', 300, {
    intensity: 5
  });
}
```

### Performance-Adaptive Rendering
```javascript
// Adjust effects based on FPS
function updateEffectsQuality() {
  const fps = g_performanceMonitor.getCurrentFPS();
  
  if (fps < 30) {
    effectsRenderer.setPerformanceLevel(0);
  } else if (fps < 45) {
    effectsRenderer.setPerformanceLevel(1);
  } else if (fps < 55) {
    effectsRenderer.setPerformanceLevel(2);
  } else {
    effectsRenderer.setPerformanceLevel(3);
  }
}
```

## TODO Enhancements

### Advanced Particle Features
- **Physics Integration**: Collision detection for particles
- **Particle Chains**: Linked particle behaviors  
- **Emitter Systems**: Continuous particle emission
- **Particle Attractors**: Gravity wells and force fields

### Enhanced Visual Effects
- **Post-Processing**: Bloom, blur, and color grading
- **Lighting Effects**: Dynamic lighting from particles
- **Weather Systems**: Rain, snow, and atmospheric effects
- **Distortion Effects**: Heat haze and refraction

---

## See Also

- **[RenderLayerManager API Documentation](RenderLayerManager.md)** - Effects layer integration
- **[PerformanceMonitor API Documentation](PerformanceMonitor.md)** - Performance-based scaling