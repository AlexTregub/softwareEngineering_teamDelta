// --- IGNORE ---
function test_stats() {
    let _stats = new stats(createVector(50,0),createVector(150,0))
 //   _stats.test_Exp()
    let expTotalFromAllEntities = new stat("Total World EXP")
    _stats.printAllStats()
}

// Stats class to hold all stats for an entity
// Each stat is an instance of the 'stat' class defined below
// Example usage:
// let myStats = new stats(createVector(50, 0), createVector(150, 0));
// myStats.printAllStats();

class stats {
    constructor(pos, size, movementSpeed = 0.05, pendingPos = null, strength = 10, health = 100, gatherSpeed = 1){
      this.createExpMap()
      // Check if pos is a vector (has x and y properties)
      if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
        throw new Error("stats constructor: 'pos' must be a vector with x and y properties.");
      }
      if (!size || typeof size.x !== "number" || typeof size.y !== "number") {
        throw new Error("stats constructor: 'size' must be a vector with x and y properties.");
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
    // Each ant will have its own exp map, which will track the exp gained from various activities
    // The stats class will have a global exp map, which will track the exp gained from all entities in the world
    // maps work like dicts, but the key doesn't need to be a string or int
    exp = new Map()
    
    // returns the total EXP value from all properties
    expTotal
    getExpTotal(){ this.setExpTotal(); return this.expTotal; }
    setExpTotal(){ this.expTotal = 0; for (const value of this.exp) for (const keys of Object.keys(value)){ this.expTotal += value[keys] }}
    printExpTotal(){ console.log(`Total EXP: ${this.expTotal}`)}

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

    test_Map(map) { for (const [key, value] of map) { console.log(`${key}: ${value}`); } }
    test_Exp() { for (const [key, value] of this.exp) {console.log(`KEY: ${key}`); for (const keys of Object.keys(value)){ console.log(`${keys}: ${value[keys]}`) }}}

    // Print all direct stat objects
    printDirectStats() {
        for (const key of Object.keys(this)) { // Loop through all direct properties
            const value = this[key];
            if (value instanceof stat) { // Check if the property is an instance of stat
                let statVal = value.statValue;
                if (statVal && typeof statVal === 'object' && 'x' in statVal && 'y' in statVal) { // If value is a vector, format as (x, y)
                    statVal = `(${statVal.x}, ${statVal.y})`;
                }
                console.log(`${value.statName}: ${statVal} [${value.statLowerLimit}, ${value.statUpperLimit}]`);
            }
        }
    }

    // Print all stats in the EXP map
    printExpStats() {
        if (this.exp instanceof Map) { // Ensure exp is a Map
            console.log(`  EXP Map:`);
            for (const [mapKey, mapValue] of this.exp) { // Loop through each entry in the map
                if (mapValue instanceof stat) {
                    let statVal = mapValue.statValue;
                    if (statVal && typeof statVal === 'object' && 'x' in statVal && 'y' in statVal) { // If value is a vector, format as (x, y)
                        statVal = `(${statVal.x}, ${statVal.y})`;
                    }
                    console.log(`    ${mapValue.statName}: ${statVal} [${mapValue.statLowerLimit}, ${mapValue.statUpperLimit}]`);
                }
            }
        }
    }
    // Print all stats 
    printAllStats() {
    console.log('--- Stats Debug ---');
    this.printDirectStats();
    this.printExpStats();
    console.log('------------------');
}
}

// generic stat that will be used to populate all stats
// example usage:
// let healthStat = new stat("Health", 100, 0, 1000);
// healthStat.printStatToDebug();
// healthStat.printStatUnderObject(createVector(50, 50), createVector(20, 20), 12);
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
        if (this.statValue < this.statLowerLimit) console.error(this.statValue, this.statLowerLimit);
        if (this.statValue > this.statUpperLimit) console.error(this.statValue, this.statUpperLimit);
    }

    printStatToDebug() { // Print all properties of this stat object to the console
        console.log('--- Stat Debug ---');
        for (const key of Object.keys(this)) {
            let value = this[key];
            // If value is a vector, format as (x, y)
            if (value && typeof value === "object" && "x" in value && "y" in value) {
                value = `(${value.x}, ${value.y})`;
            }
            console.log(`${key}: ${value}`);
        }
        console.log('------------------');
    }

    printStatUnderObject(pos, spriteSize, textSize) {
        // pos: {x, y} - position of the object
        // spriteSize: {x, y} - size of the object
        // textSize: number - font size for the text

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
            console.log(`Print at (${pos.x}, ${pos.y + spriteSize.y + 5}): ${this.statName}: ${valueToPrint}`);
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { stats, stat };
}