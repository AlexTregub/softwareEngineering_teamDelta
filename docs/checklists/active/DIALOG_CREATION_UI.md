# Dialogue Creation UI - Implementation Checklist

**Feature**: Dialogue event template opens specialized UI for creating character-based dialogue sequences with per-line animation controls

**User Story**: As a level designer, I want to create dialogue events with sequential character conversation flows, per-line text effects, and inline editing so that I can add rich narrative content to my levels.

**Status**: Phase 1 - Mockup Finalized (November 1, 2025)

**Estimated Time**: 5-7 hours (3 phases)

---

## Overview

When a user selects the "Dialogue 💬" event template in the EventEditorPanel, a specialized dialogue creation UI will open. This UI allows designers to:
- **Sequential order**: Lines appear in button-click order (Char1 → Char1 → Char2 = two Char1 boxes back-to-back)
- **Staggered layout**: Character 1 on left, Character 2 on right for conversation flow visualization
- **Scrollable viewport**: Conversation area scrolls independently while controls stay fixed
- **Per-line effects**: Each dialogue line has own text effect (typewriter/fade/instant) and scroll speed
- **Inline text editing**: Click line to expand, type text, press Enter to save
- **Default settings**: Set default speed/effect for new lines

**Key Design Decisions**: 
1. **Sequential order tracking** - Lines maintain button-press order for natural conversation flow
2. **Scrollable conversation viewport** - Handles long dialogues without panel overflow
3. **Per-line animation controls** - Maximum flexibility for dialogue pacing

**Integration Point**: EventEditorPanel → DialogueCreationPanel (new component)

---

## Phase 1: DialogueCreationPanel Component ⏳

**Objective**: Create UI component matching finalized mockup with scrollable viewport, per-line effects, and inline editing

### Reusable Components (USE THESE!)

- **Button** (`Classes/systems/Button.js`) - For add/remove buttons
  - Constructor: `new Button(x, y, width, height, caption, options)`
  - Options: `onClick`, `backgroundColor`, `hoverColor`, `enabled`
  - Methods: `render()`, `update()`, `handleClick(x, y)`, `setEnabled(bool)`
  
- **Slider** (`Classes/ui/components/Slider.js`) - For default scroll speed slider
  - Constructor: `new Slider(x, y, width, min, max, value, onChange)`
  - Methods: `render()`, `handleDrag(x, y)`, `setValue(value)`, `getValue()`
  
- **ScrollableContentArea** (`Classes/ui/ScrollableContentArea.js`) - For conversation viewport
  - Constructor: `new ScrollableContentArea({ width, height, scrollSpeed, onItemClick })`
  - Methods: `render(x, y)`, `handleMouseWheel(delta)`, `handleClick(x, y, offsetX, offsetY)`
  - **Note**: May need custom scroll implementation for dialogue line rendering (ScrollableContentArea uses item-based approach)
  
- **CategoryRadioButtons** (`Classes/ui/CategoryRadioButtons.js`) - REFERENCE for radio button pattern (default effect selector)
  - Pattern: Horizontal button row with selected state highlighting

### Tasks

- [ ] **Write unit tests FIRST** (TDD Red phase) - ~40 tests
  - Constructor initialization (position, dimensions, title, dialogueLines array)
  - Render title bar ("Dialogue Creation")
  - Render default controls (scroll speed slider, effect radio buttons)
  - Render scrollable viewport (conversation area with clipping)
  - Render dialogue lines (sequential order, staggered left/right positioning)
  - Render collapsed line (40px height, character label, effect indicator, text preview)
  - Render expanded line (100px height, per-line effect buttons, speed slider, text editing)
  - Render add/remove buttons (centered, 4 buttons total)
  - Render save button (green, bottom)
  - Render scrollbar (track + draggable thumb)
  - Click detection: default controls, scrollbar, dialogue lines, per-line controls, add/remove, save
  - Scroll handling: mouse wheel, scrollbar drag, scrollbar track jump
  - Line expansion/collapse toggle
  - Text editing: keyboard input (printable chars, Enter, Escape, Backspace)
  - Sequential line order (add Char1 → add Char1 → add Char2 = correct order)
  - Per-line effect/speed modification
  - Remove last line for character (maintains order)
  - Export dialogue data with per-line settings

- [ ] **Implement DialogueCreationPanel class** (~600 lines)
  - Constructor: `new DialogueCreationPanel(x, y, width, height, eventData, eventManager)`
  - **Properties**:
    - `dialogueLines`: Array of `{character: 1|2, text: "", effect: "typewriter", scrollSpeed: 50}`
    - `expandedLineIndex`: Which line is expanded (null = none)
    - `isEditingText`: Boolean for edit mode
    - `editBuffer`: Temporary text during editing
    - `cursorVisible`, `cursorBlinkTimer`: Cursor animation state
    - `defaultScrollSpeed`: Default speed for new lines (1-100)
    - `defaultTextEffect`: Default effect for new lines ("typewriter", "fade", "instant")
    - `scrollOffset`, `maxScrollOffset`: Viewport scroll state
    - `scrollbarDragging`, `scrollbarDragOffset`: Scrollbar drag state
    - Reusable components: `defaultSpeedSlider` (Slider), `addButton1/2` (Button), `removeButton1/2` (Button), `saveButton` (Button)
    - Bounds objects: `scrollbarBounds`, `scrollbarThumbBounds`, `lineBounds[]`, `defaultEffectButtonBounds[]`
  
  - **Core Methods**:
    - `render()`: Main render loop with cursor animation
    - `_renderTitleBar()`: "Dialogue Creation" header
    - `_renderTextEffectControls()`: Default speed slider + effect buttons (top)
    - `_renderScrollableDialogue(startY, height)`: Viewport with clipping + scrollbar
    - `_renderStaggeredDialogue(startY, viewportWidth)`: Lines in sequential order (left/right based on character)
    - `_renderDialogueLine(line, index, x, y, width, height, isExpanded)`: Individual box with state-based rendering
    - `_renderLineEffectControls(line, index, x, y, width)`: Per-line effect buttons + speed slider (expanded only)
    - `_renderAddRemoveButtons(buttonY)`: 4 centered buttons
    - `_renderSaveButton()`: Green button at bottom
    - `_renderScrollbar(x, y, height, contentHeight)`: Track + thumb with bounds
  
  - **Interaction Methods**:
    - `handleClick(x, y)`: Route clicks to all interactive elements
    - `handleMouseDrag(x, y)`: Handle scrollbar dragging
    - `handleMouseRelease()`: Stop scrollbar drag
    - `handleMouseWheel(delta)`: Scroll content
    - `handleKeyPress(key)`: Text editing (Enter/Escape/Backspace/printable)
  
  - **Data Methods**:
    - `addLine(characterNum)`: Append to END with default settings
    - `removeLastLine(characterNum)`: Remove last line for that character
    - `expandLine(index)`: Toggle expansion + edit mode
    - `saveEditedText()`: Save editBuffer to dialogueLines[index].text
    - `saveDialogue()`: Export complete dialogue data
  
  - **Helper Methods**:
    - `_wrapText(text, maxWidth)`: Word wrapping for expanded boxes
    - `_pointInBounds(x, y, bounds)`: Click detection utility

- [ ] **Run unit tests** (should pass - TDD Green phase)

- [ ] **Create reusable component wrappers** (if needed)
  - If Button class doesn't support callback-style onClick, create wrapper
  - If Slider needs adjustment for horizontal layout in panel, extend it

**Deliverables**:
- `Classes/ui/DialogueCreationPanel.js` (~600 lines)
- `test/unit/ui/dialogueCreationPanel.test.js` (~400 lines, 40+ tests)
- Updated component classes (if extensions needed)

**Estimated Time**: 3-4 hours

---

## Phase 2: EventEditorPanel Integration ⏳

**Objective**: Connect dialog template selection to DialogCreationPanel opening

### Tasks

- [ ] **Write integration tests FIRST** (TDD)
  - Click "Dialogue 💬" template → DialogCreationPanel opens
  - DialogCreationPanel position is centered on screen
  - Adding lines updates panel state
  - Closing panel saves dialogue data to event
  - Multiple open/close cycles work correctly

- [ ] **Enhance EventEditorPanel** (~50 lines)
  - Add `dialogCreationPanel` property (null by default)
  - Modify `_selectTemplate(templateId)`: If type === 'dialogue', open DialogCreationPanel
  - Add `openDialogCreationPanel(eventData)`: Create and position panel
  - Add `closeDialogCreationPanel()`: Cleanup and save data
  - Integrate into render loop: `if (this.dialogCreationPanel) { this.dialogCreationPanel.render(); }`
  - Integrate into click handling: Pass clicks to panel if open

- [ ] **Run integration tests** (should pass)

**Deliverables**:
- `test/integration/levelEditor/dialogCreationPanel.integration.test.js` (~150 lines, 8+ tests)
- `Classes/systems/ui/EventEditorPanel.js` (enhancement ~50 lines)

**Estimated Time**: 1-1.5 hours

---

## Phase 3: E2E Validation & Documentation ⏳

**Objective**: Verify complete workflow with visual proof and document API

### Tasks

- [ ] **Write E2E test with Puppeteer** (TDD)
  - Start Level Editor
  - Open EventEditorPanel (Ctrl+6)
  - Click "Dialogue 💬" template
  - Verify DialogCreationPanel opens
  - Click "Add +" button for Character 1 → verify line appears
  - Click "Add +" button for Character 2 → verify line appears
  - Click "Remove -" button → verify line removed
  - Take screenshots at each step

- [ ] **Run E2E test** (7-step workflow)

- [ ] **Update documentation**
  - CHANGELOG.md: Add user-facing feature description
  - CHANGELOG.md: Add developer-facing API changes
  - docs/api/DialogCreationPanel_API.md: Create API reference (Godot format)

- [ ] **Archive checklist** to `docs/checklists/archieved/`

**Deliverables**:
- `test/e2e/levelEditor/pw_dialog_creation_panel.js` (~250 lines)
- 7 E2E screenshots
- `docs/api/DialogCreationPanel_API.md` (~300 lines)
- CHANGELOG.md updates

**Estimated Time**: 1.5-2 hours

---

## UI Layout Specification

Based on finalized mockup (`dialog_creation_mockup.html`):

```
┌───────────────────────────────────────────────────────────┐
│              Dialogue Creation (title)                    │
├───────────────────────────────────────────────────────────┤
│  Default Scroll Speed: [====|    ] 50 ch/s               │
│  Default Effect:  [⌨ typewriter] [✨ fade] [⚡ instant]  │
├───────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐  ▲ │
│ │ [Scrollable Conversation Viewport - Clipped]      │  █ │ <- Scrollbar
│ │                                                    │  │ │
│ │ Char1 ┌─────────────────┐                         │  │ │
│ │       │ Hello there!    │ ⌨ 50ch/s                │  │ │
│ │       └─────────────────┘                         │  │ │
│ │                         ┌─────────────────┐ Char2 │  │ │
│ │              ⌨ 60ch/s   │ I'm doing great!│       │  │ │
│ │                         └─────────────────┘       │  ▼ │
│ │ Char1 ┌─────────────────┐ (EXPANDED 100px)       │    │
│ │       │ Character 1     [⌨][✨][⚡] [==|] 50     │    │
│ │       │ How are you     (per-line controls)      │    │
│ │       │ doing today?_   (text editing)           │    │
│ │       └─────────────────┘                         │    │
│ └───────────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────────┤
│        Char 1        |        Char 2                     │
│        [+]  [-]      |        [+]  [-]                   │
├───────────────────────────────────────────────────────────┤
│                  [💾 Save Dialogue]                       │
└───────────────────────────────────────────────────────────┘
```

**Dimensions**:
- Panel: 700px width × 650px height
- Title bar: 40px height
- Default controls section: 80px height
- Scrollable viewport: ~400px height (dynamic, fills space between controls and buttons)
- Dialogue line box (collapsed): 260px width × 40px height
- Dialogue line box (expanded): 260px width × 100px height
- Line spacing: 15px gap between boxes
- Add/Remove buttons: 60px width × 40px height
- Save button: 150px width × 45px height
- Scrollbar: 12px width
- Per-line effect buttons: 35px width × 20px height
- Per-line speed slider: 60px width × 10px height

**Colors**:
- Title bar: `rgb(35, 35, 40)` (dark gray)
- Default controls background: `rgb(50, 50, 55)` (medium gray)
- Scrollable viewport background: `rgb(25, 25, 30)` (darker for contrast)
- Dialogue line boxes: `rgb(30, 30, 35)` (dark) with `rgb(100, 100, 110)` border (1px)
- Expanded line: `rgb(60, 130, 200)` border (3px blue highlight)
- Character labels: `rgba(220, 220, 220, 150)` (semi-transparent text)
- Effect indicators: `rgba(60, 130, 200, 150)` (blue, semi-transparent)
- Add button: `rgb(60, 130, 200)` (blue)
- Remove button: `rgb(200, 60, 60)` (red)
- Save button: `rgb(60, 180, 75)` (green)
- Scrollbar track: `rgb(30, 30, 35)` with `rgb(100, 100, 110)` border
- Scrollbar thumb: `rgb(60, 130, 200)` (blue, draggable)

---

## Data Structure

**DialogueCreationPanel State**:
```javascript
{
  // Sequential dialogue lines (maintains button-press order)
  dialogueLines: [
    { character: 1, text: "Hello there!", effect: "typewriter", scrollSpeed: 50 },
    { character: 1, text: "How are you today?", effect: "typewriter", scrollSpeed: 50 },
    { character: 2, text: "I'm doing well, thanks!", effect: "fade", scrollSpeed: 60 }
  ],
  
  // UI state
  expandedLineIndex: 0,      // Which line is expanded (null = none)
  isEditingText: true,        // Edit mode active
  editBuffer: "Hello there!", // Temporary text during editing
  
  // Default settings for new lines
  defaultScrollSpeed: 50,     // 1-100 characters per second
  defaultTextEffect: "typewriter", // "typewriter", "fade", or "instant"
  
  // Scroll state
  scrollOffset: 150,          // Current scroll position in pixels
  maxScrollOffset: 500        // Maximum scroll (total content height - viewport height)
}
```

**Event Data Export** (saved to EventManager):
```javascript
{
  id: 'event_dialogue_001',
  type: 'dialogue',
  content: {
    dialogueLines: [
      { character: 1, text: "Hello there!", effect: "typewriter", scrollSpeed: 50 },
      { character: 1, text: "How are you today?", effect: "typewriter", scrollSpeed: 50 },
      { character: 2, text: "I'm doing well, thanks!", effect: "fade", scrollSpeed: 60 }
    ],
    metadata: {
      totalLines: 3,
      character1Count: 2,
      character2Count: 1
    }
  }
}
```

---

## Testing Strategy

### Unit Tests (Write FIRST) - ~40 tests
- DialogueCreationPanel constructor initialization (dialogueLines array, default settings, scroll state)
- Render methods (title bar, default controls, scrollable viewport, lines, buttons, scrollbar)
- Line rendering states (collapsed 40px vs expanded 100px)
- Per-line effect controls (effect buttons, speed slider) when expanded
- Click detection (default controls, scrollbar, dialogue lines, per-line controls, add/remove, save)
- Scroll handling (mouse wheel, scrollbar drag, scrollbar track jump)
- Line expansion/collapse toggle (click same line = toggle edit mode)
- Text editing (keyboard input: printable chars, Enter saves, Escape cancels, Backspace deletes)
- Sequential line order (add Char1 → add Char1 → add Char2 maintains order)
- Per-line effect/speed modification (changes specific line, not all)
- Remove last line for character (finds last matching character, removes, adjusts expanded index)
- Export dialogue data with per-line settings (dialogueLines array + metadata)

### Integration Tests - ~8 tests
- EventEditorPanel → DialogueCreationPanel opening (click "Dialogue 💬" template)
- DialogueCreationPanel position is centered on screen
- Template selection workflow (select template → panel opens → add lines → panel state updates)
- Data persistence to EventManager (save dialogue → event.content.dialogueLines populated)
- Panel lifecycle (open/close/reopen maintains state)
- Multiple dialogue lines workflow (add 10+ lines → scroll → edit line 7 → save)

### E2E Tests (Puppeteer with Screenshots) - ~12 steps
- Start Level Editor → Open EventEditorPanel (Ctrl+6)
- Click "Dialogue 💬" template → DialogueCreationPanel opens (screenshot)
- Set default scroll speed to 70 ch/s (screenshot)
- Select "fade" effect (screenshot)
- Click Char1 [+] button twice → 2 Char1 boxes appear (screenshot)
- Click Char2 [+] button once → Char2 box appears below (screenshot)
- Scroll conversation viewport down (screenshot)
- Click first line → expands to 100px (screenshot)
- Type text "Hello there!" → text appears (screenshot)
- Modify per-line effect to "instant" (screenshot)
- Press Enter → saves, collapses (screenshot)
- Click "Save Dialogue" button → exports data (screenshot)

---

## Implementation Notes

### Key Design Patterns

**Sequential Order Tracking**:
- `dialogueLines` is a single array maintaining exact button-press order
- Example: Click Char1 [+], Char1 [+], Char2 [+] → `[{character: 1, ...}, {character: 1, ...}, {character: 2, ...}]`
- Remove button finds LAST line for that character and removes it

**Staggered Visual Layout**:
- While data is sequential, rendering positions based on character
- Character 1 lines render at `leftX`, Character 2 at `rightX`
- Creates conversation flow visualization (left ↔ right)

**Scrollable Viewport with Clipping**:
- Use `drawingContext.clip()` to prevent dialogue boxes from overflowing viewport
- Scrollbar only appears when `contentHeight > viewportHeight`
- Controls and buttons fixed in place (don't scroll)

**Per-Line Effect Controls**:
- Each `dialogueLines[i]` has own `{effect, scrollSpeed}` properties
- Expanded state shows 3 effect buttons + mini speed slider for THAT line only
- Default controls set values for NEW lines when [+] clicked

**Text Editing Workflow**:
1. Click collapsed box → expands to 100px
2. Click expanded box → enters edit mode, loads text into `editBuffer`
3. Type → updates `editBuffer`
4. Enter → saves `editBuffer` to `dialogueLines[index].text`, exits edit, collapses
5. Escape → cancels edit, exits edit, collapses

### Reusable Component Integration

**Button class** - For add/remove/save buttons:
- Handles click detection, hover effects, enabled state
- Use `onClick` callback for actions
- Use `setEnabled(false)` to disable remove buttons when no lines

**Slider class** - For default scroll speed:
- Handles drag interaction, value constraints
- Use `onChange` callback to update `defaultScrollSpeed`
- Position slider in default controls section

**ScrollableContentArea pattern** - Reference for viewport clipping:
- DialogueCreationPanel needs CUSTOM scroll implementation (not item-based)
- Use same `drawingContext.clip()` technique
- Implement own scrollbar (track + draggable thumb)

### Future Enhancements (Post-Phase 3)
- **Character naming**: Text input for "Character 1" → "Bob" (requires TextInput component)
- **Line reordering**: Drag-and-drop to change sequence (requires DragController)
- **Delete individual line**: [X] button per line (not just remove last)
- **Import/Export JSON**: Load existing dialogues from file
- **Preview mode**: Animate dialogue playback with actual effects

---

## Progress Tracking

**Current Phase**: 2 - EventEditorPanel Integration  
**Status**: ✅ Phase 1 complete (66 tests passing)  
**Next Step**: Add DialogueCreationPanel script to index.html

**Time Log**:
- Phase 1: ✅ COMPLETE - 66 tests passing (~3.5 hours)
- Phase 2: Not started (estimated 1-1.5 hours)
- Phase 3: Not started (estimated 1.5-2 hours)
- **Total**: 3.5/5-7 hours

---

## Related Documentation

### APIs & References
- [EventManager API](../../api/EventManager_API_Reference.md) - Event system integration
- [EventPropertyWindow](../../api/EventPropertyWindow_API.md) - Similar UI panel pattern
- [Button API](../../Classes/systems/Button.js) - Reusable button component
- [Slider API](../../Classes/ui/components/Slider.js) - Reusable slider component
- [ScrollableContentArea](../../Classes/ui/ScrollableContentArea.js) - Scrollable viewport pattern reference
- [CategoryRadioButtons](../../Classes/ui/CategoryRadioButtons.js) - Radio button pattern reference

### Guides & Standards
- [Level Editor Roadmap](../roadmaps/LEVEL_EDITOR_ROADMAP.md) - Phase 3 Random Events
- [Testing Methodology](../../standards/testing/TESTING_METHODOLOGY_STANDARDS.md) - TDD workflow
- [E2E Testing Quickstart](../../guides/E2E_TESTING_QUICKSTART.md) - Puppeteer patterns
- [BDD Language Style Guide](../../standards/testing/BDD_LANGUAGE_STYLE_GUIDE.md) - Test language standards

### Mockup Reference
- `dialog_creation_mockup.html` - Interactive HTML mockup (finalized design)
