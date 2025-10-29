# UIObject Usage Guide

**Last Updated**: October 28, 2025  
**Target Audience**: Developers adding new UI components or migrating existing ones

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Creating Your First Component](#creating-your-first-component)
3. [Understanding the Rendering Pipeline](#understanding-the-rendering-pipeline)
4. [Cache Management](#cache-management)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

UIObject is already included in the project. Just extend it:

```javascript
// In browser (index.html loads UIObject.js)
class MyComponent extends UIObject {
  // Your implementation
}

// In Node.js tests
const UIObject = require('./Classes/ui/UIObject.js');
class MyComponent extends UIObject {
  // Your implementation
}
```

### Minimal Example

```javascript
class SimpleBox extends UIObject {
  constructor(x, y, color) {
    super({ width: 100, height: 100, x, y });
    this.color = color;
  }
  
  renderToCache(buffer) {
    buffer.clear();
    buffer.fill(this.color);
    buffer.rect(0, 0, this.width, this.height);
  }
}

// Usage
const box = new SimpleBox(100, 100, color(255, 0, 0));
box.render(); // Call in draw() loop
```

That's it! UIObject handles:
- ✅ Cache creation with CacheManager
- ✅ Dirty tracking
- ✅ Off-screen rendering
- ✅ On-screen blitting
- ✅ Memory cleanup

---

## Creating Your First Component

### Step 1: Extend UIObject

```javascript
class MyButton extends UIObject {
  constructor(label, x, y) {
    // Call parent constructor with config
    super({
      width: 120,
      height: 40,
      x: x,
      y: y,
      cacheStrategy: 'fullBuffer', // Optional (default)
      visible: true,               // Optional (default)
      protected: false             // Optional (default)
    });
    
    // Add your custom properties
    this.label = label;
    this.hovered = false;
    this.pressed = false;
  }
}
```

### Step 2: Override renderToCache()

This is where you define **what** the component looks like:

```javascript
class MyButton extends UIObject {
  // ... constructor ...
  
  renderToCache(buffer) {
    // ALWAYS clear first
    buffer.clear();
    
    // Set styles
    buffer.strokeWeight(2);
    buffer.stroke(0);
    
    // Background color (changes with state)
    if (this.pressed) {
      buffer.fill(150);
    } else if (this.hovered) {
      buffer.fill(220);
    } else {
      buffer.fill(200);
    }
    
    // Draw button shape
    buffer.rect(0, 0, this.width, this.height, 5);
    
    // Draw text
    buffer.fill(0);
    buffer.textAlign(CENTER, CENTER);
    buffer.textSize(16);
    buffer.text(this.label, this.width/2, this.height/2);
  }
}
```

**CRITICAL**: 
- Use `buffer.methodName()`, NOT global `methodName()`
- Coordinates are relative to (0, 0), NOT `this.x`/`this.y`
- Always call `buffer.clear()` first

### Step 3: Add Update Logic (Optional)

```javascript
class MyButton extends UIObject {
  // ... constructor, renderToCache ...
  
  update() {
    // Check mouse hover
    const wasHovered = this.hovered;
    this.hovered = mouseX > this.x && mouseX < this.x + this.width &&
                   mouseY > this.y && mouseY < this.y + this.height;
    
    // Mark dirty ONLY if state changed
    if (wasHovered !== this.hovered) {
      this.markDirty();
    }
  }
  
  mousePressed() {
    if (this.hovered) {
      this.pressed = true;
      this.markDirty();
    }
  }
  
  mouseReleased() {
    if (this.pressed) {
      this.pressed = false;
      this.markDirty();
      
      if (this.hovered) {
        this.onClick(); // Trigger callback
      }
    }
  }
  
  onClick() {
    // Override in subclass or set as property
    console.log(`Button "${this.label}" clicked!`);
  }
}
```

### Step 4: Use in Main Loop

```javascript
// Setup
let myButton;

function setup() {
  createCanvas(800, 600);
  myButton = new MyButton('Click Me', 100, 100);
}

function draw() {
  background(255);
  
  // Update BEFORE render
  myButton.update();
  myButton.render();
}

function mousePressed() {
  myButton.mousePressed();
}

function mouseReleased() {
  myButton.mouseReleased();
}
```

### Step 5: Clean Up

```javascript
function cleanup() {
  myButton.destroy(); // Remove from CacheManager
  myButton = null;    // Release reference
}
```

---

## Understanding the Rendering Pipeline

### The render() Flow

```
render() called (every frame)
    ↓
Check visible? → NO → return (skip)
    ↓ YES
Check isDirty()? → NO → skip renderToCache()
    ↓ YES
renderToCache(buffer) → Your implementation renders to off-screen buffer
    ↓
Clear _isDirty flag
    ↓
renderToScreen() → Blit buffer to screen with image()
```

### What Happens Under the Hood

```javascript
// UIObject.render() implementation
render() {
  if (!this.visible) return; // Early exit if invisible
  
  if (this._cacheEnabled && this._isDirty) {
    const buffer = this.getCacheBuffer();
    if (buffer) {
      this.renderToCache(buffer); // YOUR CODE RUNS HERE
      this._isDirty = false;
    }
  }
  
  this.renderToScreen(); // Blit to screen
}
```

**Performance Impact**:
- `renderToCache()` called **ONLY when dirty** (infrequent)
- `renderToScreen()` called **EVERY frame** (60 fps)
- Blitting is ~100x faster than redrawing shapes

---

## Cache Management

### When to Call markDirty()

✅ **DO call when**:
```javascript
// Visual state changed
this.color = newColor;
this.markDirty();

// Data updated
this.text = newText;
this.markDirty();

// Size changed
this.width = newWidth;
this.height = newHeight;
this.markDirty();

// Style changed
this.borderWidth = 3;
this.markDirty();
```

❌ **DON'T call when**:
```javascript
// Position changed (renderToScreen handles this)
this.x = newX; // NO markDirty needed
this.y = newY; // Position doesn't affect cache

// Mouse moved (but component unchanged)
// Only markDirty if visual state changes (hover, etc.)

// Every frame (defeats caching purpose)
draw() {
  this.markDirty(); // ❌ BAD - cache never reused!
}
```

### Cache Strategies

```javascript
// Full buffer (default) - cache entire component
new MyComponent({ cacheStrategy: 'fullBuffer' });

// Dirty rect - cache only changed regions (large components)
new MyComponent({ cacheStrategy: 'dirtyRect' });

// Throttled - limit updates to 30fps (frequently changing)
new MyComponent({ cacheStrategy: 'throttled' });

// Tiled - cache in tiles (very large components like maps)
new MyComponent({ cacheStrategy: 'tiled' });

// None - disable caching (always draw direct)
new MyComponent({ cacheStrategy: 'none' });
```

### Protected Caches

```javascript
// Critical UI that should never be evicted
const criticalPanel = new MyPanel({
  protected: true // Survives memory pressure
});

// Normal component (can be evicted under memory pressure)
const normalPanel = new MyPanel({
  protected: false // Default
});
```

---

## Common Patterns

### Pattern 1: Dynamic Content

```javascript
class DynamicLabel extends UIObject {
  constructor(getText, x, y) {
    super({ width: 200, height: 30, x, y });
    this.getText = getText; // Function that returns current text
    this._lastText = '';
  }
  
  update() {
    const currentText = this.getText();
    if (currentText !== this._lastText) {
      this._lastText = currentText;
      this.markDirty(); // Only dirty when text changes
    }
  }
  
  renderToCache(buffer) {
    buffer.clear();
    buffer.fill(0);
    buffer.text(this._lastText, 10, 20);
  }
}

// Usage
const label = new DynamicLabel(() => `Score: ${score}`, 10, 10);
```

### Pattern 2: Composite Components

```javascript
class Panel extends UIObject {
  constructor(x, y) {
    super({ width: 300, height: 200, x, y });
    
    // Child components (render separately, NOT in cache)
    this.closeButton = new Button('X', x + 270, y + 10);
    this.title = new Label('Panel Title', x + 10, y + 10);
  }
  
  renderToCache(buffer) {
    // Render ONLY the panel background
    buffer.clear();
    buffer.fill(240);
    buffer.stroke(0);
    buffer.rect(0, 0, this.width, this.height);
  }
  
  renderToScreen() {
    super.renderToScreen(); // Panel background
    
    // Render children ON TOP
    this.closeButton.render();
    this.title.render();
  }
  
  destroy() {
    // Clean up children
    this.closeButton.destroy();
    this.title.destroy();
    super.destroy();
  }
}
```

### Pattern 3: Animated Overlays

```javascript
class PulsingButton extends UIObject {
  constructor(label, x, y) {
    super({ width: 100, height: 40, x, y });
    this.label = label;
    this.pulsePhase = 0;
  }
  
  renderToCache(buffer) {
    // Static button (cached)
    buffer.clear();
    buffer.fill(200);
    buffer.rect(0, 0, this.width, this.height);
    buffer.fill(0);
    buffer.text(this.label, this.width/2, this.height/2);
  }
  
  renderToScreen() {
    super.renderToScreen(); // Draw cached button
    
    // Animated glow (NOT cached - drawn every frame)
    this.pulsePhase += 0.05;
    const alpha = map(sin(this.pulsePhase), -1, 1, 50, 150);
    
    push();
    noFill();
    stroke(255, 200, 0, alpha);
    strokeWeight(3);
    rect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
    pop();
  }
}
```

### Pattern 4: Responsive Sizing

```javascript
class ResponsivePanel extends UIObject {
  constructor() {
    super({ width: 200, height: 100 });
    this.targetWidth = 200;
  }
  
  resize(newWidth) {
    this.targetWidth = newWidth;
  }
  
  update() {
    // Smooth resize animation
    const diff = this.targetWidth - this.width;
    if (abs(diff) > 1) {
      this.width += diff * 0.1;
      this.markDirty(); // Regenerate cache at new size
      
      // Recreate cache buffer with new dimensions
      if (this._cacheEnabled && typeof CacheManager !== 'undefined') {
        CacheManager.getInstance().removeCache(this._cacheName);
        this._initializeCache();
      }
    }
  }
  
  renderToCache(buffer) {
    buffer.clear();
    buffer.fill(200);
    buffer.rect(0, 0, this.width, this.height);
  }
}
```

---

## Troubleshooting

### Problem: Cache Never Updates

**Symptom**: Component looks the same even after changing properties

**Solution**: Call `markDirty()` after changing visual state
```javascript
// ❌ WRONG
this.color = newColor; // Cache not updated

// ✅ CORRECT
this.color = newColor;
this.markDirty(); // Tell UIObject to regenerate
```

---

### Problem: Component Not Visible

**Symptom**: `render()` called but nothing appears

**Checklist**:
1. Is `visible` true? `component.setVisible(true)`
2. Is position on-screen? Check `x`, `y`, `width`, `height`
3. Does `renderToCache()` clear buffer? Must call `buffer.clear()`
4. Are you using `buffer.method()` not global `method()`?

```javascript
// ❌ WRONG
renderToCache(buffer) {
  fill(255); // Uses GLOBAL fill, not buffer
  rect(0, 0, this.width, this.height);
}

// ✅ CORRECT
renderToCache(buffer) {
  buffer.clear();
  buffer.fill(255); // Uses BUFFER fill
  buffer.rect(0, 0, this.width, this.height);
}
```

---

### Problem: Performance Worse After Using UIObject

**Symptom**: Framerate dropped after converting to UIObject

**Common Causes**:
1. **Calling `markDirty()` every frame**
   ```javascript
   // ❌ BAD
   update() {
     this.markDirty(); // Cache NEVER reused!
   }
   ```

2. **Heavy rendering in `renderToScreen()`**
   ```javascript
   // ❌ BAD - defeats caching purpose
   renderToScreen() {
     super.renderToScreen();
     // Complex drawing every frame
     for (let i = 0; i < 1000; i++) {
       ellipse(random(width), random(height), 5);
     }
   }
   
   // ✅ GOOD - move to renderToCache
   renderToCache(buffer) {
     buffer.clear();
     for (let i = 0; i < 1000; i++) {
       buffer.ellipse(random(width), random(height), 5);
     }
   }
   ```

3. **Cache too large**
   ```javascript
   // ❌ BAD - 10MB cache!
   super({ width: 5000, height: 5000 });
   
   // ✅ GOOD - reasonable size
   super({ width: 500, height: 500 });
   ```

---

### Problem: Memory Leak

**Symptom**: Memory usage grows over time

**Solution**: Always call `destroy()` when removing components
```javascript
// ❌ WRONG
components = []; // Old components still in CacheManager!

// ✅ CORRECT
components.forEach(c => c.destroy()); // Remove from cache
components = [];
```

---

### Problem: Component Renders at Wrong Position

**Symptom**: Component appears at (0, 0) instead of intended position

**Cause**: Using absolute coordinates in `renderToCache()`
```javascript
// ❌ WRONG - uses this.x/this.y in cache
renderToCache(buffer) {
  buffer.rect(this.x, this.y, this.width, this.height);
}

// ✅ CORRECT - cache is relative to (0, 0)
renderToCache(buffer) {
  buffer.rect(0, 0, this.width, this.height);
}
// Position applied in renderToScreen() automatically
```

---

## Next Steps

- Read [UIObject API Reference](../api/UIObject_API_Reference.md) for complete method documentation
- Study [DynamicGridOverlay.js](../../Classes/ui/DynamicGridOverlay.js) for a real-world example
- Check [UIObject Migration Guide](UIObject_Migration_Guide.md) for converting existing components
- Review [CacheManager API](../api/CacheManager_API_Reference.md) for advanced cache control

---

## Feedback

Found an issue or have a question? Update this guide or create a test case demonstrating the problem.
