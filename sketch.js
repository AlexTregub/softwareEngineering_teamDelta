let canvasX = 800;
let canvasY = 800;

function preload(){
  terrainPreloader()
  Ants_Preloader()
}

////// MAIN
function setup() {
  createCanvas(canvasX, canvasY);
  Ants_Spawn(50)
}

function draw() {
  terrainInit();
  Ants_Update();
  
  
}
