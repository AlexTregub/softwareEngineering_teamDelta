let canvasX = 800;
let canvasY = 800;

function preload(){
  terrainPreloader()
  Ants_Preloader()
}

function mousePressed() {
  for (let i = 0; i < ants.length; i++) {
    if (ants[i].isMouseOver(mouseX, mouseY)) { //Eventually make it open some interface menu
      ants[i].moveToLocation(mouseX + 50, mouseY + 50);
      return; // Stop after first match
    }
  }
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
