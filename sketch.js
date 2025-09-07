let initialize = false;
let canvasX = 800;
let canvasY = 800;
let gridList = {};

let seed;
let map;

let grassImg;
let dirtImg;
function preload(){
  grassImg = loadImage('Images/grass.png');
  dirtImg = loadImage('Images/dirt.png');
}


////// TERRAIN
// FIRST IN PAIR IS PROBABILITY, SECOND IS RENDER FUNCTION
// NOTE: PROBABILITIES SHOULD BE IN ORDER: LEAST->GREATEST. 'REAL' PROBABILITY IS (A_i - A_(i-1)).
// LAST IS DEFAULT aka PROB=1
let TERRAIN_MATERIALS = { // All-in-one configuration object.
  'stone' : [0.05, (x,y,squareSize) => {fill(77,77,77); strokeWeight(0);rect(x,y,squareSize,squareSize);}], // Example of more advanced lambda.
  'dirt' : [0.4 , (x,y,squareSize) => image(dirtImg, x, y, squareSize, squareSize)],
  'grass' : [1 , (x,y,squareSize) => image(grassImg, x, y, squareSize,squareSize)],
};

class Terrain {
  constructor(tileCountX, tileCountY, tileSize) {
    // Config...
    this._xCount = tileCountX;
    this._yCount = tileCountY;
    this._tileSize = tileSize;

    // Initialize 1d _tileStore
    this._tileStore = [];
    for (let j = 0; j < this._yCount; ++j) { // ... then Y...
      for (let i = 0; i < this._xCount; ++i) { // row of X first... ^
        this._tileStore.push( // Add tile to...
          new Tile(
            i*this._tileSize,j*this._tileSize, // x,y position conversion.
            this._tileSize
          )
        );
      }
    }
  }



  //// Utility
  conv2dpos(posX,posY) { // Converts 2d -> 1d position
    return posX + this._xCount*posY;
  }



  //// Access
  setTile(posX,posY,material) {
    return this._tileStore[this.conv2dpos(posX,posY)].setMaterial(material);
  }

  getTile(posX,posY) {
    return this._tileStore[this.conv2dpos(posX,posY)].getMaterial();
  }



  //// Usage
  randomize(seed) { // Randomize all values via set seed
    randomSeed(seed); // Set global seed.

    for (let i = 0; i < this._xCount*this._yCount; ++i) {
      this._tileStore[i].randomizeMaterial(this); // Rng calls should use global seed
    }
  }

  render() { // Render all tiles
    for (let i = 0; i < this._xCount*this._yCount; ++i) {
      this._tileStore[i].render();
    }
  }
}

class Tile { // Similar to former 'Grid'. Now internally stores material state.
  constructor(renderX,renderY,tileSize) {
    // Internal coords
    this._x = renderX;
    this._y = renderY;

    this._squareSize = tileSize;

    // Texture Properties
    this._materialSet = 'grass'; // Used for storage of randomization. Initialized as default value for now
  }
 


  //// Access/usage
  // Will select random material for current tile. No return.
  // Higher chance for dirty to appear near other dirt blocks
  randomizeMaterial(tile) { 
    let selected = random(); // [0-1)
    for (let checkMat in TERRAIN_MATERIALS) {
      if (selected < TERRAIN_MATERIALS[checkMat][0]) { // Fixed less-than logic
        this._materialSet = checkMat;
        break;
      }
    }


    let gridX = this._x/this._squareSize
    let gridY = this._y/this._squareSize

    if(gridX > 0){
      let leftTile = tile.getTile(gridX-1,gridY);
      if(leftTile == 'dirt'){
        if(random() < 0.4){
          this._materialSet = "dirt";
        }
      }
      else if(leftTile == 'stone'){
        if(random() < 0.3){
          this._materialSet = "stone";
        }
      }
    }

    if(gridY > 0){
      let aboveTile = tile.getTile(gridX,gridY-1);
      if(aboveTile == 'dirt'){
        if(random() < 0.4){
          this._materialSet = "dirt";
        }
      }
      else if(aboveTile == 'stone'){
        if(random() < 0.3){
          this._materialSet = "stone";
        }
      }
    }

  }

  getMaterial() {
    return this._materialSet;
  }
  
  setMaterial(matName) { // Returns success / fail.
    if (TERRAIN_MATERIALS[matName]) {
      this._materialSet = matName;
      return true;
    }
    return false;
  }

  render() { // Render, previously draw
    TERRAIN_MATERIALS[this._materialSet][1](this._x,this._y,this._squareSize); // Call render lambda
    return;
  }
}



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