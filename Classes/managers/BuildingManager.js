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
  UI   = loadImage('Images/Buildings/UI/building_box.png');
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
    this.isPlayerNearby = false;
    this.menuActive = false;
    this.promptRange = 100; 
  }

  createBuilding(x, y, faction,tileType=['grass']) {
    let a = g_activeMap.sampleTiles(tileType,1); // 

    let tilex = a[0][0]; // Picks initial random position
    let tiley = a[0][1]; // ...

    // for (let pos in a) { // pos is an index in a
    //   // let pos = a[pos]

    //   let temp = a[pos]
    //   // console.log(temp)
    //   // if (temp[0] < 30 & temp[0] > -30 & temp[1] < 30 & temp[1] > -30) { // Bounds close to center
    //   //   tilex = temp[0]
    //   //   tiley = temp[1] // tile positions (grid) 

    //   //   // console.log("DONE DID IT ")
    //   //   break
    //   // }
    // }

    let convPos = g_activeMap.renderConversion.convPosToCanvas([tilex,tiley])

    let cone = new Building(convPos[0], convPos[1], 160, 100, Cone, faction, this.info);
    
    // attach player detection + prompt behavior
    cone.promptRange = this.promptRange;
    cone.isPlayerNearby = false;

    cone.update = function() {
      Building.prototype.update.call(this);
      const queen = getQueen?.();
      if (!queen) return;

      const range = dist(this._x + 50, this._y, queen.posX, queen.posY);
      this.isPlayerNearby = range < this.promptRange;
    };

    cone.render = function() {
      Building.prototype.render.call(this);
      const queen = getQueen?.();

      // draw prompt if player close
      if(this.isPlayerNearby && this._isDead){
        push();
        textAlign(CENTER);
        textSize(16);
        fill(255);
        textFont(terrariaFont);

        const hillPos = this.getPosition()
        const renderPos = this._controllers.get("render").worldToScreenPosition(hillPos)

        text("[E] Rebuild", renderPos.x , renderPos.y - 10);
        pop();
      }
      
    };

    return cone;
  }

}

class AntHill extends AbstractBuildingFactory { // Main anthill 
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
    this.isPlayerNearby = false;
    this.menuActive = false;
    this.promptRange = 100; 
  }

  createBuilding(x, y, faction,tileType=['grass']) {
    let a = g_activeMap.sampleTiles(tileType,10000); // 

    let tilex = a[0][0]; // Picks initial random position
    let tiley = a[0][1]; // ...

    for (let pos in a) { // pos is an index in a
      // let pos = a[pos]

      let temp = a[pos]
      // console.log(temp)
      if (temp[0] < 30 & temp[0] > -30 & temp[1] < 30 & temp[1] > -30) { // Bounds close to center
        tilex = temp[0]
        tiley = temp[1] // tile positions (grid) 

        // console.log("DONE DID IT ")
        break
      }
    }

    if (tilex > 30 | tilex < -30 | tiley > 30 | tiley < -30) {
      tilex = 0
      tiley = 0
      console.log("WARNING: DEFAULT SPAWN POS FOR ANTHILL")
    } 

    let convPos = g_activeMap.renderConversion.convPosToCanvas([tilex,tiley])


    const hill = new Building(convPos[0], convPos[1], 160, 100, Hill, faction, this.info); // AntHill = Building<-Entity(canvasCoords) + buildingType

    hill.buildingType = "anthill";
    
    // attach player detection + prompt behavior
    hill.promptRange = this.promptRange;
    hill.isPlayerNearby = false;

    hill.update = function() {
      Building.prototype.update.call(this);
      const queen = getQueen?.();
      if (!queen) return;

      const range = dist(this._x + 50, this._y, queen.posX, queen.posY);
      this.isPlayerNearby = range < this.promptRange;
    };

    hill.render = function() {
      Building.prototype.render.call(this);
      const queen = getQueen?.();

      // draw prompt if player close
      if(this.isPlayerNearby && !this._isDead && this._faction == "player"){
        push();
        textAlign(CENTER);
        textSize(16);
        fill(255);
        textFont(terrariaFont);

        // console.log(queen.getPosition())
        // const queenPos = queen.getPosition()
        // console.log(queenPos)

        // console.log(Building.prototype.getPosition())
        // console.log(this.getPosition())
        const hillPos = this.getPosition()

        // console.log(this.getCurrentPosition())

        // console.log(this._controllers.get("movement"))
        // console.log(this._controllers.get("render").worldToScreenPosition(hillPos))

        const renderPos = this._controllers.get("render").worldToScreenPosition(hillPos)

        // text("[E] Open Hill Menu", queen.posX , queen.posY - 10);
        text("[E] Open Hill Menu", renderPos.x , renderPos.y - 10);
        pop();
      }

      if(this.isPlayerNearby && this._isDead){
        push();
        textAlign(CENTER);
        textSize(16);
        fill(255);
        textFont(terrariaFont);

        const hillPos = this.getPosition()
        const renderPos = this._controllers.get("render").worldToScreenPosition(hillPos)
        // console.log(hillPos,renderPos)

        // text("[E] Rebuild", queen.posX , queen.posY - 10);
        text("[E] Rebuild", renderPos.x , renderPos.y-10);
        pop();
      }
      
    };

    return hill;
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
    return new Building(x, y, 160, 160, Hive, faction, this.info, tileType = "stone");
  }
}



class Building extends Entity {
  constructor(x, y, width, height, img, faction, info,tileType=['grass','moss','moss_2','moss_3']) {
    // let a = g_activeMap.sampleTiles(tileType,10000); // 

    // let tilex = a[0][0]; // Picks initial random position
    // let tiley = a[0][1]; // ...

    // for (let pos in a) { // pos is an index in a
    //   // let pos = a[pos]

    //   let temp = a[pos]
    //   // console.log(temp)
    //   if (temp[0] < 30 & temp[0] > -30 & temp[1] < 30 & temp[1] > -30) { // Bounds close to center
    //     tilex = temp[0]
    //     tiley = temp[1] // tile positions (grid) 

    //     // console.log("DONE DID IT ")
    //     break
    //   }
    // }

    // let convPos = g_activeMap.renderConversion.convPosToCanvas([tilex,tiley])

    super(x, y, width, height, {
      type: "Building",
      imagePath: img,
      selectable: true,
      faction: faction
    });


    // // --- Basic properties ---
    // this._x = g_activeMap.renderConversion.convPosToCanvas([tilex,tiley])[0];
    // this._y = g_activeMap.renderConversion.convPosToCanvas([tilex,tiley])[1];
    this._x = x;
    this._y = y;

    // Included for legacy compatibility
    this.posX = x;
    this.posY = y;

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
    this.effectRange = 100;
    this._buffedAnts = new Set();

    // Ants Inside Building
    this.antsInside = [];

    // --- Spawning (ants) ---
    this._spawnEnabled = false;
    this._spawnInterval = 60; // seconds
    this._spawnTimer = 0.0;
    this._spawnCount = 1; // number of ants per interval
    // --- Controllers ---
    this._controllers.set('movement', null);

    // --- Image ---
    this.image = img;
    if (img) this.setImage(img);
  }

  enter(ant){
    this.antsInside.push(ant);
    ant.onEnterHive();
  }

  getAnts(faction){
    return ants.filter(ant => (ant.faction === faction || ant.faction === 'neutral'));
  }
  
  _releaseAnts(){
    for(let ant of this.antsInside){
      ant.isActive = true;
      spawnAntByType(ant);
      console.log("Releasing ant from Hive",ant.jobName);
      this.antsInside = this.antsInside.filter(a => a !== ant);
    }
  }

  statsBuff(){
    // Apply building-specific buffs
    const nearbyAnts = this.getAnts(this.faction);
    nearbyAnts.forEach(ant => {
      const range = dist(this._x, this._y, ant.posX, ant.posY);
      const defaultStats = ant.job.stats;
      const buff = {
        health: defaultStats.health,           // +0% max health
        movementSpeed: defaultStats.movementSpeed , // +0% movement
        strength: defaultStats.strength  ,       // +5% strength
        gatherSpeed: defaultStats.gatherSpeed   // +10% gather efficiency
      };


      if(range <= this.effectRange && !this._buffedAnts.has(ant.id)  && ant._faction === this._faction){
        ant._applyJobStats(buff);
        this._buffedAnts.add(ant.id);
      }
      else{
        if(this._buffedAnts.has(ant.id) && range > this.effectRange){   
          ant._applyJobStats(defaultStats);
          this._buffedAnts.delete(ant.id);
        }
      }
    })
  }

  downgradeBuilding() {
    if (!this.previousStage) {
      console.log("No downgrade available");
      return false;
    }


    this.setImage(this.previousStage.image);
    this._maxHealth = this.previousStage.maxHealth;
    this._spawnInterval = this.previousStage.spawnInterval;
    this._spawnCount = this.previousStage.spawnCount;
    this.info = this.previousStage.info;

    // Reset current health
    this._health = this._maxHealth;

    // clear the saved stage so you don't double-downgrade
    this.previousStage = null;
    this._spawnEnabled = false;

    return true;
  }


  // UPGRADE BUILDING \\
  upgradeBuilding() {
    if (!this.info || !this.info.progressions) return false;

    const next = this.info.progressions[1];
    if (!next) return false;

    const nextImage = typeof next.image === "function" ? next.image() : next.image;

    //console.log("image", this.image);
    this.previousStage = {
      image: this.image,        // current image
      maxHealth: this._maxHealth,
      spawnInterval: this._spawnInterval,
      spawnCount: this._spawnCount,
      info: this.info           // current progression info
    };


    // --- APPLY UPGRADE ---
    this.setImage(nextImage);
    this._spawnInterval = Math.max(1, this._spawnInterval - 1);
    this._spawnCount += 1;
    this._maxHealth = Math.round(this._maxHealth * 1.25);
    this._health = this._maxHealth;

    this.info = next;
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
    if (this._spawnEnabled && typeof antsSpawn === 'function' && GameState.isInGame()) {
      try {
        this._spawnTimer += deltaTime;
        while (this._spawnTimer >= this._spawnInterval) {
          this._spawnTimer -= this._spawnInterval;
          // compute building center
          const p = this.getPosition ? this.getPosition() : (this._pos || { x: 0, y: 0 });
          const s = this.getSize ? this.getSize() : (this._size || { x: width || 32, y: height || 32 });
          const centerX = p.x + (s.x / 2);
          const centerY = p.y + (s.y / 2);
          antsSpawn(this._spawnCount, this._faction, centerX , centerY);
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
      this.die();
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

  rebuildBuilding(){
    this._isDead = false;
    this._faction = 'player';
    this._spawnEnabled = true;

    this.upgradeBuilding();
  }

  _renderBoxHover() {
    this._renderController.highlightBoxHover();
  }

  render() {

    // Release ant when threat is gone
    if(factionList[this._faction] && factionList[this._faction].isUnderAttack == null && this.antsInside.length > 0){
      this._releaseAnts();
    }


    super.render();

    if (this._healthController) {
      this._healthController.render();
    }

    if (this.isBoxHovered) {
      this._renderBoxHover();
    }



  }

  die() {
    this._releaseAnts();
    this._isDead = true;
    this.downgradeBuilding();


    // remove from render lists
    // const idx = Buildings.indexOf(this);
    // if (idx !== -1) Buildings.splice(idx, 1);
    // if (typeof window !== 'undefined' && Array.isArray(window.buildings)) {
    //   const wi = window.buildings.indexOf(this);
    //   if (wi !== -1) window.buildings.splice(wi, 1);
    // }
    // // remove from selectables
    // if (typeof selectables !== 'undefined' && Array.isArray(selectables)) {
    //   const sidx = selectables.indexOf(this);
    //   if (sidx !== -1) selectables.splice(sidx, 1);

    // }
    // if (g_selectionBoxController && g_selectionBoxController.entities) g_selectionBoxController.entities = selectables;
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
    window.Buildings = window.Buildings || [];
    if (!window.Buildings.includes(building)) window.Buildings.push(building);
  }

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
