// The canvas in p5.JS is drawn based where the draw command is called. 
// objects drawn first will have objects called later drawn above them.
// CanvasObjects allows objects to be assigned to specfic layers and then draws those objects
// at the correct point in the process so that they appear on screen as intended
// for example, UI elements are always drawn over game elements because it has a higher draw value. 

let canvasLayers = [];

function createCanvasObject(){
    return canvasObject;
}

class canvasObject {
    mapLayer;

    // The canvas is drawn to the screen in acsending order
    // mapLayer Enum
    MAP_LAYER_BACKGROUND = 0;
    MAP_LAYER_DECOR = 1;
    MAP_LAYER_GROUND = 2;
    MAP_LAYER_HILL = 3;
    MAP_LAYER_FLYING = 10;
    MAP_LAYER_UI = 20;
    MAP_LAYER_MENU = 30;

    constructor(mapLayer) {
        setMapLayer(mapLayer)
    }

    setMapLayer(mapLayer) {
        this.mapLayer = mapLayer
    }
}