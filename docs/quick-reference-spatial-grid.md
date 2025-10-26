# Spatial Grid System - Quick Reference

## Console Commands (Copy & Paste)

```javascript
// Toggle grid visualization (green overlay)
visualizeSpatialGrid();

// Get grid statistics
getSpatialGridStats();

// Find entities near a point
queryNearbyEntities(200, 150, 100);  // x, y, radius

// Find ants near mouse
queryNearbyAnts(mouseX, mouseY, 50);

// Find nearest entity to mouse
findNearestToMouse(100);  // maxRadius
```

---

## Common Code Patterns

### Find Nearby Entities
```javascript
const nearby = spatialGridManager.getNearbyEntities(x, y, radius);
```

### Find Nearby Ants Only
```javascript
const nearbyAnts = spatialGridManager.getNearbyEntities(x, y, radius, {
  type: 'Ant'
});
```

### Find with Custom Filter
```javascript
const playerAnts = spatialGridManager.getNearbyEntities(x, y, radius, {
  type: 'Ant',
  filter: (ant) => ant.faction === 'player'
});
```

### Selection Box Query
```javascript
const selected = spatialGridManager.getEntitiesInRect(x, y, width, height);
```

### Find Nearest Entity
```javascript
const nearest = spatialGridManager.findNearestEntity(x, y, maxRadius, {
  type: 'Ant'
});
```

### Get All of Type
```javascript
const allAnts = spatialGridManager.getEntitiesByType('Ant');
```

---

## Performance Tips

✅ **Use spatial queries for:**
- Mouse hover detection
- Collision detection
- AI proximity checks
- Selection box queries
- Nearest neighbor searches

❌ **Don't use for:**
- Global operations (use getAllEntities())
- One-time initialization (overhead not worth it)
- Small entity counts (<10 entities)

---

## Debugging

```javascript
// Check if system is working
console.log(spatialGridManager);  // Should exist
console.log(spatialGridManager.getEntityCount());  // Should show count

// Visualize the grid
visualizeSpatialGrid();  // Toggle green overlay

// Check entity registration
console.log(myEntity._gridCell);  // Should show "x,y" key

// Rebuild if corrupted
spatialGridManager.rebuildGrid();
```

---

## Architecture

- **Cell Size:** 64px (TILE_SIZE * 2)
- **Automatic:** Entities register/update/cleanup automatically
- **Backward Compatible:** All existing code still works
- **Performance:** 50-200x faster than iterating all entities

**Files:**
- `Classes/systems/SpatialGrid.js` - Core grid
- `Classes/managers/SpatialGridManager.js` - Hybrid manager
- `Classes/containers/Entity.js` - Auto-integration

**See full docs:** `docs/features/SPATIAL_GRID_IMPLEMENTATION.md`
