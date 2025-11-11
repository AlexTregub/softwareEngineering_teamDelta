/**
 * antSprites.js
 * 
 * Preloads and manages ant sprite images for the MVC system.
 * Maps job names to their corresponding sprite images.
 * 
 * Usage:
 * - Call antsPreloader() in sketch.js preload()
 * - Access sprites via AntSprites.getSprite(jobName, faction)
 */

const AntSprites = {
  // Sprite storage by faction and job
  player: {},
  enemy: {},
  neutral: {},
  
  /**
   * Get sprite for specific job and faction
   * @param {string} jobName - Job name (Scout, Farmer, Builder, Soldier, Warrior, Spitter, Queen)
   * @param {string} faction - Faction (player, enemy, neutral)
   * @returns {p5.Image} Sprite image
   */
  getSprite(jobName, faction) {
    const factionSprites = this[faction]
    const sprite = factionSprites[jobName]
    if (!sprite) {
      console.warn(`⚠️ AntSprites.getSprite: No sprite found for ${faction} ${jobName}`);
    }
    return sprite;
  },
  
  /**
   * Get default ant sprite (generic gray ant)
   * @returns {p5.Image} Default sprite
   */
  getDefaultSprite() {
    return this.player.Scout || null;
  },
  
  /**
   * Check if sprites are loaded
   * @returns {boolean} True if sprites loaded
   */
  isLoaded() {
    return Object.keys(this.player).length > 0;
  }
};

/**
 * Preload ant sprites - Call in sketch.js preload()
 */
function antsPreloader() {
  
  // Player faction (gray ants)
  AntSprites.player.Scout = loadImage('Images/Ants/gray_ant_scout.png');
  AntSprites.player.Farmer = loadImage('Images/Ants/gray_ant_farmer.png');
  AntSprites.player.Builder = loadImage('Images/Ants/gray_ant_builder.png');
  AntSprites.player.Soldier = loadImage('Images/Ants/gray_ant_soldier.png');
  AntSprites.player.Warrior = loadImage('Images/Ants/gray_ant_soldier.png'); // Use soldier sprite
  AntSprites.player.Spitter = loadImage('Images/Ants/gray_ant_spitter.png');
  AntSprites.player.Queen = loadImage('Images/Ants/gray_ant_queen.png');
  AntSprites.player.Worker = loadImage('Images/Ants/gray_ant.png'); // Default worker
  
  // Enemy faction (blue ants)
  AntSprites.enemy.Scout = loadImage('Images/Ants/blue_ant.png');
  AntSprites.enemy.Farmer = loadImage('Images/Ants/blue_ant.png');
  AntSprites.enemy.Builder = loadImage('Images/Ants/blue_ant.png');
  AntSprites.enemy.Soldier = loadImage('Images/Ants/blue_ant.png');
  AntSprites.enemy.Warrior = loadImage('Images/Ants/blue_ant.png');
  AntSprites.enemy.Spitter = loadImage('Images/Ants/blue_ant.png');
  AntSprites.enemy.Queen = loadImage('Images/Ants/blue_ant_queen.png');
  AntSprites.enemy.Worker = loadImage('Images/Ants/blue_ant.png');
  
  // Neutral faction (brown ants)
  AntSprites.neutral.Scout = loadImage('Images/Ants/brown_ant.png');
  AntSprites.neutral.Farmer = loadImage('Images/Ants/brown_ant.png');
  AntSprites.neutral.Builder = loadImage('Images/Ants/brown_ant.png');
  AntSprites.neutral.Soldier = loadImage('Images/Ants/brown_ant.png');
  AntSprites.neutral.Warrior = loadImage('Images/Ants/brown_ant.png');
  AntSprites.neutral.Spitter = loadImage('Images/Ants/brown_ant.png');
  AntSprites.neutral.Queen = loadImage('Images/Ants/brown_ant_queen.png');
  AntSprites.neutral.Worker = loadImage('Images/Ants/brown_ant.png');
  
}

// Global exports
if (typeof window !== 'undefined') {
  window.AntSprites = AntSprites;
  window.antsPreloader = antsPreloader;
}

// Node.js export (for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AntSprites, antsPreloader };
}
