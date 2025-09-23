// Menu System for Ant Game
// Handles main menu, faction selection, button interactions, transitions, and UI state


// Menu state variables
const GameState = {
  MENU: "MENU",
  FACTION_SETUP: "FACTION_SETUP", 
  PLAYING: "PLAYING",
  OPTIONS: "OPTIONS"
};

let gameState = GameState.MENU
let menuButtons = [];
let fadeAlpha = 0;      // Fade transition effect
let isFading = false;   // Is currently fading

// Title animation variables
let titleY = -100;        // start above the screen
let titleTargetY;         // Will be set based on canvas size
let titleSpeed = 9;       // pixels per frame

// Faction setup variables
let playerFactionName = "Players";
let playerFactionColor = "#0000FF"; // Blue default
let factionColorOptions = [
  { name: "Blue", color: "#0000FF" },
  { name: "Red", color: "#FF0000" },
  { name: "Green", color: "#00FF00" },
  { name: "Purple", color: "#800080" },
  { name: "Orange", color: "#FFA500" },
  { name: "Yellow", color: "#FFFF00" },
  { name: "Cyan", color: "#00FFFF" },
  { name: "Pink", color: "#FFC0CB" }
];
let selectedColorIndex = 0;
let factionNameInput = "";
let isEditingName = false;

// Menu system initialization
function initializeMenu() {
  // Set title target position based on canvas size
  titleTargetY = CANVAS_Y / 2 - 150;
  
  // Initialize faction setup
  factionNameInput = playerFactionName;
  
  // Setup menu buttons
  setupMenu();
}

function drawButton(label, pos, size, action) {
  
}

// Draws the main menu buttons to the screen
function drawMainMenuButtons() {
      menuButtons = [
      { 
        label: "Start Game", 
        x: CANVAS_X / 2, 
        y: CANVAS_Y / 2 - 40, 
        w: 220, 
        h: 50, 
        action: () => { 
          goToFactionSetup();
        } 
      },
      { 
        label: "Options",    
        x: CANVAS_X / 2, 
        y: CANVAS_Y / 2 + 40, 
        w: 220, 
        h: 50, 
        action: () => { 
          gameState = "OPTIONS"; 
        } 
      }
    ];
}

function drawFactionMenuButtons() {
      menuButtons = [
      {
        label: "Edit Name",
        x: CANVAS_X / 2 - 150,
        y: CANVAS_Y / 2 - 80,
        w: 140,
        h: 40,
        action: () => {
          toggleNameEditing();
        }
      },
      {
        label: "< Color",
        x: CANVAS_X / 2 - 100,
        y: CANVAS_Y / 2 - 20,
        w: 80,
        h: 40,
        action: () => {
          previousColor();
        }
      },
      {
        label: "Color >",
        x: CANVAS_X / 2 + 100,
        y: CANVAS_Y / 2 - 20,
        w: 80,
        h: 40,
        action: () => {
          nextColor();
        }
      },
      {
        label: "Start Game",
        x: CANVAS_X / 2,
        y: CANVAS_Y / 2 + 80,
        w: 200,
        h: 50,
        action: () => {
          startGameWithFaction();
        }
      },
      {
        label: "Back",
        x: CANVAS_X / 2,
        y: CANVAS_Y / 2 + 140,
        w: 120,
        h: 40,
        action: () => {
          gameState = "MENU";
          setupMenu();
        }
      }
    ];
}

// Setup menu buttons
function setupMenu() {
  switch (gameState) {
    case GameState.MENU: drawMainMenuButtons(); break;
    case GameState.FACTION_SETUP: drawFactionMenuButtons(); break;
  }
}

// Go to faction setup screen
function goToFactionSetup() {
  gameState = "FACTION_SETUP";
  setupMenu();
}

// Toggle name editing mode
function toggleNameEditing() {
  isEditingName = !isEditingName;
  if (isEditingName) {
    factionNameInput = playerFactionName;
  }
}

// Navigate to previous color
function previousColor() {
  selectedColorIndex = (selectedColorIndex - 1 + factionColorOptions.length) % factionColorOptions.length;
  playerFactionColor = factionColorOptions[selectedColorIndex].color;
}

// Navigate to next color
function nextColor() {
  selectedColorIndex = (selectedColorIndex + 1) % factionColorOptions.length;
  playerFactionColor = factionColorOptions[selectedColorIndex].color;
}

// Start game with selected faction
function startGameWithFaction() {
  // Apply the faction name if editing
  if (isEditingName && factionNameInput.trim() !== "") {
    playerFactionName = factionNameInput.trim();
  }
  
  // Create the player faction
  createPlayerFaction(playerFactionName, playerFactionColor);
  
  // Start the game transition
  startGameTransition();
  
  // Spawn ants with the player faction
  if (typeof Ants_Spawn === 'function' && typeof window !== 'undefined' && window.playerFaction) {
    Ants_Spawn(10, window.playerFaction);
  } else {
    console.warn("Could not spawn ants with faction - using default spawn");
    if (typeof Ants_Spawn === 'function') {
      Ants_Spawn(10);
    }
  }
}

// Create the player faction (to be called when game starts)
function createPlayerFaction(name, color) {
  // Import faction system
  if (typeof createFaction !== 'undefined') {
    const playerFaction = createFaction(name, color);
    
    // Store reference for use in game
    if (typeof window !== 'undefined') {
      window.playerFaction = playerFaction;
    }
    
    console.log(`Created player faction: ${name} with color ${color}`);
  } else {
    console.warn("Faction system not loaded - using default faction");
  }
}

// Start the game transition (fade effect)
function startGameTransition() {
  isFading = true;
  fadeAlpha = 0;
}

// Draw the main menu and control the menuState
function drawMenu() {
  switch (gameState) {
    case GameState.MENU:
      drawMainMenu();
      break;
    case GameState.FACTION_SETUP:
      drawFactionSetup();
      break;
    default:
      console.log("Error: No valid gameState found...")
  }
}

// Draw the main menu screen
function drawMainMenu() {
  textAlign(CENTER, CENTER);

  // Animate the title dropping in
  if (titleY < titleTargetY) {
    titleY += titleSpeed;
    if (titleY > titleTargetY) titleY = titleTargetY; // clamp to final pos
  }

  // Draw title
  outlinedText("ANTS!", CANVAS_X / 2, titleY, font, 48, color(255), color(0));

  // Draw buttons
  drawButtons();
}

// Draw the faction setup screen
function drawFactionSetup() {
  textAlign(CENTER, CENTER);

  // Draw title
  outlinedText("Setup Your Faction", CANVAS_X / 2, CANVAS_Y / 2 - 200, font, 36, color(255), color(0));

  // Draw faction name section
  outlinedText("Faction Name:", CANVAS_X / 2, CANVAS_Y / 2 - 120, font, 20, color(255), color(0));
  
  // Draw name input box
  push();
  rectMode(CENTER);
  stroke(255);
  strokeWeight(2);
  fill(isEditingName ? color(255, 255, 100, 100) : color(100, 100, 100, 100));
  rect(CANVAS_X / 2, CANVAS_Y / 2 - 80, 300, 40, 5);
  pop();
  
  // Draw faction name text
  const displayName = isEditingName ? factionNameInput + (frameCount % 60 < 30 ? "|" : "") : playerFactionName;
  outlinedText(displayName, CANVAS_X / 2, CANVAS_Y / 2 - 80, font, 18, color(0), color(255));

  // Draw color section
  outlinedText("Faction Color:", CANVAS_X / 2, CANVAS_Y / 2 - 40, font, 20, color(255), color(0));
  
  // Draw color preview
  push();
  rectMode(CENTER);
  stroke(255);
  strokeWeight(3);
  fill(playerFactionColor);
  rect(CANVAS_X / 2, CANVAS_Y / 2 - 20, 60, 40, 5);
  pop();
  
  // Draw color name
  outlinedText(factionColorOptions[selectedColorIndex].name, CANVAS_X / 2, CANVAS_Y / 2 + 15, font, 16, color(255), color(0));

  // Draw preview section
  outlinedText("Preview:", CANVAS_X / 2, CANVAS_Y / 2 + 40, font, 18, color(255), color(0));
  outlinedText(`"${playerFactionName}" faction`, CANVAS_X / 2, CANVAS_Y / 2 + 55, font, 14, playerFactionColor, color(0));

  // Draw buttons
  drawButtons();
}

// Draw menu buttons
function drawButtons() {
  menuButtons.forEach(btn => {
    const hovering = isButtonHovered(btn);

    push();
    rectMode(CENTER);
    stroke(255);
    strokeWeight(3);
    fill(hovering ? color(180, 255, 180) : color(100, 200, 100));
    rect(btn.x, btn.y, btn.w, btn.h, 10);
    pop();

    // Button label with outlinedText
    outlinedText(btn.label, btn.x, btn.y, font, 24, color(0), color(255));
  });
}

// Check if a button is being hovered
function isButtonHovered(btn) {
  return mouseX > btn.x - btn.w / 2 && mouseX < btn.x + btn.w / 2 &&
         mouseY > btn.y - btn.h / 2 && mouseY < btn.y + btn.h / 2;
}

// Handle menu button clicks
function handleMenuClick() {
  if (gameState === "MENU" || gameState === "FACTION_SETUP") {
    menuButtons.forEach(btn => {
      if (isButtonHovered(btn)) {
        btn.action();
      }
    });
  }
}

// Handle keyboard input for faction name editing
function handleMenuKeyPressed() {
  if (gameState === "FACTION_SETUP" && isEditingName) {
    if (keyCode === ENTER || keyCode === ESCAPE) {
      // Finish editing
      if (keyCode === ENTER && factionNameInput.trim() !== "") {
        playerFactionName = factionNameInput.trim();
      }
      isEditingName = false;
    } else if (keyCode === BACKSPACE) {
      // Remove last character
      factionNameInput = factionNameInput.slice(0, -1);
    } else if (key.length === 1 && factionNameInput.length < 20) {
      // Add character (letters, numbers, spaces only)
      if (key.match(/[a-zA-Z0-9 ]/)) {
        factionNameInput += key;
      }
    }
  }
}

// Update menu state and transitions
function updateMenu() {
  if (gameState === "MENU" || gameState === "FACTION_SETUP") {
    // Handle fade-in transition
    if (isFading) {
      fadeAlpha += 5; // speed of fade-in
      
      if (fadeAlpha >= 255) {
        gameState = "PLAYING"; // switch to game
        isFading = false;
      }
    }
  } else if (gameState === "PLAYING") {
    // Handle fade-out transition
    if (fadeAlpha > 0) {
      fadeAlpha -= 10; // speed of fade-out
    }
  }
}

// Draw fade overlay
function drawFadeOverlay() {
  if (fadeAlpha > 0) {
    fill(255, fadeAlpha);
    rect(0, 0, CANVAS_X, CANVAS_Y);
  }
}

// Render the complete menu system
function renderMenu() {
  if (gameState === "MENU") {
    // Render menu background and colony
    MAP.render();
    Ants_Update();

    // Draw the menu UI
    drawMenu();

    // Draw fade overlay if transitioning
    if (isFading) {
      drawFadeOverlay();
    }

    return true; // Indicates menu was rendered (stops further rendering)
  } else if (gameState === "FACTION_SETUP") {
    background(30, 50, 80);
    drawFactionSetupScreen();
    return true;
  }
  
  return false; // Menu not active, continue with game rendering
}

// Get current game state
function getGameState() {
  return gameState;
}

// Set game state (useful for external control)
function setGameState(newState) {
  gameState = newState;
}

// Reset menu to initial state
function resetMenu() {
  gameState = "MENU";
  fadeAlpha = 0;
  isFading = false;
  titleY = -100;
  setupMenu();
}

// Check if currently in menu
function isInMenu() {
  return gameState === "MENU";
}

// Check if currently in game
function isInGame() {
  return gameState === "PLAYING";
}

// Check if currently in options
function isInOptions() {
  return gameState === "OPTIONS";
}

// Draw the faction setup screen
function drawFactionSetupScreen() {
  // Title
  fill(255);
  textAlign(CENTER);
  textSize(32);
  text("Setup Your Faction", CANVAS_X / 2, 100);
  
  // Faction name section
  textSize(20);
  text("Faction Name:", CANVAS_X / 2 - 150, CANVAS_Y / 2 - 120);
  
  // Name display/input box
  push();
  rectMode(CENTER);
  stroke(255);
  strokeWeight(2);
  fill(isEditingName ? color(255, 255, 255, 100) : color(100, 100, 100, 100));
  rect(CANVAS_X / 2 + 50, CANVAS_Y / 2 - 130, 200, 30);
  
  fill(255);
  textSize(16);
  let displayName = isEditingName ? factionNameInput : playerFactionName;
  text(displayName + (isEditingName && frameCount % 60 < 30 ? "|" : ""), CANVAS_X / 2 + 50, CANVAS_Y / 2 - 125);
  pop();
  
  // Color selection section
  textSize(20);
  text("Faction Color:", CANVAS_X / 2, CANVAS_Y / 2 - 60);
  
  // Current color preview
  push();
  rectMode(CENTER);
  let currentColor = factionColorOptions[selectedColorIndex].color;
  fill(currentColor);
  stroke(255);
  strokeWeight(3);
  rect(CANVAS_X / 2, CANVAS_Y / 2 - 20, 100, 40);
  
  // Color name
  fill(255);
  textSize(16);
  text(factionColorOptions[selectedColorIndex].name, CANVAS_X / 2, CANVAS_Y / 2 + 10);
  pop();
  
  // Draw all buttons
  drawButtons();
  
  // Instructions
  fill(200);
  textSize(14);
  textAlign(CENTER);
  text("Click 'Edit Name' to change faction name, use color buttons to select color", CANVAS_X / 2, CANVAS_Y / 2 + 200);
}