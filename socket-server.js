const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ host: '0.0.0.0', port: 8080 }, () => {
  console.log('WS server on port 8080');
});

// simple heartbeat to cull dead connections (mobile hotspot can drop silently)
function heartbeat() { this.isAlive = true; }

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`🔌 Client connected: ${ip}`);
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  ws.on('message', (message, isBinary) => {
    const text = isBinary ? null : message.toString();
    if (text) console.log('RX:', text.slice(0, 200)); // log first 200 chars

    // Try to normalize ESP IMU -> dashboard schema
    let out = message; // default: pass-through (binary or non-JSON)
    if (!isBinary) {
      try {
        const d = JSON.parse(text);

        // If ESP sends flat IMU, wrap it
        if (['ax','ay','az','gx','gy','gz'].every(k => k in d)) {
          out = JSON.stringify({
            type: 'imu',
            accel: [Number(d.ax), Number(d.ay), Number(d.az)],
            gyro:  [Number(d.gx), Number(d.gy), Number(d.gz)],
            roll: Number(d.roll) || 0,
            pitch: Number(d.pitch) || 0,
            yaw: Number(d.yaw) || 0,
          });
        } else {
          // Otherwise, re-broadcast the parsed JSON as-is
          out = JSON.stringify(d);
        }
      } catch {
        // not JSON — just fan it out
      }
    }

    // Broadcast to everyone (including sender; UI is fine with echoes)
    wss.clients.forEach(c => {
      if (c.readyState === c.OPEN) c.send(out, { binary: isBinary });
    });
  });

  ws.on('close', () => console.log(`🔌 Client disconnected: ${ip}`));
});

// ping every 15s; drop if no pong in 30s
const interval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) {
      console.log('⚠️  Terminating stale client');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 15000);

wss.on('close', () => clearInterval(interval));
