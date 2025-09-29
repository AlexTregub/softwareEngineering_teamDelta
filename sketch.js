let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
let CHUNKS_X = 20;
let CHUNKS_Y = 20;
const TILE_SIZE = 32; //  Default 35

const NONE = '\0'; 

let SEED;
let MAP;
let MAP2;

let GRIDMAP;
let COORDSY;
let font;
let recordingPath

let testChunk;
let testChunk2;
let testCoord;
let temp;

function preload(){
  test_stats();
  terrainPreloader()
  Ants_Preloader()
  Resources_Preloader();

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

  SEED = hour()*minute()*floor(second()/30);

  MAP = new Terrain(CHUNKS_X*CHUNK_SIZE*TILE_SIZE/2,CHUNKS_Y*CHUNK_SIZE*TILE_SIZE/2,TILE_SIZE); // Only small quadrant is needed for full access. (Assuming camera does not move, otherwise will access out of bounds)
  // MAP.randomize(SEED); // ROLLED BACK RANDOMIZATION, ALLOWING PATHFINDING, ALL WEIGHTS SAME

  // New, Improved, and Chunked Terrain
  MAP2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,SEED,CHUNK_SIZE,TILE_SIZE,[CANVAS_X,CANVAS_Y]);
  MAP2.randomize(SEED);
  MAP2.renderConversion._camPosition = [-0.5,0]; // TEMPORARY, ALIGNING MAP WITH OTHER...

  // COORDSY = MAP.getCoordinateSystem();
  // COORDSY.setViewCornerBC(0,0);
  
  GRIDMAP = new PathMap(MAP);
  COORDSY = MAP.getCoordinateSystem(); // Get Backing canvas coordinate system
  COORDSY.setViewCornerBC(0,0); // Top left corner of VIEWING canvas on BACKING canvas, (0,0) by default. Included to demonstrate use. Update as needed with camera
  //// 
  initializeMenu();  // Initialize the menu system

  Ants_Spawn(50);
  Resources_Spawn(20);
}

function draw() {
  MAP2.render();
  Ants_Update();
  Resources_Update();
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
  MAP2.render();
  Ants_Update();
  Resources_Update();
  if (typeof drawSelectionBox === 'function') drawSelectionBox();
  drawDebugGrid(TILE_SIZE, GRIDMAP.width, GRIDMAP.height);

  // Draw fade overlay if transitioning
  drawFadeOverlay();
}