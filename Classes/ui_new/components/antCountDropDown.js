/**
 * AntCountDropDown Component
 * @module ui_new/components/antCountDropDown
 * 
 * Displays player faction ant counts by job type using a dropdown menu.
 * Integrates with EntityManager via EventBus for real-time updates.
 */

class AntCountDropDown {
    /**
     * Create an AntCountDropDown
     * @param {Object} p5Instance - p5.js instance for rendering
     * @param {Object} [options={}] - Configuration options
     * @param {string} [options.faction='player'] - Faction to display (only 'player' supported)
     * @param {Object} [options.position] - Menu position
     * @param {number} [options.position.x=-350] - X coordinate (relative to center)
     * @param {number} [options.position.y=-250] - Y coordinate (relative to center)
     */
    constructor(p5Instance, options = {}) {
        this.p5 = p5Instance;
        this.faction = 'player'; // Only player faction supported
        
        // Ant count storage
        this.antCounts = {
            total: 0
        };
        
        // Display line tracking
        this.displayLines = new Map();
        
        // Event listener references
        this.listeners = {
            entityRegistered: null,
            entityUnregistered: null,
            antDetailsResponse: null
        };
        
        // Create title line
        const titleLine = InformationLine ? new InformationLine({
            caption: 'Player Ants',
            textSize: 14
        }) : null;
        
        // Create dropdown menu
        this.menu = new DropDownMenu(p5Instance, {
            titleLine: titleLine,
            position: {
                x: 1920,
                y: 1080
            },
            size: {
                width: options.size?.width ?? 200,
                height: options.size?.height ?? 300
            }
        });
        
        this._setupEventListeners();
        this._queryInitialCounts();
    }
    
    /**
     * Setup EventBus listeners
     * @private
     */
    _setupEventListeners() {
        if (!eventBus) return;
        
        // Listen for entity count updates from EntityManager
        this.listeners.countsUpdated = (data) => {
            this._handleCountsUpdated(data);
        };
        eventBus.on('ENTITY_COUNTS_UPDATED', this.listeners.countsUpdated);
        
        // Listen for ant details response (for initial query)
        this.listeners.antDetailsResponse = (data) => {
            this._handleAntDetailsResponse(data);
        };
        eventBus.on('ANT_DETAILS_RESPONSE', this.listeners.antDetailsResponse);
    }
    
    /**
     * Query initial ant counts from EntityManager
     * @private
     */
    _queryInitialCounts() {
        if (eventBus) {
            eventBus.emit('QUERY_ANT_DETAILS');
        }
    }
    
    /**
     * Handle ENTITY_COUNTS_UPDATED event
     * @private
     */
    _handleCountsUpdated(data) {
        // Extract player faction ant counts by job
        const playerAnts = data.factions?.[this.faction]?.ant || 0;
        const playerJobBreakdown = data.antJobsByFaction?.[this.faction] || {};
        
        // Reset counts
        this.antCounts = { total: playerAnts };
        
        // Update job breakdown (already filtered by faction)
        Object.keys(playerJobBreakdown).forEach(jobName => {
            this.antCounts[jobName] = playerJobBreakdown[jobName];
        });
        
        this._updateDisplay(this.antCounts);
    }
    
    /**
     * Handle ANT_DETAILS_RESPONSE event
     * @private
     */
    _handleAntDetailsResponse(data) {
        // Update counts from EntityManager
        this.antCounts.total = data.total || 0;
        
        // Update job breakdown
        if (data.breakdown) {
            Object.keys(data.breakdown).forEach(jobName => {
                this.antCounts[jobName] = data.breakdown[jobName];
            });
        }
        
        this._updateDisplay(this.antCounts);
    }
    
    /**
     * Update display lines to reflect current counts
     * @private
     * @param {Object} counts - Ant counts by job
     */
    _updateDisplay(counts) {
        const jobNames = Object.keys(counts).filter(key => key !== 'total');
        
        // Remove lines that are no longer in counts
        for (const [jobName, lineId] of this.displayLines.entries()) {
            if (!counts[jobName] || counts[jobName] === 0) {
                this.menu.removeInformationLine(lineId);
                this.displayLines.delete(jobName);
            }
        }
        
        // Update or create lines for each job
        jobNames.forEach(jobName => {
            const count = counts[jobName];
            
            if (count > 0) {
                // Update or create line
                if (!this.displayLines.has(jobName)) {
                    const line = this.menu.addInformationLine({
                        caption: `${jobName}: ${count}`,
                        textSize: 12
                    });
                    if (line && line.id) {
                        this.displayLines.set(jobName, line.id);
                    }
                } else {
                    // Update existing line
                    const lineId = this.displayLines.get(jobName);
                    const line = this.menu.informationLines.get(lineId);
                    if (line && line.setCaption) {
                        line.setCaption(`${jobName}: ${count}`);
                    }
                }
            }
        });
    }
    
    /**
     * Register interactive handlers with RenderManager
     * Should be called AFTER all other interactive elements are registered
     * to ensure this component has highest priority
     */
    registerInteractive() {
        if (typeof RenderManager === 'undefined') return;
        
        RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
            id: 'ant-count-display',
            hitTest: (pointer) => {
                if (!this.menu || typeof GameState === 'undefined') return false;
                if (GameState.getState() !== 'PLAYING') return false;
                
                // RenderManager passes pointer.screen.x/y for UI layers
                const x = pointer.screen ? pointer.screen.x : pointer.x;
                const y = pointer.screen ? pointer.screen.y : pointer.y;
                
                return this.menu.isMouseOver ? this.menu.isMouseOver(x, y) : false;
            },
            onPointerDown: (pointer) => {
                if (!this.menu || typeof GameState === 'undefined') return false;
                if (GameState.getState() !== 'PLAYING') return false;
                
                // RenderManager passes pointer.screen.x/y for UI layers
                const x = pointer.screen ? pointer.screen.x : pointer.x;
                const y = pointer.screen ? pointer.screen.y : pointer.y;
                
                return this.menu.handleClick ? this.menu.handleClick(x, y) : false;
            }
        });
    }
    
    /**
     * Render the dropdown
     */
    render() {
        if (this.menu.update) {
            this.menu.update();
        }
        this.menu.render();
    }
    
    /**
     * Cleanup event listeners
     */
    destroy() {
        if (eventBus) {
            if (this.listeners.countsUpdated) {
                eventBus.off('ENTITY_COUNTS_UPDATED', this.listeners.countsUpdated);
            }
            if (this.listeners.antDetailsResponse) {
                eventBus.off('ANT_DETAILS_RESPONSE', this.listeners.antDetailsResponse);
            }
        }
        
        if (this.menu) {
            this.menu.destroy();
        }
    }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AntCountDropDown;
}

// Browser global
if (typeof window !== 'undefined') {
    window.AntCountDropDown = AntCountDropDown;
}
