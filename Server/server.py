#!/usr/bin/env python3
"""
Server WebSocket per la chat di Party - Versione Corretta e Testata
"""

import asyncio
import json
import logging
import uuid
import socket
from datetime import datetime
from typing import Dict, Optional

import websockets

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# === Modelli con ID univoci ===
class Client:
    def __init__(self, websocket, nickname: str):
        self.id = str(uuid.uuid4())[:8]
        self.websocket = websocket
        self.nickname = nickname
        self.room = None
        self.connected_at = datetime.now()
    
    def __eq__(self, other):
        return self.id == other.id if other else False

class Room:
    def __init__(self, password: str, creator: Client):
        self.id = str(uuid.uuid4())[:8]
        self.password = password
        self.creator_id = creator.id
        self.creator_nickname = creator.nickname
        self.clients: Dict[str, Client] = {creator.id: creator}
        self.created_at = datetime.now()
        self.last_active = datetime.now()
        creator.room = self
        logger.info(f"🏠 Stanza creata: '{password}' (ID: {self.id}) da {creator.nickname}")
    
    @property
    def client_count(self):
        return len(self.clients)
    
    @property
    def client_list(self):
        return [c.nickname for c in self.clients.values()]
    
    def add_client(self, client: Client) -> bool:
        if client.nickname in [c.nickname for c in self.clients.values()]:
            return False
        self.clients[client.id] = client
        client.room = self
        self.last_active = datetime.now()
        return True
    
    def remove_client(self, client: Client) -> bool:
        if client.id not in self.clients:
            return False
        del self.clients[client.id]
        client.room = None
        self.last_active = datetime.now()
        return self.is_empty()
    
    def is_empty(self):
        return len(self.clients) == 0
    
    def is_creator(self, client: Client) -> bool:
        return client.id == self.creator_id
    
    def broadcast(self, message: dict, exclude: Optional[Client] = None):
        """Invia a tutti tranne exclude. Gestisce connessioni chiuse."""
        if not self.clients:
            return
        
        message_str = json.dumps(message)
        
        for client in self.clients.values():
            if client == exclude:
                continue
            try:
                asyncio.create_task(client.websocket.send(message_str))
            except Exception as e:
                logger.warning(f"Impossibile inviare a {client.nickname}: {e}")

# === Gestione server ===
class Server:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.clients: Dict[websockets.WebSocketServerProtocol, Client] = {}
    
    def get_client(self, websocket) -> Optional[Client]:
        return self.clients.get(websocket)
    
    def register_client(self, websocket, nickname: str) -> Client:
        if websocket in self.clients:
            return self.clients[websocket]
        client = Client(websocket, nickname)
        self.clients[websocket] = client
        return client
    
    def unregister_client(self, websocket):
        client = self.clients.pop(websocket, None)
        if client:
            if client.room:
                room = client.room
                should_close = room.remove_client(client)
                if should_close and room.password in self.rooms:
                    del self.rooms[room.password]
                    logger.info(f"Stanza '{room.password}' chiusa (vuota)")
            else:
                logger.info(f"Client {client.nickname} disconnesso senza stanza")
        return client
    
    def create_room(self, password: str, client: Client) -> Optional[Room]:
        if password in self.rooms:
            return None
        if client.room:
            self.leave_room(client)
        room = Room(password, client)
        self.rooms[password] = room
        return room
    
    def join_room(self, password: str, client: Client) -> Optional[Room]:
        room = self.rooms.get(password)
        if not room:
            return None
        if client.room:
            self.leave_room(client)
        if room.add_client(client):
            return room
        return None
    
    def leave_room(self, client: Client):
        if not client or not client.room:
            return
        room = client.room                     # Salva riferimento
        should_close = room.remove_client(client)
        if should_close and room.password in self.rooms:
            del self.rooms[room.password]
            logger.info(f"Stanza '{room.password}' chiusa (vuota)")

# === Istanza globale ===
server = Server()

# === Handlers ===
async def handler(websocket):
    client_addr = websocket.remote_address[0]
    logger.info(f"🔌 Nuova connessione da {client_addr}")
    
    try:
        async for message in websocket:
            await handle_message(websocket, message)
    except websockets.exceptions.ConnectionClosed as e:
        logger.info(f"👋 Connessione chiusa: {client_addr} - {e.code}")
    except Exception as e:
        logger.error(f"Errore nella connessione: {e}")
    finally:
        server.unregister_client(websocket)

async def handle_message(websocket, message):
    try:
        data = json.loads(message)
        msg_type = data.get('type')
        logger.info(f"📨 Ricevuto: {msg_type} da {websocket.remote_address[0]}")
    except json.JSONDecodeError:
        await websocket.send(json.dumps({'type': 'error', 'message': 'JSON non valido'}))
        return
    
    if msg_type == 'create':
        await handle_create(websocket, data)
    elif msg_type == 'join':
        await handle_join(websocket, data)
    elif msg_type == 'leave':
        await handle_leave(websocket, data)
    elif msg_type == 'message':
        await handle_chat(websocket, data)
    elif msg_type == 'ping':
        await websocket.send(json.dumps({'type': 'pong'}))
    else:
        await websocket.send(json.dumps({'type': 'error', 'message': 'Tipo sconosciuto'}))

async def handle_create(websocket, data):
    nickname = data.get('nickname', '').strip()
    password = data.get('password', '').strip()
    
    if not nickname or not password:
        await websocket.send(json.dumps({'type': 'error', 'message': 'Nickname e password obbligatori'}))
        return
    
    client = server.register_client(websocket, nickname)
    room = server.create_room(password, client)
    
    if not room:
        await websocket.send(json.dumps({'type': 'error', 'message': 'Password già in uso'}))
        return
    
    await websocket.send(json.dumps({
        'type': 'created',
        'room_password': password,
        'users': room.client_list,
        'is_creator': True
    }))
    
    logger.info(f"✅ Stanza '{password}' creata da {nickname}")

async def handle_join(websocket, data):
    nickname = data.get('nickname', '').strip()
    password = data.get('password', '').strip()
    
    if not nickname or not password:
        await websocket.send(json.dumps({'type': 'error', 'message': 'Nickname e password obbligatori'}))
        return
    
    client = server.register_client(websocket, nickname)
    room = server.join_room(password, client)
    
    if not room:
        await websocket.send(json.dumps({'type': 'error', 'message': 'Stanza non trovata o nickname già in uso'}))
        return
    
    await websocket.send(json.dumps({
        'type': 'joined',
        'room_password': password,
        'users': room.client_list,
        'is_creator': room.is_creator(client)
    }))
    
    # Notifica agli altri
    room.broadcast({
        'type': 'system',
        'message': f"{nickname} si è unito alla stanza"
    }, exclude=client)
    
    logger.info(f"✅ {nickname} si è unito a '{password}'")

async def handle_leave(websocket, data):
    client = server.get_client(websocket)
    if not client or not client.room:
        await websocket.send(json.dumps({'type': 'error', 'message': 'Non sei in una stanza'}))
        return
    
    room = client.room
    nickname = client.nickname
    logger.info(f"👋 {nickname} sta lasciando la stanza '{room.password}'")
    
    # Rimuovi il client dalla stanza
    server.leave_room(client)
    
    # Conferma al client che ha lasciato
    await websocket.send(json.dumps({
        'type': 'left',
        'message': 'Sei uscito dalla stanza'
    }))
    
    # Notifica agli altri nella stanza (se non vuota)
    if not room.is_empty():
        room.broadcast({
            'type': 'system',
            'message': f"{nickname} ha lasciato la stanza"
        }, exclude=client)
    else:
        # La stanza è già stata rimossa da leave_room
        logger.info(f"Stanza '{room.password}' chiusa perché vuota")

async def handle_chat(websocket, data):
    client = server.get_client(websocket)
    if not client or not client.room:
        await websocket.send(json.dumps({'type': 'error', 'message': 'Non sei in una stanza'}))
        return
    
    # Invia a tutti tranne al mittente
    client.room.broadcast({
        'type': 'chat',
        'nickname': client.nickname,
        'text': data.get('text', ''),
        'image': data.get('image'),
        'dice': data.get('dice'),
        'timestamp': datetime.now().isoformat()
    }, exclude=client)

# === Avvio ===
async def main():
    HOST = "0.0.0.0"
    PORT = 8765
    
    # Ottieni IP locale
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    print("\n" + "="*60)
    print("🚀 SERVER CHAT D&D - AVVIATO")
    print("="*60)
    print(f"📡 In ascolto su: {HOST}:{PORT}")
    print(f"🌐 IP locale del server: {local_ip}")
    print(f"\n📌 I client devono connettersi a: {local_ip}")
    print("="*60 + "\n")
    
    async with websockets.serve(handler, HOST, PORT):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Server fermato")
    except Exception as e:
        print(f"🔥 Errore: {e}")