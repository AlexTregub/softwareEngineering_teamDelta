# Entity Painter Feature Enhancement Checklist

**Feature**: Entity Painter Tool (Roadmap 1.11)
**Priority**: HIGH (Core Level Editor feature)
**Estimated Time**: 12-16 hours
**Status**: Not Started

---

## Overview

Implement a comprehensive Entity Painter system for the Level Editor that allows designers to place, configure, and manage entities (Ants, Buildings, Resources) on terrain through a visual interface.

**Key Requirements**:
- Split entities into 3 categories: **Entities** (Ants), **Buildings**, **Resources**
- Use existing scrollable sidebar infrastructure (LevelEditorSidebar + ScrollableContentArea)
- Radio button category switcher at top with icons (🐜 ant, 🏠 house, 🌳 tree)
- Click-and-place workflow (select from palette → click terrain → place entity)
- Entity property editor (double-click placed entity)
- Save/load entities with level JSON

---

## Phase 1: Architecture & Design (TDD Setup)

**Estimated Time**: 2-3 hours

### Planning & Research
- [ ] **Review existing systems**
  - [ ] Review `LevelEditorSidebar.js` - Scrollable sidebar with menu bar
  - [ ] Review `ScrollableContentArea.js` - Content management with buttons
  - [ ] Review `Entity.js` - Entity constructor, options, properties
  - [ ] Review `ant` class - Ant-specific properties (JobName, faction, health)
  - [ ] Review `resource.js` - Resource types and properties
  - [ ] Review existing building/structure code (if any)

- [ ] **Design entity category system**
  - [ ] Define entity categories:
    ```javascript
    const ENTITY_CATEGORIES = {
      ENTITIES: 'entities',  // Ants (Worker, Soldier, Scout, Queen, etc.)
      BUILDINGS: 'buildings', // Colony structures (Hill, Hive, Storage, Defense)
      RESOURCES: 'resources'  // Collectibles (Leaf, Stick, Stone, Food, etc.)
    };
    ```
  
  - [ ] Define entity templates for each category:
    ```javascript
    // Entities (Ants)
    const ANT_TEMPLATES = [
      { id: 'ant_worker', name: 'Worker Ant', image: 'Images/Ants/gray_ant.png', job: 'Worker' },
      { id: 'ant_soldier', name: 'Soldier Ant', image: 'Images/Ants/gray_ant_soldier.png', job: 'Soldier' },
      { id: 'ant_scout', name: 'Scout Ant', image: 'Images/Ants/gray_ant_scout.png', job: 'Scout' },
      { id: 'ant_queen', name: 'Queen Ant', image: 'Images/Ants/gray_ant_queen.png', job: 'Queen' },
      { id: 'ant_builder', name: 'Builder Ant', image: 'Images/Ants/gray_ant_builder.png', job: 'Builder' },
      { id: 'ant_farmer', name: 'Farmer Ant', image: 'Images/Ants/gray_ant_farmer.png', job: 'Farmer' },
      { id: 'ant_spitter', name: 'Spitter Ant', image: 'Images/Ants/gray_ant_spitter.png', job: 'Spitter' }
    ];
    
    // Buildings (Colony structures)
    const BUILDING_TEMPLATES = [
      { id: 'building_hill', name: 'Ant Hill', image: 'Images/Buildings/Hill/*', type: 'colony', size: { w: 64, h: 64 } },
      { id: 'building_hive', name: 'Hive', image: 'Images/Buildings/Hive/*', type: 'storage', size: { w: 48, h: 48 } },
      { id: 'building_cone', name: 'Cone Nest', image: 'Images/Buildings/Cone/*', type: 'defense', size: { w: 32, h: 48 } }
    ];
    
    // Resources (Collectibles)
    const RESOURCE_TEMPLATES = [
      { id: 'resource_leaf', name: 'Green Leaf', image: 'Images/Resources/leaf.png', type: 'greenLeaf', category: 'food' },
      { id: 'resource_maple', name: 'Maple Leaf', image: 'Images/Resources/mapleLeaf.png', type: 'mapleLeaf', category: 'food' },
      { id: 'resource_stick', name: 'Stick', image: 'Images/Resources/stick.png', type: 'stick', category: 'materials' },
      { id: 'resource_stone', name: 'Stone', image: 'Images/Resources/stone.png', type: 'stone', category: 'terrain' }
    ];
    ```

- [ ] **Design UI layout**
  ```
  ┌─────────────────────────────────┐
  │ Entity Painter          [─] [×] │ ← Menu bar (existing)
  ├─────────────────────────────────┤
  │ Category Selector:              │
  │  (🐜) Entities                  │ ← Radio button (selected)
  │  ( ) Buildings                  │
  │  ( ) Resources                  │
  ├─────────────────────────────────┤
  │ ┌─────────────────────────────┐ │
  │ │ [Worker Ant]     [Image]    │ │ ← Scrollable content
  │ │ [Soldier Ant]    [Image]    │ │
  │ │ [Scout Ant]      [Image]    │ │
  │ │ [Queen Ant]      [Image]    │ │
  │ │ ...                          │ │
  │ └─────────────────────────────┘ │
  └─────────────────────────────────┘
  ```

- [ ] **Design file structure**
  - Core classes:
    - `Classes/ui/EntityPalette.js` - Manages entity templates, categories, selection
    - `Classes/ui/EntityPainter.js` - Handles click-to-place workflow, entity creation
    - `Classes/ui/EntityPropertyEditor.js` - Modal dialog for editing entity properties
    - `config/entity-templates.json` - Centralized entity template definitions

---

## Phase 2: Unit Tests (TDD Red Phase)

**Estimated Time**: 3-4 hours

### 2.1 EntityPalette Unit Tests
- [ ] **Create test file**: `test/unit/ui/entityPalette.test.js`
- [ ] **Write failing tests for EntityPalette class** (10-15 tests):
  - [ ] Constructor: Initialize with Entities category by default
  - [ ] Constructor: Load entity templates
  - [ ] Category Management: Switch categories
  - [ ] Category Management: Return templates for current category
  - [ ] Entity Selection: Select entity template
  - [ ] Entity Selection: Clear selection
  - [ ] Template Retrieval: Get templates by category
  - [ ] Validation: Handle invalid category
  - [ ] Validation: Handle invalid template ID

### 2.2 EntityPainter Unit Tests
- [ ] **Create test file**: `test/unit/ui/entityPainter.test.js`
- [ ] **Write failing tests for EntityPainter class** (12-18 tests):
  - [ ] Constructor: Initialize with EntityPalette
  - [ ] Constructor: Track placed entities
  - [ ] Entity Placement: Create ant entity at grid position
  - [ ] Entity Placement: Create resource entity at grid position
  - [ ] Entity Placement: Create building entity at grid position
  - [ ] Entity Placement: Return null if no template selected
  - [ ] Entity Placement: Add placed entity to tracking array
  - [ ] Entity Placement: Register entity with spatial grid
  - [ ] Entity Management: Find entity at position
  - [ ] Entity Management: Remove entity from tracking array
  - [ ] Entity Management: Unregister entity from spatial grid
  - [ ] Export: Export entities to single JSON file with terrain
  - [ ] Import: Import entities from single JSON file
  - [ ] Import: Recreate entities at correct grid positions
  - [ ] Import: Handle missing entity data gracefully

### 2.3 EntityPropertyEditor Unit Tests
- [ ] **Create test file**: `test/unit/ui/entityPropertyEditor.test.js`
- [ ] **Write failing tests** (8-12 tests):
  - [ ] Dialog: Open dialog for entity
  - [ ] Dialog: Close dialog
  - [ ] Display: Show entity properties (Ant: JobName, faction, health)
  - [ ] Display: Show entity properties (Resource: type, canBePickedUp)
  - [ ] Display: Show entity properties (Building: type, size)
  - [ ] Editing: Update property values
  - [ ] Save: Apply changes to entity on save
  - [ ] Cancel: Discard changes on cancel
  - [ ] Validation: Prevent invalid property values

### 2.4 Radio Button Category Selector Tests
- [ ] **Create test file**: `test/unit/ui/categoryRadioButtons.test.js`
- [ ] **Write failing tests for radio button UI** (5-8 tests):
  - [ ] Render: Display 3 radio buttons (Entities, Buildings, Resources)
  - [ ] Selection: Highlight selected category
  - [ ] Selection: Track current selection
  - [ ] Callbacks: Trigger callback on selection change
  - [ ] Icons: Display category icons (🐜, 🏠, 🌳)

- [ ] **Run all unit tests** (should fail - Red phase)
  ```bash
  npx mocha "test/unit/ui/entityPalette.test.js"
  npx mocha "test/unit/ui/entityPainter.test.js"
  npx mocha "test/unit/ui/entityPropertyEditor.test.js"
  npx mocha "test/unit/ui/categoryRadioButtons.test.js"
  ```

---

## Phase 3: Implementation (TDD Green Phase)

**Estimated Time**: 5-7 hours

### 3.1 Create EntityPalette Class
- [ ] **Create file**: `Classes/ui/EntityPalette.js`
- [ ] **Implement core functionality** (TDD - make tests pass)

### 3.2 Create EntityPainter Class
- [ ] **Create file**: `Classes/ui/EntityPainter.js`
- [ ] **Implement core functionality** (TDD - make tests pass)
- [ ] **CRITICAL**: Entity placement at grid coordinates
- [ ] **CRITICAL**: Export/import entities in single JSON file with terrain data

### 3.3 Create CategoryRadioButtons Component
- [ ] **Create file**: `Classes/ui/CategoryRadioButtons.js`
- [ ] **Implement UI component** (TDD - make tests pass)

### 3.4 Integrate with LevelEditorSidebar
- [ ] **Modify `Classes/ui/LevelEditorSidebar.js`**:
  - [ ] Add EntityPainter instance to sidebar
  - [ ] Add CategoryRadioButtons to menu bar area
  - [ ] Populate ScrollableContentArea with entity buttons based on selected category
  - [ ] Wire up click handlers for entity selection

### 3.5 Add Tool to LevelEditor
- [ ] **Modify `Classes/ui/ToolBar.js`**:
  - [ ] Add "Entity Painter" tool button (icon: 🐜 or similar)
  - [ ] Position after Eraser tool
  
- [ ] **Modify `Classes/systems/ui/LevelEditor.js`**:
  - [ ] Create EntityPainter instance in constructor
  - [ ] Add entity painter panel to toolbar config
  - [ ] Implement click-to-place logic in `mousePressed()`
  - [ ] Implement hover preview in `handleHover()`
  - [ ] Add double-click handler for property editor

### 3.6 Create EntityPropertyEditor Dialog
- [ ] **Create file**: `Classes/ui/EntityPropertyEditor.js`
- [ ] **Implement modal dialog** (reuse DraggablePanel or create custom)
- [ ] **Property fields**:
  - Ant: JobName (dropdown), faction (dropdown), health (number), movementSpeed (slider)
  - Resource: type (dropdown), canBePickedUp (checkbox)
  - Building: type (dropdown), size (width/height inputs)

- [ ] **Run unit tests** (should pass - Green phase)
  ```bash
  npm run test:unit:ui
  ```

---

## Phase 4: Integration Tests

**Estimated Time**: 2-3 hours

### 4.1 EntityPainter Integration Tests
- [ ] **Create test file**: `test/integration/ui/entityPainter.integration.test.js`
- [ ] **Write integration tests** (10-15 tests):
  - [ ] Place ant and register with spatial grid
  - [ ] Switch categories and update palette
  - [ ] Export entities with terrain in single JSON file
  - [ ] Import entities from single JSON file
  - [ ] Recreate entities at exact grid positions
  - [ ] Handle mixed entity types (ants + resources + buildings)
  - [ ] Verify entity properties persist through export/import

### 4.2 LevelEditor Integration Tests
- [ ] **Add tests to**: `test/integration/ui/levelEditor.integration.test.js`
- [ ] **Test entity painter tool activation**
- [ ] **Test click-to-place workflow**
- [ ] **Test entity selection and property editing**

- [ ] **Run integration tests**
  ```bash
  npm run test:integration
  ```

---

## Phase 5: E2E Tests with Screenshots

**Estimated Time**: 2-3 hours

### 5.1 Entity Painter E2E Tests
- [ ] **Create test file**: `test/e2e/ui/pw_entity_painter.js`
- [ ] **Test workflow** (with screenshots):
  - [ ] Open Entity Painter panel
  - [ ] Select category
  - [ ] Select template
  - [ ] Place entity on terrain at grid coordinates
  - [ ] Verify entity appears in screenshot
  - [ ] Force render and capture screenshot

### 5.2 Category Switcher E2E Tests
- [ ] **Create test**: `test/e2e/ui/pw_entity_category_switch.js`
- [ ] **Test switching between Entities, Buildings, Resources**
- [ ] **Verify palette updates with correct templates**
- [ ] **Screenshot each category view**

### 5.3 Property Editor E2E Tests
- [ ] **Create test**: `test/e2e/ui/pw_entity_property_editor.js`
- [ ] **Test double-click on placed entity**
- [ ] **Test editing properties (change faction, JobName)**
- [ ] **Test save and cancel buttons**

- [ ] **Run E2E tests**
  ```bash
  npm run test:e2e:ui
  node test/e2e/ui/pw_entity_painter.js
  ```

---

## Phase 6: JSON Integration & Level Save/Load

**Estimated Time**: 1-2 hours

### 6.1 Level JSON Schema Extension
- [ ] **CRITICAL: Single JSON file containing both terrain and entities**
- [ ] **Extend level JSON format** to include entities array
- [ ] **Entity position stored as grid coordinates** (not world coordinates)
- [ ] **Entity properties include all data needed to recreate entity**

### 6.2 Update TerrainExporter/Importer
- [ ] **Modify `Classes/terrainUtils/TerrainExporter.js`**:
  - [ ] Add `exportEntities()` method
  - [ ] Include entities array in JSON output
  
- [ ] **Modify `Classes/terrainUtils/TerrainImporter.js`**:
  - [ ] Add `importEntities()` method
  - [ ] Recreate entities from JSON data

### 6.3 Update SaveDialog/LoadDialog
- [ ] **Verify save includes entities**
- [ ] **Verify load recreates entities**
- [ ] **Test save/load workflow in Level Editor**

---

## Phase 7: Documentation & Polish

**Estimated Time**: 1-2 hours

### 7.1 Update Roadmap
- [ ] **Mark 1.11 as Complete** in `docs/roadmaps/LEVEL_EDITOR_ROADMAP.md`
- [ ] **Update status**: ⏳ Planned → ✅ Complete
- [ ] **Add completion date**

### 7.2 Create API Documentation
- [ ] **Create file**: `docs/api/EntityPainter_API_Reference.md`
- [ ] **Document EntityPalette API**:
  - `setCategory(category)` - Switch between Entities, Buildings, Resources
  - `selectTemplate(templateId)` - Select entity template for placement
  - `getCurrentTemplates()` - Get templates for current category
  
- [ ] **Document EntityPainter API**:
  - `placeEntity(x, y)` - Place selected entity at world coordinates
  - `getEntityAtPosition(x, y, radius)` - Find entity near position
  - `removeEntity(entity)` - Remove placed entity
  - `exportToJSON()` - Export entities to level JSON
  - `importFromJSON(json)` - Import entities from level JSON

### 7.3 Update CHANGELOG.md
- [ ] **Add to [Unreleased] section**:
  ```markdown
  ### User-Facing Changes
  
  #### Added
  - **Entity Painter Tool**: Click-and-place entities (Ants, Buildings, Resources) in Level Editor
    - 3 categories: Entities (🐜), Buildings (🏠), Resources (🌳)
    - Radio button category switcher with icons
    - Scrollable entity palette with visual selection
    - Click terrain to place selected entity
    - Double-click entity to edit properties
    - Save/load entities with level JSON
  
  ---
  
  ### Developer-Facing Changes
  
  #### Added
  - **EntityPalette**: Manages entity templates and category switching
  - **EntityPainter**: Handles entity placement, removal, and export/import
  - **CategoryRadioButtons**: Reusable radio button UI component
  - **EntityPropertyEditor**: Modal dialog for editing entity properties
  - Level JSON schema extended with `entities` array
  - TerrainExporter/Importer support for entity persistence
  ```

### 7.4 Update KNOWN_ISSUES.md (if applicable)
- [ ] **Document any limitations**:
  - Building entity creation (if not fully implemented)
  - Entity collision detection edge cases
  - Performance with large entity counts

---

## Acceptance Criteria

**User-Facing**:
- [ ] User can open Entity Painter panel from Level Editor toolbar
- [ ] User sees 3 category radio buttons (Entities, Buildings, Resources) with icons
- [ ] User can switch categories and see different entity templates
- [ ] User can select entity from scrollable palette
- [ ] User can click terrain to place selected entity at world coordinates
- [ ] Placed entities appear immediately on terrain
- [ ] User can double-click placed entity to edit properties
- [ ] User can change entity properties (faction, job, health, etc.)
- [ ] User can save level with entities (entities persist in JSON)
- [ ] User can load level and entities are recreated at correct positions

**Developer-Facing**:
- [ ] All unit tests passing (40+ tests)
- [ ] All integration tests passing (15+ tests)
- [ ] All E2E tests passing with screenshots (3+ tests)
- [ ] EntityPalette class handles category/template management
- [ ] EntityPainter class handles placement/removal logic
- [ ] CategoryRadioButtons provides reusable radio button UI
- [ ] EntityPropertyEditor provides property editing interface
- [ ] Level JSON schema includes entities array
- [ ] TerrainExporter/Importer support entity persistence

---

## Key Design Decisions

### 1. **Category-Based Template System**
**Decision**: Split entities into 3 fixed categories (Entities, Buildings, Resources)

**Rationale**:
- Clear separation of concerns (gameplay entities vs. collectibles vs. structures)
- Aligns with game design (ants, resources, colony buildings)
- Simple UI (3 radio buttons instead of nested dropdowns)
- Future-proof (can add more categories later: Decorations, Hazards, etc.)

**Trade-offs**:
- Fixed categories (less flexible than tag-based system)
- Category switching clears selection (prevents cross-category mistakes)

### 2. **Template-Based Entity Creation**
**Decision**: Use predefined templates (JSON config) instead of free-form entity creation

**Rationale**:
- Ensures consistency (all Worker Ants have same default stats)
- Simplifies UI (pick from list instead of setting 10+ properties)
- Prevents invalid configurations (template validated at load time)
- Supports visual palette (show image + name for each template)

**Trade-offs**:
- Less flexibility (can't create custom ants without editing config)
- Requires property editor for customization (double-click workflow)

### 3. **Click-to-Place Workflow**
**Decision**: Select from palette → click terrain → entity placed

**Rationale**:
- Industry standard (Unity, Unreal, Tiled all use this pattern)
- Simple and intuitive (no drag-and-drop complexity)
- Works well with camera transforms (world coordinates handled by LevelEditor)
- Supports hover preview (show ghost entity before placing)

**Alternative Considered**: Drag-and-drop from palette
- **Rejected**: More complex (requires drag state management, drop validation)

### 4. **Reuse ScrollableContentArea**
**Decision**: Use existing LevelEditorSidebar + ScrollableContentArea instead of custom palette

**Rationale**:
- Already tested and working (EventEditorPanel uses same pattern)
- Supports large entity lists (scrollable, viewport culling)
- Consistent UI (same look/feel as other Level Editor panels)
- Less code to maintain (DRY principle)

**Trade-offs**:
- Limited to button-based selection (can't show grid of icons)
- Scroll performance matters (but already optimized)

### 5. **Entity Property Editor**
**Decision**: Modal dialog on double-click instead of sidebar panel

**Rationale**:
- Focused editing (user concentrates on one entity at a time)
- Doesn't consume sidebar space (palette still visible)
- Supports complex property types (dropdowns, sliders, checkboxes)
- Standard pattern (most level editors use modal for properties)

**Alternative Considered**: Sidebar property panel (like Unity Inspector)
- **Rejected**: Would require collapsing palette or separate panel (UI clutter)

---

## Implementation Notes

### Single JSON File Structure
**CRITICAL**: Level data must be in ONE file containing both terrain and entities.

**Grid Coordinates**: Entity positions stored as grid coordinates (tile-based), not world pixel coordinates.

**Entity Recreation Algorithm**: Parse JSON → Extract entity data → Determine entity type → Call appropriate constructor with grid position → Add to game world

---

## Testing Strategy

### Unit Tests (Isolation)
- EntityPalette: Category management, template selection
- EntityPainter: Entity creation, placement, removal
- CategoryRadioButtons: Selection, rendering, callbacks
- EntityPropertyEditor: Property display, editing, save/cancel

### Integration Tests (System Interactions)
- EntityPainter + SpatialGridManager: Entity registration
- EntityPainter + LevelEditor: Click-to-place workflow
- EntityPainter + TerrainExporter: JSON export/import
- CategoryRadioButtons + EntityPalette: Category switching updates palette

### E2E Tests (Browser with Screenshots)
- Open Entity Painter panel
- Switch categories (Entities → Buildings → Resources)
- Select template and place entity
- Double-click entity to edit properties
- Save level with entities
- Load level and verify entities recreated

---

## Future Enhancements (Not in Scope)

- [ ] **Building Class**: Dedicated class for colony structures
- [ ] **Entity Snapping**: Snap to grid when placing
- [ ] **Entity Rotation**: Rotate entities before placing
- [ ] **Entity Copy/Paste**: Duplicate placed entities
- [ ] **Entity Groups**: Select and move multiple entities
- [ ] **Entity Prefabs**: Save custom entity configurations as templates
- [ ] **Entity Search**: Search entity palette by name
- [ ] **Entity Tags**: Tag-based filtering (friendly, hostile, neutral)

---

## Completion Checklist

- [ ] All phases completed (1-7)
- [ ] All unit tests passing (40+ tests)
- [ ] All integration tests passing (15+ tests)
- [ ] All E2E tests passing with screenshots (3+ tests)
- [ ] Roadmap updated (1.11 marked complete)
- [ ] CHANGELOG.md updated
- [ ] API documentation created
- [ ] User can place entities in Level Editor
- [ ] Entities save/load with level JSON
- [ ] No regressions (npm test passes)

---

**Created**: October 29, 2025
**Estimated Completion**: November 5, 2025
**Status**: Awaiting Review
