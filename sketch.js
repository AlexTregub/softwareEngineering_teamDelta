let canvasX = 800;
let canvasY = 800;
let recordingPath = false;
let selectedAnt = null;
let startTile;
let endTile;

function preload(){
  terrainPreloader()
  Ants_Preloader()
}

function mousePressed() {
  if(!recordingPath){
    for (let i = 0; i < ants.length; i++) {
      if (ants[i].isMouseOver(mouseX, mouseY)) { //Eventually make it open some interface menu
        recordingPath = true;
        selectedAnt = ants[i];
        let antTileX = floor(selectedAnt.getCenter().x / map._tileSize);
        let antTileY = floor(selectedAnt.getCenter().y / map._tileSize);
        this.startTile = map._tileStore[map.conv2dpos(antTileX, antTileY)];
      }
      if(recordingPath){
        endTileX = floor(mouseX / map._tileSize);
        endTileT = floor(mouseY / map._tileSize);
        this.endTile = map._tileStore[map.conv2dpos(endTileX, endTileY)];
        getPath(startTile, endTile);
        recordingPath = false;
        selectedAnt = null;
        startTile = null;
      }
      

      /*
      Eventually...
      Once an ant is clicked, makePath in the ants class is called
      and repeatedly draws lines to the corresponding grid tile
      repeatedly until a valid destination is clicked. Then it calls
      a movement function and the ant moves there.
      */
      return; // Stop after first match
    }
  }
}

////// MAIN
function setup() {
  createCanvas(canvasX, canvasY);
  Ants_Spawn(50)
}

function draw() {
  terrainInit();
  Ants_Update();
  if(recordingPath){

  }
}
