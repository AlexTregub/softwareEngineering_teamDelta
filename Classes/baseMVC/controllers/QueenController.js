/**
 * QueenController.js
 * 
 * Controller for Queen ants - extends AntController with queen-specific powers and commands.
 * 
 * @class QueenController
 * @extends AntController
 */

// Node.js: Load AntController
if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
  const AntController = require('./AntController');
  global.AntController = AntController;
}

class QueenController extends AntController {
  constructor(model, view) {
    super(model, view);
    
    // Queen-specific properties
    this.commandRadius = 250;
    this.ants = []; // ants under her command
    this.coolDown = false;
    this.showCommandRadius = false;
    
    // Power unlock flags (false by default - unlock via cheats or progression)
    this.unlockedPowers = {
      fireball: false,
      lightning: false,
      blackhole: false,
      sludge: false,
      tidalWave: false,
      finalFlash: false
    };
  }

  // ========================================
  // ANT MANAGEMENT
  // ========================================

  addAnt(antMVC) {
    if (!antMVC) return;
    // Set faction on the ant's model
    if (antMVC.model) {
      antMVC.model.setFaction(this.model.getFaction());
    }
    this.ants.push(antMVC);
  }

  removeAnt(antMVC) {
    const index = this.ants.indexOf(antMVC);
    if (index > -1) this.ants.splice(index, 1);
  }

  // ========================================
  // COMMANDS
  // ========================================

  broadcastCommand(command) {
    const queenPos = this.model.getPosition();
    
    for (const worker of this.ants) {
      if (!worker || !worker.model || !worker.controller) continue;
      
      const pos = worker.model.getPosition();
      const distance = Math.sqrt(
        Math.pow(queenPos.x - pos.x, 2) + 
        Math.pow(queenPos.y - pos.y, 2)
      );

      if (distance <= this.commandRadius) {
        switch (command.type) {
          case "MOVE":
            if (worker.controller.moveToLocation) {
              worker.controller.moveToLocation(command.x, command.y);
            }
            break;
          case "GATHER":
            if (worker.controller.addCommand) {
              worker.controller.addCommand({ type: "GATHER" });
            }
            break;
          case "BUILD":
            if (worker.controller.addCommand) {
              worker.controller.addCommand({ type: "BUILD" });
            }
            break;
          case "DEFEND":
            if (worker.controller.addCommand) {
              worker.controller.addCommand({ type: "DEFEND", target: command.target });
            }
            break;
        }
      }
    }
  }

  commandAnt(antMVC, command) {
    if (this.ants.includes(antMVC) && antMVC.controller && antMVC.controller.addCommand) {
      antMVC.controller.addCommand(command);
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
    const queenPos = this.model.getPosition();
    this.broadcastCommand({
      type: "MOVE",
      x: queenPos.x,
      y: queenPos.y,
    });
  }

  // ========================================
  // POWER MANAGEMENT
  // ========================================

  unlockPower(powerName) {
    if (this.unlockedPowers.hasOwnProperty(powerName)) {
      this.unlockedPowers[powerName] = true;
      if (typeof logNormal === 'function') {
        logNormal(`👑 Queen unlocked power: ${powerName}`);
      }
      return true;
    }
    console.warn(`⚠️ Unknown power: ${powerName}`);
    return false;
  }

  lockPower(powerName) {
    if (this.unlockedPowers.hasOwnProperty(powerName)) {
      this.unlockedPowers[powerName] = false;
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

  // ========================================
  // MOVEMENT OVERRIDE
  // ========================================

  move(direction) {
    const pos = this.model.getPosition();
    const baseSpeed = this.model.getMovementSpeed();
    const moveDistance = 5; // Small distance per keypress
    const speedMultiplier = 50; // Fast movement speed to reach target quickly

    console.log(`[QueenController.move] Direction: ${direction}, Current Pos: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}), BaseSpeed: ${baseSpeed}`);

    let targetX = pos.x;
    let targetY = pos.y;

    switch (direction) {
      case "w":
        targetY += moveDistance;
        break;
      case "a":
        targetX -= moveDistance;
        break;
      case "s":
        targetY -= moveDistance;
        break;
      case "d":
        targetX += moveDistance;
        break;
    }

    // Temporarily boost movement speed for responsive WASD control
    const originalSpeed = this.model.getMovementSpeed();
    this.model.setMovementSpeed(originalSpeed * speedMultiplier);
    
    console.log(`[QueenController.move] Target: (${targetX.toFixed(1)}, ${targetY.toFixed(1)}), Speed boosted to: ${this.model.getMovementSpeed()}`);
    this.moveToLocation(targetX, targetY);
    
    // Reset speed after a short delay (will reach target quickly with boosted speed)
    setTimeout(() => {
      this.model.setMovementSpeed(originalSpeed);
    }, 100);
  }

  // ========================================
  // UPDATE & RENDER OVERRIDES
  // ========================================

  update() {
    super.update(); // Call parent AntController update
    // Example AI logic placeholder
    // this.broadcastCommand({ type: "GATHER" });
  }

  render() {
    super.render();

    // Draw command radius if visible
    if (this.showCommandRadius && typeof push === 'function') {
      const pos = this.model.getPosition();
      
      // Convert to screen coordinates
      let screenX = pos.x;
      let screenY = pos.y;
      if (typeof cameraManager !== 'undefined' && cameraManager) {
        const screenPos = cameraManager.worldToScreen(pos.x, pos.y);
        screenX = screenPos.x;
        screenY = screenPos.y;
      }
      
      push();
      noFill();
      stroke(255, 215, 0, 100);
      strokeWeight(2);
      ellipse(screenX, screenY, this.commandRadius * 2);
      pop();
    }
  }

  // ========================================
  // DEBUG INFO
  // ========================================

  getDebugInfo() {
    const baseDebug = super.getDebugInfo();
    return {
      ...baseDebug,
      type: 'Queen',
      commandRadius: this.commandRadius,
      antsUnderCommand: this.ants.length,
      unlockedPowers: this.getUnlockedPowers(),
      showCommandRadius: this.showCommandRadius
    };
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.QueenController = QueenController;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QueenController;
}
