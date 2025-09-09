// let initialize = false;
let CANVAS_X = 800;
let CANVAS_Y = 800;
let TILE_SIZE = 50;
// let gridList = {};

let SEED;
let MAP;

let grassImg;
let dirtImg;
let bg;

function preload(){
  grassImg = loadImage('Images/grass.jpg');
  dirtImg = loadImage('Images/dirt.png');
  Ants_Preloader()
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
      this._tileStore[i].randomizeMaterial(); // Rng calls should use global seed
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
  randomizeMaterial() { // Will select random material for current tile. No return.
    let selected = random(); // [0-1)
    for (let checkMat in TERRAIN_MATERIALS) {
      if (selected < TERRAIN_MATERIALS[checkMat][0]) { // Fixed less-than logic
        this._materialSet = checkMat;
        return;
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
  createCanvas(CANVAS_X, CANVAS_Y);

  SEED = hour()*minute()*floor(second()/10); // Have seed change every 10 sec.

  MAP = new Terrain(round(CANVAS_X/TILE_SIZE),round(CANVAS_Y/TILE_SIZE),TILE_SIZE); // Hardcoded. In the future, make automatic.
  MAP.randomize(SEED); // Randomize with set seed

  MAP.render();

  Ants_Spawn(50)
}

function draw() {
  // if(!initialize){
  //   initialize = true; // REDUNDANT
  // }

  // MAP.render(); // Each call will re-render configuration of map
  Ants_Update();
}
