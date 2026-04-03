import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    let controls: any = null;

    const startScanning = async () => {
      try {
        setIsScanning(true);

        // TRY_HARDER: spend more effort finding the QR pattern in low contrast images
        // ALSO_INVERT: try reading both normal and inverted — engraved metal cards
        //              can appear "reversed" (light on dark) to the decoder
        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.ALSO_INVERT, true);

        const codeReader = new BrowserQRCodeReader(hints, { delayBetweenScanAttempts: 100 });
        readerRef.current = codeReader;

        if (videoRef.current) {
          // Use decodeFromConstraints instead of listVideoInputDevices:
          // - Works on iOS Safari (no pre-enumeration needed)
          // - facingMode 'environment' = back camera on mobile, any camera on desktop
          // - Higher resolution (1280x720) helps read engraved/low-contrast QR codes
          controls = await codeReader.decodeFromConstraints(
            {
              video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            videoRef.current,
            (result, error) => {
              if (result) {
                onScan(result.getText());
                if (controls) {
                  controls.stop();
                }
              }
              if (error && !(error instanceof Error && error.name === 'NotFoundException')) {
                console.error('QR scan error:', error);
              }
            }
          );
        }
      } catch (err) {
        console.error('Error starting QR scanner:', err);
        setError('Napaka pri zagonu kamere. Preverite dovoljenja.');
      }
    };

    startScanning();

    return () => {
      if (controls) {
        controls.stop();
      }
      setIsScanning(false);
    };
  }, [onScan]);

  return (
    <Card className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 bg-gradient-card border-border shadow-glow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Skeniraj QR kodo</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="relative aspect-square bg-background rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
            />
            {isScanning && (
              <div className="absolute inset-0 border-2 border-primary/50 rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary" />
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-4 text-center">
          Postavite QR kodo v okvir za skeniranje
        </p>
      </CardContent>
    </Card>
  );
};

export default QRScanner;
