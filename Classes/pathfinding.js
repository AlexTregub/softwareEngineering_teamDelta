let start, end;
let path = [];
let currentStart, currentEnd;

let openSetStart, openSetEnd;
let openMapStart, openMapEnd;

let meetingNode = null;

class PathMap{
  constructor(terrain){
    this._terrain = terrain; //Requires terrain(for weight, objects, etc.)
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
  }
  
  getGrid(){
    return this._grid;
  }
}

class Node{
  constructor(terrainTile, x, y){
    this._terrainTile = terrainTile;
    this._x = x;
    this._y = y;

    this.id = `${x}-${y}`;
    this.neighbors = [];
    this.assignWall();
    this.weight = this._terrainTile.getWeight();
    this.reset();
  }
  reset(){
    this.f = 0;
    this.g = 0;
    this.h = 0;
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
    for(let x = -1; x <= 1; x++){
      for(let y = -1; y <= 1; y++){
        if (x == 0 && y == 0) continue;
        let nx = this._x + x;
        let ny = this._y + y;
        if (nx >= 0 && nx < columns && ny >= 0 && ny < rows){
          this.neighbors.push(grid[nx][ny]);
        }
      }
    }
  }
  //Takes coordinates. If potential neighbor is in bounds, adds it
}

function distanceFinder(start, end){
  dx = abs(start._x - end._x);
  dy = abs(start._y - end._y);
  return dx + dy + (Math.SQRT2 - 2) * min(dx,dy); //All 8 directions
}

/*function mousePressed() {
  let i = floor(mouseX / tWidth);
  let j = floor(mouseY / tHeight);
  if (i >= 0 && i < columns && j >= 0 && j < rows) {
    let target = grid[i][j];
    if (target.wall) return;
    end = target;
    resetSearch();
  }
}*/

function makePath(endNode){
  const pathStart = [];
  let temp = endNode;
  while(temp){
    pathStart.push(temp);
    temp = temp.previousStart;
  }
  pathStart.reverse();

  const pathEnd = [];
  temp = endNode.previousEnd;
  while (temp){
    pathEnd.push(temp); //Adds path tile to path
    temp = temp.previousEnd;
  }
  return pathStart.concat(pathEnd);
}

function expandNeighbors(current, openSet, openMap, closedSet, target, fromStart) {
  for (let neighbor of current.neighbors) {
    if (closedSet.has(neighbor.id) || neighbor.wall) continue;

    let tempG = current.g + neighbor.weight * distanceFinder(current, neighbor);

    let newPath = false;
    if (!openMap.has(neighbor.id)) {
      newPath = true;
    } else if (tempG < neighbor.g) {
      newPath = true;
    }

    if (newPath) {
      neighbor.g = tempG;
      neighbor.h = distanceFinder(neighbor, target);
      neighbor.f = neighbor.g + neighbor.h;

      if (fromStart) neighbor.previousStart = current;
      else neighbor.previousEnd = current;

      if (!openMap.has(neighbor.id)) {
        openSet.push(neighbor);
        openMap.set(neighbor.id, neighbor);
      }
    }
  }
}

function resetSearch(pathMap){
  let grid = pathMap.getGrid();
  const sizeX = grid._sizeX;
  const sizeY = grid._sizeY;
  for(let x = 0; x < sizeX; x++){
    for(let y = 0; y < sizeY; y++){
      const spot = grid.getArrPos([x,y]);
      spot.reset();
    }
  }
  openSetStart = new BinaryHeap();
  openSetEnd = new BinaryHeap();
  openMapStart = new Map();
  openMapEnd = new Map();
  closedSetStart = new Set();
  closedSetEnd = new Set();

  start.g = 0;
  start.f = distanceFinder(start, end);
  end.g = 0;
  end.f = distanceFinder(end, start);
  openSetStart.push(start);
  openMapStart.set(start.id,start);
  openSetEnd.push(end);
  openMapEnd.set(end.id,end);
  path = [];
  meetingNode = null;
  loop();
}

class BinaryHeap {
  constructor() {
    this.items = [];
  }

  push(element) {
    this.items.push(element);
    this.bubbleUp(this.items.length - 1);
  }

  pop() {
    const min = this.items[0];
    const end = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = end;
      this.sinkDown(0);
    }
    return min;
  }

  bubbleUp(n) {
    const element = this.items[n];
    while (n > 0) {
      let parentN = Math.floor((n - 1) / 2);
      let parent = this.items[parentN];
      if (element.f >= parent.f) break;
      this.items[parentN] = element;
      this.items[n] = parent;
      n = parentN;
    }
  }

  sinkDown(n) {
    const length = this.items.length;
    const element = this.items[n];

    while (true) {
      let leftN = 2 * n + 1;
      let rightN = 2 * n + 2;
      let swap = null;

      if (leftN < length) {
        let left = this.items[leftN];
        if (left.f < element.f) swap = leftN;
      }

      if (rightN < length) {
        let right = this.items[rightN];
        if ((swap === null && right.f < element.f) ||
            (swap !== null && right.f < this.items[swap].f)) {
          swap = rightN;
        }
      }

      if (swap === null) break;
      this.items[n] = this.items[swap];
      this.items[swap] = element;
      n = swap;
    }
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

function draw(){
  background(255);
  if(!openSetStart.isEmpty() && !openSetEnd.isEmpty()){
    currentStart = openSetStart.pop();
    openMapStart.delete(currentStart.id);
    closedSetStart.add(currentStart.id);

    currentEnd = openSetEnd.pop();
    openMapEnd.delete(currentEnd.id);
    closedSetEnd.add(currentEnd.id);

    if(closedSetEnd.has(currentStart.id)){
      meetingNode = currentStart;
      noLoop();
    }
    if(closedSetStart.has(currentEnd.id)){
      meetingNode = currentEnd;
      noLoop();
    }
    expandNeighbors(currentStart, openSetStart, openMapStart, closedSetStart, end, true);
    expandNeighbors(currentEnd, openSetEnd, openMapEnd, closedSetEnd, start, false);
  }
  else{
    noLoop();
    return;
  }
  if(meetingNode){
    path = makePath(meetingNode);
    stroke(0, 0, 255);
    strokeWeight(tWidth / 2);
    noFill();
    beginShape();
    for(let p of path){
      vertex(p.i*tWidth + tWidth/2, p.j*tHeight + tHeight/2)
    }
    endShape();
  }
}
