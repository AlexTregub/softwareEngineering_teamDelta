let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
const TILE_SIZE = 32; //  Default 35
const CHUNKS_X = 20;
const CHUNKS_Y = 20;

const NONE = '\0'; 

let SEED;
let MAP;
let MAP2;

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

function preload(){
  test_stats();
  terrainPreloader()
  Ants_Preloader()
  resourcePreLoad();
  font = loadFont("Images/Assets/Terraria.TTF");
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

// Command line functionality has been moved to debug/commandLine.js

////// MAIN
function setup() {
  CANVAS_X = windowWidth;
  CANVAS_Y = windowHeight;
  createCanvas(CANVAS_X, CANVAS_Y);

  SEED = hour()*minute()*floor(second()/10);

  MAP = new Terrain(CANVAS_X,CANVAS_Y,TILE_SIZE);
  // MAP.randomize(SEED); // ROLLED BACK RANDOMIZATION, ALLOWING PATHFINDING, ALL WEIGHTS SAME
  
  // New, Improved, and Chunked Terrain
  MAP2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,SEED,CHUNK_SIZE,TILE_SIZE,[CANVAS_X,CANVAS_Y]);
  MAP2.randomize(SEED);
  // MAP2.renderConversion._camPosition = [-0.5,0]; // TEMPORARY, ALIGNING MAP WITH OTHER..
  // MAP2.renderConversion._camPosition = [-72,-72]; // MOVEMENT OF VIEW EXAMPLE

  MAP2.renderConversion.alignToCanvas(); // Snaps grid to canvas 
  
  // COORDSY = MAP.getCoordinateSystem();
  // COORDSY.setViewCornerBC(0,0);
  
  GRIDMAP = new PathMap(MAP);
  COORDSY = MAP.getCoordinateSystem(); // Get Backing canvas coordinate system
  COORDSY.setViewCornerBC(0,0); // Top left corner of VIEWING canvas on BACKING canvas, (0,0) by default. Included to demonstrate use. Update as needed with camera

  

  initializeMenu();  // Initialize the menu system
  setupTests(); // Call test functions from AntStateMachine branch
 
  Ants_Spawn(10);
  // Resources_Spawn(20);

  // Test conversions
  // console.log(MAP2.renderConversion.convCanvasToPos(MAP2.renderConversion.convPosToCanvas([10,10])));
  // console.log(MAP2.renderConversion.convCanvasToPos(MAP2.renderConversion.convPosToCanvas([0,0])));
  // console.log(MAP2.renderConversion.convCanvasToPos(MAP2.renderConversion.convPosToCanvas([-10,-10])));
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
  background(0);

  // --- UPDATE MENU STATE ---
  updateMenu();

  // --- MENU / OPTIONS ---
  if (renderMenu()) {
    return; // menu rendered, stop here
  }

  // --- PLAYING ---
  if (GameState.isInGame()) {
    // MAP2.renderConversion._camPosition = [ // MOVEMENT OF VIEW EXAMPLE
    //   MAP2.renderConversion._camPosition[0]+0.1,
    //   MAP2.renderConversion._camPosition[1]+0.1,
    // ];

    MAP2.render();
    Ants_Update();
    resourceList.drawAll();

    if (typeof drawSelectionBox === 'function') drawSelectionBox();
    drawDebugGrid(TILE_SIZE, GRIDMAP.width, GRIDMAP.height);

    if (typeof drawDevConsoleIndicator === 'function') {
      drawDevConsoleIndicator();
    }
  
    if (typeof drawCommandLine === 'function') {
      drawCommandLine();
    }

    drawUI();

    // Mouse -> Grid Position
    console.log(MAP2.renderConversion.convCanvasToPos([mouseX,mouseY]));
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
