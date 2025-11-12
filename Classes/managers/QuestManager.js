// QuestManager.js
// Anthony Cruz
// I wanted to make a separate manager for quests to keep things organized.
// Any questions, feel free to ask!

let questUIAssets = {};

// QUEST UI PRELOADER \\
// Load quest UI images for later use
function QuestUIPreloader() {
    questUIAssets.bgImage = loadImage('Images/Assets/Menu/quest_box.png');
    questUIAssets.questUnchecked = loadImage('Images/Assets/Menu/quest_inc.png');
    questUIAssets.questChecked = loadImage('Images/Assets/Menu/quest_com.png');
}

class QuestManager {
    constructor() {
        this.activeQuests = [];
        this.completedQuests = [];
        this.uiVisible = false;

        // reference preloaded assets
        this.bgImage = null;
        this.questUnchecked = null;
        this.questChecked = null;
    }

    // ASSIGN PRELOADED ASSETS \\
    // Must be called after preload
    preloadAssets() {
        this.bgImage = questUIAssets.bgImage;
        this.questUnchecked = questUIAssets.questUnchecked;
        this.questChecked = questUIAssets.questChecked;
    }

    // START QUEST \\
    // Register a new quest
    startQuest(id, data) {
        const existing = this.activeQuests.find(q => q.id === id);
        if (existing) return;

        this.activeQuests.push({
            id,
            name: data.name,
            objective: data.objective,
            progress: 0,
            completed: false,
        });

        this.uiVisible = true;
        this.showUI();
    }

    // UPDATE QUEST PROGRESS \\
    // Made to be called when player makes progress on a quest
    updateQuestProgress(id, amount) {
        const quest = this.activeQuests.find(q => q.id === id);
        if (!quest) return;

        quest.progress = Math.min(quest.progress + amount, quest.objective.amount);
        if (quest.progress >= quest.objective.amount && !quest.completed) {
            quest.completed = true;
            this.completeQuest(id);
        }
    }

    // COMPLETE QUEST \\
    // Handle quest completion
    completeQuest(id) {
        const index = this.activeQuests.findIndex(q => q.id === id);
        if (index !== -1) {
            const quest = this.activeQuests[index];
            this.completedQuests.push(quest);
            this.activeQuests.splice(index, 1);
            // For testing lol
            this.showCompletionMessage(quest);
        }
    }

    // SHOW COMPLETION MESSAGE \\
    // Simple console log for now
    showCompletionMessage(quest) {
        console.log(`Quest Completed: ${quest.name}`);
    }

    // SHOW UI \\
    // Toggle quest UI visibility
    showUI() {
        this.uiVisible = true;
        this.renderUI();
    }

    // HIDE UI \\
    // The opposite of showUI
    hideUI() {
        this.uiVisible = false;
    }

    // RENDER UI \\
    // UI rendering logic
    renderUI() {
        if (!this.uiVisible) return;

        push();

        const boxW = 400;                   // width of quest box
        const boxH = 300;                   // height of quest box
        const boxX = 1300;                  // X position
        const boxY = height - boxH - 350;    // Y position
        const padding = 20;                 // inner padding

        // BACKGROUND IMAGE \\
        if (this.bgImage) image(this.bgImage, boxX, boxY, boxW, boxH);
        else {
            fill(0, 180);
            rect(boxX, boxY, boxW, boxH, 10);
        }

        // HEADER \\
        textAlign(LEFT, TOP);
        textFont(terrariaFont || 'sans-serif');
        textSize(28);
        textStyle(BOLD);
        fill(255);
        stroke(0);
        strokeWeight(3);
        text("Quests", boxX + padding - 58, boxY + padding - 100);

        // QUEST ENTRIES \\
        textStyle(NORMAL);
        textSize(22);
        strokeWeight(2);
        let y = boxY + padding + 50;

        this.activeQuests.forEach((q) => {
            const icon = q.completed ? this.questChecked : this.questUnchecked;

            // quest icon
            if (icon) image(icon, boxX + padding - 110, y - 90, 60, 60);
            const collected = getResourceCount("stick");
            // quest text
            fill(255);
            text(q.name, boxX + padding - 95 , y - 100);
            fill(200);
            text(`Progress: ${collected}/${q.objective.amount}`, boxX + padding -60, y - 80);

            y += 60;
        });

        // NO ACTIVE QUESTS \\
        if (this.activeQuests.length === 0) {
            fill(220);
            textSize(24);
            text("No active quests!", boxX + padding, boxY + boxH / 2);
        }

        pop();
    }
}

// GLOBAL INSTANCE \\
if (typeof window !== "undefined") {
    window.QuestManager = new QuestManager();
}
