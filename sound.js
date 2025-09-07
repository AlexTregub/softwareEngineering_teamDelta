let dirtSound;
let grassSound;
let stoneSound;

function preloadSounds() {
    dirtSound = loadSound('Sounds/dirt.ogg');
    grassSound = loadSound('Sounds/grass.ogg');
    stoneSound = loadSound('Sounds/stone.ogg');
}

function playTerrainSound(material) {
    if (material == 'dirt') {
        dirtSound.play();
    } else if (material == 'grass') {
        grassSound.play();
    } else if (material == 'stone') {
        stoneSound.play();
    }
}