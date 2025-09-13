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
    this.makeSpeciesTestUi();
  }

  makeSpeciesTestUi() {
    const center = this.antObject.center;
    const tagWidth = 60;
    const tagHeight = 18;
    push();
    rectMode(CENTER);
    fill(0, 0, 0, 150); // Semi-transparent background
    noStroke();
    fill(255); // White text
    textSize(12);
    textAlign(CENTER, CENTER);
    text(this.species, center.x, center.y - 10);
    pop();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = AntWrapper;
}