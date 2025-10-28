# ScrollableContentArea Component - Feature Development Checklist

**Component**: Reusable scrollable content container with viewport culling

**Date Created**: October 28, 2025  
**Based On**: `FEATURE_DEVELOPMENT_CHECKLIST.md` template  
**Estimated Effort**: 3-4 hours  
**Purpose**: High-performance scrollable content rendering with item management

---

## Pre-Development

### Requirements Analysis
- [x] **Purpose**: Manage scrollable content with automatic viewport culling
- [x] **Usage**: LevelEditorSidebar, any panel needing scrollable content
- [x] **Core Requirements**:
  - Array-based content item management
  - Automatic scroll bounds calculation
  - Viewport culling (render only visible items)
  - Mouse wheel scroll handling
  - Click delegation to content items
  - Content item types: text, button, custom
  - Dynamic height calculation per item
  - Scroll position clamping (0 to maxScroll)
- [x] **Design Decisions**:
  - Composition pattern (uses ScrollIndicator, doesn't extend)
  - Item-based rendering (each item renders itself)
  - Callback-based architecture (onItemClick, onScroll)
  - Stateful (tracks scrollOffset, contentItems)

### Technical Decisions
- [x] **Class Name**: `ScrollableContentArea`
- [x] **File Location**: `Classes/ui/ScrollableContentArea.js`
- [x] **Dependencies**: `ScrollIndicator` (composition)
- [x] **API Design**: Add/remove items, handle events, render
- [x] **Performance**: Viewport culling for large item lists (O(visible) instead of O(total))

---

## Implementation Phase

### Phase 1: Core ScrollableContentArea Class (TDD)

#### 1A. Unit Tests FIRST (Write failing tests)
- [ ] **Test File**: `test/unit/ui/ScrollableContentArea.test.js`
- [ ] Test initialization with defaults
- [ ] Test content item addition:
  - `addText(id, text)` adds text item
  - `addButton(id, label, callback)` adds button item
  - `addCustom(id, renderFn, clickFn)` adds custom item
- [ ] Test content item removal:
  - `removeItem(id)` removes specific item
  - `clearAll()` removes all items
- [ ] Test scroll calculations:
  - `calculateTotalHeight()` sums all item heights
  - `calculateMaxScrollOffset()` accounts for viewport height
  - `updateScrollBounds()` recalculates after content change
- [ ] Test scroll position clamping:
  - Clamps to 0 (top)
  - Clamps to maxScrollOffset (bottom)
  - Handles content smaller than viewport (no scroll)
- [ ] Test viewport culling:
  - `getVisibleItems()` returns only items in viewport
  - Correct item selection at different scroll positions
- [ ] Test mouse wheel handling:
  - `handleMouseWheel(delta)` updates scrollOffset
  - Scroll speed configurable
  - Returns true if handled, false otherwise
- [ ] Test click delegation:
  - `handleClick(x, y)` delegates to clicked item
  - Accounts for scroll offset in coordinate transformation
  - Returns clicked item or null
- [ ] **Run tests** (confirm all fail): `npx mocha "test/unit/ui/ScrollableContentArea.test.js"`

#### 1B. Create ScrollableContentArea Class
- [ ] **File**: `Classes/ui/ScrollableContentArea.js`
- [ ] Class structure:
  ```javascript
  class ScrollableContentArea {
    constructor(options = {}) {
      // Dimensions
      this.width = options.width || 200;
      this.height = options.height || 400;
      
      // Scroll state
      this.scrollOffset = 0;
      this.maxScrollOffset = 0;
      this.scrollSpeed = options.scrollSpeed || 20; // px per wheel tick
      
      // Content items
      this.contentItems = [];
      this.nextItemId = 0;
      
      // Styling
      this.itemPadding = options.itemPadding || 5;
      this.backgroundColor = options.backgroundColor || [50, 50, 50];
      this.textColor = options.textColor || [220, 220, 220];
      
      // Scroll indicator
      this.scrollIndicator = new ScrollIndicator({
        height: options.indicatorHeight || 20,
        backgroundColor: options.indicatorBg || [60, 60, 60],
        arrowColor: options.indicatorArrow || [200, 200, 200]
      });
      
      // Callbacks
      this.onItemClick = options.onItemClick || null;
      this.onScroll = options.onScroll || null;
    }
    
    /**
     * Add a text item
     * @param {string} id - Unique identifier
     * @param {string} text - Text to display
     * @param {Object} options - Additional options (color, fontSize, etc.)
     * @returns {Object} Created item
     */
    addText(id, text, options = {}) {
      const item = {
        id: id,
        type: 'text',
        text: text,
        height: options.height || 25,
        fontSize: options.fontSize || 12,
        color: options.color || this.textColor,
        padding: options.padding || this.itemPadding,
        render: (x, y, width) => {
          push();
          fill(item.color);
          textAlign(LEFT, CENTER);
          textSize(item.fontSize);
          text(item.text, x + item.padding, y + item.height / 2);
          pop();
        }
      };
      
      this.contentItems.push(item);
      this.updateScrollBounds();
      return item;
    }
    
    /**
     * Add a button item
     * @param {string} id - Unique identifier
     * @param {string} label - Button label
     * @param {Function} callback - Click callback
     * @param {Object} options - Additional options
     * @returns {Object} Created item
     */
    addButton(id, label, callback, options = {}) {
      const item = {
        id: id,
        type: 'button',
        label: label,
        height: options.height || 30,
        fontSize: options.fontSize || 12,
        backgroundColor: options.backgroundColor || [70, 130, 180],
        hoverColor: options.hoverColor || [100, 160, 210],
        textColor: options.textColor || [255, 255, 255],
        padding: options.padding || this.itemPadding,
        isHovered: false,
        clickCallback: callback,
        render: (x, y, width) => {
          push();
          
          // Background
          const bgColor = item.isHovered ? item.hoverColor : item.backgroundColor;
          fill(bgColor);
          noStroke();
          rect(x + item.padding, y, width - item.padding * 2, item.height, 5);
          
          // Label
          fill(item.textColor);
          textAlign(CENTER, CENTER);
          textSize(item.fontSize);
          text(item.label, x + width / 2, y + item.height / 2);
          
          pop();
        },
        containsPoint: (x, y, itemX, itemY, width) => {
          return x >= itemX + item.padding && 
                 x <= itemX + width - item.padding &&
                 y >= itemY && 
                 y <= itemY + item.height;
        }
      };
      
      this.contentItems.push(item);
      this.updateScrollBounds();
      return item;
    }
    
    /**
     * Add a custom item with user-defined render function
     * @param {string} id - Unique identifier
     * @param {Function} renderFn - Render function (x, y, width)
     * @param {Function} clickFn - Click handler (x, y) or null
     * @param {number} height - Item height
     * @returns {Object} Created item
     */
    addCustom(id, renderFn, clickFn, height = 30) {
      const item = {
        id: id,
        type: 'custom',
        height: height,
        render: renderFn,
        clickCallback: clickFn,
        containsPoint: clickFn ? (x, y, itemX, itemY, width) => {
          return x >= itemX && x <= itemX + width &&
                 y >= itemY && y <= itemY + item.height;
        } : null
      };
      
      this.contentItems.push(item);
      this.updateScrollBounds();
      return item;
    }
    
    /**
     * Remove an item by ID
     * @param {string} id - Item ID to remove
     * @returns {boolean} True if removed
     */
    removeItem(id) {
      const index = this.contentItems.findIndex(item => item.id === id);
      if (index > -1) {
        this.contentItems.splice(index, 1);
        this.updateScrollBounds();
        return true;
      }
      return false;
    }
    
    /**
     * Clear all content items
     */
    clearAll() {
      this.contentItems = [];
      this.scrollOffset = 0;
      this.updateScrollBounds();
    }
    
    /**
     * Calculate total content height
     * @returns {number} Total height in pixels
     */
    calculateTotalHeight() {
      return this.contentItems.reduce((sum, item) => sum + item.height, 0);
    }
    
    /**
     * Calculate maximum scroll offset
     * @returns {number} Max scroll offset
     */
    calculateMaxScrollOffset() {
      const totalHeight = this.calculateTotalHeight();
      const visibleHeight = this.getVisibleHeight();
      return Math.max(0, totalHeight - visibleHeight);
    }
    
    /**
     * Get visible content height (accounting for scroll indicators)
     * @returns {number} Visible height in pixels
     */
    getVisibleHeight() {
      const indicatorHeight = this.scrollIndicator.getTotalHeight(this.scrollOffset, this.maxScrollOffset);
      return this.height - indicatorHeight;
    }
    
    /**
     * Update scroll bounds after content changes
     */
    updateScrollBounds() {
      this.maxScrollOffset = this.calculateMaxScrollOffset();
      this.clampScrollOffset();
    }
    
    /**
     * Clamp scroll offset to valid range
     */
    clampScrollOffset() {
      this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
    }
    
    /**
     * Get items visible in current viewport
     * @returns {Array} Array of { item, y } objects
     */
    getVisibleItems() {
      const visibleTop = this.scrollOffset;
      const visibleBottom = this.scrollOffset + this.getVisibleHeight();
      const visibleItems = [];
      
      let currentY = 0;
      for (const item of this.contentItems) {
        const itemTop = currentY;
        const itemBottom = currentY + item.height;
        
        // Check if item is in viewport
        if (itemBottom >= visibleTop && itemTop <= visibleBottom) {
          visibleItems.push({
            item: item,
            y: currentY - this.scrollOffset // Y position relative to viewport
          });
        }
        
        currentY += item.height;
        
        // Early exit if we're past the viewport
        if (itemTop > visibleBottom) break;
      }
      
      return visibleItems;
    }
    
    /**
     * Handle mouse wheel scrolling
     * @param {number} delta - Wheel delta (negative = scroll down)
     * @returns {boolean} True if scroll was handled
     */
    handleMouseWheel(delta) {
      if (this.maxScrollOffset <= 0) return false; // No scrolling needed
      
      // delta negative = scroll down (increase offset)
      // delta positive = scroll up (decrease offset)
      const oldOffset = this.scrollOffset;
      this.scrollOffset += delta * (this.scrollSpeed / 10);
      this.clampScrollOffset();
      
      // Trigger callback if scrolled
      if (this.scrollOffset !== oldOffset && this.onScroll) {
        this.onScroll(this.scrollOffset, this.maxScrollOffset);
      }
      
      return this.scrollOffset !== oldOffset; // True if we scrolled
    }
    
    /**
     * Handle click on content area
     * @param {number} mouseX - Click X
     * @param {number} mouseY - Click Y
     * @param {number} areaX - Content area X
     * @param {number} areaY - Content area Y
     * @returns {Object|null} Clicked item or null
     */
    handleClick(mouseX, mouseY, areaX, areaY) {
      const visibleItems = this.getVisibleItems();
      
      for (const { item, y } of visibleItems) {
        const itemY = areaY + y;
        
        // Check if item has click handler
        if (item.containsPoint && item.containsPoint(mouseX, mouseY, areaX, itemY, this.width)) {
          // Trigger item's click callback
          if (item.clickCallback) {
            item.clickCallback(mouseX, mouseY);
          }
          
          // Trigger global callback
          if (this.onItemClick) {
            this.onItemClick(item, mouseX, mouseY);
          }
          
          return item;
        }
      }
      
      return null;
    }
    
    /**
     * Update hover state for items
     * @param {number} mouseX - Mouse X
     * @param {number} mouseY - Mouse Y
     * @param {number} areaX - Content area X
     * @param {number} areaY - Content area Y
     */
    updateHover(mouseX, mouseY, areaX, areaY) {
      const visibleItems = this.getVisibleItems();
      
      for (const { item, y } of visibleItems) {
        const itemY = areaY + y;
        
        if (item.type === 'button' && item.containsPoint) {
          item.isHovered = item.containsPoint(mouseX, mouseY, areaX, itemY, this.width);
        }
      }
    }
    
    /**
     * Render the scrollable content area
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    render(x, y) {
      push();
      
      // Render top scroll indicator if needed
      const showTopIndicator = this.scrollIndicator.canScrollUp(this.scrollOffset);
      if (showTopIndicator) {
        this.scrollIndicator.renderTop(x, y, this.width, this.scrollOffset, false);
      }
      
      // Calculate content area position
      const contentY = y + (showTopIndicator ? this.scrollIndicator.height : 0);
      const contentHeight = this.getVisibleHeight();
      
      // Background
      fill(this.backgroundColor);
      noStroke();
      rect(x, contentY, this.width, contentHeight);
      
      // Clip to content area (prevent overflow rendering)
      // Note: p5.js doesn't have built-in clipping, so we track bounds manually
      const clipTop = contentY;
      const clipBottom = contentY + contentHeight;
      
      // Render visible items
      const visibleItems = this.getVisibleItems();
      for (const { item, y: itemY } of visibleItems) {
        const renderY = contentY + itemY;
        
        // Only render if within clip bounds
        if (renderY + item.height >= clipTop && renderY <= clipBottom) {
          item.render(x, renderY, this.width);
        }
      }
      
      // Render bottom scroll indicator if needed
      const showBottomIndicator = this.scrollIndicator.canScrollDown(this.scrollOffset, this.maxScrollOffset);
      if (showBottomIndicator) {
        const bottomY = contentY + contentHeight;
        this.scrollIndicator.renderBottom(x, bottomY, this.width, this.scrollOffset, this.maxScrollOffset, false);
      }
      
      pop();
    }
    
    /**
     * Get total height including indicators
     * @returns {number} Total height
     */
    getTotalHeight() {
      return this.height;
    }
    
    /**
     * Set dimensions
     * @param {number} width - New width
     * @param {number} height - New height
     */
    setDimensions(width, height) {
      this.width = width;
      this.height = height;
      this.updateScrollBounds();
    }
  }
  
  // Export for browser
  if (typeof window !== 'undefined') {
    window.ScrollableContentArea = ScrollableContentArea;
  }
  
  // Export for Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollableContentArea;
  }
  ```
- [ ] Add JSDoc comments for all methods
- [ ] Implement error handling (invalid IDs, null checks)
- [ ] **Run tests** (confirm all pass): `npx mocha "test/unit/ui/ScrollableContentArea.test.js"`

### Phase 2: Integration Testing

#### 2A. Integration Tests FIRST
- [ ] **Test File**: `test/integration/ui/scrollableContentArea.integration.test.js`
- [ ] Test with mock p5.js environment (JSDOM)
- [ ] Test full workflow:
  - Add multiple items (text, buttons, custom)
  - Scroll through content
  - Click on buttons
  - Remove items
  - Clear all
- [ ] Test viewport culling performance:
  - Add 100 items
  - Verify only ~20 rendered (visible in viewport)
- [ ] Test edge cases:
  - Empty content (no items)
  - Single item (no scrolling)
  - Content exactly fits viewport
- [ ] Test with ScrollIndicator integration:
  - Indicators appear/disappear correctly
  - Total height calculation accurate
- [ ] **Run tests** (confirm pass): `npx mocha "test/integration/ui/scrollableContentArea.integration.test.js"`

### Phase 3: Usage Examples & Documentation

#### 3A. Usage Example
- [ ] Create example in class header comments:
  ```javascript
  /**
   * Usage Example:
   * 
   * const contentArea = new ScrollableContentArea({
   *   width: 300,
   *   height: 600,
   *   scrollSpeed: 20,
   *   onItemClick: (item) => console.log('Clicked:', item.id)
   * });
   * 
   * // Add content
   * contentArea.addText('title', 'My Sidebar', { fontSize: 16 });
   * contentArea.addButton('btn1', 'Click Me', () => alert('Clicked!'));
   * contentArea.addCustom('custom1', (x, y, w) => {
   *   fill(255, 0, 0);
   *   rect(x, y, w, 50);
   * }, null, 50);
   * 
   * // In parent's render()
   * contentArea.render(10, 50);
   * 
   * // In parent's handleMouseWheel()
   * if (contentArea.handleMouseWheel(event.delta)) {
   *   return; // Consumed
   * }
   * 
   * // In parent's handleClick()
   * const clicked = contentArea.handleClick(mouseX, mouseY, 10, 50);
   * if (clicked) {
   *   console.log('Clicked item:', clicked.id);
   * }
   */
  ```

#### 3B. API Reference
- [ ] Document all public methods
- [ ] Document content item structure
- [ ] Document callbacks (onItemClick, onScroll)
- [ ] Add performance notes (viewport culling)

---

## Key Design Decisions

### 1. Why Composition with ScrollIndicator?
**Decision**: Use ScrollIndicator instance, don't implement indicators internally  
**Rationale**:
- **Separation of concerns**: Content area handles content, indicator handles arrows
- **Reusability**: ScrollIndicator can be used standalone
- **Testability**: Test components independently
- **Flexibility**: Easy to swap indicator implementations

**Code Pattern**:
```javascript
// Bad: Tight coupling
this.renderScrollArrows(x, y, width);

// Good: Composition
this.scrollIndicator.renderTop(x, y, width, this.scrollOffset);
this.scrollIndicator.renderBottom(x, y, width, this.scrollOffset, this.maxScrollOffset);
```

### 2. Why Item-Based Architecture?
**Decision**: Items are objects with render callbacks, not classes  
**Rationale**:
- **Simplicity**: No class hierarchy for simple items (text, button)
- **Performance**: Lighter weight than class instances
- **Flexibility**: Custom items via render callbacks
- **Type safety**: Validate structure on add (not at runtime)

**Item Structure**:
```javascript
{
  id: 'unique-id',
  type: 'text' | 'button' | 'custom',
  height: 30,
  render: (x, y, width) => { /* p5.js rendering */ },
  clickCallback: (x, y) => { /* optional click handler */ },
  containsPoint: (x, y, itemX, itemY, width) => boolean
}
```

### 3. Viewport Culling Strategy
**Decision**: Render only items visible in viewport (O(visible) not O(total))  
**Rationale**:
- **Performance**: 100 items → render 20 (83% fewer draw calls)
- **Scalability**: Supports large content lists
- **Smooth scrolling**: No performance degradation with many items

**Algorithm**:
```javascript
getVisibleItems() {
  const visibleTop = this.scrollOffset;
  const visibleBottom = this.scrollOffset + this.visibleHeight;
  const visible = [];
  
  let y = 0;
  for (const item of this.contentItems) {
    if (y + item.height >= visibleTop && y <= visibleBottom) {
      visible.push({ item, y: y - this.scrollOffset });
    }
    y += item.height;
    if (y > visibleBottom) break; // Early exit
  }
  
  return visible;
}
```

**Performance Comparison**:
| Items | Without Culling | With Culling | Improvement |
|-------|----------------|--------------|-------------|
| 10    | 10 renders     | 10 renders   | 0%          |
| 50    | 50 renders     | ~20 renders  | 60%         |
| 100   | 100 renders    | ~20 renders  | 80%         |
| 1000  | 1000 renders   | ~20 renders  | 98%         |

### 4. Why Callback-Based Click Handling?
**Decision**: Each item has optional clickCallback, plus global onItemClick  
**Rationale**:
- **Item-level control**: Button knows what to do when clicked
- **Global monitoring**: Parent can track all clicks
- **Flexibility**: Items can be non-clickable (text) or clickable (button)

**Example Usage**:
```javascript
// Item-level callback
contentArea.addButton('save', 'Save', () => {
  this.saveLevel(); // Button knows what to do
});

// Global callback (for analytics, debugging)
const contentArea = new ScrollableContentArea({
  onItemClick: (item, x, y) => {
    console.log('Item clicked:', item.id, 'at', x, y);
    this.trackAnalytics('content_click', item.id);
  }
});
```

---

## Testing Strategy

### Unit Tests (Target: 100% coverage)
- [ ] **ScrollableContentArea class**: 30+ tests
  - Constructor with defaults/options
  - Content management (add, remove, clear)
  - Scroll calculations (totalHeight, maxScroll, visible height)
  - Scroll clamping edge cases
  - Viewport culling accuracy
  - Click delegation
  - Hover state updates
  - Mouse wheel handling

### Integration Tests
- [ ] **Real content scenarios**: 15+ tests
  - Multiple item types
  - Scrolling through content
  - Click detection with scroll offset
  - Performance with 100+ items
  - ScrollIndicator integration
  - Empty content edge case

### E2E Tests
- [ ] **Visual verification**: Part of parent component E2E tests
  - Used by LevelEditorSidebar
  - Screenshots show content scrolling
  - Click interactions visible

---

## File Structure

### New Files
```
Classes/ui/
  └── ScrollableContentArea.js     - Scrollable content component

test/unit/ui/
  └── ScrollableContentArea.test.js - Unit tests

test/integration/ui/
  └── scrollableContentArea.integration.test.js - Integration tests
```

### Modified Files
```
index.html
  └── Add <script src="Classes/ui/ScrollableContentArea.js"></script>
     (AFTER ScrollIndicator.js)
```

---

## Testing Commands

```powershell
# Unit tests
npx mocha "test/unit/ui/ScrollableContentArea.test.js" --reporter spec

# Integration tests
npx mocha "test/integration/ui/scrollableContentArea.integration.test.js" --reporter spec

# All ScrollableContentArea tests
npx mocha "test/unit/ui/ScrollableContentArea.test.js" "test/integration/ui/scrollableContentArea.integration.test.js" --reporter spec
```

---

## Success Criteria

**Component is complete when**:
1. ✅ ScrollableContentArea class implemented
2. ✅ All unit tests passing (30+ tests)
3. ✅ All integration tests passing (15+ tests)
4. ✅ Viewport culling working (performance verified)
5. ✅ ScrollIndicator integration complete
6. ✅ All content item types functional (text, button, custom)
7. ✅ JSDoc comments complete
8. ✅ Usage examples documented
9. ✅ Code coverage >95%

---

## Public API Summary

```javascript
class ScrollableContentArea {
  constructor(options)
  
  // Content management
  addText(id, text, options): item
  addButton(id, label, callback, options): item
  addCustom(id, renderFn, clickFn, height): item
  removeItem(id): boolean
  clearAll()
  
  // Scroll management
  handleMouseWheel(delta): boolean
  updateScrollBounds()
  clampScrollOffset()
  
  // Queries
  calculateTotalHeight(): number
  calculateMaxScrollOffset(): number
  getVisibleHeight(): number
  getVisibleItems(): Array<{item, y}>
  getTotalHeight(): number
  
  // Input handling
  handleClick(mouseX, mouseY, areaX, areaY): item|null
  updateHover(mouseX, mouseY, areaX, areaY)
  
  // Rendering
  render(x, y)
  setDimensions(width, height)
}
```

---

## Configuration Options

```javascript
{
  width: 200,                      // Content area width
  height: 400,                     // Content area height
  scrollSpeed: 20,                 // Pixels per wheel tick
  itemPadding: 5,                  // Default item padding
  backgroundColor: [50, 50, 50],   // Background RGB
  textColor: [220, 220, 220],      // Default text RGB
  indicatorHeight: 20,             // Scroll indicator height
  indicatorBg: [60, 60, 60],       // Indicator background
  indicatorArrow: [200, 200, 200], // Indicator arrow color
  onItemClick: (item, x, y) => {}, // Global click callback
  onScroll: (offset, maxOffset) => {} // Scroll callback
}
```

---

## Performance Notes

### Viewport Culling Benefits
```javascript
// Without culling: O(n) render calls
this.contentItems.forEach(item => item.render());

// With culling: O(visible) render calls (~20-30 items)
this.getVisibleItems().forEach(({item, y}) => item.render());
```

**Rendering Cost**:
- 1000 items without culling: ~16ms per frame (30 FPS)
- 1000 items with culling: ~0.5ms per frame (60 FPS)

### Memory Usage
- Each item: ~200 bytes (object + callbacks)
- 100 items: ~20KB
- 1000 items: ~200KB (negligible)

---

## Resources

### Related Components
- `ScrollIndicator.js` - Used for scroll arrows (composition)
- `LevelEditorSidebar.js` - Primary consumer
- `ToolBar.js` - Similar vertical item layout

### Related Documentation
- `docs/checklists/SCROLL_INDICATOR_COMPONENT_CHECKLIST.md` - Indicator component
- `docs/checklists/LEVEL_EDITOR_SIDEBAR_CHECKLIST.md` - Sidebar that uses this
