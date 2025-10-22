// Minimal Mocha reporter that remains silent on success and prints failures only
module.exports = function(runner) {
  const failures = [];

  runner.on('fail', (test, err) => {
    failures.push({ test, err });
  });

  runner.once('end', () => {
    const stats = runner.stats || {};
    const passes = stats.passes || 0;
    const fails = stats.failures || failures.length || 0;
    const total = stats.tests || (passes + fails);

    // Always print aggregated summary (grand total)
    console.log('\n=== Unit Test Summary ===');
    console.log(`Passed: ${passes}  Failed: ${fails}  Total: ${total}`);

    if (fails > 0) {
      console.log('\n--- Failures Detail ---');
      failures.forEach((f, idx) => {
        const title = (f.test && typeof f.test.fullTitle === 'function') ? f.test.fullTitle() : (f.test && f.test.title) || 'Unknown Test';
        console.log(`\n${idx + 1}) ${title}`);
        if (f.err && f.err.stack) {
          console.log(f.err.stack);
        } else if (f.err && f.err.message) {
          console.log(f.err.message);
        } else {
          console.log(String(f.err));
        }
      });
    }

    // If verbose requested, print a small hint how to re-run in verbose mode
    if (!process.env.TEST_VERBOSE) {
      console.log('\n(Note: run with TEST_VERBOSE=1 to show per-test output.)');
    }
  });
};
