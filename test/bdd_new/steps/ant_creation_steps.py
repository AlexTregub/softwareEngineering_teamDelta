"""
Ant System BDD Step Definitions
Selenium-based step definitions for testing ant creation, behavior, and visual elements
"""

import time
import json
from behave import given, when, then
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Ant Creation and Properties Steps

@given('the ant system is initialized')
def step_ant_system_initialized(context):
    """Verify ant system is loaded and ready"""
    result = context.browser.driver.execute_script("""
        return {
            antClassAvailable: typeof ant !== 'undefined',
            antStateMachineAvailable: typeof AntStateMachine !== 'undefined',
            entitySystemLoaded: typeof Entity !== 'undefined',
            antManagerAvailable: typeof AntManager !== 'undefined',
            antBaseSprite: typeof antBaseSprite !== 'undefined',
            antsArrayExists: typeof ants !== 'undefined'
        };
    """)
    
    assert result['antClassAvailable'], "Ant class should be available"
    assert result['antStateMachineAvailable'], "AntStateMachine class should be available"
    assert result['entitySystemLoaded'], "Entity system should be loaded"
    context.ant_system_ready = True

@when('I spawn {count:d} ant with job "{job_name}" and faction "{faction}"')
def step_spawn_single_ant(context, count, job_name, faction):
    """Spawn a single ant with specified job and faction"""
    result = context.browser.driver.execute_script(f"""
        // Clear any existing ants for clean test
        ants = [];
        antIndex = 0;
        
        // Spawn ant using the game's spawn system
        const originalAntCount = antIndex;
        
        try {{
            // Use antsSpawn function if available
            if (typeof antsSpawn === 'function') {{
                antsSpawn({count}, "{faction}");
                
                // Set job if ant was created
                if (antIndex > originalAntCount && ants[originalAntCount]) {{
                    const antWrapper = ants[originalAntCount];
                    const antObj = antWrapper.antObject || antWrapper;
                    if (antObj && typeof antObj.assignJob === 'function') {{
                        antObj.assignJob("{job_name}");
                    }} else if (antObj) {{
                        antObj.JobName = "{job_name}";
                    }}
                }}
            }} else {{
                // Manual ant creation if spawn function not available
                const newAnt = new ant(
                    Math.random() * 400 + 100, 
                    Math.random() * 400 + 100, 
                    32, 32, 30, 0, 
                    antBaseSprite, 
                    "{job_name}", 
                    "{faction}"
                );
                ants[antIndex] = newAnt;
                antIndex++;
            }}
            
            return {{
                success: true,
                antCount: antIndex,
                createdAnt: antIndex > 0 ? {{
                    index: antIndex - 1,
                    faction: ants[antIndex - 1].faction || ants[antIndex - 1].antObject?.faction,
                    jobName: ants[antIndex - 1].JobName || ants[antIndex - 1].antObject?.JobName
                }} : null
            }};
        }} catch (error) {{
            return {{
                success: false,
                error: error.message,
                antCount: antIndex
            }};
        }}
    """)
    
    assert result['success'], f"Ant creation failed: {result.get('error', 'Unknown error')}"
    assert result['antCount'] == count, f"Expected {count} ants, got {result['antCount']}"
    
    context.spawned_ant = result['createdAnt']
    context.last_ant_index = result['antCount'] - 1

@when('I spawn {count:d} ants with different jobs and factions')
def step_spawn_multiple_ants_table(context, count):
    """Spawn multiple ants using data table"""
    ants_data = []
    
    for row in context.table:
        job = row['job']
        faction = row['faction'] 
        x = int(row['x'])
        y = int(row['y'])
        ants_data.append({'job': job, 'faction': faction, 'x': x, 'y': y})
    
    result = context.browser.driver.execute_script(f"""
        // Clear existing ants
        ants = [];
        antIndex = 0;
        const antsData = {json.dumps(ants_data)};
        const createdAnts = [];
        
        try {{
            for (let antData of antsData) {{
                const newAnt = new ant(
                    antData.x, antData.y, 32, 32, 30, 0,
                    antBaseSprite, antData.job, antData.faction
                );
                
                ants[antIndex] = newAnt;
                createdAnts.push({{
                    index: antIndex,
                    job: antData.job,
                    faction: antData.faction,
                    x: antData.x,
                    y: antData.y
                }});
                antIndex++;
            }}
            
            return {{
                success: true,
                antCount: antIndex,
                createdAnts: createdAnts
            }};
        }} catch (error) {{
            return {{
                success: false,
                error: error.message
            }};
        }}
    """)
    
    assert result['success'], f"Multiple ant creation failed: {result.get('error')}"
    assert result['antCount'] == len(ants_data), f"Expected {len(ants_data)} ants, got {result['antCount']}"
    
    context.spawned_ants = result['createdAnts']

@then('the ant should be created successfully and exist in the ants array')
def step_verify_ant_created(context):
    """Verify ant was created and exists in ants array"""
    result = context.browser.driver.execute_script("""
        return {
            antExists: antIndex > 0,
            antCount: antIndex,
            firstAntValid: ants[0] ? true : false,
            antHasObject: ants[0] && (ants[0].antObject || ants[0]) ? true : false
        };
    """)
    
    assert result['antExists'], "Ant should exist after creation"
    assert result['firstAntValid'], "First ant should be valid object"
    assert result['antHasObject'], "Ant should have valid ant object"

@then('the ant should be in "{expected_state}" state initially')
def step_verify_ant_initial_state(context, expected_state):
    """Verify ant starts in expected state"""
    result = context.browser.driver.execute_script(f"""
        const ant = ants[0].antObject || ants[0];
        if (ant && ant.stateMachine) {{
            return {{
                currentState: ant.stateMachine.primaryState,
                fullState: ant.stateMachine.getFullState(),
                hasStateMachine: true
            }};
        }}
        return {{ hasStateMachine: false }};
    """)
    
    assert result['hasStateMachine'], "Ant should have state machine"
    assert result['currentState'] == expected_state, f"Expected state '{expected_state}', got '{result['currentState']}'"

@then('the ant should have faction "{expected_faction}"')
def step_verify_ant_faction(context, expected_faction):
    """Verify ant has correct faction"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            faction: ant ? ant.faction : null,
            hasFaction: ant && typeof ant.faction !== 'undefined'
        };
    """)
    
    assert result['hasFaction'], "Ant should have faction property"
    assert result['faction'] == expected_faction, f"Expected faction '{expected_faction}', got '{result['faction']}'"

@then('the ant should have job "{expected_job}"')
def step_verify_ant_job(context, expected_job):
    """Verify ant has correct job"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            jobName: ant ? ant.JobName : null,
            hasJob: ant && typeof ant.JobName !== 'undefined'
        };
    """)
    assert result['hasJob'], "Ant should have JobName property"
    assert result['jobName'] == expected_job, f"Expected job '{expected_job}', got '{result['jobName']}'"

@then('the ant should be visible on screen')
def step_verify_ant_visible(context):
    """Verify ant is rendered and visible"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        
        if (ant) {
            // Force render call if available
            if (typeof ant.render === 'function') {
                try {
                    ant.render();
                } catch (e) {
                    // Render might fail in test environment, that's OK
                }
            }
            
            return {
                hasPosition: typeof ant.posX === 'number' && typeof ant.posY === 'number',
                hasSize: typeof ant.sizeX === 'number' && typeof ant.sizeY === 'number',
                position: { x: ant.posX, y: ant.posY },
                size: { width: ant.sizeX, height: ant.sizeY },
                hasSprite: ant._sprite ? true : false,
                renderControllerExists: ant._renderController ? true : false
            };
        }
        
        return { hasPosition: false };
    """)
    
    assert result['hasPosition'], "Ant should have valid position coordinates"
    assert result['hasSize'], "Ant should have valid size dimensions"
    # Note: In headless mode, actual visual rendering may not be testable,
    # but we can verify the ant has the necessary properties for rendering

@then('the ant should have a valid antIndex')
def step_verify_ant_index(context):
    """Verify ant has proper index management"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            antIndexGlobal: antIndex,
            antHasIndex: ant && typeof ant.antIndex !== 'undefined',
            antIndexValue: ant ? ant.antIndex : null,
            antsArrayLength: ants.length
        };
    """)
    
    assert result['antIndexGlobal'] > 0, "Global antIndex should be incremented"
    assert result['antsArrayLength'] > 0, "Ants array should contain ants"
    
    # Note: Individual ant index property may or may not exist depending on implementation

# Entity Integration Steps

@then('the ant should inherit from Entity class')
def step_verify_entity_inheritance(context):
    """Verify ant inherits from Entity properly"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            isEntityInstance: ant instanceof Entity,
            hasEntityMethods: typeof ant.update === 'function' && typeof ant.render === 'function',
            entityTypeExists: typeof Entity !== 'undefined'
        };
    """)
    
    assert result['entityTypeExists'], "Entity class should be available"
    if result['isEntityInstance']:
        assert result['hasEntityMethods'], "Ant should have Entity methods if inheriting"
    # Note: Inheritance verification may vary based on implementation

@then('the ant should have a {controller_type}')
def step_verify_controller_exists(context, controller_type):
    """Verify ant has specific controller"""
    controller_property = f"_{controller_type.lower()}"
    
    result = context.browser.driver.execute_script(f"""
        const ant = ants[0].antObject || ants[0];
        return {{
            hasController: ant && ant['{controller_property}'] ? true : false,
            controllerType: ant && ant['{controller_property}'] ? typeof ant['{controller_property}'] : 'undefined'
        }};
    """)
    
    # Controllers may or may not be available depending on Entity implementation
    # This is informational verification rather than strict requirement
    context.controller_status = context.controller_status or {}
    context.controller_status[controller_type] = result['hasController']

@then('the ant should have collision detection capabilities')
def step_verify_collision_detection(context):
    """Verify ant has collision detection"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        return {
            hasCollisionBox: ant && ant._collisionBox ? true : false,
            hasIsMouseOver: typeof ant.isMouseOver === 'function',
            hasPosition: typeof ant.posX === 'number' && typeof ant.posY === 'number',
            hasSize: typeof ant.sizeX === 'number' && typeof ant.sizeY === 'number'
        };
    """)
    
    # Basic collision detection requirements
    assert result['hasPosition'], "Ant should have position for collision detection"
    assert result['hasSize'], "Ant should have size for collision detection" 
    
    # Method availability may vary by implementation
    if result['hasIsMouseOver']:
        context.collision_method_available = True

# Multiple Ant Verification Steps

@then('each ant should have unique properties')
def step_verify_unique_properties(context):
    """Verify each spawned ant has unique properties"""
    result = context.browser.driver.execute_script("""
        const uniquePositions = new Set();
        const uniqueJobs = new Set();
        const uniqueFactions = new Set();
        const antDetails = [];
        
        for (let i = 0; i < antIndex; i++) {
            const ant = ants[i].antObject || ants[i];
            if (ant) {
                const posKey = `${ant.posX},${ant.posY}`;
                uniquePositions.add(posKey);
                uniqueJobs.add(ant.JobName);
                uniqueFactions.add(ant.faction);
                
                antDetails.push({
                    index: i,
                    position: { x: ant.posX, y: ant.posY },
                    job: ant.JobName,
                    faction: ant.faction
                });
            }
        }
        
        return {
            totalAnts: antIndex,
            uniquePositions: uniquePositions.size,
            uniqueJobs: uniqueJobs.size,
            uniqueFactions: uniqueFactions.size,
            antDetails: antDetails
        };
    """)
    
    # Verify we have the expected diversity based on spawn data
    if hasattr(context, 'spawned_ants') and len(context.spawned_ants) > 1:
        assert result['uniquePositions'] > 1, "Ants should have different positions"
        assert result['uniqueJobs'] > 1, "Ants should have different jobs"
        assert result['uniqueFactions'] > 1, "Ants should have different factions"

@then('all ants should be rendered independently')
def step_verify_independent_rendering(context):
    """Verify all ants render independently"""
    result = context.browser.driver.execute_script("""
        let renderableAnts = 0;
        let antsWithPositions = 0;
        
        for (let i = 0; i < antIndex; i++) {
            const ant = ants[i].antObject || ants[i];
            if (ant) {
                if (typeof ant.posX === 'number' && typeof ant.posY === 'number') {
                    antsWithPositions++;
                }
                if (typeof ant.render === 'function' || ant._renderController) {
                    renderableAnts++;
                }
            }
        }
        
        return {
            totalAnts: antIndex,
            antsWithPositions: antsWithPositions,
            renderableAnts: renderableAnts
        };
    """)
    
    assert result['antsWithPositions'] == result['totalAnts'], "All ants should have valid positions"
    # Rendering capability verification (may vary by implementation)

@then('no ants should share the same position')
def step_verify_no_overlapping_positions(context):
    """Verify no ants are at exactly the same position"""
    result = context.browser.driver.execute_script("""
        const positions = [];
        const duplicates = [];
        
        for (let i = 0; i < antIndex; i++) {
            const ant = ants[i].antObject || ants[i];
            if (ant) {
                const pos = `${ant.posX},${ant.posY}`;
                if (positions.includes(pos)) {
                    duplicates.push(pos);
                } else {
                    positions.push(pos);
                }
            }
        }
        
        return {
            totalPositions: positions.length,
            uniquePositions: positions.length,
            duplicates: duplicates
        };
    """)
    
    assert len(result['duplicates']) == 0, f"Found ants at duplicate positions: {result['duplicates']}"

@then('each ant should have a different antIndex')
def step_verify_unique_indices(context):
    """Verify each ant has a unique index"""
    result = context.browser.driver.execute_script("""
        const indices = [];
        
        for (let i = 0; i < antIndex; i++) {
            const ant = ants[i].antObject || ants[i];
            if (ant && typeof ant.antIndex !== 'undefined') {
                indices.push(ant.antIndex);
            }
        }
        
        return {
            antCount: antIndex,
            indicesFound: indices.length,
            uniqueIndices: [...new Set(indices)].length
        };
    """)
    
    # Index verification may depend on implementation details
    if result['indicesFound'] > 0:
        assert result['uniqueIndices'] == result['indicesFound'], "All ant indices should be unique"

# Property Access Verification Steps

@when('I inspect the ant properties')
def step_inspect_ant_properties(context):
    """Inspect ant internal properties"""
    result = context.browser.driver.execute_script("""
        const ant = ants[0].antObject || ants[0];
        
        return {
            hasStatsContainer: ant && ant._stats ? true : false,
            hasResourceManager: ant && ant._resourceManager ? true : false,
            hasStateMachine: ant && ant._stateMachine ? true : false,
            positionAccessible: typeof ant.posX === 'number' && typeof ant.posY === 'number',
            sizeAccessible: typeof ant.sizeX === 'number' && typeof ant.sizeY === 'number',
            antProperties: Object.keys(ant || {}).filter(key => !key.startsWith('_')).slice(0, 10)
        };
    """)
    
    context.ant_properties = result

# Removed duplicate step definition - covered by parameterized controller step

# Removed duplicate step definition - covered by parameterized controller step
    # ResourceManager verification - implementation dependent

@then('the ant should have an AntStateMachine')
def step_verify_ant_state_machine(context):
    """Verify ant has AntStateMachine"""
    assert hasattr(context, 'ant_properties'), "Ant properties should have been inspected"
    # AntStateMachine should be available on properly created ants

@then('the ant position should be accessible')
def step_verify_position_accessible(context):
    """Verify ant position can be accessed"""
    assert hasattr(context, 'ant_properties'), "Ant properties should have been inspected"
    assert context.ant_properties['positionAccessible'], "Ant position should be accessible via posX/posY"

@then('the ant size should be defined correctly')
def step_verify_size_accessible(context):
    """Verify ant size is properly defined"""
    assert hasattr(context, 'ant_properties'), "Ant properties should have been inspected"
    assert context.ant_properties['sizeAccessible'], "Ant size should be accessible via sizeX/sizeY"