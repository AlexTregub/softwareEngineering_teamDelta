# ScrollableContentArea

**Inherits:** None (standalone component)

**File:** `Classes/ui/ScrollableContentArea.js`

A high-performance scrollable content container with viewport culling and integrated scroll indicators. Manages dynamic content (text, buttons, custom items) with automatic scrolling, click delegation, and visual feedback via ScrollIndicator component.

## Description

ScrollableContentArea provides a scrollable viewport for managing lists of content items with automatic scroll indicator rendering and viewport culling for performance. It's designed for UI panels that need to display more content than fits in the available space, such as level editor toolbars, event lists, or settings panels.

**Key features:**
- **Viewport culling**: Only renders visible items for O(visible) performance instead of O(total)
- **ScrollIndicator integration**: Automatic scroll arrows (composition, not inheritance)
- **Three item types**: Text (static labels), Buttons (interactive), Custom (full control)
- **Mouse interactions**: Scroll wheel support, click delegation with scroll offset transformation
- **Dynamic content**: Add/remove items at runtime, automatic scroll bound updates
- **Hover effects**: Built-in hover state management for interactive elements

**Typical use cases:**
- Level editor sidebars (tools, events, terrain types)
- Settings panels with many options
- Chat/log windows with scrollable messages
- File/asset browsers

## Tutorials

- [Level Editor Setup Guide](../LEVEL_EDITOR_SETUP.md) - Using ScrollableContentArea in level editor sidebar
- [Scroll Indicator Component Checklist](../checklists/SCROLL_INDICATOR_COMPONENT_CHECKLIST.md) - Implementation details

## Properties

| Type              | Property              | Default              | Description                                              |
|-------------------|-----------------------|----------------------|----------------------------------------------------------|
| `number`          | `width`               | `300`                | Content area width in pixels                             |
| `number`          | `height`              | `600`                | Content area height (viewport) in pixels                 |
| `number`          | `scrollOffset`        | `0`                  | Current scroll position (0 = top)                        |
| `number`          | `maxScrollOffset`     | `0`                  | Maximum scroll position (calculated)                     |
| `number`          | `scrollSpeed`         | `20`                 | Mouse wheel scroll sensitivity                           |
| `Array<Object>`   | `contentItems`        | `[]`                 | Array of content items (text, buttons, custom)           |
| `number`          | `itemPadding`         | `5`                  | Default padding for items                                |
| `Array<number>`   | `backgroundColor`     | `[40, 40, 40]`       | Background color RGB                                     |
| `Array<number>`   | `textColor`           | `[200, 200, 200]`    | Default text color RGB                                   |
| `ScrollIndicator` | `scrollIndicator`     | (auto-created)       | ScrollIndicator instance for arrows                      |
| `Function`        | `onItemClick`         | `null`               | Global item click callback (item) => void                |
| `Function`        | `onScroll`            | `null`               | Scroll event callback (offset, maxOffset) => void        |

## Methods

| Returns                    | Method                                                                                           |
|----------------------------|--------------------------------------------------------------------------------------------------|
| `Object`                   | addText ( id: `String`, text: `String`, options: `Object` = {} )                                |
| `Object`                   | addButton ( id: `String`, label: `String`, callback: `Function`, options: `Object` = {} )       |
| `Object`                   | addCustom ( id: `String`, renderFn: `Function`, clickFn: `Function` = null, height: `number` )  |
| `bool`                     | removeItem ( id: `String` )                                                                      |
| `void`                     | clearAll ( )                                                                                     |
| `number`                   | calculateTotalHeight ( ) const                                                                   |
| `number`                   | getVisibleHeight ( ) const                                                                       |
| `number`                   | calculateMaxScrollOffset ( ) const                                                               |
| `void`                     | updateScrollBounds ( )                                                                           |
| `void`                     | clampScrollOffset ( )                                                                            |
| `Array<Object>`            | getVisibleItems ( ) const                                                                        |
| `bool`                     | handleMouseWheel ( delta: `number` )                                                             |
| `Object` or `null`         | handleClick ( mouseX: `number`, mouseY: `number`, areaX: `number`, areaY: `number` )            |
| `void`                     | updateHover ( mouseX: `number`, mouseY: `number`, areaX: `number`, areaY: `number` )            |
| `void`                     | render ( x: `number`, y: `number` )                                                              |
| `void`                     | setDimensions ( width: `number`, height: `number` )                                              |
| `number`                   | getTotalHeight ( ) const                                                                         |

## Property Descriptions

### <span id="width"></span>`number` **width**

Content area width in pixels. Determines the width of the scrollable viewport and all content items.

---

### <span id="height"></span>`number` **height**

Content area height in pixels. This is the viewport height - the visible portion of the content. Content taller than this will require scrolling.

---

### <span id="scrollOffset"></span>`number` **scrollOffset**

Current scroll position in pixels. `0` means scrolled to the top. Increases as you scroll down. Automatically clamped between `0` and `maxScrollOffset`.

---

### <span id="maxScrollOffset"></span>`number` **maxScrollOffset**

Maximum allowed scroll position. Calculated as `totalContentHeight - visibleHeight`. If content fits in viewport, this is `0` (no scrolling needed).

---

### <span id="scrollSpeed"></span>`number` **scrollSpeed**

Mouse wheel scroll sensitivity. Applied as `delta * (scrollSpeed / 10)`. Higher values = faster scrolling. Default `20` provides smooth scrolling.

---

### <span id="contentItems"></span>`Array<Object>` **contentItems**

Array of content items. Each item has:
- `id` (String): Unique identifier
- `type` (String): 'text', 'button', or 'custom'
- `height` (number): Item height in pixels
- `render` (Function): Render function (x, y, width) => void
- Additional properties based on type (text, callback, isHovered, etc.)

---

### <span id="scrollIndicator"></span>`ScrollIndicator` **scrollIndicator**

ScrollIndicator instance used to render scroll arrows. Automatically created in constructor. Configured via `indicatorHeight`, `indicatorBg`, and `indicatorArrow` constructor options.

---

### <span id="onItemClick"></span>`Function` **onItemClick**

Global click callback invoked when any item is clicked. Signature: `(item) => void`. Called in addition to item-specific callbacks.

**Example:**
```javascript
const contentArea = new ScrollableContentArea({
  onItemClick: (item) => {
    console.log(`Clicked: ${item.id}`);
  }
});
```

---

### <span id="onScroll"></span>`Function` **onScroll**

Scroll event callback invoked when scroll position changes. Signature: `(scrollOffset, maxScrollOffset) => void`. Useful for updating external scroll indicators or saving scroll position.

**Example:**
```javascript
const contentArea = new ScrollableContentArea({
  onScroll: (offset, max) => {
    const percent = (offset / max) * 100;
    console.log(`Scrolled ${percent.toFixed(0)}%`);
  }
});
```

---

## Method Descriptions

### <span id="addtext"></span>`Object` **addText** ( id: `String`, text: `String`, options: `Object` = {} )

Add a static text item to the content area.

```javascript
const item = contentArea.addText('title', 'Level Editor', {
  height: 30,
  fontSize: 16,
  color: [255, 255, 0],
  padding: 10
});
```

**Parameters:**
- `id` (String, **required**): Unique identifier for the item
- `text` (String, **required**): Text content to display
- `options` (Object, optional): Configuration object
  - `height` (number): Item height in pixels (default: 25)
  - `fontSize` (number): Text size (default: 12)
  - `color` (Array<number>): RGB color (default: `textColor`)
  - `padding` (number): Left padding (default: `itemPadding`)

Returns the created item object with `id`, `type`, `height`, `text`, `fontSize`, `color`, `padding`, and `render` function.

**Note:** Text items are not interactive - use `addButton()` for clickable items.

---

### <span id="addbutton"></span>`Object` **addButton** ( id: `String`, label: `String`, callback: `Function`, options: `Object` = {} )

Add an interactive button item to the content area.

```javascript
const btn = contentArea.addButton('spawn-enemy', 'Spawn Enemy', () => {
  console.log('Spawning enemy...');
  eventManager.triggerEvent('spawn-enemy');
}, {
  height: 40,
  backgroundColor: [60, 120, 60]
});
```

**Parameters:**
- `id` (String, **required**): Unique identifier for the button
- `label` (String, **required**): Button text
- `callback` (Function, **required**): Click callback, invoked when button is clicked
- `options` (Object, optional): Configuration object
  - `height` (number): Button height (default: 35)
  - `backgroundColor` (Array<number>): Button background RGB (default: [70, 70, 70])
  - `textColor` (Array<number>): Button text RGB (default: `textColor`)
  - `padding` (number): Text padding (default: `itemPadding`)

Returns the created button object with `id`, `type`, `height`, `label`, `callback`, `backgroundColor`, `textColor`, `isHovered`, `render`, and `containsPoint` functions.

**Note:** Buttons automatically manage hover state via `updateHover()`.

---

### <span id="addcustom"></span>`Object` **addCustom** ( id: `String`, renderFn: `Function`, clickFn: `Function` = null, height: `number` )

Add a custom item with full control over rendering and click behavior.

```javascript
const separator = contentArea.addCustom('sep1', 
  (x, y, width) => {
    fill([100, 100, 100]);
    rect(x, y + 5, width, 2);
  },
  null,  // No click handler
  15     // Height
);

const complexWidget = contentArea.addCustom('widget1',
  (x, y, width) => {
    // Custom rendering logic
    fill([80, 80, 200]);
    rect(x, y, width, 60);
    fill([255, 255, 255]);
    text('Complex Widget', x + 10, y + 30);
  },
  (mouseX, mouseY, itemX, itemY, width, height) => {
    // Custom click logic
    console.log('Widget clicked at', mouseX, mouseY);
    return true; // Click handled
  },
  60  // Height
);
```

**Parameters:**
- `id` (String, **required**): Unique identifier
- `renderFn` (Function, **required**): Render function `(x, y, width) => void`
- `clickFn` (Function, optional): Click function `(mouseX, mouseY, itemX, itemY, width, height) => boolean`. Return `true` if click was handled
- `height` (number, **required**): Item height in pixels

Returns the created custom item object.

**Note:** Custom items provide maximum flexibility but require manual implementation of all visual and interactive features.

---

### <span id="removeitem"></span>`bool` **removeItem** ( id: `String` )

Remove an item by its ID.

```javascript
contentArea.addButton('btn1', 'Delete Me', () => {});
const removed = contentArea.removeItem('btn1');
console.log(removed); // true

const removed2 = contentArea.removeItem('nonexistent');
console.log(removed2); // false
```

**Parameters:**
- `id` (String, **required**): ID of the item to remove

Returns `true` if item was found and removed, `false` otherwise.

**Note:** Automatically calls `updateScrollBounds()` to recalculate scroll limits.

---

### <span id="clearall"></span>`void` **clearAll** ( )

Remove all content items and reset scroll position to top.

```javascript
contentArea.clearAll();
console.log(contentArea.contentItems.length); // 0
console.log(contentArea.scrollOffset); // 0
```

**Note:** Automatically calls `updateScrollBounds()`.

---

### <span id="calculatetotalheight"></span>`number` **calculateTotalHeight** ( ) const

Calculate the total height of all content items.

```javascript
contentArea.addText('txt1', 'Item 1', { height: 50 });
contentArea.addText('txt2', 'Item 2', { height: 30 });
const total = contentArea.calculateTotalHeight();
console.log(total); // 80
```

Returns total height in pixels (sum of all item heights).

---

### <span id="getvisibleheight"></span>`number` **getVisibleHeight** ( ) const

Get the visible content height accounting for scroll indicators.

```javascript
// Content area height: 600px
// No scrolling: indicators not shown
console.log(contentArea.getVisibleHeight()); // 600

// Add lots of content: bottom indicator shown (20px)
for (let i = 0; i < 50; i++) {
  contentArea.addText(`txt${i}`, `Item ${i}`, { height: 50 });
}
contentArea.updateScrollBounds();
console.log(contentArea.getVisibleHeight()); // 580 (600 - 20)

// Scroll to middle: both indicators shown (40px)
contentArea.scrollOffset = 100;
console.log(contentArea.getVisibleHeight()); // 560 (600 - 40)
```

Returns visible height in pixels. This is the actual rendering area after subtracting scroll indicator heights.

**Note:** Uses `scrollIndicator.getTotalHeight()` to determine how much vertical space indicators occupy.

---

### <span id="calculatemaxscrolloffset"></span>`number` **calculateMaxScrollOffset** ( ) const

Calculate the maximum scroll offset based on content and visible height.

```javascript
// Total content: 1000px, Visible height: 580px (with indicator)
const maxScroll = contentArea.calculateMaxScrollOffset();
console.log(maxScroll); // 420 (1000 - 580)
```

Returns maximum scroll offset in pixels. Returns `0` if content fits in viewport.

**Note:** Accounts for scroll indicator heights via `getVisibleHeight()`.

---

### <span id="updatescrollbounds"></span>`void` **updateScrollBounds** ( )

Recalculate `maxScrollOffset` and clamp `scrollOffset` to valid range. Called automatically when content changes (add/remove/clear).

```javascript
contentArea.addText('txt1', 'Item 1', { height: 500 });
// updateScrollBounds() called automatically

contentArea.scrollOffset = 9999; // Out of range
contentArea.updateScrollBounds();
console.log(contentArea.scrollOffset); // Clamped to maxScrollOffset
```

**Note:** Call manually if you modify item heights directly.

---

### <span id="clampscrolloffset"></span>`void` **clampScrollOffset** ( )

Clamp `scrollOffset` to valid range `[0, maxScrollOffset]`.

```javascript
contentArea.scrollOffset = -50;
contentArea.clampScrollOffset();
console.log(contentArea.scrollOffset); // 0

contentArea.scrollOffset = 9999;
contentArea.clampScrollOffset();
console.log(contentArea.scrollOffset); // maxScrollOffset
```

**Note:** Called automatically by `updateScrollBounds()` and `handleMouseWheel()`.

---

### <span id="getvisibleitems"></span>`Array<Object>` **getVisibleItems** ( ) const

Get only the items visible in the current viewport. **Viewport culling for performance.**

```javascript
// Add 100 items (50px each = 5000px total)
for (let i = 0; i < 100; i++) {
  contentArea.addText(`txt${i}`, `Item ${i}`, { height: 50 });
}

// Visible height: 580px, so ~11-12 items visible
const visible = contentArea.getVisibleItems();
console.log(visible.length); // ~12 (not 100!)

// Each visible item has: { item, y }
visible.forEach(({ item, y }) => {
  console.log(`${item.id} at y=${y}`);
});
```

Returns array of `{ item, y }` objects where:
- `item`: The content item object
- `y`: Y position relative to viewport top (accounts for scroll offset)

**Performance:** O(visible) not O(total). With 100 items and 12 visible, this is 8x faster than rendering all items.

**Note:** Used internally by `render()`. Early exits when past viewport bottom.

---

### <span id="handlemousewheel"></span>`bool` **handleMouseWheel** ( delta: `number` )

Handle mouse wheel scrolling.

```javascript
// In parent's mouse wheel handler
function mouseWheel(event) {
  const consumed = contentArea.handleMouseWheel(event.delta);
  if (consumed) {
    return false; // Prevent default scroll
  }
}

// Scroll down (delta negative)
contentArea.handleMouseWheel(-1);
// scrollOffset increases by scrollSpeed/10 = 2px

// Scroll up (delta positive)
contentArea.handleMouseWheel(1);
// scrollOffset decreases by 2px
```

**Parameters:**
- `delta` (number, **required**): Mouse wheel delta (negative = scroll down, positive = scroll up)

Returns `true` if scrolling occurred, `false` if no scrolling was needed (content fits or already at limit).

**Scroll calculation:** `scrollOffset -= delta * (scrollSpeed / 10)`

**Note:** Automatically clamps to valid range and triggers `onScroll` callback if scroll position changed.

---

### <span id="handleclick"></span>`Object` or `null` **handleClick** ( mouseX: `number`, mouseY: `number`, areaX: `number`, areaY: `number` )

Handle click on content area with automatic coordinate transformation for scroll offset.

```javascript
// In parent's mousePressed() handler
function mousePressed() {
  const clicked = contentArea.handleClick(mouseX, mouseY, panelX, panelY);
  if (clicked) {
    console.log(`Clicked: ${clicked.id}`);
  }
}

// Example with button
contentArea.addButton('tool1', 'Paint Tool', () => {
  console.log('Paint tool selected');
});

// User clicks at screen position (150, 100)
// Content area is at (10, 50)
const clicked = contentArea.handleClick(150, 100, 10, 50);
// Transforms to content space: (150-10, 100-50) = (140, 50)
// Accounts for scrollOffset in Y calculation
```

**Parameters:**
- `mouseX` (number, **required**): Mouse X in screen coordinates
- `mouseY` (number, **required**): Mouse Y in screen coordinates
- `areaX` (number, **required**): Content area X position on screen
- `areaY` (number, **required**): Content area Y position on screen

Returns the clicked item object or `null` if no item was clicked.

**Coordinate transformation:**
- Transforms screen coordinates to content space
- Accounts for scroll offset: `contentY = screenY - areaY + scrollOffset`
- Only checks visible items (performance optimization)

**Note:** Automatically calls item's `callback` (for buttons) and global `onItemClick`.

---

### <span id="updatehover"></span>`void` **updateHover** ( mouseX: `number`, mouseY: `number`, areaX: `number`, areaY: `number` )

Update hover states for interactive items (buttons).

```javascript
// In parent's draw() or mouseMoved() handler
function draw() {
  contentArea.updateHover(mouseX, mouseY, panelX, panelY);
  contentArea.render(panelX, panelY);
}
```

**Parameters:**
- `mouseX` (number, **required**): Mouse X in screen coordinates
- `mouseY` (number, **required**): Mouse Y in screen coordinates
- `areaX` (number, **required**): Content area X position on screen
- `areaY` (number, **required**): Content area Y position on screen

**Note:** Sets `isHovered` property on buttons. Only affects buttons - text and custom items are not affected.

---

### <span id="render"></span>`void` **render** ( x: `number`, y: `number` )

Render the scrollable content area with scroll indicators.

```javascript
function draw() {
  contentArea.render(10, 50);
}
```

**Parameters:**
- `x` (number, **required**): X position to render at
- `y` (number, **required**): Y position to render at

**Rendering order:**
1. Top scroll indicator (if can scroll up)
2. Background rectangle
3. Visible items only (viewport culling)
4. Bottom scroll indicator (if can scroll down)

**Note:** Uses `push()/pop()` for transform isolation. Only calls render on visible items via `getVisibleItems()`.

---

### <span id="setdimensions"></span>`void` **setDimensions** ( width: `number`, height: `number` )

Update content area dimensions and recalculate scroll bounds.

```javascript
contentArea.setDimensions(400, 800);
console.log(contentArea.width); // 400
console.log(contentArea.height); // 800
// maxScrollOffset recalculated automatically
```

**Parameters:**
- `width` (number, **required**): New width in pixels
- `height` (number, **required**): New height in pixels

**Note:** Automatically calls `updateScrollBounds()` to recalculate scroll limits.

---

### <span id="gettotalheight"></span>`number` **getTotalHeight** ( ) const

Get the total height of the content area (viewport height, not content height).

```javascript
console.log(contentArea.getTotalHeight()); // 600 (viewport height)

// To get content height, use:
console.log(contentArea.calculateTotalHeight()); // e.g., 2000 (all items)
```

Returns the `height` property (viewport height).

**Note:** This is NOT the scrollable content height. Use `calculateTotalHeight()` for total content height.

---

## Common Workflows

### Level Editor Sidebar with Tools

```javascript
// Create scrollable sidebar
const sidebar = new ScrollableContentArea({
  width: 200,
  height: 600,
  scrollSpeed: 25,
  backgroundColor: [30, 30, 30],
  onItemClick: (item) => {
    console.log(`Tool selected: ${item.id}`);
  }
});

// Add title
sidebar.addText('title', 'Terrain Tools', {
  fontSize: 16,
  color: [255, 255, 100],
  height: 30
});

// Add separator
sidebar.addCustom('sep1', (x, y, w) => {
  fill([80, 80, 80]);
  rect(x, y + 5, w, 2);
}, null, 15);

// Add tool buttons
const tools = ['Grass', 'Dirt', 'Stone', 'Water', 'Sand', 'Moss'];
tools.forEach((tool, i) => {
  sidebar.addButton(`tool-${i}`, tool, () => {
    currentTool = tool;
    console.log(`Selected: ${tool}`);
  }, {
    height: 40,
    backgroundColor: [60, 80, 100]
  });
});

// Render in draw loop
function draw() {
  sidebar.updateHover(mouseX, mouseY, 10, 50);
  sidebar.render(10, 50);
}

// Handle mouse wheel
function mouseWheel(event) {
  sidebar.handleMouseWheel(event.delta);
}

// Handle clicks
function mousePressed() {
  sidebar.handleClick(mouseX, mouseY, 10, 50);
}
```

### Dynamic Event List with Add/Remove

```javascript
const eventList = new ScrollableContentArea({
  width: 300,
  height: 400,
  onScroll: (offset, max) => {
    saveScrollPosition(offset); // Persist scroll state
  }
});

// Add events dynamically
function addEvent(eventData) {
  eventList.addButton(
    `event-${eventData.id}`,
    eventData.name,
    () => triggerEvent(eventData.id),
    { height: 35 }
  );
}

// Remove event
function removeEvent(eventId) {
  eventList.removeItem(`event-${eventId}`);
}

// Bulk update
function refreshEventList(events) {
  eventList.clearAll();
  events.forEach(addEvent);
}
```

### Mixed Content with Custom Widgets

```javascript
const panel = new ScrollableContentArea({
  width: 350,
  height: 500
});

// Header
panel.addText('header', 'Configuration', {
  fontSize: 18,
  color: [255, 200, 100],
  height: 35
});

// Description
panel.addText('desc', 'Adjust game settings below:', {
  fontSize: 12,
  height: 25
});

// Settings buttons
panel.addButton('settings-audio', 'Audio Settings', () => {
  openAudioPanel();
}, { height: 40 });

// Custom slider widget
panel.addCustom('volume-slider', (x, y, w) => {
  // Draw slider background
  fill([60, 60, 60]);
  rect(x + 10, y + 15, w - 20, 10);
  
  // Draw slider thumb
  const thumbX = x + 10 + (volume * (w - 20));
  fill([100, 150, 200]);
  rect(thumbX - 5, y + 10, 10, 20);
  
  // Draw label
  fill([200, 200, 200]);
  textAlign(LEFT, CENTER);
  text(`Volume: ${Math.round(volume * 100)}%`, x + 10, y + 40);
}, (mX, mY, iX, iY, w, h) => {
  // Click handler for slider
  const relX = mX - (iX + 10);
  volume = Math.max(0, Math.min(1, relX / (w - 20)));
  return true;
}, 50);

// More buttons
panel.addButton('settings-graphics', 'Graphics Settings', () => {
  openGraphicsPanel();
}, { height: 40 });
```

---

## Notes

**Performance Optimization**: ScrollableContentArea uses viewport culling to only render visible items. With 100 items and a viewport showing 12, you get ~8x performance improvement compared to rendering all items.

**ScrollIndicator Integration**: The component automatically manages scroll indicator visibility based on scroll state. Indicators only appear when scrolling is possible in that direction.

**Content Management**: Items are stored in order added. To reorder, remove and re-add items. For complex reordering, consider using `clearAll()` and rebuilding the list.

**Coordinate Systems**: Mouse interaction methods (`handleClick`, `updateHover`) require both mouse coordinates (screen space) and content area position (screen space). The component handles transformation to content space internally.

**Scroll Clamping**: Scroll position is automatically clamped whenever content changes or scroll occurs. Manual modification of `scrollOffset` should be followed by `clampScrollOffset()` call.

---

## Related Documentation

- [ScrollIndicator API Reference](ScrollIndicator_API_Reference.md) - Scroll arrow component
- [Scroll Indicator Component Checklist](../checklists/SCROLL_INDICATOR_COMPONENT_CHECKLIST.md) - Implementation details
- [Level Editor Setup Guide](../LEVEL_EDITOR_SETUP.md) - Integration example
