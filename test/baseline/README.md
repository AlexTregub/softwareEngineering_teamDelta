# Baseline Tests

## Purpose

This directory contains **baseline tests** that capture the current behavior of all draggable panels **before** implementing the auto-sizing feature. These tests are NOT part of the main test suite - they serve as a reference to detect regressions.

## When to Run

- **Before implementation**: Capture current panel behavior
- **After implementation**: Compare against baseline to detect changes
- **During debugging**: Verify specific panel configurations

## Test Categories

### 1. Panel Configuration Tests
- Verify panel IDs, titles, positions
- Verify button counts and layouts
- Verify initial dimensions

### 2. Panel Behavior Tests
- Dragging functionality
- Minimize/expand behavior
- Button click handlers
- State persistence

### 3. Visual Tests (E2E)
- Screenshot comparisons
- Dimension measurements
- Rendering order

## Running Baseline Tests

```bash
# Run all baseline integration tests
npx mocha "test/baseline/**/*.integration.test.js" --timeout 10000

# Run all baseline E2E tests
node test/baseline/run-baseline-e2e.js

# Run specific panel test
npx mocha "test/baseline/panels/ant_spawn.baseline.test.js"
```

## Test Files

### Integration Tests
- `panels/ant_spawn.baseline.test.js` - Ant spawning panel
- `panels/resources.baseline.test.js` - Resource spawner panel
- `panels/stats.baseline.test.js` - Statistics panel
- `panels/health_controls.baseline.test.js` - Health controls panel
- `panels/debug.baseline.test.js` - Debug panel
- `panels/tasks.baseline.test.js` - Tasks panel
- `panels/buildings.baseline.test.js` - Buildings panel
- `panels/cheats.baseline.test.js` - Cheats panel
- `panels/level_editor.baseline.test.js` - Level editor panels (3)

### E2E Tests
- `e2e/panel_dimensions.baseline.js` - Measure all panel sizes
- `e2e/panel_interactions.baseline.js` - Test dragging, minimize, etc.
- `e2e/panel_screenshots.baseline.js` - Visual regression screenshots

## Expected Results (Baseline)

These are the **current** panel configurations that should NOT change unless explicitly enabled with `autoSizeToContent: true`:

| Panel | Layout | Columns | Buttons | Width | Height | Notes |
|-------|--------|---------|---------|-------|--------|-------|
| ant_spawn | vertical | - | 8 | 140 | 280 | Main spawn controls |
| resources | horizontal | - | 1 | 180 | 150 | Resource brush |
| stats | vertical | - | 3 | 200 | 160 | Game statistics |
| health_controls | grid | 2 | 8 | 200 | 200 | Health buttons |
| debug | grid | 2 | 10 | 220 | 240 | Debug controls |
| tasks | grid | 2 | 16 | 250 | 400 | Task management |
| buildings | vertical | - | 5 | 180 | 240 | Building spawner |
| cheats | grid | 3 | 9 | 280 | 200 | Cheat codes |
| level-editor-materials | n/a | n/a | 0 | 120 | 115 | ContentRenderer |
| level-editor-tools | n/a | n/a | 0 | 70 | 170 | ContentRenderer |
| level-editor-brush | n/a | n/a | 0 | 110 | 60 | ContentRenderer |

## Comparison After Implementation

After implementing auto-sizing, run these tests again and compare:

### Expected: NO CHANGES
All panels should maintain their current dimensions because:
1. `autoSizeToContent` defaults to `false`
2. Opt-in behavior - must explicitly enable
3. Backward compatible

### If Changes Detected
1. Review panel configuration
2. Check if `autoSizeToContent` was accidentally enabled
3. Verify default config merging
4. Check for regression in `autoResizeToFitContent()`

## Adding New Baseline Tests

When creating a new baseline test:

1. **Capture current behavior accurately**
2. **Don't test implementation details**
3. **Focus on observable behavior**
4. **Document expected values**
5. **Keep tests isolated**

Example template:
```javascript
describe('BASELINE: PanelName', () => {
  it('should have correct initial configuration', () => {
    const panel = manager.panels.get('panel_id');
    
    expect(panel.config.size.width).to.equal(CURRENT_WIDTH);
    expect(panel.config.size.height).to.equal(CURRENT_HEIGHT);
    expect(panel.buttons.length).to.equal(CURRENT_BUTTON_COUNT);
  });
});
```

## Maintenance

- **Update baseline tests** when panel configurations intentionally change
- **Archive old baselines** when updating
- **Document why baselines changed**
- **Keep baseline tests simple** - they're not for feature testing

---

**Last Updated**: October 26, 2025
**Purpose**: Reference tests for auto-sizing feature development
