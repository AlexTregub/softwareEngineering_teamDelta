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

  Ants_Spawn(50);
  Resources_Spawn(20);

  // Chunks testing...
  // testChunk = new Chunk([0,0],[0,0]);
  // testChunk2 = new Chunk([1,0],[CHUNK_SIZE,0]);
  // testChunk.randomize(1);
  // testChunk2.randomize(1);
  // testCoord = new CoordinateSystem(CHUNK_SIZE*2,CHUNK_SIZE,TILE_SIZE,0,0);

  // Testing grid Terrain:
  temp = new gridTerrain(10,10,0);
  temp.printDebug();
}

function draw() {
  MAP.render();
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
  MAP.render();
  Ants_Update();
  Resources_Update();
  if (typeof drawSelectionBox === 'function') drawSelectionBox();
  drawDebugGrid(TILE_SIZE, GRIDMAP.width, GRIDMAP.height);

  // Draw fade overlay if transitioning
  drawFadeOverlay();

  // Chunks testing...
  // clear();
  // testCoord.setViewCornerBC([0,0]);
  // testChunk.render(testCoord);
  // testChunk2.render(testCoord);

  // Chunked-terrain
  clear();
  // delay(100);
  let tempVar = temp.renderConversion._camPosition;
  // print(tempVar);
  temp.renderConversion._camPosition = [
    tempVar[0]+0.1,
    tempVar[1]+0.1
  ]

  
  background(0,0,0);
  temp.render();
}