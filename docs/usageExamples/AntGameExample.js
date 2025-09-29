// AntStateMachine Integration Example
// This file demonstrates how to use the new state machine features
// const Queen = require('./Queen.js');

// Example usage in your main game file:

function setupAntGame() {
  // Create queens for different factions
  let playerQueen = new Queen(400, 300, "player");
  let enemyQueen = new Queen(100, 100, "enemy");
  
  // Spawn ants and assign to queens
  Ants_Spawn(10); // Your existing spawn function
  
  // Assign first 5 ants to player, next 5 to enemy
  for (let i = 0; i < antIndex; i++) {
    if (i < 5) {
      playerQueen.addAnt(ants[i].antObject || ants[i]);
    } else {
      enemyQueen.addAnt(ants[i].antObject || ants[i]);
    }
  }
  
  return { playerQueen, enemyQueen };
}

// Example queen commands
function demonstrateQueenCommands(queen) {
  // Command all ants to gather resources
  queen.orderGathering();
  
  // Command specific ant to move to location
  if (queen.ants.length > 0) {
    queen.commandAnt(queen.ants[0], { type: "MOVE", x: 500, y: 400 });
  }
  
  // Emergency rally all ants to queen
  queen.emergencyRally();
  
  // Get status report
  const status = queen.getAntStatus();
  console.log("Ant Status Report:", status);
}

// Example terrain integration (you'll need to adapt this to your grid system)
function integrateWithTerrain() {
  // Override the detectTerrain method in your ant instances
  ant.prototype.detectTerrain = function() {
    // Example: Check your grid/tile system
    const tileX = Math.floor(this.posX / TILE_SIZE);
    const tileY = Math.floor(this.posY / TILE_SIZE);
    
    // Replace with your actual terrain checking logic
    if (isWaterTile(tileX, tileY)) return "IN_WATER";
    if (isMudTile(tileX, tileY)) return "IN_MUD";
    if (isSlipperyTile(tileX, tileY)) return "ON_SLIPPERY";
    if (isRoughTile(tileX, tileY)) return "ON_ROUGH";
    
    return "DEFAULT";
  };
}

// Example keyboard controls for commanding ants
function handleKeyCommands() {
  if (keyIsPressed) {
    switch (key) {
      case 'g':
        // Command selected ant to gather
        if (selectedAnt) {
          selectedAnt.startGathering();
        }
        break;
      case 'b':
        // Command selected ant to build
        if (selectedAnt) {
          selectedAnt.startBuilding();
        }
        break;
      case 'f':
        // Command selected ant to follow mouse
        if (selectedAnt) {
          selectedAnt.followTarget({ x: mouseX, y: mouseY });
        }
        break;
      case 'r':
        // Rally all ants to mouse position
        if (playerQueen) {
          playerQueen.gatherAntsAt(mouseX, mouseY);
        }
        break;
    }
  }
}



// Integration with your existing mouse controls
function enhancedAntClickControl() {
  if (selectedAnt) {
    // If holding shift, add command to queue instead of replacing
    if (keyIsDown(SHIFT)) {
      selectedAnt.addCommand({ type: "MOVE", x: mouseX, y: mouseY });
    } else {
      selectedAnt.moveToTarget(mouseX, mouseY);
    }
    selectedAnt.isSelected = false;
    selectedAnt = null;
    return;
  }

  // Select ant under mouse
  selectedAnt = ant.selectAntUnderMouse(ants, mouseX, mouseY);
}

// Example state-based AI behaviors
function updateAntAi(ant) {
  // Example: Automatic behavior based on state
  
  if (ant.isIdle() && ant.faction === "enemy") {
    // Enemy ants patrol when idle
    if (Math.random() < 0.01) { // 1% chance per frame
      const patrolX = ant.posX + random(-100, 100);
      const patrolY = ant.posY + random(-100, 100);
      ant.moveToTarget(patrolX, patrolY);
    }
  }
  
  if (ant.isInCombat()) {
    // Combat behavior - attack nearest enemy
    if (ant.nearbyEnemies.length > 0 && ant.stateMachine.canPerformAction("attack")) {
      ant.stateMachine.setCombatModifier("ATTACKING");
      // Add actual combat logic here
    }
  }
}

/* 
Usage in your main game loop:

function setup() {
  // Your existing setup
  const { playerQueen, enemyQueen } = setupAntGame();
  integrateWithTerrain();
}

function draw() {
  // Your existing rendering
  
  // Update queens
  playerQueen.update();
  enemyQueen.update();
  
  // Update ants (your existing antsUpdate function already calls ant.update())
  antsUpdate();
  
  // Additional AI updates
  for (let i = 0; i < antIndex; i++) {
    if (ants[i]) {
      const antObj = ants[i].antObject || ants[i];
      updateAntAI(antObj);
    }
  }
  
  // Handle input
  handleKeyCommands();
  
  // Debug display
  displayAntDebugInfo();
  
  // Render queens
  playerQueen.render();
  enemyQueen.render();
}

function mousePressed() {
  enhancedAntClickControl();
}
*/

module.exports = {
  setupAntGame,
  demonstrateQueenCommands,
  integrateWithTerrain,
  handleKeyCommands,
  displayAntDebugInfo,
  enhancedAntClickControl,
  updateAntAI
};