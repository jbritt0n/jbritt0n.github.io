/**
 * VOID FRONTIER: CORE ENGINE & REGISTRIES
 */

// --- Constants & Config ---
const CONFIG = {
    VERSION: "2.0.0",
    MAX_SAVE_SLOTS: 3,
    DEFAULT_MAX_HULL: 100,
    DEFAULT_MAX_FUEL: 50,
    BASE_JUMP_COST: 2,
};

// --- Registries ---
const Registry = {
    Origins: {
        'terran_exile': {
            id: 'terran_exile',
            name: 'Terran Exile',
            desc: 'Driven from Earth, you carry the remnants of old-world diplomacy.',
            bonus: 'Start with +200 Credits and +1 Charisma.',
            apply: (G) => {
                G.player.credits += 200;
                G.player.skills.charisma += 1;
            }
        },
        'asteroid_miner': {
            id: 'asteroid_miner',
            name: 'Asteroid Miner',
            desc: 'Hardened by the belt. You know where the good stuff is hidden.',
            bonus: 'Start with +50 Scrap and +1 Engineering.',
            apply: (G) => {
                G.player.scrap += 50;
                G.player.skills.engineering += 1;
            }
        }
    },
    Classes: {
        'pilot': {
            id: 'pilot',
            name: 'Ace Pilot',
            desc: 'Master of the flight stick. You make the ship dance.',
            bonus: '-20% Fuel consumption and +10% Evasion.',
            effects: { fuelEfficiency: 0.8, evasion: 0.1 }
        },
        'engineer': {
            id: 'engineer',
            name: 'Chief Engineer',
            desc: 'You can fix a warp drive with a paperclip and gum.',
            bonus: '+20% Repair efficiency and +1 Module slot.',
            effects: { repairBonus: 1.2, moduleSlots: 1 }
        }
    },
    Items: {
        'scrap': { id: 'scrap', name: 'Metal Scrap', type: 'resource', value: 5 },
        'fuel': { id: 'fuel', name: 'He-3 Fuel', type: 'resource', value: 10 },
        'medkit': { id: 'medkit', name: 'Medkit', type: 'consumable', value: 25, heal: 20 },
    },
    Ships: {
        'scout_v1': {
            id: 'scout_v1',
            name: 'Vanguard Scout',
            hull: 100,
            shields: 40,
            fuel: 60,
            cargo: 10,
            modules: 2,
            weapons: 1
        }
    }
};

// --- State Management ---
let G = {};

function initState(seed) {
    const rng = new RNG(seed);
    G = {
        version: CONFIG.VERSION,
        seed: seed,
        rng: rng,
        player: {
            name: "Captain",
            origin: null,
            class: null,
            credits: 500,
            scrap: 0,
            skills: { piloting: 1, charisma: 1, engineering: 1 },
            reputation: { 'Federation': 0, 'Pirates': 0, 'Syndicate': 0 }
        },
        ship: {
            id: 'scout_v1',
            hull: 100, maxHull: 100,
            shields: 40, maxShields: 40,
            fuel: 50, maxFuel: 50,
            cargo: [],
            modules: [],
            weapons: [],
            crew: []
        },
        world: {
            sector: { x: 0, y: 0 },
            jumps: 0,
            flags: {},
            discovered: {}
        },
        runtime: {
            log: [],
            screen: 'title',
            event: null,
            combat: null
        }
    };
}

// --- Utilities ---
class RNG {
    constructor(seed) {
        this.seed = seed;
        this.m = 0x80000000;
        this.a = 1103515245;
        this.c = 12345;
        this.state = typeof seed === 'string' ? this.hash(seed) : seed;
    }
    hash(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
        return h;
    }
    next() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state / (this.m - 1);
    }
    range(min, max) {
        return Math.floor(this.next() * (max - min + 1) + min);
    }
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }
}

function addLog(msg, type = 'info') {
    G.runtime.log.unshift({ msg, type, time: Date.now() });
    if (G.runtime.log.length > 50) G.runtime.log.pop();
    // In a real implementation, this would trigger a UI update
}

// --- Effect System ---
function getPlayerStat(stat) {
    let base = G.player.skills[stat] || 0;
    // Collect modifiers from class, origin, and ship modules
    const classData = Registry.Classes[G.player.class];
    if (classData?.effects?.[stat]) base += classData.effects[stat];
    
    // Add more logic here for items/modules
    return base;
}
