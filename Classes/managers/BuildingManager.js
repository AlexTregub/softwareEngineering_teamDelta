let Cone, Hill, Hive;

function BuildingPreloader(){
    Cone = loadImage('Images/Buildings/Cone.png');
    Hill = loadImage('Images/Buildings/Hill.png');
    Hive = loadImage('Images/Buildings/Hive.png');
}

class AbstractBuildingFactory {
  createBuilding(x, y, faction) {
    throw new Error("createBuilding() must be implemented by subclass");
  }
}

class AntCone extends AbstractBuildingFactory {
    createBuilding(x, y, faction) {
        return new Building(x, y, 91, 97, Cone, faction);
    }
}

class AntHill extends AbstractBuildingFactory {
    createBuilding(x, y, faction) {
        return new Building(x, y, 160, 100, Hill, faction);
    }
}

class HiveSource extends AbstractBuildingFactory {
    createBuilding(x, y, faction) {
        return new Building(x, y, 160, 160, Hive, faction);
    }
}



class Building extends Entity {
    constructor(x, y, width, height, img, faction) {
        super(x, y, width, height, {
            type: "Ant",
            imagePath: img,
            selectable: true,
            faction: faction
        });
        this._faction = faction;
        if(img){this.setImage(img)}
        this.lastFrameTime = performance.now();
    }

    _renderBoxHover() {}

    get _renderController() { return this.getController('render'); }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;

        if (!this.isActive()) return;
        
        // Update only safe controllers for buildings (avoid transform/movement which may conflict)
        const safeControllers = ['render', 'health', 'selection', 'interaction'];
        safeControllers.forEach(name => {
          const c = this.getController(name);
          if (c && typeof c.update === 'function') {
            try { c.update(); } catch (e) { console.warn(`Building ${name} update error:`, e); }
          }
        });
        
        // Ensure collision box and sprite are in sync with the entity's canonical position/size
        try {
          const pos = this.getPosition();
          const size = this.getSize();
          if (pos) this._collisionBox.setPosition(pos.x, pos.y);
          if (size) this._collisionBox.setSize(size.x, size.y);
          if (this._sprite && typeof this._sprite.setPosition === 'function') {
            // prefer sprite API to accept plain object if createVector isn't available
            try { this._sprite.setPosition(pos); } catch { /* fallback ignored */ }
          }
        } catch (e) {
          console.warn('Building sync error:', e);
        }
    }

    moveToLocation(x, y) {
        return;
    }

    render() {
        if (!this.isActive) return;
        super.render();
    }
}

// Simple factory registry + helper for convenience
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
  
  
  let building = factory.createBuilding(x, y, faction);
  return building;
}

// expose helper globally for convenience in sketch.js / console
if (typeof window !== 'undefined') window.createBuilding = createBuilding;
if (typeof module !== 'undefined' && module.exports) module.exports = { Building, AntCone, AntHill, HiveSource, createBuilding };


