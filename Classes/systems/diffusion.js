///// Diffusion grid (not even chat gpt could help me)
// Accessing things via private is a bad idea, this will bite me in the ass someday

class PheromoneGrid {
    constructor(map=g_map2) {
        this._selLeft = true; // Two internal grids: Left & Right

        this._mapTileSize = map._tileSpanRange;
        this._mapTL = map._tileSpan[0];

        // Pheromone GRIDS
        this._right = NONE;
        this._left = NONE;

        this.initSelGrid(); 

        // Pheromone 'REGISTRIES' - access for updates, must be matched with selected grid.
        this._rightFlat = [];
        this._leftFlat = [];
    }

    //// Utils: 
    initSelGrid(selLeft = this._selLeft) { // By default, initializes currently selected
        if (selLeft) { // Op on left
            this._left = new Grid(this._mapTileSize[0],this._mapTileSize[1],this._mapTL);

            for (let i = 0; i < this._left._sizeArr; ++i) {
                this._left.rawArray[i] = []; // Empty arrs
            }
            return;
        }
        // ...
        this._right = new Grid(this._mapTileSize[0],this._mapTileSize[1],this._mapTL);
        
        for (let i = 0; i < this._right._sizeArr; ++i) {
            this._right.rawArray[i] = []; // Empty arrs
        }
    }

    //// Access: (defaults on selected grid)
    get(pos,selLeft=this._selLeft) { // Gets current pheromones, in array form
        let rawArr = this.getRaw(pos,selLeft); // Assumes array of pheromone containers
        let returnArr = [];

        for (let i = 0; i < rawArr.length; ++i) {
            returnArr.push(rawArr[i].pheromone);
        }

        return returnArr;
    }

    getRaw(pos,selLeft=this._selLeft) { // Gets raw array at position
        if (selLeft) {
            return this._left.get(pos); 
        }

        return this._right.get(pos);
    }

    push(pos,pheromone,selLeft=this._selLeft) { // Merges pheromone into cell
        // ...
    }

    set(pos,pheromoneArray,selLeft=this._selLeft) { // OVERWRITE pheromone array
        // ...
    }

    setRaw(pos,pheromoneContainerArr,selLeft=this._selLeft) {
        
    }
}



/// Container for pheromones (handles IDs independently)
class PheromoneContainer {
    constructor(ID,pheromone) {
        this.id = ID;
        this.pheromone = pheromone;
    }
}