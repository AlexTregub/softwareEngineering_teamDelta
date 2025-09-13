let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;
let selectedAnts = [];

function handleMousePressed(ants, mouseX, mouseY, Ant_Click_Control, selectedAnt, moveSelectedAntToTile, TILE_SIZE) {
  // Check if an ant was clicked for single selection
  let antWasClicked = false;
  for (let i = 0; i < ants.length; i++) {
    if (ants[i].antObject.isMouseOver(mouseX, mouseY)) {
      Ant_Click_Control();
      antWasClicked = true;
      break;
    }
  }
  // If no ant was clicked and one is selected, move it to the tile
  if (!antWasClicked && selectedAnt) {
    moveSelectedAntToTile(mouseX, mouseY, TILE_SIZE);
  }
  // If no ant was clicked, start box selection
  if (!antWasClicked && !selectedAnt) {
    isSelecting = true;
    selectionStart = createVector(mouseX, mouseY);
    selectionEnd = selectionStart.copy();
  }
}

function handleMouseDragged(mouseX, mouseY) {
  if (isSelecting) {
    selectionEnd = createVector(mouseX, mouseY);
  }
}

function handleMouseReleased(ants) {
  if (isSelecting) {
    // Select ants within box
    selectedAnts = [];
    let x1 = Math.min(selectionStart.x, selectionEnd.x);
    let x2 = Math.max(selectionStart.x, selectionEnd.x);
    let y1 = Math.min(selectionStart.y, selectionEnd.y);
    let y2 = Math.max(selectionStart.y, selectionEnd.y);

    for (let i = 0; i < ants.length; i++) {
      let antObj = ants[i].antObject;
      let pos = antObj.sprite.pos;
      let size = antObj.sprite.size;
      let cx = pos.x + size.x / 2;
      let cy = pos.y + size.y / 2;
      if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) {
        antObj.isSelected = true;
        selectedAnts.push(antObj);
      } else {
        antObj.isSelected = false;
      }
    }
    isSelecting = false;
    selectionStart = null;
    selectionEnd = null;
  }
}

function drawSelectionBox() {
  if (isSelecting && selectionStart && selectionEnd) {
    push();
    noFill();
    stroke(0, 150, 255);
    strokeWeight(2);
    rectMode(CORNERS);
    rect(selectionStart.x, selectionStart.y, selectionEnd.x, selectionEnd.y);
    pop();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    handleMousePressed,
    handleMouseDragged,
    handleMouseReleased,
    drawSelectionBox,
    selectedAnts
  };
}