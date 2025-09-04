let initialize = false;
let canvasX = 800;
let canvasY = 800;
let gridList = {};

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
    return posX + tileCountX*posY;
  }



  //// Usage
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
      'dirt' : [0.1 , () => image(dirtImg, this._x, this._y, this._squareSize, this._squareSize)],
      'grass' : [1 , () => image(grassImg, this._x, this._y, this._squareSize,this._squareSize)],
    };
  }
 


  //// Access/usage
  randomizeMaterial() { // Will select random material for current tile. No return.
    let selected = random(); // [0-1)
    for (let checkMat in this._materialConf) {
      if (this._materialConf[checkMat][0] < selected) {
        this._materialSet = checkMat;
        return;
      }
    }
  }

  setMaterial(matName) { // Returns success / fail.
    if (this._materialConf[matName]) {
      _materialSet = matName;
      return true;
    }
    return false;
  }

  render() { // Render, previously draw
    this._materialConf[this._materialSet][1](); // Call render lambda
    return;
  }
}

// Logic needs checked to prevent overlapping
// function loadMap() {
//   let gridCount = 20;
//   let gridSize = canvasX/gridCount;

//   for(let i = 0; i < gridSize; ++i){
//     for(let j = 0; j < gridSize; ++j){
//       let object = new Grid(i*gridSize,j*gridSize,gridSize);
//       object.draw();
//       gridList[object] = (object.x,object.y); // ??? Use to refrence back to a specific grid
//     }
//   }
// }

function setup() {
  createCanvas(canvasX, canvasY);
}

function draw() {
  if(!initialize){
    // loadMap();
    let map = new Terrain(8,8,100); // Hardcoded. In the future, make automatic.

    initialize = true;
  }

  map.render(); // Each call will re-render configuration of map
}

