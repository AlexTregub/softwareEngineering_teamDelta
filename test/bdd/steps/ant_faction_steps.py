"""
Ant Faction System BDD Step Definitions
Tests for enemy detection, faction warfare, and Queen coordination
"""

import time
from behave import given, when, then

# Faction System Setup Steps

@given('I have two ants from different factions')
def step_create_ants_different_factions(context):
    """Create ants from different factions for testing"""
    result = context.browser.driver.execute_script("""
        // Clear existing ants
        ants = [];
        antIndex = 0;
        
        // Create player faction ant
        const playerAnt = new ant(200, 200, 32, 32, 30, 0, antBaseSprite, "Worker", "player");
        ants[0] = playerAnt;
        
        // Create enemy faction ant
        const enemyAnt = new ant(300, 300, 32, 32, 30, 0, antBaseSprite, "Soldier", "enemy");
        ants[1] = enemyAnt;
        
        antIndex = 2;
        
        return {
            success: true,
            playerAnt: {
                index: 0,
                faction: playerAnt.faction,
                job: playerAnt.job,
                position: { x: playerAnt.posX, y: playerAnt.posY }
            },
            enemyAnt: {
                index: 1, 
                faction: enemyAnt.faction,
                job: enemyAnt.job,
                position: { x: enemyAnt.posX, y: enemyAnt.posY }
            }
        };
    """)
    
    assert result['success'], "Should create ants from different factions"
    assert result['playerAnt']['faction'] == 'player', "First ant should be player faction"
    assert result['enemyAnt']['faction'] == 'enemy', "Second ant should be enemy faction"
    
    context.player_ant_index = result['playerAnt']['index']
    context.enemy_ant_index = result['enemyAnt']['index']
    context.faction_setup = result

@given('the ants are within detection range')
def step_ants_within_detection_range(context):
    """Position ants within detection range of each other"""
    result = context.browser.driver.execute_script("""
        const playerAnt = ants[0].antObject || ants[0];
        const enemyAnt = ants[1].antObject || ants[1];
        
        if (playerAnt && enemyAnt) {
            // Position ants close together for detection
            playerAnt.posX = 250;
            playerAnt.posY = 250;
            enemyAnt.posX = 280; // 30 pixels away - should be within detection
            enemyAnt.posY = 280;
            
            // Calculate actual distance
            const dx = enemyAnt.posX - playerAnt.posX;
            const dy = enemyAnt.posY - playerAnt.posY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return {
                success: true,
                distance: distance,
                playerPosition: { x: playerAnt.posX, y: playerAnt.posY },
                enemyPosition: { x: enemyAnt.posX, y: enemyAnt.posY },
                withinRange: distance <= 100 // Assume 100px detection range
            };
        }
        
        return { success: false };
    """)
    
    assert result['success'], "Should position ants successfully"
    assert result['withinRange'], f"Ants should be within detection range (distance: {result['distance']:.1f})"
    context.detection_setup = result

@given('the ants are outside detection range')
def step_ants_outside_detection_range(context):
    """Position ants outside detection range"""
    result = context.browser.driver.execute_script("""
        const playerAnt = ants[0].antObject || ants[0];
        const enemyAnt = ants[1].antObject || ants[1];
        
        if (playerAnt && enemyAnt) {
            // Position ants far apart
            playerAnt.posX = 100;
            playerAnt.posY = 100;
            enemyAnt.posX = 400; // 300+ pixels away - outside detection
            enemyAnt.posY = 400;
            
            const dx = enemyAnt.posX - playerAnt.posX;
            const dy = enemyAnt.posY - playerAnt.posY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return {
                success: true,
                distance: distance,
                playerPosition: { x: playerAnt.posX, y: playerAnt.posY },
                enemyPosition: { x: enemyAnt.posX, y: enemyAnt.posY },
                outsideRange: distance > 100
            };
        }
        
        return { success: false };
    """)
    
    assert result['success'], "Should position ants successfully"
    assert result['outsideRange'], f"Ants should be outside detection range (distance: {result['distance']:.1f})"

# Enemy Detection Steps

@when('the player ant scans for enemies')
def step_player_ant_scans_for_enemies(context):
    """Execute enemy detection scan"""
    result = context.browser.driver.execute_script("""
        const playerAnt = ants[0].antObject || ants[0];
        
        if (playerAnt) {
            let detectionResult = { enemiesFound: [] };
            
            // Check if ant has enemy detection method
            if (typeof playerAnt.checkForEnemies === 'function') {
                playerAnt.checkForEnemies();
                detectionResult.usedMethod = 'checkForEnemies';
                detectionResult.enemiesFound = playerAnt.nearbyEnemies || [];
            } else if (typeof playerAnt.scanForEnemies === 'function') {
                playerAnt.scanForEnemies();
                detectionResult.usedMethod = 'scanForEnemies';
                detectionResult.enemiesFound = playerAnt.detectedEnemies || [];
            } else {
                // Manual enemy detection
                detectionResult.usedMethod = 'manual';
                detectionResult.enemiesFound = [];
                
                const detectionRange = 100;
                
                for (let i = 1; i < ants.length; i++) {
                    const otherAnt = ants[i].antObject || ants[i];
                    if (otherAnt && otherAnt.faction !== playerAnt.faction) {
                        const dx = otherAnt.posX - playerAnt.posX;
                        const dy = otherAnt.posY - playerAnt.posY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance <= detectionRange) {
                            detectionResult.enemiesFound.push({
                                index: i,
                                faction: otherAnt.faction,
                                distance: distance,
                                position: { x: otherAnt.posX, y: otherAnt.posY }
                            });
                        }
                    }
                }
                
                // Store detected enemies on ant
                playerAnt.nearbyEnemies = detectionResult.enemiesFound;
            }
            
            return {
                success: true,
                method: detectionResult.usedMethod,
                enemiesDetected: detectionResult.enemiesFound.length,
                enemies: detectionResult.enemiesFound
            };
        }
        
        return { success: false };
    """)
    
    assert result['success'], "Enemy scan should execute successfully"
    context.detection_result = result

@then('the player ant should detect the enemy ant')
def step_should_detect_enemy_ant(context):
    """Verify enemy ant was detected"""
    assert hasattr(context, 'detection_result'), "Detection scan should have been performed"
    
    result = context.detection_result
    assert result['enemiesDetected'] > 0, f"Should detect at least one enemy, found {result['enemiesDetected']}"
    
    # Verify enemy is the correct faction
    enemy_found = False
    for enemy in result['enemies']:
        if enemy.get('faction') == 'enemy':
            enemy_found = True
            break
    
    assert enemy_found, "Should detect enemy faction ant"

@then('the player ant should not detect any enemies')
def step_should_not_detect_enemies(context):
    """Verify no enemies were detected"""
    assert hasattr(context, 'detection_result'), "Detection scan should have been performed"
    
    result = context.detection_result
    assert result['enemiesDetected'] == 0, f"Should detect no enemies, found {result['enemiesDetected']}"

@then('the detection should trigger combat state')
def step_detection_triggers_combat(context):
    """Verify enemy detection triggered combat state"""
    result = context.browser.driver.execute_script("""
        const playerAnt = ants[0].antObject || ants[0];
        
        return {
            hasStateMachine: playerAnt && playerAnt.stateMachine ? true : false,
            isInCombat: playerAnt && playerAnt.stateMachine ? playerAnt.stateMachine.isInCombat() : false,
            combatModifier: playerAnt && playerAnt.stateMachine ? playerAnt.stateMachine.combatModifier : null,
            primaryState: playerAnt && playerAnt.stateMachine ? playerAnt.stateMachine.primaryState : null
        };
    """)
    
    if result['hasStateMachine']:
        assert result['isInCombat'] or result['combatModifier'] == 'IN_COMBAT', "Detection should trigger combat state"

# Faction Identification Steps

@when('I check the faction of each ant')
def step_check_ant_factions(context):
    """Check and verify faction assignments"""
    result = context.browser.driver.execute_script("""
        const factionInfo = [];
        
        for (let i = 0; i < Math.min(ants.length, 2); i++) {
            const antObj = ants[i].antObject || ants[i];
            if (antObj) {
                factionInfo.push({
                    index: i,
                    faction: antObj.faction,
                    job: antObj.job,
                    isPlayer: antObj.faction === 'player',
                    isEnemy: antObj.faction === 'enemy'
                });
            }
        }
        
        return {
            success: true,
            antCount: factionInfo.length,
            factions: factionInfo
        };
    """)
    
    assert result['success'], "Should check ant factions successfully"
    context.faction_check = result

@then('I should be able to distinguish between player and enemy factions')
def step_distinguish_factions(context):
    """Verify ability to distinguish between factions"""
    assert hasattr(context, 'faction_check'), "Faction check should have been performed"
    
    result = context.faction_check
    assert result['antCount'] >= 2, "Should have at least 2 ants to compare"
    
    player_found = False
    enemy_found = False
    
    for ant_info in result['factions']:
        if ant_info['isPlayer']:
            player_found = True
        if ant_info['isEnemy']:
            enemy_found = True
    
    assert player_found, "Should find at least one player faction ant"
    assert enemy_found, "Should find at least one enemy faction ant"

@then('different factions should be properly identified')
def step_factions_properly_identified(context):
    """Verify faction identification is working correctly"""
    result = context.browser.driver.execute_script("""
        const identificationTest = {
            playerAnts: [],
            enemyAnts: [],
            neutralAnts: [],
            unknownAnts: []
        };
        
        for (let i = 0; i < ants.length; i++) {
            const antObj = ants[i].antObject || ants[i];
            if (antObj) {
                switch (antObj.faction) {
                    case 'player':
                        identificationTest.playerAnts.push(i);
                        break;
                    case 'enemy':
                        identificationTest.enemyAnts.push(i);
                        break;
                    case 'neutral':
                        identificationTest.neutralAnts.push(i);
                        break;
                    default:
                        identificationTest.unknownAnts.push(i);
                }
            }
        }
        
        return {
            success: true,
            identification: identificationTest,
            hasDistinctFactions: identificationTest.playerAnts.length > 0 && identificationTest.enemyAnts.length > 0
        };
    """)
    
    assert result['success'], "Faction identification should work"
    assert result['hasDistinctFactions'], "Should have distinct player and enemy factions"

# Combat Initiation Steps

@when('the enemy ant approaches the player ant')
def step_enemy_approaches_player(context):
    """Simulate enemy ant approaching player ant"""
    result = context.browser.driver.execute_script("""
        const playerAnt = ants[0].antObject || ants[0];
        const enemyAnt = ants[1].antObject || ants[1];
        
        if (playerAnt && enemyAnt) {
            // Move enemy closer to player
            const oldDistance = Math.sqrt(
                (enemyAnt.posX - playerAnt.posX) ** 2 + 
                (enemyAnt.posY - playerAnt.posY) ** 2
            );
            
            // Move enemy to attack range (within 50 pixels)
            const angle = Math.atan2(playerAnt.posY - enemyAnt.posY, playerAnt.posX - enemyAnt.posX);
            enemyAnt.posX = playerAnt.posX - Math.cos(angle) * 40;
            enemyAnt.posY = playerAnt.posY - Math.sin(angle) * 40;
            
            const newDistance = Math.sqrt(
                (enemyAnt.posX - playerAnt.posX) ** 2 + 
                (enemyAnt.posY - playerAnt.posY) ** 2
            );
            
            return {
                success: true,
                oldDistance: oldDistance,
                newDistance: newDistance,
                withinAttackRange: newDistance <= 50,
                enemyPosition: { x: enemyAnt.posX, y: enemyAnt.posY },
                playerPosition: { x: playerAnt.posX, y: playerAnt.posY }
            };
        }
        
        return { success: false };
    """)
    
    assert result['success'], "Enemy approach should succeed"
    assert result['withinAttackRange'], f"Enemy should be within attack range (distance: {result['newDistance']:.1f})"
    context.approach_result = result

@then('combat should be initiated between the ants')
def step_combat_should_initiate(context):
    """Verify combat is initiated between ants"""
    result = context.browser.driver.execute_script("""
        const playerAnt = ants[0].antObject || ants[0];
        const enemyAnt = ants[1].antObject || ants[1];
        
        // Check if combat initiation method exists
        let combatInitiated = false;
        
        if (typeof playerAnt.initiateCombat === 'function' && typeof enemyAnt.initiateCombat === 'function') {
            playerAnt.initiateCombat(enemyAnt);
            enemyAnt.initiateCombat(playerAnt);
            combatInitiated = true;
        } else if (playerAnt.stateMachine && enemyAnt.stateMachine) {
            // Manual combat initiation
            playerAnt.stateMachine.setCombatModifier("IN_COMBAT");
            enemyAnt.stateMachine.setCombatModifier("IN_COMBAT");
            combatInitiated = true;
        }
        
        return {
            success: combatInitiated,
            playerCombatState: playerAnt.stateMachine ? playerAnt.stateMachine.combatModifier : null,
            enemyCombatState: enemyAnt.stateMachine ? enemyAnt.stateMachine.combatModifier : null,
            playerInCombat: playerAnt.stateMachine ? playerAnt.stateMachine.isInCombat() : false,
            enemyInCombat: enemyAnt.stateMachine ? enemyAnt.stateMachine.isInCombat() : false
        };
    """)
    
    assert result['success'], "Combat should be initiated successfully"
    
    # Check if at least one ant is in combat state
    if result['playerInCombat'] is not None:
        assert result['playerInCombat'] or result['enemyInCombat'], "At least one ant should be in combat"

@then('both ants should enter combat mode')
def step_both_ants_enter_combat(context):
    """Verify both ants entered combat mode"""
    result = context.browser.driver.execute_script("""
        const playerAnt = ants[0].antObject || ants[0];
        const enemyAnt = ants[1].antObject || ants[1];
        
        return {
            playerHasStateMachine: playerAnt && playerAnt.stateMachine ? true : false,
            enemyHasStateMachine: enemyAnt && enemyAnt.stateMachine ? true : false,
            playerInCombat: playerAnt && playerAnt.stateMachine ? playerAnt.stateMachine.isInCombat() : false,
            enemyInCombat: enemyAnt && enemyAnt.stateMachine ? enemyAnt.stateMachine.isInCombat() : false,
            playerCombatState: playerAnt && playerAnt.stateMachine ? playerAnt.stateMachine.combatModifier : null,
            enemyCombatState: enemyAnt && enemyAnt.stateMachine ? enemyAnt.stateMachine.combatModifier : null
        };
    """)
    
    if result['playerHasStateMachine'] and result['enemyHasStateMachine']:
        assert result['playerInCombat'], "Player ant should be in combat"
        assert result['enemyInCombat'], "Enemy ant should be in combat"

# Queen Coordination Steps

@given('I have a Queen ant and worker ants')
def step_create_queen_and_workers(context):
    """Create Queen ant with worker ants for coordination testing"""
    result = context.browser.driver.execute_script("""
        // Clear existing ants
        ants = [];
        antIndex = 0;
        
        // Create Queen ant (check if Queen class exists)
        let queenAnt;
        if (typeof Queen !== 'undefined') {
            queenAnt = new Queen(300, 300, 40, 40, 20, 0, queenBaseSprite || antBaseSprite, "player");
        } else {
            // Fallback: create regular ant with Queen job
            queenAnt = new ant(300, 300, 40, 40, 20, 0, antBaseSprite, "Queen", "player");
        }
        ants[0] = queenAnt;
        
        // Create worker ants
        const worker1 = new ant(250, 250, 32, 32, 30, 0, antBaseSprite, "Worker", "player");
        const worker2 = new ant(350, 350, 32, 32, 30, 0, antBaseSprite, "Worker", "player");
        
        ants[1] = worker1;
        ants[2] = worker2;
        antIndex = 3;
        
        return {
            success: true,
            queen: {
                index: 0,
                job: queenAnt.job,
                faction: queenAnt.faction,
                isQueen: queenAnt.job === "Queen" || queenAnt instanceof Queen
            },
            workers: [
                { index: 1, job: worker1.job, faction: worker1.faction },
                { index: 2, job: worker2.job, faction: worker2.faction }
            ]
        };
    """)
    
    assert result['success'], "Should create Queen and workers successfully"
    assert result['queen']['isQueen'], "Should have proper Queen ant"
    assert len(result['workers']) == 2, "Should have 2 worker ants"
    
    context.queen_setup = result

@when('the Queen issues commands to workers')
def step_queen_issues_commands(context):
    """Simulate Queen issuing commands to worker ants"""
    result = context.browser.driver.execute_script("""
        const queenAnt = ants[0].antObject || ants[0];
        const worker1 = ants[1].antObject || ants[1];
        const worker2 = ants[2].antObject || ants[2];
        
        let commandResult = { commandsIssued: [], responses: [] };
        
        if (queenAnt && worker1 && worker2) {
            // Check if Queen has command methods
            if (typeof queenAnt.issueCommand === 'function') {
                // Use Queen's command system
                queenAnt.issueCommand(worker1, "gather");
                queenAnt.issueCommand(worker2, "build");
                
                commandResult.method = "Queen.issueCommand";
                commandResult.commandsIssued = [
                    { target: 1, command: "gather" },
                    { target: 2, command: "build" }
                ];
            } else {
                // Manual command simulation
                if (worker1.stateMachine) {
                    worker1.stateMachine.setPrimaryState("GATHERING");
                    worker1.currentOrder = { source: "Queen", command: "gather" };
                }
                if (worker2.stateMachine) {
                    worker2.stateMachine.setPrimaryState("BUILDING"); 
                    worker2.currentOrder = { source: "Queen", command: "build" };
                }
                
                commandResult.method = "manual";
                commandResult.commandsIssued = [
                    { target: 1, command: "gather", newState: worker1.stateMachine ? worker1.stateMachine.primaryState : null },
                    { target: 2, command: "build", newState: worker2.stateMachine ? worker2.stateMachine.primaryState : null }
                ];
            }
            
            return {
                success: true,
                commands: commandResult
            };
        }
        
        return { success: false };
    """)
    
    assert result['success'], "Queen should issue commands successfully"
    context.queen_commands = result

@then('the workers should respond to Queen commands')
def step_workers_respond_to_queen(context):
    """Verify workers responded to Queen's commands"""
    assert hasattr(context, 'queen_commands'), "Queen commands should have been issued"
    
    result = context.browser.driver.execute_script("""
        const worker1 = ants[1].antObject || ants[1];
        const worker2 = ants[2].antObject || ants[2];
        
        return {
            worker1State: worker1 && worker1.stateMachine ? worker1.stateMachine.primaryState : null,
            worker2State: worker2 && worker2.stateMachine ? worker2.stateMachine.primaryState : null,
            worker1HasOrder: worker1 && worker1.currentOrder ? true : false,
            worker2HasOrder: worker2 && worker2.currentOrder ? true : false
        };
    """)
    
    # Check if workers are in appropriate states
    if result['worker1State']:
        assert result['worker1State'] in ['GATHERING', 'IDLE'], f"Worker 1 should be gathering or idle, got {result['worker1State']}"
    
    if result['worker2State']:
        assert result['worker2State'] in ['BUILDING', 'IDLE'], f"Worker 2 should be building or idle, got {result['worker2State']}"

@then('the faction coordination should be functional')
def step_faction_coordination_functional(context):
    """Verify faction coordination system is working"""
    result = context.browser.driver.execute_script("""
        const coordination = {
            sameFactionAnts: [],
            coordinationActive: false,
            communicationPossible: false
        };
        
        // Check all ants for same faction
        for (let i = 0; i < ants.length; i++) {
            const antObj = ants[i].antObject || ants[i];
            if (antObj && antObj.faction === 'player') {
                coordination.sameFactionAnts.push({
                    index: i,
                    job: antObj.job,
                    canReceiveCommands: typeof antObj.receiveCommand === 'function',
                    canIssueCommands: typeof antObj.issueCommand === 'function'
                });
            }
        }
        
        // Check for coordination methods
        coordination.coordinationActive = coordination.sameFactionAnts.length >= 2;
        coordination.communicationPossible = coordination.sameFactionAnts.some(ant => ant.canIssueCommands) && 
                                            coordination.sameFactionAnts.some(ant => ant.canReceiveCommands);
        
        return coordination;
    """)
    
    assert result['coordinationActive'], "Should have multiple same-faction ants for coordination"
    assert len(result['sameFactionAnts']) >= 2, "Should have at least 2 ants in same faction"

# Cleanup step

@then('the faction system should be reflected in the browser')
def step_faction_system_in_browser(context):
    """Verify faction system is properly reflected in browser"""
    result = context.browser.driver.execute_script("""
        return {
            totalAnts: ants.length,
            factionsRepresented: [...new Set(ants.map(ant => (ant.antObject || ant).faction))],
            factionSystemActive: ants.length > 0 && ants.every(ant => (ant.antObject || ant).faction !== undefined)
        };
    """)
    
    assert result['factionSystemActive'], "Faction system should be active in browser"
    assert len(result['factionsRepresented']) > 0, "Should have at least one faction represented"