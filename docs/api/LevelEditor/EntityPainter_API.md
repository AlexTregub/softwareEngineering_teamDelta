# Entity Painter System

**Module:** Entity Painter (4 classes)

**Files:** 
- `Classes/ui/EntityPalette.js`
- `Classes/ui/CategoryRadioButtons.js`
- `Classes/ui/EntityPropertyEditor.js`
- `Classes/ui/EntityPainter.js`

A comprehensive entity placement system for the Level Editor that allows designers to place, configure, and manage entities (Ants, Buildings, Resources) on terrain through a visual interface with category organization and property editing.

## Description

The Entity Painter system consists of four interconnected classes that provide template-based entity placement, category switching, property editing, and JSON export/import with grid coordinate conversion:

- **EntityPalette**: Manages entity templates organized into 3 categories (Entities, Buildings, Resources)
- **CategoryRadioButtons**: Radio button UI for switching between categories
- **EntityPropertyEditor**: Modal dialog for editing entity properties with validation
- **EntityPainter**: Core placement engine with JSON export/import and spatial grid integration

**Key features:**
- **3-category system**: Entities (7 ants), Buildings (3 types), Resources (4 types)
- **Template-based placement**: Predefined entity configurations ensure consistency
- **Grid coordinate system**: Positions stored as grid coords, converted to world coords
- **Property editing**: Modify entity properties (JobName, faction, health) with validation
- **JSON export/import**: Save/load entities with level data in single file
- **Entity centering**: Handles Entity base class +16px centering offset automatically
- **Spatial grid integration**: Automatic registration/unregistration for O(1) queries

**Typical workflow:**
1. Select category (Entities/Buildings/Resources)
2. Select template from palette
3. Click terrain to place entity at grid coordinates
4. Double-click placed entity to edit properties
5. Export entities to JSON for level save
6. Import entities from JSON to recreate at grid positions

## Tutorials

- [Entity Painter Checklist](../../checklists/active/ENTITY_PAINTER_CHECKLIST.md) - Implementation details and TDD process
- [Level Editor Roadmap](../../roadmaps/LEVEL_EDITOR_ROADMAP.md) - Phase 1.11 requirements

---

# EntityPalette

**Inherits:** None (standalone component)

**File:** `Classes/ui/EntityPalette.js` (280 lines)

Manages entity templates organized into 3 categories with template selection and retrieval.

## Description

EntityPalette provides template management for entity placement with category-based organization. Templates include all necessary data to create entities (images, properties, default stats). The palette tracks the current category and selected template, clearing selection when switching categories.

**Template structure:**
- **Entities (Ants)**: 7 types with `job` property (Worker, Soldier, Scout, Queen, Builder, Gatherer, Carrier)
- **Buildings**: 3 types with `size` property (Hill, Hive, Cone)
- **Resources**: 4 types with `category` property (Leaf, Maple, Stick, Stone)

## Properties

| Type     | Property            | Default        | Description                                  |
|----------|---------------------|----------------|----------------------------------------------|
| `String` | `currentCategory`   | `'entities'`   | Active category (entities/buildings/resources) |
| `Object` | `selectedTemplate`  | `null`         | Currently selected template                  |
| `Object` | `templates`         | (predefined)   | Template definitions for all categories      |

## Methods

| Returns        | Method                                                    |
|----------------|-----------------------------------------------------------|
| `void`         | setCategory ( category: `String` )                        |
| `void`         | selectTemplate ( templateId: `String` )                   |
| `Object`       | getSelectedTemplate ( ) const                             |
| `Array<Object>`| getCurrentTemplates ( ) const                             |
| `Array<Object>`| getTemplates ( category: `String` ) const                 |

## Method Descriptions

### <span id="setcategory"></span>`void` **setCategory** ( category: `String` )

Switch to a different entity category. Clears current selection.

```javascript
const palette = new EntityPalette();
palette.setCategory('buildings');  // Switch to buildings
palette.setCategory('resources');  // Switch to resources
```

**Parameters:**
- `category` (String, **required**): Category to switch to ('entities', 'buildings', 'resources')

**Note:** Invalid categories are ignored. Selection is cleared on category change.

---

### <span id="selecttemplate"></span>`void` **selectTemplate** ( templateId: `String` )

Select an entity template for placement.

```javascript
palette.setCategory('entities');
palette.selectTemplate('ant_worker');  // Select Worker Ant template
```

**Parameters:**
- `templateId` (String, **required**): Template ID (e.g., 'ant_worker', 'building_hill', 'resource_leaf')

Returns without error if templateId is invalid.

---

### <span id="getselectedtemplate"></span>`Object` **getSelectedTemplate** ( ) const

Get currently selected template.

```javascript
const template = palette.getSelectedTemplate();
if (template) {
  console.log(template.name);   // "Worker Ant"
  console.log(template.job);    // "Worker"
  console.log(template.image);  // "Images/Ants/gray_ant.png"
}
```

Returns `null` if no template selected.

---

### <span id="getcurrenttemplates"></span>`Array<Object>` **getCurrentTemplates** ( ) const

Get all templates for currently active category.

```javascript
palette.setCategory('entities');
const templates = palette.getCurrentTemplates();
console.log(templates.length);  // 7 (ant types)
```

Returns empty array if category invalid or has no templates.

---

### <span id="gettemplates"></span>`Array<Object>` **getTemplates** ( category: `String` ) const

Get templates for specific category.

```javascript
const buildings = palette.getTemplates('buildings');
console.log(buildings.length);  // 3
```

**Parameters:**
- `category` (String, **required**): Category name ('entities', 'buildings', 'resources')

Returns empty array if category not found.

---

## Template Definitions

### Entities (Ants)

```javascript
{
  id: 'ant_worker',
  name: 'Worker Ant',
  image: 'Images/Ants/gray_ant.png',
  job: 'Worker',
  properties: { faction: 'player', health: 100, movementSpeed: 30 }
}
```

Available: ant_worker, ant_soldier, ant_scout, ant_queen, ant_builder, ant_gatherer, ant_carrier

### Buildings

```javascript
{
  id: 'building_hill',
  name: 'Ant Hill',
  image: 'Images/Buildings/Hill/*',
  type: 'colony',
  size: { w: 64, h: 64 },
  properties: { capacity: 100 }
}
```

Available: building_hill, building_hive, building_cone

### Resources

```javascript
{
  id: 'resource_leaf',
  name: 'Green Leaf',
  image: 'Images/Resources/leaf.png',
  type: 'greenLeaf',
  category: 'food',
  properties: { canBePickedUp: true, weight: 0.5 }
}
```

Available: resource_leaf, resource_maple, resource_stick, resource_stone

---

# CategoryRadioButtons

**Inherits:** None (standalone UI component)

**File:** `Classes/ui/CategoryRadioButtons.js` (129 lines)

Radio button UI for switching between entity categories with icons.

## Description

CategoryRadioButtons provides a visual selector for choosing between Entities (🐜), Buildings (🏠), and Resources (🌳) categories. Renders 3 radio buttons with icons, highlighting the selected category and triggering callbacks on selection changes.

**Layout**: 3 buttons, 40px height each, 5px spacing = 135px total height

## Properties

| Type       | Property              | Default      | Description                                    |
|------------|-----------------------|--------------|------------------------------------------------|
| `String`   | `selectedCategory`    | `'entities'` | Currently selected category                    |
| `Function` | `onChange`            | `null`       | Callback triggered on selection change         |
| `number`   | `height`              | `135`        | Total height (3 buttons + spacing)             |

## Methods

| Returns   | Method                                                                            |
|-----------|-----------------------------------------------------------------------------------|
| `String`  | getSelectedCategory ( ) const                                                     |
| `void`    | selectCategory ( category: `String` )                                             |
| `void`    | render ( x: `number`, y: `number` )                                               |
| `String`  | handleClick ( mouseX: `number`, mouseY: `number`, offsetX: `number`, offsetY: `number` ) |

## Method Descriptions

### <span id="getselectedcategory"></span>`String` **getSelectedCategory** ( ) const

Get currently selected category.

```javascript
const buttons = new CategoryRadioButtons();
console.log(buttons.getSelectedCategory());  // "entities"
```

Returns 'entities', 'buildings', or 'resources'.

---

### <span id="selectcategory"></span>`void` **selectCategory** ( category: `String` )

Programmatically change selection and trigger onChange callback.

```javascript
buttons.selectCategory('buildings');  // Switch to buildings
```

**Parameters:**
- `category` (String, **required**): Category to select ('entities', 'buildings', 'resources')

---

### <span id="render"></span>`void` **render** ( x: `number`, y: `number` )

Draw radio buttons at specified position.

```javascript
buttons.render(50, 100);
```

**Parameters:**
- `x` (number, **required**): X position in pixels
- `y` (number, **required**): Y position in pixels

Uses p5.js functions (push, pop, fill, stroke, rect, ellipse, text).

---

### <span id="handleclick"></span>`String` or `null` **handleClick** ( mouseX: `number`, mouseY: `number`, offsetX: `number`, offsetY: `number` )

Detect button click and update selection.

```javascript
const category = buttons.handleClick(mouseX, mouseY, 50, 100);
if (category) {
  console.log('Clicked:', category);  // "buildings"
}
```

**Parameters:**
- `mouseX` (number, **required**): Mouse X position
- `mouseY` (number, **required**): Mouse Y position
- `offsetX` (number, **required**): Component X offset
- `offsetY` (number, **required**): Component Y offset

Returns category name if button clicked, `null` otherwise.

---

## Icons

| Category    | Icon | Unicode |
|-------------|------|---------|
| Entities    | 🐜   | U+1F41C |
| Buildings   | 🏠   | U+1F3E0 |
| Resources   | 🌳   | U+1F333 |

---

# EntityPropertyEditor

**Inherits:** None (standalone dialog component)

**File:** `Classes/ui/EntityPropertyEditor.js` (211 lines)

Modal dialog for editing entity properties with validation and staged changes.

## Description

EntityPropertyEditor provides a property editing interface with validation and staged changes (save/cancel workflow). Changes are stored in `_pendingChanges` until saved, allowing cancel without modifying the entity. Handles read-only properties (`_health`, `_faction` for ants) by accessing private properties directly.

**Validation:**
- **JobName**: 7 valid options (Worker, Soldier, Scout, Queen, Builder, Gatherer, Carrier)
- **Faction**: 3 valid options (player, enemy, neutral)
- **Health**: No negatives

## Properties

| Type     | Property              | Default | Description                                    |
|----------|-----------------------|---------|------------------------------------------------|
| `Object` | `currentEntity`       | `null`  | Entity being edited                            |
| `bool`   | `visible`             | `false` | Dialog visibility state                        |
| `Object` | `_pendingChanges`     | `{}`    | Staged changes before save                     |
| `Object` | `_originalValues`     | `{}`    | Original values for cancel operation           |

## Methods

| Returns | Method                                                          |
|---------|-----------------------------------------------------------------|
| `void`  | open ( entity: `Object` )                                       |
| `void`  | close ( )                                                       |
| `void`  | setProperty ( propertyName: `String`, value: `any` )            |
| `void`  | save ( )                                                        |
| `void`  | cancel ( )                                                      |
| `bool`  | hasPendingChanges ( ) const                                     |

## Method Descriptions

### <span id="open"></span>`void` **open** ( entity: `Object` )

Open dialog for entity and store original values.

```javascript
const editor = new EntityPropertyEditor();
const ant = new ant(100, 100, 32, 32, 30, 0, null, 'Worker', 'player');
editor.open(ant);
```

**Parameters:**
- `entity` (Object, **required**): Entity to edit (Ant, Building, or Resource)

---

### <span id="close"></span>`void` **close** ( )

Close dialog and clear entity reference.

```javascript
editor.close();
```

Does not apply pending changes. Use `save()` before closing if changes should persist.

---

### <span id="setproperty"></span>`void` **setProperty** ( propertyName: `String`, value: `any` )

Stage a property change (not applied until `save()` called).

```javascript
editor.open(ant);
editor.setProperty('faction', 'enemy');
editor.setProperty('health', 200);
editor.save();  // Apply changes
```

**Parameters:**
- `propertyName` (String, **required**): Property name (e.g., 'JobName', 'faction', 'health')
- `value` (any, **required**): New value

Throws Error if validation fails.

---

### <span id="save"></span>`void` **save** ( )

Apply all pending changes to entity.

```javascript
editor.setProperty('faction', 'neutral');
editor.setProperty('health', 150);
editor.save();  // Both changes applied
```

**Read-only property handling:**
- `health` → sets `entity._health` (bypasses getter)
- `faction` → sets `entity._faction` (bypasses getter)
- Other properties → direct assignment

Clears `_pendingChanges` after save.

---

### <span id="cancel"></span>`void` **cancel** ( )

Discard pending changes and close dialog.

```javascript
editor.setProperty('health', 999);
editor.cancel();  // Change discarded
```

Clears `_pendingChanges` without applying to entity.

---

### <span id="haspendingchanges"></span>`bool` **hasPendingChanges** ( ) const

Check if there are unsaved changes.

```javascript
editor.setProperty('faction', 'enemy');
console.log(editor.hasPendingChanges());  // true
editor.save();
console.log(editor.hasPendingChanges());  // false
```

Returns `true` if `_pendingChanges` has any keys.

---

## Validation Rules

### JobName Validation

```javascript
const VALID_JOB_NAMES = ['Worker', 'Soldier', 'Scout', 'Queen', 'Builder', 'Gatherer', 'Carrier'];
```

Throws Error if value not in list.

### Faction Validation

```javascript
const VALID_FACTIONS = ['player', 'enemy', 'neutral'];
```

Throws Error if value not in list.

### Health Validation

```javascript
if (value < 0) {
  throw new Error('Health cannot be negative');
}
```

---

# EntityPainter

**Inherits:** None (core placement engine)

**File:** `Classes/ui/EntityPainter.js` (344 lines)

Core entity placement, removal, and JSON export/import with grid coordinate conversion and spatial grid integration.

## Description

EntityPainter is the core placement engine that creates entities at grid coordinates, manages tracking arrays, registers with spatial grid, and handles JSON export/import. It converts grid coordinates to world coordinates on placement and vice versa on export.

**Grid coordinate system:**
- **Storage**: Grid coordinates (tile-based, integers)
- **Placement**: `worldX = gridX * 32` (TILE_SIZE)
- **Export**: `gridX = Math.floor(worldX / 32)`
- **Entity centering**: Entity base class adds +16px offset (0.5 tile)

**Entity creation:**
- **Ants**: Uses `ant` constructor
- **Buildings**: Creates plain object with `posX/posY + 16` (centering offset)
- **Resources**: Creates plain object with `posX/posY + 16` (centering offset)

## Properties

| Type              | Property            | Default     | Description                                    |
|-------------------|---------------------|-------------|------------------------------------------------|
| `EntityPalette`   | `palette`           | (auto)      | EntityPalette instance for template selection  |
| `Array<Object>`   | `placedEntities`    | `[]`        | Array of placed entities                       |
| `Object`          | `spatialGrid`       | (optional)  | Spatial grid for registration                  |

## Methods

| Returns        | Method                                                                              |
|----------------|-------------------------------------------------------------------------------------|
| `Object`       | placeEntity ( gridX: `number`, gridY: `number` )                                    |
| `bool`         | removeEntity ( entity: `Object` )                                                   |
| `Object`       | getEntityAtPosition ( worldX: `number`, worldY: `number`, radius: `number` = 50 )  |
| `Object`       | exportToJSON ( )                                                                    |
| `void`         | importFromJSON ( data: `Object` )                                                   |

## Method Descriptions

### <span id="placeentity"></span>`Object` or `null` **placeEntity** ( gridX: `number`, gridY: `number` )

Place entity at grid coordinates using selected template.

```javascript
const painter = new EntityPainter();
painter.palette.setCategory('entities');
painter.palette.selectTemplate('ant_worker');

const entity = painter.placeEntity(10, 15);  // Grid coords
console.log(entity.posX);  // 336 (10 * 32 + 16 centering)
console.log(entity.posY);  // 496 (15 * 32 + 16 centering)
```

**Parameters:**
- `gridX` (number, **required**): Grid X coordinate (tile-based)
- `gridY` (number, **required**): Grid Y coordinate (tile-based)

Returns entity object or `null` if no template selected. Adds entity to `placedEntities` array and registers with spatial grid.

---

### <span id="removeentity"></span>`bool` **removeEntity** ( entity: `Object` )

Remove entity from tracking array and spatial grid.

```javascript
const removed = painter.removeEntity(entity);
console.log(removed);  // true if found and removed
```

**Parameters:**
- `entity` (Object, **required**): Entity to remove

Returns `true` if entity was found and removed, `false` otherwise.

---

### <span id="getentityatposition"></span>`Object` or `null` **getEntityAtPosition** ( worldX: `number`, worldY: `number`, radius: `number` = 50 )

Find entity near world coordinates.

```javascript
const entity = painter.getEntityAtPosition(350, 500, 30);
if (entity) {
  console.log('Found entity at', entity.posX, entity.posY);
}
```

**Parameters:**
- `worldX` (number, **required**): World X coordinate (pixels)
- `worldY` (number, **required**): World Y coordinate (pixels)
- `radius` (number, optional): Search radius in pixels (default: 50)

Returns first entity within radius, or `null` if none found.

---

### <span id="exporttojson"></span>`Object` **exportToJSON** ( )

Export all placed entities to JSON with grid coordinates.

```javascript
const json = painter.exportToJSON();
console.log(json.entities.length);  // Number of entities
console.log(json.entities[0].gridPosition);  // { x: 10, y: 15 }
```

**Returns:**
```javascript
{
  entities: [
    {
      id: 'entity_001',
      type: 'Ant',
      gridPosition: { x: 10, y: 15 },
      properties: {
        JobName: 'Worker',
        faction: 'player',
        health: 100,
        movementSpeed: 30
      }
    }
  ]
}
```

**Coordinate conversion**: Converts world coordinates to grid coordinates using `Math.floor(worldX / 32)`.

---

### <span id="importfromjson"></span>`void` **importFromJSON** ( data: `Object` )

Import entities from JSON and recreate at grid positions.

```javascript
const json = painter.exportToJSON();  // Save
painter.placedEntities = [];          // Clear
painter.importFromJSON(json);         // Restore
```

**Parameters:**
- `data` (Object, **required**): JSON data with `entities` array

**Coordinate conversion**: Converts grid coordinates to world coordinates (`worldX = gridX * 32`), then adds +16 centering offset for buildings/resources. Ants handle centering via constructor.

**Property preservation**: Overrides properties after entity creation to preserve custom values (health, faction, etc.).

Clears existing `placedEntities` before import.

---

## Common Workflows

### Full Entity Placement Workflow

```javascript
// 1. Create painter
const painter = new EntityPainter();

// 2. Select category and template
painter.palette.setCategory('entities');
painter.palette.selectTemplate('ant_soldier');

// 3. Place entity
const entity = painter.placeEntity(5, 10);

// 4. Edit properties
const editor = new EntityPropertyEditor();
editor.open(entity);
editor.setProperty('faction', 'enemy');
editor.setProperty('health', 150);
editor.save();

// 5. Export to JSON
const json = painter.exportToJSON();
console.log(json.entities[0].properties.faction);  // "enemy"
```

### Category Switching Workflow

```javascript
const painter = new EntityPainter();
const buttons = new CategoryRadioButtons((category) => {
  painter.palette.setCategory(category);
  console.log('Switched to:', category);
});

// Render buttons
buttons.render(50, 50);

// Click handling
const category = buttons.handleClick(mouseX, mouseY, 50, 50);
if (category) {
  console.log('Templates:', painter.palette.getCurrentTemplates().length);
}
```

### Save/Load Workflow

```javascript
// Save
const terrainData = terrain.exportToJSON();
const entityData = painter.exportToJSON();
const levelData = {
  ...terrainData,
  entities: entityData.entities
};
localStorage.setItem('level_001', JSON.stringify(levelData));

// Load
const levelData = JSON.parse(localStorage.getItem('level_001'));
terrain.importFromJSON(levelData);
if (levelData.entities) {
  painter.importFromJSON({ entities: levelData.entities });
}
```

---

## Notes

**Entity Centering Offset:**
- Entity base class adds +0.5 tile (16px) centering offset for rendering
- Ants: Handled automatically by `ant` constructor
- Buildings/Resources: EntityPainter adds +16 to `posX/posY` on import
- Export uses `Math.floor()` which correctly converts back to grid coords

**Spatial Grid Integration:**
- Entities automatically registered on placement
- Unregistered on removal
- Enables O(1) spatial queries via `spatialGridManager.getNearbyEntities()`

**Read-Only Properties:**
- Ant `health` and `faction` are getter-only
- EntityPropertyEditor uses `_health` and `_faction` private properties
- Ensures property changes persist through export/import

---

## Related Docs

- [Entity Painter Checklist](../../checklists/active/ENTITY_PAINTER_CHECKLIST.md) - Full implementation details
- [Level Editor Roadmap](../../roadmaps/LEVEL_EDITOR_ROADMAP.md) - Phase 1.11
- [Level JSON File System](.github/copilot-instructions.md#level-json-file-system) - Single JSON format requirements
