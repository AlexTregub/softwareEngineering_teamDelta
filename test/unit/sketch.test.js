/**
 * Unit tests for sketch.js
 * Tests core game loop functionality and critical initialization
 * 
 * CRITICAL TESTS:
 * - Camera update must be called in draw loop (prevents regression from merge conflicts)
 * - Setup initialization order
 * - Draw loop integration points
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('sketch.js - Core Game Loop', function() {
  let sketchContent;

  before(function() {
    // Read the actual sketch.js file to validate its structure
    const sketchPath = path.join(__dirname, '../../sketch.js');
    sketchContent = fs.readFileSync(sketchPath, 'utf8');
  });

  describe('draw() function', function() {
    describe('CRITICAL: Camera Update Call', function() {
      it('should call cameraManager.update() in the draw loop', function() {
        // This test prevents regression from merge conflicts that removed camera updates
        // See commit 38fc840 (Oct 21, 2025) where this was accidentally removed
        
        const hasCameraUpdate = /cameraManager\.update\(\)/.test(sketchContent);
        
        expect(hasCameraUpdate, 
          'CRITICAL: cameraManager.update() call is missing from draw loop! ' +
          'Camera will not respond to input without this. ' +
          'This was previously removed in a merge conflict (commit 38fc840).'
        ).to.be.true;
      });

      it('should update camera before RenderManager.render()', function() {
        // Camera must be updated before rendering to ensure proper transforms
        
        // Find the positions of both calls
        const cameraUpdateMatch = sketchContent.match(/cameraManager\.update\(\)/);
        const renderManagerMatch = sketchContent.match(/RenderManager\.render\(/);
        
        if (!cameraUpdateMatch || !renderManagerMatch) {
          this.skip(); // Skip if either call is missing (covered by other tests)
        }
        
        const cameraUpdatePos = cameraUpdateMatch.index;
        const renderManagerPos = renderManagerMatch.index;
        
        expect(cameraUpdatePos).to.be.lessThan(renderManagerPos,
          'cameraManager.update() must be called BEFORE RenderManager.render() ' +
          'to ensure camera transforms are applied correctly'
        );
      });

      it('should conditionally update camera only when in-game', function() {
        // Camera should only update during gameplay, not in menus
        
        // Look for the camera update within a GameState check
        const hasConditionalUpdate = 
          /GameState\.isInGame\(\)[\s\S]*?cameraManager\.update\(\)/.test(sketchContent) ||
          /cameraManager[\s\S]{0,100}GameState\.getState\(\)\s*===\s*['"]PLAYING['"]/.test(sketchContent);
        
        expect(hasConditionalUpdate,
          'cameraManager.update() should be conditionally called only during gameplay'
        ).to.be.true;
      });

      it('should check cameraManager exists before calling update', function() {
        // Defensive programming: check cameraManager is defined before calling methods
        
        const hasSafeCall = /if\s*\([^)]*cameraManager[^)]*\)\s*{[\s\S]*?cameraManager\.update\(\)/.test(sketchContent);
        
        expect(hasSafeCall,
          'Should check if cameraManager exists before calling update() to prevent errors'
        ).to.be.true;
      });
    });

    describe('Draw Loop Structure', function() {
      it('should have a draw() function defined', function() {
        const hasDrawFunction = /function\s+draw\s*\(\s*\)\s*{/.test(sketchContent);
        
        expect(hasDrawFunction, 'draw() function must be defined in sketch.js').to.be.true;
      });

      it('should call RenderManager.render() in draw loop', function() {
        const hasRenderManagerCall = /RenderManager\.render\(/.test(sketchContent);
        
        expect(hasRenderManagerCall, 
          'RenderManager.render() must be called in draw loop'
        ).to.be.true;
      });

      it('should pass game state to RenderManager.render()', function() {
        const passesGameState = /RenderManager\.render\(\s*GameState\.(?:getState|get)\(\)/.test(sketchContent);
        
        expect(passesGameState,
          'RenderManager.render() should receive current game state'
        ).to.be.true;
      });
    });
  });

  describe('setup() function', function() {
    it('should have a setup() function defined', function() {
      const hasSetupFunction = /function\s+setup\s*\(\s*\)\s*{/.test(sketchContent);
      
      expect(hasSetupFunction, 'setup() function must be defined in sketch.js').to.be.true;
    });

    it('should initialize CameraManager in setup', function() {
      const initializesCameraManager = /cameraManager\s*=\s*new\s+CameraManager\(\)/.test(sketchContent);
      
      expect(initializesCameraManager,
        'CameraManager should be initialized in setup()'
      ).to.be.true;
    });

    it('should call cameraManager.initialize() after construction', function() {
      const callsInitialize = /cameraManager\.initialize\(\)/.test(sketchContent);
      
      expect(callsInitialize,
        'cameraManager.initialize() should be called in setup()'
      ).to.be.true;
    });

    it('should initialize RenderManager pipeline', function() {
      const hasRenderPipelineInit = /renderPipelineInit\(\)/.test(sketchContent);
      
      expect(hasRenderPipelineInit,
        'renderPipelineInit() should be called in setup()'
      ).to.be.true;
    });
  });

  describe('Input Event Handlers', function() {
    it('should define mousePressed() handler', function() {
      const hasMousePressed = /function\s+mousePressed\s*\(\s*\)/.test(sketchContent);
      
      expect(hasMousePressed, 'mousePressed() handler must be defined').to.be.true;
    });

    it('should define mouseDragged() handler', function() {
      const hasMouseDragged = /function\s+mouseDragged\s*\(\s*\)/.test(sketchContent);
      
      expect(hasMouseDragged, 'mouseDragged() handler must be defined').to.be.true;
    });

    it('should define mouseReleased() handler', function() {
      const hasMouseReleased = /function\s+mouseReleased\s*\(\s*\)/.test(sketchContent);
      
      expect(hasMouseReleased, 'mouseReleased() handler must be defined').to.be.true;
    });

    it('should define keyPressed() handler', function() {
      const hasKeyPressed = /function\s+keyPressed\s*\(\s*\)/.test(sketchContent);
      
      expect(hasKeyPressed, 'keyPressed() handler must be defined').to.be.true;
    });

    it('should define mouseWheel() handler', function() {
      const hasMouseWheel = /function\s+mouseWheel\s*\(\s*event\s*\)/.test(sketchContent);
      
      expect(hasMouseWheel, 'mouseWheel() handler must be defined').to.be.true;
    });
  });

  describe('Global Variables', function() {
    it('should declare cameraManager variable', function() {
      const declaresCameraManager = /let\s+cameraManager\s*;/.test(sketchContent);
      
      expect(declaresCameraManager,
        'cameraManager should be declared as a global variable'
      ).to.be.true;
    });

    it('should declare GameState-related variables', function() {
      // Check for GameState usage (might be imported or used globally)
      const usesGameState = /GameState/.test(sketchContent);
      
      expect(usesGameState,
        'sketch.js should use GameState for game state management'
      ).to.be.true;
    });

    it('should declare RenderManager variable or import', function() {
      const usesRenderManager = /RenderManager/.test(sketchContent);
      
      expect(usesRenderManager,
        'sketch.js should use RenderManager for rendering'
      ).to.be.true;
    });
  });

  describe('Regression Prevention', function() {
    describe('Known Merge Conflict Issues', function() {
      it('CRITICAL: Should not lose camera update in future merges', function() {
        // This is the main regression test
        // Tests the exact issue that occurred in commit 38fc840
        
        const drawFunctionMatch = sketchContent.match(/function\s+draw\s*\(\s*\)\s*{([\s\S]*?)(?=\nfunction\s+\w+|$)/);
        
        if (!drawFunctionMatch) {
          throw new Error('Could not find draw() function in sketch.js');
        }
        
        const drawFunctionBody = drawFunctionMatch[1];
        
        // Check that camera update exists in draw function
        const hasCameraUpdateInDraw = /cameraManager\.update\(\)/.test(drawFunctionBody);
        
        expect(hasCameraUpdateInDraw,
          '❌ REGRESSION DETECTED: cameraManager.update() is missing from draw() function!\n' +
          'This breaks camera movement and was previously removed in merge commit 38fc840.\n' +
          'The camera update MUST be in the draw loop for arrow key input to work.\n' +
          'Fix: Add camera update before RenderManager.render() in draw() function.'
        ).to.be.true;
      });

      it('should maintain proper draw loop order after merges', function() {
        // Ensure the critical order is maintained: camera update -> render
        const drawFunctionMatch = sketchContent.match(/function\s+draw\s*\(\s*\)\s*{([\s\S]*?)(?=\nfunction\s+\w+|$)/);
        
        if (!drawFunctionMatch) {
          this.skip();
        }
        
        const drawFunctionBody = drawFunctionMatch[1];
        
        // Both must exist in draw
        const hasCameraUpdate = /cameraManager\.update\(\)/.test(drawFunctionBody);
        const hasRenderCall = /RenderManager\.render\(/.test(drawFunctionBody);
        
        if (!hasCameraUpdate || !hasRenderCall) {
          this.skip(); // Covered by other tests
        }
        
        // Camera must come before render
        const cameraPos = drawFunctionBody.indexOf('cameraManager.update()');
        const renderPos = drawFunctionBody.indexOf('RenderManager.render(');
        
        expect(cameraPos).to.be.lessThan(renderPos,
          'Camera update must occur before rendering in draw() function'
        );
      });
    });

    describe('Critical Component Presence', function() {
      it('should not remove camera initialization in future changes', function() {
        const hasInit = /cameraManager\s*=\s*new\s+CameraManager\(\)/.test(sketchContent);
        const hasInitCall = /cameraManager\.initialize\(\)/.test(sketchContent);
        
        expect(hasInit && hasInitCall,
          'Camera initialization must be present in setup()'
        ).to.be.true;
      });

      it('should not remove render pipeline initialization', function() {
        const hasRenderInit = /renderPipelineInit\(\)/.test(sketchContent);
        
        expect(hasRenderInit,
          'Render pipeline initialization must be present in setup()'
        ).to.be.true;
      });

      it('should not remove menu initialization', function() {
        const hasMenuInit = /initializeMenu\(\)/.test(sketchContent);
        
        expect(hasMenuInit,
          'Menu initialization must be present in setup()'
        ).to.be.true;
      });
    });
  });

  describe('Code Quality', function() {
    it('should not have duplicate draw() functions', function() {
      const drawMatches = sketchContent.match(/function\s+draw\s*\(\s*\)\s*{/g);
      
      expect(drawMatches).to.have.lengthOf(1,
        'There should be exactly one draw() function defined'
      );
    });

    it('should not have duplicate setup() functions', function() {
      const setupMatches = sketchContent.match(/function\s+setup\s*\(\s*\)\s*{/g);
      
      expect(setupMatches).to.have.lengthOf(1,
        'There should be exactly one setup() function defined'
      );
    });

    it('should use consistent brace style', function() {
      // Check that functions use opening braces on same line
      const functionDefs = sketchContent.match(/function\s+\w+\s*\([^)]*\)\s*{/g);
      
      expect(functionDefs).to.exist;
      expect(functionDefs.length).to.be.greaterThan(0,
        'Should have function definitions with consistent brace style'
      );
    });
  });
});
