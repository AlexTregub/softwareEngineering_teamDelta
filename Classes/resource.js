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
        food:() => text("Food: " + globalResource.length, style.textPos.x + (style.offsets.x * 0), style.textPos.y + (style.offsets.y * 0)),
        leaf:() => text("🍃 " + globalResource.length, style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 1)),
        ant:() => text("🐜: " + globalResource.length, style.textPos.x + (style.offsets.x * 2), style.textPos.y + (style.offsets.y * 2))
      }  
      break;
    case "reversed":
        renderList = {
        food:() => text("Food: " + globalResource.length, style.textPos.x + (style.offsets.x * 2), style.textPos.y + (style.offsets.y * 2)),
        leaf:() => text("🍃 " + globalResource.length, style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 1)),
        ant:() => text("🐜: " + globalResource.length, style.textPos.x + (style.offsets.x * 0), style.textPos.y + (style.offsets.y * 0))
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
  let style = getCurrenciesRenderStyles().U_LEFT_DEF
  let renderList = getRenderList(style)
  renderVList(renderList.food,style);
  renderVList(renderList.leaf,style);
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
