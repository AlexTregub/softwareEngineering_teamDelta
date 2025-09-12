// Stores info for experiance gathered for ants

class stats {
    // tracks the exp gained from all entites in the world
    static expTotalFromAllEntities
    
    // returns the total EXP value from all properties
    expTotal
    getExpTotal(){
        setExpTotal()
        return this.expTotal;
    }
    setExpTotal(){
        this.expTotal = getExpRanged()+getExpConstruction()+getExpFarming()
                    + getExpScout()+getExpSwim()+getExpHunt()+getExpGather()+getExpLifetime()
    }

    
    // exp gained from being alive, up to a max
    expLifetime
    getExpLifetime() {
    return this.expLifetime
    }
    setExpLifetime(value) {
    this.expLifetime = value
    if (this.expLifetime < 0) this.expLifetime = 0
    }


    // exp gained from gathering materials from leaves and such
    expGather
    getExpGather() {
    return this.expGather
    }
    setExpGather(value) {
    this.expGather = value
    if (this.expGather < 0) this.expGather = 0
    }


    // exp gained from hunting other ants and such
    expHunt
    getExpHunt() {
    return this.expHunt
    }
    setExpHunt(value) {
    this.expHunt = value
    if (this.expHunt < 0) this.expHunt = 0
    }

    //exp gained from swimming and water based activities
    expSwim
    getExpSwim() {
    return this.expSwim
    }
    setExpSwim(value) {
    this.expSwim = value
    if (this.expSwim < 0) this.expSwim = 0
    }

    // exp gained from an ant revealing parts of the map, discovering new resource, or engaging is "scouting" assigned task
    expScout
    getExpScout() {
    return this.expScout
    }
    setExpScout(value) {
    this.expScout = value
    if (this.expScout < 0) this.expScout = 0
    }


    // exp gained from an ant farming aphids, harvesting dew from any source
    expFarming
    getExpFarming() {
    return this.expFarming
    }
    setExpFarming(value) {
    this.expFarming = value
    if (this.expFarming < 0) this.expFarming = 0
    }


    // exp gained from an ant building or repairing any structure
    expConstruction
    getExpConstruction() {
    return this.expConstruction
    }
    setExpConstruction(value) {
    this.expConstruction = value
    if (this.expConstruction < 0) this.expConstruction = 0
    }


    //exp gained from ants that spits and that successfully connects with an valid object
    expRanged
    getExpRanged() {
    return this.expRanged
    }
    setExpRanged(value) {
    this.expRanged = value
    if (this.expRanged < 0) this.expRanged = 0
    }

}