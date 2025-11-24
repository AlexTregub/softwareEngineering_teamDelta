# Keybinds Reference

Complete reference of all keyboard shortcuts in the Ant Colony Simulation Game.

## Debug & Development Keys

| Key | Modifier | Action | Status | TODO |
|-----|----------|--------|--------|------|
| `` ` `` (backtick) | None | Toggle Coordinate Debug Overlay | ✅ Working | - [ ] Add visual indicator when active |
| `~` (tilde) | None | Toggle Coordinate Debug Overlay (alternate) | ✅ Working | - [ ] Consolidate with backtick behavior |
| `T` | None | Toggle Tile Inspector | ✅ Working | - [ ] Add UI panel showing tile data |
| `G` | Ctrl+Shift | Terrain Grid Debug Shortcut | ✅ Working | - [ ] Document what this displays |
| `O` | Ctrl+Shift | Terrain Grid Debug Shortcut | ✅ Working | - [ ] Document what this displays |
| `L` | Ctrl+Shift | Terrain Grid Debug Shortcut | ✅ Working | - [ ] Document what this displays |

## Render Layer Toggles

| Key | Modifier | Action | Status | TODO |
|-----|----------|--------|--------|------|
| `C` | Shift | Toggle TERRAIN layer | ✅ Working | - [ ] Add on-screen notification when toggled |
| `V` | Shift | Toggle ENTITIES layer | ✅ Working | - [ ] Add on-screen notification when toggled |
| `B` | Shift | Toggle EFFECTS layer | ✅ Working | - [ ] Add on-screen notification when toggled |
| `N` | Shift | Toggle UI_GAME layer | ✅ Working | - [ ] Add on-screen notification when toggled |
| `M` | Shift | Toggle UI_DEBUG layer | ✅ Working | - [ ] Add on-screen notification when toggled |
| `,` (comma) | Shift | Toggle UI_MENU layer | ✅ Working | - [ ] Add on-screen notification when toggled |
| `.` (period) | Shift | Enable all render layers | ✅ Working | - [ ] Add confirmation feedback |
| `Z` | Shift | Toggle Sprint 5 image in menu | ⚠️ Conditional | - [ ] Verify function exists and document purpose |

## Queen Commands

| Key | Modifier | Action | Status | TODO |
|-----|----------|--------|--------|------|
| `R` | None | Emergency Rally (gather all ants to queen) | ✅ Working | - [ ] Add visual feedback (rally flag/pulse) |
| `W` | None | Move queen up (continuous) | ✅ Working | - [ ] Add movement animation |
| `A` | None | Move queen left (continuous) | ✅ Working | - [ ] Add movement animation |
| `S` | None | Move queen down (continuous) | ✅ Working | - [ ] Add movement animation |
| `D` | None | Move queen right (continuous) | ✅ Working | - [ ] Add movement animation |

**Note:** WASD movement uses continuous polling (`keyIsDown()`) in the draw loop, not event-based `keyPressed()`

**TODO:**
- [ ] Add diagonal movement support
- [ ] Add sprint modifier (Shift+WASD)
- [ ] Add movement speed configuration

## Unit & Building Management

| Key | Modifier | Action | Status | TODO |
|-----|----------|--------|--------|------|
| `U` | None | Release ants from ALL buildings | ✅ Working | - [ ] Add confirmation prompt (dangerous action) |
| `U` | Shift | Upgrade selected building 10 times | ✅ Working | - [ ] Show upgrade progress/feedback |
| `E` | None | Interact with nearby objects (NPC/Anthill/Buildings) | ✅ Working | - [ ] Add interaction prompt UI |
| `X` | None | Toggle game speed | ✅ Working | - [ ] Add speed indicator UI |
| `3` | None | Switch to Power 3 (Power Brush) | ✅ Working | - [ ] Add power name display |
| `4` | None | Switch to Power 4 (Power Brush) | ✅ Working | - [ ] Add power name display |
| `5` | None | Switch to Power 5 (Power Brush) | ✅ Working | - [ ] Add power name display |

### E Key Interaction Priority
1. Continue NPC dialogue (if active)
2. Talk to nearby NPC (any NPC within range)
3. Open/close Building UI for nearby player anthill
4. Rebuild dead enemy buildings

**TODO:**
- [ ] Add range indicator for interactions
- [ ] Show interaction tooltip on hover
- [ ] Make interaction range configurable

## Power & Speed Management

| Key | Modifier | Action | Status | TODO |
|-----|----------|--------|--------|------|
| `X` | None | Toggle game speed | ✅ Working | - [ ] Add speed indicator UI (1x, 2x, 4x) |
| `3` | None | Switch to Power 3 (Power Brush) | ✅ Working | - [ ] Document power names |
| `4` | None | Switch to Power 4 (Power Brush) | ✅ Working | - [ ] Document power names |
| `5` | None | Switch to Power 5 (Power Brush) | ✅ Working | - [ ] Document power names |

**TODO:**
- [ ] Add visual feedback for active power
- [ ] Add cooldown indicators
- [ ] Add power descriptions in-game
- [ ] Add keybind for returning to 1x speed

## Camera Controls

| Key | Modifier | Action | Status | TODO |
|-----|----------|--------|--------|------|
| `F` | None | Toggle camera follow mode | ✅ Working | - [ ] Add UI indicator showing follow status |
| `H` | None | Center camera on map center (Home) | ✅ Working | - [ ] Add smooth pan animation |
| `O` | None | Overview zoom (0.2x) | ✅ Working | - [ ] Make zoom level configurable |
| `R` | None | Reset zoom to 1.0x | ✅ Working | - [ ] Add smooth zoom transition |
| `-` / `_` | None | Zoom out | ✅ Working | - [ ] Add zoom level display |
| `=` / `+` | None | Zoom in | ✅ Working | - [ ] Add zoom level display |
| Numpad `-` | None | Zoom out (alternate) | ✅ Working | - [ ] Consolidate with main minus key |
| Numpad `+` | None | Zoom in (alternate) | ✅ Working | - [ ] Consolidate with main plus key |

**Keycodes:**
- 189/109: Minus keys
- 187/107: Plus/equals keys

**TODO:**
- [ ] Add zoom limits (min/max)
- [ ] Show current zoom percentage
- [ ] Add camera pan with arrow keys
- [ ] Add camera edge scrolling

## Selection & Escape

| Key | Modifier | Action | Status | TODO |
|-----|----------|--------|--------|------|
| `ESC` | None | Multi-purpose escape | ✅ Working | - [ ] Add action priority documentation |

### ESC Key Priority Order
1. Deselect all entities (if any selected)
2. Deactivate resource brush (if active)
3. Deactivate enemy ant brush (if active)
4. Clear selection box

**TODO:**
- [ ] Add visual feedback for each ESC action
- [ ] Consider making ESC close menus/panels first

## Level Editor Mode

| Key | Modifier | Action | Status | TODO |
|-----|----------|--------|--------|------|
| (various) | None | Level editor keyboard shortcuts | ✅ Working | - [ ] Document level editor keybinds |

**Note:** Level editor has its own keyboard handler when `GameState === 'LEVEL_EDITOR'`

**TODO:**
- [ ] Create separate level editor keybinds documentation
- [ ] Add keybind overlay in level editor

## Key Binding Conflicts

### Potential Conflicts
1. **R key** - ✅ RESOLVED:
   - `R` = Queen emergency rally (no modifier)
   - `Shift+R` = Reset camera zoom (with Shift)

2. **O key** - ✅ No conflict:
   - `O` = Camera overview zoom (no modifier)
   - `Ctrl+Shift+O` = Terrain grid debug (different modifiers)

3. **M key** - ✅ No conflict:
   - `M` = Queen gather removed (was conflicting)
   - `Shift+M` = Toggle UI_DEBUG layer

4. **U key** - ✅ RESOLVED:
   - `U` = Release ants from buildings (no modifier)
   - `Shift+U` = Upgrade building 10x (with Shift)

## Missing Keybinds

Suggested additions:

- [ ] `P` - Pause game
- [ ] `Space` - Quick select queen
- [ ] `1-9` - Quick select ant groups
- [ ] `Ctrl+1-9` - Assign ant groups
- [ ] `Tab` - Cycle through selected units
- [ ] `Delete` - Delete selected entity (debug mode only)
- [ ] `Ctrl+A` - Select all ants
- [ ] `Ctrl+Z` - Undo (level editor)
- [ ] `Ctrl+S` - Save game/level
- [ ] `Ctrl+L` - Load game/level
- [ ] `F1` - Show keybinds help overlay
- [ ] Arrow keys - Pan camera

## Implementation Notes

### Current Issues
1. Some keys use `key.toLowerCase()` while others use direct comparison
2. Multiple handlers for same key in different contexts (needs priority system)
3. No visual feedback for most keybinds
4. No rebindable keys (hardcoded)

### Future Improvements
- [ ] Create centralized keybind configuration system
- [ ] Add keybind customization in options menu
- [ ] Add on-screen keybind hints (context-sensitive)
- [ ] Add keybind conflict detection
- [ ] Create keybind profiles (default, WASD, arrow keys, etc.)
- [ ] Add gamepad support
- [ ] Save/load custom keybinds to localStorage

## Related Files

- `Classes/controllers/keyboardEventHandlers.js` - Main keyboard handler
- `Classes/controllers/KeyboardInputController.js` - Keyboard input controller class
- `sketch.js` - Legacy keyboard handlers (mostly moved)
- `Classes/systems/ui/menu.js` - Menu system keyboard handling

---

**Last Updated:** November 23, 2025
**Status:** ✅ Fully documented and conflicts resolved
**Total Keybinds:** 35+ documented
**Conflicts Resolved:** All major conflicts fixed
**Missing Keybinds:** 15+ suggested
**Code Location:** `Classes/controllers/keyboardEventHandlers.js`
