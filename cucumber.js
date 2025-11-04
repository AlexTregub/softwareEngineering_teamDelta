module.exports = {
  default: {
    require: ['test/bdd/steps/**/*.js'],
    format: ['progress', 'html:test/bdd/reports/cucumber-report.html'],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    publishQuiet: true
  }
};
