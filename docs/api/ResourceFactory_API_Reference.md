# ResourceFactory API Reference

**Class**: ResourceFactory  
**Inherits**: None (Static factory class)  
**File**: `Classes/factories/ResourceFactory.js`  
**Pattern**: Factory Pattern (MVC)

Factory class for creating ResourceController instances. Provides convenient static methods for common resource types.

---

## Description

ResourceFactory is a dedicated factory class that creates ResourceController instances (MVC pattern) for game resources. It replaces the old Resource class factory methods, providing better organization and separation of concerns.

All factory methods return ResourceController instances with proper image loading, type configuration, and customization options.

**Key Features**:
- Static factory methods for common resource types
- Image loading via global p5.js image variables
- Options parameter for customization (amount, etc.)
- Error handling if ResourceController not available
- Browser/Node.js compatibility
- Full JSDoc documentation

---

## Tutorials

- [MVC Refactoring Roadmap](../roadmaps/MVC_REFACTORING_ROADMAP.md) - Complete MVC migration guide
- [MVC Refactoring Example](../guides/MVC_REFACTORING_EXAMPLE.md) - Step-by-step MVC pattern examples

---

## Methods

| Returns               | Method                                                                                    |
|-----------------------|-------------------------------------------------------------------------------------------|
| `ResourceController`  | createGreenLeaf ( x: `number`, y: `number`, options: `Object` = {} ) static             |
| `ResourceController`  | createMapleLeaf ( x: `number`, y: `number`, options: `Object` = {} ) static             |
| `ResourceController`  | createStick ( x: `number`, y: `number`, options: `Object` = {} ) static                 |
| `ResourceController`  | createStone ( x: `number`, y: `number`, options: `Object` = {} ) static                 |
| `ResourceController`  | createResource ( type: `String`, x: `number`, y: `number`, options: `Object` = {} ) static |
| `p5.Image|null`       | _getImageForType ( type: `String` ) static private                                       |

---

## Method Descriptions

### <span id="creategreenleaf"></span>ResourceController **createGreenLeaf** ( x: number, y: number, options: Object = {} ) static

Create a green leaf resource at the specified world position.

```javascript
// Basic usage
const leaf = ResourceFactory.createGreenLeaf(100, 150);

// With custom amount
const customLeaf = ResourceFactory.createGreenLeaf(100, 150, { amount: 50 });
```

**Parameters:**
- `x` (number, **required**): World X position in pixels
- `y` (number, **required**): World Y position in pixels
- `options` (Object, optional): Configuration options
  - `amount` (number): Resource amount (default: 100)
  - Additional properties passed to ResourceController

Returns ResourceController instance with type 'greenLeaf' or null if ResourceController not loaded.

**Note:** Requires `greenLeaf` global p5.js image variable to be loaded for sprite rendering.

---

### <span id="createmapleleaf"></span>ResourceController **createMapleLeaf** ( x: number, y: number, options: Object = {} ) static

Create a maple leaf resource at the specified world position.

```javascript
const leaf = ResourceFactory.createMapleLeaf(200, 250);
```

**Parameters:**
- `x` (number, **required**): World X position in pixels
- `y` (number, **required**): World Y position in pixels
- `options` (Object, optional): Configuration options (same as createGreenLeaf)

Returns ResourceController instance with type 'mapleLeaf' or null if ResourceController not loaded.

---

### <span id="createstick"></span>ResourceController **createStick** ( x: number, y: number, options: Object = {} ) static

Create a stick resource at the specified world position.

```javascript
const stick = ResourceFactory.createStick(300, 350);
const heavyStick = ResourceFactory.createStick(300, 350, { amount: 150 });
```

**Parameters:**
- `x` (number, **required**): World X position in pixels
- `y` (number, **required**): World Y position in pixels
- `options` (Object, optional): Configuration options (same as createGreenLeaf)

Returns ResourceController instance with type 'stick' or null if ResourceController not loaded.

---

### <span id="createstone"></span>ResourceController **createStone** ( x: number, y: number, options: Object = {} ) static

Create a stone resource at the specified world position.

```javascript
const stone = ResourceFactory.createStone(400, 450);
```

**Parameters:**
- `x` (number, **required**): World X position in pixels
- `y` (number, **required**): World Y position in pixels
- `options` (Object, optional): Configuration options (same as createGreenLeaf)

Returns ResourceController instance with type 'stone' or null if ResourceController not loaded.

---

### <span id="createresource"></span>ResourceController **createResource** ( type: String, x: number, y: number, options: Object = {} ) static

Generic factory method that creates a resource of the specified type.

```javascript
// Create any resource type dynamically
const resource = ResourceFactory.createResource('greenLeaf', 100, 150);
const stick = ResourceFactory.createResource('stick', 200, 250, { amount: 75 });

// Unknown type returns null
const invalid = ResourceFactory.createResource('unknown', 100, 100); // null + console error
```

**Parameters:**
- `type` (String, **required**): Resource type ('greenLeaf', 'mapleLeaf', 'stick', 'stone')
- `x` (number, **required**): World X position in pixels
- `y` (number, **required**): World Y position in pixels
- `options` (Object, optional): Configuration options (same as createGreenLeaf)

Returns ResourceController instance or null if invalid type or ResourceController not loaded.

**Note:** Logs console error if type is not recognized.

---

### <span id="getimagefortype"></span>p5.Image|null **_getImageForType** ( type: String ) static private

Internal helper method that retrieves the p5.js image object for a resource type.

**Parameters:**
- `type` (String, **required**): Resource type ('greenLeaf', 'mapleLeaf', 'stick', 'stone')

Returns p5.Image object from global variables (greenLeaf, mapleLeaf, stick, stone) or null if not found.

**Note:** This is a private method. Use the public factory methods instead.

---

## Common Workflows

### Basic Resource Creation

```javascript
// Create different resource types
const leaf = ResourceFactory.createGreenLeaf(100, 150);
const maple = ResourceFactory.createMapleLeaf(200, 250);
const stick = ResourceFactory.createStick(300, 350);
const stone = ResourceFactory.createStone(400, 450);

// Add to game world
g_resourceManager.addResource(leaf);
g_resourceManager.addResource(stick);
```

### Custom Resource Configuration

```javascript
// Create resource with custom amount
const heavyStone = ResourceFactory.createStone(100, 100, { 
  amount: 200  // Double the default amount
});

// Create resource with additional properties
const specialLeaf = ResourceFactory.createGreenLeaf(150, 150, {
  amount: 75,
  // Additional properties passed to ResourceController
  specialProperty: true
});
```

### Dynamic Resource Creation

```javascript
// Create resources based on runtime conditions
function spawnRandomResource(x, y) {
  const types = ['greenLeaf', 'mapleLeaf', 'stick', 'stone'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  const resource = ResourceFactory.createResource(randomType, x, y);
  
  if (resource) {
    g_resourceManager.addResource(resource);
    return resource;
  } else {
    console.error('Failed to create resource');
    return null;
  }
}
```

### Resource Spawning System Integration

```javascript
// Use in resource spawner
class ResourceSpawner {
  spawnResource(x, y, type) {
    const resource = ResourceFactory.createResource(type, x, y);
    
    if (!resource) {
      console.error(`Failed to spawn resource of type ${type}`);
      return null;
    }
    
    // Register with game systems
    g_resourceManager.addResource(resource);
    spatialGridManager.registerEntity(resource);
    
    return resource;
  }
  
  spawnRandomLeaf(x, y) {
    // 50/50 chance of green vs maple leaf
    return Math.random() > 0.5 
      ? ResourceFactory.createGreenLeaf(x, y)
      : ResourceFactory.createMapleLeaf(x, y);
  }
}
```

### Error Handling

```javascript
// Check if ResourceController is available
if (typeof ResourceController === 'undefined') {
  console.error('ResourceController not loaded - cannot create resources');
}

// Factory methods return null on error
const resource = ResourceFactory.createResource('invalid_type', 100, 100);
if (resource === null) {
  console.error('Resource creation failed');
}

// Validate type before creating
function createSafeResource(type, x, y) {
  const validTypes = ['greenLeaf', 'mapleLeaf', 'stick', 'stone'];
  
  if (!validTypes.includes(type)) {
    console.error(`Invalid resource type: ${type}`);
    return null;
  }
  
  return ResourceFactory.createResource(type, x, y);
}
```

---

## Best Practices

1. **Use Factory Methods Instead of Direct Construction**
   ```javascript
   // ✅ GOOD: Use factory
   const leaf = ResourceFactory.createGreenLeaf(100, 150);
   
   // ❌ BAD: Direct construction (harder to maintain)
   const leaf = new ResourceController(100, 150, 20, 20, { type: 'greenLeaf', ... });
   ```

2. **Validate Type Before Creation**
   ```javascript
   // ✅ GOOD: Validate type
   const types = ['greenLeaf', 'mapleLeaf', 'stick', 'stone'];
   if (types.includes(userInputType)) {
     const resource = ResourceFactory.createResource(userInputType, x, y);
   }
   
   // ❌ BAD: No validation
   const resource = ResourceFactory.createResource(userInputType, x, y); // May return null
   ```

3. **Check for Null Returns**
   ```javascript
   // ✅ GOOD: Check return value
   const resource = ResourceFactory.createStone(100, 100);
   if (resource) {
     g_resourceManager.addResource(resource);
   }
   
   // ❌ BAD: Assume success
   const resource = ResourceFactory.createStone(100, 100);
   g_resourceManager.addResource(resource); // May crash if null
   ```

4. **Use Specific Methods When Type is Known**
   ```javascript
   // ✅ GOOD: Use specific method
   const leaf = ResourceFactory.createGreenLeaf(100, 150);
   
   // ❌ LESS GOOD: Generic method when type is known
   const leaf = ResourceFactory.createResource('greenLeaf', 100, 150);
   ```

---

## Notes

- **Location**: ResourceFactory is in `Classes/factories/` for easy discovery
- **MVC Pattern**: Creates ResourceController instances (Model-View-Controller)
- **Image Dependencies**: Requires global p5.js image variables (greenLeaf, mapleLeaf, stick, stone)
- **Load Order**: Must load after ResourceController in index.html
- **Error Handling**: Returns null with console error if ResourceController not available
- **Thread Safety**: N/A (JavaScript is single-threaded)

---

## Related Docs

- [ResourceController API Reference](ResourceController_API_Reference.md) - Controller this factory creates
- [ResourceModel API Reference](ResourceModel_API_Reference.md) - Model used by ResourceController
- [ResourceView API Reference](ResourceView_API_Reference.md) - View used by ResourceController
- [MVC Refactoring Roadmap](../roadmaps/MVC_REFACTORING_ROADMAP.md) - Complete migration guide
- [MVC Refactoring Example](../guides/MVC_REFACTORING_EXAMPLE.md) - Step-by-step examples
