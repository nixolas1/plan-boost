type MessageHandler = (msg: any) => void;

let socket: WebSocket | null = null;
let handlers: MessageHandler[] = [];
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function getWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/ws`;
}

function connect() {
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) return;

  socket = new WebSocket(getWsUrl());

  socket.onopen = () => {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handlers.forEach((h) => h(msg));
    } catch { /* ignore parse errors */ }
  };

  socket.onclose = () => {
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
}

function scheduleReconnect() {
  if (!reconnectTimer) {
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 2000);
  }
}

export function onMessage(handler: MessageHandler): () => void {
  handlers.push(handler);
  if (!socket) connect();
  return () => {
    handlers = handlers.filter((h) => h !== handler);
  };
}

export function initWs() {
  connect();
}
