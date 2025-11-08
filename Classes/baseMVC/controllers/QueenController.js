/**
 * QueenController.js
 * 
 * Controller for Queen ants - extends AntController with queen-specific powers and commands.
 * 
 * @class QueenController
 * @extends AntController
 */

if (typeof require !== 'undefined') {
  var AntController = require('./AntController');
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
      if (typeof logNormal === 'function') {
        logNormal(`👑 Queen locked power: ${powerName}`);
      }
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
    const speed = 0.1; // queen moves slower (simplified, no access to movementSpeed in MVC)

    let targetX = pos.x;
    let targetY = pos.y;

    switch (direction) {
      case "w":
        targetY += speed;
        break;
      case "a":
        targetX -= speed;
        break;
      case "s":
        targetY -= speed;
        break;
      case "d":
        targetX += speed;
        break;
    }

    this.moveToLocation(targetX, targetY);
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
