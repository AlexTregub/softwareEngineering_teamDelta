/**
 * @fileoverview Signal Performance and Scalability Test Suite
 * Tests signal system performance under load, memory efficiency,
 * large-scale operations, and optimization patterns from Godot Signal system.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

// Test utilities
const testHelpers = require('../utilities/testHelpers.js');
const { TestAssertions } = testHelpers;

// Performance-optimized Signal implementation
class OptimizedSignal {
    constructor(object = null, signalName = '') {
        this.object = object;
        this.signalName = signalName;
        this.connections = new Map(); // Use Map for better performance
        this.connectionCounter = 0;
        this.emissionCount = 0;
        this.totalExecutionTime = 0;
        this.averageExecutionTime = 0;
        this.peakConnectionCount = 0;
        this.memoryFootprint = 0;
    }
    
    connect(callable, flags = 0) {
        const connectionId = ++this.connectionCounter;
        const connection = {
            id: connectionId,
            callable,
            flags,
            connectedAt: Date.now(),
            executionCount: 0,
            totalExecutionTime: 0
        };
        
        this.connections.set(connectionId, connection);
        this.peakConnectionCount = Math.max(this.peakConnectionCount, this.connections.size);
        this._updateMemoryFootprint();
        
        return 0; // OK
    }
    
    disconnect(callable) {
        for (const [id, connection] of this.connections) {
            if (connection.callable === callable) {
                this.connections.delete(id);
                this._updateMemoryFootprint();
                break;
            }
        }
    }
    
    emit(...args) {
        const emissionStartTime = Date.now();
        const connectionsSnapshot = Array.from(this.connections.values());
        const connectionsToRemove = [];
        
        let totalCallbackTime = 0;
        
        connectionsSnapshot.forEach(connection => {
            const callbackStartTime = Date.now();
            
            try {
                this._executeCallback(connection.callable, args);
                
                const callbackExecutionTime = Date.now() - callbackStartTime;
                connection.executionCount++;
                connection.totalExecutionTime += callbackExecutionTime;
                totalCallbackTime += callbackExecutionTime;
                
                const CONNECT_ONESHOT = 2;
                if (connection.flags & CONNECT_ONESHOT) {
                    connectionsToRemove.push(connection.id);
                }
            } catch (error) {
                console.warn(`Callback execution error: ${error.message}`);
            }
        });
        
        // Clean up one-shot connections
        connectionsToRemove.forEach(id => {
            this.connections.delete(id);
        });
        
        const totalEmissionTime = Date.now() - emissionStartTime;
        this.emissionCount++;
        this.totalExecutionTime += totalEmissionTime;
        this.averageExecutionTime = this.totalExecutionTime / this.emissionCount;
        
        this._updateMemoryFootprint();
        
        return {
            emissionTime: totalEmissionTime,
            callbackTime: totalCallbackTime,
            connectionsExecuted: connectionsSnapshot.length,
            connectionsRemoved: connectionsToRemove.length
        };
    }
    
    _executeCallback(callable, args) {
        if (typeof callable === 'function') {
            callable(...args);
        }
    }
    
    _updateMemoryFootprint() {
        // Rough memory footprint calculation
        let footprint = 0;
        footprint += this.signalName.length * 2; // String memory
        footprint += this.connections.size * 100; // Rough connection object size
        this.memoryFootprint = footprint;
    }
    
    // Performance metrics
    getPerformanceMetrics() {
        return {
            emissionCount: this.emissionCount,
            totalExecutionTime: this.totalExecutionTime,
            averageExecutionTime: this.averageExecutionTime,
            currentConnectionCount: this.connections.size,
            peakConnectionCount: this.peakConnectionCount,
            memoryFootprint: this.memoryFootprint,
            connectionsPerSecond: this.emissionCount > 0 ? (this.connections.size * this.emissionCount * 1000) / this.totalExecutionTime : 0
        };
    }
    
    getConnectionMetrics() {
        const metrics = [];
        for (const connection of this.connections.values()) {
            metrics.push({
                id: connection.id,
                executionCount: connection.executionCount,
                totalExecutionTime: connection.totalExecutionTime,
                averageExecutionTime: connection.executionCount > 0 ? connection.totalExecutionTime / connection.executionCount : 0,
                age: Date.now() - connection.connectedAt
            });
        }
        return metrics;
    }
    
    // Standard API
    hasConnections() {
        return this.connections.size > 0;
    }
    
    getConnections() {
        return Array.from(this.connections.values()).map(conn => ({
            signal: this,
            callable: conn.callable,
            flags: conn.flags
        }));
    }
    
    isConnected(callable) {
        for (const connection of this.connections.values()) {
            if (connection.callable === callable) {
                return true;
            }
        }
        return false;
    }
    
    getName() {
        return this.signalName;
    }
    
    getObject() {
        return this.object;
    }
}

// Performance test utilities
class PerformanceTestHarness {
    static measureExecutionTime(fn) {
        const start = Date.now();
        const result = fn();
        const end = Date.now();
        return { result, executionTime: end - start };
    }
    
    static measureMemoryUsage(fn) {
        // Basic memory tracking
        const before = process.memoryUsage ? process.memoryUsage() : { heapUsed: 0 };
        const result = fn();
        const after = process.memoryUsage ? process.memoryUsage() : { heapUsed: 0 };
        
        return {
            result,
            memoryDelta: after.heapUsed - before.heapUsed
        };
    }
    
    static createLargeDataSet(size) {
        return Array.from({ length: size }, (_, i) => ({
            id: i,
            data: `test_data_${i}`,
            timestamp: Date.now(),
            properties: {
                x: Math.random() * 1000,
                y: Math.random() * 1000,
                active: Math.random() > 0.5
            }
        }));
    }
    
    static createBenchmarkCallbacks(count) {
        return Array.from({ length: count }, (_, i) => {
            return function benchmarkCallback(data) {
                // Simulate realistic callback work
                const start = Date.now();
                let result = 0;
                
                // Simple computation to simulate work
                for (let j = 0; j < 10; j++) {
                    result += Math.sqrt(i * j + 1);
                }
                
                // Simulate some object manipulation
                if (data && typeof data === 'object') {
                    data.processed = true;
                    data.processedAt = Date.now();
                    data.computationResult = result;
                }
                
                return result;
            };
        });
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
    
    assertLessThan(actual, threshold, message = '') {
        if (actual >= threshold) {
            throw new Error(`Expected ${actual} to be less than ${threshold}. ${message}`);
        }
    },
    
    assertPerformanceThreshold(actualTime, expectedMaxTime, operation) {
        if (actualTime > expectedMaxTime) {
            throw new Error(`${operation} took ${actualTime}ms, expected < ${expectedMaxTime}ms`);
        }
    },
    
    run() {
        console.log('🧪 Running Signal Performance and Scalability Test Suite...\n');
        
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

// Connection Performance Tests
testSuite.test('Connection performance - Large number of connections', () => {
    const signal = new OptimizedSignal({}, 'performance_test_signal');
    const callbacks = PerformanceTestHarness.createBenchmarkCallbacks(1000);
    
    const connectionTest = PerformanceTestHarness.measureExecutionTime(() => {
        callbacks.forEach(callback => signal.connect(callback));
        return signal.hasConnections();
    });
    
    testSuite.assertTrue(connectionTest.result, 'Signal should report having connections');
    testSuite.assertPerformanceThreshold(connectionTest.executionTime, 100, 'Connecting 1000 callbacks');
    
    const metrics = signal.getPerformanceMetrics();
    testSuite.assertEqual(metrics.currentConnectionCount, 1000, 'Signal should track all connections');
    testSuite.assertEqual(metrics.peakConnectionCount, 1000, 'Peak connection count should be tracked');
});

testSuite.test('Connection performance - Rapid connection and disconnection', () => {
    const signal = new OptimizedSignal({}, 'rapid_connection_test');
    const callbacks = PerformanceTestHarness.createBenchmarkCallbacks(500);
    
    const rapidOperationTest = PerformanceTestHarness.measureExecutionTime(() => {
        // Rapid connect
        callbacks.forEach(callback => signal.connect(callback));
        
        // Rapid disconnect (every other callback)
        callbacks.forEach((callback, index) => {
            if (index % 2 === 0) {
                signal.disconnect(callback);
            }
        });
        
        return signal.getConnections().length;
    });
    
    testSuite.assertEqual(rapidOperationTest.result, 250, 'Half the connections should remain');
    testSuite.assertPerformanceThreshold(rapidOperationTest.executionTime, 50, 'Rapid connection/disconnection operations');
});

// Emission Performance Tests
testSuite.test('Emission performance - Single emission to many connections', () => {
    const signal = new OptimizedSignal({}, 'emission_performance_test');
    const callbacks = PerformanceTestHarness.createBenchmarkCallbacks(1000);
    
    // Setup connections
    callbacks.forEach(callback => signal.connect(callback));
    
    const testData = { id: 123, type: 'performance_test', timestamp: Date.now() };
    
    const emissionTest = PerformanceTestHarness.measureExecutionTime(() => {
        return signal.emit(testData);
    });
    
    const emissionResult = emissionTest.result;
    testSuite.assertEqual(emissionResult.connectionsExecuted, 1000, 'All connections should be executed');
    testSuite.assertPerformanceThreshold(emissionTest.executionTime, 200, 'Single emission to 1000 connections');
    
    const metrics = signal.getPerformanceMetrics();
    testSuite.assertEqual(metrics.emissionCount, 1, 'Emission count should be tracked');
    testSuite.assertTrue(metrics.averageExecutionTime > 0, 'Average execution time should be tracked');
});

testSuite.test('Emission performance - Rapid successive emissions', () => {
    const signal = new OptimizedSignal({}, 'rapid_emission_test');
    let totalCallbackExecutions = 0;
    
    // Setup moderate number of connections
    for (let i = 0; i < 100; i++) {
        signal.connect(() => { totalCallbackExecutions++; });
    }
    
    const rapidEmissionTest = PerformanceTestHarness.measureExecutionTime(() => {
        for (let i = 0; i < 100; i++) {
            signal.emit(`emission_${i}`);
        }
        return totalCallbackExecutions;
    });
    
    testSuite.assertEqual(rapidEmissionTest.result, 10000, 'All callback executions should complete'); // 100 callbacks * 100 emissions
    testSuite.assertPerformanceThreshold(rapidEmissionTest.executionTime, 500, 'Rapid successive emissions');
    
    const metrics = signal.getPerformanceMetrics();
    testSuite.assertEqual(metrics.emissionCount, 100, 'All emissions should be tracked');
});

// Memory Performance Tests
testSuite.test('Memory performance - Connection memory efficiency', () => {
    const signal = new OptimizedSignal({}, 'memory_efficiency_test');
    
    const memoryTest = PerformanceTestHarness.measureMemoryUsage(() => {
        const callbacks = PerformanceTestHarness.createBenchmarkCallbacks(10000);
        callbacks.forEach(callback => signal.connect(callback));
        return signal.getPerformanceMetrics();
    });
    
    const metrics = memoryTest.result;
    testSuite.assertEqual(metrics.currentConnectionCount, 10000, 'All connections should be established');
    testSuite.assertTrue(metrics.memoryFootprint > 0, 'Memory footprint should be tracked');
    
    // Memory usage should be reasonable (less than 50MB for 10k connections)
    const maxExpectedMemory = 50 * 1024 * 1024; // 50MB
    testSuite.assertLessThan(Math.abs(memoryTest.memoryDelta), maxExpectedMemory, 'Memory usage should be reasonable');
});

testSuite.test('Memory performance - One-shot connection cleanup efficiency', () => {
    const signal = new OptimizedSignal({}, 'oneshot_cleanup_test');
    const CONNECT_ONESHOT = 2;
    
    // Add many one-shot connections
    const initialConnectionSetup = PerformanceTestHarness.measureExecutionTime(() => {
        for (let i = 0; i < 5000; i++) {
            signal.connect(() => {}, CONNECT_ONESHOT);
        }
        return signal.getPerformanceMetrics();
    });
    
    testSuite.assertEqual(initialConnectionSetup.result.currentConnectionCount, 5000, 'All one-shot connections should be established');
    
    // Single emission should clean up all connections
    const cleanupTest = PerformanceTestHarness.measureExecutionTime(() => {
        const emissionResult = signal.emit('cleanup_test');
        return signal.getPerformanceMetrics();
    });
    
    testSuite.assertEqual(cleanupTest.result.currentConnectionCount, 0, 'All one-shot connections should be cleaned up');
    testSuite.assertPerformanceThreshold(cleanupTest.executionTime, 100, 'One-shot connection cleanup');
});

// Scalability Tests
testSuite.test('Scalability - Large-scale signal system', () => {
    const signalCount = 100;
    const connectionsPerSignal = 100;
    const signals = [];
    
    const setupTest = PerformanceTestHarness.measureExecutionTime(() => {
        // Create multiple signals with many connections each
        for (let i = 0; i < signalCount; i++) {
            const signal = new OptimizedSignal({}, `signal_${i}`);
            
            for (let j = 0; j < connectionsPerSignal; j++) {
                signal.connect(() => {});
            }
            
            signals.push(signal);
        }
        
        return signals.length;
    });
    
    testSuite.assertEqual(setupTest.result, signalCount, 'All signals should be created');
    testSuite.assertPerformanceThreshold(setupTest.executionTime, 1000, 'Large-scale signal system setup');
    
    // Test broadcasting to all signals
    const broadcastTest = PerformanceTestHarness.measureExecutionTime(() => {
        let totalExecutions = 0;
        signals.forEach(signal => {
            const result = signal.emit('broadcast_test');
            totalExecutions += result.connectionsExecuted;
        });
        return totalExecutions;
    });
    
    testSuite.assertEqual(broadcastTest.result, signalCount * connectionsPerSignal, 'All connections should execute');
    testSuite.assertPerformanceThreshold(broadcastTest.executionTime, 2000, 'Large-scale broadcast');
});

testSuite.test('Scalability - High-frequency game loop simulation', () => {
    const gameSignals = {
        frameUpdate: new OptimizedSignal({}, 'frame_update'),
        playerMove: new OptimizedSignal({}, 'player_move'),
        enemyAI: new OptimizedSignal({}, 'enemy_ai'),
        collisionCheck: new OptimizedSignal({}, 'collision_check'),
        uiUpdate: new OptimizedSignal({}, 'ui_update')
    };
    
    // Setup game systems as signal connections
    Object.values(gameSignals).forEach(signal => {
        // Each system has multiple subscribers
        for (let i = 0; i < 20; i++) {
            signal.connect(() => {
                // Simulate light game system work
                Math.random();
            });
        }
    });
    
    const gameLoopTest = PerformanceTestHarness.measureExecutionTime(() => {
        // Simulate 60 FPS for 1 second (60 frames)
        for (let frame = 0; frame < 60; frame++) {
            gameSignals.frameUpdate.emit(frame);
            
            // Player actions (not every frame)
            if (frame % 3 === 0) {
                gameSignals.playerMove.emit({ x: frame, y: frame * 2 });
            }
            
            // AI updates (less frequent)
            if (frame % 5 === 0) {
                gameSignals.enemyAI.emit({ enemies: 10 });
            }
            
            // Collision checks
            if (frame % 2 === 0) {
                gameSignals.collisionCheck.emit({ objects: 50 });
            }
            
            // UI updates
            gameSignals.uiUpdate.emit({ frame });
        }
        
        return Object.values(gameSignals).reduce((total, signal) => 
            total + signal.getPerformanceMetrics().emissionCount, 0);
    });
    
    testSuite.assertTrue(gameLoopTest.result > 0, 'Game loop should generate signal emissions');
    testSuite.assertPerformanceThreshold(gameLoopTest.executionTime, 500, 'High-frequency game loop simulation');
    
    // Check individual signal performance
    Object.entries(gameSignals).forEach(([name, signal]) => {
        const metrics = signal.getPerformanceMetrics();
        testSuite.assertTrue(metrics.averageExecutionTime >= 0, `${name} should have performance metrics tracked`);
    });
});

// Stress Tests
testSuite.test('Stress test - Extreme load with error recovery', () => {
    const signal = new OptimizedSignal({}, 'stress_test_signal');
    let successfulCallbacks = 0;
    let failedCallbacks = 0;
    
    // Mix of working and failing callbacks
    for (let i = 0; i < 1000; i++) {
        if (i % 10 === 0) {
            // 10% failing callbacks
            signal.connect(() => {
                failedCallbacks++;
                throw new Error('Stress test error');
            });
        } else {
            // 90% working callbacks
            signal.connect(() => {
                successfulCallbacks++;
            });
        }
    }
    
    const stressTest = PerformanceTestHarness.measureExecutionTime(() => {
        // Rapid emissions under stress
        for (let i = 0; i < 50; i++) {
            signal.emit(`stress_data_${i}`);
        }
        return { successfulCallbacks, failedCallbacks };
    });
    
    const expectedSuccessful = 900 * 50; // 900 working callbacks * 50 emissions
    const expectedFailed = 100 * 50; // 100 failing callbacks * 50 emissions
    
    testSuite.assertEqual(stressTest.result.successfulCallbacks, expectedSuccessful, 'Successful callbacks should execute under stress');
    testSuite.assertEqual(stressTest.result.failedCallbacks, expectedFailed, 'Failed callbacks should be handled gracefully');
    testSuite.assertPerformanceThreshold(stressTest.executionTime, 1000, 'Stress test with error recovery');
});

testSuite.test('Performance metrics - Comprehensive tracking', () => {
    const signal = new OptimizedSignal({}, 'metrics_test_signal');
    
    // Add connections with varying execution times
    signal.connect(() => { /* Fast callback */ });
    signal.connect(() => { 
        // Slower callback
        const start = Date.now();
        while (Date.now() - start < 1) { /* Small delay */ }
    });
    signal.connect(() => { /* Fast callback */ });
    
    // Perform multiple emissions
    for (let i = 0; i < 10; i++) {
        signal.emit(`test_${i}`);
    }
    
    const overallMetrics = signal.getPerformanceMetrics();
    const connectionMetrics = signal.getConnectionMetrics();
    
    testSuite.assertEqual(overallMetrics.emissionCount, 10, 'Emission count should be tracked');
    testSuite.assertTrue(overallMetrics.totalExecutionTime > 0, 'Total execution time should be tracked');
    testSuite.assertTrue(overallMetrics.averageExecutionTime > 0, 'Average execution time should be calculated');
    testSuite.assertEqual(overallMetrics.currentConnectionCount, 3, 'Current connection count should be accurate');
    testSuite.assertTrue(overallMetrics.memoryFootprint > 0, 'Memory footprint should be estimated');
    
    testSuite.assertEqual(connectionMetrics.length, 3, 'Individual connection metrics should be available');
    connectionMetrics.forEach(connMetrics => {
        testSuite.assertEqual(connMetrics.executionCount, 10, 'Each connection should track execution count');
        testSuite.assertTrue(connMetrics.totalExecutionTime >= 0, 'Each connection should track execution time');
        testSuite.assertTrue(connMetrics.age > 0, 'Each connection should track age');
    });
});

// Export for test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testSuite;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    testSuite.run();
}