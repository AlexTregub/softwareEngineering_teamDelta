Feature: Universal Button System - Browser Integration Testing
  As a UI developer
  I want to ensure the Universal Button System works correctly in the browser
  So that users can interact with buttons and they perform their intended functions

  Background:
    Given I have opened the game application in a browser
    And the ButtonGroupManager has been initialized
    And the GameActionFactory has been initialized
    And the RenderLayerManager has been initialized

  Scenario: ButtonGroupManager creates button groups correctly via public API
    Given I have a valid button group configuration with id "test-group"
    When I call buttonGroupManager.createButtonGroup with the configuration
    Then the ButtonGroupManager should contain exactly 1 active group
    And the active group should have the correct configuration
    And the active group should have a valid ButtonGroup instance

  Scenario: ButtonGroup creates buttons from configuration via public API
    Given I have a ButtonGroup with 2 buttons configured
    When the ButtonGroup initializes and creates buttons
    Then the ButtonGroup should contain exactly 2 button instances
    And each button should have the correct configuration properties
    And each button should be positioned correctly within the group bounds

  Scenario: Button click triggers action execution via public API
    Given I have a debug button with action "debug.toggleGrid"
    When I click on the debug button at its rendered position
    Then the GameActionFactory.executeAction should be called with the correct action
    And the debug action should execute successfully
    And the RenderLayerManager should toggle the UI_DEBUG layer state

  Scenario: RenderLayerManager layer toggling via public API
    Given the UI_DEBUG layer is currently enabled
    When I call renderLayerManager.toggleLayer("UI_DEBUG")
    Then the UI_DEBUG layer should be disabled
    And the disabledLayers set should contain "UI_DEBUG"
    When I call renderLayerManager.toggleLayer("UI_DEBUG") again
    Then the UI_DEBUG layer should be enabled
    And the disabledLayers set should not contain "UI_DEBUG"

  Scenario: Button drag functionality changes position via public API
    Given I have a draggable button group at position (100, 100)
    When I drag the button group from (100, 100) to (200, 150)
    Then the button group position should be updated to (200, 150)
    And the internal position state should reflect the new coordinates
    And subsequent renders should show the group at the new position

  Scenario: ButtonGroupManager manages multiple groups independently
    Given I create a button group with id "group1" at position (50, 50)
    And I create a button group with id "group2" at position (200, 200)
    When I retrieve all active groups from ButtonGroupManager
    Then there should be exactly 2 active groups
    And group "group1" should be at position (50, 50)
    And group "group2" should be at position (200, 200)
    And each group should maintain independent state

  Scenario: Action execution chain validation
    Given I have a button with action "debug.toggleGrid"
    When I click the button
    Then ButtonGroup.handleClick should be called
    And ButtonGroup.handleClick should call GameActionFactory.executeAction
    And GameActionFactory.executeAction should call the debug handler
    And the debug handler should call RenderLayerManager.toggleLayer
    And the final result should change the layer state

  Scenario: Button visibility affects interaction
    Given I have a button group that is visible
    When the button group visibility is set to false via setVisible(false)
    Then button clicks should not register
    And the group should not appear in render output
    When the button group visibility is set to true via setVisible(true)
    Then button clicks should register normally
    And the group should appear in render output

  Scenario: Button group bounds calculation accuracy
    Given I have a button group with 3 buttons of different sizes
    When I call getBounds() on the button group
    Then the returned bounds should encompass all buttons plus padding
    And the bounds width should equal sum of button widths plus spacing and padding
    And the bounds height should equal the maximum button height plus padding

  Scenario: localStorage persistence for button positions
    Given I have a draggable button group with persistence enabled
    And the storage key is "test-persist-group"
    When I move the button group to position (300, 250)
    And the position is saved to localStorage
    Then localStorage should contain the position data under "test-persist-group"
    When I create a new button group with the same storage key
    Then the new button group should load the saved position (300, 250)

  Scenario: Error handling in button system
    Given I have invalid button configuration data
    When I attempt to create a ButtonGroup with the invalid data
    Then the system should handle the error gracefully
    And default values should be used where possible
    And no JavaScript errors should be thrown

  Scenario: Button styling and rendering integration
    Given I have a button with custom styling properties
    When the button is rendered to the canvas
    Then the button should appear with the correct background color
    And the button text should be rendered with the correct font and color
    And hover states should change the button appearance appropriately

  Scenario: Multiple button interactions in sequence
    Given I have a button group with 3 different action buttons
    When I click button 1 with action "action1"
    And I click button 2 with action "action2" 
    And I click button 3 with action "action3"
    Then all three actions should execute in the correct order
    And each action should receive the correct button configuration
    And the system state should reflect all three action results

  Scenario: Button group update cycle integration
    Given I have an active button group
    When the game update cycle calls buttonGroup.update()
    Then all buttons in the group should receive update calls
    And mouse interaction state should be processed correctly
    And drag operations should be handled if applicable
    And the group state should remain consistent

  Scenario: Render layer visibility affects button rendering
    Given I have buttons on the UI_DEBUG layer
    When the UI_DEBUG layer is disabled
    Then buttons on that layer should not render
    When the UI_DEBUG layer is enabled
    Then buttons on that layer should render normally
    And button interactions should work as expected