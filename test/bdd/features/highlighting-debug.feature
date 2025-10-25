Feature: Ant Highlighting System Debug
  As a developer debugging the highlighting system
  I want to systematically test each component of the highlighting pipeline
  So that I can identify exactly where the visual highlighting is failing

  Background:
    Given the game is loaded and ready
    And the ShareholderDemo is initialized
    And there is a test ant on screen

  @critical @debug
  Scenario: Verify RenderController Availability
    Given I am debugging the highlighting system
    When I check if RenderController class is available globally
    Then RenderController should be defined in the global scope
    And RenderController should be a function constructor
    And RenderController should have prototype methods for highlighting

  @critical @debug
  Scenario: Verify Test Ant Has RenderController Instance
    Given there is a test ant created by ShareholderDemo
    When I check the ant's controller system
    Then the ant should have a '_controllers' Map
    And the controllers Map should contain a 'render' key
    And the render controller should be an instance of RenderController
    And the render controller should have highlighting methods available

  @critical @debug
  Scenario: Verify Entity Highlight API Availability
    Given there is a test ant created by ShareholderDemo
    When I check the ant's highlight API
    Then the ant should have a 'highlight' property
    And the highlight property should have a 'set' method
    And the highlight property should have a 'clear' method
    And the highlight.set method should accept type and intensity parameters

  @critical @debug
  Scenario: Test Direct RenderController Highlight Setting
    Given there is a test ant with a RenderController
    When I call 'testAnt._renderController.setHighlight("SELECTED", 1.0)' directly
    Then the RenderController should have '_highlightState' set to "SELECTED"
    And the RenderController should have '_highlightIntensity' set to 1.0
    And the RenderController should have '_highlightColor' set to the SELECTED color
    And calling 'getHighlightState()' should return "SELECTED"
    And calling 'isHighlighted()' should return true

  @critical @debug
  Scenario: Test Entity Highlight API Setting
    Given there is a test ant with Entity highlight API
    When I call 'testAnt.highlight.set("SELECTED", 1.0)' via Entity API
    Then the underlying RenderController should receive the highlight
    And the RenderController state should match the direct setting test
    And the highlight should persist across multiple checks

  @critical @debug
  Scenario: Test P5.js Function Availability During Rendering
    Given there is a test ant with highlighting set
    When the ant's render method is called
    Then p5.js functions should be available in the rendering context
    And 'stroke' function should be defined
    And 'fill' function should be defined
    And 'rect' function should be defined
    And 'strokeWeight' function should be defined
    And 'noFill' function should be defined
    And 'noStroke' function should be defined

  @critical @debug
  Scenario: Test RenderController Highlight Rendering Methods
    Given there is a test ant with "SELECTED" highlight set
    When I call the RenderController's 'renderHighlighting()' method
    Then the method should execute without errors
    And the method should call 'renderOutlineHighlight' for SELECTED type
    And the renderOutlineHighlight should attempt to call p5.js functions
    And p5.js functions should be successfully called

  @critical @debug
  Scenario: Test Complete Render Pipeline
    Given there is a test ant with "SELECTED" highlight set
    When I call the ant's 'render()' method
    Then the ant should call 'super.render()' (Entity.render)
    And Entity.render should call 'renderController.render()'
    And RenderController.render should call 'renderHighlighting()'
    And renderHighlighting should call the appropriate highlight render method
    And highlight visuals should appear on screen

  @visual @debug
  Scenario: Visual Verification of Highlight Colors
    Given there is a test ant positioned at coordinates (200, 200)
    When I set the ant highlight to "SELECTED"
    Then I should see a green outline around the ant
    And the outline should have stroke weight of 3 pixels
    And the outline should be approximately 6 pixels larger than the ant (3px on each side)

  @visual @debug
  Scenario: Visual Verification of Different Highlight Types
    Given there is a test ant positioned at coordinates (200, 200)
    When I cycle through different highlight types:
      | highlightType | expectedColor | expectedStyle | expectedStrokeWeight |
      | SELECTED      | green         | outline       | 3                    |
      | HOVER         | white         | outline       | 2                    |
      | BOX_HOVERED   | light green   | outline       | 2                    |
      | COMBAT        | red           | pulse         | 3                    |
    Then each highlight should be visually distinct
    And the colors should match the expected values
    And the styles should render correctly

  @integration @debug
  Scenario: Test Highlight Persistence Across Frames
    Given there is a test ant with "SELECTED" highlight set
    When I wait for 5 animation frames
    And I check the highlight state after each frame
    Then the highlight should remain "SELECTED" throughout
    And the highlight should not be cleared automatically
    And the visual highlight should remain visible

  @integration @debug
  Scenario: Test ShareholderDemo Highlight Cycling
    Given the ShareholderDemo is running
    When the demo cycles through highlight states
    Then each highlight should be set correctly
    And each highlight should be visible for the expected duration
    And the transitions between highlights should be smooth
    And no highlight should be skipped or cleared prematurely

  @error @debug
  Scenario: Capture Console Errors During Highlighting
    Given there is a test ant ready for highlighting
    When I enable console error monitoring
    And I attempt to set various highlight types
    Then there should be no JavaScript errors in the console
    And there should be no p5.js function availability warnings
    And there should be no RenderController errors
    And all highlight operations should complete successfully

  @performance @debug
  Scenario: Verify Highlighting Performance
    Given there is a test ant with highlighting enabled
    When I measure the time taken for highlight operations
    Then setting a highlight should take less than 5ms
    And rendering with highlight should take less than 16ms (60fps)
    And there should be no memory leaks from highlight operations
    And the frame rate should remain stable with highlights active