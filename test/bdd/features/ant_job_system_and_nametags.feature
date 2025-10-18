Feature: Ant Job System and Nametag Rendering
  As a player
  I want to see job names displayed underneath ants
  So that I can easily identify ant types and roles

  Background:
    Given I have opened the game application in a browser
    And the job system is initialized
    And text rendering capabilities are available

  @core @jobs @nametags @visual
  Scenario: Job names render underneath ants
    Given I spawn an ant with job "Builder"
    When the ant is rendered on screen
    Then the text "Builder" should appear underneath the ant sprite
    And the job text should be clearly visible
    And the job text should be positioned correctly below the ant
    And the job text should move with the ant when it moves

  @jobs @nametags @multiple
  Scenario: Different jobs show different nametags
    Given I spawn ants with jobs "Scout", "Warrior", "Builder", "Gatherer"
    When all ants are rendered on screen
    Then each ant should display its respective job name
    And the job text should be distinct for each ant type
    And job text should not overlap between nearby ants
    And all job names should be readable simultaneously

  @jobs @nametags @dynamic
  Scenario: Job changes update nametag display immediately
    Given I have an ant with job "Scout" displaying "Scout" nametag
    When I change the ant's job to "Warrior"
    Then the displayed job text should change from "Scout" to "Warrior"
    And the change should be immediate and visible in the browser
    And the ant sprite should also update to Warrior image
    And the nametag should remain properly positioned

  @jobs @nametags @positioning
  Scenario: Nametags position correctly with ant movement
    Given I spawn an ant with job "Builder" at position (200, 200)
    When the ant moves to position (300, 250)
    Then the "Builder" nametag should follow the ant
    And the nametag should remain underneath the ant sprite
    And the text should maintain proper spacing from the sprite
    And the nametag should not lag behind the ant movement

  @jobs @nametags @visual-clarity
  Scenario: Nametags remain readable in various visual conditions
    Given I spawn ants with job "Scout" on different background areas
    When the ants are on light and dark background areas
    Then the job text should remain readable on all backgrounds
    And the text should have appropriate contrast
    And text should not be obscured by background elements
    And nametags should be visible during ant highlighting/selection

  @jobs @properties
  Scenario: Job system assigns correct properties and images
    Given I spawn an ant with job "Warrior"
    Then the ant should have job name "Warrior"
    And the ant should display the Warrior job sprite
    And the ant should have Warrior-specific stats applied
    And the JobName property should be accessible via ant.JobName
    And the job image should be loaded from JobImages["Warrior"]

  @jobs @nametags @collision
  Scenario: Multiple ant nametags handle proximity gracefully
    Given I spawn 5 ants with different jobs in close proximity:
      | job     | x   | y   |
      | Scout   | 100 | 100 |
      | Builder | 110 | 100 |
      | Warrior | 120 | 100 |
      | Healer  | 105 | 110 |
      | Mage    | 115 | 110 |
    When all ants are rendered
    Then all job nametags should be visible
    And nametags should not overlap unreadably
    And each nametag should be clearly associated with its ant
    And text positioning should handle crowded areas intelligently

  @jobs @nametags @performance
  Scenario: Nametag rendering performs well with many ants
    Given I spawn 20 ants with various jobs spread across the screen
    When all ants are rendered with nametags
    Then the frame rate should remain acceptable
    And all nametags should render without delay
    And text rendering should not cause performance issues
    And nametags should update smoothly during ant movement

  @jobs @nametags @ui-integration
  Scenario: Nametags integrate properly with UI debug system
    Given I have ants with jobs displayed with nametags
    When I toggle the UI debug layer
    Then nametags should respect the debug layer visibility
    And debug overlays should not interfere with nametag display
    And nametags should remain functional in debug mode

  @jobs @edge-cases
  Scenario: Job system handles edge cases gracefully
    When I attempt to assign an invalid job name to an ant
    Then the system should handle the error gracefully
    And a default job should be assigned if possible
    And the nametag should still display correctly
    When I assign a very long job name to an ant
    Then the nametag text should be handled appropriately
    And the display should not break the layout

  @jobs @assignment
  Scenario: Job assignment through different methods works consistently
    Given I create an ant through the Job class constructor
    When the ant is created with job "Builder"
    Then the ant should have all Builder properties
    And the nametag should display "Builder"
    When I use the assignJob method to change to "Scout"
    Then the job change should be applied correctly
    And the nametag should update to show "Scout"

  @jobs @nametags @selection-integration
  Scenario: Nametags work correctly with ant selection
    Given I spawn an ant with job "Gatherer"
    When I select the ant
    Then the ant should be highlighted visually
    And the "Gatherer" nametag should remain visible during selection
    And the selection highlight should not obscure the job text
    And the nametag should be clearly readable while selected