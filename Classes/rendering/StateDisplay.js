
let stateDisplayAssets = {};

function StateDisplayPreloader(){
    stateDisplayAssets.bottomDisplay = loadImage('Images/Displays/state_display.png');
}

class StateDisplay{
    constructor(){
        this.bottomDisplay = null;
    }
    preloadAssets(){
        this.bottomDisplay = stateDisplayAssets.bottomDisplay;
        console.log(`bottomDisplay: ${this.bottomDisplay}`);

    }
    renderMenu() {
    if (!this.bottomDisplay) return;

    let img = this.bottomDisplay;

    // Stretch to full canvas width (optional)
    let displayWidth = width;

    // Scale height to keep aspect ratio
    let displayHeight = img.height * (displayWidth / img.width);

    // X position: center
    let x = 0; // left edge (if you want full width)
    // If you want the image to keep its original width and center it:
    // let x = (width - img.width) / 2;
    // displayWidth = img.width;
    // displayHeight = img.height;

    // Y position: bottom of screen
    let y = height - displayHeight/2;

    image(img, displayWidth/2, y, displayWidth, displayHeight);

    textAlign(LEFT, TOP);
    textFont(terrariaFont || 'sans-serif');
    textSize(28);
    textStyle(BOLD);
    fill(255);
    stroke(0);
    strokeWeight(3);
    text(`Day: ${g_globalTime.inGameDays}`, displayWidth/2, y);
}
}
if (typeof window !== "undefined") {
    window.stateDisplay = new StateDisplay();
}