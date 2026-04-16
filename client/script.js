// D&D Character Sheet JavaScript

// ==================== GLOBAL VARIABLES ====================

const abilitiesITA = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];
let abilities = ['FOR', 'DES', 'COS', 'INT', 'SAG', 'CAR'];
const skills = [
    {name: 'Acrobazia', ability: 'DES'},
    {name: 'Addestrare Animali', ability: 'SAG'},
    {name: 'Arcano', ability: 'INT'},
    {name: 'Atletica', ability: 'FOR'},
    {name: "Furtivita'", ability: 'DES'},
    {name: 'Indagare', ability: 'INT'},
    {name: 'Inganno', ability: 'CAR'},
    {name: 'Intimidire', ability: 'CAR'},
    {name: 'Intrattenere', ability: 'CAR'},
    {name: 'Intuizione', ability: 'SAG'},
    {name: 'Medicina', ability: 'SAG'},
    {name: 'Natura', ability: 'INT'},
    {name: 'Percezione', ability: 'SAG'},
    {name: 'Persuasione', ability: 'CAR'},
    {name: "Rapidita' di mano", ability: 'DES'},
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

// Autosave
let autoSaveInterval = null;
let autoSaveEnabled = true;
const AUTO_SAVE_INTERVAL_MS = 60000; // 60 seconds

// Permission keepalive — scrive sul file ogni 2 minuti per evitare
// che il browser revochi il permesso di scrittura durante l'inattività
let permissionKeepaliveInterval = null;
const KEEPALIVE_INTERVAL_MS = 2 * 60 * 1000; // 2 minuti

// Maps variables
let mapsData = [];
let currentMapIndex = -1;
let mapZoom = 1.0;
let mapMode = 'view';
let selectedMarkerType = 'main-quest';
let editingMarkerId = null;

const MARKER_COLORS = {
    'main-quest':     '#e8b04b',
    'personal-quest': '#7c6fe0',
    'sub-quest':      '#5cb85c',
    'shop':           '#4a9eff',
    'boss':           '#d9534f',
    'item':           '#5cc8c8'
};

const MARKER_LABELS = {
    'main-quest':     'Main Quest',
    'personal-quest': 'Personal Quest',
    'sub-quest':      'Sub Quest',
    'shop':           'Shop',
    'boss':           'Boss',
    'item':           'Item'
};

// Party chat variables
let partySocket = null;
let currentRoomPassword = null;
let partyConnectionStatus = 'offline';
let isInRoom = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let pendingAction = null;
let heartbeatInterval = null;

// Translation state
let currentLang = 'ita';
let translations = {};

// File handle for save/load
let currentFileHandle = null;

// ==================== UTILITY FUNCTIONS ====================

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== LOADING OVERLAY ====================

function showLoading(text) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.querySelector('.spinner-text').textContent = text || t('loading.text');
    overlay.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// ==================== BURGER MENU ====================

function toggleBurgerMenu(menuId, btnId) {
    const menu = document.getElementById(menuId);
    const isOpen = menu.classList.contains('open');
    closeBurgerMenus();
    if (!isOpen) {
        menu.classList.add('open');
        document.getElementById(btnId).setAttribute('aria-expanded', 'true');
    }
}

function closeBurgerMenus() {
    document.querySelectorAll('.burger-dropdown').forEach(m => m.classList.remove('open'));
    document.querySelectorAll('.burger-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

function selectBurgerTab(el) {
    // Activate Bootstrap tab
    const target = el.getAttribute('data-target');
    const tabEl = document.querySelector(`[data-bs-target="${target}"]`);
    if (tabEl) {
        const bsTab = new bootstrap.Tab(tabEl);
        bsTab.show();
    }
    // Update active state in burger menu
    document.querySelectorAll('#burgerTabsMenu .burger-menu-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    // Update label
    const label = el.getAttribute('data-label') || el.textContent.trim().substring(0, 10);
    const labelEl = document.getElementById('burgerActiveTab');
    if (labelEl) labelEl.textContent = label;
    // Close menu
    closeBurgerMenus();
}

// Close burger menus when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.burger-tabs-wrapper') && !e.target.closest('.burger-actions-wrapper')) {
        closeBurgerMenus();
    }
});

// ==================== RESTORE BACKUP MODAL ====================
let _pendingBackupData = null;

function openRestoreBackupModal(backupJson) {
    _pendingBackupData = backupJson;
    document.getElementById('restoreBackupModal').classList.add('visible');
}

function closeRestoreBackupModal(event) {
    if (!event || event.target === document.getElementById('restoreBackupModal')) {
        document.getElementById('restoreBackupModal').classList.remove('visible');
        _pendingBackupData = null;
    }
}

function confirmRestoreBackup() {
    if (_pendingBackupData) {
        try {
            const data = JSON.parse(_pendingBackupData);
            setAllData(data);
        } catch(e) {
            console.error('Errore nel ripristino del backup:', e);
        }
        _pendingBackupData = null;
    }
    document.getElementById('restoreBackupModal').classList.remove('visible');
}

// ==================== SETTINGS MODAL ====================

function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('visible');
}

function closeSettingsModal(event) {
    if (!event || event.target === document.getElementById('settingsModal')) {
        document.getElementById('settingsModal').classList.remove('visible');
    }
}

function toggleTheme(checkbox) {
    const isDayMode = checkbox.checked;
    document.body.classList.toggle('day-mode', isDayMode);
    document.getElementById('themeLabel').textContent = isDayMode ? t('settings.dayMode') : t('settings.nightMode');
    try { localStorage.setItem('dnd_theme', isDayMode ? 'day' : 'night'); } catch(e) {}
}

async function toggleLang(checkbox) {
    const newLang = checkbox.checked ? 'eng' : 'ita';
    await loadTranslations(newLang);
    document.getElementById('langLabel').textContent = newLang === 'ita' ? t('settings.italiano') : t('settings.english');
    applyTranslations();
}

// ==================== GENERIC ALERT / CONFIRM MODALS ====================

function showAlertModal(message) {
    const existing = document.getElementById('genericAlertModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'genericAlertModal';
    overlay.className = 'settings-modal-overlay';
    overlay.innerHTML = `
        <div class="settings-modal-box load-confirm-box" onclick="event.stopPropagation()">
            <div class="settings-modal-header">
                <span class="settings-modal-title">⚠️</span>
                <button class="settings-modal-close" id="genericAlertClose">&times;</button>
            </div>
            <div class="load-confirm-body">
                <p class="load-confirm-msg" style="white-space:pre-wrap;">${escapeHtml(message)}</p>
            </div>
            <div class="load-confirm-footer">
                <button class="btn btn-primary btn-sm load-confirm-btn" id="genericAlertOk">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const close = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 200);
    };
    document.getElementById('genericAlertOk').addEventListener('click', close);
    document.getElementById('genericAlertClose').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function showConfirmModal(message, onConfirm, onCancel) {
    const existing = document.getElementById('genericConfirmModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'genericConfirmModal';
    overlay.className = 'settings-modal-overlay';
    overlay.innerHTML = `
        <div class="settings-modal-box load-confirm-box" onclick="event.stopPropagation()">
            <div class="settings-modal-header">
                <span class="settings-modal-title">⚠️</span>
                <button class="settings-modal-close" id="genericConfirmClose">&times;</button>
            </div>
            <div class="load-confirm-body">
                <p class="load-confirm-msg" style="white-space:pre-wrap;">${escapeHtml(message)}</p>
            </div>
            <div class="load-confirm-footer">
                <button class="btn btn-danger btn-sm load-confirm-btn" id="genericConfirmYes">✅ OK</button>
                <button class="btn btn-secondary btn-sm load-confirm-btn" id="genericConfirmNo">✖ ${currentLang === 'ita' ? 'Annulla' : 'Cancel'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const close = (confirmed) => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 200);
        if (confirmed && typeof onConfirm === 'function') onConfirm();
        else if (!confirmed && typeof onCancel === 'function') onCancel();
    };
    document.getElementById('genericConfirmYes').addEventListener('click', () => close(true));
    document.getElementById('genericConfirmNo').addEventListener('click', () => close(false));
    document.getElementById('genericConfirmClose').addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
}

// ==================== ABILITIES ====================

function initializeAbilities() {
    const container = document.getElementById('abilitiesContainer');
    abilitiesITA.forEach(ability => {
        const row = document.createElement('div');
        row.className = 'ability-row';
        row.innerHTML = `
            <span class="ability-label">${ability}</span>
            <input type="number" class="form-control form-control-sm ability-score" 
                   id="ability_${ability}" value="10" min="1" max="30">
            <span class="ability-modifier" id="mod_${ability}">+0</span>
        `;
        container.appendChild(row);
        document.getElementById(`ability_${ability}`).addEventListener('input', function() {
            updateModifier(ability);
            updateAllCalculations();
        });
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
    abilitiesITA.forEach(ability => {
        const row = document.createElement('div');
        row.className = 'save-row';
        row.innerHTML = `
            <span class="save-label">${ability}</span>
            <input type="checkbox" class="form-check-input save-prof" id="save_prof_${ability}">
            <span class="save-modifier" id="save_${ability}">+0</span>
        `;
        container.appendChild(row);
        document.getElementById(`save_prof_${ability}`).addEventListener('change', updateSaves);
    });
}

function updateSaves() {
    const profBonus = parseInt(document.getElementById('profBonus').value) || 2;
    abilitiesITA.forEach(ability => {
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
        const skillId = skill.name.replace(/\s+/g, '_').replace(/'/g, '');
        const row = document.createElement('div');
        row.className = 'skill-row';
        // Store Italian keys in dataset for language-agnostic translation later
        row.innerHTML = `
            <span class="skill-name" data-ita-key="${skill.name}" data-ability-key="${skill.ability}">${t('skills.' + skill.name)} (${t('abilities.' + skill.ability)})</span>
            <span class="skill-mod" id="skill_${skillId}">+0</span>
            <input type="checkbox" class="skill-checkbox" id="prof_${skillId}">
            <input type="checkbox" class="skill-checkbox" id="mastery_${skillId}">
        `;
        container.appendChild(row);
        const profId = `prof_${skillId}`;
        const masteryId = `mastery_${skillId}`;
        document.getElementById(profId).addEventListener('change', function() {
            if (this.checked) document.getElementById(masteryId).checked = false;
            updateSkills();
        });
        document.getElementById(masteryId).addEventListener('change', function() {
            if (this.checked) document.getElementById(profId).checked = false;
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
        if (hasMastery) bonus += profBonus * 2;
        else if (isProficient) bonus += profBonus;
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
    document.getElementById('passivePerception').textContent = 10 + skillMod;
}

function updateInitiative() {
    const dexMod = abilityModifiers['DES'] || 0;
    document.getElementById('initiative').textContent = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
}

function updateAllCalculations() {
    abilitiesITA.forEach(ability => updateModifier(ability));
    updateSaves();
    updateSkills();
    updateDMInitiative();
    updateSpellcastingStats();
    updateHPBar();
}

function updateHPBar() {
    const hpCurrentInput = document.getElementById('hpCurrent');
    const hpMaxInput = document.getElementById('hpMax');
    const hpTempInput = document.getElementById('hpTemp');
    let current = parseInt(hpCurrentInput?.value) || 0;
    let max     = parseInt(hpMaxInput?.value)     || 0;
    let temp    = parseInt(hpTempInput?.value)    || 0;
    
    // Vincolo: nessun valore può essere negativo
    if (current < 0) {
        current = 0;
        hpCurrentInput.value = 0;
    }
    if (max < 0) {
        max = 0;
        hpMaxInput.value = 0;
    }
    if (temp < 0) {
        temp = 0;
        hpTempInput.value = 0;
    }
    
    // Blocco: gli HP attuali non devono superare i massimi
    if (current > max && max > 0) {
        current = max;
        hpCurrentInput.value = current;
    }
    
    const fill    = document.getElementById('hpBarFill');
    const tempFill = document.getElementById('hpBarTempFill');
    const label   = document.getElementById('hpBarLabel');
    const tempLabel = document.getElementById('hpBarTempLabel');
    const tempRow = document.getElementById('tempHPRow');
    if (!fill || !label || !tempFill) return;

    // Barra HP attuali
    const currentPct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
    fill.style.width = currentPct + '%';
    label.textContent = `${current} / ${max}`;
    
    // Barra HP temporanei - mostra solo se temp > 0
    if (temp > 0) {
        tempRow.style.display = 'flex';
        const tempPct = max > 0 ? Math.max(0, (temp / max) * 100) : 0;
        tempFill.style.width = tempPct + '%';
        tempLabel.textContent = `+${temp}`;
    } else {
        tempRow.style.display = 'none';
    }

    fill.classList.remove('hp-medium', 'hp-low', 'hp-dead');
    if (max <= 0 || current <= 0) {
        fill.classList.add('hp-dead');
    } else if (currentPct <= 25) {
        fill.classList.add('hp-low');
    } else if (currentPct <= 50) {
        fill.classList.add('hp-medium');
    }
}


// ==================== WEAPONS ====================

function initializeWeapons() {
    const container = document.getElementById('weaponsContainer');
    for (let i = 0; i < 8; i++) {
        const row = document.createElement('div');
        row.className = 'weapon-row';
        row.innerHTML = `
            <input type="text" class="form-control form-control-sm" placeholder="${t('combat.weaponName')}">
            <input type="text" class="form-control form-control-sm text-center" placeholder="+0">
            <input type="text" class="form-control form-control-sm" placeholder="1d6">
        `;
        container.appendChild(row);
    }
}

// ==================== EQUIPMENT ====================

function initializeEquipment() {
    const container = document.getElementById('equipmentContainer');
    for (let i = 0; i < 150; i++) {
        const row = document.createElement('div');
        row.className = 'equipment-row';
        row.innerHTML = `
            <input type="text" class="form-control form-control-sm" placeholder="${t('equip.itemPlaceholder')} ${i + 1}">
            <input type="number" class="form-control form-control-sm text-center" placeholder="1">
            <input type="text" class="form-control form-control-sm" placeholder="${t('equip.notesPlaceholder')}">
        `;
        container.appendChild(row);
    }
}

// ==================== SPELLS ====================

function initializeSpells() {
    const cantripsContainer = document.getElementById('cantripsContainer');
    for (let i = 0; i < 8; i++) {
        const entry = document.createElement('div');
        entry.className = 'cantrip-entry';
        entry.innerHTML = `<input type="text" class="form-control form-control-sm" placeholder="${t('spells.cantripPlaceholder')} ${i + 1}">`;
        cantripsContainer.appendChild(entry);
        entry.querySelector('input').addEventListener('input', updateSpellCounts);
    }

    const spellLevelsContainer = document.getElementById('spellLevelsContainer');
    for (let level = 1; level <= 9; level++) {
        const panel = document.createElement('div');
        panel.className = `spell-level-panel${level === 1 ? ' active' : ''}`;
        panel.id = `spellPanel${level}`;
        const innerContainer = document.createElement('div');
        innerContainer.id = `spellLevel${level}Container`;
        for (let i = 0; i < 10; i++) {
            const entry = document.createElement('div');
            entry.className = 'spell-entry';
            entry.innerHTML = `
                <input type="text" class="form-control form-control-sm" placeholder="${t('spells.spellPlaceholder')}">
                <label class="form-check-label small">${t('spells.prepLabel')}</label>
                <input type="checkbox" class="form-check-input">
            `;
            innerContainer.appendChild(entry);
            entry.querySelector('input[type="text"]').addEventListener('input', updateSpellCounts);
            entry.querySelector('input[type="checkbox"]').addEventListener('change', updateSpellCounts);
        }
        panel.appendChild(innerContainer);
        spellLevelsContainer.appendChild(panel);
    }

    document.querySelectorAll('.spell-level-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const selectedLevel = this.dataset.level;
            document.querySelectorAll('.spell-level-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.spell-level-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`spellPanel${selectedLevel}`).classList.add('active');
        });
    });

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

    document.getElementById('spellAbility').addEventListener('change', updateSpellcastingStats);
}

function updateSpellcastingStats() {
    const selectedAbility = document.getElementById('spellAbility').value;
    const profBonus = parseInt(document.getElementById('profBonus').value) || 2;
    if (selectedAbility === '-') {
        document.getElementById('spellSaveDC').textContent = '-';
        document.getElementById('spellAttackBonus').textContent = '-';
        return;
    }
    const abilityMod = abilityModifiers[selectedAbility] || 0;
    const saveDC = 8 + abilityMod + profBonus;
    document.getElementById('spellSaveDC').textContent = saveDC;
    const attackBonus = abilityMod + profBonus;
    document.getElementById('spellAttackBonus').textContent = attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`;
}

function updateSpellCounts() {
    let cantripCount = 0;
    document.querySelectorAll('#cantripsContainer .cantrip-entry input[type="text"]').forEach(input => {
        if (input.value.trim() !== '') cantripCount++;
    });
    document.getElementById('cantripsKnown').textContent = cantripCount;
    let spellCount = 0;
    let preparedCount = 0;
    for (let level = 1; level <= 9; level++) {
        document.querySelectorAll(`#spellLevel${level}Container .spell-entry`).forEach(entry => {
            const textInput = entry.querySelector('input[type="text"]');
            const checkbox = entry.querySelector('input[type="checkbox"]');
            if (textInput && textInput.value.trim() !== '') spellCount++;
            if (checkbox && checkbox.checked) preparedCount++;
        });
    }
    document.getElementById('spellsKnown').textContent = spellCount;
    document.getElementById('spellsPrepared').textContent = preparedCount;
}

// ==================== SCALING ====================

function initializeScaling() {
    const container = document.getElementById('scalingContainer');
    if (!container) return;

    skills.forEach(skill => {
        // Create layout column
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3';

        // Create inner card
        const card = document.createElement('div');
        card.className = 'scaling-skill-card';

        // Skill name label (translated)
        const label = document.createElement('label');
        label.setAttribute('data-ita-key', skill.name);
        label.textContent = t(`skills.${skill.name}`);
        card.appendChild(label);

        // Create select
        const select = document.createElement('select');
        select.className = 'form-select form-select-sm';
        select.id = `scaling_${skill.name.replace(/\s+/g, '_').replace(/'/g, '')}`;

        // Populate options with translated ability names
        abilitiesITA.forEach(ab => {
            const option = document.createElement('option');
            option.value = ab;
            option.textContent = t(`abilities.${ab}`);
            if (ab === skill.ability) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Event to update scaling and skill label
        select.addEventListener('change', function() {
            skillScaling[skill.name] = this.value;
            updateSkillLabel(skill.name);
            updateSkills();
        });

        card.appendChild(select);
        col.appendChild(card);
        container.appendChild(col);
    });
}

function updateSkillLabel(skillName) {
    const skillId = skillName.replace(/\s+/g, '_').replace(/'/g, '');
    const skillRow = document.querySelector(`#skill_${skillId}`).closest('.skill-row');
    const newAbility = skillScaling[skillName];
    const translatedSkill = t(`skills.${skillName}`);
    const translatedAbility = t(`abilities.${newAbility}`);
    const displaySkill = (translatedSkill !== `skills.${skillName}`) ? translatedSkill : skillName;
    const displayAbility = (translatedAbility !== `abilities.${newAbility}`) ? translatedAbility : newAbility;
    skillRow.querySelector('.skill-name').textContent = `${displaySkill} (${displayAbility})`;
}

// ==================== DM SECTION ====================

function initializeDMAbilities() {
    const container = document.getElementById('dmAbilitiesContainer');
    abilitiesITA.forEach(ability => {
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
    document.getElementById('dmInitiative').textContent = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
}

// ==================== VISUAL EFFECTS ==================== 

/**
 * Creates floating particle effect at mouse position
 * @param {Event} event - Click event
 * @param {number} count - Number of particles to create
 */
function createParticleEffect(event, count = 8) {
    const x = event.clientX;
    const y = event.clientY;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle ' + ['small', 'medium', 'large'][Math.floor(Math.random() * 3)];
        
        const size = Math.random() * 12 + 4;
        const angle = (Math.PI * 2 * i) / count;
        const distance = Math.random() * 100 + 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance * 2;
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        document.body.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => particle.remove(), 3000);
    }
}

/**
 * Initialize ambient particle background effect
 */
function initializeAmbientParticles() {
    const container = document.createElement('div');
    container.className = 'ambient-particles';
    
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'ambient-particle';
        
        const size = Math.random() * 2 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 4 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        container.appendChild(particle);
    }
    
    document.body.insertBefore(container, document.body.firstChild);
}

/**
 * Apply particle effects only to dice buttons on click
 */
function applyParticleEffects() {
    // Add click handlers to all dice buttons
    const diceButtons = document.querySelectorAll('.chat-dice-popup-btn');
    diceButtons.forEach(btn => {
        if (!btn.dataset.particleApplied) {
            btn.dataset.particleApplied = 'true';
            btn.addEventListener('click', function(e) {
                createParticleEffect(e, Math.random() * 4 + 4);
            });
        }
    });
    
    // Watch for new dice buttons added dynamically
    const observer = new MutationObserver(() => {
        const newButtons = document.querySelectorAll('.chat-dice-popup-btn:not([data-particle-applied])');
        newButtons.forEach(btn => {
            btn.dataset.particleApplied = 'true';
            btn.addEventListener('click', function(e) {
                createParticleEffect(e, Math.random() * 4 + 4);
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Initialize all visual effects on page load
 */
function initializeVisualEffects() {
    // Create ambient particles background
    initializeAmbientParticles();
    
    // Apply particle effects to dice buttons
    applyParticleEffects();
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
        showAlertModal(t('dm.diceError') + error.message);
    }
}

function quickRoll(command) {
    document.getElementById('diceCommand').value = command;
    rollDice();
}

function interpretDiceCommand(command) {
    // Normalize: remove multiple spaces and convert to lowercase
    const normalized = command.toLowerCase().replace(/\s+/g, ' ').trim();

    // Determine mode: individual if there is a space between number and 'd'
    // e.g. "3 d4+2" -> individual; "3d4+2" -> sum
    const hasSpaceBeforeD = /\d+\s+d/.test(normalized);
    const individualMode = hasSpaceBeforeD;

    // Pattern to extract: [numDice]? d [diceType] [modifier]?
    // Supports optional spaces except for individual mode
    const pattern = /^(\d+)?\s*d\s*(\d+)\s*([+-]\s*\d+)?$/i;
    const match = normalized.replace(/\s+/g, ' ').match(pattern);

    if (!match) throw new Error(t('dm.diceFormatError'));

    let numDice = parseInt(match[1]) || 1;
    let diceType = parseInt(match[2]);
    let modifierStr = match[3] ? match[3].replace(/\s+/g, '') : null;
    let modifier = modifierStr ? parseInt(modifierStr) : 0;

    if (diceType < 2 || diceType > 1000) throw new Error('Invalid dice type');
    if (numDice < 1 || numDice > 100) throw new Error('Invalid number of dice');

    // Roll the dice
    const rolls = [];
    for (let i = 0; i < numDice; i++) {
        rolls.push(Math.floor(Math.random() * diceType) + 1);
    }

    if (individualMode) {
        // Individual mode: apply modifier to each die
        const modifiedRolls = rolls.map(r => r + modifier);
        const formattedRolls = modifiedRolls.join(', ');
        if (modifier !== 0) {
            return `${modifiedRolls.join(', ')} (dice: ${rolls.join(', ')} ${modifier >= 0 ? '+' : ''}${modifier})`;
        } else {
            return `${formattedRolls}`;
        }
    } else {
        // Sum mode: sum dice, then add modifier once
        const sum = rolls.reduce((a, b) => a + b, 0);
        const total = sum + modifier;
        const rollsStr = rolls.join(' + ');
        if (modifier !== 0) {
            return `${total} (${rollsStr} = ${sum} ${modifier >= 0 ? '+' : ''}${modifier})`;
        } else {
            return `${total} (${rollsStr})`;
        }
    }
}

function logDiceResult(text) {
    const log = document.getElementById('diceLog');
    log.textContent += text + '\n';
    log.scrollTop = log.scrollHeight;
}

function showDiceHelp() {
    showAlertModal(t('dm.diceHelpText'));
}

// ==================== CHARACTER IMAGES ====================

function loadCharImage() { document.getElementById('charImageInput').click(); }

function handleCharImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            characterImages.push(e.target.result);
            if (characterImages.length === 1) { currentImageIndex = 0; displayCharImage(); }
            updateCharImageCounter();
        };
        reader.readAsDataURL(file);
    }
}

function displayCharImage() {
    const container = document.getElementById('charImageContainer');
    if (characterImages.length === 0) { container.innerHTML = `<p class="text-muted small">${t('image.noImage')}</p>`; return; }
    container.innerHTML = `<img src="${characterImages[currentImageIndex]}" alt="Character Image">`;
    updateCharImageCounter();
}

function clearCharImage() {
    if (characterImages.length > 0 && currentImageIndex >= 0) {
        characterImages.splice(currentImageIndex, 1);
        if (currentImageIndex >= characterImages.length && currentImageIndex > 0) currentImageIndex--;
        displayCharImage();
    }
}

function prevCharImage() {
    if (characterImages.length > 1) { currentImageIndex = (currentImageIndex - 1 + characterImages.length) % characterImages.length; displayCharImage(); }
}

function nextCharImage() {
    if (characterImages.length > 1) { currentImageIndex = (currentImageIndex + 1) % characterImages.length; displayCharImage(); }
}

function updateCharImageCounter() {
    document.getElementById('imageCounter').textContent = `(${characterImages.length > 0 ? currentImageIndex + 1 : 0}/${characterImages.length})`;
}

// ==================== DM IMAGES ====================

function addDMImage() { document.getElementById('dmImageInput').click(); }

function handleDMImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            dmImages.push(e.target.result);
            if (dmImages.length === 1) { currentDMImageIndex = 0; displayDMImage(); }
            updateDMImageCounter();
        };
        reader.readAsDataURL(file);
    }
}

function displayDMImage() {
    const container = document.getElementById('dmImageContainer');
    if (dmImages.length === 0) { container.innerHTML = `<p class="text-muted small">${t('dm.noImage')}</p>`; return; }
    container.innerHTML = `<img src="${dmImages[currentDMImageIndex]}" alt="DM Image">`;
    updateDMImageCounter();
}

function removeDMImage() {
    if (dmImages.length > 0 && currentDMImageIndex >= 0) {
        dmImages.splice(currentDMImageIndex, 1);
        if (currentDMImageIndex >= dmImages.length && currentDMImageIndex > 0) currentDMImageIndex--;
        displayDMImage();
    }
}

function prevDMImage() {
    if (dmImages.length > 1) { currentDMImageIndex = (currentDMImageIndex - 1 + dmImages.length) % dmImages.length; displayDMImage(); }
}

function nextDMImage() {
    if (dmImages.length > 1) { currentDMImageIndex = (currentDMImageIndex + 1) % dmImages.length; displayDMImage(); }
}

function updateDMImageCounter() {
    document.getElementById('dmImageCounter').textContent = `(${dmImages.length > 0 ? currentDMImageIndex + 1 : 0}/${dmImages.length})`;
}

// ==================== SAVE/LOAD DATA ====================

async function writeDataToFileSilent(fileHandle, data) {
    if (!fileHandle || typeof fileHandle.createWritable !== 'function') return false;
    try {
        // Controlla il permesso senza mostrare popup (queryPermission, non requestPermission)
        if (typeof fileHandle.queryPermission === 'function') {
            const perm = await fileHandle.queryPermission({ mode: 'readwrite' });
            if (perm !== 'granted') return false;
        }
        const writable = await fileHandle.createWritable();
        const json = JSON.stringify(data, null, 2);
        await writable.write(json);
        await writable.close();
        return true;
    } catch (err) {
        console.warn('Silent write failed:', err);
        return false;
    }
}

async function saveData() {
    const activeTabBtn = document.querySelector('#mainTabs .nav-link.active');
    showLoading(t('loading.saving'));

    const data = getAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    if (currentFileHandle && typeof currentFileHandle.createWritable === 'function') {
        try {
            // Verifica/richiedi il permesso di scrittura prima di tentare
            let permission = await currentFileHandle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                permission = await currentFileHandle.requestPermission({ mode: 'readwrite' });
            }
            if (permission === 'granted') {
                const writable = await currentFileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                await delay(400);
                hideLoading();
                showSaveIndicator();
                if (activeTabBtn) activeTabBtn.click();
                return;
            } else {
                // Permesso negato: invalida l'handle e usa "salva con nome"
                console.warn('Write permission denied, falling back to saveAs.');
                currentFileHandle = null;
            }
        } catch (err) {
            console.warn('saveData write failed:', err);
            // Se l'handle non è più valido, azzeralo così il prossimo salvataggio
            // non tenta di nuovo con un handle rotto
            if (err.name !== 'AbortError') {
                currentFileHandle = null;
            }
        }
    }

    hideLoading();
    await saveDataAs();
    if (activeTabBtn) activeTabBtn.click();
}

async function saveDataAs() {
    showLoading(t('loading.saving'));

    const data = getAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const defaultName = `${data.character_info.name || 'character'}_dnd_sheet.json`;

    await delay(400);
    hideLoading();

    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: defaultName,
                types: [{
                    description: 'JSON File',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            showLoading(t('loading.writing'));
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            currentFileHandle = handle;
            startPermissionKeepalive();
            await delay(300);
            hideLoading();
            return;
        } catch (err) {
            hideLoading();
            if (err.name === 'AbortError') return;
        }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
}

function showSaveIndicator() {
    // Target save button specifically — avoid matching any generic .btn-success
    const saveBtn = document.querySelector('[onclick*="saveData"]') ||
                    Array.from(document.querySelectorAll('.btn-success')).find(b =>
                        b.textContent.includes(t('buttons.save')) || b.textContent.includes('Salva') || b.textContent.includes('Save')
                    );
    if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = t('buttons.saved');
        saveBtn.style.background = '#2d8a2d';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 1200);
    }
}

// Load confirm modal
function showLoadConfirmModal(charName) {
    return new Promise((resolve) => {
        const existing = document.getElementById('loadConfirmModal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'loadConfirmModal';
        overlay.className = 'settings-modal-overlay';
        overlay.innerHTML = `
            <div class="settings-modal-box load-confirm-box" onclick="event.stopPropagation()">
                <div class="settings-modal-header">
                    <span class="settings-modal-title">${t('alerts.loadModalTitle')}</span>
                    <button class="settings-modal-close" id="loadConfirmClose">&times;</button>
                </div>
                <div class="load-confirm-body">
                    <p class="load-confirm-msg"><strong>"${charName}"</strong><br>${t('alerts.loadModalMsg')}</p>
                </div>
                <div class="load-confirm-footer">
                    <button class="btn btn-success btn-sm load-confirm-btn" id="loadConfirmSave">${t('alerts.loadModalSave')}</button>
                    <button class="btn btn-info btn-sm load-confirm-btn" id="loadConfirmSkip">${t('alerts.loadModalSkip')}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('visible'));

        const cleanup = (result) => {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 200);
            resolve(result);
        };

        document.getElementById('loadConfirmSave').addEventListener('click', () => cleanup('save'));
        document.getElementById('loadConfirmSkip').addEventListener('click', () => cleanup('skip'));
        document.getElementById('loadConfirmClose').addEventListener('click', () => cleanup('cancel'));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup('cancel'); });
    });
}

async function loadData() {
    // --- Protect current data ---
    const currentData = getAllData();
    const hasCurrentData = currentData.character_info?.name?.trim();

    if (hasCurrentData) {
        const choice = await showLoadConfirmModal(hasCurrentData);

        if (choice === 'cancel') return;

        if (choice === 'save') {
            await saveData();
        }
        try {
            localStorage.setItem('dnd_preload_backup', JSON.stringify(currentData));
        } catch(e) {
            console.warn('Unable to save pre-load backup:', e);
        }
    }
    // --- End protection ---

    if (window.showOpenFilePicker) {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON File',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            showLoading(t('loading.loadingSheet'));
            const file = await handle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);
            setAllData(data);
            currentFileHandle = handle;
            startPermissionKeepalive();
            await delay(500);
            hideLoading();
            return;
        } catch (err) {
            hideLoading();
            if (err.name === 'AbortError') return;
            showAlertModal(t('alerts.loadError') + err.message);
            return;
        }
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        showLoading(t('loading.loadingSheet'));
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const data = JSON.parse(event.target.result);
                // Save current sheet as preload backup before overwriting
                try {
                    const current = getAllData();
                    if (current.character_info?.name?.trim()) {
                        localStorage.setItem('dnd_preload_backup', JSON.stringify(current));
                    }
                } catch(e) {}
                setAllData(data);
                // Since we have no file handle, keep localStorage in sync
                try { localStorage.setItem('dnd_autosave_backup', JSON.stringify(data)); } catch(e) {}
                await delay(500);
                hideLoading();
            } catch (error) {
                hideLoading();
                showAlertModal(t('alerts.loadError') + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetSheet() {
    showConfirmModal(t('alerts.resetConfirm'), function() {
        showLoading(t('loading.resetting'));
        setTimeout(() => { location.reload(); }, 600);
    });
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
        abilities: { scores: {}, saving_throws: {} },
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
            spellcasting: { ability: document.getElementById('spellAbility').value },
            cantrips: { list: [] },
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
        images: characterImages,
        maps_data: mapsData,
        chat_bg: (function() {
            const bg = document.getElementById('chatBgImage');
            if (!bg) return null;
            const style = bg.style.backgroundImage;
            if (!style || style === "url('./img/bgChat.png')" || style === 'url("./img/bgChat.png")') return null;
            // Estrai l'URL dal valore CSS
            const match = style.match(/url\(['"]?(data:[^'")\s]+)['"]?\)/);
            return match ? match[1] : null;
        })()
    };

    abilitiesITA.forEach(ab => {
        data.abilities.scores[ab] = document.getElementById(`ability_${ab}`).value;
        data.abilities.saving_throws[ab] = document.getElementById(`save_prof_${ab}`).checked ? 1 : 0;
    });

    skills.forEach(skill => {
        const skillId = skill.name.replace(/\s+/g, '_').replace(/'/g, '');
        data.skills[skill.name] = {
            proficient: document.getElementById(`prof_${skillId}`).checked ? 1 : 0,
            expertise: document.getElementById(`mastery_${skillId}`).checked ? 1 : 0
        };
    });

    document.querySelectorAll('#weaponsContainer .weapon-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs[0].value || inputs[1].value || inputs[2].value) {
            data.combat.weapons.push({ name: inputs[0].value, bonus: inputs[1].value, damage: inputs[2].value });
        }
    });

    document.querySelectorAll('#equipmentContainer .equipment-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        data.equipment.push({ item: inputs[0].value || '', quantity: inputs[1].value || '', usage: inputs[2].value || '' });
    });

    document.querySelectorAll('#cantripsContainer input').forEach(input => {
        data.spells.cantrips.list.push(input.value);
    });

    for (let i = 1; i <= 9; i++) {
        data.spells.slots.push({
            level: i,
            available: document.getElementById(`slotAvail${i}`).value,
            max: document.getElementById(`slotMax${i}`).value
        });
    }

    for (let level = 1; level <= 9; level++) {
        const levelSpells = [];
        document.querySelectorAll(`#spellLevel${level}Container .spell-entry`).forEach(entry => {
            const inputs = entry.querySelectorAll('input');
            if (inputs[0].value) levelSpells.push({ name: inputs[0].value, prepared: inputs[1].checked ? 1 : 0 });
        });
        data.spells.spells.push({ spells: levelSpells });
    }

    abilitiesITA.forEach(ab => {
        data.dm_data.stats.abilities[ab] = document.getElementById(`dm_ability_${ab}`).value;
    });

    return data;
}

function setAllData(data) {
    if (data.character_info) {
        const fieldMapping = {
            name: 'charName', class: 'charClass', race: 'charRace', level: 'charLevel',
            age: 'charAge', height: 'charHeight', skin_tone: 'charSkin', background: 'charBackground',
            alignment: 'charAlignment', xp: 'charXP', weight: 'charWeight', hair: 'charHair', eyes: 'charEyes'
        };
        Object.keys(data.character_info).forEach(key => {
            const el = document.getElementById(fieldMapping[key]);
            if (el && data.character_info[key] !== undefined) el.value = data.character_info[key];
        });
    }

    if (data.abilities) {
        abilitiesITA.forEach(ab => {
            if (data.abilities.scores && data.abilities.scores[ab] !== undefined)
                document.getElementById(`ability_${ab}`).value = data.abilities.scores[ab];
            if (data.abilities.saving_throws && data.abilities.saving_throws[ab] !== undefined)
                document.getElementById(`save_prof_${ab}`).checked = data.abilities.saving_throws[ab] === 1;
        });
    }

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
                const val = data.combat.hit_dice.type.toLowerCase().replace(/\s/g, '');
                for (let i = 0; i < diceTypeEl.options.length; i++) {
                    if (diceTypeEl.options[i].value === val) { diceTypeEl.selectedIndex = i; break; }
                }
            }
        }
        if (data.combat.death_saves) {
            const successBoxes = document.querySelectorAll('.death-save-success');
            const failureBoxes = document.querySelectorAll('.death-save-failure');
            if (data.combat.death_saves.success)
                data.combat.death_saves.success.forEach((val, i) => { if (successBoxes[i]) successBoxes[i].checked = val === 1; });
            if (data.combat.death_saves.failure)
                data.combat.death_saves.failure.forEach((val, i) => { if (failureBoxes[i]) failureBoxes[i].checked = val === 1; });
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

    if (data.skills) {
        skills.forEach(skill => {
            const skillId = skill.name.replace(/\s+/g, '_').replace(/'/g, '');
            if (data.skills[skill.name]) {
                if (data.skills[skill.name].proficient !== undefined)
                    document.getElementById(`prof_${skillId}`).checked = data.skills[skill.name].proficient === 1;
                if (data.skills[skill.name].expertise !== undefined)
                    document.getElementById(`mastery_${skillId}`).checked = data.skills[skill.name].expertise === 1;
            }
        });
    }

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

    if (data.coins) {
        Object.keys(data.coins).forEach(coin => {
            const el = document.getElementById('coin' + coin);
            if (el && data.coins[coin] !== undefined) el.value = data.coins[coin];
        });
    }

    if (data.spells) {
        if (data.spells.spellcasting && data.spells.spellcasting.ability !== undefined)
            document.getElementById('spellAbility').value = data.spells.spellcasting.ability;
        if (data.spells.cantrips && data.spells.cantrips.list) {
            const cantrips = document.querySelectorAll('#cantripsContainer input');
            data.spells.cantrips.list.forEach((cantrip, i) => { if (cantrips[i]) cantrips[i].value = cantrip || ''; });
        }
        if (data.spells.slots) {
            data.spells.slots.forEach(slot => {
                if (slot.level !== undefined && slot.available !== undefined)
                    document.getElementById(`slotAvail${slot.level}`).value = slot.available;
                if (slot.level !== undefined && slot.max !== undefined)
                    document.getElementById(`slotMax${slot.level}`).value = slot.max;
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
        updateSpellCounts();
        updateSpellcastingStats();
    }

    if (data.text_areas) {
        if (data.text_areas.features_traits !== undefined) document.getElementById('featuresTraits').value = data.text_areas.features_traits;
        if (data.text_areas.player_notes !== undefined) document.getElementById('playerNotes').value = data.text_areas.player_notes;
    }

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

    if (data.dm_data) {
        if (data.dm_data.notes !== undefined) document.getElementById('dmNotes').value = data.dm_data.notes;
        if (data.dm_data.stats) {
            if (data.dm_data.stats.hp !== undefined) document.getElementById('dmHP').value = data.dm_data.stats.hp;
            if (data.dm_data.stats.ac !== undefined) document.getElementById('dmAC').value = data.dm_data.stats.ac;
            if (data.dm_data.stats.proficiency !== undefined) document.getElementById('dmProf').value = data.dm_data.stats.proficiency;
            if (data.dm_data.stats.abilities) {
                abilitiesITA.forEach(ab => {
                    const el = document.getElementById(`dm_ability_${ab}`);
                    if (el && data.dm_data.stats.abilities[ab] !== undefined) {
                        el.value = data.dm_data.stats.abilities[ab];
                        updateDMModifier(ab);
                    }
                });
            }
        }
        if (data.dm_data.images) { dmImages = data.dm_data.images; currentDMImageIndex = 0; displayDMImage(); }
    }

    if (data.images) { characterImages = data.images; currentImageIndex = 0; displayCharImage(); }

    if (data.chat_bg) {
        const bg = document.getElementById('chatBgImage');
        if (bg) bg.style.backgroundImage = `url('${data.chat_bg}')`;
        try { localStorage.setItem('dnd_chat_bg', data.chat_bg); } catch(e) {}
    }

    if (data.maps_data) {
        mapsData = data.maps_data;
        currentMapIndex = mapsData.length > 0 ? 0 : -1;
        renderMapsList();
        if (currentMapIndex >= 0) displayActiveMap();
        updateMapsCounter();
    }

    updateAllCalculations();
}

// ==================== MAPS ====================

function initializeMaps() {
    const canvasWrapper = document.getElementById('mapsCanvasWrapper');
    canvasWrapper.addEventListener('click', function(e) {
        if (mapMode !== 'place') return;
        const activeMap = mapsData[currentMapIndex];
        if (!activeMap) return;

        const img = document.getElementById('activeMapImg');
        if (!img || !img.naturalWidth) return;

        const rect = img.getBoundingClientRect();
        const xPct = (e.clientX - rect.left) / rect.width;
        const yPct = (e.clientY - rect.top)  / rect.height;

        if (xPct < 0 || xPct > 1 || yPct < 0 || yPct > 1) return;

        const marker = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: selectedMarkerType,
            xPct: xPct,
            yPct: yPct,
            name: MARKER_LABELS[selectedMarkerType]
        };

        activeMap.markers.push(marker);
        renderMarkers();
        renderMarkersList();
    });

    if (window.ResizeObserver) {
        new ResizeObserver(function() {
            alignMarkersLayer();
        }).observe(canvasWrapper);
    }
}

function addMapImage() {
    document.getElementById('mapImageInput').click();
}

function handleMapImageUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const totalFiles = files.length;
    let loadedCount = 0;

    Array.from(files).forEach(function(file) {
        const reader = new FileReader();
        const fileName = file.name.replace(/\.[^.]+$/, '');
        reader.onload = function(e) {
            const newMap = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                name: fileName || ('Map ' + (mapsData.length + 1)),
                imageData: e.target.result,
                markers: []
            };
            mapsData.push(newMap);
            loadedCount++;
            if (loadedCount === totalFiles) {
                currentMapIndex = mapsData.length - 1;
                renderMapsList();
                updateMapsCounter();
                switchMapSubtab('view');
                displayActiveMap();
            }
        };
        reader.onerror = function() { loadedCount++; };
        reader.readAsDataURL(file);
    });

    event.target.value = '';
}

function deleteMap(index) {
    const confirmMsg = t('maps.confirmDeleteMap').replace('{name}', mapsData[index].name);
    showConfirmModal(confirmMsg, function() {
        mapsData.splice(index, 1);
        if (currentMapIndex >= mapsData.length) currentMapIndex = mapsData.length - 1;
        renderMapsList();
        if (currentMapIndex >= 0) displayActiveMap();
        else clearMapDisplay();
        updateMapsCounter();
    });
}

function selectMap(index) {
    currentMapIndex = index;
    renderMapsList();
    displayActiveMap();
}

// Zoom stubs (kept for compatibility)
function syncZoomSlider() {}
function applyMapZoom() {}
function mapZoomFromSlider() {}
function mapZoomSet() {}
function calcFitZoom() { return 1; }
function fitMapToContainer() {}
function mapZoomIn() {}
function mapZoomOut() {}
function mapZoomReset() {}

function alignMarkersLayer() {
    const img        = document.getElementById('activeMapImg');
    const layer      = document.getElementById('markersLayer');
    const container  = document.getElementById('mapsImgContainer');
    if (!img || !layer || !container || !img.naturalWidth) return;

    const imgRect  = img.getBoundingClientRect();
    const ctnrRect = container.getBoundingClientRect();

    layer.style.width  = imgRect.width  + 'px';
    layer.style.height = imgRect.height + 'px';
    layer.style.left   = (imgRect.left - ctnrRect.left) + 'px';
    layer.style.top    = (imgRect.top  - ctnrRect.top)  + 'px';
}

function displayActiveMap() {
    const map = mapsData[currentMapIndex];
    if (!map) { clearMapDisplay(); return; }

    const emptyState = document.getElementById('mapsEmptyState');
    const container  = document.getElementById('mapsImgContainer');
    const img        = document.getElementById('activeMapImg');

    emptyState.style.display = 'none';
    container.style.display  = 'flex';
    document.getElementById('activeMapName').textContent = map.name;

    const onReady = function() {
        alignMarkersLayer();
        renderMarkers();
    };

    if (img.src === map.imageData && img.complete && img.naturalWidth > 0) {
        onReady();
    } else {
        img.onload = onReady;
        img.src = map.imageData;
    }

    renderMarkersList();
}

function clearMapDisplay() {
    document.getElementById('mapsEmptyState').style.display = 'flex';
    document.getElementById('mapsImgContainer').style.display = 'none';
    const img = document.getElementById('activeMapImg');
    img.src = '';
    document.getElementById('activeMapName').textContent = t('maps.noMapSelected');
    document.getElementById('markersLayer').innerHTML = '';
    renderMarkersList();
}

function renderMapsList() {
    const container = document.getElementById('mapsListContainer');
    if (mapsData.length === 0) {
        container.innerHTML = `<p class="text-muted small text-center mt-3">${t('maps.noMapsLoaded')}</p>`;
        return;
    }
    container.innerHTML = '';
    mapsData.forEach((map, index) => {
        const item = document.createElement('div');
        item.className = `map-list-item${index === currentMapIndex ? ' active' : ''}`;
        item.setAttribute('draggable', 'true');
        item.dataset.index = index;
        item.innerHTML = `
            <span class="map-drag-handle" title="Drag to reorder">⠿</span>
            <img class="map-list-thumb" src="${map.imageData}" alt="${escapeHtml(map.name)}">
            <div class="map-list-info">
                <div class="map-list-name">${escapeHtml(map.name)}</div>
                <div class="map-list-meta">${map.markers.length} markers</div>
            </div>
            <button class="map-list-delete" onclick="event.stopPropagation(); deleteMap(${index})" title="${t('maps.delete')}">&times;</button>
        `;
        item.addEventListener('click', () => selectMap(index));

        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            this.classList.add('dragging');
        });
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            container.querySelectorAll('.map-list-item').forEach(el => el.classList.remove('drag-over'));
        });
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            container.querySelectorAll('.map-list-item').forEach(el => el.classList.remove('drag-over'));
            this.classList.add('drag-over');
        });
        item.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        item.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = parseInt(this.dataset.index);
            if (fromIndex === toIndex) return;
            const moved = mapsData.splice(fromIndex, 1)[0];
            mapsData.splice(toIndex, 0, moved);
            if (currentMapIndex === fromIndex) {
                currentMapIndex = toIndex;
            } else if (fromIndex < currentMapIndex && toIndex >= currentMapIndex) {
                currentMapIndex--;
            } else if (fromIndex > currentMapIndex && toIndex <= currentMapIndex) {
                currentMapIndex++;
            }
            renderMapsList();
        });

        container.appendChild(item);
    });
}

function updateMapsCounter() {
    document.getElementById('mapsCounter').textContent = `(${mapsData.length})`;
}

// ==================== MARKER RENDERING ====================

function renderMarkers() {
    const layer = document.getElementById('markersLayer');
    const img   = document.getElementById('activeMapImg');
    layer.innerHTML = '';

    const map = mapsData[currentMapIndex];
    if (!map || !img || !img.naturalWidth) return;

    map.markers.forEach(marker => {
        const el = document.createElement('div');
        el.className = 'map-marker';
        el.dataset.id   = marker.id;
        el.dataset.type = marker.type;

        el.style.left = (marker.xPct * 100) + '%';
        el.style.top  = (marker.yPct * 100) + '%';

        el.innerHTML = `
            <div class="map-marker-pin"></div>
            <div class="map-marker-label">${escapeHtml(marker.name)}</div>
        `;

        el.addEventListener('click', function(e) {
            e.stopPropagation();
            openMarkerModal(marker.id);
        });

        layer.appendChild(el);
    });
}

function repositionMarkers() {
    const map = mapsData[currentMapIndex];
    if (!map) return;
    map.markers.forEach(marker => {
        const el = document.querySelector(`.map-marker[data-id="${marker.id}"]`);
        if (el) {
            el.style.left = (marker.xPct * 100) + '%';
            el.style.top  = (marker.yPct * 100) + '%';
        }
    });
}

function renderMarkersList() {
    const container = document.getElementById('markersListContainer');
    const map = mapsData[currentMapIndex];
    if (!map || map.markers.length === 0) {
        container.innerHTML = `<p class="text-muted small text-center mt-3">${t('maps.noMarkers')}</p>`;
        return;
    }
    container.innerHTML = '';
    map.markers.forEach(marker => {
        const item = document.createElement('div');
        item.className = 'marker-list-item';
        item.innerHTML = `
            <span class="marker-list-pin" style="background:${MARKER_COLORS[marker.type]};"></span>
            <span class="marker-list-name">${escapeHtml(marker.name)}</span>
            <span class="marker-list-type">${MARKER_LABELS[marker.type]}</span>
            <div class="marker-list-actions">
                <button class="marker-list-btn" onclick="openMarkerModal('${marker.id}')">${t('maps.rename')}</button>
                <button class="marker-list-btn del" onclick="deleteMarkerById('${marker.id}')">${t('maps.delete')}</button>
            </div>
        `;
        container.appendChild(item);
    });
}

// ==================== MAP MODES & CONTROLS ====================

function setMapMode(mode) {
    mapMode = mode;
    const wrapper      = document.getElementById('mapsCanvasWrapper');
    const typeSelector = document.getElementById('markerTypeSelector');
    const clearBtn     = document.getElementById('clearMarkersBtn');

    document.querySelectorAll('.maps-mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`modeBtn-${mode}`).classList.add('active');

    if (mode === 'place') {
        wrapper.classList.add('mode-place');
        typeSelector.style.display = 'flex';
        if (clearBtn) clearBtn.style.display = 'inline-flex';
    } else {
        wrapper.classList.remove('mode-place');
        typeSelector.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
    }
}

function selectMarkerType(btn) {
    document.querySelectorAll('.maps-marker-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedMarkerType = btn.dataset.type;
}

function clearAllMarkers() {
    const map = mapsData[currentMapIndex];
    if (!map) return;
    if (map.markers.length === 0) return;
    showConfirmModal(t('maps.confirmClearMarkers'), function() {
        map.markers = [];
        renderMarkers();
        renderMarkersList();
        renderMapsList();
    });
}

// ==================== SUB-TAB SWITCHING ====================

function switchMapSubtab(tab) {
    document.querySelectorAll('.maps-subtab').forEach(b => b.classList.remove('active'));
    document.getElementById(`subtab-${tab}`).classList.add('active');

    document.getElementById('subpanel-view').style.display = tab === 'view' ? 'flex' : 'none';
    document.getElementById('subpanel-markers').style.display = tab === 'markers' ? 'flex' : 'none';

    if (tab === 'markers') renderMarkersList();
}

// ==================== MARKER MODAL ====================

function openMarkerModal(markerId) {
    const map = mapsData[currentMapIndex];
    if (!map) return;
    const marker = map.markers.find(m => m.id === markerId);
    if (!marker) return;

    editingMarkerId = markerId;
    document.getElementById('markerNameInput').value = marker.name;
    document.getElementById('markerModal').classList.add('visible');
    setTimeout(() => document.getElementById('markerNameInput').focus(), 100);
}

function closeMarkerModal(event) {
    if (!event || event.target === document.getElementById('markerModal')) {
        document.getElementById('markerModal').classList.remove('visible');
        editingMarkerId = null;
    }
}

function saveMarkerName() {
    if (!editingMarkerId) return;
    const map = mapsData[currentMapIndex];
    if (!map) return;
    const marker = map.markers.find(m => m.id === editingMarkerId);
    if (!marker) return;

    const newName = document.getElementById('markerNameInput').value.trim();
    marker.name = newName || MARKER_LABELS[marker.type];

    document.getElementById('markerModal').classList.remove('visible');
    editingMarkerId = null;

    renderMarkers();
    renderMarkersList();
    renderMapsList();
}

function deleteCurrentMarker() {
    if (!editingMarkerId) return;
    deleteMarkerById(editingMarkerId);
    document.getElementById('markerModal').classList.remove('visible');
    editingMarkerId = null;
}

function deleteMarkerById(markerId) {
    const map = mapsData[currentMapIndex];
    if (!map) return;
    map.markers = map.markers.filter(m => m.id !== markerId);
    renderMarkers();
    renderMarkersList();
    renderMapsList();
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.getElementById('markerModal').classList.contains('visible')) {
        saveMarkerName();
    }
    if (e.key === 'Escape' && document.getElementById('markerModal').classList.contains('visible')) {
        closeMarkerModal();
    }
});

// ==================== LIGHTBOX ====================

function openLightbox(src) {
    const overlay = document.getElementById('imageLightbox');
    const img = document.getElementById('lightboxImage');
    img.src = src;
    overlay.classList.add('visible');
}

function closeLightbox(event) {
    if (!event || event.target !== document.getElementById('lightboxImage')) {
        document.getElementById('imageLightbox').classList.remove('visible');
    }
}

// ==================== TRANSLATIONS ====================

function loadTranslations(lang) {
  return new Promise((resolve, reject) => {
    const scriptFile = `lang/${lang}.js`;
    const globalVar = lang === 'ita' ? 'translationsIta' : 'translationsEng';

    const oldScript = document.querySelector(`script[data-lang="${lang}"]`);
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.src = scriptFile;
    script.setAttribute('data-lang', lang);
    script.onload = () => {
      if (window[globalVar]) {
        translations = window[globalVar];
        currentLang = lang;
        localStorage.setItem('dnd_lang', lang);
        resolve();
      } else {
        reject(new Error(`Global variable ${globalVar} not found`));
      }
    };
    script.onerror = () => reject(new Error(`Unable to load ${scriptFile}`));
    document.head.appendChild(script);
  });
}

function t(path) {
  const keys = path.split('.');
  let val = translations;
  for (const k of keys) {
    if (val === undefined || val === null) return path;
    val = val[k];
  }
  return (val !== undefined && val !== null) ? val : path;
}

function applyTranslations() {
  // Update all static elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  // Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // Titles
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });

  // Update dynamic labels
  document.getElementById('themeLabel').textContent =
    document.getElementById('themeToggle').checked ? t('settings.dayMode') : t('settings.nightMode');
  document.getElementById('langLabel').textContent =
    currentLang === 'ita' ? t('settings.italiano') : t('settings.english');

  // Page title
  document.title = t('settings.pageTitle');

  // Image card headers (preserve counters)
  const imgHeader = document.getElementById('imageCardHeader');
  if (imgHeader) {
    const counter = document.getElementById('imageCounter');
    imgHeader.textContent = t('image.header') + ' ';
    if (counter) imgHeader.appendChild(counter);
  }
  const dmImgHeader = document.getElementById('dmImageCardHeader');
  if (dmImgHeader) {
    const dmCounter = document.getElementById('dmImageCounter');
    dmImgHeader.textContent = t('dm.galleryHeader') + ' ';
    if (dmCounter) dmImgHeader.appendChild(dmCounter);
  }

  // Update dynamically created rows
  updateAbilityAndSaveLabels();
  updateSkillNames();
  updateScalingLabels();
  updateDynamicPlaceholders();
  updateWeaponPlaceholders();

  // Translate selects (like scaling options)
  translateSelects();

  // Empty state placeholders
  const noImgP = document.querySelector('#charImageContainer p.text-muted');
  if (noImgP) noImgP.textContent = t('image.noImage');
  const dmNoImgP = document.querySelector('#dmImageContainer p.text-muted');
  if (dmNoImgP) dmNoImgP.textContent = t('dm.noImage');
  const noMapsP = document.querySelector('#mapsListContainer > p.text-muted');
  if (noMapsP) noMapsP.textContent = t('maps.noMapsLoaded');
  const noMarkersP = document.querySelector('#markersListContainer > p.text-muted');
  if (noMarkersP) noMarkersP.textContent = t('maps.noMarkers');

  if (typeof partyConnectionStatus !== 'undefined') updatePartyStatus(partyConnectionStatus);
}

function translateSelects() {
  // Translate spellcasting ability select
  const spellAbilitySelect = document.getElementById('spellAbility');
  if (spellAbilitySelect) {
    Array.from(spellAbilitySelect.options).forEach(option => {
      const val = option.value;
      if (abilitiesITA.includes(val)) {
        option.textContent = t(`abilities.${val}`);
      } else if (val === '-') {
        option.textContent = t('spells.none');
      }
    });
  }

  // Translate all skill scaling selects
  const scalingSelects = document.querySelectorAll('#scalingContainer select');
  scalingSelects.forEach(select => {
    Array.from(select.options).forEach(option => {
      const val = option.value;
      if (abilitiesITA.includes(val)) {
        option.textContent = t(`abilities.${val}`);
      }
    });
  });
}

function updateAbilityAndSaveLabels() {
  document.querySelectorAll('#abilitiesContainer .ability-row .ability-label').forEach(label => {
    const key = label.dataset.itaKey || label.textContent.trim();
    label.dataset.itaKey = key;
    label.textContent = t(`abilities.${key}`);
  });
  document.querySelectorAll('#savesContainer .save-row .save-label').forEach(label => {
    const key = label.dataset.itaKey || label.textContent.trim();
    label.dataset.itaKey = key;
    label.textContent = t(`abilities.${key}`);
  });
  document.querySelectorAll('#dmAbilitiesContainer .dm-ability-box label').forEach(label => {
    const key = label.dataset.itaKey || label.textContent.trim();
    label.dataset.itaKey = key;
    label.textContent = t(`abilities.${key}`);
  });
}

function updateSkillNames() {
  document.querySelectorAll('#skillsContainer .skill-row').forEach(row => {
    const nameSpan = row.querySelector('.skill-name');
    if (!nameSpan) return;
    const itaKey = nameSpan.dataset.itaKey;
    const abilityKey = nameSpan.dataset.abilityKey;
    if (!itaKey || !abilityKey) return;
    const currentAbility = skillScaling[itaKey] || abilityKey;
    nameSpan.textContent = `${t(`skills.${itaKey}`)} (${t(`abilities.${currentAbility}`)})`;
  });
}

function updateScalingLabels() {
  document.querySelectorAll('#scalingContainer .scaling-skill-card label').forEach(label => {
    const key = label.dataset.itaKey;
    if (key) label.textContent = t(`skills.${key}`);
  });
}

function updateDynamicPlaceholders() {
  document.querySelectorAll('#equipmentContainer .equipment-row').forEach((row, i) => {
    const inputs = row.querySelectorAll('input');
    if (inputs[0]) inputs[0].placeholder = `${t('equip.itemPlaceholder')} ${i + 1}`;
    if (inputs[2]) inputs[2].placeholder = t('equip.notesPlaceholder');
  });
  document.querySelectorAll('#cantripsContainer .cantrip-entry input').forEach((input, i) => {
    input.placeholder = `${t('spells.cantripPlaceholder')} ${i + 1}`;
  });
  for (let level = 1; level <= 9; level++) {
    document.querySelectorAll(`#spellLevel${level}Container .spell-entry`).forEach(entry => {
      const textInput = entry.querySelector('input[type="text"]');
      if (textInput) textInput.placeholder = t('spells.spellPlaceholder');
      const lbl = entry.querySelector('label');
      if (lbl) lbl.textContent = t('spells.prepLabel');
    });
  }
}

function updateWeaponPlaceholders() {
  document.querySelectorAll('#weaponsContainer .weapon-row input:first-child').forEach(input => {
    input.placeholder = t('combat.weaponName');
  });
}

// ==================== AUTOSAVE ====================

/**
 * Keepalive del permesso di scrittura: scrive silenziosamente i dati
 * correnti sul file aperto per evitare che Chrome revochi il permesso
 * dopo un periodo di inattività. Non mostra notifiche.
 */
async function permissionKeepalive() {
    if (!currentFileHandle) return;
    try {
        const perm = await currentFileHandle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
            // Il permesso è già scaduto — lo segnaliamo in console ma
            // non mostriamo popup: lo gestirà saveData() al prossimo salvataggio
            console.warn('Keepalive: permesso scaduto, verrà richiesto al prossimo salvataggio.');
            currentFileHandle = null;
            stopPermissionKeepalive();
            return;
        }
        // Scrivi i dati attuali per tenere vivo il permesso
        const data = getAllData();
        await writeDataToFileSilent(currentFileHandle, data);
        console.log('Keepalive: permesso di scrittura rinnovato.');
    } catch (err) {
        console.warn('Keepalive: errore durante il rinnovo del permesso:', err);
    }
}

function startPermissionKeepalive() {
    stopPermissionKeepalive(); // evita duplicati
    if (!currentFileHandle) return;
    permissionKeepaliveInterval = setInterval(permissionKeepalive, KEEPALIVE_INTERVAL_MS);
    console.log('Keepalive: avviato (intervallo 2 minuti).');
}

function stopPermissionKeepalive() {
    if (permissionKeepaliveInterval) {
        clearInterval(permissionKeepaliveInterval);
        permissionKeepaliveInterval = null;
    }
}

async function autoSave() {
    if (!autoSaveEnabled) return;

    const data = getAllData();

    if (currentFileHandle) {
        console.log("Autosave in progress...");
        const success = await writeDataToFileSilent(currentFileHandle, data);
        if (success) {
            showAutoSaveNotification(t('alerts.autoSaved') || 'Auto-saved');
            const saveBtn = document.querySelector('[onclick*="saveData"]') ||
                            Array.from(document.querySelectorAll('.btn-success')).find(b =>
                                b.textContent.includes(t('buttons.save')) || b.textContent.includes('Salva') || b.textContent.includes('Save')
                            );
            if (saveBtn) {
                const originalText = saveBtn.textContent;
                saveBtn.textContent = t('buttons.saved');
                saveBtn.style.background = '#2d8a2d';
                setTimeout(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.style.background = '';
                }, 800);
            }
        } else {
            console.warn("Autosave: file handle non valido, salvataggio su localStorage.");
            currentFileHandle = null;
            stopPermissionKeepalive();
            try { localStorage.setItem('dnd_autosave_backup', JSON.stringify(data)); } catch(e) {}
            showAutoSaveNotification(t('alerts.autoSavedLocal') || 'Backup saved locally');
        }
    } else {
        try { localStorage.setItem('dnd_autosave_backup', JSON.stringify(data)); } catch(e) {}
        console.log("Autosave to localStorage (no open file)");
    }
}

function showAutoSaveNotification(msg) {
    let notif = document.getElementById('autoSaveNotification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'autoSaveNotification';
        notif.style.position = 'fixed';
        notif.style.bottom = '20px';
        notif.style.right = '20px';
        notif.style.backgroundColor = '#4caf50';
        notif.style.color = 'white';
        notif.style.padding = '8px 16px';
        notif.style.borderRadius = '4px';
        notif.style.fontSize = '12px';
        notif.style.zIndex = '9999';
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.3s';
        document.body.appendChild(notif);
    }
    notif.textContent = msg || t('alerts.autoSaved') || 'Auto-saved';
    notif.style.opacity = '1';
    setTimeout(() => {
        notif.style.opacity = '0';
    }, 2000);
}

// ==================== PARTY CHAT ====================

function initializePartyChat() {
    console.log('initializePartyChat START');

    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatImageBtn = document.getElementById('chatImageBtn');
    const chatImageInput = document.getElementById('chatImageInput');
    const chatDiceBtn = document.getElementById('chatDiceBtn');
    const passwordToggle = document.getElementById('partyPasswordToggle');
    const chatBgBtn = document.getElementById('chatBgBtn');
    const chatBgInput = document.getElementById('chatBgInput');
    const detectIPBtn = document.getElementById('detectIPBtn');
    const btnCreateParty = document.getElementById('btnCreateParty');
    const btnJoinParty = document.getElementById('btnJoinParty');
    const btnLeaveParty = document.getElementById('btnLeaveParty');

    if (!btnCreateParty) console.error('btnCreateParty not found!');
    if (!btnJoinParty) console.error('btnJoinParty not found!');
    if (!btnLeaveParty) console.error('btnLeaveParty not found!');
    if (!chatInput) console.error('chatInput not found!');

    if (chatInput) chatInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') sendChatMessage(); });
    if (chatSendBtn) chatSendBtn.addEventListener('click', sendChatMessage);
    if (chatImageBtn) chatImageBtn.addEventListener('click', () => chatImageInput?.click());
    if (chatImageInput) chatImageInput.addEventListener('change', handleChatImageUpload);
    if (chatDiceBtn) chatDiceBtn.addEventListener('click', toggleDicePopup);
    if (passwordToggle) passwordToggle.addEventListener('click', togglePasswordVisibility);
    if (chatBgBtn) chatBgBtn.addEventListener('click', () => chatBgInput?.click());
    if (chatBgInput) chatBgInput.addEventListener('change', handleChatBgUpload);
    if (detectIPBtn) detectIPBtn.addEventListener('click', detectServerIP);

    if (btnCreateParty) btnCreateParty.addEventListener('click', function(e) { e.preventDefault(); createParty(); });
    if (btnJoinParty) btnJoinParty.addEventListener('click', function(e) { e.preventDefault(); joinParty(); });
    if (btnLeaveParty) btnLeaveParty.addEventListener('click', function(e) { e.preventDefault(); leaveParty(); });

    document.addEventListener('click', function(e) {
        const popup = document.getElementById('chatDicePopup');
        if (popup && !popup.contains(e.target) && e.target !== chatDiceBtn && !chatDiceBtn?.contains(e.target))
            popup.classList.remove('visible');
    });

    console.log('initializePartyChat COMPLETED');
}

function updatePartyUI() {
    const btnCreate = document.getElementById('btnCreateParty');
    const btnJoin = document.getElementById('btnJoinParty');
    const btnLeave = document.getElementById('btnLeaveParty');
    if (!btnCreate || !btnJoin || !btnLeave) return;
    if (partyConnectionStatus === 'online' && isInRoom) {
        btnCreate.disabled = true; btnJoin.disabled = true; btnLeave.disabled = false;
    } else if (partyConnectionStatus === 'online' && !isInRoom) {
        btnCreate.disabled = false; btnJoin.disabled = false; btnLeave.disabled = true;
    } else {
        btnCreate.disabled = false; btnJoin.disabled = false; btnLeave.disabled = true;
    }
}

function connectWebSocket() {
    const serverIPInput = document.getElementById('serverIP');
    if (!serverIPInput) { addSystemMessage(t('alerts.connectionError')); return; }
    let serverIP = serverIPInput.value.trim();
    if (!serverIP) serverIP = 'localhost';
    serverIP = serverIP.replace(/^https?:\/\//, '').replace(/^ws:\/\//, '').split('/')[0];
    const url = `ws://${serverIP}:8765`;
    if (partySocket) {
        if (partySocket.readyState === WebSocket.OPEN || partySocket.readyState === WebSocket.CONNECTING) {
            if (partySocket.url === url || partySocket.url === url + '/') return;
            else { partySocket.close(); partySocket = null; }
        } else { partySocket = null; }
    }
    updatePartyStatus('connecting');
    addSystemMessage(`${t('party.connecting').replace('...', '')} ${serverIP}...`);
    try { partySocket = new WebSocket(url); } catch (err) {
        console.error('WebSocket creation error:', err);
        addSystemMessage(t('alerts.invalidUrl'));
        updatePartyStatus('offline'); updatePartyUI(); return;
    }
    partySocket.onopen = function() {
        console.log('Connected to server');
        updatePartyStatus('online');
        addSystemMessage(t('party.connected'));
        reconnectAttempts = 0;
        updatePartyUI();
        // Avvia heartbeat applicativo ogni 25 secondi per mantenere viva la connessione su hotspot/NAT
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(function() {
            if (partySocket && partySocket.readyState === WebSocket.OPEN) {
                partySocket.send(JSON.stringify({ type: 'ping' }));
            }
        }, 25000);
        if (pendingAction) {
            const action = pendingAction; pendingAction = null;
            partySocket.send(JSON.stringify({ type: action.type, nickname: action.nickname, password: action.password }));
        }
    };
    partySocket.onmessage = function(event) {
        try { const data = JSON.parse(event.data); handleServerMessage(data); } catch (e) { console.error('Parse error:', e); }
    };
    partySocket.onclose = function(event) {
        if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
        const wasInRoom = isInRoom;
        updatePartyStatus('offline');
        partySocket = null;
        isInRoom = false;
        updatePartyUI();

        // Disconnessione volontaria (code 1000 o 1001): nessun tentativo di riconnessione
        if (event.code === 1000 || event.code === 1001) {
            if (wasInRoom) {
                currentRoomPassword = null;
                resetChatMessages();
            }
            document.getElementById('btnCreateParty').disabled = false;
            document.getElementById('btnJoinParty').disabled = false;
            return;
        }

        // Disconnessione inattesa
        currentRoomPassword = null;
        addSystemMessage(`⚠️ ${t('serverMessages.connectionLost').replace('{code}', event.code)}`);

        if (wasInRoom) {
            resetChatMessages();
        }

        if (reconnectAttempts < 3) {
            reconnectAttempts++;
            const d = reconnectAttempts * 2000;
            addSystemMessage(`🔄 ${t('serverMessages.reconnecting').replace('{seconds}', d / 1000).replace('{attempt}', reconnectAttempts)}`);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => connectWebSocket(), d);
        } else {
            addSystemMessage('❌ ' + t('serverMessages.reconnectFailed'));
            reconnectAttempts = 0;
        }

        document.getElementById('btnCreateParty').disabled = false;
        document.getElementById('btnJoinParty').disabled = false;
    };
    partySocket.onerror = function(error) { console.error('WebSocket error:', error); };
}

function resetChatMessages() {
    const messagesArea = document.getElementById('chatMessages');
    if (!messagesArea) return;
    messagesArea.innerHTML = `
        <div class="chat-welcome-msg">
            <p>${t('party.welcomeMsg')}</p>
            <p class="small">${t('party.welcomeDesc')}</p>
        </div>
    `;
}

// Traduce i messaggi provenienti dal server usando messageKey+params (nuovo),
// oppure fa un fallback sul campo message grezzo (retrocompatibilità).
function translateServerMessage(data) {
    if (data.messageKey) {
        const key = 'serverMessages.' + data.messageKey;
        let msg = t(key);
        if (data.params) {
            for (const [k, v] of Object.entries(data.params)) {
                msg = msg.replace(`{${k}}`, v);
            }
        }
        return msg;
    }
    return data.message || '';
}

function handleServerMessage(data) {
    switch (data.type) {
        case 'created':
            currentRoomPassword = document.getElementById('partyPassword').value.trim();
            isInRoom = true; addSystemMessage('✅ ' + t('serverMessages.roomCreated')); updatePartyUI(); break;
        case 'joined':
            currentRoomPassword = document.getElementById('partyPassword').value.trim();
            isInRoom = true; addSystemMessage(`✅ ${t('serverMessages.roomJoined').replace('{members}', (data.users || []).join(', '))}`); updatePartyUI(); break;
        case 'left':
            isInRoom = false; currentRoomPassword = null; addSystemMessage('👋 ' + t('serverMessages.youLeft')); resetChatMessages(); updatePartyUI(); break;
        case 'chat':
            addChatMessage(data.nickname, data.text, data.image, false, data.dice); break;
        case 'system':
            addSystemMessage('🔔 ' + translateServerMessage(data)); break;
        case 'closed':
            addSystemMessage('🔒 ' + t('serverMessages.roomClosed') + (data.reason ? ': ' + data.reason : '')); currentRoomPassword = null; isInRoom = false; resetChatMessages(); updatePartyUI(); break;
        case 'error':
            addSystemMessage('❌ ' + translateServerMessage(data)); break;
        default:
            console.log('Unknown message:', data);
    }
    document.getElementById('btnCreateParty').disabled = false;
    document.getElementById('btnJoinParty').disabled = false;
}

function createParty() {
    const nickname = document.getElementById('partyNickname').value.trim();
    const password = document.getElementById('partyPassword').value.trim();
    if (!nickname) { addSystemMessage('❌ ' + t('alerts.noNickname')); return; }
    if (!password) { addSystemMessage('❌ ' + t('alerts.noPassword')); return; }
    if (isInRoom) { addSystemMessage('⚠️ ' + t('alerts.alreadyInRoom')); return; }
    document.getElementById('btnCreateParty').disabled = true;
    if (!partySocket || partySocket.readyState !== WebSocket.OPEN) {
        pendingAction = { type: 'create', nickname, password }; connectWebSocket();
    } else {
        partySocket.send(JSON.stringify({ type: 'create', nickname, password }));
    }
}

function joinParty() {
    const nickname = document.getElementById('partyNickname').value.trim();
    const password = document.getElementById('partyPassword').value.trim();
    if (!nickname) { addSystemMessage('❌ ' + t('alerts.noNickname')); return; }
    if (!password) { addSystemMessage('❌ ' + t('alerts.noPasswordJoin')); return; }
    if (isInRoom) { addSystemMessage('⚠️ ' + t('alerts.alreadyInRoom')); return; }
    document.getElementById('btnJoinParty').disabled = true;
    if (!partySocket || partySocket.readyState !== WebSocket.OPEN) {
        pendingAction = { type: 'join', nickname, password }; connectWebSocket();
    } else {
        partySocket.send(JSON.stringify({ type: 'join', nickname, password }));
    }
}

function leaveParty() {
    if (!isInRoom) { addSystemMessage('⚠️ ' + t('alerts.notInRoom')); return; }
    if (!partySocket || partySocket.readyState !== WebSocket.OPEN) { addSystemMessage('❌ ' + t('alerts.notConnected')); return; }

    // Annulla qualsiasi riconnessione automatica pendente
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    reconnectAttempts = 0;

    document.getElementById('btnLeaveParty').disabled = true;
    partySocket.send(JSON.stringify({ type: 'leave' }));
    addSystemMessage(t('alerts.leaveSent'));
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const text = chatInput.value.trim();
    if (!text) return;
    if (!partySocket || partySocket.readyState !== WebSocket.OPEN) { addSystemMessage('❌ ' + t('alerts.notConnected')); return; }
    if (text.startsWith('/roll ') || text.startsWith('/r ')) {
        const diceCmd = text.replace(/^\/(roll|r)\s+/, '');
        try {
            const result = interpretDiceCommand(diceCmd);
            partySocket.send(JSON.stringify({ type: 'message', dice: { command: diceCmd, result } }));
            addChatMessage(getNickname(), '', null, true, { command: diceCmd, result });
        } catch (err) { addSystemMessage('❌ ' + err.message); }
    } else {
        partySocket.send(JSON.stringify({ type: 'message', text }));
        addChatMessage(getNickname(), text, null, true);
    }
    chatInput.value = '';
}

// ==================== COMPRESSIONE IMMAGINI PER LA CHAT ====================
async function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Riduci ulteriormente la qualità per formati JPEG/PNG
                const mime = file.type || 'image/jpeg';
                const compressedDataUrl = canvas.toDataURL(mime, quality);
                resolve(compressedDataUrl);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// Funzione corretta per l'invio delle immagini
async function handleChatImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validazione tipo e dimensione massima (es. 10 MB prima della compressione)
    if (!file.type.startsWith('image/')) {
        addSystemMessage('❌ ' + t('serverMessages.invalidFileType'));
        event.target.value = '';
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        addSystemMessage('❌ ' + t('serverMessages.fileTooLarge'));
        event.target.value = '';
        return;
    }

    if (!partySocket || partySocket.readyState !== WebSocket.OPEN) {
        addSystemMessage('❌ ' + t('alerts.notConnected'));
        event.target.value = '';
        return;
    }

    try {
        // Mostra un messaggio temporaneo di "invio in corso"
        addSystemMessage('📤 ' + t('serverMessages.sendingImage'));
        const compressedDataUrl = await compressImage(file, 800, 0.7);
        partySocket.send(JSON.stringify({ type: 'message', image: compressedDataUrl }));
        addChatMessage(getNickname(), null, compressedDataUrl, true);
    } catch (err) {
        console.error('Errore compressione/invio immagine:', err);
        addSystemMessage('❌ ' + t('serverMessages.imageSendError'));
    } finally {
        event.target.value = '';
    }
}

function addSystemMessage(text) {
    const messagesArea = document.getElementById('chatMessages');
    if (!messagesArea) return;
    const welcomeMsg = messagesArea.querySelector('.chat-welcome-msg');
    if (welcomeMsg) welcomeMsg.remove();
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg system';
    msgDiv.innerHTML = `<div class="chat-msg-text"><i>${escapeHtml(text)}</i></div>`;
    messagesArea.appendChild(msgDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function addChatMessage(author, text, imageData, isSelf, diceData) {
    const messagesArea = document.getElementById('chatMessages');
    if (!messagesArea) return;
    const welcomeMsg = messagesArea.querySelector('.chat-welcome-msg');
    if (welcomeMsg) welcomeMsg.remove();
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${isSelf ? 'self' : 'other'}`;
    let content = `<div class="chat-msg-author">${escapeHtml(author)}</div>`;
    if (text) content += `<p class="chat-msg-text">${escapeHtml(text)}</p>`;
    if (imageData) content += `<img src="${imageData}" class="chat-msg-image" onclick="openLightbox('${imageData}')">`;
    if (diceData) content += `
        <div class="chat-msg-dice">
            <span class="chat-dice-icon">🎲</span>
            <div>
                <div class="chat-dice-result">${escapeHtml(diceData.result)}</div>
                <div class="chat-dice-detail">${escapeHtml(diceData.command)}</div>
            </div>
        </div>`;
    msgDiv.innerHTML = content;
    messagesArea.appendChild(msgDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function updatePartyStatus(status) {
    partyConnectionStatus = status;
    const statusDot = document.querySelector('.party-status-dot');
    const statusText = document.querySelector('.party-status-text');
    if (!statusDot || !statusText) return;
    if (status === 'online') {
        statusDot.className = 'party-status-dot online';
        statusText.textContent = currentRoomPassword ? `${t('party.connected')} (${currentRoomPassword})` : t('party.connected');
    } else if (status === 'connecting') {
        statusDot.className = 'party-status-dot offline';
        statusText.textContent = t('party.connecting');
    } else {
        statusDot.className = 'party-status-dot offline';
        statusText.textContent = t('party.notConnected');
    }
    updatePartyUI();
}

function togglePasswordVisibility() {
    const pwInput = document.getElementById('partyPassword');
    if (pwInput) pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
}

function handleChatBgUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const bg = document.getElementById('chatBgImage');
        if (bg) bg.style.backgroundImage = `url('${ev.target.result}')`;
        // chat_bg is saved as part of the sheet (not in localStorage) - save/load via sheet file only
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function toggleDicePopup() {
    let popup = document.getElementById('chatDicePopup');
    if (!popup) { createDicePopup(); popup = document.getElementById('chatDicePopup'); }
    if (popup) popup.classList.toggle('visible');
}

function createDicePopup() {
    const chatInputArea = document.querySelector('.chat-input-area');
    if (!chatInputArea) return;
    const popup = document.createElement('div');
    popup.id = 'chatDicePopup';
    popup.className = 'chat-dice-popup';
    const diceTypes = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100', '2d6'];
    popup.innerHTML = `
        <div class="chat-dice-popup-title">${t('party.rollDice')}</div>
        <div class="chat-dice-popup-grid">
            ${diceTypes.map(d => `<button class="chat-dice-popup-btn" data-dice="${d}">${d}</button>`).join('')}
        </div>
    `;
    chatInputArea.style.position = 'relative';
    chatInputArea.appendChild(popup);
    popup.querySelectorAll('.chat-dice-popup-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('chatInput').value = '/roll ' + this.dataset.dice;
            sendChatMessage();
            popup.classList.remove('visible');
        });
    });
}

function getNickname() {
    return document.getElementById('partyNickname')?.value.trim() || 'Anonimo';
}

// ==================== SERVER IP AUTO-DETECT ====================

async function detectServerIP() {
    const btn = document.getElementById('detectIPBtn');
    const serverInput = document.getElementById('serverIP');
    if (!btn || !serverInput) return;

    const currentIP = serverInput.value.trim() || 'localhost';
    const cleanIP = currentIP.replace(/^https?:\/\//, '').replace(/^ws:\/\//, '').split('/')[0].split(':')[0];

    btn.disabled = true;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>`;

    try {
        const res = await fetch(`http://${cleanIP}:8766/info`, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const info = await res.json();
        if (info.ip) {
            serverInput.value = info.ip;
            addSystemMessage(`✅ ${t('serverMessages.autoDetectSuccess').replace('{ip}', info.ip)}`);
        }
    } catch (err) {
        addSystemMessage(`⚠️ ${t('serverMessages.autoDetectFailed')}`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>`;
    }
}

// ==================== DOM CONTENT LOADED INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async function() {
    // Restore saved theme
    try {
        const savedTheme = localStorage.getItem('dnd_theme');
        if (savedTheme === 'day') {
            document.body.classList.add('day-mode');
            const toggle = document.getElementById('themeToggle');
            if (toggle) {
                toggle.checked = true;
            }
        }
    } catch(e) {}

    // Chat background is NOT restored from localStorage on startup.
    // It is applied only when a sheet that contains a custom chat_bg is loaded.

    // Restore saved language and load translations
    try {
        const savedLang = localStorage.getItem('dnd_lang') || 'ita';
        await loadTranslations(savedLang);
        const langToggle = document.getElementById('langToggle');
        if (langToggle && savedLang === 'eng') {
            langToggle.checked = true;
        }
    } catch (e) {
        console.error('Error loading translations:', e);
        await loadTranslations('ita');
    }

    initializeAbilities();
    initializeSaves();
    initializeSkills();
    initializeWeapons();
    initializeEquipment();
    initializeSpells();
    initializeScaling();
    initializeDMAbilities();
    initializeMaps();

    // Restore autosave backup if available, no file is loaded, and backup contains real data
    const savedBackup = localStorage.getItem('dnd_autosave_backup');
    if (savedBackup && !currentFileHandle) {
        let backupHasData = false;
        try {
            const parsed = JSON.parse(savedBackup);
            // Consider it meaningful if any of these fields are filled
            const name = parsed?.character_info?.name?.trim();
            const charClass = parsed?.character_info?.class?.trim();
            const race = parsed?.character_info?.race?.trim();
            const hasAbilities = parsed?.abilities?.scores &&
                Object.values(parsed.abilities.scores).some(v => parseInt(v) !== 10 && v !== '' && v !== undefined);
            const hasWeapons = parsed?.combat?.weapons?.length > 0;
            const hasSpells = parsed?.spells?.cantrips?.list?.some(s => s?.trim()) ||
                              parsed?.spells?.spells?.some(lvl => lvl?.spells?.length > 0);
            const hasEquip = parsed?.equipment?.some(e => e?.item?.trim());
            const hasNotes = parsed?.text_areas?.features_traits?.trim() ||
                             parsed?.text_areas?.player_notes?.trim();
            const hasMaps = parsed?.maps_data?.length > 0;
            const hasImages = parsed?.images?.length > 0;

            backupHasData = !!(name || charClass || race || hasAbilities || hasWeapons ||
                               hasSpells || hasEquip || hasNotes || hasMaps || hasImages);
        } catch(e) { backupHasData = false; }

        if (backupHasData) {
            openRestoreBackupModal(savedBackup);
        } else {
            // Backup is empty/default — discard it silently
            try { localStorage.removeItem('dnd_autosave_backup'); } catch(e) {}
        }
    }
    // Clean up preload backup (was only used as safety net during load — not needed at startup)
    try { localStorage.removeItem('dnd_preload_backup'); } catch(e) {}

    // Apply translations after DOM is fully built
    applyTranslations();

    // Add event listeners
    document.getElementById('profBonus').addEventListener('input', updateAllCalculations);
    document.getElementById('diceCommand').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') rollDice();
    });
    document.getElementById('charImageInput').addEventListener('change', handleCharImageUpload);
    document.getElementById('dmImageInput').addEventListener('change', handleDMImageUpload);
    document.getElementById('mapImageInput').addEventListener('change', handleMapImageUpload);

    // Initialize skill scaling with defaults
    skills.forEach(skill => {
        skillScaling[skill.name] = skill.ability;
    });

    initializePartyChat();

    // Initialize visual effects (particles, glassmorphism, dice animations)
    initializeVisualEffects();

    // Sync burger label when Bootstrap tab changes (programmatically)
    const tabLabels = {
        'sheet':   'SHEET',
        'equip':   'EQUIP.',
        'spells':  'SPELLS',
        'maps':    'MAPS',
        'scaling': 'SCALING',
        'dm':      'DM',
        'party':   'PARTY'
    };
    document.querySelectorAll('#mainTabs .nav-link').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function() {
            const target = this.getAttribute('data-bs-target').replace('#','');
            const labelEl = document.getElementById('burgerActiveTab');
            if (labelEl && tabLabels[target]) labelEl.textContent = tabLabels[target];
            document.querySelectorAll('#burgerTabsMenu .burger-menu-item').forEach(item => {
                item.classList.toggle('active', item.getAttribute('data-target') === '#' + target);
            });
        });
    });

    // Start autosave
    if (autoSaveEnabled) {
        autoSaveInterval = setInterval(autoSave, AUTO_SAVE_INTERVAL_MS);
    }
});

window.addEventListener('beforeunload', function() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    stopPermissionKeepalive();
});