// @ts-nocheck
/**
 * @fileoverview Slider Usage Examples
 * Demonstrates how to use the abstracted Slider component system
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * Example: Creating Color Sliders for RGB Values
 * This shows how to abstract the color slider functionality from PlayerFactionSetup
 */
function createColorSliderExample() {
  // State to store current color values
  const colorState = { r: 128, g: 64, b: 255 };
  
  // Create RGB color sliders using the new system
  const colorSliders = createSliderGroup([
    {
      label: 'Red',
      value: colorState.r,
      min: 0,
      max: 255,
      color: [255, 0, 0],
      onChange: (value) => {
        colorState.r = Math.round(value);
        console.log(`Red updated to: ${colorState.r}`);
        updateColorPreview();
      }
    },
    {
      label: 'Green',
      value: colorState.g,
      min: 0,
      max: 255,
      color: [0, 255, 0],
      onChange: (value) => {
        colorState.g = Math.round(value);
        console.log(`Green updated to: ${colorState.g}`);
        updateColorPreview();
      }
    },
    {
      label: 'Blue',
      value: colorState.b,
      min: 0,
      max: 255,
      color: [0, 0, 255],
      onChange: (value) => {
        colorState.b = Math.round(value);
        console.log(`Blue updated to: ${colorState.b}`);
        updateColorPreview();
      }
    }
  ]);
  
  function updateColorPreview() {
    console.log(`Current RGB: (${colorState.r}, ${colorState.g}, ${colorState.b})`);
    // Here you would update your color preview display
  }
  
  // In your update loop
  function updateLoop() {
    if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined' && typeof mouseIsPressed !== 'undefined') {
      updateSliderGroup(colorSliders, mouseX, mouseY, mouseIsPressed);
    }
  }
  
  // In your render loop
  function renderLoop() {
    // Render all sliders with 45px spacing
    renderSliderGroup(colorSliders, 50, 150, 300, 45);
  }
  
  return { colorSliders, colorState, updateLoop, renderLoop };
}

/**
 * Example: Creating Audio Volume Sliders
 * Shows how the slider system can be used for different types of values
 */
function createAudioSliderExample() {
  const audioSettings = { master: 0.8, music: 0.6, effects: 0.9 };
  
  const audioSliders = createSliderGroup([
    {
      label: 'Master',
      value: audioSettings.master * 100,
      min: 0,
      max: 100,
      step: 5,
      color: [100, 200, 100],
      precision: 0,
      valueFormat: '{value}%',
      onChange: (value) => {
        audioSettings.master = value / 100;
        console.log(`Master volume: ${audioSettings.master}`);
      }
    },
    {
      label: 'Music',
      value: audioSettings.music * 100,
      min: 0,
      max: 100,
      step: 5,
      color: [100, 100, 200],
      precision: 0,
      valueFormat: '{value}%',
      onChange: (value) => {
        audioSettings.music = value / 100;
        console.log(`Music volume: ${audioSettings.music}`);
      }
    },
    {
      label: 'Effects',
      value: audioSettings.effects * 100,
      min: 0,
      max: 100,
      step: 5,
      color: [200, 100, 100],
      precision: 0,
      valueFormat: '{value}%',
      onChange: (value) => {
        audioSettings.effects = value / 100;
        console.log(`Effects volume: ${audioSettings.effects}`);
      }
    }
  ]);
  
  return { audioSliders, audioSettings };
}

/**
 * Example: Creating Custom Sliders for Game Settings
 * Demonstrates advanced slider configurations
 */
function createGameSettingsSliderExample() {
  const gameSettings = {
    difficulty: 5,
    speed: 1.0,
    spawnRate: 50
  };
  
  const settingsSliders = createSliderGroup([
    {
      label: 'Difficulty',
      value: gameSettings.difficulty,
      min: 1,
      max: 10,
      step: 1,
      color: [255, 165, 0], // Orange
      onChange: (value) => {
        gameSettings.difficulty = Math.round(value);
        console.log(`Difficulty set to: ${gameSettings.difficulty}`);
      }
    },
    {
      label: 'Game Speed',
      value: gameSettings.speed,
      min: 0.1,
      max: 3.0,
      step: 0.1,
      precision: 1,
      color: [50, 200, 200],
      valueFormat: '{value}x',
      onChange: (value) => {
        gameSettings.speed = parseFloat(value.toFixed(1));
        console.log(`Game speed: ${gameSettings.speed}x`);
      }
    },
    {
      label: 'Spawn Rate',
      value: gameSettings.spawnRate,
      min: 10,
      max: 200,
      step: 10,
      color: [200, 50, 200],
      valueFormat: '{value}/min',
      onChange: (value) => {
        gameSettings.spawnRate = Math.round(value);
        console.log(`Spawn rate: ${gameSettings.spawnRate} per minute`);
      }
    }
  ]);
  
  return { settingsSliders, gameSettings };
}

/**
 * Example: Individual Slider Usage
 * Shows how to create and use individual sliders
 */
function createSingleSliderExample() {
  let healthValue = 100;
  
  const healthSlider = new Slider({
    label: 'Health',
    value: healthValue,
    min: 0,
    max: 100,
    color: [255, 50, 50],
    onChange: (value) => {
      healthValue = Math.round(value);
      console.log(`Health: ${healthValue}%`);
      
      // Update health bar color based on value
      if (healthValue < 25) {
        healthSlider.updateConfig({ color: [255, 0, 0] }); // Red
      } else if (healthValue < 50) {
        healthSlider.updateConfig({ color: [255, 165, 0] }); // Orange
      } else {
        healthSlider.updateConfig({ color: [0, 255, 0] }); // Green
      }
    }
  });
  
  // Programmatically set value
  function healPlayer(amount) {
    const newHealth = Math.min(100, healthValue + amount);
    healthSlider.setValue(newHealth);
  }
  
  // Programmatically damage player
  function damagePlayer(amount) {
    const newHealth = Math.max(0, healthValue - amount);
    healthSlider.setValue(newHealth);
  }
  
  return { healthSlider, healPlayer, damagePlayer };
}

/**
 * Integration example showing how PlayerFactionSetup now uses the abstracted sliders
 */
function playerFactionSetupIntegration() {
  // This is how PlayerFactionSetup now creates its color sliders
  const colorSliders = createSliderGroup([
    {
      label: 'Red',
      value: 100,
      min: 0,
      max: 255,
      color: [255, 0, 0],
      onChange: (value) => {
        // Updates playerData.color.r automatically
        console.log('Red faction color:', value);
      }
    },
    {
      label: 'Green',
      value: 150,
      min: 0,
      max: 255,
      color: [0, 255, 0],
      onChange: (value) => {
        // Updates playerData.color.g automatically
        console.log('Green faction color:', value);
      }
    },
    {
      label: 'Blue',
      value: 255,
      min: 0,
      max: 255,
      color: [0, 0, 255],
      onChange: (value) => {
        // Updates playerData.color.b automatically
        console.log('Blue faction color:', value);
      }
    }
  ]);
  
  // Reset colors function now uses slider setValue method
  function resetColors() {
    colorSliders[0].setValue(100); // Red
    colorSliders[1].setValue(150); // Green
    colorSliders[2].setValue(255); // Blue
  }
  
  // Update and render calls are now simplified
  function update() {
    updateSliderGroup(colorSliders, mouseX, mouseY, mouseIsPressed);
  }
  
  function render() {
    renderSliderGroup(colorSliders, 50, 200, 350, 40);
  }
  
  return { colorSliders, resetColors, update, render };
}

// Export examples for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createColorSliderExample,
    createAudioSliderExample,
    createGameSettingsSliderExample,
    createSingleSliderExample,
    playerFactionSetupIntegration
  };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.SliderExamples = {
    createColorSliderExample,
    createAudioSliderExample,
    createGameSettingsSliderExample,
    createSingleSliderExample,
    playerFactionSetupIntegration
  };
  
  console.log('🎚️ Slider examples loaded - access via window.SliderExamples');
}