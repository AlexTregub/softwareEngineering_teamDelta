const HUNGRY = 100;
const STARVING = 160;
const DEATH = 200;

class AntBrain{
    constructor(antType){
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
                this.followBossTrail = 100;
                break;
            case "Scout":
                this.followBuildTrail = 0.25 * mult;
                this.followForageTrail = 0.25 * mult;
                this.followFarmTrail = 0.25 * mult;
                this.followEnemyTrail = 0.25 * mult;
                this.followBossTrail = 100;
                break;
            case "Farmer":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.1 * mult;
                this.followFarmTrail = 0.85 * mult;
                this.followEnemyTrail = 0.05 * mult;
                this.followBossTrail = 100;
                break;
            case "Warrior":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.2 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 1 * mult;
                this.followBossTrail = 100;
                break;
            case "Spitter":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.2 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 1 * mult;
                this.followBossTrail = 100;
                break;
            case "DeLozier":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 0 * mult;
                this.followBossTrail = 100;
                break;
            default:
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.75 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 0.25 * mult;
                this.followBossTrail = 100;
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
        }
    }

    checkHunger(){
        this.hunger++;
        //Checks hunger meter every second
        if(this.hunger === HUNGRY){
            this.flag_ = "hungry";
            this.runFlagState();
        }
        if(this.hunger === STARVING){
            this.flag_ = "starving";
            this.runFlagState();
        }
        if(this.hunger === DEATH){
            this.flag_ = "death";
            this.runFlagState();
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
            this.penalizedTrails = [];
            break;
        }
    }

    update(deltaTime){
        this.internalTimer(deltaTime);
    }

    internalTimer(deltaTime){
        this._accumulator = (this._accumulator || 0) + deltaTime;
        if (this._accumulator >= 1) { // every second
            this._accumulator = 0;
            this.checkHunger();
        }
    }
}
