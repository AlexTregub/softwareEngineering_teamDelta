class Species extends ant {
  constructor(antObject, speciesName) {
    super(
      antObject.GetPosX(),
      antObject.GetPosY(),
      antObject.GetSizeX(),
      antObject.GetSizeY(),
      antObject.GetMovementSpeed(),
      antObject.rotation
    );
    this.speciesName = speciesName;
    this.exp = antObject.stats.exp; // Inherit exp map from ant
    // Add any species-specific properties or methods here
  }

  // Example: Override update to show species name
  update() {
    super.update();
    push();
    fill(225);
    textSize(12);
    textAlign(CENTER);
    text(this.speciesName, this.GetCenter().x, this.GetCenter().y - 20);
    pop();
  }
}

// Assigns a random species to an ant
function assignSpecies() {
  const speciesList = ["Builder", "Scout", "Farmer", "Warrior"];
  // Add DeLozier to the species list only if it hasn't been created yet
  if (!hasDeLozier) { speciesList.push("DeLozier"); }
  const chosenSpecies = speciesList[Math.floor(random(0, speciesList.length))];

  // If DeLozier is chosen, set the flag to true
  if (chosenSpecies === "DeLozier") { hasDeLozier = true; }
  return chosenSpecies;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Species;
}