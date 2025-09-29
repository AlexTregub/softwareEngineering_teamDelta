class Stench{
    /*Pheromone class:
        Has state of pheromone: Combat, foraging, etc.
        Has strength of the pheromone: Queen ant > normal ant. Changes during diffusion
        Has direction of the pheromone (May add to pathfinding): Where the smell came from. 
        Has central path marker (Probably in pathfinding): Where the original path is. Ants
            should follow and branch from the path, not just follow the pheromone everywhere.
        

    */
    constructor(state, antType){
        this.state = state;
        this.stress = 0;
        
    }
    addStress(terrainType){
        /*Adding Stress: 
            When terrain is very difficult to traverse, ants on the path release stress
            Stress tells ants to find/build another path
            Slowly evaporates in case difficult terrain is best-case.
        */

    }
}

function diffuse(){
    /*Diffuse:
        Diffuses the pheromone: Divides current strength by evaporation rate,
        Spreads weaker pheromone to other tiles
        Assuming multiple path tiles are able to diffuse to the same tile
    */
}

function findDiffusionRate(){
    /*Diffusion Rate:
        Need to account for different terrain modifiers (rough vs flat)
        Possible for ants to output more pheromone if spending time on longer terrain
        Solutions: 
            Only output pheromones when stepping on the tile
            Constantly output pheromone on tiles but have a stress modifier for harsh terrain
    */
    
}