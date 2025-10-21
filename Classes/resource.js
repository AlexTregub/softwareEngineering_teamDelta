let g_resourceList;
let g_resourceManager;
let resourceIndex = 0;

const RESOURCE_SPAWN_INTERVAL = 1; // seconds
const MAX_RESOURCE_CAPACITY = 300;

function resourcePreLoad(){
  // Create the new unified resource system manager
  g_resourceManager = new ResourceSystemManager(RESOURCE_SPAWN_INTERVAL, MAX_RESOURCE_CAPACITY); // (Interval, Capacity)
  
  // Keep g_resourceList for backward compatibility - it will delegate to g_resourceManager
  g_resourceList = new resourcesArrayCompat(g_resourceManager);
  
  // Register all resource types declaratively
  registerAllResourceTypes();
}

/**
 * Register all resource types used in the game.
 * This centralizes all resource definitions in one place.
 */
function registerAllResourceTypes() {
  // Existing leaf resources
  g_resourceManager.registerResourceType('greenLeaf', {
    imagePath: 'Images/Resources/leaf.png',
    weight: 0.5,
    canBePickedUp: true,
    size: { width: 20, height: 20 },
    displayName: 'Green Leaf',
    category: 'food'
  });
  
  g_resourceManager.registerResourceType('mapleLeaf', {
    imagePath: 'Images/Resources/mapleLeaf.png',
    weight: 0.8,
    canBePickedUp: true,
    size: { width: 20, height: 20 },
    displayName: 'Maple Leaf',
    category: 'food'
  });

  g_resourceManager.registerResourceType('stick', {
    imagePath: 'Images/Resources/stick.png',
    weight: 0.6,
    canBePickedUp: true,
    initialSpawnCount: 25, 
    size: { width: 20, height: 20 },
    displayName: 'Stick',
    category: 'materials'
  });

  g_resourceManager.registerResourceType('stone', {
    imagePath: 'Images/Resources/stone.png',
    weight: 0,  // No random spawning during gameplay
    canBePickedUp: false,  // Cannot be picked up by entities
    initialSpawnCount: 25,  // Spawn 25 stones when game starts
    spawnPattern: 'random',  // Distribute randomly across map
    size: { width: 20, height: 20 },
    isObstacle: true,  // Acts as terrain obstacle
    displayName: 'Stone',
    category: 'terrain'
  });
}


function setKey(x,y){
  return `${x},${y}`;
}

// Legacy resourcesArray class - kept for backward compatibility
class resourcesArray {
  constructor() {
    this.resources = [];
  }

  getResourceList() {
    return this.resources;
  }

  drawAll() {
    for (const r of this.resources) {
      // Prefer modern Entity/Controller render path; fallback to legacy draw if encountered
      try {
        if (r && typeof r.render === 'function') r.render();
        else if (r && typeof r.draw === 'function') r.draw();
      } catch (e) { /* tolerate faulty draw implementations */ }
    }
  }

  updateAll() {
    for (const r of this.resources) {
      try {
        if (r && typeof r.update === 'function') r.update();
      } catch (_) { /* ignore individual update errors */ }
    }
  }
}

// Compatibility wrapper that delegates to ResourceSystemManager
class resourcesArrayCompat {
  constructor(resourceSystemManager) {
    this.resourceSystemManager = resourceSystemManager;
  }

  getResourceList() {
    return this.resourceSystemManager ? this.resourceSystemManager.getResourceList() : [];
  }

  drawAll() {
    if (this.resourceSystemManager) {
      this.resourceSystemManager.drawAll();
    }
  }

  updateAll() {
    if (this.resourceSystemManager) {
      this.resourceSystemManager.updateAll();
    }
  }

  setSelectedType(resourceType) {
    if (this.resourceSystemManager && typeof this.resourceSystemManager.setSelectedType === 'function') {
      this.resourceSystemManager.setSelectedType(resourceType);
    }
  }

  // Additional compatibility methods
  get resources() {
    return this.getResourceList();
  }

  set resources(value) {
    // For compatibility, but discourage direct assignment
    if (typeof globalThis.logVerbose === 'function') {
      globalThis.logVerbose('ResourcesArrayCompat: Direct resource assignment deprecated, use ResourceSystemManager methods instead');
    }
  }

  clear() {
    if (this.resourceSystemManager && typeof this.resourceSystemManager.clearAllResources === 'function') {
      return this.resourceSystemManager.clearAllResources();
    }
    return [];
  }
}

function getCurrenciesRenderStyles() {
  let screenOffsetMutiplier = .0625
  const Styles = {
      U_LEFT_DEF: {
        name: "upperLeft",
        textSize: 24,
        textColor: 'white',
        textAlign: [LEFT, TOP],
        textFont: g_menuFont,
        textPos: {
          x:0,
          y:0
        },
        offsets: {
          x: 0,
          y: 25
        }
    },
    U_RIGHT_DEF: {
        name: "upperRight",
        textSize: 24,
        textColor: 'white',
        textAlign: [RIGHT, TOP],
        textFont: g_menuFont,
        textPos: {
          x:g_canvasX - (g_canvasX * screenOffsetMutiplier),
          y:0
        },
        offsets: {
          x: 0,
          y: 25
        }
    },
    L_LEFT_DEF: {
        name: "lowerLeft",
        textSize: 24,
        textColor: 'white',
        textAlign: [LEFT, BOTTOM],
        textFont: g_menuFont,
        textPos: {
          x:0,
          y:g_canvasY - (g_canvasY * screenOffsetMutiplier)
        },
        offsets: {
          x: 0,
          y: -25
        }
    },
    L_RIGHT_DEF: {
        name: "lowerRight",
        textSize: 24,
        textColor: 'white',
        textAlign: [RIGHT, BOTTOM],
        textFont: g_menuFont,
        textPos: {
          x:g_canvasX - (g_canvasX * screenOffsetMutiplier),
          y:g_canvasY - (g_canvasY * screenOffsetMutiplier)
        },
        offsets: {
          x: 0,
          y: -25
        },
    },
      H_TOP: {
        name: "hTop",
        textSize: 24,
        textColor: 'white',
        textAlign: [LEFT, TOP],
        textFont: g_menuFont,
        textPos: {
          x:g_canvasX/2 - 130,
          y:20
        },
        offsets: {
          x: 80,
          y: 0
        }
      }
  };
  return Styles
}

function setRenderListLocation(style, order = "standard"){
  let renderList = {}
  switch (order) {
    case "standard":
      renderList = {
        entities:() => text("Entities Rendered", style.textPos.x + (style.offsets.x * 0), style.textPos.y + (style.offsets.y * 0)),
        leaf:() => text("🍃 " + globalResource.length, style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 1)),
        fallLeaf:() => text("🍂 " + globalResource.length, style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 2)),
        ant:() => text("🐜: " + ants.length, style.textPos.x + (style.offsets.x * 2), style.textPos.y + (style.offsets.y * 3))
      }  
      break;
    case "reversed":
        renderList = {
        entities:() => text("Entities Rendered", style.textPos.x + (style.offsets.x * 0), style.textPos.y + (style.offsets.y * 3)),
        leaf:() => text("🍃 " + globalResource.length, style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 2)),
        fallLeaf:() => text("🍂 " + globalResource.length, style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 1)),
        ant:() => text("🐜: " + ants.length, style.textPos.x + (style.offsets.x * 0), style.textPos.y + (style.offsets.y * 0))
      }  
      break;
    default:
      break;
  } 
  return renderList;
}

function getRenderList(style = getCurrenciesRenderStyles().U_LEFT_DEF, order = "") {
  let renderList = {}
  
switch (style.name) {
  case "upperLeft":
  case "upperRight":
  case "hTop":
    order = "standard"; break;
  case "lowerLeft":
  case "lowerRight":
    order = "reversed"; break;
  }
  renderList = setRenderListLocation (style, order)
  return renderList
}

function renderCurrencies(){
  let style = getCurrenciesRenderStyles().U_RIGHT_DEF
  let renderList = getRenderList(style)
  renderVList(renderList.entities,style);
  renderVList(renderList.leaf,style);
  renderVList(renderList.fallLeaf,style);
  renderVList(renderList.ant,style);  
}

// Delegator
function renderVList(drawFn, style) { 
  if (typeof drawFn === 'function') textNoStroke(drawFn,style);
}

// ResourceSpawner(Time Between Each Spawn, Max Amount, class resourcesArray)
class ResourceSpawner {
  constructor(interval, maxAmount, resources) {
    this.maxAmount = maxAmount;
    this.interval = interval;
    this.resources = resources;
    this.timer = null;
    this.isActive = false;

    this.assets = {
      greenLeaf: { 
        weight: 0.5, 
        make: () => {
          const x = random(0, g_canvasX - 20);
          const y = random(0, g_canvasY - 20);
          return Resource.createGreenLeaf(x, y);
        }
      },

      mapleLeaf: { 
        weight: 0.8, 
        make: () => {
          const x = random(0, g_canvasX - 20);
          const y = random(0, g_canvasY - 20);
          return Resource.createMapleLeaf(x, y);
        }
      },
    };

    // Register for game state changes to start/stop spawning automatically
    if (typeof GameState !== 'undefined') {
      GameState.onStateChange((newState, oldState) => {
        if (newState === 'PLAYING' || newState === 'SANDBOX') {
          this.start();
        } else {
          this.stop();
        }
      });

      // If we're already in PLAYING state when created, start immediately
      if (GameState.getState() === 'PLAYING' || GameState.getState() === 'SANDBOX') {
        this.start();
      }
    } else {
      // Fallback for environments without GameState (like tests) - start immediately
      this.start();
    }
  }

  // Start the spawning timer
  start() {
    if (!this.isActive) {
      this.isActive = true;
      this.timer = setInterval(() => this.spawn(), this.interval * 1000);
      console.log('ResourceSpawner: Started spawning resources');
    }
  }

  // Stop the spawning timer
  stop() {
    if (this.isActive) {
      this.isActive = false;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      console.log('ResourceSpawner: Stopped spawning resources');
    }
  }

  
  // Asset selected based on rarity, drawn and appened to list of resources
  spawn() {
    // Only spawn if active
    if (!this.isActive) return;

    let list = this.resources.getResourceList();
    if (list.length >= this.maxAmount) return;

    let keys = Object.keys(this.assets);
    let total = keys.reduce((sum, k) => sum + this.assets[k].weight, 0);
    let r = random() * total;

    let chosenKey;
    for (let k of keys) {
      r -= this.assets[k].weight;
      if (r <= 0) {
        chosenKey = k;
        break;
      }
    }

    let chosen = this.assets[chosenKey].make();
    list.push(chosen);
  }

  // Manual spawn method for testing or immediate spawning
  forceSpawn() {
    const wasActive = this.isActive;
    this.isActive = true; // Temporarily enable for this spawn
    this.spawn();
    this.isActive = wasActive; // Restore previous state
  }
}

  /**
   * Resource
   * A small wrapper entity representing a pick-upable resource (leaf, stick, etc.).
   * Delegates transform/render to Entity and controllers when available but keeps
   * a small backward-compatible surface API used elsewhere in the codebase.
   *
   * Constructor accepts either (posVec, sizeVec, type, img) or the older
   * flattened signature used elsewhere: (x, y, w, h, type, img). We normalize
   * both forms into the Entity constructor.
   */
class Resource extends Entity {

  /**
   * Create a Resource entity.
   * @param {number} [x=0] - X position
   * @param {number} [y=0] - Y position  
   * @param {number} [width=20] - Width
   * @param {number} [height=20] - Height
   * @param {Object} [options={}] - Resource options (resourceType, imagePath, etc.)
   */
  constructor(x = 0, y = 0, width = 20, height = 20, options = {}) {
    // Handle legacy calls: new Resource(x, y, w, h, type, img)
    if (arguments.length >= 5 && typeof arguments[4] === 'string') {
      options = { resourceType: arguments[4], imagePath: arguments[5], ...options };
    }

    // Set resource type and resolve image
    const resourceType = options.resourceType || 'leaf';
    const imagePath = options.imagePath || Resource._getImageForType(resourceType);

    // Configure Entity options
    const entityOptions = {
      type: 'Resource',
      imagePath: imagePath,
      selectable: true,
      movementSpeed: 0,  // Resources should not move
      ...options
    };

    // Call Entity constructor
    super(x, y, width, height, entityOptions);

    // Resource specific state
    this._resourceIndex = resourceIndex++;
    this._resourceType = resourceType;
    this._isCarried = false;
    this._carrier = null;
  }

  // Static helper to resolve images by type
  static _getImageForType(type) {
    switch (type) {
      case 'greenLeaf':
      case 'leaf':
        return (typeof greenLeaf !== 'undefined' && greenLeaf) || null;
      case 'mapleLeaf':
        return (typeof mapleLeaf !== 'undefined' && mapleLeaf) || null;
      default:
        return (typeof greenLeaf !== 'undefined' && greenLeaf) || 
               (typeof mapleLeaf !== 'undefined' && mapleLeaf) || null;
    }
  }

  // Factory methods for common resource types
  static createGreenLeaf(x, y) {
    return new Resource(x, y, 20, 20, { resourceType: 'greenLeaf' });
  }

  static createMapleLeaf(x, y) {
    return new Resource(x, y, 20, 20, { resourceType: 'mapleLeaf' });
  }

  static createStick(x, y) {
    return new Resource(x, y, 20, 20, { resourceType: 'stick' });
  }

  static createStone(x, y) {
    return new Resource(x, y, 20, 20, { resourceType: 'stone' });
  }

  get type() { return this._resourceType; }
  get resourceType() { return this._resourceType; }
  get isCarried() { return !!this._isCarried; }
  get carrier() { return this._carrier; }

  // Rendering: delegate to Entity.render() which will use RenderController if available
  render() {
    super.render();
    // Apply hover highlight in the modern path using enhanced API
    if (this.isMouseOver(mouseX, mouseY)) {
      this.highlight.spinning();
    } else {
      this.highlight.clear();
    }
  }

  isMouseOver(mx, my) {
    const pos = this.getPosition(); const size = this.getSize();
    return (mx >= pos.x && mx <= pos.x + size.x && my >= pos.y && my <= pos.y + size.y);
  }

  applyHighlight() {
    if (this.highlight && typeof this.highlight === 'object' && this.highlight.hover) {
        this.highlight.hover();
    } else {
      verboseLog("No hover effect available");
    }
  }

  pickUp(antObject) {
    if (!this._isCarried) {
      this._isCarried = true;
      this._carrier = antObject;
    }
  }

  drop(x = null, y = null) {
    this._isCarried = false;
    this._carrier = null;
    if (x !== null && y !== null) this.setPosition(x, y);
  }

  update() {
    // If carried, follow carrier transform
    if (this._isCarried && this._carrier) {
      try {
        this.setPosition(this._carrier.posX || this._carrier.getPosition().x, this._carrier.posY || this._carrier.getPosition().y);
      } catch (e) {
        // Best-effort fallback
        const p = this._carrier.getPosition ? this._carrier.getPosition() : { x: this._carrier.posX, y: this._carrier.posY };
        this.setPosition(p.x, p.y);
      }
    }

    // Let Entity update controllers/sprite
    super.update();

    // After update, optionally render/highlight in legacy flow
    // If RenderController exists it will handle rendering in Entity.render()
    if (!this.getController('render')) {
      this.render();
      this.applyHighlight();
    }
  }

}