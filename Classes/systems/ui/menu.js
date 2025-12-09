// Concise Menu System for Ant Game - Uses GameStateManager
let menuButtons = [];
let titleY = -50, titleTargetY, titleSpeed = 13;
let menuButton;
let playButton;
let optionButton;
let exitButton;
let infoButton;
let debugButton;
let menuImage;
let menuHeader = null;
let g_mapRendered

let creditsBut
let loadLBut
let levelEditBut
let tutorialBut

// layout debug data is produced by VerticalButtonList and exposed via
// window.menuLayoutData so debug rendering code can access it without
// polluting this module's globals.
// window.menuLayoutData = { debugRects:[], groupRects:[], centers:[], debugImgs:[], headerTop }
// global vertical offset (px) to move the menu up/down. Negative moves up.
// default offset and persisted storage key
const DEFAULT_MENU_YOFFSET = -80;

// Button configurations for each menu state
const MENU_CONFIGS = {
  MENU: [
    { x: -10, y: -100, w: 220, h: 100, text: "Start Game", style: 'success', action: () => {
      // window.g_renderLayerManager.enableLayer('entities');
      startGameTransition()
    } },
    // { x: -10, y: -50, w: 220, h: 80, text: "Tutorial", style: 'success', action: () => {
    //   importTerrainLP(
    //     "src/levels/gregg.json"
    //   )
    //   startGameTransition()
    // } },
    { x: -10, y: -10,  w: 220, h: 80, text: "Level Editor",    style: 'warning', action: () => GameState.goToLevelEditor() },
    { x: -10, y: 30,  w: 220, h: 80, text: "Import Level",    style: 'info', action: () => {
      window.g_renderLayerManager.disableLayer('entities');
      importTerrain();
    } },
    { x: -10, y: 70,  w: 220, h: 80, text: "Credits",    style: 'info', action: () => {
      console.log("Credits clicked...");
      GameState.setState("CREDITS");
      window.GameState.setState("CREDITS");
    }}, // Cannot be "Credits", becomes info
    // { x: -10, y: 70,  w: 180, h: 80, text: "Credots",    style: 'info', action: () => importTerrain() },
    // { x:-10,y:70, w:180, h:40, text: "Credits", style:'info', action:() => GameState.goToMenu() }
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

  creditsBut = loadImage("Classes/ui_new/additionalMenu/AntsCreditsButton.png")
  loadLBut = loadImage("Classes/ui_new/additionalMenu/AntsILButton.png")
  levelEditBut = loadImage("Classes/ui_new/additionalMenu/AntsLEButton.png")
  tutorialBut = loadImage("Classes/ui_new/additionalMenu/AntsTutorialButton.png")
}

// Initialize menu system
function initializeMenu() {
  titleTargetY = g_canvasY / 2 - 150 + DEFAULT_MENU_YOFFSET;
  loadButtons();
  soundManager.play("bgMusic");
  
  // Register callback to reload buttons when state changes
  GameState.onStateChange((newState, oldState) => {
    if (newState === "PLAYING") {
      soundManager.stop("bgMusic", true); // Use fade-out when transitioning to gameplay
    }
    if (newState === "MENU" || newState === "OPTIONS" || newState === "CREDITS") {
      loadButtons();
    }
  });
}

// Load buttons for current state
function loadButtons() {
  const centerX = g_canvasX / 2, centerY = g_canvasY / 2 + DEFAULT_MENU_YOFFSET;
    const currentState = GameState.getState();
    const configs = (MENU_CONFIGS[currentState] || MENU_CONFIGS.MENU);

    // Use a vertical container to auto-layout the buttons.
    // This preserves each config's width/height but constrains max width
    // and evenly spaces buttons vertically while keeping horizontal offsets
    // (btn.x) as small manual nudges if present.
  const container = new VerticalButtonList(centerX, centerY,
     { spacing: 8,
       maxWidth: Math.floor(g_canvasX * 0.55), 
       headerImg: menuImage, 
       headerScale: .6, 
       headerGap: 150, headerMaxWidth: 500 ,
      });
  const layout = container.buildFromConfigs(configs);
  menuButtons = layout.buttons;
  menuHeader = layout.header || null;

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

    // Float animation (sine wave)
    let floatOffset = Math.sin(millis() * 0.002) * 8;
    textAlign(CENTER, CENTER);
  
    // Draw logo instead of plain text
    imageMode(CENTER);
    const hx = g_canvasX / 2;
    const hy = menuHeader.y + menuHeader.h / 2 + floatOffset;
    image(menuHeader.img, hx, hy, menuHeader.w + 150, menuHeader.h + 100);
  
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
  if (window.GameState.currentState == "CREDITS" || GameState.isAnyState("CREDITS")) {
    // console.log("CREDITS FOUND") // Not called?
    drawCreditsMenu()
  }

  // console.log("RENDER MENU CALLED") // Is called...
  if (GameState.isAnyState("MENU", "OPTIONS", "DEBUG_MENU")) {
    drawMenu();
    // console.log("Passed checks...")
    // console.
    // if (GameState.isState("CREDITS") | GameState.isAnyState("CREDITS")) { // Never called...
      
    // }

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

function drawCreditsMenu() {
  push()
  let creditsScroll = 0;
  // background(15, 15, 20);

  // Scroll controls (mouse wheel or keys)
  if (keyIsDown(38)) creditsScroll += 5;   // up arrow
  if (keyIsDown(40)) creditsScroll -= 5;   // down arrow
  creditsScroll = constrain(creditsScroll, -500, 300);

  // Title
  fill(255);
  textAlign(CENTER, TOP);
  textSize(48);
  text("Credits", g_canvasX / 2, 40 + creditsScroll);

  // Placeholder text
  textAlign(CENTER, TOP);
  textSize(22);
  fill(220);
  // pop()

  // Clickable link example
  // push()
  // let linkY = 130 + creditsScroll + 260; // adjust based on text position
  // if (mouseX > g_canvasX/2 - 150 && mouseX < g_canvasX/2 + 150 &&
  //     mouseY > linkY - 10 && mouseY < linkY + 20) {

  //     fill(120, 200, 255);
  //     if (mouseIsPressed) window.open("https://example.com", "_blank");
  // } else {
  //     fill(180, 220, 255);
  // }

  // text("[ GitHub Repository ]", g_canvasX/2, linkY);
  // pop()

  // push()
  const body = `
This game was created by:

David Willman, 
Alex Tregub, 
Colin Grant, 
Anthony Cruz, 
Alex Fabiku, 
Alex Zepp, 
Emmanuel Uka, 
Jack Miller, 
Alex B

Special Thanks:
... (TBD)

For:
  `;

  text(body, g_canvasX / 2, 130 + creditsScroll);

  // Back button
  const bw = 200, bh = 60;
  const bx = g_canvasX / 2 - bw / 2;
  const by = g_canvasY - 120;

  const hover = mouseX > bx && mouseX < bx + bw &&
                mouseY > by && mouseY < by + bh;

  fill(hover ? color(80,180,80) : color(50,150,50));
  stroke(255);
  strokeWeight(1);
  rect(bx, by, bw, bh, 8);

  fill(255);
  textSize(26);
  textAlign(CENTER, CENTER);
  text("Back", g_canvasX / 2, by + bh / 2);

  if (hover && mouseIsPressed) {
    GameState.goToMenu();
  }
  pop()
}