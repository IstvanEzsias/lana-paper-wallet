import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasScannedRef = useRef(false);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    hasScannedRef.current = false;

    // Process width/height — we always render to this fixed size regardless
    // of what the camera gives us. Capturing at 1080p but processing at 720p
    // gives better sensor data (1080p→720p downscale averages pixels = less
    // noise, sharper edges) without the CPU cost of processing at full 1080p.
    const PW = 1280;
    const PH = 720;

    const applyPreprocessing = (imageData: ImageData): ImageData => {
      const data = imageData.data;
      // Contrast 1.5 (not 1.9) — less aggressive so small distant modules
      // keep their edge detail instead of being clipped to pure black/white
      const contrast = 1.5;
      for (let i = 0; i < data.length; i += 4) {
        const gray = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
        const val = Math.max(0, Math.min(255, (gray - 128) * contrast + 128));
        data[i] = data[i + 1] = data[i + 2] = val;
      }
      return imageData;
    };

    const scanRegion = (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      video: HTMLVideoElement,
      marginFraction: number
    ): ReturnType<typeof jsQR> | null => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const sx = vw * marginFraction;
      const sy = vh * marginFraction;
      const sw = vw * (1 - 2 * marginFraction);
      const sh = vh * (1 - 2 * marginFraction);

      // Always output at fixed PW×PH — downscales 1080p to 720p automatically
      canvas.width = PW;
      canvas.height = PH;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, PW, PH);

      const imageData = applyPreprocessing(ctx.getImageData(0, 0, PW, PH));

      return jsQR(imageData.data, PW, PH, {
        inversionAttempts: 'attemptBoth',
      });
    };

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || hasScannedRef.current) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Try 2 zoom levels per frame — keeps mobile CPU load manageable:
      // 0.00 = full frame       (card close / filling frame)
      // 0.25 = center 50% → 2x (card at medium/far distance)
      const code =
        scanRegion(ctx, canvas, video, 0.00) ||
        scanRegion(ctx, canvas, video, 0.25);

      if (code && !hasScannedRef.current) {
        hasScannedRef.current = true;
        onScan(code.data);
        return;
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsScanning(true);
          setError('');
          animFrameRef.current = requestAnimationFrame(scanFrame);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Napaka pri zagonu kamere. Preverite dovoljenja.');
      }
    };

    startCamera();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="relative aspect-square bg-background rounded-lg overflow-hidden">
            {/* Live video shown to the user */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Hidden canvas used for contrast preprocessing before decoding */}
            <canvas ref={canvasRef} className="hidden" />
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
