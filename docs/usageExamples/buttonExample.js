/**
 * @fileoverview Example usage of the Button class
 * Demonstrates how to create and use interactive buttons with different styles.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// Example usage of Button class
// This would typically go in your main sketch.js or a UI manager

let buttons = [];

function setupButtons() {
  // Basic green button
  const basicButton = new Button(50, 50, 120, 40, "Basic Button", {
    onClick: (btn) => {
      console.log("Basic button clicked!");
    }
  });
  
  // Red danger button
  const dangerButton = new Button(200, 50, 120, 40, "Delete", {
    backgroundColor: '#dc3545',
    hoverColor: '#c82333',
    textColor: 'white',
    onClick: (btn) => {
      console.log("Danger button clicked!");
      btn.setCaption("Deleted!");
      setTimeout(() => btn.setCaption("Delete"), 1000);
    }
  });
  
  // Blue info button with rounded corners
  const infoButton = new Button(350, 50, 120, 40, "Info", {
    backgroundColor: '#17a2b8',
    hoverColor: '#138496',
    textColor: 'white',
    cornerRadius: 20,
    onClick: (btn) => {
      alert("This is an info button!");
    }
  });
  
  // Custom styled button
  const customButton = new Button(50, 120, 150, 50, "Custom Style", {
    backgroundColor: '#6f42c1',
    hoverColor: '#5a2d91',
    textColor: '#ffffff',
    borderColor: '#d1ecf1',
    borderWidth: 3,
    cornerRadius: 10,
    fontSize: 18,
    onClick: (btn) => {
      // Cycle through different colors
      const colors = ['#6f42c1', '#e83e8c', '#fd7e14', '#20c997'];
      const currentIndex = colors.indexOf(btn.backgroundColor);
      const nextIndex = (currentIndex + 1) % colors.length;
      btn.setBackgroundColor(colors[nextIndex]);
    }
  });
  
  // Disabled button example
  const disabledButton = new Button(220, 120, 120, 50, "Disabled", {
    enabled: false,
    onClick: (btn) => {
      console.log("This won't be called");
    }
  });
  
  // Toggle button example
  let isToggled = false;
  const toggleButton = new Button(360, 120, 120, 50, "Toggle: OFF", {
    backgroundColor: '#6c757d',
    hoverColor: '#545b62',
    onClick: (btn) => {
      isToggled = !isToggled;
      if (isToggled) {
        btn.setCaption("Toggle: ON");
        btn.setBackgroundColor('#28a745');
        btn.setHoverColor('#218838');
      } else {
        btn.setCaption("Toggle: OFF");
        btn.setBackgroundColor('#6c757d');
        btn.setHoverColor('#545b62');
      }
    }
  });
  
  buttons = [basicButton, dangerButton, infoButton, customButton, disabledButton, toggleButton];
}

function updateButtons() {
  // Update all buttons with current mouse state
  for (let button of buttons) {
    button.update(mouseX, mouseY, mouseIsPressed);
  }
}

function renderButtons() {
  // Render all buttons
  for (let button of buttons) {
    button.render();
  }
}

// In your main p5.js sketch:
/*
function setup() {
  createCanvas(800, 600);
  setupButtons();
}

function draw() {
  background(240);
  
  // Update and render buttons
  updateButtons();
  renderButtons();
  
  // Draw instructions
  fill(0);
  textAlign(LEFT);
  textSize(14);
  text("Click the buttons to see different interactions!", 50, 200);
  text("• Basic: Simple click handler", 50, 220);
  text("• Delete: Changes caption temporarily", 50, 240);
  text("• Info: Shows alert dialog", 50, 260);
  text("• Custom: Cycles through colors", 50, 280);
  text("• Disabled: Cannot be clicked", 50, 300);
  text("• Toggle: Switches between ON/OFF", 50, 320);
}
*/

// For creating buttons dynamically:
function createColoredButton(x, y, caption, color) {
  return new Button(x, y, 100, 35, caption, {
    backgroundColor: color,
    hoverColor: adjustBrightness(color, -20),
    onClick: (btn) => {
      console.log(`${caption} button clicked!`);
    }
  });
}

// Helper function to adjust color brightness
function adjustBrightness(hexColor, amount) {
  const hex = hexColor.slice(1);
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// Example of creating a button grid
function createButtonGrid(startX, startY, cols, rows, buttonSize, spacing) {
  const gridButtons = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * (buttonSize + spacing);
      const y = startY + row * (buttonSize + spacing);
      
      const button = new Button(x, y, buttonSize, buttonSize, `${col},${row}`, {
        backgroundColor: `hsl(${(col * 60 + row * 40) % 360}, 70%, 50%)`,
        fontSize: 12,
        onClick: (btn) => {
          console.log(`Grid button clicked: ${btn.caption}`);
        }
      });
      
      gridButtons.push(button);
    }
  }
  
  return gridButtons;
}