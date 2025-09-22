let GRASS_IMAGE;
let DIRT_IMAGE;
let xCount = 32;
let yCount = 32;
let tileSize = 32; // Adds up to canvas dimensions

////// TERRAIN
// FIRST IN PAIR IS PROBABILITY, SECOND IS RENDER FUNCTION
// NOTE: PROBABILITIES SHOULD BE IN ORDER: LEAST->GREATEST. 'REAL' PROBABILITY IS (A_i - A_(i-1)).
// LAST IS DEFAULT aka PROB=1
let TERRAIN_MATERIALS = { // All-in-one configuration object.
  'stone' : [0.01, (x,y,squareSize) => {fill(77,77,77); strokeWeight(0);rect(x,y,squareSize,squareSize);}], // Example of more advanced lambda.
  'dirt' : [0.15, (x,y,squareSize) => image(DIRT_IMAGE, x, y, squareSize, squareSize)],
  'grass' : [1 , (x,y,squareSize) => image(GRASS_IMAGE, x, y, squareSize,squareSize)],
};


function terrainPreloader(){
  GRASS_IMAGE = loadImage('Images/16x16 Tiles/grass.png');
  DIRT_IMAGE = loadImage('Images/16x16 Tiles/dirt.png');
}

class Terrain {
  constructor(canvasX, canvasY, tileSize) {
    //// Config...
    this._canvasX = canvasX;
    this._canvasY = canvasY;

    // May result in partial-filling of canvas...
    this._xCount = round(this._canvasX/tileSize);
    this._yCount = round(this._canvasY/tileSize);
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

  // Imported from commit f7c2e00 on AF branch
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

  getCoordinateSystem() { // Return coordinate system, Backing canvas equivalent to View canvas
    return new CoordinateSystem(this._xCount,this._yCount,this._tileSize,0,0);
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
    this._weight = 1;
  }
 


  //// Access/usage
  randomizeMaterial() { // Will select random material for current tile. No return.
    let noiseScale = 0.1
    let noiseX = noiseScale * this._x;
    let noiseY = noiseScale * this._y;   

    let noiseValue = noise(noiseX,noiseY);
    for (let checkMat in TERRAIN_MATERIALS) {          
      if(TERRAIN_MATERIALS[checkMat][0] >= noiseValue){
        this._materialSet = checkMat;
        this.setMaterial();
        this.assignWeight(); //Makes sure each tile has a weight associated with terrain type
        return;
      }
    }
  }

  randomizeLegacy() { // Old code used for randomization, extracted from commit 8854cd2145ff60b63e8996bf8987156a4d43236d
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

  getWeight(){
    return this._weight;
  }

  assignWeight(){ //Sets weight depending on the material
    if(this._materialSet == 'grass'){
      this._weight = 1;
    }
    else if(this._materialSet == 'dirt'){
      this._weight = 3;
    }
    else if(this._materialSet == 'stone'){
      this._weight = 100;
    }
  }

  render() { // Render, previously draw
    noSmooth(); // prevents pixels from getting blurry as the image is scaled up
    TERRAIN_MATERIALS[this._materialSet][1](this._x,this._y,this._squareSize); // Call render lambda
    smooth();
    return;
  }

  render2(coordSys) {
    // coordSys.setViewCornerBC([0,0]);
    let pixelPos = coordSys.convPosToCanvas([this._x,this._y]);

    noSmooth();
    TERRAIN_MATERIALS[this._materialSet][1](pixelPos[0],pixelPos[1],this._squareSize);
    smooth();
  }
}
