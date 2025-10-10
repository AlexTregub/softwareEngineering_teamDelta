class AntBrain{
    constructor(antType){
        const hungry = 100;
        const starving = 160;
        const death = 200;
        let flag_ = "";
        let hunger = 0;
        let followBuildTrail;
        let followForageTrail;
        let followFarmTrail;
        let followEnemyTrail;
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
       if(comparison < num){
        return true;
       }
       return false;
    }

    modifyPriorityTrails(){
        switch(flag_){
            case "reset":
                this.setPriority(this.antType, 1); //Change from antType to actual name
            case "hungry":
                this.setPriority(this.antType, 0.5);
                followForageTrail = 1;
            case "starving":
                this.setPriority(this.antType, 0);
                followForageTrail = 2;
        }
    }
}

function internalTimer(){
    /*Internal Timer:
        Internal Timer uses deltatime to make a 1-second clock. At every second, hunger (and other constantly ticking things) will increment.
        This will also check functions for flags. For instance, if hunger hits a threshold, prioritize food/change path priority
    */
   checkHunger();
}

function checkHunger(){
    hunger++;
    //Checks hunger meter every second
    if(hunger === 100){
        flag_ = "hungry";
        runFlagState();
    }
    if(hunger === 160){
        flag_ = "starving";
        runFlagState();
    }
    if(hunger === 200){
        flag_ = "death";
        runFlagState();
    }
}

function resetHunger(){
    //Resets hunger once fed (change to use variable if food has different values of saturation)
    hunger = 0;
    flag_ = "reset";
    runFlagState();
}

function runFlagState(){
    if(flag_ === "hungry"){
        modifyPriorityTrails();
    }
    if(flag_ === "starving"){
        modifyPriorityTrails();
    }
    if(flag_ === "death"){
        //killAnt
    }
    if(flag === "reset"){
        modifyPriorityTrails();
        flag_ = "";
    }
}
