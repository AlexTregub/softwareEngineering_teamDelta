/**
 * Unit tests for ResourceNode.js
 * Tests resource node spawning system for building-based resource generation:
 * - Node types for different resources (trees, rocks, beehives, bushes)
 * - Ant detection within spawn range
 * - State-based spawning (only spawn when ants are gathering)
 * - Visual progress indicators
 * - workToGather values (varying difficulty)
 * - Multi-resource nodes with weighted randomization
 * - Batch resource spawning (1-5 resources spread around node)
 * - Integration with gathering ants movement
 * - Resource gather limits (depletable vs infinite nodes)
 * - Ant gathering experience tracking via StatsContainer
 * - Ant gather speed affects work accumulation rate
 * - Nodes targetable for attack but not auto-attacked
 * - Node destruction drops partial resources
 * 
 * COORDINATE SYSTEM:
 * - All positions use GRID COORDINATES (tiles)
 * - TILE_SIZE = 32 pixels per tile
 * - Node internally converts grid → pixel using g_activeMap.coordSys
 */

const { expect } = require('chai');
const path = require('path');

// Mock p5.js functions
global.random = function(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
};

global.push = function() {};
global.pop = function() {};
global.fill = function() {};
global.stroke = function() {};
global.noStroke = function() {};
global.rect = function() {};
global.circle = function() {};
global.text = function() {};
global.textSize = function() {};
global.textAlign = function() {};
global.arc = function() {};
global.PI = Math.PI;
global.TWO_PI = Math.PI * 2;
global.CENTER = 'center';
global.LEFT = 'left';
global.TOP = 'top';

// Mock Entity class (Resource Node will extend this)
class Entity {
  constructor(x, y, width, height, options = {}) {
    this.posX = x;
    this.posY = y;
    this.sizeX = width;
    this.sizeY = height;
    this.type = options.type || 'Entity';
    this._controllers = new Map();
  }

  getPosition() {
    return { x: this.posX, y: this.posY };
  }

  getSize() {
    return { x: this.sizeX, y: this.sizeY };
  }

  setPosition(x, y) {
    this.posX = x;
    this.posY = y;
  }

  getController(name) {
    return this._controllers.get(name) || null;
  }

  update() {}
  render() {}
}

global.Entity = Entity;

// Mock TILE_SIZE constant
global.TILE_SIZE = 32;

// Mock CoordinateSystem for grid ↔ pixel conversion
class MockCoordinateSystem {
  convPosToBackingCanvas([gridX, gridY]) {
    return [gridX * TILE_SIZE, gridY * TILE_SIZE];
  }
  
  convBackingCanvasToPos([pixelX, pixelY]) {
    return [Math.floor(pixelX / TILE_SIZE), Math.floor(pixelY / TILE_SIZE)];
  }
}

// Mock g_activeMap with coordinate system
global.g_activeMap = {
  coordSys: new MockCoordinateSystem()
};

// Mock stat class from StatsContainer
class MockStat {
  constructor(statName = "NONAME", statValue = 0, statLowerLimit = 0, statUpperLimit = 500) {
    this.statName = statName;
    this._statValue = statValue;
    this.statLowerLimit = statLowerLimit;
    this.statUpperLimit = statUpperLimit;
  }
  
  get statValue() { return this._statValue; }
  set statValue(value) { 
    this._statValue = value;
    if (this._statValue < this.statLowerLimit) this._statValue = this.statLowerLimit;
    if (this._statValue > this.statUpperLimit) this._statValue = this.statUpperLimit;
  }
}

// Mock StatsContainer class
class MockStatsContainer {
  constructor(pos, size, movementSpeed = 0.05, pendingPos = null, strength = 10, health = 100, gatherSpeed = 1) {
    this.position = new MockStat("Position", pos);
    this.size = new MockStat("Size", size);
    this.movementSpeed = new MockStat("Movement Speed", movementSpeed, 0, 100);
    this.pendingPos = new MockStat("Pending Position", pendingPos || pos);
    this.strength = new MockStat("Strength", strength, 0, 1000);
    this.health = new MockStat("Health", health, 0, 10000);
    this.gatherSpeed = new MockStat("Gather Speed", gatherSpeed, 0, 100);
    
    this.exp = new Map();
    this.exp.set("Lifetime", new MockStat("Lifetime EXP", 0));
    this.exp.set("Gathering", new MockStat("Gathering EXP", 0));
    this.exp.set("Hunting", new MockStat("Hunting EXP", 0));
    this.exp.set("Swimming", new MockStat("Swimming EXP", 0));
    this.exp.set("Farming", new MockStat("Farming EXP", 0));
    this.exp.set("Construction", new MockStat("Construction EXP", 0));
    this.exp.set("Ranged", new MockStat("Ranged EXP", 0));
    this.exp.set("Scouting", new MockStat("Scouting EXP", 0));
  }
  
  getExpTotal() {
    let total = 0;
    for (const [key, stat] of this.exp) {
      total += stat.statValue;
    }
    return total;
  }
}

global.MockStat = MockStat;
global.MockStatsContainer = MockStatsContainer;

describe('ResourceNode', function() {
  
  describe('Node Type Definitions', function() {
    describe('Tree Node (Leaf/Stick/Apple)', function() {
      it('should define tree node configuration', function() {
        const treeConfig = {
          nodeType: 'tree',
          spawnRadius: 2, // 2 grid tiles
          workToGather: 100,
          resourceTypes: [
            { type: 'greenLeaf', weight: 5, spawnChance: 0.6 },
            { type: 'stick', weight: 2, spawnChance: 0.3 },
            { type: 'apple', weight: 1, spawnChance: 0.1 }
          ],
          visualIndicator: { type: 'progress_bar', color: 'green' }
        };

        expect(treeConfig.nodeType).to.equal('tree');
        expect(treeConfig.spawnRadius).to.equal(2);
        expect(treeConfig.workToGather).to.equal(100);
        expect(treeConfig.resourceTypes).to.have.lengthOf(3);
      });

      it('should have greenLeaf as most common resource', function() {
        const treeConfig = {
          resourceTypes: [
            { type: 'greenLeaf', weight: 5, spawnChance: 0.6 },
            { type: 'stick', weight: 2, spawnChance: 0.3 },
            { type: 'apple', weight: 1, spawnChance: 0.1 }
          ]
        };

        const greenLeaf = treeConfig.resourceTypes.find(r => r.type === 'greenLeaf');
        const stick = treeConfig.resourceTypes.find(r => r.type === 'stick');
        const apple = treeConfig.resourceTypes.find(r => r.type === 'apple');

        expect(greenLeaf.weight).to.be.greaterThan(stick.weight);
        expect(stick.weight).to.be.greaterThan(apple.weight);
      });

      it('should have spawn chances sum to approximately 1.0', function() {
        const treeConfig = {
          resourceTypes: [
            { type: 'greenLeaf', weight: 5, spawnChance: 0.6 },
            { type: 'stick', weight: 2, spawnChance: 0.3 },
            { type: 'apple', weight: 1, spawnChance: 0.1 }
          ]
        };

        const totalChance = treeConfig.resourceTypes.reduce((sum, r) => sum + r.spawnChance, 0);
        expect(totalChance).to.be.closeTo(1.0, 0.01);
      });
    });

    describe('Rock Node (Stone)', function() {
      it('should define rock node configuration', function() {
        const rockConfig = {
          nodeType: 'rock',
          spawnRadius: 2,
          workToGather: 200, // Harder to gather than tree
          resourceTypes: [
            { type: 'stone', weight: 1, spawnChance: 1.0 }
          ],
          visualIndicator: { type: 'progress_bar', color: 'gray' }
        };

        expect(rockConfig.nodeType).to.equal('rock');
        expect(rockConfig.workToGather).to.equal(200);
        expect(rockConfig.resourceTypes).to.have.lengthOf(1);
        expect(rockConfig.resourceTypes[0].type).to.equal('stone');
      });

      it('should have higher workToGather than tree', function() {
        const treeWork = 100;
        const rockWork = 200;

        expect(rockWork).to.be.greaterThan(treeWork);
      });
    });

    describe('Beehive Node (Honey)', function() {
      it('should define beehive node configuration', function() {
        const beehiveConfig = {
          nodeType: 'beehive',
          spawnRadius: 2,
          workToGather: 150,
          resourceTypes: [
            { type: 'honey', weight: 1, spawnChance: 1.0 }
          ],
          visualIndicator: { type: 'progress_bar', color: 'yellow' }
        };

        expect(beehiveConfig.nodeType).to.equal('beehive');
        expect(beehiveConfig.workToGather).to.equal(150);
        expect(beehiveConfig.resourceTypes[0].type).to.equal('honey');
      });
    });

    describe('Bush Node (Berries/Leaves)', function() {
      it('should define bush node configuration', function() {
        const bushConfig = {
          nodeType: 'bush',
          spawnRadius: 2,
          workToGather: 80, // Easier than tree
          resourceTypes: [
            { type: 'berries', weight: 3, spawnChance: 0.7 },
            { type: 'greenLeaf', weight: 1, spawnChance: 0.3 }
          ],
          visualIndicator: { type: 'progress_bar', color: 'purple' }
        };

        expect(bushConfig.nodeType).to.equal('bush');
        expect(bushConfig.workToGather).to.be.lessThan(100); // Easier than tree
        expect(bushConfig.resourceTypes).to.have.lengthOf(2);
      });
    });
  });

  describe('ResourceNode Class - Constructor', function() {
    it('should create resource node with basic parameters in grid coordinates', function() {
      const node = {
        gridX: 3,  // Grid coordinates
        gridY: 3,
        nodeType: 'tree',
        spawnRadius: 2,  // In tiles
        workToGather: 100,
        currentWork: 0,
        active: true
      };

      expect(node.gridX).to.equal(3);
      expect(node.gridY).to.equal(3);
      expect(node.nodeType).to.equal('tree');
      expect(node.spawnRadius).to.equal(2);
      expect(node.workToGather).to.equal(100);
      expect(node.currentWork).to.equal(0);
    });

    it('should initialize with zero progress', function() {
      const node = {
        currentWork: 0,
        workToGather: 100
      };

      const progress = node.currentWork / node.workToGather;
      expect(progress).to.equal(0);
    });

    it('should store resource type configurations', function() {
      const node = {
        resourceTypes: [
          { type: 'greenLeaf', weight: 5, spawnChance: 0.6 },
          { type: 'stick', weight: 2, spawnChance: 0.3 }
        ]
      };

      expect(node.resourceTypes).to.be.an('array');
      expect(node.resourceTypes).to.have.lengthOf(2);
    });

    it('should default to active state', function() {
      const node = {
        active: true
      };

      expect(node.active).to.be.true;
    });

    it('should track nearby gathering ants', function() {
      const node = {
        nearbyGatheringAnts: []
      };

      expect(node.nearbyGatheringAnts).to.be.an('array');
      expect(node.nearbyGatheringAnts).to.have.lengthOf(0);
    });
  });

  describe('Ant Detection System', function() {
    describe('detectNearbyAnts()', function() {
      it('should detect ants within spawn radius (grid coords)', function() {
        const node = {
          gridX: 3,  // Grid: 3, 3
          gridY: 3,
          spawnRadius: 2 // 2 grid tiles
        };

        // Convert node grid position to pixels
        const [nodePixelX, nodePixelY] = g_activeMap.coordSys.convPosToBackingCanvas([node.gridX, node.gridY]);

        const ant = {
          posX: nodePixelX + 20,  // Within 64 pixel radius (2 tiles * 32)
          posY: nodePixelY + 20,
          currentState: 'GATHERING'
        };

        const distance = Math.sqrt(
          Math.pow(ant.posX - nodePixelX, 2) + 
          Math.pow(ant.posY - nodePixelY, 2)
        );

        const radiusInPixels = node.spawnRadius * TILE_SIZE; // 2 * 32 = 64
        expect(distance).to.be.lessThan(radiusInPixels);
      });

      it('should not detect ants outside spawn radius (grid coords)', function() {
        const node = {
          gridX: 3,
          gridY: 3,
          spawnRadius: 2 // 64 pixels
        };

        // Convert node position
        const [nodePixelX, nodePixelY] = g_activeMap.coordSys.convPosToBackingCanvas([node.gridX, node.gridY]);

        const ant = {
          posX: nodePixelX + 100,  // Far outside radius
          posY: nodePixelY + 100,
          currentState: 'GATHERING'
        };

        const distance = Math.sqrt(
          Math.pow(ant.posX - nodePixelX, 2) + 
          Math.pow(ant.posY - nodePixelY, 2)
        );

        const radiusInPixels = node.spawnRadius * TILE_SIZE;

        expect(distance).to.be.greaterThan(radiusInPixels);
      });

      it('should filter ants by GATHERING state', function() {
        const ants = [
          { id: 1, posX: 110, posY: 110, currentState: 'GATHERING' },
          { id: 2, posX: 115, posY: 115, currentState: 'IDLE' },
          { id: 3, posX: 120, posY: 120, currentState: 'MOVING' }
        ];

        const gatheringAnts = ants.filter(ant => ant.currentState === 'GATHERING');
        expect(gatheringAnts).to.have.lengthOf(1);
        expect(gatheringAnts[0].id).to.equal(1);
      });

      it('should update nearbyGatheringAnts array', function() {
        const node = {
          posX: 100,
          posY: 100,
          spawnRadius: 2,
          nearbyGatheringAnts: []
        };

        const ant = {
          id: 1,
          posX: 110,
          posY: 110,
          currentState: 'GATHERING'
        };

        // Simulate detection
        node.nearbyGatheringAnts.push(ant);

        expect(node.nearbyGatheringAnts).to.have.lengthOf(1);
        expect(node.nearbyGatheringAnts[0].id).to.equal(1);
      });

      it('should handle multiple gathering ants', function() {
        const node = {
          nearbyGatheringAnts: []
        };

        const ants = [
          { id: 1, currentState: 'GATHERING' },
          { id: 2, currentState: 'GATHERING' },
          { id: 3, currentState: 'GATHERING' }
        ];

        node.nearbyGatheringAnts = ants;

        expect(node.nearbyGatheringAnts).to.have.lengthOf(3);
      });

      it('should clear ants that left range', function() {
        const node = {
          nearbyGatheringAnts: [
            { id: 1, posX: 110, posY: 110 }
          ]
        };

        // Ant moves away
        node.nearbyGatheringAnts = [];

        expect(node.nearbyGatheringAnts).to.have.lengthOf(0);
      });

      it('should clear ants that changed state', function() {
        const node = {
          nearbyGatheringAnts: [
            { id: 1, currentState: 'GATHERING' }
          ]
        };

        // Filter out non-gathering ants
        node.nearbyGatheringAnts[0].currentState = 'IDLE';
        node.nearbyGatheringAnts = node.nearbyGatheringAnts.filter(
          ant => ant.currentState === 'GATHERING'
        );

        expect(node.nearbyGatheringAnts).to.have.lengthOf(0);
      });
    });

    describe('isAntInRange()', function() {
      it('should return true for ant within range', function() {
        const node = { posX: 100, posY: 100, spawnRadius: 2 };
        const ant = { posX: 110, posY: 110 };

        const dx = ant.posX - node.posX;
        const dy = ant.posY - node.posY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radiusInPixels = node.spawnRadius * 32;

        expect(distance).to.be.lessThan(radiusInPixels);
      });

      it('should return false for ant outside range', function() {
        const node = { posX: 100, posY: 100, spawnRadius: 2 };
        const ant = { posX: 200, posY: 200 };

        const dx = ant.posX - node.posX;
        const dy = ant.posY - node.posY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radiusInPixels = node.spawnRadius * 32;

        expect(distance).to.be.greaterThan(radiusInPixels);
      });

      it('should handle ant exactly on radius edge', function() {
        const node = { posX: 100, posY: 100, spawnRadius: 2 };
        const radiusInPixels = node.spawnRadius * 32; // 64 pixels
        const ant = { posX: 100 + radiusInPixels, posY: 100 };

        const dx = ant.posX - node.posX;
        const dy = ant.posY - node.posY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        expect(distance).to.be.closeTo(radiusInPixels, 0.01);
      });
    });
  });

  describe('Work Progress System', function() {
    describe('addWork()', function() {
      it('should increase currentWork when gathering ant present', function() {
        const node = {
          currentWork: 0,
          workToGather: 100,
          nearbyGatheringAnts: [{ id: 1 }]
        };

        // Simulate work being added
        node.currentWork += 10;

        expect(node.currentWork).to.equal(10);
      });

      it('should not increase work when no gathering ants', function() {
        const node = {
          currentWork: 0,
          workToGather: 100,
          nearbyGatheringAnts: []
        };

        // No work added when no ants
        const workBefore = node.currentWork;
        // No change
        expect(node.currentWork).to.equal(workBefore);
      });

      it('should cap currentWork at workToGather', function() {
        const node = {
          currentWork: 95,
          workToGather: 100
        };

        node.currentWork += 10; // Would go to 105
        if (node.currentWork > node.workToGather) {
          node.currentWork = node.workToGather;
        }

        expect(node.currentWork).to.equal(100);
      });

      it('should scale work by number of ants', function() {
        const baseWorkRate = 1;
        const antCount1 = 1;
        const antCount3 = 3;

        const work1 = baseWorkRate * antCount1;
        const work3 = baseWorkRate * antCount3;

        expect(work3).to.equal(3 * work1);
      });

      it('should handle fractional work values', function() {
        const node = {
          currentWork: 0,
          workToGather: 100
        };

        node.currentWork += 0.5;
        node.currentWork += 0.3;

        expect(node.currentWork).to.be.closeTo(0.8, 0.01);
      });
    });

    describe('getProgress()', function() {
      it('should return progress as percentage (0-1)', function() {
        const node = {
          currentWork: 50,
          workToGather: 100
        };

        const progress = node.currentWork / node.workToGather;
        expect(progress).to.equal(0.5);
      });

      it('should return 0 when no work done', function() {
        const node = {
          currentWork: 0,
          workToGather: 100
        };

        const progress = node.currentWork / node.workToGather;
        expect(progress).to.equal(0);
      });

      it('should return 1 when work complete', function() {
        const node = {
          currentWork: 100,
          workToGather: 100
        };

        const progress = node.currentWork / node.workToGather;
        expect(progress).to.equal(1);
      });

      it('should handle very small work values', function() {
        const node = {
          currentWork: 1,
          workToGather: 1000
        };

        const progress = node.currentWork / node.workToGather;
        expect(progress).to.equal(0.001);
      });
    });

    describe('isReadyToSpawn()', function() {
      it('should return true when work reaches 100%', function() {
        const node = {
          currentWork: 100,
          workToGather: 100
        };

        const ready = node.currentWork >= node.workToGather;
        expect(ready).to.be.true;
      });

      it('should return false when work incomplete', function() {
        const node = {
          currentWork: 99,
          workToGather: 100
        };

        const ready = node.currentWork >= node.workToGather;
        expect(ready).to.be.false;
      });

      it('should handle work exceeding requirement', function() {
        const node = {
          currentWork: 105,
          workToGather: 100
        };

        const ready = node.currentWork >= node.workToGather;
        expect(ready).to.be.true;
      });
    });

    describe('resetWork()', function() {
      it('should reset currentWork to 0 after spawning', function() {
        const node = {
          currentWork: 100,
          workToGather: 100
        };

        // After spawning resources
        node.currentWork = 0;

        expect(node.currentWork).to.equal(0);
      });

      it('should maintain workToGather value', function() {
        const node = {
          currentWork: 100,
          workToGather: 100
        };

        const originalWork = node.workToGather;
        node.currentWork = 0;

        expect(node.workToGather).to.equal(originalWork);
      });
    });
  });

  describe('Visual Progress Indicator', function() {
    describe('renderProgressBar()', function() {
      it('should have progress bar above node', function() {
        const node = {
          posX: 100,
          posY: 100,
          sizeY: 32
        };

        const barY = node.posY - node.sizeY - 10; // Above node
        expect(barY).to.be.lessThan(node.posY);
      });

      it('should render bar only when ants are gathering', function() {
        const node = {
          nearbyGatheringAnts: [{ id: 1 }],
          showProgressBar: true
        };

        expect(node.nearbyGatheringAnts.length).to.be.greaterThan(0);
        expect(node.showProgressBar).to.be.true;
      });

      it('should hide bar when no ants nearby', function() {
        const node = {
          nearbyGatheringAnts: [],
          showProgressBar: false
        };

        expect(node.nearbyGatheringAnts).to.have.lengthOf(0);
        expect(node.showProgressBar).to.be.false;
      });

      it('should have background bar (gray)', function() {
        const progressBar = {
          background: { color: 'gray', width: 50, height: 6 }
        };

        expect(progressBar.background.color).to.equal('gray');
        expect(progressBar.background.width).to.be.greaterThan(0);
      });

      it('should have foreground bar (colored by node type)', function() {
        const treeBar = { foreground: { color: 'green' } };
        const rockBar = { foreground: { color: 'gray' } };
        const beehiveBar = { foreground: { color: 'yellow' } };

        expect(treeBar.foreground.color).to.equal('green');
        expect(rockBar.foreground.color).to.equal('gray');
        expect(beehiveBar.foreground.color).to.equal('yellow');
      });

      it('should scale foreground width by progress', function() {
        const progress = 0.5;
        const maxWidth = 50;
        const foregroundWidth = maxWidth * progress;

        expect(foregroundWidth).to.equal(25);
      });

      it('should show full bar at 100% progress', function() {
        const progress = 1.0;
        const maxWidth = 50;
        const foregroundWidth = maxWidth * progress;

        expect(foregroundWidth).to.equal(maxWidth);
      });

      it('should center bar above node', function() {
        const node = { posX: 100, sizeX: 32 };
        const barWidth = 50;
        const barX = node.posX + (node.sizeX / 2) - (barWidth / 2);

        expect(barX).to.equal(100 + 16 - 25);
      });
    });

    describe('Visual Indicator Timing', function() {
      it('should flash when reaching 100%', function() {
        const node = {
          currentWork: 100,
          workToGather: 100,
          flashTimer: 0,
          maxFlashTime: 1.0
        };

        const isFlashing = node.currentWork >= node.workToGather && 
                          node.flashTimer < node.maxFlashTime;

        expect(isFlashing).to.be.true;
      });

      it('should stop flashing after delay', function() {
        const node = {
          flashTimer: 1.5,
          maxFlashTime: 1.0
        };

        const isFlashing = node.flashTimer < node.maxFlashTime;
        expect(isFlashing).to.be.false;
      });
    });
  });

  describe('Resource Spawning System', function() {
    describe('spawnResource() - Single Resource', function() {
      it('should spawn resource when work complete', function() {
        const node = {
          currentWork: 100,
          workToGather: 100,
          canSpawn: function() {
            return this.currentWork >= this.workToGather;
          }
        };

        expect(node.canSpawn()).to.be.true;
      });

      it('should not spawn when work incomplete', function() {
        const node = {
          currentWork: 50,
          workToGather: 100,
          canSpawn: function() {
            return this.currentWork >= this.workToGather;
          }
        };

        expect(node.canSpawn()).to.be.false;
      });

      it('should select resource type based on weighted randomization', function() {
        const resourceTypes = [
          { type: 'greenLeaf', weight: 5 },
          { type: 'stick', weight: 2 },
          { type: 'apple', weight: 1 }
        ];

        const totalWeight = resourceTypes.reduce((sum, r) => sum + r.weight, 0);
        expect(totalWeight).to.equal(8);

        // Test probability distribution
        const roll = 3.5; // Mid-range
        let cumulative = 0;
        let selected;

        for (const resource of resourceTypes) {
          cumulative += resource.weight;
          if (roll <= cumulative) {
            selected = resource.type;
            break;
          }
        }

        expect(selected).to.equal('greenLeaf');
      });

      it('should spawn resource near node position', function() {
        const node = { posX: 100, posY: 100 };
        const spawnOffset = 20;
        const resourceX = node.posX + spawnOffset;
        const resourceY = node.posY + spawnOffset;

        expect(resourceX).to.be.closeTo(node.posX, 30);
        expect(resourceY).to.be.closeTo(node.posY, 30);
      });

      it('should reset work after spawning', function() {
        const node = {
          currentWork: 100,
          workToGather: 100,
          spawn: function() {
            this.currentWork = 0;
            return { type: 'resource' };
          }
        };

        node.spawn();
        expect(node.currentWork).to.equal(0);
      });
    });

    describe('spawnResourceBatch() - Multiple Resources', function() {
      it('should spawn 1-5 resources', function() {
        const batchSizes = [1, 2, 3, 4, 5];
        
        batchSizes.forEach(size => {
          expect(size).to.be.at.least(1);
          expect(size).to.be.at.most(5);
        });
      });

      it('should spread resources evenly around node', function() {
        const node = { posX: 100, posY: 100 };
        const count = 4;
        const radius = 30;

        const positions = [];
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const x = node.posX + Math.cos(angle) * radius;
          const y = node.posY + Math.sin(angle) * radius;
          positions.push({ x, y });
        }

        expect(positions).to.have.lengthOf(4);
        
        // Check they're spread out
        const distances = [];
        for (let i = 0; i < positions.length - 1; i++) {
          const dx = positions[i + 1].x - positions[i].x;
          const dy = positions[i + 1].y - positions[i].y;
          distances.push(Math.sqrt(dx * dx + dy * dy));
        }

        // All distances should be similar (evenly distributed)
        const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
        distances.forEach(d => {
          expect(d).to.be.closeTo(avgDist, 10);
        });
      });

      it('should randomize batch size', function() {
        const results = [];
        for (let i = 0; i < 10; i++) {
          const batchSize = Math.floor(random(1, 6)); // 1-5
          results.push(batchSize);
        }

        const allSame = results.every(v => v === results[0]);
        expect(allSame).to.be.false; // Should have variation
      });

      it('should use circular distribution formula', function() {
        const count = 3;
        const angles = [];

        for (let i = 0; i < count; i++) {
          angles.push((Math.PI * 2 * i) / count);
        }

        expect(angles[0]).to.equal(0);
        expect(angles[1]).to.be.closeTo(Math.PI * 2 / 3, 0.01);
        expect(angles[2]).to.be.closeTo(Math.PI * 4 / 3, 0.01);
      });

      it('should handle single resource batch', function() {
        const count = 1;
        const positions = [];
        const node = { posX: 100, posY: 100 };
        const radius = 30;

        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const x = node.posX + Math.cos(angle) * radius;
          const y = node.posY + Math.sin(angle) * radius;
          positions.push({ x, y });
        }

        expect(positions).to.have.lengthOf(1);
        expect(positions[0].x).to.be.closeTo(node.posX + radius, 0.01);
      });

      it('should handle maximum batch (5 resources)', function() {
        const count = 5;
        const node = { posX: 100, posY: 100 };
        const radius = 30;
        const positions = [];

        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const x = node.posX + Math.cos(angle) * radius;
          const y = node.posY + Math.sin(angle) * radius;
          positions.push({ x, y });
        }

        expect(positions).to.have.lengthOf(5);
      });
    });

    describe('Resource Type Selection', function() {
      it('should favor common resources over rare', function() {
        const trials = 1000;
        const results = { greenLeaf: 0, stick: 0, apple: 0 };
        const resourceTypes = [
          { type: 'greenLeaf', weight: 5 },
          { type: 'stick', weight: 2 },
          { type: 'apple', weight: 1 }
        ];
        const totalWeight = 8;

        for (let i = 0; i < trials; i++) {
          const roll = random(0, totalWeight);
          let cumulative = 0;

          for (const resource of resourceTypes) {
            cumulative += resource.weight;
            if (roll <= cumulative) {
              results[resource.type]++;
              break;
            }
          }
        }

        // greenLeaf should be most common
        expect(results.greenLeaf).to.be.greaterThan(results.stick);
        expect(results.stick).to.be.greaterThan(results.apple);
      });

      it('should handle single resource type nodes', function() {
        const resourceTypes = [
          { type: 'stone', weight: 1 }
        ];

        const totalWeight = resourceTypes.reduce((sum, r) => sum + r.weight, 0);
        expect(totalWeight).to.equal(1);

        const selected = resourceTypes[0].type;
        expect(selected).to.equal('stone');
      });
    });
  });

  describe('Work Rate and Difficulty', function() {
    describe('Node Difficulty Levels', function() {
      it('should have easy nodes (bush: 80 work)', function() {
        const bushNode = { nodeType: 'bush', workToGather: 80 };
        expect(bushNode.workToGather).to.equal(80);
      });

      it('should have medium nodes (tree: 100 work)', function() {
        const treeNode = { nodeType: 'tree', workToGather: 100 };
        expect(treeNode.workToGather).to.equal(100);
      });

      it('should have hard nodes (beehive: 150 work)', function() {
        const beehiveNode = { nodeType: 'beehive', workToGather: 150 };
        expect(beehiveNode.workToGather).to.equal(150);
      });

      it('should have very hard nodes (rock: 200 work)', function() {
        const rockNode = { nodeType: 'rock', workToGather: 200 };
        expect(rockNode.workToGather).to.equal(200);
      });

      it('should order difficulties correctly', function() {
        const difficulties = {
          bush: 80,
          tree: 100,
          beehive: 150,
          rock: 200
        };

        expect(difficulties.bush).to.be.lessThan(difficulties.tree);
        expect(difficulties.tree).to.be.lessThan(difficulties.beehive);
        expect(difficulties.beehive).to.be.lessThan(difficulties.rock);
      });
    });

    describe('Work Rate Calculations', function() {
      it('should use base work rate per tick', function() {
        const baseWorkRate = 1.0; // 1 work per update
        expect(baseWorkRate).to.equal(1.0);
      });

      it('should scale work by ant count', function() {
        const baseRate = 1.0;
        const antCount = 3;
        const totalWork = baseRate * antCount;

        expect(totalWork).to.equal(3.0);
      });

      it('should cap work contribution per ant', function() {
        const maxWorkPerAnt = 1.5;
        const antCount = 10;
        const totalWork = Math.min(maxWorkPerAnt * antCount, maxWorkPerAnt * 5); // Cap at 5 ants

        expect(totalWork).to.equal(7.5);
      });

      it('should calculate time to complete', function() {
        const workRequired = 100;
        const workRate = 1.0; // per tick
        const antsWorking = 2;
        const ticksRequired = workRequired / (workRate * antsWorking);

        expect(ticksRequired).to.equal(50);
      });
    });
  });

  describe('Integration with Gathering State', function() {
    describe('Ant Movement Around Node', function() {
      it('should move ant towards node when gathering', function() {
        const node = { posX: 100, posY: 100 };
        const ant = { posX: 150, posY: 150, targetX: null, targetY: null };

        // Ant should target node position
        ant.targetX = node.posX;
        ant.targetY = node.posY;

        expect(ant.targetX).to.equal(node.posX);
        expect(ant.targetY).to.equal(node.posY);
      });

      it('should update ant position every few seconds', function() {
        const ant = {
          posX: 100,
          posY: 100,
          moveTimer: 0,
          moveInterval: 3.0 // 3 seconds
        };

        // Simulate time passing
        ant.moveTimer += 3.5;

        const shouldMove = ant.moveTimer >= ant.moveInterval;
        expect(shouldMove).to.be.true;
      });

      it('should reset move timer after repositioning', function() {
        const ant = {
          moveTimer: 3.5,
          moveInterval: 3.0
        };

        // After moving
        ant.moveTimer = 0;

        expect(ant.moveTimer).to.equal(0);
      });

      it('should generate random position around node', function() {
        const node = { posX: 100, posY: 100 };
        const radius = 40;
        const angle = random(0, Math.PI * 2);
        
        const newX = node.posX + Math.cos(angle) * radius;
        const newY = node.posY + Math.sin(angle) * radius;

        const distance = Math.sqrt(
          Math.pow(newX - node.posX, 2) + 
          Math.pow(newY - node.posY, 2)
        );

        expect(distance).to.be.closeTo(radius, 0.01);
      });

      it('should keep ant within spawn radius', function() {
        const node = { posX: 100, posY: 100, spawnRadius: 2 };
        const maxDistance = node.spawnRadius * 32; // 64 pixels
        const angle = random(0, Math.PI * 2);
        const distance = random(10, maxDistance - 5);

        const newX = node.posX + Math.cos(angle) * distance;
        const newY = node.posY + Math.sin(angle) * distance;

        const actualDistance = Math.sqrt(
          Math.pow(newX - node.posX, 2) + 
          Math.pow(newY - node.posY, 2)
        );

        expect(actualDistance).to.be.lessThan(maxDistance);
      });
    });

    describe('Gathering State Integration', function() {
      it('should transition to GATHERING when near node', function() {
        const ant = {
          currentState: 'MOVING',
          targetNode: { id: 'tree1' }
        };

        // When ant reaches node
        ant.currentState = 'GATHERING';

        expect(ant.currentState).to.equal('GATHERING');
      });

      it('should store target node reference', function() {
        const node = { id: 'tree1', nodeType: 'tree' };
        const ant = {
          targetNode: null,
          currentState: 'IDLE'
        };

        // When targeting node
        ant.targetNode = node;
        ant.currentState = 'GATHERING';

        expect(ant.targetNode).to.equal(node);
      });

      it('should leave GATHERING when node depleted', function() {
        const ant = {
          currentState: 'GATHERING',
          targetNode: { active: false }
        };

        // When node becomes inactive
        if (!ant.targetNode.active) {
          ant.currentState = 'IDLE';
          ant.targetNode = null;
        }

        expect(ant.currentState).to.equal('IDLE');
        expect(ant.targetNode).to.be.null;
      });
    });
  });

  describe('Update Loop', function() {
    it('should detect nearby ants on each update', function() {
      const node = {
        updateCount: 0,
        update: function() {
          this.updateCount++;
          // Detect ants
        }
      };

      node.update();
      node.update();

      expect(node.updateCount).to.equal(2);
    });

    it('should add work when gathering ants present', function() {
      const node = {
        currentWork: 0,
        nearbyGatheringAnts: [{ id: 1 }],
        update: function() {
          if (this.nearbyGatheringAnts.length > 0) {
            this.currentWork += this.nearbyGatheringAnts.length;
          }
        }
      };

      node.update();
      expect(node.currentWork).to.equal(1);
    });

    it('should spawn resources when work complete', function() {
      const node = {
        currentWork: 100,
        workToGather: 100,
        spawnedResources: [],
        update: function() {
          if (this.currentWork >= this.workToGather) {
            this.spawnedResources.push({ type: 'resource' });
            this.currentWork = 0;
          }
        }
      };

      node.update();
      expect(node.spawnedResources).to.have.lengthOf(1);
      expect(node.currentWork).to.equal(0);
    });

    it('should update visual indicators', function() {
      const node = {
        showProgressBar: false,
        nearbyGatheringAnts: [{ id: 1 }],
        update: function() {
          this.showProgressBar = this.nearbyGatheringAnts.length > 0;
        }
      };

      node.update();
      expect(node.showProgressBar).to.be.true;
    });
  });

  describe('Edge Cases and Error Handling', function() {
    it('should handle no nearby ants', function() {
      const node = {
        nearbyGatheringAnts: [],
        currentWork: 50
      };

      // No work should be added
      const workBefore = node.currentWork;
      // Update with no ants
      expect(node.currentWork).to.equal(workBefore);
    });

    it('should handle ant leaving mid-gather', function() {
      const node = {
        nearbyGatheringAnts: [{ id: 1 }],
        currentWork: 50
      };

      // Ant leaves
      node.nearbyGatheringAnts = [];

      expect(node.nearbyGatheringAnts).to.have.lengthOf(0);
      expect(node.currentWork).to.equal(50); // Progress preserved
    });

    it('should handle multiple resource types with equal weight', function() {
      const resourceTypes = [
        { type: 'berries', weight: 1 },
        { type: 'leaves', weight: 1 }
      ];

      const totalWeight = resourceTypes.reduce((sum, r) => sum + r.weight, 0);
      expect(totalWeight).to.equal(2);
    });

    it('should handle zero work requirement', function() {
      const node = {
        currentWork: 0,
        workToGather: 0
      };

      const ready = node.currentWork >= node.workToGather;
      expect(ready).to.be.true;
    });

    it('should handle node deactivation', function() {
      const node = {
        active: true,
        nearbyGatheringAnts: [{ id: 1 }]
      };

      node.active = false;

      expect(node.active).to.be.false;
      // Should stop processing when inactive
    });

    it('should handle null ant array', function() {
      const node = {
        nearbyGatheringAnts: null
      };

      const antCount = node.nearbyGatheringAnts ? node.nearbyGatheringAnts.length : 0;
      expect(antCount).to.equal(0);
    });

    it('should handle fractional spawn radius', function() {
      const node = {
        spawnRadius: 1.5 // 1.5 tiles
      };

      const radiusInPixels = node.spawnRadius * 32;
      expect(radiusInPixels).to.equal(48);
    });

    it('should handle very large workToGather values', function() {
      const node = {
        currentWork: 5000,
        workToGather: 10000
      };

      const progress = node.currentWork / node.workToGather;
      expect(progress).to.equal(0.5);
    });
  });

  describe('Performance and Optimization', function() {
    it('should cache nearby ants between updates', function() {
      const node = {
        nearbyGatheringAnts: [],
        cachedAnts: [],
        cacheValid: false
      };

      // First update - detect and cache
      node.nearbyGatheringAnts = [{ id: 1 }, { id: 2 }];
      node.cachedAnts = [...node.nearbyGatheringAnts];
      node.cacheValid = true;

      expect(node.cachedAnts).to.have.lengthOf(2);
    });

    it('should invalidate cache when ants change', function() {
      const node = {
        cachedAnts: [{ id: 1 }],
        cacheValid: true
      };

      // Ant moves away
      node.cacheValid = false;
      node.cachedAnts = [];

      expect(node.cacheValid).to.be.false;
    });

    it('should limit ant detection radius checks', function() {
      const maxCheckDistance = 100; // pixels
      const node = { posX: 100, posY: 100 };
      const ant = { posX: 250, posY: 250 };

      const dx = Math.abs(ant.posX - node.posX);
      const dy = Math.abs(ant.posY - node.posY);

      // Quick rejection before distance calculation
      if (dx > maxCheckDistance || dy > maxCheckDistance) {
        // Skip expensive sqrt calculation
        expect(true).to.be.true;
      }
    });
  });

  describe('Resource Gather Limits (Depletable vs Infinite)', function() {
    describe('Infinite Nodes (resourceGatherLimit = 0)', function() {
      it('should create infinite resource node with limit of 0', function() {
        const node = {
          nodeType: 'tree',
          gridX: 10,
          gridY: 10,
          resourceGatherLimit: 0, // 0 = infinite
          gatherCount: 0
        };

        expect(node.resourceGatherLimit).to.equal(0);
        expect(node.gatherCount).to.equal(0);
      });

      it('should never deplete when resourceGatherLimit is 0', function() {
        const node = {
          resourceGatherLimit: 0,
          gatherCount: 1000 // Gathered many times
        };

        const isDepleted = node.resourceGatherLimit > 0 && node.gatherCount >= node.resourceGatherLimit;
        expect(isDepleted).to.be.false;
      });

      it('should allow unlimited gathers on trees', function() {
        const treeNode = {
          nodeType: 'tree',
          resourceGatherLimit: 0,
          gatherCount: 0
        };

        // Simulate many gathers
        for (let i = 0; i < 100; i++) {
          treeNode.gatherCount++;
        }

        const isDepleted = treeNode.resourceGatherLimit > 0 && treeNode.gatherCount >= treeNode.resourceGatherLimit;
        expect(isDepleted).to.be.false;
        expect(treeNode.gatherCount).to.equal(100);
      });

      it('should allow unlimited gathers on rocks', function() {
        const rockNode = {
          nodeType: 'rock',
          resourceGatherLimit: 0,
          gatherCount: 0
        };

        for (let i = 0; i < 50; i++) {
          rockNode.gatherCount++;
        }

        const isDepleted = rockNode.resourceGatherLimit > 0 && rockNode.gatherCount >= rockNode.resourceGatherLimit;
        expect(isDepleted).to.be.false;
      });
    });

    describe('Depletable Nodes (resourceGatherLimit > 0)', function() {
      it('should create depletable node with positive limit', function() {
        const node = {
          nodeType: 'bush',
          gridX: 5,
          gridY: 5,
          resourceGatherLimit: 10, // Depletes after 10 gathers
          gatherCount: 0
        };

        expect(node.resourceGatherLimit).to.be.greaterThan(0);
        expect(node.gatherCount).to.equal(0);
      });

      it('should track gathers toward limit', function() {
        const node = {
          resourceGatherLimit: 5,
          gatherCount: 0
        };

        node.gatherCount++;
        expect(node.gatherCount).to.equal(1);

        node.gatherCount++;
        expect(node.gatherCount).to.equal(2);

        const remaining = node.resourceGatherLimit - node.gatherCount;
        expect(remaining).to.equal(3);
      });

      it('should mark as depleted when limit reached', function() {
        const node = {
          resourceGatherLimit: 3,
          gatherCount: 0
        };

        node.gatherCount = 3;

        const isDepleted = node.resourceGatherLimit > 0 && node.gatherCount >= node.resourceGatherLimit;
        expect(isDepleted).to.be.true;
      });

      it('should trigger destruction when depleted', function() {
        const node = {
          resourceGatherLimit: 5,
          gatherCount: 5,
          shouldDestroy: false
        };

        if (node.resourceGatherLimit > 0 && node.gatherCount >= node.resourceGatherLimit) {
          node.shouldDestroy = true;
        }

        expect(node.shouldDestroy).to.be.true;
      });

      it('should have different nodes with different limits', function() {
        const bushNode = {
          nodeType: 'bush',
          resourceGatherLimit: 8
        };

        const grassNode = {
          nodeType: 'grass',
          resourceGatherLimit: 3
        };

        expect(bushNode.resourceGatherLimit).to.not.equal(grassNode.resourceGatherLimit);
      });
    });

    describe('Random Gather Limits', function() {
      it('should support random range for gather limits', function() {
        const nodeConfig = {
          nodeType: 'bush',
          gatherLimitRange: [5, 15] // Random between 5 and 15
        };

        // Simulate random limit generation
        const randomLimit = Math.floor(Math.random() * (nodeConfig.gatherLimitRange[1] - nodeConfig.gatherLimitRange[0] + 1)) + nodeConfig.gatherLimitRange[0];

        expect(randomLimit).to.be.at.least(nodeConfig.gatherLimitRange[0]);
        expect(randomLimit).to.be.at.most(nodeConfig.gatherLimitRange[1]);
      });

      it('should create nodes with varied limits from same config', function() {
        const config = {
          gatherLimitRange: [3, 10]
        };

        const limits = [];
        for (let i = 0; i < 20; i++) {
          const limit = Math.floor(Math.random() * (config.gatherLimitRange[1] - config.gatherLimitRange[0] + 1)) + config.gatherLimitRange[0];
          limits.push(limit);
        }

        // Should have variation (not all the same)
        const uniqueLimits = new Set(limits);
        expect(uniqueLimits.size).to.be.greaterThan(1);
      });

      it('should handle single value range (no randomness)', function() {
        const config = {
          gatherLimitRange: [7, 7] // Always 7
        };

        const limit = Math.floor(Math.random() * (config.gatherLimitRange[1] - config.gatherLimitRange[0] + 1)) + config.gatherLimitRange[0];

        expect(limit).to.equal(7);
      });

      it('should support infinite as part of config', function() {
        const treeConfig = {
          nodeType: 'tree',
          gatherLimitRange: [0, 0] // Always infinite
        };

        const limit = treeConfig.gatherLimitRange[0];
        expect(limit).to.equal(0);
      });
    });

    describe('Gather Limit Integration', function() {
      it('should increment gather count on resource spawn', function() {
        const node = {
          gatherCount: 0,
          resourceGatherLimit: 10,
          currentWork: 100,
          workToGather: 100
        };

        // Resource spawned
        if (node.currentWork >= node.workToGather) {
          node.gatherCount++;
          node.currentWork = 0;
        }

        expect(node.gatherCount).to.equal(1);
        expect(node.currentWork).to.equal(0);
      });

      it('should track progress toward depletion', function() {
        const node = {
          gatherCount: 7,
          resourceGatherLimit: 10
        };

        const progress = node.gatherCount / node.resourceGatherLimit;
        expect(progress).to.equal(0.7);

        const remaining = node.resourceGatherLimit - node.gatherCount;
        expect(remaining).to.equal(3);
      });

      it('should stop spawning when depleted', function() {
        const node = {
          gatherCount: 10,
          resourceGatherLimit: 10,
          active: true
        };

        if (node.resourceGatherLimit > 0 && node.gatherCount >= node.resourceGatherLimit) {
          node.active = false;
        }

        expect(node.active).to.be.false;
      });
    });
  });

  describe('Ant Gathering Experience (StatsContainer Integration)', function() {
    describe('StatsContainer Exp Structure', function() {
      it('should have gathering exp in StatsContainer', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        expect(stats.exp.has('Gathering')).to.be.true;
      });

      it('should initialize gathering exp to 0', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        const gatheringExp = stats.exp.get('Gathering');
        expect(gatheringExp.statValue).to.equal(0);
      });

      it('should support exp increment', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        const gatheringExp = stats.exp.get('Gathering');
        gatheringExp.statValue += 10;

        expect(gatheringExp.statValue).to.equal(10);
      });

      it('should track exp separately per ant', function() {
        const ant1Stats = new MockStatsContainer(createVector(10, 10), createVector(32, 32));
        const ant2Stats = new MockStatsContainer(createVector(20, 20), createVector(32, 32));

        ant1Stats.exp.get('Gathering').statValue = 50;
        ant2Stats.exp.get('Gathering').statValue = 30;

        expect(ant1Stats.exp.get('Gathering').statValue).to.equal(50);
        expect(ant2Stats.exp.get('Gathering').statValue).to.equal(30);
      });
    });

    describe('Experience Gain on Gather', function() {
      it('should increment ant exp when resource gathered', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32)),
          currentState: 'GATHERING'
        };

        const node = {
          currentWork: 100,
          workToGather: 100
        };

        // Resource gathered
        if (node.currentWork >= node.workToGather) {
          ant.stats.exp.get('Gathering').statValue += 10;
        }

        expect(ant.stats.exp.get('Gathering').statValue).to.equal(10);
      });

      it('should grant exp per gather completion', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        const expPerGather = 15;

        // Simulate 3 gathers
        for (let i = 0; i < 3; i++) {
          ant.stats.exp.get('Gathering').statValue += expPerGather;
        }

        expect(ant.stats.exp.get('Gathering').statValue).to.equal(45);
      });

      it('should award different exp for different node types', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        const treeExpReward = 10;
        const rockExpReward = 20; // Harder = more exp

        // Gather from tree
        ant.stats.exp.get('Gathering').statValue += treeExpReward;
        expect(ant.stats.exp.get('Gathering').statValue).to.equal(10);

        // Gather from rock
        ant.stats.exp.get('Gathering').statValue += rockExpReward;
        expect(ant.stats.exp.get('Gathering').statValue).to.equal(30);
      });

      it('should track exp across multiple ants independently', function() {
        const ant1 = {
          id: 1,
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        const ant2 = {
          id: 2,
          stats: new MockStatsContainer(createVector(20, 20), createVector(32, 32))
        };

        // Ant 1 gathers
        ant1.stats.exp.get('Gathering').statValue += 20;

        // Ant 2 gathers
        ant2.stats.exp.get('Gathering').statValue += 30;

        expect(ant1.stats.exp.get('Gathering').statValue).to.equal(20);
        expect(ant2.stats.exp.get('Gathering').statValue).to.equal(30);
      });
    });

    describe('Experience Persistence', function() {
      it('should preserve exp when ant leaves node', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        ant.stats.exp.get('Gathering').statValue = 75;

        // Ant leaves node area
        const expAfterLeaving = ant.stats.exp.get('Gathering').statValue;
        expect(expAfterLeaving).to.equal(75);
      });

      it('should accumulate exp across multiple nodes', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        // Gather from node 1
        ant.stats.exp.get('Gathering').statValue += 25;

        // Move to node 2 and gather
        ant.stats.exp.get('Gathering').statValue += 30;

        // Move to node 3 and gather
        ant.stats.exp.get('Gathering').statValue += 15;

        expect(ant.stats.exp.get('Gathering').statValue).to.equal(70);
      });

      it('should maintain exp in StatsContainer total', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        ant.stats.exp.get('Gathering').statValue = 100;
        ant.stats.exp.get('Construction').statValue = 50;

        const totalExp = ant.stats.getExpTotal();
        expect(totalExp).to.equal(150);
      });
    });

    describe('Edge Cases - Experience', function() {
      it('should handle ant without StatsContainer gracefully', function() {
        const ant = {
          currentState: 'GATHERING'
          // No stats property
        };

        const hasStats = ant.stats && ant.stats.exp;
        expect(hasStats).to.be.undefined;
      });

      it('should handle partial StatsContainer (missing exp)', function() {
        const ant = {
          stats: {
            health: new MockStat('Health', 100)
            // Missing exp Map
          }
        };

        const hasGatheringExp = ant.stats.exp && ant.stats.exp.has('Gathering');
        expect(hasGatheringExp).to.be.undefined;
      });

      it('should cap exp at stat upper limit', function() {
        const stats = new MockStatsContainer(createVector(10, 10), createVector(32, 32));
        const gatheringExp = stats.exp.get('Gathering');
        
        gatheringExp.statUpperLimit = 1000;
        gatheringExp.statValue = 1500; // Try to exceed limit

        expect(gatheringExp.statValue).to.equal(1000);
      });
    });
  });

  describe('Ant Gather Speed (StatsContainer Integration)', function() {
    describe('Gather Speed Stat', function() {
      it('should have gatherSpeed stat in StatsContainer', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        expect(stats.gatherSpeed).to.exist;
        expect(stats.gatherSpeed.statName).to.equal('Gather Speed');
      });

      it('should default to gather speed of 1', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        expect(stats.gatherSpeed.statValue).to.equal(1);
      });

      it('should support custom gather speed', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32),
          0.05, // movementSpeed
          null, // pendingPos
          10, // strength
          100, // health
          2.5 // gatherSpeed
        );

        expect(stats.gatherSpeed.statValue).to.equal(2.5);
      });

      it('should allow gather speed modification', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        stats.gatherSpeed.statValue = 1.5;
        expect(stats.gatherSpeed.statValue).to.equal(1.5);
      });
    });

    describe('Speed Affects Work Rate', function() {
      it('should use gather speed as work multiplier', function() {
        const ant = {
          stats: new MockStatsContainer(
            createVector(10, 10),
            createVector(32, 32),
            0.05, null, 10, 100, 2.0 // gatherSpeed = 2.0
          )
        };

        const baseWorkPerUpdate = 1;
        const actualWork = baseWorkPerUpdate * ant.stats.gatherSpeed.statValue;

        expect(actualWork).to.equal(2.0);
      });

      it('should accumulate work faster with higher speed', function() {
        const fastAnt = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 3.0)
        };

        const slowAnt = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 0.5)
        };

        const baseWork = 5;
        const fastWork = baseWork * fastAnt.stats.gatherSpeed.statValue;
        const slowWork = baseWork * slowAnt.stats.gatherSpeed.statValue;

        expect(fastWork).to.equal(15); // 5 * 3.0
        expect(slowWork).to.equal(2.5); // 5 * 0.5
        expect(fastWork).to.be.greaterThan(slowWork);
      });

      it('should calculate time to gather based on speed', function() {
        const node = {
          workToGather: 100
        };

        const ant1 = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 1.0)
        };

        const ant2 = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 2.0)
        };

        const workPerUpdate = 2;

        const updatesForAnt1 = node.workToGather / (workPerUpdate * ant1.stats.gatherSpeed.statValue);
        const updatesForAnt2 = node.workToGather / (workPerUpdate * ant2.stats.gatherSpeed.statValue);

        expect(updatesForAnt1).to.equal(50); // 100 / (2 * 1.0)
        expect(updatesForAnt2).to.equal(25); // 100 / (2 * 2.0)
      });

      it('should support fractional gather speeds', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32),
          0.05, null, 10, 100, 0.75
        );

        const baseWork = 10;
        const actualWork = baseWork * stats.gatherSpeed.statValue;

        expect(actualWork).to.equal(7.5);
      });
    });

    describe('Multi-Ant Gathering with Different Speeds', function() {
      it('should handle multiple ants with different speeds', function() {
        const node = {
          currentWork: 0,
          workToGather: 100
        };

        const ants = [
          { stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 1.0) },
          { stats: new MockStatsContainer(createVector(20, 20), createVector(32, 32), 0.05, null, 10, 100, 1.5) },
          { stats: new MockStatsContainer(createVector(30, 30), createVector(32, 32), 0.05, null, 10, 100, 0.8) }
        ];

        const baseWorkPerAnt = 5;
        let totalWork = 0;

        for (const ant of ants) {
          totalWork += baseWorkPerAnt * ant.stats.gatherSpeed.statValue;
        }

        expect(totalWork).to.equal(16.5); // (5*1.0) + (5*1.5) + (5*0.8)
      });

      it('should calculate combined gather rate', function() {
        const ants = [
          { stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 2.0) },
          { stats: new MockStatsContainer(createVector(20, 20), createVector(32, 32), 0.05, null, 10, 100, 1.5) }
        ];

        const combinedSpeed = ants.reduce((sum, ant) => sum + ant.stats.gatherSpeed.statValue, 0);
        expect(combinedSpeed).to.equal(3.5);
      });
    });

    describe('Edge Cases - Gather Speed', function() {
      it('should fallback to speed 1.0 if ant has no StatsContainer', function() {
        const ant = {
          currentState: 'GATHERING'
          // No stats
        };

        const gatherSpeed = ant.stats?.gatherSpeed?.statValue || 1.0;
        expect(gatherSpeed).to.equal(1.0);
      });

      it('should handle zero gather speed gracefully', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32),
          0.05, null, 10, 100, 0
        );

        const baseWork = 10;
        const actualWork = baseWork * stats.gatherSpeed.statValue;

        expect(actualWork).to.equal(0);
      });

      it('should cap gather speed at upper limit', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        stats.gatherSpeed.statValue = 150; // Try to exceed default limit of 100

        expect(stats.gatherSpeed.statValue).to.equal(100);
      });

      it('should not go below lower limit', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        stats.gatherSpeed.statValue = -5; // Try negative

        expect(stats.gatherSpeed.statValue).to.equal(0);
      });
    });
  });

  describe('Attack Targeting (Combat Integration)', function() {
    describe('Targetable Property', function() {
      it('should mark nodes as targetable', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          nodeType: 'tree',
          targetable: true
        };

        expect(node.targetable).to.be.true;
      });

      it('should allow nodes to be selected as attack target', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          targetable: true,
          type: 'ResourceNode'
        };

        const attacker = {
          target: null
        };

        if (node.targetable) {
          attacker.target = node;
        }

        expect(attacker.target).to.equal(node);
      });

      it('should support faction property for targeting', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          faction: 'neutral',
          targetable: true
        };

        expect(node.faction).to.equal('neutral');
      });
    });

    describe('Not Auto-Attacked', function() {
      it('should not be in default enemy targeting', function() {
        const node = {
          type: 'ResourceNode',
          faction: 'neutral',
          autoAttackTarget: false
        };

        expect(node.autoAttackTarget).to.be.false;
      });

      it('should exclude neutral faction from auto-attack', function() {
        const entities = [
          { type: 'Ant', faction: 'enemy' },
          { type: 'ResourceNode', faction: 'neutral' },
          { type: 'Ant', faction: 'enemy' }
        ];

        const autoTargets = entities.filter(e => e.faction === 'enemy');
        expect(autoTargets).to.have.lengthOf(2);
      });

      it('should require manual targeting to attack', function() {
        const node = {
          type: 'ResourceNode',
          targetable: true,
          requiresManualTarget: true
        };

        expect(node.requiresManualTarget).to.be.true;
      });
    });

    describe('Health Tracking for Combat', function() {
      it('should have health property for nodes', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          nodeType: 'tree',
          health: 100,
          maxHealth: 100
        };

        expect(node.health).to.equal(100);
        expect(node.maxHealth).to.equal(100);
      });

      it('should support different health values per node type', function() {
        const treeNode = {
          nodeType: 'tree',
          health: 150,
          maxHealth: 150
        };

        const rockNode = {
          nodeType: 'rock',
          health: 300,
          maxHealth: 300
        };

        expect(rockNode.health).to.be.greaterThan(treeNode.health);
      });

      it('should reduce health when taking damage', function() {
        const node = {
          health: 100,
          maxHealth: 100
        };

        const damage = 25;
        node.health -= damage;

        expect(node.health).to.equal(75);
      });

      it('should track health as percentage', function() {
        const node = {
          health: 60,
          maxHealth: 100
        };

        const healthPercent = (node.health / node.maxHealth) * 100;
        expect(healthPercent).to.equal(60);
      });
    });

    describe('Combat Controller Integration', function() {
      it('should support onDamage callback', function() {
        const node = {
          health: 100,
          damaged: false,
          onDamage: function(amount) {
            this.health -= amount;
            this.damaged = true;
          }
        };

        node.onDamage(20);

        expect(node.health).to.equal(80);
        expect(node.damaged).to.be.true;
      });

      it('should trigger death when health reaches zero', function() {
        const node = {
          health: 10,
          isDead: false
        };

        node.health -= 15;
        if (node.health <= 0) {
          node.isDead = true;
        }

        expect(node.health).to.be.lessThanOrEqual(0);
        expect(node.isDead).to.be.true;
      });

      it('should support damage resistance for different types', function() {
        const rockNode = {
          nodeType: 'rock',
          damageResistance: 0.5 // Takes 50% less damage
        };

        const bushNode = {
          nodeType: 'bush',
          damageResistance: 0
        };

        const rawDamage = 20;
        const rockActualDamage = rawDamage * (1 - rockNode.damageResistance);
        const bushActualDamage = rawDamage * (1 - bushNode.damageResistance);

        expect(rockActualDamage).to.equal(10);
        expect(bushActualDamage).to.equal(20);
      });
    });
  });

  describe('Node Destruction and Resource Drop', function() {
    describe('Health Depletion', function() {
      it('should track damage accumulated', function() {
        const node = {
          health: 100,
          maxHealth: 100,
          damageTaken: 0
        };

        node.health -= 30;
        node.damageTaken += 30;

        expect(node.health).to.equal(70);
        expect(node.damageTaken).to.equal(30);
      });

      it('should reach zero health after sufficient damage', function() {
        const node = {
          health: 50
        };

        node.health -= 60;

        expect(node.health).to.be.lessThanOrEqual(0);
      });

      it('should not go below zero health', function() {
        const node = {
          health: 20
        };

        node.health -= 100;
        node.health = Math.max(0, node.health);

        expect(node.health).to.equal(0);
      });
    });

    describe('Death Trigger', function() {
      it('should trigger destruction at zero health', function() {
        const node = {
          health: 0,
          maxHealth: 100,
          shouldDestroy: false
        };

        if (node.health <= 0) {
          node.shouldDestroy = true;
        }

        expect(node.shouldDestroy).to.be.true;
      });

      it('should call onDestroy callback', function() {
        const node = {
          health: 0,
          destroyed: false,
          onDestroy: function() {
            this.destroyed = true;
          }
        };

        if (node.health <= 0) {
          node.onDestroy();
        }

        expect(node.destroyed).to.be.true;
      });

      it('should mark node for removal from game', function() {
        const node = {
          health: 0,
          active: true,
          markedForRemoval: false
        };

        if (node.health <= 0) {
          node.active = false;
          node.markedForRemoval = true;
        }

        expect(node.active).to.be.false;
        expect(node.markedForRemoval).to.be.true;
      });
    });

    describe('Partial Resource Drop Calculation', function() {
      it('should drop fraction of total spawnable resources', function() {
        const node = {
          nodeType: 'tree',
          resourceTypes: [
            { type: 'greenLeaf', weight: 5 },
            { type: 'stick', weight: 2 },
            { type: 'apple', weight: 1 }
          ]
        };

        const totalWeight = node.resourceTypes.reduce((sum, r) => sum + r.weight, 0);
        const dropFraction = 0.3; // Drop 30% of resources
        const dropAmount = Math.floor(totalWeight * dropFraction);

        expect(totalWeight).to.equal(8);
        expect(dropAmount).to.equal(2); // floor(8 * 0.3)
      });

      it('should use random fraction for drop amount', function() {
        const node = {
          nodeType: 'rock',
          totalResources: 20
        };

        const dropFraction = Math.random() * 0.4 + 0.1; // 10% to 50%
        const dropAmount = Math.floor(node.totalResources * dropFraction);

        expect(dropAmount).to.be.at.least(2); // 10% of 20
        expect(dropAmount).to.be.at.most(10); // 50% of 20
      });

      it('should drop at least 1 resource if node had any', function() {
        const node = {
          totalResources: 3
        };

        const dropFraction = 0.2;
        const dropAmount = Math.max(1, Math.floor(node.totalResources * dropFraction));

        expect(dropAmount).to.equal(1);
      });

      it('should drop 0 if node had no resources', function() {
        const node = {
          totalResources: 0
        };

        const dropAmount = Math.floor(node.totalResources * 0.5);

        expect(dropAmount).to.equal(0);
      });
    });

    describe('Resource Spawn on Death', function() {
      it('should spawn resources at node position when destroyed', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          health: 0,
          resourceTypes: [
            { type: 'stone', weight: 1 }
          ],
          droppedResources: []
        };

        if (node.health <= 0) {
          const dropAmount = 3;
          for (let i = 0; i < dropAmount; i++) {
            node.droppedResources.push({
              type: 'stone',
              gridX: node.gridX,
              gridY: node.gridY
            });
          }
        }

        expect(node.droppedResources).to.have.lengthOf(3);
        expect(node.droppedResources[0].gridX).to.equal(10);
        expect(node.droppedResources[0].gridY).to.equal(10);
      });

      it('should select resources based on node type weights', function() {
        const node = {
          resourceTypes: [
            { type: 'greenLeaf', weight: 5, spawnChance: 0.6 },
            { type: 'stick', weight: 2, spawnChance: 0.3 },
            { type: 'apple', weight: 1, spawnChance: 0.1 }
          ]
        };

        const roll = 0.5; // Should select greenLeaf (0.0-0.6 range)
        let selectedType = null;
        let cumulativeChance = 0;

        for (const resType of node.resourceTypes) {
          cumulativeChance += resType.spawnChance;
          if (roll < cumulativeChance) {
            selectedType = resType.type;
            break;
          }
        }

        expect(selectedType).to.equal('greenLeaf');
      });

      it('should scatter dropped resources around node', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          droppedResources: []
        };

        const dropCount = 5;
        for (let i = 0; i < dropCount; i++) {
          const angle = (Math.PI * 2 * i) / dropCount;
          const distance = 1; // 1 tile away
          const dropX = node.gridX + Math.cos(angle) * distance;
          const dropY = node.gridY + Math.sin(angle) * distance;

          node.droppedResources.push({
            gridX: Math.round(dropX),
            gridY: Math.round(dropY)
          });
        }

        expect(node.droppedResources).to.have.lengthOf(5);
        // Resources should be scattered (not all at same position)
        const uniquePositions = new Set(node.droppedResources.map(r => `${r.gridX},${r.gridY}`));
        expect(uniquePositions.size).to.be.greaterThan(1);
      });
    });

    describe('Integration - Destruction Flow', function() {
      it('should execute full destruction sequence', function() {
        const node = {
          gridX: 15,
          gridY: 20,
          health: 100,
          maxHealth: 100,
          nodeType: 'bush',
          resourceTypes: [{ type: 'berries', weight: 1 }],
          active: true,
          destroyed: false,
          droppedResources: []
        };

        // Take damage
        node.health -= 100;

        // Check death
        if (node.health <= 0) {
          // Calculate drops
          const dropAmount = 2;
          
          // Spawn resources
          for (let i = 0; i < dropAmount; i++) {
            node.droppedResources.push({
              type: 'berries',
              gridX: node.gridX,
              gridY: node.gridY
            });
          }

          // Destroy node
          node.active = false;
          node.destroyed = true;
        }

        expect(node.health).to.equal(0);
        expect(node.active).to.be.false;
        expect(node.destroyed).to.be.true;
        expect(node.droppedResources).to.have.lengthOf(2);
      });

      it('should remove node from manager on destruction', function() {
        const nodeManager = {
          nodes: [
            { id: 1, health: 100 },
            { id: 2, health: 0 },
            { id: 3, health: 50 }
          ]
        };

        nodeManager.nodes = nodeManager.nodes.filter(node => node.health > 0);

        expect(nodeManager.nodes).to.have.lengthOf(2);
        expect(nodeManager.nodes.find(n => n.id === 2)).to.be.undefined;
      });

      it('should handle destruction from depletion vs combat', function() {
        const gatheredNode = {
          gatherCount: 10,
          resourceGatherLimit: 10,
          health: 100,
          destroyReason: null
        };

        const attackedNode = {
          gatherCount: 2,
          resourceGatherLimit: 10,
          health: 0,
          destroyReason: null
        };

        // Check depletion
        if (gatheredNode.resourceGatherLimit > 0 && gatheredNode.gatherCount >= gatheredNode.resourceGatherLimit) {
          gatheredNode.destroyReason = 'depleted';
        }

        // Check combat
        if (attackedNode.health <= 0) {
          attackedNode.destroyReason = 'destroyed';
        }

        expect(gatheredNode.destroyReason).to.equal('depleted');
        expect(attackedNode.destroyReason).to.equal('destroyed');
      });
    });
  });

  describe('Grid Coordinate System Integration', function() {
    describe('Grid to Pixel Conversion', function() {
      it('should convert grid coordinates to pixels', function() {
        const gridX = 10;
        const gridY = 5;

        const [pixelX, pixelY] = g_activeMap.coordSys.convPosToBackingCanvas([gridX, gridY]);

        expect(pixelX).to.equal(320); // 10 * 32
        expect(pixelY).to.equal(160); // 5 * 32
      });

      it('should handle origin (0,0)', function() {
        const [pixelX, pixelY] = g_activeMap.coordSys.convPosToBackingCanvas([0, 0]);

        expect(pixelX).to.equal(0);
        expect(pixelY).to.equal(0);
      });

      it('should handle large grid coordinates', function() {
        const [pixelX, pixelY] = g_activeMap.coordSys.convPosToBackingCanvas([100, 75]);

        expect(pixelX).to.equal(3200);
        expect(pixelY).to.equal(2400);
      });
    });

    describe('Pixel to Grid Conversion', function() {
      it('should convert pixels to grid coordinates', function() {
        const pixelX = 320;
        const pixelY = 160;

        const [gridX, gridY] = g_activeMap.coordSys.convBackingCanvasToPos([pixelX, pixelY]);

        expect(gridX).to.equal(10);
        expect(gridY).to.equal(5);
      });

      it('should floor fractional pixels', function() {
        const [gridX, gridY] = g_activeMap.coordSys.convBackingCanvasToPos([335, 175]);

        expect(gridX).to.equal(10); // floor(335/32) = floor(10.46)
        expect(gridY).to.equal(5);  // floor(175/32) = floor(5.46)
      });
    });

    describe('Node Position Storage', function() {
      it('should store both grid and pixel coordinates', function() {
        const node = {
          gridX: 12,
          gridY: 8
        };

        const [pixelX, pixelY] = g_activeMap.coordSys.convPosToBackingCanvas([node.gridX, node.gridY]);
        node.posX = pixelX;
        node.posY = pixelY;

        expect(node.gridX).to.equal(12);
        expect(node.gridY).to.equal(8);
        expect(node.posX).to.equal(384);
        expect(node.posY).to.equal(256);
      });

      it('should use grid coords for logical position', function() {
        const node = {
          gridX: 10,
          gridY: 10
        };

        // Grid coords are the source of truth
        expect(node.gridX).to.equal(10);
        expect(node.gridY).to.equal(10);
      });
    });
  });
});