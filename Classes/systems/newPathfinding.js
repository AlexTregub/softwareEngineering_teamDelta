class PathMap{
  constructor(terrain){
    this._terrain = terrain; //Requires terrain(for weight, objects, etc.), only used in construction
    this._grid = new Grid( //Makes Grid for easy tile storage/access
      terrain._xCount, //Size of terrain to match
      terrain._yCount,
      [0,0],
      [0,0]
    );
    this._pGrid = new PheromoneGrid(terrain);
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
  /*Node
      Each Node should hold an empty map of pheromone types paired with strength. Ants use this class as a way to
      determine which direction to take (checks pheromone type/strength) and edit pheromones they deposit
  */
  constructor(terrainTile, x, y, pheromoneGrid){
    this._terrainTile = terrainTile; //Uses Tile and x,y so it can easily find neighbors, know its own location, and have other stuff (know terrain type)
    this._x = x;
    this._y = y;
    this.pGrid = pheromoneGrid;

    this.id = `${x}-${y}`; //Used for easier access. Faster than searching 2D array
    this.assignWall();
    this.weight = this._terrainTile.getWeight();
  }

  assignWall(){
    if(this._terrainTile.getWeight() === 100){ //Calls from terrainTile just to avoid possible flip
      this.wall = true;
    }
    else{
      this.wall = false;
    }
  } 
  
  addScent(antType, tag){ //Merge antType and tag into one in antBrain. Enemy-Forage
    this._pGrid.push(this._x,this._y, {type: tag, strength: 1, initial: 1, rate: 0.1}) //Change it so Ant Class has one single array? that holds all info (allegience, )
  }
  //Takes coordinates. If potential neighbor is in bounds, adds it
}

function wander(grid, node, travelled, ant, state){
  /*Wandering:
      When an ant starts its first path:
        Wanders around aimlessly (Takes the shortest path?)
        Leaves pheromone related to its current task
  */
  if(node.scents.length > 0 && !ant.avoidSmellCheck){
    let result = tryTrack(node.scents, ant.speciesName, travelled);
    if(result === 0){
      ant.avoidSmellCheck = true; //this should be implemented into Ant class. Ants stop checking smell (at least temp) once test failed
      return findBestNeighbor(grid, node, travelled);
    }
    else if(result != 0){
      ant.pathType = result; //This should be implemented into Ant class. Ants immediately go to tracking when following pheromones.
      return track();
    }
  }
  else{ //If no scent, wander to shortest tile
    node.addScent(state, this._faction);
    return findBestNeighbor(grid, node, travelled); //Implement travelled so it holds all previously travelled tiles in current journey. Resets once task finished. Make a Set
  }
  //May turn this into separate function like findBestNeighbor. If no pheromone, run findBestNeighbor for next move.
  //If pheromone exists, run pheromone probability function. If pheromone fails, run this. If pheromone passes, track();
  //Make sure the ant avoids pheromones for its entire wander time if probability fails
}

function findBestNeighbor(grid, node, travelled){
  let shortestDistance = Infinity;
  let x = node._x;
  let y = node._y;
  let bestNeighbor = null;

  for(let i = -1; i <= 1; i++){
    for(let j = -1; j <= 1; j++){
      if(i === 0 && j === 0) continue;

      let neighbor = grid.getArrPos([x+i, y+j]);
      if(neighbor && !travelled.has(neighbor.id)){ // Makes sure neighbor isn't previously travelled. Should be added to ant class
        if (neighbor.weight < shortestDistance){ //May need to replace with getWeight()
          shortestDistance = neighbor.weight;
          bestNeighbor = neighbor;
        }
      }
    }
  }
  travelled.add(node.id); //May want to set so travelled adds next tile instead of current
  return bestNeighbor;
}

function intuitiveWander(){
  /*Intuitive Wandering:
      When the destination of the end path is known (queen gives direct order):
        Wander in the general direction of the destination (maybe use current A* with pheromones
          for faster pathfinding)
  */

}

function tryTrack(scents, ant){ //Probably won't need last two
  /*Try Track
      Ant tries to check pheromones. Depending on ant type and state, higher chance for certain path following.
      If ant likes path, return 1 to have wander run track(). This should set an ant flag to true so that track is always run instead of wander when following trail.
      If ant rejects pheromone, return 0 to have wander run wander. This should set an ant flag to 'false' so the ant continues to make its own path using wander instead of constant smelling.
      If smelled trail type failed before, ignore. If unsmelled before, run calc.
  */
   //Switch statement for different ant types
    /*Different pheromone types
        Should be built on two factors: faction(enemy,neutral) and purpose
        Purposes:
          To forage - Placed after food found. Scout (foragers) prioritize this
          To home - Placed when walking from home.
          To farm - Placed by farmers. Farmer only trail since only they farm
          To enemy - Placed by ant when foreign pheromone detected. Trail when reporting location. Strong diffusion during combat. Prioritized by warriors and spitters
          To build - Placed by builders. Only used by builders since only they build
          Boss (Special) - All ants should follow. Diffuses instantly so all ants know
          Default - Unnamed trail
    */
  for(let i = 0; i < scents.length; i++){
    let scent = scents[i];
    if(ant.brain.checkTrail(scent)){
      return scent.name;
    }
  }
  return 0;
}

////Problem: When an ant breaks off from a path to optimize, how do we make sure it doesn't just wander randomly again? Keep moving in same direction
//Maybe use a randomly checked heuristic?

function track(trailType){
  /*Tracking:
      When an ant decides to follow a pheromone trail:
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