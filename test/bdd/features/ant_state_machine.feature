Feature: Ant State Machine Behavior
  As a game developer
  I want ants to transition between states correctly
  So that ant behavior is predictable and follows game rules

  Background:
    Given I have opened the game application in a browser
    And I have spawned a test ant with job "Scout"
    And the ant is in a known initial state

  @core @state-machine @transitions
  Scenario Outline: Primary state transitions work correctly
    Given I have an ant in "<initial_state>" state
    When I command the ant to "<action>"
    Then the ant state should change to "<expected_state>"
    And the ant should be able to perform "<allowed_actions>"
    And the state change should be reflected in the browser
    
    Examples:
      | initial_state | action     | expected_state | allowed_actions          |
      | IDLE         | move       | MOVING         | move, gather, attack     |
      | IDLE         | gather     | GATHERING      | gather, move             |
      | MOVING       | gather     | GATHERING      | gather, move             |
      | GATHERING    | attack     | ATTACKING      | attack, defend, spit     |
      | BUILDING     | interrupt  | IDLE           | move, gather, attack     |
      | SOCIALIZING  | combat     | IN_COMBAT      | attack, defend           |

  @state-machine @combat
  Scenario: Combat state modifiers work correctly
    Given I have an ant in "IDLE" state
    When the ant detects an enemy nearby
    Then the ant should enter "IN_COMBAT" state
    And the ant combat modifier should be "IN_COMBAT"
    And the ant should be able to attack and defend
    When the enemy moves away
    Then the ant should return to "OUT_OF_COMBAT" state

  @state-machine @terrain
  Scenario: Terrain state modifiers affect movement
    Given I have an ant in "MOVING" state on default terrain
    When the ant moves onto muddy terrain
    Then the ant terrain modifier should be "IN_MUD"
    And the ant movement speed should be reduced to 30%
    And the ant state should show "MOVING_IN_MUD"
    When the ant moves back to default terrain
    Then the terrain modifier should return to "DEFAULT"

  @state-machine @complex
  Scenario: Complex state combinations work properly
    Given I have an ant in "MOVING" state
    When the ant moves onto slippery terrain
    And the ant detects an enemy
    Then the ant state should be "MOVING_IN_COMBAT_ON_SLIPPERY"
    And the ant movement speed should be 0 (cannot move on slippery)
    And the ant should still be able to attack
    And all state layers should be independently trackable

  @state-machine @callbacks
  Scenario: State change callbacks fire correctly
    Given I have an ant with a state change callback registered
    When the ant state changes from "IDLE" to "MOVING"
    Then the callback should be triggered with old and new states
    And the callback should receive "IDLE" as old state
    And the callback should receive "MOVING" as new state

  @state-machine @validation
  Scenario: Invalid state transitions are rejected
    Given I have an ant in "IDLE" state
    When I attempt to set an invalid primary state "INVALID_STATE"
    Then the state change should be rejected
    And the ant should remain in "IDLE" state
    And a warning should be logged about the invalid state

  @state-machine @restrictions
  Scenario: State restrictions prevent invalid actions
    Given I have an ant in "BUILDING" state
    When I attempt to make the ant perform "patrol" action
    Then the action should be rejected due to state restrictions
    And the ant should remain in "BUILDING" state
    And the ant should not be able to patrol while building

  @state-machine @terrain-effects
  Scenario Outline: Different terrain types affect movement correctly
    Given I have an ant on "<terrain_type>" terrain
    When the ant attempts to move
    Then the movement speed should be modified by "<speed_modifier>"
    And the terrain state should be "<terrain_state>"
    
    Examples:
      | terrain_type | speed_modifier | terrain_state |
      | DEFAULT      | 100%          | DEFAULT       |
      | IN_WATER     | 50%           | IN_WATER      |
      | IN_MUD       | 30%           | IN_MUD        |
      | ON_SLIPPERY  | 0%            | ON_SLIPPERY   |
      | ON_ROUGH     | 80%           | ON_ROUGH      |

  @state-machine @coverage
  Scenario: State machine handles all defined state combinations
    Given I have access to the AntStateMachine class
    When I run the state coverage test function
    Then all primary states should be testable
    And all combat modifier combinations should work
    And all terrain modifier combinations should work
    And the coverage report should show high success rate
    And no state combinations should cause crashes