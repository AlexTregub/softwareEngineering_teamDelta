/**
 * @fileoverview Example demonstrating responsive panel scaling based on canvas resolution
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// Example of using the new responsive scaling features

function setupResponsiveScalingExample() {
  // Initialize the panel manager with responsive scaling
  const panelManager = new DraggablePanelManager();
  panelManager.initialize();
  
  // Configure responsive scaling settings
  panelManager.setBaseResolution(1920, 1080); // 1080p base
  panelManager.setResolutionBounds(
    { width: 800, height: 600 },    // Minimum: SVGA
    { width: 3840, height: 2160 }   // Maximum: 4K
  );
  
  // Enable responsive scaling
  panelManager.setResponsiveScaling(true);
  
  // Create a test panel to demonstrate responsive behavior
  const responsivePanel = new DraggablePanel({
    id: 'responsive-test-panel',
    title: 'Responsive Scaling Demo Panel',
    position: { x: 100, y: 100 },
    size: { width: 300, height: 400 },
    buttons: {
      layout: 'vertical',
      spacing: 8,
      buttonWidth: 250,
      buttonHeight: 35,
      items: [
        {
          caption: 'Current Resolution Info',
          onClick: () => {
            const info = panelManager.getResponsiveScalingInfo();
            console.log('📱 Responsive Scaling Info:', info);
            alert(`Resolution: ${info.currentResolution.width}x${info.currentResolution.height}\nScale: ${info.finalScale.toFixed(2)}x\nBase: ${info.baseResolution.width}x${info.baseResolution.height}`);
          },
          style: ButtonStyles.DEFAULT
        },
        {
          caption: 'Toggle Responsive Scaling',
          onClick: () => {
            const enabled = panelManager.toggleResponsiveScaling();
            console.log(`Responsive scaling ${enabled ? 'enabled' : 'disabled'}`);
          },
          style: ButtonStyles.PURPLE
        },
        {
          caption: 'Force Update Scaling',
          onClick: () => {
            panelManager.applyResponsiveScaling(true);
            console.log('Responsive scaling force updated');
          },
          style: ButtonStyles.SUCCESS
        },
        {
          caption: 'Set Base to 720p',
          onClick: () => {
            panelManager.setBaseResolution(1280, 720);
            console.log('Base resolution set to 720p');
          },
          style: ButtonStyles.WARNING
        },
        {
          caption: 'Set Base to 1080p',
          onClick: () => {
            panelManager.setBaseResolution(1920, 1080);
            console.log('Base resolution set to 1080p');
          },
          style: ButtonStyles.SUCCESS
        },
        {
          caption: 'Set Base to 1440p',
          onClick: () => {
            panelManager.setBaseResolution(2560, 1440);
            console.log('Base resolution set to 1440p');
          },
          style: ButtonStyles.WARNING
        },
        {
          caption: 'Reset to Manual Scale',
          onClick: () => {
            panelManager.setResponsiveScaling(false);
            panelManager.resetScale();
            console.log('Switched to manual scaling');
          },
          style: ButtonStyles.DANGER
        }
      ]
    }
  });
  
  panelManager.addPanel(responsivePanel);
  
  return panelManager;
}

// Predefined resolution configurations for testing
const RESOLUTION_PRESETS = {
  SVGA: { width: 800, height: 600, name: 'SVGA (800x600)' },
  HD: { width: 1280, height: 720, name: 'HD (720p)' },
  FHD: { width: 1920, height: 1080, name: 'Full HD (1080p)' },
  QHD: { width: 2560, height: 1440, name: 'QHD (1440p)' },
  UHD: { width: 3840, height: 2160, name: '4K UHD (2160p)' },
  ULTRAWIDE: { width: 3440, height: 1440, name: 'Ultrawide (3440x1440)' }
};

/**
 * Create a panel with buttons to test different resolution scenarios
 */
function createResolutionTestPanel() {
  const buttons = [];
  
  // Add buttons for each resolution preset
  Object.entries(RESOLUTION_PRESETS).forEach(([key, preset]) => {
    buttons.push({
      caption: `Set Base: ${preset.name}`,
      onClick: () => {
        if (typeof g_draggablePanelManager !== 'undefined') {
          g_draggablePanelManager.setBaseResolution(preset.width, preset.height);
        }
      },
      style: ButtonStyles.DEFAULT
    });
  });
  
  // Add utility buttons
  buttons.push(
    {
      caption: 'Show Current Scale Info',
      onClick: () => {
        if (typeof g_draggablePanelManager !== 'undefined') {
          const info = g_draggablePanelManager.getResponsiveScalingInfo();
          console.table({
            'Current Resolution': `${info.currentResolution.width}x${info.currentResolution.height}`,
            'Base Resolution': `${info.baseResolution.width}x${info.baseResolution.height}`,
            'Scale Factor X': info.scaleFactorX.toFixed(3),
            'Scale Factor Y': info.scaleFactorY.toFixed(3),
            'Final Scale': info.finalScale.toFixed(3),
            'Global Scale': info.currentGlobalScale.toFixed(3),
            'Responsive Enabled': info.enabled
          });
        }
      },
      style: ButtonStyles.PURPLE
    },
    {
      caption: 'Simulate 720p Canvas',
      onClick: () => {
        console.log('🔧 Note: This would require canvas resize - check console for current calculations');
        // This is a demo - actual canvas resizing would need to be implemented in the main application
      },
      style: ButtonStyles.WARNING
    }
  );
  
  return new DraggablePanel({
    id: 'resolution-test-panel',
    title: 'Resolution Testing Panel',
    position: { x: 450, y: 100 },
    size: { width: 280, height: 500 },
    buttons: {
      layout: 'vertical',
      spacing: 5,
      buttonWidth: 250,
      buttonHeight: 28,
      items: buttons
    }
  });
}

// Window resize handler for testing responsive scaling
function handleWindowResize() {
  if (typeof g_draggablePanelManager !== 'undefined' && g_draggablePanelManager.responsiveScaling.enabled) {
    // The panel manager automatically handles this in its update() method
    console.log(`🔄 Window resized to ${window.innerWidth}x${window.innerHeight}`);
  }
}

// Add window resize listener
if (typeof window !== 'undefined') {
  window.addEventListener('resize', handleWindowResize);
}

// Example usage in your main sketch:
/*
let panelManager;

function setup() {
  createCanvas(windowWidth, windowHeight); // Use full window
  panelManager = setupResponsiveScalingExample();
  
  // Add resolution test panel
  const testPanel = createResolutionTestPanel();
  panelManager.addPanel(testPanel);
}

function draw() {
  background(50);
  
  // Update and render panels
  panelManager.update(mouseX, mouseY, mouseIsPressed);
  panelManager.render();
  
  // Show current resolution info
  fill(255);
  textAlign(LEFT, TOP);
  textSize(16);
  text(`Canvas: ${width}x${height}`, 10, 10);
  text(`Window: ${windowWidth}x${windowHeight}`, 10, 30);
  
  const scaleInfo = panelManager.getResponsiveScalingInfo();
  text(`Scale: ${scaleInfo.finalScale.toFixed(2)}x (${scaleInfo.enabled ? 'Auto' : 'Manual'})`, 10, 50);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Responsive scaling will be handled automatically in the next update() call
}
*/

// Utility functions for responsive scaling

/**
 * Get scale factor for a specific resolution compared to base
 */
function getScaleFactorForResolution(targetWidth, targetHeight, baseWidth = 1920, baseHeight = 1080) {
  const scaleX = targetWidth / baseWidth;
  const scaleY = targetHeight / baseHeight;
  return {
    x: scaleX,
    y: scaleY,
    average: (scaleX + scaleY) / 2,
    min: Math.min(scaleX, scaleY),
    max: Math.max(scaleX, scaleY)
  };
}

/**
 * Recommend good min/max resolutions based on common screen sizes
 */
function getRecommendedResolutionBounds() {
  return {
    // Minimum: Older tablets and small laptops
    min: { width: 800, height: 600, name: 'SVGA' },
    
    // Maximum: High-end 4K displays
    max: { width: 3840, height: 2160, name: '4K UHD' },
    
    // Common resolutions to test with
    common: [
      { width: 1280, height: 720, name: 'HD (720p)' },
      { width: 1366, height: 768, name: 'WXGA' },
      { width: 1920, height: 1080, name: 'Full HD (1080p)' },
      { width: 2560, height: 1440, name: 'QHD (1440p)' },
      { width: 3440, height: 1440, name: 'Ultrawide' }
    ]
  };
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.setupResponsiveScalingExample = setupResponsiveScalingExample;
  window.createResolutionTestPanel = createResolutionTestPanel;
  window.getScaleFactorForResolution = getScaleFactorForResolution;
  window.getRecommendedResolutionBounds = getRecommendedResolutionBounds;
  window.RESOLUTION_PRESETS = RESOLUTION_PRESETS;
}