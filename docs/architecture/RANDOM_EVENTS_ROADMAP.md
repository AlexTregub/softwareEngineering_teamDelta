# Random Events System - Implementation Roadmap

## Current Status: Planning Complete

### Completed Deliverables
1. Unit Tests - 150+ tests for EventManager, Events, Triggers
2. Architecture Design - Event-driven pattern with JSON configs
3. Level Editor Integration Plan - Click-to-place event flags
4. Dialogue Panel Spec - Bottom-screen static panel with animations
5. Debug System Design - Developer toolset for event control
6. Clarifications - All design questions answered

---

## Design Decisions (Confirmed)

### 1. EventManager: Singleton
- Global access: `window.eventManager`
- Single source of truth for all events/flags/triggers
- Initialized in `setup()` or bootstrap

### 2. Priority System: 1 = Highest
```javascript
Priority 1:  Critical (boss intro, game-over)
Priority 5:  Normal (tutorials, wave spawns)
Priority 10: Low (ambient dialogue)
```

### 3. Trigger Conflict Resolution: Queue All
When multiple triggers fire simultaneously:
- Add all triggered events to queue
- Sort by event priority (1 = highest)
- Process in priority order
- Future: Add trigger-specific priority if needed

### 4. Dialogue UI: DialoguePanel (Separate TODO)
- Static panel at bottom of screen
- Two-phase expand animation (vertical, then horizontal)
- Speaker name + message + buttons
- See: `docs/plans/TODO_DIALOGUE_PANEL_SYSTEM.md`

### 5. Entity Spawning: Leverage Existing System
- Use `AntUtilities.spawnAnt(x, y, type, faction)`
- Enemy faction: `"enemy"`
- Types: `"Warrior"`, `"Worker"`, etc.
- May need extension for custom enemy behaviors

---

## Implementation Phases

### Phase 0: Debug System
**Goal**: Developer toolset for viewing/controlling events

#### Tasks
- [ ] Implement `EventDebugManager` (singleton)
- [ ] Run unit tests (100+ tests should all pass)
- [ ] Integrate with command line (extend `commandLine.js`)
- [ ] Add keyboard shortcuts (Ctrl+Shift+E/F/L/A)
- [ ] Create `EventListPanel` (draggable UI)
- [ ] Create `LevelInfoPanel` (draggable UI)
- [ ] Visual event flag overlay (color-coded)
- [ ] Integration with MapManager (level filtering)
- [ ] Integration with LevelEditor (flag rendering)
- [ ] E2E tests with screenshots

**Deliverable**: Full debug toolset for event development/testing

**Rationale**: Build debug tools FIRST so we can test EventManager as we implement it

---

### Phase 1: Core Event System
**Goal**: Fully functional EventManager with JSON loading

#### Phase 1A: EventManager Foundation
- [ ] Implement `EventManager` (singleton)
- [ ] Add debug hooks for `EventDebugManager`
- [ ] Run unit tests (should all pass)
- [ ] Implement `Event` base class
- [ ] Run unit tests (should all pass)
- [ ] Implement specific event types:
  - [ ] `DialogueEvent`
  - [ ] `SpawnEvent`
  - [ ] `TutorialEvent`
  - [ ] `BossEvent`
- [ ] Run unit tests (should all pass)
- [ ] Test manually using `eventDebugManager.manualTriggerEvent()`

#### Phase 1B: Trigger System
- [ ] Implement `EventTrigger` base class
- [ ] Run unit tests (should all pass)
- [ ] Implement trigger types:
  - [ ] `TimeTrigger`
  - [ ] `SpatialTrigger`
  - [ ] `FlagTrigger`
  - [ ] `ConditionalTrigger`
  - [ ] `ViewportSpawnTrigger`
- [ ] Run unit tests (should all pass)
- [ ] Use `eventDebugManager.showEventFlags()` to visualize triggers

#### Phase 1C: Integration & Testing
- [ ] Integration tests (EventManager, Triggers, Events)
- [ ] JSON loading system
- [ ] Global `window.eventManager` initialization
- [ ] E2E tests with screenshots (basic event triggering)
- [ ] Documentation (API reference, JSON schema)
- [ ] Verify debug panel shows events correctly

**Deliverable**: Working EventManager that can load events from JSON and trigger them

---

### Phase 2: Level Editor Integration
**Goal**: Click-to-place event flags with export/import

#### Phase 2A: Event Flag System
- [ ] Implement `EventFlag` class
- [ ] Implement `EventFlagLayer` class
- [ ] Unit tests for both
- [ ] Integration with `LevelEditor`
- [ ] Use `eventDebugManager` to visualize flags

#### Phase 2B: UI & Workflow
- [ ] Add "Event Flag" tool to ToolBar
- [ ] Implement click-to-place system
- [ ] Create Event Flags panel (list, add, delete)
- [ ] Create Flag Properties panel (edit)
- [ ] Visual rendering (flag icon + radius circle)
- [ ] Debug overlay shows color-coded flags

#### Phase 2C: Export/Import
- [ ] Extend `TerrainExporter` with eventFlags
- [ ] Extend `TerrainImporter` with eventFlags
- [ ] JSON schema validation
- [ ] Roundtrip testing (export, import, verify)
- [ ] E2E tests with screenshots
- [ ] Verify `eventDebugManager.getEventsForLevel()` works

**Deliverable**: Level Editor with event flag placement and JSON export

---

### Phase 3: Dialogue Panel System
**Goal**: Static dialogue panel with animations

See: `docs/plans/TODO_DIALOGUE_PANEL_SYSTEM.md`

#### Phase 3A: StaticPanel Base
- [ ] Create `StaticPanel` base class
- [ ] Non-draggable behavior
- [ ] Fixed positioning system
- [ ] Unit tests

#### Phase 3B: DialoguePanel
- [ ] Speaker section rendering
- [ ] Message section with wrapping
- [ ] Button array with click handlers
- [ ] Auto-sizing to content
- [ ] Unit tests

#### Phase 3C: Animation System
- [ ] Two-phase expand (vertical, then horizontal)
- [ ] Collapse animation
- [ ] Easing functions
- [ ] Skip animation option
- [ ] E2E tests with screenshots

**Deliverable**: Working dialogue panel integrated with DialogueEvent

---

### Phase 4: Wave Spawning System
**Goal**: Enemy waves spawn at viewport edges

#### Phase 4A: Viewport Spawning
- [ ] `ViewportSpawnTrigger` integration with `g_map2.renderConversion.getViewSpan()`
- [ ] Edge position generation
- [ ] Distribution across edges
- [ ] Unit tests

#### Phase 4B: Enemy Spawning
- [ ] `SpawnEvent` integration with `AntUtilities.spawnAnt()`
- [ ] Wave configuration (JSON format)
- [ ] Progressive difficulty scaling
- [ ] E2E tests with screenshots (visual verification of spawns)

**Deliverable**: Working wave system with viewport edge spawning

---

### Phase 5: Tutorial & Story Events
**Goal**: Tutorial popups and narrative events

#### Tasks
- [ ] `TutorialEvent` integration with `DialoguePanel`
- [ ] Multi-step navigation
- [ ] Highlight system (optional - overlay arrows)
- [ ] E2E tests

**Deliverable**: Working tutorial system

---

### Phase 6: Boss Events
**Goal**: Boss fights with phases

#### Tasks
- [ ] `BossEvent` implementation
- [ ] Intro dialogue integration
- [ ] Phase transitions
- [ ] Victory/defeat conditions
- [ ] E2E tests

**Deliverable**: Complete boss fight workflow

---

### Phase 7: Polish & Documentation
**Goal**: Production-ready system

#### Tasks
- [ ] BDD tests for all event types
- [ ] Performance optimization
- [ ] Error handling & validation
- [ ] Complete API documentation
- [ ] Designer guide (how to create events)
- [ ] Example event library (JSON files)

---

## File Creation Order (TDD)

### Immediate Next Steps

1. **Create EventManager** (after test review approval)
   ```
   Classes/managers/EventManager.js
   ```

2. **Create Event Classes**
   ```
   Classes/events/Event.js
   Classes/events/DialogueEvent.js
   Classes/events/SpawnEvent.js
   Classes/events/TutorialEvent.js
   Classes/events/BossEvent.js
   ```

3. **Create Trigger Classes**
   ```
   Classes/triggers/EventTrigger.js
   Classes/triggers/TimeTrigger.js
   Classes/triggers/SpatialTrigger.js
   Classes/triggers/FlagTrigger.js
   Classes/triggers/ConditionalTrigger.js
   Classes/triggers/ViewportSpawnTrigger.js
   ```

4. **Update index.html**
   ```html
   <!-- Event System -->
   <script src="Classes/managers/EventManager.js"></script>
   <script src="Classes/events/Event.js"></script>
   <script src="Classes/events/DialogueEvent.js"></script>
   <script src="Classes/events/SpawnEvent.js"></script>
   <script src="Classes/events/TutorialEvent.js"></script>
   <script src="Classes/events/BossEvent.js"></script>
   <script src="Classes/triggers/EventTrigger.js"></script>
   <script src="Classes/triggers/TimeTrigger.js"></script>
   <script src="Classes/triggers/SpatialTrigger.js"></script>
   <script src="Classes/triggers/FlagTrigger.js"></script>
   <script src="Classes/triggers/ConditionalTrigger.js"></script>
   <script src="Classes/triggers/ViewportSpawnTrigger.js"></script>
   ```

5. **Initialize in sketch.js**
   ```javascript
   // In setup() after other managers
   window.eventManager = new EventManager();
   console.log('EventManager initialized');
   ```

6. **Update in draw()**
   ```javascript
   // In draw() after other updates
   if (window.eventManager) {
     eventManager.update();
   }
   ```

---

## Testing Strategy

### Test Execution Order
1. **Unit tests** (run after each class implementation)
   ```bash
   npx mocha "test/unit/managers/eventManager.test.js"
   npx mocha "test/unit/events/*.test.js"
   ```

2. **Integration tests** (run after system integration)
   ```bash
   npx mocha "test/integration/events/*.test.js"
   ```

3. **E2E tests** (run after UI integration)
   ```bash
   node test/e2e/events/pw_dialogue_event.js
   node test/e2e/events/pw_spawn_event.js
   ```

4. **BDD tests** (run before merge)
   ```bash
   npm run test:bdd:events
   ```

### Success Criteria
- All unit tests pass (100% of 150+ tests)
- All integration tests pass
- E2E screenshots show correct behavior
- BDD scenarios pass (user-facing workflows)
- No regression in existing tests

---

## Dependencies & Blockers

### Required Systems (Already Exist)
- GameStateManager - State coordination
- DraggablePanelManager - UI system
- RenderLayerManager - Rendering
- SpatialGridManager - Spatial queries
- GridTerrain.getViewSpan() - Viewport detection
- AntUtilities.spawnAnt() - Entity spawning

### To Be Created (This Branch)
- EventManager (Phase 1)
- Event classes (Phase 1)
- Trigger classes (Phase 1)
- EventFlag & EventFlagLayer (Phase 2)
- DialoguePanel & StaticPanel (Phase 3)
- EventDebugManager (Phase 0)

### External Dependencies (Other Branches)
- Day/Night Cycle - TimeTrigger.gameTime integration
- Boss AI - BossEvent behavior implementation
- Pheromone System - Potential trigger type

---

## Risk Assessment

### Low Risk
- Core EventManager - Well-tested pattern
- JSON loading - Standard serialization
- Trigger system - Clean abstractions

### Medium Risk
- Level Editor integration - UI complexity
- Animation system - Performance concerns
- Viewport spawning - Edge case handling

### High Risk
- Boss event integration - Depends on AI system
- Multi-event priority conflicts - Edge cases
- Performance at scale - Many active events/triggers

### Mitigation
- Early prototyping of risky features
- Performance profiling during development
- Extensive E2E testing with screenshots
- BDD tests for complex workflows

---

## Success Metrics

### Technical
- [ ] 150+ unit tests passing
- [ ] <5ms EventManager.update() execution time
- [ ] <100KB JSON file size for typical level
- [ ] Zero memory leaks (event cleanup)

### Functional
- [ ] Designer can place event flags in <1 minute
- [ ] Events trigger correctly 100% of time
- [ ] Dialogue appears within 500ms of trigger
- [ ] Wave spawns occur at viewport edges

### User Experience
- [ ] Tutorials guide new players effectively
- [ ] Dialogue animations feel smooth (60fps)
- [ ] Event flags invisible in game (only editor)
- [ ] Boss fights feel epic and challenging

---

## Next Action: Implementation Start

**Awaiting Approval**: Review unit tests and architecture docs
**On Approval**: Begin Phase 0 (EventDebugManager implementation)
**Priority**: High (core feature for game content)

---

## Questions Before Implementation?

1. Singleton pattern confirmed
2. Priority system confirmed (1 = highest)
3. Trigger conflicts resolved (queue all)
4. Dialogue panel spec documented
5. Entity spawning approach confirmed
6. Level editor integration planned
7. Debug system designed

**Ready to proceed?** Let me know and I'll start implementing the EventDebugManager!
