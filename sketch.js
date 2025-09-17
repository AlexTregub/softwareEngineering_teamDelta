let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
let TILE_SIZE = 32; //  Default 32

let SEED;
let MAP;
let COORDSY;

let recordingPath

function preload(){
  test_stats();
  terrainPreloader()
  Ants_Preloader()
  Resources_Preloader();
}

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

  COORDSY = MAP.getCoordinateSystem(); // Get Backing canvas coordinate system
  COORDSY.setViewCornerBC(0,0); // Top left corner of VIEWING canvas on BACKING canvas, (0,0) by default. Included to demonstrate use. Update as needed with camera
  //// 

  Ants_Spawn(10);
  ants[0].localDebug = true; // Enable local debug for the first ant
  Resources_Spawn(20);
}
function draw() {
  MAP.render();
  Ants_Update();
  Resources_Update();
  if (typeof drawSelectionBox === 'function') {
    drawSelectionBox();
  }
  if(recordingPath){

  }
}
