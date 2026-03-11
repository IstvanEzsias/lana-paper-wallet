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
            from a WIF (Wallet Import Format) private key. LanaCoin supports <strong>two WIF formats</strong>:
            old uncompressed (prefix <code>0xB0</code>) and new compressed (prefix <code>0x41</code>).
            The same private key produces <strong>two different wallet addresses</strong> depending on key type.
          </p>

          <hr className="border-border" />

          <h2>Dual WIF Format Overview</h2>
          <p>LanaCoin uses <strong>two WIF private key formats</strong>:</p>

          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Old Format (Uncompressed)</th>
                  <th>New Format (Compressed)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Version byte</strong></td>
                  <td><code>0xB0</code> (176)</td>
                  <td><code>0x41</code> (65)</td>
                </tr>
                <tr>
                  <td><strong>Starts with</strong></td>
                  <td><code>6</code></td>
                  <td><code>T</code></td>
                </tr>
                <tr>
                  <td><strong>Length</strong></td>
                  <td>51 characters</td>
                  <td>52 characters</td>
                </tr>
                <tr>
                  <td><strong>Payload size</strong></td>
                  <td>33 bytes (version + 32-byte key)</td>
                  <td>34 bytes (version + 32-byte key + <code>0x01</code> flag)</td>
                </tr>
                <tr>
                  <td><strong>Compression flag</strong></td>
                  <td>None</td>
                  <td><code>0x01</code> appended after key</td>
                </tr>
                <tr>
                  <td><strong>Public key type</strong></td>
                  <td>Uncompressed (65 bytes: <code>04</code> + x + y)</td>
                  <td>Compressed (33 bytes: <code>02/03</code> + x)</td>
                </tr>
                <tr>
                  <td><strong>Address prefix</strong></td>
                  <td><code>L</code> (from version <code>0x30</code>)</td>
                  <td><code>L</code> (from version <code>0x30</code>)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <strong>Key insight:</strong> The same 32-byte private key produces two different wallet addresses
            because the public key format (compressed vs uncompressed) affects the Hash160 result.
          </p>

          <hr className="border-border" />

          <h2>Key Derivation Process</h2>
          <p>From a single WIF private key, you can derive:</p>
          <ol>
            <li><strong>Primary LanaCoin Wallet Address</strong> — Matches the WIF compression type</li>
            <li><strong>Secondary LanaCoin Wallet Address</strong> — The other compression type</li>
            <li><strong>Nostr Public Key (HEX)</strong> — 64-character x-only public key</li>
            <li><strong>Nostr Public Key (npub)</strong> — Bech32 encoded for Nostr protocol</li>
            <li><strong>Nostr Private Key (nsec)</strong> — Bech32 encoded private key</li>
          </ol>

          <h2>Cryptographic Flow Diagram</h2>
          <pre><code>{`WIF Private Key (Base58)
         |
    Base58 Decode
         |
   Verify Checksum
         |
  Detect Format:
  0xB0 = Old Uncompressed    0x41 = New Compressed
  (33-byte payload)          (34-byte payload, 0x01 flag)
         |
  Extract Private Key (32 bytes)
         |
    +----+----+-----------------+
    |         |                 |
Uncompressed  Compressed     X-only
Public Key    Public Key    Public Key
(65 bytes)    (33 bytes)    (32 bytes)
04+x+y        02/03+x         x
    |         |                 |
 Hash160   Hash160          Bech32
    |         |             Encode
 +0x30     +0x30               |
    |         |            npub1...
 Base58    Base58
 Check     Check
    |         |
 Address   Address
 (Primary   (Secondary
  if 0xB0)   if 0xB0)
`}</code></pre>

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

          <h3>Step 2: WIF Private Key Decoding (Dual Format)</h3>
          <p>
            The WIF decoder must accept <strong>both</strong> version bytes and detect whether the key
            uses compressed or uncompressed public keys.
          </p>
          <pre><code className="language-javascript">{`// Convert WIF to raw private key hex — supports BOTH formats
// Returns { privateKeyHex, isCompressed }
async function wifToPrivateKey(wif) {
    try {
        // Decode Base58
        const decoded = base58Decode(wif);

        // Extract components
        const payload = decoded.slice(0, -4);   // All except last 4 bytes
        const checksum = decoded.slice(-4);      // Last 4 bytes

        // Verify checksum (double SHA-256)
        const hash = await sha256d(payload);
        const expectedChecksum = hash.slice(0, 4);

        for (let i = 0; i < 4; i++) {
            if (checksum[i] !== expectedChecksum[i]) {
                throw new Error('Invalid WIF checksum');
            }
        }

        // Verify LanaCoin prefix — accept BOTH formats
        //   0xB0 = old uncompressed (altcoin convention: 0x30 + 0x80)
        //   0x41 = new compressed (from chainparams.cpp SECRET_KEY=65)
        if (payload[0] !== 0xB0 && payload[0] !== 0x41) {
            throw new Error('Invalid LANA WIF prefix');
        }

        // Detect compression:
        //   33 bytes = version(1) + key(32) -> uncompressed
        //   34 bytes = version(1) + key(32) + flag(1) -> compressed
        const isCompressed = payload.length === 34 && payload[33] === 0x01;

        // Extract 32-byte private key (bytes 1-33) — same slice for both
        const privateKey = payload.slice(1, 33);
        return { privateKeyHex: bytesToHex(privateKey), isCompressed };

    } catch (error) {
        throw new Error(\`Invalid WIF format: \${error.message}\`);
    }
}`}</code></pre>

          <h4>WIF Format Detection Logic</h4>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Old Format</th>
                  <th>New Format</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>payload[0]</code></td>
                  <td><code>0xB0</code></td>
                  <td><code>0x41</code></td>
                </tr>
                <tr>
                  <td><code>payload.length</code></td>
                  <td>33</td>
                  <td>34</td>
                </tr>
                <tr>
                  <td><code>payload[33]</code></td>
                  <td>N/A</td>
                  <td><code>0x01</code></td>
                </tr>
                <tr>
                  <td><code>isCompressed</code></td>
                  <td><code>false</code></td>
                  <td><code>true</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Step 3: Public Key Generation (Both Types)</h3>
          <pre><code className="language-javascript">{`// Generate UNCOMPRESSED public key (65 bytes: 04 + x + y)
function generatePublicKey(privateKeyHex) {
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.keyFromPrivate(privateKeyHex);
    const pubKeyPoint = keyPair.getPublic();

    return "04" +
           pubKeyPoint.getX().toString(16).padStart(64, '0') +
           pubKeyPoint.getY().toString(16).padStart(64, '0');
}

// Generate COMPRESSED public key (33 bytes: 02/03 + x)
// Prefix: 02 if y is even, 03 if y is odd
function generateCompressedPublicKey(privateKeyHex) {
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.keyFromPrivate(privateKeyHex);
    const pubKeyPoint = keyPair.getPublic();

    const yBN = pubKeyPoint.getY();
    const prefix = yBN.isEven() ? "02" : "03";

    return prefix + pubKeyPoint.getX().toString(16).padStart(64, '0');
}

// Generate Nostr x-only public key (32 bytes: just x)
function deriveNostrPublicKey(privateKeyHex) {
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.keyFromPrivate(privateKeyHex);
    const pubKeyPoint = keyPair.getPublic();

    return pubKeyPoint.getX().toString(16).padStart(64, '0');
}`}</code></pre>

          <h4>Public Key Format Comparison</h4>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Format</th>
                  <th>Used For</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Uncompressed</td>
                  <td>65 bytes</td>
                  <td><code>04</code> + x (32 bytes) + y (32 bytes)</td>
                  <td>Old LANA address (from <code>0xB0</code> WIF)</td>
                </tr>
                <tr>
                  <td>Compressed</td>
                  <td>33 bytes</td>
                  <td><code>02/03</code> + x (32 bytes)</td>
                  <td>New LANA address (from <code>0x41</code> WIF)</td>
                </tr>
                <tr>
                  <td>X-only</td>
                  <td>32 bytes</td>
                  <td>x (32 bytes)</td>
                  <td>Nostr npub / nsec</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Step 4: LanaCoin Address Generation</h3>
          <p>
            The address generation process is identical for both public key types.
            The difference in the resulting address comes from the different Hash160 of
            the compressed vs uncompressed public key.
          </p>
          <pre><code className="language-javascript">{`// Generate LanaCoin wallet address from ANY public key type
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

          <h3>Step 5: Nostr Key Formatting</h3>
          <pre><code className="language-javascript">{`// Convert hex public key to npub format (requires bech32 library)
function hexToNpub(hexPubKey) {
    const data = hexToBytes(hexPubKey);
    const words = bech32.toWords(data);
    return bech32.encode('npub', words);
}

// Convert hex private key to nsec format
function hexToNsec(privateKeyHex) {
    const data = hexToBytes(privateKeyHex);
    const words = bech32.toWords(data);
    return bech32.encode('nsec', words);
}`}</code></pre>

          <h3>Step 6: Complete Dual-Format Conversion</h3>
          <pre><code className="language-javascript">{`// Main function — derives BOTH wallet addresses from a single WIF
async function convertWifToIds(wif) {
    try {
        // Step 1: Extract private key and detect format
        const { privateKeyHex, isCompressed } = await wifToPrivateKey(wif);

        // Step 2: Generate BOTH public key types
        const uncompressedPubKey = generatePublicKey(privateKeyHex);
        const compressedPubKey = generateCompressedPublicKey(privateKeyHex);

        // Step 3: Generate BOTH LanaCoin Wallet IDs
        const uncompressedWalletId = await generateLanaAddress(uncompressedPubKey);
        const compressedWalletId = await generateLanaAddress(compressedPubKey);

        // Primary address matches the WIF compression flag
        const walletId = isCompressed ? compressedWalletId : uncompressedWalletId;

        // Step 4: Derive Nostr identifiers
        const nostrHexId = deriveNostrPublicKey(privateKeyHex);
        const nostrNpubId = hexToNpub(nostrHexId);
        const nostrNsecId = hexToNsec(privateKeyHex);

        return {
            walletId,               // Primary address (matches WIF type)
            compressedWalletId,     // Address from compressed pubkey
            uncompressedWalletId,   // Address from uncompressed pubkey
            isCompressed,           // WIF format detection result
            nostrHexId,             // Nostr public key (hex)
            nostrNpubId,            // Nostr public key (npub)
            nostrNsecId,            // Nostr private key (nsec)
            privateKeyHex           // Raw private key (hex)
        };

    } catch (error) {
        throw new Error(\`Conversion failed: \${error.message}\`);
    }
}`}</code></pre>

          <hr className="border-border" />

          <h2>Address Derivation Summary</h2>
          <p>
            Given the same 32-byte private key, two different LanaCoin addresses are derived:
          </p>
          <pre><code>{`Private Key (32 bytes)
    |
    +---> Uncompressed PubKey (65 bytes: 04+x+y)
    |         |
    |     Hash160 -> Version 0x30 -> Base58Check
    |         |
    |     Address A  (e.g. "LXyz...")
    |
    +---> Compressed PubKey (33 bytes: 02/03+x)
              |
          Hash160 -> Version 0x30 -> Base58Check
              |
          Address B  (e.g. "LWab...")`}</code></pre>
          <p>
            Both addresses are valid and belong to the same private key.
            The WIF format determines which is considered "primary":
          </p>
          <ul>
            <li><strong>Old WIF (prefix <code>6</code>, version <code>0xB0</code>)</strong>: Primary = uncompressed address</li>
            <li><strong>New WIF (prefix <code>T</code>, version <code>0x41</code>)</strong>: Primary = compressed address</li>
          </ul>

          <hr className="border-border" />

          <h2>Required Libraries</h2>
          <h4>Browser</h4>
          <pre><code className="language-html">{`<script src="https://cdnjs.cloudflare.com/ajax/libs/elliptic/6.5.4/elliptic.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bech32@2.0.0/index.js"></script>`}</code></pre>

          <h4>Node.js</h4>
          <pre><code className="language-bash">{`npm install elliptic crypto-js bech32`}</code></pre>

          <hr className="border-border" />

          <h2>Usage Examples</h2>

          <h4>Old Format WIF (Uncompressed)</h4>
          <pre><code className="language-javascript">{`async function exampleOldFormat() {
    // Old WIF starts with '6', prefix 0xB0, 51 characters
    const wif = "6v7y8KLxbYtvcp1PRQXLQBX5778cHVtvhfyjZorLsxp8P9MS97";

    const result = await convertWifToIds(wif);

    console.log("Format: Uncompressed (old)");
    console.log("isCompressed:", result.isCompressed);  // false
    console.log("Primary Address:", result.walletId);    // uncompressed
    console.log("Compressed Address:", result.compressedWalletId);
    console.log("Uncompressed Address:", result.uncompressedWalletId);
}`}</code></pre>

          <h4>New Format WIF (Compressed)</h4>
          <pre><code className="language-javascript">{`async function exampleNewFormat() {
    // New WIF starts with 'T', prefix 0x41, 52 characters
    const wif = "TnR2B1cM3TnR..."; // example compressed WIF

    const result = await convertWifToIds(wif);

    console.log("Format: Compressed (new)");
    console.log("isCompressed:", result.isCompressed);  // true
    console.log("Primary Address:", result.walletId);    // compressed
    console.log("Compressed Address:", result.compressedWalletId);
    console.log("Uncompressed Address:", result.uncompressedWalletId);
}`}</code></pre>

          <h2>Expected Output Format</h2>
          <pre><code>{`Primary Wallet Address:     L... (Base58, starts with 'L')
Compressed Wallet Address:  L... (from compressed pubkey)
Uncompressed Wallet Address: L... (from uncompressed pubkey)
isCompressed:               true/false
Nostr Public Key (HEX):     64-character hexadecimal string
Nostr Public Key (npub):    npub1... (Bech32 encoded)
Nostr Private Key (nsec):   nsec1... (Bech32 encoded)
Private Key (HEX):          64-character hexadecimal string`}</code></pre>

          <hr className="border-border" />

          <h2>Security Notes</h2>
          <ol>
            <li><strong>Private Key Security</strong> — Never expose private keys in production or shared environments</li>
            <li><strong>Entropy</strong> — Use cryptographically secure random number generation (<code>crypto.getRandomValues</code>)</li>
            <li><strong>Validation</strong> — Always validate WIF format and checksum before processing</li>
            <li><strong>Error Handling</strong> — Implement proper error handling for all cryptographic operations</li>
            <li><strong>Both Addresses</strong> — When importing a private key, always check both compressed and uncompressed addresses for existing funds</li>
          </ol>

          <h2>Implementation Notes</h2>
          <ul>
            <li>All hash functions use standard cryptographic libraries</li>
            <li>Elliptic curve operations use the <strong>secp256k1</strong> curve (same as Bitcoin)</li>
            <li>Base58 encoding follows Bitcoin standards (Base58Check)</li>
            <li>Bech32 encoding follows <strong>BIP-173</strong> standards (for Nostr keys)</li>
            <li>LanaCoin uses version byte <code>0x30</code> (48) for addresses and <code>0xB0</code>/<code>0x41</code> for WIF</li>
            <li>The <code>0xB0</code> prefix follows altcoin convention: address version (<code>0x30</code>) + <code>0x80</code></li>
            <li>The <code>0x41</code> prefix comes from <code>chainparams.cpp SECRET_KEY=65</code></li>
            <li>Nostr x-only public keys are derived identically regardless of WIF format</li>
          </ul>
        </article>
      </div>
    </div>
  );
};

export default TechnicalDocs;
