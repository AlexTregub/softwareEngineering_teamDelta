function test_stats() {
    _stats = new StatsContainer(createVector(50,0),createVector(150,0))
 //   _stats.test_Exp()
    _stats.size.printStatToDebug()
    expTotalFromAllEntities = new stat("Total World EXP")
}


class StatsContainer {
    constructor(pos, size, movementSpeed = 0.05, pendingPos = null, strength = 10, health = 100, gatherSpeed = 1){
      this.createExpMap()
      // Check if pos is a vector (has x and y properties)
      if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
        throw new Error("StatsContainer constructor: 'pos' must be a vector with x and y properties.");
      }
      if (!size || typeof size.x !== "number" || typeof size.y !== "number") {
        throw new Error("StatsContainer constructor: 'size' must be a vector with x and y properties.");
      }

      this.position = new stat("Position", pos)
      this.size = new stat("Size", createVector(size.x, size.y))
      this.movementSpeed = new stat("Movement Speed", movementSpeed, 0, 100)
      if (pendingPos === null) pendingPos = createVector(pos.x, pos.y);
      this.pendingPos = new stat("Pending Position", pendingPos)
      this.strength = new stat("Strength", strength, 0, 1000)
      this.health = new stat("Health", health, 0, 10000)
      this.gatherSpeed = new stat("Gather Speed", gatherSpeed, 0, 100)
    }
    // Getter and setter for position
    get position() { return this._position; }
    set position(value) { this._position = value; }

    // Getter and setter for size
    get size() { return this._size; }
    set size(value) { this._size = value; }

    // Getter and setter for movementSpeed
    get movementSpeed() { return this._movementSpeed; }
    set movementSpeed(value) { this._movementSpeed = value; }

    // Getter and setter for pendingPos
    get pendingPos() { return this._pendingPos; }
    set pendingPos(value) { this._pendingPos = value; }

    // EXP
    // EXP is experience points, which will be used to level up ants and other entities
    // Each ant will have its own exp g_map, which will track the exp gained from various activities
    // The StatsContainer class will have a global exp g_map, which will track the exp gained from all entities in the world
    // maps work like dicts, but the key doesn't need to be a string or int
    exp = new Map()
    
    // returns the total EXP value from all properties
    expTotal
    getExpTotal(){ this.setExpTotal(); return this.expTotal; }
    setExpTotal(){ this.expTotal = 0; for (const value of this.exp) for (const keys of Object.keys(value)){ this.expTotal += value[keys] }}
    printExpTotal(){ 
      if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
        console.log(`Total EXP: ${this.expTotal}`);
      }
    }

    // Mappings
    createExpMap(){
        this.exp.set("Lifetime",new stat("Lifetime EXP")) // exp gained from being alive, up to a max
        this.exp.set("Gathering",new stat("Gathering EXP")) // exp gained from gathering materials from leaves and such
        this.exp.set("Hunting",new stat("Hunting EXP")) //exp gained from combat with other ants
        this.exp.set("Swimming",new stat("Swimming EXP")) //exp gained from swimming and water based activities
        this.exp.set("Farming",new stat("Farming EXP")) // exp gained from an ant farming aphids, harvesting dew from any source
        this.exp.set("Construction",new stat("Construction EXP")) // exp gained from an ant building or repairing any structure
        this.exp.set("Ranged",new stat("Ranged EXP"))  //exp gained from ants that spits and that successfully connects with an valid object
        this.exp.set("Scouting",new stat("Scouting EXP")) // exp gained from an ant scouting tasks
    }

    test_Map(g_map) { 
      if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
        for (const [key, value] of g_map) { console.log(`${key}: ${value}`); }
      }
    }
    test_Exp() { 
      if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
        for (const [key, value] of this.exp) {
          console.log(`KEY: ${key}`); 
          for (const keys of Object.keys(value)){ 
            console.log(`${keys}: ${value[keys]}`) 
          }
        }
      }
    }
}

// generic stat that will be used to populate all StatsContainer
class stat {
    constructor(statName="NONAME",statValue=0,statLowerLimit=0,statUpperLimit=500){
        this.statName = statName;
        this.statValue = statValue;
        this.statLowerLimit = statLowerLimit;
        this.statUpperLimit = statUpperLimit;
        this.enforceStatLimit();
    }

    // statName property
    get statName() { return this._statName; }
    set statName(value) { this._statName = value; }

    // statValue property
    get statValue() { return this._statValue; }
    set statValue(value) { 
        this._statValue = value; 
        this.enforceStatLimit();
    }

    // statUpperLimit property
    get statUpperLimit() { return this._statUpperLimit; }
    set statUpperLimit(value) { this._statUpperLimit = value; }

    // statLowerLimit property
    get statLowerLimit() { return this._statLowerLimit; }
    set statLowerLimit(value) { this._statLowerLimit = value; }

    // checks that the limits are properly enforced, throws an error 
    enforceStatLimit() {
        if (this.statValue < this.statLowerLimit) this.statValue = this.statLowerLimit;
        if (this.statValue > this.statUpperLimit) this.statValue = this.statUpperLimit;
        this.test_enforceStatLimit();
    }
    test_enforceStatLimit() {
        if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
            if (this.statValue < this.statLowerLimit) console.error(this.statValue, this.statLowerLimit);
            if (this.statValue > this.statUpperLimit) console.error(this.statValue, this.statUpperLimit);
        }
    }

    printStatToDebug() {
        if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
            for (const key of Object.keys(this)) {
                let value = this[key];
                // If value is a vector, format as (x, y)
                if (value && typeof value === "object" && "x" in value && "y" in value) {
                    value = `(${value.x}, ${value.y})`;
                }
                console.log(`${key}: ${value}`);
            }
        }
    }

    printStatUnderObject(pos, spriteSize, textSize) {
        // pos: {x, y} - position of the object
        // spriteSize: {x, y} - size of the object
        // textSize: number - g_menuFont size for the text

        // Format statValue if it's a vector
        let valueToPrint = this.statValue;
        if (valueToPrint && typeof valueToPrint === "object" && "x" in valueToPrint && "y" in valueToPrint) {
            valueToPrint = `(${valueToPrint.x}, ${valueToPrint.y})`;
        }

        if (typeof text !== "undefined" && typeof fill !== "undefined") {
            fill(255); // Set text color to white
            textSize(textSize);
            textAlign(CENTER, TOP);
            text(
                `${this.statName}: ${valueToPrint}`,
                pos.x + spriteSize.x / 2,
                pos.y + spriteSize.y + 5 // 5 pixels below the object
            );
        } else {
            // Fallback: log to console if rendering context is unavailable
            if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
                console.log(`Print at (${pos.x}, ${pos.y + spriteSize.y + 5}): ${this.statName}: ${valueToPrint}`);
            }
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { StatsContainer, stat };
}