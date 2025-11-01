# E2E Test Migration to Gherkin-Style Checklist

**Purpose**: Migrate all existing Puppeteer E2E tests to use the new Gherkin-style helper functions from `userFlowHelpers.js`. This will eliminate code duplication, improve readability, and create a unified BDD-style testing framework.

**Location**: `test/e2e/`

**Created**: November 1, 2025

---

## 🎯 Migration Process (Per Test)

For each test file:

1. **Read the file** - Understand what the test does
2. **Check preexisting tests** in catalog (`test/E2E_TEST_CATALOG_v2.md`)
3. **Add missing helpers** to `userFlowHelpers.js` if needed
4. **Update catalog** with new helpers (if added)
5. **Create/update feature file** with test steps (BDD format)
6. **Run both tests** (original PW test + new feature test)
7. **Compare results** - Ensure same behavior and screenshots
8. **Delete old test** once confirmed identical
9. **Update this checklist** - Mark as complete ✅

---

## 📊 Migration Status Summary

**Total Categories**: 28  
**Total Tests**: 280+ (estimated)  
**Completed**: 4/280  
**In Progress**: 0/280  
**Not Started**: 276/280  

**Completion Rate**: 1.4%

---

## 📁 Category 1: Level Editor - Entity Painting

**Feature File**: `test/bdd/features/level_editor_entity_painting.feature`

### ✅ COMPLETED

- [x] `pw_entity_eraser_user_flow.js` - Entity placement and erasure workflow ✅ **MIGRATED**
  - [x] Read file
  - [x] Check catalog
  - [x] Add missing helpers
  - [x] Update catalog
  - [x] Create feature test (`pw_entity_eraser_gherkin.js`)
  - [x] Run both tests (both pass ✅)
  - [x] Compare results (identical behavior)
  - [x] Original test preserved (can be deleted after review)
  - **Feature File**: `test/bdd/features/level_editor_entity_painting.feature`
  - **Gherkin Test**: `test/e2e/levelEditor/pw_entity_eraser_gherkin.js`
  - **Helper Functions Used**: `given.levelEditorIsOpen`, `given.toolIsSelected`, `given.panelIsOpen`, `when.userOpensEntityPalette`, `when.userClicksEntityTemplate`, `when.userPlacesEntityAtGrid`, `when.userSelectsTool`, `when.userClicksToolMode`, `when.userErasesEntityAtGrid`, `then.entityShouldExistAtGrid`, `then.entityShouldNotExistAtGrid`, `then.toolShouldBe`, `then.modeShouldBe`
  - **Improvements Made**: Fixed `getActiveToolMode()` to read from `fileMenuBar.toolModeToggle.currentMode`, Fixed `clickToolModeToggle()` to use actual button dimensions from toggle object

### ⏳ IN PROGRESS

### 📝 TODO

- [ ] `pw_entity_painter_integration.js` - Entity painter integration
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_spawn_points_render.js` - Entity spawn point rendering
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_selection_box.js` - Entity selection box
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 2: Level Editor - Toolbar

**Feature File**: `test/bdd/features/level_editor_toolbar.feature`

### 📝 TODO

- [ ] `pw_toolbar_click_detection.js` - Toolbar click detection
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 3: Level Editor - Tool Modes

**Feature File**: `test/bdd/features/level_editor_tool_modes.feature`

### 📝 TODO

- [ ] `pw_tool_mode_toggles.js` - Tool mode toggle UI
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_tool_mode_toggles_mouse.js` - Tool mode mouse interactions
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_eraser_modes.js` - Entity eraser modes
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_eraser_modes_mouse.js` - Entity eraser mouse modes
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 4: Level Editor - Brush Size

**Feature File**: `test/bdd/features/level_editor_brush_size.feature`

### 📝 TODO

- [ ] `pw_brush_size_inline.js` - Inline brush size controls
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_brush_size_menu.js` - Brush size menu
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_brush_size_rerender.js` - Brush size rerender
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_brush_size_scroll.js` - Brush size scroll
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_shift_scroll_brush_size.js` - Shift+scroll brush size
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_eraser_brush_size.js` - Eraser brush size
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_brush_panel_hidden.js` - Brush panel hidden state
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 5: Level Editor - Eraser Tool

**Feature File**: `test/bdd/features/level_editor_eraser_tool.feature`

### 📝 TODO

- [ ] `pw_eraser_tool.js` - Eraser tool functionality
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_eraser_click_functionality.js` - Eraser click functionality
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_eraser_cursor_preview.js` - Eraser cursor preview
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_eraser_red_cursor.js` - Eraser red cursor visual
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 6: Level Editor - Entity Palette

**Feature File**: `test/bdd/features/level_editor_entity_palette.feature`

### 📝 TODO

- [ ] `pw_entity_palette_content_visible.js` - Entity palette content visibility
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_palette_scrolling.js` - Entity palette scrolling
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 7: Level Editor - Events Panel

**Feature File**: `test/bdd/features/level_editor_events_panel.feature`

### 📝 TODO

- [ ] `pw_events_panel_toggle.js` - Events panel toggle
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_events_panel_toggle_bug.js` - Events panel toggle bug fix
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_events_panel_toggle_comprehensive.js` - Events panel comprehensive test
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_events_panel_toggle_multiple.js` - Events panel multiple toggles
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_events_panel_drag_to_place.js` - Events panel drag to place
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_events_panel_render_params.js` - Events panel render parameters
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_event_drag_drop.js` - Event drag and drop
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_properties_events_panels.js` - Properties and events panels
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 8: Level Editor - File Operations

**Feature File**: `test/bdd/features/level_editor_file_operations.feature`

### 📝 TODO

- [ ] `pw_filename_display.js` - Filename display
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_file_new.js` - New file creation
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_new_map_dialog.js` - New map dialog
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 9: Level Editor - Terrain

**Feature File**: `test/bdd/features/level_editor_terrain.feature`

### 📝 TODO

- [ ] `pw_paint_transform.js` - Paint transform
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_load_sparse_terrain.js` - Load sparse terrain
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_sparse_terrain_black_canvas.js` - Sparse terrain black canvas
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_sparse_terrain_json_export.js` - Sparse terrain JSON export
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_sparse_terrain_paint_anywhere.js` - Sparse terrain paint anywhere
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 10: Level Editor - Bug Fixes

**Feature File**: `test/bdd/features/level_editor_bug_fixes.feature`

### 📝 TODO

- [ ] `pw_bugfix_menubar_hover.js` - Menu bar hover bug fix
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_bugfix_menu_interaction.js` - Menu interaction bug fix
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_bugfix_shift_scroll.js` - Shift+scroll bug fix
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_post_launch_fixes.js` - Post-launch fixes
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_menu_blocking.js` - Menu blocking
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 11: UI - Panels

**Feature File**: `test/bdd/features/ui_panels.feature`

### 📝 TODO

- [ ] `pw_all_panels_toggle.js` - All panels toggle
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_panel_minimize.js` - Panel minimize functionality
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_draggable_panels.js` - Draggable panels
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_draggable_panel_growth.js` - Draggable panel growth
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_panel_dragging.js` - Panel dragging
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_panel_drag_bounds.js` - Panel drag bounds
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_check_panel_identity.js` - Check panel identity
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_debug_panels.js` - Debug panels
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_getOrCreatePanel.js` - getOrCreatePanel functionality
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_list_panels.js` - List panels
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 12: UI - Material Palette

**Feature File**: `test/bdd/features/ui_material_palette.feature`

### 📝 TODO

- [ ] `pw_categorized_material_palette.js` - Categorized material palette
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_material_palette_painting.js` - Material palette painting
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_material_palette_mouse_wheel.js` - Material palette mouse wheel
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_material_category_click_bug.js` - Material category click bug
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_material_category_individual_clicks.js` - Material category individual clicks
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_debug_materials_panels.js` - Debug materials panels
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_debug_terrain_materials_state.js` - Debug terrain materials state
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 13: UI - Entity Palette

**Feature File**: `test/bdd/features/ui_entity_palette.feature`

### 📝 TODO

- [ ] `pw_entity_palette_basic_interaction.js` - Entity palette basic interaction
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_palette_scrolling.js` - Entity palette scrolling
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_palette_rendering.js` - Entity palette rendering
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_palette_ant_sprites.js` - Entity palette ant sprites
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_palette_category_buttons_test.js` - Entity palette category buttons
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_palette_group_selection.js` - Entity palette group selection
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_palette_list_view.js` - Entity palette list view
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_palette_add_button_bug.js` - Entity palette add button bug
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_check_entity_palette_visibility.js` - Check entity palette visibility
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 14: UI - Buttons

**Feature File**: `test/bdd/features/ui_buttons.feature`

### 📝 TODO

- [ ] `pw_ui_buttons.js` - UI buttons
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_list_menu_buttons.js` - List menu buttons
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 15: UI - Rendering & Visuals

**Feature File**: `test/bdd/features/ui_rendering.feature`

### 📝 TODO

- [ ] `pw_terrain_rendering.js` - Terrain rendering
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_visual_terrain_paint.js` - Visual terrain paint
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_paint_patterns.js` - Paint patterns
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_canvas_pixel_analysis.js` - Canvas pixel analysis
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_rendering_mode_detection.js` - Rendering mode detection
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_auto_sizing.js` - Auto sizing
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_level_editor_auto_sizing.js` - Level editor auto sizing
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 16: Camera

**Feature File**: `test/bdd/features/camera.feature`

### 📝 TODO

- [ ] `pw_camera_movement.js` - Camera movement
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_camera_transforms.js` - Camera transforms
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_camera_zoom.js` - Camera zoom
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_camera_zoom_probe.js` - Camera zoom probe
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_level_editor_camera.js` - Level editor camera
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 17: Controllers

**Feature File**: `test/bdd/features/controllers.feature`

### 📝 TODO

- [ ] `pw_transform_controller.js` - Transform controller
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_terrain_controller.js` - Terrain controller
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_task_manager.js` - Task manager
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_selection_controller.js` - Selection controller
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_render_controller.js` - Render controller
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_movement_controller.js` - Movement controller
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_inventory_controller.js` - Inventory controller
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_health_controller.js` - Health controller
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_combat_controller.js` - Combat controller
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_combatcontroller.js` - Combat controller (duplicate)
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 18: Ants

**Feature File**: `test/bdd/features/ants.feature`

### 📝 TODO

- [ ] `pw_ant_combat.js` - Ant combat
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_ant_construction.js` - Ant construction
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_ant_construction_FIXED.js` - Ant construction (fixed)
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_ant_gathering.js` - Ant gathering
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_ant_jobs.js` - Ant jobs
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_ant_movement.js` - Ant movement
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_ant_resources.js` - Ant resources
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 19: Ant Brain

**Feature File**: `test/bdd/features/ant_brain.feature`

### 📝 TODO

- [ ] `pw_ant_brain_decisions.js` - Ant brain decisions
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_ant_brain_hunger.js` - Ant brain hunger
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_ant_brain_init.js` - Ant brain initialization
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_ant_brain_pheromones.js` - Ant brain pheromones
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 20: Events

**Feature File**: `test/bdd/features/events.feature`

### 📝 TODO

- [ ] `pw_event_manager_basic.js` - Event manager basic
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_flag_triggers.js` - Flag triggers
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_import_export.js` - Import/export
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_json_loading.js` - JSON loading
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_time_triggers.js` - Time triggers
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 21: Dialogue

**Feature File**: `test/bdd/features/dialogue.feature`

### 📝 TODO

- [ ] `pw_dialogue_branching.js` - Dialogue branching
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_dialogue_display.js` - Dialogue display
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_dialogue_in_level_editor.js` - Dialogue in level editor
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 22: Entity

**Feature File**: `test/bdd/features/entity.feature`

### 📝 TODO

- [ ] `pw_entity_collision.js` - Entity collision
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_construction.js` - Entity construction
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_selection.js` - Entity selection
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_sprite.js` - Entity sprite
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_transform.js` - Entity transform
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_cursor_following.js` - Entity cursor following
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 23: Entity Painter

**Feature File**: `test/bdd/features/entity_painter.feature`

### 📝 TODO

- [ ] `pw_entity_painter.js` - Entity painter
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_entity_painter_panel_toggle.js` - Entity painter panel toggle
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_custom_entities_workflow.js` - Custom entities workflow
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 24: Selection

**Feature File**: `test/bdd/features/selection.feature`

### 📝 TODO

- [ ] `pw_selection_box.js` - Selection box
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_select_tool_and_hover.js` - Select tool and hover
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 25: Integration

**Feature File**: `test/bdd/features/integration.feature`

### 📝 TODO

- [ ] `pw_ant_lifecycle.js` - Ant lifecycle
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_camera_entity_integration.js` - Camera entity integration
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_multi_ant_coordination.js` - Multi-ant coordination
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_resource_system_integration.js` - Resource system integration
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 26: Terrain (E2E Folder)

**Feature File**: `test/bdd/features/terrain_e2e.feature`

### 📝 TODO

- [ ] `pw_rendering_pipeline_trace.js` - Rendering pipeline trace
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_grid_terrain_imagemode_bug.js` - Grid terrain imagemode bug
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

- [ ] `pw_grid_terrain_alignment_after_fix.js` - Grid terrain alignment after fix
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 27: Systems

**Feature File**: `test/bdd/features/systems.feature`

### 📝 TODO

- [ ] `pw_terrain_entity_sync.js` - Terrain entity sync
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 📁 Category 28: Combat

**Feature File**: `test/bdd/features/combat.feature`

### 📝 TODO

- [ ] `pw_combat_initiation.js` - Combat initiation
  - [ ] Read file
  - [ ] Check catalog
  - [ ] Add missing helpers
  - [ ] Update catalog
  - [ ] Create feature test
  - [ ] Run both tests
  - [ ] Compare results
  - [ ] Delete original

---

## 🚀 Workflow Per Category

1. **Create Feature File** - Create `.feature` file in `test/bdd/features/` with category name
2. **Process Each Test** - Follow 9-step process for each test in category
3. **Run Feature Suite** - Run all scenarios in feature file
4. **Compare Results** - Ensure Gherkin tests match PW tests
5. **Delete PW Tests** - Remove old tests once verified
6. **Update Copilot Instructions** - Document new feature file in `.github/copilot-instructions.md`

---

## 📈 Progress Tracking

Update this section after each completed category:

- **Completed Categories**: 0/28 (in progress: Level Editor - Entity Painting 1/4 tests)
- **Completed Tests**: 4/280+ (1.4%)
- **Helpers Added**: 35+
- **Helper Functions Fixed**: 2 (`getActiveToolMode`, `clickToolModeToggle`)
- **Feature Files Created**: 1/28 (`level_editor_entity_painting.feature`)
- **Gherkin Tests Created**: 1 (`pw_entity_eraser_gherkin.js`)

---

## 🎯 Priority Order (Recommended)

1. **Level Editor - Entity Painting** (Most complete, has helpers)
2. **Level Editor - Toolbar** (Core functionality)
3. **Level Editor - Tool Modes** (Core functionality)
4. **UI - Panels** (Reusable across categories)
5. **Camera** (Core functionality)
6. **Material Palette** (Core functionality)
7. **Entity Palette** (Core functionality)
8. **Controllers** (Core systems)
9. **Ants** (Game-specific)
10. **Events** (Game-specific)
...continue with remaining categories

---

## 📝 Notes

- **DO NOT delete original tests** until Gherkin tests are verified identical
- **ALWAYS run both tests** side-by-side before deletion
- **Screenshot comparison** - Ensure screenshots match between old and new tests
- **Update catalog** immediately when adding new helpers
- **Feature files** should use Gherkin syntax (Given/When/Then)
- **One feature file per category** for organization
- **Commit frequently** - After each category completion

---

## ✅ Checklist Template (Copy for Each Test)

```markdown
- [ ] `test_file_name.js` - Brief description
  - [ ] [ ] Read file
  - [ ] [ ] Check catalog for existing helpers
  - [ ] [ ] Add missing helpers to userFlowHelpers.js
  - [ ] [ ] Update E2E_TEST_CATALOG_v2.md
  - [ ] [ ] Add test steps to feature file
  - [ ] [ ] Run original PW test (record results)
  - [ ] [ ] Run new Gherkin feature test
  - [ ] [ ] Compare results (behavior + screenshots)
  - [ ] [ ] Delete original PW test (if verified)
```

---

**Last Updated**: November 1, 2025  
**Status**: Ready to begin migration
