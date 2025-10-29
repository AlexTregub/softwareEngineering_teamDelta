/**
 * Browser Diagnostic Test - Add to index.html temporarily
 * 
 * Tests CacheManager tiled memory calculation in REAL browser environment
 */

console.log('=== CacheManager Tiled Strategy Diagnostic ===');

// Test 1: Check if TiledCacheStrategy exists
if (typeof window.TiledCacheStrategy === 'undefined') {
    console.error('❌ TiledCacheStrategy not loaded in browser!');
} else {
    console.log('✅ TiledCacheStrategy loaded');
}

// Test 2: Create fresh CacheManager instance
const testManager = CacheManager.getInstance();

// Test 3: Try registering with tiled strategy
console.log('\n--- Testing tiled registration ---');
console.log('Config:', { width: 448, height: 448, tileSize: 128 });

try {
    testManager.register('diagnostic-test', 'tiled', {
        width: 448,
        height: 448,
        tileSize: 128
    });
    
    const stats = testManager.getCacheStats('diagnostic-test');
    console.log('✅ Registration successful!');
    console.log('Memory allocated:', stats.memoryUsage, 'bytes');
    console.log('Expected (tiled):', 1048576, 'bytes (~1MB)');
    console.log('Wrong (full buffer):', 802816, 'bytes (~800KB)');
    
    if (stats.memoryUsage === 1048576) {
        console.log('✅ CORRECT: Using tiled memory calculation');
    } else {
        console.error('❌ BUG: Using wrong memory calculation');
        console.error('Got:', stats.memoryUsage);
    }
    
    // Cleanup
    testManager.removeCache('diagnostic-test');
    
} catch (error) {
    console.error('❌ Registration failed:', error.message);
    console.error('Memory needed:', error.message.match(/need (\d+)/)?.[1], 'bytes');
    console.error('Budget:', error.message.match(/budget: (\d+)/)?.[1], 'bytes');
}

console.log('\n=== End Diagnostic ===');
