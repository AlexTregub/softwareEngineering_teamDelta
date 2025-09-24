# Button Creation Guide for Ant Game Menu System

## Overview
This guide explains how to create and add new buttons to different menu states in the Ant Game. The menu system is located in `Classes/ui/menu.js` and uses a modular approach for managing different button sets.

## File Structure
```
Classes/
└── ui/
    ├── menu.js                    # Main menu system
    ├── BUTTON_CREATION_GUIDE.md   # This documentation
    └── systems/
        └── Button.js              # Button class definition
```

## Quick Start: Adding a New Button

### Step 1: Choose Your Menu State
Determine which menu state your button belongs to:
- **MENU** - Main menu (Start Game, Options, etc.)
- **OPTIONS** - Options/settings menu
- **Custom State** - Create your own menu state

### Step 2: Add Button Configuration
Navigate to the appropriate setup function in `menu.js`:

**For Main Menu Buttons:**
```javascript
// In setupMainMenuButtons() function
const buttonConfigs = [
  // Existing buttons...
  
  // Add your new button here
  { 
    x: -100,           // X offset from center
    y: 80,             // Y offset from center  
    w: 200,            // Width
    h: 50,             // Height
    text: "Your Text", // Button label
    style: 'default',  // Style theme
    action: () => {    // Click handler
      console.log("Your button clicked!");
      // Add your logic here
    }
  }
];
```

**For Options Menu Buttons:**
```javascript
// In setupOptionsMenuButtons() function
const buttonConfigs = [
  // Existing buttons...
  
  // Add your new button here
  { 
    x: -100, 
    y: 140, 
    w: 200, 
    h: 50, 
    text: "New Option", 
    style: 'success', 
    action: () => console.log("New option selected!") 
  }
];
```

## Step-by-Step Detailed Guide

### Step 1: Understand Button Configuration Object
Each button is defined by a configuration object with these properties:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `x` | Number | Horizontal offset from screen center | `-100` (100px left of center) |
| `y` | Number | Vertical offset from screen center | `50` (50px below center) |
| `w` | Number | Button width in pixels | `200` |
| `h` | Number | Button height in pixels | `50` |
| `text` | String | Text displayed on button | `"Start Game"` |
| `style` | String | Visual theme (see styles below) | `'success'` |
| `action` | Function | Code to run when clicked | `() => doSomething()` |

### Step 2: Choose Button Style
Available button styles:

| Style | Description | Use Case |
|-------|-------------|----------|
| `'default'` | Gray theme | Standard buttons |
| `'success'` | Green theme | Positive actions (Start, OK) |
| `'danger'` | Red theme | Destructive actions (Exit, Delete) |
| `'warning'` | Orange theme | Caution actions (Reset) |
| `'purple'` | Purple theme | Special features (Credits) |

### Step 3: Position Your Button
Button positioning uses offset coordinates from the screen center:

```javascript
// Screen center coordinates are calculated as:
const centerX = CANVAS_X / 2;  // Horizontal center
const centerY = CANVAS_Y / 2;  // Vertical center

// Your button's final position will be:
// Final X = centerX + your_x_offset
// Final Y = centerY + your_y_offset
```

**Common Positioning Patterns:**
```javascript
// Centered button
{ x: -100, y: 0, w: 200, h: 50 }

// Button above center
{ x: -100, y: -60, w: 200, h: 50 }

// Button below center  
{ x: -100, y: 60, w: 200, h: 50 }

// Side-by-side buttons
{ x: -210, y: 0, w: 100, h: 50 }  // Left button
{ x: -100, y: 0, w: 100, h: 50 }  // Right button
```

### Step 4: Create Button Action Function
The `action` property defines what happens when the button is clicked:

**Simple Actions:**
```javascript
// Log to console
action: () => console.log("Button clicked!")

// Change game state
action: () => gameState = "PLAYING"

// Show alert
action: () => alert("Hello World!")
```

**Complex Actions:**
```javascript
// Multi-step action
action: () => {
  console.log("Starting complex action...");
  // Save settings
  saveGameSettings();
  // Switch menu
  switchToMainMenu();
  // Show feedback
  showNotification("Settings saved!");
}

// Call existing functions
action: () => startGameTransition()

// Switch to another menu state
action: () => switchToOptions()
```

### Step 5: Add Button to Configuration Array
Locate the appropriate `buttonConfigs` array and add your button:

```javascript
const buttonConfigs = [
  // Existing buttons
  { x: -100, y: -100, w: 200, h: 50, text: "Start Game", style: 'success', action: () => startGameTransition() },
  { x: -100, y: -40,  w: 200, h: 50, text: "Options",    style: 'success', action: () => switchToOptions() },
  
  // YOUR NEW BUTTON - Add it here
  { x: -100, y: 20,   w: 200, h: 50, text: "My Button",  style: 'default', action: () => myCustomFunction() },
  
  // More existing buttons...
];
```

## Advanced: Creating New Menu States

### Step 1: Add New Case to loadButtonsForState()
```javascript
function loadButtonsForState(state) {
  menuButtons = [];
  
  switch (state) {
    case "MENU":
      setupMainMenuButtons();
      break;
    case "OPTIONS":
      setupOptionsMenuButtons();
      break;
    case "CREDITS":  // Your new state
      setupCreditsMenuButtons();
      break;
    default:
      setupMainMenuButtons();
      break;
  }
}
```

### Step 2: Create Setup Function for New State
```javascript
// Setup credits menu buttons
function setupCreditsMenuButtons() {
  const centerX = CANVAS_X / 2;
  const centerY = CANVAS_Y / 2;
  
  const buttonConfigs = [
    { x: -100, y: -50, w: 200, h: 50, text: "Team Info",     style: 'default', action: () => showTeamInfo() },
    { x: -100, y: 10,  w: 200, h: 50, text: "Special Thanks", style: 'success', action: () => showThanks() },
    { x: -100, y: 70,  w: 200, h: 50, text: "Back to Menu",  style: 'danger',  action: () => switchToMainMenu() }
  ];

  menuButtons = buttonConfigs.map(btn => 
    createMenuButton(centerX + btn.x, centerY + btn.y, btn.w, btn.h, btn.text, btn.style, btn.action)
  );
}
```

### Step 3: Create Switch Function
```javascript
// Switch to credits menu
function switchToCredits() {
  gameState = "CREDITS";
  loadButtonsForState("CREDITS");
}
```

### Step 4: Update Title Display (Optional)
```javascript
// In drawMenu() function, update the title logic:
const getTitleText = () => {
  switch (gameState) {
    case "OPTIONS": return "OPTIONS";
    case "CREDITS": return "CREDITS";
    default: return "ANTS!";
  }
};

outlinedText(getTitleText(), CANVAS_X / 2, titleY, font, 48, color(255), color(0));
```

## Common Examples

### Example 1: Adding a Settings Button
```javascript
// In setupMainMenuButtons(), add to buttonConfigs array:
{
  x: -100,
  y: 80,
  w: 200,
  h: 50,
  text: "Settings",
  style: 'warning',
  action: () => {
    console.log("Opening settings...");
    // Switch to a settings menu state
    gameState = "SETTINGS";
    loadButtonsForState("SETTINGS");
  }
}
```

### Example 2: Adding a Volume Toggle
```javascript
// In setupOptionsMenuButtons(), add to buttonConfigs array:
{
  x: -100,
  y: 80,
  w: 200,
  h: 50,
  text: `Volume: ${audioEnabled ? 'ON' : 'OFF'}`,
  style: audioEnabled ? 'success' : 'danger',
  action: () => {
    audioEnabled = !audioEnabled;
    // Reload buttons to update button text
    loadButtonsForState("OPTIONS");
  }
}
```

### Example 3: Adding Navigation Buttons
```javascript
// Quick navigation buttons
{
  x: -210, y: 120, w: 100, h: 40,
  text: "← Back",
  style: 'default',
  action: () => switchToMainMenu()
},
{
  x: 110, y: 120, w: 100, h: 40,
  text: "Next →",
  style: 'success',
  action: () => switchToCredits()
}
```

## Testing Your Buttons

After adding buttons, test them by:

1. **Visual Check**: Ensure buttons appear in correct positions
2. **Click Test**: Verify click actions work as expected
3. **State Switching**: Confirm menu transitions work properly
4. **Run Tests**: Execute `npm test` to ensure no regressions

```bash
npm test
```

## Troubleshooting

### Button Not Appearing
- Check that you added it to the correct `buttonConfigs` array
- Verify the menu state is loading your button set
- Ensure positioning values are reasonable (not off-screen)

### Button Click Not Working
- Verify the `action` function syntax is correct
- Check browser console for JavaScript errors
- Ensure referenced functions exist

### Button Positioning Issues
- Remember coordinates are relative to screen center
- Use negative X values to move left of center
- Use negative Y values to move above center

### Button Overlapping
- Adjust Y coordinates to provide adequate spacing (typically 60+ pixels apart)
- Consider button height when calculating positions

## Best Practices

1. **Consistent Spacing**: Use regular intervals (60px) between buttons
2. **Meaningful Names**: Use descriptive button text
3. **Appropriate Styles**: Match button color to action type
4. **Logical Grouping**: Group related buttons together
5. **Back Navigation**: Always provide a way to return to previous menu
6. **Test Thoroughly**: Verify all button interactions work correctly

---

*This guide covers the complete workflow for creating and managing buttons in the Ant Game menu system. For additional customization or advanced features, refer to the Button class in `Classes/systems/Button.js`.*