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
    seed = hour()*minute()*floor(second()/10); // Have seed change every 10 sec.

    map = new Terrain(8,8,100); // Hardcoded. In the future, make automatic.
    map.randomize(seed); // Randomize with set seed

    initialize = true;
  }

  map.render(); // Each call will re-render configuration of map
}

