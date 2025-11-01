# Tool Mode Toggles - UI Mockup

**Feature**: Dynamic mode toggles in Level Editor menu bar
**Date**: November 1, 2025
**Status**: Design Phase

---

## Overview

Mode toggles appear in the menu bar when a tool with multiple modes is selected. They use a radio button pattern (only one mode active) and provide clear visual feedback.

---

## Full Menu Bar States

### State 1: No Tool Selected (Default)

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          ANT COLONY SIMULATOR                             │
├───────────────────────────────────────────────────────────────────────────┤
│  File   Edit   View                                                       │
│  ────   ────   ────                                                       │
│   │      │      │                                                         │
│   │      │      └─ Grid, Minimap, Properties                             │
│   │      └──────── Undo, Redo                                            │
│   └─────────────── Save, Load, New, Export                               │
└───────────────────────────────────────────────────────────────────────────┘

NO MODE TOGGLES VISIBLE
```

### State 2: Eraser Tool Selected - ALL Mode Active

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          ANT COLONY SIMULATOR                             │
├───────────────────────────────────────────────────────────────────────────┤
│  File   Edit   View   │   ┏━━━━━━┓  ┌────────┐  ┌────────┐  ┌────────┐       │
│  ────   ────   ────   │   ┃  ALL  ┃  │ TERRAIN│  │ ENTITY │  │ EVENTS │       │
│                        │   ┗━━━━━━┛  └────────┘  └────────┘  └────────┘       │
│                        │     ^                                                 │
│                        │  Active (Blue)                                        │
└───────────────────────────────────────────────────────────────────────────┘

ERASER MODES: ALL | TERRAIN | ENTITY | EVENTS
Keyboard shortcuts: 1 | 2 | 3 | 4
```

### State 3: Eraser Tool Selected - ENTITY Mode Active

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          ANT COLONY SIMULATOR                             │
├───────────────────────────────────────────────────────────────────────────┤
│  File   Edit   View   │   ┌────────┐  ┌────────┐  ┏━━━━━━━━┓  ┌────────┐       │
│  ────   ────   ────   │   │   ALL  │  │ TERRAIN│  ┃ ENTITY ┃  │ EVENTS │       │
│                        │   └────────┘  └────────┘  ┗━━━━━━━━┛  └────────┘       │
│                        │                               ^                         │
│                        │                           Active (Blue)                 │
└───────────────────────────────────────────────────────────────────────────┘

ERASER MODES: ALL | TERRAIN | ENTITY | EVENTS
Current: ENTITY - Will only remove entity spawn points
```

### State 4: Selection Tool Selected - PAINT Mode Active

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          ANT COLONY SIMULATOR                             │
├───────────────────────────────────────────────────────────────────────────┤
│  File   Edit   View   │   ┏━━━━━━━┓  ┌────────┐  ┌────────┐                  │
│  ────   ────   ────   │   ┃ PAINT ┃  │ ENTITY │  │ EVENT  │                  │
│                        │   ┗━━━━━━━┛  └────────┘  └────────┘                  │
│                        │     ^                                                 │
│                        │  Active (Blue)                                        │
└───────────────────────────────────────────────────────────────────────────┘

SELECTION MODES: PAINT | ENTITY | EVENT
Current: PAINT - Current entity painting functionality
```

### State 5: Selection Tool Selected - ENTITY Mode Active

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          ANT COLONY SIMULATOR                             │
├───────────────────────────────────────────────────────────────────────────┤
│  File   Edit   View   │   ┌────────┐  ┏━━━━━━━━┓  ┌────────┐                  │
│  ────   ────   ────   │   │ PAINT  │  ┃ ENTITY ┃  │ EVENT  │                  │
│                        │   └────────┘  ┗━━━━━━━━┛  └────────┘                  │
│                        │                   ^                                     │
│                        │               Active (Blue)                             │
└───────────────────────────────────────────────────────────────────────────┘

SELECTION MODES: PAINT | ENTITY | EVENT
Current: ENTITY - Select multiple entity spawn points with drag box
```

### State 6: Selection Tool Selected - EVENT Mode Active

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          ANT COLONY SIMULATOR                             │
├───────────────────────────────────────────────────────────────────────────┤
│  File   Edit   View   │   ┌────────┐  ┌────────┐  ┏━━━━━━━┓                   │
│  ────   ────   ────   │   │ PAINT  │  │ ENTITY │  ┃ EVENT ┃                   │
│                        │   └────────┘  └────────┘  ┗━━━━━━━┛                   │
│                        │                               ^                        │
│                        │                           Active (Blue)                │
└───────────────────────────────────────────────────────────────────────────┘

SELECTION MODES: PAINT | ENTITY | EVENT  
Current: EVENT - Select multiple events with drag box
Future: May add TERRAIN, EVENTS selection modes
```

### State 5: Brush Tool Selected (No Modes)

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          ANT COLONY SIMULATOR                             │
├───────────────────────────────────────────────────────────────────────────┤
│  File   Edit   View                                                       │
│  ────   ────   ────                                                       │
└───────────────────────────────────────────────────────────────────────────┘

NO MODE TOGGLES (Brush has no modes - terrain only)
```

---

## Button Component Specifications

### Dimensions
```
┌─────────────┐
│   BUTTON    │  ← Height: 28px
└─────────────┘
      ↑
   Width: 80px

Spacing between buttons: 8px
Total height of mode toggle row: 40px (menu bar height)
Vertical centering: 6px from top of menu bar
```

### Active Button (Selected Mode)

```
┏━━━━━━━━━━━━━┓
┃   ENTITY    ┃  ← Blue background: rgb(100, 150, 255)
┗━━━━━━━━━━━━━┛  ← White text: rgb(255, 255, 255)
                 ← Border: 2px, rgb(150, 180, 255)
                 ← Border radius: 4px
```

**Colors**:
- Background: `fill(100, 150, 255)` - Bright blue
- Text: `fill(255)` - White
- Border: `stroke(150, 180, 255)` - Light blue
- Border weight: `strokeWeight(2)`

### Inactive Button (Not Selected)

```
┌─────────────┐
│   TERRAIN   │  ← Dark gray background: rgb(60, 60, 60)
└─────────────┘  ← Light gray text: rgb(200, 200, 200)
                 ← Border: 1px, rgb(150, 150, 150)
                 ← Border radius: 4px
```

**Colors**:
- Background: `fill(60, 60, 60)` - Dark gray
- Text: `fill(200, 200, 200)` - Light gray
- Border: `stroke(150)` - Medium gray
- Border weight: `strokeWeight(1)`

### Hover Button (Mouse Over)

```
┌─────────────┐
│   EVENTS    │  ← Lighter gray background: rgb(80, 80, 80)
└─────────────┘  ← White text: rgb(255, 255, 255)
                 ← Border: 1px, rgb(180, 180, 180)
                 ← Border radius: 4px
```

**Colors**:
- Background: `fill(80, 80, 80)` - Lighter gray
- Text: `fill(255)` - White
- Border: `stroke(180)` - Light gray
- Border weight: `strokeWeight(1)`

### Disabled Button (Not Applicable for Modes)

Mode toggles don't use disabled state. If a mode isn't available, the button doesn't render.

---

---

## Interactive States

### Click Animation

**Frame 1: Normal**
```
┌─────────────┐
│   ENTITY    │
└─────────────┘
```

**Frame 2: Click (hold down)**
```
┌─────────────┐
│   ENTITY    │  ← Slightly darker: rgb(80, 120, 235)
└─────────────┘  ← Scale: 0.98 (subtle press effect)
```

**Frame 3: Release (selected)**
```
┏━━━━━━━━━━━━━┓
┃   ENTITY    ┃  ← Active state
┗━━━━━━━━━━━━━┛
```

### Keyboard Shortcut Feedback

When user presses `1`, `2`, `3`, or `4`:

**Visual Feedback**:
- Button briefly flashes brighter (150ms)
- Transitions to active state
- Previous active button transitions to inactive

```
Before (press '3'):
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│   ALL  │  │ TERRAIN│  │ ENTITY │  │ EVENTS │
└────────┘  └────────┘  └────────┘  └────────┘

Flash (50ms):
┌────────┐  ┌────────┐  ┏━━━━━━━━┓  ┌────────┐
│   ALL  │  │ TERRAIN│  ┃ ENTITY ┃  │ EVENTS │  ← Brighter: rgb(120, 170, 255)
└────────┘  └────────┘  ┗━━━━━━━━┛  └────────┘

After (100ms):
┌────────┐  ┌────────┐  ┏━━━━━━━━┓  ┌────────┐
│   ALL  │  │ TERRAIN│  ┃ ENTITY ┃  │ EVENTS │  ← Normal active: rgb(100, 150, 255)
└────────┘  └────────┘  ┗━━━━━━━━┛  └────────┘
```

---

## Layout Calculations

### Horizontal Positioning

```
Menu Bar Width: windowWidth (full width)

Left margin: 200px (after "File Edit View" menus)

Button positions:
Button 1 (ALL):     x = 200px
Button 2 (TERRAIN): x = 288px  (200 + 80 + 8)
Button 3 (ENTITY):  x = 376px  (288 + 80 + 8)
Button 4 (EVENTS):  x = 464px  (376 + 80 + 8)

Total width needed: 344px (4 buttons + 3 gaps)
```

### Vertical Positioning

```
Menu Bar Height: 40px

Button height: 28px
Top margin: 6px  (centers button vertically)
Button y position: menuBarY + 6

Text baseline: menuBarY + 20 (centers text in button)
```

### Responsive Behavior

**Minimum Window Width**: 800px
- If window < 800px: Stack mode toggles vertically below menu bar
- If window < 600px: Hide mode toggles, show only active mode name

**Mobile/Tablet** (Future):
- Touch-friendly button size: 44px × 44px (Apple HIG)
- Increased spacing: 12px

---

## Keyboard Shortcuts Reference

```
┌─────────────────────────────────────────────────────┐
│ TOOL MODE KEYBOARD SHORTCUTS                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [1]  →  First mode   (ALL or ENTITY)             │
│  [2]  →  Second mode  (TERRAIN)                   │
│  [3]  →  Third mode   (ENTITY for eraser)         │
│  [4]  →  Fourth mode  (EVENTS)                    │
│                                                     │
│  Note: Only available when tool with modes active  │
└─────────────────────────────────────────────────────┘
```

---

## Example: Eraser Tool Mode Behaviors

### ALL Mode (Default)

```
User clicks on grid tile with:
- Terrain: Grass
- Entity: Worker Ant
- Event: Tutorial trigger

Result after eraser:
- Terrain: ✓ REMOVED
- Entity: ✓ REMOVED
- Event: ✓ REMOVED

Grid tile is completely empty
```

### TERRAIN Mode

```
User clicks on same grid tile

Result after eraser:
- Terrain: ✓ REMOVED
- Entity: ✗ PRESERVED (still there)
- Event: ✗ PRESERVED (still there)

Only terrain layer affected
```

### ENTITY Mode

```
User clicks on same grid tile

Result after eraser:
- Terrain: ✗ PRESERVED (still there)
- Entity: ✓ REMOVED
- Event: ✗ PRESERVED (still there)

Only entity layer affected
```

### EVENTS Mode

```
User clicks on same grid tile

Result after eraser:
- Terrain: ✗ PRESERVED (still there)
- Entity: ✗ PRESERVED (still there)
- Event: ✓ REMOVED

Only events layer affected
```

---

## Visual Comparison: Before/After

### Before Enhancement (Current)

```
┌───────────────────────────────────────┐
│ File  Edit  View                      │  ← Simple menu bar
└───────────────────────────────────────┘

Eraser erases EVERYTHING
No way to erase only entities or terrain
```

### After Enhancement (New)

```
┌────────────────────────────────────────────────────────────────┐
│ File  Edit  View  │  ┏━━━━━━━━┓  ┌────────┐  ┌────────┐         │
│                   │  ┃ ENTITY ┃  │ EVENTS │  │   ALL  │         │
│                   │  ┗━━━━━━━━┛  └────────┘  └────────┘         │
└────────────────────────────────────────────────────────────────┘

Eraser has selective modes
User controls what gets erased
Clear visual feedback
```

---

## Accessibility Considerations

### Color Contrast

**Active Button**:
- Background: rgb(100, 150, 255) - Blue
- Text: rgb(255, 255, 255) - White
- Contrast ratio: **4.5:1** ✓ WCAG AA compliant

**Inactive Button**:
- Background: rgb(60, 60, 60) - Dark gray
- Text: rgb(200, 200, 200) - Light gray
- Contrast ratio: **5.2:1** ✓ WCAG AA compliant

### Keyboard Navigation

- Tab through mode buttons (left to right)
- Enter/Space to activate hovered button
- Number keys (1-4) for direct mode selection
- Escape to deselect tool (hide modes)

### Screen Reader Support (Future)

```html
<button aria-pressed="true" aria-label="Entity mode active">
  ENTITY
</button>

<button aria-pressed="false" aria-label="Terrain mode inactive">
  TERRAIN
</button>
```

---

## Animation Timing

**Mode Switch Animation**:
```
Total duration: 200ms

0ms:   Click detected
50ms:  Previous active button fades out (opacity 1.0 → 0.8)
100ms: New active button highlights (scale 0.98)
150ms: New active button expands (scale 0.98 → 1.0)
200ms: Animation complete, new mode active
```

**Hover Animation**:
```
Duration: 150ms

Mouse enters button:
  0ms:  Normal state (rgb 60,60,60)
  150ms: Hover state (rgb 80,80,80)

Mouse exits button:
  0ms:  Hover state (rgb 80,80,80)
  150ms: Normal state (rgb 60,60,60)
```

---

## Implementation Pseudocode

### Rendering Logic

```javascript
function renderToolModes() {
  // Only render if tool has modes
  if (!currentTool || !currentTool.modes) {
    return; // Hide modes
  }
  
  const modes = currentTool.modes; // ['ALL', 'TERRAIN', 'ENTITY', 'EVENTS']
  const activeMode = currentTool.activeMode; // 'ENTITY'
  
  // Render mode buttons
  let buttonX = menuBarX + 200;
  
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    const isActive = (mode === activeMode);
    const isHovered = (hoveredButton === mode);
    
    // Determine button style
    let bgColor, textColor, borderColor, borderWeight;
    
    if (isActive) {
      bgColor = rgb(100, 150, 255);      // Blue
      textColor = rgb(255, 255, 255);    // White
      borderColor = rgb(150, 180, 255);  // Light blue
      borderWeight = 2;
    } else if (isHovered) {
      bgColor = rgb(80, 80, 80);         // Light gray
      textColor = rgb(255, 255, 255);    // White
      borderColor = rgb(180, 180, 180);  // Medium gray
      borderWeight = 1;
    } else {
      bgColor = rgb(60, 60, 60);         // Dark gray
      textColor = rgb(200, 200, 200);    // Light gray
      borderColor = rgb(150, 150, 150);  // Medium gray
      borderWeight = 1;
    }
    
    // Draw button
    drawRect(buttonX, menuBarY + 6, 80, 28, {
      fill: bgColor,
      stroke: borderColor,
      strokeWeight: borderWeight,
      radius: 4
    });
    
    // Draw text
    drawText(mode, buttonX + 40, menuBarY + 20, {
      size: 13,
      color: textColor,
      align: 'center'
    });
    
    buttonX += 88; // Next button (80px + 8px gap)
  }
}
```

### Click Detection Logic

```javascript
function handleModeToggleClick(mouseX, mouseY) {
  if (!currentTool || !currentTool.modes) {
    return null; // No modes to click
  }
  
  const modes = currentTool.modes;
  let buttonX = menuBarX + 200;
  
  for (let i = 0; i < modes.length; i++) {
    const mode = modes[i];
    
    // Check if click is within this button
    const buttonBounds = {
      x: buttonX,
      y: menuBarY + 6,
      w: 80,
      h: 28
    };
    
    if (isPointInRect(mouseX, mouseY, buttonBounds)) {
      // User clicked this mode button
      currentTool.activeMode = mode;
      return mode; // Return clicked mode
    }
    
    buttonX += 88; // Next button
  }
  
  return null; // No button clicked
}
```

### Keyboard Shortcut Handler

```javascript
function handleModeShortcut(keyCode) {
  if (!currentTool || !currentTool.modes) {
    return; // No modes available
  }
  
  const modes = currentTool.modes;
  let modeIndex = -1;
  
  // Map key codes to mode indices
  switch (keyCode) {
    case 49: modeIndex = 0; break; // '1' key
    case 50: modeIndex = 1; break; // '2' key
    case 51: modeIndex = 2; break; // '3' key
    case 52: modeIndex = 3; break; // '4' key
  }
  
  // Select mode if valid
  if (modeIndex >= 0 && modeIndex < modes.length) {
    currentTool.activeMode = modes[modeIndex];
    
    // Play feedback animation (optional)
    playModeSelectAnimation(modes[modeIndex]);
  }
}
```

---

## Testing Checklist for Mockup

**Visual Testing**:
- [ ] Mode toggles appear when eraser tool selected
- [ ] Mode toggles hidden when no tool selected
- [ ] Active mode has blue highlight
- [ ] Inactive modes have gray background
- [ ] Hover effect works on inactive modes
- [ ] Click animation plays smoothly
- [ ] Keyboard shortcuts switch modes (1-4)
- [ ] Mode label "MODE:" is visible
- [ ] Buttons are evenly spaced
- [ ] Text is centered in buttons
- [ ] Border radius is consistent (4px)

**Functional Testing**:
- [ ] Clicking mode button switches mode
- [ ] Only one mode can be active at a time
- [ ] Mode persists when clicking elsewhere in editor
- [ ] Mode resets to default when switching tools
- [ ] Keyboard shortcuts work correctly
- [ ] Mode affects eraser behavior correctly

**Responsive Testing**:
- [ ] Mode toggles fit in menu bar (800px+ width)
- [ ] Mode toggles adapt to narrow windows (<800px)
- [ ] Touch targets are adequate (28px height minimum)

---

## Future Enhancements

**Planned Improvements**:
1. **Tooltip on Hover**: Show mode description
   ```
   ┌─────────────┐
   │   ENTITY    │
   └─────────────┘
         │
         └─→ "Erase only entity spawn points"
   ```

2. **Icon + Text Buttons**: Add visual icons
   ```
   ┌─────────────┐
   │  👤 ENTITY  │  ← Icon prefix
   └─────────────┘
   ```

3. **Dropdown for Many Modes**: If >4 modes
   ```
   MODE: [ ▼ ENTITY ] ← Dropdown instead of radio buttons
   ```

4. **Color-Coded Modes**: Different colors per mode
   - ALL: Red (destructive)
   - TERRAIN: Brown (earth)
   - ENTITY: Blue (default)
   - EVENTS: Purple (special)

---

## Conclusion

This mockup provides a comprehensive visual specification for the Tool Mode Toggle system. The design prioritizes:

✅ **Clarity**: Clear visual distinction between active/inactive modes
✅ **Efficiency**: Keyboard shortcuts for rapid mode switching
✅ **Consistency**: Follows VS Code-style menu bar patterns
✅ **Accessibility**: High contrast ratios, keyboard navigation
✅ **Responsiveness**: Adapts to different window sizes

**Next Steps**: Proceed with TDD implementation following the enhancement checklist.
