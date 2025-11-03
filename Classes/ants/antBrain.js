const HUNGRY = 100;
const STARVING = 160;
const DEATH = 200;
let increment = 1;

/*
To Do:
    Add Checks for separate factions
    setState() (Most likely going to use when emergency switching state and just have state machine deal with normal swaps? May change later)
*/

class AntBrain{
    constructor(antInstance, antType){
        logVerbose(`I LIVE!!!`);
        this.ant = antInstance;
        this.antType = antType;
        this.flag_ = "";
        this.hunger = 0;

        this.followBuildTrail = 0;
        this.followForageTrail = 0;
        this.followFarmTrail = 0;
        this.followEnemyTrail = 0;
        this.followBossTrail = 100;
        this.penalizedTrails = [];

        this.setPriority(antType, 1);
    }

    setPriority(antType, mult){
        let job = antType;
        switch (job) {
            case "Builder":
                this.followBuildTrail = 0.9 * mult;
                this.followForageTrail = 0.05 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 0.05 * mult;
                this.followBossTrail = 100 * mult;
                break;
            case "Scout":
                this.followBuildTrail = 0.25 * mult;
                this.followForageTrail = 0.25 * mult;
                this.followFarmTrail = 0.25 * mult;
                this.followEnemyTrail = 0.25 * mult;
                this.followBossTrail = 100 * mult;
                break;
            case "Farmer":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.1 * mult;
                this.followFarmTrail = 0.85 * mult;
                this.followEnemyTrail = 0.05 * mult;
                this.followBossTrail = 100 * mult;
                break;
            case "Warrior":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.2 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 1 * mult;
                this.followBossTrail = 100 * mult;
                break;
            case "Spitter":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.2 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 1 * mult;
                this.followBossTrail = 100 * mult;
                break;
            case "DeLozier":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 0 * mult;
                this.followBossTrail = 100 * mult;
                break;
            default:
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.75 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 0.25 * mult;
                this.followBossTrail = 100 * mult;
                break;
        }
    }

    decideState(){
        /*Deciding State:
            State is determinant on many variables. If a variable like hunger exceeds a threshold, the brain will set state to immediately fix it.
            A monitor class that constantly monitors these should happen and this should be called when either:
                Needs an emergency state change
                Finished previous state
        */
    }

    checkTrail(pheromone){
        /*Check Trail:
            Checks a trail using trail type and ant type. Generates number from 0-1. If it falls in the bounds, the ant follows the path, else sets to ignore that type until next state change (maybe make it dynamic (-50% chance))
        */
       let priority = this.getTrailPriority(pheromone.name);
       let penalty = this.getPenalty(pheromone.name);
       let num = Math.random();
       let comparison = (pheromone.strength/pheromone.initial) * priority * penalty;
       if(num < comparison){
        return true;
       }
       this.addPenalty(pheromone.name, 0.5);
       return false;
    }

    addPenalty(pheromoneName, penaltyValue = 0.5){
        this.penalizedTrails.push({name: pheromoneName, penalty: penaltyValue}); //Stores penalty and name as a pair
    }

    getPenalty(pheromoneName) {
        const penaltyObj = this.penalizedTrails.find(p => p.name === pheromoneName);
        return penaltyObj ? penaltyObj.penalty : 1; // default penalty = 1 if not found
    }

    getTrailPriority(trailType){
        switch(trailType){
            //Duh ahh return statement. Returns value tied to each priority
            case "Build":
                return this.followBuildTrail;
            case "Forage":
                return this.followForageTrail;
            case "Farm":
                return this.followFarmTrail;
            case "Enemy":
                return this.followEnemyTrail;
            case "Boss":
                return this.followBossTrail;
        }
    }

    modifyPriorityTrails(){
        switch(this.flag_){
            case "reset":
                this.setPriority(this.antType, 1);
                break;
            case "hungry":
                this.setPriority(this.antType, 0.5);
                this.followForageTrail = 1;
                break;
            case "starving":
                this.setPriority(this.antType, 0);
                this.followForageTrail = 2;
                break;
            case "death":
                this.setPriority(this.antType, 0);
                break;
        }
    }

    checkHunger(){
        this.hunger++;
        logVerbose(`my belly is bellying`);
        //Checks hunger meter every second
        if(this.hunger === HUNGRY){
            console.log('hungry')
            this.flag_ = "hungry";
            this.runFlagState();
            this.decideState();
        }
        if(this.hunger === STARVING){
            console.log(`starving`);
            this.flag_ = "starving";
            this.runFlagState();
            this.decideState();
        }
        if(this.hunger === DEATH){
            console.log(`dead`);
            this.flag_ = "death";
            this.runFlagState();
            //this.killAnt();//Need to make this
            if(this.antType != "Queen"){
                this.ant.takeDamage(999999);
            }
        }
    }

    resetHunger(){
        //Resets hunger once fed (change to use variable if food has different values of saturation)
        this.hunger = 0;
        this.flag_ = "reset";
        this.runFlagState();
    }
    runFlagState(){
        switch(this.flag_){
        case "hungry":
            this.modifyPriorityTrails();
            break;
        case "starving":
            this.modifyPriorityTrails();
            break;
        case "death":
            //killAnt
            break;
        case "reset":
            this.modifyPriorityTrails();
            this.flag_ = "";
            //this.penalizedTrails = []; Move this reset somewhere else
            break;
        }
        console.log(`
                ${this.flag_}:
                Build: ${this.followBuildTrail}
                Forage: ${this.followForageTrail}
                Farm: ${this.followFarmTrail}
                Enemy: ${this.followEnemyTrail}
                Boss: ${this.followBossTrail}
                `);
    }

    update(deltaTime){  
        this.internalTimer(deltaTime);
    }

    changeIncrement(newIncrement){
        increment /= newIncrement;
    }

    internalTimer(deltaTime){
        this._accumulator = (this._accumulator || 0) + deltaTime;
        if (this._accumulator >= increment) { // every second
            logVerbose(`${this.hunger}`);
            this._accumulator = 0;
            this.checkHunger();
        }
    }
}
