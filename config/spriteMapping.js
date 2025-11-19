/**
 * Sprite Mapping Configuration
 * =============================
 * SINGLE SOURCE OF TRUTH for all sprite paths
 * Maps entity types and terrain types to sprite file paths
 * 
 * All paths are relative to the project root
 * 
 * @typedef {import('./spriteMapping').TERRAIN_TYPES} TERRAIN_TYPES
 * @typedef {import('./spriteMapping').ENTITY_SPRITES} ENTITY_SPRITES
 */

// ============================================================================
// TERRAIN SPRITES
// ============================================================================

/**
 * Base path for tile sprites
 */
const TILE_SPRITE_BASE_PATH = 'Images/16x16 Tiles/';

/**
 * Terrain type enum (matching MapManager)
 */
const TERRAIN_TYPES = {
  GRASS: 0,
  WATER: 1,
  STONE: 2,
  SAND: 3,
  DIRT: 4,
  MOSS: 5,
  FARMLAND: 6,
  SAND_DARK: 7,
  PEBBLE_1: 8,
  PEBBLE_2: 9,
  PEBBLE_3: 10,
  CAVE_FLOOR: 11,
  CAVE_WALL: 12,
  CAVE_DIRT: 13,
  CAVE_DARK: 14,
  CAVE_WATER: 15,
  ANTHILL: 16
};

/**
 * Maps terrain type to sprite filename
 */
const TILE_SPRITE_MAP = {
  [TERRAIN_TYPES.GRASS]: 'grass.png',
  [TERRAIN_TYPES.DIRT]: 'dirt.png',
  [TERRAIN_TYPES.STONE]: 'stone.png',
  [TERRAIN_TYPES.SAND]: 'sand.png',
  [TERRAIN_TYPES.SAND_DARK]: 'sand_dark.png',
  [TERRAIN_TYPES.WATER]: 'water.png',
  [TERRAIN_TYPES.FARMLAND]: 'farmland.png',
  [TERRAIN_TYPES.MOSS]: 'moss.png',
  [TERRAIN_TYPES.PEBBLE_1]: 'pebble_1.png',
  [TERRAIN_TYPES.PEBBLE_2]: 'pebble_2.png',
  [TERRAIN_TYPES.PEBBLE_3]: 'pebble_3.png',
  [TERRAIN_TYPES.CAVE_FLOOR]: 'cave_1.png',
  [TERRAIN_TYPES.CAVE_WALL]: 'cave_extraDark.png',
  [TERRAIN_TYPES.CAVE_DIRT]: 'cave_dirt.png',
  [TERRAIN_TYPES.CAVE_DARK]: 'cave_3.png',
  [TERRAIN_TYPES.CAVE_WATER]: 'water_cave.png',
  [TERRAIN_TYPES.ANTHILL]: 'anthill.png'
};

/**
 * Gets the full sprite path for a tile type
 * @param {number} tileType - Terrain type enum value
 * @returns {string} Full path to sprite file
 */
function getTileSpritePath(tileType) {
  return TILE_SPRITE_BASE_PATH + TILE_SPRITE_MAP[tileType];
}

/**
 * Alternate cave sprites for variety
 * Can be used for random variation in cave generation
 */
const CAVE_VARIANTS = {
  FLOOR: ['cave_1.png', 'cave_2.png'],
  WALL: ['cave_extraDark.png', 'cave_3.png']
};

// ============================================================================
// ENTITY SPRITES
// ============================================================================

/**
 * Entity sprite mappings
 * SINGLE SOURCE OF TRUTH for all entity sprite paths
 */
const ENTITY_SPRITES = {
  // ===== ANTS =====
  ants: {
    // Gray faction (player default)
    gray: {
      worker: 'Images/Ants/gray_ant.png',
      queen: 'Images/Ants/gray_ant_queen.png',
      builder: 'Images/Ants/gray_ant_builder.png',
      farmer: 'Images/Ants/gray_ant_farmer.png',
      scout: 'Images/Ants/gray_ant_scout.png',
      soldier: 'Images/Ants/gray_ant_soldier.png',
      spitter: 'Images/Ants/gray_ant_spitter.png',
      whimsical: 'Images/Ants/gray_ant_whimsical.png'
    },
    // Blue faction
    blue: {
      worker: 'Images/Ants/blue_ant.png',
      queen: 'Images/Ants/blue_ant_queen.png'
    },
    // Brown faction
    brown: {
      worker: 'Images/Ants/brown_ant.png',
      queen: 'Images/Ants/brown_ant_queen.png'
    }
  },
  
  // ===== ENEMIES =====
  enemies: {
    spider: 'Images/Ants/spider.png',
    boss: 'Images/Ants/spider.png' // Boss uses spider sprite
  },
  
  // ===== BUILDINGS =====
  buildings: {
    // Original 3
    warehouse: 'Images/Buildings/Hill/Hill1.png',      // STORAGE: Resource storage
    barracks: 'Images/Buildings/Hive/Hive1.png',       // SPAWNER: Worker ants
    tower: 'Images/Buildings/Cone/Cone1.png',          // DEFENSE: Attack tower
    
    // Phase 4: New buildings (9 total)
    nest: 'Images/Buildings/Hive/Hive2.png',           // STORAGE: Ant capacity (+15)
    builderHut: 'Images/Buildings/Hill/Hill2.png',     // SPAWNER: Builder ants
    gathererHut: 'Images/Buildings/Hive/Hive1.png',    // SPAWNER: Gatherer ants
    spitterHut: 'Images/Buildings/Cone/Cone2.png',     // SPAWNER: Spitter ants
    speedBeacon: 'Images/Buildings/Hill/Hill1.png',    // STAT_BOOST: Speed +50%
    attackBeacon: 'Images/Buildings/Cone/Cone1.png',   // STAT_BOOST: Attack +3
    attackSpeedBeacon: 'Images/Buildings/Hive/Hive2.png', // STAT_BOOST: Attack speed +30%
    gatherSpeedBeacon: 'Images/Buildings/Hill/Hill2.png', // STAT_BOOST: Gather speed +50%
    terrainNullifierBeacon: 'Images/Buildings/Cone/Cone2.png',  // STAT_BOOST: Terrain nullifier
    
    // Generic fallback
    building: 'Images/16x16 Tiles/anthill.png'
  },
  
  // ===== RESOURCES =====
  resources: {
    food: 'Images/Resources/mapleLeaf.png',
    wood: 'Images/Resources/twig_1.png',
    stone: 'Images/Resources/stone.png',
    magicCrystal: 'Images/Resources/leaf.png',
    
    // Variants
    woodAlt: 'Images/Resources/twig_2.png',
    stick: 'Images/Resources/stick.png'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get ant sprite path by job name and faction
 * @param {string} jobName - Ant job (Worker, Builder, Scout, Soldier, Farmer, Spitter, Queen, Whimsical)
 * @param {string} [faction='player'] - Ant faction (player, enemy, blue, brown, gray)
 * @returns {string} Full path to ant sprite
 * @example
 * // Get player worker ant
 * const path = getAntSpritePath('Worker', 'player'); // 'Images/Ants/gray_ant.png'
 * 
 * // Get enemy ant (defaults to brown)
 * const path = getAntSpritePath('Worker', 'enemy'); // 'Images/Ants/brown_ant.png'
 * 
 * // Get builder ant
 * const path = getAntSpritePath('Builder'); // 'Images/Ants/gray_ant_builder.png'
 */
function getAntSpritePath(jobName, faction = 'player') {
  // Default to gray for player, brown for enemy
  let factionColor = 'gray';
  if (faction && faction.toLowerCase() !== 'player') {
    factionColor = 'brown';
  }
  
  // Normalize job name to lowercase
  const jobLower = jobName ? jobName.toLowerCase() : 'worker';
  
  // Check if faction exists
  const factionSprites = ENTITY_SPRITES.ants[factionColor];
  if (!factionSprites) {
    console.warn(`[SpriteMapping] Unknown faction: ${factionColor}, using gray`);
    factionColor = 'gray';
  }
  
  // Check if job exists for this faction
  const spritePath = ENTITY_SPRITES.ants[factionColor][jobLower];
  if (!spritePath) {
    console.warn(`[SpriteMapping] Unknown job: ${jobLower} for faction ${factionColor}, using worker`);
    return ENTITY_SPRITES.ants[factionColor].worker || ENTITY_SPRITES.ants.gray.worker;
  }
  
  return spritePath;
}

/**
 * Get building sprite path by building type
 * @param {string} buildingType - Building type (warehouse, barracks, tower, nest, builderHut, gathererHut, spitterHut, speedBeacon, attackBeacon, attackSpeedBeacon, gatherSpeedBeacon, terrainNullifierBeacon)
 * @returns {string} Full path to building sprite
 * @example
 * const path = getBuildingSpritePath('warehouse'); // 'Images/Buildings/Hill/Hill1.png'
 * const path = getBuildingSpritePath('tower'); // 'Images/Buildings/Cone/Cone1.png'
 */
function getBuildingSpritePath(buildingType) {
  const typeLower = buildingType ? buildingType.toLowerCase() : 'building';
  return ENTITY_SPRITES.buildings[typeLower] || ENTITY_SPRITES.buildings.building;
}

/**
 * Get resource sprite path by resource type
 * @param {string} resourceType - Resource type (food, wood, stone, magicCrystal, woodAlt, stick)
 * @returns {string} Full path to resource sprite
 * @example
 * const path = getResourceSpritePath('food'); // 'Images/Resources/mapleLeaf.png'
 * const path = getResourceSpritePath('wood'); // 'Images/Resources/twig_1.png'
 */
function getResourceSpritePath(resourceType) {
  const typeLower = resourceType ? resourceType.toLowerCase() : 'food';
  return ENTITY_SPRITES.resources[typeLower] || ENTITY_SPRITES.resources.food;
}

/**
 * Get enemy sprite path by enemy type
 * @param {string} enemyType - Enemy type (spider, boss)
 * @returns {string} Full path to enemy sprite
 * @example
 * const path = getEnemySpritePath('spider'); // 'Images/Ants/spider.png'
 * const path = getEnemySpritePath('boss'); // 'Images/Ants/spider.png'
 */
function getEnemySpritePath(enemyType) {
  const typeLower = enemyType ? enemyType.toLowerCase() : 'spider';
  return ENTITY_SPRITES.enemies[typeLower] || ENTITY_SPRITES.enemies.spider;
}

// ============================================================================
// SPRITE PRELOADER
// ============================================================================

/**
 * Preloaded sprite cache
 * Stores loaded p5.Image objects for reuse
 */
const PRELOADED_SPRITES = {};

/**
 * Preload all entity sprites
 * Call this in p5's preload() function
 * @example
 * function preload() {
 *   spritePreloader();
 * }
 */
function spritePreloader() {
  if (typeof loadImage === 'undefined') {
    console.warn('[SpriteMapping] loadImage not available, skipping preload');
    return;
  }

  console.log('[SpriteMapping] Preloading sprites...');

  // Preload ant sprites
  Object.keys(ENTITY_SPRITES.ants).forEach(faction => {
    Object.keys(ENTITY_SPRITES.ants[faction]).forEach(job => {
      const path = ENTITY_SPRITES.ants[faction][job];
      PRELOADED_SPRITES[path] = loadImage(path);
    });
  });

  // Preload enemy sprites
  Object.keys(ENTITY_SPRITES.enemies).forEach(enemy => {
    const path = ENTITY_SPRITES.enemies[enemy];
    if (!PRELOADED_SPRITES[path]) { // Avoid duplicates
      PRELOADED_SPRITES[path] = loadImage(path);
    }
  });

  // Preload building sprites
  Object.keys(ENTITY_SPRITES.buildings).forEach(building => {
    const path = ENTITY_SPRITES.buildings[building];
    if (!PRELOADED_SPRITES[path]) {
      PRELOADED_SPRITES[path] = loadImage(path);
    }
  });

  // Preload resource sprites
  Object.keys(ENTITY_SPRITES.resources).forEach(resource => {
    const path = ENTITY_SPRITES.resources[resource];
    if (!PRELOADED_SPRITES[path]) {
      PRELOADED_SPRITES[path] = loadImage(path);
    }
  });

  console.log('[SpriteMapping] Preloaded', Object.keys(PRELOADED_SPRITES).length, 'sprites');
}

/**
 * Get preloaded sprite by path
 * Returns the cached p5.Image object if available
 * @param {string} path - Sprite path
 * @returns {p5.Image|null} Preloaded image or null
 */
function getPreloadedSprite(path) {
  return PRELOADED_SPRITES[path] || null;
}

/**
 * Check if all sprites are preloaded
 * @returns {boolean} True if preload complete
 */
function isPreloadComplete() {
  return Object.keys(PRELOADED_SPRITES).length > 0;
}

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof window !== 'undefined') {
  window.SpriteMapping = {
    // Constants
    TERRAIN_TYPES,
    TILE_SPRITE_BASE_PATH,
    TILE_SPRITE_MAP,
    CAVE_VARIANTS,
    ENTITY_SPRITES,
    
    // Helper functions
    getTileSpritePath,
    getAntSpritePath,
    getBuildingSpritePath,
    getResourceSpritePath,
    getEnemySpritePath,
    
    // Preloader functions
    spritePreloader,
    getPreloadedSprite,
    isPreloadComplete
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TERRAIN_TYPES,
    TILE_SPRITE_BASE_PATH,
    TILE_SPRITE_MAP,
    CAVE_VARIANTS,
    ENTITY_SPRITES,
    getTileSpritePath,
    getAntSpritePath,
    getBuildingSpritePath,
    getResourceSpritePath,
    getEnemySpritePath,
    spritePreloader,
    getPreloadedSprite,
    isPreloadComplete
  };
}
