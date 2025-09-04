let initialize = false;
let canvasX = 800;
let canvasY = 800;
let gridList = {}; // {'x_y' : Grid object}

let grassImg;
let dirtImg;

function preload() {
  grassImg = loadImage('Images/grass.png');
  dirtImg = loadImage('Images/dirt.png');


}

function coordKey(x, y) {
  return `${x}_${y}`;
}

class Grid {
  constructor(x, y, gridSize) {
    this.x = x;
    this.y = y;
    this.gridSize = gridSize;
    this.materials = { 'grass': 50, 'dirt': 20,}; // Material Rarity
    this.material = this.getMaterial();
  }

  getMaterial() {
    let totalRarity = 0;
    for (let rarity in this.materials) {
      totalRarity += this.materials[rarity];
    }

    let randomValue = random() * totalRarity;
    for (let materialType in this.materials) {
      randomValue -= this.materials[materialType];
      if (randomValue <= 0) {
        return materialType;
      }
    }
    return 'grass';
  }

  draw() {
    // If neighbor is dirt, force this one to dirt
    let neighborsMaterials = [
      gridList[coordKey(this.x - this.gridSize, this.y)], 
      gridList[coordKey(this.x + this.gridSize, this.y)], 
      gridList[coordKey(this.x, this.y - this.gridSize)], 
      gridList[coordKey(this.x, this.y + this.gridSize)]  
    ];

    for (let n of neighborsMaterials) {
      if (n && n.material === 'dirt') {
        if (random() < 0.4) { 
          this.material = 'dirt';
        }
      }
    }


    // Draw image based on material
    if (this.material == 'grass') {
      image(grassImg, this.x, this.y, this.gridSize, this.gridSize);
    } else if (this.material == 'dirt') {
      image(dirtImg, this.x, this.y, this.gridSize, this.gridSize);
    }
  }
}

function loadMap() {
  let gridCount = 20;
  let gridSize = canvasX / gridCount;

  for (let i = 0; i < gridCount; ++i) {
    for (let j = 0; j < gridCount; ++j) {
      let object = new Grid(i * gridSize, j * gridSize, gridSize);
      gridList[coordKey(object.x, object.y)] = object;
    }
  }

  // Draw everything
  for (let key in gridList) {
    gridList[key].draw();
  }
}

function setup() {
  createCanvas(canvasX, canvasY);
}

function draw() {
  if (!initialize) {
    loadMap();
    initialize = true;
  }
}
