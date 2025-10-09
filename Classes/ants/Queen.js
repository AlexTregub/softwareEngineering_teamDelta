class QueenAnt extends ant {
  constructor(baseAnt) {
    // If a base ant is passed, use its properties; otherwise create a default queen ant
    const posX = baseAnt ? baseAnt.posX : 400;
    const posY = baseAnt ? baseAnt.posY : 300;
    const sizeX = baseAnt ? baseAnt.getSize().x : 60;
    const sizeY = baseAnt ? baseAnt.getSize().y : 60;
    const movementSpeed = baseAnt ? baseAnt.movementSpeed : 30;
    const rotation = baseAnt ? baseAnt.rotation : 0;
    const img = baseAnt ? baseAnt.getImage() : JobImages["Builder"];
    const faction = baseAnt ? baseAnt.faction : "player";

    // Call parent ant constructor
    super(posX, posY, sizeX, sizeY, movementSpeed, rotation, img, "Queen", faction);

    // Queen-specific properties
    this.commandRadius = 250;
    this.ants = []; // ants under her command
    this.coolDown = false;
    this.showCommandRadius = false;
    // Queen should not perform idle random skitter movements
    this.disableSkitter = true;
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

  // --- MOVEMENT OVERRIDE ---

  move(direction) {
    const pos = this.getPosition();
    const speed = this.movementSpeed * 0.5; // queen moves slower

    switch (direction) {
      case "w":
        this.moveToLocation(pos.x, pos.y - speed);
        break;
      case "a":
        this.moveToLocation(pos.x - speed, pos.y);
        break;
      case "s":
        this.moveToLocation(pos.x, pos.y + speed);
        break;
      case "d":
        this.moveToLocation(pos.x + speed, pos.y);
        break;
    }
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
      const pos = this.getPosition();
      push();
      noFill();
      stroke(255, 215, 0, 100);
      strokeWeight(2);
      ellipse(pos.x, pos.y, this.commandRadius * 2);
      pop();
    }
  }
}
