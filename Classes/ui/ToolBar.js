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
     * @param {Array<Object>} toolConfigs - Optional tool configurations [{name, icon, tooltip}]
     */
    constructor(toolConfigs = null) {
        this.selectedTool = toolConfigs ? toolConfigs[0].name : 'brush';
        
        // If tool configs provided, use them
        if (toolConfigs) {
            this.tools = {};
            this.groups = { 'tools': [] };
            
            toolConfigs.forEach(config => {
                this.tools[config.name] = {
                    name: config.name,
                    icon: config.icon || '🔧',
                    tooltip: config.tooltip || config.name,
                    shortcut: config.shortcut || '',
                    group: 'tools',
                    enabled: true
                };
                this.groups['tools'].push(config.name);
            });
        } else {
            // Default tools
            this.tools = {
                'brush': { name: 'Brush', icon: '🖌️', shortcut: 'B', group: 'drawing', enabled: true },
                'fill': { name: 'Fill', icon: '🪣', shortcut: 'F', group: 'drawing', enabled: true },
                'rectangle': { name: 'Rectangle', icon: '▭', shortcut: 'R', group: 'drawing', enabled: true },
                'line': { name: 'Line', icon: '/', shortcut: 'L', group: 'drawing', enabled: true },
                'eyedropper': { name: 'Eyedropper', icon: '💧', shortcut: 'I', group: 'selection', enabled: true },
                'undo': { name: 'Undo', icon: '↶', shortcut: 'Ctrl+Z', group: 'edit', enabled: false },
                'redo': { name: 'Redo', icon: '↷', shortcut: 'Ctrl+Y', group: 'edit', enabled: false }
            };
            
            // Tool groups
            this.groups = {
                'drawing': ['brush', 'fill', 'rectangle', 'line'],
                'selection': ['eyedropper'],
                'edit': ['undo', 'redo']
            };
        }
    }
    
    /**
     * Select a tool
     * @param {string} tool - Tool name
     * @returns {boolean} True if tool exists
     */
    selectTool(tool) {
        if (this.tools[tool]) {
            this.selectedTool = tool;
            return true;
        }
        return false;
    }
    
    /**
     * Get currently selected tool
     * @returns {string} Tool name
     */
    getSelectedTool() {
        return this.selectedTool;
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
        return this.tools[tool] ? this.tools[tool].enabled : false;
    }
    
    /**
     * Enable or disable a tool
     * @param {string} tool - Tool name
     * @param {boolean} enabled - Enabled state
     */
    setEnabled(tool, enabled) {
        if (this.tools[tool]) {
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
        return Object.keys(this.tools);
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
        
        let buttonY = panelY + 30;
        
        for (const toolName of tools) {
            const buttonX = panelX + spacing;
            
            // Check if click is within this button
            if (mouseX >= buttonX && mouseX <= buttonX + buttonSize &&
                mouseY >= buttonY && mouseY <= buttonY + buttonSize) {
                // Only select if tool is enabled or if it's a drawing tool
                const tool = this.tools[toolName];
                if (tool.enabled || tool.group === 'drawing' || tool.group === 'selection') {
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
        const panelHeight = tools.length * (buttonSize + spacing) + spacing + 30;
        
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
        
        // Background panel
        fill(40, 40, 40, 230);
        stroke(100, 150, 255);
        strokeWeight(2);
        rect(x, y, panelWidth, panelHeight, 5);
        
        // Title
        fill(255);
        noStroke();
        textAlign(CENTER, TOP);
        textSize(14);
        text('Tools', x + panelWidth / 2, y + 5);
        
        // Tool buttons
        let buttonY = y + 30;
        
        tools.forEach(toolName => {
            const tool = this.tools[toolName];
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
