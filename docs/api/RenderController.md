# RenderController API Documentation

> **Module**: `Classes/rendering/RenderController.js`  
> **Version**: 1.0.0  
> **Dependencies**: EntityAccessor.js  
> **Last Updated**: October 2025

## Overview

The `RenderController` class provides standardized rendering, highlighting, and visual effects for all game entities. It eliminates inconsistencies in entity rendering by providing a centralized system for visual states, animations, and debug overlays.

## Class: RenderController

### Constructor

#### `new RenderController(entity)`

**Parameters:**
- `entity` (Object): The entity this controller will manage rendering for

Creates a RenderController instance bound to a specific entity with initialized visual states and animation properties.

**Implementation Details:**
```javascript
constructor(entity) {
  this._entity = entity;
  this._effects = [];
  this._animations = {};
  
  // Highlight states
  this._highlightState = null;
  this._highlightColor = null;
  this._highlightIntensity = 1.0;
  
  // Animation properties
  this._bobOffset = Math.random() * Math.PI * 2; // Random bob start
  this._pulseOffset = Math.random() * Math.PI * 2; // Random pulse start
  
  // Rendering settings
  this._smoothing = false; // Pixel art style by default
  this._debugMode = false;
  this._renderCallCount = 0; // Track render calls for debug info
}
```

**Features Initialized:**
- **Effects System**: Empty effects array for visual effects
- **Animation System**: Randomized animation offsets for natural variation
- **Highlight System**: Null state with configurable color and intensity
- **Debug System**: Render call tracking and debug mode flag
- **Rendering Style**: Pixel-art style (no smoothing) by default

---

## Highlight System

### Highlight Types

The controller provides predefined highlight types for common visual states:

```javascript
HIGHLIGHT_TYPES = {
  SELECTED: {
    color: [0, 255, 0], // Green
    strokeWeight: 3,
    style: "outline"
  },
  HOVER: {
    color: [255, 255, 0, 200], // Yellow with transparency
    strokeWeight: 2,
    style: "outline"
  },
  BOX_HOVERED: {
    color: [0, 255, 50, 100], // Green with transparency
    strokeWeight: 2,
    style: "outline"
  },
  COMBAT: {
    color: [255, 0, 0], // Red
    strokeWeight: 3,
    style: "pulse"
  },
  FRIENDLY: {
    color: [0, 255, 0], // Green
    strokeWeight: 2,
    style: "outline"
  }
}
```

### `setHighlight(type, intensity = 1.0)`

**Parameters:**
- `type` (string): Highlight type from `HIGHLIGHT_TYPES`
- `intensity` (number, optional): Highlight intensity (0.0-1.0), default 1.0

Sets the entity's highlight state to the specified type with optional intensity control.

**Implementation:**
```javascript
setHighlight(type, intensity = 1.0) {
  if (this.HIGHLIGHT_TYPES[type]) {
    this._highlightState = type;
    this._highlightColor = this.HIGHLIGHT_TYPES[type].color;
    this._highlightIntensity = Math.max(0, Math.min(1, intensity));
  }
}
```

**Usage Examples:**
```javascript
// Basic highlighting
renderController.setHighlight('SELECTED');

// Reduced intensity highlight
renderController.setHighlight('HOVER', 0.6);

// Combat state
renderController.setHighlight('COMBAT');
```

### `clearHighlight()`

Removes all highlighting from the entity.

**Implementation:**
```javascript
clearHighlight() {
  this._highlightState = null;
  this._highlightColor = null;
  this._highlightIntensity = 1.0;
}
```

---

## Animation System

### `startAnimation(type, duration, options = {})`

**Parameters:**
- `type` (string): Animation type ('bob', 'pulse', 'shake', 'rotate')
- `duration` (number): Animation duration in milliseconds
- `options` (Object): Animation-specific options

Starts an animation effect on the entity with specified parameters.

**Animation Types:**

**Bob Animation:**
```javascript
startAnimation('bob', 2000, {
  amplitude: 5,    // Vertical movement range
  frequency: 1.0   // Speed multiplier
});
```

**Pulse Animation:**
```javascript
startAnimation('pulse', 1500, {
  minScale: 0.9,   // Minimum scale
  maxScale: 1.1,   // Maximum scale
  frequency: 2.0   // Pulse speed
});
```

**Shake Animation:**
```javascript
startAnimation('shake', 500, {
  intensity: 3,    // Shake strength
  decay: true      // Fade out over time
});
```

**Rotate Animation:**
```javascript
startAnimation('rotate', 3000, {
  speed: 90,       // Degrees per second
  clockwise: true  // Rotation direction
});
```

### `stopAnimation(type)`

**Parameters:**
- `type` (string): Animation type to stop

Stops a specific animation type while leaving others running.

### `stopAllAnimations()`

Stops all currently running animations on the entity.

---

## Visual Effects System

### `addEffect(effectType, options = {})`

**Parameters:**
- `effectType` (string): Type of visual effect to add
- `options` (Object): Effect-specific configuration

Adds a visual effect to the entity with specified options.

**Effect Types:**

**Damage Effect:**
```javascript
addEffect('damage', {
  color: [255, 0, 0],
  duration: 800,
  fadeOut: true
});
```

**Heal Effect:**
```javascript
addEffect('heal', {
  color: [0, 255, 0],
  particles: true,
  duration: 1200
});
```

**Sparkle Effect:**
```javascript
addEffect('sparkle', {
  particleCount: 5,
  sparkleColor: [255, 255, 0],
  duration: 2000
});
```

**Glow Effect:**
```javascript
addEffect('glow', {
  glowColor: [0, 255, 255],
  intensity: 0.8,
  pulsing: true
});
```

### `removeEffect(effectId)`

**Parameters:**
- `effectId` (string): Unique identifier of the effect to remove

Removes a specific visual effect from the entity.

### `clearAllEffects()`

Removes all visual effects from the entity.

---

## Core Rendering Methods

### `render()`

Main rendering method that handles the complete entity rendering pipeline.

**Rendering Pipeline:**
1. **Position Calculation**: Uses EntityAccessor for consistent positioning
2. **Animation Application**: Applies active animations to position/scale/rotation
3. **Base Rendering**: Draws the entity sprite or shape
4. **Effect Rendering**: Applies visual effects and particles
5. **Highlight Rendering**: Draws highlight overlays if active
6. **Debug Rendering**: Shows debug information if enabled

**Implementation Pattern:**
```javascript
render() {
  const position = EntityAccessor.getPosition(this._entity);
  const size = EntityAccessor.getSize(this._entity);
  
  // Apply animations
  this.applyAnimations(position, size);
  
  // Render base entity
  this.renderBase(position, size);
  
  // Render effects
  this.renderEffects(position, size);
  
  // Render highlights
  this.renderHighlight(position, size);
  
  // Debug rendering
  if (this._debugMode) {
    this.renderDebugInfo(position, size);
  }
  
  this._renderCallCount++;
}
```

### `renderBase(position, size)`

**Parameters:**
- `position` (Object): Entity position {x, y}
- `size` (Object): Entity size {width, height}

Renders the base entity sprite or shape without effects or highlights.

**Implementation Details:**
- Uses Sprite2D class if entity has sprite
- Falls back to geometric shapes for entities without sprites
- Applies opacity and rotation if specified
- Handles image loading states gracefully

### `renderEffects(position, size)`

**Parameters:**
- `position` (Object): Entity position {x, y}
- `size` (Object): Entity size {width, height}

Renders all active visual effects for the entity.

**Effect Rendering Process:**
1. Iterates through active effects in `this._effects` array
2. Applies effect-specific rendering based on type
3. Updates effect timers and removes expired effects
4. Handles particle systems for particle-based effects

### `renderHighlight(position, size)`

**Parameters:**
- `position` (Object): Entity position {x, y}
- `size` (Object): Entity size {width, height}

Renders highlight overlay if entity is highlighted.

**Highlight Styles:**

**Outline Style:**
```javascript
// Draws colored outline around entity
stroke(this._highlightColor);
strokeWeight(highlightType.strokeWeight);
noFill();
rect(position.x, position.y, size.width, size.height);
```

**Pulse Style:**
```javascript
// Animated pulsing outline
const pulseIntensity = sin(millis() * 0.005 + this._pulseOffset);
const alpha = map(pulseIntensity, -1, 1, 100, 255);
stroke(red(color), green(color), blue(color), alpha);
```

---

## Debug System

### `setDebugMode(enabled)`

**Parameters:**
- `enabled` (boolean): Whether to enable debug rendering

Enables or disables debug information display for this entity.

**Debug Information Displayed:**
- Entity position and size
- Current highlight state
- Active animations
- Active effects count
- Render call count
- Performance metrics

### `renderDebugInfo(position, size)`

**Parameters:**
- `position` (Object): Entity position {x, y}
- `size` (Object): Entity size {width, height}

Renders debug information overlay for the entity.

**Debug Display Elements:**
```javascript
// Bounding box
stroke(255, 0, 255); // Magenta
noFill();
rect(position.x, position.y, size.width, size.height);

// Center point
fill(255, 0, 255);
circle(position.x + size.width/2, position.y + size.height/2, 4);

// Debug text
fill(255);
text(`ID: ${this._entity.id || 'N/A'}`, position.x, position.y - 5);
text(`Pos: ${position.x.toFixed(1)}, ${position.y.toFixed(1)}`, position.x, position.y - 20);
text(`Renders: ${this._renderCallCount}`, position.x, position.y - 35);
```

---

## Animation Implementation Details

### Bob Animation

Creates vertical floating motion for entities.

**Implementation:**
```javascript
applyBobAnimation(position, options) {
  const time = millis() * 0.001 * options.frequency;
  const bobAmount = sin(time + this._bobOffset) * options.amplitude;
  position.y += bobAmount;
}
```

**Default Options:**
- `amplitude`: 3 pixels
- `frequency`: 1.0x speed

### Pulse Animation

Creates scaling animation for emphasis effects.

**Implementation:**
```javascript
applyPulseAnimation(size, options) {
  const time = millis() * 0.001 * options.frequency;
  const pulseAmount = sin(time + this._pulseOffset);
  const scale = map(pulseAmount, -1, 1, options.minScale, options.maxScale);
  size.width *= scale;
  size.height *= scale;
}
```

**Default Options:**
- `minScale`: 0.95
- `maxScale`: 1.05
- `frequency`: 1.5x speed

### Shake Animation

Creates random position offset for impact effects.

**Implementation:**
```javascript
applyShakeAnimation(position, options) {
  let intensity = options.intensity;
  
  if (options.decay) {
    const elapsed = millis() - this._animations.shake.startTime;
    const progress = elapsed / this._animations.shake.duration;
    intensity *= (1 - progress);
  }
  
  position.x += (Math.random() - 0.5) * intensity * 2;
  position.y += (Math.random() - 0.5) * intensity * 2;
}
```

**Default Options:**
- `intensity`: 2 pixels
- `decay`: true

### Rotate Animation

Creates continuous rotation effect.

**Implementation:**
```javascript
applyRotateAnimation(options) {
  const elapsed = millis() - this._animations.rotate.startTime;
  const rotationAmount = (elapsed / 1000) * options.speed;
  
  if (this._entity._sprite) {
    this._entity._sprite.rotation += options.clockwise ? rotationAmount : -rotationAmount;
  }
}
```

**Default Options:**
- `speed`: 45 degrees per second
- `clockwise`: true

---

## Performance Considerations

### Render Call Optimization

**Render Call Tracking:**
```javascript
// Performance monitoring
this._renderCallCount++; // Incremented each render

// Performance warning
if (this._renderCallCount > 1000 && this._renderCallCount % 100 === 0) {
  console.warn(`High render count for entity: ${this._renderCallCount}`);
}
```

### Animation Efficiency

**Shared Animation Offsets:**
- Bob and pulse animations use randomized offsets to prevent synchronization
- Reduces visual uniformity when multiple entities animate simultaneously
- Minimal performance impact with significant visual improvement

**Animation Cleanup:**
```javascript
// Automatic cleanup of expired animations
updateAnimations() {
  Object.keys(this._animations).forEach(type => {
    const animation = this._animations[type];
    if (millis() > animation.startTime + animation.duration) {
      delete this._animations[type];
    }
  });
}
```

### Effect System Optimization

**Effect Pooling:**
```javascript
// Reuse effect objects to reduce garbage collection
recycleEffect(effect) {
  effect.reset();
  this._effectPool.push(effect);
}

createEffect(type) {
  return this._effectPool.pop() || new Effect(type);
}
```

---

## Integration with EntityAccessor

The RenderController relies heavily on EntityAccessor for consistent entity property access:

**Position Access:**
```javascript
// Standardized position retrieval
const position = EntityAccessor.getPosition(this._entity);
// Handles: getPosition(), position, _sprite.pos, {x, y}, {posX, posY}
```

**Size Access:**
```javascript
// Standardized size retrieval  
const size = EntityAccessor.getSize(this._entity);
// Handles: getSize(), size, _sprite.size, {width, height}, {w, h}
```

**Benefits:**
- Eliminates duplicate accessor logic
- Provides consistent fallback chains
- Optimized property access across all entity types
- Automatic handling of different entity structure patterns

---

## TODO Enhancements

### Advanced Animation System
- **Timeline Animations**: Support for keyframe-based animations with easing curves
- **Animation Chaining**: Ability to chain multiple animations in sequence
- **Animation Events**: Callback system for animation start/end/milestone events
- **Physics-Based Animations**: Integration with physics engine for realistic motion

### Enhanced Effects System
- **Particle System**: Full particle system with emitters, physics, and collision
- **Shader Effects**: Support for custom fragment shaders for advanced visual effects
- **Trail Effects**: Motion trails for fast-moving entities
- **Screen-Space Effects**: Post-processing effects that affect the entire screen

### Performance Optimizations
- **Render Culling**: Skip rendering for entities outside viewport
- **Level-of-Detail**: Simplified rendering for distant entities
- **Batch Rendering**: Group similar entities for more efficient rendering
- **Animation LOD**: Reduce animation complexity based on distance/importance

### Debug Enhancements
- **Visual Profiler**: Real-time performance visualization for each entity
- **Animation Inspector**: Debug panel showing all active animations and their states
- **Effect Inspector**: Visualization of active effects and their parameters
- **Render Statistics**: Detailed metrics about rendering performance per entity type

---

## Error Handling

### Entity Validation
```javascript
render() {
  if (!this._entity) {
    console.warn('RenderController: No entity attached');
    return;
  }
  
  // Continue with rendering...
}
```

### Effect System Error Handling
```javascript
addEffect(effectType, options) {
  try {
    const effect = new Effect(effectType, options);
    this._effects.push(effect);
  } catch (error) {
    console.error(`Failed to create effect ${effectType}:`, error);
  }
}
```

### Animation Error Recovery
```javascript
applyAnimations(position, size) {
  Object.keys(this._animations).forEach(type => {
    try {
      this[`apply${type}Animation`](position, size, this._animations[type]);
    } catch (error) {
      console.error(`Animation error for ${type}:`, error);
      delete this._animations[type]; // Remove problematic animation
    }
  });
}
```

---

## Usage Examples

### Basic Entity Highlighting
```javascript
// In entity selection system
function selectEntity(entity) {
  entity.renderController.setHighlight('SELECTED');
}

function deselectEntity(entity) {
  entity.renderController.clearHighlight();
}
```

### Combat Visual Feedback
```javascript
// When entity takes damage
function onEntityDamage(entity, damage) {
  entity.renderController.addEffect('damage', {
    color: [255, 0, 0],
    duration: 800
  });
  entity.renderController.startAnimation('shake', 300, {
    intensity: damage * 0.1
  });
}
```

### Interactive Hover Effects
```javascript
// Mouse hover system
function onEntityHover(entity) {
  entity.renderController.setHighlight('HOVER', 0.7);
  entity.renderController.startAnimation('bob', 2000, {
    amplitude: 2,
    frequency: 1.5
  });
}

function onEntityHoverEnd(entity) {
  entity.renderController.clearHighlight();
  entity.renderController.stopAnimation('bob');
}
```

### Debug Mode Integration
```javascript
// Global debug toggle
function toggleEntityDebugMode(enabled) {
  entities.forEach(entity => {
    if (entity.renderController) {
      entity.renderController.setDebugMode(enabled);
    }
  });
}
```

---

## See Also

- **[EntityAccessor API Documentation](EntityAccessor.md)** - Standardized entity property access
- **[EntityLayerRenderer API Documentation](EntityLayerRenderer.md)** - Entity layer rendering system
- **[PerformanceMonitor API Documentation](PerformanceMonitor.md)** - Performance tracking integration
- **[Sprite2D API Documentation](Sprite2D.md)** - 2D sprite rendering system