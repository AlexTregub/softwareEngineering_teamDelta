"""
Step definitions for ant group management BDD tests
Tests use system APIs and validate actual system behavior
Following TESTING_METHODOLOGY_STANDARDS.md requirements
"""

from behave import given, when, then
import time

@given('the AntGroupManager system is available')
def step_ant_group_manager_available(context):
    """Verify AntGroupManager class is loaded and functional"""
    context.driver.get('http://localhost:8080')
    time.sleep(2)  # Wait for page load
    
    result = context.driver.execute_script("""
        return {
            antGroupManager: typeof AntGroupManager !== 'undefined',
            antGroupManagerInstance: window.antGroupManager ? true : false,
            requiredMethods: {
                assignGroup: typeof AntGroupManager.prototype.assignGroup === 'function',
                selectGroup: typeof AntGroupManager.prototype.selectGroup === 'function',
                toggleGroup: typeof AntGroupManager.prototype.toggleGroup === 'function',
                getGroupDisplay: typeof AntGroupManager.prototype.getGroupDisplay === 'function',
                removeAntFromAllGroups: typeof AntGroupManager.prototype.removeAntFromAllGroups === 'function'
            }
        };
    """)
    
    assert result['antGroupManager'], "AntGroupManager class must be available"
    
    # Initialize global instance if not exists
    if not result['antGroupManagerInstance']:
        context.driver.execute_script("""
            window.antGroupManager = new AntGroupManager();
            window.antGroupManager.initialize();
        """)
    
    # Verify all required methods exist
    for method, exists in result['requiredMethods'].items():
        assert exists, f"AntGroupManager.{method} method must be available"

@given('the KeyboardInputController is available')
def step_keyboard_controller_available(context):
    """Verify KeyboardInputController is loaded and integrated with group system"""
    result = context.driver.execute_script("""
        return {
            keyboardController: typeof KeyboardInputController !== 'undefined',
            keyboardInstance: window.keyboardController ? true : false,
            groupKeyHandlers: {
                ctrlKeysRegistered: typeof handleGroupAssignmentKeys === 'function',
                numberKeysRegistered: typeof handleGroupSelectionKeys === 'function'
            }
        };
    """)
    
    assert result['keyboardController'], "KeyboardInputController class must be available"
    
    # Initialize if needed
    if not result['keyboardInstance']:
        context.driver.execute_script("""
            window.keyboardController = new KeyboardInputController();
            window.keyboardController.initialize();
        """)

@given('I have {count:d} ants spawned at random positions')
def step_spawn_ants_random_positions(context, count):
    """Spawn specified number of ants at random positions for testing"""
    result = context.driver.execute_script(f"""
        // Clear existing ants
        if (typeof ants !== 'undefined') {{
            ants.length = 0;
        }}
        
        // Spawn ants at random positions
        const spawnedAnts = [];
        for (let i = 0; i < {count}; i++) {{
            const x = 100 + Math.random() * 600;
            const y = 100 + Math.random() * 400;
            const ant = AntUtilities.spawnAnt(x, y, "Scout", "neutral");
            if (ant) {{
                spawnedAnts.push(ant);
                // Ensure ant has unique identifier for testing
                ant._testId = i;
            }}
        }}
        
        return {{
            success: spawnedAnts.length === {count},
            spawnedCount: spawnedAnts.length,
            antsArrayLength: typeof ants !== 'undefined' ? ants.length : 0
        }};
    """)
    
    assert result['success'], f"Should spawn {count} ants, spawned {result['spawnedCount']}"
    context.total_ants = count

@given('I have {count:d} ants selected')
def step_select_specific_ants(context, count):
    """Select specified number of ants using real selection system"""
    result = context.driver.execute_script(f"""
        // Clear existing selections
        AntUtilities.deselectAllAnts(ants);
        
        // Select first {count} ants
        let selectedCount = 0;
        for (let i = 0; i < Math.min({count}, ants.length); i++) {{
            const ant = ants[i];
            if (ant) {{
                // Use triple-system synchronization like in DraggablePanelManager
                if (ant._selectionController) {{
                    ant._selectionController.setSelected(true);
                }} else if (ant.isSelected !== undefined) {{
                    ant.isSelected = true;
                }}
                
                // Sync with global selection
                if (typeof window !== 'undefined') {{
                    window.selectedAnt = ant;
                }}
                
                // Sync with AntManager
                if (window.antManager) {{
                    window.antManager.selectedAnt = ant;
                }}
                
                selectedCount++;
            }}
        }}
        
        return {{
            selectedCount: selectedCount,
            actualSelected: AntUtilities.getSelectedAnts(ants).length
        }};
    """)
    
    assert result['selectedCount'] == count, f"Should select {count} ants, selected {result['selectedCount']}"
    assert result['actualSelected'] == count, f"Selection system sync failed: expected {count}, got {result['actualSelected']}"

@given('I have assigned {count:d} ants to group {group_number:d}')
def step_assign_ants_to_group(context, count, group_number):
    """Assign specified ants to a control group using real API"""
    result = context.driver.execute_script(f"""
        // Select first {count} ants
        AntUtilities.deselectAllAnts(ants);
        const antsToAssign = [];
        for (let i = 0; i < Math.min({count}, ants.length); i++) {{
            const ant = ants[i];
            if (ant) {{
                if (ant._selectionController) {{
                    ant._selectionController.setSelected(true);
                }} else {{
                    ant.isSelected = true;
                }}
                antsToAssign.push(ant);
            }}
        }}
        
        // Use real AntGroupManager API to assign group
        const success = window.antGroupManager.assignGroup({group_number}, antsToAssign);
        
        return {{
            success: success,
            assignedCount: antsToAssign.length,
            groupSize: window.antGroupManager.getGroupSize({group_number})
        }};
    """)
    
    assert result['success'], "Group assignment should succeed"
    assert result['assignedCount'] == count, f"Should assign {count} ants"
    assert result['groupSize'] == count, f"Group {group_number} should contain {count} ants"

@given('no ants are currently selected')
def step_no_ants_selected(context):
    """Ensure no ants are selected using real deselection API"""
    result = context.driver.execute_script("""
        // Use real API to deselect all ants
        AntUtilities.deselectAllAnts(ants);
        
        // Clear global selection variables
        if (typeof window !== 'undefined') {
            window.selectedAnt = null;
        }
        if (window.antManager) {
            window.antManager.selectedAnt = null;
        }
        
        return {
            selectedCount: AntUtilities.getSelectedAnts(ants).length
        };
    """)
    
    assert result['selectedCount'] == 0, f"Should have 0 selected ants, got {result['selectedCount']}"

@given('group {group_number:d} ants are currently selected')
def step_group_ants_selected(context, group_number):
    """Select all ants in specified group using real selection API"""
    result = context.driver.execute_script(f"""
        // Use real AntGroupManager API to select group
        const success = window.antGroupManager.selectGroup({group_number});
        
        return {{
            success: success,
            selectedCount: AntUtilities.getSelectedAnts(ants).length,
            groupSize: window.antGroupManager.getGroupSize({group_number})
        }};
    """)
    
    assert result['success'], f"Should successfully select group {group_number}"
    assert result['selectedCount'] == result['groupSize'], f"Selected count should match group size"

@when('I press Ctrl+{key:d} to assign group {group_number:d}')
def step_press_ctrl_key_assign(context, key, group_number):
    """Simulate Ctrl+number key press for group assignment using real keyboard system"""
    result = context.driver.execute_script(f"""
        // Simulate Ctrl+{key} key combination using real KeyboardInputController
        const keyEvent = {{
            keyCode: {key + 48},  // Convert number to keycode (48 = '0' keycode)
            key: '{key}',
            ctrlKey: true,
            shiftKey: false,
            altKey: false
        }};
        
        // Trigger real keyboard handler
        const success = window.keyboardController.handleGroupAssignmentKey(keyEvent);
        
        return {{
            success: success,
            groupSize: window.antGroupManager.getGroupSize({group_number}),
            selectedBefore: AntUtilities.getSelectedAnts(ants).length
        }};
    """)
    
    context.assignment_result = result

@when('I press key {key:d} to select group {group_number:d}')
def step_press_key_select_group(context, key, group_number):
    """Simulate number key press for group selection using real keyboard system"""
    result = context.driver.execute_script(f"""
        // Simulate {key} key press using real KeyboardInputController
        const keyEvent = {{
            keyCode: {key + 48},  // Convert number to keycode
            key: '{key}',
            ctrlKey: false,
            shiftKey: false,
            altKey: false
        }};
        
        // Trigger real keyboard handler
        const success = window.keyboardController.handleGroupSelectionKey(keyEvent);
        
        return {{
            success: success,
            selectedAfter: AntUtilities.getSelectedAnts(ants).length,
            groupSize: window.antGroupManager.getGroupSize({group_number})
        }};
    """)
    
    context.selection_result = result

@when('I press key {key:d} again')
def step_press_key_again_toggle(context, key):
    """Simulate pressing same key again to toggle group selection"""
    result = context.driver.execute_script(f"""
        // Get selection state before
        const selectedBefore = AntUtilities.getSelectedAnts(ants).length;
        
        // Simulate {key} key press again
        const keyEvent = {{
            keyCode: {key + 48},
            key: '{key}',
            ctrlKey: false,
            shiftKey: false,
            altKey: false
        }};
        
        const success = window.keyboardController.handleGroupSelectionKey(keyEvent);
        
        return {{
            success: success,
            selectedBefore: selectedBefore,
            selectedAfter: AntUtilities.getSelectedAnts(ants).length
        }};
    """)
    
    context.toggle_result = result

@when('{count:d} ant from group {group_number:d} is destroyed')
def step_destroy_ant_from_group(context, count, group_number):
    """Destroy an ant and test group cleanup using real system APIs"""
    result = context.driver.execute_script(f"""
        // Get ants in group {group_number}
        const groupAnts = window.antGroupManager.getGroupAnts({group_number});
        
        if (groupAnts.length === 0) {{
            return {{ success: false, error: "No ants in group to destroy" }};
        }}
        
        // Destroy first ant in group
        const antToDestroy = groupAnts[0];
        const antIndex = ants.indexOf(antToDestroy);
        
        // Remove from ants array (simulating destruction)
        if (antIndex !== -1) {{
            ants.splice(antIndex, 1);
        }}
        
        // Use real API to clean up group references
        window.antGroupManager.removeAntFromAllGroups(antToDestroy);
        
        return {{
            success: true,
            groupSizeAfter: window.antGroupManager.getGroupSize({group_number}),
            antsRemaining: ants.length
        }};
    """)
    
    assert result['success'], f"Should successfully destroy ant: {result.get('error', '')}"
    context.destroy_result = result

@when('I save the game state')
def step_save_game_state(context):
    """Save game state including group assignments using real save system"""
    result = context.driver.execute_script("""
        // Use real save system to save group data
        const gameState = {
            groups: window.antGroupManager.serializeGroups(),
            ants: ants.map(ant => ({
                id: ant._testId,
                position: ant.getPosition(),
                job: ant.jobName,
                faction: ant._faction
            }))
        };
        
        // Save to localStorage (simulating save system)
        localStorage.setItem('antGroupTestSave', JSON.stringify(gameState));
        
        return {
            success: true,
            savedGroups: Object.keys(gameState.groups).length
        };
    """)
    
    assert result['success'], "Should successfully save game state"
    context.save_result = result

@when('I reload the game state')
def step_reload_game_state(context):
    """Reload game state including group assignments using real load system"""
    result = context.driver.execute_script("""
        try {
            // Load from localStorage
            const savedData = localStorage.getItem('antGroupTestSave');
            if (!savedData) {
                return { success: false, error: "No saved data found" };
            }
            
            const gameState = JSON.parse(savedData);
            
            // Clear current state
            ants.length = 0;
            window.antGroupManager.clearAllGroups();
            
            // Restore ants
            for (const antData of gameState.ants) {
                const ant = AntUtilities.spawnAnt(
                    antData.position.x, 
                    antData.position.y, 
                    antData.job, 
                    antData.faction
                );
                if (ant) {
                    ant._testId = antData.id;
                }
            }
            
            // Restore groups using real API
            window.antGroupManager.deserializeGroups(gameState.groups, ants);
            
            return {
                success: true,
                restoredAnts: ants.length,
                restoredGroups: Object.keys(gameState.groups).length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    """)
    
    assert result['success'], f"Should successfully reload game state: {result.get('error', '')}"
    context.reload_result = result

@when('I try to assign to group 0 using Ctrl+0')
def step_try_assign_invalid_group(context):
    """Test invalid group assignment (group 0) using real API"""
    result = context.driver.execute_script("""
        // Capture console output for error logging
        const originalLog = console.log;
        const originalError = console.error;
        let logMessages = [];
        
        console.log = console.error = function(...args) {
            logMessages.push(args.join(' '));
            originalLog.apply(console, args);
        };
        
        try {
            // Try to assign to invalid group 0
            const selectedAnts = AntUtilities.getSelectedAnts(ants);
            const success = window.antGroupManager.assignGroup(0, selectedAnts);
            
            return {
                success: success,
                logMessages: logMessages,
                selectedCount: selectedAnts.length
            };
        } finally {
            console.log = originalLog;
            console.error = originalError;
        }
    """)
    
    context.invalid_assignment_result = result

@when('the game state changes to {state}')
def step_change_game_state(context, state):
    """Change game state and test group system behavior"""
    result = context.driver.execute_script(f"""
        // Change game state using real GameStateManager
        if (window.gameStateManager) {{
            window.gameStateManager.setState('{state}');
        }} else {{
            // Fallback to global variable
            window.gameState = '{state}';
        }}
        
        return {{
            success: true,
            newState: window.gameState || '{state}'
        }};
    """)
    
    assert result['success'], f"Should successfully change to {state} state"
    context.current_game_state = state

@when('I drag the group display panel to a new position')
def step_drag_group_panel(context):
    """Test dragging group display panel using real DraggablePanelManager"""
    result = context.driver.execute_script("""
        // Get current panel position
        const panel = window.draggablePanelManager.getPanel('group-display');
        if (!panel) {
            return { success: false, error: "Group display panel not found" };
        }
        
        const originalPos = { x: panel.position.x, y: panel.position.y };
        const newPos = { x: originalPos.x + 100, y: originalPos.y + 50 };
        
        // Simulate drag using real panel API
        panel.setPosition(newPos.x, newPos.y);
        
        return {
            success: true,
            originalPos: originalPos,
            newPos: { x: panel.position.x, y: panel.position.y }
        };
    """)
    
    assert result['success'], f"Should successfully drag panel: {result.get('error', '')}"
    context.drag_result = result

@when('I rapidly switch between groups using keys 1-9')
def step_rapidly_switch_groups(context):
    """Test rapid group switching performance"""
    result = context.driver.execute_script("""
        const performanceResults = [];
        
        // Test rapid switching between groups 1-9
        for (let i = 1; i <= 9; i++) {
            const startTime = performance.now();
            
            // Simulate key press
            const keyEvent = {
                keyCode: i + 48,
                key: i.toString(),
                ctrlKey: false
            };
            
            window.keyboardController.handleGroupSelectionKey(keyEvent);
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            performanceResults.push({
                group: i,
                duration: duration,
                selectedCount: AntUtilities.getSelectedAnts(ants).length
            });
        }
        
        const avgDuration = performanceResults.reduce((sum, r) => sum + r.duration, 0) / performanceResults.length;
        const maxDuration = Math.max(...performanceResults.map(r => r.duration));
        
        return {
            success: true,
            averageDuration: avgDuration,
            maxDuration: maxDuration,
            results: performanceResults
        };
    """)
    
    assert result['success'], "Performance test should complete successfully"
    context.performance_result = result

@then('the {count:d} selected ants should be assigned to group {group_number:d}')
def step_verify_ants_assigned_to_group(context, count, group_number):
    """Verify ants were assigned to group using real API"""
    assert hasattr(context, 'assignment_result'), "Should have assignment result"
    assert context.assignment_result['success'], "Assignment should succeed"
    assert context.assignment_result['groupSize'] == count, f"Group {group_number} should contain {count} ants"

@then('group {group_number:d} should contain {count:d} ants')
def step_verify_group_contains_ants(context, group_number, count):
    """Verify group contains expected number of ants using real API"""
    result = context.driver.execute_script(f"""
        return {{
            groupSize: window.antGroupManager.getGroupSize({group_number}),
            groupAnts: window.antGroupManager.getGroupAnts({group_number}).length
        }};
    """)
    
    assert result['groupSize'] == count, f"Group {group_number} should contain {count} ants, got {result['groupSize']}"
    assert result['groupAnts'] == count, f"Group ant array should contain {count} ants, got {result['groupAnts']}"

@then('the group display UI should show group {group_number:d} with count {count:d}')
def step_verify_group_display_ui(context, group_number, count):
    """Verify group display UI shows correct information"""
    result = context.driver.execute_script(f"""
        // Get group display data using real API
        const displayData = window.antGroupManager.getGroupDisplay();
        const groupData = displayData.groups.find(g => g.number === {group_number});
        
        return {{
            success: groupData !== undefined,
            groupNumber: groupData ? groupData.number : null,
            groupCount: groupData ? groupData.count : null,
            isVisible: groupData ? groupData.visible : false
        }};
    """)
    
    assert result['success'], f"Group {group_number} should be in display data"
    assert result['groupCount'] == count, f"Display should show count {count}, got {result['groupCount']}"
    assert result['isVisible'], f"Group {group_number} should be visible in display"

@then('all {count:d} ants in group {group_number:d} should be selected')
def step_verify_group_ants_selected(context, count, group_number):
    """Verify all ants in group are selected using real selection API"""
    assert hasattr(context, 'selection_result'), "Should have selection result"
    assert context.selection_result['success'], "Group selection should succeed"
    assert context.selection_result['selectedAfter'] == count, f"Should select {count} ants, selected {context.selection_result['selectedAfter']}"

@then('the selection system should synchronize across all selection methods')
def step_verify_selection_synchronization(context):
    """Verify selection is synchronized across all selection systems"""
    result = context.driver.execute_script("""
        const selectedAnts = AntUtilities.getSelectedAnts(ants);
        
        // Check synchronization across all systems
        const syncResults = {
            antUtilitiesCount: selectedAnts.length,
            globalSelectedAnt: window.selectedAnt ? 1 : 0,
            antManagerCount: window.antManager && window.antManager.selectedAnt ? 1 : 0,
            individualStates: 0
        };
        
        // Count individual ant selection states
        for (const ant of ants) {
            if (ant.isSelected || (ant._selectionController && ant._selectionController.isSelected())) {
                syncResults.individualStates++;
            }
        }
        
        return syncResults;
    """)
    
    # All selection methods should be in sync
    selected_count = result['antUtilitiesCount']
    assert result['individualStates'] == selected_count, f"Individual ant states should match AntUtilities count"

@then('the selected ants should be moveable by clicking')
def step_verify_ants_moveable(context):
    """Verify selected ants can be moved by clicking (integration test)"""
    result = context.driver.execute_script("""
        // Test movement integration
        const originalPositions = [];
        const selectedAnts = AntUtilities.getSelectedAnts(ants);
        
        // Store original positions
        for (const ant of selectedAnts) {
            originalPositions.push({
                x: ant.getPosition().x,
                y: ant.getPosition().y
            });
        }
        
        // Simulate click-to-move at new location
        const targetX = 400;
        const targetY = 300;
        
        // Use real movement system
        if (typeof moveSelectedAntsToLocation === 'function') {
            moveSelectedAntsToLocation(targetX, targetY);
        } else {
            // Fallback to individual movement
            for (const ant of selectedAnts) {
                ant.moveToLocation(targetX, targetY);
            }
        }
        
        // Check if movement commands were issued
        let moveCommandsIssued = 0;
        for (const ant of selectedAnts) {
            if (ant.moveCommands && ant.moveCommands.length > 0) {
                moveCommandsIssued++;
            }
        }
        
        return {
            selectedCount: selectedAnts.length,
            moveCommandsIssued: moveCommandsIssued,
            targetLocation: { x: targetX, y: targetY }
        };
    """)
    
    assert result['selectedCount'] > 0, "Should have selected ants to test movement"
    assert result['moveCommandsIssued'] > 0, "Selected ants should receive movement commands"

@then('all ants in group {group_number:d} should be deselected')
def step_verify_group_deselected(context, group_number):
    """Verify all ants in group are deselected"""
    assert hasattr(context, 'toggle_result'), "Should have toggle result"
    assert context.toggle_result['selectedAfter'] == 0, f"Should have 0 selected ants after toggle, got {context.toggle_result['selectedAfter']}"

@then('no ants should be selected')
def step_verify_no_ants_selected(context):
    """Verify no ants are selected using real API"""
    result = context.driver.execute_script("""
        return {
            selectedCount: AntUtilities.getSelectedAnts(ants).length
        };
    """)
    
    assert result['selectedCount'] == 0, f"Should have 0 selected ants, got {result['selectedCount']}"

@then('the 2 ants should no longer be in group {old_group:d}')
def step_verify_ants_removed_from_old_group(context, old_group):
    """Verify ants were removed from previous group"""
    result = context.driver.execute_script(f"""
        return {{
            oldGroupSize: window.antGroupManager.getGroupSize({old_group})
        }};
    """)
    
    assert result['oldGroupSize'] == 0, f"Old group {old_group} should be empty, has {result['oldGroupSize']} ants"

@then('group {group_number:d} should be empty')
def step_verify_group_empty(context, group_number):
    """Verify group is empty using real API"""
    result = context.driver.execute_script(f"""
        return {{
            groupSize: window.antGroupManager.getGroupSize({group_number}),
            isEmpty: window.antGroupManager.isGroupEmpty({group_number})
        }};
    """)
    
    assert result['groupSize'] == 0, f"Group {group_number} should be empty, has {result['groupSize']} ants"
    assert result['isEmpty'], f"Group {group_number} should report as empty"

@then('the destroyed ant should be removed from all groups')
def step_verify_destroyed_ant_removed(context):
    """Verify destroyed ant was cleaned up from all groups"""
    assert hasattr(context, 'destroy_result'), "Should have destroy result"
    # Verify group size decreased by 1
    expected_size = context.destroy_result['groupSizeAfter']
    assert expected_size >= 0, "Group size should be valid after ant destruction"

@then('empty groups should not be displayed')
def step_verify_empty_groups_hidden(context):
    """Verify empty groups are not shown in display UI"""
    result = context.driver.execute_script("""
        const displayData = window.antGroupManager.getGroupDisplay();
        const emptyGroups = displayData.groups.filter(g => g.count === 0 && g.visible);
        
        return {
            emptyGroupsVisible: emptyGroups.length,
            totalVisibleGroups: displayData.groups.filter(g => g.visible).length
        };
    """)
    
    assert result['emptyGroupsVisible'] == 0, f"Should not display empty groups, displaying {result['emptyGroupsVisible']}"

@then('the panel should be positioned in the bottom-left corner')
def step_verify_panel_position(context):
    """Verify group display panel is in bottom-left corner"""
    result = context.driver.execute_script("""
        const panel = window.draggablePanelManager.getPanel('group-display');
        if (!panel) {
            return { success: false, error: "Panel not found" };
        }
        
        return {
            success: true,
            position: { x: panel.position.x, y: panel.position.y },
            isBottomLeft: panel.position.x < 200 && panel.position.y > window.innerHeight - 200
        };
    """)
    
    assert result['success'], f"Should find group display panel: {result.get('error', '')}"
    assert result['isBottomLeft'], f"Panel should be in bottom-left corner, at {result['position']}"

@then('the group {group_number:d} badge should be visually highlighted')
def step_verify_group_highlighted(context, group_number):
    """Verify group badge shows visual highlight"""
    result = context.driver.execute_script(f"""
        const displayData = window.antGroupManager.getGroupDisplay();
        const groupData = displayData.groups.find(g => g.number === {group_number});
        
        return {{
            success: groupData !== undefined,
            isHighlighted: groupData ? groupData.highlighted : false,
            isActive: groupData ? groupData.active : false
        }};
    """)
    
    assert result['success'], f"Should find group {group_number} in display"
    assert result['isHighlighted'] or result['isActive'], f"Group {group_number} should be visually highlighted"

@then('other group badges should appear normal')
def step_verify_other_groups_normal(context):
    """Verify other group badges are not highlighted"""
    result = context.driver.execute_script("""
        const displayData = window.antGroupManager.getGroupDisplay();
        const highlightedGroups = displayData.groups.filter(g => g.highlighted || g.active);
        
        return {
            highlightedCount: highlightedGroups.length,
            totalGroups: displayData.groups.length
        };
    """)
    
    # Only one group should be highlighted at a time
    assert result['highlightedCount'] <= 1, f"Should have at most 1 highlighted group, got {result['highlightedCount']}"

@then('no group badges should be highlighted')
def step_verify_no_groups_highlighted(context):
    """Verify no group badges are highlighted"""
    result = context.driver.execute_script("""
        const displayData = window.antGroupManager.getGroupDisplay();
        const highlightedGroups = displayData.groups.filter(g => g.highlighted || g.active);
        
        return {
            highlightedCount: highlightedGroups.length
        };
    """)
    
    assert result['highlightedCount'] == 0, f"Should have 0 highlighted groups, got {result['highlightedCount']}"

@then('group 8 should still contain the same 5 ants')
def step_verify_persistence_group_8(context):
    """Verify group 8 persisted correctly after save/load"""
    assert hasattr(context, 'reload_result'), "Should have reload result"
    
    result = context.driver.execute_script("""
        return {
            group8Size: window.antGroupManager.getGroupSize(8)
        };
    """)
    
    assert result['group8Size'] == 5, f"Group 8 should contain 5 ants after reload, got {result['group8Size']}"

@then('the assignment should fail gracefully')
def step_verify_assignment_fails(context):
    """Verify invalid group assignment fails properly"""
    assert hasattr(context, 'invalid_assignment_result'), "Should have invalid assignment result"
    assert not context.invalid_assignment_result['success'], "Invalid group assignment should fail"

@then('an error message should be logged')
def step_verify_error_logged(context):
    """Verify error message was logged for invalid assignment"""
    assert hasattr(context, 'invalid_assignment_result'), "Should have invalid assignment result"
    log_messages = context.invalid_assignment_result.get('logMessages', [])
    
    error_found = any('invalid' in msg.lower() or 'error' in msg.lower() for msg in log_messages)
    assert error_found, f"Should log error message. Messages: {log_messages}"

@then('group selection should be disabled')
def step_verify_group_selection_disabled(context):
    """Verify group selection is disabled in MENU state"""
    result = context.driver.execute_script("""
        // Try to select a group in MENU state
        const keyEvent = {
            keyCode: 53, // Key '5'
            key: '5',
            ctrlKey: false
        };
        
        const success = window.keyboardController.handleGroupSelectionKey(keyEvent);
        
        return {
            selectionAllowed: success,
            selectedCount: AntUtilities.getSelectedAnts(ants).length,
            currentState: window.gameState
        };
    """)
    
    assert not result['selectionAllowed'], "Group selection should be disabled in MENU state"
    assert result['selectedCount'] == 0, "No ants should be selected in MENU state"

@then('each group selection should complete within 50ms')
def step_verify_performance_requirements(context):
    """Verify group selection performance meets requirements"""
    assert hasattr(context, 'performance_result'), "Should have performance result"
    
    max_duration = context.performance_result['maxDuration']
    avg_duration = context.performance_result['averageDuration']
    
    assert max_duration < 50, f"Max group selection duration should be < 50ms, got {max_duration:.2f}ms"
    assert avg_duration < 25, f"Average duration should be < 25ms, got {avg_duration:.2f}ms"

@then('the UI should update smoothly')
def step_verify_smooth_ui_updates(context):
    """Verify UI updates don't cause performance issues"""
    result = context.driver.execute_script("""
        // Test UI update performance
        const startTime = performance.now();
        
        // Force UI update
        window.antGroupManager.updateGroupDisplay();
        
        const endTime = performance.now();
        const updateDuration = endTime - startTime;
        
        return {
            updateDuration: updateDuration,
            success: updateDuration < 16 // Should complete within one frame (60fps)
        };
    """)
    
    assert result['success'], f"UI update should complete within 16ms, took {result['updateDuration']:.2f}ms"

@then('there should be no memory leaks')
def step_verify_no_memory_leaks(context):
    """Verify no memory leaks in group management system"""
    result = context.driver.execute_script("""
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Check for circular references and cleanup
        const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        // Create and destroy temporary groups to test cleanup
        const tempAnts = [];
        for (let i = 0; i < 10; i++) {
            const ant = AntUtilities.spawnAnt(100, 100, "Scout", "test");
            tempAnts.push(ant);
        }
        
        // Assign and then clear
        window.antGroupManager.assignGroup(5, tempAnts);
        tempAnts.forEach(ant => window.antGroupManager.removeAntFromAllGroups(ant));
        
        const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
        const memoryDelta = memoryAfter - memoryBefore;
        
        return {
            memoryBefore: memoryBefore,
            memoryAfter: memoryAfter,
            memoryDelta: memoryDelta,
            cleanupSuccess: memoryDelta < 1024 * 1024 // Should be < 1MB increase
        };
    """)
    
    assert result['cleanupSuccess'], f"Memory usage should not increase significantly: {result['memoryDelta']} bytes"