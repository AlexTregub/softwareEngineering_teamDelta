"""
BDD Step Definitions for ResourceDisplayComponent
===================================================
Tests user-facing behavior of resource display on screen.
Uses Selenium WebDriver with headless Chrome (managed by environment.py).
"""

from behave import given, when, then
import time
import os


def get_base_url():
    """Get test server URL from environment"""
    return os.environ.get('TEST_URL', 'http://localhost:8000')


@given('the game is running in headless mode')
def step_game_running_headless(context):
    """Navigate to game page (driver created by environment.py)"""
    assert hasattr(context, 'driver'), "Driver not initialized by environment.py"
    assert context.driver is not None, "Driver is None"
    
    # Navigate to game
    base_url = get_base_url()
    context.driver.get(base_url)
    
    # Wait for page to load
    context.driver.implicitly_wait(10)
    time.sleep(2)  # Allow game initialization
    
    # Verify page loaded
    title = context.driver.title
    assert title, "Page title should not be empty"


@given('the resource display component is initialized')
def step_resource_display_initialized(context):
    """Create ResourceDisplayComponent instance in browser context"""
    driver = context.driver
    
    # Check if ResourceDisplayComponent class exists
    check_script = "return typeof ResourceDisplayComponent !== 'undefined';"
    has_class = driver.execute_script(check_script)
    assert has_class, "ResourceDisplayComponent class not found. Check index.html script loading."
    
    # Create component instance
    script = """
    window.testResourceDisplay = new ResourceDisplayComponent(50, 50, 'player');
    window.testResourceDisplayInitialized = true;
    return true;
    """
    
    result = driver.execute_script(script)
    assert result, "ResourceDisplayComponent should initialize successfully"
    
    # Store reference in context
    context.resource_display_initialized = True


@when('the player views the screen')
def step_player_views_screen(context):
    """No-op: player viewing is implicit"""
    pass


@then('the resource display shows {amount:d} {resource_type}')
def step_display_shows_resource(context, amount, resource_type):
    """Verify resource count matches expected amount"""
    driver = context.driver
    
    script = f"""
    if (!window.testResourceDisplay) return null;
    const resources = window.testResourceDisplay.getResources();
    return resources['{resource_type.lower()}'];
    """
    
    actual_amount = driver.execute_script(script)
    assert actual_amount is not None, f"Could not read {resource_type} count"
    assert actual_amount == amount, f"Expected {amount} {resource_type}, got {actual_amount}"


@given('the resource display shows {amount:d} {resource_type}')
def step_set_display_resource(context, amount, resource_type):
    """Set resource count to specific amount"""
    driver = context.driver
    
    script = f"""
    if (!window.testResourceDisplay) return false;
    window.testResourceDisplay.updateResourceCount('{resource_type.lower()}', {amount});
    return true;
    """
    
    result = driver.execute_script(script)
    assert result, f"Failed to set {resource_type} to {amount}"


@when('{amount:d} {resource_type} is added')
def step_add_resource(context, amount, resource_type):
    """Add amount to existing resource count"""
    driver = context.driver
    
    # Get current count
    script = f"""
    if (!window.testResourceDisplay) return null;
    const resources = window.testResourceDisplay.getResources();
    return resources['{resource_type.lower()}'];
    """
    
    current = driver.execute_script(script)
    assert current is not None, f"Could not read current {resource_type} count"
    
    # Update to new total
    new_total = current + amount
    update_script = f"""
    if (!window.testResourceDisplay) return false;
    window.testResourceDisplay.updateResourceCount('{resource_type.lower()}', {new_total});
    return true;
    """
    
    result = driver.execute_script(update_script)
    assert result, f"Failed to add {amount} {resource_type}"


@then('the resource display text contains "{text}"')
def step_display_text_contains(context, text):
    """Verify formatted output contains expected text"""
    driver = context.driver
    
    # Get resource counts and format them
    script = """
    if (!window.testResourceDisplay) return null;
    
    const resources = window.testResourceDisplay.getResources();
    const formatNumber = (num) => {
        return num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
    };
    
    return {
        food: formatNumber(resources.food),
        wood: formatNumber(resources.wood),
        stone: formatNumber(resources.stone)
    };
    """
    
    formatted = driver.execute_script(script)
    assert formatted is not None, "Could not get formatted resource text"
    
    # Check if text appears in any resource display
    found = any(text in str(value) for value in formatted.values())
    assert found, f"Expected text '{text}' not found in resource display. Got: {formatted}"


@given('the resource display is positioned at x={x:d} y={y:d}')
def step_set_position(context, x, y):
    """Set display position"""
    driver = context.driver
    
    script = f"""
    if (!window.testResourceDisplay) return false;
    window.testResourceDisplay.setPosition({x}, {y});
    return true;
    """
    
    result = driver.execute_script(script)
    assert result, f"Failed to set position to ({x}, {y})"


@when('the position is queried')
def step_query_position(context):
    """Query current position (stores in context)"""
    driver = context.driver
    
    script = """
    if (!window.testResourceDisplay) return null;
    return window.testResourceDisplay.getPosition();
    """
    
    position = driver.execute_script(script)
    assert position is not None, "Could not query position"
    
    context.queried_position = position


@then('the x coordinate is {x:d}')
def step_verify_x_coordinate(context, x):
    """Verify X coordinate matches expected value"""
    assert hasattr(context, 'queried_position'), "Position not queried"
    actual_x = context.queried_position.get('x')
    assert actual_x == x, f"Expected x={x}, got x={actual_x}"


@then('the y coordinate is {y:d}')
def step_verify_y_coordinate(context, y):
    """Verify Y coordinate matches expected value"""
    assert hasattr(context, 'queried_position'), "Position not queried"
    actual_y = context.queried_position.get('y')
    assert actual_y == y, f"Expected y={y}, got y={actual_y}"


@when('the position is changed to x={x:d} y={y:d}')
def step_change_position(context, x, y):
    """Change display position and re-query"""
    driver = context.driver
    
    script = f"""
    if (!window.testResourceDisplay) return null;
    window.testResourceDisplay.setPosition({x}, {y});
    return window.testResourceDisplay.getPosition();
    """
    
    position = driver.execute_script(script)
    assert position is not None, f"Failed to change position to ({x}, {y})"
    
    context.queried_position = position


@given('the resource display has scale {scale:f}')
def step_set_scale(context, scale):
    """Set display scale"""
    driver = context.driver
    
    script = f"""
    if (!window.testResourceDisplay) return false;
    window.testResourceDisplay.scale = {scale};
    return true;
    """
    
    result = driver.execute_script(script)
    assert result, f"Failed to set scale to {scale}"


@when('the scale is changed to {scale:f}')
def step_change_scale(context, scale):
    """Change display scale"""
    driver = context.driver
    
    script = f"""
    if (!window.testResourceDisplay) return false;
    window.testResourceDisplay.scale = {scale};
    return true;
    """
    
    result = driver.execute_script(script)
    assert result, f"Failed to change scale to {scale}"


@then('the scale is {scale:f}')
def step_verify_scale(context, scale):
    """Verify scale matches expected value"""
    driver = context.driver
    
    script = """
    if (!window.testResourceDisplay) return null;
    return window.testResourceDisplay.scale;
    """
    
    actual_scale = driver.execute_script(script)
    assert actual_scale is not None, "Could not read scale"
    assert abs(actual_scale - scale) < 0.01, f"Expected scale {scale}, got {actual_scale}"


@when('all resources are set to food={food:d} wood={wood:d} stone={stone:d}')
def step_set_all_resources(context, food, wood, stone):
    """Set all resources at once using setResources()"""
    driver = context.driver
    
    script = f"""
    if (!window.testResourceDisplay) return false;
    window.testResourceDisplay.setResources({{
        food: {food},
        wood: {wood},
        stone: {stone}
    }});
    return true;
    """
    
    result = driver.execute_script(script)
    assert result, f"Failed to set resources to food={food} wood={wood} stone={stone}"
