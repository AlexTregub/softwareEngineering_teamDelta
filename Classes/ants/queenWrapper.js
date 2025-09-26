class QueenWrapper extends AntWrapper{
    constructor(antWrap){
        super(
            antWrap.antObject,
            antWrap.speciesName,
            antWrap.speciesImage,
        );
        this.maxWeight = 10;
        this.commandRadius = 200; // Range within which queen can command ants
        this.ants = []; // Ants under this queen's command
        this.position = createVector(this.posX,this.posY);
        this.coolDown = false;
    }
    addAnt(ant) {
        ant.faction = this.faction;
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
        const distance = dist(this.position.x, this.position.y, ant.posX, ant.posY);
        if (distance <= this.commandRadius) {
            ant.addCommand(command);
        }
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
    return this.ants.map(ant => ({
      antIndex: ant.antIndex,
      state: ant.getCurrentState(),
      position: { x: ant.posX, y: ant.posY },
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

    // limit ants selection based on distance to ants
    // send commands to ranged ants
    // limit ants hightlight to ants close to queen
    // quick bind or ui for commands

    super.update();
    this.render();

    if(!this.coolDown){
        // If press E then
        if(keyIsDown(69)){
            this.gatherAntsAt(this.position.x,this.position.y);
            console.log("pressed")
        }
    }
  }

  // Render the queen (optional visual representation)
  render() {
    
    // if (typeof push !== "undefined") {
    //   push();
    //   fill(255, 215, 0); // Gold color for queen
    //   stroke(0);
    //   strokeWeight(2);
    //   ellipse(this.position.x, this.position.y, 30, 30);
      
    //   // Draw command radius (optional debug view)
    //   if (this.showCommandRadius) {
    //     noFill();
    //     stroke(255, 215, 0, 100);
    //     strokeWeight(1);
    //     ellipse(this.position.x, this.position.y, this.commandRadius * 2, this.commandRadius * 2);
    //   }
    //   pop();
    // }
  }
}

