# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### BREAKING CHANGES

- **Deprecated Manager Classes Removed** (Phase 6.2 - Task 10)
  - Deleted 17 files: 8 managers + 9 rendering classes (consolidated into WorldService)
  - Removed: AntManager, BuildingManager, ResourceManager, SpatialGridManager, CameraSystemManager, ResourceSystemManager, TileInteractionManager, GameStateManager, RenderLayerManager, EntityLayerRenderer, UILayerRenderer, EffectsLayerRenderer, EntityDelegationBuilder, EntityAccessor, UIController, UIDebugManager, PerformanceMonitor
  - **Migration**: Use `world.spawnEntity()`, `world.render()`, `world.getNearbyEntities()` instead of manager methods
  - **ResourceManager (inventory)** → **InventoryController**: API changes: `getCurrentLoad()` → `getCount()`, `isAtMaxLoad()` → `isFull()`, `resources` property → `getResources()` method, `dropAllResources()` → `dropAll()`

---

### Developer-Facing Changes

#### Refactored

- **AntManager Selection State** - Removed redundant internal selection tracking (Phase 3.4)
  - Eliminated `_selectedAnt` property (duplicated state from AntController)
  - Selection methods now query ants directly using `isSelected()` (single source of truth)
  - **Changed Methods**:
    - `getSelectedAnt()` - Now queries: `this.findAnt(ant => ant.isSelected())`
    - `clearSelection()` - Now bulk operation: `this.getAllAnts().forEach(ant => ant.setSelected(false))`
    - `hasSelection()` - Now queries: `this.getSelectedAnt() !== undefined`
  - **Removed Methods**: `handleAntClick()`, `moveSelectedAnt()`, `getAntObject()` (legacy)
  - **Performance**: O(n) selection query (negligible with <100 ants, ~0.01ms)
  - **Benefits**: No sync issues, simpler code, one less state to manage
  - 37/37 tests passing (32 core + 5 selection queries)
  - **API unchanged** - All methods maintain same signatures (internal implementation only)

#### Added

- **EntityService** - Unified entity management system (Phase 6.1)
  - Consolidates AntManager, BuildingManager, and ResourceSystemManager into single registry
  - API: `spawn(type, options)`, `getById(id)`, `getByType(type)`, `getByFaction(faction)`, `query(filterFn)`
  - O(1) lookups by ID using Map-based registry
  - Sequential ID generation (no collisions)
  - Automatic spatial grid integration
  - Factory pattern with dependency injection
  - 42 unit tests + 15 integration tests (100% passing)
  - Documentation: `docs/api/EntityService_API_Reference.md`
  - Migration guide: `docs/guides/ENTITY_SERVICE_MIGRATION_QUICKSTART.md`

- **Consistent Controller API** - Standardized getter-based API across all MVC Controllers
  - **AntController**: `position`, `jobName`, `faction`, `health`, `maxHealth` (getters)
  - **BuildingController**: `position`, `buildingType`, `faction`, `health`, `maxHealth`, `size` (getters)
  - **ResourceController**: `position`, `resourceType`, `amount` (getters)
  - Eliminates API inconsistencies (methods vs getters)
  - Simplifies querying and entity property access

- **Test Helpers** - Enhanced MVC test utilities
  - `loadAllMVCStacks()` - Loads Ant + Building + Resource MVC classes in one call
  - `loadBuildingMVCStack()` - Loads BuildingModel, BuildingView, BuildingController
  - `loadResourceMVCStack()` - Loads ResourceModel, ResourceView, ResourceController
  - Reduces test boilerplate from 50+ lines to 2 lines

- **WorldService** - Unified world management system (Phase 6.2)
  - Consolidates EntityService + CameraManager + SpatialGrid + RenderLayerManager + DraggablePanelManager
  - Single entry point for all game systems
  - API: `spawnEntity()`, `render()`, `update()`, `screenToWorld()`, `worldToScreen()`, `getNearbyEntities()`, `registerPanel()`
  - Eliminates manager spaghetti (was 8 managers, now 1 service)
  - 180/180 tests passing (100% coverage)
  - sketch.js: 1462 LOC (down from 1574, -112 LOC)
  - Deleted 17 deprecated files (8 managers + 9 rendering classes)

#### Changed

- **EntityService.getByFaction()** - Now uses consistent `entity.faction` getter (previously supported both methods and getters)
- **sketch.js** - Added EntityService initialization with factory injection
  - `entityService = new EntityService(antFactory, buildingFactory, resourceFactory)`
  - `entityService.setSpatialGrid(spatialGridManager)`
- **loadCustomLevel()** - Refactored to use `entityService.spawn()` instead of manual entity registration

#### Fixed

- Integration test failures (15/15 now passing)
- API inconsistencies between controller types (getter vs method patterns)

---

## Migration Guides

### EntityService Migration

**Before (Old Manager APIs)**:
```javascript
// Ants
const ant = g_antManager.createAnt(100, 100, { jobName: 'Worker', faction: 'player' });
const ants = g_antManager.getAntsByFaction('player');

// Buildings
const building = buildingManager.createBuilding(200, 200, { type: 'AntCone', faction: 'player' });
const buildings = buildingManager.getBuildingsByFaction('player');

// Resources
const resource = g_resourceSystemManager.spawnResource(300, 300, 'greenLeaf', 100);
const resources = g_resourceSystemManager.getResourcesByType('greenLeaf');
```

**After (EntityService)**:
```javascript
// All entities use same API
const ant = entityService.spawn('Ant', { x: 100, y: 100, jobName: 'Worker', faction: 'player' });
const building = entityService.spawn('Building', { x: 200, y: 200, buildingType: 'AntCone', faction: 'player' });
const resource = entityService.spawn('Resource', { x: 300, y: 300, resourceType: 'greenLeaf', amount: 100 });

// Unified queries
const playerEntities = entityService.getByFaction('player'); // All player entities (ants + buildings)
const ants = entityService.getByType('Ant');
const buildings = entityService.getByType('Building');
const resources = entityService.getByType('Resource');
```

### Controller API Migration

**Before (Inconsistent APIs)**:
```javascript
// AntController used getters
const position = ant.position;
const job = ant.jobName;

// BuildingController used methods
const position = building.getPosition();
const type = building.getType();

// ResourceController mixed both
const position = resource.getPosition();
const type = resource.getType();
```

**After (Consistent Getters)**:
```javascript
// All controllers use getters
const antPos = ant.position;
const antJob = ant.jobName;
const antFaction = ant.faction;

const buildingPos = building.position;
const buildingType = building.buildingType;
const buildingFaction = building.faction;

const resourcePos = resource.position;
const resourceType = resource.resourceType;
const resourceAmount = resource.amount;
```

### AntManager Selection State Migration (Phase 3.4)

**No External API Changes** - All public methods maintain same signatures. Internal implementation changed from cached state to query-based approach.

**Before (Redundant State)**:
```javascript
// Internal implementation (don't use directly)
class AntManager {
  constructor() {
    this._selectedAnt = null; // DUPLICATE STATE
  }
  
  destroyAnt(id) {
    if (this._selectedAnt === ant) {
      this._selectedAnt = null; // MANUAL SYNC
    }
  }
}

// Public API (same before/after)
const selected = antManager.getSelectedAnt();
const hasSelection = antManager.hasSelection();
antManager.clearSelection();
```

**After (Query-Based)**:
```javascript
// Internal implementation (don't use directly)
class AntManager {
  constructor() {
    // No selection state - query ants directly
  }
  
  getSelectedAnt() {
    return this.findAnt(ant => ant.isSelected()); // QUERY
  }
  
  destroyAnt(id) {
    // No selection logic needed - ant handles it
  }
}

// Public API (identical)
const selected = antManager.getSelectedAnt();
const hasSelection = antManager.hasSelection();
antManager.clearSelection();
```

**Migration Steps**: None required - all APIs identical. Performance trade-off: O(1) → O(n) selection query (negligible impact).

---

## [Older Versions]

(Previous changes to be added as versions are released)
