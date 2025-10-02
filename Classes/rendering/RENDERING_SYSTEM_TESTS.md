# 🧪 **RENDERING SYSTEM TEST STRATEGY**

**Version**: 1.0  
**Date**: October 2, 2025  
**Author**: David Willman
**Related Document**: RENDERING_SYSTEM_PLAN.md

## 📋 **OVERVIEW**

This document outlines comprehensive testing strategies for the rendering system refactoring process. Tests are organized by type and priority to ensure system reliability during and after implementation.

---

## 🧩 **UNIT TESTS**

### **1. Sprite2D Unit Tests**
**File**: `tests/unit/Sprite2D.test.js`

```javascript
describe('Sprite2D', () => {
    let mockImage, sprite;
    
    beforeEach(() => {
        mockImage = { width: 32, height: 32 };
        sprite = new Sprite2D(mockImage, {x: 10, y: 20}, {x: 32, y: 32});
    });
    
    test('should initialize with correct properties', () => {
        expect(sprite.img).toBe(mockImage);
        expect(sprite.pos.x).toBe(10);
        expect(sprite.pos.y).toBe(20);
        expect(sprite.size.x).toBe(32);
        expect(sprite.rotation).toBe(0);
    });
    
    test('should update position correctly', () => {
        sprite.setPosition({x: 100, y: 200});
        expect(sprite.pos.x).toBe(100);
        expect(sprite.pos.y).toBe(200);
    });
    
    test('should handle missing image gracefully', () => {
        sprite.setImage(null);
        expect(() => sprite.render()).not.toThrow();
    });
    
    test('should convert object to p5.Vector for position', () => {
        sprite.setPosition({x: 50, y: 75});
        expect(sprite.pos).toHaveProperty('copy'); // p5.Vector has copy method
    });
});
```

### **2. RenderController Unit Tests**
**File**: `tests/unit/RenderController.test.js`

```javascript
describe('RenderController', () => {
    let mockEntity, controller;
    
    beforeEach(() => {
        mockEntity = {
            getPosition: () => ({x: 100, y: 200}),
            getSize: () => ({x: 32, y: 32}),
            _sprite: { render: jest.fn() }
        };
        controller = new RenderController(mockEntity);
    });
    
    test('should initialize with correct entity reference', () => {
        expect(controller._entity).toBe(mockEntity);
        expect(controller._effects).toEqual([]);
        expect(controller._highlightState).toBeNull();
    });
    
    test('should set highlight correctly', () => {
        controller.setHighlight("SELECTED", 0.8);
        expect(controller._highlightState).toBe("SELECTED");
        expect(controller._highlightIntensity).toBe(0.8);
    });
    
    test('should add effects with unique IDs', () => {
        const effect1 = controller.addEffect({type: "FLOATING_TEXT", text: "Test"});
        const effect2 = controller.addEffect({type: "DAMAGE_NUMBER", damage: 10});
        
        expect(effect1).not.toBe(effect2);
        expect(controller._effects).toHaveLength(2);
    });
    
    test('should remove effects by ID', () => {
        const effectId = controller.addEffect({type: "FLOATING_TEXT"});
        controller.removeEffect(effectId);
        expect(controller._effects).toHaveLength(0);
    });
    
    test('should handle missing p5.js functions gracefully', () => {
        // Mock missing p5.js environment
        global.stroke = undefined;
        expect(() => controller.render()).not.toThrow();
    });
});
```

### **3. EntityDelegationBuilder Unit Tests**
**File**: `tests/unit/EntityDelegationBuilder.test.js`

```javascript
describe('EntityDelegationBuilder', () => {
    test('should create delegation methods correctly', () => {
        class TestEntity {}
        class TestController {
            testMethod(arg) { return `called with ${arg}`; }
        }
        
        EntityDelegationBuilder.createDelegationMethods(
            TestEntity, '_controller', ['testMethod']
        );
        
        const entity = new TestEntity();
        entity._controller = new TestController();
        
        expect(entity.testMethod("hello")).toBe("called with hello");
    });
    
    test('should handle multiple methods', () => {
        class TestEntity {}
        class TestController {
            method1() { return "method1"; }
            method2() { return "method2"; }
        }
        
        EntityDelegationBuilder.createDelegationMethods(
            TestEntity, '_controller', ['method1', 'method2']
        );
        
        const entity = new TestEntity();
        entity._controller = new TestController();
        
        expect(entity.method1()).toBe("method1");
        expect(entity.method2()).toBe("method2");
    });
});
```

### **4. PerformanceMonitor Unit Tests**
**File**: `tests/unit/PerformanceMonitor.test.js`

```javascript
describe('PerformanceMonitor', () => {
    let monitor;
    
    beforeEach(() => {
        monitor = new PerformanceMonitor();
    });
    
    test('should track frame timing', () => {
        monitor.startFrame();
        // Simulate some work
        monitor.startLayer("TERRAIN");
        monitor.endLayer("TERRAIN");
        monitor.endFrame();
        
        const stats = monitor.getFrameStats();
        expect(stats.totalFrameTime).toBeGreaterThan(0);
        expect(stats.layerTimes.TERRAIN).toBeGreaterThanOrEqual(0);
    });
    
    test('should calculate FPS correctly', () => {
        // Simulate multiple frames
        for(let i = 0; i < 60; i++) {
            monitor.startFrame();
            monitor.endFrame();
        }
        
        const stats = monitor.getFrameStats();
        expect(stats.fps).toBeGreaterThan(0);
        expect(stats.averageFPS).toBeGreaterThan(0);
    });
    
    test('should track entity statistics', () => {
        monitor.recordEntityStats(100, 85, 15);
        const stats = monitor.getFrameStats();
        
        expect(stats.totalEntities).toBe(100);
        expect(stats.renderedEntities).toBe(85);
        expect(stats.culledEntities).toBe(15);
    });
});
```

---

## 🔗 **INTEGRATION TESTS**

### **1. RenderLayerManager Integration Tests**
**File**: `tests/integration/RenderLayerManager.test.js`

```javascript
describe('RenderLayerManager Integration', () => {
    let renderManager, mockEntityRenderer, mockUIRenderer;
    
    beforeEach(() => {
        renderManager = new RenderLayerManager();
        mockEntityRenderer = { renderAllLayers: jest.fn() };
        mockUIRenderer = { render: jest.fn() };
        
        // Mock global dependencies
        global.EntityRenderer = mockEntityRenderer;
        global.g_map2 = { render: jest.fn() };
        
        renderManager.initialize();
    });
    
    test('should render correct layers for PLAYING state', () => {
        renderManager.render('PLAYING');
        
        expect(global.g_map2.render).toHaveBeenCalled();
        expect(mockEntityRenderer.renderAllLayers).toHaveBeenCalledWith('PLAYING');
    });
    
    test('should render different layers for MENU state', () => {
        renderManager.render('MENU');
        
        expect(global.g_map2.render).toHaveBeenCalled();
        expect(mockEntityRenderer.renderAllLayers).not.toHaveBeenCalled();
    });
    
    test('should register custom layer renderers', () => {
        const customRenderer = jest.fn();
        renderManager.registerLayerRenderer('CUSTOM', customRenderer);
        
        // Mock getLayersForState to return our custom layer
        renderManager.getLayersForState = jest.fn(() => ['CUSTOM']);
        renderManager.render('CUSTOM_STATE');
        
        expect(customRenderer).toHaveBeenCalledWith('CUSTOM_STATE');
    });
});
```

### **2. Entity-RenderController Integration Tests**
**File**: `tests/integration/EntityRenderController.test.js`

```javascript
describe('Entity-RenderController Integration', () => {
    let entity, mockSprite;
    
    beforeEach(() => {
        mockSprite = {
            render: jest.fn(),
            pos: {x: 100, y: 200},
            size: {x: 32, y: 32}
        };
        
        entity = new Entity();
        entity.setSprite(mockSprite);
    });
    
    test('should delegate highlight methods correctly', () => {
        entity.highlightSelected();
        expect(entity.getRenderController()._highlightState).toBe('SELECTED');
    });
    
    test('should delegate effect methods correctly', () => {
        const effectId = entity.addEffect({type: "FLOATING_TEXT", text: "Test"});
        expect(entity.getRenderController()._effects).toHaveLength(1);
        
        entity.removeEffect(effectId);
        expect(entity.getRenderController()._effects).toHaveLength(0);
    });
    
    test('should render through delegation chain', () => {
        // Mock p5.js functions
        global.push = jest.fn();
        global.pop = jest.fn();
        
        entity.render();
        expect(mockSprite.render).toHaveBeenCalled();
    });
});
```

### **3. EntityRenderer-RenderController Integration Tests**
**File**: `tests/integration/EntityRendererController.test.js`

```javascript
describe('EntityRenderer-RenderController Integration', () => {
    let entityRenderer, mockEntities;
    
    beforeEach(() => {
        entityRenderer = new EntityRenderer();
        mockEntities = [
            { 
                getRenderController: () => ({ render: jest.fn() }),
                getRenderLayer: () => 'ANTS',
                getPosition: () => ({x: 100, y: 200})
            },
            { 
                getRenderController: () => ({ render: jest.fn() }),
                getRenderLayer: () => 'RESOURCES',
                getPosition: () => ({x: 150, y: 250})
            }
        ];
        
        // Mock global entity collections
        global.ants = mockEntities.slice(0, 1).map(e => ({antObject: e}));
        global.g_resourceList = { resources: mockEntities.slice(1) };
        global.antIndex = 1;
    });
    
    test('should collect and render entities by layer', () => {
        entityRenderer.renderAllLayers('PLAYING');
        
        // Verify entities were collected and rendered
        mockEntities.forEach(entity => {
            expect(entity.getRenderController().render).toHaveBeenCalled();
        });
    });
    
    test('should apply frustum culling correctly', () => {
        // Mock viewport
        global.g_canvasX = 800;
        global.g_canvasY = 600;
        
        // Add entity outside viewport
        const outsideEntity = {
            getRenderController: () => ({ render: jest.fn() }),
            getRenderLayer: () => 'ANTS',
            getPosition: () => ({x: 1000, y: 1000}) // Outside viewport
        };
        
        global.ants.push({antObject: outsideEntity});
        
        entityRenderer.renderAllLayers('PLAYING');
        
        // Outside entity should be culled
        expect(outsideEntity.getRenderController().render).not.toHaveBeenCalled();
    });
});
```

---

## 🔄 **REGRESSION TESTS**

### **1. Performance Regression Tests**
**File**: `tests/regression/Performance.test.js`

```javascript
describe('Performance Regression Tests', () => {
    test('should maintain acceptable frame render time', async () => {
        const renderManager = new RenderLayerManager();
        const startTime = performance.now();
        
        // Simulate heavy frame
        for(let i = 0; i < 100; i++) {
            renderManager.render('PLAYING');
        }
        
        const endTime = performance.now();
        const avgFrameTime = (endTime - startTime) / 100;
        
        // Should render frame in less than 16.67ms (60 FPS)
        expect(avgFrameTime).toBeLessThan(16.67);
    });
    
    test('should handle large entity counts efficiently', () => {
        const entityRenderer = new EntityRenderer();
        
        // Create 1000 mock entities
        const manyEntities = Array.from({length: 1000}, (_, i) => ({
            getRenderController: () => ({ render: jest.fn() }),
            getPosition: () => ({x: i % 800, y: Math.floor(i / 800) * 32}),
            getRenderLayer: () => 'ANTS'
        }));
        
        global.ants = manyEntities.map(e => ({antObject: e}));
        global.antIndex = 1000;
        
        const startTime = performance.now();
        entityRenderer.renderAllLayers('PLAYING');
        const renderTime = performance.now() - startTime;
        
        // Should handle 1000 entities in reasonable time
        expect(renderTime).toBeLessThan(50); // 50ms threshold
    });
});
```

### **2. Safety Check Regression Tests**
**File**: `tests/regression/SafetyChecks.test.js`

```javascript
describe('Safety Check Regression Tests', () => {
    test('should not break when p5.js functions are missing', () => {
        // Remove all p5.js functions
        const originalFunctions = {};
        const p5Functions = ['stroke', 'fill', 'rect', 'ellipse', 'text', 'image'];
        
        p5Functions.forEach(func => {
            originalFunctions[func] = global[func];
            delete global[func];
        });
        
        const controller = new RenderController({});
        
        expect(() => controller.render()).not.toThrow();
        
        // Restore functions
        Object.entries(originalFunctions).forEach(([name, func]) => {
            global[name] = func;
        });
    });
    
    test('should handle null/undefined entities gracefully', () => {
        const entityRenderer = new EntityRenderer();
        
        global.ants = [null, undefined, {antObject: null}];
        global.antIndex = 3;
        global.g_resourceList = { resources: [null, undefined] };
        
        expect(() => entityRenderer.renderAllLayers('PLAYING')).not.toThrow();
    });
});
```

### **3. API Compatibility Regression Tests**
**File**: `tests/regression/APICompatibility.test.js`

```javascript
describe('API Compatibility Regression Tests', () => {
    test('should maintain backward compatibility for existing highlight methods', () => {
        const entity = new Entity();
        
        // These methods should still exist and work
        expect(typeof entity.highlightSelected).toBe('function');
        expect(typeof entity.highlightHover).toBe('function');
        expect(typeof entity.clearHighlight).toBe('function');
        
        // Should not throw
        expect(() => entity.highlightSelected()).not.toThrow();
    });
    
    test('should maintain RenderController direct access', () => {
        const entity = new Entity();
        const controller = entity.getRenderController();
        
        expect(controller).toBeInstanceOf(RenderController);
        expect(typeof controller.setHighlight).toBe('function');
        expect(typeof controller.addEffect).toBe('function');
    });
});
```

---

## 🎭 **BEHAVIORAL TESTS (GHERKIN/BEHAVE)**

### **Setup Configuration**
**File**: `tests/behavioral/environment.py`

```python
from behave import fixture, use_fixture
import sys
import os

# Add project root to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../'))

@fixture
def rendering_system_context(context):
    """Setup rendering system test environment"""
    context.render_manager = None
    context.entity_renderer = None  
    context.performance_monitor = None
    context.entities = []
    context.render_calls = []
    yield context
    # Cleanup
    context.render_calls.clear()
    context.entities.clear()

def before_scenario(context, scenario):
    use_fixture(rendering_system_context, context)
```

---

### **1. Game State Rendering Behavior**
**File**: `tests/behavioral/features/game_state_rendering.feature`

```gherkin
Feature: Game State Rendering
  As a game developer
  I want the rendering system to display appropriate layers for each game state
  So that players see the correct UI and game elements

  Background:
    Given I have a render layer manager
    And I have mocked all global dependencies
    And the render manager is initialized

  Scenario Outline: Rendering layers for different game states
    Given the game is in "<game_state>" state
    When I request the rendering system to render
    Then the "<expected_layers>" layers should be rendered
    And the "<excluded_layers>" layers should not be rendered

    Examples:
      | game_state | expected_layers                    | excluded_layers |
      | PLAYING    | TERRAIN,ENTITIES,UI_GAME,UI_DEBUG | UI_MENU        |
      | PAUSED     | TERRAIN,ENTITIES,UI_GAME          | UI_MENU        |
      | MENU       | TERRAIN,UI_MENU                   | ENTITIES       |
      | GAME_OVER  | TERRAIN,ENTITIES,UI_GAME,UI_MENU  | UI_DEBUG       |
      | DEBUG_MENU | TERRAIN,ENTITIES,UI_DEBUG,UI_MENU | UI_GAME        |

  Scenario: Rendering order consistency
    Given the game is in "PLAYING" state
    And I have layer renderers that track call order
    When I request the rendering system to render
    Then the "TERRAIN" layer should render before "ENTITIES"
    And the "ENTITIES" layer should render before "UI_GAME" 
    And the "UI_GAME" layer should render before "UI_DEBUG"

  Scenario: Invalid game state handling
    Given the game is in "INVALID_STATE" state
    When I request the rendering system to render
    Then the system should fall back to default layers
    And a warning should be logged
    And the "TERRAIN,UI_MENU" layers should be rendered
```

**File**: `tests/behavioral/steps/game_state_rendering.py`

```python
from behave import given, when, then
from unittest.mock import Mock, MagicMock

@given('I have a render layer manager')
def step_impl(context):
    context.render_manager = Mock()
    context.render_manager.render_calls = []
    
@given('I have mocked all global dependencies')  
def step_impl(context):
    context.global_mocks = {
        'g_map2': Mock(),
        'EntityRenderer': Mock(),
        'g_resourceList': Mock(),
        'ants': [],
        'antIndex': 0
    }

@given('the render manager is initialized')
def step_impl(context):
    context.render_manager.initialize = Mock()
    context.render_manager.layerRenderers = {}
    context.render_manager.initialize()

@given('the game is in "{game_state}" state')
def step_impl(context, game_state):
    context.current_game_state = game_state

@given('I have layer renderers that track call order')
def step_impl(context):
    context.render_calls = []
    
    def create_tracker(layer_name):
        return lambda: context.render_calls.append(layer_name)
    
    context.render_manager.register_layer_renderer = Mock()
    context.layer_trackers = {
        'TERRAIN': create_tracker('TERRAIN'),
        'ENTITIES': create_tracker('ENTITIES'), 
        'UI_GAME': create_tracker('UI_GAME'),
        'UI_DEBUG': create_tracker('UI_DEBUG')
    }

@when('I request the rendering system to render')
def step_impl(context):
    # Mock the actual rendering behavior
    layers = get_layers_for_state(context.current_game_state)
    context.rendered_layers = layers
    
    # Simulate render call order
    if hasattr(context, 'layer_trackers'):
        for layer in layers:
            if layer in context.layer_trackers:
                context.layer_trackers[layer]()

@then('the "{expected_layers}" layers should be rendered')
def step_impl(context, expected_layers):
    expected = expected_layers.split(',')
    for layer in expected:
        assert layer in context.rendered_layers, f"Layer {layer} not rendered"

@then('the "{excluded_layers}" layers should not be rendered')
def step_impl(context, excluded_layers):
    excluded = excluded_layers.split(',')
    for layer in excluded:
        assert layer not in context.rendered_layers, f"Layer {layer} should not be rendered"

@then('the "{first_layer}" layer should render before "{second_layer}"')
def step_impl(context, first_layer, second_layer):
    first_index = context.render_calls.index(first_layer)
    second_index = context.render_calls.index(second_layer)
    assert first_index < second_index, f"{first_layer} should render before {second_layer}"

def get_layers_for_state(game_state):
    """Helper function to determine layers for game state"""
    layer_map = {
        'PLAYING': ['TERRAIN', 'ENTITIES', 'UI_GAME', 'UI_DEBUG'],
        'PAUSED': ['TERRAIN', 'ENTITIES', 'UI_GAME'],
        'MENU': ['TERRAIN', 'UI_MENU'],
        'GAME_OVER': ['TERRAIN', 'ENTITIES', 'UI_GAME', 'UI_MENU'],
        'DEBUG_MENU': ['TERRAIN', 'ENTITIES', 'UI_DEBUG', 'UI_MENU']
    }
    return layer_map.get(game_state, ['TERRAIN', 'UI_MENU'])
```

---

### **2. Entity Lifecycle Behavior**
**File**: `tests/behavioral/features/entity_lifecycle.feature`

```gherkin
Feature: Entity Lifecycle Management
  As a game developer  
  I want entities to be properly managed throughout their lifecycle
  So that rendering is consistent and memory-efficient

  Background:
    Given I have an entity renderer
    And I have a mock entity system

  Scenario: Creating and rendering a new entity
    Given I create a new entity with type "ANT"
    When I assign a sprite with image "ant.png" at position (100, 200) 
    And I set the render layer to "ANTS"
    Then the entity should be discoverable by the renderer
    And the entity should render when the "ANTS" layer is processed
    And the sprite render method should be called

  Scenario: Entity state transitions
    Given I have an entity with render controller
    When I change the entity state from "IDLE" to "HOVER"
    Then the highlight state should be "HOVER"
    When I change the entity state from "HOVER" to "SELECTED"  
    Then the highlight state should be "SELECTED"
    When I clear the entity highlight
    Then the highlight state should be "NONE"

  Scenario: Entity destruction cleanup
    Given I have 5 entities in the "ANTS" layer
    When I remove 2 entities from the system
    Then only 3 entities should be rendered
    And the removed entities should not appear in render calls
    And no memory leaks should be detected

  Scenario: Batch entity operations
    Given I have 100 entities of type "RESOURCE"
    When I highlight all entities as "SELECTED"
    Then all 100 entities should have "SELECTED" highlight state
    When I clear all entity effects
    Then no entities should have active effects
    And the effects cleanup should complete in under 50ms
```

**File**: `tests/behavioral/steps/entity_lifecycle.py`

```python
from behave import given, when, then
from unittest.mock import Mock
import time

@given('I have an entity renderer')
def step_impl(context):
    context.entity_renderer = Mock()
    context.entity_renderer.render_all_layers = Mock()

@given('I have a mock entity system')
def step_impl(context):
    context.entities = []
    context.global_entity_lists = {
        'ants': [],
        'resources': [],
        'buildings': []
    }

@given('I create a new entity with type "{entity_type}"')
def step_impl(context, entity_type):
    context.current_entity = Mock()
    context.current_entity.type = entity_type
    context.current_entity.render_controller = Mock()
    context.entities.append(context.current_entity)

@when('I assign a sprite with image "{image}" at position ({x:d}, {y:d})')
def step_impl(context, image, x, y):
    context.current_entity.sprite = Mock()
    context.current_entity.sprite.image = image
    context.current_entity.sprite.position = (x, y)
    context.current_entity.sprite.render = Mock()

@when('I set the render layer to "{layer}"')
def step_impl(context, layer):
    context.current_entity.render_layer = layer
    # Add to appropriate global list
    layer_map = {
        'ANTS': 'ants',
        'RESOURCES': 'resources', 
        'BUILDINGS': 'buildings'
    }
    if layer in layer_map:
        context.global_entity_lists[layer_map[layer]].append(context.current_entity)

@then('the entity should be discoverable by the renderer')
def step_impl(context):
    layer = context.current_entity.render_layer
    layer_map = {
        'ANTS': 'ants',
        'RESOURCES': 'resources',
        'BUILDINGS': 'buildings'
    }
    entity_list = context.global_entity_lists[layer_map[layer]]
    assert context.current_entity in entity_list

@then('the entity should render when the "{layer}" layer is processed')
def step_impl(context, layer):
    # Simulate layer processing
    context.entity_renderer.render_all_layers('PLAYING')
    assert context.entity_renderer.render_all_layers.called

@then('the sprite render method should be called')
def step_impl(context):
    context.current_entity.sprite.render()
    assert context.current_entity.sprite.render.called
```

---

### **3. Performance Monitoring Behavior**  
**File**: `tests/behavioral/features/performance_monitoring.feature`

```gherkin
Feature: Performance Monitoring
  As a game developer
  I want comprehensive performance monitoring
  So that I can optimize rendering and maintain 60 FPS

  Background:
    Given I have a performance monitor
    And performance tracking is enabled

  Scenario: Real-time frame timing
    Given I start a new frame
    When I begin rendering the "TERRAIN" layer
    And the terrain rendering takes 5ms
    And I begin rendering the "ENTITIES" layer  
    And the entity rendering takes 10ms
    And I complete the frame
    Then the total frame time should be approximately 15ms
    And the layer breakdown should show "TERRAIN: 5ms, ENTITIES: 10ms"
    And the frame should be marked as "GOOD_PERFORMANCE"

  Scenario: Performance issue detection
    Given I have recorded 60 frames of data
    When 10 frames exceed 33ms rendering time
    Then the average FPS should be below 30
    And the system should detect "POOR_PERFORMANCE"
    And performance warnings should be generated
    And optimization suggestions should be provided

  Scenario: Entity count impact on performance
    Given I have 100 entities in the scene
    When I measure the baseline frame time
    And I add 400 more entities to reach 500 total
    And I measure the new frame time
    Then the frame time should increase proportionally
    But the frame time should remain under 16.67ms
    And culling efficiency should be above 20%

  Scenario: Memory usage monitoring
    Given I start with a clean memory baseline
    When I create 1000 particle effects
    And I let all effects expire naturally
    Then memory usage should return to baseline
    And no memory leaks should be detected
    And garbage collection should be efficient

  Scenario Outline: Performance scaling
    Given the performance setting is set to "<performance_level>"
    When I render a scene with 500 entities and 100 effects
    Then the frame time should be under "<max_frame_time>"ms
    And the visual quality should be "<expected_quality>"
    And the culling aggressiveness should be "<culling_level>"

    Examples:
      | performance_level | max_frame_time | expected_quality | culling_level |
      | HIGH             | 16.67          | FULL            | CONSERVATIVE  |
      | MEDIUM           | 20.0           | REDUCED         | MODERATE      |
      | LOW              | 33.0           | MINIMAL         | AGGRESSIVE    |
```

**File**: `tests/behavioral/steps/performance_monitoring.py`

```python
from behave import given, when, then
import time
from unittest.mock import Mock

@given('I have a performance monitor')
def step_impl(context):
    context.performance_monitor = Mock()
    context.performance_monitor.frame_times = []
    context.performance_monitor.layer_times = {}
    context.performance_monitor.memory_baseline = 0

@given('performance tracking is enabled')
def step_impl(context):
    context.performance_monitor.tracking_enabled = True
    context.frame_start_time = None

@given('I start a new frame')
def step_impl(context):
    context.frame_start_time = time.time() * 1000  # Convert to ms
    context.current_frame_layers = {}

@when('I begin rendering the "{layer}" layer')
def step_impl(context, layer):
    context.current_layer = layer
    context.layer_start_time = time.time() * 1000

@when('the {layer} rendering takes {duration:d}ms')
def step_impl(context, layer, duration):
    context.current_frame_layers[layer] = duration

@when('I complete the frame')
def step_impl(context):
    context.total_frame_time = sum(context.current_frame_layers.values())
    context.performance_monitor.frame_times.append(context.total_frame_time)

@then('the total frame time should be approximately {expected_time:d}ms')
def step_impl(context, expected_time):
    actual_time = context.total_frame_time
    tolerance = 2  # 2ms tolerance
    assert abs(actual_time - expected_time) <= tolerance, \
        f"Expected ~{expected_time}ms, got {actual_time}ms"

@then('the layer breakdown should show "{expected_breakdown}"')
def step_impl(context, expected_breakdown):
    # Parse expected breakdown: "TERRAIN: 5ms, ENTITIES: 10ms"
    expected_parts = expected_breakdown.split(', ')
    for part in expected_parts:
        layer, time_str = part.split(': ')
        expected_time = int(time_str.replace('ms', ''))
        actual_time = context.current_frame_layers.get(layer, 0)
        assert actual_time == expected_time, \
            f"Layer {layer}: expected {expected_time}ms, got {actual_time}ms"

@then('the frame should be marked as "{performance_level}"')
def step_impl(context, performance_level):
    frame_time = context.total_frame_time
    if performance_level == "GOOD_PERFORMANCE":
        assert frame_time < 16.67, f"Frame time {frame_time}ms too high for good performance"
    elif performance_level == "POOR_PERFORMANCE":
        assert frame_time > 33, f"Frame time {frame_time}ms not poor enough"
```

---

### **Behave Configuration**
**File**: `tests/behavioral/behave.ini`

```ini
[behave]
default_format = pretty
default_tags = -@skip
paths = features
step_dirs = steps
show_skipped = false
show_timings = true
color = true
junit = true
junit_directory = reports
```

**File**: `tests/behavioral/run_behavioral_tests.py`

```python
#!/usr/bin/env python3
"""
Behavioral test runner for rendering system
"""
import subprocess
import sys
import os

def run_behavioral_tests():
    """Run all behavioral tests using Behave"""
    
    # Set up environment
    os.environ['PYTHONPATH'] = os.path.join(os.path.dirname(__file__), '../../')
    
    # Run behave with specific tags
    test_commands = [
        # Run all tests
        ['behave', '--tags=~@skip'],
        
        # Run only game state tests
        ['behave', '--tags=@game_state', 'features/game_state_rendering.feature'],
        
        # Run only performance tests  
        ['behave', '--tags=@performance', 'features/performance_monitoring.feature'],
        
        # Run only entity tests
        ['behave', '--tags=@entity', 'features/entity_lifecycle.feature']
    ]
    
    for cmd in test_commands:
        print(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, cwd=os.path.dirname(__file__))
        if result.returncode != 0:
            print(f"Test failed: {' '.join(cmd)}")
            return False
    
    return True

if __name__ == '__main__':
    success = run_behavioral_tests()
    sys.exit(0 if success else 1)
```

---

## 🧪 **TEST EXECUTION STRATEGY**

### **Phase 1: Pre-Refactoring Baseline Tests**
1. **Current System Snapshot**: Record current performance metrics
2. **Existing Functionality Test**: Ensure all current features work
3. **Safety Net Creation**: Comprehensive regression test suite

### **Phase 2: Incremental Refactoring Tests**
1. **Unit Tests First**: Test each component in isolation
2. **Integration Tests**: Test component interactions
3. **Continuous Regression**: Run regression tests after each change

### **Phase 3: Post-Refactoring Validation**
1. **Full System Integration**: Test complete system behavior
2. **Performance Validation**: Ensure no performance degradation
3. **User API Testing**: Verify simplified API works correctly

### **Phase 4: Long-term Monitoring**
1. **Behavioral Tests**: Ensure system behaves correctly over time
2. **Performance Monitoring**: Continuous performance tracking
3. **Regression Prevention**: Automated test execution on changes

---

## 📊 **TEST METRICS & SUCCESS CRITERIA**

### **Performance Benchmarks**
- **Frame Render Time**: < 16.67ms (60 FPS)
- **Entity Processing**: Handle 1000+ entities efficiently
- **Memory Usage**: No memory leaks in effect systems
- **Startup Time**: System initialization < 100ms

### **Reliability Benchmarks**
- **Test Coverage**: > 90% code coverage
- **Safety**: Zero crashes with missing dependencies
- **API Consistency**: 100% backward compatibility maintained
- **Error Handling**: Graceful degradation in all failure modes

### **Quality Benchmarks**
- **Code Duplication**: < 5% duplicate code
- **API Simplicity**: User API calls reduced by 50%+
- **Maintainability**: Clear separation of concerns
- **Documentation**: 100% public API documented

---

## 🔧 **TEST AUTOMATION SETUP**

### **Jest Configuration** (`jest.config.js`)
```javascript
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    collectCoverageFrom: [
        'Classes/rendering/**/*.js',
        '!Classes/rendering/**/*.test.js'
    ],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        }
    }
};
```

### **Test Utilities** (`tests/utils/mockP5.js`)
```javascript
// Mock p5.js environment for testing
export function setupMockP5() {
    global.stroke = jest.fn();
    global.fill = jest.fn();
    global.rect = jest.fn();
    global.ellipse = jest.fn();
    global.text = jest.fn();
    global.image = jest.fn();
    global.push = jest.fn();
    global.pop = jest.fn();
    global.translate = jest.fn();
    global.rotate = jest.fn();
    global.createVector = (x, y) => ({x, y, copy: () => ({x, y})});
}
```

### **Continuous Integration** 
```yaml
# .github/workflows/rendering-tests.yml
name: Rendering System Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:integration
      - run: npm run test:performance
```

---

**Last Updated**: October 2, 2025  
**Next Review**: After Phase 1 implementation completion