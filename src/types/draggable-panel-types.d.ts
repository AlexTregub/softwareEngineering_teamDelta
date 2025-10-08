/**
 * TypeScript definitions for Draggable Panel System
 * Provides IntelliSense support in IDEs
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

declare namespace DraggablePanelSystem {
  // =============================================================================
  // BASIC TYPES
  // =============================================================================
  
  /**
   * 2D position coordinates
   */
  interface Position {
    x: number;
    y: number;
  }
  
  /**
   * 2D size dimensions
   */
  interface Size {
    width: number;
    height: number;
  }
  
  /**
   * RGBA color array
   */
  type ColorArray = [number, number, number, number?];
  
  /**
   * RGB color array
   */
  type RGBArray = [number, number, number];
  
  // =============================================================================
  // PANEL CONFIGURATION TYPES
  // =============================================================================
  
  /**
   * Visual styling configuration for panels
   */
  interface PanelStyle {
    /** Background color as RGBA array [r, g, b, a] */
    backgroundColor?: ColorArray;
    /** Title text color as RGB array [r, g, b] */
    titleColor?: RGBArray;
    /** Content text color as RGB array [r, g, b] */
    textColor?: RGBArray;
    /** Border color as RGB array [r, g, b] */
    borderColor?: RGBArray;
    /** Height of title bar in pixels */
    titleBarHeight?: number;
    /** Internal padding in pixels */
    padding?: number;
    /** Corner radius for rounded corners */
    cornerRadius?: number;
    /** Content font size in pixels */
    fontSize?: number;
    /** Title font size in pixels */
    titleFontSize?: number;
  }
  
  /**
   * Behavioral configuration for panels
   */
  interface PanelBehavior {
    /** Whether the panel can be dragged by title bar */
    draggable?: boolean;
    /** Whether to save position to localStorage */
    persistent?: boolean;
    /** Whether to snap to screen edges when dragging */
    snapToEdges?: boolean;
    /** Whether to constrain panel within screen bounds */
    constrainToScreen?: boolean;
  }
  
  /**
   * Button configuration
   */
  interface ButtonConfig {
    /** Button display text */
    caption: string;
    /** Function called when button is clicked */
    onClick: () => void;
    /** Optional button style overrides */
    style?: any;
    /** Optional button image */
    image?: string;
    /** Button width override */
    width?: number;
    /** Button height override */
    height?: number;
  }
  
  /**
   * Button layout configuration
   */
  interface ButtonsConfig {
    /** Array of button configurations */
    items: ButtonConfig[];
    /** Layout type for buttons */
    layout?: 'vertical' | 'horizontal' | 'grid';
    /** Spacing between buttons in pixels */
    spacing?: number;
    /** Default button height in pixels */
    buttonHeight?: number;
    /** Default button width in pixels */
    buttonWidth?: number;
    /** Number of columns for grid layout */
    columns?: number;
  }
  
  /**
   * Complete panel configuration
   */
  interface PanelConfig {
    /** Unique panel identifier */
    id: string;
    /** Panel title displayed in title bar */
    title: string;
    /** Initial panel position */
    position: Position;
    /** Panel dimensions */
    size: Size;
    /** Visual styling options */
    style?: PanelStyle;
    /** Behavioral options */
    behavior?: PanelBehavior;
    /** Button configuration */
    buttons?: ButtonsConfig;
    /** Initial visibility state */
    visible?: boolean;
    /** Initial minimized state */
    minimized?: boolean;
  }
  
  /**
   * Content rendering area passed to content renderers
   */
  interface ContentArea {
    /** X position of content area */
    x: number;
    /** Y position of content area */
    y: number;
    /** Width of content area */
    width: number;
    /** Height of content area */
    height: number;
  }
  
  /**
   * Content renderer function type
   */
  type ContentRenderer = (contentArea: ContentArea, style: PanelStyle) => void;
  
  // =============================================================================
  // DRAGGABLE PANEL CLASS
  // =============================================================================
  
  /**
   * Main draggable panel class
   */
  class DraggablePanel {
    /**
     * Creates a new draggable panel
     * @param config Panel configuration object
     */
    constructor(config: PanelConfig);
    
    /**
     * Update panel for mouse interaction and dragging
     * @param mouseX Current mouse X position
     * @param mouseY Current mouse Y position
     * @param mousePressed Whether mouse button is currently pressed
     */
    update(mouseX: number, mouseY: number, mousePressed: boolean): void;
    
    /**
     * Render the panel with optional custom content
     * @param contentRenderer Optional function to render custom content
     */
    render(contentRenderer?: ContentRenderer): void;
    
    /**
     * Show the panel
     */
    show(): void;
    
    /**
     * Hide the panel
     */
    hide(): void;
    
    /**
     * Toggle panel visibility
     */
    toggleVisibility(): void;
    
    /**
     * Check if panel is visible
     */
    isVisible(): boolean;
    
    /**
     * Add a button to the panel
     * @param buttonConfig Button configuration
     */
    addButton(buttonConfig: ButtonConfig): void;
    
    /**
     * Remove a button by index
     * @param index Button index to remove
     */
    removeButton(index: number): void;
    
    /**
     * Clear all buttons
     */
    clearButtons(): void;
    
    /**
     * Set panel position
     * @param x X coordinate
     * @param y Y coordinate
     */
    setPosition(x: number, y: number): void;
    
    /**
     * Get current panel position
     */
    getPosition(): Position;
    
    /**
     * Check if panel is currently being dragged
     */
    isDragActive(): boolean;
  }
  
  // =============================================================================
  // PANEL MANAGER CLASS
  // =============================================================================
  
  /**
   * Manager for multiple draggable panels
   */
  class DraggablePanelManager {
    /**
     * Creates a new panel manager instance
     */
    constructor();
    
    /**
     * Initialize the panel manager
     */
    initialize(): void;
    
    /**
     * Add a new panel
     * @param config Panel configuration
     * @returns Created panel instance
     */
    addPanel(config: PanelConfig): DraggablePanel;
    
    /**
     * Remove a panel by ID
     * @param panelId Panel identifier
     * @returns True if panel was removed
     */
    removePanel(panelId: string): boolean;
    
    /**
     * Get a panel by ID
     * @param panelId Panel identifier
     * @returns Panel instance or null
     */
    getPanel(panelId: string): DraggablePanel | null;
    
    /**
     * Update all panels
     * @param mouseX Current mouse X position
     * @param mouseY Current mouse Y position
     * @param mousePressed Whether mouse is pressed
     */
    update(mouseX: number, mouseY: number, mousePressed: boolean): void;
    
    /**
     * Render all visible panels
     * @param contentRenderers Map of panel ID to content renderer functions
     */
    render(contentRenderers?: Record<string, ContentRenderer>): void;
    
    /**
     * Toggle panel visibility
     * @param panelId Panel identifier
     * @returns New visibility state or null if not found
     */
    togglePanel(panelId: string): boolean | null;
    
    /**
     * Show a panel
     * @param panelId Panel identifier
     * @returns True if panel was found and shown
     */
    showPanel(panelId: string): boolean;
    
    /**
     * Hide a panel
     * @param panelId Panel identifier
     * @returns True if panel was found and hidden
     */
    hidePanel(panelId: string): boolean;
    
    /**
     * Get all panel IDs
     */
    getPanelIds(): string[];
    
    /**
     * Get total panel count
     */
    getPanelCount(): number;
    
    /**
     * Get visible panel count
     */
    getVisiblePanelCount(): number;
    
    /**
     * Check if any panel is being dragged
     */
    isAnyPanelBeingDragged(): boolean;
    
    /**
     * Reset all panels to default positions
     */
    resetAllPanels(): void;
  }
  
  // =============================================================================
  // PLAYER FACTION SETUP
  // =============================================================================
  
  /**
   * Player faction data structure
   */
  interface PlayerFactionData {
    /** Faction name */
    name: string;
    /** Faction color */
    color: {
      r: number;
      g: number;
      b: number;
    };
    /** Starting position */
    position: Position;
  }
  
  /**
   * Color slider values
   */
  interface ColorSliders {
    /** Red component (0-255) */
    r: number;
    /** Green component (0-255) */
    g: number;
    /** Blue component (0-255) */
    b: number;
  }
  
  /**
   * Player faction setup class for game initialization
   */
  class PlayerFactionSetup {
    /** Current setup step */
    currentStep: 'name' | 'color' | 'preview' | 'complete';
    
    /** Whether setup is complete */
    isComplete: boolean;
    
    /** Player faction data */
    playerData: PlayerFactionData;
    
    /** Current name input */
    nameInput: string;
    
    /** Color slider values */
    colorSliders: ColorSliders;
    
    /**
     * Creates a new player faction setup instance
     */
    constructor();
    
    /**
     * Show the faction setup panel
     * @returns True if shown successfully
     */
    show(): boolean;
    
    /**
     * Hide the faction setup panel
     */
    hide(): void;
    
    /**
     * Update the faction setup system
     */
    update(): void;
    
    /**
     * Render the faction setup panel
     */
    render(): void;
    
    /**
     * Check if panel is visible
     */
    isVisible(): boolean;
    
    /**
     * Check if setup is complete
     */
    isSetupComplete(): boolean;
    
    /**
     * Handle keyboard input
     * @param key Key pressed
     * @param keyCode Key code
     */
    handleKeyInput(key: string, keyCode: number): boolean;
    
    /**
     * Move to next setup step
     */
    nextStep(): void;
    
    /**
     * Move to previous setup step
     */
    previousStep(): void;
    
    /**
     * Complete the faction setup
     */
    complete(): void;
  }
}

// =============================================================================
// GLOBAL DECLARATIONS
// =============================================================================

declare global {
  /**
   * Global draggable panel manager instance
   */
  var draggablePanelManager: DraggablePanelSystem.DraggablePanelManager;
  
  /**
   * Global content renderers for panels
   */
  var draggablePanelContentRenderers: Record<string, DraggablePanelSystem.ContentRenderer>;
  
  /**
   * Global player faction setup instance
   */
  var g_playerFactionSetup: DraggablePanelSystem.PlayerFactionSetup;
  
  /**
   * Initialize draggable panel system
   */
  function initializeDraggablePanelSystem(): Promise<boolean>;
  
  /**
   * Update draggable panels
   */
  function updateDraggablePanels(): void;
  
  /**
   * Render draggable panels
   */
  function renderDraggablePanels(): void;
  
  // p5.js globals used by panels
  var mouseX: number;
  var mouseY: number;
  var mouseIsPressed: boolean;
  var width: number;
  var height: number;
  
  function push(): void;
  function pop(): void;
  function fill(...args: any[]): void;
  function stroke(...args: any[]): void;
  function noStroke(): void;
  function strokeWeight(weight: number): void;
  function rect(x: number, y: number, w: number, h: number, r?: number): void;
  function ellipse(x: number, y: number, w: number, h?: number): void;
  function text(str: string, x: number, y: number): void;
  function textAlign(hAlign: any, vAlign?: any): void;
  function textSize(size: number): void;
  function textWidth(str: string): number;
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

export = DraggablePanelSystem;
export as namespace DraggablePanelSystem;