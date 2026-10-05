import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

app.use(express.json());

// Room state storage
interface PlayerState {
  id: string;
  name: string;
  colorIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  inGoal: boolean;
  isPushingRight?: boolean;
  isPushingLeft?: boolean;
  lastUpdate: number;
}

interface RoomState {
  code: string;
  hostId: string;
  currentLevel: number;
  players: Record<string, PlayerState>;
  boxX: number;
  boxY: number;
  boxVx: number;
  keyPickedBy: string | null; // player id holding key
  isDoorOpen: boolean;
  cleared: boolean;
  createdAt: number;
}

const rooms: Record<string, RoomState> = {};

const COLOR_COUNT = 8;

function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

// Cleanup inactive rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const code of Object.keys(rooms)) {
    const room = rooms[code];
    if (Object.keys(room.players).length === 0 && now - room.createdAt > 300000) {
      delete rooms[code];
    }
  }
}, 60000);

// API route for room check / health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    roomsCount: Object.keys(rooms).length,
    timestamp: Date.now(),
  });
});

app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms[code];
  if (!room) {
    return res.status(404).json({ error: 'Sala não encontrada' });
  }
  return res.json({
    code: room.code,
    playersCount: Object.keys(room.players).length,
    level: room.currentLevel,
  });
});

io.on('connection', (socket: Socket) => {
  let currentRoomCode: string | null = null;

  socket.on('create_room', ({ playerName }: { playerName?: string }) => {
    let code = generateRoomCode();
    while (rooms[code]) {
      code = generateRoomCode();
    }

    const room: RoomState = {
      code,
      hostId: socket.id,
      currentLevel: 1,
      players: {},
      boxX: 380,
      boxY: 420,
      boxVx: 0,
      keyPickedBy: null,
      isDoorOpen: false,
      cleared: false,
      createdAt: Date.now(),
    };

    rooms[code] = room;
    currentRoomCode = code;
    socket.join(code);

    const player: PlayerState = {
      id: socket.id,
      name: playerName || 'Player 1',
      colorIndex: 0,
      x: 80,
      y: 400,
      vx: 0,
      vy: 0,
      facing: 'right',
      isGrounded: true,
      inGoal: false,
      lastUpdate: Date.now(),
    };

    room.players[socket.id] = player;

    socket.emit('room_created', {
      code,
      room,
      myId: socket.id,
      isHost: true,
    });

    io.to(code).emit('room_updated', room);
  });

  socket.on('join_room', ({ code, playerName }: { code: string; playerName?: string }) => {
    const upperCode = code.toUpperCase().trim();
    const room = rooms[upperCode];

    if (!room) {
      socket.emit('error_message', { message: 'Sala não encontrada com o código ' + upperCode });
      return;
    }

    const playerIds = Object.keys(room.players);
    if (playerIds.length >= COLOR_COUNT) {
      socket.emit('error_message', { message: 'A sala já está cheia (máx 8 jogadores)' });
      return;
    }

    currentRoomCode = upperCode;
    socket.join(upperCode);

    // Pick an unused color index
    const usedColors = new Set(Object.values(room.players).map((p) => p.colorIndex));
    let colorIndex = 0;
    for (let i = 0; i < COLOR_COUNT; i++) {
      if (!usedColors.has(i)) {
        colorIndex = i;
        break;
      }
    }

    const spawnX = 60 + playerIds.length * 35;
    const player: PlayerState = {
      id: socket.id,
      name: playerName || `Player ${playerIds.length + 1}`,
      colorIndex,
      x: spawnX,
      y: 400,
      vx: 0,
      vy: 0,
      facing: 'right',
      isGrounded: true,
      inGoal: false,
      lastUpdate: Date.now(),
    };

    room.players[socket.id] = player;

    socket.emit('room_joined', {
      code: upperCode,
      room,
      myId: socket.id,
      isHost: room.hostId === socket.id,
    });

    io.to(upperCode).emit('room_updated', room);
    io.to(upperCode).emit('player_joined', { player });
  });

  // Player position & input update
  socket.on('player_update', (data: Partial<PlayerState>) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    const player = room.players[socket.id];
    if (!player) return;

    if (typeof data.x === 'number') player.x = data.x;
    if (typeof data.y === 'number') player.y = data.y;
    if (typeof data.vx === 'number') player.vx = data.vx;
    if (typeof data.vy === 'number') player.vy = data.vy;
    if (data.facing) player.facing = data.facing;
    if (typeof data.isGrounded === 'boolean') player.isGrounded = data.isGrounded;
    if (typeof data.inGoal === 'boolean') player.inGoal = data.inGoal;
    if (typeof data.isPushingRight === 'boolean') player.isPushingRight = data.isPushingRight;
    if (typeof data.isPushingLeft === 'boolean') player.isPushingLeft = data.isPushingLeft;
    player.lastUpdate = Date.now();

    // Broadcast to other players in the room
    socket.to(currentRoomCode).emit('player_moved', {
      id: socket.id,
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      facing: player.facing,
      isGrounded: player.isGrounded,
      inGoal: player.inGoal,
      isPushingRight: player.isPushingRight,
      isPushingLeft: player.isPushingLeft,
    });
  });

  // Synchronized objects state (box, key, door, buttons)
  socket.on('sync_object', (data: { boxX?: number; boxY?: number; boxVx?: number; isDoorOpen?: boolean; keyPickedBy?: string | null }) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];

    if (typeof data.boxX === 'number') room.boxX = data.boxX;
    if (typeof data.boxY === 'number') room.boxY = data.boxY;
    if (typeof data.boxVx === 'number') room.boxVx = data.boxVx;
    if (typeof data.isDoorOpen === 'boolean') room.isDoorOpen = data.isDoorOpen;
    if (data.keyPickedBy !== undefined) room.keyPickedBy = data.keyPickedBy;

    socket.to(currentRoomCode).emit('object_synced', data);
  });

  // Stage action (level change or reset)
  socket.on('change_level', ({ level }: { level: number }) => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    room.currentLevel = level;
    room.cleared = false;
    room.isDoorOpen = false;
    room.keyPickedBy = null;
    room.boxX = 380;
    room.boxY = 420;
    room.boxVx = 0;

    // Reset player positions for the new level
    let idx = 0;
    for (const pid of Object.keys(room.players)) {
      room.players[pid].x = 60 + idx * 35;
      room.players[pid].y = 400;
      room.players[pid].vx = 0;
      room.players[pid].vy = 0;
      room.players[pid].inGoal = false;
      idx++;
    }

    io.to(currentRoomCode).emit('level_changed', {
      level,
      room,
    });
  });

  socket.on('level_cleared', () => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    room.cleared = true;
    io.to(currentRoomCode).emit('level_cleared_event', {
      level: room.currentLevel,
    });
  });

  socket.on('reset_level', () => {
    if (!currentRoomCode || !rooms[currentRoomCode]) return;
    const room = rooms[currentRoomCode];
    room.cleared = false;
    room.isDoorOpen = false;
    room.keyPickedBy = null;
    room.boxX = 380;
    room.boxY = 420;
    room.boxVx = 0;

    let idx = 0;
    for (const pid of Object.keys(room.players)) {
      room.players[pid].x = 60 + idx * 35;
      room.players[pid].y = 400;
      room.players[pid].vx = 0;
      room.players[pid].vy = 0;
      room.players[pid].inGoal = false;
      idx++;
    }

    io.to(currentRoomCode).emit('level_reset', { room });
  });

  socket.on('disconnect', () => {
    if (currentRoomCode && rooms[currentRoomCode]) {
      const room = rooms[currentRoomCode];
      delete room.players[socket.id];

      // If host disconnected, transfer host to next player
      if (room.hostId === socket.id) {
        const remaining = Object.keys(room.players);
        if (remaining.length > 0) {
          room.hostId = remaining[0];
        }
      }

      io.to(currentRoomCode).emit('player_left', {
        id: socket.id,
        hostId: room.hostId,
        remainingCount: Object.keys(room.players).length,
      });

      io.to(currentRoomCode).emit('room_updated', room);

      if (Object.keys(room.players).length === 0) {
        delete rooms[currentRoomCode];
      }
    }
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Pico Friends] Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
});
