let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
const TILE_SIZE = 32; //  Default 35

const NONE = '\0'; 

let SEED;
let MAP;

let GRIDMAP;
let COORDSY;
let font;
let recordingPath

function preload(){
  test_stats();
  terrainPreloader()
  Ants_Preloader()
  resourcePreLoad();
  font = loadFont("Images/Assets/Terraria.TTF");
}

// MOUSE INTERACTIONS
function mousePressed() {
  if (isInGame()) {  // only allow ant interactions in game
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
  handleMenuClick();
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
  MAP.render();
  Ants_Update();
  if (typeof drawSelectionBox === 'function') {
    drawSelectionBox();
  }
  drawDebugGrid(tileSize, GRIDMAP.width, GRIDMAP.height);
  
  // Draw dev console indicator
  if (typeof drawDevConsoleIndicator === 'function') {
    drawDevConsoleIndicator();
  }
  
  // Draw command line interface
  if (typeof drawCommandLine === 'function') {
    drawCommandLine();
  }
  
  if(recordingPath){

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

function draw() {
  // Update menu state and handle transitions
  updateMenu();
  
  // Render menu if active, otherwise render game
  if (renderMenu()) {
    return; // Menu rendered, stop here
  }

  // --- GAMEPLAY RENDERING ---
  MAP.render();
  Ants_Update();
  resourceList.drawAll();
  if (typeof drawSelectionBox === 'function') drawSelectionBox();
  drawDebugGrid(TILE_SIZE, GRIDMAP.width, GRIDMAP.height);

  // Draw dev console indicator
  if (typeof drawDevConsoleIndicator === 'function') {
    drawDevConsoleIndicator();
  }
  
  // Draw command line interface
  if (typeof drawCommandLine === 'function') {
    drawCommandLine();
  }

  // Draw fade overlay if transitioning
  drawFadeOverlay();
      drawUI();

}

// Dev console indicator moved to debug/testing.js

// Command line drawing moved to debug/commandLine.js