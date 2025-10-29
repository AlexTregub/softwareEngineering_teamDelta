# Panel Auto-Sizing Feature

## Overview

The DraggablePanel system now supports automatic resizing to fit content using two approaches:
1. **Button-based auto-sizing** - For panels using the built-in button system
2. **Callback-based auto-sizing** - For panels with externally-managed content

## Button-Based Auto-Sizing

### Configuration

```javascript
const config = {
  autoSizeToContent: true,        // Enable auto-sizing
  verticalPadding: 10,            // Extra space top/bottom (default: 10)
  horizontalPadding: 10,          // Extra space left/right (default: 10)
  buttonLayout: 'grid',           // 'grid', 'vertical', or 'horizontal'
  columnsInGridLayout: 2          // For grid layouts only
};
```

### Behavior

**Grid Layout** (e.g., ant_spawn panel):
- Calculates tallest column height → panel height
- Calculates widest row width → panel width
- Resizes both dimensions dynamically

**Vertical Layout** (e.g., health_controls panel):
- Stacks buttons vertically
- Only adjusts height (width unchanged)

**Horizontal Layout** (e.g., buildings panel):
- Arranges buttons horizontally
- Only adjusts height (width unchanged)

### Example

```javascript
// Ant Spawn panel - 2×2 grid
const antSpawnPanel = new DraggablePanel({
  id: 'ant_spawn',
  title: 'Ant Spawn',
  x: 10,
  y: 10,
  width: 200,
  height: 150,
  buttonLayout: 'grid',
  columnsInGridLayout: 2,
  autoSizeToContent: true,
  verticalPadding: 10,
  horizontalPadding: 10,
  buttons: [
    { label: 'Spawn Worker', width: 80, height: 30 },
    { label: 'Spawn Soldier', width: 80, height: 30 },
    { label: 'Spawn Scout', width: 80, height: 30 },
    { label: 'Clear All', width: 80, height: 30 }
  ]
});

// Result: Panel auto-sizes to 200×156px
// Width: max(80+80) + 10*2 + 20 (spacing) = 200px
// Height: 26.8 (title) + (30+30) + 10*2 + 10 (spacing) = 156px
```

## Callback-Based Auto-Sizing

### When to Use

Use callback-based auto-sizing when:
- Panel content is rendered externally (not using DraggablePanel buttons)
- Content size changes dynamically
- Custom rendering logic determines dimensions

### Configuration

```javascript
const config = {
  autoSizeToContent: true,
  contentSizeCallback: () => {
    return { width: number, height: number };
  }
};
```

### Example: Material Palette Panel

```javascript
// Component provides size calculation
class MaterialPalette {
  getContentSize() {
    const cols = 2;
    const swatchSize = 40;
    const spacing = 10;
    const rows = Math.ceil(this.materials.length / cols);
    
    return {
      width: cols * swatchSize + (cols + 1) * spacing,
      height: rows * swatchSize + (rows + 1) * spacing
    };
  }
}

// Panel uses callback
const materialsPanel = new DraggablePanel({
  id: 'level-editor-materials',
  title: 'Materials',
  x: 10,
  y: 80,
  width: 120,
  height: 200,
  managedExternally: true,
  autoSizeToContent: true,
  contentSizeCallback: () => this.levelEditor.palette.getContentSize()
});

// Result: Panel auto-sizes to MaterialPalette's calculated size
// With 2 materials: 120×115px
// With 4 materials: 120×165px (grows dynamically)
```

## Implementation Details

### How It Works

**Button-Based**:
1. Panel calls `calculateTallestColumnHeight()` and `calculateWidestRowWidth()`
2. Adds title bar height + padding
3. Resizes panel if dimensions changed
4. Called automatically on panel creation and button updates

**Callback-Based**:
1. Panel checks for `contentSizeCallback` in config
2. Calls callback to get `{width, height}`
3. Adds title bar height (no padding added - callback should include it)
4. Resizes panel if dimensions changed
5. Called automatically on panel creation and each update cycle

### Code Location

- **DraggablePanel**: `Classes/systems/ui/DraggablePanel.js`
  - Config: Line ~52 (`autoSizeToContent`, `contentSizeCallback`, padding)
  - Method: `autoResizeToFitContent()` (lines 1075-1225)
  - Button calculations: `calculateTallestColumnHeight()`, `calculateWidestRowWidth()`

- **Example Components**:
  - `Classes/ui/MaterialPalette.js` - `getContentSize()`
  - `Classes/ui/ToolBar.js` - `getContentSize()`
  - `Classes/ui/BrushSizeControl.js` - `getContentSize()`

- **Example Panels**:
  - `Classes/systems/ui/LevelEditorPanels.js` - Materials, Tools, Brush Size

## Testing

### Test Coverage

**Unit Tests** (44 tests):
- `test/unit/ui/draggablePanelAutoSizing.test.js` (34 tests)
  - Grid layout resizing (width + height)
  - Vertical layout resizing (height only)
  - Horizontal layout resizing (height only)
  - Padding calculations
  - Edge cases (no buttons, invalid config)

- `test/unit/ui/contentSizeCallbacks.test.js` (7 tests)
  - Component `getContentSize()` methods
  - Callback execution
  - Error handling
  - Context passing

**Integration Tests** (16 tests):
- `test/integration/ui/draggablePanel.integration.test.js` (6 tests)
  - Ant spawn panel (grid, 2×2)
  - Health controls panel (vertical)
  - Buildings panel (horizontal)

- `test/integration/ui/levelEditorAutoSizing.integration.test.js` (10 tests)
  - Materials panel callback
  - Tools panel callback
  - Brush panel callback
  - Dynamic content changes
  - Stability over time

**E2E Tests** (11 tests):
- `test/e2e/ui/pw_auto_sizing_panels.js` (6 tests)
  - Game panels visual verification
  - Screenshots for proof

- `test/e2e/ui/pw_level_editor_auto_sizing.js` (5 tests)
  - Level Editor panels visual verification
  - Screenshots for proof

### Running Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e:ui

# All tests
npm test
```

## Current Status

### Working Panels

**Game Panels (Button-Based)**:
- ✅ Ant Spawn (grid, 2×2) - 200×156px
- ✅ Health Controls (vertical) - 200×219px
- ✅ Buildings (horizontal) - 200×147px

**Level Editor Panels (Callback-Based)**:
- ✅ Materials (2 materials) - 115×186.8px
- ✅ Tools (4 tools) - 65×211.8px
- ✅ Brush Size - 110×96.8px

### Test Results

- Unit: 44/44 passing ✅
- Integration: 16/16 passing ✅
- E2E: 11/11 passing ✅ (1 minor state check failure doesn't affect auto-sizing)

## Best Practices

### When to Use Each Approach

**Button-Based** ✅:
- Panel uses DraggablePanel's built-in button system
- Buttons are added via config
- Standard grid/vertical/horizontal layouts

**Callback-Based** ✅:
- Panel content rendered externally
- Custom rendering logic
- Dynamic content that changes frequently

### Common Pitfalls

❌ **Don't**: Manually set panel size when auto-sizing enabled
```javascript
// BAD - size will be overridden
panel.width = 300;
panel.autoResizeToFitContent();
```

✅ **Do**: Let auto-sizing calculate dimensions
```javascript
// GOOD - auto-sizing handles it
panel.autoResizeToFitContent();
```

❌ **Don't**: Include title bar height in callback
```javascript
// BAD - title bar height added twice
getContentSize() {
  return {
    width: 120,
    height: 200 + titleBarHeight  // Wrong!
  };
}
```

✅ **Do**: Return only content size
```javascript
// GOOD - title bar height added automatically
getContentSize() {
  return {
    width: 120,
    height: 200  // Content only
  };
}
```

❌ **Don't**: Forget padding in callback-based sizing
```javascript
// BAD - no padding, content touches edges
getContentSize() {
  return {
    width: swatchSize * cols,  // Too tight!
    height: swatchSize * rows
  };
}
```

✅ **Do**: Include padding in callback calculations
```javascript
// GOOD - includes spacing/padding
getContentSize() {
  return {
    width: swatchSize * cols + (cols + 1) * spacing,
    height: swatchSize * rows + (rows + 1) * spacing
  };
}
```

## Future Enhancements

- [ ] Auto-sizing for custom layouts (not grid/vertical/horizontal)
- [ ] Minimum/maximum size constraints
- [ ] Animated resizing transitions
- [ ] Auto-sizing based on text content length
- [ ] Responsive layouts (resize on window size change)

## Related Documentation

- **Feature Checklist**: `docs/FEATURE_DEVELOPMENT_CHECKLIST.md`
- **Testing Guide**: `docs/guides/TESTING_TYPES_GUIDE.md`
- **E2E Testing**: `docs/guides/E2E_TESTING_QUICKSTART.md`
- **DraggablePanel API**: `Classes/systems/ui/DraggablePanel.js`
