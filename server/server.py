#!/usr/bin/env python3
"""
Server WebSocket per la chat di Party - Versione Corretta e Testata
"""

import asyncio
import json
import logging
import uuid
import socket
import signal
from datetime import datetime
from typing import Dict, Optional
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading

import websockets

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# === HTTP Info Server (espone l'IP locale ai client) ===
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return socket.gethostbyname(socket.gethostname())

LOCAL_IP = get_local_ip()

class InfoHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/info':
            body = json.dumps({"ip": LOCAL_IP, "port": 8765}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass  # Silenzia i log HTTP

def start_http_server():
    httpd = HTTPServer(('0.0.0.0', 8766), InfoHandler)
    httpd.serve_forever()

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
        if client.id in self.clients:
            return False  # già nella stanza (stesso oggetto)
        if any(c.id != client.id and c.nickname == client.nickname for c in self.clients.values()):
            return False  # nickname già usato da un altro utente attivo
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
    
    async def broadcast(self, message: dict, exclude: Optional['Client'] = None):
        """Invia a tutti tranne exclude. Gestisce connessioni chiuse."""
        if not self.clients:
            return

        message_str = json.dumps(message)
        dead_ids = []

        for client in list(self.clients.values()):
            if client == exclude:
                continue
            try:
                await client.websocket.send(message_str)
            except websockets.exceptions.ConnectionClosed:
                logger.warning(f"Connessione chiusa per {client.nickname}, rimosso dal broadcast")
                dead_ids.append(client.id)
            except Exception as e:
                logger.warning(f"Impossibile inviare a {client.nickname}: {e}")
                dead_ids.append(client.id)

        # Rimuovi client con connessioni morte solo dopo aver completato il broadcast
        for cid in dead_ids:
            if cid in self.clients:
                logger.info(f"Rimosso client con connessione morta: {self.clients[cid].nickname}")
                del self.clients[cid]

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
    
    async def unregister_client(self, websocket):
        client = self.clients.pop(websocket, None)
        if client:
            if client.room:
                room = client.room
                nickname = client.nickname
                should_close = room.remove_client(client)
                if should_close:
                    if room.password in self.rooms:
                        del self.rooms[room.password]
                        logger.info(f"Stanza '{room.password}' chiusa (vuota dopo disconnessione di {nickname})")
                else:
                    # Notifica gli altri della disconnessione inattesa
                    await room.broadcast({
                        'type': 'system',
                        'messageKey': 'userDisconnected',
                        'params': {'nickname': nickname}
                    })
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
    except websockets.exceptions.ConnectionClosedOK:
        # Chiusura pulita (codice 1000/1001) — es. browser chiuso o leave volontario
        logger.info(f"👋 Disconnessione pulita da {client_addr}")
    except websockets.exceptions.ConnectionClosedError as e:
        # Chiusura anomala — rete caduta, crash del client, ecc.
        logger.warning(f"⚠️ Disconnessione anomala da {client_addr}: {e.code} {e.reason}")
        client = server.get_client(websocket)
        if client and client.room:
            # Notifica la stanza prima di rimuovere il client
            await client.room.broadcast({
                'type': 'system',
                'messageKey': 'userLostConnection',
                'params': {'nickname': client.nickname}
            }, exclude=client)
    except Exception as e:
        logger.error(f"Errore nella connessione {client_addr}: {e}")
    finally:
        await server.unregister_client(websocket)

async def handle_message(websocket, message):
    try:
        data = json.loads(message)
        msg_type = data.get('type')
        logger.info(f"📨 Ricevuto: {msg_type} da {websocket.remote_address[0]}")
    except json.JSONDecodeError:
        await websocket.send(json.dumps({'type': 'error', 'messageKey': 'errInvalidJson'}))
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
        await websocket.send(json.dumps({'type': 'error', 'messageKey': 'errUnknownType'}))

async def handle_create(websocket, data):
    nickname = data.get('nickname', '').strip()
    password = data.get('password', '').strip()
    
    if not nickname or not password:
        await websocket.send(json.dumps({'type': 'error', 'messageKey': 'errNicknamePassword'}))
        return
    
    client = server.register_client(websocket, nickname)
    room = server.create_room(password, client)
    
    if not room:
        await websocket.send(json.dumps({'type': 'error', 'messageKey': 'errPasswordInUse'}))
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
        await websocket.send(json.dumps({'type': 'error', 'messageKey': 'errNicknamePassword'}))
        return
    
    client = server.register_client(websocket, nickname)
    room = server.join_room(password, client)
    
    if not room:
        await websocket.send(json.dumps({'type': 'error', 'messageKey': 'errRoomNotFound'}))
        return
    
    await websocket.send(json.dumps({
        'type': 'joined',
        'room_password': password,
        'users': room.client_list,
        'is_creator': room.is_creator(client)
    }))
    
    # Notifica agli altri
    await room.broadcast({
        'type': 'system',
        'messageKey': 'userJoined',
        'params': {'nickname': nickname}
    }, exclude=client)
    
    logger.info(f"✅ {nickname} si è unito a '{password}'")

async def handle_leave(websocket, data):
    client = server.get_client(websocket)
    if not client or not client.room:
        await websocket.send(json.dumps({'type': 'error', 'messageKey': 'errNotInRoom'}))
        return
    
    room = client.room
    nickname = client.nickname
    logger.info(f"👋 {nickname} sta lasciando la stanza '{room.password}'")
    
    # Rimuovi il client dalla stanza
    server.leave_room(client)
    
    # Conferma al client che ha lasciato
    await websocket.send(json.dumps({
        'type': 'left',
        'messageKey': 'youLeft'
    }))
    
    # Notifica agli altri nella stanza (se non vuota)
    if not room.is_empty():
        await room.broadcast({
            'type': 'system',
            'messageKey': 'userLeft',
            'params': {'nickname': nickname},
            'users': room.client_list
        })
    else:
        logger.info(f"Stanza '{room.password}' chiusa perché vuota dopo uscita di {nickname}")

async def handle_chat(websocket, data):
    client = server.get_client(websocket)
    if not client or not client.room:
        await websocket.send(json.dumps({'type': 'error', 'messageKey': 'errNotInRoom'}))
        return

    image_data = data.get('image')
    if image_data and len(image_data) > 5_000_000:  # ~5 MB in stringa base64
        await websocket.send(json.dumps({'type': 'error', 'messageKey': 'errImageTooLarge'}))
        return

    await client.room.broadcast({
        'type': 'chat',
        'nickname': client.nickname,
        'text': data.get('text', ''),
        'image': image_data,
        'dice': data.get('dice'),
        'timestamp': datetime.now().isoformat()
    }, exclude=client)

# === Avvio ===
async def shutdown(ws_server, loop):
    """Graceful shutdown: notifica tutti i client e chiude le connessioni."""
    logger.info("🛑 Shutdown in corso...")

    # Notifica tutti i client connessi
    notify_tasks = []
    for room in list(server.rooms.values()):
        msg = json.dumps({
            'type': 'closed',
            'reason': 'Il server è stato spento'
        })
        for client in list(room.clients.values()):
            try:
                notify_tasks.append(client.websocket.send(msg))
            except Exception:
                pass

    if notify_tasks:
        await asyncio.gather(*notify_tasks, return_exceptions=True)
        await asyncio.sleep(0.3)  # Breve pausa per permettere l'invio

    # Chiudi tutte le connessioni WebSocket
    close_tasks = []
    for client in list(server.clients.values()):
        try:
            close_tasks.append(client.websocket.close(1001, "Server shutdown"))
        except Exception:
            pass

    if close_tasks:
        await asyncio.gather(*close_tasks, return_exceptions=True)

    ws_server.close()
    await ws_server.wait_closed()
    logger.info("✅ Server chiuso correttamente")


async def main():
    HOST = "0.0.0.0"
    PORT = 8765
    INFO_PORT = 8766

    # Avvia HTTP info server in un thread separato
    http_thread = threading.Thread(target=start_http_server, daemon=True)
    http_thread.start()

    print("\n" + "="*60)
    print("🚀 SERVER CHAT D&D - AVVIATO")
    print("="*60)
    print(f"📡 WebSocket in ascolto su: {HOST}:{PORT}")
    print(f"🌐 IP locale del server: {LOCAL_IP}")
    print(f"ℹ️  Info endpoint: http://{LOCAL_IP}:{INFO_PORT}/info")
    print(f"\n📌 I client devono connettersi a: {LOCAL_IP}")
    print(f"💡 Nel campo 'IP Server' inserire: {LOCAL_IP}")
    print("="*60 + "\n")

    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    # Gestione segnali per graceful shutdown (SIGINT = Ctrl+C, SIGTERM = kill)
    def _signal_handler():
        if not stop_event.is_set():
            logger.info("📡 Segnale di arresto ricevuto")
            stop_event.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _signal_handler)
        except NotImplementedError:
            # Windows non supporta add_signal_handler per tutti i segnali
            pass

    ws_server = await websockets.serve(
        handler, HOST, PORT,
        max_size=10_485_760,
        ping_interval=20,   # invia un ping ogni 20 secondi
        ping_timeout=60     # considera morta la connessione se non risponde entro 60s
    )

    try:
        await stop_event.wait()
    finally:
        await shutdown(ws_server, loop)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Server fermato")
    except Exception as e:
        print(f"🔥 Errore: {e}")
        raise