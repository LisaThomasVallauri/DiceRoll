#!/usr/bin/env python3
"""
Server WebSocket per la chat di Party della scheda D&D.
Gestisce stanze protette da password, con scadenza automatica.
Ascolta su tutte le interfacce (0.0.0.0) per accettare connessioni da altri PC.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Optional

import websockets
from websockets import WebSocketServerProtocol

# Configurazione logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# === Modelli dati ===
class Room:
    """Rappresenta una stanza di chat."""
    def __init__(self, password: str, creator: WebSocketServerProtocol, creator_nickname: str):
        self.password = password
        self.creator = creator
        self.creator_nickname = creator_nickname
        self.clients: Dict[WebSocketServerProtocol, str] = {creator: creator_nickname}
        self.last_active = datetime.now()
        self.cleanup_task: Optional[asyncio.Task] = None

    def is_empty(self) -> bool:
        return len(self.clients) == 0

    def add_client(self, websocket: WebSocketServerProtocol, nickname: str) -> None:
        self.clients[websocket] = nickname
        self.last_active = datetime.now()

    def remove_client(self, websocket: WebSocketServerProtocol) -> Optional[str]:
        nickname = self.clients.pop(websocket, None)
        if nickname:
            self.last_active = datetime.now()
        return nickname

    def broadcast(self, message: dict, exclude: Optional[WebSocketServerProtocol] = None) -> None:
        if not self.clients:
            return
        message_str = json.dumps(message)
        recipients = [ws for ws in self.clients.keys() if ws != exclude]
        if recipients:
            websockets.broadcast(recipients, message_str)

    def is_creator(self, websocket: WebSocketServerProtocol) -> bool:
        return websocket == self.creator

# === Gestione stanze ===
class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.client_room: Dict[WebSocketServerProtocol, Room] = {}
        self.cleanup_interval = 300  # 5 minuti

    def create_room(self, password: str, creator: WebSocketServerProtocol, creator_nickname: str) -> Optional[Room]:
        if password in self.rooms:
            return None
        # Se il creatore è già in una stanza, lo rimuoviamo (dovrebbe essere gestito dal client)
        if creator in self.client_room:
            self.leave_room(creator)
        room = Room(password, creator, creator_nickname)
        self.rooms[password] = room
        self.client_room[creator] = room
        logger.info(f"Stanza creata con password '{password}' da {creator_nickname}")
        return room

    def join_room(self, password: str, joiner: WebSocketServerProtocol, joiner_nickname: str) -> Optional[Room]:
        room = self.rooms.get(password)
        if not room:
            return None

        # Controllo nickname duplicato
        if joiner_nickname in room.clients.values():
            # Invia errore al joiner
            asyncio.create_task(joiner.send(json.dumps({
                'type': 'error',
                'message': 'Nickname già in uso in questa stanza'
            })))
            return None

        # Se il joiner era già in un'altra stanza, lo rimuoviamo
        if joiner in self.client_room:
            self.leave_room(joiner)

        room.add_client(joiner, joiner_nickname)
        self.client_room[joiner] = room
        logger.info(f"{joiner_nickname} si è unito alla stanza '{password}'")
        room.broadcast({
            'type': 'system',
            'message': f"{joiner_nickname} si è unito alla stanza."
        }, exclude=joiner)
        return room

    def leave_room(self, websocket: WebSocketServerProtocol) -> Optional[Room]:
        room = self.client_room.pop(websocket, None)
        if not room:
            return None

        nickname = room.remove_client(websocket)
        logger.info(f"{nickname} ha lasciato la stanza '{room.password}'")

        # Se era il creatore, chiudi la stanza immediatamente
        if room.is_creator(websocket):
            logger.info(f"Il creatore {nickname} ha lasciato la stanza '{room.password}': chiusura stanza.")
            self._close_room(room.password, reason="Il creatore ha abbandonato.")
            return None

        # Se la stanza è vuota, programma la cancellazione dopo 5 minuti
        if room.is_empty():
            self._schedule_room_cleanup(room)
        else:
            room.broadcast({
                'type': 'system',
                'message': f"{nickname} ha lasciato la stanza."
            })

        return room

    def _schedule_room_cleanup(self, room: Room) -> None:
        async def cleanup():
            await asyncio.sleep(self.cleanup_interval)
            if room.is_empty():
                logger.info(f"Stanza '{room.password}' vuota da 5 minuti: eliminazione.")
                self._close_room(room.password, reason="Stanza vuota da 5 minuti.")
            else:
                room.cleanup_task = None

        if room.cleanup_task and not room.cleanup_task.done():
            room.cleanup_task.cancel()
        room.cleanup_task = asyncio.create_task(cleanup())

    def _close_room(self, password: str, reason: str = "") -> None:
        room = self.rooms.pop(password, None)
        if not room:
            return

        # Invia messaggio di chiusura a tutti i client
        for ws in list(room.clients.keys()):
            try:
                asyncio.create_task(ws.send(json.dumps({
                    'type': 'closed',
                    'reason': reason
                })))
            except:
                pass
            finally:
                self.client_room.pop(ws, None)
                asyncio.create_task(ws.close(1000, reason))

        if room.cleanup_task and not room.cleanup_task.done():
            room.cleanup_task.cancel()

    def get_room_by_client(self, websocket: WebSocketServerProtocol) -> Optional[Room]:
        return self.client_room.get(websocket)

# === Gestione connessioni WebSocket ===
class ChatServer:
    def __init__(self):
        self.room_manager = RoomManager()

    async def handler(self, websocket: WebSocketServerProtocol):
        logger.info(f"Nuova connessione da {websocket.remote_address}")
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosedOK:
            logger.info(f"Connessione chiusa normalmente da {websocket.remote_address}")
        except websockets.exceptions.ConnectionClosedError as e:
            logger.info(f"Connessione chiusa con errore da {websocket.remote_address}: {e}")
        finally:
            self.room_manager.leave_room(websocket)
            logger.info(f"Connessione terminata: {websocket.remote_address}")

    async def handle_message(self, websocket: WebSocketServerProtocol, message: str):
        try:
            data = json.loads(message)
            msg_type = data.get('type')
        except json.JSONDecodeError:
            await websocket.send(json.dumps({'type': 'error', 'message': 'Formato JSON non valido'}))
            return

        if msg_type == 'create':
            await self.handle_create(websocket, data)
        elif msg_type == 'join':
            await self.handle_join(websocket, data)
        elif msg_type == 'message':
            await self.handle_chat_message(websocket, data)
        elif msg_type == 'ping':
            await websocket.send(json.dumps({'type': 'pong'}))
        else:
            await websocket.send(json.dumps({'type': 'error', 'message': 'Tipo messaggio sconosciuto'}))

    async def handle_create(self, websocket: WebSocketServerProtocol, data: dict):
        password = data.get('password', '').strip()
        nickname = data.get('nickname', '').strip()
        if not password or not nickname:
            await websocket.send(json.dumps({'type': 'error', 'message': 'Password e nickname obbligatori'}))
            return
        room = self.room_manager.create_room(password, websocket, nickname)
        if not room:
            await websocket.send(json.dumps({'type': 'error', 'message': 'Password già in uso'}))
            return
        await websocket.send(json.dumps({
            'type': 'created',
            'success': True,
            'message': f'Stanza "{password}" creata con successo.'
        }))

    async def handle_join(self, websocket: WebSocketServerProtocol, data: dict):
        password = data.get('password', '').strip()
        nickname = data.get('nickname', '').strip()
        if not password or not nickname:
            await websocket.send(json.dumps({'type': 'error', 'message': 'Password e nickname obbligatori'}))
            return
        room = self.room_manager.join_room(password, websocket, nickname)
        if not room:
            # Se il motivo è nickname duplicato, l'errore è già stato inviato
            return
        await websocket.send(json.dumps({
            'type': 'joined',
            'success': True,
            'message': f'Connesso alla stanza "{password}".',
            'users': list(room.clients.values())
        }))

    async def handle_chat_message(self, websocket: WebSocketServerProtocol, data: dict):
        room = self.room_manager.get_room_by_client(websocket)
        if not room:
            await websocket.send(json.dumps({'type': 'error', 'message': 'Non sei in nessuna stanza'}))
            return
        nickname = room.clients.get(websocket, 'Sconosciuto')
        out_msg = {
            'type': 'chat',
            'nickname': nickname,
            'text': data.get('text', ''),
            'image': data.get('image'),
            'dice': data.get('dice'),
            'timestamp': datetime.now().isoformat()
        }
        # Invia a tutti tranne al mittente
        room.broadcast(out_msg, exclude=websocket)

# === Avvio server ===
async def main():
    server = ChatServer()
    async with websockets.serve(server.handler, "0.0.0.0", 8765):
        logger.info("Server WebSocket avviato su ws://0.0.0.0:8765 (accessibile da altri PC sulla rete)")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())