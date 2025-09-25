const _speciesList = ["Builder", "Scout", "Farmer", "Warrior", "Spitter"];
const _specialSpeciesList = ["DeLozier"]
const _allSpecies = [..._speciesList, ..._specialSpeciesList];

class Species extends ant {
  constructor(antObject, speciesName, speciesImage) {
    const speciesStats = Species.getSpeciesStats(speciesName);
    const pos = antObject.getPosition();
    const size = antObject.getSize();
    
    super(
      pos.x,
      pos.y,
      size.x,
      size.y,
      speciesStats.movementSpeed ?? 30,
      0,
      speciesImage, // Pass the image here!
      speciesName
    );
    
    this.img = speciesImage;
    this.speciesName = speciesName;
    this.exp = antObject.stats?.exp || 0;
    
    // Apply species-specific stats
    this._applySpeciesStats(speciesStats);
    this.waypoints = []; // Array of {x, y} locations
  }
  
  _applySpeciesStats(speciesStats) {
    // Update health system
    this._maxHealth = speciesStats.health;
    this._health = speciesStats.health;
    this._damage = speciesStats.strength;
    
    // Update stats if available
    if (this.stats) {
      this.stats.strength.statValue = speciesStats.strength;
      this.stats.health.statValue = speciesStats.health;
      this.stats.gatherSpeed.statValue = speciesStats.gatherSpeed;
      this.stats.movementSpeed.statValue = speciesStats.movementSpeed;
    }
    
    // Update movement controller if available
    const movementController = this.getController('movement');
    if (movementController) {
      movementController.movementSpeed = speciesStats.movementSpeed;
    }
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
      default:
        return { strength: 10, health: 100, gatherSpeed: 10, movementSpeed: 20 };
    }
  }

  // Example: Override update to show species name
  update() {
    super.update();
    
    // Species labels always enabled
    if (typeof outlinedText !== 'undefined') {
      const center = this.getCenter();
    
      push();
      rectMode(CENTER);
    
      // put the text a bit *below* the ant sprite
      const size = this.getSize();
      const labelY = center.y + size.y / 2 + 15;
    
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
  }

  ResolveMoment() {
    if (this._isMoving) {
      const pos = this.getPosition();
      const current = createVector(pos.x, pos.y);
      const target = createVector(
        this._stats.pendingPos.statValue.x,
        this._stats.pendingPos.statValue.y
      );

      const direction = p5.Vector.sub(target, current);
      const distance = direction.mag();

      if (distance > 1) {
        direction.normalize();
        const speedPerMs = this.movementSpeed / 1000;
        const step = Math.min(speedPerMs * deltaTime, distance);
        current.x += direction.x * step;
        current.y += direction.y * step;
        this.setPosition(current.x, current.y);
        this.setImage(current);
      } else {

        // Target Reach

        this.setPosition(target.x, target.y);
        this._isMoving = false;
        this.setImage(target);

        // Stores Resource and Reset State Upon Dropoff
        if(this.isDroppingOff || this.isMaxWeight ){
          for(let r of this.Resources){
            globalResource.push(r);
          }

          this.Resources = [];
          this.isDroppingOff = false;
          this.isMaxWeight  = false;
        }
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

// --- Species Management Functions ---

// Assigns a random species to an ant
function assignSpecies() {
  // Add DeLozier to the species list only if it hasn't been created yet
  const speciesList = !hasDeLozier ? _specialSpeciesList : _speciesList;
  const chosenSpecies = speciesList[Math.floor(random(0, speciesList.length))];

  // If DeLozier is chosen, set the flag to true
  if (chosenSpecies === "DeLozier") { 
    hasDeLozier = true; 
  }
  
  return chosenSpecies;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = Species;
}