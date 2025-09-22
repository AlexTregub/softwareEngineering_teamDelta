let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
const TILE_SIZE = 32; //  Default 32
const NONE = '\0'; 

let SEED;
let MAP;
let GRIDMAP;
let COORDSY

let font;
let recordingPath

function preload(){
  test_stats();
  terrainPreloader()
  Ants_Preloader()
  Resources_Preloader();

  // So far working...
  // testGridUtil();
  // testGridResizeAndConsequences();
  font = loadFont("../Images/Assets/Terraria.TTF");
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
    handleMouseReleased(ants);
  }
}

// KEYBOARD INTERACTIONS
function keyPressed() {
  if (keyCode === ESCAPE) {
    if (typeof deselectAllEntities === 'function') {
      deselectAllEntities();
    }
  }
}

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
  //// 
  initializeMenu();  // Initialize the menu system

  // Spawn some ants
  Ants_Spawn(15);
  Ants_SpawnEnemies(20);
  Resources_Spawn(20);
}

function draw() {
  MAP.render();
  
  // Debug: Check game state
  if (frameCount % 60 === 0) { // Log once per second
    console.log(`Game state: ${gameState}, isInGame: ${isInGame()}`);
  }
  
  if (isInGame()) {
    Ants_Update(); // This now handles both player and enemy ants
    Resources_Update();
  }

  /*pos.add(vel);

  if (pos.y < 0){
    pos.y = CANVAS_Y;
  }*/


  if (typeof drawSelectionBox === 'function') {
    drawSelectionBox();
  }
  drawDebugGrid(tileSize, GRIDMAP.width, GRIDMAP.height);
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
  Resources_Update();
  if (typeof drawSelectionBox === 'function') drawSelectionBox();
  drawDebugGrid(TILE_SIZE, GRIDMAP.width, GRIDMAP.height);

  // Draw fade overlay if transitioning
  drawFadeOverlay();
}
