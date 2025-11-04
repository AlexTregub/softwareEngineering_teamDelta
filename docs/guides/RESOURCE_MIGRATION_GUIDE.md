# Resource Migration Guide

**Status**: Phase 1.8 - Deprecation Active  
**Target Removal**: Phase 1 Complete (after E2E validation)

---

## Overview

The old `Resource` class (Entity-based pattern) is **deprecated** and will be removed in Phase 2. All new code should use the **ResourceController** (MVC pattern) via **ResourceFactory**.

**Why migrate?**
- ✅ Cleaner API (getPosition(), getType(), gather())
- ✅ MVC separation (Model/View/Controller)
- ✅ Better testability (190+ tests)
- ✅ Serialization support (save/load)
- ✅ Observable pattern (automatic view updates)
- ✅ Factory pattern (centralized creation)

---

## Quick Migration

### Before (Deprecated):
```javascript
// Direct instantiation
const resource = new Resource(100, 100, 20, 20, { resourceType: 'greenLeaf' });

// Factory methods
const leaf = Resource.createGreenLeaf(100, 100);
const maple = Resource.createMapleLeaf(200, 200);
```

### After (Recommended):
```javascript
// Use ResourceFactory
const resource = ResourceFactory.createGreenLeaf(100, 100);
const maple = ResourceFactory.createMapleLeaf(200, 200);
const stick = ResourceFactory.createStick(300, 300);
const stone = ResourceFactory.createStone(400, 400);

// Generic factory method
const resource = ResourceFactory.createResource('Food', 100, 100, { amount: 50 });
```

---

## API Comparison

### Old Resource (Entity-based)
```javascript
class Resource extends Entity {
  // Properties (direct access)
  resource.type           // 'greenLeaf', 'mapleLeaf', etc.
  resource.posX           // X position
  resource.posY           // Y position
  resource.x              // Alternative X
  resource.y              // Alternative Y
  resource.amount         // Resource amount (undefined for old resources)
  resource._resourceType  // Private type field
  
  // Methods
  resource.render()       // Render via Entity
  resource.update()       // Update via Entity
  resource.pickUp()       // Mark as carried
  resource.drop()         // Mark as dropped
}
```

### New ResourceController (MVC-based)
```javascript
class ResourceController extends BaseController {
  // Public API (clean interface)
  controller.getPosition()        // → {x, y}
  controller.setPosition(x, y)    // Update position
  controller.getType()            // → 'Food' | 'Wood' | 'Stone'
  controller.getAmount()          // → number
  controller.gather(amount)       // → gathered amount
  controller.isDepleted()         // → boolean
  
  // Collision detection
  controller.contains(x, y)       // → boolean
  controller.collidesWith(other)  // → boolean
  
  // Input handling
  controller.handleInput(type, data) // → callback
  
  // Serialization
  controller.toJSON()             // → object
  ResourceController.fromJSON(data) // → controller
  
  // Lifecycle
  controller.update()             // Update model
  controller.render()             // Render view
  controller.destroy()            // Cleanup
}
```

---

## Property Access Migration

### Position
```javascript
// OLD (deprecated)
const x = resource.posX || resource.x;
const y = resource.posY || resource.y;

// NEW (recommended)
const pos = resource.getPosition();
const x = pos.x;
const y = pos.y;
```

### Resource Type
```javascript
// OLD (deprecated)
const type = resource.type || resource._type || resource.resourceType;

// NEW (recommended)
const type = resource.getType(); // 'Food' | 'Wood' | 'Stone'
```

### Resource Amount
```javascript
// OLD (not available on old Resource)
const amount = resource.amount || 100; // Undefined for old resources

// NEW (recommended)
const amount = resource.getAmount(); // Always defined
```

### Depletion Check
```javascript
// OLD (not available)
if (resource.amount <= 0) { /* depleted */ }

// NEW (recommended)
if (resource.isDepleted()) { /* depleted */ }
```

---

## Duck-Typing Pattern

For code that needs to support **both old Resource and new ResourceController** during migration:

```javascript
// Check for new API, fallback to old API
function getResourceType(resource) {
  return (typeof resource.getType === 'function')
    ? resource.getType()                    // ResourceController
    : (resource.type || resource._type);    // Old Resource
}

function getResourcePosition(resource) {
  return (typeof resource.getPosition === 'function')
    ? resource.getPosition()                // ResourceController
    : {                                     // Old Resource
        x: resource.posX || resource.x || 0,
        y: resource.posY || resource.y || 0
      };
}

function getResourceAmount(resource) {
  return (typeof resource.getAmount === 'function')
    ? resource.getAmount()                  // ResourceController
    : (resource.amount || 100);             // Old Resource (default 100)
}
```

**Examples in codebase**:
- `ResourceSystemManager.getResourcesByType()` (line 393)
- `ResourceManager.checkForNearbyResources()` (line 179-180)
- `ResourceManager.processDropOff()` (line 136)

---

## Factory Methods Migration

### Resource Type Mapping

| Old Resource Type | New Type | Factory Method |
|-------------------|----------|----------------|
| `'greenLeaf'`     | `'Food'` | `ResourceFactory.createGreenLeaf(x, y)` |
| `'mapleLeaf'`     | `'Food'` | `ResourceFactory.createMapleLeaf(x, y)` |
| `'leaf'`          | `'Food'` | `ResourceFactory.createGreenLeaf(x, y)` |
| `'stick'`         | `'Wood'` | `ResourceFactory.createStick(x, y)` |
| `'stone'`         | `'Stone'`| `ResourceFactory.createStone(x, y)` |

### Custom Options

ResourceFactory supports options for customization:

```javascript
// Custom amount
const resource = ResourceFactory.createGreenLeaf(100, 100, { amount: 50 });

// Custom properties (passed to ResourceController)
const resource = ResourceFactory.createStick(200, 200, {
  amount: 75,
  customData: { spawnTime: Date.now() }
});
```

---

## Common Migration Patterns

### 1. Resource Creation
```javascript
// BEFORE
function spawnResource(x, y, type) {
  if (type === 'greenLeaf') return new Resource(x, y, 20, 20, { resourceType: 'greenLeaf' });
  if (type === 'mapleLeaf') return new Resource(x, y, 20, 20, { resourceType: 'mapleLeaf' });
  return new Resource(x, y, 20, 20, { resourceType: type });
}

// AFTER
function spawnResource(x, y, type) {
  return ResourceFactory.createResource(type, x, y);
}
```

### 2. Resource Collection
```javascript
// BEFORE
function collectResource(resource) {
  const type = resource.type || resource._type;
  const pos = { x: resource.posX || resource.x, y: resource.posY || resource.y };
  // ... collection logic
}

// AFTER
function collectResource(resource) {
  const type = resource.getType();
  const pos = resource.getPosition();
  const amount = resource.gather(10); // Gather 10 units
  // ... collection logic
}
```

### 3. Resource Filtering
```javascript
// BEFORE
const foodResources = resources.filter(r => {
  const type = r.type || r._type || r.resourceType;
  return type === 'greenLeaf' || type === 'mapleLeaf';
});

// AFTER
const foodResources = resources.filter(r => r.getType() === 'Food');
```

### 4. Resource Spawning
```javascript
// BEFORE
class ResourceSpawner {
  spawnResource() {
    return Resource.createGreenLeaf(this.x, this.y);
  }
}

// AFTER
class ResourceSpawner {
  spawnResource() {
    return ResourceFactory.createGreenLeaf(this.x, this.y);
  }
}
```

---

## Testing Migration

### Old Tests (with Resource)
```javascript
it('should create a resource', function() {
  const resource = new Resource(100, 100, 20, 20, { resourceType: 'greenLeaf' });
  expect(resource.type).to.equal('greenLeaf');
  expect(resource.posX).to.equal(100);
});
```

### New Tests (with ResourceController)
```javascript
it('should create a resource', function() {
  const resource = ResourceFactory.createGreenLeaf(100, 100);
  expect(resource.getType()).to.equal('Food');
  expect(resource.getPosition().x).to.equal(100);
});
```

### Duck-Typed Tests (supports both)
```javascript
it('should work with both old and new resources', function() {
  const oldResource = new Resource(100, 100, 20, 20, { resourceType: 'greenLeaf' });
  const newResource = ResourceFactory.createGreenLeaf(100, 100);
  
  // Duck-typed helper
  function getType(r) {
    return (typeof r.getType === 'function') ? r.getType() : r.type;
  }
  
  expect(getType(oldResource)).to.equal('greenLeaf');
  expect(getType(newResource)).to.equal('Food');
});
```

---

## Deprecation Warnings

When using deprecated APIs, you'll see console warnings:

```
⚠️ DEPRECATED: Resource class is deprecated. Use ResourceFactory instead:
  - ResourceFactory.createGreenLeaf(x, y, options)
  - ResourceFactory.createMapleLeaf(x, y, options)
  - ResourceFactory.createStick(x, y, options)
  - ResourceFactory.createStone(x, y, options)
  See docs/guides/RESOURCE_MIGRATION_GUIDE.md for details.
```

**How to fix**:
1. Replace `new Resource(...)` with `ResourceFactory.createResource(...)`
2. Replace `Resource.createGreenLeaf(...)` with `ResourceFactory.createGreenLeaf(...)`
3. Update property access to use getter methods (getPosition(), getType(), getAmount())

---

## Timeline

### Phase 1.8 (Current): Deprecation
- ✅ Deprecation warnings added
- ✅ Factory methods delegate to ResourceFactory
- ✅ Migration guide created
- ⚠️ Old Resource class still functional

### Phase 1.9: E2E Validation
- Manual gameplay testing
- Performance validation
- Screenshot proof

### Phase 2: Buildings MVC
- Apply same pattern to buildings
- More code uses MVC pattern
- Old Resource usage decreases

### Phase 6: Manager Elimination
- Remove old Resource class completely
- Remove Entity-based patterns
- 100% MVC architecture

---

## Migration Checklist

For each file using Resource:

- [ ] Identify all `new Resource(...)` calls
- [ ] Replace with `ResourceFactory.createResource(...)`
- [ ] Identify all `Resource.createXXX()` calls
- [ ] Replace with `ResourceFactory.createXXX()`
- [ ] Find all `resource.type` accesses
- [ ] Replace with `resource.getType()`
- [ ] Find all `resource.posX/posY/x/y` accesses
- [ ] Replace with `resource.getPosition().x/y`
- [ ] Find all `resource.amount` accesses
- [ ] Replace with `resource.getAmount()`
- [ ] Run tests to verify no breakage
- [ ] Remove deprecation warnings from console

---

## Troubleshooting

### "ResourceController is not defined"
**Cause**: ResourceController not loaded before use.

**Fix**: Ensure script order in index.html:
```html
<script src="Classes/models/BaseModel.js"></script>
<script src="Classes/views/BaseView.js"></script>
<script src="Classes/controllers/mvc/BaseController.js"></script>
<script src="Classes/models/ResourceModel.js"></script>
<script src="Classes/views/ResourceView.js"></script>
<script src="Classes/controllers/mvc/ResourceController.js"></script>
<script src="Classes/factories/ResourceFactory.js"></script>
```

### "ResourceFactory is not defined"
**Cause**: ResourceFactory not loaded.

**Fix**: Add ResourceFactory.js to index.html (should be at line 56).

### "resource.getType is not a function"
**Cause**: Code expects ResourceController but receives old Resource.

**Fix**: Use duck-typing:
```javascript
const type = (typeof resource.getType === 'function')
  ? resource.getType()
  : (resource.type || resource._type);
```

### "Cannot read property 'x' of undefined"
**Cause**: Assuming getPosition() returns undefined.

**Fix**: ResourceController always returns valid position:
```javascript
const pos = resource.getPosition(); // Always {x, y}
console.log(pos.x, pos.y);
```

---

## Additional Resources

- **API Reference**: `docs/api/ResourceFactory_API_Reference.md`
- **MVC Roadmap**: `docs/roadmaps/MVC_REFACTORING_ROADMAP.md`
- **Phase 1 Summary**: `docs/roadmaps/PHASE_1_COMPLETION_SUMMARY.md`
- **Testing Guide**: `docs/guides/TESTING_TYPES_GUIDE.md`

---

**Questions?** See roadmap or check existing migrations in:
- `Classes/managers/ResourceSystemManager.js` (lines 315, 376, 393)
- `Classes/managers/ResourceManager.js` (lines 136, 179-180, 192)
