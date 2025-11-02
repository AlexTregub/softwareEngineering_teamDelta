# Modal Window Refactoring - Visual Guide

## Current Structure (Before Refactoring)

```
Dialog (Base Class)
├── show()
├── hide()
├── confirm()
├── cancel()
├── handleKeyPress()
└── renderToCache()

SaveDialog
├── show()                        ← DUPLICATE positioning logic
├── hide()                        ← DUPLICATE state reset
├── render()                      ← DUPLICATE overlay rendering
├── handleClick()                 ← DUPLICATE bounds testing
├── isPointInside()              ← DUPLICATE bounds testing
├── renderButton() [inline]      ← DUPLICATE button rendering
└── renderInputField() [inline]  ← DUPLICATE input rendering

LoadDialog
├── show()                        ← DUPLICATE positioning logic
├── hide()                        ← DUPLICATE state reset
├── render()                      ← DUPLICATE overlay rendering
├── handleClick()                 ← DUPLICATE bounds testing
├── isPointInside()              ← DUPLICATE bounds testing
└── renderButton() [inline]      ← DUPLICATE button rendering

ModalDialog
├── show()                        ← DUPLICATE positioning logic
├── hide()                        ← DUPLICATE state reset
├── render()                      ← DUPLICATE overlay rendering
├── handleClick()                 ← DUPLICATE bounds testing
├── renderButton() [inline]      ← DUPLICATE button rendering
└── renderInputField() [inline]  ← DUPLICATE input rendering

NewMapDialog
├── show()                        ← DUPLICATE positioning logic
├── hide()                        ← DUPLICATE state reset
├── renderToScreen()              ← DUPLICATE overlay rendering
├── handleClick()                 ← DUPLICATE bounds testing
├── isPointInBounds()            ← DUPLICATE bounds testing
├── renderButton() [inline]      ← DUPLICATE button rendering
└── renderInputField() [inline]  ← DUPLICATE input rendering
```

## New Structure (After Refactoring)

```
Dialog (Enhanced Base Class)
├── Positioning
│   ├── getCenteredCoordinates(w, h) → {x, y}
│   └── center(w, h)                  → updates this.x, this.y
├── Rendering
│   ├── renderOverlay(buffer, opacity)
│   ├── renderButton(buffer, config)
│   ├── renderInputField(buffer, config)
│   └── renderValidationError(buffer, error, x, y)
├── Bounds Management
│   ├── setButtonBounds(id, bounds)
│   ├── getButtonBounds(id)
│   ├── isPointInBounds(x, y, bounds)
│   └── clearButtonBounds()
├── State Management (Enhanced)
│   ├── show()                        → with state reset
│   ├── hide()                        → with cleanup
│   ├── confirm()
│   ├── cancel()
│   └── handleKeyPress(key, keyCode)  → common handlers
└── Existing
    └── renderToCache()

SaveDialog (Refactored)
├── Uses: this.center()
├── Uses: this.renderOverlay()
├── Uses: this.renderButton()
├── Uses: this.renderInputField()
├── Uses: this.setButtonBounds()
├── Uses: this.isPointInBounds()
└── Custom: filename validation, format selection

LoadDialog (Refactored)
├── Uses: this.center()
├── Uses: this.renderOverlay()
├── Uses: this.renderButton()
├── Uses: this.setButtonBounds()
├── Uses: this.isPointInBounds()
└── Custom: file listing, selection, search

ModalDialog (Refactored)
├── Uses: this.center()
├── Uses: this.renderOverlay()
├── Uses: this.renderButton()
├── Uses: this.renderInputField()
├── Uses: this.renderValidationError()
└── Custom: dynamic button configuration

NewMapDialog (Refactored)
├── Uses: this.center()
├── Uses: this.renderOverlay()
├── Uses: this.renderButton()
├── Uses: this.renderInputField()
├── Uses: this.renderValidationError()
├── Uses: this.setButtonBounds()
├── Uses: this.isPointInBounds()
└── Custom: dimension validation, field switching
```

## Code Reduction Example

### Before (SaveDialog - render method)
```javascript
render() {
  if (!this.visible) return;
  
  push();
  
  // DUPLICATE: Positioning
  const dialogX = (g_canvasX || 1920) / 2 - this.dialogWidth / 2;
  const dialogY = (g_canvasY || 1080) / 2 - this.dialogHeight / 2;
  
  // DUPLICATE: Overlay
  noStroke();
  fill(0, 0, 0, 180);
  rect(0, 0, g_canvasX || 1920, g_canvasY || 1080);
  
  // DUPLICATE: Dialog box
  fill(50, 50, 60);
  stroke(100, 100, 120);
  rect(dialogX, dialogY, this.dialogWidth, this.dialogHeight, 8);
  
  // DUPLICATE: Button rendering (Save)
  fill(60, 120, 60);
  stroke(80, 140, 80);
  rect(saveButtonX, buttonY, buttonWidth, buttonHeight, 4);
  fill(255);
  text('Save', saveButtonX + buttonWidth / 2, buttonY + buttonHeight / 2);
  
  // DUPLICATE: Button rendering (Cancel)
  fill(120, 60, 60);
  stroke(140, 80, 80);
  rect(cancelButtonX, buttonY, buttonWidth, buttonHeight, 4);
  fill(255);
  text('Cancel', cancelButtonX + buttonWidth / 2, buttonY + buttonHeight / 2);
  
  // DUPLICATE: Input field
  fill(30, 30, 40);
  stroke(100, 100, 120);
  rect(inputX, inputY, inputWidth, inputHeight, 4);
  fill(255);
  text(this.filename, inputX + 10, inputY + inputHeight / 2);
  
  pop();
}
```

### After (SaveDialog - render method)
```javascript
render() {
  if (!this.visible) return;
  
  // Get buffer (from UIObject)
  const buffer = this.getCacheBuffer();
  if (!buffer) return;
  
  // Position dialog
  this.center(g_canvasX || 1920, g_canvasY || 1080);
  
  // Render overlay
  this.renderOverlay(buffer);
  
  // Render input field
  this.renderInputField(buffer, {
    label: 'Filename',
    value: this.filename,
    x: 30, y: 110,
    width: this.width - 60,
    height: 40
  });
  
  // Render buttons
  this.renderButton(buffer, {
    id: 'save',
    label: 'Save',
    x: this.width - 260,
    y: this.height - 60,
    width: 120, height: 40,
    primary: true,
    onClick: () => this.onSave && this.onSave()
  });
  
  this.renderButton(buffer, {
    id: 'cancel',
    label: 'Cancel',
    x: this.width - 130,
    y: this.height - 60,
    width: 120, height: 40,
    primary: false,
    onClick: () => this.onCancel && this.onCancel()
  });
}
```

**Result:** ~50% less code, more readable, more maintainable

## Backward Compatibility Strategy

### Phase 1: Add Base Methods (No Breaking Changes)
```javascript
// Old code still works
dialog.show();
dialog.render(); // Uses old inline rendering

// New code available
dialog.center(width, height);
dialog.renderButton(buffer, config);
```

### Phase 2: Gradual Migration
```javascript
// Subclass can choose when to adopt
class SaveDialog extends Dialog {
  render() {
    // Option A: Keep old code (works)
    // ... old rendering logic ...
    
    // Option B: Migrate to new methods (better)
    this.renderOverlay(buffer);
    this.renderButton(buffer, config);
  }
}
```

### Phase 3: Full Adoption
```javascript
// All subclasses use base methods
// Old inline rendering removed
// Cleaner, more consistent codebase
```

## Testing Strategy

### Unit Tests (Base Class)
```javascript
describe('Dialog Base Class', () => {
  it('getCenteredCoordinates() returns centered position', () => {
    const dialog = new Dialog({ width: 400, height: 300 });
    const coords = dialog.getCenteredCoordinates(1920, 1080);
    expect(coords.x).to.equal(760);  // (1920 - 400) / 2
    expect(coords.y).to.equal(390);  // (1080 - 300) / 2
  });
  
  it('renderButton() calls buffer methods correctly', () => {
    const buffer = createMockBuffer();
    dialog.renderButton(buffer, { x: 10, y: 20, width: 100, height: 40 });
    expect(buffer.rect).to.have.been.calledWith(10, 20, 100, 40);
  });
});
```

### Unit Tests (Subclasses)
```javascript
describe('SaveDialog', () => {
  it('calls base class renderButton() for Save button', () => {
    const dialog = new SaveDialog();
    sinon.spy(dialog, 'renderButton');
    dialog.render();
    expect(dialog.renderButton).to.have.been.calledWith(
      sinon.match.any,
      sinon.match({ id: 'save', label: 'Save' })
    );
  });
});
```

### Integration Tests
```javascript
it('SaveDialog renders correctly with base class methods', () => {
  const dialog = new SaveDialog();
  dialog.show();
  const buffer = dialog.getCacheBuffer();
  expect(buffer).to.exist;
  expect(dialog.x).to.be.above(0);  // centered
  expect(dialog.y).to.be.above(0);
});
```

### E2E Tests (with Screenshots)
```javascript
it('SaveDialog displays correctly in browser', async () => {
  await page.evaluate(() => {
    window.saveDialog.show();
    redraw();
  });
  await sleep(500);
  await saveScreenshot(page, 'dialogs/save_dialog', true);
});
```

## Benefits Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines of code (total) | ~2000 | ~1200 | -40% |
| Duplicate methods | 7 | 0 | -100% |
| Test coverage | 65% | 85% | +20% |
| Maintainability | Medium | High | ↑ |
| Consistency | Low | High | ↑ |

## Common Pitfalls to Avoid

1. ❌ **Don't skip tests** - Write tests FIRST
2. ❌ **Don't batch refactor** - One class at a time
3. ❌ **Don't break backward compatibility** - Keep old code working
4. ❌ **Don't skip documentation** - Update as you go
5. ❌ **Don't skip E2E tests** - Visual regressions are real
6. ✅ **Do run tests frequently** - After each small change
7. ✅ **Do commit often** - Small, focused commits
8. ✅ **Do review checklist** - Don't skip steps

## Timeline Visual

```
Week 1:
[====================] Phase 1-3: Analysis, Tests, Implementation (5 hours)

Week 2:
[====================] Phase 4-6: Refactor, Update Tests, Integration (4 hours)

Week 3:
[==========] Phase 7-9: E2E, Documentation, Review (2 hours)

Total: ~11 hours across 2-3 weeks (1-2 hours per day)
```

## Success Metrics

- ✅ All tests pass (100% green)
- ✅ Code duplication eliminated
- ✅ Test coverage >80%
- ✅ No console errors
- ✅ No visual regressions
- ✅ Documentation complete
- ✅ Backward compatible

Ready to start? See: `docs/checklists/MODAL_WINDOW_REFACTORING_CHECKLIST.md`
