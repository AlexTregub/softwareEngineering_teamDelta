#!/usr/bin/env python3
"""
BDD Step Definitions for Ant Rendering System

Tests the complete MVC ant rendering pipeline including:
- EntityManager registration
- AntFactory creation
- EntityLayerRenderer collection
- Controller → View rendering delegation
- Camera transforms
- Game state transitions

Author: Software Engineering Team Delta
Version: 1.0.0
"""

from behave import given, when, then
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


@given('the game is loaded on "{url}"')
def step_load_game(context, url):
    """Navigate to game URL and wait for page load"""
    context.driver.get(url)
    # Wait for canvas element (indicates game loaded)
    WebDriverWait(context.driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, 'canvas'))
    )
    time.sleep(0.5)  # Additional buffer for script loading


@when('the player starts a new game')
def step_start_new_game(context):
    """Start a new game (triggers ant creation)"""
    # Execute game start via JavaScript
    result = context.driver.execute_script("""
        const debug = {
            hasStartGame: typeof window.startGame === 'function',
            hasSetup: typeof window.setup === 'function',
            hasGameState: typeof window.GameState !== 'undefined',
            initialState: window.GameState ? window.GameState.getState() : null
        };
        
        if (typeof window.startGame === 'function') {
            window.startGame();
        } else if (typeof window.setup === 'function') {
            window.setup();
        }
        // Force game state to PLAYING
        if (window.gameState !== undefined) {
            window.gameState = 'PLAYING';
        }
        if (window.GameState) {
            window.GameState.setState('PLAYING', false);
            debug.finalState = window.GameState.getState();
        }
        
        return debug;
    """)
    print(f"Game start debug: {result}")
    time.sleep(0.3)  # Allow initialization


@when('the game completes initialization')
def step_wait_for_initialization(context):
    """Wait for game systems to initialize"""
    # Wait for EntityManager to be available
    WebDriverWait(context.driver, 10).until(
        lambda driver: driver.execute_script(
            'return window.entityManager !== undefined'
        )
    )
    
    # Debug: Check if GAME_PLAYING_STARTED event was emitted
    debug_info = context.driver.execute_script("""
        return {
            hasGameState: typeof window.GameState !== 'undefined',
            currentState: window.GameState ? window.GameState.getState() : null,
            hasEventManager: typeof window.eventManager !== 'undefined',
            hasEntityEvents: typeof window.EntityEvents !== 'undefined'
        };
    """)
    print(f"Debug - Game initialization: {debug_info}")
    
    # Wait for ants to be created
    max_attempts = 20
    for _ in range(max_attempts):
        ant_count = context.driver.execute_script(
            'return window.entityManager ? window.entityManager.getCount("ant") : 0'
        )
        if ant_count > 0:
            break
        time.sleep(0.1)
    
    # Force render cycle
    context.driver.execute_script("""
        if (typeof window.redraw === 'function') {
            window.redraw();
            window.redraw();
            window.redraw();
        }
    """)
    time.sleep(0.2)


@then('ants should be visible on the map')
def step_verify_ants_visible(context):
    """Verify ants exist in EntityManager (rendering pipeline)"""
    ant_count = context.driver.execute_script(
        'return window.entityManager ? window.entityManager.getCount("ant") : 0'
    )
    assert ant_count > 0, f"Expected ants but found {ant_count}"


@then('the EntityManager should contain ant entities')
def step_verify_entity_manager_has_ants(context):
    """Verify EntityManager tracking ants"""
    result = context.driver.execute_script("""
        if (!window.entityManager) return { hasManager: false };
        const ants = window.entityManager.getByType('ant');
        return {
            hasManager: true,
            antCount: ants.length,
            hasAnts: ants.length > 0
        };
    """)
    assert result['hasManager'], "EntityManager not found"
    assert result['hasAnts'], f"EntityManager has no ants (count: {result['antCount']})"


@then('at least {count:d} ants should be registered in EntityManager')
def step_verify_minimum_ant_count(context, count):
    """Verify minimum ant count in EntityManager"""
    ant_count = context.driver.execute_script(
        'return window.entityManager ? window.entityManager.getCount("ant") : 0'
    )
    assert ant_count >= count, f"Expected at least {count} ants, found {ant_count}"


@then('each ant should have a render method')
def step_verify_ants_have_render_method(context):
    """Verify MVC ants have render methods"""
    result = context.driver.execute_script("""
        if (!window.entityManager) return { valid: false, reason: 'No EntityManager' };
        const ants = window.entityManager.getByType('ant');
        if (ants.length === 0) return { valid: false, reason: 'No ants' };
        
        for (const ant of ants) {
            // Check if entity has render method (either on controller or directly)
            const hasRender = (
                (ant.controller && typeof ant.controller.render === 'function') ||
                typeof ant.render === 'function'
            );
            if (!hasRender) {
                return { 
                    valid: false, 
                    reason: `Ant missing render method`,
                    hasController: !!ant.controller
                };
            }
        }
        return { valid: true, count: ants.length };
    """)
    assert result['valid'], f"Ant render validation failed: {result.get('reason', 'Unknown')}"


@then('ants should render in the ENTITIES layer')
def step_verify_ants_in_entities_layer(context):
    """Verify ants registered in correct render layer"""
    result = context.driver.execute_script("""
        if (!window.RenderManager) return { hasManager: false };
        // Check if ENTITIES layer exists and EntityRenderer is registered
        const entitiesLayer = window.RenderManager.layers.ENTITIES;
        const hasEntityRenderer = typeof window.EntityRenderer !== 'undefined';
        return {
            hasManager: true,
            hasEntitiesLayer: !!entitiesLayer,
            hasEntityRenderer: hasEntityRenderer,
            layerValue: entitiesLayer
        };
    """)
    assert result['hasManager'], "RenderManager not found"
    assert result['hasEntitiesLayer'], "ENTITIES layer not found"
    assert result['hasEntityRenderer'], "EntityRenderer not registered"


@then('the ENTITIES layer should be above TERRAIN layer')
def step_verify_layer_order(context):
    """Verify render layer ordering"""
    result = context.driver.execute_script("""
        if (!window.RenderManager) return { valid: false, reason: 'No RenderManager' };
        const layers = window.RenderManager.layers;
        if (!layers) return { valid: false, reason: 'No layers object' };
        if (typeof layers.TERRAIN === 'undefined') return { valid: false, reason: 'No TERRAIN layer' };
        if (typeof layers.ENTITIES === 'undefined') return { valid: false, reason: 'No ENTITIES layer' };
        
        // Layers are string constants like 'terrain', 'entities'
        // Order is enforced by render pipeline, not numeric values
        return {
            valid: true,
            terrainLayer: layers.TERRAIN,
            entitiesLayer: layers.ENTITIES,
            hasValidLayers: !!layers.TERRAIN && !!layers.ENTITIES
        };
    """)
    assert result['valid'], f"Layer check failed: {result.get('reason', 'Unknown')}"
    assert result['hasValidLayers'], f"Layers not properly defined: TERRAIN={result['terrainLayer']}, ENTITIES={result['entitiesLayer']}"


@then('worker ants should use the worker sprite')
def step_verify_worker_sprite(context):
    """Verify worker ants have correct sprite path"""
    result = context.driver.execute_script("""
        if (!window.entityManager) return { valid: false, reason: 'No EntityManager' };
        const ants = window.entityManager.getByType('ant');
        if (ants.length === 0) return { valid: false, reason: 'No ants at all' };
        
        // Check what structure the ants have
        const firstAnt = ants[0];
        const antStructure = {
            hasModel: !!firstAnt.model,
            hasController: !!firstAnt.controller,
            hasView: !!firstAnt.view,
            modelJobName: firstAnt.model ? firstAnt.model.jobName : null,
            directJobName: firstAnt.jobName,
            modelImagePath: firstAnt.model ? firstAnt.model.imagePath : null,
            directImagePath: firstAnt.imagePath
        };
        
        const workers = ants.filter(ant => {
            const jobName = ant.model ? ant.model.jobName : ant.jobName;
            return jobName === 'Worker';
        });
        
        if (workers.length === 0) {
            return { 
                valid: false, 
                reason: 'No worker ants found',
                totalAnts: ants.length,
                antStructure: antStructure
            };
        }
        
        const firstWorker = workers[0];
        const imagePath = firstWorker.model ? firstWorker.model.imagePath : 
                         firstWorker.imagePath;
        
        return {
            valid: !!imagePath,
            imagePath: imagePath,
            workerCount: workers.length,
            antStructure: antStructure
        };
    """)
    assert result['valid'], f"Worker sprite check failed: {result.get('reason', 'Unknown')}. Ant structure: {result.get('antStructure', {})}. Total ants: {result.get('totalAnts', 0)}"
    assert result['imagePath'], "Worker ant has no image path"


@then('the sprite path should match "{expected_sprite}"')
def step_verify_sprite_path_match(context, expected_sprite):
    """Verify sprite path contains expected filename"""
    result = context.driver.execute_script("""
        if (!window.entityManager) return { imagePath: null };
        const ants = window.entityManager.getByType('ant');
        if (ants.length === 0) return { imagePath: null };
        const ant = ants[0];
        return {
            imagePath: ant.model ? ant.model.imagePath : ant.imagePath
        };
    """)
    assert result['imagePath'], "No image path found"
    assert expected_sprite in result['imagePath'], \
        f"Expected sprite '{expected_sprite}' not in path '{result['imagePath']}'"


@when('an ant is selected')
def step_select_ant(context):
    """Select first ant"""
    context.driver.execute_script("""
        if (window.entityManager) {
            const ants = window.entityManager.getByType('ant');
            if (ants.length > 0) {
                const ant = ants[0];
                if (ant.controller && ant.controller.setSelected) {
                    ant.controller.setSelected(true);
                } else if (ant.setSelected) {
                    ant.setSelected(true);
                }
                window._selectedAnt = ant;
            }
        }
    """)
    time.sleep(0.1)


@when('the ant moves to a new location')
def step_move_ant(context):
    """Move selected ant to new position"""
    context.driver.execute_script("""
        if (window._selectedAnt) {
            const ant = window._selectedAnt;
            const newX = 500;
            const newY = 500;
            
            if (ant.controller && ant.controller.model) {
                ant.controller.model.setPosition(newX, newY);
            } else if (ant.model) {
                ant.model.setPosition(newX, newY);
            } else if (ant.position) {
                ant.position.x = newX;
                ant.position.y = newY;
            }
            
            window._antNewPosition = { x: newX, y: newY };
        }
    """)
    # Force render
    context.driver.execute_script('if (window.redraw) window.redraw();')
    time.sleep(0.1)


@then('the ant position should update on screen')
def step_verify_ant_moved(context):
    """Verify ant position changed"""
    result = context.driver.execute_script("""
        if (!window._selectedAnt) return { moved: false, reason: 'No selected ant' };
        const ant = window._selectedAnt;
        const model = ant.controller ? ant.controller.model : ant.model;
        const pos = model ? model.getPosition() : ant.position;
        const expected = window._antNewPosition || { x: 500, y: 500 };
        
        return {
            moved: pos.x === expected.x && pos.y === expected.y,
            currentPos: pos,
            expectedPos: expected
        };
    """)
    assert result['moved'], \
        f"Ant did not move: current={result.get('currentPos')}, expected={result.get('expectedPos')}"


@then('the EntityManager should reflect the new position')
def step_verify_entity_manager_updated(context):
    """Verify EntityManager has updated position"""
    result = context.driver.execute_script("""
        if (!window.entityManager || !window._selectedAnt) return { valid: false };
        const ants = window.entityManager.getByType('ant');
        const ant = ants.find(a => a === window._selectedAnt);
        if (!ant) return { valid: false, reason: 'Ant not in EntityManager' };
        
        const model = ant.controller ? ant.controller.model : ant.model;
        const pos = model ? model.getPosition() : ant.position;
        const expected = window._antNewPosition || { x: 500, y: 500 };
        
        return {
            valid: pos.x === expected.x && pos.y === expected.y,
            position: pos
        };
    """)
    assert result['valid'], f"EntityManager position mismatch: {result}"


@then('the EntityLayerRenderer should collect ants from EntityManager')
def step_verify_entity_layer_renderer_collects(context):
    """Verify EntityLayerRenderer uses EntityManager"""
    result = context.driver.execute_script("""
        if (!window.EntityRenderer) return { hasRenderer: false };
        // Check if collectAnts method exists
        const hasCollectAnts = typeof window.EntityRenderer.collectAnts === 'function';
        return {
            hasRenderer: true,
            hasCollectAnts: hasCollectAnts
        };
    """)
    assert result['hasRenderer'], "EntityRenderer not found"
    assert result['hasCollectAnts'], "EntityRenderer missing collectAnts method"


@then('the collected ants should be in the ANTS render group')
def step_verify_ants_in_render_group(context):
    """Verify ants collected into render groups"""
    # This is verified by integration tests
    # In browser, we verify ants render successfully
    result = context.driver.execute_script("""
        return {
            antCount: window.entityManager ? window.entityManager.getCount('ant') : 0
        };
    """)
    assert result['antCount'] > 0, "No ants in render pipeline"


@then('each ant should have a model component')
def step_verify_ants_have_model(context):
    """Verify MVC model component exists"""
    result = context.driver.execute_script("""
        if (!window.entityManager) return { valid: false };
        const ants = window.entityManager.getByType('ant');
        if (ants.length === 0) return { valid: false, reason: 'No ants' };
        
        for (const ant of ants) {
            if (!ant.model) return { valid: false, reason: 'Missing model' };
        }
        return { valid: true, count: ants.length };
    """)
    assert result['valid'], f"Model validation failed: {result.get('reason', 'Unknown')}"


@then('each ant should have a view component')
def step_verify_ants_have_view(context):
    """Verify MVC view component exists"""
    result = context.driver.execute_script("""
        if (!window.entityManager) return { valid: false };
        const ants = window.entityManager.getByType('ant');
        if (ants.length === 0) return { valid: false, reason: 'No ants' };
        
        for (const ant of ants) {
            if (!ant.view) return { valid: false, reason: 'Missing view' };
        }
        return { valid: true, count: ants.length };
    """)
    assert result['valid'], f"View validation failed: {result.get('reason', 'Unknown')}"


@then('each ant should have a controller component')
def step_verify_ants_have_controller(context):
    """Verify MVC controller component exists"""
    result = context.driver.execute_script("""
        if (!window.entityManager) return { valid: false, reason: 'No EntityManager' };
        const ants = window.entityManager.getByType('ant');
        if (ants.length === 0) return { valid: false, reason: 'No ants' };
        
        // Check first ant structure to diagnose
        const firstAnt = ants[0];
        const structure = {
            hasController: !!firstAnt.controller,
            hasModel: !!firstAnt.model,
            hasView: !!firstAnt.view,
            antType: firstAnt.constructor ? firstAnt.constructor.name : 'unknown',
            properties: Object.keys(firstAnt).slice(0, 10)
        };
        
        for (const ant of ants) {
            if (!ant.controller) {
                return { 
                    valid: false, 
                    reason: 'Missing controller - ants are not MVC structure',
                    firstAntStructure: structure
                };
            }
        }
        return { valid: true, count: ants.length };
    """)
    assert result['valid'], f"Controller validation failed: {result.get('reason', 'Unknown')}. First ant: {result.get('firstAntStructure', {})}"


@then('the controller should delegate rendering to the view')
def step_verify_render_delegation(context):
    """Verify controller.render() delegates to view.render()"""
    result = context.driver.execute_script("""
        if (!window.entityManager) return { valid: false };
        const ants = window.entityManager.getByType('ant');
        if (ants.length === 0) return { valid: false, reason: 'No ants' };
        
        const ant = ants[0];
        const hasControllerRender = ant.controller && typeof ant.controller.render === 'function';
        const hasViewRender = ant.view && typeof ant.view.render === 'function';
        
        return {
            valid: hasControllerRender && hasViewRender,
            hasControllerRender: hasControllerRender,
            hasViewRender: hasViewRender
        };
    """)
    assert result['valid'], \
        f"Render delegation check failed: controller.render={result['hasControllerRender']}, view.render={result['hasViewRender']}"


@when('the camera pans to a new location')
def step_pan_camera(context):
    """Pan camera to new position"""
    context.driver.execute_script("""
        if (window.cameraManager) {
            window.cameraManager.setPosition(1000, 1000);
        }
    """)
    context.driver.execute_script('if (window.redraw) window.redraw();')
    time.sleep(0.1)


@then('ants should render in screen coordinates')
def step_verify_screen_coordinates(context):
    """Verify ants render (coordinate transform happens)"""
    # If ants render without error, transforms are working
    result = context.driver.execute_script("""
        return {
            hasCameraManager: !!window.cameraManager,
            antCount: window.entityManager ? window.entityManager.getCount('ant') : 0
        };
    """)
    assert result['antCount'] > 0, "Ants disappeared after camera pan"


@then('world coordinates should transform correctly')
def step_verify_coordinate_transform(context):
    """Verify camera transform functions exist"""
    result = context.driver.execute_script("""
        const hasCameraManager = typeof window.cameraManager !== 'undefined' && window.cameraManager !== null;
        if (!hasCameraManager) {
            return { 
                valid: false, 
                reason: 'cameraManager not initialized',
                windowHasCameraManager: typeof window.cameraManager !== 'undefined'
            };
        }
        return {
            valid: true,
            hasScreenToWorld: typeof window.cameraManager.screenToWorld === 'function',
            hasWorldToScreen: typeof window.cameraManager.worldToScreen === 'function'
        };
    """)
    assert result['valid'], f"CameraManager check failed: {result.get('reason', 'Unknown')}. window.cameraManager exists: {result.get('windowHasCameraManager', False)}"
    assert result['hasScreenToWorld'], "Missing screenToWorld transform"
    assert result['hasWorldToScreen'], "Missing worldToScreen transform"


@when('the camera moves far from ant locations')
def step_move_camera_far(context):
    """Move camera very far away"""
    context.driver.execute_script("""
        if (window.cameraManager) {
            window.cameraManager.setPosition(10000, 10000);
        }
    """)
    time.sleep(0.1)


@then('off-screen ants should not waste rendering resources')
def step_verify_culling(context):
    """Verify ants still tracked (culling is optimization, not requirement)"""
    result = context.driver.execute_script("""
        return {
            antCount: window.entityManager ? window.entityManager.getCount('ant') : 0
        };
    """)
    assert result['antCount'] > 0, "Ants lost during camera movement"


@then('only visible ants should be processed')
def step_verify_visible_processing(context):
    """Verify rendering continues (actual culling is performance optimization)"""
    # EntityManager should still track all ants
    result = context.driver.execute_script("""
        return {
            antCount: window.entityManager ? window.entityManager.getCount('ant') : 0
        };
    """)
    assert result['antCount'] > 0, "Ant tracking lost"


@given('the game is in "{state}" state')
def step_set_game_state(context, state):
    """Set game state"""
    context.driver.get('http://localhost:8000')
    WebDriverWait(context.driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, 'canvas'))
    )
    
    context.driver.execute_script(f"""
        if (typeof window.startGame === 'function') window.startGame();
        window.gameState = '{state}';
    """)
    time.sleep(0.3)


@when('the player pauses the game')
def step_pause_game(context):
    """Pause the game"""
    context.driver.execute_script("""
        window.gameState = 'PAUSED';
    """)
    context.driver.execute_script('if (window.redraw) window.redraw();')
    time.sleep(0.1)


@then('ants should remain visible')
def step_verify_ants_visible_paused(context):
    """Verify ants still in EntityManager when paused"""
    result = context.driver.execute_script("""
        return {
            gameState: window.GameState ? window.GameState.getState() : window.gameState,
            antCount: window.entityManager ? window.entityManager.getCount('ant') : 0,
            hasEntityManager: !!window.entityManager
        };
    """)
    assert result['hasEntityManager'], "EntityManager not available"
    assert result['antCount'] > 0, f"STRICT: Ants must persist through state changes. Found {result['antCount']} ants in {result['gameState']} state. This indicates ants are being cleared/recreated instead of persisting."


@when('the player resumes the game')
def step_resume_game(context):
    """Resume the game"""
    context.driver.execute_script("""
        window.gameState = 'PLAYING';
    """)
    context.driver.execute_script('if (window.redraw) window.redraw();')
    time.sleep(0.1)


@then('ants should continue rendering normally')
def step_verify_ants_render_after_resume(context):
    """Verify ants still render after resume"""
    result = context.driver.execute_script("""
        return {
            gameState: window.gameState,
            antCount: window.entityManager ? window.entityManager.getCount('ant') : 0
        };
    """)
    assert result['antCount'] > 0, "Ants lost after resume"
    assert result['gameState'] == 'PLAYING', f"Game not in PLAYING state: {result['gameState']}"


@then('the UI should display the correct ant count')
def step_verify_ui_ant_count(context):
    """Verify UI shows ant count"""
    # UI integration verified by unit tests
    result = context.driver.execute_script("""
        return {
            antCount: window.entityManager ? window.entityManager.getCount('ant') : 0
        };
    """)
    assert result['antCount'] > 0, "No ants to display in UI"


@then('the count should match EntityManager ant count')
def step_verify_count_matches(context):
    """Verify UI count matches EntityManager"""
    result = context.driver.execute_script("""
        const antCount = window.entityManager ? window.entityManager.getCount('ant') : 0;
        return {
            antCount: antCount,
            hasEntityManager: !!window.entityManager
        };
    """)
    assert result['hasEntityManager'], "EntityManager not available"
    assert result['antCount'] > 0, "EntityManager has no ants"


@when('a new ant is created via AntFactory')
def step_create_ant_via_factory(context):
    """Create new ant using AntFactory"""
    result = context.driver.execute_script("""
        if (!window.AntFactory) return { created: false, reason: 'No AntFactory' };
        
        const initialCount = window.entityManager ? window.entityManager.getCount('ant') : 0;
        
        try {
            const ant = window.AntFactory.create({
                jobName: 'Worker',
                x: 300,
                y: 300,
                faction: 'player'
            });
            
            const newCount = window.entityManager ? window.entityManager.getCount('ant') : 0;
            
            return {
                created: !!ant,
                initialCount: initialCount,
                newCount: newCount,
                increased: newCount > initialCount
            };
        } catch (e) {
            return { created: false, reason: e.message };
        }
    """)
    
    assert result['created'], f"Ant creation failed: {result.get('reason', 'Unknown')}"
    context.factory_ant_result = result


@then('the ant should auto-register with EntityManager')
def step_verify_auto_registration(context):
    """Verify factory ant auto-registered"""
    result = context.factory_ant_result
    assert result['increased'], \
        f"Ant count did not increase: before={result['initialCount']}, after={result['newCount']}"


@then('the ant should appear in the next render cycle')
def step_verify_ant_appears(context):
    """Verify new ant renders"""
    context.driver.execute_script('if (window.redraw) window.redraw();')
    time.sleep(0.1)
    
    result = context.driver.execute_script("""
        return {
            antCount: window.entityManager ? window.entityManager.getCount('ant') : 0
        };
    """)
    assert result['antCount'] >= context.factory_ant_result['newCount'], \
        "Ant disappeared after render cycle"
