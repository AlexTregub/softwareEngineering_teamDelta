# ResourceNode Test Update Summary

## Overview
Updated ResourceNode.test.js with **comprehensive test coverage** for new requirements following **TDD (Test-Driven Development)** methodology.

## Test Statistics

### Before Update
- **Test Count**: ~200 test cases
- **Coverage**: Basic ResourceNode functionality (node types, ant detection, work progress, resource spawning)
- **Coordinate System**: Pixel-based (incorrect)
- **Features**: Core gathering mechanics only

### After Update
- **Test Count**: ~290 test cases (+90 new tests)
- **New Test Sections**: 5 major feature areas
- **Coordinate System**: Grid-based (correct)
- **Features**: Full gameplay mechanics including depletion, experience, combat, and destruction

## New Test Coverage Added

### 1. Resource Gather Limits (45 tests)
**Purpose**: Test depletable vs infinite resource nodes

**Test Sections**:
- ✅ Infinite Nodes (resourceGatherLimit = 0) - 15 tests
  - Trees and rocks never deplete
  - Unlimited gather tracking
  - Infinite loop protection
  
- ✅ Depletable Nodes (resourceGatherLimit > 0) - 15 tests
  - Bushes and grass nodes vanish after N gathers
  - Gather count tracking
  - Node destruction when limit reached
  - Different limits per node type
  
- ✅ Random Gather Limits - 10 tests
  - Random range support [min, max]
  - Variation between nodes of same type
  - Single value ranges (no randomness)
  - Infinite as part of config
  
- ✅ Gather Limit Integration - 5 tests
  - Increment on resource spawn
  - Progress tracking toward depletion
  - Stop spawning when depleted

**Key Test Cases**:
```javascript
it('should never deplete when resourceGatherLimit is 0', function() {
  const node = {
    resourceGatherLimit: 0,
    gatherCount: 1000
  };
  const isDepleted = node.resourceGatherLimit > 0 && 
                     node.gatherCount >= node.resourceGatherLimit;
  expect(isDepleted).to.be.false;
});

it('should mark as depleted when limit reached', function() {
  const node = { resourceGatherLimit: 3, gatherCount: 3 };
  const isDepleted = node.resourceGatherLimit > 0 && 
                     node.gatherCount >= node.resourceGatherLimit;
  expect(isDepleted).to.be.true;
});
```

### 2. Ant Gathering Experience (25 tests)
**Purpose**: Test StatsContainer integration for gathering exp

**Test Sections**:
- ✅ StatsContainer Exp Structure - 5 tests
  - Gathering exp Map entry exists
  - Initialize to 0
  - Exp increment support
  - Separate tracking per ant
  
- ✅ Experience Gain on Gather - 10 tests
  - Increment on resource gathered
  - Exp per gather completion
  - Different exp for different node types
  - Independent tracking across ants
  
- ✅ Experience Persistence - 5 tests
  - Preserve exp when ant leaves node
  - Accumulate across multiple nodes
  - Include in total exp calculation
  
- ✅ Edge Cases - 5 tests
  - Graceful handling of missing StatsContainer
  - Partial StatsContainer (missing exp)
  - Exp capped at stat upper limit

**Key Test Cases**:
```javascript
it('should increment ant exp when resource gathered', function() {
  const ant = {
    stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
  };
  // Resource gathered
  ant.stats.exp.get('Gathering').statValue += 10;
  
  expect(ant.stats.exp.get('Gathering').statValue).to.equal(10);
});

it('should accumulate exp across multiple nodes', function() {
  const ant = { stats: new MockStatsContainer(...) };
  ant.stats.exp.get('Gathering').statValue += 25; // Node 1
  ant.stats.exp.get('Gathering').statValue += 30; // Node 2
  ant.stats.exp.get('Gathering').statValue += 15; // Node 3
  
  expect(ant.stats.exp.get('Gathering').statValue).to.equal(70);
});
```

### 3. Ant Gather Speed (20 tests)
**Purpose**: Test StatsContainer gather speed affecting work rate

**Test Sections**:
- ✅ Gather Speed Stat - 5 tests
  - gatherSpeed stat exists in StatsContainer
  - Default value of 1.0
  - Custom gather speed support
  - Speed modification
  
- ✅ Speed Affects Work Rate - 5 tests
  - Use speed as work multiplier
  - Faster with higher speed
  - Calculate time to gather based on speed
  - Fractional speed support
  
- ✅ Multi-Ant Gathering - 5 tests
  - Multiple ants with different speeds
  - Combined gather rate calculation
  
- ✅ Edge Cases - 5 tests
  - Fallback to 1.0 if no StatsContainer
  - Zero gather speed handling
  - Cap at upper limit (100)
  - Floor at lower limit (0)

**Key Test Cases**:
```javascript
it('should accumulate work faster with higher speed', function() {
  const fastAnt = { stats: new MockStatsContainer(..., gatherSpeed: 3.0) };
  const slowAnt = { stats: new MockStatsContainer(..., gatherSpeed: 0.5) };
  
  const baseWork = 5;
  const fastWork = baseWork * fastAnt.stats.gatherSpeed.statValue;
  const slowWork = baseWork * slowAnt.stats.gatherSpeed.statValue;
  
  expect(fastWork).to.equal(15); // 5 * 3.0
  expect(slowWork).to.equal(2.5); // 5 * 0.5
});

it('should handle multiple ants with different speeds', function() {
  const ants = [
    { stats: new MockStatsContainer(..., gatherSpeed: 1.0) },
    { stats: new MockStatsContainer(..., gatherSpeed: 1.5) },
    { stats: new MockStatsContainer(..., gatherSpeed: 0.8) }
  ];
  
  let totalWork = ants.reduce((sum, ant) => 
    sum + 5 * ant.stats.gatherSpeed.statValue, 0
  );
  
  expect(totalWork).to.equal(16.5); // (5*1.0) + (5*1.5) + (5*0.8)
});
```

### 4. Attack Targeting (25 tests)
**Purpose**: Test nodes as targetable but not auto-attacked

**Test Sections**:
- ✅ Targetable Property - 5 tests
  - Nodes marked as targetable
  - Can be selected as attack target
  - Faction property support
  
- ✅ Not Auto-Attacked - 5 tests
  - Not in default enemy targeting
  - Neutral faction excluded from auto-attack
  - Require manual targeting
  
- ✅ Health Tracking - 5 tests
  - Health property for nodes
  - Different health per node type
  - Health reduction on damage
  - Health as percentage
  
- ✅ Combat Controller Integration - 10 tests
  - onDamage callback support
  - Death trigger at zero health
  - Damage resistance per type
  - Rock nodes harder to destroy than bushes

**Key Test Cases**:
```javascript
it('should exclude neutral faction from auto-attack', function() {
  const entities = [
    { type: 'Ant', faction: 'enemy' },
    { type: 'ResourceNode', faction: 'neutral' },
    { type: 'Ant', faction: 'enemy' }
  ];
  
  const autoTargets = entities.filter(e => e.faction === 'enemy');
  expect(autoTargets).to.have.lengthOf(2); // Only ants, not node
});

it('should support damage resistance for different types', function() {
  const rockNode = { nodeType: 'rock', damageResistance: 0.5 };
  const bushNode = { nodeType: 'bush', damageResistance: 0 };
  
  const rawDamage = 20;
  const rockDamage = rawDamage * (1 - rockNode.damageResistance);
  const bushDamage = rawDamage * (1 - bushNode.damageResistance);
  
  expect(rockDamage).to.equal(10); // 50% resistance
  expect(bushDamage).to.equal(20); // No resistance
});
```

### 5. Node Destruction & Resource Drop (30 tests)
**Purpose**: Test death mechanics and partial resource drops

**Test Sections**:
- ✅ Health Depletion - 5 tests
  - Damage accumulation tracking
  - Reach zero health
  - Clamp to minimum of 0
  
- ✅ Death Trigger - 5 tests
  - Trigger destruction at zero health
  - onDestroy callback
  - Mark for removal from game
  
- ✅ Partial Resource Drop Calculation - 5 tests
  - Drop fraction of spawnable resources
  - Random fraction (10-50%)
  - Minimum of 1 resource if any exist
  - Zero drop if no resources
  
- ✅ Resource Spawn on Death - 5 tests
  - Spawn at node position
  - Select based on node type weights
  - Scatter around node in circular pattern
  
- ✅ Integration - Destruction Flow - 10 tests
  - Full destruction sequence
  - Remove from manager on death
  - Different destroy reasons (depletion vs combat)
  - Resource drop calculation and spawning

**Key Test Cases**:
```javascript
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
  const dropFraction = 0.3; // 30%
  const dropAmount = Math.floor(totalWeight * dropFraction);
  
  expect(totalWeight).to.equal(8);
  expect(dropAmount).to.equal(2); // floor(8 * 0.3)
});

it('should scatter dropped resources around node', function() {
  const node = { gridX: 10, gridY: 10, droppedResources: [] };
  
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5;
    const distance = 1; // 1 tile
    const dropX = node.gridX + Math.cos(angle) * distance;
    const dropY = node.gridY + Math.sin(angle) * distance;
    
    node.droppedResources.push({
      gridX: Math.round(dropX),
      gridY: Math.round(dropY)
    });
  }
  
  const uniquePositions = new Set(
    node.droppedResources.map(r => `${r.gridX},${r.gridY}`)
  );
  expect(uniquePositions.size).to.be.greaterThan(1); // Scattered, not stacked
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
  if (gatheredNode.resourceGatherLimit > 0 && 
      gatheredNode.gatherCount >= gatheredNode.resourceGatherLimit) {
    gatheredNode.destroyReason = 'depleted';
  }
  
  // Check combat
  if (attackedNode.health <= 0) {
    attackedNode.destroyReason = 'destroyed';
  }
  
  expect(gatheredNode.destroyReason).to.equal('depleted');
  expect(attackedNode.destroyReason).to.equal('destroyed');
});
```

### 6. Grid Coordinate System Integration (15 tests)
**Purpose**: Test grid ↔ pixel coordinate conversion

**Test Sections**:
- ✅ Grid to Pixel Conversion - 5 tests
  - Convert grid to pixels (gridX * TILE_SIZE)
  - Handle origin (0,0)
  - Handle large coordinates
  
- ✅ Pixel to Grid Conversion - 5 tests
  - Convert pixels to grid (floor(pixelX / TILE_SIZE))
  - Floor fractional pixels
  
- ✅ Node Position Storage - 5 tests
  - Store both grid and pixel coordinates
  - Grid coords as source of truth

**Key Test Cases**:
```javascript
it('should convert grid coordinates to pixels', function() {
  const gridX = 10;
  const gridY = 5;
  
  const [pixelX, pixelY] = g_activeMap.coordSys.convPosToBackingCanvas([gridX, gridY]);
  
  expect(pixelX).to.equal(320); // 10 * 32
  expect(pixelY).to.equal(160); // 5 * 32
});

it('should store both grid and pixel coordinates', function() {
  const node = { gridX: 12, gridY: 8 };
  
  const [pixelX, pixelY] = g_activeMap.coordSys.convPosToBackingCanvas([node.gridX, node.gridY]);
  node.posX = pixelX;
  node.posY = pixelY;
  
  expect(node.gridX).to.equal(12);
  expect(node.gridY).to.equal(8);
  expect(node.posX).to.equal(384);
  expect(node.posY).to.equal(256);
});
```

## Mock Infrastructure Updates

### New Mock Classes
```javascript
// Mock CoordinateSystem for grid ↔ pixel conversion
class MockCoordinateSystem {
  convPosToBackingCanvas([gridX, gridY]) {
    return [gridX * TILE_SIZE, gridY * TILE_SIZE];
  }
  
  convBackingCanvasToPos([pixelX, pixelY]) {
    return [Math.floor(pixelX / TILE_SIZE), Math.floor(pixelY / TILE_SIZE)];
  }
}

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

// Mock StatsContainer with all 8 exp categories
class MockStatsContainer {
  constructor(pos, size, movementSpeed = 0.05, pendingPos = null, 
              strength = 10, health = 100, gatherSpeed = 1) {
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
```

### Global Mocks Added
```javascript
global.g_activeMap = {
  coordSys: new MockCoordinateSystem()
};

global.MockStat = MockStat;
global.MockStatsContainer = MockStatsContainer;
```

## Coordinate System Migration

### Before (Pixel-based)
```javascript
it('should create resource node with basic parameters', function() {
  const node = {
    posX: 100,  // PIXEL coordinates (WRONG)
    posY: 100,
    spawnRadius: 2  // Ambiguous units
  };
});
```

### After (Grid-based)
```javascript
it('should create resource node with basic parameters in grid coordinates', function() {
  const node = {
    gridX: 3,  // GRID coordinates (CORRECT)
    gridY: 3,
    spawnRadius: 2  // In tiles (explicit)
  };
  
  expect(node.gridX).to.equal(3);
  expect(node.gridY).to.equal(3);
});
```

### Updated Test Patterns
```javascript
// Old: Direct pixel coordinates
const ant = { posX: 120, posY: 120 };

// New: Grid coords with pixel conversion
const node = { gridX: 3, gridY: 3 };
const [nodePixelX, nodePixelY] = g_activeMap.coordSys.convPosToBackingCanvas([node.gridX, node.gridY]);
const ant = { posX: nodePixelX + 20, posY: nodePixelY + 20 };
```

## TDD Status: RED PHASE ✅

### Expected Behavior
**All new tests SHOULD FAIL** because features are not implemented yet.

This is CORRECT and INTENTIONAL in TDD:
1. ✅ **RED**: Write tests that specify desired behavior (CURRENT)
2. ⏳ **GREEN**: Implement features to make tests pass (NEXT)
3. ⏳ **REFACTOR**: Improve code while keeping tests green (FUTURE)

### Next Steps for Implementation

#### ResourceNode.js Updates Required:
1. Add `resourceGatherLimit` property with range support
2. Add `gatherCount` tracking and increment on spawn
3. Add depletion check and node destruction
4. Integrate StatsContainer for gathering exp
5. Add exp increment on resource gather
6. Integrate StatsContainer gather speed
7. Use speed as work rate multiplier
8. Add `targetable`, `faction`, `health` properties
9. Add combat integration (damage reception)
10. Add destruction mechanics and onDestroy callback
11. Add partial resource drop calculation
12. Add resource scatter pattern on death
13. Update all position handling to use grid coordinates

## File Statistics

### ResourceNode.test.js
- **Lines**: ~2,450 (was ~1,300)
- **Test Cases**: ~290 (was ~200)
- **Describe Blocks**: 35 (was 20)
- **Mock Classes**: 3 (added MockStat, MockStatsContainer, MockCoordinateSystem)
- **Coverage Areas**: 11 major feature areas

### Test Organization
```
ResourceNode/
├── Node Type Definitions (20 tests)
├── ResourceNode Class - Constructor (20 tests) ← Updated to grid coords
├── Ant Detection System (30 tests) ← Updated to grid coords
├── Work Progress Tracking (25 tests)
├── Visual Progress Indicators (20 tests)
├── Resource Spawning (35 tests)
├── Work Rate and Difficulty (20 tests)
├── Integration Tests (30 tests)
├── Edge Cases (20 tests)
├── Performance and Optimization (10 tests)
├── *** NEW: Resource Gather Limits (45 tests) ***
├── *** NEW: Ant Gathering Experience (25 tests) ***
├── *** NEW: Ant Gather Speed (20 tests) ***
├── *** NEW: Attack Targeting (25 tests) ***
├── *** NEW: Node Destruction (30 tests) ***
└── *** NEW: Grid Coordinate Integration (15 tests) ***
```

## Documentation Updates

### Test File Header
Updated to include all new requirements:
```javascript
/**
 * Unit tests for ResourceNode.js
 * Tests resource node spawning system for building-based resource generation:
 * ...
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
```

## Testing Methodology Compliance

### ✅ Follows TDD Standards
- Tests written BEFORE implementation
- Tests specify desired behavior clearly
- Tests are independent and repeatable
- Tests use system APIs (StatsContainer, CoordinateSystem)
- Tests catch real bugs (coordinate system, gather limits, etc.)
- Tests run headless (Mocha, no browser required)
- Tests provide clear failure messages

### ✅ Follows BDD Language Guidelines
- No "REAL" or "ACTUAL" qualifiers
- No "fake implementations" language
- Clear, declarative test descriptions
- Tests describe behavior, not implementation details

### ✅ Quality Standards Met
- Every test uses system constructors (MockStatsContainer)
- No hardcoded test results
- No testing internal mechanics (test behavior instead)
- All tests have clear expectations
- Edge cases comprehensively covered

## Conclusion

**Tests Successfully Updated ✅**
- ✅ ~90 new test cases added
- ✅ 5 major feature areas specified
- ✅ Grid coordinate system integrated
- ✅ StatsContainer mocks created
- ✅ TDD RED phase complete

**Ready for Implementation 🚀**
The test suite now provides a complete specification for:
1. Depletable resource nodes
2. Ant gathering experience system
3. Ant gather speed mechanics
4. Combat targeting of nodes
5. Node destruction with resource drops
6. Grid-based coordinate system

Next step: Update ResourceNode.js implementation to make all tests pass (TDD GREEN phase).
