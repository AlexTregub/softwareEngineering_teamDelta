const expect = require('chai').expect;

describe('PerformanceMonitor thresholds configuration', function() {
    it('should expose thresholds with expected keys by default', function() {
        // Use globally loaded PerformanceMonitor class from test runner
        const pm = new global.PerformanceMonitor();

        expect(pm).to.have.property('thresholds');
        const keys = Object.keys(pm.thresholds).sort();
        expect(keys).to.include.members([
            'goodAvgFPS',
            'fairAvgFPS',
            'poorAvgFrameTime',
            'worstFrameTime',
            'memoryGrowthBytes',
            'memoryIncreaseRateBytesPerSec'
        ]);
    });

    it('should allow overriding thresholds via constructor config', function() {
        // Use globally loaded PerformanceMonitor class from test runner
        const override = { thresholds: { worstFrameTime: 12345 } };
        const pm = new global.PerformanceMonitor(override);
        expect(pm.thresholds.worstFrameTime).to.equal(12345);
    });
});
