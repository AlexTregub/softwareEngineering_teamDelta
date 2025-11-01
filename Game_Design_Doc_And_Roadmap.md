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
        5: Save Antony the evil AntEater.
        Extra: Keep your ants feed so they don't starve to death (But you're the queen so does this really matter as long as you dont starve???)

## Test Stack and Test Driven Development

- **Testing Types and Technology**

### ALL TESTS NEED
    - NODE.JS
    - NPM
### UNIT TESTS
    U
    - MOCHA
    - CHAI
    - SINON
### INTEGRATION TESTS
    - MOCHA
    - CHAI
    - SINON
### BDD TESTS
    - BEHAVE
    - SELENIUM
    - WEBDRIVER
    - CHROMDRIVER
### E2E TESTS
    - PUPPETEER


### Testing Artifacts 
- **Screenshots produced from E2E tests**
- **BDD testing scheme**


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
    [x] - E2E & BDD TESTING ( Write tests that use completed system as it is now to produce evidence of value for the shareholders )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - FEATURE COMPLETE ( All acceptance criteria are met )

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
    [ ] - E2E & BDD TESTING ( Write tests that use completed system as it is now to produce evidence of value for the shareholders )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - FEATURE COMPLETE ( All acceptance criteria are met )

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
    [x] - E2E & BDD TESTING ( Write tests that use completed system as it is now to produce evidence of value for the shareholders )
    [x] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - FEATURE COMPLETE ( All acceptance criteria are met )

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
    [ ] - E2E & BDD TESTING ( Write tests that use completed system as it is now to produce evidence of value for the shareholders )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - FEATURE COMPLETE ( All acceptance criteria are met )

### Task System (Quests)

**Summary**: Tasks that the player can complete to progress the main story, get more ant, or get stat buffs for themselves or allied ants
**High Level Overview**
    [ ] - REQUIREMENTS CHECKLIST ( What is everything known that this feature should do )
    [ ] - ACCEPTANCE CRITERIA FOR COMPLETION ( What should this do once it is feature complete )
    [ ] - TDD RED PHASE ( Write failing tests that account for all of the known requirements )
    [ ] - IMPLEMENTATION ( Write just enough code to make those tests pass )
    [ ] - TDD GREEN PHASE ( Run tests, fail, repeat until you have robustly tested your feature )
    [ ] - INTERGRATION TESTING ( Write failing tests that account for every system this change may touch, even some that it won't just to be sure )
    [ ] - INTERGRATE ( Wire your code into the existing system with the dependencies it needs )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - E2E & BDD TESTING ( Write tests that use completed system as it is now to produce evidence of value for the shareholders )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - FEATURE COMPLETE ( All acceptance criteria are met )

### Level Editor

**Summary**: Level editor where the user can paint terrain, entities, and events to a canvas that can be exported via JSON.
The player will be able to create custom named NPC's, using whatever sprite they want and assgin whatever entity based class type they want
The player will be able to wire up events, which can either be placed on the map by painting the terrain with a linked event brush, or
the event can be linked to a global event (Day/Night Cycle)
**High Level Overview**
    [X] - REQUIREMENTS CHECKLIST ( What is everything known that this feature should do )
    [X] - ACCEPTANCE CRITERIA FOR COMPLETION ( What should this do once it is feature complete )
    [X] - TDD RED PHASE ( Write failing tests that account for all of the known requirements )
    [ ] - IMPLEMENTATION ( Write just enough code to make those tests pass )
    [ ] - TDD GREEN PHASE ( Run tests, fail, repeat until you have robustly tested your feature )
    [ ] - INTERGRATION TESTING ( Write failing tests that account for every system this change may touch, even some that it won't just to be sure )
    [ ] - INTERGRATE ( Wire your code into the existing system with the dependencies it needs )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - E2E & BDD TESTING ( Write tests that use completed system as it is now to produce evidence of value for the shareholders )
    [ ] - REFACTOR ( The last test broke something or didn't work correctly, fix it )
    [ ] - FEATURE COMPLETE ( All acceptance criteria are met )


**High Level Overview**

### Gameplay

**Walk-through of an example game**
    After starting the game, the player will take control of a queen ant who has woken up deep inside
    an enemy nest, surronded by several other ants. 
    One of these Ants, Antony, will serve as the tutorial/guide for the first few minutes of the game.
    The player will first be shown how to rally the other ants through the pheromones then will command
    ants to build a few small structures with materials in the nest.
    Once the player has enough ants and are recovered enough, they will be tasked with building a 
    battering ram to bust through the wall holding them captive (This is just a cutscene setpiece).
    As the player starts busting out, AntEater busts into the cave, yoinks Antony.
    The player then be able to follow Antony's pheromone trail to rescue him! (This should not have to be a real
    pheromone trail, just think of it as arrow pointing towards the next objective).

    The player will then tranistion to the open world, which will feature the randomized terrain, 
    They player will then be able to establish a small town where they can start building up forces to move on
    to the next area, but they will be set upon by many random events, including nightly enemy raids, 
    rain that makes the pheromones disapate much faster, and idk, maybe lightning just hits you.
    The player will then also be able to decend into other hand crafted dungeons where they can get powers for the
    queen ant to use, like getting lightning, these may also disable certain negative events. 

    Eventually, the player will have enough forces to break into the AntEater base, where the boss sequence will
    occur. The player then uses all of their power to destory the AntEater, freeing Antony, and rolling the credits!

**Player Interactions**
    The player will control the Ant Queen
    The game is setup in a top down perspective
    The main goal of the game is to rescue Antony from the AntEater.
    The player will interact with the world in a few main ways
        - Giving indirect commands to ants via pheromones
        - Giving direct commands to ants when they are within a certain command range
        - Building up small settlements that will both allow the ant queen to breed certain types of ants and assign stat buffs
        - Command Ants to terraform the world around based on terrain the queen ant has walked on before

**Ant Interactions**
    Ants can fight, build, gather, terraform, eat, and be idle waiting for pheromones. 

### 

## Major Systems Architecture  

## Roadmap to 1.0 
    -- DEAR GOD PLEASE DO NOT MAKE ME LIST PRIOR STUFF --
    -- THIS IS IN NO PARTICULAR ORDER --
     [ ] - Finish Entity Template/Painter
     [ ] - Finish Event Template/Painter
     [ ] - Create an event that links one map to another map (open world or otherwise)
     [ ] - Create 3+ discrete custom maps that can loaded into from one another in sequence
     [ ] - Add Enemy Night Raids Event
     [ ] - Add A few other Random Events
     [ ] - Add a tutorial event
     [ ] - Add a way to add random buildings and events attached to buildings to the random terrain
     [ ] - Add visuals for ant brain
     [ ] - Add a few more powers
     [ ] - Add more buildings (This is a colony sim, lets add a few more buildings/structures, even just decorative)
     [ ] - Picking up food will keep them from starving
     [ ] - Add Final Dungeon
     [ ] - Add Antony
     [ ] - Add Dialogue System
     [ ] - Add Farm Building and functionality.
     [ ] - Add Basic UI.
     [ ] - Add Starting Cave
     [ ] - Get Custom Maps and the rest of the systems working

### Systems Roadmaps
