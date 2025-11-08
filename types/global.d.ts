/**
 * @fileoverview Automatic Global Type Declarations
 * @description This file declares global variables that VS Code can automatically 
 * link to your existing class definitions via JSDoc comments in those files.
 * 
 * BENEFITS:
 * - No manual maintenance of type definitions
 * - Automatically picks up changes when you modify class methods
 * - IntelliSense works immediately after adding JSDoc to class files
 * - One-time setup, works forever
 */

// =============================================================================
// GLOBAL INSTANCES - VS Code will auto-detect types from class files
// =============================================================================

/**
 * Global draggable panel manager instance
 * @global
 * @type {DraggablePanelManager}
 */
declare var draggablePanelManager;

/**
 * Global button group manager instance  
 * @global
 * @type {ButtonGroupManager}
 */
declare var buttonGroupManager;

/**
 * Global ant manager instance
 * @global
 * @type {AntManager}
 */
declare var g_antManager;

/**
 * Global resource system manager
 * @global
 * @type {ResourceSystemManager}
 */
declare var g_entityInventoryManager;

/**
 * Global game state manager
 * @global  
 * @type {GameStateManager}
 */
declare var g_gameStateManager;

/**
 * Global performance monitor
 * @global
 * @type {PerformanceMonitor}
 */
declare var g_performanceMonitor;

/**
 * Global UI debug manager
 * @global
 * @type {UIDebugManager}
 */
declare var g_uiDebugManager;

/**
 * Global render layer manager
 * @global
 * @type {RenderLayerManager}
 */
declare var g_renderLayerManager;

// =============================================================================
// GLOBAL VARIABLES
// =============================================================================

/**
 * Canvas width
 * @global
 * @type {number}
 */
declare var g_canvasX;

/**
 * Canvas height
 * @global
 * @type {number}
 */
declare var g_canvasY;

/**
 * Game arrays
 * @global
 * @type {Array<any>}
 */
declare var ants;

/**
 * @global
 * @type {Array<any>}
 */
declare var resources;

// =============================================================================
// p5.js GLOBALS
// =============================================================================

/**
 * @global
 * @type {number}
 */
declare var mouseX, mouseY, width, height;

/**
 * @global
 * @type {boolean}
 */
declare var mouseIsPressed;

// =============================================================================
// GLOBAL FUNCTIONS - VS Code will auto-detect from JSDoc in source files
// =============================================================================

/**
 * Execute debug command - types auto-detected from debug/commandLine.js
 * @global
 * @type {(command: string) => void}
 */
declare function executeCommand(command: string): void;

/**
 * Open command line - types auto-detected from debug/commandLine.js
 * @global
 * @type {() => boolean}
 */
declare function openCommandLine(): boolean;

/**
 * Close command line - types auto-detected from debug/commandLine.js
 * @global
 * @type {() => void}
 */
declare function closeCommandLine(): void;