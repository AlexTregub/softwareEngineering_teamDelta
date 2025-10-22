/**
 * JobComponent Unit Tests for Node.js Environment
 */

// Load the JobComponent class
const JobComponent = require('../../Classes/ants/JobComponent.js');
const { expect } = require('chai');

describe('JobComponent (smoke & API)', () => {
  it('should export getJobStats and job lists', () => {
    expect(typeof JobComponent.getJobStats).to.equal('function');
    expect(Array.isArray(JobComponent.getJobList())).to.be.true;
    expect(Array.isArray(JobComponent.getSpecialJobs())).to.be.true;
    expect(Array.isArray(JobComponent.getAllJobs())).to.be.true;
  });

  it('constructor creates instance with stats', () => {
    const jc = new JobComponent('Builder');
    expect(jc.name).to.equal('Builder');
    expect(jc.stats).to.exist;
  });
});
