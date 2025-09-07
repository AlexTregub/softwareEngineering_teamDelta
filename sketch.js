let worldSize;
let bg;

// INIT
function preload(){ 
  worldSize = createVector(windowWidth*5,windowHeight*5)
  Ants_Preloader()
}

function setup() {
  createCanvas(worldSize.x,worldSize.y);
  setDefaultBackground()
  Ants_Spawn(1)
}

function draw() {
  Ants_Update();
}

// MOUSE FUNCTIONS
function mousePressed() {
  ants[0].debug_resolveMovement()
  Ants_moveAsGroup(10)
}


function windowResized() {
  resizeCanvas(worldSize.x, worldSize.y);
  setDefaultBackground();
}

function setDefaultBackground() {
  background(bg);
}


