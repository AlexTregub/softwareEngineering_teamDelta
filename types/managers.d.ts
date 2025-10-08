// Auto-generated manager interfaces for IntelliSense
// These interfaces are derived from the runtime JS implementations in src/core/managers.

interface AntManager {
  selectedAnt: any | null;
  handleAntClick(): void;
  moveSelectedAnt(resetSelection: boolean): void;
  selectAnt(antCurrent?: any | null): void;
  getAntObject(antIndex: number): any | null;
  getSelectedAnt(): any | null;
  setSelectedAnt(ant: any | null): void;
  clearSelection(): void;
  hasSelection(): boolean;
  getDebugInfo(): any;
  AntClickControl(): void; // deprecated
  MoveAnt(resetSection: any): void; // deprecated
  SelectAnt(antCurrent?: any | null): void; // deprecated
  getAntObj(antCurrent: number): any | null; // deprecated
}

interface ResourceSystemManager {
  resources: any[];
  maxCapacity: number;
  spawnInterval: number;
  timer: any | null;
  isActive: boolean;
  selectedResourceType: string | null;
  highlightSelectedType: boolean;
  focusedCollection: boolean;
  assets: { [key: string]: { weight: number; make: () => any } };
  options: any;
  registeredResourceTypes?: { [type: string]: any };

  getResourceList(): any[];
  addResource(resource: any): boolean;
  removeResource(resource: any): boolean;
  clearAllResources(): any[];
  drawAll(): void;
  updateAll(): void;
  startSpawning(): void;
  stopSpawning(): void;
  spawn(): void;
  forceSpawn(): void;
  selectResource(resourceType: string): void;
  getSelectedResourceType(): string | null;
  clearResourceSelection(): void;
  isResourceTypeSelected(resourceType: string): boolean;
  getSelectedTypeResources(): any[];
  getResourcesByType(resourceType: string): any[];
  setSelectedType(resourceType: string | null): void;
  setFocusedCollection(focusEnabled: boolean): void;
  registerResourceType(resourceType: string, config: any): void;
  getRegisteredResourceTypes(): { [key: string]: any };
  getSystemStatus(): any;
  getDebugInfo(): any;
  update(): void;
  render(): void;
  destroy(): void;
}

interface ResourceManager {
  parentEntity: any;
  maxCapacity: number;
  collectionRange: number;
  resources: any[];
  isDroppingOff: boolean;
  isAtMaxCapacity: boolean;
  selectedResourceType: string | null;
  highlightSelectedType: boolean;
  focusedCollection: boolean;

  getCurrentLoad(): number;
  isAtMaxLoad(): boolean;
  getRemainingCapacity(): number;
  addResource(resource: any): boolean;
  dropAllResources(): any[];
  startDropOff(dropX: number, dropY: number): void;
  processDropOff(globalResourceArray: any[]): any[];
  checkForNearbyResources(): void;
  selectResource(resourceType: string): void;
  getSelectedResourceType(): string | null;
  clearResourceSelection(): void;
  isResourceTypeSelected(resourceType: string): boolean;
  getSelectedTypeResources(): any[];
  setFocusedCollection(focusEnabled: boolean): void;
  update(): void;
  getDebugInfo(): any;
  forceDropAll(): any[];
}

interface GameStateManager {
  currentState: string;
  previousState: string | null;
  fadeAlpha: number;
  isFading: boolean;
  stateChangeCallbacks: Array<(newState: string, oldState?: string | null) => void>;
  STATES: { [key: string]: string };

  getState(): string;
  setState(newState: string, skipCallbacks?: boolean): boolean;
  getPreviousState(): string | null;
  isState(state: string): boolean;
  isAnyState(...states: string[]): boolean;
  isValidState(state: string): boolean;
  getFadeAlpha(): number;
  setFadeAlpha(alpha: number): void;
  isFadingTransition(): boolean;
  startFadeTransition(direction?: string): void;
  stopFadeTransition(increment?: number): void;
  updateFade(increment?: number): boolean;
  onStateChange(callback: (newState: string, oldState?: string | null) => void): void;
  removeStateChangeCallback(callback: (newState: string, oldState?: string | null) => void): void;
  executeCallbacks(newState: string, oldState?: string | null): void;
  isInMenu(): boolean;
  isInOptions(): boolean;
  isInFactionSetup(): boolean;
  isInGame(): boolean;
  isPaused(): boolean;
  isGameOver(): boolean;
  isDebug(): boolean;
  isKanban(): boolean;
  goToMenu(): void;
  goToOptions(): void;
  goToDebug(): void;
  goToFactionSetup(): void;
  startGame(): boolean;
  pauseGame(): void;
  resumeGame(): void;
  endGame(): void;
  goToKanban(): void;
  reset(): void;
  getDebugInfo(): any;
}

interface FactionManager {
  factions: Map<string, any>;
  relationships: Map<string, number>;
  discoveries: Map<string, boolean>;
  playerFaction: string | null;
  nextFactionId: number;
  relationshipHistory: Array<any>;
  territorialEncroachments: Map<string, any>;
  encroachmentThreshold: number;
  maxRelationshipChange: number;

  createFaction(name: string, color?: { r: number; g: number; b: number }, type?: string, position?: { x: number; y: number }): string;
  getFaction(factionId: string): any | null;
  getAllFactions(): any[];
  updateFactionResources(factionId: string, resourceDelta: any): boolean;
  getRelationship(faction1: string, faction2: string): number;
  setRelationship(faction1: string, faction2: string, value: number, reason?: string): void;
  getRelationshipTier(faction1: string, faction2: string): string;
  canRelationshipChange(faction1: string, faction2: string): boolean;
  handleRelationshipAction(actorFaction: string, targetFaction: string, actionType: string, actionData?: any): void;
  discoverFaction(discovererFaction: string, discoveredFaction: string): void;
  hasDiscovered(faction1: string, faction2: string): boolean;
  getKnownFactions(factionId: string): string[];
  isInTerritory(factionId: string, position: { x: number; y: number }): boolean;
  handleTerritorialEncroachment(encroachingFaction: string, territoryOwner: string, position: { x: number; y: number }): void;
  clearTerritorialEncroachment(encroachingFaction: string, territoryOwner: string): void;
  getDiplomaticStatus(playerFactionId?: string): any;
  getFactionName(factionId: string): string;
  getRelationshipHistory(limit?: number): any[];
  getDebugInfo(): any;
}

// Global instances declared by runtime
declare var antManager: AntManager;
declare var g_resourceManager: ResourceSystemManager;
declare var g_resourceList: ResourceSystemManager | any;
declare var g_gameStateManager: GameStateManager;
declare var g_factionManager: FactionManager;

declare var GameState: GameStateManager;

export {};
