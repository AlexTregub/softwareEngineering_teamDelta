class AntWrapper {
  constructor(antObject, species) {
    this.antObject = antObject; // Instance of ant class
    this.species = species;
    // Optionally: this.healthAmount = this.setHealthAmm(species);

    // Set species-specific image if needed
    if (species === "DeLozier") {
      this.antObject.setSpriteImage(gregImg);
    }
  }

  update() {
    this.antObject.update();
  }

  makeSpeciesTestUi() {
    const center = this.antObject.center;
  
    push();
    rectMode(CENTER);
  
    // 20px below the ant (tweak as needed)
    const labelY = center.y + this.antObject.size / 2 + 20;
  
    outlinedText(
      this.species,         // text
      center.x,             // x
      labelY,               // y
      font,                 // font
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

function outlinedText(txt, x, y, font, size, fillCol, outlineCol) {
  push();
  textFont(font);
  textSize(size);
  textAlign(CENTER, CENTER);
  noStroke();

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