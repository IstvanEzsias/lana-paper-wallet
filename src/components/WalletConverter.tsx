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
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
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
  const { t, language } = useLanguage();

  const handleConvert = async () => {
    if (!wifInput.trim()) {
      setError(t.errors.enterWif);
      return;
    }

    setIsConverting(true);
    setError('');
    setResult(null);

    try {
      const conversionResult = await convertWifToIds(wifInput.trim());
      setResult(conversionResult);
      toast({
        title: t.toasts.conversionSuccess,
        description: t.toasts.conversionSuccessDesc,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Conversion failed';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: t.toasts.conversionFailed,
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
        title: t.toasts.copied,
        description: `${label} ${t.toasts.copiedDesc}`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t.toasts.copyFailed,
        description: t.toasts.copyFailedDesc,
      });
    }
  };

  const handleQRScan = (data: string) => {
    setWifInput(data);
    setShowQRScanner(false);
    toast({
      title: t.toasts.qrScanned,
      description: t.toasts.qrScannedDesc,
    });
  };

  const handlePrint = () => {
    if (!result) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: t.toasts.printError,
        description: t.toasts.printErrorDesc,
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
          language={language}
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
      {/* Language Selector */}
      <div className="flex justify-end">
        <LanguageSelector />
      </div>

      {/* Create New Wallet Button */}
      <div className="flex justify-center">
        <Button 
          variant="hero"
          size="lg"
          asChild
        >
          <a 
            href="https://www.offlinelana.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="gap-2"
          >
            <Wallet className="h-5 w-5" />
            {t.createWallet}
          </a>
        </Button>
      </div>

      {/* Instructions */}
      <Card className="bg-gradient-card border-border shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" />
            {t.instructions.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t.instructions.text1}</p>
          <p>{t.instructions.text2}</p>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card className="bg-gradient-card border-border shadow-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t.input.title}
          </CardTitle>
          <CardDescription>
            {t.input.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wif-input">{t.input.label}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="wif-input"
                  type="text"
                  placeholder={t.input.placeholder}
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
                title={t.input.scanButton}
              >
                <ScanLine className="h-4 w-4" />
              </Button>
            </div>
            {isValidInput === false && (
              <p className="text-sm text-destructive">
                {t.input.invalidFormat}
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
                  {t.input.showNostr}
                </Label>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    {t.input.nostrInfo}
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
                {t.input.converting}
              </>
            ) : (
              <>
                <Hash className="h-4 w-4" />
                {t.input.convertButton}
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
              {t.results.complete}
            </Badge>
          </div>

          {/* LANA Private Key (WIF) */}
          <Card className="bg-gradient-card border-border shadow-crypto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-crypto">
                <Key className="h-5 w-5" />
                {t.results.lanaPrivateKey}
              </CardTitle>
              <CardDescription>
                {t.results.lanaPrivateKeyDesc}
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
                  onClick={() => copyToClipboard(wifInput, t.results.lanaPrivateKey)}
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
                {t.results.walletId}
              </CardTitle>
              <CardDescription>
                {t.results.walletIdDesc}
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
                  onClick={() => copyToClipboard(result.walletId, t.results.walletId)}
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
                    {t.results.nostrHexId}
                  </CardTitle>
                  <CardDescription>
                    {t.results.nostrHexIdDesc}
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
                      onClick={() => copyToClipboard(result.nostrHexId, t.results.nostrHexId)}
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
                    {t.results.nostrNpubId}
                  </CardTitle>
                  <CardDescription>
                    {t.results.nostrNpubIdDesc}
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
                      onClick={() => copyToClipboard(result.nostrNpubId, t.results.nostrNpubId)}
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
                    {t.results.nostrPrivateKey}
                  </CardTitle>
                  <CardDescription>
                    {t.results.nostrPrivateKeyDesc}
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
                      onClick={() => copyToClipboard(result.privateKeyHex, t.results.nostrPrivateKey)}
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
                {t.print.title}
              </CardTitle>
              <CardDescription>
                {t.print.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-text">{t.print.customTextLabel}</Label>
                <Textarea
                  id="custom-text"
                  placeholder={t.print.customTextPlaceholder}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                {showNostrData 
                  ? t.print.fiveCards
                  : t.print.twoCards}
              </p>

              <Button 
                onClick={handlePrint}
                variant="hero"
                size="lg"
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                {t.print.generateButton}
              </Button>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>{t.print.securityNotice}</strong> {t.print.securityText}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )}


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