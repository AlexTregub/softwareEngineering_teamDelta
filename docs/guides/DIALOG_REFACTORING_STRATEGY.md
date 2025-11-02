# Dialog Refactoring Strategy

## Overview
This document describes the systematic approach for refactoring UI dialogs to eliminate duplication, improve maintainability, and leverage parent class functionality.

## Core Principle: "Push Common Patterns Up"

When you see the same code in 2+ dialog subclasses, it belongs in the Dialog parent class.

---

## Refactoring Process (Step-by-Step)

### Phase 1: Identify Duplication Patterns

**Look for repeated code across dialog subclasses:**

1. **Coordinate conversion** (screen → dialog-relative)
2. **Mouse hover handling** (updateHover calls)
3. **Animation loops** (continuous rendering for blinking cursors)
4. **Text rendering** (instructions, hints, validation messages)
5. **Modal overlay rendering** (semi-transparent backgrounds)
6. **Component creation** (multiple similar InputBox/Button instances)

**Red Flags (Code Smells):**
- Same 5+ lines repeated in multiple dialogs
- Manual coordinate math (`mouseX - this.x`)
- Multiple `if` checks for `undefined` globals
- Repeated `buffer.fill()`, `buffer.textAlign()`, `buffer.text()` patterns
- Copying entire methods between dialogs

---

### Phase 2: Write Tests FIRST (TDD)

**CRITICAL**: Write tests before changing ANY code.

**Test File**: `test/unit/ui/Dialog_patterns.test.js`

**For each new parent class method:**

```javascript
describe('newParentMethod()', function() {
  it('should perform core behavior', function() {
    // Arrange
    const mockChild = { property: value };
    dialog.getChildren = () => [mockChild];
    
    // Act
    dialog.newParentMethod();
    
    // Assert
    expect(mockChild.property).to.equal(expectedValue);
  });
  
  it('should handle edge cases gracefully', function() {
    // Test null/undefined, empty arrays, etc.
  });
});
```

**Run tests - confirm they FAIL:**
```bash
npx mocha "test/unit/ui/Dialog_patterns.test.js"
# Expected: X failing tests
```

---

### Phase 3: Implement Parent Class Methods

**Location**: `Classes/ui/_baseObjects/modalWindow/Dialog.js`

**Pattern 1: Hook Methods (Children Override)**
```javascript
/**
 * Get child components that support feature X
 * Subclasses override to return their components
 * @returns {Array} Components with required methods/properties
 */
getFeatureXChildren() {
  return []; // Default: empty array
}
```

**Pattern 2: Helper Methods (Children Call)**
```javascript
/**
 * Perform action on all children
 * Converts coordinates, applies styling, etc.
 */
performActionOnChildren() {
  // Get global state (mouseX, canvas size, etc.)
  const globalState = this.getGlobalState();
  
  // Iterate children and apply action
  this.getFeatureXChildren().forEach(child => {
    if (child && child.requiredMethod) {
      child.requiredMethod(globalState);
    }
  });
}
```

**Pattern 3: Override Parent Behavior**
```javascript
/**
 * Override base class method to add new behavior
 * Call super.method() to preserve parent logic
 */
render() {
  // Add new pre-render logic
  const needsAction = this.checkCondition();
  if (needsAction) {
    this.performAction();
  }
  
  // Preserve parent behavior
  if (super.render) {
    super.render();
  }
}
```

**Run tests - confirm they PASS:**
```bash
npx mocha "test/unit/ui/Dialog_patterns.test.js"
# Expected: All tests passing
```

---

### Phase 4: Refactor Child Classes

**For each dialog subclass:**

**BEFORE (duplicated code):**
```javascript
class MyDialog extends Dialog {
  render() {
    // 15 lines of manual logic
    if (this.input1 && (this.input1.isFocused || this.input1.isHovered)) {
      this.markDirty();
    }
    if (this.input2 && (this.input2.isFocused || this.input2.isHovered)) {
      this.markDirty();
    }
    if (this.input3 && (this.input3.isFocused || this.input3.isHovered)) {
      this.markDirty();
    }
    super.render();
  }
  
  renderContent(buffer) {
    // 20 lines of manual coordinate conversion
    if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
      const relX = mouseX - (this.x || 0);
      const relY = mouseY - (this.y || 0);
      this.input1.updateHover(relX, relY);
      this.input2.updateHover(relX, relY);
      this.input3.updateHover(relX, relY);
    }
    // ... more rendering
  }
}
```

**AFTER (parent handles logic):**
```javascript
class MyDialog extends Dialog {
  // render() method removed - parent handles it!
  
  getAnimatableChildren() {
    return [this.input1, this.input2, this.input3];
  }
  
  getHoverableChildren() {
    return [this.input1, this.input2, this.input3];
  }
  
  renderContent(buffer) {
    // Single line replaces 7 lines
    this.updateChildHovers();
    
    // ... rest of rendering
  }
}
```

**Run subclass tests - confirm still passing:**
```bash
npx mocha "test/unit/ui/MyDialog.test.js"
```

---

### Phase 5: E2E Verification

**Run browser tests to confirm real-world behavior:**
```bash
node test/e2e/ui/pw_mydialog_interactions.js
```

**Verify:**
- ✅ Visual appearance unchanged
- ✅ Hover states work
- ✅ Animations work (cursor blink)
- ✅ User interactions work (click, keyboard)

---

## Specific Refactoring Techniques

### Technique 1: Hover State Management

**Duplication Pattern:**
```javascript
// Repeated in every dialog with hoverable components
if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
  const relX = mouseX - (this.x || 0);
  const relY = mouseY - (this.y || 0);
  this.component1.updateHover(relX, relY);
  this.component2.updateHover(relX, relY);
  // ... more components
}
```

**Solution:**

**Parent (Dialog.js):**
```javascript
updateChildHovers() {
  if (typeof mouseX === 'undefined' || typeof mouseY === 'undefined') return;
  
  const relX = mouseX - (this.x || 0);
  const relY = mouseY - (this.y || 0);
  
  this.getHoverableChildren().forEach(child => {
    if (child && child.updateHover) {
      child.updateHover(relX, relY);
    }
  });
}

getHoverableChildren() {
  return []; // Subclasses override
}
```

**Child:**
```javascript
getHoverableChildren() {
  return [this.input1, this.input2];
}

renderContent(buffer) {
  this.updateChildHovers(); // One line!
}
```

---

### Technique 2: Continuous Rendering for Animations

**Duplication Pattern:**
```javascript
// Repeated in every dialog with animated components
render() {
  if (this.component1 && (this.component1.isFocused || this.component1.isHovered)) {
    this.markDirty();
  }
  if (this.component2 && (this.component2.isFocused || this.component2.isHovered)) {
    this.markDirty();
  }
  super.render();
}
```

**Solution:**

**Parent (Dialog.js):**
```javascript
render() {
  const needsAnimation = this.getAnimatableChildren().some(child => 
    child && (child.isFocused || child.isHovered)
  );
  
  if (needsAnimation) {
    this.markDirty();
  }
  
  if (super.render) {
    super.render();
  }
}

getAnimatableChildren() {
  return []; // Subclasses override
}
```

**Child:**
```javascript
getAnimatableChildren() {
  return [this.input1, this.input2];
}
// render() method removed - parent handles it!
```

---

### Technique 3: Text Rendering Helpers

**Duplication Pattern:**
```javascript
// Repeated in every dialog
buffer.fill(200);
buffer.textAlign(buffer.CENTER, buffer.TOP);
buffer.textSize(14);
buffer.text('Instruction text', centerX, y);

// Later...
buffer.fill(150);
buffer.textAlign(buffer.CENTER, buffer.TOP);
buffer.textSize(12);
buffer.text('Hint text', centerX, y2);
```

**Solution:**

**Parent (Dialog.js):**
```javascript
renderInstructionText(buffer, text, x, y, size = 14, color = 200) {
  if (!buffer) return;
  buffer.fill(color);
  buffer.textAlign(buffer.CENTER, buffer.TOP);
  buffer.textSize(size);
  buffer.text(text, x, y);
}

renderHintText(buffer, text, x, y, size = 12, color = 150) {
  if (!buffer) return;
  buffer.fill(color);
  buffer.textAlign(buffer.CENTER, buffer.TOP);
  buffer.textSize(size);
  buffer.text(text, x, y);
}
```

**Child:**
```javascript
renderContent(buffer) {
  this.renderInstructionText(buffer, 'Enter value:', centerX, y);
  this.renderHintText(buffer, 'Min: 10, Max: 100', centerX, y2);
}
```

---

### Technique 4: Component Creation with Spread Operator

**Duplication Pattern:**
```javascript
// Same 13 lines repeated with only 2 differences
this.input1 = new InputBox(x, y1, w, h, {
  parent: this,
  inputType: 'numeric',
  minValue: 10,
  maxValue: 100,
  maxDigits: 4,
  integerOnly: true,
  value: '50',
  placeholder: 'Width'  // DIFFERENCE 1
});

this.input2 = new InputBox(x, y2, w, h, {  // DIFFERENCE 2
  parent: this,
  inputType: 'numeric',
  minValue: 10,
  maxValue: 100,
  maxDigits: 4,
  integerOnly: true,
  value: '50',
  placeholder: 'Height'
});
```

**Solution:**
```javascript
// Base options (shared config)
const baseOptions = {
  parent: this,
  inputType: 'numeric',
  minValue: 10,
  maxValue: 100,
  maxDigits: 4,
  integerOnly: true,
  value: '50'
};

// Configs (what differs)
const configs = [
  { input: 'input1', yOffset: 0, placeholder: 'Width' },
  { input: 'input2', yOffset: 50, placeholder: 'Height' }
];

// Create with spread operator
configs.forEach(({ input, yOffset, placeholder }) => {
  this[input] = new InputBox(
    x, y + yOffset, w, h,
    { ...baseOptions, placeholder }
  );
});
```

**Benefits:**
- Reduces 26 lines → 15 lines
- Adding 3rd input = add one line to configs array
- All shared logic in one place

---

### Technique 5: Remove Unnecessary Guards

**Anti-Pattern:**
```javascript
// Overly defensive checks for globals that MUST exist
if (typeof push !== 'undefined' && typeof pop !== 'undefined') {
  push();
  // ...
  pop();
}

if (typeof g_canvasX !== 'undefined') {
  const width = g_canvasX;
}
```

**Problem**: If `push`, `pop`, `g_canvasX` are undefined, the entire app is broken. These checks hide real problems.

**Solution:**
```javascript
// Trust that globals exist (fail fast if they don't)
push();
// ...
pop();

const canvasWidth = this.getCanvasWidth(); // Parent method
```

**When to remove guards:**
- ✅ Core p5.js functions (`push`, `pop`, `fill`, `rect`, `image`)
- ✅ Canvas dimensions (`g_canvasX`, `g_canvasY`)
- ✅ Core game globals that MUST exist for app to work

**When to keep guards:**
- ❌ User input (`mouseX`, `mouseY` - may not exist in tests)
- ❌ Optional features (debug mode, analytics)
- ❌ Browser APIs (localStorage may be disabled)

---

### Technique 6: Clean JSDoc (Remove Refactoring Commentary)

**Anti-Pattern:**
```javascript
/**
 * Create InputBox instances for width and height
 * REFACTORED: Uses config-driven approach to eliminate duplication
 * Benefits: Reduces 26 lines to 15, easier to add new inputs
 * @private
 */
_createInputBoxes() {
  // Base configuration shared by both inputs
  const baseOptions = { /* ... */ };
  
  // Create both inputs with specific overrides
  configs.forEach(({ input, yOffset, placeholder }) => {
    // Create using spread operator for efficiency
    this[input] = new InputBox(x, y + yOffset, w, h, { ...baseOptions, placeholder });
  });
}

/**
 * Override renderToScreen to add modal overlay before dialog
 * Uses parent helper methods for canvas dimensions and overlay rendering
 * This eliminates 10+ lines of boilerplate code
 */
renderToScreen() {
  // Render modal overlay using parent helper
  this.renderModalOverlay();
  
  // Then render dialog on top
  super.renderToScreen();
}
```

**Problem**: Code looks "recently refactored" instead of professional. Comments explain *how* instead of *what*.

**Solution:**
```javascript
/**
 * Initialize width and height input fields
 * @private
 */
_createInputBoxes() {
  const baseOptions = { /* ... */ };
  
  configs.forEach(({ input, yOffset, placeholder }) => {
    this[input] = new InputBox(x, y + yOffset, w, h, { ...baseOptions, placeholder });
  });
}

/**
 * Render modal overlay and dialog
 */
renderToScreen() {
  this.renderModalOverlay();
  super.renderToScreen();
}
```

**Guidelines:**
- ✅ Document parameters, return types, exceptions
- ✅ Brief description of *what* the method does
- ✅ Keep JSDoc concise (1-2 lines when possible)
- ❌ Remove "REFACTORED" tags or refactoring history
- ❌ Remove comments explaining *why* you chose a pattern
- ❌ Remove inline comments for self-explanatory code
- ❌ Remove "benefits" or "saves X lines" commentary

**When to clean up:**
- After all tests pass
- Before committing to repository
- When code review shows verbose documentation
- When preparing production release

---

## Metrics for Success

**Before Refactoring:**
- Child class: 400+ lines
- Duplication: 20+ lines repeated across 3+ dialogs
- Tests: Pass ✅

**After Refactoring:**
- Child class: 300-350 lines (15-25% reduction)
- Duplication: 0 lines (moved to parent)
- Parent class: +50-100 lines (reusable helpers)
- Tests: All pass ✅ (behavior unchanged)
- E2E: All pass ✅ (visual unchanged)

**Net Result:**
- **Less code overall** (3 dialogs × 20 lines saved = 60 lines vs 50 added to parent)
- **Easier to maintain** (change once in parent, all children benefit)
- **Consistent behavior** (all dialogs use same hover/animation/text logic)

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Refactoring Without Tests
**Problem**: Break behavior without noticing  
**Solution**: Write tests FIRST, run after every change

### ❌ Pitfall 2: Making Parent Too Specific
**Problem**: Parent method assumes child structure  
**Solution**: Use hook methods (getChildren) so parent doesn't know child details

### ❌ Pitfall 3: Removing All Child Logic
**Problem**: Children become empty shells, lose clarity  
**Solution**: Leave dialog-specific logic in child (validation rules, callbacks)

### ❌ Pitfall 4: Batching Changes
**Problem**: Change 5 things at once, tests fail, can't identify cause  
**Solution**: Refactor ONE pattern at a time, test, commit, repeat

### ❌ Pitfall 5: Skipping E2E Tests
**Problem**: Unit tests pass but visuals broken in browser  
**Solution**: Always run E2E tests with screenshots after refactoring

---

## Refactoring Checklist Template

Use this checklist for each refactoring effort:

### Pre-Refactoring
- [ ] Identify duplication pattern (hover, animation, text, etc.)
- [ ] Document expected behavior (what should NOT change)
- [ ] Ensure all existing tests pass

### TDD Phase
- [ ] Write parent class tests (Dialog_patterns.test.js)
- [ ] Run tests - confirm FAIL
- [ ] Implement parent class method
- [ ] Run tests - confirm PASS

### Refactor Phase
- [ ] Update first child class to use parent method
- [ ] Run child unit tests - confirm PASS
- [ ] Run child E2E tests - confirm PASS
- [ ] Repeat for remaining child classes

### Verification Phase
- [ ] All unit tests passing (Dialog + all children)
- [ ] All E2E tests passing (screenshots verify visuals)
- [ ] Code review (check for proper abstractions)
- [ ] Commit with clear message

---

## Example: Complete Refactoring Session

**Goal**: Eliminate hover duplication in SaveDialog, LoadDialog, NewMapDialog

**Step 1: TDD**
```bash
# Add tests to Dialog_patterns.test.js
# Run: npx mocha "test/unit/ui/Dialog_patterns.test.js"
# Result: 5 failing (expected)
```

**Step 2: Implement**
```javascript
// Dialog.js - add updateChildHovers() and getHoverableChildren()
// Run: npx mocha "test/unit/ui/Dialog_patterns.test.js"
// Result: All passing ✅
```

**Step 3: Refactor NewMapDialog**
```javascript
// Replace 7 lines with:
getHoverableChildren() { return [this.widthInput, this.heightInput]; }
this.updateChildHovers();
// Run: npx mocha "test/unit/ui/NewMapDialog_refactored.test.js"
// Result: 36/36 passing ✅
// Run: node test/e2e/ui/pw_newmap_dialog_interactions.js
// Result: 5/5 passing ✅
```

**Step 4: Refactor SaveDialog** (repeat Step 3)

**Step 5: Refactor LoadDialog** (repeat Step 3)

**Result:**
- Parent: +20 lines (reusable)
- NewMapDialog: -5 lines
- SaveDialog: -5 lines
- LoadDialog: -5 lines
- **Net: -5 lines total, +consistent behavior**

---

## Future Opportunities

**Other patterns to consider:**
1. **Modal overlay rendering** - `renderModalOverlay()` helper
2. **Canvas size retrieval** - `getCanvasWidth()`, `getCanvasHeight()` helpers
3. **Button layout** - `positionButtonsAtBottom()` helper
4. **Input validation display** - `renderValidationErrors()` helper
5. **Keyboard shortcuts** - `handleCommonKeyPress()` helper (ESC, ENTER)

**When to refactor:**
- Pattern appears in 2+ dialogs → consider refactoring
- Pattern appears in 3+ dialogs → definitely refactor

---

## Summary

**Golden Rule**: If you write the same code twice, extract it to a parent method.

**Process**: TDD → Implement Parent → Refactor Children → Verify E2E

**Success**: Less code, consistent behavior, all tests passing ✅
