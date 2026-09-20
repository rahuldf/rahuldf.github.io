// =========================================
// CHUNK 3: STATE & ROUTING
// =========================================

// --- AUDIO SYSTEM (8-BIT SYNTH) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(soundName) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (soundName === 'blip') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } 
    else if (soundName === 'crunch') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } 
    else if (soundName === 'beepLow') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.setValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } 
    else if (soundName === 'beepHigh') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.setValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } 
    else if (soundName === 'victory') {
        osc.type = 'square';
        gainNode.gain.setValueAtTime(0.05, now);
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now); osc.stop(now + 0.8);
    }
}

// --- 1. GLOBAL STATE ---
let gameState = 'MENU'; // States: MENU, LOBBY, SINGLE_PLAYER, MULTIPLAYER, COASTING
let currentRoomId = null;
let isHost = false;
let playerName = "Player" + Math.floor(Math.random() * 1000);

// --- 2. DOM ELEMENT CACHING ---
const screens = {
    menu: document.getElementById('main-menu'),
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen'),
    winner: document.getElementById('winner-screen')
};

// --- 3. HELPER FUNCTIONS ---
function showScreen(screenKey) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    if (screens[screenKey]) screens[screenKey].classList.remove('hidden');
}

function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// --- COLOR PICKER LOGIC ---
const LOBBY_COLORS = ['#FF595E', '#FF924C', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'];
let selectedColor = '#FF595E'; // Default to Red

function renderColorGrid() {
    const grid = document.getElementById('color-grid');
    grid.innerHTML = '';
    
    // Find colors already taken by opponents
    const takenColors = Object.values(connectedPlayers)
        .filter(p => p.name !== playerName) 
        .map(p => p.color);

    LOBBY_COLORS.forEach(color => {
        let slot = document.createElement('div');
        slot.className = 'color-slot';
        slot.style.backgroundColor = color;
        
        if (takenColors.includes(color)) {
            slot.classList.add('locked'); // Grays out the button
            slot.innerHTML = 'X';
        } else {
            if (color === selectedColor) {
                slot.classList.add('selected');
                slot.innerHTML = '✔';
            }
            
            slot.addEventListener('click', () => {
                selectedColor = color;
                renderColorGrid();
                playSound('blip');
                
                // Tell the lobby we changed our color!
                if (roomChannel) {
                    roomChannel.presence.update({
                        name: playerName,
                        color: selectedColor,
                        isHost: isHost,
                        joinTime: myJoinTime
                    });
                }
            });
        }
        
        grid.appendChild(slot);
    });
}

// Prompt for username when entering a lobby
function promptForUsername() {
    let name = prompt("Enter your racer name (Max 10 chars):", playerName);
    if (name && name.trim().length > 0) {
        playerName = name.trim().substring(0, 10).toUpperCase();
    }
}

// --- 4. ROUTING & ROOM LOGIC ---
function initializeRouting() {
    const hash = window.location.hash.replace('#', '').trim().toUpperCase();
    
    if (hash.length === 5) {
        console.log(`🔗 Invite link detected.`);
        // Auto-fill the input but force them to click JOIN to unlock the AudioContext
        document.getElementById('join-room-input').value = hash;
        window.history.replaceState(null, null, ' '); 
    }
    
    showScreen('menu');
}

function joinRoom(roomId) {
    currentRoomId = roomId;
    window.location.hash = roomId; // Updates URL so they can copy it
    
    promptForUsername();
    renderColorGrid();
    
    document.getElementById('room-code-display').innerText = currentRoomId;
    document.getElementById('btn-start-race').classList.add('hidden'); // Hide start button for guests
    document.getElementById('waiting-msg').classList.remove('hidden'); // Show waiting text
    
    showScreen('lobby');
    
    // In Phase 3, we will trigger the Ably connection here:
    connectToAblyRoom(currentRoomId);
}

function createRoom() {
    isHost = true;
    currentRoomId = generateRoomId();
    window.location.hash = currentRoomId;
    
    promptForUsername();
    renderColorGrid();

    document.getElementById('room-code-display').innerText = currentRoomId;
    document.getElementById('btn-start-race').classList.remove('hidden'); // Host gets the start button
    document.getElementById('waiting-msg').classList.add('hidden');
    
    showScreen('lobby');
    
    // In Phase 3, we will trigger the Ably connection here:
    connectToAblyRoom(currentRoomId);
}

// --- 5. EVENT LISTENERS ---
document.getElementById('btn-create-room').addEventListener('click', () => {
    createRoom();
});

document.getElementById('btn-join-room').addEventListener('click', () => {
    const input = document.getElementById('join-room-input').value;
    // Sanitizes input: removes spaces and forces uppercase
    const sanitizedId = input.trim().toUpperCase(); 
    
    if (sanitizedId.length === 5) {
        joinRoom(sanitizedId);
    } else {
        alert("Please enter a valid 5-character Room Code.");
    }
});

// Allow hitting "Enter" key on the join input field
document.getElementById('join-room-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('btn-join-room').click();
    }
});

document.getElementById('btn-single-player').addEventListener('click', () => {
    gameState = 'SINGLE_PLAYER';
    currentRoomId = 'OFFLINE';
    isHost = true; // You are the host of your own offline game
    
    promptForUsername();
    renderColorGrid();
    
    document.getElementById('room-code-display').innerText = "SINGLE PLAYER";
    document.getElementById('btn-copy-invite').classList.add('hidden');
    document.getElementById('btn-start-race').classList.remove('hidden');
    document.getElementById('waiting-msg').classList.add('hidden');
    
    showScreen('lobby');
    
    // In Phase 2, we will generate the bots here:
    // generateOfflineBots();
});

document.getElementById('btn-copy-invite').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const btn = document.getElementById('btn-copy-invite');
        const originalText = btn.innerText;
        btn.innerText = "✅ COPIED!";
        setTimeout(() => { btn.innerText = originalText; }, 2000);
    });
});

// --- Boot the App ---
window.onload = initializeRouting;


// =========================================
// CHUNK 5: MOBILE & DESKTOP INPUTS
// =========================================

let localPlayer = null; 

// --- 1. INPUT HANDLERS ---
function handleInputLeft(e) {
    if (e) e.preventDefault(); 
    if (gameState !== 'RACING' || !localPlayer) return;
    
    // Left steers "Up" one lane
    if (localPlayer.targetLane > 0) {
        localPlayer.targetLane -= 1;
        playSound('blip');
        broadcastMovement();
    }
}

function handleInputRight(e) {
    if (e) e.preventDefault();
    if (gameState !== 'RACING' || !localPlayer) return;
    
    // Right steers "Down" one lane
    if (localPlayer.targetLane < 2) {
        localPlayer.targetLane += 1;
        playSound('blip');
        broadcastMovement();
    }
}

function handleInputBoost(e) {
    if (e) e.preventDefault();
    if (gameState !== 'RACING' || !localPlayer) return;
    
    if (localPlayer.boostsLeft > 0 && localPlayer.boostTimer === 0) {
        localPlayer.boostsLeft--;
        localPlayer.boostTimer = 30; 
        playSound('blip');
        document.getElementById('boost-counter').innerText = `${localPlayer.boostsLeft}x`;
        broadcastMovement();
    }
}

// --- 2. EVENT BINDING (TOUCH & MOUSE) ---
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnBoost = document.getElementById('btn-boost');

btnLeft.addEventListener('touchstart', handleInputLeft, { passive: false });
btnRight.addEventListener('touchstart', handleInputRight, { passive: false });
btnBoost.addEventListener('touchstart', handleInputBoost, { passive: false });

btnLeft.addEventListener('mousedown', handleInputLeft);
btnRight.addEventListener('mousedown', handleInputRight);
btnBoost.addEventListener('mousedown', handleInputBoost);

// --- 3. KEYBOARD FALLBACK (For PC Testing) ---
window.addEventListener('keydown', (e) => {
    if (gameState !== 'RACING') return;
    
    const key = e.key.toLowerCase();
    if (key === 'a' || key === 'arrowleft') {
        handleInputLeft();
    } else if (key === 'd' || key === 'arrowright') {
        handleInputRight();
    } else if (key === ' ' || key === 'shift') {
        handleInputBoost();
    }
});


// =========================================
// CHUNK 4: FIXED MULTIPLAYER DISPLAY ENGINE
// =========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let TOP_OFFSET = 0;
let LANE_WIDTH = 0;
let BLOCK_SIZE = 0;
let BLOCK_GAP = 0;
let CAR_WIDTH = 0;
let CAR_HEIGHT = 0;

const CAR_PATTERN = [
    [0, 1, 0], [1, 1, 1], [0, 1, 0], [1, 0, 1]  
];

function initDisplay() {
    // 1. Lock internal logic to 450x800 for guaranteed multiplayer fairness
    canvas.width = 450;
    canvas.height = 800;
    
    TOP_OFFSET = 0; 
    LANE_WIDTH = canvas.width / 3; 
    
    const targetCarWidth = LANE_WIDTH * 0.35;
    BLOCK_SIZE = Math.floor(targetCarWidth / 3); 
    BLOCK_GAP = Math.max(1, Math.floor(BLOCK_SIZE * 0.15));

    CAR_WIDTH = (BLOCK_SIZE * 3) + (BLOCK_GAP * 2);
    CAR_HEIGHT = (BLOCK_SIZE * 4) + (BLOCK_GAP * 3);
}

// Remove the window resize listener. The CSS handles the scaling now!
initDisplay();


// =========================================
// CHUNK 6: VERTICAL ENTITIES & BOT AI
// =========================================

let playerObjects = {};

class Player {
    constructor(id, name, colorHex, startingLane) {
        this.id = id; this.name = name; this.shortName = name.substring(0, 3).toUpperCase();
        this.colorHex = colorHex;
        this.lane = startingLane; this.targetLane = startingLane;
        
        this.baseY = canvas.height * 0.75;
        
        // Hardcoded ceiling so you don't boost off-screen
        this.minY = 20; 
        
        this.y = this.baseY + (startingLane * (canvas.height * 0.02)); 
        this.x = 0; 
        this.penaltyTimer = 0; this.boostsLeft = 2; this.boostTimer = 0;
    }

    update() {
        this.lane = this.targetLane;
        this.x = (this.lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (CAR_WIDTH / 2);

        let speedScale = canvas.height / 1920; 

        if (this.penaltyTimer > 0) {
            this.penaltyTimer--;
            this.y += 5; // Universal crash penalty speed
            if (this.y > canvas.height - CAR_HEIGHT) this.y = canvas.height - CAR_HEIGHT;
            
        } else if (this.boostTimer > 0) {
            this.boostTimer--;
            this.y -= 7; // Universal boost speed
            if (this.y < this.minY) this.y = this.minY;
            
        } else {
            // Only pull them forward if they fell behind (no backwards rubber-banding!)
            if (this.y > this.baseY) this.y -= 2; 
        }
    }

    draw(ctx) {
        if (this.penaltyTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

        ctx.globalAlpha = 0.85;
        if (this.boostTimer > 0) { ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 10; }

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                if (CAR_PATTERN[row][col] === 1) {
                    let bX = this.x + (col * (BLOCK_SIZE + BLOCK_GAP));
                    let bY = this.y + (row * (BLOCK_SIZE + BLOCK_GAP));
                    ctx.strokeStyle = this.colorHex; ctx.lineWidth = Math.max(1, BLOCK_SIZE * 0.1);
                    ctx.strokeRect(bX, bY, BLOCK_SIZE, BLOCK_SIZE);
                    ctx.fillStyle = this.colorHex;
                    let pad = Math.max(1, BLOCK_SIZE * 0.15);
                    ctx.fillRect(bX + pad, bY + pad, BLOCK_SIZE - (pad*2), BLOCK_SIZE - (pad*2));
                }
            }
        }

        ctx.globalAlpha = 1.0; ctx.shadowBlur = 0;

        // Draw Nameplate UNDER the car now
        ctx.fillStyle = '#FFFFFF';
        let fontSize = Math.max(14, Math.floor(BLOCK_SIZE * 1.2)); 
        ctx.font = `${fontSize}px VT323`;
        ctx.shadowColor = '#000000'; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
        
        let textWidth = ctx.measureText(this.shortName).width;
        ctx.fillText(this.shortName, this.x + (CAR_WIDTH / 2) - (textWidth / 2), this.y + CAR_HEIGHT + 20);
        
        ctx.shadowColor = 'transparent'; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    }
}

class BotPlayer extends Player {
    constructor(id, name, colorHex, startingLane) {
        super(id, name, colorHex, startingLane);
        this.reactionTimer = 0; 
    }

    update() {
        super.update(); 
        if (gameState !== 'RACING') return;
        if (this.reactionTimer > 0) { this.reactionTimer--; return; }

        // Look up the screen
        let lookAhead = canvas.height * 0.4; 
        let inDanger = false;

        if (typeof ObstacleManager !== 'undefined') {
            for (let obs of ObstacleManager.obstacles) {
                if (obs.lane === this.targetLane) {
                    // Obstacles are above us, so check distance upwards
                    let distance = this.y - (obs.y + obs.height); 
                    if (distance > 0 && distance < lookAhead) {
                        inDanger = true; break;
                    }
                }
            }
        }

        if (inDanger) {
            // Fix: Bots can only move left or right one lane at a time
            let adjacentLanes = [];
            if (this.targetLane === 0) adjacentLanes = [1];
            else if (this.targetLane === 1) adjacentLanes = [0, 2];
            else if (this.targetLane === 2) adjacentLanes = [1];

            let nextLane = adjacentLanes[Math.floor(Math.random() * adjacentLanes.length)];
            
            let laneIsBlocked = false;
            for (let obs of ObstacleManager.obstacles) {
                if (obs.lane === nextLane) {
                    let distance = this.y - (obs.y + obs.height);
                    if (distance > 0 && distance < lookAhead) {
                        laneIsBlocked = true; break;
                    }
                }
            }
            
            // If in the middle lane and the chosen side is blocked, try the other side
            if (laneIsBlocked && this.targetLane === 1) {
                nextLane = adjacentLanes.find(l => l !== nextLane);
            } else if (laneIsBlocked) {
                // Trapped on an edge! Brace for impact instead of teleporting.
                nextLane = this.targetLane;
            }
            
            this.targetLane = nextLane;
            this.reactionTimer = Math.floor(Math.random() * 20) + 10; 
        }
    }
}


// =========================================
// CHUNK 7: VERTICAL ENGINE, PRNG & LOOP
// =========================================

const TRACK_LENGTH = 30000;
let currentDistance = TRACK_LENGTH;
let globalSpeed = 0;
let checkeredFlag = { y: -200, active: false }; // Spawns above screen
let winnerDeclared = false;
let raceSeed = 12345; 

function seededRandom() {
    var t = raceSeed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

class Obstacle {
    constructor(lane, yOffset) {
        this.lane = lane;
        this.y = yOffset;
        this.x = (this.lane * LANE_WIDTH) + (LANE_WIDTH / 2) - (CAR_WIDTH / 2);
        this.width = CAR_WIDTH;
        this.height = (BLOCK_SIZE * 2) + BLOCK_GAP; // 2 blocks tall, 3 blocks wide
    }
    update(speed) { this.y += speed; } // Moves DOWN the screen
    draw(ctx) {
        ctx.fillStyle = '#E2E8F0';
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                let bX = this.x + (col * (BLOCK_SIZE + BLOCK_GAP));
                let bY = this.y + (row * (BLOCK_SIZE + BLOCK_GAP));
                ctx.fillRect(bX, bY, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#1A1A24'; ctx.lineWidth = 1; ctx.strokeRect(bX, bY, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

const ObstacleManager = {
    obstacles: [], spawnTimer: 0, 
    baseSpawnInterval: 240, // Increased from 160 for much wider gaps
    safePatterns: [ [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [0, 0, 0] ],
    
    update: function(speed) {
        this.spawnTimer--;
        let currentInterval = this.baseSpawnInterval;
        
        // Gradually gets slightly faster, but never reaches that claustrophobic speed
        if (currentDistance < 20000) currentInterval = 200;
        if (currentDistance < 10000) currentInterval = 160;

        if (this.spawnTimer <= 0 && currentDistance > 300) {
            this.spawnSlices(); 
            this.spawnTimer = currentInterval;
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i]; obs.update(speed);
            if (obs.y > canvas.height + 100) this.obstacles.splice(i, 1); 
        }
    },
    spawnSlices: function() {
        const patternIndex = Math.floor(seededRandom() * this.safePatterns.length);
        const pattern = this.safePatterns[patternIndex];
        for (let lane = 0; lane < 3; lane++) {
            if (pattern[lane] === 1) this.obstacles.push(new Obstacle(lane, -200));
        }
    },
    draw: function(ctx) { this.obstacles.forEach(obs => obs.draw(ctx)); }
};

function checkCollisions() {
    for (const id in playerObjects) {
        let p = playerObjects[id];
        let pLeft = p.x; let pRight = p.x + CAR_WIDTH;
        let pTop = p.y; let pBottom = p.y + CAR_HEIGHT;

        for (let obs of ObstacleManager.obstacles) {
            let oLeft = obs.x; let oRight = obs.x + obs.width;
            let oTop = obs.y; let oBottom = obs.y + obs.height;
            if (pRight > oLeft && pLeft < oRight && pBottom > oTop && pTop < oBottom) {
                if (p.penaltyTimer === 0) { p.penaltyTimer = 90; playSound('crunch'); }
            }
        }
    }
}

function startCountdown() {
    showScreen('game'); document.getElementById('countdown-layer').classList.remove('hidden');
    let cdText = document.getElementById('countdown-text');
    document.getElementById('boost-counter').innerText = '2x';
    
    cdText.innerText = '3'; playSound('beepLow');
    setTimeout(() => { cdText.innerText = '2'; playSound('beepLow'); }, 1000);
    setTimeout(() => { cdText.innerText = '1'; playSound('beepLow'); }, 2000);
    setTimeout(() => { 
        cdText.innerText = 'GO!'; playSound('beepHigh'); 
        gameState = 'RACING'; currentDistance = TRACK_LENGTH; ObstacleManager.obstacles = [];
        checkeredFlag = { y: -400, active: false }; winnerDeclared = false;
        
        // Universal Speed for all players
        globalSpeed = 3; 
        requestAnimationFrame(gameLoop);
        
        requestAnimationFrame(gameLoop);
    }, 3000);
    setTimeout(() => { document.getElementById('countdown-layer').classList.add('hidden'); }, 4000);
}

function triggerWin(winnerPlayer) {
    if (winnerDeclared) return;
    winnerDeclared = true; gameState = 'COASTING'; playSound('victory'); 
    globalSpeed = canvas.height * 0.002; 
    setTimeout(() => { document.getElementById('winner-name').innerText = winnerPlayer.name; showScreen('winner'); }, 2000);
}

function gameLoop() {
    if (gameState === 'MENU' || gameState === 'LOBBY') return; 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Vertical Lane Dividers (Starting at absolute 0)
    ctx.strokeStyle = '#2A2A35'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(LANE_WIDTH, 0); ctx.lineTo(LANE_WIDTH, canvas.height);
    ctx.moveTo(LANE_WIDTH * 2, 0); ctx.lineTo(LANE_WIDTH * 2, canvas.height);
    ctx.stroke();

    // Horizontal Progress bar sticky to absolute TOP edge
    let progress = 1 - (Math.max(0, currentDistance) / TRACK_LENGTH);
    ctx.strokeStyle = '#FFB800'; ctx.shadowColor = '#FFB800'; ctx.shadowBlur = 10; ctx.lineWidth = 6;
    ctx.beginPath(); 
    ctx.moveTo(0, 3); ctx.lineTo(canvas.width * progress, 3); 
    ctx.stroke();
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';

    if (gameState === 'RACING') {
        currentDistance -= globalSpeed * 2.5; 
        document.getElementById('distance-tracker').innerText = Math.max(0, Math.floor(currentDistance)) + 'm';
        if (currentDistance <= 0 && !checkeredFlag.active) checkeredFlag.active = true;
        ObstacleManager.update(globalSpeed); checkCollisions();
    } else if (gameState === 'COASTING') {
        ObstacleManager.update(globalSpeed);
    }

    // 1. Update all physics first
    if (gameState !== 'COUNTDOWN') {
        for (let id in playerObjects) {
            playerObjects[id].update();
        }
    }

    ObstacleManager.draw(ctx);
    
    // 2. Draw Opponents (Background layer)
    for (let id in playerObjects) {
        if (id !== 'local') {
            playerObjects[id].draw(ctx);
        }
    }
    
    // 3. Draw Local Player (Foreground layer so you are always visible)
    if (playerObjects['local']) {
        playerObjects['local'].draw(ctx);
    }

    // Finish Line Logic
    if (checkeredFlag.active) {
        checkeredFlag.y += globalSpeed; 
        let flagBlock = Math.max(10, canvas.width * 0.05);
        let flagHeight = flagBlock;
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < (canvas.width / flagBlock); col++) {
                ctx.fillStyle = (row + col) % 2 === 0 ? '#FFFFFF' : '#000000';
                ctx.fillRect(col * flagBlock, checkeredFlag.y + (row * flagHeight), flagBlock, flagHeight);
            }
        }
        
        if (gameState === 'RACING') {
            let crossedPlayers = [];
            for (const id in playerObjects) {
                if (playerObjects[id].y <= checkeredFlag.y + (flagHeight * 4)) crossedPlayers.push(playerObjects[id]);
            }
            if (crossedPlayers.length > 0) {
                crossedPlayers.sort((a, b) => a.y - b.y);
                triggerWin(crossedPlayers[0]);
            }
        }
    }
    requestAnimationFrame(gameLoop);
}

function generateOfflineBots() {
    const botNames = ['Bender', 'Hal', 'Glados', 'Wall-E', 'R2D2'];
    
    // Filter out the player's chosen color so bots don't copy it
    const availableBotColors = LOBBY_COLORS.filter(c => c !== selectedColor);
    
    playerObjects = {};
    
    // Assign the user's selected color
    localPlayer = new Player('local', playerName, selectedColor, 1); 
    playerObjects['local'] = localPlayer;
    
    // Generate all 5 bots for a full 6-player race
    for(let i=0; i<5; i++) {
        let botId = 'bot_' + i;
        // Bots cycle through the remaining colors safely
        let botColor = availableBotColors[i % availableBotColors.length];
        
        playerObjects[botId] = new BotPlayer(botId, botNames[i], botColor, i % 3);
    }
    
    raceSeed = Math.floor(Math.random() * 999999); 
    startCountdown();
}

document.getElementById('btn-start-race').addEventListener('click', () => {
    if (currentRoomId === 'OFFLINE') {
        generateOfflineBots();
    } else {
        broadcastGameStart(); 
    }
});

document.getElementById('btn-return-menu').addEventListener('click', () => {
    window.location.hash = ''; window.location.reload(); 
});

// =========================================
// CHUNK 8: ABLY NETWORK & PRESENCE
// =========================================

let ably = null;
let roomChannel = null;
let connectedPlayers = {}; // Stores { clientId: { name, color, isHost } }
let myClientId = null;
let myJoinTime = Date.now();

async function connectToAblyRoom(roomId) {
    console.log(`🔌 Attempting to connect to room: ${roomId}...`);
    
    // We will build this Vercel endpoint in Chunk 10.
    const authUrl = `https://retro-lane.vercel.app/api/ably-auth?room=${roomId}`;
    
    const sessionClientId = playerName + '_' + Math.floor(Math.random() * 100000);
    
    ably = new Ably.Realtime({ authUrl: authUrl, clientId: sessionClientId });
    
    ably.connection.on('connected', () => {
        console.log("🟢 Connected to Ably!");
        myClientId = ably.auth.clientId;
        
        roomChannel = ably.channels.get(`room:${roomId}`);
        
        // 1. Subscribe to ALL Lobby Updates (This single line replaces the 4 separate subscribe lines)
        roomChannel.presence.subscribe(handlePresenceUpdate);
        
        // 2. Announce ourselves to the room
        roomChannel.presence.enter({
            name: playerName,
            color: selectedColor,
            isHost: isHost,
            joinTime: myJoinTime
        });

        // 3. THE FIX: Fetch players who were already in the room before we joined!
        roomChannel.presence.get((err, members) => {
            if (!err && members) {
                const takenColors = [];
                members.forEach(member => {
                    connectedPlayers[member.clientId] = member.data;
                    takenColors.push(member.data.color);
                });
                
                // Auto-assign a safe color if the default is taken
                if (takenColors.includes(selectedColor)) {
                    selectedColor = LOBBY_COLORS.find(c => !takenColors.includes(c)) || LOBBY_COLORS[0];
                    roomChannel.presence.update({
                        name: playerName, color: selectedColor, isHost: isHost, joinTime: myJoinTime
                    });
                }
                
                updateLobbyUI();
            }
        });

        // 4. Listen for the Host starting the game
        roomChannel.subscribe('game-control', (message) => {
            if (message.data.action === 'START') {
                raceSeed = message.data.seed; 
                generateMultiplayerGrid();
            }
        });

        // 5. Activate in-race movement listeners
        setupNetworkListeners();
    });

    ably.connection.on('failed', () => {
        alert("Failed to connect to the multiplayer server. Check your connection.");
    });
}

function handlePresenceUpdate(member) {
    if (member.action === 'leave') {
        delete connectedPlayers[member.clientId];
        
        // Remove the zombie car from the physics engine if mid-race
        if (playerObjects[member.clientId]) {
            delete playerObjects[member.clientId];
        }
    } else {
        connectedPlayers[member.clientId] = member.data;
    }
    
    updateLobbyUI();
}

function updateLobbyUI() {
    if (currentRoomId === 'OFFLINE') return; // Ignore for single player

    // 1. LEADER ELECTION: Find the player who has been in the room the longest
    let oldestTime = Infinity;
    let hostId = null;

    for (let id in connectedPlayers) {
        let pTime = connectedPlayers[id].joinTime;
        if (pTime < oldestTime) {
            oldestTime = pTime;
            hostId = id;
        } else if (pTime === oldestTime) {
            // Tie-breaker: If two people joined on the exact same millisecond
            if (!hostId || id < hostId) hostId = id;
        }
    }
    
    // Automatically promote ourselves if we are the oldest surviving player!
    isHost = (myClientId === hostId);

    // 2. UI UPDATES
    const pCount = Object.keys(connectedPlayers).length;
    document.getElementById('player-count').innerText = `Players: ${pCount}/6`;
    
    renderColorGrid(); 
    renderPlayerList(hostId); // Trigger the new visual list
    
    // 3. HOST CONTROLS
    const startBtn = document.getElementById('btn-start-race');
    const waitingMsg = document.getElementById('waiting-msg');

    if (isHost) {
        waitingMsg.classList.add('hidden');
        if (pCount > 1) {
            startBtn.classList.remove('hidden');
        } else {
            startBtn.classList.add('hidden'); // Cannot start a race with 1 person
        }
    } else {
        startBtn.classList.add('hidden');
        waitingMsg.classList.remove('hidden');
    }
}

function renderPlayerList(hostId) {
    let listContainer = document.getElementById('player-list-display');
    
    // Create the container dynamically if it doesn't exist
    if (!listContainer) {
        listContainer = document.createElement('div');
        listContainer.id = 'player-list-display';
        listContainer.style.marginTop = '20px';
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'column';
        listContainer.style.gap = '10px';
        
        // Insert it right beneath the color picker grid
        const grid = document.getElementById('color-grid');
        grid.parentNode.insertBefore(listContainer, grid.nextSibling);
    }
    
    listContainer.innerHTML = ''; // Clear the old list
    
    for (let id in connectedPlayers) {
        let p = connectedPlayers[id];
        
        let row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'center';
        row.style.gap = '15px';
        row.style.fontSize = '24px';
        
        // Draw their selected car color
        let colorBox = document.createElement('div');
        colorBox.style.width = '24px';
        colorBox.style.height = '24px';
        colorBox.style.backgroundColor = p.color;
        colorBox.style.border = '2px solid #FFF';
        
        // Write their name and status tags
        let nameText = document.createElement('span');
        nameText.style.color = '#FFF';
        
        let tags = '';
        if (id === hostId) tags += ' [HOST]';
        if (id === myClientId) tags += ' (YOU)';
        
        nameText.innerText = `${p.name} ${tags}`;
        
        row.appendChild(colorBox);
        row.appendChild(nameText);
        listContainer.appendChild(row);
    }
}

function generateMultiplayerGrid() {
    playerObjects = {};
    
    // Sort client IDs alphabetically to guarantee 100% deterministic 
    // lane assignment across all players' screens
    const sortedIds = Object.keys(connectedPlayers).sort();
    
    let laneAssignment = 0;
    
    for (const clientId of sortedIds) {
        let pData = connectedPlayers[clientId];
        let pLane = laneAssignment % 3; 
        
        let newPlayer = new Player(clientId, pData.name, pData.color, pLane);
        playerObjects[clientId] = newPlayer;
        
        if (clientId === myClientId) {
            localPlayer = newPlayer; 
        }
        
        laneAssignment++;
    }
    
    startCountdown();
}

function broadcastGameStart() {
    if (!roomChannel || !isHost) return;
    
    // Generate a master seed so everyone gets the exact same obstacles
    const masterSeed = Math.floor(Math.random() * 999999);
    
    roomChannel.publish('game-control', {
        action: 'START',
        seed: masterSeed
    });
}

// =========================================
// CHUNK 9: MULTIPLAYER NETCODE & SYNC
// =========================================

function broadcastMovement() {
    if (!roomChannel || currentRoomId === 'OFFLINE' || !localPlayer) return;

    roomChannel.publish('player-move', {
        targetLane: localPlayer.targetLane,
        // We send our current Y coordinate to act as a soft anchor.
        // If a player lags, this allows their phone to correct their opponent's position.
        y: localPlayer.y 
    });
}

function broadcastBoost() {
    if (!roomChannel || currentRoomId === 'OFFLINE' || !localPlayer) return;

    roomChannel.publish('player-boost', {
        y: localPlayer.y
    });
}

function setupNetworkListeners() {
    // 1. Listen for opponent lane changes
    roomChannel.subscribe('player-move', (message) => {
        // Ignore the "echo" of our own broadcast
        if (message.clientId === myClientId) return; 

        let opponent = playerObjects[message.clientId];
        if (opponent) {
            opponent.targetLane = message.data.targetLane;
            
            // Anti-Desync: If network lag caused them to drift more than 50px from 
            // where they actually are on their own screen, gently rubber-band them back.
            if (Math.abs(opponent.y - message.data.y) > 50) {
                opponent.y = message.data.y;
            }
        }
    });

    // 2. Listen for opponent boosts
    roomChannel.subscribe('player-boost', (message) => {
        if (message.clientId === myClientId) return; 

        let opponent = playerObjects[message.clientId];
        if (opponent) {
            opponent.boostTimer = 30; // Trigger their boost animation locally
            playSound('blip');
            
            // Hard sync their Y position so they get the exact distance advantage 
            // on your screen that they earned on theirs.
            opponent.y = message.data.y;
        }
    });
}

let lastFocusTime = Date.now();

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        lastFocusTime = Date.now();
    } else if (gameState === 'RACING') {
        // Calculate how many frames were missed (assuming 60fps)
        let timeAwayMs = Date.now() - lastFocusTime;
        let missedFrames = Math.floor(timeAwayMs / 16.6);
        
        // Fast-forward the track and obstacles
        currentDistance -= (globalSpeed * 2.5) * missedFrames;
        for (let i = 0; i < missedFrames; i++) {
            ObstacleManager.update(globalSpeed);
        }
        console.log(`⏱️ Caught up ${missedFrames} frames after tab restore.`);
    }
});