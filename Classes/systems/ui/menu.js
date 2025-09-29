// Concise Menu System for Ant Game - Uses GameStateManager
let menuButtons = [];
let titleY = -100, titleTargetY, titleSpeed = 9;

// Button configurations for each menu state
const MENU_CONFIGS = {
  MENU: [
    { x: -100, y: -100, w: 200, h: 50, text: "Start Game", style: 'success', action: () => startGameTransition() },
    { x: -100, y: -40,  w: 200, h: 50, text: "Options",    style: 'success', action: () => GameState.goToOptions() },
    { x: -100, y: 20,   w: 200, h: 50, text: "Exit Game",  style: 'danger',  action: () => console.log("Exit!") },
    { x: -110, y: 120,  w: 100, h: 40, text: "Credits",    style: 'purple',  action: () => alert("Game by Team Delta!") },
    { x: 10,   y: 120,  w: 100, h: 40, text: "Debug",      style: 'warning', action: () => console.log("Debug:", GameState.getDebugInfo()) }
  ],
  OPTIONS: [
    { x: -100, y: -100, w: 200, h: 50, text: "Audio Settings", style: 'default', action: () => console.log("Audio Settings") },
    { x: -100, y: -40,  w: 200, h: 50, text: "Video Settings", style: 'default', action: () => console.log("Video Settings") },
    { x: -100, y: 20,   w: 200, h: 50, text: "Controls",      style: 'default', action: () => console.log("Controls") },
    { x: -100, y: 80,   w: 200, h: 50, text: "Back to Menu",  style: 'success', action: () => GameState.goToMenu() }
  ],
  DEBUG: [
    { x: -100, y: -100, w: 200, h: 50, text: "Check Mouse Over", style: 'warning', action: () => console.log("Audio Settings") },
    { x: -100, y: 80,   w: 200, h: 50, text: "Back to Menu",  style: 'success', action: () => GameState.goToMenu() }
  ]
};

// Initialize menu system
function initializeMenu() {
  titleTargetY = g_canvasY / 2 - 150;
  loadButtons();
  
  // Register callback to reload buttons when state changes
  GameState.onStateChange((newState, oldState) => {
    if (newState === "MENU" || newState === "OPTIONS") {
      loadButtons();
    }
  });
}

// Load buttons for current state
function loadButtons() {
  const centerX = g_canvasX / 2, centerY = g_canvasY / 2;
  const currentState = GameState.getState();
  menuButtons = (MENU_CONFIGS[currentState] || MENU_CONFIGS.MENU).g_map(btn => 
    createMenuButton(centerX + btn.x, centerY + btn.y, btn.w, btn.h, btn.text, btn.style, btn.action)
  );
}

// Start game with fade transition
function startGameTransition() {
  GameState.startGame();
}

// Main menu render function
function drawMenu() {
  textAlign(CENTER, CENTER);
  
  // Animate title
  if (titleY < titleTargetY) {
    titleY += titleSpeed;
    if (titleY > titleTargetY) titleY = titleTargetY;
  }
  
  // Draw title and buttons
  const titleText = GameState.isInOptions() ? "OPTIONS" : "ANTS!";
  outlinedText(titleText, g_canvasX / 2, titleY, g_menuFont, 48, color(255), color(0));
  
  menuButtons.forEach(btn => {
    btn.update(mouseX, mouseY, mouseIsPressed);
    btn.render();
  });
}

// Update menu transitions
function updateMenu() {
  if (GameState.isInMenu() && GameState.isFadingTransition()) {
    if (GameState.updateFade(5)) {
      // Fade complete, transition to playing
      GameState.setState("PLAYING");
    }
  } else if (GameState.isInGame()) {
    // Handle fade-out when returning from game
    const currentAlpha = GameState.getFadeAlpha();
    if (currentAlpha > 0) {
      GameState.setFadeAlpha(currentAlpha - 10);
    }
  }
}

// Render complete menu system
function renderMenu() {
  if (GameState.isAnyState("MENU", "OPTIONS", "DEBUG_MENU")) {
    g_map.render();
    antsUpdate();
    drawMenu();
    
    const fadeAlpha = GameState.getFadeAlpha();
    if (GameState.isFadingTransition() && fadeAlpha > 0) {
      fill(255, fadeAlpha);
      rect(0, 0, g_canvasX, g_canvasY);
    }
    return true;
  }
  return false;
}

