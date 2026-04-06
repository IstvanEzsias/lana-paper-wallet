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

    // Adaptive threshold using an integral image — O(width × height).
    //
    // Unlike global contrast which struggles at distance, adaptive threshold
    // compares each pixel to its LOCAL neighbourhood average. This means:
    // - Works at any distance (near or far)
    // - Handles glare and shadows in different parts of the frame
    // - Produces a clean black/white image regardless of lighting conditions
    const applyAdaptiveThreshold = (imageData: ImageData): ImageData => {
      const { data, width, height } = imageData;
      const S = 12; // half-size of local neighbourhood window

      // Step 1 — convert to grayscale
      const gray = new Uint8Array(width * height);
      for (let i = 0, j = 0; j < data.length; i++, j += 4) {
        gray[i] = (0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2]) | 0;
      }

      // Step 2 — build integral image for O(1) local sum lookups
      const integral = new Int32Array((width + 1) * (height + 1));
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          integral[(y + 1) * (width + 1) + (x + 1)] =
            gray[y * width + x] +
            integral[y * (width + 1) + (x + 1)] +
            integral[(y + 1) * (width + 1) + x] -
            integral[y * (width + 1) + x];
        }
      }

      // Step 3 — threshold each pixel against its local mean
      for (let y = 0; y < height; y++) {
        const y1 = Math.max(0, y - S);
        const y2 = Math.min(height - 1, y + S);
        for (let x = 0; x < width; x++) {
          const x1 = Math.max(0, x - S);
          const x2 = Math.min(width - 1, x + S);
          const count = (y2 - y1 + 1) * (x2 - x1 + 1);
          const sum =
            integral[(y2 + 1) * (width + 1) + (x2 + 1)] -
            integral[y1 * (width + 1) + (x2 + 1)] -
            integral[(y2 + 1) * (width + 1) + x1] +
            integral[y1 * (width + 1) + x1];
          const val = gray[y * width + x] < (sum / count) * 0.88 ? 0 : 255;
          const j = (y * width + x) * 4;
          data[j] = data[j + 1] = data[j + 2] = val;
        }
      }

      return imageData;
    };

    // Scans one region of the video frame.
    // By cropping and scaling up to full canvas size we get digital zoom —
    // the QR code fills more pixels, so jsQR can decode from farther away.
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

      canvas.width = vw;
      canvas.height = vh;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, vw, vh);

      const imageData = applyAdaptiveThreshold(ctx.getImageData(0, 0, vw, vh));

      return jsQR(imageData.data, imageData.width, imageData.height, {
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
            width: { ideal: 1280 },
            height: { ideal: 720 },
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
