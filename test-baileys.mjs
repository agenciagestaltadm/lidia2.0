import makeWASocket, { useMultiFileAuthState, Browsers, makeCacheableSignalKeyStore, DisconnectReason } from '@whiskeysockets/baileys';
import { promises as fs } from 'fs';
import path from 'path';

const baileysLogger = {
  level: 'silent',
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: (...args) => console.log('[WARN]', ...args),
  error: (...args) => console.log('[ERROR]', ...args),
  fatal: (...args) => console.log('[FATAL]', ...args),
  child: () => baileysLogger,
};

async function testBaileys() {
  const authPath = path.join(process.cwd(), 'test-wa-session');
  
  // Limpa sessão anterior
  try {
    await fs.rm(authPath, { recursive: true, force: true });
  } catch (e) {}
  
  await fs.mkdir(authPath, { recursive: true });
  
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  
  console.log('Criando socket...');
  
  const sock = makeWASocket({
    printQRInTerminal: true, // Mostra QR no terminal
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
    },
    logger: baileysLogger,
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
  });
  
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    console.log('connection.update:', {
      connection,
      hasQR: !!qr,
      qrLength: qr?.length,
      lastDisconnectStatus: lastDisconnect?.error?.output?.statusCode,
      lastDisconnectError: lastDisconnect?.error?.message,
    });
    
    if (qr) {
      console.log('QR CODE GERADO! Comprimento:', qr.length);
    }
    
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log('Conexão fechada. Status:', statusCode, 'Erro:', lastDisconnect?.error?.message);
      
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log('Tentando reconectar em 5s...');
        setTimeout(testBaileys, 5000);
      }
    }
    
    if (connection === 'open') {
      console.log('CONECTADO!', sock.user);
    }
  });
  
  sock.ev.on('creds.update', saveCreds);
}

testBaileys().catch(console.error);
