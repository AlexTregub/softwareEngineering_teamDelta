const HUNGRY = 100;
const STARVING = 160;
const DEATH = 200;

class AntBrain{
    constructor(antType){
        this.antType = antType;
        let flag_ = "";
        let hunger = 0;

        let followBuildTrail = 0;
        let followForageTrail = 0;
        let followFarmTrail = 0;
        let followEnemyTrail = 0;
        let followBossTrail = 1;
        let penalizedTrails = [];

        setPriority(antType, 1);
    }

    setPriority(antType, mult){
        job = antType;
        switch (job) {
            case "Builder":
                this.followBuildTrail = 0.9 * mult;
                this.followForageTrail = 0.05 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 0.05 * mult;
                break;
            case "Scout":
                this.followBuildTrail = 0.25 * mult;
                this.followForageTrail = 0.25 * mult;
                this.followFarmTrail = 0.25 * mult;
                this.followEnemyTrail = 0.25 * mult;
                break;
            case "Farmer":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.1 * mult;
                this.followFarmTrail = 0.85 * mult;
                this.followEnemyTrail = 0.05 * mult;
                break;
            case "Warrior":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.2 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 1 * mult;
                break;
            case "Spitter":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.2 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 1 * mult;
                break;
            case "DeLozier":
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 0 * mult;
                break;
            default:
                this.followBuildTrail = 0 * mult;
                this.followForageTrail = 0.75 * mult;
                this.followFarmTrail = 0 * mult;
                this.followEnemyTrail = 0.25 * mult;
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

    checkTrail(pheromone, penaltyList, priorityList){
        /*Check Trail:
            Checks a trail using trail type and ant type. Generates number from 0-1. If it falls in the bounds, the ant follows the path, else sets to ignore that type until next state change (maybe make it dynamic (-50% chance))
        */
       let priority = priorityList[somevaluerepresentativeofthelargerprioritywhole];
       let penalty = penaltyList[somevaluerepresentativeofthelargerprioritywhole];
       let num = Math.random();
       let comparison = (pheromone.strength/pheromone.initial) * priority * penalty;
       if(num < comparison){
        return true;
       }
       return false;
    }

    modifyPriorityTrails(){
        switch(this.flag_){
            case "reset":
                this.setPriority(this.antType, 1); //Change from antType to actual name
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
        if(hunger === HUNGRY){
            flag_ = "hungry";
            runFlagState();
        }
        if(hunger === STARVING){
            flag_ = "starving";
            runFlagState();
        }
        if(hunger === DEATH){
            flag_ = "death";
            runFlagState();
        }
    }

    resetHunger(){
        //Resets hunger once fed (change to use variable if food has different values of saturation)
        hunger = 0;
        flag_ = "reset";
        this.runFlagState();
    }
    runFlagState(){
        switch(this.flag_){
        case "hungry":
            modifyPriorityTrails();
            break;
        case "starving":
            modifyPriorityTrails();
            break;
        case "death":
            //killAnt
            break;
        case "reset":
            modifyPriorityTrails();
            flag_ = "";
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
