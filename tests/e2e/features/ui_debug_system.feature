Feature: UI Debug System Integration
  As a developer
  I want to test UI debugging capabilities
  So that I can efficiently debug and position UI elements

  Background:
    Given the game is loaded in a browser
    And the UI Debug Manager is available
    And UI elements are registered for debugging

  @ui-debug-activation
  Scenario: Activating UI Debug Mode with keyboard shortcuts
    Given I am in the game interface
    When I press the tilde key "~"
    Then the UI Debug Manager should toggle debug mode
    And I should see debug overlays on registered UI elements
    And yellow drag handles should appear on draggable elements

  @ui-debug-activation  
  Scenario: Activating both debug systems with backtick
    Given I am in the game interface
    When I press the backtick key "`"
    Then both the dev console and UI Debug Manager should activate
    And I should see "DEV CONSOLE ENABLED" in the browser console
    And I should see "UIDebugManager: Debug mode ENABLED" in the console

  @ui-element-dragging
  Scenario: Dragging UI elements with debug handles
    Given UI Debug Mode is active
    And I can see yellow drag handles on UI elements
    When I click and drag a yellow handle to a new position
    Then the UI element should move smoothly with the cursor
    And the element should be constrained to screen boundaries
    And the new position should be saved automatically

  @ui-position-persistence
  Scenario: UI element position persistence across sessions
    Given I have moved UI elements to custom positions
    And the positions have been saved to localStorage
    When I refresh the browser page
    And reactivate UI Debug Mode
    Then all UI elements should return to their saved positions
    And the layout should be restored exactly as configured

  @ui-element-registration
  Scenario: UI element registration and management
    Given the UI Debug Manager is initialized
    When UI elements are registered with the debug system
    Then each element should have proper drag handles
    And elements should be listed in the debug manager's registry
    And element bounds should be accurately calculated

  @ui-debug-coordination
  Scenario: UI Debug coordination with dev console
    Given both debug systems are active
    When I use command line UI debug commands
    Then I should be able to toggle UI debug mode via commands
    And I should be able to list registered UI elements
    And I should be able to reset positions via command line