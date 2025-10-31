# ANTS! - Colony Sim and Adventure Game
- **Summary**
    A little game about some ants.
    Focus on colony building, but random elements keep throwing a wrench in all the 
    nice places you make. 
    You are the an Ant Queen, and it's your job to;
        1: Not Die
        2: Have Babies ( who serve you! )
        3: Build nice little colonies ( Which will be destroyed by the forces of darkness )
        4: Journey across the land to unlock hidden ant spells to smite your enemies
        5: Save Antony the evil AntonyEater.

## Test Stack and Test Driven Development
- **Testing Types and Technology**


## High Level Features

### Random Terrain Grid System

**Summary**: Grid system with terrain rendered on a per cell basis
    Terrain is selected based on perlin noise generation
    Serves as the backbone of the pathfinding system

**Possible Enhancements**
    Tilesets: Three different tile sets, one forest, one desert/beach, one desolate/ruin

**High Level Overview**
    [ ] - REQUIREMENTS CHECKLIST ( What is everything known that this feature should do )
    [ ] - ACCEPTANCE CRITERIA FOR COMPLETION ( What should this do once it is feature complete )
    [x] - TDD RED PHASE ( Write failing tests that account for all of the known requirements )
    [x] - IMPLEMENTATION ( Write just enough code to make those tests pass )
    [x] - TDD GREEN PHASE ( Run tests, fail, repeat until you have robustly tested your feature )
    [x] - INTERGRATION TESTING ( Write failing tests that account for every system this change may touch, even some that it won't just to be sure )
    [x] - INTERGRATE ( Wire your code into the existing system with the dependencies it needs )
    [x] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [x] - ( Write tests that use completed system as it is now to produce evidence of value for the shareholders )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - FEATURE COMPLETE

### Pheromones System

**Summary**: Indirect control system for allied ants, emitted by queens and buildings which will disperse outwards.
    Pheromones can tell ants to Follow, Attack, Build, Gather. Ants will tend to follow pheromone trails.
    Pheromones should disperse after enough time, Ants will follow the strongest Pheromones they can "smell",
    unless expressly overwritten ( Not sure how or if this is true, im guessing. )

**High Level Overview**
    [ ] - REQUIREMENTS CHECKLIST ( What is everything known that this feature should do )
    [ ] - ACCEPTANCE CRITERIA FOR COMPLETION ( What should this do once it is feature complete )
    [ ] - TDD RED PHASE ( Write failing tests that account for all of the known requirements )
    [x] - IMPLEMENTATION ( Write just enough code to make those tests pass )
    [ ] - TDD GREEN PHASE ( Run tests, fail, repeat until you have robustly tested your feature )
    [ ] - INTERGRATION TESTING ( Write failing tests that account for every system this change may touch, even some that it won't just to be sure )
    [ ] - INTERGRATE ( Wire your code into the existing system with the dependencies it needs )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - ( Write tests that use completed system as it is now to produce evidence of value for the shareholders )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - FEATURE COMPLETE

### Entity System 

**Summary**: Base class for objects that can interact with Grid Terrian, Pathfinding, and other Entities.

**High Level Overview**
    [ ] - REQUIREMENTS CHECKLIST ( What is everything known that this feature should do )
    [ ] - ACCEPTANCE CRITERIA FOR COMPLETION ( What should this do once it is feature complete )
    [x] - TDD RED PHASE ( Write failing tests that account for all of the known requirements )
    [x] - IMPLEMENTATION ( Write just enough code to make those tests pass )
    [x] - TDD GREEN PHASE ( Run tests, fail, repeat until you have robustly tested your feature )
    [x] - INTERGRATION TESTING ( Write failing tests that account for every system this change may touch, even some that it won't just to be sure )
    [x] - INTERGRATE ( Wire your code into the existing system with the dependencies it needs )
    [x] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [x] - ( Write tests that use completed system as it is now to produce evidence of value for the shareholders )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - FEATURE COMPLETE

### Building System

**Summary**: Placeable Builidngs
**High Level Overview**
    [ ] - REQUIREMENTS CHECKLIST ( What is everything known that this feature should do )
    [ ] - ACCEPTANCE CRITERIA FOR COMPLETION ( What should this do once it is feature complete )
    [ ] - TDD RED PHASE ( Write failing tests that account for all of the known requirements )
    [ ] - IMPLEMENTATION ( Write just enough code to make those tests pass )
    [ ] - TDD GREEN PHASE ( Run tests, fail, repeat until you have robustly tested your feature )
    [ ] - INTERGRATION TESTING ( Write failing tests that account for every system this change may touch, even some that it won't just to be sure )
    [ ] - INTERGRATE ( Wire your code into the existing system with the dependencies it needs )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - ( Write tests that use completed system as it is now to produce evidence of value for the shareholders )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - FEATURE COMPLETE


**High Level Overview**

### Gameplay

### 

## Major Systems Architecture  

## Roadmap to 1.0

### Systems Roadmaps
