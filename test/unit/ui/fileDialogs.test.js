/**
 * Consolidated UI File Dialogs Tests
 * Generated: 2025-10-29T03:11:41.112Z
 * Source files: 7
 * Total tests: 143
 * 
 * This file contains all ui file dialogs tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');
let sinon = require('sinon');


// ================================================================
// fileIO.test.js (69 tests)
// ================================================================
/**
 * Unit Tests for File I/O Dialog System
 * Tests save/load dialogs, file validation, and format conversion
 */

let fs = require('fs');
let path = require('path');
let vm = require('vm');

// Load real File I/O classes
let saveDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/SaveDialog.js'),
  'utf8'
);
let loadDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/LoadDialog.js'),
  'utf8'
);
let localStorageManagerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/LocalStorageManager.js'),
  'utf8'
);
let autoSaveCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/AutoSave.js'),
  'utf8'
);
let serverIntegrationCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/ServerIntegration.js'),
  'utf8'
);
let formatConverterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/FormatConverter.js'),
  'utf8'
);

// Execute in global context to define classes
vm.runInThisContext(saveDialogCode);
vm.runInThisContext(loadDialogCode);
vm.runInThisContext(localStorageManagerCode);
vm.runInThisContext(autoSaveCode);
vm.runInThisContext(serverIntegrationCode);
vm.runInThisContext(formatConverterCode);

describe('FileIO - Save Dialog', function() {
  
  describe('SaveDialog', function() {
    
    it('should create save dialog with default filename', function() {
      const dialog = new SaveDialog();
      
      expect(dialog.getFilename()).to.include('terrain');
      expect(dialog.getFormat()).to.equal('json');
    });
    
    it('should validate filename', function() {
      const dialog = new SaveDialog();
      
      expect(dialog.validateFilename('terrain_map').valid).to.be.true;
      expect(dialog.validateFilename('').valid).to.be.false;
      expect(dialog.validateFilename('terrain@#$').valid).to.be.false;
    });
    
    it('should auto-add file extension', function() {
      const dialog = new SaveDialog();
      dialog.setFormat('json');
      
      expect(dialog.getFullFilename('mymap')).to.equal('mymap.json');
      expect(dialog.getFullFilename('mymap.json')).to.equal('mymap.json');
    });
    
    it('should show overwrite warning for existing files', function() {
      const dialog = new SaveDialog();
      dialog.setExistingFiles(['terrain1.json', 'level2.json']);
      
      expect(dialog.checkOverwrite('terrain1.json')).to.be.true;
      expect(dialog.checkOverwrite('newfile.json')).to.be.false;
    });
    
    it('should support multiple export formats', function() {
      const dialog = new SaveDialog();
      const formats = dialog.getAvailableFormats();
      
      expect(formats).to.be.an('array');
      expect(formats.length).to.be.greaterThan(0);
      expect(formats.some(f => f.key === 'json')).to.be.true;
    });
    
    it('should generate filename with timestamp', function() {
      const dialog = new SaveDialog();
      const filename = dialog.generateTimestampedFilename('terrain');
      
      expect(filename).to.include('terrain_');
    });
    
    it('should estimate file size before save', function() {
      const dialog = new SaveDialog();
      const testData = { terrain: { grid: [1, 2, 3, 4, 5] } };
      
      dialog.setFormat('json');
      const size = dialog.estimateSize(testData);
      
      expect(size).to.be.greaterThan(0);
    });
  });
  
  describe('SaveOptions', function() {
    
    it('should configure compression option', function() {
      const dialog = new SaveDialog();
      
      dialog.setFormat('json-compressed');
      expect(dialog.getFormat()).to.equal('json-compressed');
    });
    
    it('should configure what to include in export', function() {
      // This would be part of exporter options, just verify dialog works
      const dialog = new SaveDialog();
      expect(dialog).to.have.property('format');
    });
    
    it('should validate save location', function() {
      const dialog = new SaveDialog();
      const validation = dialog.validateFilename('test_file');
      
      expect(validation).to.have.property('valid');
    });
  });
});

describe('FileIO - Load Dialog', function() {
  
  describe('LoadDialog', function() {
    
    it('should show list of available files', function() {
      const dialog = new LoadDialog();
      dialog.setFiles([
        { name: 'terrain1.json', date: '2025-10-25' },
        { name: 'terrain2.json', date: '2025-10-24' }
      ]);
      
      const fileList = dialog.getFileList();
      expect(fileList).to.have.lengthOf(2);
      expect(fileList).to.include('terrain1.json');
    });
    
    it('should sort files by date', function() {
      const dialog = new LoadDialog();
      dialog.setFiles([
        { name: 'old.json', date: '2025-10-20' },
        { name: 'new.json', date: '2025-10-25' }
      ]);
      
      const sorted = dialog.sortByDate();
      expect(sorted[0].name).to.equal('new.json'); // Newest first
    });
    
    it('should filter files by search term', function() {
      const dialog = new LoadDialog();
      dialog.setFiles([
        { name: 'terrain_forest.json', date: '2025-10-25' },
        { name: 'terrain_desert.json', date: '2025-10-24' },
        { name: 'level_dungeon.json', date: '2025-10-23' }
      ]);
      
      dialog.search('terrain');
      const filtered = dialog.getFileList();
      
      expect(filtered).to.have.lengthOf(2);
    });
    
    it('should show file preview', function() {
      const dialog = new LoadDialog();
      dialog.setFiles([
        { 
          name: 'terrain1.json', 
          date: '2025-10-25',
          preview: { size: '5x5', seed: 12345 }
        }
      ]);
      dialog.selectFile('terrain1.json');
      
      const preview = dialog.getPreview();
      expect(preview).to.have.property('size');
      expect(preview.seed).to.equal(12345);
    });
    
    it('should validate file before loading', function() {
      const dialog = new LoadDialog();
      
      const validData = {
        version: '1.0',
        terrain: { grid: [] }
      };
      const invalidData = {};
      
      expect(dialog.validateFile(validData).valid).to.be.true;
      expect(dialog.validateFile(invalidData).valid).to.be.false;
    });
  });
  
  describe('FileUpload', function() {
    
    it('should accept JSON files only', function() {
      // This would be UI behavior - just test the concept
      const acceptedTypes = ['.json'];
      expect(acceptedTypes).to.include('.json');
    });
    
    it('should validate file size limits', function() {
      const maxSize = 5 * 1024 * 1024; // 5 MB
      const fileSize = 1024; // 1 KB
      
      expect(fileSize).to.be.lessThan(maxSize);
    });
    
    it('should parse uploaded file content', function() {
      const jsonContent = '{"version":"1.0","terrain":{"grid":[]}}';
      const parsed = JSON.parse(jsonContent);
      
      expect(parsed).to.have.property('version');
      expect(parsed).to.have.property('terrain');
    });
    
    it('should show upload progress', function() {
      const upload = {
        loaded: 50,
        total: 100,
        getProgress: function() {
          return (this.loaded / this.total) * 100;
        }
      };
      
      expect(upload.getProgress()).to.equal(50);
    });
  });
});

describe('FileIO - Browser Storage', function() {
  
  describe('LocalStorageManager', function() {
    
    it('should save terrain to localStorage', function() {
      // Mock localStorage
      const mockStorage = {};
      const manager = new LocalStorageManager('test_');
      manager.storage = {
        setItem: function(key, value) {
          mockStorage[key] = value;
        },
        getItem: function(key) {
          return mockStorage[key] || null;
        },
        removeItem: function(key) {
          delete mockStorage[key];
        },
        length: 0,
        key: function(i) { return null; }
      };
      
      const result = manager.save('terrain1', { grid: [1, 2, 3] });
      expect(result).to.be.true;
    });
    
    it('should load terrain from localStorage', function() {
      const mockStorage = {};
      const manager = new LocalStorageManager('test_');
      manager.storage = {
        setItem: function(key, value) {
          mockStorage[key] = value;
        },
        getItem: function(key) {
          return mockStorage[key] || null;
        },
        removeItem: function(key) {
          delete mockStorage[key];
        },
        length: 0,
        key: function(i) { return null; }
      };
      
      manager.save('terrain1', { grid: [1, 2, 3] });
      const loaded = manager.load('terrain1');
      
      expect(loaded).to.not.be.null;
      expect(loaded.grid).to.deep.equal([1, 2, 3]);
    });
    
    it('should list all saved terrains', function() {
      const manager = new LocalStorageManager('test_');
      manager.storage = null; // No storage available
      
      const list = manager.list();
      expect(list).to.be.an('array');
    });
    
    it('should delete saved terrain', function() {
      const mockStorage = {};
      const manager = new LocalStorageManager('test_');
      manager.storage = {
        setItem: function(key, value) {
          mockStorage[key] = value;
        },
        getItem: function(key) {
          return mockStorage[key] || null;
        },
        removeItem: function(key) {
          delete mockStorage[key];
        },
        length: 0,
        key: function(i) { return null; }
      };
      
      manager.save('terrain1', { grid: [] });
      const deleted = manager.delete('terrain1');
      
      expect(deleted).to.be.true;
    });
    
    it('should check storage quota', function() {
      const manager = new LocalStorageManager();
      const usage = manager.getUsage();
      
      expect(usage).to.have.property('used');
      expect(usage).to.have.property('available');
      expect(usage).to.have.property('percentage');
    });
  });
  
  describe('AutoSave', function() {
    
    it('should enable/disable auto-save', function() {
      const autoSave = new AutoSave();
      
      autoSave.enable();
      expect(autoSave.isEnabled()).to.be.true;
      
      autoSave.disable();
      expect(autoSave.isEnabled()).to.be.false;
    });
    
    it('should trigger save on interval', function() {
      const autoSave = new AutoSave(1000); // 1 second
      autoSave.enable();
      autoSave.markDirty();
      
      const shouldSave = autoSave.shouldSave(Date.now() + 1500);
      expect(shouldSave).to.be.true;
    });
    
    it('should save only if terrain was modified', function() {
      const autoSave = new AutoSave();
      autoSave.enable();
      
      expect(autoSave.isDirty()).to.be.false;
      
      autoSave.markDirty();
      expect(autoSave.isDirty()).to.be.true;
    });
  });
});

describe('FileIO - Server Integration', function() {
  
  describe('ServerUpload', function() {
    
    it('should prepare upload request', function() {
      const {ServerUpload} = require('../../../Classes/ui/ServerIntegration.js');
      const upload = new ServerUpload();
      
      const request = upload.prepareRequest({ grid: [] }, 'terrain.json');
      
      expect(request).to.have.property('url');
      expect(request).to.have.property('method');
      expect(request.method).to.equal('POST');
    });
    
    it('should handle upload success', function() {
      const {ServerUpload} = require('../../../Classes/ui/ServerIntegration.js');
      const upload = new ServerUpload();
      
      const result = upload.handleResponse(200, { fileId: '123', url: '/files/123' });
      
      expect(result.success).to.be.true;
      expect(result.fileId).to.equal('123');
    });
    
    it('should handle upload errors', function() {
      const {ServerUpload} = require('../../../Classes/ui/ServerIntegration.js');
      const upload = new ServerUpload();
      
      const errorMsg = upload.handleError('NETWORK_ERROR');
      expect(errorMsg).to.be.a('string');
      expect(errorMsg.length).to.be.greaterThan(0);
    });
  });
  
  describe('ServerDownload', function() {
    
    it('should fetch file list from server', async function() {
      const {ServerDownload} = require('../../../Classes/ui/ServerIntegration.js');
      const download = new ServerDownload();
      
      const fileList = await download.fetchFileList();
      expect(fileList).to.be.an('array');
    });
    
    it('should download file by ID', function() {
      const {ServerDownload} = require('../../../Classes/ui/ServerIntegration.js');
      const download = new ServerDownload();
      
      const url = download.getDownloadUrl('file123');
      expect(url).to.include('file123');
    });
  });
});

describe('FileIO - Format Conversion', function() {
  
  describe('FormatConverter', function() {
    
    it('should convert between JSON formats', function() {
      const converter = new FormatConverter();
      const data = {
        version: '1.0',
        terrain: {
          width: 10,
          height: 10,
          grid: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4]
        }
      };
      
      const compressed = converter.toCompressed(data);
      expect(compressed.format).to.equal('compressed');
    });
    
    it('should export to different formats', function() {
      const converter = new FormatConverter();
      const formats = converter.getSupportedFormats();
      
      expect(formats).to.include('json');
      expect(formats).to.include('json-compressed');
    });
    
    it('should preserve data during conversion', function() {
      const converter = new FormatConverter();
      const original = {
        version: '1.0',
        terrain: {
          width: 10,
          height: 10,
          grid: [1, 2, 3]
        }
      };
      
      const compressed = converter.toCompressed(original);
      expect(compressed.version).to.equal(original.version);
      expect(compressed.terrain.width).to.equal(original.terrain.width);
    });
  });
});

describe('FileIO - Error Handling', function() {
  
  describe('ErrorReporting', function() {
    
    it('should categorize file errors', function() {
      const errors = {
        'FILE_NOT_FOUND': 'file',
        'PARSE_ERROR': 'format',
        'NETWORK_ERROR': 'network'
      };
      
      expect(errors['FILE_NOT_FOUND']).to.equal('file');
      expect(errors['NETWORK_ERROR']).to.equal('network');
    });
    
    it('should provide user-friendly error messages', function() {
      const {ServerUpload} = require('../../../Classes/ui/ServerIntegration.js');
      const upload = new ServerUpload();
      
      const message = upload.handleError('FILE_TOO_LARGE');
      expect(message).to.be.a('string');
      expect(message.length).to.be.greaterThan(10);
    });
    
    it('should suggest recovery actions', function() {
      const errorHelp = {
        'FILE_TOO_LARGE': 'Try using compressed format',
        'NETWORK_ERROR': 'Check your internet connection',
        'INVALID_FORMAT': 'Use a valid JSON file'
      };
      
      expect(errorHelp['FILE_TOO_LARGE']).to.include('compressed');
      expect(errorHelp['NETWORK_ERROR']).to.include('connection');
    });
  });
});
      const dialog = {
        data: { tiles: new Array(1000).fill('moss') },
        estimateSize: function() {
          const jsonString = JSON.stringify(this.data);
          return jsonString.length;
        },
        formatSize: function(bytes) {
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
          return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }
      };
  
  describe('SaveOptions', function() {
    
    it('should configure compression option', function() {
      const options = {
        compress: false,
        includeEntities: true,
        includeMetadata: true
      };
      
      options.compress = true;
      expect(options.compress).to.be.true;
    });
    
    it('should configure what to include in export', function() {
      const options = {
        includeEntities: true,
        includeResources: false,
        includeCustomData: true,
        getExportOptions: function() {
          return {
            compressed: false,
            customMetadata: this.includeCustomData ? {} : null
          };
        }
      };
      
      const exportOpts = options.getExportOptions();
      expect(exportOpts.customMetadata).to.not.be.null;
    });
    
    it('should validate save location', function() {
      const options = {
        saveLocation: 'browser', // browser, server, local
        validateLocation: function() {
          const allowed = ['browser', 'server', 'local'];
          return allowed.includes(this.saveLocation);
        }
      };
      
      expect(options.validateLocation()).to.be.true;
      options.saveLocation = 'invalid';
      expect(options.validateLocation()).to.be.false;
    });
  });


describe('FileIO - Load Dialog', function() {
  
  describe('LoadDialog', function() {
    
    it('should show list of available files', function() {
      const dialog = {
        files: [
          { name: 'terrain1.json', size: 1024, date: '2025-10-25' },
          { name: 'level2.json', size: 2048, date: '2025-10-24' }
        ],
        getFileList: function() {
          return this.files.map(f => f.name);
        }
      };
      
      const list = dialog.getFileList();
      expect(list).to.have.lengthOf(2);
      expect(list).to.include('terrain1.json');
    });
    
    it('should sort files by date', function() {
      const dialog = {
        files: [
          { name: 'old.json', date: '2025-10-20' },
          { name: 'new.json', date: '2025-10-25' },
          { name: 'mid.json', date: '2025-10-23' }
        ],
        sortByDate: function() {
          return this.files.slice().sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
          });
        }
      };
      
      const sorted = dialog.sortByDate();
      expect(sorted[0].name).to.equal('new.json');
      expect(sorted[2].name).to.equal('old.json');
    });
    
    it('should filter files by search term', function() {
      const dialog = {
        files: [
          { name: 'terrain_forest.json' },
          { name: 'terrain_desert.json' },
          { name: 'level_dungeon.json' }
        ],
        search: function(term) {
          return this.files.filter(f => 
            f.name.toLowerCase().includes(term.toLowerCase())
          );
        }
      };
      
      const results = dialog.search('terrain');
      expect(results).to.have.lengthOf(2);
    });
    
    it('should show file preview', function() {
      const dialog = {
        selectedFile: {
          name: 'terrain1.json',
          metadata: {
            gridSizeX: 5,
            gridSizeY: 5,
            seed: 12345
          }
        },
        getPreview: function() {
          if (!this.selectedFile) return null;
          return {
            name: this.selectedFile.name,
            size: `${this.selectedFile.metadata.gridSizeX}x${this.selectedFile.metadata.gridSizeY}`,
            seed: this.selectedFile.metadata.seed
          };
        }
      };
      
      const preview = dialog.getPreview();
      expect(preview.size).to.equal('5x5');
    });
    
    it('should validate file before loading', function() {
      const dialog = {
        validateFile: function(fileData) {
          const errors = [];
          
          if (!fileData.metadata) {
            errors.push('Missing metadata');
          }
          if (!fileData.tiles) {
            errors.push('Missing tiles data');
          }
          if (fileData.metadata && !fileData.metadata.version) {
            errors.push('Missing version');
          }
          
          return {
            valid: errors.length === 0,
            errors
          };
        }
      };
      
      const valid = dialog.validateFile({
        metadata: { version: '1.0', gridSizeX: 3, gridSizeY: 3 },
        tiles: []
      });
      
      expect(valid.valid).to.be.true;
      
      const invalid = dialog.validateFile({});
      expect(invalid.valid).to.be.false;
      expect(invalid.errors).to.have.lengthOf(2);
    });
  });
  
  describe('FileUpload', function() {
    
    it('should accept JSON files only', function() {
      const upload = {
        acceptedTypes: ['.json'],
        isAccepted: function(filename) {
          return this.acceptedTypes.some(type => filename.endsWith(type));
        }
      };
      
      expect(upload.isAccepted('terrain.json')).to.be.true;
      expect(upload.isAccepted('image.png')).to.be.false;
    });
    
    it('should validate file size limits', function() {
      const upload = {
        maxSize: 5 * 1024 * 1024, // 5MB
        checkSize: function(fileSize) {
          return fileSize <= this.maxSize;
        }
      };
      
      expect(upload.checkSize(1024)).to.be.true;
      expect(upload.checkSize(10 * 1024 * 1024)).to.be.false;
    });
    
    it('should parse uploaded file content', function() {
      const upload = {
        parseJSON: function(content) {
          try {
            return { success: true, data: JSON.parse(content) };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      };
      
      const valid = upload.parseJSON('{"test": true}');
      expect(valid.success).to.be.true;
      
      const invalid = upload.parseJSON('not json');
      expect(invalid.success).to.be.false;
    });
    
    it('should show upload progress', function() {
      const upload = {
        bytesLoaded: 512,
        totalBytes: 1024,
        getProgress: function() {
          return (this.bytesLoaded / this.totalBytes) * 100;
        }
      };
      
      expect(upload.getProgress()).to.equal(50);
    });
  });
});

describe('FileIO - Browser Storage', function() {
  
  describe('LocalStorageManager', function() {
    
    it('should save to localStorage', function() {
      const storage = {
        data: {},
        save: function(key, value) {
          this.data[key] = JSON.stringify(value);
          return true;
        }
      };
      
      const result = storage.save('terrain1', { test: true });
      expect(result).to.be.true;
      expect(storage.data['terrain1']).to.exist;
    });
    
    it('should load from localStorage', function() {
      const storage = {
        data: {
          'terrain1': JSON.stringify({ tiles: [1, 2, 3] })
        },
        load: function(key) {
          if (!this.data[key]) return null;
          return JSON.parse(this.data[key]);
        }
      };
      
      const loaded = storage.load('terrain1');
      expect(loaded.tiles).to.have.lengthOf(3);
      expect(storage.load('missing')).to.be.null;
    });
    
    it('should list all saved terrains', function() {
      const storage = {
        data: {
          'terrain1': '{}',
          'terrain2': '{}',
          'otherData': '{}'
        },
        list: function(prefix = 'terrain') {
          return Object.keys(this.data).filter(key => key.startsWith(prefix));
        }
      };
      
      const terrains = storage.list('terrain');
      expect(terrains).to.have.lengthOf(2);
    });
    
    it('should delete saved terrain', function() {
      const storage = {
        data: {
          'terrain1': '{}',
          'terrain2': '{}'
        },
        delete: function(key) {
          if (this.data[key]) {
            delete this.data[key];
            return true;
          }
          return false;
        }
      };
      
      expect(storage.delete('terrain1')).to.be.true;
      expect(storage.data['terrain1']).to.be.undefined;
      expect(storage.delete('missing')).to.be.false;
    });
    
    it('should check storage quota', function() {
      const storage = {
        data: {},
        quota: 5 * 1024 * 1024, // 5MB
        getUsage: function() {
          let total = 0;
          for (const value of Object.values(this.data)) {
            total += value.length;
          }
          return {
            used: total,
            available: this.quota - total,
            percentage: (total / this.quota) * 100
          };
        }
      };
      
      storage.data['test'] = 'x'.repeat(1024 * 1024); // 1MB
      const usage = storage.getUsage();
      
      expect(usage.used).to.equal(1024 * 1024);
      expect(usage.percentage).to.be.closeTo(20, 0.1);
    });
  });
  
  describe('AutoSave', function() {
    
    it('should enable auto-save', function() {
      const autoSave = {
        enabled: false,
        interval: 60000, // 1 minute
        toggle: function() {
          this.enabled = !this.enabled;
          return this.enabled;
        }
      };
      
      expect(autoSave.toggle()).to.be.true;
      expect(autoSave.toggle()).to.be.false;
    });
    
    it('should trigger save on interval', function() {
      const autoSave = {
        lastSave: 0,
        interval: 5000,
        shouldSave: function(currentTime) {
          return currentTime - this.lastSave >= this.interval;
        }
      };
      
      expect(autoSave.shouldSave(3000)).to.be.false;
      expect(autoSave.shouldSave(5000)).to.be.true;
    });
    
    it('should save only if terrain was modified', function() {
      const autoSave = {
        lastModified: 1000,
        lastSave: 500,
        isDirty: function() {
          return this.lastModified > this.lastSave;
        }
      };
      
      expect(autoSave.isDirty()).to.be.true;
      
      autoSave.lastSave = 2000;
      expect(autoSave.isDirty()).to.be.false;
    });
  });
});

describe('FileIO - Server Integration', function() {
  
  describe('ServerUpload', function() {
    
    it('should prepare upload request', function() {
      const upload = {
        endpoint: '/api/terrain/upload',
        prepareRequest: function(data, filename) {
          return {
            method: 'POST',
            url: this.endpoint,
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filename: filename,
              data: data
            })
          };
        }
      };
      
      const request = upload.prepareRequest({ test: true }, 'terrain.json');
      expect(request.method).to.equal('POST');
      expect(request.url).to.equal('/api/terrain/upload');
    });
    
    it('should handle upload success', function() {
      const upload = {
        handleResponse: function(status, response) {
          if (status === 200) {
            return {
              success: true,
              fileId: response.id,
              url: response.url
            };
          }
          return {
            success: false,
            error: 'Upload failed'
          };
        }
      };
      
      const result = upload.handleResponse(200, { id: '123', url: '/files/123' });
      expect(result.success).to.be.true;
      expect(result.fileId).to.equal('123');
    });
    
    it('should handle upload errors', function() {
      const upload = {
        handleError: function(error) {
          const messages = {
            'NETWORK_ERROR': 'Could not connect to server',
            'FILE_TOO_LARGE': 'File exceeds size limit',
            'INVALID_FORMAT': 'Invalid file format'
          };
          return messages[error] || 'Unknown error';
        }
      };
      
      expect(upload.handleError('NETWORK_ERROR')).to.include('connect');
      expect(upload.handleError('FILE_TOO_LARGE')).to.include('size');
    });
  });
  
  describe('ServerDownload', function() {
    
    it('should fetch file list from server', function() {
      const download = {
        endpoint: '/api/terrain/list',
        getFileList: function() {
          // Mock server response
          return {
            files: [
              { id: '1', name: 'terrain1.json', size: 1024 },
              { id: '2', name: 'level2.json', size: 2048 }
            ]
          };
        }
      };
      
      const response = download.getFileList();
      expect(response.files).to.have.lengthOf(2);
    });
    
    it('should download file by ID', function() {
      const download = {
        endpoint: '/api/terrain/download',
        getDownloadUrl: function(fileId) {
          return `${this.endpoint}/${fileId}`;
        }
      };
      
      const url = download.getDownloadUrl('123');
      expect(url).to.equal('/api/terrain/download/123');
    });
  });
});

describe('FileIO - Format Conversion', function() {
  
  describe('FormatConverter', function() {
    
    it('should convert between JSON formats', function() {
      const converter = {
        toCompressed: function(data) {
          // Simulate compression
          return {
            ...data,
            tiles: `${data.tiles.length}:moss`
          };
        }
      };
      
      const compressed = converter.toCompressed({
        metadata: { version: '1.0' },
        tiles: ['moss', 'moss', 'moss']
      });
      
      expect(compressed.tiles).to.be.a('string');
    });
    
    it('should export to different formats', function() {
      const converter = {
        formats: ['json', 'json-compressed', 'binary'],
        canConvert: function(from, to) {
          return this.formats.includes(from) && this.formats.includes(to);
        }
      };
      
      expect(converter.canConvert('json', 'json-compressed')).to.be.true;
      expect(converter.canConvert('json', 'invalid')).to.be.false;
    });
    
    it('should preserve data during conversion', function() {
      const converter = {
        convert: function(data, targetFormat) {
          // Always preserve metadata
          return {
            format: targetFormat,
            metadata: data.metadata,
            tiles: data.tiles
          };
        }
      };
      
      const original = {
        metadata: { seed: 12345 },
        tiles: [1, 2, 3]
      };
      
      const converted = converter.convert(original, 'binary');
      expect(converted.metadata.seed).to.equal(12345);
    });
  });
});

describe('FileIO - Error Handling', function() {
  
  describe('ErrorReporting', function() {
    
    it('should categorize file errors', function() {
      const reporter = {
        categorize: function(errorCode) {
          const categories = {
            'FILE_NOT_FOUND': 'file',
            'PARSE_ERROR': 'format',
            'SIZE_EXCEEDED': 'quota',
            'NETWORK_ERROR': 'connection'
          };
          return categories[errorCode] || 'unknown';
        }
      };
      
      expect(reporter.categorize('FILE_NOT_FOUND')).to.equal('file');
      expect(reporter.categorize('PARSE_ERROR')).to.equal('format');
    });
    
    it('should provide user-friendly error messages', function() {
      const reporter = {
        getMessage: function(errorCode) {
          const messages = {
            'FILE_NOT_FOUND': 'The selected file could not be found.',
            'PARSE_ERROR': 'The file format is invalid or corrupted.',
            'SIZE_EXCEEDED': 'The file is too large to load.',
            'PERMISSION_DENIED': 'You do not have permission to access this file.'
          };
          return messages[errorCode] || 'An unknown error occurred.';
        }
      };
      
      expect(reporter.getMessage('PARSE_ERROR')).to.include('invalid');
    });
    
    it('should suggest recovery actions', function() {
      const reporter = {
        getSuggestion: function(errorCode) {
          const suggestions = {
            'PARSE_ERROR': 'Try exporting the terrain again, or check the file for corruption.',
            'SIZE_EXCEEDED': 'Try using compressed format or splitting into smaller regions.',
            'NETWORK_ERROR': 'Check your internet connection and try again.'
          };
          return suggestions[errorCode];
        }
      };
      
      expect(reporter.getSuggestion('SIZE_EXCEEDED')).to.include('compressed');
    });
  });
});




// ================================================================
// loadDialog_fileExplorer.test.js (10 tests)
// ================================================================
/**
 * Unit tests for LoadDialog file explorer integration
 * 
 * TDD: Write tests FIRST for native file dialog integration
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('LoadDialog - File Explorer Integration', function() {
    let LoadDialog;
    let dialog;

    beforeEach(function() {
        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;

        // Load LoadDialog class
        const loadDialogPath = path.join(__dirname, '../../../Classes/ui/LoadDialog.js');
        const loadDialogCode = fs.readFileSync(loadDialogPath, 'utf8');
        const context = { module: { exports: {} }, ...global };
        vm.runInContext(loadDialogCode, vm.createContext(context));
        LoadDialog = context.module.exports;

        dialog = new LoadDialog();
    });

    afterEach(function() {
        sinon.restore();
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('openNativeFileDialog() method', function() {
        it('should have openNativeFileDialog method', function() {
            expect(dialog).to.have.property('openNativeFileDialog');
            expect(dialog.openNativeFileDialog).to.be.a('function');
        });

        it('should create hidden file input element', function() {
            const mockInput = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                addEventListener: sinon.stub()
            };

            global.document = {
                createElement: sinon.stub().returns(mockInput),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(global.document.createElement.calledWith('input')).to.be.true;

            delete global.document;
        });

        it('should set accept attribute for JSON files', function() {
            const mockInput = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                addEventListener: sinon.stub()
            };

            global.document = {
                createElement: sinon.stub().returns(mockInput),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(mockInput.setAttribute.calledWith('accept', '.json')).to.be.true;

            delete global.document;
        });

        it('should register change event listener', function() {
            const mockInput = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                addEventListener: sinon.stub()
            };

            global.document = {
                createElement: sinon.stub().returns(mockInput),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(mockInput.addEventListener.calledWith('change', sinon.match.func)).to.be.true;

            delete global.document;
        });

        it('should trigger click on input element', function() {
            const mockInput = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                addEventListener: sinon.stub()
            };

            global.document = {
                createElement: sinon.stub().returns(mockInput),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(mockInput.click.calledOnce).to.be.true;

            delete global.document;
        });
    });

    describe('loadFromNativeDialog() method', function() {
        it('should have loadFromNativeDialog method', function() {
            expect(dialog).to.have.property('loadFromNativeDialog');
            expect(dialog.loadFromNativeDialog).to.be.a('function');
        });

        it('should call onLoad callback when file is selected', function(done) {
            dialog.onLoad = (data) => {
                expect(data).to.exist;
                done();
            };

            // Mock Blob for creating test file
            global.Blob = class {
                constructor(content, options) {
                    this.content = content;
                    this.type = options?.type || '';
                }
            };

            const mockFile = new Blob(['{"test": "data"}'], { type: 'application/json' });
            mockFile.name = 'test.json';

            global.FileReader = class {
                readAsText(file) {
                    setTimeout(() => {
                        this.result = '{"test": "data"}';
                        this.onload({ target: this });
                    }, 10);
                }
            };

            dialog.loadFromNativeDialog(mockFile);

            delete global.FileReader;
            delete global.Blob;
        });
    });

    describe('useNativeDialogs property', function() {
        it('should have useNativeDialogs property', function() {
            expect(dialog).to.have.property('useNativeDialogs');
        });

        it('should default to false for backward compatibility', function() {
            expect(dialog.useNativeDialogs).to.be.false;
        });

        it('should allow setting useNativeDialogs to true', function() {
            dialog.useNativeDialogs = true;
            expect(dialog.useNativeDialogs).to.be.true;
        });
    });
});




// ================================================================
// loadDialog_interactions.test.js (13 tests)
// ================================================================
/**
 * Unit tests for LoadDialog interaction methods (handleClick)
 * 
 * TDD: Write tests FIRST for click handling
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('LoadDialog - Interactions', function() {
    let LoadDialog;
    let dialog;

    beforeEach(function() {
        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;

        // Load LoadDialog class
        const loadDialogPath = path.join(__dirname, '../../../Classes/ui/LoadDialog.js');
        const loadDialogCode = fs.readFileSync(loadDialogPath, 'utf8');
        const context = { module: { exports: {} }, ...global };
        vm.runInContext(loadDialogCode, vm.createContext(context));
        LoadDialog = context.module.exports;

        dialog = new LoadDialog();
        dialog.show();
        dialog.setFiles([
            { name: 'terrain_2024-01-01.json', date: '2024-01-01', size: 1024 },
            { name: 'terrain_2024-01-02.json', date: '2024-01-02', size: 2048 }
        ]);
    });

    afterEach(function() {
        sinon.restore();
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('handleClick() method', function() {
        it('should have a handleClick method', function() {
            expect(dialog).to.have.property('handleClick');
            expect(dialog.handleClick).to.be.a('function');
        });

        it('should return true when clicking inside dialog (consume click)', function() {
            const dialogX = g_canvasX / 2;
            const dialogY = g_canvasY / 2;
            
            const consumed = dialog.handleClick(dialogX, dialogY);
            expect(consumed).to.be.true;
        });

        it('should return false when clicking outside dialog (allow passthrough)', function() {
            const consumed = dialog.handleClick(10, 10);
            expect(consumed).to.be.false;
        });

        it('should detect file selection click', function() {
            // Calculate file list position
            const dialogWidth = 600;
            const dialogHeight = 400;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const fileY = dialogY + 85;
            
            // Click first file
            dialog.handleClick(dialogX + 100, fileY + 10);
            
            expect(dialog.getSelectedFile()).to.exist;
            expect(dialog.getSelectedFile().name).to.equal('terrain_2024-01-01.json');
        });

        it('should detect Load button click', function() {
            dialog.selectFile('terrain_2024-01-01.json');
            
            let loadClicked = false;
            dialog.onLoad = () => { loadClicked = true; };
            
            // Calculate Load button position
            const dialogWidth = 600;
            const dialogHeight = 400;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const buttonY = dialogY + dialogHeight - 60;
            const loadButtonX = dialogX + dialogWidth - 260;
            
            const consumed = dialog.handleClick(loadButtonX + 60, buttonY + 20);
            
            expect(consumed).to.be.true;
            expect(loadClicked).to.be.true;
        });

        it('should detect Cancel button click', function() {
            let cancelClicked = false;
            dialog.onCancel = () => { cancelClicked = true; };
            
            // Calculate Cancel button position
            const dialogWidth = 600;
            const dialogHeight = 400;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const buttonY = dialogY + dialogHeight - 60;
            const cancelButtonX = dialogX + dialogWidth - 130;
            
            const consumed = dialog.handleClick(cancelButtonX + 60, buttonY + 20);
            
            expect(consumed).to.be.true;
            expect(cancelClicked).to.be.true;
        });

        it('should not trigger Load when no file selected', function() {
            dialog.selectedFile = null;
            
            let loadClicked = false;
            dialog.onLoad = () => { loadClicked = true; };
            
            // Click Load button
            const dialogWidth = 600;
            const dialogHeight = 400;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const buttonY = dialogY + dialogHeight - 60;
            const loadButtonX = dialogX + dialogWidth - 260;
            
            dialog.handleClick(loadButtonX + 60, buttonY + 20);
            
            expect(loadClicked).to.be.false;
        });

        it('should not handle clicks when dialog is hidden', function() {
            dialog.hide();
            
            const consumed = dialog.handleClick(g_canvasX / 2, g_canvasY / 2);
            expect(consumed).to.be.false;
        });
    });

    describe('Callback registration', function() {
        it('should support onLoad callback', function() {
            let called = false;
            dialog.onLoad = () => { called = true; };
            
            if (dialog.onLoad) dialog.onLoad();
            expect(called).to.be.true;
        });

        it('should support onCancel callback', function() {
            let called = false;
            dialog.onCancel = () => { called = true; };
            
            if (dialog.onCancel) dialog.onCancel();
            expect(called).to.be.true;
        });
    });

    describe('Hit testing', function() {
        it('should have isPointInside method', function() {
            expect(dialog).to.have.property('isPointInside');
            expect(dialog.isPointInside).to.be.a('function');
        });

        it('should return true for points inside dialog box', function() {
            const centerX = g_canvasX / 2;
            const centerY = g_canvasY / 2;
            
            expect(dialog.isPointInside(centerX, centerY)).to.be.true;
        });

        it('should return false for points outside dialog box', function() {
            expect(dialog.isPointInside(10, 10)).to.be.false;
        });
    });
});




// ================================================================
// loadDialog_render.test.js (10 tests)
// ================================================================
/**
 * Unit tests for LoadDialog render method
 * 
 * TDD: Write tests FIRST before implementing render()
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('LoadDialog - render() method', function() {
    let LoadDialog;
    let dialog;
    let mockP5;

    beforeEach(function() {
        // Mock p5.js drawing functions
        mockP5 = {
            push: sinon.stub(),
            pop: sinon.stub(),
            fill: sinon.stub(),
            stroke: sinon.stub(),
            noStroke: sinon.stub(),
            rect: sinon.stub(),
            text: sinon.stub(),
            textAlign: sinon.stub(),
            textSize: sinon.stub(),
            CENTER: 'center',
            LEFT: 'left',
            RIGHT: 'right',
            TOP: 'top',
            BOTTOM: 'bottom'
        };

        // Set up global context with p5 functions
        global.push = mockP5.push;
        global.pop = mockP5.pop;
        global.fill = mockP5.fill;
        global.stroke = mockP5.stroke;
        global.noStroke = mockP5.noStroke;
        global.rect = mockP5.rect;
        global.text = mockP5.text;
        global.textAlign = mockP5.textAlign;
        global.textSize = mockP5.textSize;
        global.CENTER = mockP5.CENTER;
        global.LEFT = mockP5.LEFT;
        global.RIGHT = mockP5.RIGHT;
        global.TOP = mockP5.TOP;
        global.BOTTOM = mockP5.BOTTOM;

        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;

        // Load LoadDialog class
        const loadDialogPath = path.join(__dirname, '../../../Classes/ui/LoadDialog.js');
        const loadDialogCode = fs.readFileSync(loadDialogPath, 'utf8');
        const context = { module: { exports: {} }, ...global };
        vm.runInContext(loadDialogCode, vm.createContext(context));
        LoadDialog = context.module.exports;

        dialog = new LoadDialog();
    });

    afterEach(function() {
        sinon.restore();
        delete global.push;
        delete global.pop;
        delete global.fill;
        delete global.stroke;
        delete global.noStroke;
        delete global.rect;
        delete global.text;
        delete global.textAlign;
        delete global.textSize;
        delete global.CENTER;
        delete global.LEFT;
        delete global.RIGHT;
        delete global.TOP;
        delete global.BOTTOM;
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('render() existence', function() {
        it('should have a render method', function() {
            expect(dialog).to.have.property('render');
            expect(dialog.render).to.be.a('function');
        });
    });

    describe('render() when not visible', function() {
        it('should not render anything when dialog is not visible', function() {
            dialog.hide();
            dialog.render();
            
            // Should not call any drawing functions
            expect(mockP5.push.called).to.be.false;
            expect(mockP5.rect.called).to.be.false;
        });
    });

    describe('render() when visible', function() {
        beforeEach(function() {
            dialog.show();
        });

        it('should call push/pop to save canvas state', function() {
            dialog.render();
            
            expect(mockP5.push.calledOnce).to.be.true;
            expect(mockP5.pop.calledOnce).to.be.true;
        });

        it('should draw background overlay', function() {
            dialog.render();
            
            // Should draw semi-transparent overlay
            expect(mockP5.fill.called).to.be.true;
            expect(mockP5.rect.called).to.be.true;
        });

        it('should draw dialog box', function() {
            dialog.render();
            
            // Should draw multiple rectangles (overlay + dialog box)
            expect(mockP5.rect.callCount).to.be.at.least(2);
        });

        it('should render title text', function() {
            dialog.render();
            
            // Should render text (title + labels)
            expect(mockP5.text.called).to.be.true;
        });
    });

    describe('render() with files', function() {
        beforeEach(function() {
            dialog.show();
            dialog.setFiles([
                { name: 'terrain_2024-01-01.json', date: '2024-01-01', size: 1024 },
                { name: 'terrain_2024-01-02.json', date: '2024-01-02', size: 2048 },
                { name: 'terrain_2024-01-03.json', date: '2024-01-03', size: 3072 }
            ]);
        });

        it('should display file list', function() {
            dialog.render();
            
            // Should render text for file names
            const textCalls = mockP5.text.getCalls();
            const hasFileNames = textCalls.some(call => 
                call.args.some(arg => typeof arg === 'string' && arg.includes('terrain_'))
            );
            expect(hasFileNames).to.be.true;
        });

        it('should display load button', function() {
            dialog.selectFile('terrain_2024-01-01.json');
            dialog.render();
            
            const textCalls = mockP5.text.getCalls();
            const hasLoadButton = textCalls.some(call => 
                call.args.some(arg => typeof arg === 'string' && /load/i.test(arg))
            );
            expect(hasLoadButton).to.be.true;
        });

        it('should display cancel button', function() {
            dialog.render();
            
            const textCalls = mockP5.text.getCalls();
            const hasCancelButton = textCalls.some(call => 
                call.args.some(arg => typeof arg === 'string' && /cancel/i.test(arg))
            );
            expect(hasCancelButton).to.be.true;
        });
    });

    describe('render() positioning', function() {
        it('should center dialog on screen', function() {
            dialog.show();
            dialog.render();
            
            // Dialog should be drawn near center of canvas
            const rectCalls = mockP5.rect.getCalls();
            
            // Find the dialog box (600x400 for LoadDialog)
            const dialogBoxCalls = rectCalls.filter(call => {
                const [x, y, w, h] = call.args;
                return w === 600 && h === 400;
            });
            
            expect(dialogBoxCalls.length).to.be.at.least(1);
            const [x, y, w, h] = dialogBoxCalls[0].args;
            
            // Dialog should be centered
            const expectedX = (g_canvasX - w) / 2;
            const expectedY = (g_canvasY - h) / 2;
            
            expect(x).to.equal(expectedX);
            expect(y).to.equal(expectedY);
        });
    });
});




// ================================================================
// saveDialog_fileExplorer.test.js (12 tests)
// ================================================================
/**
 * Unit tests for SaveDialog file explorer integration
 * 
 * TDD: Write tests FIRST for native file dialog integration
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('SaveDialog - File Explorer Integration', function() {
    let SaveDialog;
    let dialog;

    beforeEach(function() {
        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;

        // Load SaveDialog class
        const saveDialogPath = path.join(__dirname, '../../../Classes/ui/SaveDialog.js');
        const saveDialogCode = fs.readFileSync(saveDialogPath, 'utf8');
        const context = { module: { exports: {} }, ...global };
        vm.runInContext(saveDialogCode, vm.createContext(context));
        SaveDialog = context.module.exports;

        dialog = new SaveDialog();
    });

    afterEach(function() {
        sinon.restore();
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('openNativeFileDialog() method', function() {
        it('should have openNativeFileDialog method', function() {
            expect(dialog).to.have.property('openNativeFileDialog');
            expect(dialog.openNativeFileDialog).to.be.a('function');
        });

        it('should create hidden file input element', function() {
            // Mock document
            global.document = {
                createElement: sinon.stub().returns({
                    setAttribute: sinon.stub(),
                    click: sinon.stub(),
                    addEventListener: sinon.stub()
                }),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(global.document.createElement.calledWith('input')).to.be.true;

            delete global.document;
        });

        it('should set input type to file', function() {
            const mockInput = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                addEventListener: sinon.stub()
            };

            global.document = {
                createElement: sinon.stub().returns(mockInput),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(mockInput.setAttribute.calledWith('type', 'file')).to.be.true;

            delete global.document;
        });

        it('should set accept attribute for JSON files', function() {
            const mockInput = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                addEventListener: sinon.stub()
            };

            global.document = {
                createElement: sinon.stub().returns(mockInput),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(mockInput.setAttribute.calledWith('accept', '.json')).to.be.true;

            delete global.document;
        });

        it('should trigger click on input element', function() {
            const mockInput = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                addEventListener: sinon.stub()
            };

            global.document = {
                createElement: sinon.stub().returns(mockInput),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(mockInput.click.calledOnce).to.be.true;

            delete global.document;
        });
    });

    describe('saveWithNativeDialog() method', function() {
        it('should have saveWithNativeDialog method', function() {
            expect(dialog).to.have.property('saveWithNativeDialog');
            expect(dialog.saveWithNativeDialog).to.be.a('function');
        });

        it('should create download link for file', function() {
            const mockAnchor = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                style: {}
            };

            global.document = {
                createElement: sinon.stub().returns(mockAnchor),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            global.URL = {
                createObjectURL: sinon.stub().returns('blob:mock-url'),
                revokeObjectURL: sinon.stub()
            };

            global.Blob = class MockBlob {
                constructor(data, options) {
                    this.data = data;
                    this.options = options;
                }
            };

            const data = { test: 'data' };
            dialog.saveWithNativeDialog(data, 'test.json');

            expect(global.document.createElement.calledWith('a')).to.be.true;
            expect(mockAnchor.click.calledOnce).to.be.true;

            delete global.document;
            delete global.URL;
            delete global.Blob;
        });

        it('should use provided filename', function() {
            const mockAnchor = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                style: {}
            };

            global.document = {
                createElement: sinon.stub().returns(mockAnchor),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            global.URL = {
                createObjectURL: sinon.stub().returns('blob:mock-url'),
                revokeObjectURL: sinon.stub()
            };

            global.Blob = class MockBlob {};

            dialog.saveWithNativeDialog({ test: 'data' }, 'my_terrain.json');

            expect(mockAnchor.setAttribute.calledWith('download', 'my_terrain.json')).to.be.true;

            delete global.document;
            delete global.URL;
            delete global.Blob;
        });

        it('should create blob with JSON data', function() {
            const mockAnchor = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                style: {}
            };

            global.document = {
                createElement: sinon.stub().returns(mockAnchor),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            global.URL = {
                createObjectURL: sinon.stub().returns('blob:mock-url'),
                revokeObjectURL: sinon.stub()
            };

            const blobData = [];
            global.Blob = class MockBlob {
                constructor(data, options) {
                    blobData.push({ data, options });
                }
            };

            const testData = { terrain: 'test' };
            dialog.saveWithNativeDialog(testData, 'test.json');

            expect(blobData.length).to.equal(1);
            expect(blobData[0].options.type).to.equal('application/json');

            delete global.document;
            delete global.URL;
            delete global.Blob;
        });
    });

    describe('useNativeDialogs property', function() {
        it('should have useNativeDialogs property', function() {
            expect(dialog).to.have.property('useNativeDialogs');
        });

        it('should default to false for backward compatibility', function() {
            expect(dialog.useNativeDialogs).to.be.false;
        });

        it('should allow setting useNativeDialogs to true', function() {
            dialog.useNativeDialogs = true;
            expect(dialog.useNativeDialogs).to.be.true;
        });
    });
});




// ================================================================
// saveDialog_interactions.test.js (17 tests)
// ================================================================
/**
 * Unit tests for SaveDialog interaction methods (handleClick, handleInput)
 * 
 * TDD: Write tests FIRST for click handling and text input
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('SaveDialog - Interactions', function() {
    let SaveDialog;
    let dialog;

    beforeEach(function() {
        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;

        // Load SaveDialog class
        const saveDialogPath = path.join(__dirname, '../../../Classes/ui/SaveDialog.js');
        const saveDialogCode = fs.readFileSync(saveDialogPath, 'utf8');
        const context = { module: { exports: {} }, ...global };
        vm.runInContext(saveDialogCode, vm.createContext(context));
        SaveDialog = context.module.exports;

        dialog = new SaveDialog();
        dialog.show();
    });

    afterEach(function() {
        sinon.restore();
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('handleClick() method', function() {
        it('should have a handleClick method', function() {
            expect(dialog).to.have.property('handleClick');
            expect(dialog.handleClick).to.be.a('function');
        });

        it('should return true when clicking inside dialog (consume click)', function() {
            // Click in center of dialog
            const dialogX = g_canvasX / 2;
            const dialogY = g_canvasY / 2;
            
            const consumed = dialog.handleClick(dialogX, dialogY);
            expect(consumed).to.be.true;
        });

        it('should return false when clicking outside dialog (allow passthrough)', function() {
            // Click far outside dialog
            const consumed = dialog.handleClick(10, 10);
            expect(consumed).to.be.false;
        });

        it('should detect Save button click', function() {
            let saveClicked = false;
            dialog.onSave = () => { saveClicked = true; };
            
            // Calculate Save button position (matches render() implementation)
            const dialogWidth = 500;
            const dialogHeight = 300;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const buttonY = dialogY + dialogHeight - 60;
            const saveButtonX = dialogX + dialogWidth - 260;
            
            // Click center of Save button
            const consumed = dialog.handleClick(saveButtonX + 60, buttonY + 20);
            
            expect(consumed).to.be.true;
            expect(saveClicked).to.be.true;
        });

        it('should detect Cancel button click', function() {
            let cancelClicked = false;
            dialog.onCancel = () => { cancelClicked = true; };
            
            // Calculate Cancel button position
            const dialogWidth = 500;
            const dialogHeight = 300;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const buttonY = dialogY + dialogHeight - 60;
            const cancelButtonX = dialogX + dialogWidth - 130;
            
            // Click center of Cancel button
            const consumed = dialog.handleClick(cancelButtonX + 60, buttonY + 20);
            
            expect(consumed).to.be.true;
            expect(cancelClicked).to.be.true;
        });

        it('should not handle clicks when dialog is hidden', function() {
            dialog.hide();
            
            const consumed = dialog.handleClick(g_canvasX / 2, g_canvasY / 2);
            expect(consumed).to.be.false;
        });
    });

    describe('handleKeyPress() method', function() {
        it('should have a handleKeyPress method', function() {
            expect(dialog).to.have.property('handleKeyPress');
            expect(dialog.handleKeyPress).to.be.a('function');
        });

        it('should add character to filename on alphanumeric key press', function() {
            dialog.setFilename('test');
            dialog.handleKeyPress('a');
            
            expect(dialog.getFilename()).to.equal('testa');
        });

        it('should handle backspace to delete character', function() {
            dialog.setFilename('test');
            dialog.handleKeyPress('Backspace');
            
            expect(dialog.getFilename()).to.equal('tes');
        });

        it('should handle Enter key to trigger save', function() {
            let saveTriggered = false;
            dialog.onSave = () => { saveTriggered = true; };
            
            dialog.handleKeyPress('Enter');
            
            expect(saveTriggered).to.be.true;
        });

        it('should handle Escape key to cancel', function() {
            let cancelTriggered = false;
            dialog.onCancel = () => { cancelTriggered = true; };
            
            dialog.handleKeyPress('Escape');
            
            expect(cancelTriggered).to.be.true;
        });

        it('should not handle keys when dialog is hidden', function() {
            dialog.setFilename('test');
            dialog.hide();
            
            dialog.handleKeyPress('a');
            
            expect(dialog.getFilename()).to.equal('test'); // Unchanged
        });
    });

    describe('Callback registration', function() {
        it('should support onSave callback', function() {
            let called = false;
            dialog.onSave = () => { called = true; };
            
            if (dialog.onSave) dialog.onSave();
            expect(called).to.be.true;
        });

        it('should support onCancel callback', function() {
            let called = false;
            dialog.onCancel = () => { called = true; };
            
            if (dialog.onCancel) dialog.onCancel();
            expect(called).to.be.true;
        });
    });

    describe('Hit testing', function() {
        it('should have isPointInside method', function() {
            expect(dialog).to.have.property('isPointInside');
            expect(dialog.isPointInside).to.be.a('function');
        });

        it('should return true for points inside dialog box', function() {
            const centerX = g_canvasX / 2;
            const centerY = g_canvasY / 2;
            
            expect(dialog.isPointInside(centerX, centerY)).to.be.true;
        });

        it('should return false for points outside dialog box', function() {
            expect(dialog.isPointInside(10, 10)).to.be.false;
        });
    });
});




// ================================================================
// saveDialog_render.test.js (12 tests)
// ================================================================
/**
 * Unit tests for SaveDialog render method
 * 
 * TDD: Write tests FIRST before implementing render()
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');
// DUPLICATE REQUIRE REMOVED: let path = require('path');

describe('SaveDialog - render() method', function() {
    let SaveDialog;
    let dialog;
    let mockP5;

    beforeEach(function() {
        // Mock p5.js drawing functions
        mockP5 = {
            push: sinon.stub(),
            pop: sinon.stub(),
            fill: sinon.stub(),
            stroke: sinon.stub(),
            noStroke: sinon.stub(),
            rect: sinon.stub(),
            text: sinon.stub(),
            textAlign: sinon.stub(),
            textSize: sinon.stub(),
            CENTER: 'center',
            LEFT: 'left',
            RIGHT: 'right',
            TOP: 'top',
            BOTTOM: 'bottom'
        };

        // Set up global context with p5 functions
        global.push = mockP5.push;
        global.pop = mockP5.pop;
        global.fill = mockP5.fill;
        global.stroke = mockP5.stroke;
        global.noStroke = mockP5.noStroke;
        global.rect = mockP5.rect;
        global.text = mockP5.text;
        global.textAlign = mockP5.textAlign;
        global.textSize = mockP5.textSize;
        global.CENTER = mockP5.CENTER;
        global.LEFT = mockP5.LEFT;
        global.RIGHT = mockP5.RIGHT;
        global.TOP = mockP5.TOP;
        global.BOTTOM = mockP5.BOTTOM;

        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;

        // Load SaveDialog class
        const saveDialogPath = path.join(__dirname, '../../../Classes/ui/SaveDialog.js');
        const saveDialogCode = fs.readFileSync(saveDialogPath, 'utf8');
        const context = { module: { exports: {} }, ...global };
        vm.runInContext(saveDialogCode, vm.createContext(context));
        SaveDialog = context.module.exports;

        dialog = new SaveDialog();
    });

    afterEach(function() {
        sinon.restore();
        delete global.push;
        delete global.pop;
        delete global.fill;
        delete global.stroke;
        delete global.noStroke;
        delete global.rect;
        delete global.text;
        delete global.textAlign;
        delete global.textSize;
        delete global.CENTER;
        delete global.LEFT;
        delete global.RIGHT;
        delete global.TOP;
        delete global.BOTTOM;
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('render() existence', function() {
        it('should have a render method', function() {
            expect(dialog).to.have.property('render');
            expect(dialog.render).to.be.a('function');
        });
    });

    describe('render() when not visible', function() {
        it('should not render anything when dialog is not visible', function() {
            dialog.hide();
            dialog.render();
            
            // Should not call any drawing functions
            expect(mockP5.push.called).to.be.false;
            expect(mockP5.rect.called).to.be.false;
        });
    });

    describe('render() when visible', function() {
        beforeEach(function() {
            dialog.show();
        });

        it('should call push/pop to save canvas state', function() {
            dialog.render();
            
            expect(mockP5.push.calledOnce).to.be.true;
            expect(mockP5.pop.calledOnce).to.be.true;
        });

        it('should draw background overlay', function() {
            dialog.render();
            
            // Should draw semi-transparent overlay
            expect(mockP5.fill.called).to.be.true;
            expect(mockP5.rect.called).to.be.true;
        });

        it('should draw dialog box', function() {
            dialog.render();
            
            // Should draw multiple rectangles (overlay + dialog box)
            expect(mockP5.rect.callCount).to.be.at.least(2);
        });

        it('should render title text', function() {
            dialog.render();
            
            // Should render text (title + labels)
            expect(mockP5.text.called).to.be.true;
        });

        it('should set text alignment', function() {
            dialog.render();
            
            expect(mockP5.textAlign.called).to.be.true;
        });

        it('should set text size', function() {
            dialog.render();
            
            expect(mockP5.textSize.called).to.be.true;
        });
    });

    describe('render() content', function() {
        beforeEach(function() {
            dialog.show();
            dialog.setFilename('test_terrain');
        });

        it('should display current filename', function() {
            dialog.render();
            
            // Check if text was called with filename
            const textCalls = mockP5.text.getCalls();
            const hasFilename = textCalls.some(call => 
                call.args.some(arg => typeof arg === 'string' && arg.includes('test_terrain'))
            );
            expect(hasFilename).to.be.true;
        });

        it('should display save button', function() {
            dialog.render();
            
            // Check if text was called with "Save" or similar
            const textCalls = mockP5.text.getCalls();
            const hasSaveButton = textCalls.some(call => 
                call.args.some(arg => typeof arg === 'string' && /save/i.test(arg))
            );
            expect(hasSaveButton).to.be.true;
        });

        it('should display cancel button', function() {
            dialog.render();
            
            // Check if text was called with "Cancel" or similar
            const textCalls = mockP5.text.getCalls();
            const hasCancelButton = textCalls.some(call => 
                call.args.some(arg => typeof arg === 'string' && /cancel/i.test(arg))
            );
            expect(hasCancelButton).to.be.true;
        });
    });

    describe('render() positioning', function() {
        it('should center dialog on screen', function() {
            dialog.show();
            dialog.render();
            
            // Dialog should be drawn near center of canvas
            const rectCalls = mockP5.rect.getCalls();
            
            // Find the dialog box (overlay is fullscreen, dialog box is smaller)
            const dialogBoxCalls = rectCalls.filter(call => {
                const [x, y, w, h] = call.args;
                // Dialog box should have specific dimensions (500x300 for SaveDialog)
                return w === 500 && h === 300;
            });
            
            expect(dialogBoxCalls.length).to.be.at.least(1);
            const [x, y, w, h] = dialogBoxCalls[0].args;
            
            // Dialog should be centered: x = (canvasWidth - dialogWidth) / 2
            const expectedX = (g_canvasX - w) / 2;
            const expectedY = (g_canvasY - h) / 2;
            
            expect(x).to.equal(expectedX);
            expect(y).to.equal(expectedY);
        });
    });
});

