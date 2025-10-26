Feature: System Integration Tests
  As a game developer
  I want to test system integration and cross-component functionality  
  So that I can ensure all systems work together properly

  Background:
    Given the game systems are loaded for integration testing

  @integration @resource-pickup
  Scenario: Resource pickup functionality integration
    When I test resource pickup functionality
    Then the resource pickup should work correctly

  @integration @validation
  Scenario: Controller validation and property testing
    When I test controller validation
    Then all controllers should be properly validated

  @integration @movement
  Scenario: Movement speed configuration testing
    When I test movement speed configuration
    Then movement speed should be configurable and functional

  @integration @rendering
  Scenario: Render controller error handling
    When I test render controller error handling  
    Then render controller should handle errors gracefully

  @integration @system-status
  Scenario: Overall system integration status
    When I test system integration status
    Then system integration should be functional