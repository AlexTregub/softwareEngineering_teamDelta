/**
 * CategoryRadioButtons
 * Radio button UI component for switching between entity categories
 * Displays 3 buttons with icons: Entities (🐜), Buildings (🏠), Resources (🌳)
 */

class CategoryRadioButtons {
  constructor(onChangeCallback = null) {
    this.categories = [
      { id: 'entities', label: 'Entities', icon: '🐜' },
      { id: 'buildings', label: 'Buildings', icon: '🏠' },
      { id: 'resources', label: 'Resources', icon: '🌳' },
      { id: 'custom', label: 'Custom', icon: '💾' }
    ];
    
    this.selected = 'entities';
    this.onChangeCallback = onChangeCallback;
    this.height = 30; // Smaller height for icon-only buttons
  }
  
  /**
   * Select a category
   * @param {string} categoryId - Category ID to select
   */
  select(categoryId) {
    this.selected = categoryId;
    
    // Trigger callback if provided
    if (this.onChangeCallback) {
      this.onChangeCallback(categoryId);
    }
  }
  
  /**
   * Get the currently selected category
   * @returns {string} Selected category ID
   */
  getSelected() {
    return this.selected;
  }
  
  /**
   * Render the radio buttons
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Total width for all buttons
   */
  render(x, y, width) {
    if (typeof push === 'undefined') return; // No rendering in test environment
    
    push();
    
    const buttonWidth = width / this.categories.length;
    
    this.categories.forEach((category, index) => {
      const buttonX = x + (index * buttonWidth);
      const isSelected = this.selected === category.id;
      
      // Draw button background
      if (isSelected) {
        fill(100, 150, 255); // Blue for selected
      } else {
        fill(200); // Gray for unselected
      }
      rect(buttonX, y, buttonWidth, this.height);
      
      // Draw button border for selected
      if (isSelected) {
        fill(50, 100, 200); // Darker blue border
        rect(buttonX, y, buttonWidth, 3); // Top border
      }
      
      // Draw icon only (no text label)
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(18); // Slightly smaller icon size
      text(category.icon, buttonX + buttonWidth / 2, y + this.height / 2);
    });
    
    pop();
  }
  
  /**
   * Handle click on the radio buttons
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {number} x - Buttons X position
   * @param {number} y - Buttons Y position
   * @param {number} width - Total width for all buttons
   * @returns {Object|null} Clicked category object or null
   */
  handleClick(mouseX, mouseY, x, y, width) {
    // Check if click is within button row bounds
    if (mouseY < y || mouseY > y + this.height) {
      return null;
    }
    
    if (mouseX < x || mouseX > x + width) {
      return null;
    }
    
    // Determine which button was clicked
    const buttonWidth = width / this.categories.length;
    const buttonIndex = Math.floor((mouseX - x) / buttonWidth);
    
    if (buttonIndex >= 0 && buttonIndex < this.categories.length) {
      const category = this.categories[buttonIndex];
      this.select(category.id);
      return category;
    }
    
    return null;
  }
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.CategoryRadioButtons = CategoryRadioButtons;
}

// Module export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryRadioButtons;
}
