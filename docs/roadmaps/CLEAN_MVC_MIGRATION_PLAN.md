# Clean MVC Migration Plan (Option A)

## Overview
Replace old ant class and AntAdapter with **clean MVC pattern** using AntFactory.

**Goal**: Zero wrapper layers, explicit MVC architecture throughout codebase.

---

## Phase 5 Breakdown: Clean MVC Migration

### Step 1: Create AntFactory ✅ COMPLETE
- [x] Create `Classes/baseMVC/factories/AntFactory.js`
- [x] Add `AntFactory.createAnt()` with legacy signature
- [x] Add `AntFactory.create()` shorthand
- [x] Add to `index.html`
- [x] Export `createAnt()` global shorthand

### Step 2: Update Core Spawning Logic
**Files to update:**
- [ ] `Classes/ants/ants.js` - `antsSpawn()` function
- [ ] `Classes/ants/ants.js` - `antsUpdate()` function
- [ ] `Classes/ants/ants.js` - `antsRender()` function
- [ ] `Classes/ants/Queen.js` - Queen spawn methods
- [ ] `Classes/managers/AntManager.js` - Ant management

**Pattern:**
```javascript
// OLD:
let newAnt = new ant(px, py, sizex, sizey, speed, rotation, img, JobName, faction);
newAnt.assignJob(JobName, JobImages[JobName]);
newAnt.update();
ants.push(newAnt);

// NEW:
let antMVC = createAnt(px, py, sizex, sizey, speed, rotation, img, JobName, faction);
// Job already assigned by factory
antMVC.controller.update();
ants.push(antMVC); // Store MVC object
```

### Step 3: Update Global Arrays Pattern
**Decision needed:** How do we store ants in global arrays?

**Option A: Store MVC object** (RECOMMENDED)
```javascript
ants.push({ model, view, controller });
// Access: ants[0].model.getHealth()
```

**Option B: Store controller only**
```javascript
ants.push(controller);
// Access: ants[0].getHealth() via controller method
```

**Option C: Store separate arrays**
```javascript
antModels.push(model);
antViews.push(view);
antControllers.push(controller);
// Complex but most explicit
```

**Recommendation**: **Option A** - store full MVC object for clarity.

### Step 4: Update Test Files (100+ files)
**Test Categories:**
1. **Unit tests** (`test/unit/ants/`) - ~30 files
2. **Integration tests** (`test/integration/`) - ~20 files
3. **BDD tests** (`test/bdd/steps/`) - ~10 files
4. **E2E tests** (`test/e2e/`) - minimal changes

**Migration Pattern:**
```javascript
// OLD:
const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
expect(testAnt.health).to.equal(80);
testAnt.assignJob('Farmer');

// NEW:
const ant = createAnt(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
expect(ant.model.getHealth()).to.equal(80);
ant.controller.assignJob('Farmer');
```

### Step 5: Update Property Access Patterns

**Common conversions:**

| Old Pattern | New Pattern |
|-------------|-------------|
| `ant.health` | `ant.model.getHealth()` |
| `ant.maxHealth` | `ant.model.getMaxHealth()` |
| `ant.damage` | `ant.model.getDamage()` |
| `ant.antIndex` | `ant.model.getAntIndex()` |
| `ant.JobName` | `ant.model.getJobName()` |
| `ant.faction` | `ant.model.getFaction()` |
| `ant.posX` | `ant.model.getPosition().x` |
| `ant.posY` | `ant.model.getPosition().y` |
| `ant.stateMachine` | `ant.model.getStateMachine()` |
| `ant.EntityInventoryManager` | `ant.model.getResourceManager()` |
| `ant.StatsContainer` | `ant.model.getStatsContainer()` |

**Setters:**

| Old Pattern | New Pattern |
|-------------|-------------|
| `ant.posX = 100` | `ant.model.setPosition(100, ant.model.getPosition().y)` |
| `ant.posY = 100` | `ant.model.setPosition(ant.model.getPosition().x, 100)` |
| `ant.JobName = "Farmer"` | `ant.controller.assignJob("Farmer")` |
| `ant.isSelected = true` | `ant.model._isSelected = true` *(temporary)* |

### Step 6: Update Method Calls

**Common conversions:**

| Old Pattern | New Pattern |
|-------------|-------------|
| `ant.assignJob(job)` | `ant.controller.assignJob(job)` |
| `ant.update()` | `ant.controller.update()` |
| `ant.render()` | `ant.controller.render()` |
| `ant.takeDamage(amt)` | `ant.controller.takeDamage(amt)` |
| `ant.heal(amt)` | `ant.controller.heal(amt)` |
| `ant.attack(target)` | `ant.controller.attack(target)` |
| `ant.die()` | `ant.controller.die()` |
| `ant.addResource(res)` | `ant.controller.addResource(res)` |
| `ant.removeResource(amt)` | `ant.controller.removeResource(amt)` |
| `ant.dropAllResources()` | `ant.controller.dropAllResources()` |
| `ant.startGathering()` | `ant.controller.startGathering()` |
| `ant.stopGathering()` | `ant.controller.stopGathering()` |
| `ant.isGathering()` | `ant.controller.isGathering()` |
| `ant.getCurrentState()` | `ant.controller.getCurrentState()` |
| `ant.setState(state)` | `ant.controller.setState(state)` |
| `ant.addCommand(cmd)` | `ant.controller.addCommand(cmd)` |
| `ant.getDebugInfo()` | `ant.controller.getDebugInfo()` |

### Step 7: Update UI/Debug Systems
**Files affected:**
- [ ] `Classes/systems/ui/DraggablePanelManager.js` - Ant spawning UI
- [ ] `debug/test_helpers.js` - Debug ant creation
- [ ] `Classes/testing/ShareholderDemo.js` - Demo ant creation
- [ ] `debug/EntityDebugManager.js` - Debug inspection

### Step 8: Delete Old Code
- [ ] Delete `Classes/ants/ants.js` - Old ant class (997 lines)
- [ ] Delete `Classes/baseMVC/adapters/AntAdapter.js` - No longer needed
- [ ] Delete `test/unit/baseMVC/AntAdapter.test.js` - Adapter tests obsolete
- [ ] Remove from `index.html`

### Step 9: Run Full Test Suite
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run BDD tests: `npm run test:bdd`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Verify **ALL 862+ tests pass** (many will need updates)

---

## Migration Strategy: Incremental or Big Bang?

### Option 1: Incremental Migration (SAFER)
1. Keep old ant class working alongside MVC
2. Migrate one system at a time (spawning → update → render → tests)
3. Use feature flag to toggle old/new system
4. Delete old code only when ALL systems migrated

**Pros**: Lower risk, gradual verification
**Cons**: Temporary duplication, more complex

### Option 2: Big Bang Migration (FASTER)
1. Update all `new ant(` → `createAnt(` in one pass
2. Update all property access in one pass
3. Update all method calls in one pass
4. Fix all tests at once
5. Delete old code immediately

**Pros**: Clean break, no duplication
**Cons**: Higher risk, all tests break at once

**Recommendation**: **Option 1 (Incremental)** - Phase 5 is too large for big bang.

---

## Incremental Migration Order

### 5.1: Core Spawning (HIGH PRIORITY)
- [ ] Update `antsSpawn()` to use `createAnt()`
- [ ] Update global `ants[]` array to store MVC objects
- [ ] Update `antsUpdate()` to call `ant.controller.update()`
- [ ] Update `antsRender()` to call `ant.controller.render()`
- [ ] Test: Verify ants spawn and render correctly

### 5.2: Queen System
- [ ] Update `Queen.js` to use MVC
- [ ] Update queen spawn methods
- [ ] Update queen powers (command, rally, etc.)
- [ ] Test: Verify queen functionality

### 5.3: AntManager
- [ ] Update `AntManager.js` to use MVC
- [ ] Update ant lifecycle management
- [ ] Test: Verify ant management

### 5.4: UI Systems
- [ ] Update `DraggablePanelManager.js` spawn UI
- [ ] Update debug helpers
- [ ] Test: Verify UI spawning

### 5.5: Unit Tests (BULK)
- [ ] Batch update all unit tests (~30 files)
- [ ] Use search/replace for common patterns
- [ ] Fix edge cases manually
- [ ] Run: `npm run test:unit` until all pass

### 5.6: Integration Tests
- [ ] Update integration tests (~20 files)
- [ ] Focus on system interactions
- [ ] Run: `npm run test:integration` until all pass

### 5.7: BDD Tests
- [ ] Update BDD step definitions (~10 files)
- [ ] Preserve behavior descriptions (no technical terms)
- [ ] Run: `npm run test:bdd` until all pass

### 5.8: E2E Tests
- [ ] Minimal changes needed (mostly browser console code)
- [ ] Update any direct ant creation
- [ ] Run: `npm run test:e2e` until all pass

### 5.9: Cleanup
- [ ] Delete old ant class
- [ ] Delete AntAdapter
- [ ] Remove from index.html
- [ ] Update all documentation

---

## Testing Checklist Per Phase

For each incremental phase above:
- [ ] Make code changes
- [ ] Run affected tests
- [ ] Fix failing tests
- [ ] Verify no regressions in other systems
- [ ] Commit changes with clear message
- [ ] Mark phase complete in todo list

---

## Property Access Helper Functions (Optional)

To ease migration, we could add helper functions:

```javascript
// Helper for common property access
function getAntHealth(ant) {
  return ant.model ? ant.model.getHealth() : ant.health; // Fallback for old ants
}

function getAntPosition(ant) {
  return ant.model ? ant.model.getPosition() : { x: ant.posX, y: ant.posY };
}
```

**Decision**: Do we want these helpers or force clean MVC everywhere?

**Recommendation**: **Force clean MVC** - helpers add complexity.

---

## Blockers & Risks

### Blocker 1: Global Array Access Patterns
**Problem**: Code accesses `ants[i].health` directly throughout codebase.

**Solution**: Use Option A (store MVC object), update to `ants[i].model.getHealth()`.

### Blocker 2: Test Mocking Patterns
**Problem**: Tests mock ant properties directly: `ant.health = 50`.

**Solution**: Mock model instead: `ant.model.getHealth = () => 50` or use proper test doubles.

### Blocker 3: Legacy Controller Access
**Problem**: Some code accesses `ant._movementController` directly.

**Solution**: Remove these - MVC handles internally via controller.

### Risk 1: Breaking ALL Tests
**Mitigation**: Incremental migration, test each phase before proceeding.

### Risk 2: Performance Regression
**Mitigation**: Profile before/after, ensure MVC doesn't add overhead.

### Risk 3: Incomplete Migration
**Mitigation**: Use grep to find all `new ant(` and `.health` patterns, verify all updated.

---

## Success Criteria

- [ ] Zero `new ant(` calls remaining
- [ ] Zero direct property access (`.health`, `.posX`, etc.)
- [ ] All method calls use MVC pattern (`.controller.method()`)
- [ ] All 862+ tests passing
- [ ] Old ant class deleted
- [ ] AntAdapter deleted
- [ ] Documentation updated
- [ ] Performance equivalent or better

---

## Next Steps

1. **Review this plan** - Confirm approach with team
2. **Choose migration strategy** - Incremental (recommended) or Big Bang
3. **Start with Phase 5.1** - Core spawning logic
4. **Test thoroughly** after each phase
5. **Update this document** as we progress

---

## Progress Tracking

**Phase 5 Status**: 🚧 IN PROGRESS

- [x] 5.0: Create AntFactory ✅
- [ ] 5.1: Core Spawning
- [ ] 5.2: Queen System
- [ ] 5.3: AntManager
- [ ] 5.4: UI Systems
- [ ] 5.5: Unit Tests
- [ ] 5.6: Integration Tests
- [ ] 5.7: BDD Tests
- [ ] 5.8: E2E Tests
- [ ] 5.9: Cleanup

**Total Completion**: 1/10 phases (10%)
