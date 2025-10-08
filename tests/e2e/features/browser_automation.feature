Feature: Browser Automation and Headless Testing
  As a developer
  I want to automate browser testing with Selenium and headless browsers
  So that I can validate game functionality in real browser environments

  Background:
    Given Selenium WebDriver is configured
    And ChromeDriver is available
    And the game server is running locally

  @browser-initialization
  Scenario: Launching game in headless Chrome browser
    Given I configure Chrome for headless mode
    When I navigate to the game URL
    Then the page should load completely
    And the game canvas should be rendered
    And all JavaScript resources should load without errors
    And the game should initialize properly

  @browser-initialization
  Scenario: Launching game in regular Chrome browser
    Given I configure Chrome for normal (non-headless) mode
    When I navigate to the game URL  
    Then the browser window should be visible
    And the game should load with full visual feedback
    And I should be able to interact with the game interface

  @game-functionality-testing
  Scenario: Testing core game functionality via browser automation
    Given the game is loaded in a browser
    When I simulate user interactions through Selenium
    Then ant spawning should work correctly
    And UI buttons should respond to clicks
    And keyboard shortcuts should function as expected
    And the game state should update appropriately

  @ui-interaction-automation
  Scenario: Automated UI debug system testing
    Given the game is running in a browser
    When I send keyboard events for debug activation
    And I simulate mouse clicks on UI elements
    Then debug overlays should appear and disappear correctly
    And UI elements should respond to automated drag operations
    And position changes should persist across browser sessions

  @performance-monitoring
  Scenario: Automated performance testing in browser
    Given the game is running with performance monitoring
    When I execute performance-intensive operations
    Then frame rates should remain within acceptable limits
    And memory usage should stay stable over time
    And performance metrics should be accessible via automation

  @cross-browser-compatibility
  Scenario: Testing game compatibility across browser types
    Given multiple browser drivers are configured
    When I run the same test suite across different browsers
    Then core functionality should work consistently
    And performance should meet minimum requirements
    And UI rendering should be consistent across browsers

  @error-handling-automation
  Scenario: Automated error detection and reporting
    Given the browser automation is monitoring console logs
    When the game encounters various conditions
    Then JavaScript errors should be captured and reported
    And warning messages should be logged appropriately
    And the automation should differentiate between critical and non-critical issues