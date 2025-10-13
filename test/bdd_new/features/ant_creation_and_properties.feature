Feature: Ant Creation and Properties
  As a game developer
  I want to test ant creation using the antsSpawn function
  So that I validate system behavior

  Background:
    Given I have opened the game application in a browser
    And the antsSpawn function is available
    And the ants array exists
    And the JobComponent system is loaded

  @core @ants @creation
  Scenario: Single ant spawns using antsSpawn function
    When I call antsSpawn with 1 ant
    Then the ants array should contain 1 ant
    And the spawned ant should use the ant constructor
    And the ant should be created through the system workflow
    And the antIndex should be properly incremented

  @core @ants @system
  Scenario: Multiple ants spawn using system
    When I call antsSpawn with 3 ant
    Then the ants array should contain 3 ant
    And each ant should be created via the spawning mechanism
    And the array should contain ant objects
    And the objects should have game properties

  @job-system @api
  Scenario: Job system integration with APIs
    When I call JobComponent.getAllJobs()
    Then I should get the list of available jobs
    And I should be able to call JobComponent.getJobStats() with job names
    And the job system should return game data

  @system @validation
  Scenario: System dependencies are available
    Then antsSpawn should be available as a function
    And the ants array should exist
    And JobComponent should provide job management
    And the system should use game dependencies
    And the ants array should contain 10 valid ant objects
    And each ant should be independently functional
    And no memory leaks should occur during creation