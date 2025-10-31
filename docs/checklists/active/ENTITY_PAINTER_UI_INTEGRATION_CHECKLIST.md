# Entity Painter UI Integration - Enhancement Checklist

**Feature**: EntityPalette Full UI Rendering  
**Priority**: HIGH (Core Feature - Panel Visible But Empty)  
**Date Created**: October 31, 2025  
**Estimated Time**: 6-8 hours  
**Depends On**: ENTITY_PAINTER_PANEL_BUG_FIX_CHECKLIST.md (✅ Complete)

---

## Summary

**Current State**: EntityPalette panel appears when toggled, but shows placeholder content only.

**What Exists**:
- ✅ EntityPalette data model (280 lines, 7 ants + 3 buildings + 4 resources)
- ✅ CategoryRadioButtons component (126 lines, 🐜🏠🌳 switcher)
- ✅ EntityPropertyEditor component (211 lines)
- ✅ Panel creation in LevelEditorPanels (DraggablePanel wrapper)
- ✅ Panel toggling via View menu and toolbar button

**What's Missing**:
- ❌ CategoryRadioButtons integration in EntityPalette.render()
- ❌ Template list rendering (swatch grid with icons)
- ❌ Click-to-select functionality (handleClick delegation)
- ❌ Visual selection highlight (selected template border)
- ❌ Hover effects on templates

**Goal**: Replace placeholder render() with full UI using CategoryRadioButtons and template grid.

---

## Key Design Decisions

### 1. Rendering Architecture
- **EntityPalette** owns the data (templates, currentCategory, selectedTemplateId)
- **CategoryRadioButtons** renders the top radio button row
- **EntityPalette.render()** renders CategoryRadioButtons + template grid below
- **Layout**: Radio buttons (50px height) → Template grid (32x32 swatches with 4px padding)

### 2. Click Handling Strategy
- **CategoryRadioButtons** has its own click handling (returns category ID if clicked)
- **EntityPalette.handleClick()** checks CategoryRadioButtons first, then template grid
- **Template selection** updates `_selectedTemplateId` and triggers onChange callback

### 3. Template Grid Algorithm
```javascript
// Pseudo-code for template rendering
const templates = getCurrentTemplates();
const cols = Math.floor(width / (32 + 4)); // 32px swatch + 4px padding
let x = startX, y = startY + 50; // 50px for radio buttons

templates.forEach((template, i) => {
  if (i > 0 && i % cols === 0) {
    x = startX;
    y += 32 + 4; // Move to next row
  }
  
  // Draw swatch background
  fill(template.id === selectedTemplateId ? 'yellow' : 'gray');
  rect(x, y, 32, 32);
  
  // Draw template icon/image
  if (template.image) {
    image(template.image, x, y, 32, 32);
  }
  
  x += 32 + 4;
});
```

### 4. Dynamic Sizing
- **getContentSize()** calculates height based on:
  - Radio buttons: 50px
  - Template rows: Math.ceil(templates.length / cols) * (32 + 4)
  - Total: 50 + rowHeight
- **DraggablePanel** auto-resizes using contentSizeCallback

---

## Implementation Notes

### CategoryRadioButtons Integration
```javascript
// In EntityPalette constructor
constructor() {
  this.currentCategory = 'entities';
  this._selectedTemplateId = null;
  this._templates = this._loadTemplates();
  
  // NEW: Create CategoryRadioButtons instance
  this.categoryButtons = new CategoryRadioButtons((categoryId) => {
    this.setCategory(categoryId);
    this._selectedTemplateId = null; // Clear selection on category change
  });
}
```

### render() Implementation
```javascript
render(x, y, width, height) {
  if (typeof push === 'undefined') return;
  
  push();
  
  // Render radio buttons at top
  this.categoryButtons.render(x, y, width);
  
  // Render template grid below
  const templates = this.getCurrentTemplates();
  const cols = Math.floor(width / 36); // 32px + 4px padding
  let gridX = x + 4;
  let gridY = y + 50 + 4; // 50px radio buttons + 4px gap
  
  templates.forEach((template, i) => {
    if (i > 0 && i % cols === 0) {
      gridX = x + 4;
      gridY += 36;
    }
    
    // Background
    const isSelected = template.id === this._selectedTemplateId;
    fill(isSelected ? '#FFD700' : '#555');
    stroke(isSelected ? '#FFA500' : '#333');
    strokeWeight(isSelected ? 2 : 1);
    rect(gridX, gridY, 32, 32);
    
    // Icon (placeholder - actual image loading in future)
    fill(220);
    textSize(10);
    textAlign(CENTER, CENTER);
    text(template.name.substring(0, 3), gridX + 16, gridY + 16);
    
    gridX += 36;
  });
  
  pop();
}
```

### handleClick() Implementation
```javascript
handleClick(clickX, clickY, panelX, panelY, panelWidth) {
  const relX = clickX - panelX;
  const relY = clickY - panelY;
  
  // Check CategoryRadioButtons first (top 50px)
  if (relY < 50) {
    const categoryClicked = this.categoryButtons.handleClick(relX, relY, panelWidth);
    if (categoryClicked) {
      return { type: 'category', category: categoryClicked };
    }
  }
  
  // Check template grid (below 50px)
  if (relY > 50) {
    const templates = this.getCurrentTemplates();
    const cols = Math.floor(panelWidth / 36);
    const gridRelY = relY - 50 - 4;
    const row = Math.floor(gridRelY / 36);
    const col = Math.floor(relX / 36);
    const index = row * cols + col;
    
    if (index >= 0 && index < templates.length) {
      this._selectedTemplateId = templates[index].id;
      return { type: 'template', template: templates[index] };
    }
  }
  
  return null;
}
```

---

## Phase 1: Write Failing Tests (TDD Red Phase) ✅

### 1.1 Create Test File ✅
- [x] **Create**: `test/unit/ui/entityPaletteRendering.test.js` ✅
- [x] **Import mocks**: CategoryRadioButtons, p5.js functions ✅
- [x] **Setup**: JSDOM environment, sync global/window ✅

### 1.2 Write Unit Tests (17 tests) ✅
- [x] **Test 1**: EntityPalette creates CategoryRadioButtons instance in constructor ✅
- [x] **Test 2**: render() calls categoryButtons.render() with correct parameters ✅
- [x] **Test 3**: render() draws template grid with correct column count ✅
- [x] **Test 4**: render() highlights selected template with yellow background ✅
- [x] **Test 5**: getContentSize() returns correct height based on template count ✅
- [x] **Test 6**: handleClick() delegates to categoryButtons for top 50px ✅
- [x] **Test 7**: handleClick() returns null for empty space clicks ✅
- [x] **Test 8**: handleClick() selects correct template based on grid position ✅
- [x] **Test 9**: handleClick() updates _selectedTemplateId when template clicked ✅
- [x] **Test 10**: Changing category clears selected template ✅
- [x] **Test 11**: containsPoint() works with dynamic content size ✅
- [x] **Test 12**: render() handles zero templates gracefully ✅
- [x] **Test 13**: pass onChange callback to CategoryRadioButtons ✅
- [x] **Test 14**: calculate correct column count based on width ✅
- [x] **Test 15**: render text labels for templates ✅
- [x] **Test 16**: return category change when CategoryRadioButtons clicked ✅
- [x] **Test 17**: handle multiple rows correctly ✅

### 1.3 Run Tests (Expected Failure) ✅
```bash
npx mocha "test/unit/ui/entityPaletteRendering.test.js"
```
- [x] **Result**: 3/17 passing, 14 failing (Red phase confirmed) ✅
- [x] **Expected errors confirmed**: 
  - "categoryButtons is undefined" ✅
  - "categoryButtons.render is not a function" ✅
  - "Template grid not rendered" ✅

---

## Phase 2: Implement EntityPalette UI (TDD Green Phase) ✅

### 2.1 Update EntityPalette Constructor ✅
- [x] **Add**: `this.categoryButtons = new CategoryRadioButtons(...)` ✅
- [x] **Add**: onChange callback to clear selection on category change ✅
- [x] **Test**: Constructor tests passing (3/3) ✅

### 2.2 Implement render() Method ✅
- [x] **Replace placeholder** with CategoryRadioButtons + template grid ✅
- [x] **Add**: Grid layout algorithm (calculate cols, rows) ✅
- [x] **Add**: Selection highlighting (yellow border for selected) ✅
- [x] **Add**: Template icon rendering (text placeholder for now) ✅
- [x] **Test**: Render tests passing (7/7) ✅

### 2.3 Implement handleClick() Method ✅
- [x] **Replace placeholder** with CategoryRadioButtons delegation ✅
- [x] **Add**: Template grid click detection algorithm ✅
- [x] **Add**: _selectedTemplateId update on click ✅
- [x] **Return**: { type: 'template', template: {...} } object ✅
- [x] **Test**: Click handling tests passing (5/5) ✅

### 2.4 Update getContentSize() ✅
- [x] **Calculate**: Dynamic height based on template count ✅
- [x] **Formula**: 50 + Math.ceil(templates.length / cols) * 36 + 8 ✅
- [x] **Test**: Size calculation tests passing (3/3) ✅

### 2.5 Add Missing Getter Methods ✅
- [x] **Add**: `getCategory()` method ✅
- [x] **Add**: `getSelectedTemplateId()` method ✅
- [x] **Test**: Getter methods working correctly ✅

### 2.6 Run All Tests ✅
```bash
npx mocha "test/unit/ui/entityPaletteRendering.test.js"
```
- [x] **Result**: 17/17 passing (Green phase complete) ✅

---

## Phase 3: Integration Tests ✅

### 3.1 Create Integration Test ✅
- [x] **Create**: `test/integration/ui/entityPaletteUIIntegration.integration.test.js` ✅
- [x] **Setup**: Real CategoryRadioButtons, real EntityPalette, JSDOM ✅

### 3.2 Write Integration Tests (11 tests) ✅
- [x] **Test 1**: CategoryRadioButtons click changes EntityPalette category ✅
- [x] **Test 2**: Template click updates selected template ✅
- [x] **Test 3**: Category change clears selected template ✅
- [x] **Test 4**: Panel auto-resizes when category changed (different template counts) ✅
- [x] **Test 5**: Multiple clicks on same template don't break state ✅
- [x] **Test 6**: Click outside template grid returns null ✅
- [x] **Test 7**: render() works with all 3 categories (entities, buildings, resources) ✅
- [x] **Test 8**: getContentSize() changes when category changes ✅
- [x] **Test 9**: Template list updates when category changes ✅
- [x] **Test 10**: CategoryRadioButtons and template grid render together ✅
- [x] **Test 11**: Selection state persists across renders ✅

### 3.3 Run Integration Tests ✅
```bash
npx mocha "test/integration/ui/entityPaletteUIIntegration.integration.test.js"
```
- [x] **Result**: 11/11 passing (142ms) ✅

---

## Phase 4: E2E Tests with Screenshots ✅

### 4.1 Create E2E Test ✅
- [x] **Create**: `test/e2e/ui/pw_entity_palette_ui_rendering.js` ✅
- [x] **Setup**: Puppeteer, ensureLevelEditorStarted, screenshot helper ✅
- [x] **Fix**: Store entityPalette in LevelEditor for panel access ✅

### 4.2 Write E2E Tests (7 tests) ✅
- [x] **Test 1**: Panel shows CategoryRadioButtons (🐜🏠🌳 visible) ✅
- [x] **Test 2**: Panel shows template grid with entity templates ✅
- [x] **Test 3**: Clicking 🏠 button switches to buildings category ✅
- [x] **Test 4**: Clicking template highlights it with yellow border ✅
- [x] **Test 5**: Panel resizes when switching categories ✅
- [x] **Test 6**: Multiple template clicks work correctly ✅
- [x] **Test 7**: Clicking 🌳 button switches to resources category ✅

### 4.3 Screenshot Requirements ✅
Each test captured screenshot showing:
- [x] CategoryRadioButtons visible with correct category selected ✅
- [x] Template grid rendered (not placeholder gray box) ✅
- [x] Selected template highlighted (yellow border) ✅
- [x] Panel sized correctly for content ✅

### 4.4 Run E2E Tests ✅
```bash
node test/e2e/ui/pw_entity_palette_ui_rendering.js
```
- [x] **Result**: 7/7 passing with screenshots ✅
- [x] **Screenshots captured**:
  - `category_radio_buttons.png` - CategoryRadioButtons visible
  - `template_grid.png` - Entity templates rendered
  - `buildings_category.png` - Buildings category switch
  - `template_selected.png` - Selection highlighting
  - `panel_resizing.png` - Auto-sizing
  - `multiple_clicks.png` - Multiple selections
  - `resources_category.png` - Resources category switch
- [x] **Location**: `test/e2e/screenshots/entity_palette_ui/success/` ✅

### 4.5 Bug Fix: Click Handling ✅
- [x] **Bug found**: CategoryRadioButtons clicks returning null ✅
- [x] **Created**: `test/unit/ui/entityPaletteClickBugFix.test.js` (5 tests) ✅
- [x] **Fixed**: EntityPalette.handleClick() parameter mismatch ✅
  - Was passing 3 params: `(relX, relY, panelWidth)`
  - Fixed to 5 params: `(relX, relY, 0, 0, panelWidth)`
- [x] **Result**: 5/5 tests passing ✅

### 4.6 Styling: Smaller Buttons Without Text ✅
- [x] **User request**: "I want the radio buttons to be smaller, and not have text" ✅
- [x] **Changed**: CategoryRadioButtons height from 50px → 30px ✅
- [x] **Changed**: Icon-only rendering (removed text labels) ✅
- [x] **Updated**: EntityPalette to use dynamic buttonHeight ✅
- [x] **Updated**: All tests to expect 30px height ✅
- [x] **Verified**: E2E screenshots show smaller buttons ✅
- [x] **Result**: All 40 tests passing (17 unit + 11 integration + 7 E2E + 5 bug fix) ✅

---

## Phase 5: Update ENTITY_PAINTER_CHECKLIST.md ⏳

- [ ] **Change status**: "BLOCKED" → "COMPLETE"
- [ ] **Update summary**: 
  ```markdown
  **Status**: ✅ **COMPLETE** (October 31, 2025)
  
  Entity Painter fully functional with EntityPalette UI panel integrated.
  - CategoryRadioButtons for category switching (🐜🏠🌳)
  - Template grid with click-to-select
  - Visual selection highlighting
  - Dynamic panel sizing
  ```

---

## Phase 6: Documentation ⏳

### 6.1 Update CHANGELOG.md
- [ ] **Add to [Unreleased] → Added**:
  ```markdown
  - **EntityPalette UI Integration**: Full visual interface for Entity Painter
    - CategoryRadioButtons integration (🐜🏠🌳 switcher)
    - Template grid rendering (32x32 swatches, 7 ants + 3 buildings + 4 resources)
    - Click-to-select with visual highlighting (yellow border)
    - Dynamic panel sizing based on category/template count
    - Tests: 12 unit + 8 integration + 10 E2E with screenshots
  ```

### 6.2 Update API Documentation
- [ ] **Update**: `docs/api/EntityPalette_API_Reference.md`
- [ ] **Document**: New render() behavior, handleClick() return values
- [ ] **Add**: CategoryRadioButtons integration example

### 6.3 Update Architecture Docs
- [ ] **Update**: Level Editor architecture diagram
- [ ] **Document**: EntityPalette → CategoryRadioButtons → Template Grid flow

---

## Testing Strategy

**Unit Tests** (TDD Red → Green):
- Mock CategoryRadioButtons to verify integration
- Test render() calls correct methods
- Test handleClick() delegation logic
- Test getContentSize() calculations

**Integration Tests**:
- Real CategoryRadioButtons + EntityPalette
- Verify category switching updates palette
- Verify template selection works end-to-end
- Verify panel resizing on category change

**E2E Tests** (PRIMARY - Visual Proof):
- Browser screenshots showing actual UI (not placeholder)
- Verify CategoryRadioButtons visible and clickable
- Verify template grid rendered with icons
- Verify selection highlighting visible
- Verify panel state persistence

---

## Success Criteria

- ✅ 12/12 unit tests passing (TDD Green phase)
- ✅ 8/8 integration tests passing
- ✅ 10/10 E2E tests passing with visual screenshots
- ✅ Screenshots show CategoryRadioButtons (NOT placeholder)
- ✅ Screenshots show template grid with icons (NOT gray box)
- ✅ Screenshots show selection highlighting (yellow border)
- ✅ Panel auto-sizes based on template count
- ✅ Click-to-select works in real browser
- ✅ Category switching updates visible templates
- ✅ ENTITY_PAINTER_CHECKLIST.md status changed to "COMPLETE"

---

## Related Files

**Modified**:
- `Classes/ui/EntityPalette.js` (replace placeholder render/handleClick)

**Test Files**:
- `test/unit/ui/entityPaletteRendering.test.js` (NEW)
- `test/integration/ui/entityPaletteUIIntegration.integration.test.js` (NEW)
- `test/e2e/ui/pw_entity_palette_ui_rendering.js` (NEW)

**Documentation**:
- `docs/checklists/active/ENTITY_PAINTER_CHECKLIST.md` (update status)
- `docs/api/EntityPalette_API_Reference.md` (update methods)
- `CHANGELOG.md` (add UI integration entry)

---

## Notes

**Why Separate Checklist?**
- Original bug fix: Make panel APPEAR (✅ Complete)
- This enhancement: Make panel show CONTENT (⏳ Next)
- Clear separation of concerns for TDD phases

**CategoryRadioButtons Already Exists**:
- Component fully implemented with 15 passing unit tests
- Just needs integration into EntityPalette.render()
- No new component creation required

**Image Loading (Future)**:
- Current implementation uses text placeholders for icons
- Full image loading from template.image paths is future enhancement
- Focus on structure and layout first
