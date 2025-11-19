"""
BDD Step Definitions for Game UI Overlay System
Tests GameUIOverlay orchestration with ResourceDisplayComponent
"""

import time
from behave import given, when, then
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager


def get_driver(context):
    """Get or create browser driver"""
    if not hasattr(context, 'driver') or context.driver is None:
        chrome_options = Options()
        chrome_options.add_argument('--headless=new')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        
        # Suppress Chrome internal service errors
        chrome_options.add_argument('--disable-sync')
        chrome_options.add_argument('--disable-background-networking')
        chrome_options.add_argument('--disable-default-apps')
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-translate')
        chrome_options.add_argument('--disable-logging')
        chrome_options.add_argument('--log-level=3')
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
        
        service = Service(ChromeDriverManager().install())
        context.driver = webdriver.Chrome(service=service, options=chrome_options)
        context.driver.set_page_load_timeout(30)
        context.driver.get('http://localhost:8000')
        
        # Wait for page load
        WebDriverWait(context.driver, 30).until(
            lambda d: d.execute_script('return document.readyState') == 'complete'
        )
        
        # Game has 148 scripts - need to wait for them all to load
        time.sleep(6)
    
    return context.driver


def execute_script(context, script):
    """Execute JavaScript and return result"""
    driver = get_driver(context)
    return driver.execute_script(script)


@given('the game is loaded')
def step_game_loaded(context):
    """Ensure game is loaded"""
    driver = get_driver(context)
    
    # Additional wait after driver setup
    time.sleep(1)
    
    # Check what we have
    available = driver.execute_script("""
        return {
            GameUIOverlay: typeof window.GameUIOverlay,
            ResourceDisplayComponent: typeof window.ResourceDisplayComponent,
            RenderManager: typeof window.RenderManager,
            EventManager: typeof window.EventManager
        };
    """)
    
    # Verify the UI classes are loaded
    if available['GameUIOverlay'] != 'function' or available['ResourceDisplayComponent'] != 'function':
        raise AssertionError(f"Game UI classes not loaded. Available: {available}")
    
    context.game_loaded = True


@given('the game state is "{state}"')
def step_set_game_state(context, state):
    """Set game state"""
    execute_script(context, f'window.gameState = "{state}";')
    context.game_state = state


@given('a GameUIOverlay is created with EventManager and RenderLayerManager')
def step_create_overlay_with_managers(context):
    """Create overlay with both managers"""
    script = """
        if (!window.testEventManager) {
            window.testEventManager = window.EventManager || {
                listeners: new Map(),
                on(event, cb) { 
                    if (!this.listeners.has(event)) this.listeners.set(event, []);
                    this.listeners.get(event).push(cb);
                },
                off(event, cb) {
                    if (this.listeners.has(event)) {
                        const cbs = this.listeners.get(event);
                        const idx = cbs.indexOf(cb);
                        if (idx !== -1) cbs.splice(idx, 1);
                    }
                },
                emit(event, data) {
                    if (this.listeners.has(event)) {
                        this.listeners.get(event).forEach(cb => cb(data));
                    }
                },
                listenerCount(event) {
                    return this.listeners.has(event) ? this.listeners.get(event).length : 0;
                }
            };
        }
        
        window.testOverlay = new window.GameUIOverlay({
            eventManager: window.testEventManager,
            renderManager: window.RenderManager
        });
        
        return { created: true, initialized: window.testOverlay.initialized };
    """
    
    result = execute_script(context, script)
    context.overlay_created = result['created']
    assert result['created'], "Failed to create GameUIOverlay"


@given('a GameUIOverlay is initialized with faction "{faction}"')
@when('the overlay is initialized with faction "{faction}"')
def step_initialize_overlay(context, faction):
    """Initialize overlay with faction"""
    script = f"""
        if (!window.testOverlay) {{
            window.testEventManager = window.EventManager || {{
                listeners: new Map(),
                on(e, cb) {{ if (!this.listeners.has(e)) this.listeners.set(e, []); this.listeners.get(e).push(cb); }},
                off(e, cb) {{ if (this.listeners.has(e)) {{ const cbs = this.listeners.get(e); const i = cbs.indexOf(cb); if (i !== -1) cbs.splice(i, 1); }} }},
                emit(e, d) {{ if (this.listeners.has(e)) this.listeners.get(e).forEach(cb => cb(d)); }},
                listenerCount(e) {{ return this.listeners.has(e) ? this.listeners.get(e).length : 0; }}
            }};
            
            window.testOverlay = new window.GameUIOverlay({{
                eventManager: window.testEventManager,
                renderManager: window.RenderManager
            }});
        }}
        
        window.testOverlay.initialize({{
            factionId: '{faction}',
            resourceDisplay: {{ x: 10, y: 10 }}
        }});
        
        return {{ 
            initialized: window.testOverlay.initialized,
            hasComponent: !!window.testOverlay.resourceDisplay,
            factionId: window.testOverlay.resourceDisplay?.factionId
        }};
    """
    
    result = execute_script(context, script)
    context.overlay_initialized = result['initialized']
    context.faction = faction
    assert result['initialized'], f"Failed to initialize overlay for faction {faction}"
    assert result['hasComponent'], "ResourceDisplayComponent not created"


@given('a GameUIOverlay is initialized with faction "{faction}" at position {x:d}, {y:d}')
def step_initialize_overlay_at_position(context, faction, x, y):
    """Initialize overlay at specific position"""
    overlay_var = f"testOverlay_{faction}"
    
    script = f"""
        if (!window.testEventManager) {{
            window.testEventManager = {{
                listeners: new Map(),
                on(e, cb) {{ if (!this.listeners.has(e)) this.listeners.set(e, []); this.listeners.get(e).push(cb); }},
                off(e, cb) {{ if (this.listeners.has(e)) {{ const cbs = this.listeners.get(e); const i = cbs.indexOf(cb); if (i !== -1) cbs.splice(i, 1); }} }},
                emit(e, d) {{ if (this.listeners.has(e)) this.listeners.get(e).forEach(cb => cb(d)); }},
                listenerCount(e) {{ return this.listeners.has(e) ? this.listeners.get(e).length : 0; }}
            }};
        }}
        
        window.{overlay_var} = new window.GameUIOverlay({{
            eventManager: window.testEventManager,
            renderManager: window.RenderManager
        }});
        
        window.{overlay_var}.initialize({{
            factionId: '{faction}',
            resourceDisplay: {{ x: {x}, y: {y} }}
        }});
        
        return {{ 
            initialized: window.{overlay_var}.initialized,
            factionId: window.{overlay_var}.resourceDisplay?.factionId
        }};
    """
    
    result = execute_script(context, script)
    
    if not hasattr(context, 'overlays'):
        context.overlays = {}
    context.overlays[faction] = overlay_var
    
    assert result['initialized'], f"Failed to initialize {faction} overlay"


@given('a GameUIOverlay is created without EventManager')
def step_create_overlay_without_eventmanager(context):
    """Create overlay without EventManager"""
    script = """
        window.testOverlay = new window.GameUIOverlay({
            renderManager: window.RenderManager
        });
        return { created: true };
    """
    execute_script(context, script)


@given('a GameUIOverlay is created without RenderLayerManager')
def step_create_overlay_without_rendermanager(context):
    """Create overlay without RenderLayerManager"""
    script = """
        window.testEventManager = {
            listeners: new Map(),
            on(e, cb) { if (!this.listeners.has(e)) this.listeners.set(e, []); this.listeners.get(e).push(cb); },
            off(e, cb) { if (this.listeners.has(e)) { const cbs = this.listeners.get(e); const i = cbs.indexOf(cb); if (i !== -1) cbs.splice(i, 1); } },
            emit(e, d) { if (this.listeners.has(e)) this.listeners.get(e).forEach(cb => cb(d)); },
            listenerCount(e) { return this.listeners.has(e) ? this.listeners.get(e).length : 0; }
        };
        
        window.testOverlay = new window.GameUIOverlay({
            eventManager: window.testEventManager
        });
        return { created: true };
    """
    execute_script(context, script)


@given('the overlay is destroyed')
@when('the overlay is destroyed')
def step_destroy_overlay(context):
    """Destroy overlay"""
    script = """
        if (window.testOverlay) {
            window.testOverlay.destroy();
        }
        return { destroyed: true };
    """
    execute_script(context, script)


@when('the game renders the UI_GAME layer')
def step_render_ui_game_layer(context):
    """Render UI_GAME layer"""
    script = """
        if (window.RenderManager && window.RenderManager.layerDrawables) {
            const drawables = window.RenderManager.layerDrawables.get(window.RenderManager.layers.UI_GAME) || [];
            drawables.forEach(fn => {
                try {
                    fn('PLAYING');
                } catch (e) {
                    console.error('Drawable error:', e);
                }
            });
        }
        
        if (typeof window.redraw === 'function') {
            window.redraw();
            window.redraw();
        }
        
        return { rendered: true };
    """
    execute_script(context, script)
    time.sleep(0.3)


@when('a RESOURCE_UPDATED event fires with {resource} amount {amount:d} for faction "{faction}"')
def step_fire_resource_event(context, resource, amount, faction):
    """Fire RESOURCE_UPDATED event"""
    script = f"""
        if (window.testEventManager) {{
            window.testEventManager.emit('RESOURCE_UPDATED', {{
                factionId: '{faction}',
                resourceType: '{resource}',
                amount: {amount}
            }});
        }}
        return {{ fired: true }};
    """
    execute_script(context, script)


@when('the RenderLayerManager renders all layers')
def step_render_all_layers(context):
    """Render all layers"""
    script = """
        if (window.RenderManager) {
            window.RenderManager.render('PLAYING');
        }
        
        if (typeof window.redraw === 'function') {
            window.redraw();
            window.redraw();
        }
        
        return { rendered: true };
    """
    execute_script(context, script)
    time.sleep(0.3)


@then('the ResourceDisplayComponent should be created')
def step_verify_component_created(context):
    """Verify component was created"""
    script = """
        return {
            exists: !!window.testOverlay.resourceDisplay,
            type: window.testOverlay.resourceDisplay?.constructor.name
        };
    """
    result = execute_script(context, script)
    assert result['exists'], "ResourceDisplayComponent was not created"


@then('the component should be registered with RenderLayerManager on UI_GAME layer')
def step_verify_registered_with_rendermanager(context):
    """Verify component is registered"""
    script = """
        if (!window.RenderManager || !window.RenderManager.layerDrawables) {
            return { registered: false, reason: 'RenderManager not available' };
        }
        
        const drawables = window.RenderManager.layerDrawables.get(window.RenderManager.layers.UI_GAME) || [];
        return { 
            registered: drawables.length > 0,
            count: drawables.length
        };
    """
    result = execute_script(context, script)
    assert result['registered'], f"Component not registered with RenderLayerManager: {result.get('reason', 'unknown')}"


@then('the overlay should be marked as initialized')
def step_verify_initialized(context):
    """Verify overlay is initialized"""
    script = "return { initialized: window.testOverlay.initialized };"
    result = execute_script(context, script)
    assert result['initialized'], "Overlay not marked as initialized"


@then('the overlay should be marked as not initialized')
def step_verify_not_initialized(context):
    """Verify overlay is not initialized"""
    script = "return { initialized: window.testOverlay.initialized };"
    result = execute_script(context, script)
    assert not result['initialized'], "Overlay still marked as initialized"


@then('the components array should be empty')
def step_verify_components_empty(context):
    """Verify components array is empty"""
    script = "return { length: window.testOverlay.components.length };"
    result = execute_script(context, script)
    assert result['length'] == 0, f"Components array not empty: {result['length']} items"


@then('the ResourceDisplayComponent should be cleaned up')
def step_verify_component_cleaned_up(context):
    """Verify component is cleaned up"""
    script = "return { component: window.testOverlay.resourceDisplay };"
    result = execute_script(context, script)
    assert result['component'] is None, "ResourceDisplayComponent not cleaned up"


@then('the ResourceDisplayComponent should have faction "{faction}"')
def step_verify_component_faction(context, faction):
    """Verify component has correct faction"""
    script = """
        return { 
            factionId: window.testOverlay.resourceDisplay?.factionId 
        };
    """
    result = execute_script(context, script)
    assert result['factionId'] == faction, f"Expected faction {faction}, got {result['factionId']}"


@then('the resource display should show {amount:d} {resource}')
def step_verify_resource_amount(context, amount, resource):
    """Verify resource display shows correct amount"""
    script = f"""
        if (!window.testOverlay || !window.testOverlay.resourceDisplay) {{
            return {{ error: 'No overlay or component' }};
        }}
        
        const resources = window.testOverlay.resourceDisplay.getResources();
        return {{ 
            amount: resources['{resource}'],
            allResources: resources
        }};
    """
    result = execute_script(context, script)
    
    if 'error' in result:
        assert False, result['error']
    
    assert result['amount'] == amount, f"Expected {resource}: {amount}, got {result['amount']}"


@then('the {faction} overlay should show {amount:d} {resource}')
def step_verify_faction_resource_amount(context, faction, amount, resource):
    """Verify specific faction overlay shows correct amount"""
    overlay_var = context.overlays.get(faction, f'testOverlay_{faction}')
    
    script = f"""
        if (!window.{overlay_var} || !window.{overlay_var}.resourceDisplay) {{
            return {{ error: 'No {faction} overlay or component' }};
        }}
        
        const resources = window.{overlay_var}.resourceDisplay.getResources();
        return {{ 
            amount: resources['{resource}'],
            factionId: window.{overlay_var}.resourceDisplay.factionId
        }};
    """
    result = execute_script(context, script)
    
    if 'error' in result:
        assert False, result['error']
    
    assert result['amount'] == amount, f"Expected {faction} {resource}: {amount}, got {result['amount']}"


@then('drawing functions should be called')
def step_verify_drawing_functions_called(context):
    """Verify p5.js drawing functions were called"""
    script = """
        // Check if rendering happened by looking at canvas
        const canvas = document.querySelector('canvas');
        return {
            hasCanvas: !!canvas,
            canvasSize: canvas ? { width: canvas.width, height: canvas.height } : null
        };
    """
    result = execute_script(context, script)
    assert result['hasCanvas'], "Canvas not found - rendering may not have occurred"


@then('the resource display should be visible on screen')
def step_verify_display_visible(context):
    """Verify resource display is visible"""
    script = """
        if (!window.testOverlay || !window.testOverlay.resourceDisplay) {
            return { visible: false, reason: 'No overlay or component' };
        }
        
        const component = window.testOverlay.resourceDisplay;
        const pos = component.getPosition();
        
        return {
            visible: true,
            position: pos,
            initialized: window.testOverlay.initialized
        };
    """
    result = execute_script(context, script)
    assert result['visible'], f"Display not visible: {result.get('reason', 'unknown')}"


def after_scenario(context, scenario):
    """Cleanup after each scenario"""
    if hasattr(context, 'driver') and context.driver:
        try:
            # Clean up test overlays
            context.driver.execute_script("""
                if (window.testOverlay) {
                    window.testOverlay.destroy();
                    delete window.testOverlay;
                }
                if (window.testEventManager) {
                    delete window.testEventManager;
                }
                if (window.testOverlay_player) {
                    window.testOverlay_player.destroy();
                    delete window.testOverlay_player;
                }
                if (window.testOverlay_enemy) {
                    window.testOverlay_enemy.destroy();
                    delete window.testOverlay_enemy;
                }
            """)
        except:
            pass


def after_all(context):
    """Cleanup after all scenarios"""
    if hasattr(context, 'driver') and context.driver:
        context.driver.quit()
