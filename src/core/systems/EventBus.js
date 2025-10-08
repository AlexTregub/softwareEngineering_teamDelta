/**
 * @fileoverview EventBus - Simplified Signal System API
 * Provides a simplified interface for the Signal system that makes
 * ant API calls easier and more intuitive. Acts as a facade over
 * the comprehensive Signal system.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

const { Signal, Callable, GameObject } = require('./SignalSystem.js');

/**
 * EventBus class providing simplified signal system access
 * Makes it easy to emit and listen to events throughout the ant game
 */
class EventBus {
    constructor() {
        this.signals = new Map();
        this.globalListeners = new Map(); // For catch-all listeners
        this.eventHistory = [];
        this.maxHistorySize = 1000;
        this.isDestroyed = false;
        
        // Pre-declare common ant game signals
        this.initializeCommonSignals();
    }
    
    /**
     * Initialize commonly used signals in the ant game
     * @private
     */
    initializeCommonSignals() {
        const commonSignals = [
            // Ant lifecycle
            'ant_spawned',
            'ant_destroyed',
            'ant_job_changed',
            'ant_level_up',
            'ant_health_changed',
            
            // Resource management
            'resource_discovered',
            'resource_collected',
            'resource_depleted',
            'resource_storage_full',
            
            // Combat system
            'combat_started',
            'combat_ended',
            'ant_attacked',
            'ant_defended',
            
            // Game state
            'game_started',
            'game_paused',
            'game_resumed',
            'game_ended',
            'level_completed',
            'level_failed',
            
            // UI events
            'ui_selection_changed',
            'ui_button_clicked',
            'ui_menu_opened',
            'ui_menu_closed',
            
            // System events
            'error_occurred',
            'warning_issued',
            'debug_message'
        ];
        
        commonSignals.forEach(signalName => {
            this.createSignal(signalName);
        });
    }
    
    /**
     * Create or get a signal by name
     * @param {string} eventName - Name of the event/signal
     * @returns {Signal} The signal object
     */
    createSignal(eventName) {
        if (!this.signals.has(eventName)) {
            const signal = new Signal(this, eventName);
            this.signals.set(eventName, signal);
        }
        return this.signals.get(eventName);
    }
    
    /**
     * Emit an event with data
     * @param {string} eventName - Name of the event to emit
     * @param {object} data - Event data object
     * @param {object} context - Optional context object (e.g., the ant that triggered the event)
     */
    emit(eventName, data = {}, context = null) {
        if (this.isDestroyed) return;
        
        // Create signal if it doesn't exist
        const signal = this.createSignal(eventName);
        
        // Create event object with metadata
        const eventObject = {
            name: eventName,
            data: data,
            context: context,
            timestamp: Date.now(),
            id: this.generateEventId()
        };
        
        // Add to history
        this.eventHistory.push(eventObject);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
        
        // Emit the signal
        signal.emit(eventObject);
        
        // Notify global listeners
        this.notifyGlobalListeners(eventObject);
    }
    
    /**
     * Listen to an event
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Callback function to execute
     * @param {object} options - Options object {once: boolean, priority: number}
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        const signal = this.createSignal(eventName);
        const flags = options.once ? Signal.CONNECT_ONESHOT : 0;
        
        // Wrap callback to provide a simpler interface
        const wrappedCallback = (eventObject) => {
            callback(eventObject.data, eventObject.context, eventObject);
        };
        
        signal.connect(wrappedCallback, flags);
        
        // Return unsubscribe function
        return () => {
            signal.disconnect(wrappedCallback);
        };
    }
    
    /**
     * Listen to an event once (automatically unsubscribe after first emission)
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Callback function to execute once
     * @returns {Function} Unsubscribe function
     */
    once(eventName, callback) {
        return this.on(eventName, callback, { once: true });
    }
    
    /**
     * Remove a specific listener from an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to remove
     */
    off(eventName, callback) {
        const signal = this.signals.get(eventName);
        if (signal) {
            signal.disconnect(callback);
        }
    }
    
    /**
     * Remove all listeners from an event
     * @param {string} eventName - Name of the event to clear
     */
    clear(eventName) {
        const signal = this.signals.get(eventName);
        if (signal) {
            signal.disconnectAll();
        }
    }
    
    /**
     * Remove all listeners from all events
     */
    clearAll() {
        for (const signal of this.signals.values()) {
            signal.disconnectAll();
        }
        this.globalListeners.clear();
    }
    
    /**
     * Add a global listener that receives all events
     * @param {Function} callback - Callback function
     * @param {string} id - Unique identifier for the listener
     */
    addGlobalListener(callback, id = null) {
        const listenerId = id || this.generateEventId();
        this.globalListeners.set(listenerId, callback);
        return listenerId;
    }
    
    /**
     * Remove a global listener
     * @param {string} id - Listener ID
     */
    removeGlobalListener(id) {
        return this.globalListeners.delete(id);
    }
    
    /**
     * Notify all global listeners
     * @param {object} eventObject - Event object
     * @private
     */
    notifyGlobalListeners(eventObject) {
        for (const callback of this.globalListeners.values()) {
            try {
                callback(eventObject);
            } catch (error) {
                console.warn(`Global event listener error: ${error.message}`);
            }
        }
    }
    
    /**
     * Check if an event has any listeners
     * @param {string} eventName - Name of the event
     * @returns {boolean} True if event has listeners
     */
    hasListeners(eventName) {
        const signal = this.signals.get(eventName);
        return signal ? signal.hasConnections() : false;
    }
    
    /**
     * Get the number of listeners for an event
     * @param {string} eventName - Name of the event
     * @returns {number} Number of listeners
     */
    getListenerCount(eventName) {
        const signal = this.signals.get(eventName);
        return signal ? signal.getConnectionCount() : 0;
    }
    
    /**
     * Get all registered event names
     * @returns {Array<string>} Array of event names
     */
    getEventNames() {
        return Array.from(this.signals.keys());
    }
    
    /**
     * Get event history
     * @param {string} eventName - Optional event name to filter by
     * @param {number} limit - Optional limit on number of events
     * @returns {Array} Array of event objects
     */
    getEventHistory(eventName = null, limit = null) {
        let history = [...this.eventHistory];
        
        if (eventName) {
            history = history.filter(event => event.name === eventName);
        }
        
        if (limit && limit > 0) {
            history = history.slice(-limit);
        }
        
        return history;
    }
    
    /**
     * Get statistics about event usage
     * @returns {object} Statistics object
     */
    getStatistics() {
        const stats = {
            totalEvents: this.eventHistory.length,
            totalSignals: this.signals.size,
            totalGlobalListeners: this.globalListeners.size,
            eventBreakdown: {},
            recentActivity: []
        };
        
        // Calculate event breakdown
        for (const event of this.eventHistory) {
            if (!stats.eventBreakdown[event.name]) {
                stats.eventBreakdown[event.name] = 0;
            }
            stats.eventBreakdown[event.name]++;
        }
        
        // Get recent activity (last 10 events)
        stats.recentActivity = this.eventHistory.slice(-10);
        
        return stats;
    }
    
    /**
     * Generate a unique event ID
     * @returns {string} Unique ID
     * @private
     */
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Create a namespaced event bus
     * @param {string} namespace - Namespace for events
     * @returns {object} Namespaced event bus interface
     */
    namespace(namespace) {
        const namespacedBus = {
            emit: (eventName, data, context) => {
                this.emit(`${namespace}:${eventName}`, data, context);
            },
            on: (eventName, callback, options) => {
                return this.on(`${namespace}:${eventName}`, callback, options);
            },
            once: (eventName, callback) => {
                return this.once(`${namespace}:${eventName}`, callback);
            },
            off: (eventName, callback) => {
                this.off(`${namespace}:${eventName}`, callback);
            },
            clear: (eventName) => {
                this.clear(`${namespace}:${eventName}`);
            }
        };
        
        return namespacedBus;
    }
    
    /**
     * Destroy the event bus and cleanup
     */
    destroy() {
        this.clearAll();
        for (const signal of this.signals.values()) {
            signal.destroy();
        }
        this.signals.clear();
        this.eventHistory = [];
        this.isDestroyed = true;
    }
}

/**
 * Singleton instance of EventBus for global access
 */
let globalEventBus = null;

/**
 * Get the global event bus instance
 * @returns {EventBus} Global event bus
 */
function getGlobalEventBus() {
    if (!globalEventBus) {
        globalEventBus = new EventBus();
    }
    return globalEventBus;
}

/**
 * Convenience functions for global event bus
 */
const eventBus = {
    /**
     * Emit an event globally
     * @param {string} eventName - Event name
     * @param {object} data - Event data
     * @param {object} context - Event context
     */
    emit: (eventName, data, context) => {
        getGlobalEventBus().emit(eventName, data, context);
    },
    
    /**
     * Listen to an event globally
     * @param {string} eventName - Event name
     * @param {Function} callback - Callback function
     * @param {object} options - Options
     * @returns {Function} Unsubscribe function
     */
    on: (eventName, callback, options) => {
        return getGlobalEventBus().on(eventName, callback, options);
    },
    
    /**
     * Listen to an event once globally
     * @param {string} eventName - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    once: (eventName, callback) => {
        return getGlobalEventBus().once(eventName, callback);
    },
    
    /**
     * Remove listener globally
     * @param {string} eventName - Event name
     * @param {Function} callback - Callback function
     */
    off: (eventName, callback) => {
        getGlobalEventBus().off(eventName, callback);
    },
    
    /**
     * Create a new isolated event bus
     * @returns {EventBus} New event bus instance
     */
    create: () => {
        return new EventBus();
    },
    
    /**
     * Get global event bus instance
     * @returns {EventBus} Global event bus
     */
    global: () => {
        return getGlobalEventBus();
    }
};

// Example usage patterns for ant game

/**
 * Ant API Helper - Simplified ant event handling
 */
const AntEvents = {
    /**
     * Emit ant spawned event
     * @param {object} ant - Ant object
     * @param {object} position - Spawn position
     * @param {string} job - Ant job type
     */
    onAntSpawned: (ant, position, job) => {
        eventBus.emit('ant_spawned', {
            ant: ant,
            position: position,
            job: job,
            timestamp: Date.now()
        }, ant);
    },
    
    /**
     * Emit ant job changed event
     * @param {object} ant - Ant object
     * @param {string} oldJob - Previous job
     * @param {string} newJob - New job
     */
    onJobChanged: (ant, oldJob, newJob) => {
        eventBus.emit('ant_job_changed', {
            ant: ant,
            oldJob: oldJob,
            newJob: newJob
        }, ant);
    },
    
    /**
     * Emit resource collected event
     * @param {object} ant - Collector ant
     * @param {object} resource - Resource object
     * @param {number} amount - Amount collected
     */
    onResourceCollected: (ant, resource, amount) => {
        eventBus.emit('resource_collected', {
            collector: ant,
            resource: resource,
            amount: amount
        }, ant);
    },
    
    /**
     * Listen for ant events with simplified interface
     * @param {Function} callback - Callback function
     * @returns {object} Event listeners cleanup object
     */
    listenToAntEvents: (callback) => {
        const unsubscribers = [];
        
        const antEvents = ['ant_spawned', 'ant_destroyed', 'ant_job_changed', 'ant_health_changed'];
        
        antEvents.forEach(eventName => {
            const unsubscribe = eventBus.on(eventName, (data, context, event) => {
                callback(event);
            });
            unsubscribers.push(unsubscribe);
        });
        
        return {
            cleanup: () => {
                unsubscribers.forEach(unsub => unsub());
            }
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EventBus,
        getGlobalEventBus,
        eventBus,
        AntEvents
    };
}

// For browser environments
if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
    window.eventBus = eventBus;
    window.AntEvents = AntEvents;
}