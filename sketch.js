let canvasX = 800;
let canvasY = 800;
let rows = 25;
let columns = 25;
let grid = new Array(rows);
let openList = [];
let closedList = [];
let width = 0;
let height = 0;
let start;
let end;
let pathFound = false;

class Tile{
  constructor(i,j){
    this.i = i;
    this.j = j;
    this.f = 0;
    this.g = 0;
    this.h = 0; 
    this.neighbors = []; //N,E,S,W Non-wall tiles
    this.wall = false;
    this.prev = undefined; //To backtrack to start

    this.wallChange = random(1);
    if(this.wallChange < 0.2){ //20% chance of a wall
      this.wall = true;
    }
  }

  setNeighbors(grid){
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

function makeGrid(){
  for(let i = 0; i < rows; i++){
    grid[i] = new Array(columns);
  }
  for(let i = 0; i < rows; i++){
    for(let j = 0; j < columns; j++){
      grid[i][j] = new Tile(i,j);
    }
  }
  for(let i = 0; i < rows; i++){
    for(let j = 0; j < columns; j++){
      grid[i][j].setNeighbors(grid);
    }
  }
  //Makes the grid, makes each tile a Tile(), and sets neighbors automatically
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

function setup(){
  createCanvas(canvasX, canvasY);
  width = canvasX / columns;
  height = canvasY / rows; //Initializes size of tiles when painting
  makeGrid();
  start = grid[0][0];
  end = grid[rows-1][columns-1];
  start.wall = false;
  end.wall = false; //Makes sure start and end aren't walls. Change in game so not OOB
  openList.push(start);
}

function draw(){
  background(255);
  for (let i = 0; i < rows; i++){
    for (let j = 0; j < columns; j++){
      let tile = grid[i][j]; //Sets tile to current location
      if (tile.wall){
        fill(0);
      }
      else{
        fill(255);
      }
      stroke(0);
      rect(tile.j * width, tile.i * height, width, height);
      //Paints each tile white or black if a wall or not
    }
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

  for(let block of openList){
    fill(0, 255, 0);
    rect(block.j * width, block.i * height, width, height);
  } //openList tiles green

  for(let block of closedList){
    fill(255, 0, 0);
    rect(block.j * width, block.i * height, width, height);
  } //closedList tiles red

  if(pathFound){
    makePath(end); //Builds and paints path once completed
  }

  fill(20, 255, 200);
  rect(start.j * width, start.i * height, width, height);
  fill(255, 20, 200);
  rect(end.j * width, end.i * height, width, height);
}
