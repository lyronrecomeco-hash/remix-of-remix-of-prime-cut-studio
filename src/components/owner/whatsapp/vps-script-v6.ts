// VPS Script v6.0 - Ultra Stable
export const getVPSScriptV6 = (masterToken: string): string => {
  const token = masterToken || 'GNS_' + Math.random().toString(36).substring(2, 34);
  
  return `#!/usr/bin/env node
// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║         GENESIS WHATSAPP BACKEND - v6.0 ULTRA STABLE                              ║
// ║                Ubuntu 24.04 LTS | Baileys Latest                                  ║
// ║              Maximum Stability - Zero Downtime Architecture                       ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const os = require('os');

// ╔═══════════════════════════════════════════════════════════════════════════════════╗
// ║                              CONFIGURAÇÃO                                          ║
// ╚═══════════════════════════════════════════════════════════════════════════════════╝
const PORT = process.env.PORT || 3001;
const MASTER_TOKEN = process.env.MASTER_TOKEN || '${token}';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wvnszzrvrrueuycrpgyc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnN6enJ2cnJ1ZXV5Y3JwZ3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTE4MjYsImV4cCI6MjA4MjM4NzgyNn0.mHs-vau3qsSRLqZ9AmWMsFB5ZLMmd1s003MxdLhBPw0';
const INSTANCE_ID = process.env.INSTANCE_ID || 'default';
const HEARTBEAT_INTERVAL = 20000; // 20s para garantir status sempre atualizado

// ╔═══════════════════════════════════════════════════════════════════════════════════╗
// ║                            INICIALIZAÇÃO                                           ║
// ╚═══════════════════════════════════════════════════════════════════════════════════╝
const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['*'] }));
app.use(express.json({ limit: '50mb' }));

const pinoLogger = pino({ level: 'silent' });

// Estado Global - Thread-safe
let sock = null;
let qrCode = null;
let connectionStatus = 'disconnected';
let phoneNumber = null;
let startTime = Date.now();
let serverIP = 'localhost';
let heartbeatCount = 0;
let lastHeartbeatSuccess = null;
let reconnectAttempts = 0;
let isConnecting = false;
let isShuttingDown = false;

// Exponential backoff para reconexão
const BACKOFF_DELAYS = [3000, 5000, 10000, 30000, 60000, 120000];
const AUTH_FOLDER = path.join(__dirname, 'auth_info_' + INSTANCE_ID);
const STATE_FILE = path.join(__dirname, '.genesis_state_' + INSTANCE_ID + '.json');

// Cores do terminal
const c = {
  reset: '\\x1b[0m', bold: '\\x1b[1m', green: '\\x1b[32m', cyan: '\\x1b[36m',
  yellow: '\\x1b[33m', red: '\\x1b[31m', magenta: '\\x1b[35m', blue: '\\x1b[34m',
  white: '\\x1b[37m', bgGreen: '\\x1b[42m', bgRed: '\\x1b[41m'
};

// Logging
const log = {
  info: (msg) => console.log(c.cyan + '[INFO]' + c.reset + ' ' + msg),
  success: (msg) => console.log(c.green + '[OK]' + c.reset + ' ' + msg),
  warn: (msg) => console.log(c.yellow + '[WARN]' + c.reset + ' ' + msg),
  error: (msg) => console.log(c.red + '[ERROR]' + c.reset + ' ' + msg),
  heartbeat: (msg) => console.log(c.blue + '[♥]' + c.reset + ' ' + msg),
  wa: (msg) => console.log(c.magenta + '[WA]' + c.reset + ' ' + msg),
};

// Persistência de estado
const saveState = () => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ connectionStatus, phoneNumber, lastHeartbeatSuccess, heartbeatCount, savedAt: new Date().toISOString() }, null, 2));
  } catch (e) {}
};

const loadState = () => {
  try {
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {}
  return null;
};

// IP público
const getPublicIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json', { timeout: 5000 });
    return (await response.json()).ip;
  } catch {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) return iface.address;
      }
    }
    return 'localhost';
  }
};

// Banner
const showBanner = async () => {
  serverIP = await getPublicIP();
  console.clear();
  console.log('');
  console.log(c.cyan + '  ╔══════════════════════════════════════════════════════════════════════════╗' + c.reset);
  console.log(c.cyan + '  ║' + c.green + c.bold + '    GENESIS WHATSAPP BACKEND v6.0 - ULTRA STABLE                          ' + c.reset + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ╠══════════════════════════════════════════════════════════════════════════╣' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '  🌐 URL: ' + c.yellow + c.bold + 'http://' + serverIP + ':' + PORT + c.reset + '                                        ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '  🔐 Token: ' + c.yellow + c.bold + MASTER_TOKEN.substring(0, 20) + '...' + c.reset + '                                 ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ║' + c.reset + '  📊 RAM: ' + Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB | CPUs: ' + os.cpus().length + ' | Heartbeat: ' + (HEARTBEAT_INTERVAL/1000) + 's                      ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + '  ╚══════════════════════════════════════════════════════════════════════════╝' + c.reset);
  console.log('');
};

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-instance-token'];
  if (!token || token !== MASTER_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// ╔═══════════════════════════════════════════════════════════════════════════════════╗
// ║                    HEARTBEAT ULTRA-ROBUSTO                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════════════╝
const sendHeartbeat = async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY || isShuttingDown) return;
  
  heartbeatCount++;
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(SUPABASE_URL + '/functions/v1/whatsapp-heartbeat/' + INSTANCE_ID, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-instance-token': MASTER_TOKEN,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      body: JSON.stringify({ status: connectionStatus, phone_number: phoneNumber, uptime_seconds: uptimeSeconds, heartbeat_count: heartbeatCount, version: '6.0' }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      lastHeartbeatSuccess = new Date().toISOString();
      log.heartbeat('Status: ' + c.bold + connectionStatus + c.reset + ' | Uptime: ' + uptimeSeconds + 's | #' + heartbeatCount);
      saveState();
    } else {
      log.warn('Heartbeat retornou ' + response.status);
    }
  } catch (err) {
    if (err.name === 'AbortError') log.warn('Heartbeat timeout');
    else log.error('Heartbeat falhou: ' + err.message);
  }
};

setTimeout(sendHeartbeat, 2000);
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

// ╔═══════════════════════════════════════════════════════════════════════════════════╗
// ║                     CONEXÃO WHATSAPP - ULTRA ESTÁVEL                               ║
// ╚═══════════════════════════════════════════════════════════════════════════════════╝
const connectWhatsApp = async () => {
  if (isConnecting || isShuttingDown) return;
  isConnecting = true;
  
  try {
    log.wa('Iniciando conexão...');
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    
    sock = makeWASocket({
      auth: state,
      logger: pinoLogger,
      browser: ['Genesis VPS v6', 'Chrome', '120.0.0'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: true,
      keepAliveIntervalMs: 25000,
      retryRequestDelayMs: 2000,
      connectTimeoutMs: 60000,
    });
    
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) { qrCode = qr; connectionStatus = 'qr_pending'; log.wa('QR Code gerado!'); sendHeartbeat(); }
      
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        log.error('Desconectado - Código: ' + statusCode);
        connectionStatus = 'disconnected'; qrCode = null; sock = null; isConnecting = false;
        
        if (statusCode === 401 || statusCode === DisconnectReason.loggedOut) {
          log.warn('Sessão inválida - limpando...');
          try { if (fs.existsSync(AUTH_FOLDER)) fs.rmSync(AUTH_FOLDER, { recursive: true, force: true }); } catch (e) {}
          reconnectAttempts = 0;
          setTimeout(connectWhatsApp, 3000);
        } else if (statusCode === 440 || statusCode === DisconnectReason.connectionReplaced) {
          log.error('Conexão substituída por outra sessão');
        } else {
          const delay = BACKOFF_DELAYS[Math.min(reconnectAttempts, BACKOFF_DELAYS.length - 1)];
          reconnectAttempts++;
          log.info('Reconectando em ' + (delay/1000) + 's...');
          setTimeout(connectWhatsApp, delay);
        }
        sendHeartbeat();
      } else if (connection === 'open') {
        console.log(''); console.log(c.bgGreen + c.bold + c.white + '  ✅ WHATSAPP CONECTADO!  ' + c.reset); console.log('');
        connectionStatus = 'connected'; qrCode = null; phoneNumber = sock.user?.id?.split(':')[0] || null;
        reconnectAttempts = 0; isConnecting = false;
        log.success('Número: ' + phoneNumber);
        sendHeartbeat(); saveState();
      }
    });
    
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (msg.key.fromMe) continue;
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[mídia]';
        log.info('📩 ' + msg.key.remoteJid?.split('@')[0] + ': ' + text.substring(0, 50));
      }
    });
  } catch (err) {
    log.error('Erro ao conectar: ' + err.message);
    isConnecting = false; connectionStatus = 'error';
    const delay = BACKOFF_DELAYS[Math.min(reconnectAttempts, BACKOFF_DELAYS.length - 1)];
    reconnectAttempts++;
    setTimeout(connectWhatsApp, delay);
  }
};

// ╔═══════════════════════════════════════════════════════════════════════════════════╗
// ║                              ROTAS API                                             ║
// ╚═══════════════════════════════════════════════════════════════════════════════════╝
app.get('/health', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-instance-token'];
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  if (token && token === MASTER_TOKEN) {
    res.json({ status: 'ok', whatsapp: connectionStatus, phone: phoneNumber, uptime, heartbeats: heartbeatCount, lastHeartbeat: lastHeartbeatSuccess, version: '6.0', stable: true });
  } else {
    res.json({ status: 'ok', version: '6.0' });
  }
});

app.get('/status', authMiddleware, (req, res) => {
  res.json({ connected: connectionStatus === 'connected', status: connectionStatus, phone: phoneNumber, qr: !!qrCode, uptime: Math.floor((Date.now() - startTime) / 1000) });
});

app.get('/qrcode', authMiddleware, (req, res) => {
  if (connectionStatus === 'connected') return res.json({ connected: true, status: 'connected', phone: phoneNumber });
  if (!qrCode && connectionStatus === 'disconnected' && !isConnecting) { connectWhatsApp(); return res.json({ connected: false, qr: null, message: 'Iniciando...' }); }
  res.json({ connected: false, qr: qrCode || null, qrcode: qrCode || null });
});

app.post('/connect', authMiddleware, (req, res) => {
  if (connectionStatus === 'connected') return res.json({ success: true, message: 'Já conectado', phone: phoneNumber });
  if (!isConnecting) connectWhatsApp();
  res.json({ success: true, message: 'Iniciando conexão...' });
});

app.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    if (sock) { await sock.logout(); sock = null; }
    if (fs.existsSync(AUTH_FOLDER)) fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    connectionStatus = 'disconnected'; qrCode = null; phoneNumber = null;
    sendHeartbeat();
    res.json({ success: true, message: 'Desconectado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rotas /api/instance/:id
app.get('/api/instance/:id/qrcode', authMiddleware, (req, res) => {
  if (connectionStatus === 'connected') return res.json({ connected: true, status: 'connected', phone: phoneNumber });
  if (!qrCode && connectionStatus === 'disconnected' && !isConnecting) { connectWhatsApp(); return res.json({ connected: false, qr: null, message: 'Iniciando...' }); }
  res.json({ connected: false, qr: qrCode || null, qrcode: qrCode || null });
});

app.post('/api/instance/:id/qrcode', authMiddleware, (req, res) => {
  if (connectionStatus === 'connected') return res.json({ connected: true, status: 'connected', phone: phoneNumber });
  if (!qrCode && connectionStatus === 'disconnected' && !isConnecting) { connectWhatsApp(); return res.json({ connected: false, qr: null, message: 'Iniciando...' }); }
  res.json({ connected: false, qr: qrCode || null, qrcode: qrCode || null });
});

app.get('/api/instance/:id/status', authMiddleware, (req, res) => {
  res.json({ connected: connectionStatus === 'connected', status: connectionStatus, state: connectionStatus === 'connected' ? 'open' : 'close', phone: phoneNumber, phoneNumber, jid: phoneNumber ? phoneNumber + '@s.whatsapp.net' : null, uptime: Math.floor((Date.now() - startTime) / 1000) });
});

app.post('/api/instance/:id/connect', authMiddleware, (req, res) => {
  if (connectionStatus === 'connected') return res.json({ success: true, message: 'Já conectado', phone: phoneNumber });
  if (!isConnecting) connectWhatsApp();
  res.json({ success: true, message: 'Iniciando conexão...' });
});

app.post('/api/instance/:id/disconnect', authMiddleware, async (req, res) => {
  try {
    if (sock) await sock.logout();
    if (fs.existsSync(AUTH_FOLDER)) fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    connectionStatus = 'disconnected'; qrCode = null; phoneNumber = null; sock = null;
    sendHeartbeat();
    res.json({ success: true, message: 'Desconectado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rotas de envio
app.post('/api/instance/:id/send', authMiddleware, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone e message obrigatórios' });
  if (connectionStatus !== 'connected' || !sock) return res.status(503).json({ error: 'WhatsApp não conectado' });
  try {
    const jid = phone.includes('@') ? phone : phone.replace(/\\D/g, '') + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: message });
    log.success('Enviado para ' + phone);
    res.json({ success: true, to: phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/send', authMiddleware, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'phone e message obrigatórios' });
  if (connectionStatus !== 'connected' || !sock) return res.status(503).json({ error: 'WhatsApp não conectado' });
  try {
    const jid = phone.includes('@') ? phone : phone.replace(/\\D/g, '') + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: message });
    res.json({ success: true, to: phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/instance/:id/send-buttons', authMiddleware, async (req, res) => {
  const { phone, text, buttons, footer } = req.body;
  if (!phone || !text || !buttons) return res.status(400).json({ error: 'Campos obrigatórios' });
  if (connectionStatus !== 'connected' || !sock) return res.status(503).json({ error: 'WhatsApp não conectado' });
  try {
    const jid = phone.includes('@') ? phone : phone.replace(/\\D/g, '') + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text, footer: footer || '', buttons: buttons.map((b, i) => ({ buttonId: b.id || 'btn_' + i, buttonText: { displayText: b.text }, type: 1 })), headerType: 1 });
    res.json({ success: true, to: phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/instance/:id/send-list', authMiddleware, async (req, res) => {
  const { phone, text, buttonText, sections, footer, title } = req.body;
  if (!phone || !text || !buttonText || !sections) return res.status(400).json({ error: 'Campos obrigatórios' });
  if (connectionStatus !== 'connected' || !sock) return res.status(503).json({ error: 'WhatsApp não conectado' });
  try {
    const jid = phone.includes('@') ? phone : phone.replace(/\\D/g, '') + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text, footer: footer || '', title: title || '', buttonText, sections });
    res.json({ success: true, to: phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/send-media', authMiddleware, async (req, res) => {
  const { phone, mediaUrl, caption, type } = req.body;
  if (!phone || !mediaUrl) return res.status(400).json({ error: 'phone e mediaUrl obrigatórios' });
  if (connectionStatus !== 'connected' || !sock) return res.status(503).json({ error: 'WhatsApp não conectado' });
  try {
    const jid = phone.includes('@') ? phone : phone.replace(/\\D/g, '') + '@s.whatsapp.net';
    let msg = {}; const mt = type || 'image';
    if (mt === 'image') msg = { image: { url: mediaUrl }, caption: caption || '' };
    else if (mt === 'video') msg = { video: { url: mediaUrl }, caption: caption || '' };
    else if (mt === 'audio') msg = { audio: { url: mediaUrl }, mimetype: 'audio/mp4' };
    else if (mt === 'document') msg = { document: { url: mediaUrl }, fileName: caption || 'file' };
    await sock.sendMessage(jid, msg);
    res.json({ success: true, to: phone });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Graceful Shutdown
const shutdown = async (signal) => {
  log.warn('Recebido ' + signal + ' - Desligando...');
  isShuttingDown = true;
  connectionStatus = 'disconnected';
  await sendHeartbeat();
  saveState();
  if (sock) try { await sock.end(); } catch (e) {}
  log.success('Encerrado.');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => { log.error('Exceção: ' + err.message); });
process.on('unhandledRejection', (reason) => { log.error('Promise rejeitada: ' + reason); });

// Iniciar
app.listen(PORT, '0.0.0.0', async () => {
  await showBanner();
  const prevState = loadState();
  if (prevState?.phoneNumber) log.info('Restaurando sessão...');
  connectWhatsApp();
});
`;
};
