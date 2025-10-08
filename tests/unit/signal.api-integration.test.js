/**
 * @fileoverview API Integration Test Suite
 * Tests the integration between Signal system, EventBus, and game components
 * to validate the simplified ant API and event-driven architecture.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

// Load test utilities and components
const testHelpers = require('../utilities/testHelpers.js');
const { TestAssertions } = testHelpers;

// Mock the dependencies for testing
class MockSignal {
    constructor(object, signalName) {
        this.object = object;
        this.signalName = signalName;
        this.connections = new Set();
        this.emissionHistory = [];
    }
    
    connect(callable, flags = 0) {
        const connection = { callable, flags };
        this.connections.add(connection);
        return 0;
    }
    
    disconnect(callable) {
        for (const connection of this.connections) {
            if (connection.callable === callable) {
                this.connections.delete(connection);
                return true;
            }
        }
        return false;
    }
    
    emit(...args) {
        this.emissionHistory.push({ args, timestamp: Date.now() });
        this.connections.forEach(connection => {
            try {
                connection.callable(...args);
            } catch (error) {
                console.warn(`Signal emission error: ${error.message}`);
            }
        });
    }
    
    hasConnections() {
        return this.connections.size > 0;
    }
    
    getConnectionCount() {
        return this.connections.size;
    }
    
    getName() {
        return this.signalName;
    }
}

class MockGameObject {
    constructor(name) {
        this.name = name;
        this.signals = new Map();
    }
    
    declareSignal(signalName) {
        const signal = new MockSignal(this, signalName);
        this.signals.set(signalName, signal);
        
        Object.defineProperty(this, signalName, {
            get: () => signal,
            enumerable: true
        });
        
        return signal;
    }
    
    getSignal(signalName) {
        return this.signals.get(signalName) || null;
    }
    
    hasSignal(signalName) {
        return this.signals.has(signalName);
    }
}

class MockEventBus {
    constructor() {
        this.events = [];
        this.listeners = new Map();
        this.globalListeners = new Map();
    }
    
    emit(eventName, data = {}, context = null) {
        const event = {
            name: eventName,
            data: data,
            context: context,
            timestamp: Date.now()
        };
        
        this.events.push(event);
        
        // Notify specific listeners
        const eventListeners = this.listeners.get(eventName) || [];
        eventListeners.forEach(callback => {
            try {
                callback(data, context, event);
            } catch (error) {
                console.warn(`Event listener error: ${error.message}`);
            }
        });
        
        // Notify global listeners
        this.globalListeners.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.warn(`Global listener error: ${error.message}`);
            }
        });
    }
    
    on(eventName, callback, options = {}) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        
        this.listeners.get(eventName).push(callback);
        
        return () => {
            const listeners = this.listeners.get(eventName);
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }
    
    addGlobalListener(callback, id) {
        this.globalListeners.set(id, callback);
        return id;
    }
    
    getEvents() {
        return [...this.events];
    }
    
    getEventsByName(name) {
        return this.events.filter(event => event.name === name);
    }
    
    clearEvents() {
        this.events = [];
    }
}

// Test Suite Implementation
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
        console.log('🧪 Running API Integration Test Suite...\n');
        
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

// Simplified Ant API Test Implementation
class SimplifiedAntAPI {
    constructor(antId, eventBus) {
        this.id = antId;
        this.eventBus = eventBus;
        this.position = { x: 0, y: 0 };
        this.job = 'Worker';
        this.health = 100;
        this.isAlive = true;
        this.inventory = new Map();
        this.currentTask = null;
        
        // Internal signal system simulation
        this.gameObject = new MockGameObject(`Ant_${antId}`);
        this.gameObject.declareSignal('position_changed');
        this.gameObject.declareSignal('job_changed');
        this.gameObject.declareSignal('health_changed');
        this.gameObject.declareSignal('task_assigned');
        this.gameObject.declareSignal('task_completed');
        this.gameObject.declareSignal('item_picked_up');
    }
    
    // Simplified API methods
    moveTo(newPosition) {
        const oldPosition = { ...this.position };
        this.position = { ...newPosition };
        
        // Emit through signal system
        this.gameObject.position_changed.emit(this, newPosition, oldPosition);
        
        // Emit through event bus
        this.eventBus.emit('ant_position_changed', {
            antId: this.id,
            newPosition: newPosition,
            previousPosition: oldPosition
        }, this);
        
        return true;
    }
    
    changeJob(newJob) {
        if (this.job === newJob) return false;
        
        const oldJob = this.job;
        this.job = newJob;
        
        this.gameObject.job_changed.emit(this, newJob, oldJob);
        this.eventBus.emit('ant_job_changed', {
            antId: this.id,
            newJob: newJob,
            previousJob: oldJob
        }, this);
        
        return true;
    }
    
    setHealth(newHealth) {
        const oldHealth = this.health;
        this.health = Math.max(0, newHealth);
        
        if (this.health !== oldHealth) {
            this.gameObject.health_changed.emit(this, this.health, oldHealth);
            this.eventBus.emit('ant_health_changed', {
                antId: this.id,
                newHealth: this.health,
                previousHealth: oldHealth
            }, this);
        }
        
        if (this.health <= 0 && this.isAlive) {
            this.isAlive = false;
            this.eventBus.emit('ant_died', {
                antId: this.id,
                cause: 'health_depleted'
            }, this);
        }
    }
    
    assignTask(task) {
        this.currentTask = task;
        this.gameObject.task_assigned.emit(this, task);
        this.eventBus.emit('ant_task_assigned', {
            antId: this.id,
            task: task
        }, this);
    }
    
    completeTask(result = null) {
        if (this.currentTask) {
            const completedTask = this.currentTask;
            this.currentTask = null;
            
            this.gameObject.task_completed.emit(this, completedTask, result);
            this.eventBus.emit('ant_task_completed', {
                antId: this.id,
                task: completedTask,
                result: result
            }, this);
        }
    }
    
    pickUpItem(itemType, amount) {
        const currentAmount = this.inventory.get(itemType) || 0;
        this.inventory.set(itemType, currentAmount + amount);
        
        this.gameObject.item_picked_up.emit(this, itemType, amount);
        this.eventBus.emit('resource_collected', {
            collector: { id: this.id, job: this.job },
            resource: { type: itemType },
            amount: amount
        }, this);
        
        return true;
    }
    
    // API introspection methods
    getStatus() {
        return {
            id: this.id,
            position: { ...this.position },
            job: this.job,
            health: this.health,
            isAlive: this.isAlive,
            currentTask: this.currentTask,
            inventorySize: this.inventory.size
        };
    }
    
    // Event subscription helpers
    onPositionChange(callback) {
        return this.gameObject.position_changed.connect(callback);
    }
    
    onJobChange(callback) {
        return this.gameObject.job_changed.connect(callback);
    }
    
    onHealthChange(callback) {
        return this.gameObject.health_changed.connect(callback);
    }
    
    onTaskComplete(callback) {
        return this.gameObject.task_completed.connect(callback);
    }
}

// Game Manager Test Implementation
class TestGameManager {
    constructor() {
        this.eventBus = new MockEventBus();
        this.ants = new Map();
        this.resources = new Map();
        this.uiCallbacks = new Map();
        this.gameStats = {
            antsSpawned: 0,
            resourcesCollected: 0,
            tasksCompleted: 0
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Track ant statistics
        this.eventBus.on('ant_spawned', (data) => {
            this.gameStats.antsSpawned++;
        });
        
        this.eventBus.on('resource_collected', (data) => {
            this.gameStats.resourcesCollected += data.amount;
        });
        
        this.eventBus.on('ant_task_completed', (data) => {
            this.gameStats.tasksCompleted++;
        });
        
        // Cross-system integration
        this.eventBus.on('ant_job_changed', (data, context) => {
            if (data.newJob === 'Gatherer') {
                // Auto-assign gathering task
                const ant = context;
                ant.assignTask({
                    type: 'gather',
                    target: 'resource_1',
                    amount: 10
                });
            }
        });
    }
    
    spawnAnt(job = 'Worker', position = null) {
        const id = `ant_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const spawnPosition = position || { x: Math.random() * 100, y: Math.random() * 100 };
        
        const ant = new SimplifiedAntAPI(id, this.eventBus);
        ant.job = job;
        ant.position = spawnPosition;
        
        this.ants.set(id, ant);
        
        this.eventBus.emit('ant_spawned', {
            antId: id,
            job: job,
            position: spawnPosition
        }, ant);
        
        return ant;
    }
    
    getAnt(antId) {
        return this.ants.get(antId) || null;
    }
    
    getAllAnts() {
        return Array.from(this.ants.values());
    }
    
    getStatistics() {
        return { ...this.gameStats };
    }
    
    // Simplified API
    getAPI() {
        return {
            spawnAnt: (job, position) => this.spawnAnt(job, position),
            getAnt: (id) => this.getAnt(id),
            getAllAnts: () => this.getAllAnts(),
            getStats: () => this.getStatistics(),
            on: (event, callback) => this.eventBus.on(event, callback),
            getEvents: () => this.eventBus.getEvents()
        };
    }
}

// Test Cases
testSuite.test('API Integration - Basic ant operations through simplified API', () => {
    const gameManager = new TestGameManager();
    const api = gameManager.getAPI();
    
    // Spawn an ant through the API
    const ant = api.spawnAnt('Worker', { x: 10, y: 20 });
    
    testSuite.assertEqual(ant.id.startsWith('ant_'), true, 'Ant ID should have correct prefix');
    testSuite.assertEqual(ant.job, 'Worker', 'Ant should have correct job');
    testSuite.assertEqual(ant.position.x, 10, 'Ant should have correct X position');
    testSuite.assertEqual(ant.position.y, 20, 'Ant should have correct Y position');
    
    // Verify ant is tracked by manager
    testSuite.assertEqual(api.getAllAnts().length, 1, 'Manager should track spawned ant');
    testSuite.assertEqual(api.getAnt(ant.id), ant, 'Manager should return correct ant by ID');
    
    // Verify events were emitted
    const events = api.getEvents();
    const spawnEvents = events.filter(e => e.name === 'ant_spawned');
    testSuite.assertEqual(spawnEvents.length, 1, 'Spawn event should be emitted');
    testSuite.assertEqual(spawnEvents[0].data.antId, ant.id, 'Spawn event should contain ant ID');
});

testSuite.test('API Integration - Ant behavior through signals and events', () => {
    const gameManager = new TestGameManager();
    const api = gameManager.getAPI();
    
    const ant = api.spawnAnt('Worker', { x: 0, y: 0 });
    
    // Track signal emissions
    let positionChangeCount = 0;
    let jobChangeCount = 0;
    
    ant.onPositionChange(() => positionChangeCount++);
    ant.onJobChange(() => jobChangeCount++);
    
    // Test position change
    ant.moveTo({ x: 50, y: 75 });
    
    testSuite.assertEqual(ant.position.x, 50, 'Position should be updated');
    testSuite.assertEqual(ant.position.y, 75, 'Position should be updated');
    testSuite.assertEqual(positionChangeCount, 1, 'Position change signal should be emitted');
    
    // Test job change
    ant.changeJob('Gatherer');
    
    testSuite.assertEqual(ant.job, 'Gatherer', 'Job should be changed');
    testSuite.assertEqual(jobChangeCount, 1, 'Job change signal should be emitted');
    
    // Verify events in event bus
    const events = api.getEvents();
    const positionEvents = events.filter(e => e.name === 'ant_position_changed');
    const jobEvents = events.filter(e => e.name === 'ant_job_changed');
    
    testSuite.assertEqual(positionEvents.length, 1, 'Position change event should be in event bus');
    testSuite.assertEqual(jobEvents.length, 1, 'Job change event should be in event bus');
});

testSuite.test('API Integration - Cross-system event integration', () => {
    const gameManager = new TestGameManager();
    const api = gameManager.getAPI();
    
    const ant = api.spawnAnt('Worker', { x: 10, y: 10 });
    
    // Track task assignments
    let taskAssignmentCount = 0;
    ant.gameObject.task_assigned.connect(() => taskAssignmentCount++);
    
    // Change job to Gatherer - should trigger auto-task assignment
    ant.changeJob('Gatherer');
    
    // Verify task was auto-assigned due to cross-system integration
    testSuite.assertTrue(ant.currentTask !== null, 'Task should be auto-assigned when changing to Gatherer');
    testSuite.assertEqual(ant.currentTask.type, 'gather', 'Task should be a gathering task');
    testSuite.assertEqual(taskAssignmentCount, 1, 'Task assignment signal should be emitted');
    
    // Verify task assignment event
    const events = api.getEvents();
    const taskEvents = events.filter(e => e.name === 'ant_task_assigned');
    testSuite.assertEqual(taskEvents.length, 1, 'Task assignment event should be emitted');
});

testSuite.test('API Integration - Resource collection workflow', () => {
    const gameManager = new TestGameManager();
    const api = gameManager.getAPI();
    
    const ant = api.spawnAnt('Gatherer', { x: 20, y: 30 });
    
    // Track resource collection
    let resourceCollectionCount = 0;
    api.on('resource_collected', () => resourceCollectionCount++);
    
    // Simulate resource collection
    ant.pickUpItem('Wood', 25);
    ant.pickUpItem('Stone', 15);
    
    testSuite.assertEqual(ant.inventory.get('Wood'), 25, 'Ant should have collected wood');
    testSuite.assertEqual(ant.inventory.get('Stone'), 15, 'Ant should have collected stone');
    testSuite.assertEqual(resourceCollectionCount, 2, 'Resource collection events should be emitted');
    
    // Verify statistics tracking
    const stats = api.getStats();
    testSuite.assertEqual(stats.resourcesCollected, 40, 'Statistics should track total resources collected');
});

testSuite.test('API Integration - Task lifecycle through signals', () => {
    const gameManager = new TestGameManager();
    const api = gameManager.getAPI();
    
    const ant = api.spawnAnt('Worker', { x: 0, y: 0 });
    
    // Track task lifecycle
    let taskAssignedCount = 0;
    let taskCompletedCount = 0;
    
    ant.onTaskComplete(() => taskCompletedCount++);
    ant.gameObject.task_assigned.connect(() => taskAssignedCount++);
    
    // Assign and complete a task
    const task = { type: 'build', target: 'structure_1' };
    ant.assignTask(task);
    
    testSuite.assertEqual(ant.currentTask, task, 'Task should be assigned');
    testSuite.assertEqual(taskAssignedCount, 1, 'Task assignment signal should be emitted');
    
    ant.completeTask({ success: true, built: 'structure_1' });
    
    testSuite.assertEqual(ant.currentTask, null, 'Current task should be cleared after completion');
    testSuite.assertEqual(taskCompletedCount, 1, 'Task completion signal should be emitted');
    
    // Verify statistics
    const stats = api.getStats();
    testSuite.assertEqual(stats.tasksCompleted, 1, 'Statistics should track completed tasks');
});

testSuite.test('API Integration - Health and lifecycle management', () => {
    const gameManager = new TestGameManager();
    const api = gameManager.getAPI();
    
    const ant = api.spawnAnt('Fighter', { x: 50, y: 50 });
    
    // Track health changes and death
    let healthChangeCount = 0;
    let deathEventReceived = false;
    
    ant.onHealthChange(() => healthChangeCount++);
    api.on('ant_died', () => deathEventReceived = true);
    
    // Test health changes
    ant.setHealth(75);
    testSuite.assertEqual(ant.health, 75, 'Health should be updated');
    testSuite.assertEqual(healthChangeCount, 1, 'Health change signal should be emitted');
    
    ant.setHealth(25);
    testSuite.assertEqual(ant.health, 25, 'Health should be updated');
    testSuite.assertEqual(healthChangeCount, 2, 'Health change signal should be emitted again');
    
    // Test death
    testSuite.assertTrue(ant.isAlive, 'Ant should be alive before fatal damage');
    ant.setHealth(0);
    
    testSuite.assertEqual(ant.health, 0, 'Health should be zero');
    testSuite.assertFalse(ant.isAlive, 'Ant should be dead after health reaches zero');
    testSuite.assertTrue(deathEventReceived, 'Death event should be emitted');
    testSuite.assertEqual(healthChangeCount, 3, 'Final health change signal should be emitted');
});

testSuite.test('API Integration - Multiple ant coordination', () => {
    const gameManager = new TestGameManager();
    const api = gameManager.getAPI();
    
    // Spawn multiple ants
    const worker = api.spawnAnt('Worker', { x: 10, y: 10 });
    const gatherer = api.spawnAnt('Gatherer', { x: 20, y: 20 });
    const scout = api.spawnAnt('Scout', { x: 30, y: 30 });
    
    testSuite.assertEqual(api.getAllAnts().length, 3, 'Manager should track all ants');
    
    // Test coordinated behavior
    let totalResourcesCollected = 0;
    api.on('resource_collected', (data) => {
        totalResourcesCollected += data.amount;
    });
    
    // All ants collect resources
    worker.pickUpItem('Wood', 10);
    gatherer.pickUpItem('Stone', 15);
    scout.pickUpItem('Food', 5);
    
    testSuite.assertEqual(totalResourcesCollected, 30, 'Total resources should be tracked across all ants');
    
    // Test individual ant status
    const workerStatus = worker.getStatus();
    testSuite.assertEqual(workerStatus.job, 'Worker', 'Worker should have correct job');
    testSuite.assertEqual(workerStatus.inventorySize, 1, 'Worker should have items in inventory');
    
    const gathererStatus = gatherer.getStatus();
    testSuite.assertEqual(gathererStatus.job, 'Gatherer', 'Gatherer should have correct job');
    testSuite.assertTrue(gathererStatus.currentTask !== null, 'Gatherer should have auto-assigned task');
    
    // Verify final statistics
    const finalStats = api.getStats();
    testSuite.assertEqual(finalStats.antsSpawned, 3, 'Statistics should show correct spawn count');
    testSuite.assertEqual(finalStats.resourcesCollected, 30, 'Statistics should show correct collection total');
});

testSuite.test('System behavior - Event propagation and signal coordination', () => {
    const gameManager = new TestGameManager();
    const api = gameManager.getAPI();
    
    const ant = api.spawnAnt('Worker', { x: 0, y: 0 });
    
    // Track all events at different levels
    const signalEvents = [];
    const eventBusEvents = [];
    
    // Signal-level tracking
    ant.gameObject.position_changed.connect((ant, newPos, oldPos) => {
        signalEvents.push({ type: 'position_changed', newPos, oldPos });
    });
    
    // Event bus tracking
    api.on('ant_position_changed', (data) => {
        eventBusEvents.push({ type: 'ant_position_changed', data });
    });
    
    // Perform action that should trigger both systems
    ant.moveTo({ x: 100, y: 200 });
    
    // Verify both signal and event bus received the event
    testSuite.assertEqual(signalEvents.length, 1, 'Signal system should receive position change');
    testSuite.assertEqual(eventBusEvents.length, 1, 'Event bus should receive position change');
    
    // Verify event data consistency
    const signalEvent = signalEvents[0];
    const busEvent = eventBusEvents[0];
    
    testSuite.assertEqual(signalEvent.newPos.x, 100, 'Signal should have correct new position');
    testSuite.assertEqual(busEvent.data.newPosition.x, 100, 'Event bus should have correct new position');
    
    // Test that both systems can coexist and complement each other
    testSuite.assertTrue(signalEvent.newPos.x === busEvent.data.newPosition.x, 'Both systems should report consistent data');
});

// Export for test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testSuite;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    testSuite.run();
}