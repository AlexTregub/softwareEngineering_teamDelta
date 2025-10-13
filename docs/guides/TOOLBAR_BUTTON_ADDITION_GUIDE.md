# 🔧 Toolbar Button Addition Guide

## Overview
Adding a new button to the game toolbar using the custom Button.js system is a **4-step process** with **moderate complexity**. The toolbar is managed by the `UILayerRenderer` class and uses your centralized `Button.js` system for consistency.

## Complexity Assessment
- **Steps Required:** 4 main steps
- **Complexity Level:** ⭐⭐⭐ (Moderate)
- **Time Estimate:** 15-30 minutes for experienced developers
- **Files to Modify:** 1-2 files typically

## System Architecture Overview

```mermaid
graph TB
    A[sketch.js] -->|calls| B[RenderLayerManager]
    B -->|renders UI_GAME layer| C[UILayerRenderer]
    C -->|renderToolbar()| D[Toolbar Buttons]
    
    D --> E[Button.js Class]
    E --> F[ButtonStyles.TOOLBAR]
    E --> G[Button Instances]
    
    G --> H[update() - Mouse Input]
    G --> I[render() - Visual Display]
    G --> J[onClick() - Action Handler]
    
    style D fill:#e1f5fe
    style E fill:#f3e5f5
    style F fill:#fff3e0
```

## Current Toolbar Implementation

### Location
- **File:** `Classes/rendering/UILayerRenderer.js`
- **Method:** `renderToolbar()`
- **Lines:** ~176-225

### Current Button Configuration
```javascript
const labels = ['Build', 'Gather', 'Attack', 'Defend'];
```

### Button Creation Logic
```javascript
// Automatically creates Button instances from labels array
if (!this.hudElements.toolbar.buttons || this.hudElements.toolbar.buttons.length !== labels.length) {
  this.hudElements.toolbar.buttons = [];
  for (let i = 0; i < labels.length; i++) {
    const bx = startX + i * (buttonWidth + buttonSpacing);
    const btn = new Button(bx, startY, buttonWidth, buttonHeight, labels[i], {
      ...ButtonStyles.TOOLBAR,
      onClick: (b) => { this.hudElements.toolbar.activeButton = i; }
    });
    this.hudElements.toolbar.buttons.push(btn);
  }
}
```

## 📋 Step-by-Step Process

### Step 1: Modify the Labels Array
**File:** `Classes/rendering/UILayerRenderer.js`  
**Method:** `renderToolbar()`  
**Action:** Add your new button to the labels array

```javascript
// BEFORE
const labels = ['Build', 'Gather', 'Attack', 'Defend'];

// AFTER
const labels = ['Build', 'Gather', 'Attack', 'Defend', 'Scout'];
```

### Step 2: Implement Button Action Logic
**File:** `Classes/rendering/UILayerRenderer.js`  
**Method:** `renderToolbar()`  
**Action:** Enhance the onClick handler to support your new button

```javascript
// BEFORE
onClick: (b) => { this.hudElements.toolbar.activeButton = i; }

// AFTER
onClick: (b) => { 
  this.hudElements.toolbar.activeButton = i;
  this.handleToolbarAction(labels[i], i);
}
```

### Step 3: Add Action Handler Method
**File:** `Classes/rendering/UILayerRenderer.js`  
**Action:** Add a new method to handle toolbar actions

```javascript
/**
 * Handle toolbar button actions
 * @param {string} action - The button label/action name
 * @param {number} buttonIndex - Index of the clicked button
 */
handleToolbarAction(action, buttonIndex) {
  switch(action) {
    case 'Build':
      console.log('Build mode activated');
      // Implement build mode logic
      break;
    case 'Gather':
      console.log('Gather mode activated');
      // Implement gather mode logic
      break;
    case 'Attack':
      console.log('Attack mode activated');
      // Implement attack mode logic
      break;
    case 'Defend':
      console.log('Defend mode activated');
      // Implement defend mode logic
      break;
    case 'Scout':  // YOUR NEW BUTTON
      console.log('Scout mode activated');
      this.activateScoutMode();
      break;
    default:
      console.log(`Unknown toolbar action: ${action}`);
  }
}

/**
 * Activate scout mode functionality
 */
activateScoutMode() {
  // Implement your scout mode logic here
  console.log('🔍 Scout mode: Click on terrain to explore');
  
  // Example: Change cursor or UI state
  if (typeof GameState !== 'undefined') {
    GameState.setMode('SCOUT');
  }
  
  // Example: Show scout-specific UI elements
  this.showScoutUI();
}
```

### Step 4: Adjust Layout (Optional)
**File:** `Classes/rendering/UILayerRenderer.js`  
**Action:** Modify toolbar dimensions if needed

```javascript
// Current layout supports 4 buttons comfortably
const toolbarWidth = 300;  // May need to increase for more buttons
const buttonWidth = 50;
const buttonSpacing = 10;

// For 5 buttons, you might want:
const toolbarWidth = 350;  // Increased width
const buttonWidth = 45;    // Slightly smaller buttons
const buttonSpacing = 8;   // Tighter spacing
```

## 🎨 Styling and Visual Consistency

### Available Styles
Your system already has predefined toolbar styles:

```javascript
// In Classes/systems/Button.js
ButtonStyles.TOOLBAR = {
  backgroundColor: '#3C3C3C',
  hoverColor: '#5A5A5A', 
  textColor: '#FFFFFF',
  borderColor: '#222222',
  borderWidth: 1,
  cornerRadius: 3,
  fontSize: 12
};

ButtonStyles.TOOLBAR_ACTIVE = {
  backgroundColor: '#6496FF',
  hoverColor: '#5A88E6',
  textColor: '#FFFFFF',
  borderColor: '#4A78CC',
  borderWidth: 1,
  cornerRadius: 3,
  fontSize: 12
};
```

### Button State Management
The system automatically handles:
- ✅ **Hover Effects** - Color changes on mouse over
- ✅ **Active State** - Visual indication of selected button  
- ✅ **Click Detection** - Mouse press/release handling
- ✅ **Visual Scaling** - Smooth hover animations

## 🔧 Advanced Customization Options

### Custom Button Logic
If you need button-specific behavior:

```javascript
// In renderToolbar(), customize individual buttons
for (let i = 0; i < labels.length; i++) {
  const btn = this.hudElements.toolbar.buttons[i];
  
  // Custom logic for specific buttons
  if (labels[i] === 'Scout') {
    // Special scout button behavior
    if (this.isScoutModeAvailable()) {
      btn.setEnabled(true);
    } else {
      btn.setEnabled(false);
    }
  }
  
  // Standard rendering
  btn.update(mouseX, mouseY, mouseIsPressed);
  btn.render();
}
```

### Dynamic Button Labels
For changing button text based on state:

```javascript
// Update button caption dynamically
if (labels[i] === 'Scout') {
  const scoutCount = this.getActiveScouts();
  btn.setCaption(`Scout (${scoutCount})`);
}
```

### Conditional Button Visibility
To show/hide buttons based on game state:

```javascript
// In renderToolbar()
const availableButtons = this.getAvailableButtons();
const labels = availableButtons; // Only show available options

getAvailableButtons() {
  const baseButtons = ['Build', 'Gather'];
  
  // Add contextual buttons based on game state
  if (this.playerHasArmy()) {
    baseButtons.push('Attack', 'Defend');
  }
  
  if (this.playerHasScouts()) {
    baseButtons.push('Scout');
  }
  
  return baseButtons;
}
```

## 🚀 Integration with Existing Systems

### UI Debug Manager Integration
Your new button will automatically work with the UI debug system:

```javascript
// No additional code needed - the toolbar is already registered
// with the debug system and can be moved/positioned in debug mode
```

### Keyboard Shortcuts Integration
Add keyboard shortcuts for your new button:

```javascript
// In UIController.js or keyPressed() handler
if (key === 's' || key === 'S') {
  // Simulate Scout button click
  if (window.UIRenderer && window.UIRenderer.hudElements.toolbar.buttons[4]) {
    window.UIRenderer.handleToolbarAction('Scout', 4);
  }
}
```

### Game State Integration
Connect with your existing game state system:

```javascript
activateScoutMode() {
  // Update game state
  if (typeof GameState !== 'undefined') {
    GameState.setMode('SCOUT');
    GameState.setUIState('toolbar', 'scout');
  }
  
  // Update selection controller
  if (typeof g_selectionBoxController !== 'undefined') {
    g_selectionBoxController.setMode('scout');
  }
  
  // Show relevant UI elements
  this.showScoutInstructions();
}
```

## 📊 Complexity Breakdown

| Task | Complexity | Time Estimate |
|------|------------|---------------|
| **Add label to array** | ⭐ Easy | 1 minute |
| **Implement onClick logic** | ⭐⭐ Medium | 5-10 minutes |
| **Create action handler** | ⭐⭐⭐ Medium | 10-15 minutes |
| **Adjust layout (optional)** | ⭐⭐ Easy-Medium | 2-5 minutes |
| **Test and debug** | ⭐⭐ Medium | 5-10 minutes |

**Total Estimated Time:** 15-30 minutes

## 🎯 Example: Complete "Scout" Button Implementation

Here's a complete example of adding a Scout button:

```javascript
// File: Classes/rendering/UILayerRenderer.js
// Method: renderToolbar()

renderToolbar() {
  push();

  const toolbarWidth = 350; // Increased for 5 buttons
  const toolbarHeight = 60;
  const toolbarX = (width - toolbarWidth) / 2;
  const toolbarY = height - toolbarHeight - 10;

  // Background
  fill(...this.colors.hudBackground);
  noStroke();
  rect(toolbarX, toolbarY, toolbarWidth, toolbarHeight, 5);

  // Buttons layout
  const buttonWidth = 45; // Smaller for more buttons
  const buttonHeight = 40;
  const buttonSpacing = 8;
  const startX = toolbarX + 15;
  const startY = toolbarY + 10;

  // MODIFIED: Added Scout button
  const labels = ['Build', 'Gather', 'Attack', 'Defend', 'Scout'];

  // Initialize toolbar buttons array if needed
  if (!this.hudElements.toolbar.buttons || this.hudElements.toolbar.buttons.length !== labels.length) {
    this.hudElements.toolbar.buttons = [];
    for (let i = 0; i < labels.length; i++) {
      const bx = startX + i * (buttonWidth + buttonSpacing);
      const btn = new Button(bx, startY, buttonWidth, buttonHeight, labels[i], {
        ...ButtonStyles.TOOLBAR,
        // MODIFIED: Enhanced onClick handler
        onClick: (b) => { 
          this.hudElements.toolbar.activeButton = i;
          this.handleToolbarAction(labels[i], i);
        }
      });
      this.hudElements.toolbar.buttons.push(btn);
    }
  }

  // Render each button
  for (let i = 0; i < labels.length; i++) {
    const btn = this.hudElements.toolbar.buttons[i];

    // Update button input state from p5 globals
    btn.update(mouseX, mouseY, mouseIsPressed);

    // Reflect active state visually
    if (this.hudElements.toolbar.activeButton === i) {
      btn.setBackgroundColor(ButtonStyles.TOOLBAR_ACTIVE.backgroundColor);
    } else {
      btn.setBackgroundColor(ButtonStyles.TOOLBAR.backgroundColor);
    }

    btn.render();
  }

  pop();
}

// NEW: Action handler method
handleToolbarAction(action, buttonIndex) {
  console.log(`🎯 Toolbar Action: ${action} (index: ${buttonIndex})`);
  
  switch(action) {
    case 'Build':
      this.activateBuildMode();
      break;
    case 'Gather':
      this.activateGatherMode();
      break;
    case 'Attack':
      this.activateAttackMode();
      break;
    case 'Defend':
      this.activateDefendMode();
      break;
    case 'Scout':
      this.activateScoutMode();
      break;
    default:
      console.warn(`Unknown toolbar action: ${action}`);
  }
}

// NEW: Scout mode implementation
activateScoutMode() {
  console.log('🔍 Scout Mode Activated');
  
  // Update game state
  if (typeof GameState !== 'undefined') {
    GameState.setMode('SCOUT');
  }
  
  // Show scout cursor or UI feedback
  this.showScoutUI();
  
  // Enable scout-specific interactions
  this.enableScoutInteractions();
}

// NEW: Scout UI feedback
showScoutUI() {
  // Show scout instructions
  this.showTooltip('Click on unexplored areas to scout', width/2, height - 100);
  
  // Change cursor style (if supported)
  if (typeof cursor === 'function') {
    cursor('crosshair');
  }
}

// NEW: Scout interactions
enableScoutInteractions() {
  // This would integrate with your mouse handling system
  // Example: Set a flag that mouse clicks should create scout waypoints
  this.isScoutModeActive = true;
}
```

## 🛠️ Testing Your New Button

### Manual Testing Checklist
- [ ] Button appears in toolbar
- [ ] Button responds to mouse hover
- [ ] Button responds to mouse click  
- [ ] Active state visual feedback works
- [ ] Action handler is called correctly
- [ ] Console logs show expected messages
- [ ] Layout doesn't break with additional button
- [ ] Button works with UI debug system

### Debug Console Testing
Use your debug console to test the button:

```javascript
// Open debug console (` key) and run:
window.UIRenderer.handleToolbarAction('Scout', 4);

// Check toolbar state:
window.UIRenderer.hudElements.toolbar.activeButton;

// Test button directly:
window.UIRenderer.hudElements.toolbar.buttons[4].onClick();
```

## 📁 Files You'll Modify

### Primary File
- **`Classes/rendering/UILayerRenderer.js`** - Main toolbar implementation

### Optional Files (for advanced features)
- **`Classes/rendering/UIController.js`** - Keyboard shortcuts
- **`Classes/systems/Button.js`** - Custom button styles (if needed)
- **Your game logic files** - Mode-specific implementation

## 🎉 Summary

Adding a new toolbar button is a **straightforward 4-step process** that leverages your existing Button.js system. The modular design makes it easy to:

1. ✅ **Add new buttons** by simply extending the labels array
2. ✅ **Customize behavior** through the action handler system  
3. ✅ **Maintain consistency** using existing button styles
4. ✅ **Integrate seamlessly** with your UI debug and rendering systems

The system is designed for extensibility, so adding new toolbar functionality requires minimal code changes and maintains visual consistency with your existing UI.

---

*This guide covers the complete process for adding toolbar buttons using your custom Button.js system. For additional button customization or advanced features, refer to the comprehensive Button class documentation in `Classes/systems/Button.js`.*