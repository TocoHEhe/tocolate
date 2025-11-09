const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const LOG_FILE = path.join(__dirname, 'chatlog.json');

// Load tin nhắn cũ từ file
let chatHistory = [];
try {
  if (fs.existsSync(LOG_FILE)) {
    chatHistory = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  }
} catch (e) {
  console.error('❌ Không đọc được chatlog.json:', e);
}

// Lưu tin nhắn vào file
function saveChatLog() {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(chatHistory, null, 2));
  } catch (e) {
    console.error('❌ Ghi file chatlog thất bại:', e);
  }
}

// Serve static web
app.use(express.static(path.join(__dirname)));

// Endpoint hiển thị tên máy
app.get('/whoami', (req, res) => {
  res.json({ hostname: os.hostname() });
});

// Socket.io xử lý chat realtime
io.on('connection', (socket) => {
  console.log('✅ Client kết nối:', socket.id);

  // Gửi lịch sử chat khi mới kết nối
  socket.emit('chat:history', chatHistory);

  // Nhận tin nhắn mới
  socket.on('chat:msg', (msg) => {
    const message = { ...msg, ts: Date.now() };
    chatHistory.push(message);
    saveChatLog();
    io.emit('chat:msg', message); // gửi cho tất cả
  });

  socket.on('disconnect', () => {
    console.log('❌ Client ngắt:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
