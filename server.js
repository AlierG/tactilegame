const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const GRID_COLS = 42;
const GRID_ROWS = 28;
const INVENTORY_KEYS = ['walkway-1', 'walkway-2', 'walkway-3', 'hint-corner', 'hint-t', 'hint-x'];

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const rooms = new Map();

app.use(express.static(path.join(__dirname, 'tacleweb_online')));

io.on('connection', socket => {
  socket.on('joinRoom', payload => {
    const roomId = normalizeRoomId(payload?.roomId);
    if (!roomId) {
      return;
    }
    socket.join(roomId);
    const room = getOrCreateRoom(roomId);
    socket.emit('roomState', cloneRoomState(room.state));
  });

  socket.on('placeTile', payload => {
    const roomId = normalizeRoomId(payload?.roomId);
    const room = getRoom(roomId);
    if (!room || !Array.isArray(payload?.cells)) {
      return;
    }
    updateRoomGrid(room.state, payload.cells);
    if (typeof payload.inventoryEnabled === 'boolean' && payload.inventory) {
      room.state.inventory = sanitizeInventory(payload.inventory);
      room.state.inventoryEnabled = payload.inventoryEnabled;
    }
    socket.to(roomId).emit('tilePlaced', {
      cells: payload.cells,
      inventory: cloneInventory(room.state.inventory),
      inventoryEnabled: room.state.inventoryEnabled,
    });
  });

  socket.on('resetGrid', payload => {
    const roomId = normalizeRoomId(payload?.roomId);
    const room = getRoom(roomId);
    if (!room) {
      return;
    }
    room.state.grid = createDefaultGrid();
    socket.to(roomId).emit('gridReset');
  });

  socket.on('restartGame', payload => {
    const roomId = normalizeRoomId(payload?.roomId);
    const room = getRoom(roomId);
    if (!room) {
      return;
    }
    room.state.grid = createDefaultGrid();
    room.state.inventory = sanitizeInventory(payload?.inventory);
    room.state.inventoryEnabled = Boolean(payload?.inventoryEnabled);
    socket.to(roomId).emit('gameRestarted', {
      inventory: cloneInventory(room.state.inventory),
      inventoryEnabled: room.state.inventoryEnabled,
    });
  });

  socket.on('inventoryUpdate', payload => {
    const roomId = normalizeRoomId(payload?.roomId);
    const room = getRoom(roomId);
    if (!room || typeof payload?.inventoryEnabled !== 'boolean') {
      return;
    }
    room.state.inventory = sanitizeInventory(payload.inventory);
    room.state.inventoryEnabled = payload.inventoryEnabled;
    socket.to(roomId).emit('inventoryUpdated', {
      inventory: cloneInventory(room.state.inventory),
      inventoryEnabled: room.state.inventoryEnabled,
    });
  });
});

function getOrCreateRoom(roomId) {
  let room = rooms.get(roomId);
  if (!room) {
    room = { state: createDefaultRoomState() };
    rooms.set(roomId, room);
  }
  return room;
}

function getRoom(roomId) {
  if (!roomId) {
    return null;
  }
  return rooms.get(roomId) || null;
}

function normalizeRoomId(roomId) {
  if (typeof roomId !== 'string') {
    return '';
  }
  return roomId.trim();
}

function createDefaultRoomState() {
  return {
    grid: createDefaultGrid(),
    inventory: createEmptyInventory(),
    inventoryEnabled: false,
  };
}

function createDefaultGrid() {
  const grid = [];
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      grid.push({ row, col, tileId: 'empty', color: 'black' });
    }
  }
  return grid;
}

function createEmptyInventory() {
  const inventory = { red: {}, blue: {} };
  ['red', 'blue'].forEach(color => {
    INVENTORY_KEYS.forEach(key => {
      inventory[color][key] = 0;
    });
  });
  return inventory;
}

function sanitizeInventory(rawInventory) {
  const inventory = createEmptyInventory();
  if (!rawInventory) {
    return inventory;
  }
  ['red', 'blue'].forEach(color => {
    INVENTORY_KEYS.forEach(key => {
      const value = Number(rawInventory?.[color]?.[key]);
      inventory[color][key] = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    });
  });
  return inventory;
}

function updateRoomGrid(state, cells) {
  if (!state || !Array.isArray(state.grid)) {
    return;
  }
  cells.forEach(cell => {
    const row = Number(cell?.row);
    const col = Number(cell?.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      return;
    }
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
      return;
    }
    const index = row * GRID_COLS + col;
    const tileId = typeof cell.tileId === 'string' ? cell.tileId : 'empty';
    const color = typeof cell.color === 'string' ? cell.color : 'black';
    state.grid[index] = { row, col, tileId, color };
  });
}

function cloneInventory(inventory) {
  return JSON.parse(JSON.stringify(inventory || createEmptyInventory()));
}

function cloneRoomState(state) {
  return {
    grid: state?.grid ? JSON.parse(JSON.stringify(state.grid)) : createDefaultGrid(),
    inventory: cloneInventory(state?.inventory),
    inventoryEnabled: Boolean(state?.inventoryEnabled),
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
