/**
 * @fileoverview Signal System Implementation
 * Core Signal and Callable classes implementing Godot-style signal system
 * for event-driven architecture in the ant game.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * Callable class for binding parameters to function calls
 * Implements Godot's Callable.bind() functionality
 */
class Callable {
    constructor(target, method, ...boundArgs) {
        if (typeof target === 'function') {
            this.callable = target;
            this.boundArgs = method ? [method, ...boundArgs] : [];
        } else if (target && typeof target[method] === 'function') {
            this.callable = target[method].bind(target);
            this.boundArgs = boundArgs;
        } else {
            throw new Error('Invalid callable: target must be a function or object with method');
        }
        
        this.target = target;
        this.method = method;
    }
    
    /**
     * Bind additional parameters to the callable
     * @param {...any} args - Arguments to bind
     * @returns {Callable} New callable with bound arguments
     */
    bind(...args) {
        return new Callable(this.callable, null, ...this.boundArgs, ...args);
    }
    
    /**
     * Call the callable with provided arguments
     * @param {...any} args - Arguments to pass to the callable
     * @returns {any} Result of the function call
     */
    call(...args) {
        const allArgs = [...this.boundArgs, ...args];
        return this.callable(...allArgs);
    }
    
    /**
     * Get the target object (if any)
     * @returns {object|null} Target object or null for functions
     */
    getObject() {
        return this.target && typeof this.target === 'object' ? this.target : null;
    }
    
    /**
     * Get the method name (if any)
     * @returns {string|null} Method name or null for direct functions
     */
    getMethod() {
        return typeof this.method === 'string' ? this.method : null;
    }
    
    /**
     * Check if this callable is valid
     * @returns {boolean} True if callable is valid
     */
    isValid() {
        return typeof this.callable === 'function';
    }
}

/**
 * Signal class implementing Godot-style signals
 * Provides event emission and connection management
 */
class Signal {
    // Connection flags (Godot-compatible)
    static get CONNECT_DEFERRED() { return 1; }
    static get CONNECT_ONESHOT() { return 2; }
    static get CONNECT_REFERENCE_COUNTED() { return 4; }
    static get CONNECT_PERSIST() { return 8; }
    
    constructor(object = null, signalName = '') {
        this.object = object;
        this.signalName = signalName;
        this.connections = new Set();
        this.isDestroyed = false;
        this.emissionCount = 0;
        this.lastEmissionTime = 0;
        this.connectionHistory = [];
        
        // Performance tracking
        this.metrics = {
            totalEmissions: 0,
            totalConnections: 0,
            totalDisconnections: 0,
            averageEmissionTime: 0,
            maxConnections: 0
        };
    }
    
    /**
     * Connect a callable to this signal
     * @param {Function|Callable} callable - Function or Callable to connect
     * @param {number} flags - Connection flags (CONNECT_ONESHOT, etc.)
     * @returns {number} Error code (0 = OK, 1 = ERR_INVALID_PARAMETER)
     */
    connect(callable, flags = 0) {
        if (this.isDestroyed) {
            return 1; // ERR_INVALID_PARAMETER - signal destroyed
        }
        
        if (!callable) {
            return 1; // ERR_INVALID_PARAMETER
        }
        
        let targetCallable;
        if (callable instanceof Callable) {
            targetCallable = callable;
        } else if (typeof callable === 'function') {
            targetCallable = new Callable(callable);
        } else {
            return 1; // ERR_INVALID_PARAMETER
        }
        
        // Check for duplicate connections
        for (const connection of this.connections) {
            if (connection.callable === targetCallable || 
                (connection.callable.callable === targetCallable.callable && 
                 JSON.stringify(connection.callable.boundArgs) === JSON.stringify(targetCallable.boundArgs))) {
                return 1; // Already connected
            }
        }
        
        const connection = {
            callable: targetCallable,
            flags: flags,
            connectedAt: Date.now(),
            emissionCount: 0
        };
        
        this.connections.add(connection);
        this.metrics.totalConnections++;
        this.metrics.maxConnections = Math.max(this.metrics.maxConnections, this.connections.size);
        
        this.connectionHistory.push({
            action: 'connect',
            timestamp: Date.now(),
            flags: flags,
            connectionCount: this.connections.size
        });
        
        return 0; // OK
    }
    
    /**
     * Disconnect a callable from this signal
     * @param {Function|Callable} callable - Callable to disconnect
     * @returns {boolean} True if disconnection was successful
     */
    disconnect(callable) {
        if (this.isDestroyed) {
            return false;
        }
        
        for (const connection of this.connections) {
            let shouldDisconnect = false;
            
            if (callable instanceof Callable) {
                shouldDisconnect = connection.callable === callable ||
                    (connection.callable.callable === callable.callable &&
                     JSON.stringify(connection.callable.boundArgs) === JSON.stringify(callable.boundArgs));
            } else if (typeof callable === 'function') {
                shouldDisconnect = connection.callable.callable === callable ||
                    (typeof connection.callable === 'function' && connection.callable === callable);
            }
            
            if (shouldDisconnect) {
                this.connections.delete(connection);
                this.metrics.totalDisconnections++;
                
                this.connectionHistory.push({
                    action: 'disconnect',
                    timestamp: Date.now(),
                    connectionCount: this.connections.size
                });
                
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Disconnect all connections from this signal
     */
    disconnectAll() {
        const connectionCount = this.connections.size;
        this.connections.clear();
        this.metrics.totalDisconnections += connectionCount;
        
        this.connectionHistory.push({
            action: 'disconnect_all',
            timestamp: Date.now(),
            connectionCount: 0,
            previousCount: connectionCount
        });
    }
    
    /**
     * Emit the signal with given arguments
     * @param {...any} args - Arguments to pass to connected callables
     */
    emit(...args) {
        if (this.isDestroyed) {
            return;
        }
        
        const startTime = performance.now ? performance.now() : Date.now();
        this.emissionCount++;
        this.metrics.totalEmissions++;
        this.lastEmissionTime = Date.now();
        
        const connectionsToRemove = [];
        let successfulEmissions = 0;
        let failedEmissions = 0;
        
        for (const connection of this.connections) {
            try {
                connection.callable.call(...args);
                connection.emissionCount++;
                successfulEmissions++;
                
                // Handle CONNECT_ONESHOT flag
                if (connection.flags & Signal.CONNECT_ONESHOT) {
                    connectionsToRemove.push(connection);
                }
            } catch (error) {
                failedEmissions++;
                
                // In a real implementation, you might want to log this
                // or handle it based on connection flags
                if (this.object && this.object.handleSignalError) {
                    this.object.handleSignalError(error, this.signalName, args);
                }
            }
        }
        
        // Remove one-shot connections
        connectionsToRemove.forEach(connection => {
            this.connections.delete(connection);
            this.metrics.totalDisconnections++;
        });
        
        const endTime = performance.now ? performance.now() : Date.now();
        const emissionTime = endTime - startTime;
        
        // Update average emission time
        const totalTime = this.metrics.averageEmissionTime * (this.metrics.totalEmissions - 1) + emissionTime;
        this.metrics.averageEmissionTime = totalTime / this.metrics.totalEmissions;
    }
    
    /**
     * Check if signal has any connections
     * @returns {boolean} True if signal has connections
     */
    hasConnections() {
        return this.connections.size > 0;
    }
    
    /**
     * Get all connections
     * @returns {Array} Array of connection objects
     */
    getConnections() {
        return Array.from(this.connections);
    }
    
    /**
     * Check if a specific callable is connected
     * @param {Function|Callable} callable - Callable to check
     * @returns {boolean} True if callable is connected
     */
    isConnected(callable) {
        for (const connection of this.connections) {
            if (callable instanceof Callable) {
                if (connection.callable === callable ||
                    (connection.callable.callable === callable.callable &&
                     JSON.stringify(connection.callable.boundArgs) === JSON.stringify(callable.boundArgs))) {
                    return true;
                }
            } else if (typeof callable === 'function') {
                if (connection.callable.callable === callable ||
                    (typeof connection.callable === 'function' && connection.callable === callable)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Get the number of connections
     * @returns {number} Number of connections
     */
    getConnectionCount() {
        return this.connections.size;
    }
    
    /**
     * Get signal name
     * @returns {string} Signal name
     */
    getName() {
        return this.signalName;
    }
    
    /**
     * Get the object this signal belongs to
     * @returns {object|null} Owner object or null
     */
    getObject() {
        return this.object;
    }
    
    /**
     * Get emission count
     * @returns {number} Number of times this signal has been emitted
     */
    getEmissionCount() {
        return this.emissionCount;
    }
    
    /**
     * Get last emission time
     * @returns {number} Timestamp of last emission
     */
    getLastEmissionTime() {
        return this.lastEmissionTime;
    }
    
    /**
     * Get signal metrics for performance monitoring
     * @returns {object} Metrics object
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Get connection history for debugging
     * @returns {Array} Array of connection history events
     */
    getConnectionHistory() {
        return [...this.connectionHistory];
    }
    
    /**
     * Destroy the signal and cleanup connections
     */
    destroy() {
        this.disconnectAll();
        this.isDestroyed = true;
        this.object = null;
    }
    
    /**
     * Check if signal is destroyed
     * @returns {boolean} True if signal is destroyed
     */
    isSignalDestroyed() {
        return this.isDestroyed;
    }
    
    /**
     * Create a string representation of the signal
     * @returns {string} String representation
     */
    toString() {
        const objectName = this.object ? this.object.constructor.name : 'null';
        return `Signal(${objectName}::${this.signalName}, connections: ${this.connections.size})`;
    }
}

/**
 * GameObject base class with signal declaration support
 * Provides the foundation for game objects that can emit signals
 */
class GameObject {
    constructor(name = '') {
        this.name = name;
        this.signals = new Map();
        this.isDestroyed = false;
    }
    
    /**
     * Declare a signal for this object
     * @param {string} signalName - Name of the signal
     * @param {...string} parameterNames - Optional parameter names for documentation
     * @returns {Signal} The created signal
     */
    declareSignal(signalName, ...parameterNames) {
        if (this.signals.has(signalName)) {
            return this.signals.get(signalName);
        }
        
        const signal = new Signal(this, signalName);
        signal.parameterNames = parameterNames;
        this.signals.set(signalName, signal);
        
        // Create property accessor (Godot pattern)
        Object.defineProperty(this, signalName, {
            get: () => signal,
            enumerable: true,
            configurable: true
        });
        
        return signal;
    }
    
    /**
     * Get a signal by name
     * @param {string} signalName - Name of the signal
     * @returns {Signal|null} The signal or null if not found
     */
    getSignal(signalName) {
        return this.signals.get(signalName) || null;
    }
    
    /**
     * Check if a signal exists
     * @param {string} signalName - Name of the signal
     * @returns {boolean} True if signal exists
     */
    hasSignal(signalName) {
        return this.signals.has(signalName);
    }
    
    /**
     * Get all signal names
     * @returns {Array<string>} Array of signal names
     */
    getSignalList() {
        return Array.from(this.signals.keys());
    }
    
    /**
     * Connect to another object's signal
     * @param {GameObject} object - Object with the signal
     * @param {string} signalName - Name of the signal
     * @param {Function|Callable} callable - Callable to connect
     * @param {number} flags - Connection flags
     * @returns {number} Error code
     */
    connectSignal(object, signalName, callable, flags = 0) {
        if (!object || !object.hasSignal(signalName)) {
            return 1; // ERR_INVALID_PARAMETER
        }
        
        return object.getSignal(signalName).connect(callable, flags);
    }
    
    /**
     * Disconnect from another object's signal
     * @param {GameObject} object - Object with the signal
     * @param {string} signalName - Name of the signal
     * @param {Function|Callable} callable - Callable to disconnect
     * @returns {boolean} True if disconnection was successful
     */
    disconnectSignal(object, signalName, callable) {
        if (!object || !object.hasSignal(signalName)) {
            return false;
        }
        
        return object.getSignal(signalName).disconnect(callable);
    }
    
    /**
     * Emit a signal
     * @param {string} signalName - Name of the signal to emit
     * @param {...any} args - Arguments to pass to connected callables
     */
    emitSignal(signalName, ...args) {
        const signal = this.getSignal(signalName);
        if (signal) {
            signal.emit(...args);
        }
    }
    
    /**
     * Handle signal emission errors (override in subclasses)
     * @param {Error} error - The error that occurred
     * @param {string} signalName - Name of the signal
     * @param {Array} args - Arguments passed to the signal
     */
    handleSignalError(error, signalName, args) {
        // Default implementation - log the error
        console.warn(`Signal error in ${this.name || this.constructor.name}::${signalName}: ${error.message}`);
    }
    
    /**
     * Destroy the game object and cleanup all signals
     */
    destroy() {
        for (const signal of this.signals.values()) {
            signal.destroy();
        }
        this.signals.clear();
        this.isDestroyed = true;
    }
    
    /**
     * Check if game object is destroyed
     * @returns {boolean} True if destroyed
     */
    isGameObjectDestroyed() {
        return this.isDestroyed;
    }
    
    /**
     * Get string representation
     * @returns {string} String representation
     */
    toString() {
        return `GameObject(${this.name || 'unnamed'}, signals: ${this.signals.size})`;
    }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Signal,
        Callable,
        GameObject
    };
}

// For browser environments
if (typeof window !== 'undefined') {
    window.Signal = Signal;
    window.Callable = Callable;
    window.GameObject = GameObject;
}