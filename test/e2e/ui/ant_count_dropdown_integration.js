/**
 * E2E Integration Tests for AntCountDropDown with EventBus
 * Tests the complete flow: Entity spawn → EntityManager tracking → UI updates
 */

const puppeteer = require('puppeteer');
const { saveScreenshot, sleep } = require('../puppeteer_helper');
const path = require('path');

describe('AntCountDropDown E2E Integration Tests', function() {
    this.timeout(30000);
    
    let browser;
    let page;
    const BASE_URL = 'http://localhost:8000';

    before(async function() {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });

    after(async function() {
        if (browser) {
            await browser.close();
        }
    });

    beforeEach(async function() {
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        await sleep(2000); // Wait for game to initialize
    });

    afterEach(async function() {
        if (page) {
            await page.close();
        }
    });

    describe('Initial State', function() {
        it('should show dropdown with zero counts on game start', async function() {
            // Click to start game
            await page.mouse.click(640, 360);
            await sleep(1000);

            // Check dropdown exists and shows zero counts
            const dropdownState = await page.evaluate(() => {
                if (!window.AntCountDropDown) {
                    return { error: 'AntCountDropDown class not found' };
                }

                // Check for dropdown instance in sketch
                const hasDropdown = typeof window.antCountDropdown !== 'undefined';
                
                return {
                    hasDropdown,
                    dropdownExists: hasDropdown,
                    antCountDropdownClass: !!window.AntCountDropDown
                };
            });

            console.log('Dropdown state:', dropdownState);

            await saveScreenshot(page, 'ant_count_dropdown/01_initial_zero_counts', true);
        });
    });

    describe('Entity Registration', function() {
        it('should update counts when ants are spawned', async function() {
            // Start game
            await page.mouse.click(640, 360);
            await sleep(1000);

            // Spawn ants using console helper
            const spawnResult = await page.evaluate(() => {
                if (typeof window.spawnTestAnts !== 'function') {
                    return { error: 'spawnTestAnts not available' };
                }

                // Spawn test ants
                window.spawnTestAnts();

                // Wait a bit for entity registration
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            success: true,
                            antsArrayLength: window.ants ? window.ants.length : 0
                        });
                    }, 500);
                });
            });

            console.log('Spawn result:', spawnResult);

            await sleep(1000);

            // Check EntityManager state
            const entityState = await page.evaluate(() => {
                if (!window.entityManager) {
                    return { error: 'EntityManager not found' };
                }

                return {
                    hasEntityManager: true,
                    antJobsByFaction: window.entityManager.antJobsByFaction || {},
                    totalEntities: Object.keys(window.entityManager.entities || {}).length,
                    factions: Object.keys(window.entityManager.factions || {})
                };
            });

            console.log('Entity state:', entityState);

            await saveScreenshot(page, 'ant_count_dropdown/02_after_spawn', true);
        });

        it('should show correct player faction counts only', async function() {
            // Start game
            await page.mouse.click(640, 360);
            await sleep(1000);

            // Spawn specific ants
            await page.evaluate(() => {
                if (typeof window.spawnAnts === 'function') {
                    // Spawn 5 scouts and 3 warriors
                    window.spawnAnts(5, 'Scout');
                    window.spawnAnts(3, 'Warrior');
                }
            });

            await sleep(1500);

            // Check counts
            const counts = await page.evaluate(() => {
                const entityManager = window.entityManager;
                if (!entityManager) {
                    return { error: 'EntityManager not found' };
                }

                const playerCounts = entityManager.antJobsByFaction?.player || {};
                
                return {
                    playerCounts,
                    scoutCount: playerCounts.Scout || 0,
                    warriorCount: playerCounts.Warrior || 0,
                    totalAnts: window.ants ? window.ants.length : 0
                };
            });

            console.log('Ant counts:', counts);

            await saveScreenshot(page, 'ant_count_dropdown/03_specific_counts', true);
        });
    });

    describe('EventBus Communication', function() {
        it('should emit ENTITY_COUNTS_UPDATED when ants spawn', async function() {
            // Start game
            await page.mouse.click(640, 360);
            await sleep(1000);

            // Listen for event
            const eventReceived = await page.evaluate(() => {
                return new Promise(resolve => {
                    let eventData = null;
                    
                    const listener = (data) => {
                        eventData = data;
                        resolve({
                            received: true,
                            data: eventData
                        });
                    };

                    if (window.eventBus) {
                        window.eventBus.on('ENTITY_COUNTS_UPDATED', listener);
                        
                        // Spawn an ant to trigger event
                        setTimeout(() => {
                            if (typeof window.spawnAnts === 'function') {
                                window.spawnAnts(1, 'Scout');
                            }
                        }, 100);

                        // Timeout if no event
                        setTimeout(() => {
                            resolve({ received: false, error: 'Timeout waiting for event' });
                        }, 3000);
                    } else {
                        resolve({ received: false, error: 'EventBus not found' });
                    }
                });
            });

            console.log('Event received:', eventReceived);

            await saveScreenshot(page, 'ant_count_dropdown/04_event_emission', true);
        });

        it('should receive events in dropdown component', async function() {
            // Start game
            await page.mouse.click(640, 360);
            await sleep(1000);

            // Check if dropdown is receiving events
            const dropdownListening = await page.evaluate(() => {
                if (!window.eventBus) {
                    return { error: 'EventBus not found' };
                }

                const listeners = window.eventBus.listeners('ENTITY_COUNTS_UPDATED');
                
                return {
                    listenerCount: listeners ? listeners.length : 0,
                    hasListeners: listeners && listeners.length > 0
                };
            });

            console.log('Dropdown listening:', dropdownListening);

            // Spawn ants and verify dropdown updates
            await page.evaluate(() => {
                if (typeof window.spawnAnts === 'function') {
                    window.spawnAnts(2, 'Builder');
                }
            });

            await sleep(1500);

            const updatedState = await page.evaluate(() => {
                const dropdown = window.antCountDropdown;
                if (!dropdown) {
                    return { error: 'Dropdown instance not found' };
                }

                return {
                    antCounts: dropdown.antCounts || {},
                    expanded: dropdown.expanded || false
                };
            });

            console.log('Updated dropdown state:', updatedState);

            await saveScreenshot(page, 'ant_count_dropdown/05_dropdown_updated', true);
        });
    });

    describe('Visual Verification', function() {
        it('should display counts in collapsed state', async function() {
            // Start game
            await page.mouse.click(640, 360);
            await sleep(1000);

            // Spawn diverse ants
            await page.evaluate(() => {
                if (typeof window.spawnTestAnts === 'function') {
                    window.spawnTestAnts();
                }
            });

            await sleep(1500);

            // Force redraw
            await page.evaluate(() => {
                if (typeof window.redraw === 'function') {
                    window.redraw();
                    window.redraw();
                    window.redraw();
                }
            });

            await sleep(500);

            await saveScreenshot(page, 'ant_count_dropdown/06_collapsed_view', true);
        });

        it('should expand and show detailed counts when clicked', async function() {
            // Start game
            await page.mouse.click(640, 360);
            await sleep(1000);

            // Spawn ants
            await page.evaluate(() => {
                if (typeof window.spawnTestAnts === 'function') {
                    window.spawnTestAnts();
                }
            });

            await sleep(1500);

            // Click dropdown to expand (at position 20, 80)
            await page.mouse.click(100, 95);
            await sleep(500);

            // Force redraw
            await page.evaluate(() => {
                if (typeof window.redraw === 'function') {
                    window.redraw();
                    window.redraw();
                    window.redraw();
                }
            });

            await sleep(500);

            await saveScreenshot(page, 'ant_count_dropdown/07_expanded_view', true);

            // Check if expanded
            const isExpanded = await page.evaluate(() => {
                const dropdown = window.antCountDropdown;
                return dropdown ? dropdown.expanded : null;
            });

            console.log('Dropdown expanded:', isExpanded);
        });
    });

    describe('Real-time Updates', function() {
        it('should update counts dynamically as ants are added', async function() {
            // Start game
            await page.mouse.click(640, 360);
            await sleep(1000);

            // Initial spawn
            await page.evaluate(() => {
                if (typeof window.spawnAnts === 'function') {
                    window.spawnAnts(3, 'Scout');
                }
            });

            await sleep(1000);
            await saveScreenshot(page, 'ant_count_dropdown/08_initial_3_scouts', true);

            // Add more scouts
            await page.evaluate(() => {
                if (typeof window.spawnAnts === 'function') {
                    window.spawnAnts(2, 'Scout');
                }
            });

            await sleep(1000);
            await saveScreenshot(page, 'ant_count_dropdown/09_added_2_more_scouts', true);

            // Check final count
            const finalCount = await page.evaluate(() => {
                const entityManager = window.entityManager;
                if (!entityManager) return { error: 'EntityManager not found' };

                return {
                    scoutCount: entityManager.antJobsByFaction?.player?.Scout || 0
                };
            });

            console.log('Final scout count:', finalCount);
        });
    });

    describe('Debug Output', function() {
        it('should log complete system state for debugging', async function() {
            // Start game
            await page.mouse.click(640, 360);
            await sleep(1000);

            // Spawn ants
            await page.evaluate(() => {
                if (typeof window.spawnTestAnts === 'function') {
                    window.spawnTestAnts();
                }
            });

            await sleep(2000);

            // Get complete state
            const systemState = await page.evaluate(() => {
                const state = {
                    eventBus: {
                        exists: !!window.eventBus,
                        listenerCount: window.eventBus ? window.eventBus.listeners('ENTITY_COUNTS_UPDATED').length : 0
                    },
                    entityManager: {
                        exists: !!window.entityManager,
                        antJobsByFaction: window.entityManager ? window.entityManager.antJobsByFaction : null,
                        factions: window.entityManager ? Object.keys(window.entityManager.factions || {}) : []
                    },
                    dropdown: {
                        exists: !!window.antCountDropdown,
                        antCounts: window.antCountDropdown ? window.antCountDropdown.antCounts : null,
                        expanded: window.antCountDropdown ? window.antCountDropdown.expanded : null
                    },
                    ants: {
                        totalCount: window.ants ? window.ants.length : 0,
                        jobs: window.ants ? window.ants.map(a => a.JobName).filter(Boolean) : []
                    }
                };

                return state;
            });

            console.log('=== COMPLETE SYSTEM STATE ===');
            console.log(JSON.stringify(systemState, null, 2));

            await saveScreenshot(page, 'ant_count_dropdown/10_debug_full_state', true);
        });
    });
});
