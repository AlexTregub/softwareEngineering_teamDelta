
let stateDisplayAssets = {};

function StateDiplayPreloader(){
    stateDisplayAssets.bottomDisplay = loadImage('Images/Assets/Displays/state_display.png');
}

class StateDisplay{
    constructor(){
        this.bottomDisplay = null;
    }
    preloadAssets(){
        this.bottomDisplay = stateDisplayAssets.bottomDisplay;

    }
    renderMenu(){
        
    }
}
if (typeof window !== "undefined") {
    window.stateManager = new StateManager();
}