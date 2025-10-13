let CANVAS_X = 800; // Default 800
let CANVAS_Y = 800; // Default 800
const TILE_SIZE = 32; //  Default 35

const NONE = '\0'; 

let SEED;
let MAP;

let GRIDMAP;
let COORDSY;
let font;
let recordingPath;
let menuImage;
let playButton;
let optionButton;
let exitButton;
let infoButton;
let debugButton;
let cameraX = 0;
let cameraY = 0;
let cameraPanSpeed = 10;
let cameraZoom = 1;
const MIN_CAMERA_ZOOM = 0.5;
const MAX_CAMERA_ZOOM = 3;
const CAMERA_ZOOM_STEP = 1.1;
let cameraFollowEnabled = false;
let cameraFollowTarget = null;
function preload(){
  test_stats();
  terrainPreloader()
  Ants_Preloader()
  resourcePreLoad();
  font = loadFont("Images/Assets/Terraria.TTF");
  menuImage = loadImage("Images/Assets/Menu/ant_logo3.png");
  playButton = loadImage("Images/Assets/Menu/play_button.png");
  optionButton = loadImage("Images/Assets/Menu/options_button.png");
  exitButton = loadImage("Images/Assets/Menu/exit_button.png");
  infoButton = loadImage("Images/Assets/Menu/info_button.png");
  debugButton = loadImage("Images/Assets/Menu/debug_button.png");
  videoButton = loadImage("Images/Assets/Menu/vs_button.png");
  audioButton = loadImage("Images/Assets/Menu/as_button.png");
  controlButton = loadImage("Images/Assets/Menu/controls_button.png");
  backButton = loadImage("Images/Assets/Menu/back_button.png");
}

// MOUSE INTERACTIONS
function mousePressed() {
  if (isInGame()) {  // only allow ant interactions in game
    originalConsoleLog("b");
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
  if (isInMenu() || isInOptions()) {
    if (typeof handleMenuClick === 'function') {
      handleMenuClick();
    }
  }
}


function mouseDragged() {
  if (isInGame() && typeof handleMouseDragged === 'function') {
    handleMouseDragged(mouseX, mouseY, ants);
  }
}

function mouseReleased() {
  if (isInGame() && typeof handleMouseReleased === 'function') {
    handleMouseReleased(ants, selectedAnt, moveSelectedAntToTile, TILE_SIZE);
  }
}

// Debug functionality moved to debug/testing.js

// KEYBOARD INTERACTIONS
function keyPressed() {
  // Handle all debug-related keys (command line, dev console, test hotkeys)
  if (typeof handleDebugConsoleKeys === 'function' && handleDebugConsoleKeys(keyCode, key)) {
    return; // Debug key was handled, don't process further
  }
  
  if (keyCode === ESCAPE) {
    if (typeof deselectAllEntities === 'function') {
      deselectAllEntities();
    }
  }

  if ((key === 'f' || key === 'F') && isInGame()) {
    toggleCameraFollow();
  }

  if (isInGame()) {
    if (key === '-' || key === '_' || keyCode === 189 || keyCode === 109) {
      setCameraZoom(cameraZoom / CAMERA_ZOOM_STEP);
    } else if (key === '=' || key === '+' || keyCode === 187 || keyCode === 107) {
      setCameraZoom(cameraZoom * CAMERA_ZOOM_STEP);
    }
  }
}

function getPrimarySelectedEntity() {
  if (typeof antManager !== 'undefined' &&
      antManager &&
      typeof antManager.getSelectedAnt === 'function') {
    const managed = antManager.getSelectedAnt();
    if (managed) {
      return managed;
    }
  }

  if (typeof selectedAnt !== 'undefined' && selectedAnt) {
    return selectedAnt;
  }

  return null;
}

function getEntityWorldCenter(entity) {
  if (!entity) return null;

  const pos = typeof entity.getPosition === 'function'
    ? entity.getPosition()
    : (entity.sprite?.pos ?? { x: entity.posX ?? 0, y: entity.posY ?? 0 });

  const size = typeof entity.getSize === 'function'
    ? entity.getSize()
    : (entity.sprite?.size ?? { x: entity.sizeX ?? TILE_SIZE, y: entity.sizeY ?? TILE_SIZE });

  const posX = pos?.x ?? pos?.[0] ?? 0;
  const posY = pos?.y ?? pos?.[1] ?? 0;
  const sizeX = size?.x ?? size?.[0] ?? TILE_SIZE;
  const sizeY = size?.y ?? size?.[1] ?? TILE_SIZE;

  return {
    x: posX + sizeX / 2,
    y: posY + sizeY / 2
  };
}

function getMapPixelDimensions() {
  if (!MAP) {
    return { width: CANVAS_X, height: CANVAS_Y };
  }

  const width = MAP._xCount ? MAP._xCount * TILE_SIZE : CANVAS_X;
  const height = MAP._yCount ? MAP._yCount * TILE_SIZE : CANVAS_Y;

  return { width, height };
}

function clampCameraToBounds() {
  const { width, height } = getMapPixelDimensions();
  const viewWidth = CANVAS_X / cameraZoom;
  const viewHeight = CANVAS_Y / cameraZoom;

  let minX = 0;
  let maxX = width - viewWidth;
  if (viewWidth >= width) {
    const excessX = viewWidth - width;
    minX = -excessX / 2;
    maxX = excessX / 2;
  } else {
    maxX = Math.max(0, maxX);
  }

  let minY = 0;
  let maxY = height - viewHeight;
  if (viewHeight >= height) {
    const excessY = viewHeight - height;
    minY = -excessY / 2;
    maxY = excessY / 2;
  } else {
    maxY = Math.max(0, maxY);
  }

  cameraX = constrain(cameraX, minX, maxX);
  cameraY = constrain(cameraY, minY, maxY);

  if (COORDSY && typeof COORDSY.setViewCornerBC === 'function') {
    COORDSY.setViewCornerBC([cameraX, cameraY]);
  }
}

function centerCameraOn(worldX, worldY) {
  const viewWidth = CANVAS_X / cameraZoom;
  const viewHeight = CANVAS_Y / cameraZoom;

  cameraX = worldX - viewWidth / 2;
  cameraY = worldY - viewHeight / 2;

  clampCameraToBounds();
}

function centerCameraOnEntity(entity) {
  const center = getEntityWorldCenter(entity);
  if (center) {
    centerCameraOn(center.x, center.y);
  }
}

function screenToWorld(px = mouseX, py = mouseY, zoomOverride) {
  const zoom = typeof zoomOverride === 'number' ? zoomOverride : cameraZoom;

  return {
    x: cameraX + px / zoom,
    y: cameraY + py / zoom
  };
}

function getWorldMousePosition(px = mouseX, py = mouseY, zoomOverride) {
  return screenToWorld(px, py, zoomOverride);
}

function worldToScreen(worldX, worldY) {
  return {
    x: (worldX - cameraX) * cameraZoom,
    y: (worldY - cameraY) * cameraZoom
  };
}

function setCameraZoom(targetZoom, focusX = CANVAS_X / 2, focusY = CANVAS_Y / 2) {
  const clampedZoom = constrain(targetZoom, MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM);
  if (clampedZoom === cameraZoom) {
    return false;
  }

  const currentZoom = (typeof cameraZoom === 'number' && cameraZoom !== 0) ? cameraZoom : 1;
  const focusWorld = screenToWorld(focusX, focusY, currentZoom);

  cameraZoom = clampedZoom;
  cameraX = focusWorld.x - focusX / cameraZoom;
  cameraY = focusWorld.y - focusY / cameraZoom;

  clampCameraToBounds();

  if (cameraFollowEnabled) {
    const target = cameraFollowTarget || getPrimarySelectedEntity();
    if (target) {
      centerCameraOnEntity(target);
    } else {
      cameraFollowEnabled = false;
      cameraFollowTarget = null;
    }
  }

  return true;
}

function toggleCameraFollow() {
  const target = getPrimarySelectedEntity();

  if (cameraFollowEnabled) {
    if (!target || target === cameraFollowTarget) {
      cameraFollowEnabled = false;
      cameraFollowTarget = null;
      return;
    }
  }

  if (target) {
    cameraFollowEnabled = true;
    cameraFollowTarget = target;
    centerCameraOnEntity(target);
  }
}

function updateCamera() {
  if (!isInGame()) return;

  const left = keyIsDown(LEFT_ARROW) || keyIsDown(65);
  const right = keyIsDown(RIGHT_ARROW) || keyIsDown(68);
  const up = keyIsDown(UP_ARROW) || keyIsDown(87);
  const down = keyIsDown(DOWN_ARROW) || keyIsDown(83);
  const manualInput = left || right || up || down;

  if (manualInput) {
    if (cameraFollowEnabled) {
      cameraFollowEnabled = false;
      cameraFollowTarget = null;
    }

    const panStep = cameraPanSpeed / cameraZoom;
    if (left) {
      cameraX -= panStep;
    }
    if (right) {
      cameraX += panStep;
    }
    if (up) {
      cameraY -= panStep;
    }
    if (down) {
      cameraY += panStep;
    }

    clampCameraToBounds();
  } else if (cameraFollowEnabled) {
    const primary = getPrimarySelectedEntity();
    const target = primary || cameraFollowTarget;
    if (target) {
      cameraFollowTarget = target;
      centerCameraOnEntity(target);
    } else {
      cameraFollowEnabled = false;
      cameraFollowTarget = null;
    }
  }

  if (typeof originalConsoleLog === 'function') {
    originalConsoleLog(cameraX, cameraY);
  }
}

function mouseWheel(event) {
  if (!isInGame()) {
    return true;
  }

  const wheelDelta = event?.deltaY ?? 0;
  if (wheelDelta === 0) {
    return false;
  }

  const zoomFactor = wheelDelta > 0 ? (1 / CAMERA_ZOOM_STEP) : CAMERA_ZOOM_STEP;
  const targetZoom = cameraZoom * zoomFactor;
  setCameraZoom(targetZoom, mouseX, mouseY);

  return false;
}
// Command line functionality has been moved to debug/commandLine.js

////// MAIN
function setup() {
  CANVAS_X = windowWidth;
  CANVAS_Y = windowHeight;
  createCanvas(CANVAS_X, CANVAS_Y);

  SEED = hour()*minute()*floor(second()/10);

  MAP = new Terrain(CANVAS_X,CANVAS_Y,TILE_SIZE);
  MAP.randomize(SEED);
  COORDSY = MAP.getCoordinateSystem();
  COORDSY.setViewCornerBC([0, 0]);
  
  GRIDMAP = new PathMap(MAP);
  COORDSY = MAP.getCoordinateSystem(); // Get Backing canvas coordinate system
  COORDSY.setViewCornerBC([0, 0]); // Top left corner of VIEWING canvas on BACKING canvas, (0,0) by default. Included to demonstrate use. Update as needed with camera
  
  initializeMenu();  // Initialize the menu system
  setupTests(); // Call test functions from AntStateMachine branch
 
  Ants_Spawn(10);
  // Resources_Spawn(20);
}

// Global Currency Counter
function drawUI() {
  push(); 
  textFont(font); 
  textSize(24);
  fill(255);  // white text
  textAlign(LEFT, TOP);
  text("Food: " + globalResource.length, 10, 10);
  pop();
}

function setupTests() {
  // Any test functions can be called here
  // e.g. antSMtest();
  antSMtest(); // Test Ant State Machine
}

function draw() {
  console.log("t");
  background(0);

  // --- UPDATE MENU STATE ---
  updateMenu();

  // --- MENU / OPTIONS ---
  if (renderMenu()) {
    return; // menu rendered, stop here
  }

  // --- PLAYING ---
  if (GameState.isInGame()) {
    push();
    scale(cameraZoom);
    translate(-cameraX, -cameraY);

    MAP.render();
    Ants_Update();
    resourceList.drawAll();

    if (typeof drawSelectionBox === 'function') drawSelectionBox();
    drawDebugGrid(TILE_SIZE, GRIDMAP.width, GRIDMAP.height);

    pop();

    if (typeof drawDevConsoleIndicator === 'function') {
      drawDevConsoleIndicator();
    }
  
    if (typeof drawCommandLine === 'function') {
      drawCommandLine();
    }
    updateCamera();
    drawUI();
  }

  // --- FADE OVERLAY (works in both menu + game) ---
  if (GameState.isFadingTransition()) {
    const fadeAlpha = GameState.getFadeAlpha();
    if (fadeAlpha > 0) {
      fill(255, fadeAlpha);
      rect(0, 0, CANVAS_X, CANVAS_Y);
    }
    GameState.updateFade(10);
  }
}


function drawDebugGrid(tileSize, gridWidth, gridHeight) {
  stroke(100, 100, 100, 100); // light gray grid lines
  const zoom = (typeof cameraZoom === 'number' && cameraZoom !== 0) ? cameraZoom : 1;
  strokeWeight(1 / zoom);
  noFill();
  //console.log("t");
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      rect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // Highlight tile under mouse
  const mouseWorld = typeof getWorldMousePosition === 'function'
    ? getWorldMousePosition()
    : { x: mouseX, y: mouseY };
  const tileX = Math.floor(mouseWorld.x / tileSize);
  const tileY = Math.floor(mouseWorld.y / tileSize);
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

// Dev console indicator moved to debug/testing.js

// Command line drawing moved to debug/commandLine.js
