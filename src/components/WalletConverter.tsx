import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Key, Wallet, Hash, CheckCircle2, AlertCircle, ScanLine, Info, Printer } from 'lucide-react';
import { convertWifToIds, isValidWifFormat, type ConversionResult } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/QRScanner';
import PrintDocument from '@/components/PrintDocument';

const WalletConverter = () => {
  const [wifInput, setWifInput] = React.useState('');
  const [result, setResult] = React.useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isValidInput, setIsValidInput] = React.useState<boolean | null>(null);
  const [showQRScanner, setShowQRScanner] = React.useState(false);
  const [showNostrData, setShowNostrData] = React.useState(false);
  const [customText, setCustomText] = React.useState('');
  const { toast } = useToast();

  const handleConvert = async () => {
    if (!wifInput.trim()) {
      setError('Please enter a WIF private key');
      return;
    }

    setIsConverting(true);
    setError('');
    setResult(null);

    try {
      const conversionResult = await convertWifToIds(wifInput.trim());
      setResult(conversionResult);
      toast({
        title: "Conversion Successful",
        description: "Your WIF has been converted to Wallet ID and Nostr identifiers.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Conversion failed';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: errorMessage,
      });
    } finally {
      setIsConverting(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy to clipboard",
      });
    }
  };

  const handleQRScan = (data: string) => {
    setWifInput(data);
    setShowQRScanner(false);
    toast({
      title: "QR Code Scanned",
      description: "Private key has been read from QR code",
    });
  };

  const handlePrint = () => {
    if (!result) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot open print window. Check your browser settings.",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lana Wallet - Print</title>
          <meta charset="utf-8">
        </head>
        <body>
          <div id="print-root"></div>
        </body>
      </html>
    `);
    printWindow.document.close();

    const rootElement = printWindow.document.getElementById('print-root');
    if (rootElement) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <PrintDocument
          customText={customText}
          result={result}
          wifInput={wifInput}
          showNostrData={showNostrData}
        />
      );

      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  // Validate WIF input async
  React.useEffect(() => {
    const validateInput = async () => {
      if (!wifInput.trim()) {
        setIsValidInput(null);
        return;
      }
      
      try {
        const valid = await isValidWifFormat(wifInput.trim());
        setIsValidInput(valid);
      } catch {
        setIsValidInput(false);
      }
    };

    const timeoutId = setTimeout(validateInput, 300); // Debounce validation
    return () => clearTimeout(timeoutId);
  }, [wifInput]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 p-6 bg-gradient-card rounded-2xl border shadow-glow">
          <Key className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LanaCoin Key Converter
            </h1>
            <p className="text-muted-foreground">
              Convert WIF private keys to Wallet ID and Nostr identifiers
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <Card className="bg-gradient-card border-border shadow-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            WIF Private Key Input
          </CardTitle>
          <CardDescription>
            Enter your LanaCoin WIF (Wallet Import Format) private key to convert it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wif-input">WIF Private Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="wif-input"
                  type="text"
                  placeholder="e.g., 6vNKUjypr3h3gPWSaa9TU9s3mgDujuaeZtAi63vHq7wGZqH3iH3"
                  value={wifInput}
                  onChange={(e) => setWifInput(e.target.value)}
                  className={`pr-12 ${
                    isValidInput === false ? 'border-destructive' : 
                    isValidInput === true ? 'border-success' : 'border-input'
                  }`}
                />
                {isValidInput !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidInput ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowQRScanner(true)}
                title="Scan QR Code"
              >
                <ScanLine className="h-4 w-4" />
              </Button>
            </div>
            {isValidInput === false && (
              <p className="text-sm text-destructive">
                Invalid WIF format. Please check your input.
              </p>
            )}
          </div>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="show-nostr"
                checked={showNostrData}
                onChange={(e) => setShowNostrData(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <div className="flex-1 space-y-1">
                <Label 
                  htmlFor="show-nostr" 
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Show NOSTR data
                </Label>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    You will only need NOSTR data if you have an account on other NOSTR platforms. 
                    Otherwise, only the LANA Private Key is sufficient, from which you can always 
                    derive NOSTR data later.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleConvert}
            disabled={isConverting || !isValidInput}
            variant="hero"
            size="lg"
            className="w-full"
          >
            {isConverting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                Converting...
              </>
            ) : (
              <>
                <Hash className="h-4 w-4" />
                Convert to IDs
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          <div className="text-center">
            <Badge variant="outline" className="bg-success/10 text-success border-success">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Conversion Complete
            </Badge>
          </div>

          {/* LANA Private Key (WIF) */}
          <Card className="bg-gradient-card border-border shadow-crypto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-crypto">
                <Key className="h-5 w-5" />
                LANA Private Key (WIF)
              </CardTitle>
              <CardDescription>
                Your original LanaCoin private key in WIF format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border">
                <code className="flex-1 text-sm font-mono break-all">
                  {wifInput}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(wifInput, 'LANA Private Key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={wifInput} size={200} level="H" />
              </div>
            </CardContent>
          </Card>

          {/* Wallet ID */}
          <Card className="bg-gradient-card border-border shadow-crypto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-crypto">
                <Wallet className="h-5 w-5" />
                LanaCoin Wallet ID
              </CardTitle>
              <CardDescription>
                Your LanaCoin wallet address derived from the private key
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border">
                <code className="flex-1 text-sm font-mono break-all">
                  {result.walletId}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(result.walletId, 'Wallet ID')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={result.walletId} size={200} level="H" />
              </div>
            </CardContent>
          </Card>

          {/* Nostr Data - Conditionally rendered */}
          {showNostrData && (
            <>
              {/* Nostr HEX ID */}
              <Card className="bg-gradient-card border-border shadow-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Hash className="h-5 w-5" />
                    Nostr HEX ID
                  </CardTitle>
                  <CardDescription>
                    32-byte hexadecimal Nostr public key identifier
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border">
                    <code className="flex-1 text-sm font-mono break-all">
                      {result.nostrHexId}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(result.nostrHexId, 'Nostr HEX ID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG value={result.nostrHexId} size={200} level="H" />
                  </div>
                </CardContent>
              </Card>

              {/* Nostr npub ID */}
              <Card className="bg-gradient-card border-border shadow-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Key className="h-5 w-5" />
                    Nostr npub ID
                  </CardTitle>
                  <CardDescription>
                    Human-readable bech32-encoded Nostr public key (npub format)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border">
                    <code className="flex-1 text-sm font-mono break-all">
                      {result.nostrNpubId}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(result.nostrNpubId, 'Nostr npub ID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG value={result.nostrNpubId} size={200} level="H" />
                  </div>
                </CardContent>
              </Card>

              {/* Nostr Private Key */}
              <Card className="bg-gradient-card border-border shadow-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Key className="h-5 w-5" />
                    Nostr Private Key (HEX)
                  </CardTitle>
                  <CardDescription>
                    32-byte hexadecimal Nostr private key for signing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border">
                    <code className="flex-1 text-sm font-mono break-all">
                      {result.privateKeyHex}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(result.privateKeyHex, 'Nostr Private Key')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG value={result.privateKeyHex} size={200} level="H" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Print Options */}
          <Card className="bg-gradient-card border-border shadow-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Printer className="h-5 w-5" />
                Generate Print Document
              </CardTitle>
              <CardDescription>
                Create an A4 document with wallets and QR codes for secure storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-text">Text at the top (optional)</Label>
                <Textarea
                  id="custom-text"
                  placeholder="e.g. 100 Million Fun"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                {showNostrData 
                  ? "The document will contain 5 cards: LANA Private Key, Wallet ID and 3 NOSTR data fields"
                  : "The document will contain 2 cards: LANA Private Key and Wallet ID"}
              </p>

              <Button 
                onClick={handlePrint}
                variant="hero"
                size="lg"
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                Generate Print Document
              </Button>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>IMPORTANT SECURITY NOTICE:</strong> Store this document securely in THREE separate locations. 
                  Keep it away from moisture, fire, and unauthorized access. Anyone with access to the Private Key can access your funds.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Technical Info */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Cryptographic Process:</strong> Uses secp256k1 elliptic curve with SHA256+RIPEMD160 
            hashing for wallet addresses and x-only public keys for Nostr compatibility.
          </p>
          <p>
            <strong>Security:</strong> All operations are performed client-side. Private keys are never 
            transmitted or stored.
          </p>
          <p>
            <strong>Compatibility:</strong> Generated Wallet IDs use LanaCoin version byte (0x30) and 
            Nostr IDs follow NIP-19 bech32 encoding standards.
          </p>
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <>
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setShowQRScanner(false)}
          />
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowQRScanner(false)}
          />
        </>
      )}
    </div>
  );
};

export default WalletConverter;