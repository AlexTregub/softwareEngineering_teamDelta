// Species class that extends the ant class and includes species-specific stats and behaviors
// Each species has stats like strength, health, gatherSpeed, and movementSpeed
// Species also have unique images and can display their species name above them
const _speciesList = ["Builder", "Scout", "Farmer", "Warrior", "Spitter"]; // List of all species except special ones
const _specialSpeciesList = ["DeLozier"]; // Special species that can only be spawned once
const _allSpecies = [..._speciesList, ..._specialSpeciesList]; // Combine both lists

//example usage:
// let mySpecies = new Species(myAntObject, "Scout", speciesImages["Scout"]);
// mySpecies.update(); // Call this in the main update loop to render the species name

class Species extends ant {
  // Static debug flag (global)
  static DEBUG = false; // Set to true to enable debug logging for all Species instances

  // speciesName must be one of the predefined species names
  // speciesImage is the image associated with the species
  // antObject is an instance of the ant class

  constructor(antObject, speciesName, speciesImage) {
    const speciesStats = Species.getSpeciesStats(speciesName);
    super(
      antObject.posX,
      antObject.posY,
      antObject.sizeX,
      antObject.sizeY,
      speciesStats.movementSpeed ?? antObject.movementSpeed,
      antObject.rotation,
      speciesImage
    );
    this.img = speciesImage;
    this.speciesName = speciesName;
    this.exp = antObject.stats.exp;

    // Local debug flag (per instance) - can be toggled independently of the static DEBUG flag
    // Set to true to enable debug logging for this specific Species instance
    this.localDebug = false;

    // Debug: Log species creation and stats if either flag is enabled
    if (Species.DEBUG || this.localDebug) {
      console.debug(`[Species] Created: ${speciesName}`, {
        pos: { x: this.posX, y: this.posY },
        size: { x: this.sizeX, y: this.sizeY },
        stats: speciesStats
      });
    }

    // Overwrite stats with species-specific values
    this.stats.strength.statValue = speciesStats.strength;
    this.stats.health.statValue = speciesStats.health;
    this.stats.gatherSpeed.statValue = speciesStats.gatherSpeed;
    this.stats.movementSpeed.statValue = speciesStats.movementSpeed;
    this.waypoints = []; // Array of {x, y} locations
  }

  // Static method to get species-specific stats
  // Example usage: Species.getSpeciesStats("Scout");
  static getSpeciesStats(speciesName) {
    switch (speciesName) {
      case "Builder":
        return { strength: 20, health: 120, gatherSpeed: 15, movementSpeed: 20 };
      case "Scout":
        return { strength: 10, health: 80, gatherSpeed: 10, movementSpeed: 80 };
      case "Farmer":
        return { strength: 15, health: 100, gatherSpeed: 30, movementSpeed: 15 };
      case "Warrior":
        return { strength: 40, health: 150, gatherSpeed: 5, movementSpeed: 25 };
      case "Spitter":
        return { strength: 30, health: 90, gatherSpeed: 8, movementSpeed: 30 };
      case "DeLozier":
        return { strength: 1000, health: 10000, gatherSpeed: 1, movementSpeed: 10000 };
      default:
        return { strength: 10, health: 100, gatherSpeed: 10, movementSpeed: 20 };
    }
  }

  get localDebug() { return this._localDebug; }
  set localDebug(value) { this._localDebug = value; }
  get stats() { return this._stats; }


  // Example: Override update to show species name
  update() {
    if (Species.DEBUG || this.localDebug) {
      console.debug(`[Species] Update: ${this.speciesName} at (${this.posX}, ${this.posY})`);
    }
    super.update(); // Call the parent update method to handle movement and rendering
    const center = this.center; // Center of the ant sprite
    push();
    rectMode(CENTER);
    fill(0, 0, 0, 180); // Semi-transparent black background
    noStroke();
    fill(255); // White text
    textSize(13);
    textAlign(CENTER, CENTER);
    text(this.speciesName, center.x, center.y - 20);
    pop();
  }

  ResolveMoment() {
    if (this.isMoving && (Species.DEBUG || this.localDebug)) {
      console.debug(`[Species] ResolveMoment: ${this.speciesName} moving from (${this.posX}, ${this.posY}) to (${this.stats.pendingPos.statValue.x}, ${this.stats.pendingPos.statValue.y})`);
    }
    super.ResolveMoment?.();
  }

  getStatsSummary() {
    // Gather all exp types and values
    let expSummary = {};
    for (let [key, statObj] of this.stats.exp.entries()) {
      expSummary[key] = statObj.statValue;
    }
    return {
      species: this.speciesName,
      strength: this.stats.strength.statValue,
      health: this.stats.health.statValue,
      gatherSpeed: this.stats.gatherSpeed.statValue,
      movementSpeed: this.stats.movementSpeed.statValue,
      exp: expSummary
    };
  }
}

// Assigns a random species to an ant
function assignSpecies() {
  // Add DeLozier to the species list only if it hasn't been created yet
  if (!hasDeLozier) { speciesList = _specialSpeciesList; }
  else speciesList = _speciesList
  const chosenSpecies = speciesList[Math.floor(random(0, speciesList.length))];

  // If DeLozier is chosen, set the flag to true
  if (chosenSpecies === "DeLozier") { hasDeLozier = true; }
  
  return chosenSpecies;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Species;
}