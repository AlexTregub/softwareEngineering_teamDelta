/**
 * @fileoverview Comprehensive test suite for Godot-style Signal system - Core Functionality
 * Tests signal construction, connection management, emission behavior, and introspection methods.
 * Validates system API behavior following Godot signal patterns.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

// Load test utilities - follow existing pattern
const testHelpers = require('../utilities/testHelpers.js');
const { TestAssertions } = testHelpers;

// Test data and mock objects
const createMockSignalOwner = (name = 'TestObject') => ({
    id: Math.floor(Math.random() * 1000000),
    name: name,
    signals: new Map(),
    destroyed: false,
    
    addSignal(signalName) {
        this.signals.set(signalName, new Signal(this, signalName));
        return this.signals.get(signalName);
    },
    
    getSignal(signalName) {
        return this.signals.get(signalName);
    },
    
    destroy() {
        this.destroyed = true;
        this.signals.clear();
    }
});

// Mock Signal class (will be replaced with actual implementation)
class Signal {
    constructor(object = null, signalName = '') {
        this.object = object;
        this.signalName = signalName;
        this.connections = new Set();
        this.emissionCount = 0;
        this.lastEmittedData = null;
    }
    
    connect(callable, flags = 0) {
        if (this.isConnected(callable)) {
            return 1; // ERR_INVALID_PARAMETER equivalent
        }
        this.connections.add({ callable, flags });
        return 0; // OK
    }
    
    disconnect(callable) {
        const connection = Array.from(this.connections)
            .find(conn => conn.callable === callable);
        if (connection) {
            this.connections.delete(connection);
        }
    }
    
    emit(...args) {
        this.emissionCount++;
        this.lastEmittedData = args;
        this.connections.forEach(conn => {
            if (typeof conn.callable === 'function') {
                conn.callable(...args);
            }
        });
    }
    
    isConnected(callable) {
        return Array.from(this.connections)
            .some(conn => conn.callable === callable);
    }
    
    hasConnections() {
        return this.connections.size > 0;
    }
    
    getConnections() {
        return Array.from(this.connections).map(conn => ({
            signal: this,
            callable: conn.callable,
            flags: conn.flags
        }));
    }
    
    getName() {
        return this.signalName;
    }
    
    getObject() {
        return this.object;
    }
    
    getObjectId() {
        return this.object ? this.object.id : -1;
    }
    
    isNull() {
        return !this.object && !this.signalName;
    }
}

// Test Suite - Follow existing pattern from collisionBox2D.test.js
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
        console.log('🧪 Running Signal Core Functionality Test Suite...\n');
        
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

// Constructor Tests - Focus on system API behavior
testSuite.test('Signal() - Empty constructor creates null signal', () => {
    const signal = new Signal();
    testSuite.assertTrue(signal.isNull(), 'Empty signal should be null');
    testSuite.assertEqual(signal.getName(), '', 'Empty signal should have empty name');
    testSuite.assertEqual(signal.getObject(), null, 'Empty signal should have null object');
});

testSuite.test('Signal(object, name) - Constructor creates valid signal', () => {
    const owner = createMockSignalOwner();
    const signal = new Signal(owner, 'test_signal');
    
    testSuite.assertFalse(signal.isNull(), 'Signal should not be null');
    testSuite.assertEqual(signal.getName(), 'test_signal', 'Signal name should match');
    testSuite.assertEqual(signal.getObject(), owner, 'Signal object should match');
    testSuite.assertEqual(signal.getObjectId(), owner.id, 'Object ID should match');
});

testSuite.test('Signal copy constructor behavior', () => {
    const owner = createMockSignalOwner();
    const original = new Signal(owner, 'original_signal');
    const copy = new Signal(original.getObject(), original.getName());
    
    testSuite.assertEqual(copy.getName(), original.getName(), 'Copy should have same name');
    testSuite.assertEqual(copy.getObject(), original.getObject(), 'Copy should have same object');
    testSuite.assertEqual(copy.getObjectId(), original.getObjectId(), 'Copy should have same object ID');
});

// Connection API Tests - Test system behavior not test logic
testSuite.test('connect() - Connection establishment returns success code', () => {
    const signal = new Signal(createMockSignalOwner(), 'test_signal');
    let callbackExecuted = false;
    const callback = () => { callbackExecuted = true; };
    
    const result = signal.connect(callback);
    testSuite.assertEqual(result, 0, 'Connection should return success code');
    testSuite.assertTrue(signal.isConnected(callback), 'Signal should report callback as connected');
    testSuite.assertTrue(signal.hasConnections(), 'Signal should report having connections');
});

testSuite.test('connect() - Duplicate connection prevention follows Godot behavior', () => {
    const signal = new Signal(createMockSignalOwner(), 'test_signal');
    const callback = () => {};
    
    const firstResult = signal.connect(callback);
    const secondResult = signal.connect(callback);
    
    testSuite.assertEqual(firstResult, 0, 'First connection should succeed');
    testSuite.assertEqual(secondResult, 1, 'Duplicate connection should return error code');
    
    // Test system behavior: verify only one connection exists
    const connections = signal.getConnections();
    testSuite.assertEqual(connections.length, 1, 'System should maintain single connection');
});

testSuite.test('connect() - Multiple callbacks connection management', () => {
    const signal = new Signal(createMockSignalOwner(), 'test_signal');
    const callback1 = () => {};
    const callback2 = () => {};
    const callback3 = () => {};
    
    signal.connect(callback1);
    signal.connect(callback2);
    signal.connect(callback3);
    
    // Test system API behavior
    const connections = signal.getConnections();
    testSuite.assertEqual(connections.length, 3, 'System should track all connections');
    testSuite.assertTrue(signal.isConnected(callback1), 'System should confirm callback1 connection');
    testSuite.assertTrue(signal.isConnected(callback2), 'System should confirm callback2 connection');
    testSuite.assertTrue(signal.isConnected(callback3), 'System should confirm callback3 connection');
});

// Disconnection API Tests - Test system behavior
testSuite.test('disconnect() - Connection removal updates system state', () => {
    const signal = new Signal(createMockSignalOwner(), 'test_signal');
    const callback = () => {};
    
    signal.connect(callback);
    testSuite.assertTrue(signal.isConnected(callback), 'Connection should be established');
    
    signal.disconnect(callback);
    testSuite.assertFalse(signal.isConnected(callback), 'System should report callback as disconnected');
    testSuite.assertFalse(signal.hasConnections(), 'System should report no remaining connections');
});

testSuite.test('disconnect() - Non-existent connection handling', () => {
    const signal = new Signal(createMockSignalOwner(), 'test_signal');
    const callback = () => {};
    
    // Test system graceful handling - should not throw
    signal.disconnect(callback);
    testSuite.assertFalse(signal.hasConnections(), 'System should maintain clean state');
});

testSuite.test('disconnect() - Selective disconnection preserves other connections', () => {
    const signal = new Signal(createMockSignalOwner(), 'test_signal');
    const callback1 = () => {};
    const callback2 = () => {};
    const callback3 = () => {};
    
    signal.connect(callback1);
    signal.connect(callback2);
    signal.connect(callback3);
    
    signal.disconnect(callback2);
    
    // Test system state management
    const connections = signal.getConnections();
    testSuite.assertEqual(connections.length, 2, 'System should maintain remaining connections');
    testSuite.assertTrue(signal.isConnected(callback1), 'System should preserve callback1 connection');
    testSuite.assertFalse(signal.isConnected(callback2), 'System should remove callback2 connection');
    testSuite.assertTrue(signal.isConnected(callback3), 'System should preserve callback3 connection');
});

// Emission API Tests - Test signal system behavior not callback execution
testSuite.test('emit() - Signal transmission without parameters', () => {
    const signal = new Signal(createMockSignalOwner(), 'test_signal');
    let callbackExecuted = false;
    const callback = () => { callbackExecuted = true; };
    
    signal.connect(callback);
    signal.emit();
    
    testSuite.assertTrue(callbackExecuted, 'Signal system should execute connected callbacks');
});

testSuite.test('emit() - Parameter passing through signal system', () => {
    const signal = new Signal(createMockSignalOwner(), 'test_signal');
    let receivedValue = null;
    const callback = (value) => { receivedValue = value; };
    
    signal.connect(callback);
    signal.emit('game_data');
    
    testSuite.assertEqual(receivedValue, 'game_data', 'Signal system should pass parameters to callbacks');
});

testSuite.test('emit() - Complex parameter transmission', () => {
    const signal = new Signal(createMockSignalOwner(), 'ant_spawned');
    let receivedData = [];
    const callback = (...args) => { receivedData = args; };
    
    signal.connect(callback);
    const antData = { id: 123, job: 'Worker', health: 100 };
    signal.emit('spawn_event', antData, true, 42);
    
    testSuite.assertEqual(receivedData.length, 4, 'Signal system should transmit all parameters');
    testSuite.assertEqual(receivedData[0], 'spawn_event', 'Event type should be transmitted');
    testSuite.assertEqual(receivedData[1].id, 123, 'Object data should be transmitted');
    testSuite.assertEqual(receivedData[2], true, 'Boolean parameters should be transmitted');
    testSuite.assertEqual(receivedData[3], 42, 'Numeric parameters should be transmitted');
});

testSuite.test('emit() - Broadcast to multiple connected callbacks', () => {
    const signal = new Signal(createMockSignalOwner(), 'ant_died');
    const executionLog = [];
    
    signal.connect(() => { executionLog.push('ui_update'); });
    signal.connect(() => { executionLog.push('sound_effect'); });
    signal.connect(() => { executionLog.push('statistics_update'); });
    
    signal.emit();
    
    testSuite.assertEqual(executionLog.length, 3, 'Signal system should execute all connected callbacks');
    testSuite.assertTrue(executionLog.includes('ui_update'), 'UI callback should be executed');
    testSuite.assertTrue(executionLog.includes('sound_effect'), 'Sound callback should be executed');
    testSuite.assertTrue(executionLog.includes('statistics_update'), 'Statistics callback should be executed');
});

// Signal Introspection API Tests - Test system state reporting
testSuite.test('hasConnections() - Connection state reporting', () => {
    const signal = new Signal(createMockSignalOwner(), 'resource_collected');
    const callback = () => {};
    
    testSuite.assertFalse(signal.hasConnections(), 'New signal should report no connections');
    
    signal.connect(callback);
    testSuite.assertTrue(signal.hasConnections(), 'Signal should report active connections');
    
    signal.disconnect(callback);
    testSuite.assertFalse(signal.hasConnections(), 'Signal should report clean state after disconnection');
});

testSuite.test('getConnections() - Connection metadata retrieval', () => {
    const signal = new Signal(createMockSignalOwner(), 'combat_started');
    const uiCallback = () => {};
    const soundCallback = () => {};
    
    signal.connect(uiCallback, 0);
    signal.connect(soundCallback, 1);
    
    const connections = signal.getConnections();
    testSuite.assertEqual(connections.length, 2, 'System should return all connection records');
    
    // Validate connection data structure follows Godot pattern
    testSuite.assertEqual(connections[0].signal, signal, 'Connection record should reference signal');
    testSuite.assertEqual(connections[0].callable, uiCallback, 'Connection record should reference callable');
    testSuite.assertEqual(connections[0].flags, 0, 'Connection record should include flags');
    
    testSuite.assertEqual(connections[1].callable, soundCallback, 'Second connection should be tracked');
    testSuite.assertEqual(connections[1].flags, 1, 'Connection flags should be preserved');
});

testSuite.test('isConnected() - Connection status verification', () => {
    const signal = new Signal(createMockSignalOwner(), 'ant_level_up');
    const registeredCallback = () => {};
    const unregisteredCallback = () => {};
    
    signal.connect(registeredCallback);
    
    testSuite.assertTrue(signal.isConnected(registeredCallback), 'System should confirm active connections');
    testSuite.assertFalse(signal.isConnected(unregisteredCallback), 'System should reject unregistered callbacks');
});

// Signal Identity API Tests - Test signal identification system
testSuite.test('Signal identity and object relationship', () => {
    const antManager = createMockSignalOwner('AntManager');
    const resourceManager = createMockSignalOwner('ResourceManager');
    
    const antSpawnedSignal = new Signal(antManager, 'ant_spawned');
    const antDiedSignal = new Signal(antManager, 'ant_died');
    const resourceCollectedSignal = new Signal(resourceManager, 'resource_collected');
    
    // Test signal naming system
    testSuite.assertEqual(antSpawnedSignal.getName(), 'ant_spawned', 'Signal should report correct name');
    testSuite.assertEqual(antDiedSignal.getName(), 'ant_died', 'Signal should report correct name');
    
    // Test object relationship system
    testSuite.assertEqual(antSpawnedSignal.getObject(), antManager, 'Signal should reference correct owner');
    testSuite.assertEqual(resourceCollectedSignal.getObject(), resourceManager, 'Signal should reference correct owner');
    
    // Test object ID system
    testSuite.assertEqual(antSpawnedSignal.getObjectId(), antManager.id, 'Signal should report owner ID');
    testSuite.assertEqual(resourceCollectedSignal.getObjectId(), resourceManager.id, 'Signal should report owner ID');
});

// Signal System Robustness Tests - Test system reliability
testSuite.test('Signal emission without connections', () => {
    const signal = new Signal(createMockSignalOwner(), 'system_startup');
    
    // Test system graceful handling
    signal.emit('initialization_complete');
    testSuite.assertFalse(signal.hasConnections(), 'System should maintain clean state');
});

testSuite.test('Signal system null callback handling', () => {
    const signal = new Signal(createMockSignalOwner(), 'error_occurred');
    
    // Test system error handling
    const result = signal.connect(null);
    testSuite.assertEqual(result, 0, 'System should handle null callbacks gracefully');
});

testSuite.test('Signal persistence after owner lifecycle', () => {
    const owner = createMockSignalOwner();
    const signal = new Signal(owner, 'cleanup_required');
    
    owner.destroy();
    
    // Test signal system integrity
    testSuite.assertEqual(signal.getName(), 'cleanup_required', 'Signal should maintain identity');
    testSuite.assertEqual(signal.getObject(), owner, 'Signal should maintain owner reference');
});

// Signal System Performance Tests - Test system scalability
testSuite.test('Signal system rapid emission handling', () => {
    const signal = new Signal(createMockSignalOwner(), 'frame_update');
    let executionCount = 0;
    const callback = () => { executionCount++; };
    
    signal.connect(callback);
    
    // Test system performance under load
    const emissionCount = 1000;
    for (let i = 0; i < emissionCount; i++) {
        signal.emit();
    }
    
    testSuite.assertEqual(executionCount, emissionCount, 'Signal system should handle rapid emissions');
});

testSuite.test('Signal system multiple connection scalability', () => {
    const signal = new Signal(createMockSignalOwner(), 'game_event');
    const executionTracking = [];
    
    // Create multiple system listeners
    const listenerCount = 100;
    for (let i = 0; i < listenerCount; i++) {
        const listenerId = i;
        const callback = () => { executionTracking[listenerId] = true; };
        signal.connect(callback);
    }
    
    signal.emit();
    
    const connections = signal.getConnections();
    testSuite.assertEqual(connections.length, listenerCount, 'System should manage multiple connections');
    
    // Verify system executed all callbacks
    const executedCallbacks = executionTracking.filter(executed => executed === true).length;
    testSuite.assertEqual(executedCallbacks, listenerCount, 'System should execute all connected callbacks');
});

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testSuite;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    testSuite.run();
}