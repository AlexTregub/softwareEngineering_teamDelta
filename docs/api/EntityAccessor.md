# EntityAccessor API Documentation

> **Module**: `Classes/rendering/EntityAccessor.js`  
> **Version**: 1.0.0  
> **Last Updated**: October 2025

## Overview

The `EntityAccessor` class provides standardized entity property access with consistent fallback chains. It eliminates duplicate accessor logic across rendering systems and ensures compatibility with different entity structure patterns.

## Static Methods

### `getPosition(entity)`

**Parameters:**

- `entity` (Object): Entity to query for position

**Returns:** `{x, y}` - Position object

Retrieves entity position using standardized fallback chain.

**Fallback Chain:**

1. `entity.getPosition()` - Preferred method
2. `entity.position` - Direct property  
3. `entity._sprite.pos` / `entity.sprite.pos` - Sprite position
4. `{posX, posY}` / `{x, y}` - Direct coordinates

**Implementation:**

```javascript
static getPosition(entity) {
  if (!entity) return { x: 0, y: 0 };
  
  // Standard getPosition() method (preferred)
  if (entity.getPosition) {
    return entity.getPosition();
  }
  
  // Direct position property
  if (entity.position) {
    return entity.position;
  }
  
  // Sprite-based position
  if (entity._sprite && entity._sprite.pos) {
    return entity._sprite.pos;
  }
  if (entity.sprite && entity.sprite.pos) {
    return entity.sprite.pos;
  }
  
  // Direct coordinate properties
  if (entity.posX !== undefined && entity.posY !== undefined) {
    return { x: entity.posX, y: entity.posY };
  }
  if (entity.x !== undefined && entity.y !== undefined) {
    return { x: entity.x, y: entity.y };
  }
  
  return { x: 0, y: 0 };
}
```

### `getSize(entity)`

**Parameters:**

- `entity` (Object): Entity to query for size

**Returns:** `{width, height}` - Size object

Retrieves entity size using standardized fallback chain.

**Fallback Chain:**

1. `entity.getSize()` - Preferred method
2. `entity.size` - Direct property
3. `entity._sprite.size` / `entity.sprite.size` - Sprite size
4. `{width, height}` / `{w, h}` - Direct dimensions
5. Default size based on entity type

### `getBounds(entity)`

**Parameters:**

- `entity` (Object): Entity to query

**Returns:** `{x, y, width, height}` - Bounding rectangle

Combines position and size into bounding rectangle.

### `getRotation(entity)`

**Parameters:**  

- `entity` (Object): Entity to query

**Returns:** `number` - Rotation in degrees

Gets entity rotation with fallbacks to sprite rotation and default 0.

## Usage Examples

```javascript
// Consistent position access across entity types
const pos = EntityAccessor.getPosition(someEntity);
const size = EntityAccessor.getSize(someEntity);

// Use in rendering systems
function renderEntity(entity) {
  const bounds = EntityAccessor.getBounds(entity);
  rect(bounds.x, bounds.y, bounds.width, bounds.height);
}

// Collision detection
function checkCollision(entityA, entityB) {
  const boundsA = EntityAccessor.getBounds(entityA);
  const boundsB = EntityAccessor.getBounds(entityB);
  // ... collision logic
}
```

## Performance Benefits

- **Eliminates Duplication**: Single implementation across all rendering systems
- **Optimized Checks**: Efficient property existence checks  
- **Caching Friendly**: Consistent access patterns enable caching
- **Type Safety**: Handles undefined/null entities gracefully

---

## See Also

- **[RenderController API Documentation](RenderController.md)** - Uses EntityAccessor for rendering
- **[EntityLayerRenderer API Documentation](EntityLayerRenderer.md)** - Bulk entity access patterns
