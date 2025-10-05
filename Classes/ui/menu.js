// Concise Menu System for Ant Game - Uses GameStateManager
let menuButtons = [];
let titleY = -100, titleTargetY, titleSpeed = 9;

// Button configurations for each menu state
const MENU_CONFIGS = {
  MENU: [
    { x: -113, y: -100, w: 220, h: 100, text: "Start Game", style: 'success', action: () => startGameTransition() },
    { x: -113, y: -10,  w: 220, h: 80, text: "Options",    style: 'success', action: () => GameState.goToOptions() },
    { x: -113, y: 70,   w: 220, h: 80, text: "Exit Game",  style: 'danger',  action: () => console.log("Exit!") },
    { x: -156, y: 150,  w: 145, h: 70, text: "Credits",    style: 'purple',  action: () => alert("Game by Team Delta!") },
    { x: 9,   y: 148,  w: 145, h: 70, text: "Debug",      style: 'warning', action: () => console.log("Debug:", GameState.getDebugInfo()) }
  ],
  OPTIONS: [
    { x: -113, y: -100, w: 220, h: 80, text: "Audio Settings", style: 'default', action: () => console.log("Audio Settings") },
    { x: -113, y: -12,  w: 220, h: 80, text: "Video Settings", style: 'default', action: () => console.log("Video Settings") },
    { x: -113, y: 70,   w: 220, h: 80, text: "Controls",      style: 'default', action: () => console.log("Controls") },
    { x: 9,   y: 148,  w: 145, h: 70, text: "Back to Menu",  style: 'success', action: () => GameState.goToMenu() }
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

    menuButtons = (MENU_CONFIGS[currentState] || MENU_CONFIGS.MENU).map(btn => {
      let img = null;
      switch (btn.text) {
        case "Start Game":
          img = playButton;
          break;
        case "Options":
          img = optionButton;
          break;
        case "Exit Game":
          img = exitButton;
          break;
        case "Credits":
          img = infoButton;
          break;
        case "Audio Settings":
          img = audioButton;
          break;
        case "Video Settings":
          img = videoButton;
          break;
        case "Controls":
          img = controlButton;
          break;
        case "Back to Menu":
          img = backButton;
          break;
        case "Debug":
          img = debugButton;
          break;
        default:
          img = null;
        
      }

      return createMenuButton(
            centerX + btn.x,
            centerY + btn.y,
            btn.w,
            btn.h,
            btn.text,
            btn.style,
            btn.action,
            img 
      );
  });

    // Register buttons for click handling
    setActiveButtons(menuButtons);
}


// Start game with fade transition
function startGameTransition() {
    // Only start fade out, do NOT switch state yet
    GameState.startFadeTransition("out");
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
      image(menuImage, CANVAS_X / 2, (titleY - 50) + floatOffset, 700, 700);
    } else {
      // fallback outlined text if image fails
      outlinedText("ANTS!", CANVAS_X / 2, titleY + floatOffset, font, 48, color(255), color(0));
    }
  
  menuButtons.forEach(btn => {
    btn.update(mouseX, mouseY, mouseIsPressed);
    btn.render();
  });
}

// Update menu transitions
function updateMenu() {
    if (GameState.isFadingTransition()) {
      const fadeComplete = GameState.updateFade(10);
  
      if (fadeComplete) {
        if (GameState.fadeDirection === "out") {
          // Fade-out done → switch state to PLAYING
          GameState.setState("PLAYING", true); // skip callbacks if needed
          GameState.startFadeTransition("in"); // start fade-in
        } else {
          // Fade-in done → stop fading
          GameState.stopFadeTransition();
        }
      }
    }
  }

// Render complete menu system
function renderMenu() {
  if (GameState.isAnyState("MENU", "OPTIONS")) {
    // Dynamic re-gen of terrain: every 10 sec, similar to setup()
    // if (!GameState.isFadingTransition()) {
    //   SEED = hour()*minute()*floor(second()/10);
    //   MAP2.randomize(SEED);
    // }
    MAP2.render();
    
    AntsUpdate();
    // drawMenu();
    
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