let GRASS_IMAGE;
let DIRT_IMAGE;
let STONE_IMAGE;
let MOSS_IMAGE;

let xCount = 32;
let yCount = 32;
let tileSize = 32; // Adds up to canvas dimensions

// let PERLIN_RANGE = 10;
let PERLIN_SCALE = 0.08;

////// TERRAIN
// FIRST IN PAIR IS PROBABILITY, SECOND IS RENDER FUNCTION
// NOTE: PROBABILITIES SHOULD BE IN ORDER: LEAST->GREATEST. 'REAL' PROBABILITY IS (A_i - A_(i-1)).
// LAST IS DEFAULT aka PROB=1
let TERRAIN_MATERIALS = { // All-in-one configuration object.
  'stone' : [0.01, (x,y,squareSize) => {fill(77,77,77); strokeWeight(0);rect(x,y,squareSize,squareSize);}], // Example of more advanced lambda.
  'dirt' : [0.15, (x,y,squareSize) => image(DIRT_IMAGE, x, y, squareSize, squareSize)],
  'grass' : [1 , (x,y,squareSize) => image(GRASS_IMAGE, x, y, squareSize,squareSize)],
};

let TERRAIN_MATERIALS_RANGED = { // All-in-one configuration object. Range: [x,y)
  'moss_0' : [[0,0.3], (x,y,squareSize) => image(MOSS_IMAGE, x,y,squareSize,squareSize)],
  'moss_1' : [[0.375,0.4], (x,y,squareSize) => image(MOSS_IMAGE, x,y,squareSize,squareSize)],
  'stone' : [[0,0.4], (x,y,squareSize) => image(STONE_IMAGE, x,y,squareSize,squareSize)], // Example of more advanced lambda.
  'dirt' : [[0.4,0.525], (x,y,squareSize) => image(DIRT_IMAGE, x, y, squareSize, squareSize)],
  'grass' : [[0,1] , (x,y,squareSize) => image(GRASS_IMAGE, x, y, squareSize,squareSize)],
};

/**
 * Context-aware material renderer - renders materials to any p5.js context
 * This respects existing material definitions while enabling cache rendering
 * without global function overrides
 */
function renderMaterialToContext(materialName, x, y, size, context) {
  // Handle the context parameter - default to global if not provided
  const ctx = context || window;
  
  // Known material mappings (based on TERRAIN_MATERIALS_RANGED above)
  switch (materialName) {
    case 'moss_0':
    case 'moss_1':
      if (MOSS_IMAGE) {
        ctx.image(MOSS_IMAGE, x, y, size, size);
      } else {
        // Fallback color for moss
        ctx.fill(85, 107, 47);
        ctx.noStroke();
        ctx.rect(x, y, size, size);
      }
      break;
      
    case 'stone':
      if (STONE_IMAGE) {
        ctx.image(STONE_IMAGE, x, y, size, size);
      } else {
        // Fallback color for stone
        ctx.fill(128, 128, 128);
        ctx.noStroke();
        ctx.rect(x, y, size, size);
      }
      break;
      
    case 'dirt':
      if (DIRT_IMAGE) {
        ctx.image(DIRT_IMAGE, x, y, size, size);
      } else {
        // Fallback color for dirt
        ctx.fill(139, 69, 19);
        ctx.noStroke();
        ctx.rect(x, y, size, size);
      }
      break;
      
    case 'grass':
      if (GRASS_IMAGE) {
        ctx.image(GRASS_IMAGE, x, y, size, size);
      } else {
        // Fallback color for grass
        ctx.fill(34, 139, 34);
        ctx.noStroke();
        ctx.rect(x, y, size, size);
      }
      break;
      
    default:
      // Unknown material - use default grass appearance
      if (GRASS_IMAGE) {
        ctx.image(GRASS_IMAGE, x, y, size, size);
      } else {
        ctx.fill(100, 150, 100);
        ctx.noStroke();
        ctx.rect(x, y, size, size);
      }
  }
}


function terrainPreloader(){
  GRASS_IMAGE = loadImage('Images/16x16 Tiles/grass.png');
  DIRT_IMAGE = loadImage('Images/16x16 Tiles/dirt.png');
  STONE_IMAGE = loadImage('Images/16x16 Tiles/stone.png');
  MOSS_IMAGE = loadImage('Images/16x16 Tiles/moss.png');
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
  randomize(g_seed) { // Randomize all values via set g_seed
    randomSeed(g_seed); // Set global g_seed.

    for (let i = 0; i < this._xCount*this._yCount; ++i) {
      this._tileStore[i].randomizeMaterial(); // Rng calls should use global g_seed
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

  randomizePerlin(pos) {
    let newPos = [
      pos[0]*PERLIN_SCALE,
      pos[1]*PERLIN_SCALE
    ];
    let val = noise(newPos[0],newPos[1]);
    for (let checkMat in TERRAIN_MATERIALS_RANGED) {
      // Using [min,max)
      if (TERRAIN_MATERIALS_RANGED[checkMat][0][0] <= val && val < TERRAIN_MATERIALS_RANGED[checkMat][0][1]) {
        this._materialSet = checkMat;
        break;
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
    else if(this._materialSet == 'moss_0'){
      this.weight = 1;
    }
    else if(this._materialSet == 'moss_1'){
      this.weight = 1;
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
    TERRAIN_MATERIALS_RANGED[this._materialSet][1](pixelPos[0],pixelPos[1],this._squareSize);
    smooth();
  }
}
