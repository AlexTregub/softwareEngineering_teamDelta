# E2E Test Suite - Pre-Implementation

This directory contains comprehensive end-to-end tests for the Ant Game **before** implementing the true state machine architecture. These tests ensure we don't break existing functionality during the refactor.

## 📁 Directory Structure

```
test/e2e/
├── config.js                    # Test configuration
├── run-all-pre-implementation.js # Master test runner
├── helpers/                      # Helper utilities
│   ├── game_helper.js           # Game interaction helpers
│   ├── screenshot_helper.js     # Screenshot capture utilities
│   ├── performance_helper.js    # Performance measurement
│   └── validation_helper.js     # Data validation
├── entity/                      # Entity base class tests
│   ├── pw_entity_construction.js ✅
│   ├── pw_entity_transform.js
│   ├── pw_entity_collision.js
│   ├── pw_entity_selection.js
│   └── pw_entity_sprite.js
├── controllers/                 # Controller tests
│   ├── pw_movement_controller.js
│   ├── pw_render_controller.js
│   ├── pw_combat_controller.js
│   ├── pw_health_controller.js
│   ├── pw_inventory_controller.js
│   ├── pw_terrain_controller.js
│   ├── pw_selection_controller.js
│   ├── pw_task_manager.js
│   └── pw_transform_controller.js
├── ants/                        # Ant class tests
├── queen/                       # Queen ant tests
├── state/                       # State system tests
├── brain/                       # AI brain tests
├── resources/                   # Resource system tests
├── spatial/                     # Spatial grid tests
├── camera/                      # Camera system tests (existing)
├── ui/                          # UI system tests (existing)
├── integration/                 # Integration tests
├── performance/                 # Performance benchmarks
├── screenshots/                 # Test evidence
│   └── pre-implementation/
└── reports/                     # Test reports

```

## 🚀 Quick Start

### Prerequisites

```bash
# Ensure dev server is running
npm run dev
```

### Run Tests

```bash
# Run all pre-implementation tests
npm run test:e2e:all

# Run specific category
npm run test:e2e:entity
npm run test:e2e:controllers
npm run test:e2e:ants

# Run specific test suite
npm run test:e2e:entity:construction
npm run test:e2e:controllers:movement
```

## ✅ Test Suite Status

### Phase 1: Core Systems (Week 1)
- ✅ **Entity Construction** (pw_entity_construction.js) - 10 tests
- ⏳ Entity Transform (TODO)
- ⏳ Entity Collision (TODO)
- ⏳ Entity Selection (TODO)
- ⏳ Entity Sprite (TODO)

### Phase 2: Controllers (Week 1-2)
- ⏳ MovementController (TODO)
- ⏳ RenderController (TODO)
- ⏳ CombatController (TODO)
- ⏳ HealthController (TODO)
- ⏳ InventoryController (TODO)
- ⏳ TerrainController (TODO)
- ⏳ SelectionController (TODO)
- ⏳ TaskManager (TODO)
- ⏳ TransformController (TODO)

### Phase 3: Ant Systems (Week 2)
- ⏳ Ant Construction (TODO)
- ⏳ Ant Jobs (TODO)
- ⏳ Ant Resources (TODO)
- ⏳ Ant Combat (TODO)
- ⏳ Ant Movement (TODO)
- ⏳ Ant Gathering (TODO)

### Phase 4: State & AI (Week 2-3)
- ⏳ AntStateMachine (TODO)
- ⏳ GatherState (TODO)
- ⏳ State Transitions (TODO)
- ⏳ AntBrain Init (TODO)
- ⏳ AntBrain Decisions (TODO)
- ⏳ AntBrain Pheromones (TODO)
- ⏳ AntBrain Hunger (TODO)

### Phase 5: Integration (Week 3)
- ⏳ Ant Lifecycle (TODO)
- ⏳ Multi-Ant Coordination (TODO)
- ⏳ Camera-Entity Integration (TODO)
- ⏳ Resource System Integration (TODO)

### Phase 6: Performance (Week 3)
- ⏳ Entity Performance (TODO)
- ⏳ State Performance (TODO)
- ⏳ Rendering Performance (TODO)

## 📸 Screenshot Evidence

All tests capture screenshots as visual proof:

- **Success**: `screenshots/pre-implementation/{category}/success/{test}.png`
- **Failure**: `screenshots/pre-implementation/{category}/failure/{test}_{timestamp}.png`

## 📊 Test Reports

Test results are saved in JSON format:

```json
{
  "testName": "Entity creates with valid ID",
  "passed": true,
  "duration": 1234,
  "timestamp": "2025-10-20T12:00:00Z",
  "screenshots": ["path/to/screenshot.png"]
}
```

## 🎯 Success Criteria

- **Entity Tests**: 95% pass rate (40+ tests)
- **Controller Tests**: 90% pass rate (80+ tests)
- **Ant Tests**: 95% pass rate (50+ tests)
- **State Tests**: 100% pass rate (30+ tests)
- **Integration Tests**: 90% pass rate (40+ tests)
- **Performance**: Baselines established

## 🔧 Helper Utilities

### game_helper.js
- `ensureGameStarted(page)` - Bypass menu to PLAYING state
- `spawnAnt(page, x, y, jobType)` - Spawn ant at position
- `createTestEntity(page, config)` - Create test entity
- `getAntState(page, index)` - Get ant state data
- `forceRedraw(page)` - Force canvas redraw

### screenshot_helper.js
- `captureEvidence(page, testName, success)` - Capture screenshot
- `captureSequence(page, testName, actions)` - Multi-step screenshots
- `captureComparison(page, testName, before, change, after)` - Before/after

### performance_helper.js
- `measureFPS(page, duration)` - Measure frames per second
- `measureMemory(page)` - Memory usage stats
- `createPerformanceBenchmark(page, config)` - Full benchmark

### validation_helper.js
- `validateEntityData(data)` - Entity data validation
- `validateAntData(data)` - Ant data validation
- `validatePerformance(metrics, thresholds)` - Performance validation

## 📝 Writing New Tests

### Test Template

```javascript
const { launchBrowser, saveScreenshot } = require('../puppeteer_helper');
const { ensureGameStarted, forceRedraw } = require('../helpers/game_helper');
const { captureEvidence } = require('../helpers/screenshot_helper');

async function test_YourTestName(page) {
  await runTest('Your test description', async () => {
    // 1. Setup
    const entity = await createTestEntity(page, {...});
    
    // 2. Action
    await page.evaluate(() => {
      // Perform test action
    });
    
    // 3. Assert
    const result = await page.evaluate(() => {
      // Get result
    });
    
    if (!expectedCondition) {
      throw new Error('Test failed');
    }
    
    // 4. Evidence
    await captureEvidence(page, 'category/test_name', true);
  });
}
```

## 🐛 Troubleshooting

### Dev Server Not Running
```bash
npm run dev
# Wait for "Serving HTTP on :: port 8000"
```

### Tests Stuck on Menu
Make sure to call `ensureGameStarted(page)` before tests!

### Screenshots Show Wrong State
Call `forceRedraw(page)` after state changes!

### Spatial Grid Errors
Entity auto-registers - no manual action needed.

## 📚 Documentation

- **Full Test Plan**: `COMPREHENSIVE_E2E_TEST_PLAN.md`
- **Architecture Docs**: `docs/architecture/TRUE_STATE_MACHINE_ARCHITECTURE.md`
- **Testing Standards**: `docs/standards/testing/TESTING_METHODOLOGY_STANDARDS.md`
- **E2E Quick Start**: `docs/guides/E2E_TESTING_QUICKSTART.md`

## 🚦 CI/CD Integration

Tests run automatically on:
- Push to main/development branches
- Pull requests
- Manual workflow dispatch

See `.github/workflows/e2e-tests.yml` for CI configuration.

---

**Status**: Test infrastructure ready, Test Suite 1 implemented ✅  
**Next**: Implement remaining test suites per plan  
**Timeline**: 3 weeks for complete coverage
