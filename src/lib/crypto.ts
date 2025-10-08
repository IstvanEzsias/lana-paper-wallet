import * as elliptic from 'elliptic';
import CryptoJS from 'crypto-js';
import { bech32 } from 'bech32';

// Initialize secp256k1 elliptic curve
const ec = new elliptic.ec('secp256k1');

// Utility functions
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// SHA-256 hash function using Web Crypto API
async function sha256(hex: string): Promise<string> {
  const buffer = hexToBytes(hex);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// RIPEMD160 hash function
function ripemd160(data: string): string {
  return CryptoJS.RIPEMD160(CryptoJS.enc.Hex.parse(data)).toString();
}

// Double SHA-256 hash (used for checksums)
async function sha256d(data: Uint8Array): Promise<Uint8Array> {
  const hex = bytesToHex(data);
  const firstHash = await sha256(hex);
  const secondHash = await sha256(firstHash);
  return hexToBytes(secondHash);
}

// Base58 encoding (matching reference implementation)
function base58Encode(bytes: Uint8Array): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt('0x' + bytesToHex(bytes));
  let encoded = "";
  while (num > 0n) {
    let remainder = num % 58n;
    num = num / 58n;
    encoded = alphabet[Number(remainder)] + encoded;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    encoded = '1' + encoded;
  }
  return encoded;
}

// Base58 decoding (matching reference implementation)
function base58Decode(encoded: string): Uint8Array {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let decoded = 0n;
  let multi = 1n;
  
  for (let i = encoded.length - 1; i >= 0; i--) {
    const char = encoded[i];
    const charIndex = alphabet.indexOf(char);
    if (charIndex === -1) throw new Error('Invalid Base58 character');
    decoded += BigInt(charIndex) * multi;
    multi *= 58n;
  }
  
  const hex = decoded.toString(16);
  const paddedHex = hex.length % 2 ? '0' + hex : hex;
  let bytes = hexToBytes(paddedHex);
  
  // Add leading zeros for '1' characters
  let leadingOnes = 0;
  for (const char of encoded) {
    if (char === '1') leadingOnes++;
    else break;
  }
  
  if (leadingOnes > 0) {
    const leadingZeros = new Uint8Array(leadingOnes);
    const combined = new Uint8Array(leadingZeros.length + bytes.length);
    combined.set(leadingZeros);
    combined.set(bytes, leadingZeros.length);
    bytes = combined;
  }
  
  return bytes;
}

/**
 * Converts WIF (Wallet Import Format) to private key hex
 * Validates checksum and LanaCoin prefix (0xB0)
 */
export async function wifToPrivateKey(wif: string): Promise<string> {
  try {
    // 1. Decode Base58 to bytes
    const decoded = base58Decode(wif);
    
    // 2. Split payload and checksum
    const payload = decoded.slice(0, -4);     // All except last 4 bytes
    const checksum = decoded.slice(-4);       // Last 4 bytes
    
    // 3. Verify checksum using double SHA256
    const computedChecksum = (await sha256d(payload)).slice(0, 4);
    
    // 4. Validate checksum matches
    for (let i = 0; i < 4; i++) {
      if (checksum[i] !== computedChecksum[i]) {
        throw new Error('Invalid WIF checksum');
      }
    }
    
    // 5. Verify LanaCoin prefix (0xB0)
    if (payload[0] !== 0xb0) {
      throw new Error('Invalid LANA WIF prefix - expected 0xB0, got 0x' + payload[0].toString(16));
    }
    
    // 6. Extract 32-byte private key (bytes 1-33)
    const privateKeyBytes = payload.slice(1, 33);
    return bytesToHex(privateKeyBytes);
  } catch (error) {
    throw new Error(`Failed to decode WIF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates public key from private key using secp256k1
 */
function generatePublicKey(privateKeyHex: string): string {
  try {
    // 1. Generate key pair from private key
    const keyPair = ec.keyFromPrivate(privateKeyHex);
    
    // 2. Get public key point
    const pubKeyPoint = keyPair.getPublic();
    
    // 3. Format as uncompressed public key (04 + X + Y coordinates)
    return "04" + 
           pubKeyPoint.getX().toString(16).padStart(64, '0') + 
           pubKeyPoint.getY().toString(16).padStart(64, '0');
  } catch (error) {
    throw new Error(`Failed to generate public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates LanaCoin address from public key
 * Uses Hash160 (SHA256 + RIPEMD160) with version byte 0x30
 */
async function generateLanaAddress(publicKeyHex: string): Promise<string> {
  try {
    // 1. SHA-256 hash of public key
    const sha256Hash = await sha256(publicKeyHex);
    
    // 2. RIPEMD160 hash of SHA-256 result
    const hash160 = ripemd160(sha256Hash);
    
    // 3. Add LanaCoin version byte (0x30 = 48 decimal)
    const versionedPayload = "30" + hash160;
    
    // 4. Calculate checksum (double SHA-256)
    const firstHash = await sha256(versionedPayload);
    const checksum = await sha256(firstHash);
    
    // 5. Encode with Base58Check
    const finalAddress = base58Encode(hexToBytes(versionedPayload + checksum.substring(0, 8)));
    return finalAddress;
  } catch (error) {
    throw new Error(`Failed to generate LANA address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Derives Nostr x-only public key from private key
 */
function deriveNostrPublicKey(privateKeyHex: string): string {
  try {
    // 1. Generate key pair from private key
    const keyPair = ec.keyFromPrivate(privateKeyHex);
    
    // 2. Get public key point
    const pubKeyPoint = keyPair.getPublic();
    
    // 3. Extract x-only public key (32 bytes)
    const xOnlyPublicKey = pubKeyPoint.getX().toString(16).padStart(64, '0');
    
    return xOnlyPublicKey;
  } catch (error) {
    throw new Error(`Failed to derive Nostr public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Converts hex public key to Nostr npub format using bech32
 */
function hexToNpub(hexPubKey: string): string {
  try {
    // 1. Convert hex to bytes
    const pubKeyBytes = hexToBytes(hexPubKey);
    
    // 2. Convert bytes to bech32 5-bit groups
    const words = bech32.toWords(pubKeyBytes);
    
    // 3. Encode with 'npub' prefix
    return bech32.encode('npub', words);
  } catch (error) {
    throw new Error(`Failed to convert to npub format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main conversion function - converts WIF private key to Wallet ID and Nostr identifiers
 */
export interface ConversionResult {
  walletId: string;
  nostrHexId: string;
  nostrNpubId: string;
  privateKeyHex: string;
}

export async function convertWifToIds(wif: string): Promise<ConversionResult> {
  try {
    // Step 1: Extract private key from WIF
    const privateKeyHex = await wifToPrivateKey(wif);
    
    // Step 2: Generate public key
    const publicKeyHex = generatePublicKey(privateKeyHex);
    
    // Step 3: Generate LanaCoin Wallet ID
    const walletId = await generateLanaAddress(publicKeyHex);
    
    // Step 4: Derive Nostr identifiers
    const nostrHexId = deriveNostrPublicKey(privateKeyHex);
    const nostrNpubId = hexToNpub(nostrHexId);
    
    return {
      walletId,
      nostrHexId,
      nostrNpubId,
      privateKeyHex
    };
  } catch (error) {
    throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates if a string looks like a valid WIF private key
 */
export async function isValidWifFormat(wif: string): Promise<boolean> {
  try {
    // Basic format checks
    if (!wif || typeof wif !== 'string') return false;
    if (wif.length < 50 || wif.length > 55) return false;
    
    // Try to decode - this will throw if invalid
    await wifToPrivateKey(wif);
    return true;
  } catch {
    return false;
  }
}