let apple;
let cherry;
let resourceList;
let resourceManager;

function resourcePreLoad(){
  greenLeaf = loadImage('Images/Resources/leaf.png');
  mapleLeaf = loadImage('Images/Resources/mapleLeaf.png');
  resourceList = new resourcesArray(); 
  resourceManager = new Resource(1,50,resourceList); // (Interval,Capacity,List)
}


function setKey(x,y){
  return `${x},${y}`;
}

function getResourceMousePosition() {
  if (typeof getWorldMousePosition === 'function') {
    return getWorldMousePosition();
  }
  return { x: mouseX, y: mouseY };
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

// Resource(Time Betwee Each Spawn, Max Amount, class resourcesArray)
class Resource {
  constructor(interval, maxAmount, resources) {
    this.maxAmount = maxAmount;
    this.interval = interval;
    this.resources = resources;

    this.assets = {
      greenLeaf: { 
        weight: 0.5, 
        make: () => {
          let x = random(0, CANVAS_X - 20);
          let y = random(0, CANVAS_Y - 20);
          let w = 20, h = 20;

          return {
            type: "greenLeaf",
            x, y, w, h,
            draw: () => {
              image(greenLeaf, x, y, w, h);

              // hover detection
              const mousePoint = getResourceMousePosition();
              if (mousePoint.x >= x && mousePoint.x <= x + w && mousePoint.y >= y && mousePoint.y <= y + h) {
                const zoom = getCurrentZoom();
                push();
                noFill();
                stroke(255); // white outline
                strokeWeight(2 / zoom);
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
          let x = random(0, CANVAS_X - 20);
          let y = random(0, CANVAS_Y - 20);
          let w = 20, h = 20;

          return {
            type: "mappleLeaf",
            x, y, w, h,
            draw: () => {
              image(mapleLeaf, x, y, w, h);

              // hover detection
              const mousePoint = getResourceMousePosition();
              if (mousePoint.x >= x && mousePoint.x <= x + w && mousePoint.y >= y && mousePoint.y <= y + h) {
                const zoom = (typeof cameraZoom === 'number' && cameraZoom !== 0) ? cameraZoom : 1;
                push();
                noFill();
                stroke(255); // white outline
                strokeWeight(2 / zoom);
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
