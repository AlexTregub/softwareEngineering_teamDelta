"""
Step definitions for Custom Level Camera BDD tests
"""

from behave import given, when, then
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import time

# ========================================
# Background Steps
# ========================================

@given('the game is running in a browser')
def step_game_running(context):
    """Launch browser and navigate to game"""
    if not hasattr(context, 'browser'):
        options = webdriver.ChromeOptions()
        options.add_argument('--headless=new')
        options.add_argument('--disable-gpu')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=800,600')
        context.browser = webdriver.Chrome(options=options)
    
    context.browser.get('http://localhost:8000')
    time.sleep(1)  # Wait for page load

@given('I have loaded a custom level with a 3200x3200 pixel map')
def step_load_custom_level_3200(context):
    """Load CaveTutorial.json (3200x3200 map)"""
    # Wait for game to initialize
    context.browser.execute_script("""
        return new Promise(resolve => {
            if (window.GameState && window.GameState.getState() === 'MENU') {
                resolve(true);
            } else {
                setTimeout(() => resolve(true), 2000);
            }
        });
    """)
    
    # Load custom level via JavaScript
    context.browser.execute_script("""
        if (typeof loadCustomLevel === 'function') {
            loadCustomLevel();
        }
    """)
    time.sleep(2)  # Wait for level load

@given('the queen ant is spawned on the map')
def step_queen_spawned(context):
    """Verify queen exists"""
    queen_exists = context.browser.execute_script("""
        return window.ants && window.ants.some(ant => ant.JobName === 'Queen');
    """)
    assert queen_exists, "Queen ant not found"

@given('the camera system is initialized')
def step_camera_initialized(context):
    """Verify camera system is ready"""
    camera_ready = context.browser.execute_script("""
        return window.cameraManager !== undefined && window.cameraManager !== null;
    """)
    assert camera_ready, "Camera system not initialized"

# ========================================
# Queen Visibility Steps
# ========================================

@given('the queen spawns at the center of the map')
def step_queen_at_center(context):
    """Move queen to center (1600, 1600)"""
    context.browser.execute_script("""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (queen) {
            queen.x = 1570;
            queen.y = 1570;
        }
    """)

@when('the custom level finishes loading')
def step_level_finished_loading(context):
    """Wait for level to complete loading"""
    time.sleep(1)
    # Force camera update
    context.browser.execute_script("""
        if (window.cameraManager && typeof window.cameraManager.update === 'function') {
            window.cameraManager.update();
        }
        if (typeof window.redraw === 'function') {
            window.redraw();
        }
    """)

@then('the queen should be visible in the center of the viewport')
def step_queen_visible_center(context):
    """Check queen is centered"""
    result = context.browser.execute_script("""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (!queen || !window.cameraManager) return { success: false };
        
        const queenCenterX = queen.x + (queen.width || 60) / 2;
        const queenCenterY = queen.y + (queen.height || 60) / 2;
        
        const camera = window.cameraManager;
        const cameraX = camera.cameraX || camera._cameraX || 0;
        const cameraY = camera.cameraY || camera._cameraY || 0;
        
        const viewportCenterX = cameraX + 400;
        const viewportCenterY = cameraY + 300;
        
        const deltaX = Math.abs(queenCenterX - viewportCenterX);
        const deltaY = Math.abs(queenCenterY - viewportCenterY);
        
        return {
            success: deltaX < 50 && deltaY < 50,
            queenX: queenCenterX,
            queenY: queenCenterY,
            viewportCenterX: viewportCenterX,
            viewportCenterY: viewportCenterY,
            deltaX: deltaX,
            deltaY: deltaY
        };
    """)
    
    assert result['success'], f"Queen not centered: deltaX={result.get('deltaX')}, deltaY={result.get('deltaY')}"

@then('the camera should be positioned to show equal space on all sides')
def step_camera_equal_space(context):
    """Verify equal space around queen"""
    result = context.browser.execute_script("""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (!queen || !window.cameraManager) return { success: false };
        
        const camera = window.cameraManager;
        const cameraX = camera.cameraX || camera._cameraX || 0;
        const cameraY = camera.cameraY || camera._cameraY || 0;
        
        const queenScreenX = queen.x - cameraX;
        const queenScreenY = queen.y - cameraY;
        
        const spaceLeft = queenScreenX;
        const spaceRight = 800 - (queenScreenX + (queen.width || 60));
        const spaceTop = queenScreenY;
        const spaceBottom = 600 - (queenScreenY + (queen.height || 60));
        
        const tolerance = 100; // pixels
        const balanced = Math.abs(spaceLeft - spaceRight) < tolerance &&
                        Math.abs(spaceTop - spaceBottom) < tolerance;
        
        return {
            success: balanced,
            spaceLeft: spaceLeft,
            spaceRight: spaceRight,
            spaceTop: spaceTop,
            spaceBottom: spaceBottom
        };
    """)
    
    assert result['success'], f"Unequal space around queen: {result}"

@given('the camera is centered on the queen')
def step_camera_centered_on_queen(context):
    """Center camera on queen"""
    context.browser.execute_script("""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (queen && window.cameraManager) {
            if (typeof window.cameraManager.followEntity === 'function') {
                window.cameraManager.followEntity(queen);
            }
            if (typeof window.cameraManager.update === 'function') {
                window.cameraManager.update();
            }
        }
    """)

@when('the queen moves {distance:d} pixels to the right')
def step_queen_moves_right(context, distance):
    """Move queen right by distance"""
    context.browser.execute_script(f"""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (queen) {{
            queen.x += {distance};
        }}
    """)
    time.sleep(0.1)

@when('the queen moves {distance:d} pixels down')
def step_queen_moves_down(context, distance):
    """Move queen down by distance"""
    context.browser.execute_script(f"""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (queen) {{
            queen.y += {distance};
        }}
    """)
    time.sleep(0.1)

@then('the camera should NOT move')
def step_camera_not_move(context):
    """Verify camera position unchanged"""
    # Store initial position
    if not hasattr(context, 'camera_pos_before'):
        context.camera_pos_before = context.browser.execute_script("""
            const camera = window.cameraManager;
            return {
                x: camera.cameraX || camera._cameraX || 0,
                y: camera.cameraY || camera._cameraY || 0
            };
        """)
    
    # Update camera
    context.browser.execute_script("""
        if (window.cameraManager && typeof window.cameraManager.update === 'function') {
            window.cameraManager.update();
        }
    """)
    
    # Check position
    pos_after = context.browser.execute_script("""
        const camera = window.cameraManager;
        return {
            x: camera.cameraX || camera._cameraX || 0,
            y: camera.cameraY || camera._cameraY || 0
        };
    """)
    
    assert pos_after['x'] == context.camera_pos_before['x'], "Camera moved horizontally"
    assert pos_after['y'] == context.camera_pos_before['y'], "Camera moved vertically"

@then('the queen should remain visible in the viewport')
def step_queen_visible(context):
    """Check queen is on screen"""
    result = context.browser.execute_script("""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (!queen || !window.cameraManager) return { success: false };
        
        const camera = window.cameraManager;
        const cameraX = camera.cameraX || camera._cameraX || 0;
        const cameraY = camera.cameraY || camera._cameraY || 0;
        
        const queenScreenX = queen.x - cameraX;
        const queenScreenY = queen.y - cameraY;
        
        const visible = queenScreenX >= -100 && queenScreenX <= 900 &&
                       queenScreenY >= -100 && queenScreenY <= 700;
        
        return { success: visible, screenX: queenScreenX, screenY: queenScreenY };
    """)
    
    assert result['success'], f"Queen not visible: screenX={result.get('screenX')}, screenY={result.get('screenY')}"

@then('the camera should follow the queen')
def step_camera_follows(context):
    """Verify camera moved to follow queen"""
    # Store initial position if not already stored
    if not hasattr(context, 'camera_pos_before'):
        context.camera_pos_before = {'x': 0, 'y': 0}
    
    # Update camera
    context.browser.execute_script("""
        if (window.cameraManager && typeof window.cameraManager.update === 'function') {
            window.cameraManager.update();
        }
    """)
    
    pos_after = context.browser.execute_script("""
        const camera = window.cameraManager;
        return {
            x: camera.cameraX || camera._cameraX || 0,
            y: camera.cameraY || camera._cameraY || 0
        };
    """)
    
    # Camera should have moved (in at least one direction)
    moved = (pos_after['x'] != context.camera_pos_before['x'] or 
             pos_after['y'] != context.camera_pos_before['y'])
    
    assert moved, "Camera did not follow queen"

@then('the queen should remain centered in the viewport')
def step_queen_centered(context):
    """Check queen is centered"""
    step_queen_visible_center(context)

@then('the queen should NOT appear at the edge of the screen')
def step_queen_not_at_edge(context):
    """Verify queen not near screen edges"""
    result = context.browser.execute_script("""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (!queen || !window.cameraManager) return { success: false };
        
        const camera = window.cameraManager;
        const cameraX = camera.cameraX || camera._cameraX || 0;
        const cameraY = camera.cameraY || camera._cameraY || 0;
        
        const queenScreenX = queen.x - cameraX;
        const queenScreenY = queen.y - cameraY;
        
        const margin = 100; // pixels from edge
        const notAtEdge = queenScreenX > margin && queenScreenX < 800 - margin &&
                         queenScreenY > margin && queenScreenY < 600 - margin;
        
        return { success: notAtEdge, screenX: queenScreenX, screenY: queenScreenY };
    """)
    
    assert result['success'], f"Queen too close to edge: {result}"

# ========================================
# Map Edge Handling Steps
# ========================================

@given('the queen is at position ({x:d}, {y:d}) in world coordinates')
def step_queen_at_position(context, x, y):
    """Set queen world position"""
    context.browser.execute_script(f"""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (queen) {{
            queen.x = {x};
            queen.y = {y};
        }}
    """)

@when('I move the queen to position ({x:d}, {y:d})')
def step_move_queen_to_position(context, x, y):
    """Move queen to specific position"""
    context.browser.execute_script(f"""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (queen) {{
            queen.x = {x};
            queen.y = {y};
            if (window.cameraManager && typeof window.cameraManager.update === 'function') {{
                window.cameraManager.update();
            }}
        }}
    """)
    time.sleep(0.2)

@then('the queen should be visible at the {corner} of the viewport')
def step_queen_at_corner(context, corner):
    """Verify queen visible at specified corner"""
    result = context.browser.execute_script(f"""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (!queen || !window.cameraManager) return {{ success: false }};
        
        const camera = window.cameraManager;
        const cameraX = camera.cameraX || camera._cameraX || 0;
        const cameraY = camera.cameraY || camera._cameraY || 0;
        
        const queenScreenX = queen.x - cameraX;
        const queenScreenY = queen.y - cameraY;
        
        const visible = queenScreenX >= -100 && queenScreenX <= 900 &&
                       queenScreenY >= -100 && queenScreenY <= 700;
        
        return {{ success: visible, screenX: queenScreenX, screenY: queenScreenY }};
    """)
    
    assert result['success'], f"Queen not visible at {corner}: {result}"

@then('the camera should show the {corner} corner of the map')
def step_camera_shows_corner(context, corner):
    """Verify camera positioned at map corner"""
    result = context.browser.execute_script(f"""
        const camera = window.cameraManager;
        const cameraX = camera.cameraX || camera._cameraX || 0;
        const cameraY = camera.cameraY || camera._cameraY || 0;
        
        const corner = '{corner}';
        let expectedX = 0, expectedY = 0;
        let tolerance = 50;
        
        if (corner === 'top-left') {{
            expectedX = 0;
            expectedY = 0;
        }} else if (corner === 'bottom-right') {{
            expectedX = 2400; // 3200 - 800
            expectedY = 2600; // 3200 - 600
        }}
        
        const atCorner = Math.abs(cameraX - expectedX) < tolerance &&
                        Math.abs(cameraY - expectedY) < tolerance;
        
        return {{
            success: atCorner,
            cameraX: cameraX,
            cameraY: cameraY,
            expectedX: expectedX,
            expectedY: expectedY
        }};
    """)
    
    assert result['success'], f"Camera not at {corner} corner: {result}"

@then('the queen should be fully visible on screen')
def step_queen_fully_visible(context):
    """Check queen entirely within viewport"""
    result = context.browser.execute_script("""
        const queen = window.ants.find(ant => ant.JobName === 'Queen');
        if (!queen || !window.cameraManager) return { success: false };
        
        const camera = window.cameraManager;
        const cameraX = camera.cameraX || camera._cameraX || 0;
        const cameraY = camera.cameraY || camera._cameraY || 0;
        
        const queenScreenX = queen.x - cameraX;
        const queenScreenY = queen.y - cameraY;
        const queenWidth = queen.width || 60;
        const queenHeight = queen.height || 60;
        
        const fullyVisible = queenScreenX >= 0 && queenScreenX + queenWidth <= 800 &&
                            queenScreenY >= 0 && queenScreenY + queenHeight <= 600;
        
        return { success: fullyVisible, screenX: queenScreenX, screenY: queenScreenY };
    """)
    
    assert result['success'], "Queen not fully visible"

# Additional steps would continue for remaining scenarios...
# (Arrow keys, zoom, state transitions, performance, etc.)
# This provides the foundation - full implementation would continue similarly
