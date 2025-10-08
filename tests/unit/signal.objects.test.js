/**
 * @fileoverview Signal Object Integration and Custom Signals Test Suite
 * Tests signal integration with game objects, custom signal creation,
 * signal declaration patterns, and object lifecycle management from Godot system.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

// Test utilities
const testHelpers = require('../utilities/testHelpers.js');
const { TestAssertions } = testHelpers;

// Mock Godot-style GameObject with signal declaration
class GameObject {
    constructor(name = 'GameObject') {
        this.name = name;
        this.id = Math.floor(Math.random() * 100000);
        this.signals = new Map();
        this.destroyed = false;
        this.properties = {};
        
        // Declare signals following Godot pattern
        this.declareSignal('spawned', ['position', 'properties']);
        this.declareSignal('died', ['cause']);
        this.declareSignal('property_changed', ['property_name', 'old_value', 'new_value']);
        this.declareSignal('state_entered', ['state_name']);
        this.declareSignal('state_exited', ['state_name']);
    }
    
    declareSignal(signalName, parameterNames = []) {
        const signal = new Signal(this, signalName, parameterNames);
        this.signals.set(signalName, signal);
        
        // Create convenience property for direct access (like Godot)
        Object.defineProperty(this, signalName, {
            get: () => signal,
            enumerable: true
        });
        
        return signal;
    }
    
    hasSignal(signalName) {
        return this.signals.has(signalName);
    }
    
    getSignal(signalName) {
        return this.signals.get(signalName);
    }
    
    emitSignal(signalName, ...args) {
        const signal = this.signals.get(signalName);
        if (signal) {
            signal.emit(...args);
        } else {
            throw new Error(`Signal "${signalName}" not found on ${this.name}`);
        }
    }
    
    setProperty(propertyName, value) {
        const oldValue = this.properties[propertyName];
        this.properties[propertyName] = value;
        this.emitSignal('property_changed', propertyName, oldValue, value);
    }
    
    destroy() {
        this.destroyed = true;
        this.signals.clear(); // Clean up signal connections
    }
}

// Enhanced Signal class with parameter validation
class Signal {
    constructor(object = null, signalName = '', parameterNames = []) {
        this.object = object;
        this.signalName = signalName;
        this.parameterNames = parameterNames;
        this.connections = new Set();
        this.emissionCount = 0;
        this.lastEmission = null;
    }
    
    connect(callable, flags = 0) {
        if (this._isConnected(callable) && !(flags & 4)) { // CONNECT_REFERENCE_COUNTED
            return 1; // ERR_INVALID_PARAMETER
        }
        
        this.connections.add({ 
            callable, 
            flags, 
            connectedAt: Date.now() 
        });
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
        // Validate parameter count if signal declares parameters
        if (this.parameterNames.length > 0 && args.length !== this.parameterNames.length) {
            console.warn(`Signal "${this.signalName}" expects ${this.parameterNames.length} parameters, got ${args.length}`);
        }
        
        this.emissionCount++;
        this.lastEmission = {
            args: args,
            timestamp: Date.now(),
            parameterMap: this._createParameterMap(args)
        };
        
        const connectionsToRemove = [];
        
        this.connections.forEach(conn => {
            const CONNECT_ONESHOT = 2;
            
            try {
                this._executeCallback(conn.callable, args);
                
                if (conn.flags & CONNECT_ONESHOT) {
                    connectionsToRemove.push(conn);
                }
            } catch (error) {
                console.warn(`Signal emission error: ${error.message}`);
            }
        });
        
        connectionsToRemove.forEach(conn => this.connections.delete(conn));
    }
    
    _createParameterMap(args) {
        const paramMap = {};
        this.parameterNames.forEach((paramName, index) => {
            paramMap[paramName] = args[index];
        });
        return paramMap;
    }
    
    _executeCallback(callable, args) {
        if (typeof callable === 'function') {
            callable(...args);
        } else if (callable && typeof callable.call === 'function') {
            callable.call(...args);
        }
    }
    
    _callablesEqual(callable1, callable2) {
        return callable1 === callable2;
    }
    
    _isConnected(callable) {
        return Array.from(this.connections)
            .some(conn => this._callablesEqual(conn.callable, callable));
    }
    
    // Godot Signal API methods
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
    
    hasConnections() {
        return this.connections.size > 0;
    }
    
    isConnected(callable) {
        return this._isConnected(callable);
    }
    
    isNull() {
        return !this.object && !this.signalName;
    }
    
    getParameterNames() {
        return [...this.parameterNames];
    }
}

// Specialized game objects for testing
class Ant extends GameObject {
    constructor(id, job = 'Worker') {
        super(`Ant_${id}`);
        this.antId = id;
        this.job = job;
        this.health = 100;
        this.level = 1;
        this.experience = 0;
        
        // Ant-specific signals
        this.declareSignal('health_changed', ['old_health', 'new_health']);
        this.declareSignal('level_up', ['new_level', 'gained_abilities']);
        this.declareSignal('job_changed', ['old_job', 'new_job']);
        this.declareSignal('task_completed', ['task_type', 'reward']);
        this.declareSignal('combat_entered', ['enemy_id']);
        this.declareSignal('combat_exited', ['result']);
    }
    
    takeDamage(amount) {
        const oldHealth = this.health;
        this.health = Math.max(0, this.health - amount);
        this.emitSignal('health_changed', oldHealth, this.health);
        
        if (this.health === 0) {
            this.emitSignal('died', 'combat');
        }
    }
    
    gainExperience(amount) {
        this.experience += amount;
        const experienceNeeded = this.level * 100;
        
        if (this.experience >= experienceNeeded) {
            const oldLevel = this.level;
            this.level++;
            this.experience -= experienceNeeded;
            
            const abilities = this._getAbilitiesForLevel(this.level);
            this.emitSignal('level_up', this.level, abilities);
        }
    }
    
    changeJob(newJob) {
        const oldJob = this.job;
        this.job = newJob;
        this.emitSignal('job_changed', oldJob, newJob);
    }
    
    _getAbilitiesForLevel(level) {
        const abilities = ['increased_strength', 'improved_efficiency'];
        return abilities.slice(0, Math.floor(level / 2));
    }
}

class ResourceNode extends GameObject {
    constructor(resourceType, amount) {
        super(`${resourceType}Node`);
        this.resourceType = resourceType;
        this.amount = amount;
        this.maxAmount = amount;
        
        // Resource-specific signals
        this.declareSignal('resource_extracted', ['amount', 'extractor_id']);
        this.declareSignal('depleted', []);
        this.declareSignal('regenerated', ['new_amount']);
    }
    
    extractResource(amount, extractorId) {
        const actualAmount = Math.min(amount, this.amount);
        this.amount -= actualAmount;
        
        this.emitSignal('resource_extracted', actualAmount, extractorId);
        
        if (this.amount === 0) {
            this.emitSignal('depleted');
        }
        
        return actualAmount;
    }
    
    regenerate(amount) {
        this.amount = Math.min(this.maxAmount, this.amount + amount);
        this.emitSignal('regenerated', this.amount);
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
        console.log('🧪 Running Signal Object Integration Test Suite...\n');
        
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

// Signal Declaration Tests
testSuite.test('Signal declaration - GameObject signal setup', () => {
    const gameObject = new GameObject('TestObject');
    
    testSuite.assertTrue(gameObject.hasSignal('spawned'), 'GameObject should declare spawned signal');
    testSuite.assertTrue(gameObject.hasSignal('died'), 'GameObject should declare died signal');
    testSuite.assertTrue(gameObject.hasSignal('property_changed'), 'GameObject should declare property_changed signal');
    
    // Test direct signal access (Godot pattern)
    testSuite.assertEqual(gameObject.spawned.getName(), 'spawned', 'Signal should be accessible as property');
    testSuite.assertEqual(gameObject.spawned.getObject(), gameObject, 'Signal should reference correct object');
});

testSuite.test('Signal declaration - Parameter specification', () => {
    const ant = new Ant(1, 'Scout');
    
    const healthSignal = ant.getSignal('health_changed');
    const parameterNames = healthSignal.getParameterNames();
    
    testSuite.assertEqual(parameterNames.length, 2, 'Health signal should declare 2 parameters');
    testSuite.assertEqual(parameterNames[0], 'old_health', 'First parameter should be old_health');
    testSuite.assertEqual(parameterNames[1], 'new_health', 'Second parameter should be new_health');
});

testSuite.test('Signal declaration - Custom signal addition', () => {
    const gameObject = new GameObject('CustomObject');
    
    const customSignal = gameObject.declareSignal('custom_event', ['event_data', 'timestamp']);
    
    testSuite.assertTrue(gameObject.hasSignal('custom_event'), 'Custom signal should be registered');
    testSuite.assertEqual(gameObject.custom_event, customSignal, 'Custom signal should be accessible as property');
    testSuite.assertEqual(customSignal.getParameterNames().length, 2, 'Custom signal should have declared parameters');
});

// Object Integration Tests
testSuite.test('Object integration - Ant health system signals', () => {
    const ant = new Ant(123, 'Warrior');
    let healthChangeData = null;
    let deathData = null;
    
    ant.health_changed.connect((oldHealth, newHealth) => {
        healthChangeData = { oldHealth, newHealth };
    });
    
    ant.died.connect((cause) => {
        deathData = { cause };
    });
    
    // Test damage that doesn't kill
    ant.takeDamage(30);
    testSuite.assertEqual(healthChangeData.oldHealth, 100, 'Old health should be tracked');
    testSuite.assertEqual(healthChangeData.newHealth, 70, 'New health should be tracked');
    testSuite.assertEqual(deathData, null, 'Death signal should not fire for non-lethal damage');
    
    // Test lethal damage
    ant.takeDamage(80);
    testSuite.assertEqual(deathData.cause, 'combat', 'Death signal should fire with correct cause');
});

testSuite.test('Object integration - Ant experience and leveling', () => {
    const ant = new Ant(456, 'Builder');
    let levelUpData = null;
    
    ant.level_up.connect((newLevel, abilities) => {
        levelUpData = { newLevel, abilities };
    });
    
    // Give enough experience to level up
    ant.gainExperience(150);
    
    testSuite.assertEqual(levelUpData.newLevel, 2, 'Ant should level up');
    testSuite.assertTrue(Array.isArray(levelUpData.abilities), 'Abilities should be provided');
    testSuite.assertTrue(levelUpData.abilities.length > 0, 'Should gain abilities on level up');
});

testSuite.test('Object integration - Resource node extraction system', () => {
    const woodNode = new ResourceNode('Wood', 100);
    let extractionData = null;
    let depletionTriggered = false;
    
    woodNode.resource_extracted.connect((amount, extractorId) => {
        extractionData = { amount, extractorId };
    });
    
    woodNode.depleted.connect(() => {
        depletionTriggered = true;
    });
    
    // Extract some resources
    const extracted = woodNode.extractResource(25, 'Ant_789');
    
    testSuite.assertEqual(extracted, 25, 'Should extract requested amount');
    testSuite.assertEqual(extractionData.amount, 25, 'Extraction signal should report amount');
    testSuite.assertEqual(extractionData.extractorId, 'Ant_789', 'Extraction signal should report extractor');
    testSuite.assertFalse(depletionTriggered, 'Depletion should not trigger for partial extraction');
    
    // Extract remaining resources
    woodNode.extractResource(100, 'Ant_790'); // Try to extract more than available
    testSuite.assertTrue(depletionTriggered, 'Depletion signal should fire when resource exhausted');
});

// Signal System Integration Tests
testSuite.test('Signal system - Cross-object communication', () => {
    const ant = new Ant(101, 'Gatherer');
    const resourceNode = new ResourceNode('Stone', 50);
    const gameManager = new GameObject('GameManager');
    
    let resourceCollectedData = null;
    
    // GameManager listens to resource extraction
    resourceNode.resource_extracted.connect((amount, extractorId) => {
        resourceCollectedData = { amount, extractorId, resourceType: resourceNode.resourceType };
        gameManager.emitSignal('property_changed', 'total_stone', 0, amount);
    });
    
    // Simulate ant collecting resource
    resourceNode.extractResource(20, ant.name);
    
    testSuite.assertEqual(resourceCollectedData.amount, 20, 'Resource collection should be tracked');
    testSuite.assertEqual(resourceCollectedData.extractorId, ant.name, 'Extractor should be identified');
    testSuite.assertEqual(resourceCollectedData.resourceType, 'Stone', 'Resource type should be tracked');
});

testSuite.test('Signal system - Chain reaction events', () => {
    const ant = new Ant(202, 'Fighter');
    const eventLog = [];
    
    // Setup chain of events
    ant.health_changed.connect((oldHealth, newHealth) => {
        eventLog.push(`health_changed: ${oldHealth} -> ${newHealth}`);
        
        if (newHealth < 25) {
            ant.emitSignal('state_entered', 'low_health');
        }
    });
    
    ant.state_entered.connect((stateName) => {
        eventLog.push(`state_entered: ${stateName}`);
        
        if (stateName === 'low_health') {
            ant.emitSignal('state_exited', 'combat');
        }
    });
    
    ant.state_exited.connect((stateName) => {
        eventLog.push(`state_exited: ${stateName}`);
    });
    
    // Trigger chain reaction
    ant.takeDamage(80); // Health goes from 100 to 20
    
    testSuite.assertEqual(eventLog.length, 3, 'Chain reaction should trigger multiple events');
    testSuite.assertTrue(eventLog[0].includes('health_changed'), 'First event should be health change');
    testSuite.assertTrue(eventLog[1].includes('state_entered'), 'Second event should be state entry');
    testSuite.assertTrue(eventLog[2].includes('state_exited'), 'Third event should be state exit');
});

// Object Lifecycle Tests
testSuite.test('Object lifecycle - Signal cleanup on destruction', () => {
    const gameObject = new GameObject('TemporaryObject');
    let signalTriggered = false;
    
    gameObject.spawned.connect(() => {
        signalTriggered = true;
    });
    
    // Verify signal works before destruction
    gameObject.emitSignal('spawned');
    testSuite.assertTrue(signalTriggered, 'Signal should work before destruction');
    
    // Destroy object
    gameObject.destroy();
    testSuite.assertTrue(gameObject.destroyed, 'Object should be marked as destroyed');
    testSuite.assertEqual(gameObject.signals.size, 0, 'Signals should be cleaned up');
});

testSuite.test('Object lifecycle - Signal persistence across property changes', () => {
    const gameObject = new GameObject('PersistentObject');
    let propertyChanges = [];
    
    gameObject.property_changed.connect((propName, oldVal, newVal) => {
        propertyChanges.push({ propName, oldVal, newVal });
    });
    
    // Change multiple properties
    gameObject.setProperty('health', 100);
    gameObject.setProperty('level', 1);
    gameObject.setProperty('health', 90);
    
    testSuite.assertEqual(propertyChanges.length, 3, 'All property changes should be tracked');
    testSuite.assertEqual(propertyChanges[0].propName, 'health', 'First change should be health');
    testSuite.assertEqual(propertyChanges[2].newVal, 90, 'Health change should be tracked correctly');
});

// Advanced Signal Features Tests
testSuite.test('Advanced features - Signal parameter validation', () => {
    const ant = new Ant(303, 'Scout');
    let warningLogged = false;
    
    // Capture console warnings
    const originalWarn = console.warn;
    console.warn = (message) => {
        if (message.includes('expects')) {
            warningLogged = true;
        }
    };
    
    // Emit signal with wrong parameter count
    ant.health_changed.emit(100); // Should expect 2 parameters
    
    testSuite.assertTrue(warningLogged, 'System should warn about parameter count mismatch');
    
    // Restore console.warn
    console.warn = originalWarn;
});

testSuite.test('Advanced features - Signal emission history tracking', () => {
    const resourceNode = new ResourceNode('Food', 75);
    
    resourceNode.extractResource(10, 'Ant_404');
    resourceNode.extractResource(15, 'Ant_405');
    
    const extractionSignal = resourceNode.getSignal('resource_extracted');
    testSuite.assertEqual(extractionSignal.emissionCount, 2, 'Signal should track emission count');
    testSuite.assertTrue(extractionSignal.lastEmission !== null, 'Signal should track last emission');
    testSuite.assertEqual(extractionSignal.lastEmission.args[0], 15, 'Last emission data should be preserved');
});

// Export for test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testSuite;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    testSuite.run();
}