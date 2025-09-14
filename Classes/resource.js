let apple;
let cherry;
let resourceList;
let resourceManager;

function resourcePreLoad(){
  apple = loadImage('Images/Resources/apple.png');
  cherry = loadImage('Images/Resources/cherry.png');
  resourceList = new resourcesArray(); 
  resourceManager = new Resource(5,10,resourceList); 
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
    for (let r of this.resources) {
      r.draw();
    }
  }
}

// Resource(Time Betwee Each Spawn, Max Amount, class resourcesArray)
class Resource {
  constructor(interval, maxAmount, resources) {
    this.maxAmount = maxAmount;
    this.interval = interval;
    this.resources = resources;

    // 
    this.assets = {
      apple: { 
        weight: 0.5, 
        make: () => {
          let x = random(0, CANVAS_X-20);
          let y = random(0, CANVAS_Y-20);
          return {
            type: "apple",
            x, y, w: 20, h: 20,
            draw: () => image(apple, x, y, 20, 20)
          };
        }
      },

      cherry: { 
        weight: 0.8, 
        make: () => {
          let x = random(0, CANVAS_X-20);
          let y = random(0, CANVAS_Y-20);
          return {
            type: "cherry",
            x, y, w: 20, h: 20,
            draw: () => image(cherry, x, y, 20, 20)
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

    list.push(this.assets[chosenKey].make());
  }
}

