let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;
let selectedAnts = [];

function handleMousePressed(ants, mouseX, mouseY, Ant_Click_Control, selectedAnt, moveSelectedAntToTile, TILE_SIZE) {
  // Spread out multi-selected ants around the clicked location
  if (selectedAnts.length > 1) {
    const radius = 40; // Distance from center
    const angleStep = (2 * Math.PI) / selectedAnts.length;
    for (let i = 0; i < selectedAnts.length; i++) {
      const angle = i * angleStep;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      selectedAnts[i].moveToLocation(mouseX + offsetX, mouseY + offsetY);
      selectedAnts[i].isSelected = false;
    }
    selectedAnts = [];
    return;
  }

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

function handleMouseDragged(mouseX, mouseY, ants) {
  if (isSelecting) {
    selectionEnd = createVector(mouseX, mouseY);

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
      antObj.isBoxHovered = (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2);
    }
  }
}

function handleMouseReleased(ants) {
  if (isSelecting) {
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
      antObj.isSelected = (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2);
      antObj.isBoxHovered = false; // Clear yellow highlight
      if (antObj.isSelected) selectedAnts.push(antObj);
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