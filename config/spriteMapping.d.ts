/**
 * TypeScript definitions for Sprite Mapping Configuration
 * Provides IntelliSense for all sprite paths and helper functions
 */

// ============================================================================
// TERRAIN TYPES
// ============================================================================

export const TERRAIN_TYPES: {
  readonly GRASS: 0;
  readonly WATER: 1;
  readonly STONE: 2;
  readonly SAND: 3;
  readonly DIRT: 4;
  readonly MOSS: 5;
  readonly FARMLAND: 6;
  readonly SAND_DARK: 7;
  readonly PEBBLE_1: 8;
  readonly PEBBLE_2: 9;
  readonly PEBBLE_3: 10;
  readonly CAVE_FLOOR: 11;
  readonly CAVE_WALL: 12;
  readonly CAVE_DIRT: 13;
  readonly CAVE_DARK: 14;
  readonly CAVE_WATER: 15;
  readonly ANTHILL: 16;
};

export type TerrainType = typeof TERRAIN_TYPES[keyof typeof TERRAIN_TYPES];

// ============================================================================
// TILE SPRITES
// ============================================================================

export const TILE_SPRITE_BASE_PATH: 'Images/16x16 Tiles/';

export const TILE_SPRITE_MAP: Record<TerrainType, string>;

export const CAVE_VARIANTS: {
  readonly FLOOR: readonly ['cave_1.png', 'cave_2.png'];
  readonly WALL: readonly ['cave_extraDark.png', 'cave_3.png'];
};

/**
 * Get full sprite path for a tile type
 * @param tileType - Terrain type enum value
 * @returns Full path to sprite file
 * @example
 * const path = getTileSpritePath(TERRAIN_TYPES.GRASS); // 'Images/16x16 Tiles/grass.png'
 */
export function getTileSpritePath(tileType: TerrainType): string;

// ============================================================================
// ENTITY SPRITES
// ============================================================================

export const ENTITY_SPRITES: {
  readonly ants: {
    readonly gray: {
      readonly worker: 'Images/Ants/gray_ant.png';
      readonly queen: 'Images/Ants/gray_ant_queen.png';
      readonly builder: 'Images/Ants/gray_ant_builder.png';
      readonly farmer: 'Images/Ants/gray_ant_farmer.png';
      readonly scout: 'Images/Ants/gray_ant_scout.png';
      readonly soldier: 'Images/Ants/gray_ant_soldier.png';
      readonly spitter: 'Images/Ants/gray_ant_spitter.png';
      readonly whimsical: 'Images/Ants/gray_ant_whimsical.png';
    };
    readonly blue: {
      readonly worker: 'Images/Ants/blue_ant.png';
      readonly queen: 'Images/Ants/blue_ant_queen.png';
    };
    readonly brown: {
      readonly worker: 'Images/Ants/brown_ant.png';
      readonly queen: 'Images/Ants/brown_ant_queen.png';
    };
  };
  readonly enemies: {
    readonly spider: 'Images/Ants/spider.png';
    readonly boss: 'Images/Ants/spider.png';
  };
  readonly buildings: {
    readonly warehouse: 'Images/Buildings/Hill/Hill1.png';
    readonly barracks: 'Images/Buildings/Hive/Hive1.png';
    readonly tower: 'Images/Buildings/Cone/Cone1.png';
    readonly nest: 'Images/Buildings/Hive/Hive2.png';
    readonly builderHut: 'Images/Buildings/Hill/Hill2.png';
    readonly gathererHut: 'Images/Buildings/Hive/Hive1.png';
    readonly spitterHut: 'Images/Buildings/Cone/Cone2.png';
    readonly speedBeacon: 'Images/Buildings/Hill/Hill1.png';
    readonly attackBeacon: 'Images/Buildings/Cone/Cone1.png';
    readonly attackSpeedBeacon: 'Images/Buildings/Hive/Hive2.png';
    readonly gatherSpeedBeacon: 'Images/Buildings/Hill/Hill2.png';
    readonly terrainNullifierBeacon: 'Images/Buildings/Cone/Cone2.png';
    readonly building: 'Images/16x16 Tiles/anthill.png';
  };
  readonly resources: {
    readonly food: 'Images/Resources/mapleLeaf.png';
    readonly wood: 'Images/Resources/twig_1.png';
    readonly stone: 'Images/Resources/stone.png';
    readonly magicCrystal: 'Images/Resources/leaf.png';
    readonly woodAlt: 'Images/Resources/twig_2.png';
    readonly stick: 'Images/Resources/stick.png';
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get ant sprite path by job name and faction
 * @param jobName - Ant job (Worker, Builder, Scout, Soldier, Farmer, Spitter, Queen, Whimsical)
 * @param faction - Ant faction (player, enemy, blue, brown, gray) - defaults to 'player' (gray)
 * @returns Full path to ant sprite
 * @example
 * const path = getAntSpritePath('Worker', 'player'); // 'Images/Ants/gray_ant.png'
 * const path = getAntSpritePath('Builder'); // 'Images/Ants/gray_ant_builder.png'
 * const path = getAntSpritePath('Worker', 'enemy'); // 'Images/Ants/brown_ant.png'
 */
export function getAntSpritePath(
  jobName: 'Worker' | 'Builder' | 'Scout' | 'Soldier' | 'Farmer' | 'Spitter' | 'Queen' | 'Whimsical' | string,
  faction?: 'player' | 'enemy' | 'blue' | 'brown' | 'gray' | string
): string;

/**
 * Get building sprite path by building type
 * @param buildingType - Building type name
 * @returns Full path to building sprite
 * @example
 * const path = getBuildingSpritePath('warehouse'); // 'Images/Buildings/Hill/Hill1.png'
 * const path = getBuildingSpritePath('tower'); // 'Images/Buildings/Cone/Cone1.png'
 */
export function getBuildingSpritePath(
  buildingType: 'warehouse' | 'barracks' | 'tower' | 'nest' | 'builderHut' | 
                'gathererHut' | 'spitterHut' | 'speedBeacon' | 'attackBeacon' | 
                'attackSpeedBeacon' | 'gatherSpeedBeacon' | 'terrainNullifierBeacon' | 
                'building' | string
): string;

/**
 * Get resource sprite path by resource type
 * @param resourceType - Resource type name
 * @returns Full path to resource sprite
 * @example
 * const path = getResourceSpritePath('food'); // 'Images/Resources/mapleLeaf.png'
 * const path = getResourceSpritePath('wood'); // 'Images/Resources/twig_1.png'
 */
export function getResourceSpritePath(
  resourceType: 'food' | 'wood' | 'stone' | 'magicCrystal' | 'woodAlt' | 'stick' | string
): string;

/**
 * Get enemy sprite path by enemy type
 * @param enemyType - Enemy type name
 * @returns Full path to enemy sprite
 * @example
 * const path = getEnemySpritePath('spider'); // 'Images/Ants/spider.png'
 * const path = getEnemySpritePath('boss'); // 'Images/Ants/spider.png'
 */
export function getEnemySpritePath(
  enemyType: 'spider' | 'boss' | string
): string;

// ============================================================================
// SPRITE PRELOADER
// ============================================================================

/**
 * Preload all entity sprites
 * Call this in p5's preload() function to load all sprites into cache
 * @example
 * function preload() {
 *   SpriteMapping.spritePreloader();
 * }
 */
export function spritePreloader(): void;

/**
 * Get preloaded sprite by path
 * Returns the cached p5.Image object if available
 * @param path - Sprite path
 * @returns Preloaded p5.Image or null if not found
 */
export function getPreloadedSprite(path: string): any | null;

/**
 * Check if all sprites are preloaded
 * @returns True if preload complete
 */
export function isPreloadComplete(): boolean;

// ============================================================================
// GLOBAL WINDOW TYPE
// ============================================================================

declare global {
  interface Window {
    SpriteMapping: {
      TERRAIN_TYPES: typeof TERRAIN_TYPES;
      TILE_SPRITE_BASE_PATH: typeof TILE_SPRITE_BASE_PATH;
      TILE_SPRITE_MAP: typeof TILE_SPRITE_MAP;
      CAVE_VARIANTS: typeof CAVE_VARIANTS;
      ENTITY_SPRITES: typeof ENTITY_SPRITES;
      getTileSpritePath: typeof getTileSpritePath;
      getAntSpritePath: typeof getAntSpritePath;
      getBuildingSpritePath: typeof getBuildingSpritePath;
      getResourceSpritePath: typeof getResourceSpritePath;
      getEnemySpritePath: typeof getEnemySpritePath;
      spritePreloader: typeof spritePreloader;
      getPreloadedSprite: typeof getPreloadedSprite;
      isPreloadComplete: typeof isPreloadComplete;
    };
  }
}

export {};
