// ShopManager.js
// Anthony Cruz
// I wanted to make a separate manager for the shop to keep things organized.
// Any questions, feel free to ask!

class ShopManager {
    constructor() {
      this.active = false;
      this.bgImage = null;
      this.hill = null; // reference to the anthill being interacted with
    }
  
    preload() {
      this.bgImage = loadImage('Images/Buildings/UI/building_box.png');
    }
  
    open(hill) {
      console.log("Opening shop for hill:", hill);
      this.hill = hill;
      this.active = true;
    }
  
    close() {
      this.active = false;
      this.hill = null;
    }
  
    update() {
        if (!this.active || !this.hill) return;
      
        const queen = getQueen?.();
        if (!queen) return;
      
        const range = dist(this.hill._x + 50, this.hill._y, queen.posX, queen.posY);
        if (range > this.hill.promptRange + 20) {
          this.close();
        }
      }
  
    render() {
        if (!this.active) return;
        console.log("Rendering shop UI, active:", this.active); // now only logs when active
      
        push();
        imageMode(CENTER);
        const boxW = 400;                   // width of quest box
        const boxH = 300;                   // height of quest box
        const boxX = width - boxW / 2 - 50;
        const boxY = height - boxH / 2 - 50;
        //console.log("Canvas height:", height, "Calculated boxY:", boxY);
      
        if (this.bgImage) {
          //console.log("Drawing shop background image at", boxX, boxY);
          image(this.bgImage, boxX, boxY, boxW, boxH);
        } else {
            console.log("Drawing fallback shop background.");
          fill(50, 50, 50, 200);
          rectMode(CENTER);
          rect(boxX, boxY, boxW, boxH, 20);
        }
      
        textAlign(CENTER, CENTER);
        textFont(terrariaFont || 'sans-serif');
        textSize(32);
        fill(255);
        stroke(0);
        strokeWeight(3);
        text("Anthill Shop", boxX, boxY - 140);
      
        textSize(20);
        noStroke();
        text(" placeholder content here ", boxX, boxY + 20);
      
        pop();
      }      
  }
  
// GLOBAL INSTANCE \\
if (typeof window !== "undefined") {
    window.shopManager = new ShopManager();
}