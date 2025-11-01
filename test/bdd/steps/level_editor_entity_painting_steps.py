"""
Step definitions for Level Editor Entity Painting feature

This module provides reusable Behave steps that control Puppeteer
to test entity painting workflows in the Level Editor.
"""

from behave import given, when, then
import asyncio
import json
import time
from pathlib import Path

# Import puppeteer control functions
from test.bdd.support.puppeteer_controller import (
    ensure_page_ready,
    take_screenshot,
    execute_js,
    click_at_position,
    mouse_drag,
    wait_for_condition
)


# ============================================================================
# GIVEN Steps - Setup preconditions
# ============================================================================

@given('the Level Editor is open')
def step_level_editor_is_open(context):
    """
    Open the Level Editor state
    """
    result = execute_js(context.page, """
        async () => {
            // Navigate to Level Editor
            if (window.GameState) {
                window.GameState.setState('LEVEL_EDITOR');
            } else {
                window.gameState = 'LEVEL_EDITOR';
            }
            
            // Wait for Level Editor to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: !!window.levelEditor,
                state: window.gameState || window.GameState?.currentState
            };
        }
    """)
    
    assert result['success'], "Level Editor failed to initialize"
    assert result['state'] == 'LEVEL_EDITOR', f"Expected LEVEL_EDITOR state, got {result['state']}"
    
    # Take screenshot for verification
    take_screenshot(context.page, 'level_editor_opened', context.scenario_name)
    print(f"✅ Level Editor is open (state: {result['state']})")


@given('the EntitySelectionTool is created')
def step_entity_selection_tool_created(context):
    """
    Create EntitySelectionTool component
    """
    result = execute_js(context.page, """
        () => {
            // Initialize arrays
            window.placedEntities = [];
            window.placedEvents = [];
            
            // Create Entity class mock if needed
            if (typeof window.Entity === 'undefined') {
                window.Entity = class {
                    constructor(x, y, w, h) {
                        this.x = x; this.y = y; this.w = w; this.h = h;
                        this.isSelected = false;
                        this.isBoxHovered = false;
                    }
                    getPosition() { return { x: this.x, y: this.y }; }
                    getSize() { return { x: this.w, y: this.h }; }
                    getWidth() { return this.w; }
                    getHeight() { return this.h; }
                };
            }
            
            // Check if EntitySelectionTool is available
            if (typeof window.EntitySelectionTool === 'undefined') {
                return { success: false, error: 'EntitySelectionTool class not loaded' };
            }
            
            // Create EntitySelectionTool instance
            window.testSelectionTool = new EntitySelectionTool(
                window.placedEntities,
                window.placedEvents,
                'ENTITY'
            );
            
            return { 
                success: true, 
                mode: window.testSelectionTool.getMode(),
                hasArrays: Array.isArray(window.placedEntities) && Array.isArray(window.placedEvents)
            };
        }
    """)
    
    assert result['success'], result.get('error', 'EntitySelectionTool creation failed')
    
    # Store in context for later steps
    context.selection_tool_mode = result['mode']
    
    take_screenshot(context.page, 'selection_tool_created', context.scenario_name)
    print(f"✅ EntitySelectionTool created (mode: {result['mode']})")


@given('the {tool_name} tool is selected')
def step_tool_is_selected(context, tool_name):
    """
    Select a specific tool in the toolbar
    """
    result = execute_js(context.page, f"""
        () => {{
            const toolbar = window.levelEditor?.toolbar;
            if (!toolbar) return {{ success: false, error: 'No toolbar' }};
            
            toolbar.selectTool('{tool_name}');
            
            return {{
                success: true,
                selectedTool: toolbar.selectedTool
            }};
        }}
    """)
    
    assert result['success'], result.get('error', f'Failed to select {tool_name}')
    assert result['selectedTool'] == tool_name, f"Expected {tool_name}, got {result['selectedTool']}"
    
    take_screenshot(context.page, f'tool_{tool_name}_selected', context.scenario_name)
    print(f"✅ {tool_name} tool selected")


@given('multiple entities are placed on the grid')
def step_multiple_entities_placed(context):
    """
    Place multiple entities on the grid for testing
    """
    result = execute_js(context.page, """
        () => {
            // Place 3 entities in a row
            const positions = [
                { x: 100, y: 100 },
                { x: 200, y: 100 },
                { x: 300, y: 100 }
            ];
            
            positions.forEach(pos => {
                const entity = new window.Entity(pos.x, pos.y, 32, 32);
                window.placedEntities.push(entity);
            });
            
            return { 
                count: window.placedEntities.length, 
                positions: window.placedEntities.map(e => ({ x: e.x, y: e.y }))
            };
        }
    """)
    
    assert result['count'] > 0, "No entities were placed"
    
    # Store for later verification
    context.entity_count = result['count']
    context.entity_positions = result['positions']
    
    take_screenshot(context.page, 'entities_placed', context.scenario_name)
    print(f"✅ Placed {result['count']} entities:")
    for i, pos in enumerate(result['positions']):
        print(f"   - Entity {i+1}: ({pos['x']}, {pos['y']})")


# ============================================================================
# WHEN Steps - User actions
# ============================================================================

@when('the user drags a selection box from ({x1:d}, {y1:d}) to ({x2:d}, {y2:d})')
def step_drag_selection_box(context, x1, y1, x2, y2):
    """
    Drag a selection box from (x1, y1) to (x2, y2)
    """
    result = execute_js(context.page, f"""
        () => {{
            const tool = window.testSelectionTool;
            if (!tool) return {{ error: 'Tool not found' }};
            
            // Simulate mouse drag
            tool.handleMousePressed({x1}, {y1});
            tool.handleMouseDragged({x2}, {y2});
            tool.handleMouseReleased({x2}, {y2});
            
            // Count selected entities
            const selectedCount = window.placedEntities.filter(e => e.isSelected === true).length;
            
            return {{ 
                success: true,
                selectedCount,
                totalCount: window.placedEntities.length,
                box: {{ x1: {x1}, y1: {y1}, x2: {x2}, y2: {y2} }}
            }};
        }}
    """)
    
    assert result['success'], result.get('error', 'Selection box drag failed')
    
    # Store selection results
    context.selected_count = result['selectedCount']
    context.total_count = result['totalCount']
    context.selection_box = result['box']
    
    take_screenshot(context.page, 'selection_box_dragged', context.scenario_name)
    print(f"✅ Dragged selection box from ({x1}, {y1}) to ({x2}, {y2})")
    print(f"   Selected: {result['selectedCount']}/{result['totalCount']} entities")


@when('the user drags a selection box over the entities')
def step_drag_selection_box_over_entities(context):
    """
    Drag a selection box that encompasses all placed entities
    Uses entity positions from context to calculate box
    """
    # Calculate box that covers all entities (assuming 32x32 size)
    x1, y1 = 50, 50
    x2, y2 = 350, 150
    
    # Use the specific step
    step_drag_selection_box(context, x1, y1, x2, y2)


@when('the user deletes selected entities')
def step_delete_selected_entities(context):
    """
    Delete all entities that have isSelected=true
    """
    result = execute_js(context.page, """
        () => {
            const beforeCount = window.placedEntities.length;
            window.placedEntities = window.placedEntities.filter(e => !e.isSelected);
            const afterCount = window.placedEntities.length;
            
            return { 
                beforeCount,
                afterCount,
                deletedCount: beforeCount - afterCount
            };
        }
    """)
    
    # Store deletion results
    context.deleted_count = result['deletedCount']
    context.remaining_count = result['afterCount']
    
    take_screenshot(context.page, 'entities_deleted', context.scenario_name)
    print(f"✅ Deleted {result['deletedCount']} entities")
    print(f"   Before: {result['beforeCount']}, After: {result['afterCount']}")


@when('the user places an entity at grid ({gridX:d}, {gridY:d})')
def step_place_entity_at_grid(context, gridX, gridY):
    """
    Place an entity at specific grid coordinates
    """
    result = execute_js(context.page, f"""
        () => {{
            const TILE_SIZE = 32;
            const worldX = {gridX} * TILE_SIZE + (TILE_SIZE / 2);
            const worldY = {gridY} * TILE_SIZE + (TILE_SIZE / 2);
            
            // Convert to screen coordinates
            let screenPos = {{ x: worldX, y: worldY }};
            if (window.cameraManager) {{
                screenPos = window.cameraManager.worldToScreen(worldX, worldY);
            }}
            
            // Call LevelEditor.handleClick() to place entity
            if (window.levelEditor && window.levelEditor.handleClick) {{
                window.levelEditor.handleClick(screenPos.x, screenPos.y);
            }}
            
            // Force redraw
            if (typeof window.redraw === 'function') {{
                window.redraw(); window.redraw(); window.redraw();
            }}
            
            // Check if entity was placed
            const spawnData = window.levelEditor?._entitySpawnData || [];
            const entity = spawnData.find(e => e.gridX === {gridX} && e.gridY === {gridY});
            
            return {{
                success: !!entity,
                gridX: {gridX},
                gridY: {gridY},
                worldX: worldX,
                worldY: worldY,
                screenX: screenPos.x,
                screenY: screenPos.y,
                entityCount: spawnData.length
            }};
        }}
    """)
    
    # Store placement info
    context.last_placed_grid = (gridX, gridY)
    context.last_placed_world = (result['worldX'], result['worldY'])
    
    take_screenshot(context.page, f'entity_placed_{gridX}_{gridY}', context.scenario_name)
    print(f"✅ Placed entity at grid ({gridX}, {gridY})")
    print(f"   World: ({result['worldX']}, {result['worldY']})")
    print(f"   Total entities: {result['entityCount']}")


# ============================================================================
# THEN Steps - Assertions
# ============================================================================

@then('all entities within the box should be selected')
def step_all_entities_selected(context):
    """
    Verify that all entities have isSelected=true
    """
    expected_count = context.entity_count
    actual_count = context.selected_count
    
    assert actual_count == expected_count, \
        f"Expected {expected_count} entities selected, got {actual_count}"
    
    print(f"✅ All {actual_count} entities are selected")


@then('the selected state should be visible')
def step_selected_state_visible(context):
    """
    Verify that entities have isSelected=true property set
    """
    result = execute_js(context.page, """
        () => {
            const states = window.placedEntities.map(e => e.isSelected);
            const allSelected = states.every(s => s === true);
            return { allSelected, states };
        }
    """)
    
    assert result['allSelected'], \
        f"Not all entities have isSelected=true: {result['states']}"
    
    print("✅ Selected state is visible (all entities have isSelected=true)")


@then('all selected entities should be removed')
def step_all_selected_removed(context):
    """
    Verify that the deleted count matches the selected count
    """
    assert context.deleted_count == context.selected_count, \
        f"Expected {context.selected_count} entities deleted, got {context.deleted_count}"
    
    print(f"✅ All {context.deleted_count} selected entities removed")


@then('no entities should remain in the array')
def step_no_entities_remain(context):
    """
    Verify that the entities array is empty
    """
    assert context.remaining_count == 0, \
        f"Expected 0 entities remaining, got {context.remaining_count}"
    
    print("✅ No entities remain in array")


@then('an entity should exist at grid ({gridX:d}, {gridY:d})')
def step_entity_exists_at_grid(context, gridX, gridY):
    """
    Verify that an entity exists at specific grid coordinates
    """
    result = execute_js(context.page, f"""
        () => {{
            const spawnData = window.levelEditor?._entitySpawnData || [];
            const entity = spawnData.find(e => e.gridX === {gridX} && e.gridY === {gridY});
            
            return {{
                exists: !!entity,
                entity: entity || null,
                totalCount: spawnData.length
            }};
        }}
    """)
    
    assert result['exists'], \
        f"No entity found at grid ({gridX}, {gridY}). Total entities: {result['totalCount']}"
    
    print(f"✅ Entity exists at grid ({gridX}, {gridY})")
    if result['entity']:
        print(f"   Template: {result['entity'].get('templateId', 'unknown')}")


@then('the entity should be found at that position')
def step_entity_found_at_position(context):
    """
    Verify entity can be found using getEntityAtPosition()
    """
    gridX, gridY = context.last_placed_grid
    worldX, worldY = context.last_placed_world
    
    result = execute_js(context.page, f"""
        () => {{
            const found = window.levelEditor?.entityPainter?.getEntityAtPosition(
                {worldX}, {worldY}, 32
            );
            return {{ found: !!found }};
        }}
    """)
    
    assert result['found'], \
        f"Entity not found at world position ({worldX}, {worldY})"
    
    print(f"✅ Entity found at position ({worldX}, {worldY})")
