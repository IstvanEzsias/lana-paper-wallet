import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy, Key, Wallet, Hash, CheckCircle2, AlertCircle, Printer, ArrowLeft, Download } from 'lucide-react';
import { type ConversionResult, normalizePrivateKey } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { translations } from '@/lib/translations';

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

  const downloadQrPng = async (value: string, filename: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(value, { 
        width: 400, 
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: t.toasts.copied,
        description: `${filename}.png`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t.toasts.copyFailed,
        description: t.toasts.copyFailedDesc,
      });
    }
  };

  const handlePrint = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: t.toasts.printError,
        description: t.toasts.printErrorDesc,
      });
      return;
    }

    const printT = translations[language].printDoc;

    // Build cards array
    const cards = [
      { title: printT.lanaPrivateKey, value: wifInput },
      { title: printT.walletId, value: result.walletId },
    ];

    if (showNostrData) {
      cards.push(
        { title: printT.nostrHexId, value: result.nostrHexId },
        { title: printT.nostrNpubId, value: result.nostrNpubId },
        { title: printT.nostrNsecId, value: result.nostrNsecId },
        { title: printT.nostrPrivateKeyHex, value: result.privateKeyHex }
      );
    }

    // Generate QR codes as Data URLs
    const qrDataUrls = await Promise.all(
      cards.map(card =>
        QRCode.toDataURL(card.value, {
          width: showNostrData ? 150 : 400,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        })
      )
    );

    // Build HTML with embedded images
    const cardsHtml = cards.map((card, index) => `
      <div class="card">
        <div class="card-title">${card.title}</div>
        <div class="card-value">${card.value}</div>
        <img src="${qrDataUrls[index]}" alt="QR Code" class="qr-code" />
      </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>LANA Wallet</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: Arial, sans-serif; 
        padding: 20px;
        background: white;
      }
      .header {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #333;
      }
      .header h1 {
        font-size: 24px;
        margin-bottom: 8px;
      }
      .custom-text {
        font-size: 14px;
        color: #666;
        margin-top: 8px;
      }
      .cards-container {
        display: grid;
        grid-template-columns: ${showNostrData ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'};
        gap: ${showNostrData ? '15px' : '30px'};
        margin-bottom: 20px;
      }
      .card {
        border: ${showNostrData ? '1px' : '2px'} solid #ddd;
        border-radius: 8px;
        padding: ${showNostrData ? '12px' : '24px'};
        text-align: center;
        background: #fafafa;
      }
      .card-title {
        font-weight: bold;
        font-size: ${showNostrData ? '11px' : '18px'};
        margin-bottom: ${showNostrData ? '8px' : '14px'};
        color: #333;
      }
      .card-value {
        font-family: monospace;
        font-size: ${showNostrData ? '8px' : '12px'};
        word-break: break-all;
        margin-bottom: ${showNostrData ? '10px' : '20px'};
        color: #555;
        line-height: 1.3;
      }
      .qr-code {
        width: ${showNostrData ? '120px' : '250px'};
        height: ${showNostrData ? '120px' : '250px'};
      }
      .security-warning {
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 8px;
        padding: 15px;
        margin-top: 20px;
      }
      .security-warning h3 {
        font-size: 12px;
        margin-bottom: 8px;
        color: #856404;
      }
      .security-warning p {
        font-size: 10px;
        color: #856404;
        line-height: 1.4;
      }
      @media print {
        body { padding: 10mm; }
        .cards-container { gap: ${showNostrData ? '10px' : '20px'}; }
        .card { padding: ${showNostrData ? '10px' : '20px'}; }
        .qr-code { width: ${showNostrData ? '100px' : '220px'}; height: ${showNostrData ? '100px' : '220px'}; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${printT.walletTitle}</h1>
      ${customText ? `<div class="custom-text">${customText}</div>` : ''}
    </div>
    <div class="cards-container">
      ${cardsHtml}
    </div>
    <div class="security-warning">
      <h3>${printT.securityWarningTitle}</h3>
      <p>${printT.securityWarningText}</p>
    </div>
  </body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
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
            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
              <QRCodeSVG value={wifInput} size={200} level="H" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQrPng(wifInput, 'lana-private-key')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {t.results.downloadQr}
              </Button>
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
            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
              <QRCodeSVG value={result.walletId} size={200} level="H" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQrPng(result.walletId, 'lanacoin-wallet-id')}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {t.results.downloadQr}
              </Button>
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
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                  <QRCodeSVG value={result.nostrHexId} size={200} level="H" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadQrPng(result.nostrHexId, 'nostr-hex-id')}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t.results.downloadQr}
                  </Button>
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
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                  <QRCodeSVG value={result.nostrNpubId} size={200} level="H" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadQrPng(result.nostrNpubId, 'nostr-npub-id')}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t.results.downloadQr}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Nostr nsec ID */}
            <Card className="bg-gradient-card border-border shadow-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Key className="h-5 w-5" />
                  {t.results.nostrNsecId}
                </CardTitle>
                <CardDescription>
                  {t.results.nostrNsecIdDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border">
                  <code className="flex-1 text-sm font-mono break-all">
                    {result.nostrNsecId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(result.nostrNsecId, t.results.nostrNsecId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                  <QRCodeSVG value={result.nostrNsecId} size={200} level="H" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadQrPng(result.nostrNsecId, 'nostr-nsec-id')}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t.results.downloadQr}
                  </Button>
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
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                  <QRCodeSVG value={result.privateKeyHex} size={200} level="H" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadQrPng(result.privateKeyHex, 'nostr-private-key-hex')}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t.results.downloadQr}
                  </Button>
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
