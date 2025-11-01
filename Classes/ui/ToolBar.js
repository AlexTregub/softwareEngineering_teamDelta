/**
 * ToolBar - UI component for tool selection
 * 
 * Provides a toolbar with various terrain editing tools:
 * - Brush, Fill, Rectangle, Line drawing tools
 * - Eyedropper for material sampling
 * - Undo/Redo actions
 * - Keyboard shortcuts
 * - Tool grouping
 */
class ToolBar {
    /**
     * Create a toolbar
     * @param {Array<Object>} toolConfigs - Optional tool configurations [{name, icon, tooltip, hasModes, modes}]
     */
    constructor(toolConfigs = null) {
        // Default to No Tool mode (null) - user must explicitly select a tool
        this.selectedTool = null;
        this.activeTool = null; // For consistency with test naming
        this.activeMode = null; // Current mode for active tool
        
        // Callback for tool changes
        this.onToolChange = null;
        
        // Store last mode per tool (for mode persistence)
        this.toolLastMode = new Map();
        
        // If tool configs provided, use them
        if (toolConfigs) {
            this.tools = toolConfigs; // Store as array for modes support
            this.groups = { 'tools': [] };
            
            toolConfigs.forEach(config => {
                this.groups['tools'].push(config.id || config.name);
                
                // Initialize last mode for tools with modes
                if (config.hasModes && config.modes && config.modes.length > 0) {
                    this.toolLastMode.set(config.id || config.name, config.modes[0]);
                }
            });
        } else {
            // Default tools
            this.tools = {
                'brush': { name: 'Brush', icon: '🖌️', shortcut: 'B', group: 'drawing', enabled: true },
                'eraser': { name: 'Eraser', icon: '🧱', shortcut: 'E', group: 'drawing', enabled: true },
                'fill': { name: 'Fill', icon: '🪣', shortcut: 'F', group: 'drawing', enabled: true },
                'rectangle': { name: 'Rectangle', icon: '▭', shortcut: 'R', group: 'drawing', enabled: true },
                'line': { name: 'Line', icon: '/', shortcut: 'L', group: 'drawing', enabled: true },
                'eyedropper': { name: 'Eyedropper', icon: '💧', shortcut: 'I', group: 'selection', enabled: true },
                'undo': { name: 'Undo', icon: '↶', shortcut: 'Ctrl+Z', group: 'edit', enabled: false },
                'redo': { name: 'Redo', icon: '↷', shortcut: 'Ctrl+Y', group: 'edit', enabled: false }
            };
            
            // Tool groups
            this.groups = {
                'drawing': ['brush', 'eraser', 'fill', 'rectangle', 'line'],
                'selection': ['eyedropper'],
                'edit': ['undo', 'redo']
            };
        }
    }
    
    /**
     * Select a tool
     * @param {string} toolId - Tool ID
     * @returns {boolean} True if tool exists
     */
    selectTool(toolId) {
        // Handle both object-based tools (array) and legacy string-based tools (object)
        const toolExists = Array.isArray(this.tools) ? 
            this.tools.some(t => (t.id || t.name) === toolId) :
            this.tools[toolId];
            
        if (toolExists) {
            const oldTool = this.selectedTool;
            this.selectedTool = toolId;
            this.activeTool = toolId; // Sync with activeTool
            
            // Handle modes for tools with mode support
            const tool = Array.isArray(this.tools) ? 
                this.tools.find(t => (t.id || t.name) === toolId) :
                this.tools[toolId];
            
            if (tool && tool.hasModes && tool.modes && tool.modes.length > 0) {
                // Set mode to last used mode, or default to first mode
                this.activeMode = this.toolLastMode.get(toolId) || tool.modes[0];
            } else {
                // Clear mode for tools without modes
                this.activeMode = null;
            }
            
            // Call callback if tool changed
            if (oldTool !== toolId && this.onToolChange) {
                this.onToolChange(toolId, oldTool);
            }
            
            return true;
        }
        return false;
    }
    
    /**
     * Get currently selected tool
     * @returns {string|null} Tool name or null if no tool selected
     */
    getSelectedTool() {
        return this.selectedTool;
    }
    
    /**
     * Deselect the current tool (No Tool mode)
     * In No Tool mode, clicking terrain does nothing
     */
    deselectTool() {
        const oldTool = this.selectedTool;
        this.selectedTool = null;
        
        // Call callback if tool changed (not already null)
        if (oldTool !== null && this.onToolChange) {
            this.onToolChange(null, oldTool);
        }
    }
    
    /**
     * Check if any tool is currently active
     * @returns {boolean} True if tool selected, false if No Tool mode
     */
    hasActiveTool() {
        return this.selectedTool !== null && this.selectedTool !== undefined;
    }
    
    /**
     * Get modes array for a tool
     * @param {string} toolId - Tool ID
     * @returns {Array<string>|null} Modes array or null if tool has no modes
     */
    getToolModes(toolId) {
        if (!Array.isArray(this.tools)) {
            return null; // Legacy tools don't have modes
        }
        
        const tool = this.tools.find(t => (t.id || t.name) === toolId);
        if (tool && tool.hasModes && tool.modes) {
            return tool.modes;
        }
        
        return null;
    }
    
    /**
     * Set mode for active tool
     * @param {string} mode - Mode to set
     * @throws {Error} If no active tool, tool has no modes, or mode is invalid
     */
    setToolMode(mode) {
        if (!this.activeTool) {
            throw new Error('Cannot set mode: no active tool');
        }
        
        const modes = this.getToolModes(this.activeTool);
        if (!modes) {
            throw new Error(`Cannot set mode: tool "${this.activeTool}" has no modes`);
        }
        
        if (!modes.includes(mode)) {
            throw new Error(`Invalid mode "${mode}" for tool "${this.activeTool}". Valid modes: ${modes.join(', ')}`);
        }
        
        this.activeMode = mode;
        this.toolLastMode.set(this.activeTool, mode); // Remember for next time
    }
    
    /**
     * Get current mode for active tool
     * @returns {string|null} Current mode or null if no active tool or tool has no modes
     */
    getCurrentMode() {
        if (!this.activeTool) {
            return null;
        }
        
        const modes = this.getToolModes(this.activeTool);
        if (!modes) {
            return null; // Tool has no modes
        }
        
        return this.activeMode;
    }
    
    /**
     * Get mode render data for FileMenuBar integration
     * @returns {Object|null} {hasModes, modes, currentMode} or null
     */
    getModeRenderData() {
        if (!this.activeTool) {
            return null;
        }
        
        const modes = this.getToolModes(this.activeTool);
        if (!modes) {
            return null;
        }
        
        return {
            hasModes: true,
            modes: modes,
            currentMode: this.activeMode
        };
    }
    
    /**
     * Get keyboard shortcut for a tool
     * @param {string} tool - Tool name
     * @returns {string|null} Shortcut key(s)
     */
    getShortcut(tool) {
        return this.tools[tool] ? this.tools[tool].shortcut : null;
    }
    
    /**
     * Check if a tool is enabled
     * @param {string} tool - Tool name
     * @returns {boolean} True if enabled
     */
    isEnabled(tool) {
        const toolObj = Array.isArray(this.tools) ?
            this.tools.find(t => (t.id || t.name) === tool) :
            this.tools[tool];
        return toolObj ? toolObj.enabled : false;
    }
    
    /**
     * Enable or disable a tool
     * @param {string} tool - Tool name
     * @param {boolean} enabled - Enabled state
     */
    setEnabled(tool, enabled) {
        if (Array.isArray(this.tools)) {
            const toolObj = this.tools.find(t => (t.id || t.name) === tool);
            if (toolObj) {
                toolObj.enabled = enabled;
            }
        } else if (this.tools[tool]) {
            this.tools[tool].enabled = enabled;
        }
    }
    
    /**
     * Get group for a tool
     * @param {string} tool - Tool name
     * @returns {string|null} Group name
     */
    getToolGroup(tool) {
        for (const [group, tools] of Object.entries(this.groups)) {
            if (tools.includes(tool)) {
                return group;
            }
        }
        return null;
    }
    
    /**
     * Get all tools in a group
     * @param {string} group - Group name
     * @returns {Array<string>} Tool names
     */
    getToolsByGroup(group) {
        return this.groups[group] || [];
    }
    
    /**
     * Get all available tools
     * @returns {Array<string>} Tool names
     */
    getAllTools() {
        if (Array.isArray(this.tools)) {
            // Array-based config: extract tool names/ids
            return this.tools.map(t => t.id || t.name);
        }
        // Object-based config: return keys
        return Object.keys(this.tools);
    }
    
    /**
     * Add a custom button to the toolbar
     * @param {Object} config - Button configuration {name, icon, tooltip, onClick, group}
     */
    addButton(config) {
        const name = config.name;
        const id = config.id || name;
        const group = config.group || 'custom';
        
        const toolConfig = {
            name: config.name,
            id: id,
            icon: config.icon || '🔧',
            tooltip: config.tooltip || config.name,
            shortcut: config.shortcut || '',
            group: group,
            enabled: true,
            onClick: config.onClick || null,
            highlighted: config.highlighted || false
        };
        
        // Handle both array and object storage
        if (Array.isArray(this.tools)) {
            // Array-based: push new tool
            this.tools.push(toolConfig);
        } else {
            // Object-based: add as property
            this.tools[name] = toolConfig;
        }
        
        // Add to group
        if (!this.groups[group]) {
            this.groups[group] = [];
        }
        this.groups[group].push(name);
    }
    
    /**
     * Get tool info
     * @param {string} tool - Tool name
     * @returns {Object|null} Tool metadata
     */
    getToolInfo(tool) {
        return this.tools[tool] || null;
    }
    
    /**
     * Find tool by shortcut
     * @param {string} shortcut - Keyboard shortcut
     * @returns {string|null} Tool name
     */
    getToolByShortcut(shortcut) {
        for (const [tool, info] of Object.entries(this.tools)) {
            if (info.shortcut === shortcut) {
                return tool;
            }
        }
        return null;
    }
    
    /**
     * Get content size for panel auto-sizing
     * @returns {Object} {width, height} Content dimensions in pixels
     */
    getContentSize() {
        const buttonSize = 35;
        const spacing = 5;
        const tools = this.getAllTools();
        
        const width = buttonSize + spacing * 2;
        const height = tools.length * (buttonSize + spacing) + spacing;
        
        return { width, height };
    }
    
    /**
     * Handle mouse click
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @param {number} panelX - Panel X position
     * @param {number} panelY - Panel Y position
     * @returns {string|null} Tool name if clicked, null otherwise
     */
    handleClick(mouseX, mouseY, panelX, panelY) {
        const buttonSize = 35;
        const spacing = 5;
        const tools = this.getAllTools();
        
        let buttonY = panelY + spacing;
        
        for (const toolName of tools) {
            const buttonX = panelX + spacing;
            
            // Check if click is within this button
            if (mouseX >= buttonX && mouseX <= buttonX + buttonSize &&
                mouseY >= buttonY && mouseY <= buttonY + buttonSize) {
                
                // Get tool object (handle both array and object storage)
                const tool = Array.isArray(this.tools) ?
                    this.tools.find(t => (t.id || t.name) === toolName) :
                    this.tools[toolName];
                
                if (!tool) {
                    return null;
                }
                
                // Call onClick callback if it exists (for custom buttons)
                if (tool.onClick) {
                    tool.onClick();
                    return toolName;
                }
                
                // Only select if tool is enabled (default to enabled if not specified)
                // OR if it's a drawing/selection tool
                const isEnabled = tool.enabled !== false; // Default to true
                if (isEnabled || tool.group === 'drawing' || tool.group === 'selection') {
                    this.selectTool(toolName);
                    return toolName;
                }
                return null;
            }
            
            buttonY += buttonSize + spacing;
        }
        
        return null;
    }
    
    /**
     * Check if point is within the toolbar panel
     * @param {number} mouseX - Mouse X coordinate
     * @param {number} mouseY - Mouse Y coordinate
     * @param {number} panelX - Panel X position
     * @param {number} panelY - Panel Y position
     * @returns {boolean} True if within bounds
     */
    containsPoint(mouseX, mouseY, panelX, panelY) {
        const buttonSize = 35;
        const spacing = 5;
        const tools = this.getAllTools();
        const panelWidth = buttonSize + spacing * 2;
        const panelHeight = tools.length * (buttonSize + spacing) + spacing;
        
        return mouseX >= panelX && mouseX <= panelX + panelWidth &&
               mouseY >= panelY && mouseY <= panelY + panelHeight;
    }
    
    /**
     * Render the toolbar
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    render(x, y) {
        if (typeof push === 'undefined') {
            // p5.js not available
            return;
        }
        
        push();
        
        const buttonSize = 35;
        const spacing = 5;
        const tools = this.getAllTools();
        const panelWidth = buttonSize + spacing * 2;
        const panelHeight = tools.length * (buttonSize + spacing) + spacing + 30;
        
        // NO background panel or title - draggable panel provides this
        
        // Tool buttons
        let buttonY = y + spacing;
        
        tools.forEach(toolName => {
            // Get tool object (handle both array and object storage)
            const tool = Array.isArray(this.tools) ?
                this.tools.find(t => (t.id || t.name) === toolName) :
                this.tools[toolName];
            
            if (!tool) return; // Skip if tool not found
            
            const isSelected = this.selectedTool === toolName;
            const enabled = this.isEnabled(toolName);
            
            // Button background
            if (isSelected) {
                fill(100, 150, 255, 200);
            } else if (enabled) {
                fill(60, 60, 60);
            } else {
                fill(40, 40, 40);
            }
            
            stroke(enabled ? 150 : 80);
            strokeWeight(isSelected ? 2 : 1);
            rect(x + spacing, buttonY, buttonSize, buttonSize, 3);
            
            // Tool icon
            fill(enabled ? 255 : 100);
            noStroke();
            textAlign(CENTER, CENTER);
            textSize(20);
            const icon = tool.icon || '🔧';
            text(icon, x + spacing + buttonSize / 2, buttonY + buttonSize / 2);
            
            buttonY += buttonSize + spacing;
        });
        
        pop();
    }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToolBar;
}
