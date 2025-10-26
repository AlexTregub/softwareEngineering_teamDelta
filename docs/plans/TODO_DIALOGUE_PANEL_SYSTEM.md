# TODO: Dialogue Panel System

## Overview
Create a specialized DraggablePanel variant for displaying event dialogue, tutorials, and narrative content.

## Requirements

### Panel Behavior
- ✅ **Static Position**: Bottom of screen, cannot be dragged
- ✅ **Non-closeable**: No X button (closes via event completion/button response)
- ✅ **Viewport-relative**: Follows viewport, not world coordinates
- ✅ **Always on top**: Render layer above game UI

### Visual Design

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Speaker Name]                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│  Dialogue message text goes here. Can be multi-line        │
│  with proper wrapping and padding.                         │
│                                                             │
│                        [Button 1] [Button 2]                │
└─────────────────────────────────────────────────────────────┐
```

#### Positioning
- **Bottom of viewport** with large padding (e.g., 40px from bottom, 80px from sides)
- **Centered horizontally**
- **Auto-height** based on content (message length + buttons)

### Animation System

#### Entry Animation (Expand from center)
1. **Phase 1**: Vertical expand (0 → target height) - 200ms
2. **Phase 2**: Horizontal expand (center → full width) - 300ms
3. **Total duration**: 500ms
4. **Easing**: Ease-out (fast start, slow finish)

```javascript
// Pseudocode
expandAnimation: {
  phase1: { // Vertical
    from: { height: 0, width: minWidth },
    to: { height: targetHeight, width: minWidth },
    duration: 200,
    easing: 'easeOut'
  },
  phase2: { // Horizontal
    from: { width: minWidth },
    to: { width: targetWidth },
    duration: 300,
    easing: 'easeOut'
  }
}
```

#### Exit Animation (Collapse to center)
- Reverse of entry animation
- Horizontal collapse (300ms) → Vertical collapse (200ms)

### Component Structure

#### DialoguePanel (extends DraggablePanel or new base?)
```javascript
class DialoguePanel {
  constructor(config) {
    // Fixed position, non-draggable
    this.position = 'bottom-center';
    this.draggable = false;
    this.closeable = false;
    this.padding = { x: 80, y: 40 };
    this.animation = new PanelAnimation();
  }
  
  // Content sections
  this.speakerSection = { ... };
  this.messageSection = { ... };
  this.buttonSection = { ... };
}
```

### Features to Implement

#### Core Features
- [ ] Static positioning system (override DraggablePanel position logic)
- [ ] Non-draggable behavior (ignore mouse drag events)
- [ ] Speaker name display with styling
- [ ] Multi-line message with text wrapping
- [ ] Button array with click handlers
- [ ] Auto-sizing based on content

#### Animation Features
- [ ] Two-phase expand animation (vertical → horizontal)
- [ ] Collapse animation (reverse)
- [ ] Animation state machine (idle → expanding → visible → collapsing → hidden)
- [ ] Pause dialogue during animation
- [ ] Skip animation option (for testing)

#### Integration Features
- [ ] DialogueEvent → DialoguePanel binding
- [ ] TutorialEvent → DialoguePanel (with highlight arrows?)
- [ ] Button responses → Event completion
- [ ] Queue system for multiple dialogues
- [ ] Interrupt handling (boss fight overrides tutorial)

### Styling

#### Colors/Themes
- **Background**: Semi-transparent dark (rgba(20, 20, 30, 0.95))
- **Border**: Accent color (match game theme)
- **Speaker name**: Highlight color, larger font
- **Message**: Light text, readable font
- **Buttons**: Hover states, click feedback

#### Fonts/Sizes
- Speaker: 18px bold
- Message: 14px regular
- Buttons: 14px medium
- Line height: 1.4 for message

### Technical Considerations

#### DraggablePanel Integration
**Option A**: Extend DraggablePanel
- Pros: Reuse rendering, state management
- Cons: Fight against dragging/closing behavior

**Option B**: New StaticPanel base class
- Pros: Cleaner separation, no behavior conflicts
- Cons: Code duplication for rendering

**Recommendation**: Create `StaticPanel` base class, share rendering utils with DraggablePanel

#### Render Layer
- Add to `RenderLayerManager.layers.UI_DIALOGUE` (new layer above UI_GAME)
- Always visible unless explicitly hidden
- Render order: TERRAIN → ENTITIES → EFFECTS → UI_GAME → UI_DIALOGUE → UI_DEBUG → UI_MENU

#### Animation System
- Use requestAnimationFrame or p5.js frameCount
- Store animation start time, calculate progress
- Easing function: `easeOutCubic = 1 - Math.pow(1 - t, 3)`

### Testing Requirements

#### Unit Tests
- [ ] DialoguePanel creation
- [ ] Content rendering (speaker, message, buttons)
- [ ] Animation phase transitions
- [ ] Button click handling
- [ ] Queue management

#### Integration Tests
- [ ] DialoguePanel + RenderLayerManager
- [ ] DialogueEvent → DialoguePanel data flow
- [ ] Animation completion callbacks
- [ ] Multiple dialogue queueing

#### E2E Tests (with screenshots!)
- [ ] Dialogue appears at bottom of screen
- [ ] Expand animation visual verification
- [ ] Button clicks close dialogue
- [ ] Speaker name displays correctly
- [ ] Multi-line text wraps properly
- [ ] Padding matches design spec

### Implementation Order (TDD)
1. **Unit tests** for StaticPanel base class
2. **Implement** StaticPanel
3. **Unit tests** for DialoguePanel content
4. **Implement** DialoguePanel rendering
5. **Unit tests** for animation system
6. **Implement** two-phase animation
7. **Integration tests** with EventManager
8. **E2E tests** with visual verification

### Future Enhancements
- [ ] Portrait images for speakers
- [ ] Typing animation for message text
- [ ] Sound effects (panel open, button click)
- [ ] Dialogue history/log
- [ ] Skip dialogue button
- [ ] Voice acting integration (if applicable)
- [ ] Localization support

---

**Priority**: Medium (after core EventManager implementation)
**Estimated Effort**: 2-3 days
**Dependencies**: EventManager, RenderLayerManager, DialogueEvent class
