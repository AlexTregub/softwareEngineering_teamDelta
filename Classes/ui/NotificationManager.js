/**
 * NotificationManager - UI component for user notifications
 * 
 * Manages toast-style notifications with:
 * - Multiple notification types (info, success, warning, error)
 * - Auto-dismiss functionality
 * - Type-based color coding
 * - History tracking
 */
class NotificationManager {
    /**
     * Create a notification manager
     * @param {number} defaultDuration - Default display duration in ms (default: 3000)
     * @param {number} maxHistory - Maximum history size (default: 50)
     */
    constructor(defaultDuration = 3000, maxHistory = 50) {
        this.notifications = [];
        this.history = []; // All notifications ever shown
        this.defaultDuration = defaultDuration;
        this.maxHistory = maxHistory;
        this.nextId = 1;
        
        // Type color mapping
        this.colors = {
            'info': '#0066cc',
            'success': '#00cc00',
            'warning': '#ff9900',
            'error': '#cc0000'
        };
    }
    
    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {string} type - Type (info, success, warning, error)
     * @param {number} duration - Duration in ms (0 = no auto-dismiss)
     * @returns {Object} Notification object
     */
    show(message, type = 'info', duration = null) {
        const notification = {
            id: this.nextId++,
            message: message,
            type: type,
            timestamp: Date.now(),
            duration: duration !== null ? duration : this.defaultDuration,
            dismissed: false
        };
        
        this.notifications.push(notification);
        
        // Add to history
        this.history.push({
            id: notification.id,
            message: message,
            type: type,
            timestamp: notification.timestamp
        });
        
        // Trim history if too large
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        return notification;
    }
    
    /**
     * Get notification history
     * @param {number} count - Number of recent items (default: all)
     * @returns {Array<Object>} History items
     */
    getHistory(count = null) {
        if (count === null) {
            return [...this.history];
        }
        return this.history.slice(-count);
    }
    
    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
    }
    
    /**
     * Get all active notifications
     * @returns {Array<Object>} Active notifications
     */
    getNotifications() {
        return this.notifications.filter(n => !n.dismissed);
    }
    
    /**
     * Dismiss a notification
     * @param {number} id - Notification ID
     * @returns {boolean} True if found and dismissed
     */
    dismiss(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.dismissed = true;
            return true;
        }
        return false;
    }
    
    /**
     * Remove expired notifications
     * @param {number} currentTime - Current timestamp
     * @returns {number} Number of notifications removed
     */
    removeExpired(currentTime) {
        let removed = 0;
        
        this.notifications.forEach(notification => {
            if (notification.duration > 0 && !notification.dismissed) {
                const elapsed = currentTime - notification.timestamp;
                if (elapsed >= notification.duration) {
                    notification.dismissed = true;
                    removed++;
                }
            }
        });
        
        return removed;
    }
    
    /**
     * Get color for notification type
     * @param {string} type - Notification type
     * @returns {string} Hex color code
     */
    getColor(type) {
        return this.colors[type] || this.colors['info'];
    }
    
    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications.forEach(n => n.dismissed = true);
    }
    
    /**
     * Get notification count by type
     * @param {string} type - Notification type
     * @returns {number} Count
     */
    getCountByType(type) {
        return this.notifications.filter(n => n.type === type && !n.dismissed).length;
    }
    
    /**
     * Update notifications - remove expired ones
     * Called each frame
     */
    update() {
        const currentTime = Date.now();
        this.removeExpired(currentTime);
    }
    
    /**
     * Render active notifications
     * Bottom-left position, stacking upwards
     * @param {number} x - Left X position
     * @param {number} y - Bottom Y position
     */
    render(x, y) {
        if (typeof push === 'undefined') {
            // p5.js not available
            return;
        }
        
        const active = this.getNotifications();
        if (active.length === 0) return;
        
        push();
        
        const notifWidth = 350;
        const notifHeight = 40;
        const spacing = 10;
        
        textAlign(LEFT, CENTER);
        textSize(14);
        
        // Render from bottom to top (newest at bottom)
        let offsetY = 0;
        
        // Reverse so newest appears at bottom
        for (let i = active.length - 1; i >= 0; i--) {
            const notification = active[i];
            const notifX = x;
            const notifY = y - offsetY - notifHeight;
            
            // Calculate fade based on remaining time
            let alpha = 255;
            if (notification.duration > 0) {
                const elapsed = Date.now() - notification.timestamp;
                const remaining = notification.duration - elapsed;
                if (remaining < 500) {
                    // Fade out in last 500ms
                    alpha = (remaining / 500) * 255;
                }
            }
            
            // Background
            const bgColor = this.getColor(notification.type);
            const rgb = this._hexToRgb(bgColor);
            fill(rgb.r, rgb.g, rgb.b, alpha * 0.9);
            stroke(255, 255, 255, alpha);
            strokeWeight(2);
            rect(notifX, notifY, notifWidth, notifHeight, 5);
            
            // Text
            fill(255, 255, 255, alpha);
            noStroke();
            text(notification.message, notifX + 10, notifY + notifHeight / 2);
            
            offsetY += notifHeight + spacing;
        }
        
        pop();
    }
    
    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color code
     * @returns {Object} {r, g, b}
     * @private
     */
    _hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}
