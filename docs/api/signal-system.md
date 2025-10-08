/**
 * @fileoverview Comprehensive Signal System Documentation
 * Complete guide for using the Godot-style Signal system in the ant game.
 * Covers all features, API usage patterns, and integration examples.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

# Signal System Documentation

## Overview

The Signal System provides a comprehensive event-driven architecture for the ant game, implementing Godot-style signals with full API compatibility. This system enables loose coupling between game components while maintaining high performance and flexibility.

## Core Components

### 1. Signal Class
The core Signal class handles event emission and connection management.

```javascript
const { Signal } = require('./src/core/systems/SignalSystem.js');

// Create a signal
const signal = new Signal(ownerObject, 'signal_name');

// Connect a callback
signal.connect(callback);

// Emit the signal
signal.emit(arg1, arg2, arg3);
```

### 2. Callable Class
The Callable class provides parameter binding functionality similar to Godot's Callable.bind().

```javascript
const { Callable } = require('./src/core/systems/SignalSystem.js');

// Create a callable from a function
const callable = new Callable(myFunction);

// Bind parameters
const boundCallable = callable.bind('param1', 'param2');

// Call with additional arguments
boundCallable.call('param3'); // Calls myFunction('param1', 'param2', 'param3')
```

### 3. GameObject Class
Base class for objects that can emit signals.

```javascript
const { GameObject } = require('./src/core/systems/SignalSystem.js');

class MyGameObject extends GameObject {
    constructor() {
        super('MyObject');
        
        // Declare signals
        this.declareSignal('health_changed', 'newHealth', 'oldHealth');
        this.declareSignal('died', 'cause');
    }
    
    takeDamage(amount) {
        const oldHealth = this.health;
        this.health -= amount;
        
        // Emit signal
        this.health_changed.emit(this.health, oldHealth);
        
        if (this.health <= 0) {
            this.died.emit('damage');
        }
    }
}
```

## API Reference

### Signal Methods

#### Connection Management
```javascript
// Connect a callback (returns 0 on success, 1 on error)
const result = signal.connect(callback, flags);

// Connection flags
Signal.CONNECT_ONESHOT     // Disconnect after first emission
Signal.CONNECT_DEFERRED    // Defer emission (not yet implemented)
Signal.CONNECT_REFERENCE_COUNTED // Reference counting (not yet implemented)
Signal.CONNECT_PERSIST     // Persist through object destruction (not yet implemented)

// Disconnect a callback
signal.disconnect(callback);

// Disconnect all callbacks
signal.disconnectAll();

// Check if callback is connected
const isConnected = signal.isConnected(callback);
```

#### Signal Information
```javascript
// Check if signal has connections
const hasConnections = signal.hasConnections();

// Get connection count
const count = signal.getConnectionCount();

// Get all connections
const connections = signal.getConnections();

// Get signal name
const name = signal.getName();

// Get owner object
const owner = signal.getObject();
```

#### Signal Metrics
```javascript
// Get performance metrics
const metrics = signal.getMetrics();
// Returns: { totalEmissions, totalConnections, totalDisconnections, 
//           averageEmissionTime, maxConnections }

// Get emission count
const count = signal.getEmissionCount();

// Get last emission time
const time = signal.getLastEmissionTime();

// Get connection history
const history = signal.getConnectionHistory();
```

### GameObject Methods

#### Signal Declaration
```javascript
// Declare a signal with optional parameter documentation
const signal = gameObject.declareSignal('signal_name', 'param1', 'param2');

// Check if signal exists
const exists = gameObject.hasSignal('signal_name');

// Get signal by name
const signal = gameObject.getSignal('signal_name');

// Get all signal names
const signalNames = gameObject.getSignalList();
```

#### Signal Connections
```javascript
// Connect to another object's signal
gameObject.connectSignal(otherObject, 'signal_name', callback, flags);

// Disconnect from another object's signal
gameObject.disconnectSignal(otherObject, 'signal_name', callback);

// Emit a signal
gameObject.emitSignal('signal_name', arg1, arg2);
```

## EventBus System

The EventBus provides a simplified interface over the Signal system for easier API usage.

### Basic Usage
```javascript
const { eventBus } = require('./src/core/systems/EventBus.js');

// Emit an event
eventBus.emit('ant_spawned', {
    antId: 'ant_123',
    position: { x: 10, y: 20 },
    job: 'Worker'
});

// Listen to events
const unsubscribe = eventBus.on('ant_spawned', (data, context, event) => {
    console.log(`Ant ${data.antId} spawned as ${data.job}`);
});

// Listen once
eventBus.once('game_ended', (data) => {
    console.log('Game over!');
});

// Remove listener
unsubscribe();
```

### Global Event Bus
```javascript
// Get global instance
const globalBus = eventBus.global();

// Add global listener (receives all events)
const listenerId = globalBus.addGlobalListener((event) => {
    console.log(`Event: ${event.name}`, event.data);
});

// Remove global listener
globalBus.removeGlobalListener(listenerId);
```

### Namespaced Events
```javascript
// Create namespaced event bus
const antEvents = eventBus.global().namespace('ant');

// Emit namespaced event (becomes 'ant:spawned')
antEvents.emit('spawned', { antId: 'ant_123' });

// Listen to namespaced event
antEvents.on('spawned', (data) => {
    console.log(`Ant spawned: ${data.antId}`);
});
```

## Integration Examples

### Enhanced Ant Integration
```javascript
const { EnhancedAnt } = require('./src/entities/EnhancedAnt.js');

// Create an ant
const ant = new EnhancedAnt('ant_001', { x: 100, y: 200 }, 'Worker');

// Listen to ant signals directly
ant.health_changed.connect((ant, newHealth, oldHealth) => {
    console.log(`Ant ${ant.id} health: ${oldHealth} → ${newHealth}`);
});

// Listen through event bus
eventBus.on('ant_health_changed', (data) => {
    console.log(`Health changed for ant ${data.antId}`);
});

// Simplified API access
const antAPI = ant.getAPI();
antAPI.onHealthChange((ant, newHealth, oldHealth) => {
    updateHealthBar(ant.id, newHealth);
});
```

### Resource Manager Integration
```javascript
const { SignalEnhancedResourceManager } = require('./src/managers/SignalEnhancedResourceManager.js');

const resourceManager = new SignalEnhancedResourceManager();

// Listen to resource events
resourceManager.resource_discovered.connect((manager, resource) => {
    console.log(`Discovered ${resource.type} with ${resource.amount} units`);
});

// Through event bus
eventBus.on('resource_collected', (data) => {
    updateResourceDisplay(data.resource.type, data.amount);
});

// Simplified API
const resourceAPI = resourceManager.getAPI();
resourceAPI.onResourceDiscovered((callback) => {
    // Handle resource discovery
});
```

### Game Integration Manager
```javascript
const { GameIntegrationManager } = require('./src/core/GameIntegrationManager.js');

const gameManager = new GameIntegrationManager();

// Simplified game API
const gameAPI = gameManager.getAPI();

// Spawn ants
const worker = gameAPI.spawnAnt('Worker', { x: 50, y: 50 });
const gatherer = gameAPI.spawnAnt('Gatherer', { x: 100, y: 100 });

// Listen to game events
gameAPI.on('level_completed', (data) => {
    console.log(`Level ${data.previousLevel} completed!`);
    showLevelCompletionScreen(data);
});

// UI integration
const uiCleanup = gameAPI.onUIEvent('ant_count_changed', (count) => {
    document.getElementById('ant-count').textContent = count;
});
```

## Common Usage Patterns

### 1. One-Shot Connections
```javascript
// Connect with ONESHOT flag for one-time events
signal.connect(callback, Signal.CONNECT_ONESHOT);

// Or use EventBus once()
eventBus.once('game_started', () => {
    initializeGame();
});
```

### 2. Parameter Binding
```javascript
// Bind parameters to callbacks
const boundCallback = new Callable(updateUI).bind('health', 'red');
ant.health_changed.connect(boundCallback);

// When emitted, calls updateUI('health', 'red', ant, newHealth, oldHealth)
```

### 3. Cross-System Communication
```javascript
// Ant notifies resource system
eventBus.on('ant_spawned', (data, context) => {
    const ant = context;
    resourceManager.surveyArea(getAreaAroundAnt(ant), ant);
});

// Resource system notifies UI
eventBus.on('resource_discovered', (data) => {
    showResourceNotification(data.resource.type, data.position);
});
```

### 4. Error Handling
```javascript
// Custom error handling in GameObject
class MyAnt extends GameObject {
    handleSignalError(error, signalName, args) {
        console.error(`Signal error in ${this.name}::${signalName}:`, error);
        // Could implement recovery logic here
    }
}
```

### 5. Performance Monitoring
```javascript
// Monitor signal performance
setInterval(() => {
    const metrics = mySignal.getMetrics();
    if (metrics.averageEmissionTime > 5) { // ms
        console.warn(`Signal ${mySignal.getName()} is slow: ${metrics.averageEmissionTime}ms`);
    }
}, 10000);
```

## Best Practices

### 1. Signal Naming
- Use snake_case for signal names: `health_changed`, `item_picked_up`
- Be descriptive: `combat_started` instead of `fight`
- Use consistent verbs: `_changed`, `_completed`, `_started`, `_ended`

### 2. Parameter Organization
- Keep parameters consistent across similar signals
- Document parameters when declaring signals
- Use objects for complex data

```javascript
// Good
this.declareSignal('resource_collected', 'resource', 'collector', 'amount');

// Better with documentation
this.declareSignal('resource_collected', 'resource_object', 'collector_ant', 'amount_collected');
```

### 3. Connection Management
- Always disconnect signals when objects are destroyed
- Use one-shot connections for single-use events
- Group related connections for easier management

```javascript
// Group connections for cleanup
this.connectionCleanup = [
    signal1.connect(callback1),
    signal2.connect(callback2),
    signal3.connect(callback3)
];

// Cleanup
this.connectionCleanup.forEach(disconnect => disconnect());
```

### 4. Performance Considerations
- Use EventBus for high-level game events
- Use direct signals for performance-critical operations
- Monitor signal metrics in development builds
- Avoid heavy operations in signal callbacks

### 5. Debugging
- Use signal emission history for debugging
- Implement error handling in GameObject subclasses
- Monitor connection counts to detect memory leaks

```javascript
// Debug helper
function debugSignal(signal) {
    console.log(`Signal: ${signal.getName()}`);
    console.log(`Connections: ${signal.getConnectionCount()}`);
    console.log(`Emissions: ${signal.getEmissionCount()}`);
    console.log(`History:`, signal.getConnectionHistory());
}
```

## Testing

The signal system includes comprehensive test suites:

- `signal.core.test.js` - Basic signal functionality
- `signal.connections.test.js` - Connection management and Callable.bind()
- `signal.objects.test.js` - GameObject integration
- `signal.errors.test.js` - Error handling and edge cases
- `signal.performance.test.js` - Performance and scalability
- `signal.game-integration.test.js` - Game system integration
- `signal.api-integration.test.js` - API integration validation

Run tests with:
```bash
npm test
# or
node tests/runAllTests.js
```

## Migration Guide

### From Direct Function Calls
```javascript
// Before
ant.onHealthChanged = (newHealth) => updateHealthBar(newHealth);
ant.setHealth(50); // Manually call onHealthChanged

// After
ant.health_changed.connect((ant, newHealth) => updateHealthBar(newHealth));
ant.setHealth(50); // Automatically emits signal
```

### From Event Emitters
```javascript
// Before (Node.js EventEmitter style)
ant.on('healthChanged', callback);
ant.emit('healthChanged', newHealth);

// After (Signal system)
ant.health_changed.connect(callback);
ant.health_changed.emit(ant, newHealth, oldHealth);
```

### Adding Signals to Existing Classes
```javascript
// Extend existing classes with GameObject
class ExistingAnt extends GameObject {
    constructor() {
        super('Ant');
        // Add signal declarations
        this.declareSignal('health_changed');
        
        // Connect existing methods
        this.setupSignalIntegration();
    }
    
    setupSignalIntegration() {
        // Emit signals from existing methods
        const originalSetHealth = this.setHealth;
        this.setHealth = (newHealth) => {
            const oldHealth = this.health;
            originalSetHealth.call(this, newHealth);
            this.health_changed.emit(this, newHealth, oldHealth);
        };
    }
}
```

## Conclusion

The Signal System provides a powerful, flexible foundation for event-driven architecture in the ant game. It enables:

- **Loose Coupling**: Components can communicate without direct dependencies
- **Performance**: Optimized signal emission and connection management
- **Flexibility**: Support for parameter binding, one-shot connections, and complex event patterns
- **Debugging**: Comprehensive metrics and history tracking
- **Compatibility**: Full Godot Signal API compatibility for familiar usage

The simplified EventBus API makes common operations easy while the full Signal system provides advanced capabilities when needed. Together, they form a complete event system that scales from simple notifications to complex game architectures.

For more examples and advanced usage patterns, see the test files and integration examples in the codebase.