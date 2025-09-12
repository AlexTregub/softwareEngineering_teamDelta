let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
let TILE_SIZE = 32; //  Default 32

let SEED;
let MAP;
let COORDSY;

function preload(){
  terrainPreloader();
  Ants_Preloader();
}

////// MAIN
function setup() {
  createCanvas(CANVAS_X, CANVAS_Y);

  //// Configure Terrain + Coordinate System - keep in setup.
  // Terrain init SHOULD be handled transparently, as MAP object access may be needed
  SEED = hour()*minute()*floor(second()/10); // Have seed change every 10 sec.

  MAP = new Terrain(CANVAS_X,CANVAS_Y,TILE_SIZE); // Moved conversion to Terrain/Coordinate classes
  MAP.randomize(SEED); // Randomize with set seed

  COORDSY = MAP.getCoordinateSystem(); // Get Backing canvas coordinate system
  COORDSY.setViewCornerBC(0,0); // Top left corner of VIEWING canvas on BACKING canvas, (0,0) by default. Included to demonstrate use. Update as needed with camera

  MAP.render();
  //// 

  Ants_Spawn(50);
}

function draw() {
  Ants_Update();
}
