# Bug Fix: Draggable Panel Growth Prevention

## Issue Description
Draggable panels were growing incrementally over time, creating a visible darker section at the bottom that expanded with each game session. The panels would gradually become taller, even without user interaction.

## Root Cause
The bug was caused by a **feedback loop** in the auto-resize mechanism:

1. `autoResizeToFitContent()` was called every 100ms in the `update()` method
2. The method calculated the required height based on button content
3. **The method then saved the new height to localStorage** via `saveState()`
4. On next game load, the slightly different saved height was restored
5. Small rounding variations in height calculations would accumulate
6. The 5px threshold check would occasionally trigger from floating-point rounding
7. This created incremental growth over multiple game sessions

### Code Location
**File**: `Classes/systems/ui/DraggablePanel.js`
**Method**: `autoResizeToFitContent()` (Lines 969-996)
**Problem Line**: Line 991 - `this.saveState()` 

## Solution Implemented

### Fix #1: Remove saveState from Auto-Resize
**Approach**: Removed the `saveState()` call from `autoResizeToFitContent()` method.

**Rationale**:
- Auto-resize operations are **transient calculations** that happen every frame
- Only **user-initiated changes** (like manual dragging) should persist to localStorage
- Saving transient calculations creates a feedback loop with rounding variations
- Manual drag operations still correctly save via `handleDragging()` method

### Code Changes
```javascript
// BEFORE (Lines 969-996)
autoResizeToFitContent() {
  // ... calculate height ...
  
  if (Math.abs(requiredHeight - this.config.size.height) > 5) {
    this.config.size.height = requiredHeight;
    this.updateButtonPositions();
    this.saveState(); // ❌ PROBLEM: Saves transient calculation
  }
}

// AFTER (Lines 969-996)
autoResizeToFitContent() {
  // ... calculate height ...
  
  if (Math.abs(requiredHeight - this.config.size.height) > 5) {
    this.config.size.height = requiredHeight;
    this.updateButtonPositions();
    
    // DON'T save auto-resize changes to localStorage
    // Auto-resize happens every frame and can cause incremental growth due to rounding
    // Only save position changes from manual dragging (see handleDragging method)
    // this.saveState(); // ✅ REMOVED
  }
}
```

### Preserved Functionality
- ✅ Panels still auto-resize to fit content on creation
- ✅ Panels still auto-resize when buttons are added/removed
- ✅ Manual drag operations still save position correctly
- ✅ Panel position persists across game sessions
- ✅ All other panel functionality remains unchanged

## Testing

### Unit Tests
**File**: `test/unit/ui/DraggablePanel.test.js`

Created comprehensive unit tests covering:
- Auto-resize does **NOT** call `saveState()`
- Manual drag **DOES** call `saveState()` 
- Panel height remains stable over 100 and 1000 update cycles
- No rounding error accumulation
- Threshold behavior (5px minimum for resize)
- localStorage interaction verification

**Results**: All unit tests passing ✅

### Integration Tests
**File**: `test/integration/ui/draggablePanel.growth.integration.test.js`

Created integration tests simulating:
- 5000 update cycles (realistic 83-second game session at 60fps)
- 100 load/save cycles (multiple game sessions)
- 50 panel creation/destruction cycles (page refreshes)
- Varying button content over 1000 cycles
- Floating-point rounding stability over 2000 cycles
- Manual drag vs auto-resize behavior

**Results**: 6/6 integration tests passing ✅

### Test Coverage
```
Auto-resize behavior:
✅ Does NOT call saveState() when auto-resizing
✅ Updates panel height without localStorage writes
✅ Only saves during manual drag operations

Panel growth prevention:
✅ Maintains stable height over 5000 update cycles
✅ Does NOT accumulate height from rounding errors
✅ Does NOT grow during load/save/resize cycles

State persistence:
✅ Loads persisted position from localStorage
✅ Saves position when dragging ends
✅ Does NOT save size changes from auto-resize

Manual drag vs auto-resize:
✅ Saves position during manual drag
✅ Does NOT save during auto-resize cycles
```

## Verification Steps

### In-Browser Testing
1. **Before Fix**: Panels would grow ~1-2px per game session
2. **After Fix**: Panels maintain consistent height across sessions

### Performance Impact
- **No negative impact**: Removed unnecessary localStorage writes
- **Improved**: Fewer disk writes = better performance
- **Same UX**: Auto-resize still works visually identical

### Browser Console Check
```javascript
// Monitor panel height over time
const panel = draggablePanelManager.panels.get('some-panel-id');
console.log('Initial height:', panel.config.size.height);

// After 1000 frames...
console.log('Final height:', panel.config.size.height);
// Should be the same value ✅
```

## Related Files Modified

1. **Source Code**
   - `Classes/systems/ui/DraggablePanel.js` (Lines 969-996)

2. **Tests**
   - `test/unit/ui/DraggablePanel.test.js` (280 lines, comprehensive unit tests)
   - `test/integration/ui/draggablePanel.growth.integration.test.js` (350 lines, 6 integration tests)

3. **Documentation**
   - `docs/BUG_FIX_PANEL_GROWTH.md` (this file)

## Future Considerations

### Alternative Approaches Considered
1. ✅ **Remove saveState from auto-resize** (Implemented)
   - Simplest solution
   - Addresses root cause directly
   - No side effects

2. ❌ **Save only on significant change** (Not chosen)
   - More complex
   - Still risks accumulation over time

3. ❌ **Debounce saveState calls** (Not chosen)
   - Doesn't prevent the feedback loop
   - Adds complexity

4. ❌ **Round heights to integers** (Not chosen)
   - Limits flexibility
   - Doesn't address root cause

### Maintenance Notes
- Auto-resize is called from `update()` method (Line 265)
- Manual drag saves via `handleDragging()` method (Line 355)
- Threshold for resize trigger is 5px (Line 983)
- Panel state includes: position, size, visible, minimized

## Success Metrics
- ✅ No panel growth over extended play sessions
- ✅ Manual drag operations still save correctly
- ✅ Auto-resize still functions visually
- ✅ No localStorage pollution from transient calculations
- ✅ All existing tests continue to pass
- ✅ New tests prevent regression

## Conclusion
This fix successfully eliminates the panel growth bug by removing the feedback loop between auto-resize calculations and localStorage persistence. The solution is simple, targeted, and thoroughly tested with both unit and integration tests to prevent regression.
