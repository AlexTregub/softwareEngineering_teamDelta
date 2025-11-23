/**
 * Event Bus Module
 * 
 * This module provides a simple event bus for managing custom events
 * within an application. It allows components to subscribe to events,
 * unsubscribe from events, and emit events with optional data payloads.
 */

class EventBus {
    constructor() {
        this.listeners = {};
    }

    /**
     * on - Subscribe to an event
     * @param {string} event 
     * @param {*} listener 
     */
    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    /**
     * off - Unsubscribe from an event
     * @param {string} event 
     * @param {*} listener 
     */
    off(event, listener) {
        if (!this.listeners[event]) return;
        // Remove the listener from the event's listener array
        this.listeners[event] = this.listeners[event].filter(l => l !== listener); 
    }

    /**
     * emit - Emit an event
     * @param {string} event 
     * @param {function} data 
     */
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(listener => listener(data));
    }

    /**
     * once - Subscribe to an event only once
     * @param {string} event 
     * @param {*} listener 
     */
    once(event, listener) {
        const onceListener = (data) => {
            listener(data);
            this.off(event, onceListener);
        };
        this.on(event, onceListener);
    }
}

// Only create eventBus if it doesn't already exist
if (typeof window !== 'undefined' && !window.eventBus) {
    window.eventBus = new EventBus();
} else if (typeof global !== 'undefined' && !global.eventBus) {
    global.eventBus = new EventBus();
}

// Export for Node.js test environments only
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
    module.exports = (typeof global !== 'undefined' && global.eventBus) || new EventBus();
}