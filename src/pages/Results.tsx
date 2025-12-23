import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy, Key, Wallet, Hash, CheckCircle2, AlertCircle, Printer, ArrowLeft } from 'lucide-react';
import { type ConversionResult, normalizePrivateKey } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import PrintDocument from '@/components/PrintDocument';

interface ResultsState {
  result: ConversionResult;
  wifInput: string;
  showNostrData: boolean;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  
  const state = location.state as ResultsState | null;
  const [customText, setCustomText] = React.useState('');

  // Redirect if no data
  React.useEffect(() => {
    if (!state?.result || !state?.wifInput) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.result || !state?.wifInput) {
    return null;
  }

  const { result, wifInput, showNostrData } = state;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      const cleanText = normalizePrivateKey(text);
      await navigator.clipboard.writeText(cleanText);
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Napaka",
        description: "Brskalnik je blokiral odpiranje okna za tisk.",
      });
      return;
    }

    const container = document.createElement('div');
    const root = ReactDOM.createRoot(container);
    root.render(
      <PrintDocument
        customText={customText}
        result={result}
        wifInput={wifInput}
        showNostrData={showNostrData}
        language={language}
      />
    );

    // Wait for render then write to print window
    setTimeout(() => {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>LANA Wallet</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; }
            </style>
          </head>
          <body>
            ${container.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for QR codes to render then print
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      root.unmount();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header with back button and language selector */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.results.backToInput}
          </Button>
          <LanguageSelector />
        </div>

        {/* Success Badge */}
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
              {t.print.printButton || 'Natisni'}
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
    </div>
  );
};

export default Results;
