Feature: Ant Terrain Integration and Movement Effects
  As a game developer
  I want ants to react to different terrain types
  So that terrain affects gameplay and movement realistically

  Background:
    Given I have opened the game application in a browser
    And the terrain system is available
    And ants can detect and react to terrain

  @core @terrain @movement-speed
  Scenario Outline: Different terrain types modify ant movement speed correctly
    Given I spawn an ant on "<terrain_type>" terrain
    When the ant attempts to move
    Then the ant movement speed should be modified by "<speed_modifier>"
    And the ant terrain state should be "<terrain_state>"
    And the speed change should be visible in ant movement
    
    Examples:
      | terrain_type | speed_modifier | terrain_state |
      | default      | 100%          | DEFAULT       |
      | water        | 50%           | IN_WATER      |
      | mud          | 30%           | IN_MUD        |
      | slippery     | 0%            | ON_SLIPPERY   |
      | rough        | 80%           | ON_ROUGH      |

  @terrain @transitions
  Scenario: Ant terrain state changes when moving between terrain types
    Given I spawn an ant on default terrain in "MOVING" state
    When the ant moves onto muddy terrain
    Then the ant terrain modifier should change to "IN_MUD"
    And the ant full state should be "MOVING_IN_MUD"
    And the ant movement speed should be reduced accordingly
    When the ant moves back to default terrain
    Then the terrain modifier should return to "DEFAULT"
    And the ant full state should be "MOVING"
    And movement speed should return to normal

  @terrain @combat-interaction
  Scenario: Terrain effects interact correctly with combat states
    Given I spawn an ant on slippery terrain
    When the ant detects an enemy and enters combat
    Then the ant state should be "IDLE_IN_COMBAT_ON_SLIPPERY"
    And the ant should be unable to move (speed = 0 due to slippery terrain)
    And the ant should still be able to attack despite movement restriction
    And combat abilities should not be affected by terrain movement restrictions

  @terrain @detection
  Scenario: Ants correctly detect terrain changes
    Given I spawn an ant with terrain detection capabilities
    When I move the ant across different terrain types
    Then the ant should automatically detect each terrain change
    And the detectTerrain() method should return correct terrain types
    And terrain state should update automatically without manual intervention

  @terrain @state-persistence
  Scenario: Terrain states persist correctly through other state changes
    Given I have an ant on muddy terrain with state "MOVING_IN_MUD"
    When the ant transitions to "GATHERING" state
    Then the terrain modifier should persist
    And the ant state should become "GATHERING_IN_MUD"
    And terrain effects should continue to apply
    When the ant returns to "IDLE" state
    Then the state should be "IDLE_IN_MUD"
    And terrain effects should still be active

  @terrain @multiple-modifiers
  Scenario: Terrain and combat modifiers work together correctly
    Given I spawn two ants of different factions on rough terrain
    When the ants detect each other and enter combat
    Then both ants should have state "IN_COMBAT_ON_ROUGH"
    And movement speed should be reduced by rough terrain (80%)
    And combat abilities should be fully available
    And both modifiers should be independently trackable

  @terrain @edge-cases
  Scenario: Terrain system handles edge cases gracefully
    When I attempt to set an invalid terrain modifier
    Then the terrain change should be rejected gracefully
    And the ant should maintain its current valid terrain state
    And no errors should crash the terrain detection system
    When terrain detection fails for any reason
    Then the ant should default to "DEFAULT" terrain state
    And functionality should continue normally

  @terrain @performance
  Scenario: Terrain detection performs well with multiple ants
    Given I spawn 15 ants across various terrain types
    When all ants perform terrain detection simultaneously
    Then terrain detection should not cause performance issues
    And all ants should correctly identify their terrain
    And terrain state updates should be smooth and responsive

  @terrain @visual-feedback
  Scenario: Terrain effects provide appropriate visual feedback
    Given I spawn an ant on default terrain
    When the ant moves onto muddy terrain and slows down
    Then the ant movement animation should reflect the speed change
    And the visual movement should appear noticeably slower
    When the ant moves onto slippery terrain and stops
    Then the ant should appear unable to move forward
    And visual feedback should clearly indicate terrain effects

  @terrain @utility-integration
  Scenario: Terrain effects integrate with ant utility functions
    Given I have ants on various terrain types
    When I use getEffectiveMovementSpeed() on each ant
    Then the returned speed should reflect terrain modifications
    And speed calculations should be accurate for each terrain type
    And utility functions should account for terrain in movement planning

  @terrain @realistic-behavior
  Scenario: Terrain effects create realistic ant behavior
    Given I have ants attempting to navigate around slippery terrain
    When ants encounter impassable slippery areas
    Then ants should pathfind around the slippery terrain when possible
    And ants should avoid entering slippery areas if alternative paths exist
    And terrain should influence ant decision-making and pathfinding

  @terrain @state-machine-integration
  Scenario: Terrain integrates seamlessly with AntStateMachine
    Given I have an AntStateMachine with terrain capabilities
    When I set terrain modifiers through the state machine
    Then terrain states should be managed consistently
    And getFullState() should include terrain information correctly
    And terrain state queries should work reliably
    And state machine callbacks should fire for terrain changes

  @terrain @boundary-conditions
  Scenario: Terrain detection works at terrain boundaries
    Given I position an ant exactly at the boundary between two terrain types
    When the ant moves slightly in different directions
    Then terrain detection should be accurate and consistent
    And terrain transitions should be smooth without flickering
    And boundary edge cases should not cause detection errors