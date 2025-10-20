class NewPathMap{
  constructor(terrain){
    this._terrain = terrain;
    this._mapTileSize = terrain._tileSpanRange;
    this._mapTL = terrain._tileSpan[0];

    this._grid = new Grid(this._mapTileSize[0],this._mapTileSize[1],this._mapTL);

    this._pGrid = new PheromoneGrid(terrain);
    console.log(`Terrain y: ${terrain._gridTileSpan[0][1]}`);
    for (let y = terrain._gridTileSpan[0][1]; y <= terrain._gridTileSpan[1][1]; y++) {
      for (let x = terrain._gridTileSpan[0][0]; x <= terrain._gridTileSpan[1][0]; x++) {
        let tile = terrain.getTile(x, y);
        if (!tile) continue;
        let node = new NewNode(tile, x, y, this._pGrid);
        this._grid.setArrPos([x, y], node);
      }
    }
  }
  
  getGrid(){
    return this._grid;
  }
}

class NewNode{
  /*Node
      Each Node should hold an empty map of pheromone types paired with strength. Ants use this class as a way to
      determine which direction to take (checks pheromone type/strength) and edit pheromones they deposit
  */
  constructor(terrainTile, x, y, pheromoneGrid){
    this._terrainTile = terrainTile; //Uses Tile and x,y so it can easily find neighbors, know its own location, and have other stuff (know terrain type)
    this._x = x;
    this._y = y;
    console.log(`X:${this._x}  Y: ${this._y}`);
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
    this.pGrid.push(this._x,this._y, {type: tag, strength: 1, initial: 1, rate: 0.1}) //Change it so Ant Class has one single array? that holds all info (allegience, )
  }
  getScents() {
    return this.pGrid.get([this._x, this._y]); 
  }
  //Takes coordinates. If potential neighbor is in bounds, adds it
}

function wander(grid, node, travelled, ant, state){
  /*Wandering:
      When an ant starts its first path:
        Wanders around aimlessly (Takes the shortest path?)
        Leaves pheromone related to its current task
  */
  let priority = ant.pathType;
  let scents = node.getScents();
  if (priority != null){
    return track(grid, node, ant, priority);
  }
  if(scents && scents.length > 0){
    let result = tryTrack(scents, ant);
    if(result === 0){
      return findBestNeighbor(grid, node, travelled);
    }
    else if(result != 0){
      ant.pathType = result; //Probably put in brain instead of ant class
      return track(result);
    }
  }
  else{ //If no scent, wander to shortest tile
    node.addScent(state, ant._faction);
    return findBestNeighbor(grid, node, ant); //Implement travelled so it holds all previously travelled tiles in current journey. Resets once task finished. Make a Set
  }
  //May turn this into separate function like findBestNeighbor. If no pheromone, run findBestNeighbor for next move.
  //If pheromone exists, run pheromone probability function. If pheromone fails, run this. If pheromone passes, track();
  //Make sure the ant avoids pheromones for its entire wander time if probability fails
}

function findBestNeighbor(grid, node, ant){
  let shortestDistance = Infinity;
  let x = node._x;
  let y = node._y;
  let bestNeighbor = null;

  for(let i = -1; i <= 1; i++){
    for(let j = -1; j <= 1; j++){
      if(i === 0 && j === 0) continue;

      let neighbor = grid.getArrPos([x+i, y+j]);
      if(neighbor && !ant.brain.travelledTiles.has(neighbor.id)){ // Makes sure neighbor isn't previously travelled. Should be added to ant class
        if (neighbor.weight < shortestDistance){ //May need to replace with getWeight()
          shortestDistance = neighbor.weight;
          bestNeighbor = neighbor;
        }
      }
    }
  }
  ant.brain.travelledTiles.add(node.id); //May want to set so travelled adds next tile instead of current
  return bestNeighbor;
}

function intuitiveWander(){
  /*Intuitive Wandering:
      When the destination of the end path is known (queen gives direct order):
        Wander in the general direction of the destination (maybe use current A* with pheromones
          for faster pathfinding)
  */

  //This should be what calls legacy pathfinding
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
      return scent.type;
    }
  }
  return 0;
}

////Problem: When an ant breaks off from a path to optimize, how do we make sure it doesn't just wander randomly again? Keep moving in same direction
//Maybe use a randomly checked heuristic?

function track(grid, node, ant, trailType){
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
  let x = node._x;
  let y = node._y;
  let bestNeighbor = null;
  let bestScore = -Infinity;
  //Uses pheromone strength instead of weight (change to consider both)

  for(let i = -1; i <= 1; i++){
    for(let j = -1; j <= 1; j++){
      if(i === 0 && j === 0) continue;

      let neighbor = grid.getArrPos([x+i, y+j]); //Gets neighbor
      if(neighbor && !ant.brain.travelledTiles.has(neighbor.id)){ // Makes sure neighbor isn't previously travelled. Should be added to ant class
        let scents = neighbor.getScents();
        let targetScent = scents && scents.find(scent => scent.type === trailType); //This is AI btw. did not want to manually loop through every pheromone in every neighbor
        let strength = targetScent ? targetScent.strength : 0; //If same scent, get strength. Otherwise, 0 since we want ONLY one pheromone

        if (strength > 0){
          let score = strength - neighbor.weight; //CHANGE!!! PHEROMONE GOES INTO HUNDREDS SO WEIGHT IS BASICALLY USELESS HERE
          if (score > bestScore){
              bestScore = score;
              bestNeighbor = neighbor;
          }
        }
      }
    }
  }
  if (!bestNeighbor) { //In case there is no pheromnoe
    return findBestNeighbor(grid, node, ant); //ALSO NEED TO CHANGE ANT STATE. NO FOUND PHEROMONE SHOULD GO BACCK TO WANDERING (i.e., if ant reaches end of trail)
  }
  ant.brain.travelledTiles.add(node.id); //May want to set so travelled adds next tile instead of current
  return bestNeighbor;
 
}