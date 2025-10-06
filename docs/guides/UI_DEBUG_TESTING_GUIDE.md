# 🎯 UI Debug System - Quick Testing Guide

## How to Test the Drag-and-Drop UI System

### Step 1: Launch the Game
1. Open `index.html` in your browser (double-click or serve locally)
2. Wait for the game to fully load

### Step 2: Activate Debug Mode
**Press the `~` (tilde) key or `` ` `` (backtick) key**

You should see:
- Console message: "UIDebugManager: Debug mode ENABLED"
- Yellow drag handles appear on UI elements
- Red bounding boxes around registered UI elements

### Step 3: Find Draggable Elements
Look for these UI elements that should now be draggable:

1. **Spawn Controls** (if visible)
   - +1, +5, +10, -1, -5, -10 ant buttons
   - Usually appears in development mode

2. **Dropoff Button** 
   - "Place Dropoff" button 
   - Should be visible by default

3. **Menu Debug Panel**
   - Debug controls panel
   - May need to be activated first

4. **Spawn/Kill UI** (if visible)
   - Simple spawn/delete buttons
   - Development tools

### Step 4: Drag UI Elements
1. Look for **yellow handles** on the right edge of UI elements
2. **Click and hold** the yellow handle
3. **Drag** to move the element to a new position
4. **Release** to drop in the new location

### Step 5: Verify Position Persistence
1. Move some UI elements to new positions
2. **Refresh the page** (F5)
3. Press `~` to activate debug mode again
4. Elements should return to their **saved positions**

## Troubleshooting

### If You Don't See Any Drag Handles:
1. **Check Console** - Press F12 and look for error messages
2. **Verify Debug Mode** - Make sure you pressed `~` or `` ` ``
3. **Look for Status** - Should see "Debug mode ENABLED" in console
4. **Check Elements** - Some UI elements might need to be created first

### If Dragging Doesn't Work:
1. **Click Exactly on the Yellow Handle** - Don't click the element itself
2. **Try Different Elements** - Some may not be registered yet
3. **Check Console** - Look for "Started dragging" messages

### Console Commands (F12 → Console tab):
```javascript
// Force enable debug mode
g_uiDebugManager.enable()

// See all registered elements
g_uiDebugManager.registeredElements

// Reset all positions to original
g_uiDebugManager.resetAllPositions()

// Check if debug manager exists
typeof g_uiDebugManager
```

## What You Should See When Working:

### Debug Mode ON:
- ✅ Yellow drag handles on UI elements
- ✅ Red bounding boxes around elements
- ✅ Console message: "Debug mode ENABLED"
- ✅ Elements move when dragging handles

### Debug Mode OFF:
- ❌ No visual debug overlays
- ❌ No drag handles visible
- ✅ UI elements still in their saved positions
- ✅ Normal game functionality

## Expected Behavior:
1. **Immediate Visual Feedback** - Handles appear instantly when debug mode is enabled
2. **Smooth Dragging** - Elements follow mouse cursor smoothly
3. **Boundary Constraints** - Elements can't be dragged off-screen
4. **Position Memory** - Positions save automatically and persist across sessions
5. **No Game Disruption** - Game functionality remains normal when debug mode is off

## If Nothing Works:
The most likely issue is that UI elements haven't been created yet. Try:
1. **Open the development console** (press ` key in game)
2. **Create some UI elements** (spawn buttons, etc.)
3. **Then activate UI debug mode** with `~`

Let me know what happens when you try these steps!