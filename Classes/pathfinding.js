let openList = [];
let closedList = [];
let width = 0;
let height = 0;
let start;
let end;
let pathFound = false;
let rows = 0
let grid

function pathfindingPreload(){
  grid = new Array(rows);
}

function checkPoint(posX,posY){ //Makes sure a certain square is not a barrier
  let material = map.getTile()
  if (getTile(posX, posY) == 'badness'){ //Change later depending on map setup
    return false;
  }
  return true;
}
/* 
Assume that every path must be made from a point-and-click system.
Make similar to Civilization, where the path constantly updates
to treat the current mouse position as the end. Estimated Tile
Position = mouseX/tileSize, mouseY/tileSize. So a mouse at 600,400
when the size is 25 would be at tile (24, 16) (*which is translated
using the conv2dpos function). Then you can clickand set the path
to that location. Eventually have a system to save paths to avoid
recalculating (Reusing old paths). Maybe have a status check
variable in case a tile is changed between path usage.
The speed to travel a tile should be the weight * speed * bonus
multiplier. DO NOT JUST MEASURE BY WEIGHT. NOT ALL ANTS ARE
CREATED EQUAL
*/
class pathNode{
  constructor(i,j){
    this.i = i;
    this.j = j;
    this.f = 0; //Total Cost
    this.g = 0; //Cost from start
    this.h = 0; // Heuristic
    this.neighbors = []; //N,E,S,W Non-wall tiles
    this.wall = false;
    //this.weight = 1; Eventually
    this.prev = undefined; //To backtrack to start
  }

  setNeighbors(tileOfInterest){
    let i = this.i;
    let j = this.j;
    if(i > 0){
      this.neighbors.push(grid[i-1][j]);
    }
    if(i < rows-1){
      this.neighbors.push(grid[i+1][j]);
    }
    if(j > 0){
      this.neighbors.push(grid[i][j-1]);
    }
    if(j < columns-1){
      this.neighbors.push(grid[i][j+1]);
    }
  }
  //Takes coordinates. If potential neighbor is in bounds, adds it
}

function distanceFinder(start, end){
  return abs(start.i - end.i) + abs(start.j - end.j); //Manhattan distance formula
}

function makePath(endNode){
  let path = [];
  let temp = endNode;

  while (temp.prev){
    path.push(temp); //Adds path tile to path
    temp = temp.prev;
  }

  path.push(temp);

  for (let i = 0; i < path.length; i++){
    fill(0, 0, 255);
    noStroke();
    rect(path[i].j * width, path[i].i * height, width, height); //Paints path blue
  }
}

function getPath(startTile, endTile){
  if(!checkPoint(startTile) || !checkPoint(endTile)){ //Ensures start and end are valid
    return;
  }
  if(openList.length > 0){
    let lowestIndex = 0;
    for(let i = 0; i < openList.length; i++){
      if(openList[i].f < openList[lowestIndex].f){
        lowestIndex = i;
        //Changes lowest traversal time index if next is shorter
      }
    }
    let current = openList[lowestIndex]; //Prioritizes shortest

    if(current == end){
      pathFound = true;
      noLoop();
    }
    openList.splice(lowestIndex, 1); //Moves once checked
    closedList.push(current); 

    for(let neighbor of current.neighbors){
      if(!closedList.includes(neighbor)){
        if(!neighbor.wall){ //If not explored and traversible
          let possibleG = current.g+1; //+1 tiles moved
          let changePath = false;
          
          if(openList.includes(neighbor)){
            if(possibleG < neighbor.g){
              neighbor.g = possibleG;
              changePath = true;
              //If neighbor not checked and is faster, change path
            }
          }
          else{
            neighbor.g = possibleG;
            changePath = true;
            openList.push(neighbor);
            //If neighbor untouched, change path
          }
          if(changePath){
            neighbor.h = distanceFinder(neighbor, end);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.prev = current;
            //If path changed, recalculate distances
          }
        }
      }
    }
  }
  if(pathFound){
    makePath(end); //Builds and paints path once completed
  }
  if(!pathFound && openList.length == 0){
    noLoop();
    return;
  }
}
