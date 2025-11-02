# Modal Window Common Methods - Quick Reference

**See Full Checklist:** `docs/checklists/MODAL_WINDOW_REFACTORING_CHECKLIST.md`

## Summary of Common Methods to Extract

### 10 Common Patterns Identified

1. **Dialog Positioning & Centering** → `getCenteredCoordinates()`, `center()`
2. **Overlay Rendering** → `renderOverlay(buffer, opacity)`
3. **Point-in-Bounds Testing** → `isPointInBounds(x, y, bounds)`
4. **Button Rendering** → `renderButton(buffer, config)`
5. **Input Field Rendering** → `renderInputField(buffer, config)`
6. **Dialog Dimensions Storage** → Base class properties
7. **Button Bounds Storage** → `setButtonBounds(id, bounds)`, `getButtonBounds(id)`
8. **Keyboard Handling** → Enhanced `handleKeyPress(key, keyCode)`
9. **Show/Hide with State Reset** → Enhanced `show()`, `hide()`
10. **Validation Error Display** → `renderValidationError(buffer, error, x, y)`

## New Dialog Base Class API

### Positioning Methods
```javascript
getCenteredCoordinates(canvasWidth, canvasHeight) // returns {x, y}
center(canvasWidth, canvasHeight)                  // updates this.x, this.y
```

### Rendering Methods
```javascript
renderOverlay(buffer, opacity = 180)
renderButton(buffer, config)
renderInputField(buffer, config)
renderValidationError(buffer, error, x, y)
```

### Bounds Management
```javascript
setButtonBounds(id, bounds)      // stores bounds for hit testing
getButtonBounds(id)              // retrieves bounds
isPointInBounds(x, y, bounds)    // hit testing utility
clearButtonBounds()              // cleanup
```

### Configuration Objects

**Button Config:**
```javascript
{
  id: 'save',           // unique identifier
  label: 'Save',        // button text
  x: 100, y: 200,       // position
  width: 120, height: 40,
  enabled: true,        // disabled state
  primary: true,        // styling (primary vs secondary)
  onClick: () => {}     // callback
}
```

**Input Field Config:**
```javascript
{
  label: 'Filename',        // field label
  value: 'terrain_001',     // current value
  x: 100, y: 150,           // position
  width: 300, height: 40,
  placeholder: 'Enter filename',
  active: false,            // focus state
  validation: (value) => ({ valid: true, error: '' })
}
```

## Affected Files

### Classes to Refactor (6)
1. `Dialog.js` - base class (add methods)
2. `SaveDialog.js` - refactor to use base methods
3. `LoadDialog.js` - refactor to use base methods
4. `ModalDialog.js` - refactor to use base methods
5. `NewMapDialog.js` - refactor to use base methods
6. `ConfirmationDialog.js` - minimal changes

### Tests to Update (4+ files)
1. `test/unit/ui/Dialog.test.js` (create new)
2. `test/unit/ui/fileDialogs.test.js`
3. `test/unit/ui/modalDialog.test.js`
4. `test/unit/ui/NewMapDialog.test.js`
5. Integration tests in `test/integration/ui/`

## Process (TDD)

1. ✅ **Analysis** - Identify common patterns (COMPLETE)
2. ⬜ **Write Tests** - Create failing tests for new methods
3. ⬜ **Implement** - Add methods to Dialog base class
4. ⬜ **Refactor** - Update subclasses to use base methods
5. ⬜ **Update Tests** - Fix subclass tests
6. ⬜ **Integration** - Test real interactions
7. ⬜ **E2E** - Browser testing with screenshots
8. ⬜ **Document** - API docs, migration guide, CHANGELOG

## Benefits

- **Reduced Duplication**: ~40% less code in subclasses
- **Consistency**: All dialogs use same rendering logic
- **Maintainability**: Fix bugs once in base class
- **Extensibility**: New dialogs easier to create
- **Testing**: Test common logic once

## Backward Compatibility

✅ **100% Backward Compatible**
- Old code still works
- Subclasses can adopt new methods gradually
- No breaking changes
- Optional migration

## Next Steps

1. Review full checklist: `docs/checklists/MODAL_WINDOW_REFACTORING_CHECKLIST.md`
2. Start Phase 2: Write tests FIRST
3. Follow TDD process strictly
4. Update tests after each phase
