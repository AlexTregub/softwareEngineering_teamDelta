# LevelEditorSidebar

**Inherits:** None  
**File:** `Classes/ui/LevelEditorSidebar.js`

Scrollable sidebar menu with top menu bar and minimize functionality.

## Description

**LevelEditorSidebar** provides a scrollable sidebar UI component with a fixed menu bar at the top and a scrollable content area below. Uses **composition pattern** with [ScrollableContentArea](ScrollableContentArea_API_Reference.md) for content management and scrolling.

**Key features:**
- Fixed menu bar with title and minimize button
- Scrollable content area using ScrollableContentArea
- Content delegation (text, buttons, custom items)
- Click routing (menu bar vs content area)
- Hover state tracking for minimize button
- Visibility toggle
- Dynamic resizing

**Use cases:**
- Level editor tool palettes
- Settings panels
- Inspector panels
- Any sidebar UI with menu bar + scrollable content

## Tutorials

- [Level Editor Setup](../LEVEL_EDITOR_SETUP.md)
- [ScrollableContentArea API Reference](ScrollableContentArea_API_Reference.md)
- [ScrollIndicator API Reference](ScrollIndicator_API_Reference.md)

---

## Properties

| Type            | Property            | Default         | Description                              |
|-----------------|---------------------|-----------------|------------------------------------------|
| `int`           | `width`             | `300`           | Total sidebar width in pixels            |
| `int`           | `height`            | `600`           | Total sidebar height in pixels           |
| `int`           | `menuBarHeight`     | `50`            | Menu bar height in pixels                |
| `String`        | `title`             | `'Sidebar'`     | Menu bar title text                      |
| `Array<int>`    | `backgroundColor`   | `[40, 40, 40]`  | Content area background RGB              |
| `Array<int>`    | `menuBarColor`      | `[50, 50, 50]`  | Menu bar background RGB                  |
| `bool`          | `visible`           | `true`          | Visibility state                         |
| `bool`          | `minimizeHovered`   | `false`         | Minimize button hover state              |
| `ScrollableContentArea` | `contentArea` | instance        | Content area instance (composition)      |

---

## Methods

| Returns        | Method                                                                                    |
|----------------|-------------------------------------------------------------------------------------------|
| `void`         | LevelEditorSidebar ( options: `Object` = {} )                                            |
| `Object`       | addText ( id: `String`, textContent: `String`, options: `Object` = {} )                  |
| `Object`       | addButton ( id: `String`, label: `String`, callback: `Function`, options: `Object` = {} ) |
| `Object`       | addCustom ( id: `String`, renderFn: `Function`, clickFn: `Function` = null, height: `int` ) |
| `bool`         | removeItem ( id: `String` )                                                              |
| `void`         | clearAll ( )                                                                             |
| `Array<Object>` | getContentItems ( )                                                                     |
| `bool`         | handleMouseWheel ( delta: `int`, mouseX: `int`, mouseY: `int` )                         |
| `int`          | getScrollOffset ( )                                                                      |
| `int`          | getMaxScrollOffset ( )                                                                   |
| `Object`       | handleClick ( mouseX: `int`, mouseY: `int`, sidebarX: `int`, sidebarY: `int` )          |
| `void`         | updateHover ( mouseX: `int`, mouseY: `int`, sidebarX: `int`, sidebarY: `int` )          |
| `void`         | render ( x: `int`, y: `int` )                                                            |
| `int`          | getWidth ( )                                                                             |
| `int`          | getHeight ( )                                                                            |
| `int`          | getMenuBarHeight ( )                                                                     |
| `int`          | getContentAreaHeight ( )                                                                 |
| `void`         | setDimensions ( width: `int`, height: `int` )                                            |
| `bool`         | isVisible ( )                                                                            |
| `void`         | setVisible ( visible: `bool` )                                                           |
| `bool`         | hasOverflow ( )                                                                          |

---

## Property Descriptions

### <span id="width"></span>`int` **width** = `300`

Total sidebar width in pixels. Includes menu bar and content area.

---

### <span id="height"></span>`int` **height** = `600`

Total sidebar height in pixels. Content area height is `height - menuBarHeight`.

---

### <span id="menuBarHeight"></span>`int` **menuBarHeight** = `50`

Fixed menu bar height in pixels. Menu bar contains title and minimize button.

---

### <span id="title"></span>`String` **title** = `'Sidebar'`

Text displayed in menu bar on the left side.

---

### <span id="backgroundColor"></span>`Array<int>` **backgroundColor** = `[40, 40, 40]`

Content area background color as RGB array `[r, g, b]` (0-255).

---

### <span id="menuBarColor"></span>`Array<int>` **menuBarColor** = `[50, 50, 50]`

Menu bar background color as RGB array `[r, g, b]` (0-255).

---

### <span id="visible"></span>`bool` **visible** = `true`

Controls sidebar visibility. When `false`, [render](#render) does nothing.

---

### <span id="minimizeHovered"></span>`bool` **minimizeHovered** = `false`

Tracks whether mouse is hovering over minimize button. Updated by [updateHover](#updateHover).

---

### <span id="contentArea"></span>`ScrollableContentArea` **contentArea**

Internal [ScrollableContentArea](ScrollableContentArea_API_Reference.md) instance. Content management methods delegate to this instance.

**Note:** Direct access available, but prefer using delegation methods ([addText](#addText), [addButton](#addButton), etc.).

---

## Method Descriptions

### <span id="LevelEditorSidebar"></span>**LevelEditorSidebar** ( options: `Object` = {} )

Create a new sidebar menu.

```javascript
const sidebar = new LevelEditorSidebar({
  width: 300,
  height: 600,
  menuBarHeight: 50,
  title: 'Tools',
  backgroundColor: [40, 40, 40],
  menuBarColor: [50, 50, 50],
  scrollSpeed: 20
});
```

**Parameters:**
- `options.width` (`int`, optional): Sidebar width (default: `300`)
- `options.height` (`int`, optional): Sidebar height (default: `600`)
- `options.menuBarHeight` (`int`, optional): Menu bar height (default: `50`)
- `options.title` (`String`, optional): Menu bar title (default: `'Sidebar'`)
- `options.backgroundColor` (`Array<int>`, optional): Content background RGB (default: `[40, 40, 40]`)
- `options.menuBarColor` (`Array<int>`, optional): Menu bar background RGB (default: `[50, 50, 50]`)
- `options.scrollSpeed` (`int`, optional): Scroll sensitivity (default: `20`, passed to ScrollableContentArea)
- Additional options passed to ScrollableContentArea constructor

**Note:** Creates ScrollableContentArea instance with `height = options.height - options.menuBarHeight`.

---

### <span id="addText"></span>`Object` **addText** ( id: `String`, textContent: `String`, options: `Object` = {} )

Add a text item to content area. Delegates to [ScrollableContentArea.addText](ScrollableContentArea_API_Reference.md#addText).

```javascript
sidebar.addText('header', 'Terrain Tools', {
  fontSize: 16,
  color: [255, 200, 100],
  height: 30
});
```

**Parameters:**
- `id` (`String`, **required**): Unique item identifier
- `textContent` (`String`, **required**): Text to display
- `options.fontSize` (`int`, optional): Font size in pixels (default: `12`)
- `options.color` (`Array<int>`, optional): Text RGB color (default: sidebar's textColor)
- `options.height` (`int`, optional): Item height (default: `25`)
- `options.padding` (`int`, optional): Text padding (default: sidebar's itemPadding)

Returns created item object with properties: `id`, `type`, `text`, `height`, `fontSize`, `color`, `padding`, `render`.

---

### <span id="addButton"></span>`Object` **addButton** ( id: `String`, label: `String`, callback: `Function`, options: `Object` = {} )

Add a button item to content area. Delegates to [ScrollableContentArea.addButton](ScrollableContentArea_API_Reference.md#addButton).

```javascript
sidebar.addButton('grass', 'Grass', () => {
  selectTerrain('grass');
}, {
  height: 40,
  backgroundColor: [60, 120, 60]
});
```

**Parameters:**
- `id` (`String`, **required**): Unique item identifier
- `label` (`String`, **required**): Button text
- `callback` (`Function`, **required**): Click callback function
- `options.height` (`int`, optional): Button height (default: `30`)
- `options.backgroundColor` (`Array<int>`, optional): Button background RGB (default: `[60, 60, 60]`)
- `options.textColor` (`Array<int>`, optional): Button text RGB (default: `[220, 220, 220]`)

Returns created button object.

---

### <span id="addCustom"></span>`Object` **addCustom** ( id: `String`, renderFn: `Function`, clickFn: `Function` = null, height: `int` )

Add a custom rendered item. Delegates to [ScrollableContentArea.addCustom](ScrollableContentArea_API_Reference.md#addCustom).

```javascript
sidebar.addCustom('colorPicker', (x, y, width) => {
  fill([255, 0, 0]);
  rect(x, y, width, 50);
}, (mx, my, itemX, itemY, w, h) => {
  return mx >= itemX && mx < itemX + w && my >= itemY && my < itemY + h;
}, 50);
```

**Parameters:**
- `id` (`String`, **required**): Unique item identifier
- `renderFn` (`Function`, **required**): Render function `(x, y, width) => void`
- `clickFn` (`Function`, optional): Click function `(mouseX, mouseY, itemX, itemY, width, height) => boolean`
- `height` (`int`, **required**): Item height in pixels

Returns created custom item object.

---

### <span id="removeItem"></span>`bool` **removeItem** ( id: `String` )

Remove an item by ID. Delegates to [ScrollableContentArea.removeItem](ScrollableContentArea_API_Reference.md#removeItem).

```javascript
if (sidebar.removeItem('grass')) {
  console.log('Grass button removed');
}
```

**Parameters:**
- `id` (`String`, **required**): Item ID to remove

Returns `true` if item was found and removed, `false` otherwise.

---

### <span id="clearAll"></span>`void` **clearAll** ( )

Remove all content items. Delegates to [ScrollableContentArea.clearAll](ScrollableContentArea_API_Reference.md#clearAll).

```javascript
sidebar.clearAll();
// All items removed, scroll offset reset to 0
```

---

### <span id="getContentItems"></span>`Array<Object>` **getContentItems** ( )

Get array of all content items. Delegates to [ScrollableContentArea.contentItems](ScrollableContentArea_API_Reference.md#contentItems).

```javascript
const items = sidebar.getContentItems();
console.log(`Sidebar has ${items.length} items`);
```

Returns array of item objects (each has `id`, `type`, `height`, `render`, etc.).

---

### <span id="handleMouseWheel"></span>`bool` **handleMouseWheel** ( delta: `int`, mouseX: `int`, mouseY: `int` )

Handle mouse wheel scrolling. Only scrolls if mouse Y position is over content area (below menu bar).

```javascript
function mouseWheel(event) {
  const scrolled = sidebar.handleMouseWheel(event.delta, mouseX, mouseY - sidebarY);
  if (scrolled) {
    return false; // Prevent default scroll
  }
}
```

**Parameters:**
- `delta` (`int`, **required**): Mouse wheel delta (negative = scroll down)
- `mouseX` (`int`, **required**): Mouse X position (unused, for API consistency)
- `mouseY` (`int`, **required**): Mouse Y position **relative to sidebar top** (not screen coordinates)

Returns `true` if scrolling occurred, `false` if mouse over menu bar or no scroll needed.

**Note:** `mouseY` must be relative to sidebar position. If `mouseY < menuBarHeight`, no scrolling occurs.

---

### <span id="getScrollOffset"></span>`int` **getScrollOffset** ( )

Get current scroll offset. Delegates to [ScrollableContentArea.scrollOffset](ScrollableContentArea_API_Reference.md#scrollOffset).

```javascript
const offset = sidebar.getScrollOffset();
console.log(`Scrolled ${offset}px from top`);
```

Returns scroll offset in pixels (0 = top of content).

---

### <span id="getMaxScrollOffset"></span>`int` **getMaxScrollOffset** ( )

Get maximum scroll offset. Delegates to [ScrollableContentArea.maxScrollOffset](ScrollableContentArea_API_Reference.md#maxScrollOffset).

```javascript
const maxOffset = sidebar.getMaxScrollOffset();
if (sidebar.getScrollOffset() >= maxOffset) {
  console.log('Scrolled to bottom');
}
```

Returns maximum scroll offset in pixels.

---

### <span id="handleClick"></span>`Object` **handleClick** ( mouseX: `int`, mouseY: `int`, sidebarX: `int`, sidebarY: `int` )

Handle mouse click. Routes clicks to menu bar (minimize button) or content area.

```javascript
function mousePressed() {
  const result = sidebar.handleClick(mouseX, mouseY, sidebarX, sidebarY);
  
  if (result && result.type === 'minimize') {
    sidebar.setVisible(false);
  } else if (result && result.id === 'grass') {
    selectTerrain('grass');
  }
}
```

**Parameters:**
- `mouseX` (`int`, **required**): Mouse X in screen coordinates
- `mouseY` (`int`, **required**): Mouse Y in screen coordinates
- `sidebarX` (`int`, **required**): Sidebar X position on screen
- `sidebarY` (`int`, **required**): Sidebar Y position on screen

Returns:
- `{ type: 'minimize' }` if minimize button clicked
- `{ id: 'itemId', type: 'button', ... }` if content item clicked
- `null` if menu bar clicked (but not minimize button)

**Click routing:**
1. If click within menu bar (`Y < menuBarHeight`), check minimize button
2. Otherwise, delegate to contentArea with transformed coordinates

---

### <span id="updateHover"></span>`void` **updateHover** ( mouseX: `int`, mouseY: `int`, sidebarX: `int`, sidebarY: `int` )

Update hover states for minimize button and content items. Call each frame in `draw()`.

```javascript
function draw() {
  sidebar.updateHover(mouseX, mouseY, sidebarX, sidebarY);
  sidebar.render(sidebarX, sidebarY);
}
```

**Parameters:**
- `mouseX` (`int`, **required**): Mouse X in screen coordinates
- `mouseY` (`int`, **required**): Mouse Y in screen coordinates
- `sidebarX` (`int`, **required**): Sidebar X position on screen
- `sidebarY` (`int`, **required**): Sidebar Y position on screen

Updates [minimizeHovered](#minimizeHovered) property and delegates content hover to contentArea.

---

### <span id="render"></span>`void` **render** ( x: `int`, y: `int` )

Render sidebar at specified position. Renders menu bar (background, title, minimize button) and content area.

```javascript
function draw() {
  background(30);
  sidebar.render(20, 50);
}
```

**Parameters:**
- `x` (`int`, **required**): Sidebar X position on screen
- `y` (`int`, **required**): Sidebar Y position on screen

Does nothing if [visible](#visible) is `false`.

**Rendering order:**
1. Menu bar background (fill with menuBarColor)
2. Title text (left side)
3. Minimize button (right side, hover state affects color)
4. Content area (delegates to ScrollableContentArea at `y + menuBarHeight`)

**Note:** Uses `push()`/`pop()` for transform isolation.

---

### <span id="getWidth"></span>`int` **getWidth** ( )

Get total sidebar width.

```javascript
const w = sidebar.getWidth(); // 300 (default)
```

Returns width in pixels.

---

### <span id="getHeight"></span>`int` **getHeight** ( )

Get total sidebar height.

```javascript
const h = sidebar.getHeight(); // 600 (default)
```

Returns height in pixels.

---

### <span id="getMenuBarHeight"></span>`int` **getMenuBarHeight** ( )

Get menu bar height.

```javascript
const menuH = sidebar.getMenuBarHeight(); // 50 (default)
```

Returns menu bar height in pixels.

---

### <span id="getContentAreaHeight"></span>`int` **getContentAreaHeight** ( )

Get content area height. Calculated as `height - menuBarHeight`.

```javascript
const contentH = sidebar.getContentAreaHeight(); // 550 (if height=600, menuBarHeight=50)
```

Returns content area height in pixels.

---

### <span id="setDimensions"></span>`void` **setDimensions** ( width: `int`, height: `int` )

Update sidebar dimensions. Automatically updates contentArea dimensions.

```javascript
sidebar.setDimensions(400, 800);
// width=400, height=800, contentArea.height=750
```

**Parameters:**
- `width` (`int`, **required**): New width in pixels
- `height` (`int`, **required**): New height in pixels

**Note:** Content area height updated to `height - menuBarHeight`. Menu bar height remains constant.

---

### <span id="isVisible"></span>`bool` **isVisible** ( )

Check if sidebar is visible.

```javascript
if (sidebar.isVisible()) {
  sidebar.render(x, y);
}
```

Returns `true` if visible, `false` otherwise.

---

### <span id="setVisible"></span>`void` **setVisible** ( visible: `bool` )

Set sidebar visibility.

```javascript
// Hide sidebar
sidebar.setVisible(false);

// Show sidebar
sidebar.setVisible(true);
```

**Parameters:**
- `visible` (`bool`, **required**): Visibility state

**Note:** When `false`, [render](#render) does nothing.

---

### <span id="hasOverflow"></span>`bool` **hasOverflow** ( )

Check if content area has overflow (requires scrolling).

```javascript
if (sidebar.hasOverflow()) {
  console.log('Content exceeds viewport - scroll enabled');
}
```

Returns `true` if total content height exceeds visible height, `false` otherwise.

Delegates to `ScrollableContentArea.calculateTotalHeight()` and `getVisibleHeight()`.

---

## Common Workflows

### Basic Sidebar Setup

```javascript
// Create sidebar
const sidebar = new LevelEditorSidebar({
  width: 300,
  height: 600,
  title: 'Terrain Tools'
});

// Add content
sidebar.addText('header', 'Select Terrain', { fontSize: 14 });
sidebar.addButton('grass', 'Grass', () => selectTerrain('grass'));
sidebar.addButton('stone', 'Stone', () => selectTerrain('stone'));
sidebar.addButton('water', 'Water', () => selectTerrain('water'));

// Render in draw()
function draw() {
  sidebar.updateHover(mouseX, mouseY, 20, 50);
  sidebar.render(20, 50);
}
```

---

### Handle User Interactions

```javascript
// Mouse wheel scrolling
function mouseWheel(event) {
  const relativeY = mouseY - sidebarY;
  const scrolled = sidebar.handleMouseWheel(event.delta, mouseX, relativeY);
  if (scrolled) {
    return false; // Prevent page scroll
  }
}

// Mouse clicks
function mousePressed() {
  const result = sidebar.handleClick(mouseX, mouseY, sidebarX, sidebarY);
  
  if (!result) return; // Click not handled
  
  if (result.type === 'minimize') {
    sidebar.setVisible(false);
  } else if (result.id === 'grass') {
    console.log('Grass button clicked!');
  }
}
```

---

### Dynamic Content Management

```javascript
// Clear all and repopulate
sidebar.clearAll();

const terrainTypes = ['grass', 'stone', 'water', 'sand', 'dirt'];
terrainTypes.forEach(type => {
  sidebar.addButton(type, capitalize(type), () => selectTerrain(type), {
    backgroundColor: getTerrainColor(type)
  });
});

// Remove specific items
sidebar.removeItem('water');

// Check content
const items = sidebar.getContentItems();
console.log(`Sidebar has ${items.length} items`);
```

---

### Minimize/Maximize Toggle

```javascript
let sidebarVisible = true;

function mousePressed() {
  const result = sidebar.handleClick(mouseX, mouseY, sidebarX, sidebarY);
  
  if (result && result.type === 'minimize') {
    sidebarVisible = !sidebarVisible;
    sidebar.setVisible(sidebarVisible);
  }
}

// Show button to restore sidebar
function draw() {
  if (!sidebarVisible) {
    drawRestoreButton(sidebarX, sidebarY);
  } else {
    sidebar.updateHover(mouseX, mouseY, sidebarX, sidebarY);
    sidebar.render(sidebarX, sidebarY);
  }
}
```

---

### Responsive Sidebar Sizing

```javascript
function windowResized() {
  const newHeight = min(windowHeight - 100, 800);
  sidebar.setDimensions(300, newHeight);
}

// Check if scrolling needed
if (sidebar.hasOverflow()) {
  console.log('Scrolling enabled');
} else {
  console.log('All content fits - no scrolling needed');
}
```

---

## Notes

**Composition Pattern:** LevelEditorSidebar uses composition (not inheritance) with ScrollableContentArea. Content management methods delegate to the internal `contentArea` instance.

**Coordinate Systems:**
- `render(x, y)` - Sidebar screen position
- `handleClick(mouseX, mouseY, sidebarX, sidebarY)` - Screen coords + sidebar position
- `handleMouseWheel(delta, mouseX, mouseY)` - mouseY is **relative to sidebar top**

**Menu Bar Layout:**
- Title: Left side, 10px padding
- Minimize button: Right side, 5px margin, 40px width

**Click Routing:**
- Menu bar clicks (Y < menuBarHeight): Check minimize button, else return null
- Content clicks (Y >= menuBarHeight): Delegate to contentArea with transformed coordinates

**Scrolling:**
- Only occurs if mouse Y > menuBarHeight (not over menu bar)
- Delegates to ScrollableContentArea.handleMouseWheel()
- Negative delta = scroll down (increase offset)

**Visibility:**
- When `visible = false`, render() does nothing (early return)
- Use for minimize/maximize functionality

---

## Related Documentation

- [ScrollableContentArea API Reference](ScrollableContentArea_API_Reference.md) - Content area component
- [ScrollIndicator API Reference](ScrollIndicator_API_Reference.md) - Scroll indicator component
- [Level Editor Setup](../LEVEL_EDITOR_SETUP.md) - Integration guide
