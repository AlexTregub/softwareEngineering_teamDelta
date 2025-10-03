Feature: Button Group Manager - Universal Button System Controller
  As a UI developer
  I want a central manager to orchestrate multiple button groups
  So that I can efficiently manage complex UI layouts with JSON configuration

  Background:
    Given I have a button group manager system
    And I have clean localStorage state
    And I have a mock canvas environment

  Scenario: Creating manager with JSON configuration
    Given I have a JSON configuration with 3 button groups
    When I create a button group manager with the configuration
    Then the manager should successfully initialize
    And all 3 button groups should be created and active
    And each button group should have its configured layout and buttons
    And the manager should track all active groups by ID

  Scenario: Loading button groups from configuration file
    Given I have a JSON configuration file "ui-config.json" with multiple groups
    When I load the configuration file into the manager
    Then the manager should parse the JSON successfully
    And create button groups for each configuration entry
    And handle any configuration validation errors gracefully
    And report successful and failed group creations

  Scenario: Managing multiple active button groups
    Given I have a manager with 4 active button groups
    When I request all active groups
    Then I should receive all 4 group instances
    And each group should be properly initialized and functional
    When I request a specific group by ID "toolbar-main"
    Then I should receive the correct button group instance
    And the group should be ready for interaction

  Scenario: Button group lifecycle management
    Given I have a manager with 2 active button groups
    When I add a new button group configuration dynamically
    Then the new group should be created and added to active groups
    And the existing groups should remain unaffected
    When I remove a button group by ID "temp-group"
    Then the group should be removed from active groups
    And its resources should be cleaned up properly

  Scenario: Updating button group configurations at runtime
    Given I have a manager with a button group "settings-panel"
    When I update the group's transparency to 0.7
    And I update the group's position to (300, 400)
    Then the manager should apply changes to the target group
    And the group should reflect the new transparency and position
    And other groups should remain unchanged

  Scenario: Global mouse interaction handling
    Given I have a manager with 3 overlapping button groups
    When I provide mouse coordinates (250, 300) with click state true
    Then the manager should determine which groups can handle the interaction
    And forward the interaction to all eligible groups
    And return interaction results for each group
    And handle the case where no groups are at those coordinates

  Scenario: Render coordination across all groups
    Given I have a manager with 5 button groups of varying visibility
    When I request the manager to render all groups
    Then only visible groups should be rendered
    And groups should be rendered in the correct depth order
    And each group's render method should be called with proper context
    And rendering should handle groups with different scales and transparency

  Scenario: Configuration validation and error handling
    Given I have a JSON configuration with invalid group definitions
    When I attempt to create a manager with the invalid configuration
    Then the manager should identify and report configuration errors
    And create groups only for valid configurations
    And provide detailed error messages for debugging
    And continue operating with successfully created groups

  Scenario: Persistence coordination across groups
    Given I have a manager with 3 groups that have persistence enabled
    When I trigger a global save operation
    Then all groups with persistence should save their current state
    And the manager should coordinate the save operations
    And report successful and failed save operations
    When I trigger a global load operation
    Then all groups should restore their persisted state
    And handle missing or corrupted persistence data gracefully

  Scenario: Performance optimization with many groups
    Given I have a manager with 20 button groups
    When I perform mouse interaction testing
    Then the manager should use efficient hit-testing algorithms
    And avoid unnecessary processing for groups outside interaction area
    And maintain responsive performance during interaction
    When I perform rendering operations
    Then the manager should optimize rendering calls
    And skip rendering for groups outside viewport if culling is enabled

  Scenario: Action factory integration and execution
    Given I have a manager with groups containing various button actions
    When a button action is triggered in group "main-toolbar"
    Then the manager should coordinate with the action factory
    And execute the requested action through proper channels
    And handle action execution errors gracefully
    And provide feedback about action success or failure

  Scenario: Dynamic group reconfiguration
    Given I have a manager with a button group "dynamic-panel" for reconfiguration
    When I reconfigure the group to change from horizontal to vertical layout
    And modify the button configurations within the group
    Then the manager should apply the layout change
    And recreate buttons according to new configuration
    And maintain group state like position and visibility
    And preserve any persisted settings that remain valid

  Scenario: Manager state inspection and debugging
    Given I have a manager with multiple active groups
    When I request manager diagnostic information
    Then I should receive comprehensive state information
    And active group count, IDs, and status for each group
    And performance metrics if available
    And current configuration summary
    And any active error conditions or warnings

  Scenario: Group visibility and interaction coordination
    Given I have a manager with overlapping button groups
    And some groups are invisible or have low transparency
    When I request interaction handling for mouse position (400, 200)
    Then the manager should only consider visible and interactive groups
    And respect group transparency levels for interaction priority
    And handle z-order for overlapping interactive regions
    And provide clear feedback about which group handled the interaction

  Scenario: Cleanup and resource management
    Given I have a manager with 6 active button groups for cleanup testing
    When I request complete manager shutdown
    Then all button groups should be properly disposed
    And event listeners should be cleaned up
    And persistence operations should be completed
    And memory resources should be released
    And the manager should be ready for safe garbage collection