// Menu System for Ant Game
// Handles main menu, button interactions, transitions, and UI state

// Menu state variables
let gameState = "MENU"; // "MENU", "PLAYING", "OPTIONS"
let menuButtons = [];
let fadeAlpha = 0;      // Fade transition effect
let isFading = false;   // Is currently fading

// Title animation variables
let titleY = -100;        // start above the screen
let titleTargetY;         // Will be set based on canvas size
let titleSpeed = 9;       // pixels per frame

// Menu system initialization
function initializeMenu() {
  // Set title target position based on canvas size
  titleTargetY = CANVAS_Y / 2 - 150;
  
  // Setup menu buttons
  setupMenu();
}

// Setup menu buttons
function setupMenu() {
  menuButtons = [
    { 
      label: "Start Game", 
      x: CANVAS_X / 2, 
      y: CANVAS_Y / 2 - 40, 
      w: 220, 
      h: 50, 
      action: () => { 
        startGameTransition();
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

// Start the game transition (fade effect)
function startGameTransition() {
  isFading = true;
  fadeAlpha = 0;
}

// Draw the main menu
function drawMenu() {
  textAlign(CENTER, CENTER);

  // Animate the title dropping in
  if (titleY < titleTargetY) {
    titleY += titleSpeed;
    if (titleY > titleTargetY) titleY = titleTargetY; // clamp to final pos
  }

  // Draw title
  outlinedText("ANTS!", CANVAS_X / 2, titleY, font, 48, color(255), color(0));

  // Draw buttons
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
  if (gameState === "MENU") {
    menuButtons.forEach(btn => {
      if (isButtonHovered(btn)) {
        btn.action();
      }
    });
  }
}

// Update menu state and transitions
function updateMenu() {
  if (gameState === "MENU") {
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
    AntsUpdate();

    // Draw the menu UI
    drawMenu();

    // Draw fade overlay if transitioning
    if (isFading) {
      drawFadeOverlay();
    }

    return true; // Indicates menu was rendered (stops further rendering)
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