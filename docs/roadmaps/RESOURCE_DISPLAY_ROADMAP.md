# ResourceDisplayComponent Development Roadmap

## Overview
Adapt the TypeScript `ResourceDisplayComponent` from the AntRedo fork to work with the current p5.js/JavaScript architecture. This component displays faction resources (food, wood, stone) with visual icons and counts.

**Goal**: Display resource counts on screen with EventManager integration for real-time updates.

**Affected Systems**: 
- UI Layer (new component)
- RenderLayerManager (registration)
- EventManager (resource update events)
- ResourceManager (data source)

---

## TDD Development Phases

### Phase 1: Model/Data Layer (Unit Tests First)
**Test File**: `test/unit/ui/ResourceDisplayComponent.test.js`

**Tests to Write**:
- [ ] Constructor initializes with position, factionId
- [ ] Constructor sets default resource counts (food: 0, wood: 0, stone: 0)
- [ ] `setPosition(x, y)` updates position correctly
- [ ] `updateResourceCount(type, amount)` updates specific resource
- [ ] `setResources({food, wood, stone})` updates all at once
- [ ] `getPosition()` returns current position
- [ ] `getResources()` returns resource counts
- [ ] Scale property defaults to 1.0
- [ ] Component stores sprites (optional icons)
- [ ] NO rendering logic in unit tests

**Deliverables**:
- [ ] `Classes/ui/ResourceDisplayComponent.js` (data only, no render)
- [ ] All unit tests passing

**MVC Compliance**:
- ✅ Pure data storage (position, resources, scale)
- ✅ Getters/setters for state access
- ❌ NO render() method yet
- ❌ NO EventManager integration yet

---

### Phase 2: Rendering Integration (Integration Tests First)
**Test File**: `test/integration/ui/resourceDisplay.integration.test.js`

**Tests to Write**:
- [ ] Component registers with RenderLayerManager UI_GAME layer
- [ ] Component has render() method
- [ ] render() method called with gameState
- [ ] render() uses p5.js drawing functions (rect, text, image)
- [ ] Render called from RenderLayerManager pipeline
- [ ] Component can be unregistered from RenderLayerManager

**Implementation**:
- [ ] Add `render(gameState)` method to ResourceDisplayComponent
- [ ] Register with RenderLayerManager using `addDrawableToLayer`
- [ ] Implement visual rendering:
  - Semi-transparent background panel
  - Resource icons (sprites or emoji fallback)
  - Resource counts with formatting
  - Horizontal layout with spacing

**Deliverables**:
- [ ] Updated `ResourceDisplayComponent.js` with render()
- [ ] Integration tests passing

---

### Phase 3: BDD Behavior Tests (User-Facing)
**Test File**: `test/bdd/features/resource_display.feature`

**Scenarios to Write**:
- [ ] Player sees resource counts when game starts
- [ ] Resource counts update when resources collected
- [ ] Display shows formatted numbers (commas for thousands)
- [ ] Icons appear for each resource type
- [ ] Display appears at correct screen position
- [ ] Display scales with different scale values

**Test Pattern** (Gherkin):
```gherkin
Feature: Resource Display
  As a player
  I want to see my faction's resources on screen
  So that I can track what I have collected

  Scenario: Initial resource display
    Given the game is running
    When I view the screen
    Then I see resource counts for food, wood, and stone
    And all counts start at 0

  Scenario: Resources update when collected
    Given the resource display shows 10 food
    When 5 food is collected
    Then the display shows 15 food
```

**Deliverables**:
- [x] BDD feature file with 5-6 scenarios
- [ ] Step definitions in `test/bdd/steps/resource_display_steps.py`
- [ ] All BDD tests passing (headless)

---

### Phase 4: EventManager Integration (COMPLETED ✅)
**Test File**: `test/unit/ui/ResourceDisplayComponent.eventManager.test.js`

**Tests** (22 passing):
- [x] Component subscribes to resource update events on init
- [x] `RESOURCE_UPDATED` event triggers resource updates
- [x] Event unsubscription on cleanup/destroy
- [x] Multiple components can subscribe independently
- [x] Events only update matching factionId
- [x] No memory leaks (unsubscribe works)
- [x] Bulk resource updates via events
- [x] Error handling for malformed events

**Implementation**:
- [x] Added `_setupEventListeners()` method
- [x] Subscribe to EventManager events in constructor (optional)
- [x] Track unsubscribe functions for cleanup
- [x] Added `destroy()` method to unregister events
- [x] Support bulk and single resource updates

**EventManager Integration**:
```javascript
// ResourceDisplayComponent now supports:
const component = new ResourceDisplayComponent(50, 50, 'player', {
  eventManager: EventManager.getInstance()
});

// Auto-updates on event:
eventManager.emit('RESOURCE_UPDATED', {
  factionId: 'player',
  resourceType: 'food',
  amount: 100
});

// Cleanup:
component.destroy();
```

**Deliverables**:
- [x] Event integration tests passing (22 tests)
- [x] ResourceDisplayComponent auto-updates via events
- [x] Clean unsubscription on destroy

---

### Phase 5: GameUIOverlay Orchestrator (Factory Pattern) ✅ COMPLETE

**Status**: All 34 tests passing  
**Test File**: `test/unit/ui/GameUIOverlay.test.js`

**Tests Written** (TDD - tests first):
- ✅ GameUIOverlay creates ResourceDisplayComponent (7 tests)
- ✅ `initialize()` registers component with RenderLayerManager (3 tests)
- ✅ `update()` exists and handles deltaTime (4 tests)
- ✅ `destroy()` unregisters component and calls cleanup (5 tests)
- ✅ Multiple components can be managed (1 test)
- ✅ EventManager integration (2 tests)
- ✅ Error handling (4 tests)
- ✅ Component access and state management (8 tests)

**Implementation**:
- ✅ Created `Classes/ui/GameUIOverlay.js` (180 lines)
- ✅ Manages component lifecycle (create, register, cleanup)
- ✅ Stores drawable functions for RenderLayerManager cleanup
- ✅ Provides component access via properties

**API**:
```javascript
const overlay = new GameUIOverlay({
  eventManager,
  renderManager
});

overlay.initialize({
  position: { x: 10, y: 10 },
  factionId: 'player'
});

overlay.update(deltaTime); // Per-frame updates
overlay.destroy();         // Cleanup
```

**API Fix**: Corrected tests to use `renderManager.layerDrawables.get()` (Map property) instead of non-existent `getLayerDrawables()` method.

**Deliverables**:
- ✅ `Classes/ui/GameUIOverlay.js`
- ✅ 34 unit tests passing
- ✅ Clean lifecycle with destroy()

**Validation**: **108 total tests passing** (22 EventManager + 27 Data + 25 Rendering + 34 Orchestrator)

---

### Phase 6: Full System Integration ✅ COMPLETE

**Status**: All 32 integration tests passing  
**Test File**: `test/integration/ui/fullSystem.integration.test.js`

**Tests Written**:
- ✅ System initialization (4 tests)
- ✅ Event-driven updates (4 tests) - RESOURCE_UPDATED event → data update
- ✅ Rendering pipeline integration (4 tests) - RenderLayerManager → visual output
- ✅ Complete workflow: Event → Data → Render (3 tests)
- ✅ Multiple GameUIOverlay instances (4 tests) - player vs enemy factions
- ✅ Lifecycle management (4 tests) - initialize, update, destroy
- ✅ Error handling and edge cases (6 tests)
- ✅ Performance characteristics (3 tests) - 1000 events, 100 renders, no memory leaks

**Key Integration Points Verified**:
- GameUIOverlay creates and manages ResourceDisplayComponent
- EventManager emits RESOURCE_UPDATED → ResourceDisplayComponent updates data
- RenderLayerManager renders ResourceDisplayComponent on UI_GAME layer
- Multiple overlays coexist independently (faction-specific filtering)
- Clean lifecycle: initialize() → update() → destroy()
- Handles 1000 events and 100 render calls efficiently

**Deliverables**:
- ✅ `test/integration/ui/fullSystem.integration.test.js` (32 tests)
- ✅ All components working together
- ✅ No memory leaks verified

**Validation**: **140 total tests passing** (22 EventManager + 27 Data + 25 Rendering + 34 Orchestrator + 32 Full System)

---

### Phase 7: Documentation 🔄 IN PROGRESS
**Files to Create**:
- [ ] `docs/api/ResourceDisplayComponent_API_Reference.md`
- [ ] `docs/api/GameUIOverlay_API_Reference.md`
- [ ] Update `CHANGELOG.md` with new features

**Documentation Sections**:
1. **Constructor parameters** (x, y, factionId, sprites)
2. **Methods** (setPosition, updateResourceCount, render, destroy)
3. **Properties** (scale, resources, factionId)
4. **Events** (RESOURCE_UPDATED subscription)
5. **Usage Examples** (standalone, with GameUIOverlay)
6. **Integration Guide** (RenderLayerManager, EventManager)

**Deliverables**:
- [ ] Complete API documentation
- [ ] Usage examples
- [ ] Integration patterns

---

## File Structure

```
Classes/
  ui/
    ResourceDisplayComponent.js     (NEW - UI component)
    GameUIOverlay.js                 (NEW - orchestrator)
test/
  unit/
    ui/
      ResourceDisplayComponent.test.js        (NEW - data layer tests)
      ResourceDisplayComponent.events.test.js (NEW - event tests)
      GameUIOverlay.test.js                   (NEW - orchestrator tests)
  integration/
    ui/
      resourceDisplay.integration.test.js     (NEW - render tests)
  e2e/
    ui/
      pw_resource_display.js                  (NEW - visual tests)
      pw_game_ui_overlay.js                   (NEW - full system)
docs/
  api/
    ResourceDisplayComponent_API_Reference.md (NEW)
    GameUIOverlay_API_Reference.md            (NEW)
  roadmaps/
    RESOURCE_DISPLAY_ROADMAP.md               (THIS FILE)
```

---

## Testing Strategy

### Unit Tests (Fast, Isolated)
- Mock RenderLayerManager registration
- Mock EventManager events
- Test data mutations only
- No visual rendering
- Target: <10ms per test

### Integration Tests (Component Interactions)
- Use real RenderLayerManager
- Use real EventManager
- Test render() method exists
- Test registration lifecycle
- No screenshots needed

### E2E Tests (Browser, Visual Evidence)
- Full rendering pipeline
- Screenshot proof required
- Test real resource updates
- Verify visual appearance
- Run headless with Puppeteer

---

## Success Criteria

✅ **All tests passing** (unit → integration → E2E)
✅ **Resource display visible on screen** (screenshot proof)
✅ **EventManager integration working** (real-time updates)
✅ **Clean lifecycle management** (no memory leaks)
✅ **MVC compliance** (data/render separation)
✅ **Documentation complete** (API reference, usage guide)
✅ **TDD workflow followed** (tests before implementation)

---

## Next Steps After Completion

1. **Add PopulationDisplayComponent** (similar pattern)
2. **Add MinimapComponent** (camera integration)
3. **Add PowerBarComponent** (queen abilities)
4. **Expand GameUIOverlay** (manage all UI components)
5. **Add UI configuration system** (positioning, scaling)

---

## Notes

- **Keep it simple**: Start with food, wood, stone only (skip magic crystals for now)
- **Emoji fallback**: Use text emojis if sprites not loaded
- **Scale support**: Use base sizes * scale multiplier
- **EventManager first**: Prefer event-driven updates over polling
- **Screenshot everything**: E2E tests must provide visual evidence
- **No TypeScript**: Pure JavaScript for consistency with codebase

---

## Estimated Time

- Phase 1 (Data Layer): 1 hour
- Phase 2 (Rendering): 1.5 hours
- Phase 3 (E2E Visual): 1 hour
- Phase 4 (EventManager): 1.5 hours
- Phase 5 (GameUIOverlay): 1 hour
- Phase 6 (Full Integration): 1 hour
- Phase 7 (Documentation): 1 hour

**Total**: ~8 hours (1 full development day)
