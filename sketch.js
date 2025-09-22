let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
const TILE_SIZE = 32; //  Default 35

const NONE = '\0'; 

let SEED;
let MAP;

let GRIDMAP;
let COORDSY;
let font;
let recordingPath
let gameState = "MENU"; // "MENU", "PLAYING", "OPTIONS"
let menuButtons = [];
let fadeAlpha = 0;      // Going to attempt fade-in/
let isFading = false;
// Title animation stuff
let titleY = -100;        // start above the screen
let titleTargetY = CANVAS_Y / 2 - 150;
let titleSpeed = 9;      // pixels per frame

function preload(){
  test_stats();
  terrainPreloader()
  Ants_Preloader()
  Resources_Preloader();

  font = loadFont("../Images/Assets/Terraria.TTF");
}
/*
function mousePressed() {
  if(!recordingPath){
    for (let i = 0; i < ants.length; i++) {
      if (ants[i].isMouseOver(mouseX, mouseY)) { //Eventually make it open some interface menu
        recordingPath = true;
        selectedAnt = ants[i];
        let antTileX = floor(selectedAnt.GetCenter().x / map._tileSize);
        let antTileY = floor(selectedAnt.GetCenter().y / map._tileSize);
        startTile = map._tileStore[map.conv2dpos(antTileX, antTileY)];
        return;
      }
      /*
      Eventually...
      Once an ant is clicked, makePath in the ants class is called
      and repeatedly draws lines to the corresponding grid tile
      repeatedly until a valid destination is clicked. Then it calls
      a movement function and the ant moves there.
      */
   /* }
  }
  if(recordingPath){
    let endTileX = floor(mouseX / map._tileSize);
    let endTileY = floor(mouseY / map._tileSize);
    endTile = map._tileStore[map.conv2dpos(endTileX, endTileY)];
    getPath(startTile, endTile);

    /*if(selectedAnt && endTile){
      selectedAnt.moveToLocation(endTile._x, endTile._y); //Moves ant directly to tile
    }*/
/*
    recordingPath = false;
    selectedAnt = null;
    startTile = null;
    return;
  }
} */

// MOUSE INTERACTIONS
function mousePressed() {
  if (gameState === "PLAYING") {  // only allow ant interactions in game
    if (typeof handleMousePressed === 'function') {
      handleMousePressed(
        ants,
        mouseX,
        mouseY,
        Ant_Click_Control,
        selectedAnt,
        moveSelectedAntToTile,
        TILE_SIZE,
        mouseButton
      );
    }
  }

  // menu buttons
  if (gameState === "MENU") {
    menuButtons.forEach(btn => {
      const hovering = mouseX > btn.x - btn.w / 2 && mouseX < btn.x + btn.w / 2 &&
                       mouseY > btn.y - btn.h / 2 && mouseY < btn.y + btn.h / 2;
      if (hovering) btn.action();
    });
  }
}

function mouseDragged() {
  if (gameState === "PLAYING" && typeof handleMouseDragged === 'function') {
    handleMouseDragged(mouseX, mouseY, ants);
  }
}

function mouseReleased() {
  if (gameState === "PLAYING" && typeof handleMouseReleased === 'function') {
    handleMouseReleased(ants);
  }
}

// KEYBOARD INTERACTIONS
function keyPressed() {
  if (keyCode === ESCAPE) {
    if (typeof deselectAllEntities === 'function') {
      deselectAllEntities();
    }
  }
}

////// MAIN
function setup() {
  CANVAS_X = windowWidth;
  CANVAS_Y = windowHeight;
  createCanvas(CANVAS_X, CANVAS_Y);

  SEED = hour()*minute()*floor(second()/10);

  MAP = new Terrain(CANVAS_X,CANVAS_Y,TILE_SIZE);
  MAP.randomize(SEED);
  COORDSY = MAP.getCoordinateSystem();
  COORDSY.setViewCornerBC(0,0);
  
  GRIDMAP = new PathMap(MAP);
  COORDSY = MAP.getCoordinateSystem(); // Get Backing canvas coordinate system
  COORDSY.setViewCornerBC(0,0); // Top left corner of VIEWING canvas on BACKING canvas, (0,0) by default. Included to demonstrate use. Update as needed with camera
  //// 
  setupMenu();  // <-- ADD THIS LINE

  Ants_Spawn(50);
  Resources_Spawn(20);
}

function draw() {
  MAP.render();
  Ants_Update();
  Resources_Update();
  if (typeof drawSelectionBox === 'function') {
    drawSelectionBox();
  }
  drawDebugGrid(tileSize, GRIDMAP.width, GRIDMAP.height);
  if(recordingPath){

  }
}
function drawDebugGrid(tileSize, gridWidth, gridHeight) {
  stroke(100, 100, 100, 100); // light gray grid lines
  strokeWeight(1);
  noFill();

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      rect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // Highlight tile under mouse
  const tileX = Math.floor(mouseX / tileSize);
  const tileY = Math.floor(mouseY / tileSize);
  fill(255, 255, 0, 50); // transparent yellow
  noStroke();
  rect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);

  // Highlight selected ant's current tile
  if (selectedAnt) {
    const antTileX = Math.floor(selectedAnt.posX / tileSize);
    const antTileY = Math.floor(selectedAnt.posY / tileSize);
    fill(0, 255, 0, 80); // transparent green
    noStroke();
    rect(antTileX * tileSize, antTileY * tileSize, tileSize, tileSize);

function setupMenu() {
  menuButtons = [
    { 
      label: "Start Game", 
      x: CANVAS_X / 2, 
      y: CANVAS_Y / 2 - 40, 
      w: 220, 
      h: 50, 
      action: () => { 
        isFading = true; // start fade
      } 
    },
    { 
      label: "Options",    
      x: CANVAS_X / 2, 
      y: CANVAS_Y / 2 + 40, 
      w: 220, 
      h: 50, 
      action: () => { gameState = "OPTIONS"; } 
    },
  ];
}

function startGameFade() {
  isFading = true;
  fadeAlpha = 0;
}

function drawMenu() {
  textAlign(CENTER, CENTER);

  // Animate the title dropping in
  if (titleY < titleTargetY) {
    titleY += titleSpeed;
    if (titleY > titleTargetY) titleY = titleTargetY; // clamp to final pos
  }

  // Draw title
  outlinedText("ANTS!", CANVAS_X / 2, titleY, font, 48, color(255), color(0));

  // Draw buttons
  menuButtons.forEach(btn => {
    const hovering = mouseX > btn.x - btn.w / 2 && mouseX < btn.x + btn.w / 2 &&
                     mouseY > btn.y - btn.h / 2 && mouseY < btn.y + btn.h / 2;

    push();
    rectMode(CENTER);
    stroke(255);
    strokeWeight(3);
    fill(hovering ? color(180, 255, 180) : color(100, 200, 100));
    rect(btn.x, btn.y, btn.w, btn.h, 10);
    pop();

    // Button label with outlinedText
    outlinedText(btn.label, btn.x, btn.y, font, 24, color(0), color(255));
  });
}


// Draw loop
function setupMenu() {
  menuButtons = [
    { 
      label: "Start Game", 
      x: CANVAS_X / 2, 
      y: CANVAS_Y / 2 - 40, 
      w: 220, 
      h: 50, 
      action: () => { isFading = true; fadeAlpha = 0; } 
    }/*,
    { 
      label: "Options",    
      x: CANVAS_X / 2, 
      y: CANVAS_Y / 2 + 40, 
      w: 220, 
      h: 50, 
      action: () => { gameState = "OPTIONS"; } 
    },
    */
  ];
}

function draw() {
  if (gameState === "MENU") {
    // render menu background and colony
    MAP.render();
    Ants_Update();
    Resources_Update();

    drawMenu();

    // fade to white
    if (isFading) {
      fadeAlpha += 5; // speed of fade-in
      fill(255, fadeAlpha);
      rect(0, 0, CANVAS_X, CANVAS_Y);

      if (fadeAlpha >= 255) {
        gameState = "PLAYING"; // switch to game
        isFading = false;
      }
    }

    return; // stop here until game starts
  }

  // --- GAMEPLAY ---
  MAP.render();
  Ants_Update();
  Resources_Update();
  if (typeof drawSelectionBox === 'function') drawSelectionBox();

  // fade out white so game appears smoothly
  if (fadeAlpha > 0) {
    fadeAlpha -= 10; // speed of fade-out
    fill(255, fadeAlpha);
    rect(0, 0, CANVAS_X, CANVAS_Y);
  }
}