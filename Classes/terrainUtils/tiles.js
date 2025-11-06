let GRASS_IMAGE;
let DIRT_IMAGE;
let STONE_IMAGE;
let MOSS_IMAGE;
let CAVE_1_IMAGE;
let CAVE_2_IMAGE;
let CAVE_3_IMAGE;
let CAVE_EXDARK_IMAGE;
let CAVE_DIRT_IMAGE;
let WATER;
let WATER_CAVE;
let FARMLAND_IMAGE;

let tileSize = 32; // Adds up to canvas dimensions

let PERLIN_SCALE = 0.08;

let TERRAIN_MATERIALS_RANGED = { // All-in-one configuration object. Range: [x,y)
    'NONE' : [[0,0], (x,y,squareSize) => image(MOSS_IMAGE,x,y,squareSize,squareSize)],
    'cave_1' : [[0,0], (x,y,squareSize) => image(CAVE_1_IMAGE,x,y,squareSize,squareSize)],
    'cave_2' : [[0,0], (x,y,squareSize) => image(CAVE_2_IMAGE,x,y,squareSize,squareSize)],
    'cave_3' : [[0,0], (x,y,squareSize) => image(CAVE_3_IMAGE,x,y,squareSize,squareSize)],
    'cave_dark' : [[0,0], (x,y,squareSize) => image(CAVE_EXDARK_IMAGE,x,y,squareSize,squareSize)],
    'cave_dirt' : [[0,0], (x,y,squareSize) => image(CAVE_DIRT_IMAGE,x,y,squareSize,squareSize)],
    'water' : [[0,0], (x,y,squareSize) => image(WATER,x,y,squareSize,squareSize)],
    'water_cave' : [[0,0], (x,y,squareSize) => image(WATER_CAVE,x,y,squareSize,squareSize)],
    // 'farmland' : [[0,1] , (x,y,squareSize) => image(GRASS_IMAGE, x, y, squareSize,squareSize)], // Testing... ALL IS FARM
    'moss' : [[0,0.3], (x,y,squareSize) => image(MOSS_IMAGE, x,y,squareSize,squareSize)],
    'moss_1' : [[0.375,0.4], (x,y,squareSize) => image(MOSS_IMAGE, x,y,squareSize,squareSize)],
    'stone' : [[0,0.4], (x,y,squareSize) => image(STONE_IMAGE, x,y,squareSize,squareSize)], // Example of more advanced lambda.
    'dirt' : [[0.4,0.525], (x,y,squareSize) => image(DIRT_IMAGE, x, y, squareSize, squareSize)],
    'grass' : [[0,1] , (x,y,squareSize) => {image(GRASS_IMAGE, x, y, squareSize,squareSize)}],
  
    // Un-spawned materials, Needed for fallback rendering.
    'farmland' : [[0,0] , (x,y,squareSize) => image(GRASS_IMAGE, x, y, squareSize,squareSize)], 
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
    case 'moss':
    case 'moss_1':
      if (MOSS_IMAGE) {
        ctx.image(MOSS_IMAGE, x, y, size, size);
      }
      break;
      
    case 'stone':
      if (STONE_IMAGE) {
        ctx.image(STONE_IMAGE, x, y, size, size);
      }
      break;
      
    case 'dirt':
      if (DIRT_IMAGE) {
        ctx.image(DIRT_IMAGE, x, y, size, size);
      }
      break;
      
    case 'grass':
      if (GRASS_IMAGE) {
        ctx.image(GRASS_IMAGE, x, y, size, size);
      }
      break;

    case 'farmland':
      if (FARMLAND_IMAGE) {
        ctx.image(FARMLAND_IMAGE,x,y,size,size);
      }
      break;
      
    default:
      // Unknown material - use default grass appearance
      if (GRASS_IMAGE) {
        ctx.image(GRASS_IMAGE, x, y, size, size);
      }
  }
}

/**
 * Loads in terrain images declared in global scope
 */
function terrainPreloader(){
  GRASS_IMAGE = loadImage('Images/16x16 Tiles/grass.png');
  DIRT_IMAGE = loadImage('Images/16x16 Tiles/dirt.png');
  STONE_IMAGE = loadImage('Images/16x16 Tiles/stone.png');
  MOSS_IMAGE = loadImage('Images/16x16 Tiles/moss.png');
  CAVE_1_IMAGE = loadImage('Images/16x16 Tiles/cave_1.png');
  CAVE_2_IMAGE = loadImage('Images/16x16 Tiles/cave_2.png');
  CAVE_3_IMAGE = loadImage('Images/16x16 Tiles/cave_3.png');
  CAVE_DIRT_IMAGE = loadImage('Images/16x16 Tiles/cave_dirt.png');
  CAVE_EXDARK_IMAGE = loadImage('Images/16x16 Tiles/cave_extraDark.png');
  WATER = loadImage('Images/16x16 Tiles/water.png');
  WATER_CAVE = loadImage('Images/16x16 Tiles/water_cave.png');
  FARMLAND_IMAGE = loadImage('Images/16x16 Tiles/farmland.png');
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
  
      this._coordSysUpdateId = -1; // Used for render conversion optimizations
      this._coordSysPos = NONE;
      
      // Entity tracking
      this.entities = [];
      this.tileX = renderX;
      this.tileY = renderY;
      this.x = renderX * tileSize;
      this.y = renderY * tileSize;
      this.width = tileSize;
      this.height = tileSize;
    }
   
  
  
    //// Access/usage
    // Unused...
    // randomizeMaterial() { // Will select random material for current tile. No return.
    //   let noiseScale = 0.1
    //   let noiseX = noiseScale * this._x;
    //   let noiseY = noiseScale * this._y;   
  
    //   let noiseValue = noise(noiseX,noiseY);
    //   for (let checkMat in TERRAIN_MATERIALS) {          
    //     if(TERRAIN_MATERIALS[checkMat][0] >= noiseValue){
    //       // this._materialSet = checkMat; // What the fuck was I thinking....
    //       this.setMaterial(checkMat);
    //       this.assignWeight(); //Makes sure each tile has a weight associated with terrain type
    //       return;
    //     }
    //   }
    // }
  
    // randomizeLegacy() { // Old code used for randomization, extracted from commit 8854cd2145ff60b63e8996bf8987156a4d43236d
    //   let selected = random(); // [0-1)
    //   for (let checkMat in TERRAIN_MATERIALS) {
    //     if (selected < TERRAIN_MATERIALS[checkMat][0]) { // Fixed less-than logic
    //       this._materialSet = checkMat;
    //       return;
    //     }
    //   }
    // }
  
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
      if (TERRAIN_MATERIALS_RANGED[matName]) {
        this._materialSet = matName;
        return true;
      }
      return false;
    }
  
    getWeight(){
      return this._weight;
    }
  
    assignWeight(){ //Sets weight depending on the material
      switch(this._materialSet){
        case 'grass':
          this._weight = 1;
          break;
        case 'dirt':
          this._weight = 3;
          break;
        case 'stone':
          this._weight = 100;
          break;
        default:
          this._weight = 10;
          break;
      }
      
      // Old def...
      // if(this._materialSet == 'grass'){
      //   this._weight = 1;
      // }
      // else if(this._materialSet == 'dirt'){
      //   this._weight = 3;
      // }
      // else if(this._materialSet == 'stone'){
      //   this._weight = 100;
      // }
    }
  
    // render() { // Render, previously draw
    //   noSmooth(); // prevents pixels from getting blurry as the image is scaled up
    //   TERRAIN_MATERIALS[this._materialSet][1](this._x,this._y,this._squareSize); // Call render lambda
    //   smooth();
    //   return;
    // }
  
    render(coordSys) {
      // coordSys.setViewCornerBC([0,0]);
      if (this._coordSysUpdateId != coordSys.getUpdateId() || this._coordSysPos == NONE) {
        this._coordSysPos = coordSys.convPosToCanvas([this._x,this._y]);
        // console.log("Updating...")
        logNormal("updating tile...");
      }
      
      noSmooth();
      // console.log(this._coordSysPos)
      // console.log(this._squareSize)
      // console.log(TERRAIN_MATERIALS_RANGED[this._materialSet][1])
      TERRAIN_MATERIALS_RANGED[this._materialSet][1](this._coordSysPos[0],this._coordSysPos[1],this._squareSize);
      smooth();
    }
  
    toString() {
      return this._materialSet+'('+this._x+','+this._y+')';
    }
    
    // =========================================================================
    // Entity Tracking Methods
    // =========================================================================
    
    /**
     * Check if entity is on this tile
     * @param {Object} entity - Entity to check
     * @returns {boolean} True if entity is on tile
     */
    hasEntity(entity) {
      return this.entities.includes(entity);
    }
    
    /**
     * Add entity to this tile
     * @param {Object} entity - Entity to add
     */
    addEntity(entity) {
      if (!this.entities.includes(entity)) {
        this.entities.push(entity);
      }
    }
    
    /**
     * Remove entity from this tile
     * @param {Object} entity - Entity to remove
     */
    removeEntity(entity) {
      const index = this.entities.indexOf(entity);
      if (index !== -1) {
        this.entities.splice(index, 1);
      }
    }
    
    /**
     * Get all entities on this tile
     * @returns {Array} Copy of entities array
     */
    getEntities() {
      return [...this.entities];
    }
    
    /**
     * Get entity count on this tile
     * @returns {number} Number of entities
     */
    getEntityCount() {
      return this.entities.length;
    }
    
    /**
     * Get material property (alias for compatibility)
     * @returns {string} Material type
     */
    get material() {
      return this._materialSet;
    }
    
    /**
     * Set material property (alias for compatibility)
     * @param {string} value - Material type
     */
    set material(value) {
      this._materialSet = value;
    }
    
    /**
     * Get weight property (alias for compatibility)
     * @returns {number} Weight value
     */
    get weight() {
      return this._weight;
    }
    
    /**
     * Set weight property (alias for compatibility)
     * @param {number} value - Weight value
     */
    set weight(value) {
      this._weight = value;
    }
}