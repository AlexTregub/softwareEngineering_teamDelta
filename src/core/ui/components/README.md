# UI Components

This folder contains reusable UI components that can be used throughout the application.

## Components

### Slider.js

Generic slider component for numeric input with customizable appearance and behavior.

**Features:**

- Configurable ranges, steps, colors, and formatting
- Individual sliders or slider groups
- Full TypeScript definitions and IntelliSense support
- Mouse interaction handling
- Programmatic value control

**Usage:**

```javascript
// Create a single slider
const volumeSlider = new Slider({
  label: 'Volume',
  value: 50,
  min: 0,
  max: 100,
  color: [100, 200, 100],
  onChange: (value) => setVolume(value)
});

// Create a group of related sliders
const colorSliders = createSliderGroup([
  { label: 'Red', value: 255, color: [255, 0, 0], onChange: updateRed },
  { label: 'Green', value: 128, color: [0, 255, 0], onChange: updateGreen },
  { label: 'Blue', value: 64, color: [0, 0, 255], onChange: updateBlue }
]);
```

**Type Definitions:** `types/ui_components/slider-types.d.ts`

## Adding New Components

When adding new reusable UI components:

1. Create the component JavaScript file in this folder
2. Add corresponding TypeScript definitions in `types/ui_components/`
3. Update `types/global.d.ts` to reference the new types
4. Add script loading to `index.html`
5. Create usage examples in `docs/usageExamples/`
6. Update this README with component documentation

## Architecture

UI components should:

- Be self-contained and reusable
- Have clear separation between rendering, interaction, and state
- Include comprehensive JSDoc documentation
- Provide TypeScript definitions for IntelliSense
- Follow consistent naming and coding patterns
- Include validation and error handling
- Support both individual and group usage patterns
