Feature: Headless Browser Performance Testing
  As a developer
  I want to test game performance in headless browsers
  So that I can ensure the game runs efficiently in automated environments

  Background:
    Given I have Puppeteer configured for headless Chrome
    And I have performance monitoring enabled
    And the game server is accessible

  Scenario: Measure initial page load performance
    Given I start performance monitoring
    When I navigate to the game page in headless mode
    Then the page should load within 5 seconds
    And the DOM content should be loaded within 3 seconds
    And all game assets should load within 10 seconds

  Scenario: Monitor frame rate during gameplay
    Given the game is running in headless Chrome
    When I monitor the frame rate for 30 seconds
    Then the average FPS should be above 30
    And frame drops should be less than 5% of total frames
    And the frame rate should remain stable

  Scenario: Memory usage monitoring
    Given the game is running with performance tracking
    When I monitor memory usage over 60 seconds
    Then memory usage should not exceed 100MB
    And there should be no significant memory leaks
    And garbage collection should occur regularly

  Scenario: CPU usage during intensive operations
    Given the game is loaded in headless mode
    When I spawn 100 ants simultaneously
    And I monitor CPU usage for 30 seconds
    Then CPU usage should stabilize after the initial spike
    And the game should remain responsive
    And frame rate should not drop below 20 FPS

  Scenario: Network resource optimization
    Given I monitor network requests during page load
    When the game initializes
    Then the total payload should be less than 5MB
    And all resources should load successfully
    And there should be no failed network requests

  Scenario: Stress test with multiple operations
    Given the game is running in headless Chrome
    When I perform rapid UI interactions for 60 seconds
    And I spawn and destroy entities continuously
    And I trigger debug mode toggles repeatedly
    Then the game should remain stable
    And performance should not degrade significantly
    And no JavaScript errors should occur

  Scenario: Long-running stability test
    Given the game is running in headless mode
    When I let the game run for 10 minutes
    And I perform random interactions every 30 seconds
    Then the game should continue running without crashes
    And memory usage should remain within acceptable limits
    And the UI should remain responsive

  Scenario: Concurrent browser instances
    Given I have multiple headless Chrome instances
    When I run the game in 3 concurrent browsers
    Then each instance should perform independently
    And there should be no resource conflicts
    And all instances should maintain stable performance