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

  conv1dpos(arrayPos) { // Converts 1d array access position -> 2d position. X = ...[0], Y = ...[1]
    return [arrayPos%this._xCount,floor(arrayPos/this._xCount)]; // Return X,Y from array pos
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
      this._tileStore[i].randomizeMaterial(this._tileStore); // Rng calls should use global seed
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
  randomizeMaterial(tileStore) { 
    let selected = random(); // [0-1)
    for (let checkMat in TERRAIN_MATERIALS) {
      if (selected < TERRAIN_MATERIALS[checkMat][0]) { // Fixed less-than logic
        this._materialSet = checkMat;
        break;
      }
    }

    
    for (let tile of tileStore) {
      let size = this._squareSize;
      let left = (tile._x == this._x - size && tile._y == this._y); //  if theres a tile to the left
      let above = (tile._x == this._x && tile._y == this._y - size);  // if theres a tile above

      if(left|| above){
        let rand = random();
        if (tile.getMaterial() == "dirt") {
          if(rand < 0.4){
            this._materialSet = "dirt";
            return; 
          }
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

    // TESTING CONVERSION FUNCS:
    // let pos2d = [7,7];
    // let pos1d = map.conv2dpos(pos2d[0],pos2d[1]);
    // print(pos2d);
    // print(pos1d);
    // pos2d = [0,0];
    // print(pos2d);
    // pos2d = map.conv1dpos(pos1d);
    // print(pos2d);
  }

  map.render(); // Each call will re-render configuration of map
}

