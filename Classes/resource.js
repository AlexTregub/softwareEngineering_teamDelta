let g_resourceList;
let g_resourceManager;

function resourcePreLoad(){
  greenLeaf = loadImage('Images/Resources/leaf.png');
  mapleLeaf = loadImage('Images/Resources/mapleLeaf.png');
  g_resourceList = new resourcesArray(); 
  g_resourceManager = new ResourceSpawner(1,50,g_resourceList); // (Interval,Capacity,List)
}


function setKey(x,y){
  return `${x},${y}`;
}

// Plan on using to detect ants collision
class resourcesArray {
  constructor() {
    this.resources = [];
  }

  getResourceList() {
    return this.resources;
  }

  drawAll() {
    let keys = Object.keys(this.resources);
    for(let k of keys){
      this.resources[k].draw();
    }
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
        ant:() => text("🐜: " + antIndex, style.textPos.x + (style.offsets.x * 2), style.textPos.y + (style.offsets.y * 3))
      }  
      break;
    case "reversed":
        renderList = {
        entities:() => text("Entities Rendered", style.textPos.x + (style.offsets.x * 0), style.textPos.y + (style.offsets.y * 3)),
        leaf:() => text("🍃 " + globalResource.length, style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 2)),
        fallLeaf:() => text("🍂 " + globalResource.length, style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 1)),
        ant:() => text("🐜: " + antIndex, style.textPos.x + (style.offsets.x * 0), style.textPos.y + (style.offsets.y * 0))
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

    this.assets = {
      greenLeaf: { 
        weight: 0.5, 
        make: () => {
          let x = random(0, g_canvasX - 20);
          let y = random(0, g_canvasY - 20);
          let w = 20, h = 20;

          return {
            type: "greenLeaf",
            x, y, w, h,
            draw: () => {
              image(greenLeaf, x, y, w, h);

              // hover detection
              if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
                push();
                noFill();
                stroke(255); // white outline
                strokeWeight(2);
                rect(x, y, w, h);
                pop();
              }
            }
          };
        }
      },

      mapleLeaf: { 
        weight: 0.8, 
        make: () => {
          let x = random(0, g_canvasX - 20);
          let y = random(0, g_canvasY - 20);
          let w = 20, h = 20;

          return {
            type: "mappleLeaf",
            x, y, w, h,
            draw: () => {
              image(mapleLeaf, x, y, w, h);

              // hover detection
              if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
                push();
                noFill();
                stroke(255); // white outline
                strokeWeight(2);
                rect(x, y, w, h);
                pop();
              }
            }
          };
        }
      },
    };

    // spawn every {interval} seconds
    this.timer = setInterval(() => this.spawn(), this.interval * 1000);
  }

  
  // Asset selected based on rarity, drawn and appened to list of resources
  spawn() {
    let list = this.resources.getResourceList();
  if (Object.keys(list).length >= this.maxAmount) return; 

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
}


// Spawn Resources
function resourcesSpawn(numToSpawn) {
    for (let i = 0; i < numToSpawn; i++) {
        let resourceType = random(['stick', 'leaf']); // Randomly choose a resource
        let img;
        let size = createVector(0,0);

        // Set the specifics for the randomly chosen resource
        if (resourceType === 'stick') {
            img = stickImg;
            size.set(30, 30)
        } else if (resourceType === 'leaf') {
            img = leafImg;
            size.set(30, 30);
        }
        
        // Create and add the new resource to the array
        let newResource = new Resource(random(0, 500), random(0, 500), size.x, size.y, resourceType, img);
        resources.push(newResource);
    }
}

// Update all resources
function resourcesUpdate() {
    for (let i = 0; i < resources.length; i++) {
        if (resources[i] && typeof resources[i].update === "function") {
            resources[i].update();
        }
    }
}

//
// RESOURCE CLASS
//
class Resource extends Entity {
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
  constructor(...args) {
    // Normalize arguments to (x, y, w, h, type, img)
    let x = 0, y = 0, w = 32, h = 32, type = 'stick', img = stickImg;

    if (args.length === 0) {
      // use defaults
    } else if (args.length === 1 && typeof args[0] === 'object' && args[0].x !== undefined) {
      // single vector-ish arg? treat as pos vector and use defaults for size
      x = args[0].x; y = args[0].y;
    } else if (args.length >= 2 && isVector2D(args[0]) && isVector2D(args[1])) {
      // (posVec, sizeVec, type?, img?)
      x = args[0].x; y = args[0].y; w = args[1].x; h = args[1].y; if (args[2]) type = args[2]; if (args[3]) img = args[3];
    } else if (args.length >= 4 && typeof args[0] === 'number') {
      // flattened: (x, y, w, h, type?, img?)
      x = args[0]; y = args[1]; w = args[2]; h = args[3]; if (args[4]) type = args[4]; if (args[5]) img = args[5];
    }

    // Call Entity constructor: Entity(x, y, width, height, options)
    super(x, y, w, h, { type: 'Resource', imagePath: img });

    // Resource specific state
    this._resourceIndex = resourceIndex++;
    this._type = type;
    this._isCarried = false;
    this._carrier = null;

    // Ensure sprite uses the provided image if RenderController not present
    if (this._sprite && img) this._sprite.setImage(img);
  }

  // Compatibility getters/setters that delegate to Entity transform/sprite
  get posX() { return this.getPosition().x; }
  set posX(v) { const p = this.getPosition(); this.setPosition(v, p.y); }

  get posY() { return this.getPosition().y; }
  set posY(v) { const p = this.getPosition(); this.setPosition(p.x, v); }

  get sizeX() { return this.getSize().x; }
  set sizeX(v) { const s = this.getSize(); this.setSize(v, s.y); }

  get sizeY() { return this.getSize().y; }
  set sizeY(v) { const s = this.getSize(); this.setSize(s.x, v); }

  // Legacy aliases to match older plain-object resources that used x/y/w/h
  get x() { return this.posX; }
  set x(v) { this.posX = v; }

  get y() { return this.posY; }
  set y(v) { this.posY = v; }

  get w() { return this.sizeX; }
  set w(v) { this.sizeX = v; }

  get h() { return this.sizeY; }
  set h(v) { this.sizeY = v; }

  get type() { return this._type; }
  get isCarried() { return !!this._isCarried; }
  get carrier() { return this._carrier; }

  // Rendering: delegate to Entity.render() which will use RenderController if available
  render() { return super.render(); }

  // Legacy compatibility: some code expects a `.draw()` method on resource objects.
  // Provide a small adapter that performs rendering/highlighting but does not
  // run the full update loop (to avoid double-updating when both update() and
  // draw() are called in different loops).
  draw() {
    this.render();
    this.highlight();
  }

  /**
   * Highlight when hovered and not carried. Uses the RenderController if present
   * otherwise falls back to simple p5 drawing using the entity's position/size.
   */
  highlight() {
    if (this._isCarried) return;

    // If there's a selection/interaction controller, prefer its hover test
    const interaction = this.getController('interaction');
    const isHover = interaction ? interaction.isMouseOver(mouseX, mouseY) : this.isMouseOver(mouseX, mouseY);

    if (!isHover) return;

    const renderController = this.getController('render');
    if (renderController && typeof renderController.renderOutlineHighlight === 'function') {
      const pos = this.getPosition(); const size = this.getSize();
      renderController.renderOutlineHighlight(pos, size, [255,255,255,255], 2);
      return;
    }

    // Fallback p5 highlight
    if (typeof push === 'function') push();
    if (typeof noFill === 'function') noFill();
    if (typeof stroke === 'function') stroke(255);
    if (typeof strokeWeight === 'function') strokeWeight(2);
    const pos = this.getPosition(); const size = this.getSize();
    if (typeof rect === 'function') rect(pos.x, pos.y, size.x, size.y);
    if (typeof pop === 'function') pop();
  }

  isMouseOver(mx, my) {
    const pos = this.getPosition(); const size = this.getSize();
    return (mx >= pos.x && mx <= pos.x + size.x && my >= pos.y && my <= pos.y + size.y);
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
      this.highlight();
    }
  }

}