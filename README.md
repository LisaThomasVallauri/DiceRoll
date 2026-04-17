# 🎲 DiceRoll — Scheda del Personaggio D&D

> Simulatore web-based della scheda del personaggio per Dungeons & Dragons 5e, con funzionalità estese per campagne homebrew e supporto multiplayer locale via WebSocket.

---

## 📋 Indice

- [Panoramica](#panoramica)
- [Funzionalità](#funzionalita)
- [Architettura del Progetto](#architettura-del-progetto)
- [Tecnologie Utilizzate](#tecnologie-utilizzate)
- [Installazione e Avvio](#installazione-e-avvio)
- [Utilizzo](#utilizzo)
- [Struttura dei File](#struttura-dei-file)
- [Funzionalità Custom (Homebrew)](#funzionalita-custom-homebrew)
- [Note Tecniche](#note-tecniche)

---

<a name="panoramica"></a>
## 🗺 Panoramica

**DiceRoll** è un'applicazione web desktop-only sviluppata per digitalizzare e potenziare l'esperienza di gioco di Dungeons & Dragons 5a Edizione. Il progetto nasce dall'esigenza di avere una scheda del personaggio interattiva, completa e accessibile direttamente dal browser, senza necessità di installazione.

L'applicazione è composta da un frontend statico (HTML + CSS + JavaScript) e un server WebSocket in Python, che gestisce la comunicazione in tempo reale tra i membri dello stesso gruppo di gioco (party).

---

<a name="funzionalita"></a>
## ✨ Funzionalità

### Scheda Personaggio
- **Informazioni anagrafiche complete**: nome, classe, razza, background, allineamento, livello, esperienza, età, altezza, peso, carnagione, capelli, occhi
- **Caratteristiche (Ability Scores)**: Forza, Destrezza, Costituzione, Intelligenza, Saggezza, Carisma con calcolo automatico dei modificatori
- **18 Abilità** con sistema di competenza e maestria:
  - Acrobazia, Addestrare Animali, Arcano, Atletica, Furtività, Indagare, Inganno, Intimidire, Intrattenere, Intuizione, Medicina, Natura, Percezione, Persuasione, Rapidità di Mano, Religione, Sopravvivenza, Storia
  - Calcolo automatico del modificatore legato alla caratteristica di riferimento
  - Tracciamento delle competenze (checkbox a 2 stati: competenza e maestria doppia)

- **Sistema di combattimento completo**:
  - Punti Ferita attuali, massimi e temporanei con barre di visualizzazione
  - Classe Armatura base e temporanea
  - Iniziativa calcolata sul modificatore di Destrezza
  - Velocità di movimento personalizzabile
  - Dadi Vita con selezione del tipo (d4 → d20)
  - **Tiri Salvezza contro la Morte**: tracciamento visuale di 3 successi e 3 fallimenti

- **Armi**: nome, bonus all'attacco, formula del danno (es: `1d8+2`)
- **Immagini del personaggio**: supporto per immagini multiple con navigazione avanti/indietro e lightbox ingrandita

### Equipaggiamento e Appunti
- **Inventario da 150 slot**: gestione di oggetti, armi, armature ed equipaggiamento con conteggio visuale dello spazio disponibile
- **Sistema monetario completo** con le cinque valute ufficiali di D&D 5e:
  - Monete di Rame (MR)
  - Monete d'Argento (MA)
  - Monete d'Electrum (ME)
  - Monete d'Oro (MO)
  - Monete di Platino (MP)
- **Tratti e Caratteristiche**: area testuale per documentare privilegi di classe, caratteristiche di background, tratti razziali, talenti e altre capacità speciali
- **Appunti del Giocatore**: spazio personale per annotazioni, obiettivi, segreti e note di sessione

### Incantesimi
- **Caratteristica da incantatore**: selezione della caratteristica primaria (FOR, DES, COS, INT, SAG, CAR) con calcolo automatico della CD del Tiro Salvezza degli Incantesimi e del Bonus all'Attacco con Incantesimi
- **Trucchetti (Cantrip)**: sezione dedicata ai trucchetti illimitati con conteggio
- **Incantesimi per livello**: organizzazione dal 1° al 9° livello con tab di navigazione
  - Contatori separati per incantesimi conosciuti e preparati
  - Tracciamento degli slot incantesimo (usati/disponibili) per ogni livello
  - Visualizzazione progressiva degli slot per incantatori a slot (mago, stregone, chierico, ecc.)
- **Calcolo automatico**: CD e bonus all'attacco si aggiornano in tempo reale al cambio della caratteristica

### Mappe
- **Gestione mappe multiple**: caricamento di più mappe da consultare durante la sessione
- **Due modalità di visualizzazione**:
  - **Modalità Visuale**: consultazione della mappa con i marcatori già posizionati
  - **Modalità Piazzamento**: posizionamento interattivo di nuovi marcatori

- **Sistema di marcatori categorizzati** con colori distinti:
  - 🟡 **Main Quest** (Giallo): quest principali della campagna
  - 🟣 **Personal Quest** (Viola): quest personali dei giocatori
  - 🟢 **Sub Quest** (Verde): missioni secondarie
  - 🔵 **Shop** (Blu): negozi, taverne e locande
  - 🔴 **Boss** (Rosso): nemici importanti, dungeon, zone pericolose
  - 🩵 **Item** (Azzurro): oggetti, tesori e artefatti

- **Gestione marcatori**: clic per piazzare, rinomina tramite modale dedicato, eliminazione
- **Pannello di controllo**: legenda dei tipi di marcatore e lista completa dei punti sulla mappa corrente
- **Formati supportati**: PNG, JPG, WebP

### Scaling Abilità *(Funzionalità Homebrew)*
- **Personalizzazione delle abilità**: riconfigura quale caratteristica governa ciascuna delle 18 abilità
- **Casi d'uso**:
  - Classi homebrew con meccaniche alternative
  - Campagne con house rules specifiche (es: Acrobazia basata su SAG invece di DES)
  - Sistemi modificati in cui le abilità seguono regole diverse
- Per ogni abilità, seleziona dalla dropdown la caratteristica da usare; i modificatori si aggiornano automaticamente in tempo reale

### Dungeon Master
- **Pannello statistiche PNG**: gestione completa di PNG e nemici, indipendente dalla scheda del giocatore
  - Punti Ferita e Classe Armatura
  - Iniziativa personalizzabile
  - Bonus Competenza
  - Sei caratteristiche indipendenti (FOR, DES, COS, INT, SAG, CAR) con calcolo automatico dei modificatori

- **Calcolatore dadi avanzato**:
  - Sintassi completa: `2d6+4`, `1d20-1`, `3d8` (supporta spazi e combinazioni complesse)
  - Pulsanti rapidi per i dadi standard (d4, d6, d8, d10, d12, d20, d100)
  - **Log visuale** dei tiri per consultazione durante la sessione
  - Mostra il risultato totale e il dettaglio di ogni dado

- **Galleria immagini DM**: caricamento di illustrazioni di mostri, PNG, scene di battaglia e ambientazioni da mostrare ai giocatori durante il gioco
- **Appunti riservati**: note private per il Dungeon Master — plot hook, segreti della trama, statistiche nascoste

### Party Chat *(Multiplayer Locale)*
- **Connessione in tempo reale**: comunicazione WebSocket tra giocatori sulla stessa rete LAN
- **Stanze protette da password**: ogni gruppo crea la propria stanza con password personalizzata
- **Chat testuale**: messaggi in tempo reale visibili a tutti i partecipanti della stanza
- **Condivisione immagini**: caricamento e visualizzazione di immagini direttamente nella chat (PNG, JPG, WebP)
- **Tiri dadi integrati**: comando `/roll` per lanciare dadi direttamente nella chat
  - Es: `/roll 2d20+5` — lancia i dadi e mostra il risultato a tutti
  - Supporta la stessa sintassi del calcolatore dadi
- **Stato connessione**: indicatore visuale Online/Offline con feedback immediato
- **Sfondo chat personalizzabile**: immagine di sfondo personalizzata per la chat (persiste tra sessioni)
- **Auto-riconnessione**: in caso di perdita di connessione, il client tenta automaticamente di riconnettersi
- **Auto-detect IP server**: pulsante per rilevare automaticamente l'IP del server (richiede server avviato)

### Funzionalità Trasversali
- **Salvataggio su file**: export della scheda in formato JSON
  - **Salva**: sovrascrive il file aperto in precedenza (se disponibile)
  - **Salva con nome**: apre il selettore per scegliere posizione e nome del file
- **Caricamento da file**: import di schede precedentemente salvate in qualsiasi momento
- **Autosalvataggio automatico**: backup su `localStorage` ogni 60 secondi, come protezione contro chiusure accidentali
- **Ripristino da backup**: se la scheda viene chiusa inaspettatamente, all'apertura successiva l'app propone di ripristinare l'ultimo autosalvataggio
- **Reset completo**: azzera tutti i dati e ricomincia da zero (richiede conferma)
- **Tema chiaro/scuro**: switcher Day Mode / Night Mode con preferenza salvata automaticamente
- **Localizzazione bilingue**: switch in tempo reale tra italiano e inglese — tutte le label, i pulsanti e le tabelle cambiano lingua istantaneamente
- **Lightbox per immagini**: clic su qualsiasi immagine per ingrandirla a schermo intero

---

<a name="architettura-del-progetto"></a>
## 🏗 Architettura del Progetto

Il progetto è strutturato in due componenti principali:

```
Client (Browser)
│
├── index.html      → Struttura HTML, layout a tab, modali
├── style.css       → Stili personalizzati, temi, componenti UI
├── script.js       → Logica applicativa completa (vanilla JS)
└── lang/
    ├── ita.js      → Dizionario traduzioni italiano
    └── eng.js      → Dizionario traduzioni inglese

Server (Python)
│
└── server.py       → WebSocket server per la Party Chat
                      + HTTP info endpoint (porta 8766)
```

La comunicazione tra client e server avviene tramite messaggi JSON su **WebSocket** (porta `8765`). I tipi di messaggio gestiti sono: `create`, `join`, `leave`, `message`, `ping/pong`.

---

<a name="tecnologie-utilizzate"></a>
## 🛠 Tecnologie Utilizzate

| Componente | Tecnologia |
|---|---|
| Struttura pagina | HTML5 |
| Stile e layout | CSS3, Bootstrap 5.3 |
| Logica client | JavaScript (ES6+, Vanilla JS) |
| Salvataggio file | File System Access API / Blob Download |
| Persistenza locale | `localStorage` |
| Internazionalizzazione | Sistema i18n custom (file `.js` per lingua) |
| Server chat | Python 3, `asyncio`, `websockets` |
| Protocollo real-time | WebSocket (RFC 6455) |

---

<a name="installazione-e-avvio"></a>
## ⚙️ Installazione e Avvio

### Modalità Eseguibile Desktop

- **Windows**: eseguire `DiceRoll.exe` dalla cartella estratta

### Per usare la Party Chat

La Party Chat richiede il server Python per il multiplayer locale:

1. **Prerequisiti**: Python 3.8+ installato
2. **Installare la libreria WebSocket**:
   ```bash
   pip install websockets
   ```
3. **Avviare il server** (nella cartella del progetto):
   ```bash
   python server/server.py
   ```
4. Il server stamperà l'IP locale da condividere con gli altri giocatori
5. Aprire il programma (browser o .exe) e navigare alla tab **PARTY**
6. Inserire l'IP del server (o usare il pulsante **Auto-detect**) e la password della stanza

> **Nota sulla rete**: il server funziona solo su **LAN locale** (stessa WiFi/rete) e richiede Python installato nel sistema.

---

<a name="utilizzo"></a>
## 📖 Utilizzo

### Salvataggio e Caricamento

- **Salva**: sovrascrive il file aperto in precedenza (se disponibile), altrimenti apre il selettore file
- **Salva con nome**: apre sempre il selettore per scegliere nome e posizione del file
- **Carica**: apre un file `.json` salvato in precedenza
- **Reset**: azzera completamente la scheda (richiede conferma)

All'apertura, se è presente un autosalvataggio recente con dati, l'applicazione propone di ripristinarlo.

**Formato di salvataggio:** I dati vengono serializzati in formato **JSON** con la seguente struttura:

```json
{
  "character": {
    "info": { "name": "...", "class": "...", "race": "..." },
    "abilities": { "STR": 10, "DEX": 10, "...": "..." },
    "skills": { "ACROBATICS": { "mod": 0, "proficiency": false, "mastery": false }, "...": "..." },
    "combat": { "hp": { "current": 10, "max": 10, "temp": 0 }, "ac": 10, "initiative": 0 },
    "spells": { "ability": "INT", "slots": { "1": { "used": 0, "total": 0 }, "...": "..." } },
    "equipment": { "items": ["..."], "coins": { "copper": 0, "silver": 0, "...": "..." } },
    "images": { "character": ["..."], "dm": ["..."] },
    "maps": { "images": ["..."], "markers": ["..."] },
    "notes": { "traits": "...", "playerNotes": "...", "dmNotes": "..." }
  },
  "settings": { "theme": "dark", "language": "ita", "particles": true },
  "timestamp": "2026-04-17T10:30:00Z"
}
```

**Persistenza locale:** Un backup automatico viene salvato in `localStorage` ogni 60 secondi. È un salvataggio non distruttivo: i dati vengono proposti al ripristino solo se il file principale non è disponibile.

### Configurazione di Rete per Party Chat

La Party Chat utilizza WebSocket sulla porta **8765**. Per funzionare correttamente su LAN:

- Tutti i client e il server devono trovarsi sulla **stessa rete locale** (es: WiFi di casa)
- Se il firewall è attivo, aprire la porta `8765` (TCP)
- L'indirizzo IP deve essere uno della rete interna (es: `192.168.X.X`, `10.0.X.X`, `172.16.X.X`)

### Party Chat

1. Avviare `python server/server.py` sulla macchina che funge da server
2. Tutti i giocatori aprono `index.html` e navigano nella tab **PARTY**
3. Inserire nickname, password della stanza e IP del server (o cliccare **Auto-detect**)
4. Il primo giocatore clicca **Crea Party**; gli altri cliccano **Unisciti al Party**
5. Nella chat è possibile scrivere messaggi, inviare immagini e usare `/roll XdY+Z`

**Messaggi WebSocket supportati:**
- `create`: crea una nuova stanza (richiede password e nickname)
- `join`: accede a una stanza esistente (richiede password e nickname)
- `message`: invia un messaggio di testo o immagine a tutti nella stanza
- `leave`: abbandona la stanza e si disconnette
- `ping/pong`: heartbeat per mantenere la connessione attiva (automatico)

### Calcolatore Dadi

La sintassi supportata nel pannello DM include:

```
2d6+4        → tira 2 dadi da 6 e aggiunge 4
1d20-1       → tira 1 dado da 20 e sottrae 1
3d8          → tira 3 dadi da 8 mostrando ogni risultato separatamente
d20          → tira un singolo dado da 20
```

---

<a name="struttura-dei-file"></a>
## 📁 Struttura dei File

```
DiceRoll/
├── client/
│   ├── index.html       → Pagina principale dell'applicazione
│   ├── style.css        → Foglio di stile personalizzato
│   ├── script.js        → Logica JavaScript completa
│   ├── main.js          → Entry point Electron
│   ├── package.json     → Dipendenze e configurazione npm
│   ├── forge.config.js  → Configurazione Electron Forge
│   ├── lang/
│   │   ├── ita.js       → Traduzioni in italiano
│   │   └── eng.js       → Traduzioni in inglese
│   └── img/
│       ├── icon.png     → Icona dell'applicazione
│       └── bgChat.png   → Sfondo predefinito della chat
├── server/
│   └── server.py        → Server WebSocket per Party Chat
├── README.md            → Documentazione del progetto
└── LICENSE              → Licenza del progetto
```

---

<a name="funzionalita-custom-homebrew"></a>
## 🎮 Funzionalità Custom (Homebrew)

Oltre alle meccaniche ufficiali del manuale di D&D 5e, DiceRoll include alcune funzionalità pensate per campagne con regole personalizzate:

- **Scaling Abilità**: permette di riconfigurare quale caratteristica governa ciascuna abilità, utile per classi homebrew o house rules
- **Pannello DM indipendente**: il Dungeon Master dispone di un set completo di statistiche PNG gestibili separatamente dalla scheda del giocatore
- **Party Chat con lancio dadi**: la chat integrata consente di tirare dadi direttamente nella conversazione, rendendo i risultati visibili a tutti i partecipanti

---

<a name="note-tecniche"></a>
## 📝 Note Tecniche

- I dati della scheda vengono serializzati in formato **JSON** e possono essere trasferiti tra sessioni di gioco
- Il sistema di autosalvataggio usa `localStorage` come backup non distruttivo; la modale di ripristino appare solo se il backup contiene dati reali
- Il server WebSocket è progettato per reti **LAN locale**; l'utilizzo su Internet richiederebbe configurazioni aggiuntive (firewall, port forwarding o tunnel)
- Le stanze del Party sono identificate dalla **password** scelta dal creatore; password diverse corrispondono a stanze diverse
- In caso di disconnessione, il client tenta automaticamente la riconnessione al server
- Lo sfondo della chat viene salvato sia nel file JSON che in `localStorage`, garantendo persistenza tra sessioni

---

*Progetto sviluppato come elaborato di maturità — Anno Scolastico 2025/2026*

---

---

<br>

---

# 🎲 DiceRoll — D&D Character Sheet

> A web-based simulator for Dungeons & Dragons 5e character sheets, with extended features for homebrew campaigns and real-time local multiplayer support via WebSocket.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Architecture](#project-architecture)
- [Technologies Used](#technologies-used)
- [Installation and Setup](#installation-and-setup)
- [Usage](#usage)
- [File Structure](#file-structure)
- [Custom Features (Homebrew)](#custom-features-homebrew)
- [Technical Notes](#technical-notes)

---

<a name="overview"></a>
## 🗺 Overview

**DiceRoll** is a desktop-only web application developed to digitize and enhance the Dungeons & Dragons 5th Edition gaming experience. The project was born from the need to have an interactive, complete, and browser-accessible character sheet — with no installation required.

The application consists of a static frontend (HTML + CSS + JavaScript) and a Python WebSocket server that handles real-time communication between members of the same adventuring party.

---

<a name="features"></a>
## ✨ Features

### Character Sheet
- **Complete Character Information**: name, class, race, background, alignment, level, experience, age, height, weight, skin tone, hair color, eyes
- **Ability Scores**: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma with automatic modifier calculation
- **18 Skills** with proficiency and expertise tracking:
  - Acrobatics, Animal Handling, Arcana, Athletics, Deception, History, Insight, Intimidation, Investigation, Medicine, Nature, Perception, Performance, Persuasion, Religion, Sleight of Hand, Stealth, Survival
  - Automatic modifier calculation based on linked ability score
  - Proficiency tracking (2-state checkbox: proficiency and expertise/double proficiency)

- **Complete Combat System**:
  - Hit Points: current, maximum, and temporary, with visualization bars
  - Base and temporary Armor Class
  - Initiative calculated from the Dexterity modifier
  - Customizable movement speed
  - Hit Dice with type selection (d4 → d20)
  - **Death Saving Throws**: visual tracker for 3 successes and 3 failures

- **Weapons**: name, attack bonus, damage formula (e.g., `1d8+2`)
- **Character Images**: support for multiple images with forward/backward navigation and enlarged lightbox view

### Equipment and Notes
- **150-slot Inventory**: complete management of items, weapons, armor, and equipment with visual space tracking
- **Complete Monetary System** with the five official D&D 5e currencies:
  - Copper Pieces (CP)
  - Silver Pieces (SP)
  - Electrum Pieces (EP)
  - Gold Pieces (GP)
  - Platinum Pieces (PP)
- **Traits and Features**: rich text area for documenting class features, background features, racial traits, feats, and other special abilities
- **Player Notes**: personal space for annotations, personal objectives, secrets, and session notes

### Spells
- **Spellcasting Ability**: choose the primary ability score (STR, DEX, CON, INT, WIS, CHA) with automatic calculation of the Spell Save DC and Spell Attack Bonus
- **Cantrips**: dedicated section with counter
- **Spells by Level**: organized from 1st to 9th level with tab navigation
  - Separate counters for known and prepared spells
  - Spell slot tracking (used/available) per level
  - Progressive slot visualization for slot-based casters (wizard, sorcerer, cleric, etc.)
- **Real-time Calculation**: Spell Save DC and Spell Attack Bonus update automatically when the spellcasting ability changes

### Maps
- **Multiple Map Management**: load multiple maps for consultation during gameplay
- **Two Visualization Modes**:
  - **View Mode**: map consultation with already-placed markers
  - **Placement Mode**: interactive marker placement on maps

- **Categorized Marker System** with distinct colors:
  - 🟡 **Main Quest** (Yellow): main campaign quests
  - 🟣 **Personal Quest** (Purple): individual player side quests
  - 🟢 **Sub Quest** (Green): secondary missions
  - 🔵 **Shop** (Blue): shops, taverns, inns
  - 🔴 **Boss** (Red): important enemies, dungeons, dangerous zones
  - 🩵 **Item** (Cyan): items, treasures, and artifacts

- **Marker Management**: click to place, rename via dedicated modal, delete
- **Control Panel**: marker type legend and complete list of all points on the current map
- **Supported Formats**: PNG, JPG, WebP

### Ability Scaling *(Homebrew Feature)*
- **Skills Customization**: reconfigure which ability score governs each of the 18 skills
- **Use Cases**:
  - Homebrew classes with alternative mechanics
  - Campaigns with specific house rules (e.g., Acrobatics based on WIS instead of DEX)
  - Modified game systems where skills follow different rules
- For each skill, select the governing ability from a dropdown; modifiers update automatically in real time

### Dungeon Master
- **NPC Statistics Panel**: complete management of NPCs and enemies, independent from the player's character sheet
  - Hit Points and Armor Class
  - Customizable Initiative
  - Proficiency Bonus
  - Six independent ability scores (STR, DEX, CON, INT, WIS, CHA) with automatic modifier calculation

- **Advanced Dice Calculator**:
  - Complete syntax: `2d6+4`, `1d20-1`, `3d8` (supports spaces and complex combinations)
  - Quick-roll buttons for standard dice (d4, d6, d8, d10, d12, d20, d100)
  - **Visual roll log** for session consultation
  - Shows total result and breakdown of each die

- **DM Image Gallery**: load images of monsters, NPCs, battle scenes, and artwork to display to players during gameplay
- **Private Notes**: notes reserved for the Dungeon Master — plot hooks, story secrets, hidden statistics

### Party Chat *(Local Multiplayer)*
- **Real-Time Connection**: WebSocket communication between players on the same LAN
- **Password-Protected Rooms**: each group creates their own room with a custom password
- **Text Chat**: real-time messages visible to all room participants
- **Image Sharing**: upload and display images directly in the chat (PNG, JPG, WebP)
- **Integrated Dice Rolls**: `/roll` command to roll dice directly in the chat
  - Ex: `/roll 2d20+5` — rolls dice and shows results to everyone
  - Supports the same syntax as the dice calculator
- **Connection Status**: visual Online/Offline indicator with immediate feedback
- **Customizable Chat Background**: personalized background image for the chat (persists across sessions)
- **Auto-reconnection**: in case of connection loss, the client automatically attempts to reconnect
- **Server IP Auto-detect**: button to automatically detect the server IP (requires server to be running)

### Cross-Cutting Features
- **Save to File**: export the character sheet in JSON format
  - **Save**: overwrites the previously opened file (if available)
  - **Save As**: opens the file picker to choose location and name
- **Load from File**: import previously saved character sheets at any time
- **Automatic Auto-save**: backup to the browser's `localStorage` every 60 seconds, as protection against accidental loss
- **Backup Restore**: if the sheet is closed unexpectedly, on next opening the app offers to restore the last auto-save
- **Full Reset**: erases all data and starts fresh (requires confirmation)
- **Light/Dark Theme**: Day Mode / Night Mode switcher with preference saved automatically
- **Bilingual Localization**: real-time switch between Italian and English — all labels, buttons, and tables change language instantly
- **Image Lightbox**: click any image to enlarge it in full-screen mode

---

<a name="project-architecture"></a>
## 🏗 Project Architecture

The project is structured into two main components:

```
Client (Browser)
│
├── index.html      → HTML structure, tab layout, modals
├── style.css       → Custom styles, themes, UI components
├── script.js       → Complete application logic (vanilla JS)
└── lang/
    ├── ita.js      → Italian translation dictionary
    └── eng.js      → English translation dictionary

Server (Python)
│
└── server.py       → WebSocket server for Party Chat
                      + HTTP info endpoint (port 8766)
```

Communication between client and server takes place via JSON messages over **WebSocket** (port `8765`). Handled message types include: `create`, `join`, `leave`, `message`, `ping/pong`.

---

<a name="technologies-used"></a>
## 🛠 Technologies Used

| Component | Technology |
|---|---|
| Page structure | HTML5 |
| Styling and layout | CSS3, Bootstrap 5.3 |
| Client logic | JavaScript (ES6+, Vanilla JS) |
| File saving | File System Access API / Blob Download |
| Local persistence | `localStorage` |
| Internationalization | Custom i18n system (per-language `.js` files) |
| Chat server | Python 3, `asyncio`, `websockets` |
| Real-time protocol | WebSocket (RFC 6455) |

---

<a name="installation-and-setup"></a>
## ⚙️ Installation and Setup

### Desktop Executable Mode

- **Windows**: run `DiceRoll.exe` from the extracted folder

### To Use Party Chat

Party Chat requires the Python WebSocket server for local multiplayer:

1. **Prerequisites**: Python 3.8+ installed on your system
2. **Install WebSocket library**:
   ```bash
   pip install websockets
   ```
3. **Start the server** (from the project folder):
   ```bash
   python server/server.py
   ```
4. The server will print the local IP to share with other players
5. Open the program (browser or .exe) and navigate to the **PARTY** tab
6. Enter the server IP (or use the **Auto-detect** button) and the room password

> **Note on Network**: the server only works on **local LAN** (same WiFi/network) and requires Python to be installed on the system.

---

<a name="usage"></a>
## 📖 Usage

### Saving and Loading

- **Save**: overwrites the previously opened file (if available), otherwise opens the file picker
- **Save As**: always opens the file picker to choose the file name and location
- **Load**: opens a previously saved `.json` file
- **Reset**: fully resets the character sheet (requires confirmation)

On startup, if a recent auto-save containing actual data is found, the application will offer to restore it.

**Save format:** Data is serialized in **JSON** format with the following structure:

```json
{
  "character": {
    "info": { "name": "...", "class": "...", "race": "..." },
    "abilities": { "STR": 10, "DEX": 10, "...": "..." },
    "skills": { "ACROBATICS": { "mod": 0, "proficiency": false, "mastery": false }, "...": "..." },
    "combat": { "hp": { "current": 10, "max": 10, "temp": 0 }, "ac": 10, "initiative": 0 },
    "spells": { "ability": "INT", "slots": { "1": { "used": 0, "total": 0 }, "...": "..." } },
    "equipment": { "items": ["..."], "coins": { "copper": 0, "silver": 0, "...": "..." } },
    "images": { "character": ["..."], "dm": ["..."] },
    "maps": { "images": ["..."], "markers": ["..."] },
    "notes": { "traits": "...", "playerNotes": "...", "dmNotes": "..." }
  },
  "settings": { "theme": "dark", "language": "eng", "particles": true },
  "timestamp": "2026-04-17T10:30:00Z"
}
```

**Local persistence:** An automatic backup is saved to `localStorage` every 60 seconds. It is a non-destructive save; data is only proposed for recovery if the main file is unavailable.

### Network Configuration for Party Chat

Party Chat uses WebSocket on port **8765**. To work properly on LAN:

- All clients and the server must be on the **same local network** (e.g., home WiFi)
- If a firewall is active, port `8765` (TCP) must be opened
<<<<<<< HEAD
- The IP address must be a local network address (e.g., `192.168.X.X`, `10.0.X.X`, `172.16.X.X`)
=======
- The IP address must be one from the internal network (e.g., `192.168.X.X`, `10.0.X.X`, `172.16.X.X`)
>>>>>>> bcd43d303fb6931a3c4113f0b09a36faa3e6cfdd

### Party Chat

1. Start `python server/server.py` on the machine acting as the server
2. All players open `index.html` and navigate to the **PARTY** tab
3. Each player enters their nickname, the room password, and the server IP (or click **Auto-detect**)
4. The first player clicks **Create Party**; others click **Join Party**
5. Inside the chat, players can send messages, share images, and use `/roll XdY+Z`

**Supported WebSocket messages:**
- `create`: creates a new room (requires password and nickname)
- `join`: joins an existing room (requires password and nickname)
- `message`: sends a text or image message to all in the room
- `leave`: leaves the room and disconnects
- `ping/pong`: heartbeat to keep the connection alive (automatic)

### Dice Calculator

The supported syntax in the DM dice panel includes:

```
2d6+4        → rolls 2d6 and adds 4
1d20-1       → rolls 1d20 and subtracts 1
3d8          → rolls 3d8 showing each result individually
d20          → rolls a single d20
```

---

<a name="file-structure"></a>
## 📁 File Structure

```
DiceRoll/
├── client/
│   ├── index.html       → Main application page
│   ├── style.css        → Custom stylesheet
│   ├── script.js        → Complete JavaScript logic
│   ├── main.js          → Electron entry point
│   ├── package.json     → npm dependencies and configuration
│   ├── forge.config.js  → Electron Forge configuration
│   ├── lang/
│   │   ├── ita.js       → Italian translations
│   │   └── eng.js       → English translations
│   └── img/
│       ├── icon.png     → Application icon
│       └── bgChat.png   → Default chat background
├── server/
│   └── server.py        → WebSocket server for Party Chat
├── README.md            → Project documentation
└── LICENSE              → Project license
```

---

<a name="custom-features-homebrew"></a>
## 🎮 Custom Features (Homebrew)

Beyond the official D&D 5e rulebook mechanics, DiceRoll includes several features designed to support campaigns with custom house rules:

- **Ability Scaling**: allows reconfiguring which ability score governs each skill, useful for homebrew classes or house rules
- **Independent DM Panel**: the Dungeon Master has a full set of NPC statistics managed independently from the player's character sheet
- **Party Chat with Dice Rolling**: the integrated chat allows dice to be rolled directly in the conversation, with results visible to all participants

---

<a name="technical-notes"></a>
## 📝 Technical Notes

- Character data is serialized in **JSON** format and can be transferred between game sessions
- The auto-save system uses `localStorage` as a non-destructive backup; the restore modal only appears if the backup contains real data
- The WebSocket server is designed for **local LAN networks**; use over the Internet would require additional configuration (firewall rules, port forwarding, or tunneling)
- Party rooms are identified by the **password** chosen by the creator; different passwords correspond to different rooms
- In the event of a disconnection, the client will automatically attempt to reconnect to the server
- The chat background is saved both in the sheet's JSON file and in `localStorage`, ensuring persistence across sessions

---

*Project developed as a final high school examination project — Academic Year 2025/2026*
