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
  ]
};

// Initialize menu system
function initializeMenu() {
  titleTargetY = CANVAS_Y / 2 - 150;
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
  const centerX = CANVAS_X / 2, centerY = CANVAS_Y / 2;
  const currentState = GameState.getState();
  menuButtons = (MENU_CONFIGS[currentState] || MENU_CONFIGS.MENU).map(btn => 
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
  
    // --- Title drop animation ---
    let easing = 0.07;
    titleY += (titleTargetY - titleY) * easing;
    let floatOffset = sin(frameCount * 0.03) * 5;
  
    // Draw logo instead of plain text
    imageMode(CENTER);
    if (menuImage) {
      image(menuImage, CANVAS_X / 2, titleY + floatOffset, 600, 600);
    } else {
      // fallback outlined text if image fails
      outlinedText("ANTS!", CANVAS_X / 2, titleY + floatOffset, font, 48, color(255), color(0));
    }
  
    // --- Draw menu buttons ---
    menuButtons.forEach(btn => {
      const hovering = btn.isHovered(mouseX, mouseY);
  
      push();
      imageMode(CENTER);
  
      if (btn.text === "Start Game") {
        // animated play button style
        if (btn.currentScale === undefined) btn.currentScale = 1.0;
  
        let targetScale = hovering ? 1.1 : 1.0;
        btn.currentScale += (targetScale - btn.currentScale) * 0.1;
  
        let hoverFloat = hovering ? sin(frameCount * 0.1) * 5 : 0;
  
        if (hovering) {
          tint(255, 220);
        } else {
          noTint();
        }
  
        push();
        translate(btn.x, btn.y + hoverFloat);
        scale(btn.currentScale);
        if (playButton) {
          image(playButton, 0, 0, btn.w, btn.h);
        } else {
          // fallback rectangle
          rectMode(CENTER);
          fill(hovering ? color(180, 255, 180) : color(100, 200, 100));
          rect(0, 0, btn.w, btn.h, 10);
          outlinedText("Start Game", 0, 0, font, 24, color(0), color(255));
        }
        pop();
      } else {
        // keep other buttons styled simple
        rectMode(CENTER);
        stroke(255);
        strokeWeight(3);
        fill(hovering ? color(200, 200, 255) : color(150));
        rect(btn.x, btn.y, btn.w, btn.h, 10);
  
        outlinedText(btn.text, btn.x, btn.y, font, 24, color(0), color(255));
      }
  
      pop();
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
  if (GameState.isAnyState("MENU", "OPTIONS")) {
    MAP.render();
    AntsUpdate();
    drawMenu();
    
    const fadeAlpha = GameState.getFadeAlpha();
    if (GameState.isFadingTransition() && fadeAlpha > 0) {
      fill(255, fadeAlpha);
      rect(0, 0, CANVAS_X, CANVAS_Y);
    }
    return true;
  }
  return false;
}

// Legacy utility functions (now using GameStateManager)
const getGameState = () => GameState.getState();
const setGameState = (state) => GameState.setState(state);
const resetMenu = () => { GameState.reset(); titleY = -100; loadButtons(); };
const isInMenu = () => GameState.isInMenu();
const isInGame = () => GameState.isInGame();
const isInOptions = () => GameState.isInOptions();