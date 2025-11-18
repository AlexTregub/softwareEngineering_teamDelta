// Concise Menu System for Ant Game - Uses GameStateManager
let menuButtons = [];
let titleY = -50, titleTargetY, titleSpeed = 9;
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
const DEFAULT_MENU_YOFFSET = 0;
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
    { x: -10, y: -200, w: 220, h: 100, text: "Start Game", style: 'success', action: () => startGameTransition() },
    { x: -10, y: -100, w: 220, h: 80, text: "Moss & Stone Level", style: 'info', action: () => switchToLevel('mossStone') },
    { x: -10, y: -10,  w: 220, h: 80, text: "Level Editor",    style: 'warning', action: () => GameState.goToLevelEditor() },
    { x: -10, y: 70, w: 220, h:80, text: "Import level", style: 'info', action: () => importTerrain()},
    { x: -10, y: 150,   w: 220, h: 80, text: "Options",    style: 'success', action: () => GameState.goToOptions() },
    { x: -10, y: 230,   w: 220, h: 80, text: "Exit Game",  style: 'danger',  action: () => logNormal("Exit!") },
    { x: -60, y: 260, w: 145, h: 70, text: "Credits", style: 'purple', action: () => alert("Game by Team Delta!") },
    { x: 0,   y: 260,  w: 145, h: 70, text: "Debug",      style: 'warning', action: () => logNormal("Debug:", GameState.getDebugInfo()) }
  ],
  OPTIONS: [
    { x: -10, y: -100, w: 220, h: 80, text: "Audio Settings", style: 'default', action: () => showAudioSettings() },
    { x: -10, y: -12,  w: 220, h: 80, text: "Video Settings", style: 'default', action: () => logNormal("Video Settings") },
    { x: -10, y: 70,   w: 220, h: 80, text: "Controls",      style: 'default', action: () => logNormal("Controls") },
    { x: 60,   y: 148,  w: 145, h: 70, text: "Back to Menu",  style: 'success', action: () => GameState.goToMenu() }
  ],
  DEBUG: [
    { x: -100, y: -100, w: 200, h: 50, text: "Check Mouse Over", style: 'warning', action: () => logNormal("Audio Settings") },
    { x: -100, y: 80,   w: 200, h: 50, text: "Back to Menu",  style: 'success', action: () => GameState.goToMenu() }
  ]
};
function menuPreload(){
  g_menuFont = loadFont("Images/Assets/Terraria.TTF");
  menuImage = loadImage("Images/Assets/Menu/ants_logo3.png");
  playButton = loadImage("Images/Assets/Menu/play_button.png");
  optionButton = loadImage("Images/Assets/Menu/options_button.png");
  exitButton = loadImage("Images/Assets/Menu/exit_button.png");
  infoButton = loadImage("Images/Assets/Menu/info_button.png");
  debugButton = loadImage("Images/Assets/Menu/debug_button.png");
  videoButton = loadImage("Images/Assets/Menu/vs_button.png");
  audioButton = loadImage("Images/Assets/Menu/as_button.png");
  controlButton = loadImage("Images/Assets/Menu/controls_button.png");
  backButton = loadImage("Images/Assets/Menu/back_button.png");
  backButtonImg = backButton; // Make available globally for LevelEditor
}

// Initialize menu system
function initializeMenu() {
  titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
  loadButtons();
  soundManager.play("bgMusic");
  
  // Register callback to reload buttons when state changes
  GameState.onStateChange((newState, oldState) => {
    if (newState === "PLAYING") {
      soundManager.stop("bgMusic", true); // Use fade-out when transitioning to gameplay
    }
    if (newState === "MENU" || newState === "OPTIONS") {
      loadButtons();
    }
  });
  

  // Debug system initialization disabled
  // if (window.initializeMenuDebug) window.initializeMenuDebug();
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
    soundManager.stop("bgMusic");
}

// Main menu render function
function drawMenu() {
    // --- Title drop + floating animation ---
    let easing = 0.07;
    titleY += (titleTargetY - titleY) * easing;

    // Add a slow downward drift
    titleY += 0.2; // tweak this value for speed of float-down

    let floatOffset = Math.sin(frameCount * 0.03) * 5;
    textAlign(CENTER, CENTER);
  
    // Draw logo instead of plain text
    imageMode(CENTER);
    // If we have a header laid out by the container, draw it centered at its computed position.
    if (menuHeader && menuHeader.img) {
      const hx = g_canvasX / 2;
      const hy = menuHeader.y + menuHeader.h / 2 + floatOffset;
      image(menuHeader.img, hx, hy, menuHeader.w + 150, menuHeader.h + 100);
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

  // Debug rendering disabled
  // if (window.menuLayoutDebug && window.drawMenuDebug) {
  //   window.drawMenuDebug();
  // }
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
    drawMenu();
    
    // Draw audio settings overlay if active
    if (audioSettingsActive) {
      drawAudioSettings();
    }
    
    const fadeAlpha = GameState.getFadeAlpha();
    if (GameState.isFadingTransition() && fadeAlpha > 0) {
      fill(255, fadeAlpha);
      rect(0, 0, g_canvasX, g_canvasY);
    }
    return true;
  }
  return false;
}

// ============================================================================
// AUDIO SETTINGS SYSTEM
// ============================================================================

let audioSettingsActive = false;
let musicSlider, sfxSlider, systemSlider;

function showAudioSettings() {
  audioSettingsActive = true;
  
  // Create sliders if they don't exist
  if (!musicSlider) {
    const centerX = g_canvasX / 2;
    const startY = g_canvasY / 2 - 80;
    
    musicSlider = createSlider(0, 100, soundManager.getCategoryVolume('Music') * 100);
    musicSlider.position(centerX - 100, startY);
    musicSlider.size(200);
    musicSlider.style('z-index', '1000');
    
    sfxSlider = createSlider(0, 100, soundManager.getCategoryVolume('SoundEffects') * 100);
    sfxSlider.position(centerX - 100, startY + 60);
    sfxSlider.size(200);
    sfxSlider.style('z-index', '1000');
    
    systemSlider = createSlider(0, 100, soundManager.getCategoryVolume('SystemSounds') * 100);
    systemSlider.position(centerX - 100, startY + 120);
    systemSlider.size(200);
    systemSlider.style('z-index', '1000');
  } else {
    // Update slider values to reflect current saved settings
    musicSlider.value(soundManager.getCategoryVolume('Music') * 100);
    sfxSlider.value(soundManager.getCategoryVolume('SoundEffects') * 100);
    systemSlider.value(soundManager.getCategoryVolume('SystemSounds') * 100);
    
    // Show existing sliders
    musicSlider.show();
    sfxSlider.show();
    systemSlider.show();
  }
  
}

function hideAudioSettings() {
  audioSettingsActive = false;
  if (musicSlider) {
    musicSlider.hide();
    sfxSlider.hide();
    systemSlider.hide();
  }
}

function drawAudioSettings() {
  // Semi-transparent dark overlay
  fill(0, 0, 0, 200);
  rect(0, 0, g_canvasX, g_canvasY);
  
  // Settings panel background
  const panelW = 500;
  const panelH = 400;
  const panelX = g_canvasX / 2 - panelW / 2;
  const panelY = g_canvasY / 2 - panelH / 2;
  
  fill(40, 40, 40);
  stroke(100, 150, 255);
  strokeWeight(3);
  rect(panelX, panelY, panelW, panelH, 10);
  
  // Title
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text('Audio Settings', g_canvasX / 2, panelY + 40);
  
  // Update volumes from sliders
  if (musicSlider) {
    soundManager.setCategoryVolume('Music', musicSlider.value() / 100);
    soundManager.setCategoryVolume('SoundEffects', sfxSlider.value() / 100);
    soundManager.setCategoryVolume('SystemSounds', systemSlider.value() / 100);
  }
  
  // Labels
  const labelX = g_canvasX / 2 - 120;
  const startY = g_canvasY / 2 - 80;
  
  textAlign(RIGHT, CENTER);
  textSize(20);
  fill(200, 200, 255);
  text('Music Volume:', labelX, startY + 10);
  text('Sound Effects:', labelX, startY + 70);
  text('System Sounds:', labelX, startY + 130);
  
  // Volume percentages
  textAlign(LEFT, CENTER);
  const valueX = g_canvasX / 2 + 120;
  fill(255, 255, 100);
  if (musicSlider) {
    text(musicSlider.value() + '%', valueX, startY + 10);
    text(sfxSlider.value() + '%', valueX, startY + 70);
    text(systemSlider.value() + '%', valueX, startY + 130);
  }
  
  // Close button
  const btnW = 120;
  const btnH = 40;
  const btnX = g_canvasX / 2 - btnW / 2;
  const btnY = panelY + panelH - 70;
  
  // Check if mouse is over close button
  const isHovering = mouseX > btnX && mouseX < btnX + btnW && 
                     mouseY > btnY && mouseY < btnY + btnH;
  
  fill(isHovering ? color(80, 180, 80) : color(50, 150, 50));
  stroke(255);
  strokeWeight(2);
  rect(btnX, btnY, btnW, btnH, 5);
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text('Close', g_canvasX / 2, btnY + btnH / 2);
  
  // Handle close button click
  if (isHovering && mouseIsPressed) {
    hideAudioSettings();
  }
}


