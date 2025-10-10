let hunger;
const hungry = 100;
const starving = 160;
const death = 200;
let flag_;

class AntBrain{
    constructor(antType){
        hunger = 0;
        flag_ = "";
        let job = antType;
        let followBuildTrail;
        let followForageTrail;
        let followFarmTrail;
        let followEnemyTrail;
        let followBossTrail = 1;
        switch (job) {
            case "Builder":
                followBuildTrail = 0.9;
                followForageTrail = 0.05;
                followFarmTrail = 0;
                followEnemyTrail = 0.05;
                break;
            case "Scout":
                followBuildTrail = 0.25;
                followForageTrail = 0.25;
                followFarmTrail = 0.25;
                followEnemyTrail = 0.25;
                break;
            case "Farmer":
                followBuildTrail = 0;
                followForageTrail = 0.1;
                followFarmTrail = 0.85;
                followEnemyTrail = 0.05;
                break;
            case "Warrior":
                followBuildTrail = 0;
                followForageTrail = 0.2;
                followFarmTrail = 0;
                followEnemyTrail = 1;
                break;
            case "Spitter":
                followBuildTrail = 0;
                followForageTrail = 0.2;
                followFarmTrail = 0;
                followEnemyTrail = 1;
                break;
            case "DeLozier":
                followBuildTrail = 0;
                followForageTrail = 0;
                followFarmTrail = 0;
                followEnemyTrail = 0;
                break;
            default:
                followBuildTrail = 0;
                followForageTrail = 0.75;
                followFarmTrail = 0;
                followEnemyTrail = 0.25;
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

    checkTrail(pheromoneType){
        /*Check Trail:
            Checks a trail using trail type and ant type. Generates number from 0-1. If it falls in the bounds, the ant follows the path, else sets to ignore that type until next state change (maybe make it dynamic (-50% chance))
        */
    }

    modifyPriorityTrails(){
        switch(flag_){
            case "reset":
            case "hungry":
            case "starving":

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
    //Checks hunger meter every second
    if(hunger = 100){
        flag_ = "hungry";
        runFlagState();
    }
    if(hunger = 160){
        flag_ = "starving";
        runFlagState();
    }
    if(hunger = 200){
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
