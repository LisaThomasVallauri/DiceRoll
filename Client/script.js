// D&D Character Sheet JavaScript

// Global Variables
const abilities = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];
const skills = [
    {name: 'Acrobazia', ability: 'DES'},
    {name: 'Addestrare Animali', ability: 'SAG'},
    {name: 'Arcano', ability: 'INT'},
    {name: 'Atletica', ability: 'FOR'},
    {name: 'Furtivita\'', ability: 'DES'},
    {name: 'Indagare', ability: 'INT'},
    {name: 'Inganno', ability: 'CAR'},
    {name: 'Intimidire', ability: 'CAR'},
    {name: 'Intrattenere', ability: 'CAR'},
    {name: 'Intuizione', ability: 'SAG'},
    {name: 'Medicina', ability: 'SAG'},
    {name: 'Natura', ability: 'INT'},
    {name: 'Percezione', ability: 'SAG'},
    {name: 'Persuasione', ability: 'CAR'},
    {name: 'Rapidita\' di mano', ability: 'DES'},
    {name: 'Religione', ability: 'INT'},
    {name: 'Sopravvivenza', ability: 'SAG'},
    {name: 'Storia', ability: 'INT'}
];

let abilityScores = {};
let abilityModifiers = {};
let skillScaling = {};
let characterImages = [];
let currentImageIndex = 0;
let dmImages = [];
let currentDMImageIndex = 0;

// Initialize the sheet
document.addEventListener('DOMContentLoaded', function() {
    initializeAbilities();
    initializeSaves();
    initializeSkills();
    initializeWeapons();
    initializeEquipment();
    initializeSpells();
    initializeScaling();
    initializeDMAbilities();
    
    // Add event listeners
    document.getElementById('profBonus').addEventListener('input', updateAllCalculations);
    document.getElementById('diceCommand').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') rollDice();
    });
    document.getElementById('charImageInput').addEventListener('change', handleCharImageUpload);
    document.getElementById('dmImageInput').addEventListener('change', handleDMImageUpload);
    
    // Initialize skill scaling with defaults
    skills.forEach(skill => {
        skillScaling[skill.name] = skill.ability;
    });
});

// ==================== ABILITIES ====================
function initializeAbilities() {
    const container = document.getElementById('abilitiesContainer');
    abilities.forEach(ability => {
        const row = document.createElement('div');
        row.className = 'ability-row';
        row.innerHTML = `
            <span class="ability-label">${ability}</span>
            <input type="number" class="form-control form-control-sm ability-score" 
                   id="ability_${ability}" value="10" min="1" max="30">
            <span class="ability-modifier" id="mod_${ability}">+0</span>
        `;
        container.appendChild(row);
        
        // Add event listener
        document.getElementById(`ability_${ability}`).addEventListener('input', function() {
            updateModifier(ability);
            updateAllCalculations();
        });
        
        // Initialize
        abilityScores[ability] = 10;
        abilityModifiers[ability] = 0;
    });
}

function updateModifier(ability) {
    const score = parseInt(document.getElementById(`ability_${ability}`).value) || 10;
    const modifier = Math.floor((score - 10) / 2);
    abilityScores[ability] = score;
    abilityModifiers[ability] = modifier;
    
    const modDisplay = document.getElementById(`mod_${ability}`);
    modDisplay.textContent = modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

// ==================== SAVING THROWS ====================
function initializeSaves() {
    const container = document.getElementById('savesContainer');
    abilities.forEach(ability => {
        const row = document.createElement('div');
        row.className = 'save-row';
        row.innerHTML = `
            <span class="save-label">${ability}</span>
            <input type="checkbox" class="form-check-input save-prof" id="save_prof_${ability}">
            <span class="save-modifier" id="save_${ability}">+0</span>
        `;
        container.appendChild(row);
        
        // Add event listener
        document.getElementById(`save_prof_${ability}`).addEventListener('change', updateSaves);
    });
}

function updateSaves() {
    const profBonus = parseInt(document.getElementById('profBonus').value) || 2;
    
    abilities.forEach(ability => {
        const modifier = abilityModifiers[ability] || 0;
        const isProficient = document.getElementById(`save_prof_${ability}`).checked;
        const saveBonus = modifier + (isProficient ? profBonus : 0);
        
        const saveDisplay = document.getElementById(`save_${ability}`);
        saveDisplay.textContent = saveBonus >= 0 ? `+${saveBonus}` : `${saveBonus}`;
    });
}

// ==================== SKILLS ====================
function initializeSkills() {
    const container = document.getElementById('skillsContainer');
    skills.forEach(skill => {
        const row = document.createElement('div');
        row.className = 'skill-row';
        row.innerHTML = `
            <span class="skill-name">${skill.name} (${skill.ability})</span>
            <span class="skill-mod" id="skill_${skill.name.replace(/\s+/g, '_').replace(/'/g, '')}">+0</span>
            <input type="checkbox" class="skill-checkbox" id="prof_${skill.name.replace(/\s+/g, '_').replace(/'/g, '')}">
            <input type="checkbox" class="skill-checkbox" id="mastery_${skill.name.replace(/\s+/g, '_').replace(/'/g, '')}">
        `;
        container.appendChild(row);
        
        // Add event listeners
        const profId = `prof_${skill.name.replace(/\s+/g, '_').replace(/'/g, '')}`;
        const masteryId = `mastery_${skill.name.replace(/\s+/g, '_').replace(/'/g, '')}`;
        
        document.getElementById(profId).addEventListener('change', function() {
            if (this.checked) {
                document.getElementById(masteryId).checked = false;
            }
            updateSkills();
        });
        
        document.getElementById(masteryId).addEventListener('change', function() {
            if (this.checked) {
                document.getElementById(profId).checked = false;
            }
            updateSkills();
        });
    });
}

function updateSkills() {
    const profBonus = parseInt(document.getElementById('profBonus').value) || 2;
    
    skills.forEach(skill => {
        const skillId = skill.name.replace(/\s+/g, '_').replace(/'/g, '');
        const abilityUsed = skillScaling[skill.name] || skill.ability;
        const modifier = abilityModifiers[abilityUsed] || 0;
        const isProficient = document.getElementById(`prof_${skillId}`).checked;
        const hasMastery = document.getElementById(`mastery_${skillId}`).checked;
        
        let bonus = modifier;
        if (hasMastery) {
            bonus += profBonus * 2;
        } else if (isProficient) {
            bonus += profBonus;
        }
        
        const skillDisplay = document.getElementById(`skill_${skillId}`);
        skillDisplay.textContent = bonus >= 0 ? `+${bonus}` : `${bonus}`;
    });
    
    updatePassivePerception();
    updateInitiative();
}

function updatePassivePerception() {
    const perceptionId = 'Percezione'.replace(/\s+/g, '_');
    const skillModText = document.getElementById(`skill_${perceptionId}`).textContent;
    const skillMod = parseInt(skillModText) || 0;
    const passive = 10 + skillMod;
    document.getElementById('passivePerception').textContent = passive;
}

function updateInitiative() {
    const dexMod = abilityModifiers['DES'] || 0;
    const initiative = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
    document.getElementById('initiative').textContent = initiative;
}

function updateAllCalculations() {
    abilities.forEach(ability => updateModifier(ability));
    updateSaves();
    updateSkills();
}

// ==================== WEAPONS ====================
function initializeWeapons() {
    const container = document.getElementById('weaponsContainer');
    for (let i = 0; i < 8; i++) {
        const row = document.createElement('div');
        row.className = 'weapon-row';
        row.innerHTML = `
            <input type="text" class="form-control form-control-sm" placeholder="Arma" style="flex: 2;">
            <input type="text" class="form-control form-control-sm" placeholder="+0" style="flex: 1;">
            <input type="text" class="form-control form-control-sm" placeholder="1d6" style="flex: 1.5;">
        `;
        container.appendChild(row);
    }
}

// ==================== EQUIPMENT ====================
function initializeEquipment() {
    addEquipmentItem();
}

function addEquipmentItem() {
    const container = document.getElementById('equipmentContainer');
    const row = document.createElement('div');
    row.className = 'equipment-row';
    row.innerHTML = `
        <input type="text" class="form-control form-control-sm" placeholder="Oggetto">
        <input type="number" class="form-control form-control-sm" placeholder="1" style="width: 60px;">
        <input type="text" class="form-control form-control-sm" placeholder="Note">
        <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(row);
}

// ==================== SPELLS ====================
function initializeSpells() {
    // Cantrips
    const cantripsContainer = document.getElementById('cantripsContainer');
    for (let i = 0; i < 8; i++) {
        const entry = document.createElement('div');
        entry.className = 'cantrip-entry';
        entry.innerHTML = `<input type="text" class="form-control form-control-sm" placeholder="Trucchetto ${i + 1}">`;
        cantripsContainer.appendChild(entry);
    }
    
    // Spell Levels
    const spellLevelsContainer = document.getElementById('spellLevelsContainer');
    for (let level = 1; level <= 9; level++) {
        const card = document.createElement('div');
        card.className = 'card mb-2';
        card.innerHTML = `
            <div class="card-header">
                INCANTESIMI DI ${level}° LIVELLO
            </div>
            <div class="card-body p-2" id="spellLevel${level}Container">
            </div>
        `;
        spellLevelsContainer.appendChild(card);
        
        // Add 10 spell entries per level
        const levelContainer = document.getElementById(`spellLevel${level}Container`);
        for (let i = 0; i < 10; i++) {
            const entry = document.createElement('div');
            entry.className = 'spell-entry';
            entry.innerHTML = `
                <input type="text" class="form-control form-control-sm" placeholder="Incantesimo">
                <label class="form-check-label small">Prep:</label>
                <input type="checkbox" class="form-check-input">
            `;
            levelContainer.appendChild(entry);
        }
    }
    
    // Spell Slots
    const slotsContainer = document.getElementById('spellSlotsContainer');
    for (let level = 1; level <= 9; level++) {
        const row = document.createElement('div');
        row.className = 'spell-slot-row';
        row.innerHTML = `
            <span class="spell-slot-label">Livello ${level}</span>
            <div class="spell-slot-inputs">
                <input type="number" class="form-control form-control-sm" id="slotAvail${level}" value="0" min="0">
                <span>/</span>
                <input type="number" class="form-control form-control-sm" id="slotMax${level}" value="0" min="0">
            </div>
        `;
        slotsContainer.appendChild(row);
    }
}

// ==================== SCALING ====================
function initializeScaling() {
    const container = document.getElementById('scalingContainer');
    skills.forEach(skill => {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3';
        col.innerHTML = `
            <div class="scaling-skill-card">
                <label>${skill.name}</label>
                <select class="form-select form-select-sm" id="scaling_${skill.name.replace(/\s+/g, '_').replace(/'/g, '')}">
                    ${abilities.map(ab => `<option value="${ab}" ${ab === skill.ability ? 'selected' : ''}>${ab}</option>`).join('')}
                </select>
            </div>
        `;
        container.appendChild(col);
        
        // Add event listener
        const select = col.querySelector('select');
        select.addEventListener('change', function() {
            skillScaling[skill.name] = this.value;
            updateSkillLabel(skill.name);
            updateSkills();
        });
    });
}

function updateSkillLabel(skillName) {
    const skillId = skillName.replace(/\s+/g, '_').replace(/'/g, '');
    const skillRow = document.querySelector(`#skill_${skillId}`).closest('.skill-row');
    const newAbility = skillScaling[skillName];
    skillRow.querySelector('.skill-name').textContent = `${skillName} (${newAbility})`;
}

// ==================== DM SECTION ====================
function initializeDMAbilities() {
    const container = document.getElementById('dmAbilitiesContainer');
    abilities.forEach(ability => {
        const col = document.createElement('div');
        col.className = 'col-4';
        col.innerHTML = `
            <div class="dm-ability-box">
                <label>${ability}</label>
                <input type="number" class="form-control form-control-sm" id="dm_ability_${ability}" value="10" min="1" max="30">
                <div class="stat-display" id="dm_mod_${ability}">+0</div>
            </div>
        `;
        container.appendChild(col);
        
        // Add event listener
        document.getElementById(`dm_ability_${ability}`).addEventListener('input', function() {
            updateDMModifier(ability);
        });
    });
}

function updateDMModifier(ability) {
    const score = parseInt(document.getElementById(`dm_ability_${ability}`).value) || 10;
    const modifier = Math.floor((score - 10) / 2);
    const modDisplay = document.getElementById(`dm_mod_${ability}`);
    modDisplay.textContent = modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

// ==================== DICE ROLLING ====================
function rollDice() {
    const command = document.getElementById('diceCommand').value.trim();
    if (!command) return;
    
    try {
        const result = interpretDiceCommand(command);
        logDiceResult(`${command}: ${result}`);
        document.getElementById('diceCommand').value = '';
    } catch (error) {
        alert('Errore nel comando dado: ' + error.message);
    }
}

function quickRoll(command) {
    document.getElementById('diceCommand').value = command;
    rollDice();
}

function interpretDiceCommand(command) {
    // Pattern: XdY+Z or dY+Z or X dY (space = separate rolls)
    const pattern = /^(\d+)?\s*d\s*(\d+)\s*([+-]\s*\d+)?$/i;
    const match = command.toLowerCase().replace(/\s+/g, ' ').match(pattern);
    
    if (!match) {
        throw new Error('Formato non valido. Usa: XdY[+-]Z (es: 2d6+4)');
    }
    
    const numDice = parseInt(match[1]) || 1;
    const diceType = parseInt(match[2]);
    const modifierStr = match[3];
    const hasSpace = command.includes(' d');
    
    if (diceType < 2 || diceType > 1000) {
        throw new Error('Tipo di dado non valido');
    }
    
    if (numDice < 1 || numDice > 100) {
        throw new Error('Numero di dadi non valido');
    }
    
    const modifier = modifierStr ? parseInt(modifierStr.replace(/\s+/g, '')) : 0;
    
    // Roll dice
    const rolls = [];
    for (let i = 0; i < numDice; i++) {
        rolls.push(Math.floor(Math.random() * diceType) + 1);
    }
    
    const sum = rolls.reduce((a, b) => a + b, 0);
    const total = sum + modifier;
    
    // Format result
    if (hasSpace) {
        // Show individual rolls
        const rollsStr = rolls.join('], [');
        if (modifier !== 0) {
            return `[${rollsStr}] = ${sum} ${modifier >= 0 ? '+' : ''}${modifier} = ${total}`;
        }
        return `[${rollsStr}] = ${sum}`;
    } else {
        // Show sum
        if (numDice === 1) {
            if (modifier !== 0) {
                return `${total} (${rolls[0]} ${modifier >= 0 ? '+' : ''}${modifier})`;
            }
            return `${total}`;
        }
        const rollsStr = rolls.join(' + ');
        if (modifier !== 0) {
            return `${total} (${rollsStr} = ${sum} ${modifier >= 0 ? '+' : ''}${modifier})`;
        }
        return `${total} (${rollsStr})`;
    }
}

function logDiceResult(text) {
    const log = document.getElementById('diceLog');
    log.textContent += text + '\n';
    log.scrollTop = log.scrollHeight;
}

function showDiceHelp() {
    alert(`Sintassi comandi dadi:
xdy -> Somma tutti i risultati (es: 2d6 = due dadi a 6 facce sommati)
x dy -> Visualizza risultati singolarmente (es: 3 d8 = tre dadi a 8 facce elencati)
dy -> Singolo dado (es: d20 = un dado a 20 facce)
Puoi aggiungere modificatori: 2d6+4, d20-2, ecc.`);
}

// ==================== CHARACTER IMAGES ====================
function loadCharImage() {
    document.getElementById('charImageInput').click();
}

function handleCharImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            characterImages.push(e.target.result);
            if (characterImages.length === 1) {
                currentImageIndex = 0;
                displayCharImage();
            }
            updateCharImageCounter();
        };
        reader.readAsDataURL(file);
    }
}

function displayCharImage() {
    const container = document.getElementById('charImageContainer');
    if (characterImages.length === 0) {
        container.innerHTML = '<p class="text-muted small">Nessuna immagine</p>';
        return;
    }
    
    container.innerHTML = `<img src="${characterImages[currentImageIndex]}" alt="Character Image">`;
    updateCharImageCounter();
}

function clearCharImage() {
    if (characterImages.length > 0 && currentImageIndex >= 0) {
        characterImages.splice(currentImageIndex, 1);
        if (currentImageIndex >= characterImages.length && currentImageIndex > 0) {
            currentImageIndex--;
        }
        displayCharImage();
    }
}

function prevCharImage() {
    if (characterImages.length > 1) {
        currentImageIndex = (currentImageIndex - 1 + characterImages.length) % characterImages.length;
        displayCharImage();
    }
}

function nextCharImage() {
    if (characterImages.length > 1) {
        currentImageIndex = (currentImageIndex + 1) % characterImages.length;
        displayCharImage();
    }
}

function updateCharImageCounter() {
    const counter = document.getElementById('imageCounter');
    counter.textContent = `(${characterImages.length > 0 ? currentImageIndex + 1 : 0}/${characterImages.length})`;
}

// ==================== DM IMAGES ====================
function addDMImage() {
    document.getElementById('dmImageInput').click();
}

function handleDMImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            dmImages.push(e.target.result);
            if (dmImages.length === 1) {
                currentDMImageIndex = 0;
                displayDMImage();
            }
            updateDMImageCounter();
        };
        reader.readAsDataURL(file);
    }
}

function displayDMImage() {
    const container = document.getElementById('dmImageContainer');
    if (dmImages.length === 0) {
        container.innerHTML = '<p class="text-muted small">Nessuna immagine</p>';
        return;
    }
    
    container.innerHTML = `<img src="${dmImages[currentDMImageIndex]}" alt="DM Image">`;
    updateDMImageCounter();
}

function removeDMImage() {
    if (dmImages.length > 0 && currentDMImageIndex >= 0) {
        dmImages.splice(currentDMImageIndex, 1);
        if (currentDMImageIndex >= dmImages.length && currentDMImageIndex > 0) {
            currentDMImageIndex--;
        }
        displayDMImage();
    }
}

function prevDMImage() {
    if (dmImages.length > 1) {
        currentDMImageIndex = (currentDMImageIndex - 1 + dmImages.length) % dmImages.length;
        displayDMImage();
    }
}

function nextDMImage() {
    if (dmImages.length > 1) {
        currentDMImageIndex = (currentDMImageIndex + 1) % dmImages.length;
        displayDMImage();
    }
}

function updateDMImageCounter() {
    const counter = document.getElementById('dmImageCounter');
    counter.textContent = `(${dmImages.length > 0 ? currentDMImageIndex + 1 : 0}/${dmImages.length})`;
}

// ==================== SAVE/LOAD DATA ====================
function saveData() {
    const data = getAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.character_info.name || 'personaggio'}_dnd_sheet.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function saveDataAs() {
    saveData();
}

function loadData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                setAllData(data);
                alert('Dati caricati con successo!');
            } catch (error) {
                alert('Errore nel caricamento dei dati: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetSheet() {
    if (confirm('Sei sicuro di voler resettare tutta la scheda? Questa azione non puo\' essere annullata.')) {
        location.reload();
    }
}

function getAllData() {
    const data = {
        character_info: {
            name: document.getElementById('charName').value,
            class: document.getElementById('charClass').value,
            race: document.getElementById('charRace').value,
            level: document.getElementById('charLevel').value,
            age: document.getElementById('charAge').value,
            height: document.getElementById('charHeight').value,
            skin_tone: document.getElementById('charSkin').value,
            background: document.getElementById('charBackground').value,
            alignment: document.getElementById('charAlignment').value,
            xp: document.getElementById('charXP').value,
            weight: document.getElementById('charWeight').value,
            hair: document.getElementById('charHair').value,
            eyes: document.getElementById('charEyes').value
        },
        abilities: {
            scores: {},
            saving_throws: {}
        },
        combat: {
            speed: document.getElementById('speed').value,
            proficiency: document.getElementById('profBonus').value,
            hp_current: document.getElementById('hpCurrent').value,
            hp_max: document.getElementById('hpMax').value,
            hp_temp: document.getElementById('hpTemp').value,
            ac: document.getElementById('ac').value,
            temp_ac: document.getElementById('tempAC').value,
            hit_dice: {
                current: document.getElementById('diceCurrent').value,
                max: document.getElementById('diceMax').value,
                type: document.getElementById('diceType').value
            },
            death_saves: {
                success: Array.from(document.querySelectorAll('.death-save-success')).map(cb => cb.checked ? 1 : 0),
                failure: Array.from(document.querySelectorAll('.death-save-failure')).map(cb => cb.checked ? 1 : 0)
            },
            weapons: []
        },
        skills: {},
        equipment: [],
        coins: {
            MR: document.getElementById('coinMR').value,
            MA: document.getElementById('coinMA').value,
            ME: document.getElementById('coinME').value,
            MO: document.getElementById('coinMO').value,
            MP: document.getElementById('coinMP').value
        },
        spells: {
            spellcasting: {
                ability: document.getElementById('spellAbility').value,
                save_dc: document.getElementById('spellSaveDC').value,
                attack_bonus: document.getElementById('spellAttackBonus').value,
                spells_known: document.getElementById('spellsKnown').value,
                spells_prepared: document.getElementById('spellsPrepared').value
            },
            cantrips: {
                known: document.getElementById('cantripsKnown').value,
                list: []
            },
            slots: [],
            spells: []
        },
        text_areas: {
            features_traits: document.getElementById('featuresTraits').value,
            player_notes: document.getElementById('playerNotes').value
        },
        scaling: skillScaling,
        dm_data: {
            notes: document.getElementById('dmNotes').value,
            stats: {
                hp: document.getElementById('dmHP').value,
                ac: document.getElementById('dmAC').value,
                initiative: document.getElementById('dmInitiative').value,
                proficiency: document.getElementById('dmProf').value,
                abilities: {}
            },
            images: dmImages
        },
        images: characterImages
    };
    
    // Abilities
    abilities.forEach(ab => {
        data.abilities.scores[ab] = document.getElementById(`ability_${ab}`).value;
        data.abilities.saving_throws[ab] = document.getElementById(`save_prof_${ab}`).checked ? 1 : 0;
    });
    
    // Skills
    skills.forEach(skill => {
        const skillId = skill.name.replace(/\s+/g, '_').replace(/'/g, '');
        data.skills[skill.name] = {
            proficient: document.getElementById(`prof_${skillId}`).checked ? 1 : 0,
            expertise: document.getElementById(`mastery_${skillId}`).checked ? 1 : 0
        };
    });
    
    // Weapons
    document.querySelectorAll('#weaponsContainer .weapon-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs[0].value || inputs[1].value || inputs[2].value) {
            data.combat.weapons.push({
                name: inputs[0].value,
                bonus: inputs[1].value,
                damage: inputs[2].value
            });
        }
    });
    
    // Equipment
    document.querySelectorAll('#equipmentContainer .equipment-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs[0].value || inputs[1].value || inputs[2].value) {
            data.equipment.push({
                item: inputs[0].value,
                quantity: inputs[1].value,
                usage: inputs[2].value
            });
        }
    });
    
    // Cantrips
    document.querySelectorAll('#cantripsContainer input').forEach(input => {
        data.spells.cantrips.list.push(input.value);
    });
    
    // Spell Slots
    for (let i = 1; i <= 9; i++) {
        data.spells.slots.push({
            level: i,
            available: document.getElementById(`slotAvail${i}`).value,
            max: document.getElementById(`slotMax${i}`).value
        });
    }
    
    // Spells by level
    for (let level = 1; level <= 9; level++) {
        const levelSpells = [];
        document.querySelectorAll(`#spellLevel${level}Container .spell-entry`).forEach(entry => {
            const inputs = entry.querySelectorAll('input');
            if (inputs[0].value) {
                levelSpells.push({
                    name: inputs[0].value,
                    prepared: inputs[1].checked ? 1 : 0
                });
            }
        });
        data.spells.spells.push({ spells: levelSpells });
    }
    
    // DM Abilities
    abilities.forEach(ab => {
        data.dm_data.stats.abilities[ab] = document.getElementById(`dm_ability_${ab}`).value;
    });
    
    return data;
}

function setAllData(data) {
    // Character Info
    if (data.character_info) {
        const fieldMapping = {
            name: 'charName',
            class: 'charClass',
            race: 'charRace',
            level: 'charLevel',
            age: 'charAge',
            height: 'charHeight',
            skin_tone: 'charSkin',
            background: 'charBackground',
            alignment: 'charAlignment',
            xp: 'charXP',
            weight: 'charWeight',
            hair: 'charHair',
            eyes: 'charEyes'
        };
        
        Object.keys(data.character_info).forEach(key => {
            const elementId = fieldMapping[key];
            const element = document.getElementById(elementId);
            if (element) element.value = data.character_info[key] || '';
        });
    }
    
    // Abilities
    if (data.abilities) {
        abilities.forEach(ab => {
            if (data.abilities.scores && data.abilities.scores[ab]) {
                document.getElementById(`ability_${ab}`).value = data.abilities.scores[ab];
            }
            if (data.abilities.saving_throws) {
                document.getElementById(`save_prof_${ab}`).checked = data.abilities.saving_throws[ab] === 1;
            }
        });
    }
    
    // Combat
    if (data.combat) {
        if (data.combat.speed) document.getElementById('speed').value = data.combat.speed;
        if (data.combat.proficiency) document.getElementById('profBonus').value = data.combat.proficiency;
        if (data.combat.hp_current !== undefined) document.getElementById('hpCurrent').value = data.combat.hp_current;
        if (data.combat.hp_max !== undefined) document.getElementById('hpMax').value = data.combat.hp_max;
        if (data.combat.hp_temp !== undefined) document.getElementById('hpTemp').value = data.combat.hp_temp;
        if (data.combat.ac !== undefined) document.getElementById('ac').value = data.combat.ac;
        if (data.combat.temp_ac !== undefined) document.getElementById('tempAC').value = data.combat.temp_ac;
        
        if (data.combat.hit_dice) {
            document.getElementById('diceCurrent').value = data.combat.hit_dice.current || 1;
            document.getElementById('diceMax').value = data.combat.hit_dice.max || 1;
            document.getElementById('diceType').value = data.combat.hit_dice.type || 'd8';
        }
        
        if (data.combat.death_saves) {
            const successBoxes = document.querySelectorAll('.death-save-success');
            const failureBoxes = document.querySelectorAll('.death-save-failure');
            data.combat.death_saves.success.forEach((val, i) => {
                if (successBoxes[i]) successBoxes[i].checked = val === 1;
            });
            data.combat.death_saves.failure.forEach((val, i) => {
                if (failureBoxes[i]) failureBoxes[i].checked = val === 1;
            });
        }
        
        if (data.combat.weapons) {
            const weaponRows = document.querySelectorAll('#weaponsContainer .weapon-row');
            data.combat.weapons.forEach((weapon, i) => {
                if (weaponRows[i]) {
                    const inputs = weaponRows[i].querySelectorAll('input');
                    inputs[0].value = weapon.name || '';
                    inputs[1].value = weapon.bonus || '';
                    inputs[2].value = weapon.damage || '';
                }
            });
        }
    }
    
    // Skills
    if (data.skills) {
        skills.forEach(skill => {
            const skillId = skill.name.replace(/\s+/g, '_').replace(/'/g, '');
            if (data.skills[skill.name]) {
                document.getElementById(`prof_${skillId}`).checked = data.skills[skill.name].proficient === 1;
                document.getElementById(`mastery_${skillId}`).checked = data.skills[skill.name].expertise === 1;
            }
        });
    }
    
    // Equipment
    if (data.equipment && data.equipment.length > 0) {
        const container = document.getElementById('equipmentContainer');
        container.innerHTML = '';
        data.equipment.forEach(item => {
            addEquipmentItem();
            const row = container.lastElementChild;
            const inputs = row.querySelectorAll('input');
            inputs[0].value = item.item || '';
            inputs[1].value = item.quantity || '';
            inputs[2].value = item.usage || '';
        });
    }
    
    // Coins
    if (data.coins) {
        Object.keys(data.coins).forEach(coin => {
            const element = document.getElementById('coin' + coin);
            if (element) element.value = data.coins[coin] || 0;
        });
    }
    
    // Spells
    if (data.spells) {
        if (data.spells.spellcasting) {
            document.getElementById('spellAbility').value = data.spells.spellcasting.ability || '';
            document.getElementById('spellSaveDC').value = data.spells.spellcasting.save_dc || '+0';
            document.getElementById('spellAttackBonus').value = data.spells.spellcasting.attack_bonus || '+0';
            document.getElementById('spellsKnown').value = data.spells.spellcasting.spells_known || 0;
            document.getElementById('spellsPrepared').value = data.spells.spellcasting.spells_prepared || 0;
        }
        
        if (data.spells.cantrips) {
            if (data.spells.cantrips.known !== undefined) {
                document.getElementById('cantripsKnown').value = data.spells.cantrips.known;
            }
            if (data.spells.cantrips.list) {
                const cantrips = document.querySelectorAll('#cantripsContainer input');
                data.spells.cantrips.list.forEach((cantrip, i) => {
                    if (cantrips[i]) cantrips[i].value = cantrip || '';
                });
            }
        }
        
        if (data.spells.slots) {
            data.spells.slots.forEach(slot => {
                document.getElementById(`slotAvail${slot.level}`).value = slot.available || 0;
                document.getElementById(`slotMax${slot.level}`).value = slot.max || 0;
            });
        }
        
        if (data.spells.spells) {
            data.spells.spells.forEach((levelData, level) => {
                const entries = document.querySelectorAll(`#spellLevel${level + 1}Container .spell-entry`);
                if (levelData.spells) {
                    levelData.spells.forEach((spell, i) => {
                        if (entries[i]) {
                            const inputs = entries[i].querySelectorAll('input');
                            inputs[0].value = spell.name || '';
                            inputs[1].checked = spell.prepared === 1;
                        }
                    });
                }
            });
        }
    }
    
    // Text Areas
    if (data.text_areas) {
        if (data.text_areas.features_traits) {
            document.getElementById('featuresTraits').value = data.text_areas.features_traits;
        }
        if (data.text_areas.player_notes) {
            document.getElementById('playerNotes').value = data.text_areas.player_notes;
        }
    }
    
    // Scaling
    if (data.scaling) {
        Object.keys(data.scaling).forEach(skillName => {
            const skillId = skillName.replace(/\s+/g, '_').replace(/'/g, '');
            const select = document.getElementById(`scaling_${skillId}`);
            if (select) {
                select.value = data.scaling[skillName];
                skillScaling[skillName] = data.scaling[skillName];
                updateSkillLabel(skillName);
            }
        });
    }
    
    // DM Data
    if (data.dm_data) {
        if (data.dm_data.notes) {
            document.getElementById('dmNotes').value = data.dm_data.notes;
        }
        
        if (data.dm_data.stats) {
            if (data.dm_data.stats.hp !== undefined) document.getElementById('dmHP').value = data.dm_data.stats.hp;
            if (data.dm_data.stats.ac !== undefined) document.getElementById('dmAC').value = data.dm_data.stats.ac;
            if (data.dm_data.stats.initiative) document.getElementById('dmInitiative').value = data.dm_data.stats.initiative;
            if (data.dm_data.stats.proficiency) document.getElementById('dmProf').value = data.dm_data.stats.proficiency;
            
            if (data.dm_data.stats.abilities) {
                abilities.forEach(ab => {
                    const element = document.getElementById(`dm_ability_${ab}`);
                    if (element && data.dm_data.stats.abilities[ab]) {
                        element.value = data.dm_data.stats.abilities[ab];
                        updateDMModifier(ab);
                    }
                });
            }
        }
        
        if (data.dm_data.images) {
            dmImages = data.dm_data.images;
            currentDMImageIndex = 0;
            displayDMImage();
        }
    }
    
    // Images
    if (data.images) {
        characterImages = data.images;
        currentImageIndex = 0;
        displayCharImage();
    }
    
    // Update all calculations
    updateAllCalculations();
}
