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

// Global Currency Counter
function drawCurrencyUI() {
  push(); 
  noStroke();
  textFont(g_menuFont); 
  textSize(24);
  fill(255);  // white text
  textAlign(LEFT, TOP);
  text("Food: " + globalResource.length, 10, 10);
  pop();
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
