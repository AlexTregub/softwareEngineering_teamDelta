Feature: Ant Faction System and Combat Detection
  As a game developer
  I want ants to recognize enemies and allies by faction
  So that combat and cooperation work correctly

  Background:
    Given I have opened the game application in a browser
    And the ant faction system is initialized
    And enemy detection systems are active

  @core @faction @detection
  Scenario: Ants detect enemies by different factions
    Given I spawn 2 ants with faction "player" at positions (100,100) and (150,150)
    And I spawn 1 ant with faction "enemy" at position (125,125)
    When the ants perform enemy detection checks
    Then the player ants should detect the enemy ant
    And the player ants should enter combat state
    And the enemy ant should detect the player ants
    And the enemy ant should enter combat state

  @faction @allies
  Scenario: Same faction ants ignore each other
    Given I spawn 3 ants with faction "player" in close proximity
    When the ants check for enemies
    Then no ants should enter combat state
    And all ants should remain "OUT_OF_COMBAT"
    And ants should not target each other

  @faction @multiple
  Scenario: Multiple faction warfare
    Given I spawn ants with different factions:
      | faction | count | area        |
      | red     | 2     | top-left    |
      | blue    | 2     | top-right   |
      | green   | 1     | center      |
    When all ants check for enemies
    Then red ants should detect blue and green ants as enemies
    And blue ants should detect red and green ants as enemies
    And green ant should detect red and blue ants as enemies
    And each faction should enter combat with the others

  @faction @proximity
  Scenario: Enemy detection respects distance limits
    Given I spawn 1 ant with faction "player" at (100, 100)
    And I spawn 1 ant with faction "enemy" at (500, 500)
    When the ants check for enemies
    Then neither ant should detect the other due to distance
    And both ants should remain "OUT_OF_COMBAT"
    When I move the enemy ant to position (120, 120)
    Then the player ant should detect the enemy
    And both ants should enter combat state

  @faction @neutral
  Scenario: Neutral faction behavior
    Given I spawn 1 ant with faction "player"
    And I spawn 1 ant with faction "neutral"
    And I spawn 1 ant with faction "enemy"
    When all ants check for enemies
    Then the neutral ant should not attack anyone
    And the player and enemy ants should attack each other
    And the neutral ant should remain "OUT_OF_COMBAT"

  @faction @dynamic
  Scenario: Dynamic faction changing
    Given I spawn 2 ants with faction "player"
    When I change one ant's faction to "enemy"
    And both ants check for enemies
    Then the ants should now be enemies
    And both should enter combat state
    And they should target each other

  @faction @queen-coordination
  Scenario: Queen manages faction-based commands
    Given I have a Queen with faction "player"
    And I spawn 3 ants under the Queen's command
    When the Queen broadcasts a command to attack
    Then only ants of the same faction should respond
    And ants should coordinate based on faction loyalty
    And cross-faction commands should be ignored

  @faction @combat-resolution
  Scenario: Faction-based combat initiation and resolution
    Given I have 2 ants of opposing factions in combat range
    When combat is initiated between the factions
    Then both ants should enter "IN_COMBAT" state
    And combat actions should be available to both
    When one ant moves out of range
    Then both ants should exit combat state
    And they should return to "OUT_OF_COMBAT"

  @faction @utilities
  Scenario: AntUtilities faction filtering works correctly
    Given I spawn multiple ants with mixed factions:
      | faction | count |
      | player  | 3     |
      | enemy   | 2     |
      | neutral | 1     |
    When I use AntUtilities.getAntsByFaction("player")
    Then I should get exactly 3 ants
    And all returned ants should have faction "player"
    When I use AntUtilities.getAntsByFaction("enemy")
    Then I should get exactly 2 ants
    And all returned ants should have faction "enemy"