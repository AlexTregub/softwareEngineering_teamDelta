let hunger;
const hungry = 100;
const starving = 160;
const death = 200;
let flag;

class AntBrain{
    constructor(){
        hunger = 0;
        flag = "";
    }

    decideState(){
        /*Deciding State:
            State is determinant on many variables. If a variable like hunger exceeds a threshold, the brain will set state to immediately fix it.
            A monitor class that constantly monitors these should happen and this should be called when either:
                Needs an emergency state change
                Finished previous state
        */
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
        flag = "hungry";
        runFlagState();
    }
    if(hunger = 160){
        flag = "starving";
        runFlagState();
    }
    if(hunger = 200){
        flag = "death";
        runFlagState();
    }
}

function resetHunger(){
    //Resets hunger once fed (change to use variable if food has different values of saturation)
    hunger = 0;
    flag = "reset";
    runFlagState();
}

function runFlagState(){
    if(flag === "hungry"){
        modifyPriorityTrails(flag);
    }
    if(flag === "starving"){
        modifyPriorityTrails(flag);
    }
    if(flag === "death"){

    }
    if(flag === "reset"){
        modifyPriorityTrails(flag);
        flag = "";
    }
}
