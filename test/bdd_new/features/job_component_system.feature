Feature: JobComponent System Management
  As a game developer
  I want a reliable job management system
  So that ants can have distinct roles and capabilities

  Background:
    Given I have opened the game application in a browser
    And the JobComponent system is loaded

  @core @jobs @api
  Scenario: JobComponent provides all expected job management methods
    When I inspect the JobComponent class
    Then JobComponent should be available as a class constructor
    And JobComponent.getJobStats should be available as a static method
    And JobComponent.getJobList should be available as a static method  
    And JobComponent.getSpecialJobs should be available as a static method
    And JobComponent.getAllJobs should be available as a static method

  @jobs @data @validation
  Scenario: getAllJobs returns complete job collection
    When I call JobComponent.getAllJobs()
    Then I should get a list containing regular jobs
    And I should get a list containing special jobs
    And the total job count should be 6 jobs
    And the job list should include multiple jobs "Builder", "Scout", "Farmer", "Warrior", "Spitter"
    And the job list should include the special job "DeLozier"

  @jobs @regular @data
  Scenario: getJobList returns standard job types
    When I call JobComponent.getJobList()
    Then I should get exactly 5 regular jobs
    And the regular job list should contain "Builder"
    And the regular job list should contain "Scout"
    And the regular job list should contain "Farmer"
    And the regular job list should contain "Warrior" 
    And the regular job list should contain "Spitter"

  @jobs @special @data
  Scenario: getSpecialJobs returns special job types
    When I call JobComponent.getSpecialJobs()
    Then I should get exactly 1 special job
    And the special job list should contain "DeLozier"

  @jobs @stats @builder
  Scenario: Builder job has correct stats
    When I call JobComponent.getJobStats with job name "Builder"
    Then the job stats should have strength value 20
    And the job stats should have health value 120
    And the job stats should have gatherSpeed value 15
    And the job stats should have movementSpeed value 60

  @jobs @stats @scout
  Scenario: Scout job has correct stats
    When I call JobComponent.getJobStats with job name "Scout"
    Then the job stats should have strength value 10
    And the job stats should have health value 80
    And the job stats should have gatherSpeed value 10
    And the job stats should have movementSpeed value 80

  @jobs @stats @farmer
  Scenario: Farmer job has correct stats
    When I call JobComponent.getJobStats with job name "Farmer"
    Then the job stats should have strength value 15
    And the job stats should have health value 100
    And the job stats should have gatherSpeed value 30
    And the job stats should have movementSpeed value 60

  @jobs @stats @warrior
  Scenario: Warrior job has correct stats
    When I call JobComponent.getJobStats with job name "Warrior"
    Then the job stats should have strength value 40
    And the job stats should have health value 150
    And the job stats should have gatherSpeed value 5
    And the job stats should have movementSpeed value 60

  @jobs @stats @spitter
  Scenario: Spitter job has correct stats
    When I call JobComponent.getJobStats with job name "Spitter"
    Then the job stats should have strength value 30
    And the job stats should have health value 90
    And the job stats should have gatherSpeed value 8
    And the job stats should have movementSpeed value 60

  @jobs @stats @special @delozier
  Scenario: DeLozier special job has correct overpowered stats
    When I call JobComponent.getJobStats with job name "DeLozier"
    Then the job stats should have strength value 1000
    And the job stats should have health value 10000
    And the job stats should have gatherSpeed value 1
    And the job stats should have movementSpeed value 10000

  @jobs @stats @default @fallback
  Scenario: Unknown job name returns default stats
    When I call JobComponent.getJobStats with job name "UnknownJob"
    Then the job stats should have strength value 10
    And the job stats should have health value 100
    And the job stats should have gatherSpeed value 10
    And the job stats should have movementSpeed value 60

  @jobs @constructor @instance
  Scenario: JobComponent constructor creates valid instances
    When I create a basic JobComponent instance with name "Builder" 
    Then the instance should have name property set to "Builder"
    And the instance should have stats property populated from getJobStats
    And the instance stats should match Builder job specifications
    And the instance should have image property set to null by default

  @jobs @constructor @image
  Scenario: JobComponent constructor accepts custom image
    When I create a JobComponent instance with name "Scout" and image "scout_sprite.png"
    Then the instance should have name property set to "Scout"
    And the instance should have image property set to "scout_sprite.png"
    And the instance stats should match Scout job specifications

  @jobs @stats @properties @validation
  Scenario: All job stats contain required properties
    When I call JobComponent.getJobStats for each job type
    Then every job should have a strength property
    And every job should have a health property
    And every job should have a gatherSpeed property
    And every job should have a movementSpeed property
    And all stat values should be positive numbers

  @jobs @integration @system
  Scenario: JobComponent integrates with global game system
    Given the game system is loaded
    When I access JobComponent through window.JobComponent
    Then JobComponent should be available globally in the browser
    And all static methods should work through global access
    And JobComponent should be available for Node.js module export

  @jobs @performance @batch
  Scenario: JobComponent handles multiple rapid calls efficiently
    When I call JobComponent.getAllJobs 100 times rapidly
    Then all calls should complete successfully
    And the results should be consistent across all calls
    And no memory leaks should occur during batch operations
    And response time should remain under acceptable thresholds

  # ===== JOB PROGRESSION & EXPERIENCE SYSTEM TESTS =====
  # These tests will initially FAIL and guide our TDD implementation

  @progression @experience @core
  Scenario: JobComponent provides experience and leveling methods
    When I inspect the JobComponent class for progression methods
    Then JobComponent.getExperience should be available as a static method
    And JobComponent.addExperience should be available as a static method
    And JobComponent.getLevel should be available as a static method
    And JobComponent.getLevelRequirements should be available as a static method
    And JobComponent.getLevelBonus should be available as a static method
    And JobComponent.getProgressionStats should be available as a static method

  @progression @experience @tracking
  Scenario: Experience tracking system works correctly
    Given I have an ant with job "Builder" at level 1 with 0 experience
    When I call JobComponent.addExperience with antId "ant_123" and 50 experience points
    Then the ant should have 50 experience points
    And the ant should still be level 1
    When I call JobComponent.addExperience with antId "ant_123" and 75 experience points
    Then the ant should have 125 experience points
    And the ant should be level 2
    And I should receive a level up notification event

  @progression @levels @requirements
  Scenario: Level requirements follow exponential progression
    When I call JobComponent.getLevelRequirements for levels 1 through 10
    Then level 1 should require 0 experience points
    And level 2 should require 100 experience points
    And level 3 should require 250 experience points
    And level 4 should require 500 experience points
    And level 5 should require 1000 experience points
    And each level should require more experience than the previous level
    And the progression should follow an exponential curve

  @progression @bonuses @builder
  Scenario: Builder job receives appropriate level bonuses
    Given I have a Builder ant at different levels
    When I call JobComponent.getLevelBonus for "Builder" at level 1
    Then the bonus should be null or empty
    When I call JobComponent.getLevelBonus for "Builder" at level 2
    Then the bonus should include strength increase of 2
    And the bonus should include health increase of 12
    When I call JobComponent.getLevelBonus for "Builder" at level 5
    Then the bonus should include strength increase of 8
    And the bonus should include health increase of 48
    And the bonus should include gatherSpeed increase of 3

  @progression @bonuses @warrior
  Scenario: Warrior job receives combat-focused level bonuses
    Given I have a Warrior ant at different levels
    When I call JobComponent.getLevelBonus for "Warrior" at level 2
    Then the bonus should include strength increase of 4
    And the bonus should include health increase of 15
    When I call JobComponent.getLevelBonus for "Warrior" at level 5
    Then the bonus should include strength increase of 16
    And the bonus should include health increase of 60
    And the bonus should include special ability "Charge Attack"

  @progression @bonuses @scout
  Scenario: Scout job receives mobility-focused level bonuses
    Given I have a Scout ant at different levels
    When I call JobComponent.getLevelBonus for "Scout" at level 3
    Then the bonus should include movementSpeed increase of 12
    And the bonus should include gatherSpeed increase of 2
    When I call JobComponent.getLevelBonus for "Scout" at level 5
    Then the bonus should include movementSpeed increase of 20
    And the bonus should include special ability "Sprint Burst"

  @progression @stats @calculation
  Scenario: getProgressionStats calculates total stats including bonuses
    Given I have a Builder ant at level 3 with appropriate bonuses
    When I call JobComponent.getProgressionStats for "Builder" at level 3
    Then the total strength should be base 20 plus level bonuses 4 equals 24
    And the total health should be base 120 plus level bonuses 24 equals 144
    And the total gatherSpeed should be base 15 plus level bonuses 1 equals 16
    And the progression stats should include current level and experience info

  @progression @experience @sources
  Scenario: Different activities provide appropriate experience rewards
    Given I have tracking for various ant activities
    When an ant completes building a structure
    Then the ant should receive experience based on structure complexity
    When an ant successfully gathers resources
    Then the ant should receive experience based on resource value and gathering efficiency
    When an ant wins combat against an enemy
    Then the ant should receive experience based on enemy difficulty
    When an ant discovers a new area
    Then the ant should receive exploration experience

  @progression @milestones @achievements
  Scenario: Progression milestones unlock special abilities and bonuses
    Given I have ants at various progression levels
    When a Builder reaches level 5
    Then the ant should unlock "Master Builder" milestone
    And the ant should receive permanent construction speed bonus
    When a Warrior reaches level 3
    Then the ant should unlock "Veteran Fighter" milestone
    And the ant should receive damage resistance bonus
    When any ant reaches level 10
    Then the ant should unlock "Elite Ant" milestone
    And the ant should receive leadership abilities

  @progression @visual @indicators
  Scenario: Visual progression indicators display correctly
    Given I have ants with different progression levels
    When I render an ant with level 1
    Then the ant should display no special visual indicators
    When I render an ant with level 3
    Then the ant should display bronze progression badge
    And the ant should have slightly enhanced visual appearance
    When I render an ant with level 5
    Then the ant should display silver progression badge
    And the ant should have moderately enhanced visual effects
    When I render an ant with level 10
    Then the ant should display gold progression badge
    And the ant should have impressive visual enhancements and particle effects

  @progression @persistence @data
  Scenario: Progression data persists correctly across game sessions
    Given I have ants with various progression levels and experience
    When I save the game state
    Then all ant experience points should be saved
    And all ant levels should be saved
    And all unlocked milestones should be saved
    When I load the game state
    Then all progression data should be restored exactly
    And calculated stats should match pre-save values

  @progression @balance @testing
  Scenario: Progression system maintains game balance
    Given I have ants at maximum practical levels
    When I calculate the stat increases from progression
    Then no single stat should exceed reasonable balance limits
    And progression bonuses should enhance but not overwhelm base job differences
    And special abilities should provide meaningful but balanced advantages
    When I test high-level ants in various game scenarios
    Then the game should remain challenging and engaging
    And progression should feel rewarding without breaking game mechanics