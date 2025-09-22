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

function preload(){
  test_stats();
  terrainPreloader()
  Ants_Preloader()
  Resources_Preloader();

  font = loadFont("Images/Assets/Terraria.TTF");
}

// MOUSE INTERACTIONS
function mousePressed() {
  if (isInGame()) {  // only allow ant interactions in game
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

  // Handle menu button clicks
  handleMenuClick();
}

function mouseDragged() {
  if (isInGame() && typeof handleMouseDragged === 'function') {
    handleMouseDragged(mouseX, mouseY, ants);
  }
}

function mouseReleased() {
  if (isInGame() && typeof handleMouseReleased === 'function') {
    handleMouseReleased(ants);
  }
}

// DEV CONSOLE STATE
let devConsoleEnabled = false;

// DEBUG LOGGING HELPER
function debugLog(message, ...args) {
  if (devConsoleEnabled) {
    console.log(message, ...args);
  }
}

// KEYBOARD INTERACTIONS
function keyPressed() {
  if (keyCode === ESCAPE) {
    if (typeof deselectAllEntities === 'function') {
      deselectAllEntities();
    }
  }
  
  // Toggle dev console with ` key (backtick)
  if (key === '`') {
    devConsoleEnabled = !devConsoleEnabled;
    if (devConsoleEnabled) {
      console.log("🛠️  DEV CONSOLE ENABLED");
      console.log("📋 Available commands:");
      console.log("   T - Run Selection Box Tests");
      console.log("   P - Run Performance Tests");
      console.log("   I - Run Integration Tests");
      console.log("   ` - Toggle Dev Console");
    } else {
      console.log("🛠️  DEV CONSOLE DISABLED");
    }
  }
  
  // Test hotkeys (only work when dev console is enabled)
  if (devConsoleEnabled) {
    if (key === 't' || key === 'T') {
      console.log("🧪 Running Selection Box Tests...");
      if (typeof runSelectionBoxTests === 'function') {
        runSelectionBoxTests();
      } else {
        console.log("❌ Test functions not loaded");
      }
    }
    
    if (key === 'p' || key === 'P') {
      console.log("⚡ Running Performance Tests...");
      if (typeof testSelectionPerformance === 'function') {
        testSelectionPerformance();
      } else {
        console.log("❌ Performance test function not loaded");
      }
    }
    
    if (key === 'i' || key === 'I') {
      console.log("🔗 Running Integration Tests...");
      if (typeof testRealSelectionBoxIntegration === 'function') {
        testRealSelectionBoxIntegration();
        testSelectionScenarios();
      } else {
        console.log("❌ Integration test functions not loaded");
      }
    }
  } else if ((key === 't' || key === 'T') || (key === 'p' || key === 'P') || (key === 'i' || key === 'I')) {
    console.log("🛠️  Dev console is disabled. Press ` to enable testing commands.");
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
  
  initializeMenu();  // Initialize the menu system
  setupTests(); // Call test functions from AntStateMachine branch

  Ants_Spawn(50);
  Resources_Spawn(20);
}

function setupTests() {
  // Any test functions can be called here
  // e.g. antSMtest();
  antSMtest(); // Test Ant State Machine
}

function draw() {
  MAP.render();
  Ants_Update();
  Resources_Update();
  if (typeof drawSelectionBox === 'function') {
    drawSelectionBox();
  }
  drawDebugGrid(tileSize, GRIDMAP.width, GRIDMAP.height);
  
  // Draw dev console indicator
  drawDevConsoleIndicator();
  
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
  }
}

function draw() {
  // Update menu state and handle transitions
  updateMenu();
  
  // Render menu if active, otherwise render game
  if (renderMenu()) {
    return; // Menu rendered, stop here
  }

  // --- GAMEPLAY RENDERING ---
  MAP.render();
  Ants_Update();
  Resources_Update();
  if (typeof drawSelectionBox === 'function') drawSelectionBox();
  drawDebugGrid(TILE_SIZE, GRIDMAP.width, GRIDMAP.height);

  // Draw dev console indicator
  drawDevConsoleIndicator();

  // Draw fade overlay if transitioning
  drawFadeOverlay();
}

function drawDevConsoleIndicator() {
  if (devConsoleEnabled) {
    // Draw dev console indicator in top-right corner
    push();
    fill(0, 255, 0, 200); // Semi-transparent green
    stroke(0, 255, 0);
    strokeWeight(2);
    
    // Background box
    let boxWidth = 120;
    let boxHeight = 25;
    rect(width - boxWidth - 10, 10, boxWidth, boxHeight);
    
    // Text
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12);
    text("DEV CONSOLE ON", width - boxWidth/2 - 10, 22);
    
    // Small help text
    fill(255, 255, 255, 180);
    textAlign(RIGHT);
    textSize(10);
    text("Press ` to toggle", width - 15, 45);
    
    pop();
  }
}