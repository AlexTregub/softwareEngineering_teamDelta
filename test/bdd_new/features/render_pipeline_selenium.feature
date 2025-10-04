Feature: Render Pipeline System - Browser Integration Testing
  As a graphics developer
  I want to ensure the rendering pipeline works correctly with layer management
  So that visual elements display properly and layer toggles work as intended

  Background:
    Given I have opened the game application in a browser
    And the RenderLayerManager has been initialized with default layers
    And the game canvas is ready for rendering

  Scenario: RenderLayerManager initialization creates required layers
    When I check the RenderLayerManager layer structure
    Then the layers object should contain all required layer names
    And the UI_DEBUG layer should be present and enabled by default
    And the disabledLayers set should be initialized as empty

  Scenario: Layer toggling via public API changes visibility state
    Given the UI_DEBUG layer is currently enabled
    When I call renderLayerManager.toggleLayer("UI_DEBUG")
    Then the UI_DEBUG layer should be added to disabledLayers
    And isLayerEnabled("UI_DEBUG") should return false
    When I call renderLayerManager.toggleLayer("UI_DEBUG") again
    Then the UI_DEBUG layer should be removed from disabledLayers
    And isLayerEnabled("UI_DEBUG") should return true

  Scenario: Layer enabling via public API
    Given the UI_DEBUG layer is currently disabled
    When I call renderLayerManager.enableLayer("UI_DEBUG")
    Then the UI_DEBUG layer should be removed from disabledLayers
    And isLayerEnabled("UI_DEBUG") should return true
    And the layer should be available for rendering

  Scenario: Layer disabling via public API
    Given the UI_DEBUG layer is currently enabled
    When I call renderLayerManager.disableLayer("UI_DEBUG")
    Then the UI_DEBUG layer should be added to disabledLayers
    And isLayerEnabled("UI_DEBUG") should return false
    And elements on that layer should not render

  Scenario: Multiple layer management independence
    Given I have UI_DEBUG, UI_MAIN, and UI_OVERLAY layers
    When I disable the UI_DEBUG layer
    And I enable the UI_OVERLAY layer
    Then UI_DEBUG should be disabled
    And UI_MAIN should remain in its original state
    And UI_OVERLAY should be enabled
    And each layer state should be independent

  Scenario: Layer state persistence during render cycles
    Given I have disabled the UI_DEBUG layer
    When multiple render cycles execute
    Then the UI_DEBUG layer should remain disabled across all cycles
    And the disabled state should not change unless explicitly toggled
    And other layers should continue rendering normally

  Scenario: Render layer error handling with invalid layer names
    When I attempt to toggle a non-existent layer "INVALID_LAYER"
    Then the system should handle the invalid layer gracefully
    And no JavaScript errors should be thrown
    And existing layers should remain unaffected

  Scenario: Layer state affects element visibility
    Given I have UI elements assigned to the UI_DEBUG layer
    When the UI_DEBUG layer is enabled
    Then the UI elements should be visible and interactive
    When the UI_DEBUG layer is disabled
    Then the UI elements should not be visible or interactive

  Scenario: Render performance with layer toggles
    Given I have multiple layers with various elements
    When I rapidly toggle layer states multiple times
    Then the render performance should remain stable
    And no memory leaks should occur
    And the final layer states should be consistent

  Scenario: Layer priority and z-order rendering
    Given I have elements on multiple layers with different priorities
    When all layers are enabled and rendering
    Then elements should render in the correct z-order
    And higher priority layers should appear above lower priority layers
    And layer visibility should not affect the z-order of visible layers

  Scenario: RenderLayerManager integration with canvas context
    Given I have a valid canvas rendering context
    When the RenderLayerManager processes render calls
    Then the canvas context should receive the correct draw commands
    And only enabled layers should generate draw commands
    And the rendering should maintain proper canvas state

  Scenario: Layer group management
    Given I have multiple related layers in a group
    When I toggle the group state
    Then all layers in the group should change state together
    And individual layer states within the group should be synchronized
    And the group operation should be atomic

  Scenario: Dynamic layer creation and management
    Given the RenderLayerManager is initialized
    When I dynamically add a new layer "DYNAMIC_LAYER"
    Then the new layer should be created and enabled by default
    And the layer should be available for toggle operations
    And existing layers should remain unaffected

  Scenario: Layer state inspection via public API
    Given I have various layers in different states
    When I call getLayerStates() or similar inspection method
    Then I should receive accurate state information for all layers
    And the returned data should reflect current enabled/disabled states
    And the information should be suitable for debugging and monitoring

  Scenario: Render layer cleanup and memory management
    Given I have multiple layers with various states
    When the application lifecycle ends or resets
    Then all layer states should be properly cleaned up
    And no memory references should remain
    And the system should be ready for reinitialization