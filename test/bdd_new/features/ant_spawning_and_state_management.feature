Feature: Ant Spawning and State Management
  As a game developer
  I want to test ant spawning functionality and state management
  So that the ant control system works correctly

  Background:
    Given the ant spawning system is loaded
    And the JobComponent system is available
    And the AntStateMachine system is available

  Scenario: Spawn ant with valid job and faction
    Given the antsSpawn function is available
    When I spawn an ant with job "Scout" and faction "red" at position 100,100
    Then the ant should be created successfully
    And the ant should have job "Scout"
    And the ant should have faction "red"
    And the ant should be added to the ants array

  Scenario: Spawn ant with invalid job defaults to Scout
    Given the antsSpawn function is available
    When I spawn an ant with job "InvalidJob" and faction "neutral" at position 200,200
    Then the ant should be created successfully
    And the ant should have job "Scout"
    And the ant should have faction "neutral"

  Scenario: Spawn ant with invalid faction defaults to neutral
    Given the antsSpawn function is available
    When I spawn an ant with job "Warrior" and faction "invalidFaction" at position 300,300
    Then the ant should be created successfully
    And the ant should have job "Warrior"
    And the ant should have faction "neutral"

  Scenario: Spawn multiple ants in formation
    Given the antsSpawn function is available
    When I spawn 5 ants with job "Builder" and faction "blue" in formation at center 400,400
    Then 5 ants should be created
    And all ants should have job "Builder"
    And all ants should have faction "blue"
    And ants should be positioned in a circle formation

  Scenario Outline: Test all valid job types
    Given the JobComponent system is available
    When I spawn an ant with job "<job_name>" and faction "neutral" at position 500,500
    Then the ant should be created successfully
    And the ant should have job "<job_name>"
    And the ant stats should match "<job_name>" from JobComponent

    Examples:
      | job_name |
      | Builder  |
      | Scout    |
      | Farmer   |
      | Warrior  |
      | Spitter  |

  Scenario: Change selected ants to IDLE state
    Given I have 3 ants spawned and selected
    When I change selected ants state to "IDLE"
    Then all selected ants should have primary state "IDLE"
    And all selected ants should have combat modifier "OUT_OF_COMBAT"
    And all selected ants should have terrain modifier "DEFAULT"

  Scenario: Change selected ants to GATHERING state
    Given I have 2 ants spawned and selected
    When I change selected ants state to "GATHERING"
    Then all selected ants should have primary state "GATHERING"
    And all selected ants should have combat modifier "OUT_OF_COMBAT"

  Scenario: Change selected ants to PATROL state
    Given I have 4 ants spawned and selected
    When I change selected ants state to "PATROL"
    Then all selected ants should have primary state "PATROL"

  Scenario: Change selected ants to COMBAT state
    Given I have 3 ants spawned and selected
    When I change selected ants state to "COMBAT"
    Then all selected ants should have primary state "MOVING"
    And all selected ants should have combat modifier "IN_COMBAT"

  Scenario: Change selected ants to BUILDING state
    Given I have 2 ants spawned and selected
    When I change selected ants state to "BUILDING"
    Then all selected ants should have primary state "BUILDING"
    And all selected ants should have combat modifier "OUT_OF_COMBAT"

  Scenario: No state change when no ants selected
    Given I have 3 ants spawned but none selected
    When I change selected ants state to "PATROL"
    Then no ants should have their state changed
    And a warning message should be logged

  Scenario: Ant Control Panel initialization
    Given the DraggablePanelManager is available
    When I initialize the ant control panel
    Then the ant control panel should be created successfully
    And the panel should be visible
    And the panel should have spawn buttons for all job types
    And the panel should have faction selection buttons
    And the panel should have state change buttons