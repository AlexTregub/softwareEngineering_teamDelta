///// Diffusion grid (pain)
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
        // DO NOT DELETE VALS, SET TO NONE.
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
        let 
    }

    set(pos,pheromoneArray,selGet=this._selLeft,selPut=this._selLeft) { // OVERWRITE pheromone array
        // Delete prev vals from flat array - if needed
        if (selPut == selGet) {
            let oldArr = this.getRaw(pos,selGet);
            if (selGet) {
                for (let i = 0; i < oldArr.length; ++i) {
                    this._leftFlat[i] = NONE;
                }
            } else {
                for (let i = 0; i < oldArr.length; ++i) {
                    this._rightFlat[i] = NONE;
                }
            }
        } 
        

        // Add new vals to flat + selected position
        let appendArray = [];
        if (selPut) {
            for (let i = 0; i < pheromoneArray.length; ++i) { // Update flat arr
                appendArray.push(new PheromoneContainer(this._leftFlat.length,pheromoneArray[i]));
                this._leftFlat.push(pheromoneArray[i]);
            }

            this._left.set(pos,appendArray);  // Update grid

            return;
        }

        for (let i = 0; i < pheromoneArray.length; ++i) { // Update flat arr
            appendArray.push(new PheromoneContainer(this._rightFlat.length,pheromoneArray[i]));
            this._rightFlat.push(pheromoneArray[i]);
        }

        this._right.set(pos,appendArray);  // Update grid
    }

    // setRaw(pos,pheromoneContainerArr,selLeft=this._selLeft) {
    //     // ...
    // }
}



/// Container for pheromones (handles IDs independently)
class PheromoneContainer {
    constructor(ID,pheromone) {
        this.id = ID;
        this.pheromone = pheromone;
    }
}