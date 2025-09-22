const _speciesList = ["Builder", "Scout", "Farmer", "Warrior", "Spitter"];
const _specialSpeciesList = ["DeLozier"]
const _enemySpeciesList = ["Enemy"]
const _allSpecies = [..._speciesList, ..._specialSpeciesList, ..._enemySpeciesList];
class Species extends ant {
  constructor(antObject, speciesName, speciesImage, faction = "player") {
    const speciesStats = Species.getSpeciesStats(speciesName);
    super(
      antObject.posX,
      antObject.posY,
      antObject.sizeX,
      antObject.sizeY,
      speciesStats.movementSpeed ?? antObject.movementSpeed,
      antObject.rotation,
      speciesImage, // Pass the image here!
      faction // Pass the faction
    );
    this.img = speciesImage
    this.speciesName = speciesName;
    this.exp = antObject.stats.exp
    

    // Overwrite stats with species-specific values
    this.stats.strength.statValue = speciesStats.strength;
    this.stats.health.statValue = speciesStats.health;
    this.stats.gatherSpeed.statValue = speciesStats.gatherSpeed;
    this.stats.movementSpeed.statValue = speciesStats.movementSpeed;
    this.waypoints = []; // Array of {x, y} locations
  }

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
      case "Enemy":
        return { strength: 25, health: 100, gatherSpeed: 0, movementSpeed: 20 };
      default:
        return { strength: 10, health: 100, gatherSpeed: 10, movementSpeed: 20 };
    }
  }

  // Example: Override update to show species name
  update() {
    super.update();
    const center = this.center;
  
    push();
    rectMode(CENTER);
  
    // put the text a bit *below* the ant sprite
    const labelY = center.y + this.sizeY / 2 + 15;
  
    // call your outlinedText helper
    outlinedText(
      this.speciesName,
      center.x,
      labelY,
      font,        // <- your preloaded Terraria.TTF font
      13,          // font size
      color(255),  // inside (fill) color
      color(0)     // outline color
    );
  
    pop();
  }

  ResolveMoment() {
    if (this.isMoving) {
      const current = createVector(this.posX, this.posY);
      const target = createVector(
        this.stats.pendingPos.statValue.x,
        this.stats.pendingPos.statValue.y
      );

      const direction = p5.Vector.sub(target, current);
      const distance = direction.mag();

      if (distance > 1) {
        direction.normalize();
        const speedPerMs = this.stats.movementSpeed.statValue / 1000;
        const step = Math.min(speedPerMs * deltaTime, distance);
        current.x += direction.x * step;
        current.y += direction.y * step;
        this.posX = current.x;
        this.posY = current.y;
        this.sprite.setPosition(current);
      } else {
        this.posX = target.x;
        this.posY = target.y;
        this.isMoving = false;
        this.sprite.setPosition(target);
      }

      this.render();
    }
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
  let speciesList;
  if (!hasDeLozier) { speciesList = _specialSpeciesList; }
  else speciesList = _speciesList;
  const chosenSpecies = speciesList[Math.floor(random(0, speciesList.length))];

  // If DeLozier is chosen, set the flag to true
  if (chosenSpecies === "DeLozier") { hasDeLozier = true; }
  
  return chosenSpecies;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Species;
}