// ESLint v9 Flat Config
// Enforces test helper usage to reduce test file size and duplication

import js from '@eslint/js';

export default [
  // Base recommended rules
  js.configs.recommended,
  
  // Global settings
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        
        // Node globals
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        
        // p5.js globals
        createVector: 'readonly',
        push: 'readonly',
        pop: 'readonly',
        fill: 'readonly',
        stroke: 'readonly',
        rect: 'readonly',
        ellipse: 'readonly',
        line: 'readonly',
        text: 'readonly',
        translate: 'readonly',
        rotate: 'readonly',
        scale: 'readonly',
        
        // Test globals (Mocha + Chai)
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        expect: 'readonly',
        assert: 'readonly',
        should: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  },
  
  // Test helper enforcement for ALL unit/integration tests (STRICT)
  {
    files: ['test/unit/**/*.test.js', 'test/integration/**/*.test.js'],
    rules: {
      'no-restricted-syntax': [
        'error',
        // Don't manually create JSDOM
        {
          selector: 'NewExpression[callee.name="JSDOM"]',
          message: '❌ DO NOT manually create JSDOM. Use setupTestEnvironment() from test/helpers/mvcTestHelpers.js instead.'
        },
        // Don't manually set global.window
        {
          selector: 'AssignmentExpression[left.object.name="global"][left.property.name="window"]',
          message: '❌ DO NOT manually set global.window. Use setupTestEnvironment() from test/helpers/mvcTestHelpers.js instead.'
        },
        // Don't manually set global.document
        {
          selector: 'AssignmentExpression[left.object.name="global"][left.property.name="document"]',
          message: '❌ DO NOT manually set global.document. Use setupTestEnvironment() from test/helpers/mvcTestHelpers.js instead.'
        },
        // Don't assign window from dom.window
        {
          selector: 'AssignmentExpression[left.name="window"][right.object.name="dom"][right.property.name="window"]',
          message: '❌ DO NOT manually extract window from JSDOM. Use setupTestEnvironment() which returns { window, document } or access via global.window.'
        },
        // Don't assign document from window.document
        {
          selector: 'AssignmentExpression[left.name="document"][right.object.name="window"][right.property.name="document"]',
          message: '❌ DO NOT manually extract document. Use setupTestEnvironment() which returns { window, document } or access via global.document.'
        },
        // Don't manually create p5 mock objects
        {
          selector: 'VariableDeclarator[id.name=/p5Mocks?/] > ObjectExpression',
          message: '❌ DO NOT manually create p5.js mock objects. Use setupTestEnvironment({ rendering: true }) which returns { renderingMocks }.'
        },
        // Don't manually loop to set p5 globals
        {
          selector: 'CallExpression[callee.object.object.name="Object"][callee.object.property.name="keys"][callee.property.name="forEach"]:has(Identifier[name=/p5Mocks?/])',
          message: '❌ DO NOT manually set p5.js globals. Use setupTestEnvironment({ rendering: true }) which handles this automatically.'
        },
        // Don't manually create CollisionBox2D mocks
        {
          selector: 'CallExpression[callee.object.name="sinon"][callee.property.name="stub"]:has(Identifier[name="CollisionBox2D"])',
          message: '❌ DO NOT manually mock CollisionBox2D. Use setupTestEnvironment() from test/helpers/mvcTestHelpers.js (includes real implementation).'
        },
        // Don't manually call sinon.restore()
        {
          selector: 'CallExpression[callee.object.name="sinon"][callee.property.name="restore"]',
          message: '❌ DO NOT manually call sinon.restore(). Use cleanupTestEnvironment() from test/helpers/mvcTestHelpers.js in afterEach() instead.'
        },
        // Don't manually delete require.cache (suggest loadClassWithCacheClear)
        {
          selector: 'UnaryExpression[operator="delete"] > MemberExpression[object.object.name="require"][object.property.name="cache"]',
          message: '⚠️  Consider using loadClassWithCacheClear() or setupAndLoadClasses() from test/helpers/mvcTestHelpers.js for cleaner class loading.'
        },
        // Don't use p5.Vector
        {
          selector: 'MemberExpression[object.name="p5"][property.name="Vector"]',
          message: '❌ Use createVector() global function instead of p5.Vector (provided by setupTestEnvironment).'
        }
      ]
    }
  },
  
  // MVC test files MUST use helpers
  {
    files: [
      'test/unit/models/**/*.test.js',
      'test/unit/views/**/*.test.js', 
      'test/unit/controllers/mvc/**/*.test.js',
      'test/integration/views/**/*.test.js',
      'test/integration/controllers/**/*.test.js'
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'JSDOM',
          message: '❌ MVC tests MUST use setupTestEnvironment() from test/helpers/mvcTestHelpers.js - DO NOT import JSDOM directly.'
        }
      ]
    }
  },
  
  // Ignore patterns
  {
    ignores: [
      'node_modules/',
      'libraries/',
      'test/baseline/',
      'test/e2e/screenshots/',
      'test/_backup_original_unit_tests/',
      '*.min.js',
      'jsconfig.json',
      'tsconfig.js'
    ]
  }
];
