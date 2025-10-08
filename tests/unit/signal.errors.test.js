/**
 * @fileoverview Signal Error Handling and Edge Cases Test Suite
 * Tests error conditions, edge cases, signal system robustness,
 * memory management, and error recovery patterns from Godot Signal system.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

// Test utilities
const testHelpers = require('../utilities/testHelpers.js');
const { TestAssertions } = testHelpers;

// Enhanced Signal class with comprehensive error handling
class Signal {
    constructor(object = null, signalName = '', parameterNames = []) {
        this.object = object;
        this.signalName = signalName;
        this.parameterNames = parameterNames;
        this.connections = new Set();
        this.errorCount = 0;
        this.lastError = null;
        this.maxConnections = 1000; // Prevent memory issues
        this.isDestroyed = false;
    }
    
    connect(callable, flags = 0) {
        if (this.isDestroyed) {
            this.lastError = new Error('Cannot connect to destroyed signal');
            return 2; // ERR_UNAVAILABLE
        }
        
        if (this.connections.size >= this.maxConnections) {
            this.lastError = new Error('Maximum connection limit reached');
            return 3; // ERR_OUT_OF_MEMORY equivalent
        }
        
        if (!callable) {
            this.lastError = new Error('Callable cannot be null');
            return 1; // ERR_INVALID_PARAMETER
        }
        
        const existingConnection = Array.from(this.connections)
            .find(conn => this._callablesEqual(conn.callable, callable));
            
        if (existingConnection && !(flags & 4)) { // CONNECT_REFERENCE_COUNTED
            this.lastError = new Error('Connection already exists');
            return 1; // ERR_INVALID_PARAMETER
        }
        
        try {
            this.connections.add({ 
                callable, 
                flags, 
                connectedAt: Date.now(),
                id: Math.random().toString(36).substr(2, 9)
            });
            return 0; // OK
        } catch (error) {
            this.lastError = error;
            this.errorCount++;
            return 3; // ERR_OUT_OF_MEMORY
        }
    }
    
    disconnect(callable) {
        if (this.isDestroyed) {
            this.lastError = new Error('Cannot disconnect from destroyed signal');
            return;
        }
        
        const connection = Array.from(this.connections)
            .find(conn => this._callablesEqual(conn.callable, callable));
            
        if (connection) {
            this.connections.delete(connection);
        } else {
            this.lastError = new Error('Connection not found');
        }
    }
    
    emit(...args) {
        if (this.isDestroyed) {
            this.lastError = new Error('Cannot emit from destroyed signal');
            return;
        }
        
        const connectionsSnapshot = Array.from(this.connections);
        const connectionsToRemove = [];
        let successfulEmissions = 0;
        let failedEmissions = 0;
        
        connectionsSnapshot.forEach(conn => {
            const CONNECT_ONESHOT = 2;
            
            try {
                this._executeCallback(conn.callable, args);
                successfulEmissions++;
                
                if (conn.flags & CONNECT_ONESHOT) {
                    connectionsToRemove.push(conn);
                }
            } catch (error) {
                failedEmissions++;
                this.errorCount++;
                this.lastError = error;
                console.warn(`Signal emission error in ${this.signalName}: ${error.message}`);
            }
        });
        
        // Clean up one-shot connections
        connectionsToRemove.forEach(conn => {
            if (this.connections.has(conn)) {
                this.connections.delete(conn);
            }
        });
        
        return { successfulEmissions, failedEmissions };
    }
    
    _executeCallback(callable, args) {
        if (typeof callable === 'function') {
            callable(...args);
        } else if (callable && typeof callable.call === 'function') {
            callable.call(...args);
        } else if (callable && callable.target && callable.method) {
            // Handle object method references
            const target = callable.target;
            const method = callable.method;
            if (target && typeof target[method] === 'function') {
                target[method](...args);
            } else {
                throw new Error(`Method ${method} not found on target object`);
            }
        } else {
            throw new Error('Invalid callable type');
        }
    }
    
    _callablesEqual(callable1, callable2) {
        if (callable1 === callable2) return true;
        
        // Handle object method references
        if (callable1 && callable2 && 
            callable1.target === callable2.target && 
            callable1.method === callable2.method) {
            return true;
        }
        
        return false;
    }
    
    destroy() {
        this.isDestroyed = true;
        this.connections.clear();
        this.object = null;
    }
    
    // Diagnostic methods
    getConnectionCount() {
        return this.connections.size;
    }
    
    getErrorCount() {
        return this.errorCount;
    }
    
    getLastError() {
        return this.lastError;
    }
    
    hasErrors() {
        return this.errorCount > 0;
    }
    
    clearErrors() {
        this.errorCount = 0;
        this.lastError = null;
    }
    
    // Standard Godot API methods
    getConnections() {
        if (this.isDestroyed) return [];
        
        return Array.from(this.connections).map(conn => ({
            signal: this,
            callable: conn.callable,
            flags: conn.flags,
            id: conn.id
        }));
    }
    
    hasConnections() {
        return !this.isDestroyed && this.connections.size > 0;
    }
    
    isConnected(callable) {
        if (this.isDestroyed) return false;
        return Array.from(this.connections).some(conn => this._callablesEqual(conn.callable, callable));
    }
    
    getName() {
        return this.signalName;
    }
    
    getObject() {
        return this.object;
    }
    
    isNull() {
        return !this.object && !this.signalName;
    }
}

// Test object with potential error conditions
class ProblematicObject {
    constructor(name) {
        this.name = name;
        this.destroyed = false;
        this.methodCallCount = 0;
        this.shouldThrowError = false;
    }
    
    workingMethod(data) {
        this.methodCallCount++;
        this.lastData = data;
    }
    
    throwingMethod(data) {
        this.methodCallCount++;
        if (this.shouldThrowError) {
            throw new Error(`Method error in ${this.name}: ${data}`);
        }
        this.lastData = data;
    }
    
    slowMethod(data) {
        this.methodCallCount++;
        // Simulate slow operation
        const start = Date.now();
        while (Date.now() - start < 10) { /* busy wait */ }
        this.lastData = data;
    }
    
    destroy() {
        this.destroyed = true;
        this.workingMethod = null;
        this.throwingMethod = null;
        this.slowMethod = null;
    }
}

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
        console.log('🧪 Running Signal Error Handling and Edge Cases Test Suite...\n');
        
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

// Connection Error Tests
testSuite.test('Connection errors - Null callable handling', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'test_signal');
    
    const result = signal.connect(null);
    testSuite.assertEqual(result, 1, 'Connecting null callable should return error code');
    testSuite.assertTrue(signal.hasErrors(), 'Signal should track error state');
    testSuite.assertTrue(signal.getLastError().message.includes('null'), 'Error message should mention null');
});

testSuite.test('Connection errors - Destroyed signal connection attempt', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'test_signal');
    const callback = () => {};
    
    signal.destroy();
    const result = signal.connect(callback);
    
    testSuite.assertEqual(result, 2, 'Connecting to destroyed signal should return unavailable error');
    testSuite.assertTrue(signal.hasErrors(), 'Destroyed signal should track error');
    testSuite.assertFalse(signal.hasConnections(), 'Destroyed signal should report no connections');
});

testSuite.test('Connection errors - Maximum connection limit', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'test_signal');
    signal.maxConnections = 3; // Set low limit for testing
    
    const callback1 = () => {};
    const callback2 = () => {};
    const callback3 = () => {};
    const callback4 = () => {};
    
    testSuite.assertEqual(signal.connect(callback1), 0, 'First connection should succeed');
    testSuite.assertEqual(signal.connect(callback2), 0, 'Second connection should succeed');
    testSuite.assertEqual(signal.connect(callback3), 0, 'Third connection should succeed');
    testSuite.assertEqual(signal.connect(callback4), 3, 'Fourth connection should fail with memory error');
    
    testSuite.assertEqual(signal.getConnectionCount(), 3, 'Connection count should be at limit');
});

testSuite.test('Connection errors - Duplicate connection handling', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'test_signal');
    const callback = () => {};
    
    const firstResult = signal.connect(callback);
    const secondResult = signal.connect(callback);
    
    testSuite.assertEqual(firstResult, 0, 'First connection should succeed');
    testSuite.assertEqual(secondResult, 1, 'Duplicate connection should fail');
    testSuite.assertEqual(signal.getConnectionCount(), 1, 'Should maintain single connection');
});

// Emission Error Tests
testSuite.test('Emission errors - Callback exception handling', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'error_prone_signal');
    const problematicObject = new ProblematicObject('ProblematicTarget');
    
    let goodCallbackExecuted = false;
    const goodCallback = () => { goodCallbackExecuted = true; };
    const badCallback = () => { throw new Error('Callback intentionally failed'); };
    
    signal.connect(goodCallback);
    signal.connect(badCallback);
    
    const result = signal.emit('test_data');
    
    testSuite.assertEqual(result.successfulEmissions, 1, 'Good callback should execute successfully');
    testSuite.assertEqual(result.failedEmissions, 1, 'Bad callback should fail');
    testSuite.assertTrue(goodCallbackExecuted, 'Good callback should still execute despite other failures');
    testSuite.assertTrue(signal.hasErrors(), 'Signal should track emission errors');
});

testSuite.test('Emission errors - Destroyed signal emission attempt', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'test_signal');
    let callbackExecuted = false;
    
    signal.connect(() => { callbackExecuted = true; });
    signal.destroy();
    
    const result = signal.emit('test_data');
    
    testSuite.assertFalse(callbackExecuted, 'Callbacks should not execute on destroyed signal');
    testSuite.assertTrue(signal.hasErrors(), 'Destroyed signal should track emission error');
});

testSuite.test('Emission errors - Invalid callable execution', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'test_signal');
    const invalidCallable = { target: {}, method: 'nonExistentMethod' };
    
    signal.connect(invalidCallable);
    
    const result = signal.emit('test_data');
    
    testSuite.assertEqual(result.failedEmissions, 1, 'Invalid callable should fail');
    testSuite.assertTrue(signal.hasErrors(), 'Signal should track callable execution error');
});

// Object Lifecycle Error Tests
testSuite.test('Object lifecycle - Signal behavior after object destruction', () => {
    const problematicObject = new ProblematicObject('LifecycleTest');
    const signal = new Signal(problematicObject, 'lifecycle_signal');
    
    let callbackExecuted = false;
    signal.connect(() => { callbackExecuted = true; });
    
    // Destroy the signal's parent object
    problematicObject.destroy();
    
    // Signal should still work (signal lifetime independent of object)
    signal.emit('test_data');
    testSuite.assertTrue(callbackExecuted, 'Signal should still emit after object destruction');
});

testSuite.test('Object lifecycle - Callback target destruction handling', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'test_signal');
    const targetObject = new ProblematicObject('CallbackTarget');
    
    const methodRef = { target: targetObject, method: 'workingMethod' };
    signal.connect(methodRef);
    
    // First emission should work
    signal.emit('test_data_1');
    testSuite.assertEqual(targetObject.methodCallCount, 1, 'Method should be called before target destruction');
    
    // Destroy target object
    targetObject.destroy();
    
    // Second emission should fail gracefully
    const result = signal.emit('test_data_2');
    testSuite.assertEqual(result.failedEmissions, 1, 'Emission should fail after target destruction');
    testSuite.assertTrue(signal.hasErrors(), 'Signal should track target destruction error');
});

// Memory Management Tests
testSuite.test('Memory management - Connection cleanup on signal destruction', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'memory_test_signal');
    
    // Add many connections
    for (let i = 0; i < 10; i++) {
        signal.connect(() => {});
    }
    
    testSuite.assertEqual(signal.getConnectionCount(), 10, 'Signal should track all connections');
    
    signal.destroy();
    
    testSuite.assertEqual(signal.getConnectionCount(), 0, 'Destroyed signal should have no connections');
    testSuite.assertFalse(signal.hasConnections(), 'Destroyed signal should report no connections');
});

testSuite.test('Memory management - One-shot connection automatic cleanup', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'oneshot_test_signal');
    const CONNECT_ONESHOT = 2;
    
    let executionCount = 0;
    const callback = () => { executionCount++; };
    
    signal.connect(callback, CONNECT_ONESHOT);
    testSuite.assertEqual(signal.getConnectionCount(), 1, 'One-shot connection should be registered');
    
    signal.emit('test_data');
    testSuite.assertEqual(executionCount, 1, 'One-shot callback should execute');
    testSuite.assertEqual(signal.getConnectionCount(), 0, 'One-shot connection should be auto-removed');
});

testSuite.test('Memory management - Error cleanup and recovery', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'error_recovery_signal');
    
    // Generate some errors
    signal.connect(null); // Error 1
    signal.connect(() => { throw new Error('Test error'); }); // Valid connection
    signal.emit('data'); // Error 2 (from throwing callback)
    
    testSuite.assertTrue(signal.hasErrors(), 'Signal should have accumulated errors');
    testSuite.assertTrue(signal.getErrorCount() >= 2, 'Signal should track multiple errors');
    
    // Clear errors and verify recovery
    signal.clearErrors();
    testSuite.assertFalse(signal.hasErrors(), 'Errors should be cleared');
    testSuite.assertEqual(signal.getErrorCount(), 0, 'Error count should be reset');
    testSuite.assertEqual(signal.getLastError(), null, 'Last error should be cleared');
});

// Edge Case Tests
testSuite.test('Edge cases - Empty parameter emission', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'empty_params_signal');
    
    let callbackArgs = null;
    signal.connect((...args) => { callbackArgs = args; });
    
    signal.emit(); // No parameters
    
    testSuite.assertTrue(Array.isArray(callbackArgs), 'Callback should receive args array');
    testSuite.assertEqual(callbackArgs.length, 0, 'Args array should be empty');
});

testSuite.test('Edge cases - Extremely large parameter list', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'large_params_signal');
    
    let receivedParamCount = 0;
    signal.connect((...args) => { receivedParamCount = args.length; });
    
    // Create large parameter list
    const params = Array.from({ length: 100 }, (_, i) => `param_${i}`);
    signal.emit(...params);
    
    testSuite.assertEqual(receivedParamCount, 100, 'Signal should handle large parameter lists');
});

testSuite.test('Edge cases - Recursive signal emission', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'recursive_signal');
    
    let emissionDepth = 0;
    const maxDepth = 5;
    
    const recursiveCallback = (depth) => {
        emissionDepth = Math.max(emissionDepth, depth);
        if (depth < maxDepth) {
            signal.emit(depth + 1); // Recursive emission
        }
    };
    
    signal.connect(recursiveCallback);
    signal.emit(1);
    
    testSuite.assertEqual(emissionDepth, maxDepth, 'Signal should handle recursive emissions');
});

testSuite.test('Edge cases - Concurrent connection modification during emission', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'concurrent_modification_signal');
    
    let callback1Executed = false;
    let callback2Executed = false;
    
    const callback1 = () => {
        callback1Executed = true;
        // Try to add another connection during emission
        signal.connect(() => { callback2Executed = true; });
    };
    
    signal.connect(callback1);
    signal.emit('test_data');
    
    testSuite.assertTrue(callback1Executed, 'First callback should execute');
    
    // Emit again to test if the dynamically added connection works
    signal.emit('test_data_2');
    testSuite.assertTrue(callback2Executed, 'Dynamically added callback should work in subsequent emissions');
});

// Performance Stress Tests
testSuite.test('Performance stress - Rapid emission with error recovery', () => {
    const signal = new Signal(new ProblematicObject('TestObject'), 'stress_test_signal');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Add mix of good and bad callbacks
    signal.connect(() => { successCount++; });
    signal.connect(() => { throw new Error('Stress test error'); });
    signal.connect(() => { successCount++; });
    
    // Rapid emissions
    for (let i = 0; i < 100; i++) {
        const result = signal.emit(`data_${i}`);
        errorCount += result.failedEmissions;
    }
    
    testSuite.assertEqual(successCount, 200, 'Good callbacks should execute consistently'); // 2 good callbacks * 100 emissions
    testSuite.assertEqual(errorCount, 100, 'Error callbacks should fail consistently'); // 1 error callback * 100 emissions
    testSuite.assertTrue(signal.hasErrors(), 'Signal should track stress test errors');
});

// Export for test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testSuite;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    testSuite.run();
}