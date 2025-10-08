/**
 * @fileoverview Signal Connection Management Test Suite
 * Tests connection flags, one-shot connections, parameter binding (Callable.bind),
 * and advanced connection features from Godot Signal system.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

// Test utilities
const testHelpers = require('../utilities/testHelpers.js');
const { TestAssertions } = testHelpers;

// Mock Signal and Callable classes following Godot patterns
class Callable {
    constructor(target, methodName, boundParams = []) {
        this.target = target;
        this.methodName = methodName;
        this.boundParams = boundParams;
    }
    
    bind(...params) {
        return new Callable(this.target, this.methodName, [...this.boundParams, ...params]);
    }
    
    call(...params) {
        const allParams = [...this.boundParams, ...params];
        if (typeof this.target[this.methodName] === 'function') {
            return this.target[this.methodName](...allParams);
        }
        throw new Error(`Method ${this.methodName} not found on target`);
    }
}

class Signal {
    constructor(object = null, signalName = '') {
        this.object = object;
        this.signalName = signalName;
        this.connections = new Set();
        this.emissionHistory = [];
    }
    
    connect(callable, flags = 0) {
        // Connection flags from Godot
        const CONNECT_DEFERRED = 1;
        const CONNECT_ONESHOT = 2;
        const CONNECT_REFERENCE_COUNTED = 4;
        
        const existingConnection = Array.from(this.connections)
            .find(conn => this._callablesEqual(conn.callable, callable));
            
        if (existingConnection && !(flags & CONNECT_REFERENCE_COUNTED)) {
            return 1; // ERR_INVALID_PARAMETER
        }
        
        this.connections.add({ callable, flags });
        return 0; // OK
    }
    
    disconnect(callable) {
        const connection = Array.from(this.connections)
            .find(conn => this._callablesEqual(conn.callable, callable));
        if (connection) {
            this.connections.delete(connection);
        }
    }
    
    emit(...args) {
        this.emissionHistory.push({ args, timestamp: Date.now() });
        
        const connectionsToRemove = [];
        
        this.connections.forEach(conn => {
            const CONNECT_DEFERRED = 1;
            const CONNECT_ONESHOT = 2;
            
            try {
                if (conn.flags & CONNECT_DEFERRED) {
                    // Simulate deferred execution
                    setTimeout(() => this._executeCallback(conn.callable, args), 0);
                } else {
                    this._executeCallback(conn.callable, args);
                }
                
                if (conn.flags & CONNECT_ONESHOT) {
                    connectionsToRemove.push(conn);
                }
            } catch (error) {
                console.warn(`Signal emission error: ${error.message}`);
            }
        });
        
        // Remove one-shot connections
        connectionsToRemove.forEach(conn => this.connections.delete(conn));
    }
    
    _executeCallback(callable, args) {
        if (typeof callable === 'function') {
            callable(...args);
        } else if (callable instanceof Callable) {
            callable.call(...args);
        }
    }
    
    _callablesEqual(callable1, callable2) {
        if (callable1 === callable2) return true;
        if (callable1 instanceof Callable && callable2 instanceof Callable) {
            return callable1.target === callable2.target && 
                   callable1.methodName === callable2.methodName;
        }
        return false;
    }
    
    getConnections() {
        return Array.from(this.connections).map(conn => ({
            signal: this,
            callable: conn.callable,
            flags: conn.flags
        }));
    }
    
    isConnected(callable) {
        return Array.from(this.connections)
            .some(conn => this._callablesEqual(conn.callable, callable));
    }
    
    hasConnections() {
        return this.connections.size > 0;
    }
    
    getName() {
        return this.signalName;
    }
    
    getObject() {
        return this.object;
    }
}

// Test object factory
const createGameObject = (name) => ({
    name: name,
    id: Math.floor(Math.random() * 100000),
    
    onAntSpawned(antId, position, jobType) {
        this.lastAntData = { antId, position, jobType };
    },
    
    onResourceCollected(resourceType, amount, collector) {
        this.lastResourceData = { resourceType, amount, collector };
    },
    
    onCombatEvent(attacker, defender, damage) {
        this.lastCombatData = { attacker, defender, damage };
    },
    
    updateUI() {
        this.uiUpdateCalled = true;
    },
    
    playSound(soundName) {
        this.lastSoundPlayed = soundName;
    }
});

// Test Suite
const testSuite = {
    tests: [],
    passed: 0,
    failed: 0,
    
    test(name, fn) {
        this.tests.push({ name, fn });
    },
    
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`Expected "${expected}", got "${actual}". ${message}`);
        }
    },
    
    assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    },
    
    assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`Expected false but got true: ${message}`);
        }
    },
    
    run() {
        console.log('🧪 Running Signal Connection Management Test Suite...\n');
        
        for (const test of this.tests) {
            try {
                test.fn();
                console.log(`✅ ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}`);
                console.log(`   ${error.message}`);
                this.failed++;
            }
        }
        
        console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed, ${this.passed + this.failed} total`);
        return { passed: this.passed, failed: this.failed, total: this.passed + this.failed };
    }
};

// Connection Flag Tests
testSuite.test('Connection flags - Normal connection behavior', () => {
    const gameManager = createGameObject('GameManager');
    const signal = new Signal(gameManager, 'ant_spawned');
    
    let callbackExecuted = false;
    const callback = () => { callbackExecuted = true; };
    
    const result = signal.connect(callback, 0); // No flags
    testSuite.assertEqual(result, 0, 'Normal connection should succeed');
    
    signal.emit();
    testSuite.assertTrue(callbackExecuted, 'Normal connection should execute immediately');
});

testSuite.test('Connection flags - One-shot connection (CONNECT_ONESHOT)', () => {
    const antManager = createGameObject('AntManager');
    const signal = new Signal(antManager, 'game_started');
    
    let executionCount = 0;
    const callback = () => { executionCount++; };
    
    const CONNECT_ONESHOT = 2;
    signal.connect(callback, CONNECT_ONESHOT);
    
    // First emission should execute and disconnect
    signal.emit();
    testSuite.assertEqual(executionCount, 1, 'One-shot connection should execute once');
    
    // Second emission should not execute
    signal.emit();
    testSuite.assertEqual(executionCount, 1, 'One-shot connection should auto-disconnect');
    testSuite.assertFalse(signal.isConnected(callback), 'One-shot callback should be disconnected');
});

testSuite.test('Connection flags - Reference counted connections', () => {
    const resourceManager = createGameObject('ResourceManager');
    const signal = new Signal(resourceManager, 'resource_depleted');
    
    const callback = () => {};
    const CONNECT_REFERENCE_COUNTED = 4;
    
    // First connection
    const result1 = signal.connect(callback, CONNECT_REFERENCE_COUNTED);
    testSuite.assertEqual(result1, 0, 'First reference counted connection should succeed');
    
    // Second connection with same callback should succeed with reference counting
    const result2 = signal.connect(callback, CONNECT_REFERENCE_COUNTED);
    testSuite.assertEqual(result2, 0, 'Second reference counted connection should succeed');
    
    const connections = signal.getConnections();
    testSuite.assertEqual(connections.length, 2, 'Reference counted connections should allow duplicates');
});

// Callable.bind() Tests - Parameter Binding
testSuite.test('Callable.bind() - Basic parameter binding', () => {
    const uiManager = createGameObject('UIManager');
    const signal = new Signal(uiManager, 'ant_health_changed');
    
    const callable = new Callable(uiManager, 'onAntSpawned');
    const boundCallable = callable.bind('Worker', { x: 100, y: 200 });
    
    signal.connect(boundCallable);
    signal.emit(123); // Ant ID emitted by signal
    
    // Verify bound parameters were passed first, then emission parameters
    testSuite.assertEqual(uiManager.lastAntData.antId, 123, 'Emission parameter should be first');
    testSuite.assertEqual(uiManager.lastAntData.position.x, 100, 'Bound position should be passed');
    testSuite.assertEqual(uiManager.lastAntData.jobType, 'Worker', 'Bound job type should be passed');
});

testSuite.test('Callable.bind() - Multiple parameter binding', () => {
    const combatSystem = createGameObject('CombatSystem');
    const signal = new Signal(combatSystem, 'damage_dealt');
    
    const callable = new Callable(combatSystem, 'onCombatEvent');
    const boundCallable = callable.bind('PlayerAnt', 'EnemyAnt').bind(25);
    
    signal.connect(boundCallable);
    signal.emit(); // No additional parameters
    
    testSuite.assertEqual(combatSystem.lastCombatData.attacker, 'PlayerAnt', 'First bound parameter should be passed');
    testSuite.assertEqual(combatSystem.lastCombatData.defender, 'EnemyAnt', 'Second bound parameter should be passed');
    testSuite.assertEqual(combatSystem.lastCombatData.damage, 25, 'Third bound parameter should be passed');
});

testSuite.test('Callable.bind() - Emission and bound parameter combination', () => {
    const inventorySystem = createGameObject('InventorySystem');
    const signal = new Signal(inventorySystem, 'item_collected');
    
    const callable = new Callable(inventorySystem, 'onResourceCollected');
    const boundCallable = callable.bind('Wood'); // Bind resource type
    
    signal.connect(boundCallable);
    signal.emit(50, 'Ant_123'); // Amount and collector ID from emission
    
    testSuite.assertEqual(inventorySystem.lastResourceData.resourceType, 'Wood', 'Bound resource type should be first');
    testSuite.assertEqual(inventorySystem.lastResourceData.amount, 50, 'Emission amount should be second');
    testSuite.assertEqual(inventorySystem.lastResourceData.collector, 'Ant_123', 'Emission collector should be third');
});

// Advanced Connection Management Tests
testSuite.test('Connection management - Multiple connections to same signal', () => {
    const gameEvents = createGameObject('GameEvents');
    const signal = new Signal(gameEvents, 'level_completed');
    
    const uiCallback = new Callable(gameEvents, 'updateUI');
    const soundCallback = new Callable(gameEvents, 'playSound').bind('victory_sound');
    
    signal.connect(uiCallback);
    signal.connect(soundCallback);
    
    signal.emit();
    
    testSuite.assertTrue(gameEvents.uiUpdateCalled, 'UI callback should be executed');
    testSuite.assertEqual(gameEvents.lastSoundPlayed, 'victory_sound', 'Sound callback should be executed with bound parameter');
});

testSuite.test('Connection management - Selective disconnection', () => {
    const battleSystem = createGameObject('BattleSystem');
    const signal = new Signal(battleSystem, 'unit_died');
    
    const callback1 = () => { battleSystem.callback1Called = true; };
    const callback2 = () => { battleSystem.callback2Called = true; };
    const callback3 = () => { battleSystem.callback3Called = true; };
    
    signal.connect(callback1);
    signal.connect(callback2);
    signal.connect(callback3);
    
    // Disconnect middle callback
    signal.disconnect(callback2);
    
    signal.emit();
    
    testSuite.assertTrue(battleSystem.callback1Called, 'First callback should execute');
    testSuite.assertTrue(battleSystem.callback3Called, 'Third callback should execute');
    testSuite.assertFalse(battleSystem.callback2Called || false, 'Disconnected callback should not execute');
});

// Signal System Integration Tests
testSuite.test('Signal system - Complex game event handling', () => {
    const antColony = createGameObject('AntColony');
    const antSpawnedSignal = new Signal(antColony, 'ant_spawned');
    const resourceCollectedSignal = new Signal(antColony, 'resource_collected');
    
    // Setup UI updates for both events
    const uiUpdateCallable = new Callable(antColony, 'updateUI');
    antSpawnedSignal.connect(uiUpdateCallable);
    resourceCollectedSignal.connect(uiUpdateCallable);
    
    // Setup specific handlers with bound parameters
    const spawnSoundCallable = new Callable(antColony, 'playSound').bind('ant_spawn');
    const collectSoundCallable = new Callable(antColony, 'playSound').bind('resource_collect');
    
    antSpawnedSignal.connect(spawnSoundCallable);
    resourceCollectedSignal.connect(collectSoundCallable);
    
    // Trigger events
    antSpawnedSignal.emit();
    resourceCollectedSignal.emit();
    
    testSuite.assertTrue(antColony.uiUpdateCalled, 'UI should be updated by both signals');
    // Note: lastSoundPlayed will be the last one called
    testSuite.assertTrue(['ant_spawn', 'resource_collect'].includes(antColony.lastSoundPlayed), 
                        'Appropriate sounds should be played');
});

testSuite.test('Signal system - Connection state consistency', () => {
    const gameState = createGameObject('GameState');
    const signal = new Signal(gameState, 'state_changed');
    
    const callback = () => {};
    const CONNECT_ONESHOT = 2;
    
    // Test connection state before, during, and after one-shot
    signal.connect(callback, CONNECT_ONESHOT);
    testSuite.assertTrue(signal.hasConnections(), 'Signal should report connections before emission');
    testSuite.assertTrue(signal.isConnected(callback), 'Callback should be reported as connected');
    
    signal.emit();
    testSuite.assertFalse(signal.hasConnections(), 'Signal should report no connections after one-shot emission');
    testSuite.assertFalse(signal.isConnected(callback), 'Callback should be reported as disconnected');
});

// Export for test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testSuite;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    testSuite.run();
}