class AntWrapper {
  constructor(antObject, species) {
    this.antObject = antObject; // Instance of ant class
    this.species = species;
    this.collectAmount = this.setCollectAmm(species);
    this.damageAmount = this.setDamageAmm(species);
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

  setCollectAmm(species) {
    switch (species) {
      case "Builder": return 25;
      case "Scout": return 50;
      case "Farmer": return 40;
      case "Warrior": return 15;
      case "DeLozier": return 1;
      default: return 20;
    }
  }

  setDamageAmm(species) {
    switch (species) {
      case "Builder": return 15;
      case "Scout": return 10;
      case "Farmer": return 20;
      case "Warrior": return 50;
      case "DeLozier": return 100000;
      default: return 20;
    }
  }

  setHealthAmm(species) {
    switch (species) {
      case "Builder": return 100;
      case "Scout": return 80;
      case "Farmer": return 100;
      case "Warrior": return 120;
      case "DeLozier": return 100000;
      default: return 100;
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = AntWrapper;
}