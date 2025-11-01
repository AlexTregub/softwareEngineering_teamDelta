"""
Behave Step Definitions for Entity Selection using Puppeteer

This approach launches Node.js Puppeteer scripts from Python Behave steps,
allowing us to write readable Gherkin scenarios while leveraging Puppeteer's
full power for browser automation and screenshot capture.
"""

from behave import given, when, then, step
import subprocess
import json
import time
from pathlib import Path


def run_puppeteer_script(script_name, params=None):
    """
    Run a Node.js Puppeteer script and return the result
    
    Args:
        script_name: Name of the script in test/bdd/support/puppeteer_scripts/
        params: Dictionary of parameters to pass to the script
    
    Returns:
        Dictionary with result data
    """
    script_path = Path('test/bdd/support/puppeteer_scripts') / f"{script_name}.js"
    
    if not script_path.exists():
        raise FileNotFoundError(f"Puppeteer script not found: {script_path}")
    
    # Pass parameters as environment variables
    env = {}
    if params:
        for key, value in params.items():
            env[f"TEST_{key.upper()}"] = str(value)
    
    result = subprocess.run(
        ['node', str(script_path)],
        capture_output=True,
        text=True,
        timeout=60,
        env={**subprocess.os.environ, **env}
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Puppeteer script failed: {result.stderr}")
    
    # Parse JSON output from script
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {'success': True, 'output': result.stdout}


# ============================================================================
# GIVEN Steps
# ============================================================================

@given('the Level Editor is open')
def step_level_editor_open(context):
    """Open Level Editor and verify it's ready"""
    result = run_puppeteer_script('open_level_editor')
    
    assert result['success'], result.get('error', 'Failed to open Level Editor')
    
    context.level_editor_open = True
    context.screenshot_dir = Path(result.get('screenshotDir', 'test/e2e/screenshots/bdd'))
    
    print(f"✅ Level Editor opened")
    print(f"📸 Screenshot: {result.get('screenshot', 'N/A')}")


@given('the EntitySelectionTool is created')
def step_entity_selection_tool_created(context):
    """Create EntitySelectionTool component"""
    result = run_puppeteer_script('create_entity_selection_tool')
    
    assert result['success'], result.get('error', 'Failed to create EntitySelectionTool')
    
    context.selection_tool_mode = result.get('mode', 'ENTITY')
    
    print(f"✅ EntitySelectionTool created (mode: {context.selection_tool_mode})")
    print(f"📸 Screenshot: {result.get('screenshot', 'N/A')}")


@given('multiple entities are placed on the grid')
def step_multiple_entities_placed(context):
    """Place multiple test entities on the grid"""
    result = run_puppeteer_script('place_multiple_entities', {
        'positions': json.dumps([
            {'x': 100, 'y': 100},
            {'x': 200, 'y': 100},
            {'x': 300, 'y': 100}
        ])
    })
    
    assert result['success'], result.get('error', 'Failed to place entities')
    
    context.entity_count = result.get('count', 0)
    context.entity_positions = result.get('positions', [])
    
    print(f"✅ Placed {context.entity_count} entities")
    for i, pos in enumerate(context.entity_positions):
        print(f"   Entity {i+1}: ({pos['x']}, {pos['y']})")
    print(f"📸 Screenshot: {result.get('screenshot', 'N/A')}")


@given('entities are placed at positions')
def step_entities_at_positions(context):
    """Place entities at specific positions from table"""
    positions = []
    for row in context.table:
        positions.append({'x': int(row['x']), 'y': int(row['y'])})
    
    result = run_puppeteer_script('place_multiple_entities', {
        'positions': json.dumps(positions)
    })
    
    assert result['success'], result.get('error', 'Failed to place entities')
    
    context.entity_count = result.get('count', 0)
    context.entity_positions = result.get('positions', [])
    
    print(f"✅ Placed {context.entity_count} entities at specified positions")


# ============================================================================
# WHEN Steps
# ============================================================================

@when('the user drags a selection box from ({x1:d}, {y1:d}) to ({x2:d}, {y2:d})')
def step_drag_selection_box(context, x1, y1, x2, y2):
    """Drag selection box from (x1, y1) to (x2, y2)"""
    result = run_puppeteer_script('drag_selection_box', {
        'x1': x1,
        'y1': y1,
        'x2': x2,
        'y2': y2
    })
    
    assert result['success'], result.get('error', 'Failed to drag selection box')
    
    context.selected_count = result.get('selectedCount', 0)
    context.total_count = result.get('totalCount', 0)
    
    print(f"✅ Dragged selection box from ({x1}, {y1}) to ({x2}, {y2})")
    print(f"   Selected: {context.selected_count}/{context.total_count} entities")
    print(f"📸 Screenshot: {result.get('screenshot', 'N/A')}")


@when('the user deletes selected entities')
def step_delete_selected(context):
    """Delete all selected entities"""
    result = run_puppeteer_script('delete_selected_entities')
    
    assert result['success'], result.get('error', 'Failed to delete entities')
    
    context.deleted_count = result.get('deletedCount', 0)
    context.remaining_count = result.get('remainingCount', 0)
    
    print(f"✅ Deleted {context.deleted_count} entities")
    print(f"   Remaining: {context.remaining_count}")
    print(f"📸 Screenshot: {result.get('screenshot', 'N/A')}")


# ============================================================================
# THEN Steps
# ============================================================================

@then('all entities within the box should be selected')
def step_all_entities_selected(context):
    """Verify all entities are selected"""
    expected = context.entity_count
    actual = context.selected_count
    
    assert actual == expected, \
        f"Expected {expected} entities selected, got {actual}"
    
    print(f"✅ All {actual} entities selected")


@then('the selected state should be visible')
def step_selected_state_visible(context):
    """Verify entities have isSelected=true"""
    result = run_puppeteer_script('verify_selected_state')
    
    assert result['success'], result.get('error', 'Selected state verification failed')
    assert result.get('allSelected', False), \
        f"Not all entities have isSelected=true: {result.get('states', [])}"
    
    print("✅ Selected state visible (all entities have isSelected=true)")


@then('all selected entities should be removed')
def step_selected_entities_removed(context):
    """Verify deleted count matches selected count"""
    expected = context.selected_count
    actual = context.deleted_count
    
    assert actual == expected, \
        f"Expected {expected} entities deleted, got {actual}"
    
    print(f"✅ All {actual} selected entities removed")


@then('no entities should remain in the array')
def step_no_entities_remain(context):
    """Verify entities array is empty"""
    actual = context.remaining_count
    
    assert actual == 0, \
        f"Expected 0 entities remaining, got {actual}"
    
    print("✅ No entities remain")


@then('{count:d} entities should be selected')
def step_count_entities_selected(context, count):
    """Verify specific number of entities selected"""
    actual = context.selected_count
    
    assert actual == count, \
        f"Expected {count} entities selected, got {actual}"
    
    print(f"✅ {actual} entities selected")


@then('the entity at ({x:d}, {y:d}) should not be selected')
def step_entity_not_selected(context, x, y):
    """Verify specific entity is not selected"""
    result = run_puppeteer_script('check_entity_selection_state', {
        'x': x,
        'y': y
    })
    
    assert result['success'], result.get('error', 'Selection state check failed')
    assert not result.get('isSelected', True), \
        f"Entity at ({x}, {y}) should not be selected but is"
    
    print(f"✅ Entity at ({x}, {y}) is not selected")
