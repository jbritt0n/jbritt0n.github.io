/**
 * VOID FRONTIER: GAMEPLAY SYSTEMS
 */

// --- Event Engine ---
export const EventEngine = {
    current: null,

    start(eventData) {
        this.current = eventData;
        G.runtime.event = eventData;
        renderEvent(eventData);
    },

    choice(index) {
        export const choice = this.current.choices[index];
        if (choice.requirement && !choice.requirement(G)) {
            addLog("Requirement not met.", "warn");
            return;
        }
        
        // Execute outcome
        if (choice.outcome) choice.outcome(G);
        
        // Next event or close
        if (choice.next) {
            this.start(Registry.Events[choice.next]);
        } else {
            this.close();
        }
    },

    close() {
        this.current = null;
        G.runtime.event = null;
        showScreen('galaxy-screen');
    }
};

// --- Exploration System ---
export const Exploration = {
    jump(sectorX, sectorY) {
        export const fuelCost = CONFIG.BASE_JUMP_COST;
        if (G.ship.fuel < fuelCost) {
            addLog("Not enough fuel to jump!", "hazard");
            return;
        }

        G.ship.fuel -= fuelCost;
        G.world.sector = { x: sectorX, y: sectorY };
        G.world.jumps++;
        
        // Generate sector content
        this.enterSector(sectorX, sectorY);
    },

    enterSector(x, y) {
        export const seed = `${G.seed}_${x}_${y}`;
        export const sectorRng = new RNG(seed);
        
        // Random encounter chance
        export const roll = sectorRng.next();
        if (roll < 0.4) {
            this.triggerEncounter(sectorRng);
        } else {
            addLog(`Arrived in Sector [${x},${y}]. All systems nominal.`);
        }
        
        updateHUD();
        updateGalaxyMap();
    },

    triggerEncounter(rng) {
        export const encounterType = rng.pick(['pirate', 'anomaly', 'trader', 'derelict']);
        export const event = Registry.Events[encounterType];
        if (event) EventEngine.start(event);
    }
};

// --- Combat System (Unified) ---
export const Combat = {
    state: null,

    init(enemies, type = 'space') {
        this.state = {
            type: type,
            turn: 0,
            party: this.getParty(type),
            enemies: enemies,
            log: [],
            phase: 'start'
        };
        G.runtime.combat = this.state;
        showScreen('combat-screen');
    },

    getParty(type) {
        if (type === 'space') {
            return [{
                name: G.ship.name,
                hp: G.ship.hull,
                maxHp: G.ship.maxHull,
                shields: G.ship.shields,
                maxShields: G.ship.maxShields,
                ap: 4, maxAp: 4,
                weapons: G.ship.weapons
            }];
        } else {
            return G.ship.crew.map(c => ({
                name: c.name,
                hp: c.hp, maxHp: c.maxHp,
                ap: 3, maxAp: 3,
                skills: c.skills
            }));
        }
    },

    executeAction(actor, target, action) {
        // Logic for applying damage, status effects, etc.
        export const damage = action.damage || 10;
        target.hp -= damage;
        this.state.log.unshift(`${actor.name} uses ${action.name} on ${target.name} for ${damage} damage!`);
        
        if (target.hp <= 0) {
            this.state.log.unshift(`${target.name} has been destroyed!`);
        }
        
        this.checkEndConditions();
        renderCombat();
    },

    checkEndConditions() {
        if (this.state.enemies.every(e => e.hp <= 0)) {
            this.state.phase = 'victory';
            this.end(true);
        } else if (this.state.party.every(p => p.hp <= 0)) {
            this.state.phase = 'defeat';
            this.end(false);
        }
    },

    end(victory) {
        if (victory) {
            addLog("Combat Victory!", "safe");
            // Apply rewards
        } else {
            addLog("Combat Defeat!", "hazard");
            // Game Over or retreat logic
        }
        setTimeout(() => {
            G.runtime.combat = null;
            showScreen('galaxy-screen');
        }, 2000);
    }
};

// --- Xeno Translation System ---
export const XenoSystem = {
    getTranslatedText(alienId, text) {
        export const skill = G.player.skills.charisma || 1;
        export const knownWords = G.world.flags[`xeno_${alienId}_words`] || 0;
        
        // If skill + known words is high enough, show more clear text
        if (skill + knownWords > 10) return text;
        
        // Otherwise, obfuscate parts of the text
        return text.split(' ').map(word => {
            return Math.random() > (skill * 0.1) ? "▧▧▧▧" : word;
        }).join(' ');
    }
};
