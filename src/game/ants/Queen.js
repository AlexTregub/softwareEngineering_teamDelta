// Queen.js
// Manages commands and coordinates ant activities

class Queen {
  constructor(x = 400, y = 300, faction = "player") {
    this.position = createVector(x, y);
    this.faction = faction;
    this.commandRadius = 200; // Range within which queen can command ants
    this.ants = []; // Ants under this queen's command
  }

  // Add an ant to this queen's command
  addAnt(ant) {
    ant._faction = this.faction;
    this.ants.push(ant);
  }

  // Remove an ant from command
  removeAnt(ant) {
    const index = this.ants.indexOf(ant);
    if (index > -1) {
      this.ants.splice(index, 1);
    }
  }

  // Send command to all ants in range
  broadcastCommand(command) {
    for (const ant of this.ants) {
      const pos = ant.getPosition();
      const distance = dist(this.position.x, this.position.y, pos.x, pos.y);
      if (distance <= this.commandRadius) {
        this._sendCommandToAnt(ant, command);
      }
    }
  }
  
  // Helper method to send command to individual ant
  _sendCommandToAnt(ant, command) {
    switch (command.type) {
      case "MOVE":
        ant.moveToLocation(command.x, command.y);
        break;
      case "GATHER":
        ant.addTask({ type: "GATHER", priority: 1 });
        break;
      case "ATTACK":
        ant.addTask({ type: "ATTACK", target: command.target, priority: 2 });
        break;
      case "RETURN":
        ant.addTask({ type: "RETURN", priority: 1 });
        break;
    }
  }

  // Send command to specific ant
  commandAnt(ant, command) {
    if (this.ants.includes(ant)) {
      ant.addCommand(command);
    }
  }

  // Command all ants to gather at a location
  gatherAntsAt(x, y) {
    this.broadcastCommand({ type: "MOVE", x: x, y: y });
  }

  // Command all ants to start gathering resources
  orderGathering() {
    this.broadcastCommand({ type: "GATHER" });
  }

  // Command all ants to start building
  orderBuilding() {
    this.broadcastCommand({ type: "BUILD" });
  }

  // Get status of all ants under command
  getAntStatus() {
    return this.ants.g_map(ant => ({
      antIndex: ant.antIndex,
      state: ant.getCurrentState(),
      position: ant.getPosition(),
      isInCombat: ant.isInCombat(),
      commandQueueLength: ant.commandQueue.length
    }));
  }

  // Find ants in a specific state
  getAntsInState(stateName) {
    return this.ants.filter(ant => ant.getCurrentState().includes(stateName));
  }

  // Emergency command - bring all ants to queen for defense
  emergencyRally() {
    this.broadcastCommand({ 
      type: "MOVE", 
      x: this.position.x, 
      y: this.position.y 
    });
  }

  // Update queen logic
  update() {
    // Queen could have AI logic here, like:
    // - Monitoring ant states
    // - Automatic resource gathering commands
    // - Defense coordination
    // - etc.
  }

  // Render the queen (optional visual representation)
  render() {
    if (typeof push !== "undefined") {
      push();
      fill(255, 215, 0); // Gold color for queen
      stroke(0);
      strokeWeight(2);
      ellipse(this.position.x, this.position.y, 30, 30);
      
      // Draw command radius (optional debug view)
      if (this.showCommandRadius) {
        noFill();
        stroke(255, 215, 0, 100);
        strokeWeight(1);
        ellipse(this.position.x, this.position.y, this.commandRadius * 2, this.commandRadius * 2);
      }
      pop();
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Queen;
}