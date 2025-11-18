# Ant MVC Sprite & Animation System Guide

**Date**: November 18, 2025  
**Topic**: How sprites and animations work in the ant MVC pattern  
**Systems**: EntityView, Sprite2D, AnimationManager

---

## Overview

The ant MVC system handles sprites and animations through **three layers of abstraction**:

1. **Sprite2D** - Low-level sprite rendering (position, rotation, image)
2. **EntityView** - Base view class that renders sprites (MVC View layer)
3. **AntView** - Ant-specific rendering (extends EntityView)

**Animation** is handled by the **global AnimationManager** instance, which modifies sprite images on the fly.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AntController                            │
│  (Orchestration - triggers animations via AnimationManager) │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ delegates rendering
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      AntView                                │
│   (Presentation - calls parent render for sprite)          │
└─────────────────────┬───────────────────────────────────────┘
                      │ extends
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    EntityView                               │
│  (Base rendering - syncs sprite position, calls render)    │
└─────────────────────┬───────────────────────────────────────┘
                      │ manages
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  EntityModel.sprite (Sprite2D instance)                     │
│   - Stores current image (p5.Image)                         │
│   - Position, size, rotation                                │
│   - Rendering logic (push/pop/translate/rotate)            │
└─────────────────────────────────────────────────────────────┘
                      ▲
                      │ modifies image
                      │
┌─────────────────────────────────────────────────────────────┐
│           Global AnimationManager                           │
│   - Sprite sheet loading                                    │
│   - Frame extraction                                        │
│   - Frame cycling (Walking, Attack, etc.)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Sprite2D (Low-Level Rendering)

**Location**: `Classes/rendering/Sprite2d.js`

**Purpose**: Renders a single image at a position with rotation/flipping

**Key Properties**:
```javascript
{
  img: p5.Image,           // Current image to render
  pos: p5.Vector,          // Position in world coordinates
  size: p5.Vector,         // Width/height
  rotation: number,        // Rotation in degrees
  flipX: boolean,          // Horizontal flip
  flipY: boolean,          // Vertical flip
  alpha: number            // Opacity (0-255)
}
```

**Key Methods**:
- `setImage(img)` - Change the displayed image
- `setPosition(pos)` - Update position
- `setSize(size)` - Update size
- `setOpacity(alpha)` - Set transparency
- `render()` - **Draw the sprite to canvas**

**Rendering Process** (inside `render()`):
```javascript
// 1. Convert world coords to screen coords (terrain system)
const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);

// 2. Apply transformations
push();
imageMode(CENTER);
translate(screenX, screenY);
scale(flipX ? -1 : 1, flipY ? -1 : 1);
rotate(radians(rotation));

// 3. Apply opacity
if (alpha < 255) tint(255, alpha);

// 4. Draw image
image(img, 0, 0, size.x, size.y);
pop();
```

**Critical**: Sprite2D is **data + rendering**, NOT pure presentation. It violates MVC but is a legacy system component.

---

### 2. EntityModel (Sprite Storage)

**Location**: `Classes/mvc/models/EntityModel.js`

**Purpose**: Stores reference to Sprite2D instance

**Sprite Properties**:
```javascript
{
  sprite: Sprite2D | null,      // Sprite instance
  imagePath: string | null      // Path to image file
}
```

**Key Methods**:
```javascript
getSprite()           // Get sprite reference
setSprite(sprite)     // Set sprite reference (data only)
```

**Important**: Model stores sprite **reference only**, does NOT call sprite methods (violates MVC if it did).

---

### 3. EntityView (Sprite Rendering)

**Location**: `Classes/mvc/views/EntityView.js`

**Purpose**: Renders the sprite stored in model

**Rendering Flow**:
```javascript
render() {
  // 1. Check if active/visible
  if (!model.isActive || !model.visible) return;

  // 2. Apply opacity
  this.applyOpacity(); // Sets sprite.alpha from model.opacity

  // 3. Sync sprite with model position/size
  this._syncSpritePosition();

  // 4. Render sprite
  if (model.sprite) {
    push();
    noSmooth();
    model.sprite.render(); // Calls Sprite2D.render()
    smooth();
    pop();
  } else {
    // Fallback rectangle if no sprite
    this._renderFallback();
  }
}
```

**Key Method - Sprite Sync**:
```javascript
_syncSpritePosition() {
  const pos = model.getPosition();
  const size = model.getSize();
  
  // Update sprite properties from model
  model.sprite.pos.x = pos.x;
  model.sprite.pos.y = pos.y;
  model.sprite.size.x = size.x;
  model.sprite.size.y = size.y;
}
```

**Why Sync?**: Model position/size may change (via controller), sprite needs to reflect those changes.

---

### 4. AntView (Ant-Specific Rendering)

**Location**: `Classes/mvc/views/AntView.js`

**Purpose**: Adds ant-specific overlays to base sprite rendering

**Rendering Flow**:
```javascript
render() {
  // 1. Render sprite (via parent EntityView)
  super.render();

  // 2. Add ant-specific overlays
  this.renderHealthBar();
  this.renderResourceIndicator();
  this.renderHighlights();
  this.renderStateEffects();
  this.renderSpeciesLabel();
}
```

**Sprite Handling**: AntView does NOT directly touch sprites - delegates to EntityView.

**Critical**: AntView is **pure presentation** - reads from model, never modifies state.

---

## Animation System

### AnimationManager (Global Instance)

**Location**: `Classes/managers/animationManager.js`

**Purpose**: Cycles sprite sheet frames to create animations

**Initialization** (in `antsPreloader()`):
```javascript
animationManager = new AnimationManager();
```

**Sprite Sheets** (loaded in `animationPreloader()`):
```javascript
spriteSheets = {
  "Queen": loadImage("Images/Animation/Queen.png"),
  "Warrior": loadImage("Images/Animation/Warrior.png"),
  "Scout": loadImage("Images/Animation/Scout.png"),
  "Builder": loadImage("Images/Animation/Builder.png"),
  "Farmer": loadImage("Images/Animation/Farmer.png"),
  "Spitter": loadImage("Images/Animation/Spitter.png"),
};
```

**Animation Data** (frame definitions):
```javascript
animationData = {
  "Walking": { 
    row: 1,              // Row in sprite sheet
    width: 16,           // Frame width (pixels)
    height: 16,          // Frame height (pixels)
    totalFrames: 2,      // Number of frames
    frameDelay: 10,      // Frames between updates
    currentFrame: 0      // Current frame index
  },
  "Attack": { 
    row: 3,
    width: 16,
    height: 16,
    totalFrames: 2,
    frameDelay: 20,
    currentFrame: 0
  }
}
```

**Key Methods**:

#### `isAnimation(animationName)`
Check if animation exists:
```javascript
animationManager.isAnimation("Attack"); // true
animationManager.isAnimation("Jump");   // false
```

#### `play(antObj, animationName)`
Play animation on an ant:
```javascript
// Example: Attack animation on damage
if (animationManager.isAnimation("Attack")) {
  animationManager.play(this, "Attack");
}
```

**How It Works**:
1. Gets job-specific sprite sheet (e.g., "Warrior.png")
2. Extracts current frame from sheet using row/column coords
3. Updates ant's sprite image via `antObj.setImage(frame)`
4. Advances to next frame on delay
5. Loops back to frame 0 when complete

**Frame Extraction**:
```javascript
// Compute pixel coordinates in sprite sheet
let x = anim.currentFrame * anim.width;  // Column position
let y = anim.row * anim.height;          // Row position

// Extract frame from sheet
let frame = sheet.get(x, y, anim.width, anim.height);

// Update ant's sprite
antObj.setImage(frame);
```

---

## Integration with Original Ant System

### Current Implementation (ants.js)

**Animation Trigger** (in `takeDamage()`):
```javascript
takeDamage(amount) {
  const oldHealth = this._health;
  this._health = Math.max(0, this._health - amount);
  
  // Notify health controller
  if (this._healthController && oldHealth > this._health) {
    this._healthController.onDamage();
  }

  // ⭐ Attack animation trigger
  if (animationManager.isAnimation("Attack")) {
    animationManager.play(this, "Attack");
  }
  
  if (this._health <= 0) {
    this.die();
  }
  return this._health;
}
```

**Image/Job Assignment** (in `assignJob()`):
```javascript
assignJob(jobName, image = null) {
  // ... job setup ...
  
  // ⭐ Set image if provided
  if (image) {
    this.setImage(image);  // Calls Entity.setImage() → sprite.setImage()
  }
  
  return this;
}
```

**Job-Specific Images** (global):
```javascript
JobImages = {
  Builder: loadImage('Images/Ants/gray_ant_builder.png'),
  Scout: loadImage('Images/Ants/gray_ant_scout.png'),
  Farmer: loadImage('Images/Ants/gray_ant_farmer.png'),
  Warrior: loadImage('Images/Ants/gray_ant_soldier.png'),
  Spitter: loadImage('Images/Ants/gray_ant_spitter.png'),
  Queen: loadImage('Images/Ants/gray_ant_queen.png'),
  Spider: loadImage('Images/Ants/spider.png')
};
```

---

## MVC Animation Integration Strategy

### Problem: AnimationManager is Global

**Issue**: AnimationManager modifies sprite state directly (side effect), which violates MVC view read-only principle.

**Current Approach** (in original ant):
- Controller triggers animation: `animationManager.play(this, "Attack")`
- AnimationManager directly modifies sprite: `antObj.setImage(frame)`
- View renders whatever sprite image is currently set

### Solution: Controller-Mediated Animation

**Option 1: Controller Triggers** (Recommended - matches existing pattern)

```javascript
// AntController
takeDamage(damage) {
  // Update model
  const currentHealth = this.model.getHealth();
  this.model.setHealth(currentHealth - damage);

  // ⭐ Trigger animation via global AnimationManager
  if (typeof animationManager !== 'undefined' && 
      animationManager.isAnimation("Attack")) {
    // Pass controller as ant object (has setImage/getSize/jobName)
    animationManager.play(this, "Attack");
  }

  // Die if health zero
  if (this.model.getHealth() <= 0) {
    this.die();
  }
}

// Need to expose Entity-like interface for AnimationManager
setImage(image) {
  // Update sprite in model
  if (this.model.sprite) {
    this.model.sprite.setImage(image);
  }
}

getSize() {
  return this.model.getSize();
}

get jobName() {
  return this.model.getJobName();
}

get _health() {
  return this.model.getHealth();
}
```

**Option 2: Animation Controller Component** (Future Enhancement)

```javascript
// Create AnimationController sub-controller
class AnimationController {
  constructor(entity) {
    this.entity = entity;
    this.currentAnimation = null;
  }

  play(animationName) {
    // Similar to AnimationManager but as a component
    const anim = animationData[animationName];
    if (!anim) return;

    this.currentAnimation = {
      name: animationName,
      frameIndex: 0,
      frameTimer: 0
    };
  }

  update() {
    if (!this.currentAnimation) return;

    const anim = animationData[this.currentAnimation.name];
    this.currentAnimation.frameTimer++;

    // Update frame on delay
    if (this.currentAnimation.frameTimer >= anim.frameDelay) {
      this.currentAnimation.frameTimer = 0;
      this.currentAnimation.frameIndex++;

      // Extract and apply frame
      const frame = this._extractFrame(anim);
      this.entity.model.sprite.setImage(frame);

      // Loop or finish
      if (this.currentAnimation.frameIndex >= anim.totalFrames) {
        this.currentAnimation = null; // Animation complete
      }
    }
  }

  _extractFrame(anim) {
    const sheet = spriteSheets[this.entity.model.getJobName()];
    const x = this.currentAnimation.frameIndex * anim.width;
    const y = anim.row * anim.height;
    return sheet.get(x, y, anim.width, anim.height);
  }
}

// AntController adds animation sub-controller
constructor(model, view, options = {}) {
  super(model, view, options);
  
  this.animation = new AnimationController(this);
}

update() {
  super.update();
  
  // Update animation component
  this.animation.update();
}

// Trigger animation
takeDamage(damage) {
  // ... health update ...
  
  this.animation.play("Attack");
}
```

---

## Current State: MVC vs Original

### Sprite Handling

| Aspect | Original Ant | MVC Ant | Status |
|--------|-------------|---------|--------|
| Sprite storage | `Entity._sprite` | `EntityModel.sprite` | ✅ MIGRATED |
| Sprite rendering | `Entity` render via controllers | `EntityView.render()` | ✅ MIGRATED |
| Image loading | `assignJob(jobName, image)` | Factory with `imagePath` | ✅ MIGRATED |
| Position sync | `Entity.update()` syncs sprite | `EntityView._syncSpritePosition()` | ✅ MIGRATED |

### Animation Handling

| Aspect | Original Ant | MVC Ant | Status |
|--------|-------------|---------|--------|
| AnimationManager instance | Global `animationManager` | Same (global) | ✅ AVAILABLE |
| Animation trigger | `animationManager.play(this, "Attack")` | **NOT IMPLEMENTED** | ❌ MISSING |
| Frame cycling | AnimationManager modifies sprite | Same mechanism | ✅ COMPATIBLE |
| Sprite sheets | Loaded in `animationPreloader()` | Same | ✅ AVAILABLE |

---

## Implementation Gaps & Recommendations

### 🔴 CRITICAL GAPS

#### 1. AntController lacks AnimationManager interface

**Problem**: AnimationManager expects ant-like object with:
- `setImage(image)` - Update sprite
- `getSize()` - Get dimensions
- `jobName` - Job type
- `_health` - Health check

**Solution**: Add compatibility interface to AntController:

```javascript
class AntController extends EntityController {
  // ... existing code ...

  // ===== ANIMATION INTERFACE (for AnimationManager compatibility) =====
  
  /**
   * Set sprite image (AnimationManager compatibility)
   * @param {p5.Image} image - Image to set
   */
  setImage(image) {
    if (this.model.sprite) {
      this.model.sprite.setImage(image);
    }
  }

  /**
   * Get entity size (AnimationManager compatibility)
   * @returns {{x: number, y: number}} Size object
   */
  getSize() {
    return this.model.getSize();
  }

  /**
   * Set entity size (AnimationManager compatibility)
   * @param {number} width - Width
   * @param {number} height - Height
   */
  setSize(width, height) {
    this.model.setSize({ x: width, y: height });
  }

  /**
   * Get job name (AnimationManager compatibility)
   * @returns {string} Job name
   */
  get jobName() {
    return this.model.getJobName();
  }

  /**
   * Get health (AnimationManager compatibility)
   * @returns {number} Current health
   */
  get _health() {
    return this.model.getHealth();
  }
}
```

#### 2. Animation triggers not implemented in AntController

**Problem**: No calls to AnimationManager in MVC controller methods

**Solution**: Add animation triggers to relevant methods:

```javascript
// In AntController.takeDamage()
takeDamage(damage) {
  const currentHealth = this.model.getHealth();
  const newHealth = Math.max(0, currentHealth - damage);
  this.model.setHealth(newHealth);

  // ⭐ Trigger attack animation
  if (typeof animationManager !== 'undefined' && 
      animationManager.isAnimation("Attack")) {
    animationManager.play(this, "Attack");
  }

  // Die if health zero
  if (newHealth <= 0) {
    this.die();
  }
}

// In AntController.update() - for walking animation
update() {
  if (!this.model.isActive) return;

  super.update();

  // ⭐ Play walking animation if moving
  const isMoving = this.subControllers.get('movement')?.getIsMoving();
  if (isMoving && 
      typeof animationManager !== 'undefined' && 
      animationManager.isAnimation("Walking")) {
    animationManager.play(this, "Walking");
  }

  this._updateBrain();
  this._updateStateMachine();
  this._updateCombat();
}
```

### 🟡 MINOR ENHANCEMENTS

#### 1. Job image loading in Factory

**Current**: Factory accepts `imagePath`, but doesn't use `JobImages` global

**Enhancement**: Auto-load job-specific images in factory:

```javascript
// In AntFactory.create()
static create(options = {}) {
  const config = {
    // ... existing config ...
    
    // Auto-load job-specific image if not provided
    imagePath: options.imagePath || 
               (typeof JobImages !== 'undefined' && options.jobName ? 
                JobImages[options.jobName] : null),
  };

  // ... rest of creation ...
}
```

#### 2. Animation state in model

**Enhancement**: Track animation state for debugging

```javascript
// In AntModel
constructor(options = {}) {
  // ... existing properties ...
  
  this._currentAnimation = null;
  this._animationFrame = 0;
}

getCurrentAnimation() { return this._currentAnimation; }
setCurrentAnimation(name) { this._currentAnimation = name; }
getAnimationFrame() { return this._animationFrame; }
setAnimationFrame(frame) { this._animationFrame = frame; }
```

---

## Testing Strategy

### Unit Tests

**Sprite2D**:
```javascript
it('should update image on setImage()', () => {
  const sprite = new Sprite2D(null, createVector(0, 0), createVector(32, 32));
  const img = loadImage('test.png');
  sprite.setImage(img);
  expect(sprite.img).to.equal(img);
});

it('should sync position/size on render', () => {
  const sprite = new Sprite2D(img, createVector(10, 20), createVector(32, 32));
  sprite.setPosition(createVector(50, 60));
  expect(sprite.pos.x).to.equal(50);
  expect(sprite.pos.y).to.equal(60);
});
```

**EntityView**:
```javascript
it('should sync sprite position with model', () => {
  const model = new EntityModel({ x: 100, y: 200 });
  model.sprite = new Sprite2D(img, createVector(0, 0), createVector(32, 32));
  const view = new EntityView(model);
  
  view._syncSpritePosition();
  
  expect(model.sprite.pos.x).to.equal(100);
  expect(model.sprite.pos.y).to.equal(200);
});

it('should not render if inactive', () => {
  const model = new EntityModel({ isActive: false });
  const view = new EntityView(model);
  const spy = sinon.spy(view, '_syncSpritePosition');
  
  view.render();
  
  expect(spy.called).to.be.false;
});
```

**AntController Animation Interface**:
```javascript
it('should expose setImage for AnimationManager', () => {
  const { model, controller } = AntFactory.create({});
  model.sprite = new Sprite2D(null, createVector(0, 0), createVector(32, 32));
  
  const img = loadImage('test.png');
  controller.setImage(img);
  
  expect(model.sprite.img).to.equal(img);
});

it('should expose jobName for AnimationManager', () => {
  const { controller } = AntFactory.create({ jobName: 'Warrior' });
  expect(controller.jobName).to.equal('Warrior');
});
```

### Integration Tests

```javascript
it('should play animation via AnimationManager', () => {
  const { controller } = AntFactory.create({ jobName: 'Warrior' });
  const animManager = new AnimationManager();
  
  animManager.play(controller, "Attack");
  
  // Sprite image should be updated to attack frame
  expect(controller.model.sprite.img).to.not.be.null;
});

it('should cycle animation frames on update', () => {
  const { controller } = AntFactory.create({});
  const animManager = new AnimationManager();
  
  animManager.play(controller, "Walking");
  
  // Advance frames
  for (let i = 0; i < 10; i++) {
    // Simulate frame updates
  }
  
  // Animation should cycle through frames
  expect(animationData["Walking"].currentFrame).to.be.greaterThan(0);
});
```

### E2E Tests (with screenshots)

```javascript
it('should render ant sprite correctly', async () => {
  await page.evaluate(() => {
    const { controller } = AntFactory.create({ 
      x: 200, 
      y: 200, 
      jobName: 'Warrior' 
    });
    
    // Force render
    controller.view.render();
    window.redraw();
  });
  
  await saveScreenshot(page, 'ant-sprite-rendering', true);
  
  // Verify sprite visible in screenshot
});

it('should show attack animation on damage', async () => {
  await page.evaluate(() => {
    const { controller } = AntFactory.create({ jobName: 'Warrior' });
    
    // Trigger damage (should play attack animation)
    controller.takeDamage(10);
    
    window.redraw();
  });
  
  await saveScreenshot(page, 'ant-attack-animation', true);
});
```

---

## Summary

### How Sprites Work in Ant MVC

1. **Storage**: Sprite2D instance stored in `EntityModel.sprite`
2. **Syncing**: EntityView syncs sprite position/size with model each frame
3. **Rendering**: EntityView calls `sprite.render()` which draws to canvas
4. **Updates**: AntView adds overlays (health bar, resources) after sprite render

### How Animations Work

1. **Global System**: AnimationManager is a global singleton
2. **Sprite Sheets**: Job-specific sprite sheets loaded in preload
3. **Frame Cycling**: AnimationManager extracts frames and updates sprite image
4. **Triggers**: Controller calls `animationManager.play(this, "Attack")`
5. **Compatibility**: Controller must expose ant-like interface (setImage, jobName, etc.)

### Current Status

✅ **Working**:
- Sprite storage and rendering
- Position/size syncing
- Job-specific static images
- AnimationManager available globally

❌ **Missing**:
- AntController animation interface methods
- Animation triggers in controller methods
- Walking animation integration
- Attack animation on takeDamage()

### Next Steps

1. ✅ Add animation interface to AntController (setImage, getSize, jobName, _health)
2. ✅ Add animation triggers to takeDamage(), update()
3. ✅ Test AnimationManager integration
4. ✅ Write E2E tests with animation screenshots
5. ✅ Document animation API in controller

---

**Implementation Priority**: 🔴 **HIGH** - Animations are core gameplay feature

**Complexity**: 🟢 **LOW** - Mostly adding interface methods and trigger calls

**Risk**: 🟢 **LOW** - AnimationManager already working, just needs MVC integration
