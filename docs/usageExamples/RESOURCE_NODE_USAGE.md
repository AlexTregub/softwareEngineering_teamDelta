# ResourceNode System Usage Guide

## Overview

The **ResourceNode** system provides building-based resource spawning for the Ant Game. Resource nodes are placed near buildings (trees, rocks, beehives, bushes) and spawn resources when gathering-state ants work on them.

**IMPORTANT**: All position parameters use **GRID COORDINATES** (tiles), not pixel coordinates. The system automatically converts to pixel coordinates internally using the terrain coordinate system (`g_activeMap.coordSys`).

## Features

- ✅ **Ant Detection**: Only ants in GATHERING state contribute to work progress
- ✅ **Visual Progress Indicators**: Progress bars above nodes show work completion
- ✅ **Weighted Resource Spawning**: Different probabilities for resource types (e.g., trees: 60% leaves, 30% sticks, 10% apples)
- ✅ **Batch Spawning**: 1-5 resources spawned in circular distribution when complete
- ✅ **Variable Difficulty**: Bush (80) < Tree (100) < Beehive (150) < Rock (200) work required
- ✅ **Ant Repositioning**: Ants move around nodes every 3 seconds during gathering
- ✅ **Performance Optimized**: Spatial grid caching, periodic checks

## Node Types

### Tree
```javascript
{
  workToGather: 100,
  spawnRadius: 64, // pixels (2 tiles)
  resourceTypes: [
    { type: 'greenLeaf', weight: 0.6 },  // 60% chance
    { type: 'stick', weight: 0.3 },      // 30% chance
    { type: 'apple', weight: 0.1 }       // 10% chance
  ],
  workRate: 1.0,
  batchSize: { min: 2, max: 4 }
}
```

### Rock
```javascript
{
  workToGather: 200, // Hardest to gather
  spawnRadius: 64,
  resourceTypes: [
    { type: 'stone', weight: 1.0 }       // 100% chance
  ],
  workRate: 0.5,    // Slower work accumulation
  batchSize: { min: 1, max: 2 }         // Fewer resources
}
```

### Beehive
```javascript
{
  workToGather: 150,
  spawnRadius: 64,
  resourceTypes: [
    { type: 'honey', weight: 0.8 },      // 80% chance
    { type: 'wax', weight: 0.2 }         // 20% chance
  ],
  workRate: 0.75,
  batchSize: { min: 1, max: 3 }
}
```

### Bush
```javascript
{
  workToGather: 80,  // Easiest to gather
  spawnRadius: 64,
  resourceTypes: [
    { type: 'berry', weight: 0.7 },      // 70% chance
    { type: 'greenLeaf', weight: 0.3 }   // 30% chance
  ],
  workRate: 1.2,     // Faster work accumulation
  batchSize: { min: 3, max: 5 }         // More resources
}
```

## Basic Usage

### Creating a Resource Node

```javascript
// Create a tree node at GRID position (12, 9) - not pixels!
const treeNode = new ResourceNode(12, 9, 'tree');

// Create a rock node at GRID position (18, 15)
const rockNode = new ResourceNode(18, 15, 'rock');

// Create a beehive node at GRID position (6, 12)
const beehiveNode = new ResourceNode(6, 12, 'beehive');

// Create a bush node at GRID position (25, 6)
const bushNode = new ResourceNode(25, 6, 'bush');

// The system automatically converts grid coordinates to pixel coordinates
// using the terrain coordinate system (g_activeMap.coordSys)
```

### Integration with Game Loop

```javascript
// In your setup() function
let resourceNodes = [];

function setup() {
  // Create nodes near buildings (using GRID coordinates)
  resourceNodes.push(new ResourceNode(12, 9, 'tree'));
  resourceNodes.push(new ResourceNode(18, 15, 'rock'));
}

// In your draw() function
function draw() {
  // Update all nodes (detects ants, accumulates work, spawns resources)
  resourceNodes.forEach(node => {
    node.update(deltaTime);
  });
  
  // Render all nodes (shows sprite + progress bar)
  resourceNodes.forEach(node => {
    node.render();
  });
}
```

## Advanced Usage

### Custom Node Configuration

```javascript
// Create a custom node with options (grid coordinates)
const customNode = new ResourceNode(12, 9, 'tree', {
  debugBorderColor: '#00FF00',  // Custom debug color
  showDebugPanel: true,         // Show debug info
  // Additional Entity options available
});
```

### Getting Grid Position

```javascript
const node = new ResourceNode(12, 9, 'tree');

// Get grid coordinates
const gridPos = node.getGridPosition();
console.log(gridPos); // { x: 12, y: 9 }

// Grid coordinates are also available as properties
console.log(node.gridX, node.gridY); // 12, 9

// Get pixel position (from Entity)
const pixelPos = node.getPosition();
console.log(pixelPos); // Pixel coordinates after terrain conversion
```

### Manual Work Control

```javascript
const node = new ResourceNode(12, 9, 'tree');

// Add work manually (bypasses ant detection)
node.addWork(10);

// Check progress (0 to 1)
const progress = node.getProgress(); // e.g., 0.35 = 35%

// Check if ready to spawn
if (node.isReadyToSpawn()) {
  console.log('Node is ready to spawn resources!');
}

// Manually trigger spawn
const resources = node.spawnBatch();
console.log(`Spawned ${resources.length} resources`);
```

### State Management

```javascript
const node = new ResourceNode(12, 9, 'tree');

// Deactivate node (stops spawning)
node.deactivate();

// Reactivate node
node.activate();

// Get statistics
const stats = node.getStats();
console.log(stats);
/*
{
  nodeType: 'tree',
  displayName: 'Tree',
  gridX: 12,
  gridY: 9,
  isActive: true,
  currentWork: 45,
  workToGather: 100,
  progress: 0.45,
  nearbyAntsCount: 2,
  isReadyToSpawn: false,
  lastSpawnTime: 1234567890
}
*/
```

## Integration with Buildings

```javascript
// Example: Spawn resource node when building is placed
class Building {
  constructor(gridX, gridY, buildingType) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = buildingType;
    
    // Create corresponding resource node at grid position
    if (buildingType === 'tree') {
      this.resourceNode = new ResourceNode(gridX + 1, gridY + 1, 'tree');
    } else if (buildingType === 'rock') {
      this.resourceNode = new ResourceNode(gridX + 1, gridY + 1, 'rock');
    }
  }
  
  update(deltaTime) {
    if (this.resourceNode) {
      this.resourceNode.update(deltaTime);
    }
  }
  
  render() {
    // Render building sprite
    // ...
    
    // Render resource node
    if (this.resourceNode) {
      this.resourceNode.render();
    }
  }
}
```

## Ant Integration

### How Ants Interact with Nodes

1. **Detection**: Nodes automatically detect ants within `spawnRadius` (64 pixels)
2. **State Filtering**: Only ants in **GATHERING** state contribute work
3. **Work Accumulation**: Each gathering ant adds `workRate * deltaTime * antCount` per frame
4. **Repositioning**: Ants are repositioned around the node every 3 seconds in circular pattern
5. **Spawning**: When `currentWork >= workToGather`, resources spawn automatically

### Example: Setting Ant to Gathering State

```javascript
// In your ant gathering logic
function gatherFromNode(ant, resourceNode) {
  // Set ant to GATHERING state
  ant.stateMachine.setState('GATHERING');
  
  // Move ant to node
  const nodePos = resourceNode.getPosition();
  ant.moveToLocation(nodePos.x, nodePos.y);
  
  // Node will automatically:
  // 1. Detect ant within spawn radius
  // 2. Add work progress
  // 3. Reposition ant every 3 seconds
  // 4. Spawn resources when complete
}
```

## Performance Considerations

### Spatial Grid Caching
```javascript
// Nodes cache nearby entity queries for 1 second
// Automatic optimization - no manual intervention needed
const nearbyAnts = node.detectNearbyAnts(); // Uses cache if available
```

### Periodic Checks
```javascript
// Ant detection runs every 500ms (antCheckInterval)
// Ant repositioning runs every 3000ms (antRepositionInterval)
// Configurable via class properties if needed
node.antCheckInterval = 1000;      // Check every 1 second
node.antRepositionInterval = 5000; // Reposition every 5 seconds
```

## Visual Progress Bar Customization

```javascript
const node = new ResourceNode(400, 300, 'tree');

// Customize progress bar appearance
node.progressBarWidth = 60;        // Default: 40 pixels
node.progressBarHeight = 8;        // Default: 6 pixels
node.progressBarOffset = -15;      // Default: -10 pixels above node
node.progressBarColor = '#FF00FF'; // Custom color (overrides nodeType default)
```

## Debugging

### Console Commands

```javascript
// In browser console
const node = new ResourceNode(400, 300, 'tree');

// Get node statistics
node.getStats();

// Check nearby ants
node.detectNearbyAnts();

// Check if specific ant is in range
node.isAntInRange(myAnt);

// Get current progress
node.getProgress();

// Check spawn readiness
node.isReadyToSpawn();
```

### Visual Debugging

```javascript
// Enable entity debugger (shows bounding box and properties)
const node = new ResourceNode(400, 300, 'tree', {
  showDebugPanel: true,
  debugBorderColor: '#FF0000',
  debugAutoRefresh: true
});
```

## Common Patterns

### Node Array Management
```javascript
class ResourceNodeManager {
  constructor() {
    this.nodes = [];
  }
  
  addNode(x, y, type) {
    const node = new ResourceNode(x, y, type);
    this.nodes.push(node);
    return node;
  }
  
  updateAll(deltaTime) {
    this.nodes.forEach(node => node.update(deltaTime));
  }
  
  renderAll() {
    this.nodes.forEach(node => node.render());
  }
  
  removeNode(node) {
    node.deactivate();
    const index = this.nodes.indexOf(node);
    if (index > -1) {
      this.nodes.splice(index, 1);
    }
  }
  
  getActiveNodes() {
    return this.nodes.filter(node => node.isActive);
  }
  
  getNodesByType(type) {
    return this.nodes.filter(node => node.nodeType === type);
  }
}

// Usage
const nodeManager = new ResourceNodeManager();
nodeManager.addNode(400, 300, 'tree');
nodeManager.addNode(600, 500, 'rock');

// In game loop
nodeManager.updateAll(deltaTime);
nodeManager.renderAll();
```

### Proximity Detection
```javascript
// Find nearest resource node to an ant
function findNearestNode(ant, nodes) {
  const antPos = ant.getPosition();
  
  let nearest = null;
  let minDistance = Infinity;
  
  nodes.forEach(node => {
    const nodePos = node.getPosition();
    const dx = nodePos.x - antPos.x;
    const dy = nodePos.y - antPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = node;
    }
  });
  
  return nearest;
}
```

## Testing

The ResourceNode system has comprehensive unit test coverage (~200 test cases):

```bash
# Run ResourceNode tests
npm run test:unit -- test/unit/systems/ResourceNode.test.js

# Run all unit tests
npm run test:unit
```

Test coverage includes:
- ✅ Node type definitions and validation
- ✅ Constructor and initialization
- ✅ Ant detection and state filtering
- ✅ Work progress accumulation
- ✅ Visual progress indicators
- ✅ Resource spawning (single and batch)
- ✅ Weighted randomization
- ✅ Ant repositioning
- ✅ Performance optimization
- ✅ Edge cases and error handling

## API Reference

### Constructor

```typescript
new ResourceNode(
  gridX: number,       // X position in GRID COORDINATES (tiles)
  gridY: number,       // Y position in GRID COORDINATES (tiles)
  nodeType: string,    // 'tree' | 'rock' | 'beehive' | 'bush'
  options?: Object     // Entity options (optional)
)
```

**Example:**
```javascript
// Create tree at grid position (12, 9)
const node = new ResourceNode(12, 9, 'tree');

// Grid coordinates are automatically converted to pixels using:
// g_activeMap.coordSys.convPosToBackingCanvas([gridX, gridY])
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `addWork(amount)` | `boolean` | Add work progress manually |
| `getProgress()` | `number` | Get progress (0 to 1) |
| `isReadyToSpawn()` | `boolean` | Check if ready to spawn |
| `resetWork()` | `void` | Reset work progress |
| `detectNearbyAnts()` | `Array` | Get gathering ants in radius |
| `isAntInRange(ant)` | `boolean` | Check if ant within radius |
| `selectResourceType()` | `string` | Get weighted random resource |
| `spawnResource(type)` | `Object` | Spawn single resource |
| `spawnBatch()` | `Array` | Spawn batch of resources |
| `repositionAnts(ants)` | `void` | Reposition ants around node |
| `renderProgressBar()` | `void` | Render progress indicator |
| `update(deltaTime)` | `void` | Update node state |
| `render()` | `void` | Render node |
| `deactivate()` | `void` | Stop spawning |
| `activate()` | `void` | Resume spawning |
| `getStats()` | `Object` | Get node statistics |
| `getGridPosition()` | `Object` | Get grid coords {x, y} |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `gridX` | `number` | Grid X coordinate (tiles) |
| `gridY` | `number` | Grid Y coordinate (tiles) |
| `nodeType` | `string` | Node type identifier |
| `config` | `Object` | Node configuration |
| `currentWork` | `number` | Current work accumulated |
| `workToGather` | `number` | Work needed to spawn |
| `workRate` | `number` | Work accumulation multiplier |
| `spawnRadius` | `number` | Detection radius (tiles) |
| `resourceTypes` | `Array` | Weighted resource types |
| `batchSize` | `Object` | Min/max spawn count |
| `progressBarColor` | `string` | Progress bar color |
| `isActive` | `boolean` | Active state |
| `nearbyAnts` | `Array` | Cached nearby ants |

## Constants

### NODE_TYPES

```javascript
const NODE_TYPES = {
  tree: { /* tree config */ },
  rock: { /* rock config */ },
  beehive: { /* beehive config */ },
  bush: { /* bush config */ }
};
```

Access node type constants:
```javascript
console.log(NODE_TYPES.tree.workToGather);  // 100
console.log(NODE_TYPES.rock.workRate);      // 0.5
```

## Examples

See `docs/usageExamples/` for more examples:
- Building integration
- Ant gathering workflows
- Custom resource spawning
- Performance optimization strategies

## Related Documentation

- [Entity System](../architecture/ENTITY_SYSTEM.md)
- [Resource System](../architecture/RESOURCE_SYSTEM.md)
- [Spatial Grid System](../quick-reference-spatial-grid.md)
- [Testing Standards](../standards/testing/TESTING_METHODOLOGY_STANDARDS.md)
