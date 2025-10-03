Feature: End-to-End User Workflows - Complete System Integration
  As a user of the game application
  I want to interact with the UI and have everything work correctly
  So that I can successfully use all the game features

  Background:
    Given I have opened the game application in a browser
    And all systems have been initialized successfully
    And the debug button is visible and ready for interaction

  Scenario: Complete Debug Button Toggle Workflow
    Given the UI_DEBUG layer is currently enabled
    And I can see debug UI elements on screen
    When I click on the debug button
    Then the debug button click should register correctly
    And the GameActionFactory should receive the button action
    And the action should route to the debug handler
    And the debug handler should call RenderLayerManager.toggleLayer
    And the UI_DEBUG layer should become disabled
    And debug UI elements should disappear from view
    When I click the debug button again
    Then the UI_DEBUG layer should become enabled again
    And debug UI elements should reappear on screen

  Scenario: Button Group Drag and Drop Complete Workflow
    Given I have a draggable button group at position (100, 100)
    And the button group is visible and interactive
    When I click and hold on the button group header
    And I drag the group to position (250, 200)
    And I release the mouse button
    Then the button group should move to position (250, 200)
    And the group's internal position state should update
    And all buttons within the group should move with the group
    And the group should remain functional at the new position
    And button clicks should still work correctly after the move

  Scenario: System Recovery After Error Conditions
    Given the system is running normally
    When I trigger an invalid action that might cause errors
    Then the system should handle the error gracefully
    And the error should not break other functionality
    And I should still be able to interact with other buttons
    And the debug button should still work correctly
    And layer management should continue functioning

  Scenario: Multiple Button Interactions in Complex Sequence
    Given I have multiple button groups with different functions
    When I interact with the debug button to toggle UI_DEBUG
    And I drag a button group to a new position
    And I click various action buttons in sequence
    Then each interaction should work independently
    And the system state should remain consistent
    And no interactions should interfere with each other
    And all button groups should maintain their functionality

  Scenario: Layer Management During Active User Interaction
    Given I am actively dragging a button group
    And the UI_DEBUG layer is enabled
    When I click the debug button while dragging
    Then the debug action should execute correctly
    And the drag operation should continue smoothly
    And the layer toggle should not interfere with the drag
    And both operations should complete successfully

  Scenario: Button System Performance Under Load
    Given I have multiple button groups active
    When I rapidly click multiple buttons in sequence
    And I perform drag operations on different groups
    And I toggle debug mode multiple times quickly
    Then all interactions should register correctly
    And the system should remain responsive
    And no actions should be lost or delayed
    And the UI should update smoothly throughout

  Scenario: Persistence and State Management Integration
    Given I have draggable button groups with persistence enabled
    When I move groups to custom positions
    And I toggle various system states
    And I refresh the browser page
    Then the button groups should reload in their saved positions
    And the system state should be restored correctly
    And all functionality should work as before the refresh

  Scenario: Cross-System Communication and Dependencies
    Given the ButtonGroupManager has created button groups
    And the GameActionFactory has registered action handlers
    And the RenderLayerManager has initialized layers
    When I perform actions that involve all three systems
    Then the systems should communicate correctly
    And data should flow properly between systems
    And the final result should reflect all system interactions

  Scenario: User Experience - Natural Interaction Flow
    Given I am a new user opening the application
    When I see the interface with available buttons
    And I try clicking the debug button to explore
    Then the button should provide clear visual feedback
    And the action should have an obvious effect
    And the UI should guide me to understand what happened
    And I should be able to easily reverse the action

  Scenario: Edge Case Handling - Boundary Conditions
    Given I have button groups positioned at screen edges
    When I try to drag them beyond the screen boundaries
    Then the system should handle the boundary conditions gracefully
    And buttons should remain accessible and clickable
    And no elements should disappear or become unreachable
    And the user experience should remain smooth

  Scenario: Memory Management and Resource Cleanup
    Given I have been using the application extensively
    When I create and remove button groups multiple times
    And I perform many drag operations and state changes
    Then the browser memory usage should remain stable
    And no memory leaks should be detectable
    And the application should continue performing well

  Scenario: Mobile and Touch Device Compatibility
    Given I am using the application on a touch device
    When I try to interact with buttons using touch gestures
    Then touch taps should register as clicks correctly
    And drag operations should work with touch and drag
    And the interface should be responsive to touch input
    And all functionality should work equivalently to mouse input

  Scenario: Accessibility and Keyboard Navigation
    Given I need to use keyboard navigation
    When I use tab keys to navigate between interactive elements
    Then buttons should be focusable and accessible
    And keyboard activation should trigger the same actions as clicking
    And the focus order should follow a logical sequence
    And visual focus indicators should be clear and visible

  Scenario: Error Recovery and System Resilience
    Given the system encounters unexpected conditions
    When JavaScript errors occur in unrelated code
    Or network issues affect resource loading
    Then the button system should remain functional
    And existing button groups should continue working
    And users should be able to continue their workflow
    And the system should degrade gracefully under stress

  Scenario: Real-Time System State Monitoring
    Given I have system monitoring enabled
    When I perform various user interactions
    Then I should be able to observe system state changes in real-time
    And performance metrics should be available
    And debugging information should be accessible
    And the monitoring should not impact system performance