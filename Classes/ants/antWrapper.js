class AntWrapper {
  // Passthrough for getPosition and getSize for selection box logic
  getPosition() {
    return this.antObject && typeof this.antObject.getPosition === 'function'
      ? this.antObject.getPosition()
      : { x: 0, y: 0 };
  }
  getSize() {
    return this.antObject && typeof this.antObject.getSize === 'function'
      ? this.antObject.getSize()
      : { x: 0, y: 0 };
  }
  // Allow SelectionBoxController to get/set selection state transparently
  get isSelected() {
    return this.antObject && typeof this.antObject.isSelected !== 'undefined' ? this.antObject.isSelected : false;
  }
  set isSelected(val) {
    if (this.antObject && typeof this.antObject.isSelected !== 'undefined') {
      this.antObject.isSelected = val;
    }
  }
  // Allow SelectionBoxController to check mouse over transparently
  isMouseOver(mx, my) {
    if (this.antObject && typeof this.antObject.isMouseOver === 'function') {
      return this.antObject.isMouseOver(mx, my);
    }
    return false;
  }
  // Allow SelectionBoxController to get/set box hover state transparently
  get isBoxHovered() {
    return this.antObject && typeof this.antObject.isBoxHovered !== 'undefined' ? this.antObject.isBoxHovered : false;
  }
  set isBoxHovered(val) {
    if (this.antObject && typeof this.antObject.isBoxHovered !== 'undefined') {
      this.antObject.isBoxHovered = val;
    }
  }
  constructor(antObject, Job) {
    this.antObject = antObject; // Instance of ant class (Entity-based)
    this.Job = Job;
    // Optionally: this.healthAmount = this.setHealthAmm(Job);

    // Set Job-specific image if needed
    if (Job === "DeLozier") {
      this.antObject.setImage(JobImages["DeLozier"]);
    }
  }

  update() {
    this.antObject.update();
  }

  makeJobTestUi() {
    const center = this.antObject.getCenter();
  
    push();
    rectMode(CENTER);
  
    // 20px below the ant (tweak as needed)
    const size = this.antObject.getSize();
    const labelY = center.y + size.y / 2 + 20;
  
    outlinedText(
      this.Job,         // text
      center.x,             // x
      labelY,               // y
      g_menuFont,                 // g_menuFont
      14,                   // size
      color(0),           // fill
      color(0)              // outline
    );
  
    pop();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = AntWrapper;
}

function outlinedText(txt, x, y, g_menuFont, size, fillCol, outlineCol) {
  push();
  noStroke();
  textFont(g_menuFont);
  textSize(size);
  textAlign(CENTER, CENTER);
  

  fill(outlineCol);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx || dy) text(txt, x + dx, y + dy);
    }
  }

  fill(fillCol);
  text(txt, x, y);
  pop();
}