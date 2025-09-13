/*
program an enemy ant
red cast's
if the enemy ants looks toward any ants and the ray from enemy in

vector from the enemy- vision ray- from the enemy ants

---make the patrol
---path find to normal ants and kill ants
---Alex Z with enemy ants-- and ants with cape
--they grow as they eat
*/

// Static Vars.
let antToSpawn = 0;
let ant_Index = 0;
let antSize;


function eAnts_Preloader(){
    eAntSize = createVector(20,20)
    antbg = [120, 60, 60]
    eAntImg = loadImage("Images/Ants/enemyAnt.png")
}

function eAnts_Spawn(numToSpawn){
    
}