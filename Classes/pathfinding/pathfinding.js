let path = [];
let currentStart, currentEnd;

let openSetStart, openSetEnd;
let openMapStart, openMapEnd;

let meetingNode = null;

class PathMap{
  constructor(terrain){
    this._terrain = terrain; //Requires terrain(for weight, objects, etc.)
    this._grid = new Grid( //Makes Grid for easy tile storage/access
      // terrain._xCount, //Size of terrain to match
      // terrain._yCount,
      // this._terrain._tileSpanRange[0],
      // this._terrain._tileSpanRange[1], // BAD IDEA TO USE PRIVATE VARS, fuck it we ball 
      // this._terrain._tileSpan[0], // TL Position, private var access
      // [0,0]

      terrain._xCount, //Size of terrain to match
      terrain._yCount,
      [0,0]
    );

    for(let y = 0; y < terrain._yCount; y++){
      for(let x = 0; x < terrain._xCount; x++){
        let node = new Node(terrain._tileStore[terrain.conv2dpos(x, y)], x, y); //Makes tile out of Tile object
        this._grid.setArrPos([x, y], node); //Stores tile in grid
      }
    }


    logNormal("Pathfinding using "+this._grid.infoStr());

    this._gridSize = this._grid.getSize();
    // for(let y = 0; y < this._gridSize[1]; y++){ 
      // for(let x = 0; x < this._gridSize[0]; x++){
    //     let node = new Node(this._terrain.getArrPos([x,y]), x, y); //Makes tile out of Tile object
    //     this._grid.setArrPos([x, y], node); //Stores tile in grid
    //   }
    // }
    // for (let i = 0; i < this._gridSize[0]*this._gridSize[1]; ++i) { // 1d access is complicated due to no easy 1d -> 2d+2d pos
    //   // let posSquare = this._terrain.chunkArray
    //   let node = new Node()
    // }

    // for (let y = this._grid._spanTopLeft[1]; y > this._grid._spanBotRight[1]; --y) { // Respect y axis
    //   for (let x = this._grid._spanTopLeft[0]; x < this._grid._spanBotRight[0]; ++x) {
    //     let node = new Node(this._terrain.get([x,y]), x, y); //Makes tile out of Tile object
    //   }
    // }

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

class BinaryHeap { //Allows for an easy way to access the lowest-travel distance Node
  constructor() {
    this.items = []; //Empty tree
  }

  push(element) {
    this.items.push(element); //Adds element to the end of the array
    this.bubbleUp(this.items.length - 1); //Checks if it needs to be moved up the tree (lower than a parent)
  }

  pop() {
    const min = this.items[0]; //Lowest element
    const end = this.items.pop(); //Takes the last element and moves it to the top to properly handle old top
    if (this.items.length > 0) { //If more than one element
      this.items[0] = end; //Assigns the root as the bottom value
      this.sinkDown(0); //Moves it down if a child is less than
    }
    return min; //Return the old 
  }

  bubbleUp(n) {
    const element = this.items[n]; //Takes the value of index x
    while (n > 0) { //While there is a parent to compare to...
      let parentN = Math.floor((n - 1) / 2); //Gets the index value of the parent
      let parent = this.items[parentN]; //Gets the value at the paren'ts index
      if (element.f >= parent.f) break; //If the child is well-placed, end the sort
      this.items[parentN] = element; //Else swap the values
      this.items[n] = parent;
      n = parentN; //Move up the list
    }
  }

  sinkDown(n) {
    const length = this.items.length; //Length of tree
    const element = this.items[n]; //Gets element of interest

    while (true) {
      let leftN = 2 * n + 1; //Gets the index values of the children
      let rightN = 2 * n + 2;
      let swap = null;

      if (leftN < length) { //If left child exists
        let left = this.items[leftN]; 
        if (left.f < element.f) swap = leftN; //Swaps values if the child is less than
      }

      if (rightN < length) { //If right child exists
        let right = this.items[rightN];
        if ((swap === null && right.f < element.f) || //If swap is null and right child is less than
            (swap !== null && right.f < this.items[swap].f)) { //Or null exists but right child is less than that of the to-be-swapped value (grandchild is less than a parent, etc.)
          swap = rightN; //Change what swap is set to.
        }
      }

      if (swap === null) break;
      this.items[n] = this.items[swap]; //Swaps the child and parent function
      this.items[swap] = element;
      n = swap;
    } //Repeats until all parents are lower than all children
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

function distanceFinder(start, end){
  let dx = abs(start._x - end._x);
  let dy = abs(start._y - end._y);
  return dx + dy + (Math.SQRT2 - 2) * min(dx,dy); //All 8 directions
}

function makePath(endNode){
  const pathStart = []; //Starts from endNode (middle), travels both ways until at starts, and stitches together
  let temp = endNode;
  while(temp){
    pathStart.push(temp);
    temp = temp.previousStart;
  }
  pathStart.reverse();

  const pathEnd = [];
  temp = endNode.previousEnd;
  while (temp){
    pathEnd.push(temp); //Adds each final node to path
    temp = temp.previousEnd;
  }
  return pathStart.concat(pathEnd);
}

function expandNeighbors(current, openSet, openMap, closedSet, target, fromStart) {
  for (let neighbor of current.neighbors) {
    if (closedSet.has(neighbor.id) || neighbor.wall) continue; //If one of the neighbors is already searched or untraversible, skip

    let tempG = current.g + neighbor.weight * distanceFinder(current, neighbor); //Distance + weight + octile distance (diagonals take longer)

    let newPath = false;
    if (!openMap.has(neighbor.id)) { //If neighbor hasn't been checked, makes new path to check it
      newPath = true;
    } else if (tempG < neighbor.g) { //If faster than other neighbor, chooses the fastest
      newPath = true;
    }

    if (newPath) { //If tile changes
      neighbor.g = tempG; //Neighbor values change for next search
      neighbor.h = distanceFinder(neighbor, target);
      neighbor.f = neighbor.g + neighbor.h;

      if (fromStart){
        neighbor.previousStart = current; //Adds to path tile list depending on direction
      }
      else{
        neighbor.previousEnd = current;
      }

      if (!openMap.has(neighbor.id)) {
        openSet.push(neighbor); //Adds neighbor id to list of searched nodes
        openMap.set(neighbor.id, neighbor);
      }
    }
  }
}

function resetSearch(start, end, pathMap){
  let grid = pathMap.getGrid(); //Gets grid
  const sizeX = grid._sizeX;
  const sizeY = grid._sizeY;
  for(let x = 0; x < sizeX; x++){
    for(let y = 0; y < sizeY; y++){
      const spot = grid.getArrPos([x,y]);
      spot.reset(); //Resets grid values
    }
  }
  openSetStart = new BinaryHeap();
  openSetEnd = new BinaryHeap();
  openMapStart = new Map(); //Faster Loopup time
  openMapEnd = new Map();
  closedSetStart = new Set();
  closedSetEnd = new Set(); //All are recreated for easy reset

  //////// THIS FORMAT FOR A RESET IS ONLY BENEFICIAL WHEN A SINGLE ENTITY IS MOVING!!! IF USING A SHARED PATHMAP, RESET DIFFERENTLY
  //////// OTHERWISE EVERY ENTITY WOULD NEED ITS OWN map

  start.g = 0;
  start.f = distanceFinder(start, end);
  end.g = 0;
  end.f = distanceFinder(end, start);
  openSetStart.push(start);
  openMapStart.set(start.id,start); //Sets up map and set for use
  openSetEnd.push(end);
  openMapEnd.set(end.id,end);
  path = []; //Clears path
  meetingNode = null;
}

function findPath(start, end, pathMap){
  resetSearch(start, end, pathMap); //Resets map

  // NOTE: RESET IS IMPORTANT BECAUSE F G H ARE TIED TO THE TILES, NOT THE ANTS. IF AN ANT TRAVELLED ON A UNRESET TILE IT WOULD MESS WITH OTHER PATHS

  while(!openSetStart.isEmpty() && !openSetEnd.isEmpty()){ // While both sets have something to search
    let currentStart = openSetStart.pop(); //Removes item from searching
    openMapStart.delete(currentStart.id); //Removes item from map
    closedSetStart.add(currentStart.id); //Adds to search list

    let currentEnd = openSetEnd.pop(); //Same with other path
    openMapEnd.delete(currentEnd.id);
    closedSetEnd.add(currentEnd.id);

    if(closedSetStart.has(currentEnd.id)){
      return makePath(currentEnd);
    }

    if(closedSetEnd.has(currentStart.id)){ //If the end or start has the other path's currentNode in it's searched list...
      return makePath(currentStart); //Make the path
    }
    expandNeighbors(currentStart, openSetStart, openMapStart, closedSetStart, end, true); //Check all neighbors
    expandNeighbors(currentEnd, openSetEnd, openMapEnd, closedSetEnd, start, false);
  }
    return [];
}
