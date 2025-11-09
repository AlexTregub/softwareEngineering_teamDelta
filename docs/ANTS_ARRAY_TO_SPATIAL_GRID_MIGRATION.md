# Migration Guide: Remove `ants[]` Global Array → Use SpatialGridManager

## Overview

**Problem**: The `ants[]` global array was never properly initialized and creates redundant storage alongside `spatialGridManager`.

**Solution**: Use `spatialGridManager` as the **single source of truth** for all entity tracking.

---

## ✅ What's Been Done

### 1. **AntFactory Updated** ✅
- **Removed**: `ants.push(antMVC)` registration
- **Kept**: `spatialGridManager.addEntity(antMVC.model)` (single source of truth)
- **Location**: `Classes/baseMVC/factories/AntFactory.js`

### 2. **SpatialGridManager Enhanced** ✅
- **Added**: `getAllEntities()` - Get all tracked entities
- **Added**: `getEntityCount()` - Fast entity count
- **Added**: `getEntityCountByType(type)` - Count by type
- **Added**: `removeEntity(entity)` - Remove from grid
- **Added**: `clearAll()` - Clear all entities
- **Location**: `Classes/managers/SpatialGridManager.js`

### 3. **DraggablePanelManager Migrated** ✅
- **Updated**: `spawnAnts()` - Uses AntFactory only (no executeCommand)
- **Updated**: `spawnEnemyAnt()` - Uses AntFactory only (no AntUtilities)
- **Updated**: `spawnEnemyAnts()` - Uses AntFactory only
- **Updated**: `killAnts()` - Uses `spatialGridManager.removeEntity()`
- **Updated**: `clearAnts()` - Uses `spatialGridManager.removeEntity()` in loop
- **Location**: `Classes/systems/ui/DraggablePanelManager.js`

---

## 📋 Migration Checklist for Other Files

### **Search and Replace Patterns**

Use these patterns to find code that needs updating:

```powershell
# Find all references to ants[] array
grep -r "typeof ants" --include="*.js"
grep -r "ants\[" --include="*.js"
grep -r "ants\.length" --include="*.js"
grep -r "ants\.push" --include="*.js"
grep -r "ants\.splice" --include="*.js"
grep -r "ants\.forEach" --include="*.js"
grep -r "ants\.filter" --include="*.js"
grep -r "ants\.find" --include="*.js"

# Find obsolete references
grep -r "AntManager" --include="*.js"
grep -r "AntUtilities" --include="*.js"
grep -r "executeCommand.*spawn" --include="*.js"
grep -r "tempAnts" --include="*.js"
```

---

## 🔄 Code Migration Patterns

### **Pattern 1: Get All Ants**

**OLD**:
```javascript
if (typeof ants !== 'undefined' && Array.isArray(ants)) {
  const allAnts = ants;
  console.log(`Total ants: ${ants.length}`);
}
```

**NEW**:
```javascript
if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
  const allAnts = spatialGridManager.getEntitiesByType('ant');
  console.log(`Total ants: ${allAnts.length}`);
}
```

---

### **Pattern 2: Count Ants**

**OLD**:
```javascript
const antCount = (typeof ants !== 'undefined') ? ants.length : 0;
```

**NEW**:
```javascript
const antCount = (typeof spatialGridManager !== 'undefined' && spatialGridManager) 
  ? spatialGridManager.getEntityCountByType('ant') 
  : 0;
```

---

### **Pattern 3: Iterate Over Ants**

**OLD**:
```javascript
if (typeof ants !== 'undefined' && Array.isArray(ants)) {
  ants.forEach(ant => {
    ant.update();
  });
}
```

**NEW**:
```javascript
if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
  const allAnts = spatialGridManager.getEntitiesByType('ant');
  allAnts.forEach(ant => {
    ant.update();
  });
}
```

---

### **Pattern 4: Filter Ants**

**OLD**:
```javascript
const playerAnts = ants.filter(ant => ant.faction === 'player');
const enemyAnts = ants.filter(ant => ant.faction === 'enemy');
```

**NEW**:
```javascript
const allAnts = spatialGridManager.getEntitiesByType('ant');
const playerAnts = allAnts.filter(ant => ant.faction === 'player');
const enemyAnts = allAnts.filter(ant => ant.faction === 'enemy');
```

---

### **Pattern 5: Find Nearest Ant**

**OLD**:
```javascript
let nearest = null;
let minDist = Infinity;
for (const ant of ants) {
  const d = dist(x, y, ant.x, ant.y);
  if (d < minDist) {
    minDist = d;
    nearest = ant;
  }
}
```

**NEW**:
```javascript
const nearest = spatialGridManager.findNearestEntity(x, y, maxRadius);
// Or if you need type filtering:
const nearbyAnts = spatialGridManager.getNearbyEntities(x, y, maxRadius);
const nearest = nearbyAnts.length > 0 ? nearbyAnts[0] : null;
```

---

### **Pattern 6: Remove/Kill Ants**

**OLD**:
```javascript
// Remove from ants array
if (typeof ants !== 'undefined' && Array.isArray(ants)) {
  const index = ants.indexOf(antToRemove);
  if (index !== -1) {
    ants.splice(index, 1);
  }
}
```

**NEW**:
```javascript
// Remove from spatial grid (single source of truth)
if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
  spatialGridManager.removeEntity(antToRemove);
}
```

---

### **Pattern 7: Clear All Ants**

**OLD**:
```javascript
if (typeof ants !== 'undefined' && Array.isArray(ants)) {
  ants.length = 0;
}
if (typeof globalThis.tempAnts !== 'undefined') {
  globalThis.tempAnts.length = 0;
}
```

**NEW**:
```javascript
if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
  const allAnts = spatialGridManager.getEntitiesByType('ant');
  allAnts.forEach(ant => spatialGridManager.removeEntity(ant));
}
```

---

### **Pattern 8: Spawn Ants**

**OLD (Multiple Methods)**:
```javascript
// Method 1: AntUtilities (OBSOLETE)
AntUtilities.spawnAnt(x, y, "Worker", "player");

// Method 2: executeCommand (OBSOLETE)
executeCommand(`spawn 10 ant player`);

// Method 3: Manual push to ants[] (WRONG)
const newAnt = new Ant(...);
ants.push(newAnt);
```

**NEW (Single Method)**:
```javascript
// AntFactory handles EVERYTHING (creation + registration)
AntFactory.createAnt(x, y, {
  faction: 'player',
  job: 'Worker'
});
// No manual registration needed - factory does it automatically!
```

---

## 🗑️ Delete These Obsolete References

### **1. Remove All `AntManager` References**
```javascript
// DELETE THESE:
g_antManager.removeAnts(count);
g_antManager.clearAllAnts();
g_antManager.getAnts();

// g_antManager was deleted in Phase 5.9
```

### **2. Remove All `AntUtilities` References**
```javascript
// DELETE THESE:
AntUtilities.spawnAnt(x, y, job, faction);

// Use AntFactory.createAnt() instead
```

### **3. Remove All `executeCommand('spawn ...')` References**
```javascript
// DELETE THESE:
executeCommand(`spawn 10 ant player`);
executeCommand(`spawn 1 ant enemy`);

// Use AntFactory.createAnt() instead
```

### **4. Remove All `tempAnts` References**
```javascript
// DELETE THESE:
globalThis.tempAnts
window.tempAnts

// tempAnts was never part of MVC architecture
```

---

## 📂 Files That Need Migration

Based on grep results, these files likely have `ants[]` references:

### **High Priority** (Game Logic)
- `sketch.js` - Main game loop
- `Classes/systems/ui/QueenControlPanel.js` - Queen powers/controls
- `Classes/systems/Lightning.js` - Lightning targeting
- `Classes/systems/Fireball.js` - Fireball targeting
- `Classes/systems/EnemyAntBrush.js` - Enemy spawning brush
- `Classes/systems/GatherDebugRenderer.js` - Debug rendering
- `debug/test_helpers.js` - Test utilities

### **Medium Priority** (Tests)
- `test/unit/ui/spawn-interaction.regression.test.js`
- `test/unit/ui/draggablePanelManager.test.js`
- `test/unit/systems/Lightning.test.js`
- `test/unit/systems/Fireball.test.js`
- `test/unit/systems/EnemyAntBrush.test.js`
- `test/unit/systems/GatherDebugRenderer.test.js`

### **Low Priority** (Legacy/Debug)
- Various debug scripts in `debug/` folder

---

## 🧪 Testing Strategy

### **1. Unit Tests**
```javascript
// Mock spatial grid in tests
beforeEach(function() {
  global.spatialGridManager = {
    getEntitiesByType: sinon.stub().returns([]),
    getEntityCountByType: sinon.stub().returns(0),
    removeEntity: sinon.stub().returns(true),
    addEntity: sinon.stub()
  };
});
```

### **2. Integration Tests**
```javascript
// Use real spatial grid
const spatialGridManager = new SpatialGridManager();
const ant = AntFactory.createAnt(100, 100, { faction: 'player' });

// Verify registration
const allAnts = spatialGridManager.getEntitiesByType('ant');
expect(allAnts).to.have.lengthOf(1);
```

### **3. E2E Tests**
```javascript
// In browser tests
const result = await page.evaluate(() => {
  // Use spatial grid, not ants[]
  const allAnts = spatialGridManager.getEntitiesByType('ant');
  return { success: allAnts.length > 0 };
});
```

---

## 🎯 Benefits of This Migration

### **Before (With `ants[]`)**:
- ❌ Redundant storage (ants[] + spatialGridManager)
- ❌ Manual synchronization required
- ❌ O(N) iteration for queries
- ❌ No type safety
- ❌ `ants[]` never initialized properly

### **After (SpatialGridManager Only)**:
- ✅ Single source of truth
- ✅ Automatic synchronization
- ✅ O(1) spatial queries
- ✅ Type filtering built-in
- ✅ Proper initialization guaranteed

---

## 🚀 Quick Start Commands

### **Find Files to Migrate**:
```powershell
# Find ants[] usage
grep -rn "typeof ants" --include="*.js" | Select-String -NotMatch "test"

# Find obsolete patterns
grep -rn "AntUtilities\|executeCommand.*spawn\|g_antManager" --include="*.js"
```

### **Verify Migration**:
```powershell
# After migrating a file, verify:
npm run test:unit -- --grep "filename"
npm run test:integration
```

---

## 📝 Example Migration (Complete File)

**Before** (`handleShootLightning` from DraggablePanelManager):
```javascript
// If none selected, try nearest ant under mouse
if (!targetAnt && typeof ants !== 'undefined' && Array.isArray(ants) && ants.length > 0) {
  const radius = 80;
  let best = null;
  let bestDist = Infinity;
  for (const ant of ants) {
    if (!ant || !ant.isActive) continue;
    const pos = ant.getPosition();
    const d = Math.hypot(pos.x - mouseX, pos.y - mouseY);
    if (d < bestDist && d <= radius) {
      bestDist = d;
      best = ant;
    }
  }
  targetAnt = best || ants[0];
}
```

**After** (using spatial grid):
```javascript
// If none selected, use spatial grid to find nearest
if (!targetAnt && typeof spatialGridManager !== 'undefined' && spatialGridManager) {
  targetAnt = spatialGridManager.findNearestEntity(mouseX, mouseY, 80);
}
```

**Result**: 15 lines → 3 lines, O(N) → O(1), cleaner code!

---

## 🆘 Troubleshooting

### **Q: Tests fail with "ants is not defined"**
**A**: Replace `ants` references with `spatialGridManager.getEntitiesByType('ant')`

### **Q: Can't remove entities**
**A**: Use `spatialGridManager.removeEntity(entity)` instead of `ants.splice()`

### **Q: Performance regression**
**A**: Spatial grid is 50-200x faster! If slower, check if you're calling `getEntitiesByType()` in a loop (cache the result)

### **Q: Need to iterate in specific order**
**A**: Spatial grid doesn't guarantee order. If order matters, sort the result:
```javascript
const allAnts = spatialGridManager.getEntitiesByType('ant');
allAnts.sort((a, b) => a.id - b.id); // or whatever sorting you need
```

---

## ✅ Migration Complete Checklist

- [ ] Replace all `ants[]` array access with `spatialGridManager.getEntitiesByType('ant')`
- [ ] Replace all `ants.length` with `spatialGridManager.getEntityCountByType('ant')`
- [ ] Replace all manual `ants.push()` with `AntFactory.createAnt()` (auto-registers)
- [ ] Replace all `ants.splice()` removal with `spatialGridManager.removeEntity()`
- [ ] Remove all `AntManager` references (deleted in Phase 5.9)
- [ ] Remove all `AntUtilities` references (obsolete)
- [ ] Remove all `executeCommand('spawn ...')` references (obsolete)
- [ ] Remove all `tempAnts` references (never existed in MVC)
- [ ] Update all unit tests to mock `spatialGridManager`
- [ ] Update all integration tests to use real `SpatialGridManager`
- [ ] Run full test suite: `npm test`
- [ ] Verify E2E tests pass
- [ ] Update documentation

---

## 📚 Additional Resources

- **API Reference**: `docs/quick-reference-spatial-grid.md`
- **AntFactory Usage**: `Classes/baseMVC/factories/AntFactory.js`
- **SpatialGridManager**: `Classes/managers/SpatialGridManager.js`
- **Testing Guide**: `docs/guides/TESTING_TYPES_GUIDE.md`

---

**Questions?** Check the SpatialGridManager API or ask in team chat!

**Migration Status**: 3 files complete (AntFactory, SpatialGridManager, DraggablePanelManager) ✅
