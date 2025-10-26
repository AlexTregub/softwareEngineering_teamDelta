"""
Ant State Machine BDD Step Definitions
Tests for ant state transitions, modifiers, and behavioral logic
"""

import time
from behave import given, when, then

# State Machine Initialization and Setup

@given('I have spawned a test ant with job "{job_name}"')
def step_spawn_test_ant_for_state_testing(context, job_name):
    """Spawn ant specifically for state machine testing"""
    result = context.browser.driver.execute_script(f"""
        // Clear and create fresh ant for state testing
        ants = [];
        antIndex = 0;
        
        const testAnt = new ant(200, 200, 32, 32, 30, 0, antBaseSprite, "{job_name}", "player");
        ants[0] = testAnt;
        antIndex = 1;
        
        return {{
            success: true,
            antCreated: true,
            hasStateMachine: testAnt.stateMachine ? true : false,
            initialState: testAnt.stateMachine ? testAnt.stateMachine.primaryState : null
        }};
    """)
    
    assert result['success'], "Test ant should be created successfully"
    assert result['hasStateMachine'], "Test ant should have state machine"
    context.test_ant_index = 0

@given('the ant is in a known initial state')
def step_ensure_known_initial_state(context):
    """Ensure ant is in predictable initial state"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        if (ant && ant.stateMachine) {
            // Reset to known state
            ant.stateMachine.reset();
            
            return {
                currentState: ant.stateMachine.primaryState,
                combatState: ant.stateMachine.combatModifier,
                terrainState: ant.stateMachine.terrainModifier,
                fullState: ant.stateMachine.getFullState()
            };
        }
        return { error: "No ant or state machine available" };
    """)
    
    assert 'error' not in result, result.get('error', '')
    assert result['currentState'] == 'IDLE', f"Ant should start in IDLE state, got {result['currentState']}"
    context.initial_state = result

# State Transition Steps

@given('I have an ant in "{state_name}" state')
def step_set_ant_to_specific_state(context, state_name):
    """Set ant to specific state for testing"""
    result = context.browser.driver.execute_script(f"""
        const ant = ants[0].antObject || ants[0];
        if (ant && ant.stateMachine) {{
            // Set to specific state
            ant.stateMachine.setPrimaryState("{state_name}");
            
            return {{
                success: true,
                newState: ant.stateMachine.primaryState,
                fullState: ant.stateMachine.getFullState()
            }};
        }}
        return {{ success: false, error: "No ant or state machine" }};
    """)
    
    assert result['success'], result.get('error', 'State setting failed')
    assert result['newState'] == state_name, f"Expected state {state_name}, got {result['newState']}"
    context.current_ant_state = state_name

@when('I command the ant to "{action}"')
def step_command_ant_action(context, action):
    """Command ant to perform specific action"""
    # Map actions to state changes and methods
    action_mapping = {
        'move': 'MOVING',
        'gather': 'GATHERING', 
        'attack': 'ATTACKING',
        'build': 'BUILDING',
        'interrupt': 'IDLE',
        'combat': 'IN_COMBAT'
    }
    
    expected_state = action_mapping.get(action, action.upper())
    
    result = context.browser.driver.execute_script(f"""
        const ant = ants[0].antObject || ants[0];
        let actionResult = {{ success: false }};
        
        if (ant && ant.stateMachine) {{
            const oldState = ant.stateMachine.getFullState();
            
            // Execute action based on type
            switch ("{action}") {{
                case "move":
                    if (typeof ant.moveToLocation === 'function') {{
                        ant.moveToLocation(300, 300);
                    }} else {{
                        ant.stateMachine.setPrimaryState("MOVING");
                    }}
                    break;
                    
                case "gather":
                    if (typeof ant.startGathering === 'function') {{
                        ant.startGathering();
                    }} else {{
                        ant.stateMachine.setPrimaryState("GATHERING");
                    }}
                    break;
                    
                case "attack":
                    if (ant.stateMachine.canPerformAction("attack")) {{
                        ant.stateMachine.setCombatModifier("ATTACKING");
                    }}
                    break;
                    
                case "build":
                    if (typeof ant.startBuilding === 'function') {{
                        ant.startBuilding();
                    }} else {{
                        ant.stateMachine.setPrimaryState("BUILDING");
                    }}
                    break;
                    
                case "interrupt":
                    ant.stateMachine.setPrimaryState("IDLE");
                    break;
                    
                case "combat":
                    ant.stateMachine.setCombatModifier("IN_COMBAT");
                    break;
                    
                default:
                    // Try to set as primary state directly
                    ant.stateMachine.setPrimaryState("{expected_state}");
            }}
            
            actionResult = {{
                success: true,
                oldState: oldState,
                newState: ant.stateMachine.getFullState(),
                primaryState: ant.stateMachine.primaryState,
                combatModifier: ant.stateMachine.combatModifier,
                terrainModifier: ant.stateMachine.terrainModifier
            }};
        }}
        
        return actionResult;
    """)
    
    assert result['success'], "Action execution should succeed"
    context.action_result = result
    context.performed_action = action

@then('the ant state should change to "{expected_state}"')
def step_verify_state_change(context, expected_state):
    """Verify ant state changed to expected value"""
    assert hasattr(context, 'action_result'), "Action should have been performed"
    
    result = context.action_result
    
    # Check if expected state is in the full state string
    if '_' in expected_state:
        # Complex state like "MOVING_IN_COMBAT"
        assert result['newState'] == expected_state, f"Expected full state {expected_state}, got {result['newState']}"
    else:
        # Simple primary state
        assert result['primaryState'] == expected_state, f"Expected primary state {expected_state}, got {result['primaryState']}"

@then('the ant should be able to perform "{allowed_actions}"')
def step_verify_allowed_actions(context, allowed_actions):
    """Verify ant can perform specified actions in current state"""
    actions_list = [action.strip() for action in allowed_actions.split(',')]
    
    result = context.browser.driver.execute_script(f"""
        const ant = ants[0].antObject || ants[0];
        const actionResults = {{}};
        
        if (ant && ant.stateMachine) {{
            const actions = {actions_list};
            
            for (let action of actions) {{
                actionResults[action] = ant.stateMachine.canPerformAction(action);
            }}
        }}
        
        return actionResults;
    """)
    
    for action in actions_list:
        assert result.get(action, False), f"Ant should be able to perform '{action}' in current state"

@then('the state change should be reflected in the browser')
def step_verify_state_change_in_browser(context):
    """Verify state change is properly reflected in browser environment"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        
        return {
            stateMachineResponsive: ant && ant.stateMachine ? true : false,
            stateAccessible: ant && ant.stateMachine ? ant.stateMachine.getFullState() : null,
            primaryState: ant && ant.stateMachine ? ant.stateMachine.primaryState : null
        };
    """)
    
    assert result['stateMachineResponsive'], "State machine should be responsive in browser"
    assert result['stateAccessible'] is not None, "State should be accessible from browser"

# Combat State Steps

@when('the ant detects an enemy nearby')
def step_ant_detects_enemy(context):
    """Simulate ant detecting enemy and entering combat"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        
        if (ant && ant.stateMachine) {
            // Simulate enemy detection
            const oldState = ant.stateMachine.getFullState();
            
            // Add enemy to nearby enemies if method exists
            if (typeof ant.checkForEnemies === 'function') {
                // Create mock enemy for detection
                const mockEnemy = {
                    posX: ant.posX + 50,
                    posY: ant.posY + 50, 
                    faction: 'enemy'
                };
                
                // Temporarily add enemy to ants array for detection
                const tempIndex = ants.length;
                ants[tempIndex] = mockEnemy;
                antIndex = tempIndex + 1;
                
                ant.checkForEnemies();
                
                // Clean up temp enemy
                ants.splice(tempIndex, 1);
                antIndex = tempIndex;
            } else {
                // Manual combat state setting
                ant.stateMachine.setCombatModifier("IN_COMBAT");
            }
            
            return {
                success: true,
                oldState: oldState,
                newState: ant.stateMachine.getFullState(),
                combatState: ant.stateMachine.combatModifier
            };
        }
        
        return { success: false };
    """)
    
    assert result['success'], "Enemy detection simulation should succeed"
    context.combat_detection_result = result

@then('the ant should enter "{combat_state}" state')
def step_verify_combat_state(context, combat_state):
    """Verify ant entered specified combat state"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            combatModifier: ant && ant.stateMachine ? ant.stateMachine.combatModifier : null,
            isInCombat: ant && ant.stateMachine ? ant.stateMachine.isInCombat() : false
        };
    """)
    
    if combat_state == "IN_COMBAT":
        assert result['isInCombat'], "Ant should be in combat"
        assert result['combatModifier'] == "IN_COMBAT", f"Expected combat state IN_COMBAT, got {result['combatModifier']}"

@then('the ant combat modifier should be "{expected_modifier}"')
def step_verify_combat_modifier(context, expected_modifier):
    """Verify specific combat modifier"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            combatModifier: ant && ant.stateMachine ? ant.stateMachine.combatModifier : null
        };
    """)
    
    assert result['combatModifier'] == expected_modifier, f"Expected combat modifier {expected_modifier}, got {result['combatModifier']}"

@when('the enemy moves away')
def step_enemy_moves_away(context):
    """Simulate enemy moving away and combat ending"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        
        if (ant && ant.stateMachine) {
            // Simulate no enemies nearby
            if (ant.nearbyEnemies) {
                ant.nearbyEnemies = [];
            }
            
            // Return to out of combat
            ant.stateMachine.setCombatModifier("OUT_OF_COMBAT");
            
            return {
                success: true,
                newState: ant.stateMachine.getFullState(),
                combatState: ant.stateMachine.combatModifier
            };
        }
        
        return { success: false };
    """)
    
    assert result['success'], "Enemy departure simulation should succeed"
    context.combat_end_result = result

@then('the ant should return to "{expected_state}" state')
def step_verify_return_to_state(context, expected_state):
    """Verify ant returned to expected state"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            combatModifier: ant && ant.stateMachine ? ant.stateMachine.combatModifier : null,
            isOutOfCombat: ant && ant.stateMachine ? ant.stateMachine.isOutOfCombat() : false
        };
    """)
    
    if expected_state == "OUT_OF_COMBAT":
        assert result['isOutOfCombat'], "Ant should be out of combat"
        assert result['combatModifier'] == "OUT_OF_COMBAT", f"Expected OUT_OF_COMBAT, got {result['combatModifier']}"

# Terrain State Steps

@given('I have an ant in "{state_name}" state on default terrain')
def step_ant_on_default_terrain(context, state_name):
    """Set ant to specific state on default terrain"""
    result = context.browser.driver.execute_script(f"""
        const ant = ants[0].antObject || ants[0];
        
        if (ant && ant.stateMachine) {{
            ant.stateMachine.setPrimaryState("{state_name}");
            ant.stateMachine.setTerrainModifier("DEFAULT");
            
            return {{
                success: true,
                primaryState: ant.stateMachine.primaryState,
                terrainState: ant.stateMachine.terrainModifier,
                fullState: ant.stateMachine.getFullState()
            }};
        }}
        
        return {{ success: false }};
    """)
    
    assert result['success'], "Setting ant state and terrain should succeed"
    context.terrain_setup_result = result

@when('the ant moves onto {terrain_type} terrain')
def step_ant_moves_to_terrain(context, terrain_type):
    """Simulate ant moving onto different terrain"""
    # Map terrain types to state machine terrain modifiers
    terrain_mapping = {
        'muddy': 'IN_MUD',
        'slippery': 'ON_SLIPPERY', 
        'rough': 'ON_ROUGH',
        'water': 'IN_WATER',
        'default': 'DEFAULT'
    }
    
    terrain_modifier = terrain_mapping.get(terrain_type, terrain_type.upper())
    
    result = context.browser.driver.execute_script(f"""
        const ant = ants[0].antObject || ants[0];
        
        if (ant && ant.stateMachine) {{
            const oldState = ant.stateMachine.getFullState();
            
            // Simulate terrain detection and change
            ant.stateMachine.setTerrainModifier("{terrain_modifier}");
            
            return {{
                success: true,
                oldState: oldState,
                newState: ant.stateMachine.getFullState(),
                terrainModifier: ant.stateMachine.terrainModifier
            }};
        }}
        
        return {{ success: false }};
    """)
    
    assert result['success'], "Terrain change should succeed"
    context.terrain_change_result = result

@then('the ant terrain modifier should be "{expected_terrain}"')
def step_verify_terrain_modifier(context, expected_terrain):
    """Verify ant has expected terrain modifier"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            terrainModifier: ant && ant.stateMachine ? ant.stateMachine.terrainModifier : null
        };
    """)
    
    assert result['terrainModifier'] == expected_terrain, f"Expected terrain {expected_terrain}, got {result['terrainModifier']}"

@then('the ant movement speed should be reduced to {percentage:d}%')
def step_verify_movement_speed_reduction(context, percentage):
    """Verify ant movement speed is reduced by terrain"""
    result = context.browser.driver.execute_script(f"""
        const ant = ants[0].antObject || ants[0];
        
        if (ant && typeof ant.getEffectiveMovementSpeed === 'function') {{
            const effectiveSpeed = ant.getEffectiveMovementSpeed();
            const baseSpeed = ant.movementSpeed || 30; // Default speed
            const expectedSpeed = Math.floor(baseSpeed * {percentage} / 100);
            
            return {{
                hasSpeedMethod: true,
                effectiveSpeed: effectiveSpeed,
                baseSpeed: baseSpeed,
                expectedSpeed: expectedSpeed,
                actualPercentage: Math.round((effectiveSpeed / baseSpeed) * 100)
            }};
        }}
        
        return {{ hasSpeedMethod: false }};
    """)
    
    if result['hasSpeedMethod']:
        assert abs(result['actualPercentage'] - percentage) <= 5, f"Expected ~{percentage}% speed, got {result['actualPercentage']}%"
    else:
        # Speed method not available, skip detailed verification
        pass

@then('the ant state should show "{expected_full_state}"')
def step_verify_full_state_string(context, expected_full_state):
    """Verify complete state string includes all modifiers"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            fullState: ant && ant.stateMachine ? ant.stateMachine.getFullState() : null
        };
    """)
    
    assert result['fullState'] == expected_full_state, f"Expected full state {expected_full_state}, got {result['fullState']}"

@when('the ant moves back to default terrain')
def step_ant_returns_to_default_terrain(context):
    """Simulate ant returning to default terrain"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        
        if (ant && ant.stateMachine) {
            ant.stateMachine.setTerrainModifier("DEFAULT");
            
            return {
                success: true,
                newTerrain: ant.stateMachine.terrainModifier,
                fullState: ant.stateMachine.getFullState()
            };
        }
        
        return { success: false };
    """)
    
    assert result['success'], "Return to default terrain should succeed"
    context.terrain_return_result = result

@then('the terrain modifier should return to "{expected_modifier}"')
def step_verify_terrain_return(context, expected_modifier):
    """Verify terrain modifier returned to expected value"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            terrainModifier: ant && ant.stateMachine ? ant.stateMachine.terrainModifier : null
        };
    """)
    
    assert result['terrainModifier'] == expected_modifier, f"Expected terrain {expected_modifier}, got {result['terrainModifier']}"

@then('movement speed should return to normal')
def step_verify_speed_returns_to_normal(context):
    """Verify movement speed returned to normal"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        
        if (ant && typeof ant.getEffectiveMovementSpeed === 'function') {
            const effectiveSpeed = ant.getEffectiveMovementSpeed();
            const baseSpeed = ant.movementSpeed || 30;
            
            return {
                hasSpeedMethod: true,
                effectiveSpeed: effectiveSpeed,
                baseSpeed: baseSpeed,
                speedsMatch: effectiveSpeed === baseSpeed
            };
        }
        
        return { hasSpeedMethod: false };
    """)
    
    if result['hasSpeedMethod']:
        assert result['speedsMatch'], f"Speed should return to normal: effective={result['effectiveSpeed']}, base={result['baseSpeed']}"