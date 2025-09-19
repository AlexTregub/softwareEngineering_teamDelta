let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
const TILE_SIZE = 35; //  Default 35
const NONE = '\0'; 

let SEED;
let MAP;
let GRIDMAP;
let COORDSY


let recordingPath

function preload(){
  test_stats();
  terrainPreloader()
  Ants_Preloader()
  Resources_Preloader();

  // So far working...
  // testGridUtil();
  eAnts_Preloader()
  // testGridResize();
}
/*
function mousePressed() {
  if(!recordingPath){
    for (let i = 0; i < ants.length; i++) {
      if (ants[i].isMouseOver(mouseX, mouseY)) { //Eventually make it open some interface menu
        recordingPath = true;
        selectedAnt = ants[i];
        let antTileX = floor(selectedAnt.GetCenter().x / map._tileSize);
        let antTileY = floor(selectedAnt.GetCenter().y / map._tileSize);
        startTile = map._tileStore[map.conv2dpos(antTileX, antTileY)];
        return;
      }
      /*
      Eventually...
      Once an ant is clicked, makePath in the ants class is called
      and repeatedly draws lines to the corresponding grid tile
      repeatedly until a valid destination is clicked. Then it calls
      a movement function and the ant moves there.
      */
   /* }
  }
  if(recordingPath){
    let endTileX = floor(mouseX / map._tileSize);
    let endTileY = floor(mouseY / map._tileSize);
    endTile = map._tileStore[map.conv2dpos(endTileX, endTileY)];
    getPath(startTile, endTile);

    /*if(selectedAnt && endTile){
      selectedAnt.moveToLocation(endTile._x, endTile._y); //Moves ant directly to tile
    }*/
/*
    recordingPath = false;
    selectedAnt = null;
    startTile = null;
    return;
  }
} */

  // MOUSE INTERACTIONS
function mousePressed() {
  if (typeof handleMousePressed === 'function') {
    handleMousePressed(ants, mouseX, mouseY, Ant_Click_Control, selectedAnt, moveSelectedAntToTile, TILE_SIZE, mouseButton);
  }
}

function mouseDragged() {
  if (typeof handleMouseDragged === 'function') {
    handleMouseDragged(mouseX, mouseY, ants);
  }
}

function mouseReleased() {
  if (typeof handleMouseReleased === 'function') {
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
  CANVAS_X = windowWidth
  CANVAS_Y = windowHeight
  createCanvas(CANVAS_X, CANVAS_Y);

  //// Configure Terrain + Coordinate System - keep in setup.
  // Terrain init SHOULD be handled transparently, as MAP object access may be needed
  SEED = hour()*minute()*floor(second()/10); // Have seed change every 10 sec.

  MAP = new Terrain(CANVAS_X,CANVAS_Y,TILE_SIZE); // Moved conversion to Terrain/Coordinate classes
  MAP.randomize(SEED); // Randomize with set seed

  GRIDMAP = new PathMap(MAP);
  COORDSY = MAP.getCoordinateSystem(); // Get Backing canvas coordinate system
  COORDSY.setViewCornerBC(0,0); // Top left corner of VIEWING canvas on BACKING canvas, (0,0) by default. Included to demonstrate use. Update as needed with camera
  //// 

  Ants_Spawn(50);
  Resources_Spawn(20);
  eAnts_Spawn(20);
}
function draw() {
  MAP.render();
  Ants_Update();
  Resources_Update();
  eAnts_Update();

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