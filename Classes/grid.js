///// Grid - initial design following idea
class Grid {
    constructor(sizeX,sizeY,spanTopLeft,objLoc) {
        // Array size config
        this._sizeX = sizeX;
        this._sizeY = sizeY;
        this._sizeArr = this._sizeX*this._sizeY;

        this._arr = [];
        for (let i = 0; i < this._sizeArr; ++i) {
            this._arr.push( '\0' ); // Push null objects to fill arr.
        }

        this._spanTopLeft = spanTopLeft; // spanTopleft = (x,y), 
        this._spanBotRight = [spanTopLeft[0]+this._sizeX, spanTopLeft[1]+this._sizeY]; // Automatically set spanBotRight 
        
        this._objLoc = objLoc; // (x,y) GRID object location, not necs.
    }

    //// Util
    convToFlat(pos) { // Convert [x,y] to flat array index
        return pos[1]*this._sizeX + pos[0]; 
    }

    convToSqaure(z) { // Convert flat array index to [x,y]
        return [
            z%this._sizeX,
            floor(z/this._sizeX)
        ];
    }

    convRelToArrPos(pos) { // Convert relative span position to array position 
        return [
            pos[0] - this._spanTopLeft[0],
            pos[1] - this._spanTopLeft[1]
        ];
    }

    convArrToRelPos(pos) { // Convert array position to relative span position 
        return [
            this._spanTopLeft[0] + pos[0],
            this._spanTopLeft[1] + pos[1]
        ];
    }



    //// Access (unrestricted, allows errors/out of bounds for perf., refactor once usage known)
    getArrPos(pos) { // Get value at array-relative position
        return this._arr[this.convToFlat(pos)];
    }

    setArrPos(pos,obj) { // Set value at array-relative position
        this._arr[this.convToFlat(pos)] = obj;
    }

    // Depending on usage, improve perf via direct calls
    get(relPos) { // Gets value based on SPAN positions, no OOB check, how could this go wrong...
        return this._arr[
            this.convToFlat( 
                this.convRelToArrPos(relPos)
            )
        ];
    }

    set(relPos,obj) { // Sets value based on SPAN position, no OOB check.
        this._arr[
            this.convToFlat(
                this.convRelToArrPos(relPos)
            )
        ] = obj;
    }
}

function testGridUtil() {
    let size = [5,9];
    let testObj = new Grid(size[0],size[1],[0,0],[0,0]);

    for (let i = 0; i < size[0]*size[1]; ++i) {
        let sqr = testObj.convToSqaure(i);
        let flat = testObj.convToFlat(sqr);
        // print(i,sqr,flat);

        let arrPos = testObj.convArrToRelPos(sqr);
        let backPos = testObj.convRelToArrPos(arrPos);
        // print(i,sqr,arrPos,backPos);

        if (sqr[0] != backPos[0] || sqr[1] != backPos[1]) {
            print("ERROR. MISMATCH. Arr->Rel / Rel->Arr Util fail.")
        }

        if (flat != i) {
            print("ERROR. MISMATCH. testGridUtil() fail.")
        }
    }
};