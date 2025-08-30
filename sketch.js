let initialize = false;
let canvasX = 400;
let canvasY = 400;

class Grid {
  constructor(x,y){
    this.x = x;
    this.y = y;
    this.gridSize = 20;
  }

  getMaterial(){
    let materials = {'grass':500,'dirt':200,'apple':20,'berry':20};
    let totalRarity = 0;

    for (let rarity in materials){
      totalRarity += materials[rarity];
    }

    let randomValue = random() * totalRarity;
    for(let rarity in materials){
      randomValue -= materials[rarity];
      if(randomValue <= 0){
        return rarity;
      }
    }

    return 'grass';
  }
  draw(){
    let material = "grass";
    square(this.x,this.y,this.gridSize);
  }
}

function mouseClicked(){
  fill(255);
  square(mouseX,mouseY,50);
}

function loadMap() {
  let gridSize = canvasX/20; // How much grids you want
  let gridDiameter = 20; // Size of the grids

  for(let i = 0; i < gridSize; ++i){
    for(let j = 0; j < gridSize; ++j){
      let object = new Grid(i*gridDiameter,j*gridDiameter);
      object.draw();
    }
  }
}

function setup() {
  createCanvas(canvasX, canvasY);
}

function draw() {
  if(!initialize){
    loadMap()
    initialize = false;
  }

}

