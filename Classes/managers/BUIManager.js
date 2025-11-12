class BUIManager {
    constructor() {
        this.active = false;
        this.bgImage = null;
        this.hill = null; // anthill reference
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

    // handle key input specifically while shop is open
    handleKeyPress(key) {
        if (!this.active || !this.hill) return false;

        // 1 = upgrade hive
        if (key === '1') {
            const upgraded = this.hill.upgradeBuilding?.();
            if (upgraded) {
                console.log("Hive upgraded! +5 max ants");
                if (typeof window.maxAnts !== "undefined") {
                    window.maxAnts += 5;
                } else {
                    window.maxAnts = 6;
                }
            } else {
                console.log("Couldn’t upgrade hive.");
            }
            return true;
        }

        // 2 = spawn an ant if under limit
        if (key === '2') {
            const currentAnts = ants?.length || 0;
            const maxAnts = window.maxAnts || 10;
            if (currentAnts < maxAnts) {
                const centerX = this.hill._x + this.hill._width / 2;
                const centerY = this.hill._y + this.hill._height / 2;
                if (typeof antsSpawn === 'function') {
                    antsSpawn(1, this.hill._faction || 'player', centerX, centerY);
                    console.log("Spawned ant at hill!");
                } else {
                    console.warn("antsSpawn() not available");
                }
            } else {
                console.log("Max ants reached!");
            }
            return true;
        }

        return false; // key not handled
    }

    render() {
        if (!this.active || !this.hill) return;
        console.log("Rendering BUI, active:", this.active);

        push();
        const boxW = 700;
        const boxH = 500;
        const boxX = width - boxW / 2 + 150;
        const boxY = height - boxH / 2 ;
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
        text("SHOP", boxX, boxY - 130);

        // Body placeholder
        textSize(20);
        textAlign(RIGHT, RIGHT);
        noStroke();
        text("[1] Upgrade Hive ~ 10", boxX + 65, boxY -75);
        text("[2] Breed Ant ~ 5", boxX + 43, boxY - 20);

        pop();
    }
}

if (typeof window !== 'undefined') {
    window.BUIManager = new BUIManager();
}
