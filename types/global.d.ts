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

/// <reference path="./draggable-panel-types.d.ts" />
/// <reference path="./components/slider-types.d.ts" />
/// <reference path="./controllers.d.ts" />
/// <reference path="./managers.d.ts" />

// =============================================================================
// GLOBAL INSTANCES - VS Code will auto-detect types from class files
// =============================================================================

// Minimal type stubs for global classes referenced by JSDoc above.
// These are intentionally lightweight so IntelliSense shows names without
// requiring full type definitions. If you have more specific types, keep
// them in separate files (e.g. draggable-panel-types.d.ts) and remove these.
interface DraggablePanelManager { [key: string]: any }
interface PlayerFactionSetup { [key: string]: any }
interface ButtonGroupManager { [key: string]: any }
interface AntManager { [key: string]: any }
interface ResourceSystemManager { [key: string]: any }
interface GameStateManager { [key: string]: any }
interface PerformanceMonitor { [key: string]: any }
interface UIDebugManager { [key: string]: any }
interface RenderLayerManager { [key: string]: any }


/**
 * Global draggable panel manager instance
 * @global
 * @type {DraggablePanelManager}
 */
declare var draggablePanelManager: DraggablePanelManager;

/**
 * Global player faction setup instance
 * @global
 * @type {PlayerFactionSetup}
 */
declare var g_playerFactionSetup: PlayerFactionSetup;

/**
 * Global button group manager instance  
 * @global
 * @type {ButtonGroupManager}
 */
declare var buttonGroupManager: ButtonGroupManager;

/**
 * Global ant manager instance
 * @global
 * @type {AntManager}
 */
declare var g_antManager: AntManager;

/**
 * Global resource system manager
 * @global
 * @type {ResourceSystemManager}
 */
declare var g_resourceManager: ResourceSystemManager;

/**
 * Global game state manager
 * @global  
 * @type {GameStateManager}
 */
declare var g_gameStateManager: GameStateManager;

/**
 * Global performance monitor
 * @global
 * @type {PerformanceMonitor}
 */
declare var g_performanceMonitor: PerformanceMonitor;

/**
 * Global UI debug manager
 * @global
 * @type {UIDebugManager}
 */
declare var g_uiDebugManager: UIDebugManager;

/**
 * Global render layer manager
 * @global
 * @type {RenderLayerManager}
 */
declare var g_renderLayerManager: RenderLayerManager;

// =============================================================================
// GLOBAL VARIABLES
// =============================================================================

/**
 * Canvas width
 * @global
 * @type {number}
 */
declare var g_canvasX: number;

/**
 * Canvas height
 * @global
 * @type {number}
 */
declare var g_canvasY: number;

/**
 * Game arrays
 * @global
 * @type {Array<any>}
 */
declare var ants: Array<any>;

/**
 * @global
 * @type {Array<any>}
 */
declare var resources: Array<any>;

// =============================================================================
// p5.js GLOBALS
// =============================================================================

/**
 * @global
 * @type {number}
 */
declare var mouseX: number, mouseY: number, width: number, height: number;

/**
 * @global
 * @type {boolean}
 */
declare var mouseIsPressed: boolean;

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

// =============================================================================
// Controller constructors and instance shapes (for IntelliSense)
// =============================================================================

declare type ControllerConstructor = new (...args: any[]) => any;

interface ControllerInstance {
  update?: () => void;
  render?: () => void;
  destroy?: () => void;
  init?: (...args: any[]) => void;
  [key: string]: any;
}

interface CameraControllerInstance extends ControllerInstance {
  focusOn?: (x: number, y: number) => void;
  setZoom?: (z: number) => void;
}

interface CombatControllerInstance extends ControllerInstance {
  engage?: (target: any) => void;
  disengage?: () => void;
}

interface DebugRendererInstance extends ControllerInstance {
  log?: (...args: any[]) => void;
}

interface FactionControllerInstance extends ControllerInstance {
  factionId?: string;
  setFaction?: (id: string) => void;
}

interface HealthControllerInstance extends ControllerInstance {
  entity: any;
  update: () => void;
  render: () => void;
  onDamage?: (amount: number, source?: any) => void;
  setVisible?: (visible: boolean) => void;
  getConfig?: () => any;
}

interface InputControllerInstance extends ControllerInstance {
  onKey?: (key: string, cb: Function) => void;
}

interface InteractionControllerInstance extends ControllerInstance {
  handleClick?: (x: number, y: number) => boolean;
}

interface InventoryControllerInstance extends ControllerInstance {
  addItem?: (item: any) => boolean;
  removeItem?: (id: string) => boolean;
}

interface KeyboardInputControllerInstance extends ControllerInstance {
  onKeyPress?: (cb: (keyCode: number, key: string) => void) => void;
}

interface MouseInputControllerInstance extends ControllerInstance {
  onMove?: (cb: (x: number, y: number) => void) => void;
}

interface MovementControllerInstance extends ControllerInstance {
  moveTo?: (x: number, y: number) => void;
}

interface RenderControllerInstance extends ControllerInstance {
  addEntity?: (entity: any) => void;
  removeEntity?: (entity: any) => void;
}

interface SelectionBoxControllerInstance extends ControllerInstance {
  selectArea?: (x1: number, y1: number, x2: number, y2: number) => any[];
}

interface SelectionControllerInstance extends ControllerInstance {
  select?: (id: string) => void;
  deselectAll?: () => void;
}

interface TaskManagerInstance extends ControllerInstance {
  assignTask?: (entity: any, task: any) => void;
}

interface TerrainControllerInstance extends ControllerInstance {
  getTileAt?: (x: number, y: number) => any;
}

interface TransformControllerInstance extends ControllerInstance {
  setPosition?: (entity: any, x: number, y: number) => void;
}

interface UISelectionControllerInstance extends ControllerInstance {
  handleClick?: (x: number, y: number) => boolean;
}

// Constructor declarations
declare var CameraController: { new(...args: any[]): CameraControllerInstance } & ControllerConstructor;
declare var CombatController: { new(...args: any[]): CombatControllerInstance } & ControllerConstructor;
declare var DebugRenderer: { new(...args: any[]): DebugRendererInstance } & ControllerConstructor;
declare var FactionController: { new(...args: any[]): FactionControllerInstance } & ControllerConstructor;
declare var HealthController: { new(...args: any[]): HealthControllerInstance } & ControllerConstructor;
declare var InputController: { new(...args: any[]): InputControllerInstance } & ControllerConstructor;
declare var InteractionController: { new(...args: any[]): InteractionControllerInstance } & ControllerConstructor;
declare var InventoryController: { new(...args: any[]): InventoryControllerInstance } & ControllerConstructor;
declare var KeyboardInputController: { new(...args: any[]): KeyboardInputControllerInstance } & ControllerConstructor;
declare var MouseInputController: { new(...args: any[]): MouseInputControllerInstance } & ControllerConstructor;
declare var MovementController: { new(...args: any[]): MovementControllerInstance } & ControllerConstructor;
declare var RenderController: { new(...args: any[]): RenderControllerInstance } & ControllerConstructor;
declare var SelectionBoxController: { new(...args: any[]): SelectionBoxControllerInstance } & ControllerConstructor;
declare var SelectionController: { new(...args: any[]): SelectionControllerInstance } & ControllerConstructor;
declare var TaskManager: { new(...args: any[]): TaskManagerInstance } & ControllerConstructor;
declare var TerrainController: { new(...args: any[]): TerrainControllerInstance } & ControllerConstructor;
declare var TransformController: { new(...args: any[]): TransformControllerInstance } & ControllerConstructor;
declare var UISelectionController: { new(...args: any[]): UISelectionControllerInstance } & ControllerConstructor;
declare var AntUtilities: any;

// Window globals
declare global {
  interface Window {
    CameraController: typeof CameraController;
    CombatController: typeof CombatController;
    DebugRenderer: typeof DebugRenderer;
    FactionController: typeof FactionController;
    HealthController: typeof HealthController;
    InputController: typeof InputController;
    InteractionController: typeof InteractionController;
    InventoryController: typeof InventoryController;
    KeyboardInputController: typeof KeyboardInputController;
    MouseInputController: typeof MouseInputController;
    MovementController: typeof MovementController;
    RenderController: typeof RenderController;
    SelectionBoxController: typeof SelectionBoxController;
    SelectionController: typeof SelectionController;
    TaskManager: typeof TaskManager;
    TerrainController: typeof TerrainController;
    TransformController: typeof TransformController;
    UISelectionController: typeof UISelectionController;
    AntUtilities: any;
  }
}

export {};