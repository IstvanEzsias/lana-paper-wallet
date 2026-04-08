import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

// Process at half resolution — enough pixels for jsQR at any reasonable
// distance, while keeping the adaptive threshold fast on mobile CPUs.
const PW = 640;
const PH = 360;

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const animRef     = useRef<number | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const doneRef     = useRef(false);

  // Pre-allocated once at mount — reused every frame, zero GC pressure.
  const grayRef     = useRef(new Uint8Array(PW * PH));
  const integralRef = useRef(new Int32Array((PW + 1) * (PH + 1)));

  const [error, setError]       = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    doneRef.current = false;

    // ── Adaptive threshold ────────────────────────────────────────────────
    // For each pixel we compare its brightness to the average of its 17×17
    // local neighbourhood (computed in O(1) via an integral image).
    // This means dark modules on dark metal surfaces are still detected
    // correctly because the comparison is LOCAL, not global.
    // Works identically for paper, plastic, and engraved metal at any distance.
    const adaptiveThreshold = (imageData: ImageData): void => {
      const { data, width, height } = imageData;
      const gray     = grayRef.current;
      const integral = integralRef.current;
      const S  = 8;        // half-window → 17×17 neighbourhood
      const T  = 0.85;     // pixel is "dark" if < T × local mean
      const w1 = width + 1;

      // Step 1 — luminance-weighted grayscale
      for (let i = 0, j = 0; j < data.length; i++, j += 4) {
        gray[i] = (0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2]) | 0;
      }

      // Step 2 — build summed-area table (integral image)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          integral[(y + 1) * w1 + (x + 1)] =
            gray[y * width + x]
            + integral[y * w1 + (x + 1)]
            + integral[(y + 1) * w1 + x]
            - integral[y * w1 + x];
        }
      }

      // Step 3 — threshold each pixel against its local mean
      for (let y = 0; y < height; y++) {
        const y1 = Math.max(0, y - S);
        const y2 = Math.min(height - 1, y + S);
        for (let x = 0; x < width; x++) {
          const x1  = Math.max(0, x - S);
          const x2  = Math.min(width - 1, x + S);
          const cnt = (y2 - y1 + 1) * (x2 - x1 + 1);
          const sum =
              integral[(y2 + 1) * w1 + (x2 + 1)]
            - integral[y1 * w1 + (x2 + 1)]
            - integral[(y2 + 1) * w1 + x1]
            + integral[y1 * w1 + x1];
          const val = gray[y * width + x] < (sum / cnt) * T ? 0 : 255;
          const j   = (y * width + x) * 4;
          data[j] = data[j + 1] = data[j + 2] = val;
        }
      }
    };

    // ── Scan loop ─────────────────────────────────────────────────────────
    const scanFrame = () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || doneRef.current) {
        animRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { animRef.current = requestAnimationFrame(scanFrame); return; }

      // Scale camera frame down to PW×PH — the browser's bilinear downscale
      // also acts as a mild denoise filter, improving edge quality.
      canvas.width  = PW;
      canvas.height = PH;
      ctx.drawImage(video, 0, 0, PW, PH);

      const imageData = ctx.getImageData(0, 0, PW, PH);
      adaptiveThreshold(imageData);

      const code = jsQR(imageData.data, PW, PH, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && !doneRef.current) {
        doneRef.current = true;
        onScan(code.data);
        return;
      }

      animRef.current = requestAnimationFrame(scanFrame);
    };

    // ── Camera start ──────────────────────────────────────────────────────
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width:  { ideal: 1280 },
            height: { ideal: 720  },
          },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsScanning(true);
          setError('');
          animRef.current = requestAnimationFrame(scanFrame);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Camera error. Please check your permissions.');
      }
    };

    startCamera();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onScan]);

  // ── UI ────────────────────────────────────────────────────────────────
  return (
    <Card className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 bg-gradient-card border-border shadow-glow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Scan QR Code</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
            onClose();
          }}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="relative aspect-square bg-background rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
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
          Place the QR code inside the frame to scan
        </p>
      </CardContent>
    </Card>
  );
};

export default QRScanner;
