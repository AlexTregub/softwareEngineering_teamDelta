Feature: Button Image and Texture Rendering - Browser Integration Testing
  As a UI designer
  I want buttons to support images and textures
  So that I can create visually rich and branded user interfaces

  Background:
    Given I have opened the game application in a browser
    And the button system has been initialized
    And I have image assets available for testing

  Scenario: Button with image renders correctly
    Given I have a button configured with an image texture
    When the button is rendered to the canvas
    Then the image should be displayed instead of a solid color background
    And the image should be scaled to fit the button dimensions
    And the button text should still be visible if provided

  Scenario: Image button hover effects work correctly
    Given I have a button with an image texture
    When I hover over the button
    Then the image should scale up smoothly
    And the image should have a floating animation effect
    And the image should have a visual tint applied
    And the hover effects should not distort the image quality

  Scenario: Button fallback when image fails to load
    Given I have a button configured with an invalid image path
    When the button is rendered
    Then the button should fall back to solid color rendering
    And the button should remain fully functional
    And no errors should be thrown

  Scenario: Mixed buttons with and without images
    Given I have a button group with some image buttons and some text buttons
    When all buttons are rendered
    Then image buttons should display their textures
    And text buttons should display solid colors
    And all buttons should have consistent interaction behavior
    And the visual styling should be coherent

  Scenario: Image button performance under load
    Given I have multiple buttons with large image textures
    When all buttons are rendered simultaneously
    Then rendering performance should remain smooth
    And memory usage should be reasonable
    And no visual artifacts should appear

  Scenario: Image button with transparency support
    Given I have a button with a PNG image containing transparency
    When the button is rendered
    Then the transparency should be preserved
    And the transparent areas should not interfere with hover detection
    And the visual appearance should be correct

  Scenario: Dynamic image loading and updates
    Given I have a button initially configured without an image
    When I dynamically set an image on the button
    Then the button should update to display the new image
    And the change should be visible in the next render cycle
    And the button functionality should remain intact

  Scenario: Image button sizing and aspect ratio handling
    Given I have buttons with images of different aspect ratios
    When the buttons are rendered with fixed dimensions
    Then images should be scaled to fit the button bounds
    And aspect ratios may be adjusted to fit the button shape
    And the scaling should be consistent and predictable

  Scenario: Image button accessibility and alternative text
    Given I have image buttons in the interface
    When accessibility features are enabled
    Then buttons should have appropriate text captions
    And the image should not replace essential textual information
    And screen readers should be able to identify button purposes

  Scenario: Image button memory management
    Given I have buttons with images that are created and destroyed frequently
    When buttons are removed from the interface
    Then image resources should be properly cleaned up
    And memory leaks should not occur
    And subsequent button creation should work normally