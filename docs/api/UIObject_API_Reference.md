# UIObject API Reference

**Class**: UIObject  
**Inherits**: None (base class)  
**File**: `Classes/ui/UIObject.js`  
**Brief Description**: Universal base class for UI components with integrated CacheManager support

---

## Description

`UIObject` provides automatic cache management, dirty tracking, and a consistent rendering pattern for all UI components. By extending this class, components gain:

- **Automatic cache registration** with CacheManager singleton
- **Dirty tracking** with `markDirty()` / `isDirty()` methods
- **Template method pattern** for rendering (override `renderToCache()`)
- **Common UI properties** (x, y, width, height, visible)
- **Memory-safe cleanup** with `destroy()` method
- **Optional caching** (can disable with `cacheStrategy: 'none'`)

The class uses the Template Method pattern where `render()` orchestrates the rendering pipeline, calling `renderToCache()` when dirty and `renderToScreen()` every frame. Subclasses override `renderToCache()` to define their rendering behavior.

**Key Features**:
- Off-screen canvas rendering via p5.Graphics buffers
- LRU cache eviction support
- Protected cache option (survives memory pressure)
- Graceful degradation when CacheManager unavailable
- Zero boilerplate for cache management

---

## Tutorials

- [UIObject Usage Guide](../guides/UIObject_Usage_Guide.md)
- [Migrating Existing UI Classes to UIObject](../guides/UIObject_Migration_Guide.md)
- [DynamicGridOverlay v2 Implementation Example](../../Classes/ui/DynamicGridOverlay.js)

---

## Properties

| Type      | Property         | Default         | Description                                      |
|-----------|------------------|-----------------|--------------------------------------------------|
| `number`  | `width`          | `100`           | Width of the component in pixels                 |
| `number`  | `height`         | `100`           | Height of the component in pixels                |
| `number`  | `x`              | `0`             | X position in world/screen coordinates           |
| `number`  | `y`              | `0`             | Y position in world/screen coordinates           |
| `bool`    | `visible`        | `true`          | Whether component is visible and should render   |
| `String`  | `_cacheName`     | (auto)          | Unique cache identifier (class + timestamp)      |
| `String`  | `_cacheStrategy` | `'fullBuffer'`  | Cache strategy ('fullBuffer', 'dirtyRect', etc.) |
| `bool`    | `_cacheEnabled`  | `true`          | Whether caching is active                        |
| `bool`    | `_isDirty`       | `true`          | Whether cache needs regeneration                 |
| `bool`    | `_protected`     | `false`         | Whether cache survives memory pressure           |

---

## Methods

| Returns    | Method                                                                                    |
|------------|-------------------------------------------------------------------------------------------|
| `void`     | UIObject ( config: `Object` = {} )                                                       |
| `void`     | markDirty ( region: `Object` = null )                                                    |
| `bool`     | isDirty ( ) const                                                                        |
| `Graphics` | getCacheBuffer ( ) const                                                                 |
| `void`     | render ( )                                                                               |
| `void`     | renderToCache ( buffer: `Graphics` )                                                     |
| `void`     | renderToScreen ( )                                                                       |
| `void`     | renderDirect ( )                                                                         |
| `void`     | update ( )                                                                               |
| `void`     | setVisible ( visible: `bool` )                                                           |
| `bool`     | isVisible ( ) const                                                                      |
| `void`     | destroy ( )                                                                              |

---

## Property Descriptions

### <span id="width"></span>number **width**

Width of the UI component in pixels. Can be changed at runtime, but requires calling `markDirty()` to regenerate cache with new dimensions.

**Default**: `100`

---

### <span id="height"></span>number **height**

Height of the UI component in pixels. Can be changed at runtime, but requires calling `markDirty()` to regenerate cache with new dimensions.

**Default**: `100`

---

### <span id="x"></span>number **x**

X position of the component in world or screen coordinates. Used by `renderToScreen()` to position the cached buffer.

**Default**: `0`

---

### <span id="y"></span>number **y**

Y position of the component in world or screen coordinates. Used by `renderToScreen()` to position the cached buffer.

**Default**: `0`

---

### <span id="visible"></span>bool **visible**

Controls whether the component is visible. When `false`, `render()` returns immediately without rendering. Cache persists even when invisible.

**Default**: `true`

---

### <span id="_cacheName"></span>String **_cacheName** (read-only)

Unique identifier for this component's cache. Automatically generated as `ClassName-timestamp-random`. Used for registration with CacheManager.

**Example**: `"DynamicGridOverlay-1730160000000-0.123456"`

---

### <span id="_cacheStrategy"></span>String **_cacheStrategy**

Cache strategy to use. Options:
- `'fullBuffer'`: Cache entire component (default)
- `'dirtyRect'`: Cache only changed regions
- `'throttled'`: Limit cache updates per second
- `'tiled'`: Cache in tiles for large components
- `'none'`: Disable caching completely

**Default**: `'fullBuffer'`

---

### <span id="_cacheEnabled"></span>bool **_cacheEnabled** (read-only)

Whether caching is currently active. Set to `false` if CacheManager unavailable or strategy is `'none'`.

---

### <span id="_isDirty"></span>bool **_isDirty** (read-only)

Whether the cache needs regeneration. Set to `true` by `markDirty()`, cleared after `renderToCache()` completes.

---

### <span id="_protected"></span>bool **_protected**

Whether this cache is protected from eviction. Protected caches survive memory pressure and are only removed on explicit `destroy()` call.

**Default**: `false`

---

## Method Descriptions

### <span id="constructor"></span>void **UIObject** ( config: `Object` = {} )

Constructs a new UIObject with optional configuration.

```javascript
const uiComponent = new UIObject({
  width: 200,
  height: 150,
  x: 100,
  y: 50,
  cacheStrategy: 'fullBuffer',
  visible: true,
  protected: false
});
```

**Parameters:**
- `config` (Object, optional): Configuration object with properties:
  - `width` (number): Component width in pixels (default: 100)
  - `height` (number): Component height in pixels (default: 100)
  - `x` (number): X position (default: 0)
  - `y` (number): Y position (default: 0)
  - `cacheStrategy` (String): Cache strategy (default: 'fullBuffer')
  - `visible` (bool): Initial visibility (default: true)
  - `protected` (bool): Whether cache is protected (default: false)

**Note**: Automatically registers cache with CacheManager if strategy is not `'none'`.

---

### <span id="markDirty"></span>void **markDirty** ( region: `Object` = null )

Marks the cache as dirty, forcing regeneration on next `render()` call. Invalidates CacheManager cache.

```javascript
// Mark entire cache dirty
component.markDirty();

// Mark specific region dirty (for dirtyRect strategy)
component.markDirty({ x: 10, y: 10, width: 50, height: 50 });
```

**Parameters:**
- `region` (Object, optional): Specific region to invalidate (for partial updates)

**Note**: Call this whenever component state changes (e.g., data updated, resize, style change).

---

### <span id="isDirty"></span>bool **isDirty** ( ) const

Returns whether the cache is currently dirty and needs regeneration.

```javascript
if (component.isDirty()) {
  console.log('Cache will regenerate on next render');
}
```

Returns `bool`: `true` if cache needs regeneration, `false` otherwise.

---

### <span id="getCacheBuffer"></span>Graphics **getCacheBuffer** ( ) const

Returns the p5.Graphics buffer for this component's cache. Returns `null` if caching disabled.

```javascript
const buffer = component.getCacheBuffer();
if (buffer) {
  console.log(`Cache size: ${buffer.width}x${buffer.height}`);
}
```

Returns `Graphics` or `null`: The p5.Graphics cache buffer, or null if caching disabled.

---

### <span id="render"></span>void **render** ( )

Main rendering method called every frame. Orchestrates the rendering pipeline:
1. Check visibility (return if invisible)
2. If dirty, call `renderToCache()`
3. Call `renderToScreen()`

```javascript
function draw() {
  component.render(); // Called every frame (60fps)
}
```

**Note**: DO NOT override this method. Override `renderToCache()` and `renderToScreen()` instead.

---

### <span id="renderToCache"></span>void **renderToCache** ( buffer: `Graphics` )

**ABSTRACT METHOD** - Must be overridden by subclasses. Renders the component to the off-screen cache buffer.

```javascript
class MyComponent extends UIObject {
  renderToCache(buffer) {
    buffer.clear();
    buffer.background(255);
    buffer.fill(0);
    buffer.rect(0, 0, this.width, this.height);
  }
}
```

**Parameters:**
- `buffer` (Graphics, **required**): p5.Graphics buffer to render into

**Note**: Called ONLY when cache is dirty. Use `buffer` drawing methods (not global p5 functions).

---

### <span id="renderToScreen"></span>void **renderToScreen** ( )

Draws the cached buffer to the screen. Can be overridden to add additional rendering (e.g., overlays).

```javascript
class MyComponent extends UIObject {
  renderToScreen() {
    super.renderToScreen(); // Draw cached buffer
    
    // Add overlay
    push();
    stroke(255, 0, 0);
    noFill();
    rect(this.x, this.y, this.width, this.height);
    pop();
  }
}
```

**Note**: Called every frame. Keep this method fast (avoid heavy calculations).

---

### <span id="renderDirect"></span>void **renderDirect** ( )

Fallback rendering method when caching is disabled. Default implementation does nothing. Override if you need non-cached rendering.

```javascript
class MyComponent extends UIObject {
  renderDirect() {
    // Draw directly to screen (no cache)
    push();
    fill(255, 0, 0);
    rect(this.x, this.y, this.width, this.height);
    pop();
  }
}
```

**Note**: Only called when `_cacheEnabled` is `false`.

---

### <span id="update"></span>void **update** ( )

Update component logic before rendering. Default implementation does nothing. Override to add custom update logic.

```javascript
class MyComponent extends UIObject {
  update() {
    // Update state
    this.someValue += deltaTime;
    
    // Mark dirty if state changed
    if (this.someValue > threshold) {
      this.markDirty();
    }
  }
}
```

**Note**: Call before `render()` in your main loop.

---

### <span id="setVisible"></span>void **setVisible** ( visible: `bool` )

Sets the visibility of the component. When invisible, `render()` skips rendering.

```javascript
component.setVisible(false); // Hide
component.setVisible(true);  // Show
```

**Parameters:**
- `visible` (bool, **required**): Whether component should be visible

---

### <span id="isVisible"></span>bool **isVisible** ( ) const

Returns the current visibility state.

```javascript
if (component.isVisible()) {
  console.log('Component is visible');
}
```

Returns `bool`: Current visibility state.

---

### <span id="destroy"></span>void **destroy** ( )

Cleans up resources and removes cache from CacheManager. Call when component is no longer needed.

```javascript
component.destroy(); // Free memory
component = null;    // Release reference
```

**Note**: Can be called multiple times safely. Always call this to prevent memory leaks.

---

## Best Practices

### When to Use UIObject

✅ **USE when**:
- Component renders static content (changes infrequently)
- Component is expensive to render (complex shapes, many elements)
- Component size is moderate (< 1MB cache)
- Component needs consistent lifecycle (init → update → render → destroy)

❌ **DON'T USE when**:
- Component changes every frame (animations, particles)
- Component is very simple (single line, basic shape)
- Component is extremely large (> 10MB cache)
- Cache overhead exceeds rendering cost

### Cache Strategy Selection

- **`fullBuffer`**: Default, best for most components
- **`dirtyRect`**: Best for large components with localized changes
- **`throttled`**: Best for frequently changing components (limit updates to 30fps)
- **`tiled`**: Best for very large components (maps, grids)
- **`none`**: Disable caching, use for dynamic/animated components

### Performance Tips

1. **Call `markDirty()` sparingly** - Only when visual state actually changes
2. **Keep `renderToScreen()` fast** - No heavy calculations, just image blitting
3. **Use protected caches for critical UI** - Prevents eviction under memory pressure
4. **Batch property changes** - Change multiple properties, then call `markDirty()` once
5. **Monitor cache memory** - Check CacheManager stats if performance degrades

---

## Common Workflows

### Basic Usage Pattern

```javascript
// 1. Create subclass
class MyButton extends UIObject {
  constructor(label, x, y) {
    super({ width: 100, height: 40, x, y });
    this.label = label;
  }
  
  renderToCache(buffer) {
    buffer.clear();
    buffer.fill(200);
    buffer.rect(0, 0, this.width, this.height);
    buffer.fill(0);
    buffer.textAlign(CENTER, CENTER);
    buffer.text(this.label, this.width/2, this.height/2);
  }
}

// 2. Instantiate
const button = new MyButton('Click Me', 100, 100);

// 3. Update & render loop
function draw() {
  button.update();
  button.render();
}

// 4. Clean up
button.destroy();
```

### Migrating Existing Component

```javascript
// BEFORE (manual cache management)
class OldComponent {
  constructor() {
    this.cache = createGraphics(100, 100);
    this.dirty = true;
  }
  
  render() {
    if (this.dirty) {
      this.cache.clear();
      this.cache.rect(0, 0, 100, 100);
      this.dirty = false;
    }
    image(this.cache, this.x, this.y);
  }
}

// AFTER (UIObject-based)
class NewComponent extends UIObject {
  constructor() {
    super({ width: 100, height: 100 });
  }
  
  renderToCache(buffer) {
    buffer.clear();
    buffer.rect(0, 0, this.width, this.height);
  }
}
```

### Dynamic Resizing

```javascript
class ResizablePanel extends UIObject {
  resize(newWidth, newHeight) {
    // Update dimensions
    this.width = newWidth;
    this.height = newHeight;
    
    // Recreate cache with new size
    if (this._cacheEnabled && typeof CacheManager !== 'undefined') {
      CacheManager.getInstance().removeCache(this._cacheName);
      this._initializeCache();
    }
    
    // Mark dirty to regenerate
    this.markDirty();
  }
}
```

---

## Notes

- UIObject automatically handles browser/Node.js compatibility (window vs module.exports)
- Cache names include class name for debugging (easier to identify in CacheManager stats)
- Invisible components keep their cache (fast show/hide without regeneration)
- Subclass constructors must call `super(config)` before accessing `this`
- All p5.js drawing in `renderToCache()` must use `buffer.methodName()` syntax

---

## Related Documentation

- [CacheManager API Reference](CacheManager_API_Reference.md)
- [DynamicGridOverlay v2 Source](../../Classes/ui/DynamicGridOverlay.js)
- [UIObject Feasibility Analysis](../roadmaps/UI_OBJECT_BASE_CLASS_FEASIBILITY.md)
- [Testing Methodology Standards](../standards/testing/TESTING_METHODOLOGY_STANDARDS.md)
