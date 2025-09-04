let initialize = false;
let canvasX = 800;
let canvasY = 800;
let gridList = {};

let seed;
let map; // Must be global?

let grassImg;
let dirtImg;
function preload(){
  grassImg = loadImage('Images/grass.jpg');
  dirtImg = loadImage('Images/dirt.png');
}


////// TERRAIN
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
    this._materialConf = { // All-in-one configuration object. TODO: MAKE EXTERNAL TO AVOID COPIES
      // FIRST ITEM IS PROBABILITY, SECOND IS RENDER FUNCTION
      // NOTE: PROBABILITIES SHOULD BE IN ORDER: LEAST->GREATEST. 'REAL' PROBABILITY IS target - prev.
      // LAST IS DEFAULT aka PROB=1
      'dirt' : [0.4 , () => image(dirtImg, this._x, this._y, this._squareSize, this._squareSize)],
      'grass' : [1 , () => image(grassImg, this._x, this._y, this._squareSize,this._squareSize)],
    };
  }
 


  //// Access/usage
  randomizeMaterial() { // Will select random material for current tile. No return.
    let selected = random(); // [0-1)
    for (let checkMat in this._materialConf) {
      if (selected < this._materialConf[checkMat][0]) { // Fixed less-than logic
        this._materialSet = checkMat;
        return;
      }
    }
  }

  getMaterial() {
    return this._materialSet;
  }
  
  setMaterial(matName) { // Returns success / fail.
    if (this._materialConf[matName]) {
      this._materialSet = matName;
      return true;
    }
    return false;
  }

  render() { // Render, previously draw
    this._materialConf[this._materialSet][1](); // Call render lambda
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

    // Testing setTile:
    // map.setTile(0,0,'dirt');
    // map.setTile(0,1,'dirt');
    // map.setTile(1,0,'dirt');

    // Testing getTile:
    // console.log(map.getTile(0,0));

    initialize = true;
  }

  map.render(); // Each call will re-render configuration of map
}

