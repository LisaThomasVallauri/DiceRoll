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
    updateDMInitiative();
    updateSpellcastingStats();
}

// ==================== WEAPONS ====================
function initializeWeapons() {
    const container = document.getElementById('weaponsContainer');
    for (let i = 0; i < 8; i++) {
        const row = document.createElement('div');
        row.className = 'weapon-row';
        row.innerHTML = `
            <input type="text" class="form-control form-control-sm" placeholder="Arma">
            <input type="text" class="form-control form-control-sm text-center" placeholder="+0">
            <input type="text" class="form-control form-control-sm" placeholder="1d6">
        `;
        container.appendChild(row);
    }
}

// ==================== EQUIPMENT ====================
function initializeEquipment() {
    const container = document.getElementById('equipmentContainer');
    // Create 150 fixed equipment slots
    for (let i = 0; i < 150; i++) {
        const row = document.createElement('div');
        row.className = 'equipment-row';
        row.innerHTML = `
            <input type="text" class="form-control form-control-sm" placeholder="Oggetto ${i + 1}">
            <input type="number" class="form-control form-control-sm text-center" placeholder="1">
            <input type="text" class="form-control form-control-sm" placeholder="Note">
        `;
        container.appendChild(row);
    }
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
        // Listen for changes to auto-count cantrips
        entry.querySelector('input').addEventListener('input', updateSpellCounts);
    }
    
    // Spell Levels - each as a hidden panel, only level 1 visible by default
    const spellLevelsContainer = document.getElementById('spellLevelsContainer');
    for (let level = 1; level <= 9; level++) {
        const panel = document.createElement('div');
        panel.className = `spell-level-panel${level === 1 ? ' active' : ''}`;
        panel.id = `spellPanel${level}`;
        
        const innerContainer = document.createElement('div');
        innerContainer.id = `spellLevel${level}Container`;
        
        // Add 10 spell entries per level
        for (let i = 0; i < 10; i++) {
            const entry = document.createElement('div');
            entry.className = 'spell-entry';
            entry.innerHTML = `
                <input type="text" class="form-control form-control-sm" placeholder="Incantesimo">
                <label class="form-check-label small">Prep:</label>
                <input type="checkbox" class="form-check-input">
            `;
            innerContainer.appendChild(entry);
            // Listen for changes to auto-count spells and prepared
            entry.querySelector('input[type="text"]').addEventListener('input', updateSpellCounts);
            entry.querySelector('input[type="checkbox"]').addEventListener('change', updateSpellCounts);
        }
        
        panel.appendChild(innerContainer);
        spellLevelsContainer.appendChild(panel);
    }
    
    // Spell level TAB buttons listener (replaces dropdown)
    document.querySelectorAll('.spell-level-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const selectedLevel = this.dataset.level;
            document.querySelectorAll('.spell-level-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.spell-level-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`spellPanel${selectedLevel}`).classList.add('active');
        });
    });
    
    // Spell Slots
    const slotsContainer = document.getElementById('spellSlotsContainer');
    for (let level = 1; level <= 9; level++) {
        const row = document.createElement('div');
        row.className = 'spell-slot-row';
        row.innerHTML = `
            <span class="spell-slot-level-badge">${level}</span>
            <span class="spell-slot-label">Lv.${level}</span>
            <div class="spell-slot-inputs">
                <input type="number" class="form-control form-control-sm" id="slotAvail${level}" value="0" min="0">
                <span>/</span>
                <input type="number" class="form-control form-control-sm" id="slotMax${level}" value="0" min="0">
            </div>
        `;
        slotsContainer.appendChild(row);
    }
    
    // Spellcasting ability selector listener
    document.getElementById('spellAbility').addEventListener('change', updateSpellcastingStats);
}

// Update spellcasting CD and bonus attack based on selected ability
function updateSpellcastingStats() {
    const selectedAbility = document.getElementById('spellAbility').value;
    const profBonus = parseInt(document.getElementById('profBonus').value) || 2;
    
    if (selectedAbility === '-') {
        document.getElementById('spellSaveDC').textContent = '-';
        document.getElementById('spellAttackBonus').textContent = '-';
        return;
    }
    
    const abilityMod = abilityModifiers[selectedAbility] || 0;
    
    // CD = 8 + modificatore statistica + competenza
    const saveDC = 8 + abilityMod + profBonus;
    document.getElementById('spellSaveDC').textContent = saveDC;
    
    // Bonus attacco = modificatore statistica + competenza
    const attackBonus = abilityMod + profBonus;
    document.getElementById('spellAttackBonus').textContent = attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`;
}

// Auto-count cantrips, spells and prepared spells
function updateSpellCounts() {
    // Count cantrips: textboxes with text inside
    let cantripCount = 0;
    document.querySelectorAll('#cantripsContainer .cantrip-entry input[type="text"]').forEach(input => {
        if (input.value.trim() !== '') cantripCount++;
    });
    document.getElementById('cantripsKnown').textContent = cantripCount;
    
    // Count spells: textboxes with text across all levels
    let spellCount = 0;
    let preparedCount = 0;
    for (let level = 1; level <= 9; level++) {
        document.querySelectorAll(`#spellLevel${level}Container .spell-entry`).forEach(entry => {
            const textInput = entry.querySelector('input[type="text"]');
            const checkbox = entry.querySelector('input[type="checkbox"]');
            if (textInput && textInput.value.trim() !== '') {
                spellCount++;
            }
            if (checkbox && checkbox.checked) {
                preparedCount++;
            }
        });
    }
    document.getElementById('spellsKnown').textContent = spellCount;
    document.getElementById('spellsPrepared').textContent = preparedCount;
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
            updateDMInitiative();
        });
    });
}

function updateDMModifier(ability) {
    const score = parseInt(document.getElementById(`dm_ability_${ability}`).value) || 10;
    const modifier = Math.floor((score - 10) / 2);
    const modDisplay = document.getElementById(`dm_mod_${ability}`);
    modDisplay.textContent = modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

function updateDMInitiative() {
    const dexScore = parseInt(document.getElementById('dm_ability_DES').value) || 10;
    const dexMod = Math.floor((dexScore - 10) / 2);
    const initiative = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
    document.getElementById('dmInitiative').textContent = initiative;
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

// ==================== LOADING OVERLAY ====================
function showLoading(text) {
    const overlay = document.getElementById('loadingOverlay');
    const spinnerText = overlay.querySelector('.spinner-text');
    spinnerText.textContent = text || 'Caricamento...';
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
}

// ==================== SAVE/LOAD DATA ====================
let currentFileHandle = null; // Stores the file handle from File System Access API

async function saveData() {
    // Remember the currently active tab so we don't reset it
    const activeTabBtn = document.querySelector('#mainTabs .nav-link.active');
    
    showLoading('Salvataggio in corso...');
    
    const data = getAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    
    // If we have a file handle from a previous save/load, write directly to it
    if (currentFileHandle && typeof currentFileHandle.createWritable === 'function') {
        try {
            const writable = await currentFileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            
            // Flash a brief "saved" indicator
            await delay(400);
            hideLoading();
            showSaveIndicator();
            return; // Saved silently without re-downloading
        } catch (err) {
            // Permission denied or handle stale - fall through to saveAs
        }
    }
    
    hideLoading();
    // No handle or failed - behave like Save As
    await saveDataAs();
    
    // Restore active tab if it changed
    if (activeTabBtn) {
        activeTabBtn.click();
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showSaveIndicator() {
    // Brief visual feedback that save completed
    const saveBtn = document.querySelector('.btn-success');
    if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Salvato!';
        saveBtn.style.background = '#2d8a2d';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 1200);
    }
}

async function saveDataAs() {
    showLoading('Salvataggio in corso...');
    
    const data = getAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const defaultName = `${data.character_info.name || 'personaggio'}_dnd_sheet.json`;
    
    await delay(400);
    hideLoading();
    
    // Try File System Access API (Chrome/Edge)
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: defaultName,
                types: [{
                    description: 'JSON File',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            showLoading('Scrittura file...');
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            currentFileHandle = handle;
            await delay(300);
            hideLoading();
            return;
        } catch (err) {
            hideLoading();
            if (err.name === 'AbortError') return;
        }
    }
    
    // Fallback: classic download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
}

async function loadData() {
    // Try File System Access API first (Chrome/Edge)
    if (window.showOpenFilePicker) {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON File',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            showLoading('Caricamento scheda...');
            const file = await handle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);
            setAllData(data);
            currentFileHandle = handle;
            await delay(500);
            hideLoading();
            return;
        } catch (err) {
            hideLoading();
            if (err.name === 'AbortError') return;
        }
    }
    
    // Fallback: classic file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        showLoading('Caricamento scheda...');
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const data = JSON.parse(event.target.result);
                setAllData(data);
                await delay(500);
                hideLoading();
            } catch (error) {
                hideLoading();
                alert('Errore nel caricamento dei dati: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetSheet() {
    if (confirm('Sei sicuro di voler resettare tutta la scheda? Questa azione non puo\' essere annullata.')) {
        showLoading('Reset in corso...');
        setTimeout(() => {
            location.reload();
        }, 600);
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
                ability: document.getElementById('spellAbility').value
            },
            cantrips: {
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
    
    // Equipment - Save all 150 slots
    document.querySelectorAll('#equipmentContainer .equipment-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        data.equipment.push({
            item: inputs[0].value || '',
            quantity: inputs[1].value || '',
            usage: inputs[2].value || ''
        });
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
            if (element && data.character_info[key] !== undefined) {
                element.value = data.character_info[key];
            }
        });
    }
    
    // Abilities
    if (data.abilities) {
        abilities.forEach(ab => {
            if (data.abilities.scores && data.abilities.scores[ab] !== undefined) {
                document.getElementById(`ability_${ab}`).value = data.abilities.scores[ab];
            }
            if (data.abilities.saving_throws && data.abilities.saving_throws[ab] !== undefined) {
                document.getElementById(`save_prof_${ab}`).checked = data.abilities.saving_throws[ab] === 1;
            }
        });
    }
    
    // Combat
    if (data.combat) {
        if (data.combat.speed !== undefined) document.getElementById('speed').value = data.combat.speed;
        if (data.combat.proficiency !== undefined) document.getElementById('profBonus').value = data.combat.proficiency;
        if (data.combat.hp_current !== undefined) document.getElementById('hpCurrent').value = data.combat.hp_current;
        if (data.combat.hp_max !== undefined) document.getElementById('hpMax').value = data.combat.hp_max;
        if (data.combat.hp_temp !== undefined) document.getElementById('hpTemp').value = data.combat.hp_temp;
        if (data.combat.ac !== undefined) document.getElementById('ac').value = data.combat.ac;
        if (data.combat.temp_ac !== undefined) document.getElementById('tempAC').value = data.combat.temp_ac;
        
        if (data.combat.hit_dice) {
            if (data.combat.hit_dice.current !== undefined) document.getElementById('diceCurrent').value = data.combat.hit_dice.current;
            if (data.combat.hit_dice.max !== undefined) document.getElementById('diceMax').value = data.combat.hit_dice.max;
            if (data.combat.hit_dice.type !== undefined) {
                const diceTypeEl = document.getElementById('diceType');
                // Match the value to the select options
                const val = data.combat.hit_dice.type.toLowerCase().replace(/\s/g, '');
                const options = diceTypeEl.options;
                for (let i = 0; i < options.length; i++) {
                    if (options[i].value === val) {
                        diceTypeEl.selectedIndex = i;
                        break;
                    }
                }
            }
        }
        
        if (data.combat.death_saves) {
            const successBoxes = document.querySelectorAll('.death-save-success');
            const failureBoxes = document.querySelectorAll('.death-save-failure');
            if (data.combat.death_saves.success) {
                data.combat.death_saves.success.forEach((val, i) => {
                    if (successBoxes[i]) successBoxes[i].checked = val === 1;
                });
            }
            if (data.combat.death_saves.failure) {
                data.combat.death_saves.failure.forEach((val, i) => {
                    if (failureBoxes[i]) failureBoxes[i].checked = val === 1;
                });
            }
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
                if (data.skills[skill.name].proficient !== undefined) {
                    document.getElementById(`prof_${skillId}`).checked = data.skills[skill.name].proficient === 1;
                }
                if (data.skills[skill.name].expertise !== undefined) {
                    document.getElementById(`mastery_${skillId}`).checked = data.skills[skill.name].expertise === 1;
                }
            }
        });
    }
    
    // Equipment - Load all 150 slots
    if (data.equipment) {
        const equipmentRows = document.querySelectorAll('#equipmentContainer .equipment-row');
        data.equipment.forEach((item, i) => {
            if (equipmentRows[i]) {
                const inputs = equipmentRows[i].querySelectorAll('input');
                inputs[0].value = item.item || '';
                inputs[1].value = item.quantity || '';
                inputs[2].value = item.usage || '';
            }
        });
    }
    
    // Coins
    if (data.coins) {
        Object.keys(data.coins).forEach(coin => {
            const element = document.getElementById('coin' + coin);
            if (element && data.coins[coin] !== undefined) {
                element.value = data.coins[coin];
            }
        });
    }
    
    // Spells
    if (data.spells) {
        if (data.spells.spellcasting) {
            if (data.spells.spellcasting.ability !== undefined) {
                document.getElementById('spellAbility').value = data.spells.spellcasting.ability;
            }
        }
        
        if (data.spells.cantrips) {
            if (data.spells.cantrips.list) {
                const cantrips = document.querySelectorAll('#cantripsContainer input');
                data.spells.cantrips.list.forEach((cantrip, i) => {
                    if (cantrips[i]) cantrips[i].value = cantrip || '';
                });
            }
        }
        
        if (data.spells.slots) {
            data.spells.slots.forEach(slot => {
                if (slot.level !== undefined && slot.available !== undefined) {
                    document.getElementById(`slotAvail${slot.level}`).value = slot.available;
                }
                if (slot.level !== undefined && slot.max !== undefined) {
                    document.getElementById(`slotMax${slot.level}`).value = slot.max;
                }
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
        
        // Recalculate auto-counts and spellcasting stats after loading
        updateSpellCounts();
        updateSpellcastingStats();
    }
    
    // Text Areas
    if (data.text_areas) {
        if (data.text_areas.features_traits !== undefined) {
            document.getElementById('featuresTraits').value = data.text_areas.features_traits;
        }
        if (data.text_areas.player_notes !== undefined) {
            document.getElementById('playerNotes').value = data.text_areas.player_notes;
        }
    }
    
    // Scaling
    if (data.scaling) {
        Object.keys(data.scaling).forEach(skillName => {
            const skillId = skillName.replace(/\s+/g, '_').replace(/'/g, '');
            const select = document.getElementById(`scaling_${skillId}`);
            if (select && data.scaling[skillName] !== undefined) {
                select.value = data.scaling[skillName];
                skillScaling[skillName] = data.scaling[skillName];
                updateSkillLabel(skillName);
            }
        });
    }
    
    // DM Data
    if (data.dm_data) {
        if (data.dm_data.notes !== undefined) {
            document.getElementById('dmNotes').value = data.dm_data.notes;
        }
        
        if (data.dm_data.stats) {
            if (data.dm_data.stats.hp !== undefined) document.getElementById('dmHP').value = data.dm_data.stats.hp;
            if (data.dm_data.stats.ac !== undefined) document.getElementById('dmAC').value = data.dm_data.stats.ac;
            if (data.dm_data.stats.proficiency !== undefined) document.getElementById('dmProf').value = data.dm_data.stats.proficiency;
            
            if (data.dm_data.stats.abilities) {
                abilities.forEach(ab => {
                    const element = document.getElementById(`dm_ability_${ab}`);
                    if (element && data.dm_data.stats.abilities[ab] !== undefined) {
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

// ==================== PARTY CHAT ====================
function initializePartyChat() {
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatImageBtn = document.getElementById('chatImageBtn');
    const chatImageInput = document.getElementById('chatImageInput');
    const chatDiceBtn = document.getElementById('chatDiceBtn');
    const passwordToggle = document.getElementById('partyPasswordToggle');
    
    // Send message on Enter
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Send button
    chatSendBtn.addEventListener('click', sendChatMessage);
    
    // Image button
    chatImageBtn.addEventListener('click', function() {
        chatImageInput.click();
    });
    
    // Image upload handler
    chatImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(ev) {
            addChatMessage(getNickname(), null, ev.target.result, true);
        };
        reader.readAsDataURL(file);
        this.value = ''; // Reset so same file can be selected again
    });
    
    // Dice popup toggle
    chatDiceBtn.addEventListener('click', function() {
        const popup = document.getElementById('chatDicePopup');
        if (!popup) {
            createDicePopup();
        } else {
            popup.classList.toggle('visible');
        }
    });
    
    // Password toggle
    passwordToggle.addEventListener('click', function() {
        const pwInput = document.getElementById('partyPassword');
        if (pwInput.type === 'password') {
            pwInput.type = 'text';
        } else {
            pwInput.type = 'password';
        }
    });
    
    // Close dice popup on outside click
    document.addEventListener('click', function(e) {
        const popup = document.getElementById('chatDicePopup');
        if (popup && !popup.contains(e.target) && e.target !== chatDiceBtn && !chatDiceBtn.contains(e.target)) {
            popup.classList.remove('visible');
        }
    });
}

function getNickname() {
    return document.getElementById('partyNickname').value.trim() || 'Anonimo';
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const text = chatInput.value.trim();
    if (!text) return;
    
    // Check for dice command
    if (text.startsWith('/roll ') || text.startsWith('/r ')) {
        const diceCmd = text.replace(/^\/(roll|r)\s+/, '');
        try {
            const result = interpretDiceCommand(diceCmd);
            addChatMessage(getNickname(), null, null, true, { command: diceCmd, result: result });
        } catch (err) {
            addChatMessage('Sistema', 'Comando dado non valido: ' + err.message, null, false);
        }
    } else {
        addChatMessage(getNickname(), text, null, true);
    }
    
    chatInput.value = '';
}

function addChatMessage(author, text, imageData, isSelf, diceData) {
    const messagesArea = document.getElementById('chatMessages');
    
    // Remove welcome message if present
    const welcomeMsg = messagesArea.querySelector('.chat-welcome-msg');
    if (welcomeMsg) welcomeMsg.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${isSelf ? 'self' : 'other'}`;
    
    let content = `<div class="chat-msg-author">${escapeHtml(author)}</div>`;
    
    if (text) {
        content += `<p class="chat-msg-text">${escapeHtml(text)}</p>`;
    }
    
    if (imageData) {
        content += `<img src="${imageData}" class="chat-msg-image" alt="Immagine condivisa" onclick="window.open(this.src, '_blank')">`;
    }
    
    if (diceData) {
        content += `
            <div class="chat-msg-dice">
                <span class="chat-dice-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
                </span>
                <div>
                    <div class="chat-dice-result">${escapeHtml(diceData.result)}</div>
                    <div class="chat-dice-detail">${escapeHtml(diceData.command)}</div>
                </div>
            </div>
        `;
    }
    
    msgDiv.innerHTML = content;
    messagesArea.appendChild(msgDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function createDicePopup() {
    const chatInputArea = document.querySelector('.chat-input-area');
    const popup = document.createElement('div');
    popup.id = 'chatDicePopup';
    popup.className = 'chat-dice-popup visible';
    
    const diceTypes = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100', '2d6'];
    
    popup.innerHTML = `
        <div class="chat-dice-popup-title">Tira Dadi</div>
        <div class="chat-dice-popup-grid">
            ${diceTypes.map(d => `<button class="chat-dice-popup-btn" data-dice="${d}">${d}</button>`).join('')}
        </div>
    `;
    
    chatInputArea.style.position = 'relative';
    chatInputArea.appendChild(popup);
    
    popup.querySelectorAll('.chat-dice-popup-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const dice = this.dataset.dice;
            try {
                const result = interpretDiceCommand(dice);
                addChatMessage(getNickname(), null, null, true, { command: dice, result: result });
            } catch (err) {
                // ignore
            }
            popup.classList.remove('visible');
        });
    });
}

// Initialize party chat on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initializePartyChat();
});
