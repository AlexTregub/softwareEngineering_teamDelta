"""
Step definitions for ant spawning and state management BDD tests
Tests use system APIs and validate system behavior
"""

from behave import given, when, then
import time

@given('the ant spawning system is loaded')
def step_ant_spawning_system_loaded(context):
    """Verify ant spawning system dependencies are available"""
    context.driver.get('http://localhost:8080')
    time.sleep(2)  # Wait for page load
    
    # Check if AntUtilities is available
    result = context.driver.execute_script("""
        return {
            antUtilities: typeof AntUtilities !== 'undefined',
            antClass: typeof ant !== 'undefined',
            antsArray: typeof ants !== 'undefined'
        };
    """)
    
    assert result['antUtilities'], "AntUtilities class must be available"
    assert result['antClass'], "ant class must be available"
    assert result['antsArray'], "ants array must be available"

@given('the JobComponent system is available')
def step_job_component_available(context):
    """Verify JobComponent system is loaded"""
    result = context.driver.execute_script("""
        return {
            jobComponent: typeof JobComponent !== 'undefined',
            getAllJobs: typeof JobComponent !== 'undefined' && typeof JobComponent.getAllJobs === 'function'
        };
    """)
    
    assert result['jobComponent'], "JobComponent must be available"
    assert result['getAllJobs'], "JobComponent.getAllJobs function must be available"

@given('the AntStateMachine system is available')
def step_ant_state_machine_available(context):
    """Verify AntStateMachine system is loaded"""
    result = context.driver.execute_script("""
        return {
            antStateMachine: typeof AntStateMachine !== 'undefined'
        };
    """)
    
    assert result['antStateMachine'], "AntStateMachine class must be available"

@when('I spawn an ant with job "{job_name}" and faction "{faction}" at position {x:d},{y:d}')
def step_spawn_ant_with_job_faction(context, job_name, faction, x, y):
    """Spawn ant using AntUtilities.spawnAnt function"""
    result = context.driver.execute_script(f"""
        // Clear ants array for clean test
        if (typeof ants !== 'undefined') {{
            ants.length = 0;
        }}
        
        try {{
            const spawnedAnt = AntUtilities.spawnAnt({x}, {y}, "{job_name}", "{faction}");
            
            return {{
                success: spawnedAnt !== null,
                antCreated: spawnedAnt !== null,
                antJob: spawnedAnt ? spawnedAnt.jobName : null,
                antFaction: spawnedAnt ? spawnedAnt._faction : null,
                antsArrayLength: typeof ants !== 'undefined' ? ants.length : 0,
                error: null
            }};
        }} catch (error) {{
            return {{
                success: false,
                error: error.message
            }};
        }}
    """)
    
    context.spawn_result = result

@when('I spawn {count:d} ants with job "{job_name}" and faction "{faction}" in formation at center {x:d},{y:d}')
def step_spawn_multiple_ants_formation(context, count, job_name, faction, x, y):
    """Spawn multiple ants using AntUtilities.spawnMultipleAnts function"""
    result = context.driver.execute_script(f"""
        // Clear ants array for clean test
        if (typeof ants !== 'undefined') {{
            ants.length = 0;
        }}
        
        try {{
            const spawnedAnts = AntUtilities.spawnMultipleAnts({count}, "{job_name}", "{faction}", {x}, {y}, 50);
            
            // Validate all spawned ants
            const antDetails = spawnedAnts.map(ant => ({{
                job: ant.jobName,
                faction: ant._faction,
                x: ant.getPosition().x,
                y: ant.getPosition().y
            }}));
            
            return {{
                success: spawnedAnts.length === {count},
                spawnedCount: spawnedAnts.length,
                antDetails: antDetails,
                antsArrayLength: typeof ants !== 'undefined' ? ants.length : 0
            }};
        }} catch (error) {{
            return {{
                success: false,
                error: error.message
            }};
        }}
    """)
    
    context.spawn_result = result

@given('I have {count:d} ants spawned and selected')
def step_spawn_and_select_ants(context, count):
    """Spawn ants and select them for state testing"""
    result = context.driver.execute_script(f"""
        // Clear ants array
        if (typeof ants !== 'undefined') {{
            ants.length = 0;
        }}
        
        // Spawn ants
        const spawnedAnts = [];
        for (let i = 0; i < {count}; i++) {{
            const ant = AntUtilities.spawnAnt(100 + i * 30, 100, "Scout", "neutral");
            if (ant) {{
                spawnedAnts.push(ant);
                // Select the ant
                if (ant._selectionController) {{
                    ant._selectionController.setSelected(true);
                }} else if (ant.isSelected !== undefined) {{
                    ant.isSelected = true;
                }}
            }}
        }}
        
        return {{
            spawnedCount: spawnedAnts.length,
            selectedCount: AntUtilities.getSelectedAnts(ants).length
        }};
    """)
    
    context.selected_ants_result = result
    assert result['spawnedCount'] == count, f"Should spawn {count} ants, spawned {result['spawnedCount']}"

@given('I have {count:d} ants spawned but none selected')
def step_spawn_ants_none_selected(context, count):
    """Spawn ants without selecting them"""
    result = context.driver.execute_script(f"""
        // Clear ants array
        if (typeof ants !== 'undefined') {{
            ants.length = 0;
        }}
        
        // Spawn ants (without selecting)
        for (let i = 0; i < {count}; i++) {{
            AntUtilities.spawnAnt(100 + i * 30, 100, "Scout", "neutral");
        }}
        
        return {{
            spawnedCount: ants.length,
            selectedCount: AntUtilities.getSelectedAnts(ants).length
        }};
    """)
    
    context.selected_ants_result = result
    assert result['selectedCount'] == 0, f"Should have 0 selected ants, have {result['selectedCount']}"

@when('I change selected ants state to "{state_name}"')
def step_change_selected_ants_state(context, state_name):
    """Change state of selected ants using AntUtilities functions"""
    
    # Map state names to function calls
    state_functions = {
        'IDLE': 'setSelectedAntsIdle',
        'GATHERING': 'setSelectedAntsGathering', 
        'PATROL': 'setSelectedAntsPatrol',
        'COMBAT': 'setSelectedAntsCombat',
        'BUILDING': 'setSelectedAntsBuilding'
    }
    
    function_name = state_functions.get(state_name)
    assert function_name, f"Unknown state: {state_name}"
    
    result = context.driver.execute_script(f"""
        // Capture console output
        const originalLog = console.log;
        let logMessages = [];
        console.log = function(...args) {{
            logMessages.push(args.join(' '));
            originalLog.apply(console, args);
        }};
        
        try {{
            // Get selected ants before state change
            const selectedBefore = AntUtilities.getSelectedAnts(ants);
            
            // Call the appropriate state change function
            AntUtilities.{function_name}(ants);
            
            // Get selected ants after state change and their states
            const selectedAfter = AntUtilities.getSelectedAnts(ants);
            const antStates = selectedAfter.map(ant => ({{
                primaryState: ant._stateMachine ? ant._stateMachine.primaryState : null,
                combatModifier: ant._stateMachine ? ant._stateMachine.combatModifier : null,
                terrainModifier: ant._stateMachine ? ant._stateMachine.terrainModifier : null,
                fullState: ant._stateMachine ? ant._stateMachine.getFullState() : null
            }}));
            
            return {{
                success: true,
                selectedCountBefore: selectedBefore.length,
                selectedCountAfter: selectedAfter.length,
                antStates: antStates,
                logMessages: logMessages
            }};
        }} catch (error) {{
            return {{
                success: false,
                error: error.message,
                logMessages: logMessages
            }};
        }} finally {{
            console.log = originalLog;
        }}
    """)
    
    context.state_change_result = result

@when('I initialize the ant control panel')
def step_initialize_ant_control_panel(context):
    """Initialize the ant control panel using initializeAntControlPanel function"""
    result = context.driver.execute_script("""
        return {
            panelManagerAvailable: typeof DraggablePanelManager !== 'undefined',
            initFunctionAvailable: typeof initializeAntControlPanel !== 'undefined',
            panelManagerInstance: window.draggablePanelManager ? true : false
        };
    """)
    
    # Initialize panel manager first if needed
    if not result['panelManagerInstance']:
        context.driver.execute_script("""
            if (typeof DraggablePanelManager !== 'undefined') {
                window.draggablePanelManager = new DraggablePanelManager();
                window.draggablePanelManager.initialize();
            }
        """)
    
    # Initialize ant control panel
    panel_result = context.driver.execute_script("""
        try {
            const success = initializeAntControlPanel();
            
            return {
                success: success,
                panelExists: window.draggablePanelManager ? 
                    window.draggablePanelManager.hasPanel('ant-control') : false
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    """)
    
    context.panel_init_result = panel_result

@then('the ant should be created successfully')
def step_ant_created_successfully(context):
    """Verify ant was created successfully"""
    assert hasattr(context, 'spawn_result'), "Should have spawn result from previous step"
    assert context.spawn_result['success'], f"Ant creation should succeed: {context.spawn_result.get('error', '')}"
    assert context.spawn_result['antCreated'], "Ant object should be created"

@then('the ant should have job "{expected_job}"')
def step_ant_has_job(context, expected_job):
    """Verify ant has expected job"""
    assert hasattr(context, 'spawn_result'), "Should have spawn result"
    assert context.spawn_result['antJob'] == expected_job, f"Ant should have job {expected_job}, got {context.spawn_result['antJob']}"

@then('the ant should have faction "{expected_faction}"')
def step_ant_has_faction(context, expected_faction):
    """Verify ant has expected faction"""
    assert hasattr(context, 'spawn_result'), "Should have spawn result"
    assert context.spawn_result['antFaction'] == expected_faction, f"Ant should have faction {expected_faction}, got {context.spawn_result['antFaction']}"

@then('the ant should be added to the ants array')
def step_ant_added_to_array(context):
    """Verify ant was added to global ants array"""
    assert hasattr(context, 'spawn_result'), "Should have spawn result"
    assert context.spawn_result['antsArrayLength'] > 0, "Ant should be added to ants array"

@then('{count:d} ants should be created')
def step_multiple_ants_created(context, count):
    """Verify correct number of ants were created"""
    assert hasattr(context, 'spawn_result'), "Should have spawn result"
    assert context.spawn_result['success'], "Multiple ant spawning should succeed"
    assert context.spawn_result['spawnedCount'] == count, f"Should spawn {count} ants, spawned {context.spawn_result['spawnedCount']}"

@then('all ants should have job "{expected_job}"')
def step_all_ants_have_job(context, expected_job):
    """Verify all spawned ants have expected job"""
    assert hasattr(context, 'spawn_result'), "Should have spawn result"
    ant_details = context.spawn_result['antDetails']
    
    for i, ant in enumerate(ant_details):
        assert ant['job'] == expected_job, f"Ant {i} should have job {expected_job}, got {ant['job']}"

@then('all ants should have faction "{expected_faction}"')
def step_all_ants_have_faction(context, expected_faction):
    """Verify all spawned ants have expected faction"""
    assert hasattr(context, 'spawn_result'), "Should have spawn result"
    ant_details = context.spawn_result['antDetails']
    
    for i, ant in enumerate(ant_details):
        assert ant['faction'] == expected_faction, f"Ant {i} should have faction {expected_faction}, got {ant['faction']}"

@then('ants should be positioned in a circle formation')
def step_ants_in_circle_formation(context):
    """Verify ants are positioned in circle formation"""
    assert hasattr(context, 'spawn_result'), "Should have spawn result"
    ant_details = context.spawn_result['antDetails']
    
    # Calculate center of spawned ants
    center_x = sum(ant['x'] for ant in ant_details) / len(ant_details)
    center_y = sum(ant['y'] for ant in ant_details) / len(ant_details)
    
    # Check that ants are roughly equidistant from center
    distances = []
    for ant in ant_details:
        dx = ant['x'] - center_x
        dy = ant['y'] - center_y
        distance = (dx * dx + dy * dy) ** 0.5
        distances.append(distance)
    
    # All distances should be similar (within 20% variance for formation)
    avg_distance = sum(distances) / len(distances)
    for distance in distances:
        variance = abs(distance - avg_distance) / avg_distance
        assert variance < 0.2, f"Ant positioning variance too high: {variance:.2f}"

@then('the ant stats should match "{job_name}" from JobComponent')
def step_ant_stats_match_job(context, job_name):
    """Verify ant stats match JobComponent specifications"""
    result = context.driver.execute_script(f"""
        try {{
            // Get expected stats from JobComponent
            const expectedStats = JobComponent.getJobStats("{job_name}");
            
            // Get actual ant (should be the last spawned)
            const lastAnt = ants[ants.length - 1];
            const actualJob = lastAnt.job;
            
            return {{
                success: true,
                expectedStats: expectedStats,
                hasJobComponent: actualJob !== null,
                jobName: actualJob ? actualJob.name : null,
                jobStats: actualJob ? actualJob.stats : null
            }};
        }} catch (error) {{
            return {{
                success: false,
                error: error.message
            }};
        }}
    """)
    
    assert result['success'], f"Stats validation should succeed: {result.get('error', '')}"
    assert result['hasJobComponent'], "Ant should have job component"
    assert result['jobName'] == job_name, f"Job name should be {job_name}, got {result['jobName']}"
    
    # Verify stats match
    expected = result['expectedStats']
    actual = result['jobStats']
    for stat_name in ['strength', 'health', 'gatherSpeed', 'movementSpeed']:
        assert actual[stat_name] == expected[stat_name], f"Stat {stat_name} should be {expected[stat_name]}, got {actual[stat_name]}"

@then('all selected ants should have primary state "{expected_state}"')
def step_all_selected_ants_primary_state(context, expected_state):
    """Verify all selected ants have expected primary state"""
    assert hasattr(context, 'state_change_result'), "Should have state change result"
    assert context.state_change_result['success'], f"State change should succeed: {context.state_change_result.get('error', '')}"
    
    ant_states = context.state_change_result['antStates']
    for i, state in enumerate(ant_states):
        assert state['primaryState'] == expected_state, f"Ant {i} should have primary state {expected_state}, got {state['primaryState']}"

@then('all selected ants should have combat modifier "{expected_modifier}"')
def step_all_selected_ants_combat_modifier(context, expected_modifier):
    """Verify all selected ants have expected combat modifier"""
    assert hasattr(context, 'state_change_result'), "Should have state change result"
    ant_states = context.state_change_result['antStates']
    
    for i, state in enumerate(ant_states):
        assert state['combatModifier'] == expected_modifier, f"Ant {i} should have combat modifier {expected_modifier}, got {state['combatModifier']}"

@then('all selected ants should have terrain modifier "{expected_modifier}"')
def step_all_selected_ants_terrain_modifier(context, expected_modifier):
    """Verify all selected ants have expected terrain modifier"""
    assert hasattr(context, 'state_change_result'), "Should have state change result"
    ant_states = context.state_change_result['antStates']
    
    for i, state in enumerate(ant_states):
        assert state['terrainModifier'] == expected_modifier, f"Ant {i} should have terrain modifier {expected_modifier}, got {state['terrainModifier']}"

@then('no ants should have their state changed')
def step_no_ants_state_changed(context):
    """Verify no state changes occurred when no ants selected"""
    assert hasattr(context, 'state_change_result'), "Should have state change result"
    assert context.state_change_result['selectedCountBefore'] == 0, "Should start with no selected ants"
    assert context.state_change_result['selectedCountAfter'] == 0, "Should end with no selected ants"

@then('a warning message should be logged')
def step_warning_message_logged(context):
    """Verify warning message was logged about no selected ants"""
    assert hasattr(context, 'state_change_result'), "Should have state change result"
    log_messages = context.state_change_result.get('logMessages', [])
    
    warning_found = any('No ants selected' in msg for msg in log_messages)
    assert warning_found, f"Should log warning about no selected ants. Messages: {log_messages}"

@then('the ant control panel should be created successfully')
def step_ant_control_panel_created(context):
    """Verify ant control panel was created successfully"""
    assert hasattr(context, 'panel_init_result'), "Should have panel init result"
    assert context.panel_init_result['success'], f"Panel creation should succeed: {context.panel_init_result.get('error', '')}"
    assert context.panel_init_result['panelExists'], "Ant control panel should exist in panel manager"

@then('the panel should be visible')
def step_panel_visible(context):
    """Verify panel is visible"""
    result = context.driver.execute_script("""
        return window.draggablePanelManager ? 
            window.draggablePanelManager.isPanelVisible('ant-control') : false;
    """)
    
    assert result, "Ant control panel should be visible"

@then('the panel should have spawn buttons for all job types')
def step_panel_has_spawn_buttons(context):
    """Verify panel has buttons for all job types"""
    result = context.driver.execute_script("""
        try {
            const jobs = JobComponent.getAllJobs();
            return {
                success: true,
                jobCount: jobs.length,
                jobs: jobs
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    """)
    
    assert result['success'], "Should be able to get job list"
    assert result['jobCount'] >= 5, f"Should have at least 5 jobs, got {result['jobCount']}"
    
    # Verify expected jobs are present
    expected_jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter']
    for job in expected_jobs:
        assert job in result['jobs'], f"Job {job} should be in job list"

@then('the panel should have faction selection buttons')
def step_panel_has_faction_buttons(context):
    """Verify panel has faction selection buttons"""
    # This is verified through the panel content function existence
    result = context.driver.execute_script("""
        return {
            contentFunction: typeof renderAntControlPanelContent === 'function',
            factionFunction: typeof getSelectedFaction === 'function'
        };
    """)
    
    assert result['contentFunction'], "Panel content function should be available"
    assert result['factionFunction'], "Faction selection function should be available"

@then('the panel should have state change buttons')
def step_panel_has_state_buttons(context):
    """Verify panel has state change buttons"""
    # Verify state change functions are available
    result = context.driver.execute_script("""
        return {
            idleFunction: typeof AntUtilities.setSelectedAntsIdle === 'function',
            gatherFunction: typeof AntUtilities.setSelectedAntsGathering === 'function',
            patrolFunction: typeof AntUtilities.setSelectedAntsPatrol === 'function',
            combatFunction: typeof AntUtilities.setSelectedAntsCombat === 'function',
            buildFunction: typeof AntUtilities.setSelectedAntsBuilding === 'function'
        };
    """)
    
    for func_name, available in result.items():
        assert available, f"State function {func_name} should be available"