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
                x: options.position?.x ?? -350,
                y: options.position?.y ?? -250
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
        
        // Listen for entity registration
        this.listeners.entityRegistered = (data) => {
            this._handleEntityRegistered(data);
        };
        eventBus.on('ENTITY_REGISTERED', this.listeners.entityRegistered);
        
        // Listen for entity unregistration
        this.listeners.entityUnregistered = (data) => {
            this._handleEntityUnregistered(data);
        };
        eventBus.on('ENTITY_UNREGISTERED', this.listeners.entityUnregistered);
        
        // Listen for ant details response
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
     * Handle ENTITY_REGISTERED event
     * @private
     */
    _handleEntityRegistered(data) {
        // Only count player faction ants
        if (data.type !== 'ant' || data.faction !== this.faction) return;
        
        const jobName = data.metadata?.jobName || 'Unknown';
        this.antCounts[jobName] = (this.antCounts[jobName] || 0) + 1;
        this.antCounts.total = (this.antCounts.total || 0) + 1;
        
        this._updateDisplay(this.antCounts);
    }
    
    /**
     * Handle ENTITY_UNREGISTERED event
     * @private
     */
    _handleEntityUnregistered(data) {
        // Only count player faction ants
        if (data.type !== 'ant' || data.faction !== this.faction) return;
        
        const jobName = data.metadata?.jobName || 'Unknown';
        if (this.antCounts[jobName] > 0) {
            this.antCounts[jobName]--;
        }
        if (this.antCounts.total > 0) {
            this.antCounts.total--;
        }
        
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
            if (this.listeners.entityRegistered) {
                eventBus.off('ENTITY_REGISTERED', this.listeners.entityRegistered);
            }
            if (this.listeners.entityUnregistered) {
                eventBus.off('ENTITY_UNREGISTERED', this.listeners.entityUnregistered);
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
