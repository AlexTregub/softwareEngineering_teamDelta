/**
 * EditorTool.js
 * Base class for editor tools (brushes, erasers, fill, eyedropper, etc.)
 * Extends UIObject with tool activation, hover, and click handling
 */

if (typeof UIObject === 'undefined') {
    if (typeof require !== 'undefined') {
        UIObject = require('./UIObject.js');
    } else {
        throw new Error('EditorTool: UIObject must be loaded first');
    }
}

class EditorTool extends UIObject {
    constructor(config = {}) {
        super(config);
        
        this.toolName = config.toolName || 'Tool';
        this.icon = config.icon || '';
        this.tooltip = config.tooltip || '';
        this.active = false;
    }
    
    activate() {
        this.active = true;
        this.markDirty();
    }
    
    deactivate() {
        this.active = false;
        this.markDirty();
    }
    
    isActive() {
        return this.active;
    }
    
    handleHover(x, y) {
        // Override in subclass
    }
    
    handleClick(x, y) {
        // Override in subclass
    }
}

if (typeof window !== 'undefined') {
    window.EditorTool = EditorTool;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditorTool;
}
