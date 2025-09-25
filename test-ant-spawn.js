// Quick test to verify ant spawning works
// Run with: node test-ant-spawn.js

// Mock p5.js functions
global.random = (min, max) => Math.random() * (max - min) + min;
global.createVector = (x, y) => ({ x, y, copy: function() { return { x: this.x, y: this.y }; } });
global.loadImage = (path) => ({ path });

// Mock p5.js rendering functions
global.noSmooth = () => {};
global.smooth = () => {};
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.noFill = () => {};
global.stroke = () => {};
global.noStroke = () => {};
global.ellipse = () => {};
global.rect = () => {};
global.image = () => {};
global.tint = () => {};
global.noTint = () => {};
global.translate = () => {};
global.rotate = () => {};
global.scale = () => {};
global.line = () => {};
global.text = () => {};
global.textAlign = () => {};
global.textSize = () => {};
global.textFont = () => {};
global.rectMode = () => {};
global.ellipseMode = () => {};
global.imageMode = () => {};
global.CENTER = 'CENTER';
global.CORNER = 'CORNER';
global.LEFT = 'LEFT';
global.RIGHT = 'RIGHT';

// Mock additional functions
global.renderStateIndicators = () => {};
global.color = (r, g, b, a) => ({ r, g, b, a });

// Mock global variables needed for ant spawning
global.hasDeLozier = false;
global.ant_Index = 0;
global.ants = [];
global.antSize = { x: 20, y: 20 };
global.antImg1 = { path: "mock_image" };
global.gregImg = { path: "greg_image" };
global.mouseX = 100;
global.mouseY = 100;
global.resourceList = {
  getResourceList: () => []
};
global.speciesImages = {
  Builder: { path: "blue_ant" },
  Scout: { path: "gray_ant" },
  Farmer: { path: "brown_ant" },
  Warrior: { path: "blue_ant" },
  Spitter: { path: "gray_ant" },
  DeLozier: { path: "greg" }
};

// Mock classes
class MockStats {
  constructor(pos, size, speed, target) {
    this.position = pos;
    this.size = size;
    this.movementSpeed = speed;
    this.targetPosition = target;
    this.exp = 0;
    this.strength = { statValue: 10 };
    this.health = { statValue: 100 };
    this.gatherSpeed = { statValue: 5 };
  }
}

class MockSprite2D {
  constructor(img, pos, size, rotation) {
    this.image = img;
    this.position = pos;
    this.pos = pos; // Also add pos alias for compatibility
    this.size = size;
    this.rotation = rotation;
  }
  
  render() {
    // Mock render method
  }
  
  setImage(img) {
    this.image = img;
  }
}

class MockStateMachine {
  constructor(ant) {
    this.ant = ant;
    this.primaryState = "IDLE";
    this.combatModifier = "OUT_OF_COMBAT";
    this.terrainModifier = "DEFAULT";
  }
  
  setStateChangeCallback(callback) { this.callback = callback; }
  setTerrainModifier(modifier) { this.terrainModifier = modifier; }
  getCurrentState() { return this.primaryState; }
  getFullState() { return this.primaryState; }
  update() { /* Mock update */ }
  
  // State checking methods
  isPrimaryState(state) { return this.primaryState === state; }
  isInCombat() { return this.combatModifier !== "OUT_OF_COMBAT"; }
  isOutOfCombat() { return this.combatModifier === "OUT_OF_COMBAT"; }
  isOnTerrain(terrain) { return this.terrainModifier === terrain; }
  isInState(fullState) { return this.getFullState() === fullState; }
  
  // Primary state queries
  isIdle() { return this.primaryState === "IDLE" && this.isOutOfCombat(); }
  isMoving() { return this.primaryState === "MOVING"; }
  isGathering() { return this.primaryState === "GATHERING"; }
  isFollowing() { return this.primaryState === "FOLLOWING"; }
  isBuilding() { return this.primaryState === "BUILDING"; }
  isSocializing() { return this.primaryState === "SOCIALIZING"; }
  isMating() { return this.primaryState === "MATING"; }
  
  // Combat methods
  enterCombat(enemy) { this.combatModifier = "IN_COMBAT"; }
  exitCombat() { this.combatModifier = "OUT_OF_COMBAT"; }
  
  // Faction integration methods
  checkForAlliedNeeds() { /* Mock */ }
}

global.stats = MockStats;
global.Sprite2D = MockSprite2D;
global.AntStateMachine = MockStateMachine;

// Import ant-related files
try {
  require('./Classes/ants/species.js');
  const AntWrapper = require('./Classes/ants/antWrapper.js');
  global.AntWrapper = AntWrapper;
  const antsModule = require('./Classes/ants/ants.js');
  global.ant = antsModule.ant || antsModule;
  global._Species = global.Species; // Make sure _Species is available
  
  console.log('🧪 Testing Ant Spawning...');
  
  // Test assignSpecies function
  console.log('Testing assignSpecies function...');
  const species1 = assignSpecies();
  const species2 = assignSpecies();
  console.log(`✅ assignSpecies() works: ${species1}, ${species2}`);
  
  // Test ant spawning
  console.log('Testing Ants_Spawn function...');
  console.log('Before spawn - global.ant_Index:', global.ant_Index, 'global.ants.length:', global.ants.length);
  console.log('Before spawn - ants variable:', typeof ants, ants.length);
  
  Ants_Spawn(3);
  
  console.log('After spawn - global.ant_Index:', global.ant_Index, 'global.ants.length:', global.ants.length);
  console.log('After spawn - ants variable:', typeof ants, ants.length);
  console.log(`✅ Ants_Spawn() works: Created ${global.ants.length} ants`);
  
  // Check ant properties
  global.ants.forEach((ant, i) => {
    if (ant) {
      console.log(`   Ant ${i}: Species=${ant.species}, AntObject=${!!ant.antObject}`);
    } else {
      console.log(`   Ant ${i}: undefined/null`);
    }
  });
  
  console.log('🎉 All ant spawning tests passed!');
  
} catch (error) {
  console.error('❌ Ant spawning test failed:', error.message);
  console.error('Stack trace:', error.stack);
}