import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileCode2 } from 'lucide-react';

const TechnicalDocs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-primary">
            <FileCode2 className="h-5 w-5" />
            <span className="text-sm font-medium">Technical Documentation</span>
          </div>
        </div>

        {/* Documentation content */}
        <article className="prose prose-slate dark:prose-invert max-w-none
          prose-headings:text-foreground prose-p:text-muted-foreground
          prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-[#1e1e2e] prose-pre:text-[#cdd6f4] prose-pre:rounded-lg prose-pre:border prose-pre:border-border
          prose-strong:text-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        ">
          <h1>LanaCoin &amp; Nostr Key Derivation</h1>
          <p className="lead text-lg text-muted-foreground">
            Complete technical specifications for deriving LanaCoin wallet addresses and Nostr identifiers
            from a WIF (Wallet Import Format) private key. All cryptographic operations are detailed with
            implementation examples.
          </p>

          <hr className="border-border" />

          <h2>Key Derivation Process</h2>
          <p>From a single WIF private key, you can derive:</p>
          <ol>
            <li><strong>LanaCoin Wallet Address</strong> — For cryptocurrency transactions</li>
            <li><strong>Nostr Public Key (HEX)</strong> — 64-character hexadecimal format</li>
            <li><strong>Nostr Public Key (npub)</strong> — Bech32 encoded format for Nostr protocol</li>
            <li><strong>Nostr Private Key (HEX)</strong> — 64-character hexadecimal format</li>
          </ol>

          <h2>Cryptographic Flow Diagram</h2>
          <pre><code>{`WIF Private Key (Base58)
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
LanaCoin Address`}</code></pre>

          <hr className="border-border" />

          <h2>Step-by-Step Implementation</h2>

          <h3>Step 1: Utility Functions</h3>
          <pre><code className="language-javascript">{`// Convert hexadecimal string to byte array
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
}`}</code></pre>

          <h3>Step 2: WIF Private Key Decoding</h3>
          <pre><code className="language-javascript">{`// Convert WIF to raw private key hex
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
        throw new Error(\`Invalid WIF format: \${error.message}\`);
    }
}`}</code></pre>

          <h3>Step 3: Public Key Generation</h3>
          <pre><code className="language-javascript">{`// Generate uncompressed public key from private key (requires elliptic library)
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
}`}</code></pre>

          <h3>Step 4: LanaCoin Address Generation</h3>
          <pre><code className="language-javascript">{`// Generate LanaCoin wallet address from public key
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
}`}</code></pre>

          <h3>Step 5: Nostr Public Key Formatting</h3>
          <pre><code className="language-javascript">{`// Convert hex public key to npub format (requires bech32 library)
function hexToNpub(hexPubKey) {
    const data = hexToBytes(hexPubKey);
    const words = bech32.toWords(data);
    return bech32.encode('npub', words);
}`}</code></pre>

          <h3>Step 6: Complete Conversion Function</h3>
          <pre><code className="language-javascript">{`// Main function to convert WIF to all derived identifiers
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
        throw new Error(\`Conversion failed: \${error.message}\`);
    }
}`}</code></pre>

          <hr className="border-border" />

          <h2>Required Libraries</h2>
          <h4>Browser</h4>
          <pre><code className="language-html">{`<script src="https://cdnjs.cloudflare.com/ajax/libs/elliptic/6.5.4/elliptic.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bech32@2.0.0/index.js"></script>`}</code></pre>

          <h4>Node.js</h4>
          <pre><code className="language-bash">{`npm install elliptic crypto-js bech32`}</code></pre>

          <hr className="border-border" />

          <h2>Usage Example</h2>
          <pre><code className="language-javascript">{`async function example() {
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
}`}</code></pre>

          <h2>Expected Output Format</h2>
          <pre><code>{`LanaCoin Address: L123ABC... (Base58 encoded, starts with 'L')
Nostr Public Key (HEX): 64-character hexadecimal string
Nostr Public Key (npub): npub1... (Bech32 encoded, starts with 'npub1')
Private Key (HEX): 64-character hexadecimal string`}</code></pre>

          <hr className="border-border" />

          <h2>Security Notes</h2>
          <ol>
            <li><strong>Private Key Security</strong> — Never expose private keys in production</li>
            <li><strong>Entropy</strong> — Use cryptographically secure random number generation</li>
            <li><strong>Validation</strong> — Always validate WIF format before processing</li>
            <li><strong>Error Handling</strong> — Implement proper error handling for all operations</li>
          </ol>

          <h2>Implementation Notes</h2>
          <ul>
            <li>All hash functions use standard cryptographic libraries</li>
            <li>Elliptic curve operations use the <strong>secp256k1</strong> curve</li>
            <li>Base58 encoding follows Bitcoin standards</li>
            <li>Bech32 encoding follows <strong>BIP-173</strong> standards</li>
            <li>LanaCoin uses version byte <code>0x30</code> (48) for addresses</li>
          </ul>
        </article>
      </div>
    </div>
  );
};

export default TechnicalDocs;
