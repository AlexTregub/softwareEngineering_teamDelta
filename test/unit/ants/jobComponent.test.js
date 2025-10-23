/**
 * JobComponent Unit Tests - Comprehensive Coverage
 */

// Load the JobComponent class
const JobComponent = require('../../../Classes/ants/JobComponent.js');
const { expect } = require('chai');

describe('JobComponent', function() {
  describe('Constructor', function() {
    it('should create instance with name and stats', function() {
      const jc = new JobComponent('Builder');
      expect(jc.name).to.equal('Builder');
      expect(jc.stats).to.exist;
      expect(jc.stats).to.be.an('object');
    });

    it('should create instance with name and image', function() {
      const img = { src: 'builder.png' };
      const jc = new JobComponent('Builder', img);
      expect(jc.name).to.equal('Builder');
      expect(jc.image).to.equal(img);
    });

    it('should create instance without image (null default)', function() {
      const jc = new JobComponent('Scout');
      expect(jc.name).to.equal('Scout');
      expect(jc.image).to.be.null;
    });

    it('should retrieve stats for all job types', function() {
      const jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      jobs.forEach(jobName => {
        const jc = new JobComponent(jobName);
        expect(jc.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });

    it('should use default stats for unknown job', function() {
      const jc = new JobComponent('UnknownJob');
      expect(jc.stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });
  });

  describe('getJobStats (static)', function() {
    it('should return Builder stats', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats).to.deep.equal({
        strength: 20,
        health: 120,
        gatherSpeed: 15,
        movementSpeed: 60
      });
    });

    it('should return Scout stats', function() {
      const stats = JobComponent.getJobStats('Scout');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 80,
        gatherSpeed: 10,
        movementSpeed: 80
      });
    });

    it('should return Farmer stats', function() {
      const stats = JobComponent.getJobStats('Farmer');
      expect(stats).to.deep.equal({
        strength: 15,
        health: 100,
        gatherSpeed: 30,
        movementSpeed: 60
      });
    });

    it('should return Warrior stats', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats).to.deep.equal({
        strength: 40,
        health: 150,
        gatherSpeed: 5,
        movementSpeed: 60
      });
    });

    it('should return Spitter stats', function() {
      const stats = JobComponent.getJobStats('Spitter');
      expect(stats).to.deep.equal({
        strength: 30,
        health: 90,
        gatherSpeed: 8,
        movementSpeed: 60
      });
    });

    it('should return DeLozier stats (special)', function() {
      const stats = JobComponent.getJobStats('DeLozier');
      expect(stats).to.deep.equal({
        strength: 1000,
        health: 10000,
        gatherSpeed: 1,
        movementSpeed: 10000
      });
    });

    it('should return default stats for unknown job', function() {
      const stats = JobComponent.getJobStats('Unknown');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for null', function() {
      const stats = JobComponent.getJobStats(null);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for undefined', function() {
      const stats = JobComponent.getJobStats(undefined);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for empty string', function() {
      const stats = JobComponent.getJobStats('');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should be case-sensitive', function() {
      const stats = JobComponent.getJobStats('builder'); // lowercase
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return object with all required stat properties', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats).to.have.property('strength');
      expect(stats).to.have.property('health');
      expect(stats).to.have.property('gatherSpeed');
      expect(stats).to.have.property('movementSpeed');
    });

    it('should return numeric values for all stats', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats.strength).to.be.a('number');
      expect(stats.health).to.be.a('number');
      expect(stats.gatherSpeed).to.be.a('number');
      expect(stats.movementSpeed).to.be.a('number');
    });

    it('should return positive values for all stats', function() {
      const jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      jobs.forEach(job => {
        const stats = JobComponent.getJobStats(job);
        expect(stats.strength).to.be.above(0);
        expect(stats.health).to.be.above(0);
        expect(stats.gatherSpeed).to.be.above(0);
        expect(stats.movementSpeed).to.be.above(0);
      });
    });
  });

  describe('getJobList (static)', function() {
    it('should return array of standard jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.be.an('array');
      expect(jobs).to.include('Builder');
      expect(jobs).to.include('Scout');
      expect(jobs).to.include('Farmer');
      expect(jobs).to.include('Warrior');
      expect(jobs).to.include('Spitter');
    });

    it('should return exactly 5 jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.have.lengthOf(5);
    });

    it('should not include special jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.not.include('DeLozier');
    });

    it('should return same array on multiple calls', function() {
      const jobs1 = JobComponent.getJobList();
      const jobs2 = JobComponent.getJobList();
      expect(jobs1).to.deep.equal(jobs2);
    });
  });

  describe('getSpecialJobs (static)', function() {
    it('should return array of special jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.be.an('array');
      expect(specialJobs).to.include('DeLozier');
    });

    it('should return exactly 1 special job', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.have.lengthOf(1);
    });

    it('should not include standard jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.not.include('Builder');
      expect(specialJobs).to.not.include('Scout');
      expect(specialJobs).to.not.include('Farmer');
    });
  });

  describe('getAllJobs (static)', function() {
    it('should return array of all jobs (standard + special)', function() {
      const allJobs = JobComponent.getAllJobs();
      expect(allJobs).to.be.an('array');
      expect(allJobs).to.include('Builder');
      expect(allJobs).to.include('Scout');
      expect(allJobs).to.include('DeLozier');
    });

    it('should return exactly 6 jobs total', function() {
      const allJobs = JobComponent.getAllJobs();
      expect(allJobs).to.have.lengthOf(6);
    });

    it('should equal getJobList + getSpecialJobs', function() {
      const jobList = JobComponent.getJobList();
      const specialJobs = JobComponent.getSpecialJobs();
      const allJobs = JobComponent.getAllJobs();
      
      expect(allJobs.length).to.equal(jobList.length + specialJobs.length);
      jobList.forEach(job => expect(allJobs).to.include(job));
      specialJobs.forEach(job => expect(allJobs).to.include(job));
    });

    it('should have no duplicates', function() {
      const allJobs = JobComponent.getAllJobs();
      const uniqueJobs = [...new Set(allJobs)];
      expect(allJobs.length).to.equal(uniqueJobs.length);
    });
  });

  describe('Stats Validation', function() {
    it('should have Builder as high health tank', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats.health).to.equal(120); // Higher than default 100
      expect(stats.strength).to.equal(20);
    });

    it('should have Scout as fastest unit', function() {
      const stats = JobComponent.getJobStats('Scout');
      expect(stats.movementSpeed).to.equal(80); // Fastest
      const builderStats = JobComponent.getJobStats('Builder');
      expect(stats.movementSpeed).to.be.above(builderStats.movementSpeed);
    });

    it('should have Farmer as best gatherer', function() {
      const stats = JobComponent.getJobStats('Farmer');
      expect(stats.gatherSpeed).to.equal(30); // Highest gather speed
      const scoutStats = JobComponent.getJobStats('Scout');
      expect(stats.gatherSpeed).to.be.above(scoutStats.gatherSpeed);
    });

    it('should have Warrior as strongest fighter', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats.strength).to.equal(40); // Highest strength
      expect(stats.health).to.equal(150); // Highest health
    });

    it('should have Spitter as ranged attacker', function() {
      const stats = JobComponent.getJobStats('Spitter');
      expect(stats.strength).to.equal(30); // High damage
      expect(stats.health).to.equal(90); // Lower health (glass cannon)
    });

    it('should have DeLozier as overpowered special unit', function() {
      const stats = JobComponent.getJobStats('DeLozier');
      expect(stats.strength).to.equal(1000);
      expect(stats.health).to.equal(10000);
      expect(stats.movementSpeed).to.equal(10000);
    });
  });

  describe('Edge Cases', function() {
    it('should handle number as job name', function() {
      const stats = JobComponent.getJobStats(123);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle object as job name', function() {
      const stats = JobComponent.getJobStats({});
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle array as job name', function() {
      const stats = JobComponent.getJobStats([]);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should create instance with all job types', function() {
      const allJobs = JobComponent.getAllJobs();
      allJobs.forEach(jobName => {
        const jc = new JobComponent(jobName);
        expect(jc.name).to.equal(jobName);
        expect(jc.stats).to.exist;
      });
    });

    it('should handle very long job name', function() {
      const longName = 'A'.repeat(1000);
      const stats = JobComponent.getJobStats(longName);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle job name with special characters', function() {
      const stats = JobComponent.getJobStats('Builder!@#$%');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });
  });

  describe('Integration', function() {
    it('should create different instances with different names', function() {
      const builder = new JobComponent('Builder');
      const scout = new JobComponent('Scout');
      
      expect(builder.name).to.not.equal(scout.name);
      expect(builder.stats.strength).to.not.equal(scout.stats.strength);
    });

    it('should maintain stat independence between instances', function() {
      const builder1 = new JobComponent('Builder');
      const builder2 = new JobComponent('Builder');
      
      builder1.stats.strength = 999;
      expect(builder2.stats.strength).to.equal(20); // Unchanged
    });

    it('should work with all standard jobs', function() {
      const jobs = JobComponent.getJobList();
      jobs.forEach(jobName => {
        const component = new JobComponent(jobName);
        expect(component.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });

    it('should work with all special jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      specialJobs.forEach(jobName => {
        const component = new JobComponent(jobName);
        expect(component.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });
  });
});
