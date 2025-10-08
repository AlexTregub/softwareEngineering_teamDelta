// Auto-generated controller interfaces for IntelliSense
// Add more detailed shapes as needed; these are based on the project's source files.

interface ControllerConstructor { new(...args: any[]): any }

interface RenderControllerInstance {
  update(): void;
  render(): void;
  setHighlight(type: string, intensity?: number): void;
  clearHighlight(): void;
  addEffect(effect: any): string;
  removeEffect(effectId: string): void;
  clearEffects(): void;
  setDebugMode(enabled: boolean): void;
  setSmoothing(enabled: boolean): void;
  highlightSelected(): void;
  highlightHover(): void;
  highlightBoxHover(): void;
  highlightCombat(): void;
  highlightResource(): void;
  showDamageNumber(damage: number, color?: number[]): void;
  showHealNumber(heal: number): void;
  showFloatingText(text: string, color?: number[]): void;
  renderEntity(): void;
  renderFallbackEntity(): void;
  renderMovementIndicators(): void;
  renderHighlighting(): void;
  renderStateIndicators(): void;
  renderDebugInfo(): void;
  updateEffects(): void;
  renderEffects(): void;
  renderTextEffect(effect: any): void;
  renderParticleEffect(effect: any): void;
  getEntityPosition(): { x: number; y: number };
  getEntitySize(): { x: number; y: number };
  getEntityCenter(): { x: number; y: number };
  generateEffectId(): string;
  getDebugInfo(): any;
  getHighlightState(): string | null;
  getHighlightColor(): number[] | null;
  getHighlightIntensity(): number;
  isHighlighted(): boolean;
  getAvailableHighlights(): string[];
  getAvailableStates(): string[];
  getCurrentEntityState(): string | null;
  isStateIndicatorVisible(): boolean;
  getExpectedStateSymbol(): string | null;
  getEffectsCount(): number;
  getValidationData(): any;
}

interface MovementControllerInstance {
  moveToLocation(x: number, y: number): boolean;
  setPath(pathArray: any[] | null): void;
  getPath(): any[] | null;
  stop(): void;
  getIsMoving(): boolean;
  getTarget(): { x: number; y: number } | null;
  movementSpeed: number;
  update(): void;
  followPath(): void;
  updateDirectMovement(): void;
  getEffectiveMovementSpeed(): number;
  getCurrentPosition(): { x: number; y: number };
  setEntityPosition(position: { x: number; y: number }): void;
  shouldSkitter(): boolean;
  performSkitter(): void;
  resetSkitterTimer(): void;
  updateStuckDetection(): void;
  handleStuck(): void;
  getDebugInfo(): any;
}

interface MovementControllerStatic {
  moveEntityToTile(entity: any, tileX: number, tileY: number, tileSize?: number, pathMap?: any): boolean;
}

interface HealthControllerInstance {
  update(): void;
  render(): void;
  onDamage(): void;
  setConfig(newConfig: any): void;
  getConfig(): any;
  setVisible(visible: boolean): void;
  getVisible(): boolean;
  getDebugInfo(): any;
  destroy(): void;
}

interface SelectionControllerInstance {
  update(): void;
  setSelected(selected: boolean): void;
  isSelected(): boolean;
  setSelectable(selectable: boolean): void;
  getSelectable(): boolean;
  toggleSelection(): boolean;
  setHovered(hovered: boolean): void;
  isHovered(): boolean;
  setBoxHovered(boxHovered: boolean): void;
  isBoxHovered(): boolean;
  updateHoverState(mouseX: number, mouseY: number): void;
  updateHighlightType(): void;
  getHighlightType(): string;
  applyHighlighting(): void;
  updateHighlight(): void;
  addToGroup(selectionGroup: any[]): void;
  removeFromGroup(selectionGroup: any[]): void;
  addSelectionCallback(callback: (wasSelected: boolean, isSelected: boolean) => void): void;
  removeSelectionCallback(callback: (wasSelected: boolean, isSelected: boolean) => void): void;
  clearAllStates(): void;
  getDebugInfo(): any;
}

// Detailed interfaces for other controllers (expanded from source files)
interface CameraControllerInstance {
  getWorldMouseX(): number;
  getWorldMouseY(): number;
  getWorldMouse(): { worldX: number; worldY: number; screenX: number; screenY: number };
  screenToWorld(screenX: number, screenY: number): { worldX: number; worldY: number };
  worldToScreen(worldX: number, worldY: number): { screenX: number; screenY: number };
  setCameraPosition(x: number, y: number): void;
  moveCameraBy(deltaX: number, deltaY: number): void;
  getCameraPosition(): { x: number; y: number };
  centerCameraOn(worldX: number, worldY: number): void;
  getVisibleBounds(): { left: number; right: number; top: number; bottom: number };
  isPositionVisible(worldX: number, worldY: number): boolean;
}

interface CombatControllerInstance {
  update(): void;
  getNearbyEnemies(): any[];
  isInCombat(): boolean;
  setDetectionRadius(radius: number): void;
  setFaction(faction: string): void;
  getFaction(): string;
  getCombatState(): string;
  setCombatState(state: string): void;
  setStateChangeCallback(cb: (oldState: string, newState: string) => void): void;
  getDebugInfo(): any;
  calculateDistance(entity1: any, entity2: any): number;
}

interface DebugRendererInstance { renderEntityDebug(entity: any): void; }

interface FactionControllerInstance { factionId?: string; setFaction?: (id: string) => void; getFactionId?: () => string; }

interface InputControllerInstance { /* generic input controller shape */ }

interface InteractionControllerInstance {
  update(mouseX: number, mouseY: number): void;
  isMouseOver(): boolean;
  handleMousePress(mouseX: number, mouseY: number, button?: string): boolean;
  handleMouseRelease(mouseX: number, mouseY: number, button?: string): boolean;
  addClickCallback(cb: (event: any) => void): void;
  removeClickCallback(cb: (event: any) => void): void;
  addHoverCallback(cb: (wasHovered: boolean, isHovered: boolean) => void): void;
  removeHoverCallback(cb: (wasHovered: boolean, isHovered: boolean) => void): void;
  setInteractionEnabled(enabled: boolean): void;
  setClickThreshold(threshold: number): void;
  setDoubleClickThreshold(threshold: number): void;
  getDebugInfo(): any;
}

interface InventoryControllerInstance {
  owner: any;
  capacity: number;
  slots: Array<any | null>;
  getCount(): number;
  isFull(): boolean;
  isEmpty(): boolean;
  getSlot(index: number): any | null;
  getResources(): any[];
  addResource(resource: any): boolean;
  addResourceToSlot(index: number, resource: any): boolean;
  removeResource(index: number, dropToGround?: boolean): any | null;
  dropAll(): void;
  containsType(type: string): boolean;
  transferAllTo(targetInventory: InventoryControllerInstance): number;
}

interface KeyboardInputControllerInstance {
  onKeyPress(cb: (keyCode: number, key: string) => void): void;
  onKeyRelease(cb: (keyCode: number, key: string) => void): void;
  onKeyType(cb: (key: string) => void): void;
  handleKeyPressed(keyCode: number, key: string): void;
  handleKeyReleased(keyCode: number, key: string): void;
  handleKeyTyped(key: string): void;
  isKeyDown(keyCode: number): boolean;
}

interface MouseInputControllerInstance {
  isDragging: boolean;
  onClick(fn: (x: number, y: number, button: any) => void): void;
  onDrag(fn: (x: number, y: number, dx: number, dy: number) => void): void;
  onRelease(fn: (x: number, y: number, button: any) => void): void;
  handleMousePressed(x: number, y: number, button: any): void;
  handleMouseDragged(x: number, y: number): void;
  handleMouseReleased(x: number, y: number, button: any): void;
}

interface SelectionBoxControllerInstance {
  handleClick(x: number, y: number, button?: any): void;
  handleDrag(x: number, y: number): void;
  handleRelease(x: number, y: number, button?: any): void;
  deselectAll(): void;
  getSelectedEntities(): any[];
  setEntities(entities: any[]): void;
  getEntities(): any[];
  draw(): void;
  entities: any[];
  selectedEntities: any[];
}

interface TaskManagerInstance {
  addTask(task: any): string | null;
  update(): void;
  clearAllTasks(): void;
  cancelTask(taskId: string): boolean;
  getCurrentTask(): any | null;
  hasPendingTasks(): boolean;
  getQueueLength(): number;
  addEmergencyTask(task: any): void;
  moveToTarget(x: number, y: number, priority?: number): string | null;
  startGathering(target?: any): string | null;
  startBuilding(buildTarget?: any): string | null;
  followTarget(target: any): string | null;
  attackTarget(target: any): string | null;
  fleeFrom(threat: any): string | null;
  getDebugInfo(): any;
}

interface TerrainControllerInstance {
  update(): void;
  getCurrentTerrain(): string;
  forceTerrainCheck(): void;
  setCheckInterval(interval: number): void;
  detectTerrain(): string;
  getSpeedModifier(baseSpeed: number): number;
  canMove(): boolean;
  getVisualEffects(): any;
  setTerrainChangeCallback(cb: (oldTerrain: string, newTerrain: string) => void): void;
  clearCache(): void;
  getDebugInfo(): any;
}

interface TransformControllerInstance {
  update(): void;
  setPosition(x: number, y: number): void;
  getPosition(): { x: number; y: number };
  getCenter(): { x: number; y: number };
  setSize(width: number, height: number): void;
  getSize(): { x: number; y: number };
  setRotation(rotation: number): void;
  getRotation(): number;
  rotate(delta: number): void;
  contains(x: number, y: number): boolean;
  getDistanceTo(target: any): number;
  translate(deltaX: number, deltaY: number): void;
  scale(factor: number): void;
  syncSprite(): void;
  forceSyncSprite(): void;
  getBounds(): { x: number; y: number; width: number; height: number };
  intersects(other: TransformControllerInstance): boolean;
  getDebugInfo(): any;
}

interface UISelectionControllerInstance {
  handleMousePressed(x: number, y: number, button?: any): void;
  handleMouseDrag(x: number, y: number, dx?: number, dy?: number): void;
  handleMouseReleased(x: number, y: number, button?: any): void;
  setSelectableEntities(entities: any[]): this;
  getSelectedEntities(): any[];
  clearSelection(): this;
  setCallbacks(callbacks: any): this;
  updateConfig(config: any): this;
  setEnabled(enabled: boolean): this;
  isSelectionActive(): boolean;
  getSelectionBounds(): any | null;
  getDebugInfo(): any;
}

interface DebugRendererInstance { renderEntityDebug(entity: any): void; }

interface AntUtilitiesStatic {
  moveAntToTile(ant: any, tileX: number, tileY: number, tileSize?: number, pathMap?: any): void;
  moveGroupInCircle(antArray: any[], x: number, y: number, radius?: number): void;
  moveGroupInLine(antArray: any[], startX: number, startY: number, endX: number, endY: number): void;
  moveGroupInGrid(antArray: any[], centerTileX: number, centerTileY: number, tileSpacing?: number, maxCols?: number, tileSize?: number, pathMap?: any): void;
  selectAntUnderMouse(ants: any[], mouseX: number, mouseY: number, clearOthers?: boolean): any | null;
  isAntUnderMouse(ant: any, mouseX: number, mouseY: number): boolean;
  deselectAllAnts(ants: any[]): void;
  getSelectedAnts(ants: any[]): any[];
  moveSelectedAntsToTile(selectedAnts: any[], tileX: number, tileY: number, tileSize?: number, pathMap?: any): void;
  moveAntDirectly(ant: any, x: number, y: number): void;
  spawnAnt(x: number, y: number, jobName?: string, faction?: string, customImage?: any): any | null;
  spawnMultipleAnts(count: number, jobName?: string, faction?: string, centerX?: number, centerY?: number, radius?: number): any[];
  changeSelectedAntsState(ants: any[], primaryState: string, combatModifier?: string, terrainModifier?: string): void;
  setSelectedAntsIdle(ants: any[]): void;
  setSelectedAntsGathering(ants: any[]): void;
  setSelectedAntsPatrol(ants: any[]): void;
  setSelectedAntsCombat(ants: any[]): void;
  setSelectedAntsBuilding(ants: any[]): void;
  getDistance(x1: number, y1: number, x2: number, y2: number): number;
  getAntsInRadius(ants: any[], centerX: number, centerY: number, radius: number): any[];
  getAntsByFaction(ants: any[], faction: string): any[];
  getPerformanceStats(ants: any[]): any;
}

export {};
