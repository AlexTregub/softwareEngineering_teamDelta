/**
 * Type definitions for Entity Event System
 * Provides intellisense support for EntityEvents and EventManager
 */

/**
 * Event data structures for each entity event
 */
interface EntityEventData {
  // Ant lifecycle
  ANT_CREATED: {
    ant: AntController;
    jobName: string;
    position: { x: number; y: number };
  };

  ANT_DIED: {
    ant: AntController;
    cause: string;
    position: { x: number; y: number };
  };

  ANT_DESTROYED: {
    antId: string;
    antIndex: number;
  };

  // Ant health
  ANT_DAMAGED: {
    ant: AntController;
    damage: number;
    healthBefore: number;
    healthAfter: number;
    attacker?: any;
  };

  ANT_HEALED: {
    ant: AntController;
    amount: number;
    healthBefore: number;
    healthAfter: number;
  };

  ANT_HEALTH_CRITICAL: {
    ant: AntController;
    healthPercent: number;
  };

  // Ant combat
  ANT_ATTACKED: {
    ant: AntController;
    target: any;
    damage: number;
  };

  ANT_COMBAT_ENTERED: {
    ant: AntController;
    enemy: any;
  };

  ANT_COMBAT_EXITED: {
    ant: AntController;
    reason: string;
  };

  // Ant state
  ANT_STATE_CHANGED: {
    ant: AntController;
    oldState: string;
    newState: string;
  };

  ANT_MOVE_STARTED: {
    ant: AntController;
    destination: { x: number; y: number };
  };

  ANT_MOVE_COMPLETED: {
    ant: AntController;
    position: { x: number; y: number };
  };

  ANT_GATHERING_STARTED: {
    ant: AntController;
  };

  ANT_GATHERING_STOPPED: {
    ant: AntController;
    reason: string;
  };

  // Ant resources
  ANT_RESOURCE_COLLECTED: {
    ant: AntController;
    amount: number;
    totalCarried: number;
    capacity: number;
  };

  ANT_RESOURCE_DEPOSITED: {
    ant: AntController;
    amount: number;
    dropoff: any;
  };

  ANT_CAPACITY_REACHED: {
    ant: AntController;
    capacity: number;
  };

  // Ant job
  ANT_JOB_CHANGED: {
    ant: AntController;
    oldJob: string;
    newJob: string;
    stats: any;
  };

  // Ant selection
  ANT_SELECTED: {
    ant: AntController;
  };

  ANT_DESELECTED: {
    ant: AntController;
  };

  // Animation
  ANIMATION_PLAY_REQUESTED: {
    entity: any;
    animationName: string;
  };

  ANIMATION_STARTED: {
    entity: any;
    animationName: string;
  };

  ANIMATION_COMPLETED: {
    entity: any;
    animationName: string;
  };

  // Generic entity
  ENTITY_CREATED: {
    entity: EntityController;
    type: string;
  };

  ENTITY_DESTROYED: {
    entityId: string;
    type: string;
  };

  ENTITY_MOVED: {
    entity: EntityController;
    oldPosition: { x: number; y: number };
    newPosition: { x: number; y: number };
  };
}

/**
 * EntityEvents constants
 */
declare const EntityEvents: {
  // Lifecycle
  readonly ANT_CREATED: 'entity:ant:created';
  readonly ANT_DIED: 'entity:ant:died';
  readonly ANT_DESTROYED: 'entity:ant:destroyed';

  // Health
  readonly ANT_DAMAGED: 'entity:ant:damaged';
  readonly ANT_HEALED: 'entity:ant:healed';
  readonly ANT_HEALTH_CRITICAL: 'entity:ant:health:critical';

  // Combat
  readonly ANT_ATTACKED: 'entity:ant:attacked';
  readonly ANT_COMBAT_ENTERED: 'entity:ant:combat:entered';
  readonly ANT_COMBAT_EXITED: 'entity:ant:combat:exited';

  // State
  readonly ANT_STATE_CHANGED: 'entity:ant:state:changed';
  readonly ANT_MOVE_STARTED: 'entity:ant:move:started';
  readonly ANT_MOVE_COMPLETED: 'entity:ant:move:completed';
  readonly ANT_GATHERING_STARTED: 'entity:ant:gathering:started';
  readonly ANT_GATHERING_STOPPED: 'entity:ant:gathering:stopped';

  // Resources
  readonly ANT_RESOURCE_COLLECTED: 'entity:ant:resource:collected';
  readonly ANT_RESOURCE_DEPOSITED: 'entity:ant:resource:deposited';
  readonly ANT_CAPACITY_REACHED: 'entity:ant:resource:capacity:reached';

  // Job
  readonly ANT_JOB_CHANGED: 'entity:ant:job:changed';

  // Selection
  readonly ANT_SELECTED: 'entity:ant:selected';
  readonly ANT_DESELECTED: 'entity:ant:deselected';

  // Animation
  readonly ANIMATION_PLAY_REQUESTED: 'entity:animation:play:requested';
  readonly ANIMATION_STARTED: 'entity:animation:started';
  readonly ANIMATION_COMPLETED: 'entity:animation:completed';

  // Generic
  readonly ENTITY_CREATED: 'entity:created';
  readonly ENTITY_DESTROYED: 'entity:destroyed';
  readonly ENTITY_MOVED: 'entity:moved';

  // System
  readonly COMBAT_STARTED: 'system:combat:started';
  readonly COMBAT_ENDED: 'system:combat:ended';
};

/**
 * EventManager pub/sub methods
 */
declare class EventManager {
  /**
   * Subscribe to an event
   * @param eventName - Event name (use EntityEvents constants)
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  on<K extends keyof EntityEventData>(
    eventName: K,
    callback: (data: EntityEventData[K]) => void
  ): () => void;

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof EntityEventData>(
    eventName: K,
    callback: (data: EntityEventData[K]) => void
  ): void;

  /**
   * Subscribe once (auto-unsubscribe after first trigger)
   */
  once<K extends keyof EntityEventData>(
    eventName: K,
    callback: (data: EntityEventData[K]) => void
  ): () => void;

  /**
   * Emit an event
   */
  emit<K extends keyof EntityEventData>(
    eventName: K,
    data: EntityEventData[K]
  ): void;

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(eventName?: string): void;

  /**
   * Get listener count for an event
   */
  listenerCount(eventName: string): number;

  /**
   * Get singleton instance
   */
  static getInstance(): EventManager;
}

/**
 * AnimationEventListener
 */
declare class AnimationEventListener {
  constructor();
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  destroy(): void;
}
