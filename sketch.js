let CANVAS_X = 200; // Default 800
let CANVAS_Y = 200; // Default 800
let TILE_SIZE = 100; //  Default 32

let SEED;
let MAP;

function preload(){
  terrainPreload();
  Ants_Preloader();
}

////// MAIN
function setup() {
  createCanvas(CANVAS_X, CANVAS_Y);

  //// Configure Terrain - keep in setup.
  // Terrain init SHOULD be handled transparently, as MAP object access may be needed
  SEED = hour()*minute()*floor(second()/10); // Have seed change every 10 sec.

  MAP = new Terrain(CANVAS_X,CANVAS_Y,TILE_SIZE); // Moved conversion to Terrain/Coordinate classes
  MAP.randomize(SEED); // Randomize with set seed

  MAP.render();
  //// 

  Ants_Spawn(50);

  //// TESTING:
  CS = new CoordinateSystem(round(CANVAS_X/TILE_SIZE),round(CANVAS_Y/TILE_SIZE),CANVAS_X,CANVAS_Y,TILE_SIZE);
}

function draw() {
  Ants_Update();

  //// TESTING:
  temp = CS.convCanvas(mouseX,mouseY);
  temp2 = CS.convPos(temp[0],temp[1]);
  temp3 = [round(temp[0]),round(temp[1])];
  print(temp3[0],temp3[1], " || ",temp[0],temp[1]," || ",temp2[0],temp2[1],);
}
