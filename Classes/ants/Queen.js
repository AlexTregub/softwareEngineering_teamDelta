class QueenAnt extends Ant {
  /**
   * Ensure Queen sprite is loaded (lazy load if needed)
   * @returns {p5.Image|undefined} The queen sprite image
   */
  static getQueenSprite() {
    // Check JobImages first (preloaded)
    if (typeof JobImages !== 'undefined' && JobImages["Queen"]) {
      return JobImages["Queen"];
    }
    
    // Lazy load if not already loaded (for custom level direct loading)
    if (!QueenAnt._queenSprite && typeof loadImage === 'function') {
      QueenAnt._queenSprite = loadImage('Images/Ants/gray_ant_queen.png');
    }
    
    return QueenAnt._queenSprite;
  }
  
  constructor(baseAnt) {
    // If a base ant is passed, use its properties; otherwise create a default queen ant
    const posX = baseAnt ? baseAnt.posX : 400;
    const posY = baseAnt ? baseAnt.posY : 300;
    const sizeX = baseAnt ? baseAnt.getSize().x : 32;
    const sizeY = baseAnt ? baseAnt.getSize().y : 32;
    const movementSpeed = baseAnt ? baseAnt.movementSpeed : 30;
    const rotation = baseAnt ? baseAnt.rotation : 0;
    const img = baseAnt ? baseAnt.getImage() : QueenAnt.getQueenSprite();
    const faction = baseAnt ? baseAnt.faction : "player";

    // Call parent ant constructor
    super(posX, posY, sizeX, sizeY, movementSpeed, rotation, img, "Queen", faction);

    // Queen-specific properties
    this.commandRadius = 250;
    this.coolDown = false;
    this.showCommandRadius = false;
    // Queen should not perform idle random skitter movements
    this.disableSkitter = true;

    // Power unlock flags (false by default - unlock via cheats or progression)
    this.unlockedPowers = {
      fireball: false,
      lightning: false,
      blackhole: false,
      sludge: false,
      tidalWave: false
    };
  }

  // --- ANT MANAGEMENT ---

  addAnt(antObj) {
    if (!antObj) return;
    antObj._faction = this.faction;
    this.ants.push(antObj);
  }

  removeAnt(antObj) {
    const index = this.ants.indexOf(antObj);
    if (index > -1) this.ants.splice(index, 1);
  }

  // --- COMMANDS ---

  broadcastCommand(command) {
    for (const worker of this.ants) {
      const pos = worker.getPosition();
      const queenPos = this.getPosition();
      const distance = dist(queenPos.x, queenPos.y, pos.x, pos.y);

      if (distance <= this.commandRadius) {
        switch (command.type) {
          case "MOVE":
            worker.moveToLocation(command.x, command.y);
            break;
          case "GATHER":
            worker.addCommand({ type: "GATHER" });
            break;
          case "BUILD":
            worker.addCommand({ type: "BUILD" });
            break;
          case "DEFEND":
            worker.addCommand({ type: "DEFEND", target: command.target });
            break;
        }
      }
    }
  }

  commandAnt(ant, command) {
    if (this.ants.includes(ant)) {
      ant.addCommand(command);
    }
  }

  gatherAntsAt(x, y) {
    this.broadcastCommand({ type: "MOVE", x, y });
  }

  orderGathering() {
    this.broadcastCommand({ type: "GATHER" });
  }

  orderBuilding() {
    this.broadcastCommand({ type: "BUILD" });
  }

  emergencyRally() {
    const queenPos = this.getPosition();
    this.broadcastCommand({
      type: "MOVE",
      x: queenPos.x,
      y: queenPos.y,
    });
  }

  // --- POWER MANAGEMENT ---

  unlockPower(powerName) {
    if (this.unlockedPowers.hasOwnProperty(powerName)) {
      this.unlockedPowers[powerName] = true;
      logNormal(`👑 Queen unlocked power: ${powerName}`);
      return true;
    }
    console.warn(`⚠️ Unknown power: ${powerName}`);
    return false;
  }

  lockPower(powerName) {
    if (this.unlockedPowers.hasOwnProperty(powerName)) {
      this.unlockedPowers[powerName] = false;
      logNormal(`👑 Queen locked power: ${powerName}`);
      return true;
    }
    return false;
  }

  isPowerUnlocked(powerName) {
    return this.unlockedPowers[powerName] === true;
  }

  getUnlockedPowers() {
    return Object.keys(this.unlockedPowers).filter(power => this.unlockedPowers[power]);
  }

  getAllPowers() {
    return { ...this.unlockedPowers };
  }

  // --- MOVEMENT OVERRIDE ---

  move(direction) {
    const pos = this.getPosition();
    const speed = this.movementSpeed * 0.1; // queen moves slower
    
    console.log(`👑 [Queen] move(${direction}) - Current pos: (${Math.round(pos.x)}, ${Math.round(pos.y)}), speed: ${speed}`);

    switch (direction) {
      case "w":
        this.moveToLocation(pos.x, pos.y + speed);
        break;
      case "a":
        this.moveToLocation(pos.x - speed, pos.y);
        break;
      case "s":
        this.moveToLocation(pos.x, pos.y - speed);
        break;
      case "d":
       this.moveToLocation(pos.x + speed, pos.y);
        break;
    }
    
    const newPos = this.getPosition();
  }


  update() {
    super.update();
    // Example AI logic placeholder
    // this.broadcastCommand({ type: "GATHER" });
  }

  render() {
    super.render();

    // Draw command radius if visible
    if (this.showCommandRadius) {
      // Use Entity's getScreenPosition for proper coordinate conversion
      const screenPos = this.getScreenPosition();
      
      push();
      noFill();
      stroke(255, 215, 0, 100);
      strokeWeight(2);
      ellipse(screenPos.x, screenPos.y, this.commandRadius * 2);
      pop();
    }
  }
}

// Export for both browser and Node.js
if (typeof window !== 'undefined') {
  window.QueenAnt = QueenAnt;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = QueenAnt;
}
