/**
 * Unit Tests for textRenderer
 * Tests text rendering utilities with emoji detection
 */

const { expect } = require('chai');

// Mock p5.js functions
let mockState = {
  pushCalled: false,
  popCalled: false,
  noStrokeCalled: false,
  rectModeCalled: false,
  rectModeValue: null,
  textFontCalled: false,
  textFontValue: null,
  textSizeCalled: false,
  textSizeValue: null,
  fillCalled: false,
  fillValue: null,
  textAlignCalled: false,
  textAlignValues: [],
  textArgExecuted: false
};

global.push = () => { mockState.pushCalled = true; };
global.pop = () => { mockState.popCalled = true; };
global.noStroke = () => { mockState.noStrokeCalled = true; };
global.rectMode = (mode) => { 
  mockState.rectModeCalled = true;
  mockState.rectModeValue = mode;
};
global.CENTER = 'center';
global.textFont = (font) => {
  mockState.textFontCalled = true;
  mockState.textFontValue = font;
};
global.textSize = (size) => {
  mockState.textSizeCalled = true;
  mockState.textSizeValue = size;
};
global.fill = (...args) => {
  mockState.fillCalled = true;
  mockState.fillValue = args;
};
global.textAlign = (...args) => {
  mockState.textAlignCalled = true;
  mockState.textAlignValues = args;
};

// Load textRenderer functions
const textRendererPath = '../../../Classes/systems/text/textRenderer.js';
delete require.cache[require.resolve(textRendererPath)];
const textRendererCode = require('fs').readFileSync(
  require('path').resolve(__dirname, textRendererPath),
  'utf8'
);
eval(textRendererCode);

describe('textRenderer', function() {
  
  beforeEach(function() {
    // Reset mock state
    mockState = {
      pushCalled: false,
      popCalled: false,
      noStrokeCalled: false,
      rectModeCalled: false,
      rectModeValue: null,
      textFontCalled: false,
      textFontValue: null,
      textSizeCalled: false,
      textSizeValue: null,
      fillCalled: false,
      fillValue: null,
      textAlignCalled: false,
      textAlignValues: [],
      textArgExecuted: false
    };
  });
  
  describe('containsEmoji()', function() {
    
    it('should detect smileys', function() {
      expect(containsEmoji('Hello 😀')).to.be.true;
      expect(containsEmoji('😃')).to.be.true;
      expect(containsEmoji('Test 😊 text')).to.be.true;
    });
    
    it('should detect various emoji ranges', function() {
      // Emoticons (1F600-1F64F)
      expect(containsEmoji('😀')).to.be.true;
      expect(containsEmoji('😎')).to.be.true;
      
      // Miscellaneous Symbols (1F300-1F5FF)
      expect(containsEmoji('🌟')).to.be.true;
      expect(containsEmoji('🏠')).to.be.true;
      
      // Transport (1F680-1F6FF)
      expect(containsEmoji('🚀')).to.be.true;
      expect(containsEmoji('🚗')).to.be.true;
      
      // Miscellaneous Symbols (2600-26FF)
      expect(containsEmoji('☀')).to.be.true;
      expect(containsEmoji('⚡')).to.be.true;
    });
    
    it('should not detect regular text', function() {
      expect(containsEmoji('Hello')).to.be.false;
      expect(containsEmoji('Test 123')).to.be.false;
      expect(containsEmoji('abc ABC')).to.be.false;
    });
    
    it('should handle empty strings', function() {
      expect(containsEmoji('')).to.be.false;
    });
    
    it('should handle special characters', function() {
      expect(containsEmoji('!@#$%^&*()')).to.be.false;
      expect(containsEmoji('Hello! How are you?')).to.be.false;
    });
    
    it('should handle mixed content', function() {
      expect(containsEmoji('Numbers 123')).to.be.false;
      expect(containsEmoji('Symbols !@#')).to.be.false;
      expect(containsEmoji('Mixed 123!@#')).to.be.false;
    });
    
    it('should detect emoji at start', function() {
      expect(containsEmoji('😀 Hello')).to.be.true;
    });
    
    it('should detect emoji at end', function() {
      expect(containsEmoji('Hello 😀')).to.be.true;
    });
    
    it('should detect emoji in middle', function() {
      expect(containsEmoji('Hello 😀 World')).to.be.true;
    });
    
    it('should detect multiple emojis', function() {
      expect(containsEmoji('😀😃😊')).to.be.true;
      expect(containsEmoji('Test 😀 more 😃 text')).to.be.true;
    });
  });
  
  describe('textNoStroke()', function() {
    
    const mockStyle = {
      textFont: 'Arial',
      textSize: 16,
      textColor: [255, 255, 255],
      textAlign: ['CENTER', 'TOP']
    };
    
    it('should call push/pop for state isolation', function() {
      const textArg = () => { mockState.textArgExecuted = true; };
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.pushCalled).to.be.true;
      expect(mockState.popCalled).to.be.true;
    });
    
    it('should call noStroke', function() {
      const textArg = () => {};
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.noStrokeCalled).to.be.true;
    });
    
    it('should set rectMode to CENTER', function() {
      const textArg = () => {};
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.rectModeCalled).to.be.true;
      expect(mockState.rectModeValue).to.equal('center');
    });
    
    it('should set textFont for non-emoji text', function() {
      const textArg = () => 'Hello';
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.textFontCalled).to.be.true;
      expect(mockState.textFontValue).to.equal('Arial');
    });
    
    it('should NOT set textFont for emoji text', function() {
      const textArg = () => 'Hello 😀';
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.textFontCalled).to.be.false;
    });
    
    it('should set textSize from style', function() {
      const textArg = () => {};
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.textSizeCalled).to.be.true;
      expect(mockState.textSizeValue).to.equal(16);
    });
    
    it('should set fill color from style', function() {
      const textArg = () => {};
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.fillCalled).to.be.true;
      expect(mockState.fillValue).to.deep.equal([[255, 255, 255]]);
    });
    
    it('should set textAlign from style', function() {
      const textArg = () => {};
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.textAlignCalled).to.be.true;
      expect(mockState.textAlignValues).to.deep.equal(['CENTER', 'TOP']);
    });
    
    it('should execute textArg function', function() {
      const textArg = () => { mockState.textArgExecuted = true; };
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.textArgExecuted).to.be.true;
    });
    
    it('should handle different textSize values', function() {
      const textArg = () => {};
      const customStyle = { ...mockStyle, textSize: 24 };
      
      textNoStroke(textArg, customStyle);
      
      expect(mockState.textSizeValue).to.equal(24);
    });
    
    it('should handle different textFont values', function() {
      const textArg = () => 'Regular text';
      const customStyle = { ...mockStyle, textFont: 'Helvetica' };
      
      textNoStroke(textArg, customStyle);
      
      expect(mockState.textFontValue).to.equal('Helvetica');
    });
    
    it('should handle different fill colors', function() {
      const textArg = () => {};
      const customStyle = { ...mockStyle, textColor: [255, 0, 0] };
      
      textNoStroke(textArg, customStyle);
      
      expect(mockState.fillValue).to.deep.equal([[255, 0, 0]]);
    });
    
    it('should handle different text alignments', function() {
      const textArg = () => {};
      const customStyle = { ...mockStyle, textAlign: ['LEFT', 'BOTTOM'] };
      
      textNoStroke(textArg, customStyle);
      
      expect(mockState.textAlignValues).to.deep.equal(['LEFT', 'BOTTOM']);
    });
    
    it('should handle single textAlign value', function() {
      const textArg = () => {};
      const customStyle = { ...mockStyle, textAlign: ['CENTER'] };
      
      textNoStroke(textArg, customStyle);
      
      expect(mockState.textAlignValues).to.deep.equal(['CENTER']);
    });
  });
  
  describe('textNoStroke() integration', function() {
    
    it('should apply all styles in correct order', function() {
      const callOrder = [];
      
      global.push = () => callOrder.push('push');
      global.noStroke = () => callOrder.push('noStroke');
      global.rectMode = () => callOrder.push('rectMode');
      global.textFont = () => callOrder.push('textFont');
      global.textSize = () => callOrder.push('textSize');
      global.fill = () => callOrder.push('fill');
      global.textAlign = () => callOrder.push('textAlign');
      global.pop = () => callOrder.push('pop');
      
      const textArg = () => callOrder.push('textArg');
      const style = {
        textFont: 'Arial',
        textSize: 16,
        textColor: [255, 255, 255],
        textAlign: ['CENTER']
      };
      
      textNoStroke(textArg, style);
      
      expect(callOrder[0]).to.equal('push');
      expect(callOrder[callOrder.length - 1]).to.equal('pop');
      expect(callOrder).to.include('textArg');
    });
    
    it('should handle textArg that returns string', function() {
      const textArg = () => 'Test string';
      const style = {
        textFont: 'Arial',
        textSize: 16,
        textColor: [255, 255, 255],
        textAlign: ['CENTER']
      };
      
      expect(() => textNoStroke(textArg, style)).to.not.throw();
    });
    
    it('should handle textArg with side effects', function() {
      let sideEffect = false;
      const textArg = () => {
        sideEffect = true;
        return 'Text';
      };
      const style = {
        textFont: 'Arial',
        textSize: 16,
        textColor: [255, 255, 255],
        textAlign: ['CENTER']
      };
      
      textNoStroke(textArg, style);
      
      expect(sideEffect).to.be.true;
    });
  });
});
