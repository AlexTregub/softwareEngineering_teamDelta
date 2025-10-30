# NewMapDialog

**Inherits:** Dialog < UIObject  
**File:** `Classes/ui/NewMapDialog.js`

Modal dialog for entering map dimensions when creating a new level in the Level Editor.

## Description

NewMapDialog provides a user interface for specifying map dimensions (width and height in tiles) when creating a new level. The dialog includes input validation, keyboard shortcuts (Tab, Enter, Escape), and visual feedback for invalid input. It extends the Dialog base class and integrates with the LevelEditor for terrain creation.

**Key Features:**
- Input fields for width and height (in tiles)
- Real-time validation (10-200 tiles per dimension)
- Default dimensions: 50x50 tiles
- Keyboard shortcuts: Tab (switch fields), Enter (confirm), Escape (cancel)
- Visual feedback: Error messages, button states, active field highlighting
- Integration with LevelEditor._createNewTerrain()

## Tutorials

- [Level Editor Setup Guide](../LEVEL_EDITOR_SETUP.md)
- [Dialog System Architecture](../checklists/NEW_MAP_SIZE_DIALOG_CHECKLIST.md)

## Properties

| Type      | Property                | Default     | Description                                |
|-----------|-------------------------|-------------|--------------------------------------------|
| `int`     | `_width`                | `50`        | Current width input value (tiles)          |
| `int`     | `_height`               | `50`        | Current height input value (tiles)         |
| `String`  | `_activeField`          | `'width'`   | Currently focused field ('width'/'height') |
| `String`  | `_validationError`      | `''`        | Current validation error message           |
| `Object`  | `_widthInputBounds`     | `null`      | Bounding box for width input field         |
| `Object`  | `_heightInputBounds`    | `null`      | Bounding box for height input field        |
| `Object`  | `_createButtonBounds`   | `null`      | Bounding box for Create button             |
| `Object`  | `_cancelButtonBounds`   | `null`      | Bounding box for Cancel button             |
| `Function`| `onConfirm`             | `null`      | Callback when Create button clicked        |
| `Function`| `onCancel`              | `null`      | Callback when Cancel button clicked        |

## Constants

| Name            | Value | Description                      |
|-----------------|-------|----------------------------------|
| `MIN_DIMENSION` | `10`  | Minimum allowed dimension (tiles)|
| `MAX_DIMENSION` | `200` | Maximum allowed dimension (tiles)|

## Methods

| Returns    | Method                                                                     |
|------------|----------------------------------------------------------------------------|
| `void`     | NewMapDialog ( )                                                          |
| `Object`   | getDimensions ( ) const                                                   |
| `void`     | setActiveField ( field: `String` )                                        |
| `Object`   | validateDimensions ( ) const                                              |
| `bool`     | handleKeyPress ( key: `String`, keyCode: `int` )                          |
| `bool`     | handleClick ( mouseX: `int`, mouseY: `int` )                              |
| `void`     | confirm ( )                                                               |
| `void`     | show ( )                                                                  |
| `void`     | hide ( )                                                                  |
| `void`     | renderContent ( buffer: `p5.Graphics` )                                   |

---

## Constants Description

### <span id="min_dimension"></span>MIN_DIMENSION = `10`

Minimum allowed dimension for width or height. Values below this trigger validation error: "Dimensions must be 10-200 tiles".

**Rationale**: Maps smaller than 10x10 tiles are too small for meaningful gameplay.

---

### <span id="max_dimension"></span>MAX_DIMENSION = `200`

Maximum allowed dimension for width or height. Values above this trigger validation error: "Dimensions must be 10-200 tiles".

**Rationale**: Maps larger than 200x200 tiles cause performance issues (40,000+ tiles).

---

## Property Descriptions

### <span id="width"></span>_width: `int` (default: `50`)

Current width input value in tiles. Automatically validated when modified. Resets to 50 when dialog shown.

---

### <span id="height"></span>_height: `int` (default: `50`)

Current height input value in tiles. Automatically validated when modified. Resets to 50 when dialog shown.

---

### <span id="activefield"></span>_activeField: `String` (default: `'width'`)

Currently focused input field. Either `'width'` or `'height'`. Tab key cycles between fields. Highlighted with yellow border when active.

---

### <span id="validationerror"></span>_validationError: `String` (default: `''`)

Current validation error message. Set by `validateDimensions()`. Displayed in red below input fields. Empty string = no error.

---

### <span id="onconfirm"></span>onConfirm: `Function` (default: `null`)

Callback function invoked when user clicks Create button (and validation passes). Receives `(width, height)` as arguments.

**Example**:
```javascript
dialog.onConfirm = (width, height) => {
  console.log(`Creating map: ${width}x${height}`);
  levelEditor._createNewTerrain(width, height);
  dialog.hide();
};
```

---

### <span id="oncancel"></span>onCancel: `Function` (default: `null`)

Callback function invoked when user clicks Cancel button or presses Escape key. No arguments.

**Example**:
```javascript
dialog.onCancel = () => {
  console.log('Map creation cancelled');
  dialog.hide();
};
```

---

## Method Descriptions

### <span id="constructor"></span>void **NewMapDialog** ( )

Constructor. Creates a new NewMapDialog instance with default 50x50 dimensions. Inherits from Dialog with 400x320 size and "New Map" title.

```javascript
const dialog = new NewMapDialog();
```

**Note:** Dialog is hidden by default. Call `show()` to display.

---

### <span id="getdimensions"></span>Object **getDimensions** ( ) const

Returns the current width and height values as an object.

```javascript
const dims = dialog.getDimensions();
console.log(`Width: ${dims.width}, Height: ${dims.height}`);
```

Returns `{ width: int, height: int }`.

---

### <span id="setactivefield"></span>void **setActiveField** ( field: `String` )

Sets the currently active input field. Marks dialog dirty to trigger re-render with new highlight.

**Parameters:**
- `field` (String, **required**): Either `'width'` or `'height'`

```javascript
dialog.setActiveField('height');
```

**Note:** Tab key automatically cycles active field.

---

### <span id="validatedimensions"></span>Object **validateDimensions** ( ) const

Validates current width and height against MIN_DIMENSION and MAX_DIMENSION bounds. Checks for integer values.

```javascript
const result = dialog.validateDimensions();
if (!result.valid) {
  console.error(result.error); // "Dimensions must be 10-200 tiles"
}
```

Returns `{ valid: bool, error?: String }`.

**Validation Rules:**
- Both width and height must be integers
- Both must be >= MIN_DIMENSION (10)
- Both must be <= MAX_DIMENSION (200)

---

### <span id="handlekeypress"></span>bool **handleKeyPress** ( key: `String`, keyCode: `int` )

Handles keyboard input for the dialog. Processes Tab, Enter, Escape, numeric input (0-9), and Backspace.

**Parameters:**
- `key` (String, **required**): Key character (e.g., '5', 'Tab')
- `keyCode` (int, **required**): Numeric key code (e.g., 27 for Escape)

```javascript
const consumed = dialog.handleKeyPress('5', 53);
if (consumed) {
  console.log('Dialog consumed key press');
}
```

Returns `true` if key press was handled, `false` otherwise.

**Key Bindings:**
- **Tab (9)**: Cycle active field (width ↔ height)
- **Enter (13)**: Confirm if validation passes
- **Escape (27)**: Cancel dialog
- **0-9**: Append digit to active field (max 3 digits)
- **Backspace (8)**: Remove last digit from active field

**Note:** Enter only confirms if `validateDimensions()` returns valid=true.

---

### <span id="handleclick"></span>bool **handleClick** ( mouseX: `int`, mouseY: `int` )

Handles mouse clicks within the dialog. Detects clicks on input fields (to set active field) and buttons (Create/Cancel).

**Parameters:**
- `mouseX` (int, **required**): Mouse X coordinate (screen space)
- `mouseY` (int, **required**): Mouse Y coordinate (screen space)

```javascript
const consumed = dialog.handleClick(mouseX, mouseY);
```

Returns `true` if click was handled, `false` otherwise.

**Click Regions:**
- **Width Input Field**: Sets `_activeField = 'width'`
- **Height Input Field**: Sets `_activeField = 'height'`
- **Create Button**: Calls `confirm()` if validation passes
- **Cancel Button**: Calls `hide()` and `onCancel()` callback

**Note:** Create button only responds to clicks if validation passes (enabled state).

---

### <span id="confirm"></span>void **confirm** ( )

Confirms the dialog. Invokes `onConfirm(width, height)` callback and hides dialog.

```javascript
dialog.confirm();
```

**Note:** Only call if `validateDimensions()` returns valid=true. Called automatically by Enter key and Create button.

---

### <span id="show"></span>void **show** ( )

Shows the dialog. Resets dimensions to default (50x50), clears validation error, sets active field to width, and calls parent `show()`.

```javascript
dialog.show();
```

**Note:** Resets state to defaults every time dialog is shown.

---

### <span id="hide"></span>void **hide** ( )

Hides the dialog. Calls parent `hide()` to set visible=false.

```javascript
dialog.hide();
```

---

### <span id="rendercontent"></span>void **renderContent** ( buffer: `p5.Graphics` )

Renders the dialog content (input fields, labels, buttons, error message). Called by parent Dialog.render().

**Parameters:**
- `buffer` (p5.Graphics, **required**): Graphics buffer to draw onto

```javascript
// Called automatically by Dialog.render()
dialog.renderContent(buffer);
```

**Renders:**
- "Width:" and "Height:" labels (black text, size 16)
- Width and height input fields (white background, yellow border if active)
- Validation hint: "Min: 10 tiles, Max: 200 tiles" (gray text)
- Error message (red text, only if validation fails)
- Create button (blue if valid, gray if invalid)
- Cancel button (gray)

**Note:** This method is abstract in Dialog and must be implemented by subclasses.

---

## Common Workflows

### Basic Usage (LevelEditor Integration)

```javascript
// In LevelEditor.initialize()
this.newMapDialog = new NewMapDialog();

// Wire up callbacks
this.newMapDialog.onConfirm = (width, height) => {
  this._createNewTerrain(width, height);
  this.newMapDialog.hide();
};
this.newMapDialog.onCancel = () => {
  this.newMapDialog.hide();
};

// In LevelEditor.handleFileNew()
if (this.isModified) {
  const confirmed = confirm("Discard unsaved changes?");
  if (!confirmed) return false;
}
this.newMapDialog.show();
return true;
```

### Input Blocking During Dialog

```javascript
// In LevelEditor.handleClick()
if (this.newMapDialog && this.newMapDialog.isVisible()) {
  const consumed = this.newMapDialog.handleClick(mouseX, mouseY);
  return; // Block terrain interaction
}

// In LevelEditor.handleKeyPress()
if (this.newMapDialog && this.newMapDialog.isVisible()) {
  const consumed = this.newMapDialog.handleKeyPress(key, keyCode);
  if (consumed) return; // Block shortcuts
}
```

### Rendering Dialog

```javascript
// In LevelEditor.render()
if (this.newMapDialog && this.newMapDialog.isVisible()) {
  this.newMapDialog.render();
}
```

### Custom Validation

```javascript
const validation = dialog.validateDimensions();
if (!validation.valid) {
  console.error('Invalid dimensions:', validation.error);
  // Display error to user
}
```

---

## Notes

**Input Validation:**
- Values are automatically clamped to 10-200 range
- Non-numeric input is rejected
- Exceeding 3 digits per field is prevented

**Keyboard Shortcuts:**
- Tab cycles between width and height fields
- Enter confirms (only if validation passes)
- Escape cancels
- Numeric keys append to active field
- Backspace removes last digit

**Visual Feedback:**
- Active field highlighted with yellow border
- Error messages displayed in red
- Create button disabled (gray) when validation fails
- Create button enabled (blue) when validation passes

**Performance:**
- Dialog uses cache system from UIObject
- Re-renders only when marked dirty
- Validation runs in O(1) time

**Integration:**
- Dialog blocks all terrain interaction when visible
- Keyboard input consumed by dialog takes priority
- Callbacks provide clean separation of concerns

---

## Related Docs

- [Dialog API Reference](Dialog_API_Reference.md) - Base dialog class
- [UIObject API Reference](UIObject_API_Reference.md) - Base UI component
- [Level Editor Setup](../LEVEL_EDITOR_SETUP.md) - User guide
- [New Map Dialog Checklist](../checklists/NEW_MAP_SIZE_DIALOG_CHECKLIST.md) - Implementation details
