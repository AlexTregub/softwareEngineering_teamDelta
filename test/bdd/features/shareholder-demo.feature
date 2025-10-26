# Shareholder Demo BDD Test Suite
# Selenium-based Gherkin scenarios for visual validation

Feature: Shareholder Demo Visual Validation
  As a stakeholder
  I want to see a comprehensive demonstration of the ant system
  So that I can understand the technical capabilities and visual features

  Background:
    Given the game is loaded and running
    And the game state is "playing"
    And the demo button is visible

  @cleanup @critical
  Scenario: Environment Setup and Cleanup
    When I click the demo button
    Then the demo should start running
    And all existing entities should be cleared from screen
    And all spawning systems should be stopped
    And all UI panels should be hidden except demo controls
    And a single test ant should be spawned at screen center
    And the cleanup should complete within 3 seconds

  @highlights @visual
  Scenario Outline: Highlight System Demonstration
    Given the demo is running
    And a test ant is visible on screen
    When the demo cycles to highlight "<highlight_type>"
    Then the ant should display the "<highlight_type>" visual effect
    And the highlight should be detectable by Selenium
    And the effect should be visible for at least 2 seconds
    And the highlight color should match the expected "<expected_color>"

    Examples:
      | highlight_type | expected_color |
      | SELECTED      | green         |
      | HOVER         | white         |
      | BOX_HOVERED   | light_green   |
      | COMBAT        | red           |
      | FRIENDLY      | green         |
      | ENEMY         | red           |
      | RESOURCE      | orange        |

  @jobs @sprites
  Scenario Outline: Job System Demonstration
    Given the demo is running
    And a test ant is visible on screen
    When the demo cycles to job "<job_name>"
    Then the ant should display the "<job_name>" sprite
    And the ant's job name should be "<job_name>"
    And the sprite should match the expected image for "<job_name>"
    And the job change should be detectable by Selenium

    Examples:
      | job_name |
      | Scout    |
      | Builder  |
      | Farmer   |
      | Warrior  |
      | Spitter  |

  @states @behavior
  Scenario Outline: State Machine Demonstration
    Given the demo is running
    And a test ant is visible on screen
    When the demo cycles to state "<state_name>"
    Then the ant should display the "<state_name>" state indicator
    And the state indicator should show the correct symbol "<expected_symbol>"
    And the state should be detectable by Selenium
    And the indicator should be positioned above the ant

    Examples:
      | state_name | expected_symbol |
      | MOVING     | →              |
      | GATHERING  | ⛏              |
      | BUILDING   | 🔨              |
      | ATTACKING  | ⚔              |
      | FOLLOWING  | 👥              |
      | FLEEING    | 💨              |
      | IDLE       | 💤              |

  @performance @timing
  Scenario: Demo Performance Validation
    Given the demo is running
    When the demo completes all phases
    Then the total duration should be less than 60 seconds
    And no errors should be reported
    And all visual transitions should be smooth
    And the frame rate should remain above 30 FPS during demo

  @reporting @output
  Scenario: Demo Report Generation
    Given the demo has completed successfully
    When the report is generated
    Then an HTML report should be created
    And the report should contain all test results
    And the report should include performance metrics
    And the report should show success/failure rates
    And the report should be accessible in localStorage

  @error-handling @robustness
  Scenario: Demo Error Handling
    Given the demo is running
    When an error occurs during demo execution
    Then the error should be logged appropriately
    And the demo should continue with remaining tests where possible
    And the error should be included in the final report
    And the demo should clean up properly even after errors

  @accessibility @selenium
  Scenario: Selenium Integration Validation
    Given the demo system is loaded
    When Selenium queries the demo status
    Then the current phase should be accessible via getCurrentPhase()
    And the progress percentage should be available via getProgress()
    And the current highlight state should be queryable
    And the current job should be detectable
    And the current ant state should be accessible