class PathMap{
  constructor(terrain){
    // this._terrain = terrain; //Requires terrain(for weight, objects, etc.), only used in construction
    this._grid = new Grid( //Makes Grid for easy tile storage/access
      terrain._xCount, //Size of terrain to match
      terrain._yCount,
      [0,0],
      [0,0]
    );
    for(let y = 0; y < terrain._yCount; y++){
      for(let x = 0; x < terrain._xCount; x++){
        let node = new Node(terrain._tileStore[terrain.conv2dpos(x, y)], x, y); //Makes tile out of Tile object
        this._grid.setArrPos([x, y], node); //Stores tile in grid
      }
    }
    for(let y = 0; y < terrain._yCount; y++){
      for(let x = 0; x < terrain._xCount; x++){
        let node = this._grid.getArrPos([x,y]); //Makes tile out of Tile object
        node.setNeighbors(this._grid); //Stores tile in grid
      }
    }
  }
  
  getGrid(){
    return this._grid;
  }
}

class Node{
  constructor(terrainTile, x, y){
    this._terrainTile = terrainTile; //Uses Tile and x,y so it can easily find neighbors, know its own location, and have other stuff (know terrain type)
    this._x = x;
    this._y = y;

    this.id = `${x}-${y}`; //Used for easier access. Faster than searching 2D array
    this.neighbors = []; //Traversible neighbors (not walls)
    this.assignWall();
    this.weight = this._terrainTile.getWeight();
    this.reset();
  }
  reset(){
    this.f = 0; //Easier for resetting the map when finished travelling
    this.g = 0;
    this.h = 0; //Note, add a function to reset travelled tiles when a path is found
    this.previousStart = null;
    this.previousEnd = null;
  }

  assignWall(){
    if(this._terrainTile.getWeight() === 100){ //Calls from terrainTile just to avoid possible flip
      this.wall = true;
    }
    else{
      this.wall = false;
    }
  }

  setNeighbors(grid){
    for(let x = -1; x <= 1; x++){ // Checks previous, current, and next rows/columns
      for(let y = -1; y <= 1; y++){
        if (x == 0 && y == 0) continue; //Skips current node
        let nx = this._x + x;
        let ny = this._y + y; //Makes sure the sum is within bounds
        if (nx >= 0 && nx < grid._sizeX && ny >= 0 && ny < grid._sizeY){
          let neighbor = grid.getArrPos([nx,ny]);
          this.neighbors.push(neighbor);
        }
      }
    }
  }
  //Takes coordinates. If potential neighbor is in bounds, adds it
}

function wander(){
  /*Wandering:
      When an ant starts its first path:
        Wanders around aimlessly (Takes the shortest path?)
        Leaves pheromone related to its current task
  */

}

function intuitiveWander(){
  /*Intuitive Wandering:
      When the destination of the end path is known (queen gives direct order):
        Wander in the general direction of the destination (maybe use current A* with pheromones
          for faster pathfinding)
  */

}

////Problem: When an ant breaks off from a path to optimize, how do we make sure it doesn't just wander randomly again? Keep moving in same direction

function follow(){
  /*Following:
      When an ant smells to a related path:
        Follow the path to where the ant went
        Percent chance to branch from path to attempt optimization
  */
}

function track(){
  /*Tracking:
      When an ant smells a related pheromone trail:
        Check surrounding tiles:
          Follow the strongest smell direction (Should lead to trail)
          Choose one if multiple are identical
      Different ants track different trails:
        Warriors follow enemy trail or *maybe blood trail?*
        Scouts follow and make trails in order to optimize. (Should scouts be able to edit paths once something is found?)
        Farmers follow farming trails (aphid farms to collection base, maybe harvesting trails?)
      When ants idle:
        Do not track any smelled tiles
        Randomly wander around set node (city)
      If ants get to the end of path and find nothing:
        Wander nearby
        If nothing found, wander randomly
  */
}

function changeState(){
  /*Changing State
      When a path has no more purpose (original resources exhausted)...
      Should we delete the path?
        No! How else can ants get home?
        2 Choices:
          Ant sets state to returning and goes home
          Ant sets state to wandering and builds new path from old path like a tree
  */
}