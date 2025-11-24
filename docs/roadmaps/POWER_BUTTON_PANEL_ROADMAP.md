# Power Button Panel Roadmap

## Overview
Create a UI panel system for displaying and managing Queen power buttons. Each button shows power availability, lock status, and cooldown progress with visual feedback via EventBus integration.

**Affected Systems**: UI, EventManager, PowerManager, Queen, RenderLayerManager

## Requirements

1. **Custom Button Sprites**: Render power-specific button sprites (fireball, lightning, finalFlash, etc.)
2. **Lock Status**: Query Queen.isPowerUnlocked(), render lock icon + grey tint when locked
3. **RenderManager Integration**: Register with gameUIOverlaySystem.js → UIRegisterWithRenderer
4. **Cooldown System**: EventBus signals (`power:cooldown:start`, `power:cooldown:end`), radial progress indicator (counterclockwise)
5. **Background Panel**: Similar visual style to ResourceCountDisplay

## Phases

### Phase 1: PowerButtonModel (Data Layer)
- [x] Write unit tests (TDD) - test data storage only
- [ ] Implement model class (data storage: power name, lock status, cooldown progress, sprite path)
- [ ] Run tests (pass)
- [ ] Verify NO logic/rendering
**Deliverables**: 
- `Classes/ui_new/components/PowerButtonModel.js`
- `test/unit/ui_new/PowerButtonModel.test.js`

### Phase 2: PowerButtonView (Presentation Layer)
- [ ] Write unit tests - test rendering methods
- [ ] Implement view class (render sprite, lock overlay, grey tint, cooldown radial)
- [ ] Run tests (pass)
- [ ] Verify NO state mutations
**Deliverables**: 
- `Classes/ui_new/components/PowerButtonView.js`
- `test/unit/ui_new/PowerButtonView.test.js`

### Phase 3: PowerButtonController (Orchestration)
- [ ] Write unit tests - test EventBus integration, Queen queries, click handling
- [ ] Implement controller class (EventBus listeners, cooldown updates, click handlers)
- [ ] Run tests (pass)
- [ ] Verify NO rendering/data storage
**Deliverables**: 
- `Classes/ui_new/components/PowerButtonController.js`
- `test/unit/ui_new/PowerButtonController.test.js`

### Phase 4: PowerButtonPanelModel (Panel Data Layer)
- [ ] Write unit tests - test panel data storage
- [ ] Implement panel model (position, dimensions, button layout data)
- [ ] Run tests (pass)
- [ ] Verify NO logic/rendering
**Deliverables**: 
- `Classes/ui_new/components/PowerButtonPanelModel.js`
- `test/unit/ui_new/PowerButtonPanelModel.test.js`

### Phase 5: PowerButtonPanelView (Panel Presentation Layer)
- [ ] Write unit tests - test background panel rendering
- [ ] Implement panel view (background similar to ResourceCountDisplay, delegate button rendering)
- [ ] Run tests (pass)
- [ ] Verify NO state mutations
**Deliverables**: 
- `Classes/ui_new/components/PowerButtonPanelView.js`
- `test/unit/ui_new/PowerButtonPanelView.test.js`

### Phase 6: PowerButtonPanelController (Panel Orchestration)
- [ ] Write unit tests - test multi-button coordination
- [ ] Implement panel controller (manage PowerButtonControllers, RenderManager integration)
- [ ] Run tests (pass)
- [ ] Verify NO rendering/data storage
**Deliverables**: 
- `Classes/ui_new/components/PowerButtonPanelController.js`
- `test/unit/ui_new/PowerButtonPanelController.test.js`

### Phase 7: PowerManager EventBus Integration
- [ ] Add EventBus.emit('power:cooldown:start', { powerName, duration }) in PowerManager
- [ ] Add EventBus.emit('power:cooldown:end', { powerName }) when cooldown completes
- [ ] Update Lightning, FinalFlash, FireballPower classes
**Deliverables**: 
- Updated `Classes/managers/PowerManager.js`

### Phase 8: Integration & System Connection
- [ ] Write integration tests (MVC coordination)
- [ ] Update gameUIOverlaySystem.js (type checks, instantiation, renderer registration)
- [ ] Connect EventBus signals between PowerManager ↔ PowerButtonPanel
- [ ] Run tests (pass)
**Deliverables**: 
- `test/integration/ui_new/powerButtonPanel.integration.test.js`
- Updated `Classes/ui_new/gameUIOverlaySystem.js`

### Phase 9: E2E & Documentation
- [ ] Write E2E tests with screenshots (locked buttons, cooldown radial, unlock)
- [ ] Create API reference documentation
- [ ] Update CHANGELOG.md
**Deliverables**: 
- `test/e2e/ui/pw_power_button_panel.js`
- `docs/api/PowerButtonPanel_API_Reference.md`
- Updated `CHANGELOG.md`

## Testing Strategy

**Unit Tests**: Isolated MVC components
- Model: Data getters/setters
- View: Rendering methods (mocked p5.js)
- Controller: EventBus listeners, Queen queries, update logic

**Integration Tests**: MVC triads working together
- Button click → controller → model update → view render
- EventBus signal → controller → model cooldown update → view radial
- Queen unlock status → controller query → model lock state → view tint

**E2E Tests**: Browser with screenshots
- Visual proof of locked/unlocked buttons
- Cooldown radial animation
- Panel background rendering

## MVC Compliance Checklist

**Model (Pure Data)**:
- ✅ Store: power name, isLocked, cooldownProgress, spritePath, panel position/dimensions
- ❌ NO update methods
- ❌ NO render methods
- ❌ NO EventBus calls

**View (Read-Only Presentation)**:
- ✅ Render: sprite, lock icon, grey tint, cooldown radial, panel background
- ❌ NO model mutations
- ❌ NO EventBus calls
- ❌ NO Queen queries

**Controller (Orchestration)**:
- ✅ EventBus listeners (cooldown events)
- ✅ Queen.isPowerUnlocked() queries
- ✅ Update model cooldownProgress
- ✅ Click handlers
- ❌ NO rendering (delegate to view)
- ❌ NO data storage (delegate to model)

## EventBus Signal Specification

**Emitted by PowerManager**:
```javascript
EventBus.emit('power:cooldown:start', {
  powerName: 'lightning',
  duration: 1000, // milliseconds
  timestamp: millis()
});

EventBus.emit('power:cooldown:end', {
  powerName: 'lightning',
  timestamp: millis()
});
```

**Consumed by PowerButtonController**:
```javascript
EventBus.on('power:cooldown:start', (data) => {
  if (data.powerName === this.model.getPowerName()) {
    this.startCooldown(data.duration);
  }
});

EventBus.on('power:cooldown:end', (data) => {
  if (data.powerName === this.model.getPowerName()) {
    this.endCooldown();
  }
});
```

## Visual Design Specifications

**Button Size**: 64x64 pixels (sprite size)
**Panel Background**: Similar to ResourceCountDisplay (rounded corners, semi-transparent)
**Lock Icon**: 32x32 overlay centered on button
**Grey Tint**: rgba(100, 100, 100, 180) when locked/cooldown
**Cooldown Radial**: 
- Arc starting at 12 o'clock (270°), ending at 12 o'clock (270° - 360°)
- Counterclockwise rotation
- Stroke weight: 4px
- Color: rgba(255, 100, 100, 200)

## Button Sprite Paths
- Fireball: `Images/Assets/fireball_button.png`
- Lightning: `Images/Assets/lightning_button.png`
- FinalFlash: `Images/Assets/finalflash_button.png`
- Blackhole: `Images/Assets/blackhole_button.png` (future)
- Sludge: `Images/Assets/sludge_button.png` (future)
- TidalWave: `Images/Assets/tidalwave_button.png` (future)

## Documentation Updates
- [ ] API reference for PowerButtonPanel
- [ ] Usage examples in this roadmap
- [ ] CHANGELOG.md entry
- [ ] Update gameUIOverlaySystem.js comments
