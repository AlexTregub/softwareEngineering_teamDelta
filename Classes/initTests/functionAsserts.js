/**
 * @fileoverview functionAsserts centralizes asserts to make sure that functions
 * the game is going to be using exists. If any assert fails, the game should not render
 * and display an error message.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Centralized function assertions for the rendering system
 * Checks all required dependencies at startup to prevent runtime errors
 */
class FunctionAsserts {
    constructor() {
        this.assertionResults = {
            p5js: false,
            globalDependencies: false,
            renderingFunctions: false,
            gameSystems: false,
            allPassed: false
        };
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Run all assertion checks - call this at game startup
     * @returns {boolean} True if all critical assertions pass
     */
    runAllAsserts() {
        logNormal('🔍 Running rendering system function assertions...');
        
        this.assertP5JSFunctions();
        this.assertGlobalDependencies();
        this.assertRenderingFunctions();
        this.assertGameSystems();
        
        this.assertionResults.allPassed = this.errors.length === 0;
        this.displayResults();
        
        return this.assertionResults.allPassed;
    }

    /**
     * Assert that all required p5.js functions are available
     */
    assertP5JSFunctions() {
        const requiredP5Functions = [
            'stroke', 'fill', 'rect', 'ellipse', 'text', 'image',
            'strokeWeight', 'noFill', 'noStroke', 'push', 'pop',
            'translate', 'rotate', 'scale', 'createVector',
            'textAlign', 'textSize', 'imageMode', 'tint', 'noTint',
            'smooth', 'noSmooth', 'radians', 'degrees'
        ];

        const missingFunctions = [];
        
        for (const funcName of requiredP5Functions) {
            if (typeof window[funcName] !== 'function') {
                missingFunctions.push(funcName);
            }
        }

        if (missingFunctions.length === 0) {
            this.assertionResults.p5js = true;
            logNormal('✅ p5.js functions available');
        } else {
            this.errors.push(`❌ Missing p5.js functions: ${missingFunctions.join(', ')}`);
            console.error('❌ p5.js functions missing:', missingFunctions);
        }
    }

    /**
     * Assert that global rendering dependencies exist
     */
    assertGlobalDependencies() {
        const requiredGlobals = [
            { name: 'g_canvasX', type: 'number', critical: true },
            { name: 'g_canvasY', type: 'number', critical: true },
            { name: 'TILE_SIZE', type: 'number', critical: false },
            { name: 'g_activeMap', type: 'object', critical: true },
            { name: 'g_resourceList', type: 'object', critical: true },
            { name: 'ants', type: 'object', critical: true },
            { name: 'g_uiDebugManager', type: 'object', critical: true }
        ];

        const missing = [];
        const warnings = [];

        for (const global of requiredGlobals) {
            const exists = typeof window[global.name] !== 'undefined';
            const correctType = exists && typeof window[global.name] === global.type;

            if (!exists) {
                if (global.critical) {
                    missing.push(global.name);
                } else {
                    warnings.push(`⚠️ Optional global '${global.name}' not found`);
                }
            } else if (!correctType && global.critical) {
                missing.push(`${global.name} (wrong type: expected ${global.type})`);
            }
        }

        if (missing.length === 0) {
            this.assertionResults.globalDependencies = true;
            logNormal('✅ Global dependencies available');
        } else {
            this.errors.push(`❌ Missing global dependencies: ${missing.join(', ')}`);
        }

        this.warnings.push(...warnings);
    }

    /**
     * Assert that rendering system functions exist
     */
    assertRenderingFunctions() {
        const requiredFunctions = [
            { name: 'renderCurrencies', critical: false },
            { name: 'debugRender', critical: false },
            { name: 'drawDebugGrid', critical: false },
            { name: 'updateMenu', critical: false },
            { name: 'renderMenu', critical: false },
            { name: 'antsUpdate', critical: true },
            { name: 'antsRender', critical: false },
            { name: 'antsUpdateAndRender', critical: false }
        ];

        const missing = [];
        const warnings = [];

        for (const func of requiredFunctions) {
            const exists = typeof window[func.name] === 'function';
            
            if (!exists) {
                if (func.critical) {
                    missing.push(func.name);
                } else {
                    warnings.push(`⚠️ Optional function '${func.name}' not found`);
                }
            }
        }

        // Check object methods
        const objectMethods = [
            { obj: 'g_activeMap', method: 'render', critical: true },
            { obj: 'g_resourceList', method: 'updateAll', critical: true },
            { obj: 'g_resourceList', method: 'drawAll', critical: true },
            { obj: 'g_selectionBoxController', method: 'draw', critical: false }
        ];

        for (const objMethod of objectMethods) {
            const obj = window[objMethod.obj];
            const hasMethod = obj && typeof obj[objMethod.method] === 'function';
            
            if (!hasMethod) {
                if (objMethod.critical) {
                    missing.push(`${objMethod.obj}.${objMethod.method}()`);
                } else {
                    warnings.push(`⚠️ Optional method '${objMethod.obj}.${objMethod.method}' not found`);
                }
            }
        }

        if (missing.length === 0) {
            this.assertionResults.renderingFunctions = true;
            logNormal('✅ Rendering functions available');
        } else {
            this.errors.push(`❌ Missing rendering functions: ${missing.join(', ')}`);
        }

        this.warnings.push(...warnings);
    }

    /**
     * Assert that game systems are properly initialized
     */
    assertGameSystems() {
        const systems = [];

        // Check ant system
        if (typeof window.ants === 'object' && typeof window.antIndex === 'number') {
            if (window.antIndex >= 0 && window.ants.length >= 0) {
                systems.push('✅ Ant system initialized');
            } else {
                this.errors.push('❌ Ant system in invalid state');
            }
        }

        // Check resource system
        if (window.g_resourceList && typeof window.g_resourceList === 'object') {
            if (window.g_resourceList.resources && Array.isArray(window.g_resourceList.resources)) {
                systems.push('✅ Resource system initialized');
            } else {
                this.warnings.push('⚠️ Resource system may not be fully initialized');
            }
        }

        // Check terrain system
        if (window.g_activeMap && typeof window.g_activeMap.render === 'function') {
            systems.push('✅ Terrain system initialized');
        }

        this.assertionResults.gameSystems = systems.length > 0;
        if (this.assertionResults.gameSystems) {
            logNormal('✅ Game systems initialized');
        }
    }

    /**
     * Display assertion results to console
     */
    displayResults() {
        logNormal('\n📊 Function Assertion Results:');
        logNormal(`p5.js Functions: ${this.assertionResults.p5js ? '✅' : '❌'}`);
        logNormal(`Global Dependencies: ${this.assertionResults.globalDependencies ? '✅' : '❌'}`);
        logNormal(`Rendering Functions: ${this.assertionResults.renderingFunctions ? '✅' : '❌'}`);
        logNormal(`Game Systems: ${this.assertionResults.gameSystems ? '✅' : '❌'}`);
        
        if (this.warnings.length > 0) {
            logNormal('\n⚠️ Warnings:');
            this.warnings.forEach(warning => logNormal(warning));
        }

        if (this.errors.length > 0) {
            logNormal('\n❌ Critical Errors:');
            this.errors.forEach(error => logNormal(error));
            logNormal('\n🚫 Rendering system cannot start safely!');
        } else {
            logNormal('\n🎉 All critical assertions passed - rendering system ready!');
        }
    }

    /**
     * Get assertion results for other systems
     * @returns {Object} Assertion results object
     */
    getResults() {
        return this.assertionResults;
    }

    /**
     * Check if p5.js functions are available (for legacy compatibility)
     * @returns {boolean} True if p5.js functions are available
     */
    static isP5Available() {
        return typeof stroke === 'function' && 
               typeof fill === 'function' && 
               typeof rect === 'function' &&
               typeof strokeWeight === 'function' &&
               typeof noFill === 'function' &&
               typeof noStroke === 'function';
    }

    /**
     * Safe wrapper for p5.js function calls (for legacy compatibility)
     * @param {function} renderFunction - Function containing p5.js calls
     * @param {string} context - Context for error reporting
     */
    static safeRender(renderFunction, context = 'Unknown') {
        if (!FunctionAsserts.isP5Available()) {
            console.warn(`${context}: p5.js functions not available, skipping render`);
            return;
        }
        try {
            renderFunction();
        } catch (error) {
            console.error(`${context}: Render error:`, error);
        }
    }
}

// Create global instance
const g_functionAsserts = new FunctionAsserts();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FunctionAsserts, g_functionAsserts };
}