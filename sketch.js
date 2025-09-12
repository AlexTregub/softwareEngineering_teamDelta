let CANVAS_X = 600; // Default 800
let CANVAS_Y = 600; // Default 800
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

  // Ants_Spawn(50);

  //// TESTING:
  CS = new CoordinateSystem(round(CANVAS_X/TILE_SIZE),round(CANVAS_Y/TILE_SIZE),TILE_SIZE,150,150);
}

function draw() {
  Ants_Update();

  //// TESTING:
  temp = CS.convBackingCanvasToPos([mouseX,mouseY]);
  temp1 = CS.convPosToBackingCanvas(temp);
  // temp2 = CS.convCanvasToPos([mouseX,mouseY]);
  // temp3 = CS.convPosToCanvas(temp2);
  temp4 = CS.convPosToCanvas(temp);
  // print(temp1,temp,temp2,temp3,temp4);
  print(temp1,temp,temp4);
  // print(CS.convPosToCanvas([-1,-1]));
}
