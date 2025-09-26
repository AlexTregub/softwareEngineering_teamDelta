let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
const TILE_SIZE = 32; //  Default 35
// --- CONTROLLER-BASED INPUT SYSTEM ---
let mouseController;
let selectionBoxController;

const NONE = '\0'; 

let SEED;
let MAP;

let GRIDMAP;
let COORDSY;
let font;
let recordingPath;

// Efficient tile-based interaction system
let tileInteractionManager;


function preload(){
  terrainPreloader();
  Ants_Preloader();
  resourcePreLoad();
  font = loadFont("Images/Assets/Terraria.TTF");
}


// --- CONTROLLER-BASED MOUSE INTERACTIONS ---
function mousePressed() {
  if (GameState.isInGame() && mouseController) {
    mouseController.handleMousePressed(mouseX, mouseY, mouseButton);
  }
}

function mouseDragged() {
  if (GameState.isInGame() && mouseController) {
    mouseController.handleMouseDragged(mouseX, mouseY);
  }
}

function mouseReleased() {
  if (GameState.isInGame() && mouseController) {
    mouseController.handleMouseReleased(mouseX, mouseY, mouseButton);
  }
}

// Debug functionality moved to debug/testing.js

// KEYBOARD INTERACTIONS

function keyPressed() {
  // Handle all debug-related keys (command line, dev console, test hotkeys)
  if (typeof handleDebugConsoleKeys === 'function' && handleDebugConsoleKeys(keyCode, key)) {
    return; // Debug key was handled, don't process further
  }
  if (keyCode === ESCAPE && selectionBoxController) {
    selectionBoxController.deselectAll();
  }
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

  // Initialize TileInteractionManager for efficient mouse input handling
  tileInteractionManager = new TileInteractionManager(CANVAS_X, CANVAS_Y, TILE_SIZE);

  // --- Initialize Controllers ---
  mouseController = new MouseInputController();
  AntsSpawn(10);
  selectionBoxController = SelectionBoxController.getInstance(mouseController, ants);

  initializeMenu();  // Initialize the menu system
  setupTests(); // Call test functions from AntStateMachine branch
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
  //antSMtest(); // Test Ant State Machine
}


function draw() {
  updateMenu(); // Update menu state and handle transitions
  
  // Render menu if active, otherwise render game
  if (renderMenu()) return;

  MAP.render();
  drawDebugGrid(TILE_SIZE, Math.floor(CANVAS_X / TILE_SIZE), Math.floor(CANVAS_Y / TILE_SIZE));
  AntsUpdate();
  resourceList.drawAll();

  if (selectionBoxController) { selectionBoxController.draw(); }
  if (typeof drawDevConsoleIndicator === 'function') { drawDevConsoleIndicator(); }
  if (typeof drawCommandLine === 'function') { drawCommandLine(); }

  if(recordingPath){
    // (Recording logic here if needed)
  }
}

function drawDebugGrid(tileSize, gridWidth, gridHeight) {
  stroke(100, 100, 100, 100); // light gray grid lines
  strokeWeight(1);
  noFill();

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      rect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // Highlight tile under mouse
  const tileX = Math.floor(mouseX / tileSize);
  const tileY = Math.floor(mouseY / tileSize);
  
  // Fill the tile with transparent yellow
  fill(255, 255, 0, 50); // transparent yellow
  noStroke();
  rect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);
  
  // Add a border to make the tile more visible
  noFill();
  stroke(255, 255, 0, 150); // more opaque yellow border
  strokeWeight(2);
  rect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);
  
  // Show tile center dot to indicate where ant will move
  if (selectedAnt) {
    fill(255, 0, 0, 200); // red dot for movement target
    noStroke();
    const tileCenterX = tileX * tileSize + tileSize / 2;
    const tileCenterY = tileY * tileSize + tileSize / 2;
    ellipse(tileCenterX, tileCenterY, 6, 6);
  }

  // Highlight selected ant's current tile
  if (selectedAnt) {
    const pos = selectedAnt.getPosition();
    const antTileX = Math.floor(pos.x / tileSize);
    const antTileY = Math.floor(pos.y / tileSize);
    fill(0, 255, 0, 80); // transparent green
    noStroke();
    rect(antTileX * tileSize, antTileY * tileSize, tileSize, tileSize);
  }

  drawUI();
}