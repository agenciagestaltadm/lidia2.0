// ============================================================
// UTILITÁRIOS DE CRIPTOGRAFIA END-TO-END
// LIDIA 2.0 - Chat Corporativo Interno
// ============================================================

/**
 * NOTA SOBRE CRIPTOGRAFIA:
 * Este sistema usa AES-256-GCM para criptografia simétrica das mensagens.
 * Em um sistema E2E completo, as chaves devem ser trocadas via ECDH.
 * Para simplificar esta implementação, usamos chaves derivadas do session
 * do usuário, com rotação periódica.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * Gera uma chave de criptografia a partir de uma senha/seed
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Importar a senha como chave base
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Converter Uint8Array para ArrayBuffer
  const saltBuffer = salt.slice().buffer as ArrayBuffer;

  // Derivar a chave AES-GCM
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Gera um salt aleatório
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Gera um IV aleatório
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Converte ArrayBuffer para string base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converte string base64 para ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Converte Uint8Array para base64
 */
export function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

/**
 * Criptografa uma mensagem
 */
export async function encryptMessage(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = generateIV();
  const data = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.slice().buffer as ArrayBuffer },
    key,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: uint8ArrayToBase64(iv),
  };
}

/**
 * Descriptografa uma mensagem
 */
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const encryptedData = base64ToArrayBuffer(ciphertext);
  const ivData = base64ToArrayBuffer(iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivData },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Criptografa uma mensagem com senha (convenience method)
 */
export async function encryptWithPassword(
  plaintext: string,
  password: string
): Promise<EncryptedData> {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);
  const { ciphertext, iv } = await encryptMessage(plaintext, key);

  return {
    ciphertext,
    iv,
    salt: uint8ArrayToBase64(salt),
  };
}

/**
 * Descriptografa uma mensagem com senha (convenience method)
 */
export async function decryptWithPassword(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  const saltBuffer = base64ToArrayBuffer(encryptedData.salt);
  const saltArray = new Uint8Array(saltBuffer);
  const key = await deriveKey(password, saltArray);
  return decryptMessage(encryptedData.ciphertext, encryptedData.iv, key);
}

/**
 * Gera uma chave mestra para o usuário
 * Esta chave deve ser armazenada de forma segura (localStorage com cuidado,
 * ou melhor, em memória apenas)
 */
export async function generateMasterKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Importa uma chave mestra para uso
 */
export async function importMasterKey(keyBase64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(keyBase64);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Hash de uma string usando SHA-256
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hash);
}

// ============================================================
// GERENCIAMENTO DE CHAVES NO CLIENTE
// ============================================================

const STORAGE_KEY = 'lidia_chat_encryption_key';

/**
 * Armazena a chave de criptografia (usar com cautela - preferir memória)
 */
export function storeEncryptionKey(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY, key);
    } catch (e) {
      console.error('Failed to store encryption key:', e);
    }
  }
}

/**
 * Recupera a chave de criptografia
 */
export function getEncryptionKey(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(STORAGE_KEY);
  }
  return null;
}

/**
 * Remove a chave de criptografia
 */
export function clearEncryptionKey(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Inicializa ou recupera a chave de criptografia
 */
export async function initializeEncryption(): Promise<CryptoKey> {
  let keyBase64 = getEncryptionKey();
  
  if (!keyBase64) {
    keyBase64 = await generateMasterKey();
    storeEncryptionKey(keyBase64);
  }
  
  return importMasterKey(keyBase64);
}

// ============================================================
// FUNÇÕES ESPECÍFICAS PARA O CHAT
// ============================================================

/**
 * Criptografa uma mensagem para envio
 */
export async function encryptChatMessage(
  content: string,
  encryptionKey?: CryptoKey
): Promise<{ encrypted: string; iv: string }> {
  const key = encryptionKey || await initializeEncryption();
  const result = await encryptMessage(content, key);
  return {
    encrypted: result.ciphertext,
    iv: result.iv,
  };
}

/**
 * Descriptografa uma mensagem recebida
 */
export async function decryptChatMessage(
  encryptedContent: string,
  iv: string,
  encryptionKey?: CryptoKey
): Promise<string> {
  try {
    const key = encryptionKey || await initializeEncryption();
    return await decryptMessage(encryptedContent, iv, key);
  } catch (error) {
    console.error('Failed to decrypt message:', error);
    return '[Mensagem criptografada - não foi possível descriptografar]';
  }
}

/**
 * Verifica se a criptografia está disponível no navegador
 */
export function isEncryptionAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined'
  );
}
