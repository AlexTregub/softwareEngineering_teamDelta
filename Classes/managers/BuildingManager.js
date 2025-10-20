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
        return new Building(x, y, 64, 64, Cone, faction);
    }
}

class AntHill extends AbstractBuildingFactory {
    createBuilding(x, y, faction) {
        return new Building(x, y, 128, 128, Hill, faction);
    }
}

class HiveSource extends AbstractBuildingFactory {
    createBuilding(x, y, faction) {
        return new Building(x, y, 64, 64, Hive, faction);
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
        this.x = x;
        this.y = y;
        this.lastFrameTime = performance.now();
    }



    get _renderController() { return this.getController('render'); }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;

        if (!this.isActive()) return;
        
        // Update Entity systems first
        super.update();
        console.log('Building update at', this.x, this.y);
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
}

// Simple factory registry + helper for convenience
const BuildingFactoryRegistry = {
  antcone: new AntCone(),
  anthill: new AntHill(),
  hivesource: new HiveSource()
};

function createBuilding(type, x, y, faction = 'neutral') {
  if (!type) return null;
  const key = String(type).toLowerCase();
  const factory = BuildingFactoryRegistry[key];
  if (!factory) return null;
  let building = factory.createBuilding(x, y, faction);
  building.update();
  return building;
}

// expose helper globally for convenience in sketch.js / console
if (typeof window !== 'undefined') window.createBuilding = createBuilding;
if (typeof module !== 'undefined' && module.exports) module.exports = { Building, AntCone, AntHill, HiveSource, createBuilding };


