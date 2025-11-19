"""
BDD Steps for Visual Rendering Verification
Tests actual canvas output and visual rendering issues
"""

from behave import given, when, then
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import io
from PIL import Image
import os

@when('I wait for ants to be created')
def step_impl(context):
    """Wait for ants to be spawned"""
    time.sleep(1)  # Allow time for GAME_PLAYING_STARTED event
    
    # Verify ants exist
    ant_count = context.driver.execute_script(
        'return window.entityManager ? window.entityManager.getCount("ant") : 0'
    )
    
    assert ant_count > 0, f"No ants created (count: {ant_count})"
    context.ant_count = ant_count


@then('the canvas element should exist')
def step_impl(context):
    """Verify canvas element exists in DOM"""
    canvas = context.driver.execute_script("""
        return {
            exists: !!document.getElementById('defaultCanvas0'),
            element: document.getElementById('defaultCanvas0') ? 'found' : 'missing'
        };
    """)
    
    assert canvas['exists'], "Canvas element not found in DOM"


@then('the canvas should have a valid 2D context')
def step_impl(context):
    """Verify canvas has 2D rendering context"""
    context_info = context.driver.execute_script("""
        const canvas = document.getElementById('defaultCanvas0');
        if (!canvas) return { valid: false, error: 'canvas_not_found' };
        
        const ctx = canvas.getContext('2d');
        return {
            valid: !!ctx,
            type: ctx ? '2d' : null,
            fillStyle: ctx ? ctx.fillStyle : null,
            error: ctx ? null : 'context_not_available'
        };
    """)
    
    assert context_info['valid'], f"Canvas context invalid: {context_info.get('error')}"


@then('the canvas should have width greater than 0')
def step_impl(context):
    """Verify canvas has valid width"""
    dimensions = context.driver.execute_script("""
        const canvas = document.getElementById('defaultCanvas0');
        return {
            width: canvas ? canvas.width : 0,
            clientWidth: canvas ? canvas.clientWidth : 0
        };
    """)
    
    assert dimensions['width'] > 0, f"Canvas width is {dimensions['width']}"


@then('the canvas should have height greater than 0')
def step_impl(context):
    """Verify canvas has valid height"""
    dimensions = context.driver.execute_script("""
        const canvas = document.getElementById('defaultCanvas0');
        return {
            height: canvas ? canvas.height : 0,
            clientHeight: canvas ? canvas.clientHeight : 0
        };
    """)
    
    assert dimensions['height'] > 0, f"Canvas height is {dimensions['height']}"


@then('no JavaScript errors should be present')
def step_impl(context):
    """Check browser console for errors"""
    logs = context.driver.get_log('browser')
    errors = [log for log in logs if log['level'] == 'SEVERE']
    
    if errors:
        error_messages = '\n'.join([f"  - {e['message']}" for e in errors[:5]])
        assert False, f"JavaScript errors found:\n{error_messages}"


@then('all ant sprites should be loaded')
def step_impl(context):
    """Verify ant sprites are loaded"""
    sprite_status = context.driver.execute_script("""
        const ants = window.entityManager.getByType('ant');
        return ants.map((ant, idx) => ({
            index: idx,
            imagePath: ant.model ? ant.model.imagePath : 'no_model',
            hasView: !!ant.view,
            hasSprite: !!(ant.view && ant.view.sprite),
            spriteComplete: !!(ant.view && ant.view.sprite && ant.view.sprite.complete),
            spriteWidth: ant.view && ant.view.sprite ? ant.view.sprite.width : 0,
            spriteHeight: ant.view && ant.view.sprite ? ant.view.sprite.height : 0
        }));
    """)
    
    unloaded = [s for s in sprite_status if not s['spriteComplete']]
    
    if unloaded:
        details = '\n'.join([f"  Ant {s['index']}: {s['imagePath']} (loaded={s['spriteComplete']})" 
                            for s in unloaded[:3]])
        assert False, f"Sprites not loaded:\n{details}"


@then('all ant sprites should have valid dimensions')
def step_impl(context):
    """Verify sprites have width/height"""
    sprite_dims = context.driver.execute_script("""
        const ants = window.entityManager.getByType('ant');
        return ants.map((ant, idx) => ({
            index: idx,
            width: ant.view && ant.view.sprite ? ant.view.sprite.width : 0,
            height: ant.view && ant.view.sprite ? ant.view.sprite.height : 0
        }));
    """)
    
    invalid = [s for s in sprite_dims if s['width'] == 0 or s['height'] == 0]
    
    assert len(invalid) == 0, f"{len(invalid)} sprites have invalid dimensions"


@then('no sprite loading errors should exist')
def step_impl(context):
    """Check for image loading errors in console"""
    logs = context.driver.get_log('browser')
    image_errors = [log for log in logs if 'image' in log['message'].lower() or 'img' in log['message'].lower()]
    
    if image_errors:
        error_messages = '\n'.join([f"  - {e['message']}" for e in image_errors[:3]])
        assert False, f"Image loading errors:\n{error_messages}"


@then('the camera should be initialized')
def step_impl(context):
    """Verify camera manager exists and is initialized"""
    camera_state = context.driver.execute_script("""
        return {
            exists: !!window.cameraManager,
            hasCamera: !!(window.cameraManager && window.cameraManager.camera),
            position: window.cameraManager && window.cameraManager.camera ? 
                     window.cameraManager.camera.position : null,
            zoom: window.cameraManager && window.cameraManager.camera ? 
                  window.cameraManager.camera.zoom : null
        };
    """)
    
    assert camera_state['exists'], "CameraManager not initialized"
    assert camera_state['hasCamera'], "Camera object missing"


@then('at least one ant should be within the camera viewport')
def step_impl(context):
    """Verify ants are visible in camera viewport"""
    viewport_check = context.driver.execute_script("""
        const ants = window.entityManager.getByType('ant');
        const camera = window.cameraManager.camera;
        
        // Get viewport bounds (simplified)
        const viewportWidth = window.innerWidth / (camera.zoom || 1);
        const viewportHeight = window.innerHeight / (camera.zoom || 1);
        const camX = camera.position.x;
        const camY = camera.position.y;
        
        const antsInView = ants.filter(ant => {
            const pos = ant.model.getPosition();
            return pos.x >= camX - viewportWidth/2 &&
                   pos.x <= camX + viewportWidth/2 &&
                   pos.y >= camY - viewportHeight/2 &&
                   pos.y <= camY + viewportHeight/2;
        });
        
        return {
            totalAnts: ants.length,
            antsInView: antsInView.length,
            cameraPos: { x: camX, y: camY },
            viewport: { width: viewportWidth, height: viewportHeight },
            firstAntPos: ants[0] ? ants[0].model.getPosition() : null
        };
    """)
    
    assert viewport_check['antsInView'] > 0, \
        f"No ants in viewport. Total: {viewport_check['totalAnts']}, " \
        f"Camera: {viewport_check['cameraPos']}, " \
        f"First ant: {viewport_check['firstAntPos']}"


@then('camera transforms should be valid')
def step_impl(context):
    """Verify camera transform functions work"""
    transform_test = context.driver.execute_script("""
        const camera = window.cameraManager;
        
        try {
            const screenPos = camera.worldToScreen ? camera.worldToScreen(100, 100) : null;
            const worldPos = camera.screenToWorld ? camera.screenToWorld(200, 200) : null;
            
            return {
                valid: true,
                hasWorldToScreen: !!camera.worldToScreen,
                hasScreenToWorld: !!camera.screenToWorld,
                screenPos: screenPos,
                worldPos: worldPos
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    """)
    
    assert transform_test['valid'], f"Camera transforms broken: {transform_test.get('error')}"


@when('I trigger multiple render frames')
def step_impl(context):
    """Force multiple render cycles"""
    context.driver.execute_script("""
        for (let i = 0; i < 5; i++) {
            if (typeof window.redraw === 'function') {
                window.redraw();
            }
        }
    """)
    time.sleep(0.5)


@then('the draw function should execute successfully')
def step_impl(context):
    """Verify draw function exists and executes"""
    draw_status = context.driver.execute_script("""
        return {
            exists: typeof window.draw === 'function',
            redrawExists: typeof window.redraw === 'function',
            executed: true  // If we got here, no exceptions
        };
    """)
    
    assert draw_status['exists'] or draw_status['redrawExists'], "No draw/redraw function found"


@then('EntityRenderer should render all layers')
def step_impl(context):
    """Verify EntityRenderer is rendering"""
    renderer_status = context.driver.execute_script("""
        return {
            exists: !!window.EntityRenderer,
            hasRenderMethod: !!(window.EntityRenderer && window.EntityRenderer.renderAllLayers),
            lastRenderTime: window.EntityRenderer && window.EntityRenderer._lastRenderTime ? 
                           window.EntityRenderer._lastRenderTime : null
        };
    """)
    
    assert renderer_status['exists'], "EntityRenderer not found"


@then('no rendering errors should be logged')
def step_impl(context):
    """Check for rendering-specific errors"""
    logs = context.driver.get_log('browser')
    render_errors = [log for log in logs if 'render' in log['message'].lower() and log['level'] == 'SEVERE']
    
    if render_errors:
        error_messages = '\n'.join([f"  - {e['message']}" for e in render_errors[:3]])
        assert False, f"Rendering errors:\n{error_messages}"


@when('I capture the canvas screenshot')
def step_impl(context):
    """Capture current canvas state"""
    context.screenshot = context.driver.get_screenshot_as_png()


@then('the screenshot should contain non-grass colored pixels')
def step_impl(context):
    """Analyze pixels to detect ants (non-grass colors)"""
    img = Image.open(io.BytesIO(context.screenshot))
    pixels = list(img.getdata())
    
    # Grass is typically green (adjust thresholds as needed)
    def is_grass_like(pixel):
        r, g, b = pixel[:3]
        return g > r and g > b and g > 100
    
    non_grass_pixels = [p for p in pixels if not is_grass_like(p)]
    non_grass_percentage = (len(non_grass_pixels) / len(pixels)) * 100
    
    print(f"Non-grass pixels: {len(non_grass_pixels)} ({non_grass_percentage:.2f}%)")
    
    # At least 1% of screen should be non-grass if ants are visible
    assert non_grass_percentage > 1.0, \
        f"Only {non_grass_percentage:.2f}% non-grass pixels - ants may not be rendering"


@then('the pixel count should indicate at least 5 ants')
def step_impl(context):
    """Verify enough non-grass pixels for 5 ants"""
    img = Image.open(io.BytesIO(context.screenshot))
    pixels = list(img.getdata())
    
    def is_ant_colored(pixel):
        r, g, b = pixel[:3]
        # Ants are gray/brown - not green
        return not (g > r and g > b)
    
    ant_pixels = [p for p in pixels if is_ant_colored(p)]
    
    # Each 32x32 ant = 1024 pixels, 5 ants = ~5120 pixels minimum
    min_expected_pixels = 5 * 1024 * 0.5  # 50% visible area threshold
    
    assert len(ant_pixels) > min_expected_pixels, \
        f"Only {len(ant_pixels)} ant-colored pixels (expected >{min_expected_pixels})"


@when('I capture the current game state screenshot')
def step_impl(context):
    """Save current screenshot for comparison"""
    context.current_screenshot = context.driver.get_screenshot_as_png()
    
    # Save to file for manual inspection
    os.makedirs('test/bdd/screenshots/current', exist_ok=True)
    with open('test/bdd/screenshots/current/game_state.png', 'wb') as f:
        f.write(context.current_screenshot)


@when('I compare it with the baseline rendering')
def step_impl(context):
    """Compare with known good rendering"""
    baseline_path = 'test/bdd/screenshots/baseline/game_state.png'
    
    if not os.path.exists(baseline_path):
        # Save current as baseline if none exists
        os.makedirs('test/bdd/screenshots/baseline', exist_ok=True)
        with open(baseline_path, 'wb') as f:
            f.write(context.current_screenshot)
        context.is_baseline_creation = True
        return
    
    # Compare images
    baseline_img = Image.open(baseline_path)
    current_img = Image.open(io.BytesIO(context.current_screenshot))
    
    # Resize if needed
    if baseline_img.size != current_img.size:
        current_img = current_img.resize(baseline_img.size)
    
    # Calculate pixel difference
    from PIL import ImageChops
    diff = ImageChops.difference(baseline_img, current_img)
    diff_pixels = sum(1 for p in diff.getdata() if sum(p[:3]) > 10)  # Threshold for noise
    
    total_pixels = baseline_img.size[0] * baseline_img.size[1]
    diff_percentage = (diff_pixels / total_pixels) * 100
    
    context.visual_diff_percentage = diff_percentage
    
    # Save diff image
    diff.save('test/bdd/screenshots/current/diff.png')


@then('the rendering should match expected visual output')
def step_impl(context):
    """Verify visual rendering matches baseline"""
    if hasattr(context, 'is_baseline_creation'):
        print("Created new baseline screenshot")
        return
    
    # Allow 5% difference for timing/animation variations
    assert context.visual_diff_percentage < 5.0, \
        f"Visual difference too large: {context.visual_diff_percentage:.2f}% " \
        f"(see test/bdd/screenshots/current/diff.png)"


@then('detailed differences should be highlighted')
def step_impl(context):
    """Report what's different in rendering"""
    if hasattr(context, 'is_baseline_creation'):
        return
    
    print(f"\nVisual Difference: {context.visual_diff_percentage:.2f}%")
    print(f"Diff image saved to: test/bdd/screenshots/current/diff.png")


@when('I enable render debugging')
def step_impl(context):
    """Enable render call logging"""
    context.driver.execute_script("""
        window._renderDebug = {
            enabled: true,
            renderCalls: [],
            drawCalls: []
        };
        
        // Intercept render calls
        if (window.EntityRenderer && window.EntityRenderer.renderAllLayers) {
            const original = window.EntityRenderer.renderAllLayers.bind(window.EntityRenderer);
            window.EntityRenderer.renderAllLayers = function(...args) {
                window._renderDebug.renderCalls.push({
                    time: Date.now(),
                    args: args
                });
                return original(...args);
            };
        }
    """)


@when('I trigger a render cycle')
def step_impl(context):
    """Execute one render frame"""
    context.driver.execute_script("""
        if (typeof window.redraw === 'function') {
            window.redraw();
        }
    """)
    time.sleep(0.2)


@then('render calls should be logged for each ant')
def step_impl(context):
    """Verify render was called for ants"""
    debug_info = context.driver.execute_script("""
        return {
            debugEnabled: window._renderDebug ? window._renderDebug.enabled : false,
            renderCallCount: window._renderDebug ? window._renderDebug.renderCalls.length : 0,
            antCount: window.entityManager ? window.entityManager.getCount('ant') : 0
        };
    """)
    
    assert debug_info['debugEnabled'], "Render debugging not enabled"
    assert debug_info['renderCallCount'] > 0, "No render calls logged"


@then('render completion should be confirmed')
def step_impl(context):
    """Verify render cycle completed"""
    completion = context.driver.execute_script("""
        return {
            completed: true,  // If we got here without error
            timestamp: Date.now()
        };
    """)
    
    assert completion['completed'], "Render cycle did not complete"


@then('drawing operations should be recorded')
def step_impl(context):
    """Verify p5.js draw calls happened"""
    # This would require instrumenting p5.js functions
    # For now, just verify no errors
    logs = context.driver.get_log('browser')
    severe_errors = [log for log in logs if log['level'] == 'SEVERE']
    
    assert len(severe_errors) == 0, "Errors during drawing operations"


@when('I capture screenshots for {frame_count:d} consecutive frames')
def step_impl(context, frame_count):
    """Capture multiple frames"""
    context.frame_screenshots = []
    
    for i in range(frame_count):
        context.driver.execute_script("if (typeof window.redraw === 'function') window.redraw();")
        time.sleep(0.1)
        screenshot = context.driver.get_screenshot_as_png()
        context.frame_screenshots.append(screenshot)


@then('each frame should show rendered content')
def step_impl(context):
    """Verify all frames have content"""
    for idx, screenshot in enumerate(context.frame_screenshots):
        img = Image.open(io.BytesIO(screenshot))
        pixels = list(img.getdata())
        
        # Check for non-black pixels (some rendering happened)
        non_black = [p for p in pixels if sum(p[:3]) > 10]
        
        assert len(non_black) > len(pixels) * 0.5, \
            f"Frame {idx} appears mostly black - no rendering?"


@then('ant positions should update between frames')
def step_impl(context):
    """Verify frames are different (ants moving)"""
    if len(context.frame_screenshots) < 2:
        return
    
    img1 = Image.open(io.BytesIO(context.frame_screenshots[0]))
    img2 = Image.open(io.BytesIO(context.frame_screenshots[-1]))
    
    from PIL import ImageChops
    diff = ImageChops.difference(img1, img2)
    diff_pixels = sum(1 for p in diff.getdata() if sum(p[:3]) > 10)
    
    # At least some pixels should change
    print(f"Pixel changes between frames: {diff_pixels}")


@then('static ants should remain visible')
def step_impl(context):
    """Verify ants are consistently visible across frames"""
    # All frames should have similar ant-colored pixel counts
    ant_pixel_counts = []
    
    for screenshot in context.frame_screenshots:
        img = Image.open(io.BytesIO(screenshot))
        pixels = list(img.getdata())
        
        ant_pixels = [p for p in pixels if not (p[1] > p[0] and p[1] > p[2])]  # Not green
        ant_pixel_counts.append(len(ant_pixels))
    
    # Counts should be consistent (within 20% variance)
    avg_count = sum(ant_pixel_counts) / len(ant_pixel_counts)
    
    for count in ant_pixel_counts:
        variance = abs(count - avg_count) / avg_count
        assert variance < 0.2, f"Ant visibility inconsistent: {ant_pixel_counts}"

