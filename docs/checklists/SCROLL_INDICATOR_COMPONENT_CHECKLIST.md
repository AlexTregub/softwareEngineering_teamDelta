# ScrollIndicator Component - Feature Development Checklist

**Component**: Reusable scroll indicator for showing scroll state (top/bottom arrows)

**Date Created**: October 28, 2025  
**Based On**: `FEATURE_DEVELOPMENT_CHECKLIST.md` template  
**Estimated Effort**: 2-3 hours  
**Purpose**: Visual indicators for scrollable content overflow

---

## Pre-Development

### Requirements Analysis
- [x] **Purpose**: Visual feedback for scrollable content
- [x] **Usage**: ScrollableContentArea, LevelEditorSidebar, any scrollable panel
- [x] **Core Requirements**:
  - Show up arrow when content above viewport (scrollOffset > 0)
  - Show down arrow when content below viewport (has more to scroll)
  - Auto-hide when content fits in viewport (no scrolling needed)
  - Configurable height (default: 20px)
  - Configurable colors (arrow, background)
  - Smooth fade animations (optional)
  - Click to scroll (optional fast scroll)
- [x] **Design Decisions**:
  - Standalone class (no inheritance)
  - State-driven visibility (calculates from scroll data)
  - Rendering-only (no scroll logic, just display)
  - Unicode arrows (↑ ↓) or custom triangle rendering

### Technical Decisions
- [x] **Class Name**: `ScrollIndicator`
- [x] **File Location**: `Classes/ui/ScrollIndicator.js`
- [x] **Dependencies**: None (pure rendering component)
- [x] **API Design**: Simple constructor + render method
- [x] **Default Dimensions**: Full width × 20px height

---

## Implementation Phase

### Phase 1: Core ScrollIndicator Class (TDD)

#### 1A. Unit Tests FIRST (Write failing tests)
- [ ] **Test File**: `test/unit/ui/ScrollIndicator.test.js`
- [ ] Test initialization with defaults
- [ ] Test visibility calculation:
  - `canScrollUp()` returns true when scrollOffset > 0
  - `canScrollDown()` returns true when scrollOffset < maxScroll
  - Both hidden when content fits viewport
- [ ] Test render calls (mock p5.js functions)
- [ ] Test custom colors applied correctly
- [ ] Test custom height applied correctly
- [ ] Test position calculations (x, y, width)
- [ ] Test hit testing (containsPoint for click detection)
- [ ] **Run tests** (confirm all fail): `npx mocha "test/unit/ui/ScrollIndicator.test.js"`

#### 1B. Create ScrollIndicator Class
- [ ] **File**: `Classes/ui/ScrollIndicator.js`
- [ ] Class structure:
  ```javascript
  class ScrollIndicator {
    constructor(options = {}) {
      this.height = options.height || 20;
      this.backgroundColor = options.backgroundColor || [60, 60, 60];
      this.arrowColor = options.arrowColor || [200, 200, 200];
      this.hoverColor = options.hoverColor || [255, 255, 255];
      this.fontSize = options.fontSize || 14;
      this.fadeEnabled = options.fadeEnabled !== undefined ? options.fadeEnabled : true;
    }
    
    /**
     * Calculate if can scroll up
     * @param {number} scrollOffset - Current scroll position
     * @returns {boolean} True if can scroll up
     */
    canScrollUp(scrollOffset) {
      return scrollOffset > 0;
    }
    
    /**
     * Calculate if can scroll down
     * @param {number} scrollOffset - Current scroll position
     * @param {number} maxScrollOffset - Maximum scroll value
     * @returns {boolean} True if can scroll down
     */
    canScrollDown(scrollOffset, maxScrollOffset) {
      return scrollOffset < maxScrollOffset && maxScrollOffset > 0;
    }
    
    /**
     * Render top scroll indicator
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} scrollOffset - Current scroll position
     * @param {boolean} isHovered - Whether mouse is over indicator
     */
    renderTop(x, y, width, scrollOffset, isHovered = false) {
      if (!this.canScrollUp(scrollOffset)) return;
      
      push();
      
      // Background
      fill(this.backgroundColor);
      noStroke();
      rect(x, y, width, this.height);
      
      // Arrow
      const arrowColor = isHovered ? this.hoverColor : this.arrowColor;
      fill(arrowColor);
      textAlign(CENTER, CENTER);
      textSize(this.fontSize);
      text('↑', x + width / 2, y + this.height / 2);
      
      pop();
    }
    
    /**
     * Render bottom scroll indicator
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} scrollOffset - Current scroll position
     * @param {number} maxScrollOffset - Maximum scroll value
     * @param {boolean} isHovered - Whether mouse is over indicator
     */
    renderBottom(x, y, width, scrollOffset, maxScrollOffset, isHovered = false) {
      if (!this.canScrollDown(scrollOffset, maxScrollOffset)) return;
      
      push();
      
      // Background
      fill(this.backgroundColor);
      noStroke();
      rect(x, y, width, this.height);
      
      // Arrow
      const arrowColor = isHovered ? this.hoverColor : this.arrowColor;
      fill(arrowColor);
      textAlign(CENTER, CENTER);
      textSize(this.fontSize);
      text('↓', x + width / 2, y + this.height / 2);
      
      pop();
    }
    
    /**
     * Check if point is inside top indicator
     * @param {number} mouseX - Mouse X
     * @param {number} mouseY - Mouse Y
     * @param {number} x - Indicator X
     * @param {number} y - Indicator Y
     * @param {number} width - Indicator width
     * @returns {boolean} True if point is inside
     */
    containsPointTop(mouseX, mouseY, x, y, width) {
      return mouseX >= x && mouseX <= x + width &&
             mouseY >= y && mouseY <= y + this.height;
    }
    
    /**
     * Check if point is inside bottom indicator
     * @param {number} mouseX - Mouse X
     * @param {number} mouseY - Mouse Y
     * @param {number} x - Indicator X
     * @param {number} y - Indicator Y
     * @param {number} width - Indicator width
     * @returns {boolean} True if point is inside
     */
    containsPointBottom(mouseX, mouseY, x, y, width) {
      return mouseX >= x && mouseX <= x + width &&
             mouseY >= y && mouseY <= y + this.height;
    }
    
    /**
     * Get total height consumed by indicators
     * @param {number} scrollOffset - Current scroll position
     * @param {number} maxScrollOffset - Maximum scroll value
     * @returns {number} Total height (0, 20, or 40px)
     */
    getTotalHeight(scrollOffset, maxScrollOffset) {
      let height = 0;
      if (this.canScrollUp(scrollOffset)) height += this.height;
      if (this.canScrollDown(scrollOffset, maxScrollOffset)) height += this.height;
      return height;
    }
  }
  
  // Export for browser
  if (typeof window !== 'undefined') {
    window.ScrollIndicator = ScrollIndicator;
  }
  
  // Export for Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollIndicator;
  }
  ```
- [ ] Add JSDoc comments for all methods
- [ ] Implement fade animation (optional, alpha based on scroll distance)
- [ ] **Run tests** (confirm all pass): `npx mocha "test/unit/ui/ScrollIndicator.test.js"`

### Phase 2: Integration Testing

#### 2A. Integration Tests FIRST
- [ ] **Test File**: `test/integration/ui/scrollIndicator.integration.test.js`
- [ ] Test with mock p5.js environment (JSDOM)
- [ ] Test rendering with different scroll states:
  - No scroll (content fits) - no indicators
  - Scrolled to top - only bottom arrow
  - Scrolled to bottom - only top arrow
  - Middle position - both arrows
- [ ] Test hover state rendering
- [ ] Test click detection (containsPoint)
- [ ] Test total height calculation
- [ ] **Run tests** (confirm pass): `npx mocha "test/integration/ui/scrollIndicator.integration.test.js"`

### Phase 3: Usage Examples & Documentation

#### 3A. Usage Example
- [ ] Create example in class header comments:
  ```javascript
  /**
   * Usage Example:
   * 
   * const indicator = new ScrollIndicator({
   *   height: 20,
   *   backgroundColor: [60, 60, 60],
   *   arrowColor: [200, 200, 200]
   * });
   * 
   * // In render loop
   * const scrollOffset = 50;
   * const maxScrollOffset = 200;
   * 
   * // Render top indicator
   * indicator.renderTop(x, y, width, scrollOffset, isHoveredTop);
   * 
   * // Render bottom indicator
   * indicator.renderBottom(x, y + contentHeight, width, scrollOffset, maxScrollOffset, isHoveredBottom);
   * 
   * // Calculate content area height (accounting for indicators)
   * const contentHeight = panelHeight - indicator.getTotalHeight(scrollOffset, maxScrollOffset);
   */
  ```

#### 3B. API Reference
- [ ] Document all public methods with params and return values
- [ ] Document configuration options
- [ ] Add usage patterns section

---

## Key Design Decisions

### 1. Why Stateless Component?
**Decision**: ScrollIndicator doesn't track scroll state, only renders it  
**Rationale**:
- Separation of concerns (scroll logic vs. rendering)
- Reusable across different scroll implementations
- Simpler testing (pure functions)
- No state synchronization issues

### 2. Why Separate renderTop/renderBottom?
**Decision**: Two separate methods instead of single render()  
**Rationale**:
- Different positions (top vs. bottom of content area)
- Independent hover states
- Clearer call sites (explicit about placement)
- Easier to customize per-position (e.g., different colors)

**Alternative Considered**: Single `render(position, ...)` method  
**Rejected**: Less explicit, requires position enum, more complex

### 3. Click Handling Strategy
**Decision**: Provide containsPoint(), let parent handle click action  
**Rationale**:
- Component doesn't know scroll speed/amount
- Parent controls scroll behavior
- Component stays pure (rendering only)
- Flexible (parent can scroll by page, by amount, etc.)

**Example Parent Usage**:
```javascript
handleClick(mouseX, mouseY) {
  const topY = this.y + this.menuBarHeight;
  const bottomY = this.y + this.height - indicator.height;
  
  if (indicator.containsPointTop(mouseX, mouseY, this.x, topY, this.width)) {
    this.scrollOffset = Math.max(0, this.scrollOffset - 100); // Scroll up
  }
  
  if (indicator.containsPointBottom(mouseX, mouseY, this.x, bottomY, this.width)) {
    this.scrollOffset = Math.min(this.maxScrollOffset, this.scrollOffset + 100); // Scroll down
  }
}
```

### 4. Visual Design - Unicode vs. Custom Rendering
**Decision**: Start with Unicode arrows (↑ ↓), support custom later  
**Rationale**:
- **Phase 1 (Unicode)**: 
  - Simple, no asset loading
  - Consistent with text rendering
  - Easy to test
- **Phase 2 (Custom, optional)**:
  - Triangle path rendering for sharper look
  - Custom SVG icons
  - Animated arrows (bounce effect)

**Implementation**:
```javascript
// Phase 1 (Current)
text('↑', x + width / 2, y + this.height / 2);

// Phase 2 (Future, optional)
if (this.customRenderer) {
  this.customRenderer.renderArrow('up', x, y, width, this.height);
} else {
  text('↑', x + width / 2, y + this.height / 2);
}
```

---

## Testing Strategy

### Unit Tests (Target: 100% coverage)
- [ ] **ScrollIndicator class**: 15+ tests
  - Constructor with defaults
  - Constructor with custom options
  - `canScrollUp()` edge cases
  - `canScrollDown()` edge cases
  - `getTotalHeight()` combinations
  - `containsPointTop()` hit testing
  - `containsPointBottom()` hit testing
  - Render calls (mock p5.js)
  - Color application
  - Hover state rendering

### Integration Tests
- [ ] **Real scroll scenarios**: 8+ tests
  - Render with JSDOM + p5.js mocks
  - Different scroll positions
  - Hover state changes
  - Click detection accuracy

### E2E Tests
- [ ] **Visual verification**: Part of parent component E2E tests
  - ScrollIndicator used by ScrollableContentArea
  - Screenshots show arrows at correct times
  - Hover effects visible

---

## File Structure

### New Files
```
Classes/ui/
  └── ScrollIndicator.js           - Scroll indicator component

test/unit/ui/
  └── ScrollIndicator.test.js      - Unit tests

test/integration/ui/
  └── scrollIndicator.integration.test.js - Integration tests
```

### Modified Files
```
index.html
  └── Add <script src="Classes/ui/ScrollIndicator.js"></script>
```

---

## Testing Commands

```powershell
# Unit tests
npx mocha "test/unit/ui/ScrollIndicator.test.js" --reporter spec

# Integration tests
npx mocha "test/integration/ui/scrollIndicator.integration.test.js" --reporter spec

# All ScrollIndicator tests
npx mocha "test/unit/ui/ScrollIndicator.test.js" "test/integration/ui/scrollIndicator.integration.test.js" --reporter spec
```

---

## Success Criteria

**Component is complete when**:
1. ✅ ScrollIndicator class implemented
2. ✅ All unit tests passing (15+ tests)
3. ✅ All integration tests passing (8+ tests)
4. ✅ JSDoc comments complete
5. ✅ Usage examples documented
6. ✅ No p5.js dependencies (pure rendering)
7. ✅ Reusable across multiple parent components
8. ✅ Code coverage >95%

---

## Public API Summary

```javascript
class ScrollIndicator {
  constructor(options)
  
  // State queries
  canScrollUp(scrollOffset): boolean
  canScrollDown(scrollOffset, maxScrollOffset): boolean
  getTotalHeight(scrollOffset, maxScrollOffset): number
  
  // Rendering
  renderTop(x, y, width, scrollOffset, isHovered)
  renderBottom(x, y, width, scrollOffset, maxScrollOffset, isHovered)
  
  // Hit testing
  containsPointTop(mouseX, mouseY, x, y, width): boolean
  containsPointBottom(mouseX, mouseY, x, y, width): boolean
}
```

---

## Configuration Options

```javascript
{
  height: 20,                      // Indicator height in pixels
  backgroundColor: [60, 60, 60],   // Background RGB
  arrowColor: [200, 200, 200],     // Arrow RGB (normal)
  hoverColor: [255, 255, 255],     // Arrow RGB (hovered)
  fontSize: 14,                    // Arrow text size
  fadeEnabled: true                // Enable fade animations (future)
}
```

---

## Resources

### Related Components
- `ScrollableContentArea.js` - Primary consumer
- `LevelEditorSidebar.js` - Uses ScrollIndicator
- `DynamicGridOverlay.js` - Similar visual feedback pattern

### Related Documentation
- `docs/checklists/SCROLLABLE_CONTENT_AREA_CHECKLIST.md` - Content area component
- `docs/checklists/LEVEL_EDITOR_SIDEBAR_CHECKLIST.md` - Sidebar that uses both
