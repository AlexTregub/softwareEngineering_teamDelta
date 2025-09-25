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
  console.log(menuImage);
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

  // Smooth drop for title
  let easing = 0.07;
  titleY += (titleTargetY - titleY) * easing;

  // Floating effect for title
  let floatOffset = sin(frameCount * 0.03) * 5;

  // Draw title
  imageMode(CENTER);
  image(menuImage, CANVAS_X / 2, titleY + floatOffset, 500, 500);

  // Draw buttons
  menuButtons.forEach(btn => {
    const hovering = isButtonHovered(btn);

    push();
    imageMode(CENTER);

    if (btn.label === "Start Game") {
      // Initialize currentScale if not exists
      if (btn.currentScale === undefined) btn.currentScale = 1.0;

      // Hover animations
      let targetScale = hovering ? 1.1 : 1.0;       
      btn.currentScale += (targetScale - btn.currentScale) * 0.1; // easing

      let hoverFloat = hovering ? sin(frameCount * 0.1) * 5 : 0;

      // Apply tint if hovering
      if (hovering) {
        tint(255, 220);
      } else {
        noTint();
      }

      // Draw play button
      push();
      translate(btn.x, btn.y + hoverFloat);
      scale(btn.currentScale);
      image(playButton, 0, 0, btn.w, btn.h);
      pop();

    } else {
      // Other buttons as rectangles
      rectMode(CENTER);
      stroke(255);
      strokeWeight(3);
      fill(hovering ? color(180, 255, 180) : color(100, 200, 100));
      rect(btn.x, btn.y, btn.w, btn.h, 10);

      // Draw label
      outlinedText(btn.label, btn.x, btn.y, font, 24, color(0), color(255));
    }

    pop();
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
    Ants_Update();

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

function updateGame() {
  if (GameState.isInGame()) {
    AntsUpdate();  // actual game update loop
    MAP.render();  // actual game render
  }
}

function renderGame() {
  if (GameState.isInGame()) {
    AntsUpdate();   // update ants/movement
    MAP.render();   // render the world
    // maybe UI overlays, score, etc.
    
    const fadeAlpha = GameState.getFadeAlpha();
    if (GameState.isFadingTransition() && fadeAlpha > 0) {
      fill(255, fadeAlpha);
      rect(0, 0, CANVAS_X, CANVAS_Y);
    }
  }
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