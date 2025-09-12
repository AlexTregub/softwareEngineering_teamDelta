function test_stats() {
    _stats = new stats
    _stats.test_Exp()
    expTotalFromAllEntities = new stat("Total World EXP")
}


class stats {
    // tracks the exp gained from all entites in the world
    // maps work like dicts, but the key doesn't need to be a string or int
    exp = new Map()

    constructor(){
        this.createExpMap()
    }
    
    // returns the total EXP value from all properties
    expTotal
    getExpTotal(){
        this.setExpTotal()
        return this.expTotal;
    }
    setExpTotal(){
        this.expTotal = expLifetime.getStatValue + expGather + expHunt
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
    test_Map(map) {
        for (const [key, value] of map) {
            console.log(`${key}: ${value}`);
        }
    }
    test_Exp() {
        for (const [key, value] of this.exp) {
            console.log(`KEY: ${key}`)
            for (const keys of Object.keys(value)){
                console.log(`${keys}: ${value[keys]}`)
            }
        }
    }
}

// generic stat that will be used to populate all stats
class stat {
    //TODO
    //Toying with the idea of makeing a dictionary of stats as opposed to a stats class.

    constructor(statName="NONAME",statValue=0,statLowerLimit=0,statUpperLimit=500){
        this.setStatName(statName)
        this.setStatValue(statValue)
        this.setStatLowerLimit(statLowerLimit)
        this.setStatUpperLimit(statUpperLimit)
    }

    // will be store the name of the state
    statName
    getStatName() { return this.statName }
    setStatName(value) { this.statName = value  }

    // stores the value of the stat
    statValue
    getStatValue() { return this.statValue }
    setStatValue(value) { this.statValue = value; this.enforceStatLimit() }

    // prevents the stat from going too high
    statUpperLimit
    getStatUpperLimit() { return this.statUpperLimit }
    setStatUpperLimit(value) { this.statUpperLimit = value }

    // prevents the stat from from too low
    statLowerLimit
    getStatLowerLimit() { return this.statLowerLimit }
    setStatLowerLimit(value) { this.statLowerLimit = value }

    // checks that the limits are properly enforced, throws an error 
    enforceStatLimit() {
        if (this.statValue < this.statLowerLimit) this.statValue = this.statLowerLimit
        if (this.statValue > this.statUpperLimit) this.statValue = this.statUpperLimit
        this.test_enforceStatLimit()
    }
    test_enforceStatLimit() {
        if (this.statValue < this.statLowerLimit) console.error(this.statValue, this.statLowerLimit)
        if (this.statValue > this.statUpperLimit) console.error(this.statValue, this.statUpperLimit)
    }
}