class QueenAnt extends ant {
  constructor(baseAnt,target=NONE) {
    // If a base ant is passed, use its properties; otherwise create a default queen ant
    // console.log('queen',baseAnt.posX, baseAnt.posY, baseAnt.getSize().x, baseAnt.getSize().y, baseAnt.movementSpeed, baseAnt.rotation || 0, baseAnt.getImage(), baseAnt._faction);

    // Call parent ant constructor
    // console.log(Buildings)
    // console.log(Buildings[0])     

    console.log("TARGETBUILDINGANTHILL",Buildings,Buildings[0])


    // super(baseAnt.posX, baseAnt.posY, 55,55, baseAnt.movementSpeed, baseAnt.rotation || 0, baseAnt.getImage(),"Queen", baseAnt._faction);
    if (target == NONE) {
      super(Buildings[0]._x, Buildings[0]._y, 55,55, baseAnt.movementSpeed, baseAnt.rotation || 0, baseAnt.getImage(),"Queen", baseAnt._faction);
    } else {
      super(target[0], target[1], 55,55, baseAnt.movementSpeed, baseAnt.rotation || 0, baseAnt.getImage(),"Queen", baseAnt._faction)
    }
    
    // super(closestHive.posX, closestHive.posY, 55,55, baseAnt.movementSpeed, baseAnt.rotation || 0, baseAnt.getImage(),"Queen", baseAnt._faction);
    
    // let closestHive = this.nearestFriendlyBuilding(
    //   Buildings.filter(b => b.type === "Building" && b._faction === this._faction)
    // )[0];


    // Queen-specific properties
    this.commandRadius = 250;
    this.ants = []; // ants under her command
    this.coolDown = false;
    this.showCommandRadius = false;
    // Queen should not perform idle random skitter movements
    this.getController('movement').disableSkitter = true;
    this._attackCooldown = .25; // seconds

    // Power unlock flags (false by default - unlock via cheats or progression)
    this.unlockedPowers = {
      fireball: true,
      lightning: true,
      blackhole: false,
      sludge: false,
      tidalWave: false,
      finalFlash: true
    };
    
    // Power levels (1-3, determines strength/effects)
    this.powerLevels = {
      fireball: 1,
      lightning: 1,
      blackhole: 1,
      sludge: 1,
      tidalWave: 1,
      finalFlash: 1
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

  // --- POWER LEVEL MANAGEMENT ---
  
  setPowerLevel(powerName, level) {
    if (this.powerLevels.hasOwnProperty(powerName)) {
      this.powerLevels[powerName] = Math.max(1, Math.min(3, level));
      logNormal(`👑 Queen set ${powerName} to level ${this.powerLevels[powerName]}`);
      
      // Update the corresponding manager's level if it exists
      if (powerName === 'lightning' && typeof window.g_lightningManager !== 'undefined' && window.g_lightningManager) {
        window.g_lightningManager.setLevel(this.powerLevels[powerName]);
      }
      
      return true;
    }
    return false;
  }
  
  getPowerLevel(powerName) {
    return this.powerLevels[powerName] || 1;
  }
  
  getAllPowerLevels() {
    return { ...this.powerLevels };
  }

  // --- MOVEMENT OVERRIDE ---

  move(direction) {
    const pos = this.getPosition();
    const speed = this.movementSpeed ; // queen moves slower

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
  }

  // State Override -- 
  startGathering(){return;}


  update() {
    super.update();
    let isIdle = this._stateMachine.isPrimaryState("IDLE");
    if(!isIdle){
      this._stateMachine.setPrimaryState("IDLE");
    }

    // Example AI logic placeholder
    // this.broadcastCommand({ type: "GATHER" });
  }

  render() {
    
    if (this._type == "Queen") {
      let temp = this.getPosition()
      // let temp1 = this._controllers.get("render").worldToScreenPos(temp)
      let temp1 = this._controllers.get("render").worldToScreenPosition(temp)

      let temp2 = g_activeMap.renderConversion.convCanvasToPos([temp1.x,temp1.y])

      // console.log(temp,temp1,temp2)
      // console.log("QUEEN POSITION @ ",temp2)
      // console.log("QueenPos:",this.getPosition(),g_activeMap.renderConversion.convCanvasToPos([this.getPosition().x,this.getPosition().y]))
    }
    


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

// Window helper command for upgrading powers
if (typeof window !== 'undefined') {
  window.upgradePower = function(powerName, level) {
    const queen = typeof getQueen === 'function' ? getQueen() : null;
    if (!queen) {
      console.error('❌ Queen not found! Make sure the game is running.');
      return false;
    }
    
    if (!level) {
      console.log('📊 Current power levels:', queen.getAllPowerLevels());
      console.log('💡 Usage: window.upgradePower("lightning", 2)');
      return queen.getAllPowerLevels();
    }
    
    const success = queen.setPowerLevel(powerName, level);
    if (success) {
      console.log(`✅ ${powerName} upgraded to level ${queen.getPowerLevel(powerName)}`);
      
      // Visual feedback
      if (powerName === 'lightning') {
        const rangeInTiles = 7 + ((level - 1) * 7);
        if (level === 2) {
          console.log('⚡⚡⚡ Lightning now fires THREE bolts in sequence!');
          console.log(`📏 Range increased to ${rangeInTiles} tiles (${rangeInTiles * 32}px)`);
        } else if (level === 3) {
          console.log('⚡⚡⚡ Lightning Level 3!');
          console.log(`📏 Range increased to ${rangeInTiles} tiles (${rangeInTiles * 32}px)`);
        }
      }
    } else {
      console.error(`❌ Failed to upgrade ${powerName}. Available powers:`, Object.keys(queen.powerLevels));
    }
    return success;
  };
  
  // Also add a shortcut for checking levels
  window.showPowerLevels = function() {
    const queen = typeof getQueen === 'function' ? getQueen() : null;
    if (!queen) {
      console.error('❌ Queen not found!');
      return;
    }
    const levels = queen.getAllPowerLevels();
    console.log('📊 Power Levels:');
    for (const [power, level] of Object.entries(levels)) {
      const unlocked = queen.isPowerUnlocked(power) ? '✅' : '🔒';
      console.log(`  ${unlocked} ${power}: Level ${level}`);
    }
    return levels;
  };
}
