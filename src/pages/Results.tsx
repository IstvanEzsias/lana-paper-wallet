import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy, Key, Wallet, Hash, CheckCircle2, AlertCircle, Download, Loader2, ArrowLeft } from 'lucide-react';
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
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

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

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      container.style.background = 'white';
      document.body.appendChild(container);
      
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
      
      // Wait for React to render and QR codes to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Convert SVG QR codes to canvas for better html2canvas compatibility
      const svgElements = container.querySelectorAll('svg');
      for (const svg of svgElements) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = svg.clientWidth * 2 || 300;
            canvas.height = svg.clientHeight * 2 || 300;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const imgElement = document.createElement('img');
              imgElement.src = canvas.toDataURL('image/png');
              imgElement.style.width = svg.clientWidth + 'px';
              imgElement.style.height = svg.clientHeight + 'px';
              svg.parentNode?.replaceChild(imgElement, svg);
            }
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(); // Continue even if one fails
          };
          img.src = url;
        });
      }
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: container.scrollWidth,
        height: container.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('lana-wallet.pdf');
      
      root.unmount();
      document.body.removeChild(container);
      
      toast({
        title: t.toasts.pdfSuccess,
        description: t.toasts.pdfSuccessDesc,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: "destructive",
        title: t.toasts.pdfError,
        description: t.toasts.pdfErrorDesc,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
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
              <Download className="h-5 w-5" />
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
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              variant="hero"
              size="lg"
              className="w-full"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t.print.generatingPdf}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {t.print.downloadPdfButton}
                </>
              )}
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
