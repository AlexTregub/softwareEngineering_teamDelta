class BUIManager {
    constructor() {
        this.active = false;
        this.bgImage = null;
        this.hill = null; // reference to the anthill being interacted with
    }

    preload() {
        this.bgImage = loadImage('Images/Buildings/UI/building_box.png');
    }

    open(hill) {
        this.hill = hill;
        this.active = true;
        console.log("Opening shop for hill:", hill);
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
        if (!this.active || !this.hill) return;
        console.log("Rendering BUI, active:", this.active);

        push();
        const boxW = 400;
        const boxH = 300;
        const boxX = width - boxW / 2 - 50;
        const boxY = height - boxH / 2 - 50;
        const padding = 20;

        // Background
        if (this.bgImage) {
            imageMode(CENTER);
            image(this.bgImage, boxX, boxY, boxW, boxH);
        } else {
            fill(50, 50, 50, 200);
            rectMode(CENTER);
            rect(boxX, boxY, boxW, boxH, 20);
        }

        // Header
        textAlign(CENTER, CENTER);
        textFont(terrariaFont || 'sans-serif');
        textSize(32);
        fill(255);
        stroke(0);
        strokeWeight(3);
        text("Anthill Shop", boxX, boxY - 140);

        // Body placeholder
        textSize(20);
        noStroke();
        text("Placeholder content here", boxX, boxY + 20);

        pop();
    }
}

// global instance
if (typeof window !== 'undefined') {
    window.BUIManager = new BUIManager();
}
