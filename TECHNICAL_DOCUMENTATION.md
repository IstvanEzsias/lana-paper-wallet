# LanaCoin & Nostr Key Derivation - Technical Documentation

## Overview

This document provides complete technical specifications for deriving LanaCoin wallet addresses and Nostr identifiers from a WIF (Wallet Import Format) private key. All cryptographic operations are detailed with implementation examples.

## Key Derivation Process

From a single WIF private key, you can derive:
1. **LanaCoin Wallet Address** - For cryptocurrency transactions
2. **Nostr Public Key (HEX)** - 64-character hexadecimal format
3. **Nostr Public Key (npub)** - Bech32 encoded format for Nostr protocol
4. **Nostr Private Key (HEX)** - 64-character hexadecimal format

## Step-by-Step Implementation

### Step 1: Utility Functions

```javascript
// Convert hexadecimal string to byte array
function hexToBytes(hex) {
    return new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
}

// Convert byte array to hexadecimal string
function bytesToHex(bytes) {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// SHA-256 hash function using Web Crypto API
async function sha256(hex) {
    const buffer = hexToBytes(hex);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return bytesToHex(new Uint8Array(hashBuffer));
}

// Double SHA-256 (SHA-256 of SHA-256)
async function sha256d(data) {
    const firstHash = await crypto.subtle.digest("SHA-256", data);
    const secondHash = await crypto.subtle.digest("SHA-256", firstHash);
    return new Uint8Array(secondHash);
}

// RIPEMD160 hash (requires CryptoJS library)
function ripemd160(data) {
    return CryptoJS.RIPEMD160(CryptoJS.enc.Hex.parse(data)).toString();
}

// Base58 encoding (Bitcoin/LanaCoin standard)
function base58Encode(bytes) {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let num = BigInt('0x' + bytesToHex(bytes));
    let encoded = "";
    
    while (num > 0n) {
        let remainder = num % 58n;
        num = num / 58n;
        encoded = alphabet[Number(remainder)] + encoded;
    }
    
    // Handle leading zeros
    for (const byte of bytes) {
        if (byte !== 0) break;
        encoded = '1' + encoded;
    }
    
    return encoded;
}

// Base58 decoding
function base58Decode(encoded) {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let num = 0n;
    
    for (const char of encoded) {
        const index = alphabet.indexOf(char);
        if (index === -1) throw new Error('Invalid Base58 character');
        num = num * 58n + BigInt(index);
    }
    
    let hex = num.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    
    let bytes = hexToBytes(hex);
    
    // Handle leading '1's (zeros)
    for (const char of encoded) {
        if (char !== '1') break;
        bytes = new Uint8Array([0, ...bytes]);
    }
    
    return bytes;
}
```

### Step 2: WIF Private Key Decoding

```javascript
// Convert WIF to raw private key hex
async function wifToPrivateKey(wif) {
    try {
        // Decode Base58
        const decoded = base58Decode(wif);
        
        // Extract components
        const payload = decoded.slice(0, -4);
        const checksum = decoded.slice(-4);
        
        // Verify checksum
        const hash = await sha256d(payload);
        const expectedChecksum = hash.slice(0, 4);
        
        for (let i = 0; i < 4; i++) {
            if (checksum[i] !== expectedChecksum[i]) {
                throw new Error('Invalid WIF checksum');
            }
        }
        
        // Verify prefix (0xb0 for LanaCoin)
        if (payload[0] !== 0xb0) {
            throw new Error('Invalid WIF prefix');
        }
        
        // Extract private key (32 bytes after prefix)
        const privateKey = payload.slice(1, 33);
        return bytesToHex(privateKey);
        
    } catch (error) {
        throw new Error(`Invalid WIF format: ${error.message}`);
    }
}
```

### Step 3: Public Key Generation

```javascript
// Generate uncompressed public key from private key (requires elliptic library)
function generatePublicKey(privateKeyHex) {
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.keyFromPrivate(privateKeyHex);
    const pubKeyPoint = keyPair.getPublic();
    
    // Return uncompressed format (04 + x + y coordinates)
    return "04" + 
           pubKeyPoint.getX().toString(16).padStart(64, '0') + 
           pubKeyPoint.getY().toString(16).padStart(64, '0');
}

// Generate compressed public key for Nostr (x-only)
function deriveNostrPublicKey(privateKeyHex) {
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.keyFromPrivate(privateKeyHex);
    const pubKeyPoint = keyPair.getPublic();
    
    // Return only x-coordinate (32 bytes)
    return pubKeyPoint.getX().toString(16).padStart(64, '0');
}
```

### Step 4: LanaCoin Address Generation

```javascript
// Generate LanaCoin wallet address from public key
async function generateLanaAddress(publicKeyHex) {
    // Step 1: SHA-256 of public key
    const sha256Hash = await sha256(publicKeyHex);
    
    // Step 2: RIPEMD160 of SHA-256 hash
    const hash160 = ripemd160(sha256Hash);
    
    // Step 3: Add version byte (0x30 = 48 for LanaCoin)
    const versionedPayload = "30" + hash160;
    
    // Step 4: Double SHA-256 for checksum
    const checksum = await sha256(await sha256(versionedPayload));
    
    // Step 5: Take first 4 bytes of checksum
    const finalPayload = versionedPayload + checksum.substring(0, 8);
    
    // Step 6: Base58 encode
    return base58Encode(hexToBytes(finalPayload));
}
```

### Step 5: Nostr Public Key Formatting

```javascript
// Convert hex public key to npub format (requires bech32 library)
function hexToNpub(hexPubKey) {
    const data = hexToBytes(hexPubKey);
    const words = bech32.toWords(data);
    return bech32.encode('npub', words);
}
```

### Step 6: Complete Conversion Function

```javascript
// Main function to convert WIF to all derived identifiers
async function convertWifToIds(wif) {
    try {
        // Step 1: Extract private key from WIF
        const privateKeyHex = await wifToPrivateKey(wif);
        
        // Step 2: Generate public keys
        const publicKeyHex = generatePublicKey(privateKeyHex);
        const nostrHexId = deriveNostrPublicKey(privateKeyHex);
        
        // Step 3: Generate addresses/identifiers
        const walletId = await generateLanaAddress(publicKeyHex);
        const nostrNpubId = hexToNpub(nostrHexId);
        
        return {
            walletId,           // LanaCoin address
            nostrHexId,         // Nostr public key (hex)
            nostrNpubId,        // Nostr public key (npub)
            privateKeyHex       // Private key (hex)
        };
        
    } catch (error) {
        throw new Error(`Conversion failed: ${error.message}`);
    }
}
```

## Required Libraries

```html
<!-- For browser implementation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/elliptic/6.5.4/elliptic.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bech32@2.0.0/index.js"></script>
```

```bash
# For Node.js implementation
npm install elliptic crypto-js bech32
```

## Usage Example

```javascript
async function example() {
    const wif = "6v7y8KLxbYtvcp1PRQXLQBX5778cHVtvhfyjZorLsxp8P9MS97";
    
    try {
        const result = await convertWifToIds(wif);
        
        console.log("LanaCoin Address:", result.walletId);
        console.log("Nostr Public Key (HEX):", result.nostrHexId);
        console.log("Nostr Public Key (npub):", result.nostrNpubId);
        console.log("Private Key (HEX):", result.privateKeyHex);
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}
```

## Expected Output Format

For WIF `6v7y8KLxbYtvcp1PRQXLQBX5778cHVtvhfyjZorLsxp8P9MS97`:

```
LanaCoin Address: L123ABC... (Base58 encoded, starts with 'L')
Nostr Public Key (HEX): 64-character hexadecimal string
Nostr Public Key (npub): npub1... (Bech32 encoded, starts with 'npub1')
Private Key (HEX): 64-character hexadecimal string
```

## Cryptographic Flow Diagram

```
WIF Private Key (Base58)
         ↓
    Base58 Decode
         ↓
   Verify Checksum
         ↓
  Extract Private Key (32 bytes)
         ↓
    ┌─────────────────┐
    ↓                 ↓
Uncompressed       X-only
Public Key      Public Key
(65 bytes)      (32 bytes)
    ↓                 ↓
SHA-256 +         Bech32
RIPEMD160 +       Encode
Version +            ↓
Checksum          npub1...
    ↓
Base58 Encode
    ↓
LanaCoin Address
```

## Security Notes

1. **Private Key Security**: Never expose private keys in production
2. **Entropy**: Use cryptographically secure random number generation
3. **Validation**: Always validate WIF format before processing
4. **Error Handling**: Implement proper error handling for all operations

## Implementation Notes

- All hash functions use standard cryptographic libraries
- Elliptic curve operations use secp256k1 curve
- Base58 encoding follows Bitcoin standards
- Bech32 encoding follows BIP-173 standards
- LanaCoin uses version byte 0x30 (48) for addresses