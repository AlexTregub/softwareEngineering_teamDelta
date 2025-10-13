let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
const TILE_SIZE = 32; //  Default 35

const NONE = '\0'; 

let SEED;
let MAP;

let GRIDMAP;
let COORDSY;
let font;
let recordingPath;
let menuImage;
let playButton;
let optionButton;
let exitButton;
let infoButton;
let debugButton;
let cameraX = 0;
let cameraY = 0;
let cameraPanSpeed = 10;
let cameraZoom = 1;
const MIN_CAMERA_ZOOM = 0.5;
const MAX_CAMERA_ZOOM = 3;
const CAMERA_ZOOM_STEP = 1.1;
let cameraFollowEnabled = false;
let cameraFollowTarget = null;
function preload(){
  test_stats();
  terrainPreloader()
  Ants_Preloader()
  resourcePreLoad();
  font = loadFont("Images/Assets/Terraria.TTF");
  menuImage = loadImage("Images/Assets/Menu/ant_logo3.png");
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

// MOUSE INTERACTIONS
function mousePressed() {
  if (isInGame()) {  // only allow ant interactions in game
    originalConsoleLog("b");
    if (typeof handleMousePressed === 'function') {
      handleMousePressed(
        ants,
        mouseX,
        mouseY,
        Ant_Click_Control,
        selectedAnt,
        moveSelectedAntToTile,
        TILE_SIZE,
        mouseButton
      );
    }
  }

  // Handle menu button clicks
  if (isInMenu() || isInOptions()) {
    if (typeof handleMenuClick === 'function') {
      handleMenuClick();
    }
  }
}


function mouseDragged() {
  if (isInGame() && typeof handleMouseDragged === 'function') {
    handleMouseDragged(mouseX, mouseY, ants);
  }
}

function mouseReleased() {
  if (isInGame() && typeof handleMouseReleased === 'function') {
    handleMouseReleased(ants, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  }
}

// Debug functionality moved to debug/testing.js

// KEYBOARD INTERACTIONS
function keyPressed() {
  // Handle all debug-related keys (command line, dev console, test hotkeys)
  if (typeof handleDebugConsoleKeys === 'function' && handleDebugConsoleKeys(keyCode, key)) {
    return; // Debug key was handled, don't process further
  }
  
  if (keyCode === ESCAPE) {
    if (typeof deselectAllEntities === 'function') {
      deselectAllEntities();
    }
  }


}

function updateCamera() {
  originalConsoleLog(cameraX, cameraY);
  if(!isInGame()) return;
  let dx=0, dy=0;
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // Left arrow or 'A'
    originalConsoleLog("Left key is down");
    cameraX -= cameraSpeed;
    
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // Right arrow or 'D'
    originalConsoleLog("Right key is down");
    cameraX += cameraSpeed;
  }
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // Up arrow or 'W'
    cameraY -= cameraSpeed;
    originalConsoleLog("Up key is down");
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // Down arrow or 'S'
    cameraY += cameraSpeed;
    originalConsoleLog("Down key is down");
  }

  // if(dx||dy) {
  //   const maxX = max(0, MAP._xCount * TILE_SIZE - CANVAS_X);
  //   const maxY = max(0, MAP._yCount * TILE_SIZE - CANVAS_Y);
  //   cameraX = constrain(cameraX + dx, 0, maxX);
  //   cameraY = constrain(cameraY + dy, 0, maxY);
  //   COORDSY.setViewCornerBC(cameraX, cameraY);
  // }
}
// Command line functionality has been moved to debug/commandLine.js

////// MAIN
function setup() {
  CANVAS_X = windowWidth;
  CANVAS_Y = windowHeight;
  createCanvas(CANVAS_X, CANVAS_Y);

  SEED = hour()*minute()*floor(second()/10);

  MAP = new Terrain(CANVAS_X,CANVAS_Y,TILE_SIZE);
  MAP.randomize(SEED);
  COORDSY = MAP.getCoordinateSystem();
  COORDSY.setViewCornerBC(0,0);
  
  GRIDMAP = new PathMap(MAP);
  COORDSY = MAP.getCoordinateSystem(); // Get Backing canvas coordinate system
  COORDSY.setViewCornerBC(0,0); // Top left corner of VIEWING canvas on BACKING canvas, (0,0) by default. Included to demonstrate use. Update as needed with camera
  
  initializeMenu();  // Initialize the menu system
  setupTests(); // Call test functions from AntStateMachine branch
 
  Ants_Spawn(10);
  // Resources_Spawn(20);
}

// Global Currency Counter
function drawUI() {
  push(); 
  textFont(font); 
  textSize(24);
  fill(255);  // white text
  textAlign(LEFT, TOP);
  text("Food: " + globalResource.length, 10, 10);
  pop();
}

function setupTests() {
  // Any test functions can be called here
  // e.g. antSMtest();
  antSMtest(); // Test Ant State Machine
}

function draw() {
  console.log("t");
  background(0);

  // --- UPDATE MENU STATE ---
  updateMenu();

  // --- MENU / OPTIONS ---
  if (renderMenu()) {
    return; // menu rendered, stop here
  }

  // --- PLAYING ---
  if (GameState.isInGame()) {
    push();
    translate(-cameraX, -cameraY);

    MAP.render();
    Ants_Update();
    resourceList.drawAll();
    pop();

    if (typeof drawSelectionBox === 'function') drawSelectionBox();
    drawDebugGrid(TILE_SIZE, GRIDMAP.width, GRIDMAP.height);

    if (typeof drawDevConsoleIndicator === 'function') {
      drawDevConsoleIndicator();
    }
  
    if (typeof drawCommandLine === 'function') {
      drawCommandLine();
    }
    updateCamera();
    drawUI();
  }

  // --- FADE OVERLAY (works in both menu + game) ---
  if (GameState.isFadingTransition()) {
    const fadeAlpha = GameState.getFadeAlpha();
    if (fadeAlpha > 0) {
      fill(255, fadeAlpha);
      rect(0, 0, CANVAS_X, CANVAS_Y);
    }
    GameState.updateFade(10);
  }
}


function drawDebugGrid(tileSize, gridWidth, gridHeight) {
  stroke(100, 100, 100, 100); // light gray grid lines
  strokeWeight(1);
  noFill();
  console.log("t");
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      rect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // Highlight tile under mouse
  const tileX = Math.floor(mouseX / tileSize);
  const tileY = Math.floor(mouseY / tileSize);
  fill(255, 255, 0, 50); // transparent yellow
  noStroke();
  rect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);

  // Highlight selected ant's current tile
  if (selectedAnt) {
    const antTileX = Math.floor(selectedAnt.posX / tileSize);
    const antTileY = Math.floor(selectedAnt.posY / tileSize);
    fill(0, 255, 0, 80); // transparent green
    noStroke();
    rect(antTileX * tileSize, antTileY * tileSize, tileSize, tileSize);
  }
}

// Dev console indicator moved to debug/testing.js

// Command line drawing moved to debug/commandLine.js
