/**
 * Unit Tests for DraggablePanel - Auto-Sizing to Content
 * Tests the new feature where panels auto-resize width and height based on actual button content:
 * - HEIGHT: Calculated from tallest column of buttons + vertical padding
 * - WIDTH: Calculated from widest row of buttons + horizontal padding
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('DraggablePanel - Auto-Sizing to Content', () => {
  let DraggablePanel;
  let Button;
  let ButtonStyles;
  let panel;
  let localStorageGetItemStub;
  let localStorageSetItemStub;

  before(() => {
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.textSize = sinon.stub();
    global.textAlign = sinon.stub();
    global.text = sinon.stub();
    global.textWidth = sinon.stub().returns(50);
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';

    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;

    // Mock window
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080
    };

    // Mock localStorage
    localStorageGetItemStub = sinon.stub();
    localStorageSetItemStub = sinon.stub();
    global.localStorage = {
      getItem: localStorageGetItemStub,
      setItem: localStorageSetItemStub
    };

    // Mock Button class with height property
    Button = class {
      constructor(x, y, width, height, caption, style) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.caption = caption;
        this.style = style;
      }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
      }
      update() { return false; }
      render() {}
      autoResize() {}
      autoResizeForText() { return false; }
    };
    global.Button = Button;

    // Mock ButtonStyles
    ButtonStyles = {
      DEFAULT: {
        backgroundColor: '#cccccc',
        color: '#000000'
      }
    };
    global.ButtonStyles = ButtonStyles;

    // Load DraggablePanel
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
  });

  beforeEach(() => {
    // Reset stubs
    localStorageGetItemStub.reset();
    localStorageSetItemStub.reset();
    localStorageGetItemStub.returns(null);
  });

  describe('Configuration - autoSizeToContent field', () => {
    it('should accept autoSizeToContent: true in configuration', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 40, width: 80 }
          ]
        }
      });

      expect(panel.config.buttons.autoSizeToContent).to.equal(true);
    });

    it('should default to false when autoSizeToContent is not specified', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        position: { x: 100, y: 100 },
        buttons: {
          layout: 'grid',
          columns: 2,
          items: [
            { caption: 'Button 1' },
            { caption: 'Button 2' }
          ]
        }
      });

      expect(panel.config.buttons.autoSizeToContent).to.be.false;
    });

    it('should accept verticalPadding configuration', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          verticalPadding: 15,
          items: []
        }
      });

      expect(panel.config.buttons.verticalPadding).to.equal(15);
    });

    it('should default verticalPadding to 10 when not specified', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: []
        }
      });

      expect(panel.config.buttons.verticalPadding).to.equal(10);
    });

    it('should accept horizontalPadding configuration', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          horizontalPadding: 20,
          items: []
        }
      });

      expect(panel.config.buttons.horizontalPadding).to.equal(20);
    });

    it('should default horizontalPadding to 10 when not specified', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: []
        }
      });

      expect(panel.config.buttons.horizontalPadding).to.equal(10);
    });
  });

  describe('calculateTallestColumnHeight() method', () => {
    it('should find tallest column in 2-column grid', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40 },  // Col 0, Row 0
            { caption: 'Button 2', height: 35 },  // Col 1, Row 0
            { caption: 'Button 3', height: 50 },  // Col 0, Row 1
            { caption: 'Button 4', height: 30 },  // Col 1, Row 1
            { caption: 'Button 5', height: 45 }   // Col 0, Row 2
          ]
        }
      });

      // Column 0: 40 + 5 + 50 + 5 + 45 = 145
      // Column 1: 35 + 5 + 30 = 70
      // Tallest = 145
      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(145);
    });

    it('should find tallest column in 4-column grid', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 4,
          spacing: 5,
          autoSizeToContent: true,
          items: [
            { caption: 'Btn 1', height: 40 },  // Col 0
            { caption: 'Btn 2', height: 60 },  // Col 1 (tallest column)
            { caption: 'Btn 3', height: 30 },  // Col 2
            { caption: 'Btn 4', height: 25 },  // Col 3
            { caption: 'Btn 5', height: 35 },  // Col 0
            { caption: 'Btn 6', height: 55 },  // Col 1
            { caption: 'Btn 7', height: 38 },  // Col 2
            { caption: 'Btn 8', height: 28 }   // Col 3
          ]
        }
      });

      // Column 0: 40 + 5 + 35 = 80
      // Column 1: 60 + 5 + 55 = 120 ← Tallest
      // Column 2: 30 + 5 + 38 = 73
      // Column 3: 25 + 5 + 28 = 58
      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(120);
    });

    it('should handle uneven grid (incomplete last row)', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 3,
          spacing: 8,
          autoSizeToContent: true,
          items: [
            { caption: 'Btn 1', height: 40 },  // Col 0
            { caption: 'Btn 2', height: 35 },  // Col 1
            { caption: 'Btn 3', height: 50 },  // Col 2
            { caption: 'Btn 4', height: 45 }   // Col 0 (last row incomplete)
          ]
        }
      });

      // Column 0: 40 + 8 + 45 = 93 ← Tallest
      // Column 1: 35
      // Column 2: 50
      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(93);
    });

    it('should calculate correctly for vertical layout', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'vertical',
          spacing: 5,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40 },
            { caption: 'Button 2', height: 50 },
            { caption: 'Button 3', height: 30 }
          ]
        }
      });

      // Vertical layout: sum all heights + spacing
      // 40 + 5 + 50 + 5 + 30 = 130
      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(130);
    });

    it('should return 0 when no buttons exist', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: []
        }
      });

      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(0);
    });

    it('should handle single button', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          items: [{ caption: 'Only Button', height: 50 }]
        }
      });

      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(50);
    });
  });

  describe('calculateWidestRowWidth() method', () => {
    it('should find widest row in 2-column grid', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 10,
          autoSizeToContent: true,
          items: [
            { caption: 'Btn 1', width: 80 },  // Row 0
            { caption: 'Btn 2', width: 90 },  // Row 0
            { caption: 'Btn 3', width: 100 }, // Row 1 (widest)
            { caption: 'Btn 4', width: 120 }, // Row 1
            { caption: 'Btn 5', width: 60 }   // Row 2
          ]
        }
      });

      // Row 0: 80 + 10 + 90 = 180
      // Row 1: 100 + 10 + 120 = 230 ← Widest
      // Row 2: 60
      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(230);
    });

    it('should find widest row in 4-column grid', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 4,
          spacing: 5,
          autoSizeToContent: true,
          items: [
            { caption: 'A', width: 50 },  // Row 0
            { caption: 'B', width: 60 },
            { caption: 'C', width: 55 },
            { caption: 'D', width: 65 },  // Row 0 total: 50+5+60+5+55+5+65 = 245 ← Widest
            { caption: 'E', width: 40 },  // Row 1
            { caption: 'F', width: 45 },
            { caption: 'G', width: 50 },
            { caption: 'H', width: 40 }   // Row 1 total: 40+5+45+5+50+5+40 = 190
          ]
        }
      });

      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(245);
    });

    it('should handle incomplete last row', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 3,
          spacing: 8,
          autoSizeToContent: true,
          items: [
            { caption: 'Btn 1', width: 80 },  // Row 0
            { caption: 'Btn 2', width: 90 },
            { caption: 'Btn 3', width: 100 }, // Row 0: 80+8+90+8+100 = 286 ← Widest
            { caption: 'Btn 4', width: 120 }, // Row 1: 120 (incomplete)
          ]
        }
      });

      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(286);
    });

    it('should calculate correctly for vertical layout', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'vertical',
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', width: 100 },
            { caption: 'Button 2', width: 120 },
            { caption: 'Button 3', width: 80 }
          ]
        }
      });

      // Vertical layout: return widest button
      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(120);
    });

    it('should return 0 when no buttons exist', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: []
        }
      });

      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(0);
    });

    it('should handle single button', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [{ caption: 'Only', width: 85 }]
        }
      });

      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(85);
    });
  });

  describe('autoResizeToFitContent() with autoSizeToContent', () => {
    it('should resize both width and height based on content', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 }, // Initial size (will be resized)
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 15,
          items: [
            { caption: 'Btn 1', height: 40, width: 80 },  // Row 0
            { caption: 'Btn 2', height: 35, width: 90 },  // Row 0
            { caption: 'Btn 3', height: 50, width: 70 },  // Row 1
            { caption: 'Btn 4', height: 30, width: 85 }   // Row 1
          ]
        }
      });

      // Height calculation:
      // Column 0: 40 + 5 + 50 = 95
      // Column 1: 35 + 5 + 30 = 70
      // Tallest = 95
      // Panel height = titleBar(26.8) + tallest(95) + verticalPadding(20) = 141.8
      
      // Width calculation:
      // Row 0: 80 + 5 + 90 = 175
      // Row 1: 70 + 5 + 85 = 160
      // Widest = 175
      // Panel width = widest(175) + horizontalPadding(30) = 205
      
      expect(panel.config.size.height).to.be.closeTo(141.8, 1);
      expect(panel.config.size.width).to.be.closeTo(205, 1);
    });

    it('should use standard calculation when autoSizeToContent is false', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        size: { width: 200, height: 100 },
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: false, // Explicitly disabled
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 35, width: 90 },
            { caption: 'Button 3', height: 50, width: 70 },
            { caption: 'Button 4', height: 30, width: 85 }
          ]
        }
      });

      // Should use standard grid calculation (max height per row)
      const contentHeight = panel.calculateContentHeight();
      expect(contentHeight).to.be.closeTo(115, 1);
      
      // Width should remain at config value
      expect(panel.config.size.width).to.equal(200);
    });

    it('should include padding in both dimensions', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 20,
          horizontalPadding: 25,
          items: [
            { caption: 'Btn 1', height: 40, width: 80 },
            { caption: 'Btn 2', height: 35, width: 90 }
          ]
        }
      });

      // Height: titleBar(26.8) + max(40,35)(40) + verticalPadding(40) = 106.8
      // Width: (80+5+90)(175) + horizontalPadding(50) = 225
      
      expect(panel.config.size.height).to.be.closeTo(106.8, 1);
      expect(panel.config.size.width).to.be.closeTo(225, 1);
    });

    it('should handle panels with uneven grids', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 3,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: [
            { caption: 'A', height: 30, width: 50 },  // Row 0
            { caption: 'B', height: 35, width: 60 },
            { caption: 'C', height: 40, width: 55 },  // Complete row
            { caption: 'D', height: 45, width: 70 },  // Row 1 (incomplete)
            { caption: 'E', height: 38, width: 65 }
          ]
        }
      });

      // Tallest column:
      // Col 0: 30 + 5 + 45 = 80
      // Col 1: 35 + 5 + 38 = 78
      // Col 2: 40
      // Height = titleBar(26.8) + tallest(80) + verticalPadding(20) = 126.8

      // Widest row:
      // Row 0: 50 + 5 + 60 + 5 + 55 = 175
      // Row 1: 70 + 5 + 65 = 140
      // Width = 175 + 20 = 195
      
      expect(panel.config.size.height).to.be.closeTo(126.8, 1);
      expect(panel.config.size.width).to.be.closeTo(195, 1);
    });

    it('should not auto-size if layout is not grid', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        size: { width: 200, height: 100 },
        buttons: {
          layout: 'vertical', // Not grid layout
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 50, width: 90 }
          ]
        }
      });

      // Should fall back to standard vertical calculation
      const contentHeight = panel.calculateContentHeight();
      expect(contentHeight).to.be.closeTo(115, 1);
      
      // Width should remain unchanged
      expect(panel.config.size.width).to.equal(200);
    });
  });

  describe('Size stability with autoSizeToContent', () => {
    it('should maintain stable dimensions over multiple update cycles', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 35, width: 90 },
            { caption: 'Button 3', height: 50, width: 70 },
            { caption: 'Button 4', height: 30, width: 85 }
          ]
        }
      });

      const initialHeight = panel.config.size.height;
      const initialWidth = panel.config.size.width;

      // Simulate 100 update cycles
      for (let i = 0; i < 100; i++) {
        panel.update();
      }

      expect(panel.config.size.height).to.equal(initialHeight);
      expect(panel.config.size.width).to.equal(initialWidth);
    });

    it('should not trigger saveState during auto-resize', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 35, width: 90 }
          ]
        },
        behavior: {
          persistent: true
        }
      });

      localStorageSetItemStub.resetHistory();

      // Trigger auto-resize by updating
      panel.update();

      // Should NOT have saved state (auto-resize shouldn't save)
      expect(localStorageSetItemStub.called).to.be.false;
    });

    it('should handle floating-point precision without accumulating error', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: [
            { caption: 'Button 1', height: 33.333, width: 77.777 },
            { caption: 'Button 2', height: 35.5, width: 88.888 },
            { caption: 'Button 3', height: 50.666, width: 66.123 },
            { caption: 'Button 4', height: 30.25, width: 82.456 }
          ]
        }
      });

      const heights = [];
      const widths = [];
      
      for (let i = 0; i < 50; i++) {
        panel.update();
        heights.push(panel.config.size.height);
        widths.push(panel.config.size.width);
      }

      // All heights should be identical (no accumulation)
      const uniqueHeights = [...new Set(heights)];
      expect(uniqueHeights.length).to.equal(1);
      
      // All widths should be identical (no accumulation)
      const uniqueWidths = [...new Set(widths)];
      expect(uniqueWidths.length).to.equal(1);
    });
  });

  describe('Edge cases with autoSizeToContent', () => {
    it('should handle single button in grid layout', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: [
            { caption: 'Only Button', height: 50, width: 85 }
          ]
        }
      });

      // Height: titleBar(26.8) + button(50) + verticalPadding(20) = 96.8
      // Width: button(85) + horizontalPadding(20) = 105
      expect(panel.config.size.height).to.be.closeTo(96.8, 1);
      expect(panel.config.size.width).to.be.closeTo(105, 1);
    });

    it('should handle zero-dimension buttons gracefully', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: [
            { caption: 'Button 1', height: 0, width: 0 },
            { caption: 'Button 2', height: 40, width: 80 }
          ]
        }
      });

      // Should handle without errors
      expect(panel.config.size.height).to.be.a('number');
      expect(panel.config.size.height).to.be.greaterThan(0);
      expect(panel.config.size.width).to.be.a('number');
      expect(panel.config.size.width).to.be.greaterThan(0);
    });

    it('should handle very large grids gracefully', () => {
      const items = [];
      for (let i = 0; i < 20; i++) {
        items.push({ caption: `Button ${i}`, height: 40, width: 70 });
      }

      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: items
        }
      });

      // 10 rows × 40px + 9 spacings × 5px = 400 + 45 = 445
      // Height = titleBar(26.8) + tallest(445) + verticalPadding(20) = 491.8
      
      // Each row: 70 + 5 + 70 = 145
      // Width = 145 + horizontalPadding(20) = 165
      
      expect(panel.config.size.height).to.be.closeTo(491.8, 1);
      expect(panel.config.size.width).to.be.closeTo(165, 1);
    });

    it('should handle varying button sizes in different columns/rows', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 3,
          spacing: 8,
          autoSizeToContent: true,
          verticalPadding: 12,
          horizontalPadding: 15,
          items: [
            { caption: 'S', height: 20, width: 40 },   // Row 0
            { caption: 'M', height: 35, width: 70 },
            { caption: 'L', height: 50, width: 100 },
            { caption: 'XL', height: 65, width: 130 }, // Row 1
            { caption: 'XXL', height: 80, width: 160 },
            { caption: 'Tiny', height: 15, width: 30 }
          ]
        }
      });

      // Tallest column calculation:
      // Col 0: 20 + 8 + 65 = 93
      // Col 1: 35 + 8 + 80 = 123 ← Tallest
      // Col 2: 50 + 8 + 15 = 73
      // Height = titleBar(26.8) + tallest(123) + verticalPadding(24) = 173.8

      // Widest row calculation:
      // Row 0: 40 + 8 + 70 + 8 + 100 = 226
      // Row 1: 130 + 8 + 160 + 8 + 30 = 336 ← Widest
      // Width = 336 + 30 = 366

      expect(panel.config.size.height).to.be.closeTo(173.8, 1);
      expect(panel.config.size.width).to.be.closeTo(366, 1);
    });
  });

  describe('Integration with existing features', () => {
    it('should work correctly with minimized state', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        minimized: true,
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 35, width: 90 }
          ]
        }
      });

      expect(panel.state.minimized).to.be.true;
      // Dimensions should still be calculated for when it's expanded
      expect(panel.config.size.height).to.be.greaterThan(0);
      expect(panel.config.size.width).to.be.greaterThan(0);
    });

    it('should work with persistent state enabled', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 35, width: 90 }
          ]
        },
        behavior: {
          persistent: true
        }
      });

      expect(panel.config.behavior.persistent).to.be.true;
      expect(panel.config.size.height).to.be.a('number');
      expect(panel.config.size.width).to.be.a('number');
    });

    it('should respect manual dragging and saving state', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 }
          ]
        },
        behavior: {
          persistent: true,
          draggable: true
        }
      });

      localStorageSetItemStub.resetHistory();

      // Simulate manual drag
      panel.isDragging = true;
      panel.handleDragging(150, 200);
      panel.isDragging = false;

      // Manual drag SHOULD save state
      expect(localStorageSetItemStub.called).to.be.true;
    });

    it('should handle different padding values for width vs height', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 25,     // Different from horizontal
          horizontalPadding: 15,   // Different from vertical
          items: [
            { caption: 'Btn 1', height: 40, width: 80 },
            { caption: 'Btn 2', height: 35, width: 90 }
          ]
        }
      });

      // Height uses verticalPadding: titleBar(26.8) + max(40,35)(40) + vertPad(50) = 116.8
      // Width uses horizontalPadding: (80+5+90)(175) + horizPad(30) = 205
      
      expect(panel.config.size.height).to.be.closeTo(116.8, 1);
      expect(panel.config.size.width).to.be.closeTo(205, 1);
    });
  });
});
