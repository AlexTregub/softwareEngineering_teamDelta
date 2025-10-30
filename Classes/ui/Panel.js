/**
 * Panel.js
 * Base class for collapsible panels (properties, sidebar, etc.)
 * Extends UIObject with title, collapse/expand functionality
 */

if (typeof UIObject === 'undefined') {
    if (typeof require !== 'undefined') {
        UIObject = require('./UIObject.js');
    } else {
        throw new Error('Panel: UIObject must be loaded first');
    }
}

class Panel extends UIObject {
    constructor(config = {}) {
        super(config);
        
        this.title = config.title || 'Panel';
        this.collapsible = config.collapsible !== false;
        this.collapsed = config.collapsed || false;
    }
    
    collapse() {
        if (!this.collapsible) return;
        
        this.collapsed = true;
        this.markDirty();
    }
    
    expand() {
        this.collapsed = false;
        this.markDirty();
    }
    
    toggleCollapse() {
        if (this.collapsed) {
            this.expand();
        } else {
            this.collapse();
        }
        return this.collapsed;
    }
    
    isCollapsed() {
        return this.collapsed;
    }
    
    setTitle(title) {
        this.title = title;
        this.markDirty();
    }
}

if (typeof window !== 'undefined') {
    window.Panel = Panel;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Panel;
}
