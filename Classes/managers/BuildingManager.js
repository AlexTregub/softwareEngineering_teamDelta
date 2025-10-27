// ===============================
// 🏗️ Building Preloader
// ===============================
let Cone;
let Hill;
let Hive;

function BuildingPreloader() {
  Cone = loadImage('Images/Buildings/Cone/Cone1.png');
  Hill = loadImage('Images/Buildings/Hill/Hill1.png');
  Hive = loadImage('Images/Buildings/Hive/Hive1.png');
}


class AbstractBuildingFactory {
  constructor() {}
  createBuilding(x, y, faction) {
    throw new Error("createBuilding() must be implemented by subclass");
  }
}


class AntCone extends AbstractBuildingFactory {
  constructor() {
    super();
    this.info = {
      canUpgrade: true,
      upgradeCost: 0,
      progressions: {
        1: {
          image: () => loadImage('Images/Buildings/Cone/Cone2.png'),
          canUpgrade: false,    
          upgradeCost: null,
          progressions: {}
        }
      }
    };
  }

  createBuilding(x, y, faction) {
    return new Building(x, y, 91, 97, Cone, faction, this.info);
  }
}

class AntHill extends AbstractBuildingFactory {
  constructor() {
    super();
    this.info = {
      canUpgrade: true,
      upgradeCost: 0,
      progressions: {
        1: {
          image: () => loadImage('Images/Buildings/Hill/Hill2.png'),
          canUpgrade: false,    
          upgradeCost: null,
          progressions: {}
        }
      }
    };
  }

  createBuilding(x, y, faction) {
    return new Building(x, y, 160, 100, Hill, faction,this.info);
  }
}

class HiveSource extends AbstractBuildingFactory {
  constructor() {
    super();
    
    this.info = {
      canUpgrade: true,
      upgradeCost: 0,
      progressions: {
        1: {
          image: () => loadImage('Images/Buildings/Hive/Hive2.png'),
          canUpgrade: false,    
          upgradeCost: null,
          progressions: {}
        }
      }
    };
  }

  createBuilding(x, y, faction) {
    return new Building(x, y, 160, 160, Hive, faction, this.info);
  }
}


class Building extends Entity {
  constructor(x, y, width, height, img, faction, info) {
    super(x, y, width, height, {
      type: "Building",
      imagePath: img,
      selectable: true,
      faction: faction
    });


    // --- Basic properties ---
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._faction = faction;
    this._health = 100;
    this._maxHealth = 100;
    this._damage = 0;
    this._isDead = false;
    this.lastFrameTime = performance.now();
    this.isBoxHovered = false;
    this.info = info

    // -- Stats Buff --
    this.effectRange = 250;
    this._buffedAnts = new Set();



    // --- Spawning (ants) ---
    this._spawnEnabled = false;
    this._spawnInterval = 10; // seconds
    this._spawnTimer = 0.0;
    this._spawnCount = 1; // number of ants per interval
    // --- Controllers ---
    this._controllers.set('movement', null);

    // --- Image ---
    if (img) this.setImage(img);
  }

  getAnts(faction){
    return ants.filter(ant => ant.faction === faction);
  }

  statsBuff(){
    // Apply building-specific buffs
    const nearbyAnts = this.getAnts(this.faction);
    nearbyAnts.forEach(ant => {
      const range = dist(this._x, this._y, ant.posX, ant.posY);
      const defaultStats = ant.job.stats;
      const buff =  {
          health : defaultStats.health + 20,
          movementSpeed : defaultStats.movementSpeed + 90,
          strength : defaultStats.strength + 1,
          gatherSpeed : defaultStats.gatherSpeed + 0,
      }


      if(range <= this.effectRange && !this._buffedAnts.has(ant.id)){
        ant._applyJobStats(buff);
        console.log('Applying buff to ant ID:',buff);
        this._buffedAnts.add(ant.id);
      }
      else{
        if(this._buffedAnts.has(ant.id) && range > this.effectRange){   
          console.log('Reverting stats for ant ID:', defaultStats);      
          ant._applyJobStats(defaultStats);
          this._buffedAnts.delete(ant.id);
        }
      }
    })
  }

  upgradeBuilding() {
    if (!this.info || !this.info.progressions) return false;
    const next = this.info.progressions[1];
    if(this.info.upgradeCost > globalResource.length){ console.log('Not enough resources to upgrade'); return false; }
    if (!next) { console.log('No further upgrades'); return false; }

    const nextImage = typeof next.image === "function" ? next.image() : next.image;
    if (!nextImage) { console.log('Image not loaded yet'); return false; }

    try {
      this.setImage(nextImage);
      this._spawnInterval = Math.max(1, this._spawnInterval - 1);
      this._spawnCount += 1;
      this.info = next;
      console.log("Building upgraded!");
    } catch (e) {
      console.warn("Upgrade failed:", e);
      return false;
    }
    return true;
  }



  get _renderController() { return this.getController('render'); }
  get _healthController() { return this.getController('health'); }
  get _selectionController() { return this.getController('selection'); }

 
  update() {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    if (!this.isActive) return;
    super.update();
    this.statsBuff();
    this._updateHealthController();

    // Spawn ants if enabled — uses global antsSpawn(num, faction, x, y)
    if (this._spawnEnabled && typeof antsSpawn === 'function') {
      try {
        this._spawnTimer += deltaTime;
        while (this._spawnTimer >= this._spawnInterval) {
          this._spawnTimer -= this._spawnInterval;
          // compute building center
          const p = this.getPosition ? this.getPosition() : (this._pos || { x: 0, y: 0 });
          const s = this.getSize ? this.getSize() : (this._size || { x: width || 32, y: height || 32 });
          const centerX = p.x + (s.x / 2);
          const centerY = p.y + (s.y / 2);
          antsSpawn(this._spawnCount, this._faction || 'player', centerX , centerY);
        }
      } catch (e) { console.warn('Building spawn error', e); }
    }
  }

  _updateHealthController() {
    if (this._healthController) {
      this._healthController.update();
    }
  }


  get faction() { return this._faction; }
  get health() { return this._health; }
  get maxHealth() { return this._maxHealth; }
  get damage() { return this._damage; }

  get isSelected() {
    return this._delegate('selection', 'isSelected') || false;
  }

  set isSelected(value) {
    this._delegate('selection', 'setSelected', value);
  }

  takeDamage(amount) {
    const oldHealth = this._health;
    this._health = Math.max(0, this._health - amount);

    if (this._healthController && oldHealth > this._health) {
      this._healthController.onDamage();
    }

    if (this._health <= 0) {
      console.log("Building has died.");
    }

    return this._health;
  }

  heal(amount) {
    this._health = Math.min(this._maxHealth, this._health + (amount || 0));
    try {
      const hc = this.getController?.('health');
      if (hc && typeof hc.onHeal === 'function') hc.onHeal(amount, this._health);
    } catch (e) {}
    return this._health;
  }

  moveToLocation(x, y) {
    // Buildings don’t move
    return;
  }

  _renderBoxHover() {
    this._renderController.highlightBoxHover();
  }

  render() {
    if (!this.isActive) return;
    super.render();

    if (this._healthController) {
      this._healthController.render();
    }

    if (this.isBoxHovered) {
      this._renderBoxHover();
    }
  }

  die() {
    this.isActive = false;
    this._isDead = true;
    // remove from render lists
    const idx = Buildings.indexOf(this);
    if (idx !== -1) Buildings.splice(idx, 1);
    if (typeof window !== 'undefined' && Array.isArray(window.buildings)) {
      const wi = window.buildings.indexOf(this);
      if (wi !== -1) window.buildings.splice(wi, 1);
    }
    // remove from selectables
    if (typeof selectables !== 'undefined' && Array.isArray(selectables)) {
      const sidx = selectables.indexOf(this);
      if (sidx !== -1) selectables.splice(sidx, 1);
    }
    if (g_selectionBoxController && g_selectionBoxController.entities) g_selectionBoxController.entities = selectables;
    // other cleanup...
  }
}


const BuildingFactoryRegistry = {
  antcone: new AntCone(),
  anthill: new AntHill(),
  hivesource: new HiveSource()
};

function createBuilding(type, x, y, faction = 'neutral', snapGrid = false) {
  if (!type) return null;
  const key = String(type).toLowerCase();
  const factory = BuildingFactoryRegistry[key];
  if (!factory) return null;

  const building = factory.createBuilding(x, y, faction);
  if (!building) return null;

  // ensure building is active and registered in renderer arrays
  building.isActive = true;
  if (typeof window !== 'undefined') {
    window.buildings = window.buildings || [];
    if (!window.buildings.includes(building)) window.buildings.push(building);
  }
  if (typeof Buildings !== 'undefined' && !Buildings.includes(building)) Buildings.push(building);

  // Register in selectables so selection systems see this building
  if (typeof selectables !== 'undefined' && Array.isArray(selectables)) {
    if (!selectables.includes(building)) selectables.push(building);
  }
  // Ensure selection controller uses selectables reference (some controllers snapshot list)
  if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) {
    if (g_selectionBoxController.entities) g_selectionBoxController.entities = selectables;
  }

  return building;
}


if (typeof window !== 'undefined') {
  window.createBuilding = createBuilding;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Building,
    AntCone,
    AntHill,
    HiveSource,
    createBuilding
  };
}
