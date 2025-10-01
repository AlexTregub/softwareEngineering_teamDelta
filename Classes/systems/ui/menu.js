// Concise Menu System for Ant Game - Uses GameStateManager
let menuButtons = [];
let titleY = -100, titleTargetY, titleSpeed = 9;
let menuButton;
let playButton;
let optionButton;
let exitButton;
let infoButton;
let debugButton;
let menuImage;
let menuHeader = null;
let g_mapRendered

// layout debug data is produced by VerticalButtonList and exposed via
// window.menuLayoutData so debug rendering code can access it without
// polluting this module's globals.
// window.menuLayoutData = { debugRects:[], groupRects:[], centers:[], debugImgs:[], headerTop }
// global vertical offset (px) to move the menu up/down. Negative moves up.
// default offset and persisted storage key
const DEFAULT_MENU_YOFFSET = -50;
const MENU_YOFFSET_KEY = 'antgame.menuYOffset';

// load persisted offset if available, otherwise fall back to default
let menuYOffset = (function(){
  try {
    const v = localStorage.getItem(MENU_YOFFSET_KEY);
    if (v !== null) {
      const n = parseInt(v, 10);
      if (!Number.isNaN(n)) return n;
    }
  } catch (err) {
    // localStorage may be unavailable in some contexts
  }
  return DEFAULT_MENU_YOFFSET;
})();

// the canonical default to reset to (Home will reset to this value)
const initialMenuYOffset = DEFAULT_MENU_YOFFSET;
// Debug behaviors (keyboard, pointer, drag, history, rendering) were moved
// to debug/menu_debug.js. The debug module exposes initializeMenuDebug()
// and drawMenuDebug() which we call when available.

// Button configurations for each menu state
const MENU_CONFIGS = {
  MENU: [
    { x: 0, y: -100, w: 200, h: 100, text: "Start Game", style: 'success', action: () => startGameTransition() },
    { x: 0, y: -40,  w: 200, h: 100, text: "Options",    style: 'success', action: () => GameState.goToOptions() },
    { x: 0, y: 20,   w: 200, h: 100, text: "Exit Game",  style: 'danger',  action: () => console.log("Exit!") },
    { x: 0, y: 120,  w: 100, h: 50, text: "Credits",    style: 'purple',  action: () => alert("Game by Team Delta!") },
    { x: 10,   y: 120,  w: 100, h: 50, text: "Debug",      style: 'warning', action: () => console.log("Debug:", GameState.getDebugInfo()) }
  ],
  OPTIONS: [
    { x: 0, y: -100, w: 200, h: 50, text: "Audio Settings", style: 'default', action: () => console.log("Audio Settings") },
    { x: 0, y: -40,  w: 200, h: 50, text: "Video Settings", style: 'default', action: () => console.log("Video Settings") },
    { x: 0, y: 20,   w: 200, h: 50, text: "Controls",      style: 'default', action: () => console.log("Controls") },
    { x: 0, y: 80,   w: 200, h: 50, text: "Back to Menu",  style: 'success', action: () => GameState.goToMenu() }
  ],
  DEBUG: [
    { x: -100, y: -100, w: 200, h: 50, text: "Check Mouse Over", style: 'warning', action: () => console.log("Audio Settings") },
    { x: -100, y: 80,   w: 200, h: 50, text: "Back to Menu",  style: 'success', action: () => GameState.goToMenu() }
  ]
};

function menuPreload(){
  g_menuFont = loadFont("Images/Assets/Terraria.TTF");
  menuImage = loadImage("Images/Assets/Menu/ant_logo1.png");
  playButton = loadImage("Images/Assets/Menu/play_button.png");
  optionButton = loadImage("Images/Assets/Menu/options_button.png");
  exitButton = loadImage("Images/Assets/Menu/exit_button.png");
  infoButton = loadImage("Images/Assets/Menu/info_button.png");
  debugButton = loadImage("Images/Assets/Menu/debug_button.png");
  videoButton = loadImage("Images/Assets/Menu/vs_button.png");
  audioButton = loadImage("Images/Assets/Menu/as_button.png");
  controlButton = loadImage("Images/Assets/Menu/controls_button.png");
  backButton = loadImage("Images/Assets/Menu/back_button.png");
}

// Initialize menu system
function initializeMenu() {
  titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
  loadButtons();
  
  // Register callback to reload buttons when state changes
  GameState.onStateChange((newState, oldState) => {
    if (newState === "MENU" || newState === "OPTIONS") {
      loadButtons();
    }
  });

  // initialize external debug handlers (if the debug module is present)
  if (window.initializeMenuDebug) window.initializeMenuDebug();
}

// Load buttons for current state
function loadButtons() {
  const centerX = g_canvasX / 2, centerY = g_canvasY / 2 + menuYOffset;
    const currentState = GameState.getState();
    const configs = (MENU_CONFIGS[currentState] || MENU_CONFIGS.MENU);

    // Use a vertical container to auto-layout the buttons.
    // This preserves each config's width/height but constrains max width
    // and evenly spaces buttons vertically while keeping horizontal offsets
    // (btn.x) as small manual nudges if present.
  const container = new VerticalButtonList(centerX, centerY, { spacing: 8, maxWidth: Math.floor(g_canvasX * 0.55), headerImg: menuImage, headerScale: .7, headerGap: 30, headerMaxWidth: 500 });
  const layout = container.buildFromConfigs(configs);
  menuButtons = layout.buttons;
  menuHeader = layout.header || null;
  // publish layout debug data for the debug module (if present)
  try {
    window.menuLayoutData = {
      debugRects: layout.debugRects || [],
      groupRects: layout.groupRects || [],
      centers: layout.centers || [],
      debugImgs: layout.debugImgs || [],
      headerTop: layout.headerTop
    };
  } catch (err) {
    // ignore if window is not writable in some test contexts
  }

  // Register buttons for click handling
  setActiveButtons(menuButtons);
  g_mapRendered = false;
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
    // If we have a header laid out by the container, draw it centered at its computed position.
    if (menuHeader && menuHeader.img) {
      const hx = g_canvasX / 2;
      const hy = menuHeader.y + menuHeader.h / 2 + floatOffset;
      image(menuHeader.img, hx, hy, menuHeader.w, menuHeader.h);
    } else if (menuImage) {
      // fallback to previous large logo behavior if header wasn't provided
      image(menuImage, g_canvasX / 2, (titleY - 50) + floatOffset, 700, 700);
    } else {
      // fallback outlined text if image fails
      outlinedText("ANTS!", g_canvasX / 2, titleY + floatOffset, g_menuFont, 48, color(255), color(0));
    }
  
  menuButtons.forEach(btn => {
    btn.update(mouseX, mouseY, mouseIsPressed);
    btn.render();
  });

  // Debug rendering and interactions were moved to debug/menu_debug.js
  // Use the shared window.menuLayoutDebug flag so both modules agree on state.
  if (window.menuLayoutDebug && window.drawMenuDebug) {
    window.drawMenuDebug();
  }
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
    // renderMenu() call removed; updateMenu is now state-only
  }



// Render complete menu system
function renderMenu() {
  if (GameState.isAnyState("MENU", "OPTIONS", "DEBUG_MENU")) {
    drawMenu()
    
    const fadeAlpha = GameState.getFadeAlpha();
    if (GameState.isFadingTransition() && fadeAlpha > 0) {
      fill(255, fadeAlpha);
      rect(0, 0, g_canvasX, g_canvasY);
    }
    return true;
  }
  return false;
}

