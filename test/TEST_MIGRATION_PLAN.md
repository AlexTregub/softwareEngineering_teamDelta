# Test Migration Plan - MVC Pattern

## Strategy: Parallel Testing Approach

Instead of modifying 862+ existing tests, we'll create **NEW** test files that test the same functionality using the MVC pattern. This allows us to:
- Keep old tests running (validate backward compatibility)
- Build confidence in MVC implementation
- Delete old tests cleanly in Phase 5.9

## Migration Priority

### Phase 5.5: Core Ant Functionality (HIGH PRIORITY)
**Old File** → **New File**
- `test/unit/ants/queen.test.js` → `test/unit/baseMVC/QueenController.test.js` ✅ (DONE)
- `test/unit/ants/ant.test.js` → `test/unit/baseMVC/ant.mvc.test.js` (NEW)
- `test/unit/ants/antStateMachine.test.js` → `test/unit/baseMVC/antStateMachine.mvc.test.js` (NEW)

### Phase 5.6: Integration Tests (MEDIUM PRIORITY)
**Old File** → **New File**
- `test/integration/entities/ant.controllers.integration.test.js` → Already uses old ant class (keep)
- Create: `test/integration/baseMVC/ant.realSystems.integration.test.js` (NEW)
- Create: `test/integration/baseMVC/ant.spatialGrid.integration.test.js` (NEW)

### Phase 5.7: System Tests (MEDIUM PRIORITY)
- Lightning system tests (already updated for MVC)
- Building interaction tests
- Resource gathering tests

### Phase 5.8: BDD/E2E Tests (LOW PRIORITY)
- Most E2E tests use browser globals and should work with either pattern
- BDD tests may need updates if they check internal state

## Test Patterns to Migrate

### Old Pattern (Ant Class)
```javascript
const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
expect(testAnt.health).to.equal(100);
testAnt.update();
testAnt.render();
```

### New Pattern (MVC)
```javascript
const antMVC = AntFactory.createAnt(100, 100, {
  faction: 'player',
  job: 'Scout'
});
expect(antMVC.model.getHealth()).to.equal(100);
antMVC.controller.update();
antMVC.view.render();
```

## Files to Create (Phase 5.5)

1. **test/unit/baseMVC/ant.mvc.test.js** - Core ant MVC functionality
   - Basic properties (position, size, faction)
   - Movement (moveToLocation, pathfinding)
   - Combat (takeDamage, attack, health)
   - Job system (assignJob, jobName)
   - State machine integration
   - Inventory integration

2. **test/unit/baseMVC/antStateMachine.mvc.test.js** - State machine with MVC
   - State transitions (Idle, Gather, Return, Combat)
   - getCurrentState()
   - Combat modifier integration
   - State-specific behaviors

3. **test/integration/baseMVC/ant.realSystems.integration.test.js** - Real system integration
   - Global ants[] array with MVC objects
   - EntityInventoryManager with MVC ants
   - MapManager terrain interaction
   - SpatialGridManager queries

## Success Criteria

- [ ] All new MVC tests passing (100%)
- [ ] Old tests still passing (validate backward compatibility)
- [ ] Coverage equivalent or better than old tests
- [ ] Ready to delete old ant class in Phase 5.9

## Current Status

- ✅ Phase 1-4: baseMVC Foundation (427 tests passing)
- ✅ Phase 5.0-5.4: Core systems migrated
- 🔄 Phase 5.5: Creating new MVC test files (IN PROGRESS)
