# Render Effects System Enhancement Checklist

**Status**: In Progress  
**Priority**: HIGH  
**Estimated Time**: 6-8 hours  
**Type**: Feature Enhancement  

---

## Overview

Enhance the WorldService Render API to support advanced visual effects including:
- Screen flash effects (damage, powerups)
- Particle systems (explosions, trails, ambient)
- Positional effects (arrows, markers, indicators)
- Lighting effects (fire glow, shadows, ambient light)
- Debug overlays and visualization

**User Stories**:
1. As a player, I want visual feedback when events occur (damage flash, explosions) so I can understand game state
2. As a player, I want directional indicators (arrows pointing to enemies) so I can navigate more easily
3. As a developer, I want to spawn effects at positions programmatically so I can enhance game feel
4. As a player, I want lighting effects around fire/buildings so the game feels more immersive
5. As a developer, I want debug visualizations (collision boxes, paths) so I can troubleshoot issues

**Key Design Decisions**:
- **Effect System Architecture**: Pool-based particle system for performance (reuse objects, no GC pressure)
- **Render Pipeline Integration**: Effects render between entities and UI (TERRAIN → ENTITIES → EFFECTS → UI)
- **Coordinate System**: Effects use world coordinates, transformed by camera automatically
- **Effect Lifecycle**: Auto-cleanup when `isActive = false`, manual removal also supported
- **Performance**: Frustum culling for off-screen effects, max particle limits, sprite batching

---

## Phase 1: Core Render API Tests (Step A)

**Goal**: Get existing 8 Render API tests passing, establish rendering foundation

### A1: Terrain Rendering ✅
- [ ] **Write test**: Verify `mockTerrain.render()` called during `world.render()`
- [ ] **Implement**: Ensure `_renderTerrain()` delegates to terrain object
- [ ] **Run test**: Confirm terrain rendering works

### A2: Entity Depth Sorting (Y-Sort) ✅
- [ ] **Write test**: Create entities at different Y positions, verify render order
- [ ] **Implement**: Enable depth sorting in `_renderEntities()` (sort by Y-axis)
- [ ] **Run test**: Confirm entities render back-to-front

### A3: Skip Inactive Entities ✅
- [ ] **Write test**: Set `entity.isActive = false`, verify render not called
- [ ] **Implement**: Filter inactive entities in `_renderEntities()`
- [ ] **Run test**: Confirm inactive entities skipped

### A4: Frustum Culling ✅
- [ ] **Write test**: Create entities outside camera bounds, verify not rendered
- [ ] **Implement**: Check entity bounds against camera viewport before rendering
- [ ] **Run test**: Confirm off-screen entities culled
- [ ] **Algorithm**: 
  ```javascript
  const bounds = getCameraBounds();
  const pos = entity.getPosition();
  const size = entity.getSize ? entity.getSize() : { width: 32, height: 32 };
  const inView = (pos.x + size.width/2 > bounds.minX && 
                  pos.x - size.width/2 < bounds.maxX &&
                  pos.y + size.height/2 > bounds.minY &&
                  pos.y - size.height/2 < bounds.maxY);
  if (!inView) continue; // Skip rendering
  ```

### A5: Camera Transform Application ✅
- [ ] **Write test**: Set camera position/zoom, verify `translate()` and `scale()` called
- [ ] **Implement**: Apply camera transforms before entity rendering
- [ ] **Run test**: Confirm transforms applied correctly
- [ ] **Algorithm**:
  ```javascript
  push();
  translate(-camera.x + width/2, -camera.y + height/2);
  scale(camera.zoom, camera.zoom);
  // ... render entities here ...
  pop();
  ```

### A6: HUD Layer Ordering ✅
- [ ] **Write test**: Verify HUD renders after entities (using Sinon call order)
- [ ] **Implement**: Call `_renderHUD()` after `_renderEntities()`
- [ ] **Run test**: Confirm correct layer order

### A7: Render Error Handling ✅
- [ ] **Write test**: Entity throws error in render(), verify other entities still render
- [ ] **Implement**: Wrap entity render calls in try-catch
- [ ] **Run test**: Confirm graceful error handling
- [ ] **Algorithm**:
  ```javascript
  for (const entity of entities) {
    try {
      if (entity.render) entity.render();
    } catch (error) {
      console.error('Entity render failed:', error);
      // Continue rendering other entities
    }
  }
  ```

### A8: Debug Overlay Rendering ✅
- [ ] **Write test**: Enable debug rendering, verify debug renderer called
- [ ] **Implement**: Call debug renderer after HUD if enabled
- [ ] **Run test**: Confirm debug overlays appear

**Deliverables**: 8/8 Render API tests passing, solid rendering foundation

---

## Phase 2: Screen Flash Effects (Step B)

**Goal**: Implement full-screen color flash effects (damage, powerups, transitions)

### B1: Flash Effect Data Structure
- [ ] **Write test**: Create flash effect, verify properties (color, duration, intensity)
- [ ] **Implement**: `FlashEffect` class with fade-in/fade-out curves
- [ ] **Run test**: Confirm flash properties work
- [ ] **Data Structure**:
  ```javascript
  class FlashEffect {
    constructor(color, duration, curve = 'easeOut') {
      this.color = color; // [r, g, b, a]
      this.duration = duration; // milliseconds
      this.curve = curve; // 'linear', 'easeIn', 'easeOut', 'easeBoth'
      this.startTime = Date.now();
      this.isActive = true;
    }
    
    getAlpha() {
      const elapsed = Date.now() - this.startTime;
      const t = Math.min(elapsed / this.duration, 1.0);
      return this._applyCurve(1.0 - t) * this.color[3];
    }
    
    _applyCurve(t) {
      switch(this.curve) {
        case 'easeOut': return 1 - Math.pow(1 - t, 3);
        case 'easeIn': return Math.pow(t, 3);
        case 'easeBoth': return t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
        default: return t;
      }
    }
    
    render() {
      const alpha = this.getAlpha();
      if (alpha <= 0) {
        this.isActive = false;
        return;
      }
      
      push();
      fill(this.color[0], this.color[1], this.color[2], alpha);
      noStroke();
      rect(0, 0, width, height);
      pop();
    }
  }
  ```

### B2: Flash Effect API
- [ ] **Write test**: Call `world.flashScreen(color, duration)`, verify flash appears
- [ ] **Implement**: Add `flashScreen()` method to WorldService
- [ ] **Run test**: Confirm API works
- [ ] **Unit tests**:
  ```javascript
  it('should create screen flash with correct color', function() {
    world.flashScreen([255, 0, 0, 150], 500); // Red flash, 500ms
    expect(world._activeEffects).to.have.lengthOf(1);
    expect(world._activeEffects[0].color).to.deep.equal([255, 0, 0, 150]);
  });
  
  it('should fade out flash over duration', function() {
    const flash = world.flashScreen([255, 0, 0, 150], 1000);
    expect(flash.getAlpha()).to.be.closeTo(150, 5); // Start
    
    // Simulate time passing
    flash.startTime = Date.now() - 500;
    expect(flash.getAlpha()).to.be.lessThan(150); // Fading
    
    flash.startTime = Date.now() - 1000;
    expect(flash.getAlpha()).to.equal(0); // Done
  });
  
  it('should deactivate flash after duration', function() {
    const flash = world.flashScreen([255, 255, 255, 200], 100);
    flash.startTime = Date.now() - 200; // Past duration
    flash.render(); // Trigger update
    expect(flash.isActive).to.be.false;
  });
  ```

### B3: Preset Flash Effects
- [ ] **Write test**: Call `world.flashDamage()`, verify red flash
- [ ] **Write test**: Call `world.flashHeal()`, verify green flash
- [ ] **Write test**: Call `world.flashWarning()`, verify yellow flash
- [ ] **Implement**: Convenience methods with preset colors
- [ ] **Run tests**: Confirm all presets work
- [ ] **API**:
  ```javascript
  flashDamage(intensity = 0.5) {
    return this.flashScreen([255, 0, 0, intensity * 255], 300);
  }
  
  flashHeal(intensity = 0.3) {
    return this.flashScreen([0, 255, 100, intensity * 255], 400);
  }
  
  flashWarning(intensity = 0.4) {
    return this.flashScreen([255, 255, 0, intensity * 255], 200);
  }
  ```

**Deliverables**: Screen flash system working, 12+ unit tests passing

---

## Phase 3: Particle System (Step C)

**Goal**: Implement pooled particle system for explosions, trails, ambient effects

### C1: Particle Class
- [ ] **Write test**: Create particle with position, velocity, lifetime
- [ ] **Implement**: `Particle` class with physics update
- [ ] **Run test**: Confirm particle updates correctly
- [ ] **Data Structure**:
  ```javascript
  class Particle {
    constructor(x, y, vx, vy, lifetime, options = {}) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.lifetime = lifetime; // milliseconds
      this.age = 0;
      this.color = options.color || [255, 255, 255];
      this.size = options.size || 4;
      this.gravity = options.gravity || 0;
      this.drag = options.drag || 0.98;
      this.alpha = options.alpha || 255;
      this.isActive = true;
    }
    
    update(dt) {
      this.age += dt;
      if (this.age >= this.lifetime) {
        this.isActive = false;
        return;
      }
      
      this.vy += this.gravity * dt / 16;
      this.vx *= this.drag;
      this.vy *= this.drag;
      
      this.x += this.vx * dt / 16;
      this.y += this.vy * dt / 16;
    }
    
    render() {
      const t = this.age / this.lifetime;
      const fadeAlpha = this.alpha * (1 - t);
      
      push();
      fill(this.color[0], this.color[1], this.color[2], fadeAlpha);
      noStroke();
      ellipse(this.x, this.y, this.size, this.size);
      pop();
    }
  }
  ```

### C2: Particle Pool
- [ ] **Write test**: Create particle pool, verify reuse (no new allocations)
- [ ] **Implement**: Object pool with get/release methods
- [ ] **Run test**: Confirm pool prevents GC pressure
- [ ] **Algorithm**:
  ```javascript
  class ParticlePool {
    constructor(maxParticles = 1000) {
      this.pool = [];
      this.active = [];
      this.maxParticles = maxParticles;
      
      // Pre-allocate particles
      for (let i = 0; i < maxParticles; i++) {
        this.pool.push(new Particle(0, 0, 0, 0, 0));
      }
    }
    
    get(x, y, vx, vy, lifetime, options) {
      let particle = this.pool.pop();
      if (!particle) return null; // Pool exhausted
      
      // Reinitialize
      particle.x = x;
      particle.y = y;
      particle.vx = vx;
      particle.vy = vy;
      particle.lifetime = lifetime;
      particle.age = 0;
      particle.isActive = true;
      Object.assign(particle, options);
      
      this.active.push(particle);
      return particle;
    }
    
    release(particle) {
      const idx = this.active.indexOf(particle);
      if (idx >= 0) {
        this.active.splice(idx, 1);
        this.pool.push(particle);
      }
    }
    
    update(dt) {
      for (let i = this.active.length - 1; i >= 0; i--) {
        const p = this.active[i];
        p.update(dt);
        if (!p.isActive) {
          this.release(p);
        }
      }
    }
    
    render() {
      for (const p of this.active) {
        p.render();
      }
    }
  }
  ```

### C3: Particle Emitter API
- [ ] **Write test**: Call `world.spawnParticles(x, y, count, options)`, verify particles created
- [ ] **Implement**: Particle spawning methods in WorldService
- [ ] **Run test**: Confirm particles spawn correctly
- [ ] **Unit tests**:
  ```javascript
  it('should spawn particles at position', function() {
    const count = world._particlePool.active.length;
    world.spawnParticles(100, 100, 10, { color: [255, 0, 0] });
    expect(world._particlePool.active.length).to.equal(count + 10);
  });
  
  it('should not exceed particle pool max', function() {
    world.spawnParticles(100, 100, 2000, {}); // Try to spawn 2000
    expect(world._particlePool.active.length).to.be.at.most(1000); // Capped
  });
  
  it('should clean up inactive particles', function() {
    world.spawnParticles(100, 100, 5, { lifetime: 10 }); // 10ms lifetime
    
    // Wait for expiration
    setTimeout(() => {
      world.update(50); // Trigger cleanup
      expect(world._particlePool.active.length).to.equal(0);
    }, 50);
  });
  ```

### C4: Preset Particle Effects
- [ ] **Write test**: Call `world.spawnExplosion(x, y, size)`, verify particles
- [ ] **Write test**: Call `world.spawnTrail(x, y, direction)`, verify trail
- [ ] **Write test**: Call `world.spawnDust(x, y)`, verify dust cloud
- [ ] **Implement**: Convenience particle spawners
- [ ] **Run tests**: Confirm all presets work
- [ ] **API**:
  ```javascript
  spawnExplosion(x, y, size = 1.0) {
    const count = Math.floor(20 * size);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.spawnParticles(x, y, 1, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        lifetime: 500 + Math.random() * 500,
        color: [255, 150 + Math.random() * 105, 0],
        size: 4 + Math.random() * 4,
        gravity: 0.2
      });
    }
  }
  
  spawnTrail(x, y, directionX, directionY) {
    this.spawnParticles(x, y, 3, {
      vx: directionX * -0.5,
      vy: directionY * -0.5,
      lifetime: 300,
      color: [200, 200, 255],
      size: 3,
      drag: 0.95
    });
  }
  
  spawnDust(x, y) {
    this.spawnParticles(x, y, 8, {
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2,
      lifetime: 800,
      color: [180, 160, 140],
      size: 2,
      gravity: 0.1,
      drag: 0.98
    });
  }
  ```

**Deliverables**: Particle system working, 15+ unit tests passing, no GC pressure

---

## Phase 4: Positional Effects (Arrows & Markers) (Step D)

**Goal**: Implement reusable positional effects (arrows, indicators, markers)

### D1: Arrow Effect Class
- [ ] **Write test**: Create arrow pointing to target, verify position/rotation
- [ ] **Implement**: `ArrowEffect` class with target tracking
- [ ] **Run test**: Confirm arrow points correctly
- [ ] **Data Structure**:
  ```javascript
  class ArrowEffect {
    constructor(x, y, targetEntity, options = {}) {
      this.x = x;
      this.y = y;
      this.targetEntity = targetEntity;
      this.offset = options.offset || { x: 0, y: -40 }; // Above entity
      this.color = options.color || [255, 255, 0];
      this.size = options.size || 20;
      this.bobSpeed = options.bobSpeed || 2.0;
      this.bobAmount = options.bobAmount || 8;
      this.startTime = Date.now();
      this.isActive = true;
      this.duration = options.duration || Infinity; // Can be temporary
    }
    
    update(dt) {
      if (this.duration !== Infinity) {
        const elapsed = Date.now() - this.startTime;
        if (elapsed > this.duration) {
          this.isActive = false;
          return;
        }
      }
      
      // Track target position
      if (this.targetEntity) {
        const pos = this.targetEntity.getPosition ? 
                    this.targetEntity.getPosition() : 
                    this.targetEntity.position;
        if (pos) {
          this.x = pos.x + this.offset.x;
          this.y = pos.y + this.offset.y;
        } else {
          this.isActive = false; // Target lost
        }
      }
    }
    
    render() {
      const elapsed = Date.now() - this.startTime;
      const bob = Math.sin(elapsed / 1000 * this.bobSpeed * Math.PI * 2) * this.bobAmount;
      
      push();
      translate(this.x, this.y + bob);
      fill(this.color[0], this.color[1], this.color[2]);
      stroke(0);
      strokeWeight(2);
      
      // Draw arrow pointing down
      triangle(-this.size/2, 0, this.size/2, 0, 0, this.size);
      
      pop();
    }
  }
  ```

### D2: Screen-Edge Arrow (Pointing to Off-Screen Targets)
- [ ] **Write test**: Create off-screen entity, verify edge arrow appears
- [ ] **Implement**: `EdgeArrowEffect` class that clamps to screen bounds
- [ ] **Run test**: Confirm edge arrows work
- [ ] **Algorithm**:
  ```javascript
  class EdgeArrowEffect {
    constructor(targetEntity, options = {}) {
      this.targetEntity = targetEntity;
      this.color = options.color || [255, 0, 0];
      this.size = options.size || 30;
      this.margin = options.margin || 20; // Pixels from edge
      this.isActive = true;
    }
    
    update(dt) {
      if (!this.targetEntity) {
        this.isActive = false;
        return;
      }
      
      const pos = this.targetEntity.getPosition ? 
                  this.targetEntity.getPosition() : 
                  this.targetEntity.position;
      if (!pos) {
        this.isActive = false;
        return;
      }
      
      // Check if target is off-screen
      const bounds = getCameraBounds();
      this.offScreen = (pos.x < bounds.minX || pos.x > bounds.maxX ||
                        pos.y < bounds.minY || pos.y > bounds.maxY);
    }
    
    render() {
      if (!this.offScreen) return; // Only show for off-screen targets
      
      const pos = this.targetEntity.getPosition ? 
                  this.targetEntity.getPosition() : 
                  this.targetEntity.position;
      const screenPos = worldToScreen(pos.x, pos.y);
      
      // Clamp to screen edges with margin
      const clampedX = Math.max(this.margin, Math.min(width - this.margin, screenPos.x));
      const clampedY = Math.max(this.margin, Math.min(height - this.margin, screenPos.y));
      
      // Calculate angle to target
      const angle = Math.atan2(screenPos.y - clampedY, screenPos.x - clampedX);
      
      push();
      translate(clampedX, clampedY);
      rotate(angle);
      fill(this.color[0], this.color[1], this.color[2]);
      stroke(0);
      strokeWeight(2);
      
      // Draw arrow pointing toward target
      triangle(-this.size/2, -this.size/4, -this.size/2, this.size/4, this.size/2, 0);
      
      pop();
    }
  }
  ```

### D3: Marker Effect (Floating Icon/Symbol)
- [ ] **Write test**: Create marker at position, verify rendering
- [ ] **Implement**: `MarkerEffect` class for general-purpose markers
- [ ] **Run test**: Confirm markers work
- [ ] **Data Structure**:
  ```javascript
  class MarkerEffect {
    constructor(x, y, icon, options = {}) {
      this.x = x;
      this.y = y;
      this.icon = icon; // 'exclamation', 'question', 'star', 'skull', etc.
      this.color = options.color || [255, 255, 0];
      this.size = options.size || 16;
      this.duration = options.duration || Infinity;
      this.bob = options.bob !== false; // Default true
      this.startTime = Date.now();
      this.isActive = true;
    }
    
    update(dt) {
      if (this.duration !== Infinity) {
        const elapsed = Date.now() - this.startTime;
        if (elapsed > this.duration) {
          this.isActive = false;
        }
      }
    }
    
    render() {
      const elapsed = Date.now() - this.startTime;
      const bobOffset = this.bob ? Math.sin(elapsed / 500 * Math.PI) * 5 : 0;
      
      push();
      translate(this.x, this.y + bobOffset);
      fill(this.color[0], this.color[1], this.color[2]);
      stroke(0);
      strokeWeight(2);
      textAlign(CENTER, CENTER);
      textSize(this.size);
      
      // Draw icon glyph
      switch(this.icon) {
        case 'exclamation': text('!', 0, 0); break;
        case 'question': text('?', 0, 0); break;
        case 'star': text('★', 0, 0); break;
        case 'skull': text('☠', 0, 0); break;
        default: text(this.icon, 0, 0);
      }
      
      pop();
    }
  }
  ```

### D4: Effect Management API
- [ ] **Write test**: Call `world.addEffect(effect)`, verify it renders
- [ ] **Write test**: Call `world.removeEffect(effect)`, verify removal
- [ ] **Write test**: Call `world.clearEffects()`, verify all removed
- [ ] **Implement**: Effect management methods
- [ ] **Run tests**: Confirm effect lifecycle works
- [ ] **Unit tests**:
  ```javascript
  it('should add effect to active effects', function() {
    const arrow = new ArrowEffect(100, 100, targetEntity);
    world.addEffect(arrow);
    expect(world._activeEffects).to.include(arrow);
  });
  
  it('should remove effect by reference', function() {
    const marker = new MarkerEffect(200, 200, 'exclamation');
    world.addEffect(marker);
    world.removeEffect(marker);
    expect(world._activeEffects).to.not.include(marker);
  });
  
  it('should auto-remove inactive effects during render', function() {
    const effect = new MarkerEffect(100, 100, 'star', { duration: 10 });
    world.addEffect(effect);
    
    // Simulate time passing
    effect.startTime = Date.now() - 20;
    world.render(); // Should trigger cleanup
    
    expect(world._activeEffects).to.not.include(effect);
  });
  ```

**Deliverables**: Positional effects system working, 15+ unit tests passing

---

## Phase 5: Lighting Effects (Step E)

**Goal**: Implement basic lighting (glow, shadows, ambient)

### E1: Radial Glow Effect
- [ ] **Write test**: Create glow at position, verify radial gradient
- [ ] **Implement**: `GlowEffect` class with radial gradient rendering
- [ ] **Run test**: Confirm glow appears correctly
- [ ] **Data Structure**:
  ```javascript
  class GlowEffect {
    constructor(x, y, radius, options = {}) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = options.color || [255, 200, 100]; // Warm fire color
      this.intensity = options.intensity || 0.5;
      this.flicker = options.flicker !== false; // Default true
      this.flickerSpeed = options.flickerSpeed || 5.0;
      this.isActive = true;
    }
    
    update(dt) {
      // Update handled in render (time-based)
    }
    
    render() {
      const flickerAmount = this.flicker ? 
        Math.sin(Date.now() / 1000 * this.flickerSpeed * Math.PI) * 0.2 + 0.8 : 
        1.0;
      
      const currentRadius = this.radius * flickerAmount;
      const currentAlpha = this.intensity * 255 * flickerAmount;
      
      push();
      
      // Create radial gradient effect using concentric circles
      noStroke();
      for (let r = currentRadius; r > 0; r -= 5) {
        const alpha = currentAlpha * (1 - r / currentRadius);
        fill(this.color[0], this.color[1], this.color[2], alpha);
        ellipse(this.x, this.y, r * 2, r * 2);
      }
      
      pop();
    }
  }
  ```

### E2: Attached Lighting (Fire on Buildings)
- [ ] **Write test**: Attach glow to entity, verify it follows position
- [ ] **Implement**: `AttachedGlowEffect` that tracks entity position
- [ ] **Run test**: Confirm attached glow moves with entity
- [ ] **Algorithm**:
  ```javascript
  class AttachedGlowEffect extends GlowEffect {
    constructor(entity, radius, options = {}) {
      const pos = entity.getPosition ? entity.getPosition() : entity.position;
      super(pos.x, pos.y, radius, options);
      this.entity = entity;
      this.offset = options.offset || { x: 0, y: 0 };
    }
    
    update(dt) {
      if (!this.entity) {
        this.isActive = false;
        return;
      }
      
      const pos = this.entity.getPosition ? 
                  this.entity.getPosition() : 
                  this.entity.position;
      if (!pos) {
        this.isActive = false;
        return;
      }
      
      this.x = pos.x + this.offset.x;
      this.y = pos.y + this.offset.y;
    }
  }
  ```

### E3: Ambient Lighting Layer
- [ ] **Write test**: Set ambient light color/intensity, verify rendering
- [ ] **Implement**: Ambient light overlay in render pipeline
- [ ] **Run test**: Confirm ambient lighting works
- [ ] **Algorithm**:
  ```javascript
  _renderAmbientLight() {
    if (!this._ambientLight.enabled) return;
    
    push();
    blendMode(MULTIPLY); // Darken blend mode
    fill(
      this._ambientLight.color[0],
      this._ambientLight.color[1],
      this._ambientLight.color[2],
      (1 - this._ambientLight.intensity) * 255
    );
    rect(0, 0, width, height);
    pop();
  }
  ```

### E4: Lighting API
- [ ] **Write test**: Call `world.addGlow(x, y, radius, options)`, verify glow
- [ ] **Write test**: Call `world.attachGlow(entity, radius, options)`, verify attached glow
- [ ] **Write test**: Call `world.setAmbientLight(color, intensity)`, verify ambient
- [ ] **Implement**: Lighting convenience methods
- [ ] **Run tests**: Confirm all lighting APIs work
- [ ] **Unit tests**:
  ```javascript
  it('should create glow effect at position', function() {
    const glow = world.addGlow(300, 300, 50, { color: [255, 100, 0] });
    expect(glow).to.be.instanceOf(GlowEffect);
    expect(world._activeEffects).to.include(glow);
  });
  
  it('should attach glow to entity', function() {
    const building = world.spawnEntity('Building', { x: 400, y: 400 });
    const glow = world.attachGlow(building, 60, { color: [255, 200, 100] });
    
    // Move entity
    building.position.x = 500;
    glow.update(16);
    
    expect(glow.x).to.equal(500);
  });
  
  it('should set ambient light properties', function() {
    world.setAmbientLight([50, 50, 80], 0.7);
    expect(world._ambientLight.color).to.deep.equal([50, 50, 80]);
    expect(world._ambientLight.intensity).to.equal(0.7);
  });
  ```

**Deliverables**: Lighting system working, 12+ unit tests passing

---

## Phase 6: Integration & Polish (Step F)

**Goal**: Integrate all effects into render pipeline, optimize performance

### F1: Render Pipeline Integration
- [ ] **Write test**: Call `world.render()`, verify all effect layers render in order
- [ ] **Implement**: Update `render()` to call effect renderers
- [ ] **Run test**: Confirm correct layer ordering
- [ ] **Layer Order**:
  ```javascript
  render() {
    this._renderTerrain();        // Layer 1
    this._renderAmbientLight();   // Layer 2 (darken/lighten)
    this._renderEntities();       // Layer 3 (with camera transforms)
    this._renderGlowEffects();    // Layer 4 (additive blend)
    this._renderParticles();      // Layer 5
    this._renderPositionalEffects(); // Layer 6 (arrows, markers)
    this._renderFlashEffects();   // Layer 7 (screen-space, no camera transform)
    this._renderPanels();         // Layer 8 (UI)
    this._renderHUD();            // Layer 9 (UI)
    if (this._debugRenderEnabled) {
      this._renderDebug();        // Layer 10 (debug overlays)
    }
  }
  ```

### F2: Performance Optimization
- [ ] **Write test**: Spawn 1000 particles, verify FPS stays > 30
- [ ] **Implement**: Frustum culling for particles and effects
- [ ] **Run test**: Confirm performance acceptable
- [ ] **Optimizations**:
  - Particle pool prevents GC pressure
  - Frustum culling skips off-screen particles
  - Effect limits (max 100 active glows, 1000 particles)
  - Sprite batching for particles (if using p5.Graphics)

### F3: Effect Presets & Convenience API
- [ ] **Write test**: Call convenience methods, verify correct effects
- [ ] **Implement**: High-level effect spawners
- [ ] **Run tests**: Confirm all presets work
- [ ] **API Summary**:
  ```javascript
  // Flash effects
  world.flashDamage(intensity);
  world.flashHeal(intensity);
  world.flashWarning(intensity);
  world.flashScreen(color, duration, curve);
  
  // Particle effects
  world.spawnExplosion(x, y, size);
  world.spawnTrail(x, y, directionX, directionY);
  world.spawnDust(x, y);
  world.spawnParticles(x, y, count, options);
  
  // Positional effects
  world.addArrow(x, y, targetEntity, options);
  world.addEdgeArrow(targetEntity, options);
  world.addMarker(x, y, icon, options);
  
  // Lighting effects
  world.addGlow(x, y, radius, options);
  world.attachGlow(entity, radius, options);
  world.setAmbientLight(color, intensity);
  
  // Effect management
  world.addEffect(effect);
  world.removeEffect(effect);
  world.clearEffects(type); // Clear specific type or all
  ```

### F4: Documentation
- [ ] Write API reference doc: `docs/api/RenderEffects_API_Reference.md`
- [ ] Update WorldService roadmap with effects system
- [ ] Add usage examples to `docs/guides/RENDER_EFFECTS_GUIDE.md`
- [ ] Update CHANGELOG.md with new features

**Deliverables**: Full effects system integrated, 60+ total unit tests passing

---

## Testing Strategy

### Unit Tests (Write FIRST)
- Effect class constructors and properties
- Update logic (position tracking, lifetime, physics)
- Render method calls (verify called, not visual output)
- Pool management (get/release, no allocation after warmup)
- API methods (spawn, add, remove, clear)
- Error handling (invalid inputs, missing entities)

### Integration Tests
- Effect lifecycle (spawn → update → render → cleanup)
- Multiple effects rendering simultaneously
- Camera transforms applied to world-space effects
- Effect interactions (particles + glow + flash together)
- Performance under load (1000+ particles)

### BDD Tests (Cucumber/Selenium)
- Player sees damage flash when ant takes damage
- Explosion particles appear when building destroyed
- Arrow appears pointing to off-screen enemy
- Fire glow appears around fire building
- Debug overlays toggle on/off with hotkey

**Test Coverage Target**: >85% for effect classes

---

## Implementation Notes

**Algorithm: Particle Pool Performance**
- Pre-allocate 1000 particles on initialization
- Reuse particles via get/release (no `new` calls during gameplay)
- O(1) get/release using array operations
- Benchmark: Should handle 1000 active particles at 60 FPS

**Algorithm: Frustum Culling**
```javascript
function isInView(x, y, margin = 50) {
  const bounds = getCameraBounds();
  return (x > bounds.minX - margin && 
          x < bounds.maxX + margin &&
          y > bounds.minY - margin && 
          y < bounds.maxY + margin);
}
```

**Algorithm: Easing Functions**
```javascript
const EASING = {
  linear: t => t,
  easeIn: t => t * t * t,
  easeOut: t => 1 - Math.pow(1 - t, 3),
  easeBoth: t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2,
  bounce: t => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1/d1) return n1*t*t;
    if (t < 2/d1) return n1*(t-=1.5/d1)*t + 0.75;
    if (t < 2.5/d1) return n1*(t-=2.25/d1)*t + 0.9375;
    return n1*(t-=2.625/d1)*t + 0.984375;
  }
};
```

---

## Related Documentation

- `docs/api/WorldService_API_Reference.md` - Main WorldService API
- `docs/guides/RENDERING_PIPELINE.md` - Render layer architecture
- `docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md` - TDD approach
- `docs/roadmaps/MVC_REFACTORING_ROADMAP.md` - MVC pattern context

---

## Progress Tracking

**Phase 1**: ⏳ In Progress (0/8 tests passing)  
**Phase 2**: ⏭️ Not Started  
**Phase 3**: ⏭️ Not Started  
**Phase 4**: ⏭️ Not Started  
**Phase 5**: ⏭️ Not Started  
**Phase 6**: ⏭️ Not Started  

**Overall**: 0% complete

---

## Notes

- Screen flash effects are screen-space (no camera transform)
- Particles and glows are world-space (camera transforms applied)
- Edge arrows are screen-space (UI layer)
- Markers and entity arrows are world-space
- All effects support frustum culling for performance
- Particle pool prevents GC pressure during gameplay
- Effect limits prevent memory/performance issues
