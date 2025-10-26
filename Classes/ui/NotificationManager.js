/**
 * NotificationManager - UI component for user notifications
 * 
 * Manages toast-style notifications with:
 * - Multiple notification types (info, success, warning, error)
 * - Auto-dismiss functionality
 * - Type-based color coding
 */
class NotificationManager {
    /**
     * Create a notification manager
     * @param {number} defaultDuration - Default display duration in ms (default: 3000)
     */
    constructor(defaultDuration = 3000) {
        this.notifications = [];
        this.defaultDuration = defaultDuration;
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
        return notification;
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
     * @param {number} x - Center X position
     * @param {number} y - Top Y position
     */
    render(x, y) {
        if (typeof push === 'undefined') {
            // p5.js not available
            return;
        }
        
        const active = this.getNotifications();
        if (active.length === 0) return;
        
        push();
        
        const notifWidth = 300;
        const notifHeight = 40;
        const spacing = 10;
        let offsetY = 0;
        
        textAlign(CENTER, CENTER);
        textSize(14);
        
        active.forEach((notification, index) => {
            const notifX = x - notifWidth / 2;
            const notifY = y + offsetY;
            
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
            text(notification.message, x, notifY + notifHeight / 2);
            
            offsetY += notifHeight + spacing;
        });
        
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
