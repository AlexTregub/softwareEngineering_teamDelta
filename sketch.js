let initialize = false;
let canvasX = 400;
let canvasY = 400;
let gridList = {};

let grassImg;
let dirtImg;
function preload(){
  grassImg = loadImage('Images/grass.jpg');
  dirtImg = loadImage('Images/dirt.png');
}


class Grid {
  constructor(x,y,gridSize){
    this.x = x;
    this.y = y;
    this.gridSize = gridSize;
    this.materials = {'grass':500,'dirt':250}; // Material Rarity
    this.materialImages = {
      'grass': () => image(grassImg, this.x, this.y),
      'dirt': () => image(dirtImg, this.x, this.y)
    };
  }

  setMaterial(material){
    if(this.materialImages[material]){
      this.materialImages[material]();
    }
  }

  getMaterial(){
    let totalRarity = 0;
    for (let rarity in this.materials){
      totalRarity += this.materials[rarity];
    }

    let randomValue = random() * totalRarity;
    for(let materialType in this.materials){
      randomValue -= this.materials[materialType];
      if(randomValue <= 0){
        return materialType;
      }
    }
    return 'grass';
  }


  
  draw(){
    let randomMaterial = this.getMaterial();
    this.setMaterial(randomMaterial);
    // square(this.x,this.y,this.gridSize);
  }
}

// Logic needs checked to prevent overlapping
function loadMap() {
  let gridCount = 20;
  let gridSize = canvasX/gridCount;

  for(let i = 0; i < gridSize; ++i){
    for(let j = 0; j < gridSize; ++j){
      let object = new Grid(i*gridSize,j*gridSize,gridSize);
      object.draw();
      gridList[object] = (object.x,object.y); // ??? Use to refrence back to a specific grid
    }
  }
}

function setup() {
  createCanvas(canvasX, canvasY);
}



function draw() {
  if(!initialize){
    loadMap()
    initialize = true;
  }

}

