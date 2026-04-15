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
- Gestione completa delle **informazioni anagrafiche** del personaggio (nome, classe, razza, background, allineamento, livello, XP, caratteristiche fisiche)
- Calcolo automatico dei **modificatori** per ciascuna delle sei caratteristiche principali (Forza, Destrezza, Costituzione, Intelligenza, Saggezza, Carisma)
- Calcolo automatico di **tiri salvezza**, **abilità** e **percezione passiva** in base ai modificatori
- Tracciamento di **competenze** e **maestrie** per le abilità
- Gestione dei **punti ferita** (attuali, massimi, temporanei), della **Classe Armatura** (standard e temporanea) e dei **dadi vita**
- Sistema di **tiri salvezza contro la morte** (3 successi / 3 fallimenti)
- Gestione dell'**iniziativa** e della **velocità** di movimento
- Sezione **armi** con nome, bonus all'attacco e formula del danno
- Caricamento e visualizzazione di **immagini del personaggio** (più immagini, navigazione avanti/indietro)

### Equipaggiamento e Appunti
- Inventario con **150 slot** per oggetti ed equipaggiamento
- Gestione delle **monete** nelle cinque valute del gioco (Rame, Argento, Electrum, Oro, Platino)
- Area testuale per **tratti e caratteristiche** di classe e background
- Area testuale per gli **appunti del giocatore**

### Incantesimi
- Selezione della **caratteristica da incantatore** (FOR, DES, COS, INT, SAG, CAR)
- Calcolo automatico della **CD degli incantesimi** e del **bonus all'attacco con incantesimi**
- Contatori per trucchetti conosciuti, incantesimi conosciuti e incantesimi preparati
- Gestione dei **trucchetti** (cantrip)
- Gestione degli **incantesimi suddivisi per livello** (dal 1° al 9°) con navigazione a tab
- Tracciamento degli **slot incantesimo** per livello (usati/disponibili)

### Mappe
- Caricamento di **immagini mappa** (supporto multiplo)
- **Modalità visuale** per consultare la mappa
- **Modalità piazzamento marker** con sei tipologie categorizzate:
  - 🟡 Main Quest
  - 🟣 Personal Quest
  - 🟢 Sub Quest
  - 🔵 Shop
  - 🔴 Boss
  - 🩵 Item
- Gestione e rinomina dei marker tramite modale dedicato
- Pannello **gestione marker** con legenda e lista completa

### Scaling Abilità *(Funzionalità Homebrew)*
- Personalizzazione della **caratteristica base** per ciascuna delle 18 abilità di gioco
- Consente di dissociare un'abilità dalla sua caratteristica standard (es: Acrobazia basata su INT invece di FOR)
- Utile per campagne con regole personalizzate

### Dungeon Master
- Pannello **statistiche NPC** con HP, CA, iniziativa, bonus competenza e sei caratteristiche indipendenti
- **Calcolatore dadi** con sintassi estesa (`XdY+Z`, modificatori positivi e negativi)
- Pulsanti rapidi per i dadi standard (d4, d6, d8, d10, d12, d20, d100)
- Log visuale dei risultati dei tiri
- Galleria **immagini DM** (per mostri, PNG, scene)
- Area **appunti riservati** del Dungeon Master

### Party Chat *(Multiplayer)*
- Connessione a un server WebSocket locale o in rete LAN
- Creazione e accesso alle stanze protette da **password**
- **Chat testuale in tempo reale** tra i membri del party
- Invio di **immagini** nella chat
- Tiro dadi integrato nella chat tramite il comando `/roll` (es: `/roll 2d6+3`)
- Indicatore di stato connessione (Online / Offline)
- **Sfondo personalizzabile** per la finestra di chat (persistente tra sessioni)
- Riconnessione automatica in caso di perdita del segnale
- **Auto-detect IP server** tramite pulsante dedicato (richiede server avviato)

### Funzionalità Trasversali
- **Salvataggio** su file JSON (tramite File System Access API o download diretto)
- **Caricamento** di schede precedentemente salvate
- **Autosalvataggio** automatico ogni 60 secondi su `localStorage`
- **Reset** completo della scheda
- **Tema chiaro/scuro** (Day Mode / Night Mode), con preferenza salvata
- **Localizzazione bilingue** (Italiano / Inglese) con switch in tempo reale
- Lightbox per visualizzazione ingrandita delle immagini

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

La comunicazione tra client e server avviene tramite messaggi JSON su **WebSocket** (porta `8765`). I messaggi gestiti includono: `create`, `join`, `leave`, `message`, `ping/pong`.

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

### Prerequisiti
- Un browser moderno (Chrome 86+, Edge 86+, Firefox 90+)
- Python 3.8+ (solo per la funzionalità Party Chat)
- Libreria `websockets` per Python

### Installazione dipendenze Python

```bash
pip install websockets
```

### Avvio del server Party Chat

```bash
python server.py
```

Il server si avvierà sulla porta `8765` e stamperà l'indirizzo IP locale da condividere con i membri del party.

```
============================================================
🚀 SERVER CHAT D&D - AVVIATO
============================================================
📡 WebSocket in ascolto su: 0.0.0.0:8765
🌐 IP locale del server: 192.168.X.X
ℹ️  Info endpoint: http://192.168.X.X:8766/info

📌 I client devono connettersi a: 192.168.X.X
💡 Nel campo 'IP Server' inserire: 192.168.X.X
============================================================
```

### Avvio del client

È sufficiente aprire `index.html` in un browser. Per la Party Chat, inserire l'IP del server nell'apposito campo (o usare il pulsante **Auto-detect**) prima di creare o unirsi a una stanza.

> **Nota:** l'applicazione è progettata per uso **desktop-only**. L'esperienza su mobile non è supportata.

---

<a name="utilizzo"></a>
## 📖 Utilizzo

### Salvataggio e Caricamento

- **Salva**: salva la scheda nel file aperto in precedenza (se disponibile) o apre il selettore file
- **Salva con nome**: apre sempre il selettore per scegliere nome e posizione del file
- **Carica**: apre un file `.json` salvato in precedenza
- **Reset**: azzera completamente la scheda (richiede conferma)

All'apertura, se è presente un autosalvataggio recente **con dati**, l'applicazione propone di ripristinarlo.

### Party Chat

1. Avviare `server.py` sulla macchina che funge da server
2. Tutti i giocatori aprono `index.html` e navigano nella tab **PARTY**
3. Inserire nickname, password della stanza e IP del server (o cliccare **Auto-detect**)
4. Il primo giocatore clicca **Crea Party**; gli altri cliccano **Unisciti al Party**
5. Nella chat è possibile scrivere messaggi, inviare immagini e usare `/roll XdY+Z`

### Calcolatore Dadi

La sintassi supportata nel campo dadi del pannello DM include:

```
2d6+4        → tira 2 dadi da 6 e aggiunge 4
1d20-1       → tira 1 dado da 20 e sottrae 1
3 d8         → tira 3 dadi da 8 mostrando ogni risultato separatamente
d20          → tira un singolo dado da 20
```

---

<a name="struttura-dei-file"></a>
## 📁 Struttura dei File

```
DiceRoll/
├── index.html          → Pagina principale dell'applicazione
├── style.css           → Foglio di stile personalizzato
├── script.js           → Logica JavaScript completa
├── server.py           → Server WebSocket per Party Chat
├── README.md           → Documentazione del progetto
├── lang/
│   ├── ita.js          → Traduzioni in italiano
│   └── eng.js          → Traduzioni in inglese
└── img/
    ├── icon.png         → Icona dell'applicazione
    └── bgChat.png       → Sfondo predefinito della chat
```

---

<a name="funzionalita-custom-homebrew"></a>
## 🎮 Funzionalità Custom (Homebrew)

Oltre alle meccaniche ufficiali del manuale di D&D 5e, DiceRoll include alcune funzionalità pensate per arricchire campagne con regole personalizzate:

- **Scaling Abilità**: permette di riconfigurare quale caratteristica governa ciascuna abilità, utile per classi homebrew o regole house-rules
- **Pannello DM indipendente**: il Dungeon Master dispone di un set completo di statistiche NPC gestibili separatamente dalla scheda del giocatore
- **Party Chat con lancio dadi**: la chat integrata consente di tirare dadi direttamente nella conversazione, rendendo i risultati visibili a tutti i partecipanti

---

<a name="note-tecniche"></a>
## 📝 Note Tecniche

- I dati della scheda vengono serializzati in formato **JSON** e possono essere trasferiti tra sessioni di gioco
- Il sistema di autosalvataggio usa `localStorage` come backup non distruttivo; la modale di ripristino appare solo se il backup contiene dati reali
- Il server WebSocket è progettato per reti **LAN locale**; l'utilizzo su Internet richiederebbe configurazioni aggiuntive (firewall, port forwarding o tunnel)
- Le stanze del Party sono identificate dalla **password** scelta dal creatore; password diverse equivalgono a stanze diverse
- In caso di disconnessione, il client tenta automaticamente la riconnessione al server
- Lo sfondo della chat viene salvato sia nel file JSON della scheda che in `localStorage`, garantendo persistenza tra sessioni

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
- Full management of **character information** (name, class, race, background, alignment, level, XP, physical traits)
- Automatic calculation of **ability modifiers** for each of the six core attributes (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma)
- Automatic calculation of **saving throws**, **skills**, and **passive perception** based on modifiers
- Tracking of **proficiencies** and **masteries** for skills
- Management of **hit points** (current, maximum, temporary), **Armor Class** (base and temporary), and **hit dice**
- **Death saving throws** tracker (3 successes / 3 failures)
- **Initiative** and **movement speed** management
- **Weapons** section with name, attack bonus, and damage formula
- Loading and display of **character images** (multiple images, forward/backward navigation)

### Equipment and Notes
- Inventory with **150 slots** for items and gear
- Management of **currencies** across the five in-game denominations (Copper, Silver, Electrum, Gold, Platinum)
- Text area for **traits and class/background features**
- Text area for **player notes**

### Spells
- Selection of the **spellcasting ability** (STR, DEX, CON, INT, WIS, CHA)
- Automatic calculation of the **spell save DC** and **spell attack bonus**
- Counters for known cantrips, known spells, and prepared spells
- Management of **cantrips**
- Management of **spells organized by level** (1st through 9th) with tab navigation
- Tracking of **spell slots** per level (used/available)

### Maps
- Loading of **map images** (multiple maps supported)
- **View mode** for consulting the map
- **Marker placement mode** with six categorized types:
  - 🟡 Main Quest
  - 🟣 Personal Quest
  - 🟢 Sub Quest
  - 🔵 Shop
  - 🔴 Boss
  - 🩵 Item
- Marker management and renaming via a dedicated modal
- **Marker management panel** with legend and full list view

### Ability Scaling *(Homebrew Feature)*
- Customization of the **base ability** for each of the 18 in-game skills
- Allows dissociating a skill from its standard attribute (e.g., Acrobatics based on INT instead of STR)
- Useful for campaigns with custom house rules

### Dungeon Master
- **NPC statistics panel** with HP, AC, initiative, proficiency bonus, and six independent ability scores
- **Dice calculator** with extended syntax (`XdY+Z`, positive and negative modifiers)
- Quick-roll buttons for standard dice (d4, d6, d8, d10, d12, d20, d100)
- Visual log of roll results
- **DM image gallery** (for monsters, NPCs, scenes)
- **Private notes** area reserved for the Dungeon Master

### Party Chat *(Multiplayer)*
- Connection to a local or LAN WebSocket server
- Room creation and access protected by **password**
- **Real-time text chat** between party members
- **Image sharing** in the chat
- Integrated dice rolling in the chat using the `/roll` command (e.g., `/roll 2d6+3`)
- Connection status indicator (Online / Offline)
- **Customizable chat background** (persistent across sessions)
- Automatic reconnection in case of connection loss
- **Server IP auto-detect** via a dedicated button (requires server to be running)

### Cross-Cutting Features
- **Save** to JSON file (via File System Access API or direct download)
- **Load** previously saved character sheets
- **Auto-save** every 60 seconds to `localStorage`
- Full **reset** of the character sheet
- **Light/dark theme** (Day Mode / Night Mode), with saved preference
- **Bilingual localization** (Italian / English) with real-time switching
- Lightbox for enlarged image viewing

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

### Prerequisites
- A modern browser (Chrome 86+, Edge 86+, Firefox 90+)
- Python 3.8+ (only required for the Party Chat feature)
- The `websockets` Python library

### Installing Python Dependencies

```bash
pip install websockets
```

### Starting the Party Chat Server

```bash
python server.py
```

The server will start on port `8765` and print the local IP address to share with party members.

```
============================================================
🚀 D&D CHAT SERVER - STARTED
============================================================
📡 WebSocket listening on: 0.0.0.0:8765
🌐 Server local IP: 192.168.X.X
ℹ️  Info endpoint: http://192.168.X.X:8766/info

📌 Clients should connect to: 192.168.X.X
💡 Enter in the 'Server IP' field: 192.168.X.X
============================================================
```

### Starting the Client

Simply open `index.html` in a browser. For the Party Chat, enter the server IP in the appropriate field (or use the **Auto-detect** button) before creating or joining a room.

> **Note:** The application is designed for **desktop use only**. Mobile experience is not supported.

---

<a name="usage"></a>
## 📖 Usage

### Saving and Loading

- **Save**: saves the sheet to the previously opened file (if available) or opens the file picker
- **Save As**: always opens the file picker to choose the file name and location
- **Load**: opens a previously saved `.json` file
- **Reset**: fully resets the character sheet (requires confirmation)

On startup, if a recent auto-save containing actual data is found, the application will offer to restore it.

### Party Chat

1. Start `server.py` on the machine acting as the server
2. All players open `index.html` and navigate to the **PARTY** tab
3. Each player enters their nickname, the room password, and the server IP (or click **Auto-detect**)
4. The first player clicks **Create Party**; the others click **Join Party**
5. Inside the chat, players can send messages, share images, and use `/roll XdY+Z`

### Dice Calculator

The supported syntax in the DM dice panel includes:

```
2d6+4        → rolls 2d6 and adds 4
1d20-1       → rolls 1d20 and subtracts 1
3 d8         → rolls 3d8 showing each result individually
d20          → rolls a single d20
```

---

<a name="file-structure"></a>
## 📁 File Structure

```
DiceRoll/
├── index.html          → Main application page
├── style.css           → Custom stylesheet
├── script.js           → Complete JavaScript logic
├── server.py           → WebSocket server for Party Chat
├── README.md           → Project documentation
├── lang/
│   ├── ita.js          → Italian translations
│   └── eng.js          → English translations
└── img/
    ├── icon.png         → Application icon
    └── bgChat.png       → Default chat background
```

---

<a name="custom-features-homebrew"></a>
## 🎮 Custom Features (Homebrew)

Beyond the official D&D 5e rulebook mechanics, DiceRoll includes several features designed to enrich campaigns with custom house rules:

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