# InputBox.js Analysis - Numeric Mode Gap Analysis

**Date**: November 2, 2025
**Status**: Needs Enhancement for NewMapDialog Integration

---

## 📊 Current State

**File**: `Classes/ui/_baseObjects/boxes/inputbox.js`
**Line Count**: 390 lines
**Last Modified**: Prior work (ModalDialog refactoring)

### What InputBox.js Already Has ✅

1. **Text Input Support**:
   - Character typing via `handleTextInput(char)`
   - Backspace support
   - Enter key handling
   - maxLength enforcement

2. **Focus Management**:
   - `isFocused` state
   - Focus via click (`update()` method)
   - `setFocus(focused)` method

3. **Validation Framework**:
   - `onValidate` callback
   - `validate()` method
   - `errorMessage` display
   - `isValid` state tracking

4. **Visual Rendering**:
   - `render()` method (screen rendering)
   - Focus highlighting
   - Placeholder text
   - Cursor blinking animation
   - Error message display below input

5. **Styling Support**:
   - `InputBoxStyles.DEFAULT`
   - `InputBoxStyles.MODAL`
   - `InputBoxStyles.SEARCH`
   - Customizable colors, borders, fonts

6. **CollisionBox2D Integration**:
   - `bounds` property for position/size
   - `isMouseOver(x, y)` method
   - `getBounds()` method

---

## ❌ What InputBox.js Is Missing for NewMapDialog

### 1. **Numeric Input Mode** (CRITICAL)

**Current**: Only handles text/characters
**Needed**: 
- Numeric-only input (digits 0-9)
- Integer-only mode
- Min/max value validation
- Multi-digit number handling (1234 → 123 on backspace)
- maxDigits limit (e.g., 4 digits max for "1000")

**Why NewMapDialog Needs This**:
- Width and Height are numeric values (10-1000)
- Should only accept digits, not letters
- Backspace should remove last digit (123 → 12), not last character
- Must validate range (min: 10, max: 1000)

### 2. **renderToBuffer() Method** (CRITICAL)

**Current**: Only has `render()` for screen rendering (uses global `fill()`, `rect()`, etc.)
**Needed**: 
- `renderToBuffer(buffer)` for buffer rendering (uses `buffer.fill()`, `buffer.rect()`, etc.)
- Must work exactly like Button.renderToBuffer()

**Why NewMapDialog Needs This**:
- NewMapDialog renders to a buffer (Dialog.getCacheBuffer())
- Screen rendering doesn't work in buffer contexts
- Must match Button.renderToBuffer() pattern

### 3. **Keyboard Event Return Values** (MEDIUM)

**Current**: `handleKeyPress()` returns `true/false` only
**Needed**: 
- Return event objects for Tab (`{ type: 'focus-next' }`)
- Return event objects for Enter (`{ type: 'confirm', valid: bool }`)

**Why NewMapDialog Needs This**:
- NewMapDialog needs to know when user presses Tab (switch focus)
- NewMapDialog needs to know when user presses Enter (confirm dialog)
- Boolean return doesn't convey enough information

### 4. **getValue() Numeric Support** (MEDIUM)

**Current**: Returns string value
**Needed**: 
- Return `parseInt(value)` when in numeric mode
- Return string when in text mode

**Why NewMapDialog Needs This**:
- NewMapDialog.getDimensions() returns `{ width: number, height: number }`
- Currently would need to parse manually: `parseInt(widthInput.getValue())`

### 5. **setValue() Numeric Support** (LOW)

**Current**: Accepts string value
**Needed**: 
- Accept number, convert to string when in numeric mode
- Accept string when in text mode

**Why NewMapDialog Needs This**:
- NewMapDialog resets to defaults: `widthInput.setValue(50)`
- Currently needs: `widthInput.setValue('50')` (string)

---

## 🎯 Priority Order for Implementation

### Phase 1: CRITICAL Features (Blockers)
1. **Numeric input mode** - Without this, can't type numbers properly
2. **renderToBuffer()** - Without this, won't render in NewMapDialog

### Phase 2: IMPORTANT Features (Quality of Life)
3. **Keyboard event objects** - Makes Tab/Enter handling cleaner
4. **getValue() numeric** - Avoids manual parsing
5. **setValue() numeric** - Cleaner API

---

## 📐 API Design for Numeric Mode

### Constructor Options
```javascript
const widthInput = new InputBox(x, y, width, height, {
  // NEW: Numeric mode options
  inputType: 'numeric',      // 'text' or 'numeric' (default: 'text')
  minValue: 10,              // Minimum numeric value (null = no min)
  maxValue: 1000,            // Maximum numeric value (null = no max)
  maxDigits: 4,              // Max digits (default: 10)
  integerOnly: true,         // Only integers (default: true for numeric)
  
  // Existing options
  placeholder: '50',
  ...InputBoxStyles.MODAL
});
```

### handleKeyPress() Behavior
```javascript
// BEFORE (text mode)
handleKeyPress('a') → true  // Character added

// AFTER (numeric mode)
handleKeyPress('a') → false // Ignored (not a digit)
handleKeyPress('5') → true  // Digit added
handleKeyPress('Tab', 9) → { type: 'focus-next' }
handleKeyPress('Enter', 13) → { type: 'confirm', valid: true }
handleKeyPress('Backspace', 8) → true // Last digit removed (123 → 12)
```

### getValue() Behavior
```javascript
// Text mode
inputBox.value = 'hello';
inputBox.getValue() → 'hello'

// Numeric mode
inputBox.value = '123';
inputBox.getValue() → 123  // Returns number
```

### setValue() Behavior
```javascript
// Text mode
inputBox.setValue('hello') → value = 'hello'

// Numeric mode
inputBox.setValue(123) → value = '123'
inputBox.setValue('123') → value = '123'
```

### validate() Behavior (Numeric Mode)
```javascript
// Check integer
inputBox.value = '123.45';
inputBox.validate() → false, errorMessage = 'Must be an integer'

// Check min value
inputBox.value = '5';
inputBox.validate() → false, errorMessage = 'Min: 10'

// Check max value
inputBox.value = '2000';
inputBox.validate() → false, errorMessage = 'Max: 1000'

// Valid
inputBox.value = '50';
inputBox.validate() → true, errorMessage = ''
```

---

## 🔍 Code Impact Assessment

### Files to Modify
1. **Classes/ui/_baseObjects/boxes/inputbox.js** (add numeric mode + renderToBuffer)

### New Test Files
1. **test/unit/ui/InputBox_numeric.test.js** (15+ tests)
2. **test/unit/ui/InputBox_renderToBuffer.test.js** (6+ tests)

### Affected Files
1. **Classes/ui/_baseObjects/modalWindow/NewMapDialog.js** (will use numeric mode)
2. **index.html** (already includes inputbox.js)

### No Impact
- ModalDialog.js (uses text mode, won't break)
- Existing tests (text mode behavior unchanged)

---

## ✅ Backward Compatibility

### Existing Code Safe ✅
- Default `inputType = 'text'` (no breaking changes)
- All existing text mode behavior unchanged
- ModalDialog.js continues to work as-is

### New Features Opt-In ✅
- Must explicitly set `inputType: 'numeric'` to enable
- Must explicitly call `renderToBuffer()` for buffer contexts
- `render()` method unchanged (screen rendering still works)

---

## 📝 Implementation Notes

### Pattern Consistency
- **Follow Button.js pattern**: InputBox.renderToBuffer() should mirror Button.renderToBuffer()
- **Both rendering contexts**: Keep `render()` for screen, add `renderToBuffer()` for buffers
- **No breaking changes**: Existing code continues to work

### Testing Strategy
1. **Write numeric tests FIRST** (TDD)
2. **Run tests (expect failure)**
3. **Implement numeric mode**
4. **Run tests (expect pass)**
5. **Write renderToBuffer tests FIRST**
6. **Run tests (expect failure)**
7. **Implement renderToBuffer()**
8. **Run tests (expect pass)**
9. **Integration test** with NewMapDialog
10. **E2E verification** with screenshots

---

## 🎯 Success Criteria

- [ ] InputBox supports numeric input mode
- [ ] InputBox has renderToBuffer() method
- [ ] All new tests passing (20+ tests)
- [ ] No regressions in existing ModalDialog tests
- [ ] NewMapDialog uses InputBox for width/height
- [ ] E2E screenshots show correct rendering
- [ ] Documentation updated with numeric mode examples

---

## 📊 Before/After Comparison

### Before (NewMapDialog handles input manually)
- **NewMapDialog**: 421 lines (includes all input logic)
- **InputBox**: Text-only, screen rendering only
- **Duplication**: Every dialog reimplements numeric input

### After (NewMapDialog uses InputBox)
- **NewMapDialog**: ~150 lines (delegates to InputBox)
- **InputBox**: Text + Numeric, screen + buffer rendering
- **Reusability**: All dialogs can use InputBox for any input type

**Line Savings**: 271 lines (64% reduction)
**Reusability**: InputBox can now be used in SaveDialog, LoadDialog, and future forms
