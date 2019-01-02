const ws = new WebSocket("ws://localhost:3000/cable");
ws.onerror = console.error;
