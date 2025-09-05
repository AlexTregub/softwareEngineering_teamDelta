let initialize = false;
let canvasX = 800;
let canvasY = 800;
let gridList = {};




////// MAIN
function setup() {
  createCanvas(canvasX, canvasY);
}

function draw() {
  if(!initialize){
    SEED = hour()*minute()*floor(second()/10); // Have seed change every 10 sec.

    MAP = new Terrain(8,8,100); // Hardcoded. In the future, make automatic.
    MAP.randomize(SEED); // Randomize with set seed

    initialize = true;
  }

  MAP.render(); // Each call will re-render configuration of map
}

