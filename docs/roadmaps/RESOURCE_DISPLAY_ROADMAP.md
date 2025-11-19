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

### Phase 3: E2E Visual Verification (Screenshots)
**Test File**: `test/e2e/ui/pw_resource_display.js`

**Tests to Write**:
- [ ] Resource display renders on screen (screenshot proof)
- [ ] Shows correct initial resource counts (0, 0, 0)
- [ ] Updates when resource counts change (via EventManager)
- [ ] Position updates correctly
- [ ] Scale multiplier works (test at 1.0 and 1.5)
- [ ] Survives game state transitions (MENU → PLAYING)

**Test Pattern**:
```javascript
await page.evaluate(() => {
  window.g_resourceDisplay = new ResourceDisplayComponent(50, 50, 'player');
  RenderLayerManager.addDrawableToLayer(
    RenderLayerManager.layers.UI_GAME,
    () => window.g_resourceDisplay.render(window.gameState)
  );
  window.redraw(); window.redraw(); window.redraw();
});
await sleep(500);
await saveScreenshot(page, 'ui/resource_display_initial', true);
```

**Deliverables**:
- [ ] E2E test file with 6-8 tests
- [ ] Screenshot evidence in `test/e2e/screenshots/ui/success/`
- [ ] All tests passing

---

### Phase 4: EventManager Integration (Unit + Integration Tests)
**Test File**: `test/unit/ui/ResourceDisplayComponent.events.test.js`

**Tests to Write**:
- [ ] Component subscribes to resource update events on init
- [ ] `RESOURCE_UPDATED` event triggers `updateResourceCount()`
- [ ] Event unsubscription on cleanup/destroy
- [ ] Multiple components can subscribe independently
- [ ] Events only update matching factionId
- [ ] No memory leaks (unsubscribe works)

**Implementation**:
- [ ] Add `setupEventListeners()` method
- [ ] Subscribe to EventManager events in constructor
- [ ] Track unsubscribe functions for cleanup
- [ ] Add `destroy()` method to unregister events
- [ ] Emit events when ResourceManager changes resources

**EventManager Integration**:
```javascript
// In ResourceDisplayComponent
constructor(x, y, factionId) {
  // ... existing code ...
  this._eventUnsubscribers = [];
  this._setupEventListeners();
}

_setupEventListeners() {
  const eventManager = EventManager.getInstance();
  const unsub = eventManager.on('RESOURCE_UPDATED', (data) => {
    if (data.factionId === this.factionId) {
      this.updateResourceCount(data.resourceType, data.amount);
    }
  });
  this._eventUnsubscribers.push(unsub);
}

destroy() {
  this._eventUnsubscribers.forEach(unsub => unsub());
  this._eventUnsubscribers = [];
}
```

**Deliverables**:
- [ ] Event integration tests passing
- [ ] ResourceDisplayComponent auto-updates via events
- [ ] Clean unsubscription on destroy

---

### Phase 5: GameUIOverlay Orchestrator (Factory Pattern)
**Test File**: `test/unit/ui/GameUIOverlay.test.js`

**Tests to Write**:
- [ ] GameUIOverlay creates ResourceDisplayComponent
- [ ] `initialize()` registers component with RenderLayerManager
- [ ] `update()` exists (for future updates)
- [ ] `cleanup()` unregisters component and calls destroy()
- [ ] `setComponentVisibility('resources', false)` hides component
- [ ] Multiple components can be managed (future: population, minimap)

**Implementation**:
- [ ] Create `Classes/ui/GameUIOverlay.js`
- [ ] Manage component lifecycle (create, register, cleanup)
- [ ] Store unregister functions for cleanup
- [ ] Provide visibility toggles

**API**:
```javascript
const overlay = new GameUIOverlay({
  canvasWidth: 800,
  canvasHeight: 800,
  factionId: 'player',
  showResources: true
});
overlay.initialize(); // Creates and registers components
overlay.update();     // Per-frame updates
overlay.cleanup();    // Unregister and destroy
```

**Deliverables**:
- [ ] `Classes/ui/GameUIOverlay.js`
- [ ] Unit tests passing
- [ ] Clean lifecycle management

---

### Phase 6: Full System Integration (E2E)
**Test File**: `test/e2e/ui/pw_game_ui_overlay.js`

**Tests to Write**:
- [ ] GameUIOverlay + ResourceDisplayComponent render together
- [ ] Resource updates via ResourceManager reflect in UI
- [ ] EventManager events trigger visual updates
- [ ] Cleanup removes all UI elements
- [ ] Multiple overlays can coexist (player vs enemy factions)

**Deliverables**:
- [ ] E2E integration tests passing
- [ ] Screenshot evidence of full system
- [ ] All components working together

---

### Phase 7: Documentation
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
