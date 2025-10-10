import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  const startScanner = async () => {
    try {
      setIsScanning(true);
      
      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
          setIsOpen(false);
        },
        (errorMessage) => {
          // Ignore frame processing errors
          if (!errorMessage.includes("NotFoundException")) {
            console.warn(errorMessage);
          }
        }
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start camera';
      console.error('QR Scanner error:', err);
      onError?.(errorMsg);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    scannerRef.current = null;
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleOpenChange(true)}
        className="shrink-0"
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scan QR Code
            </DialogTitle>
            <DialogDescription>
              Position the QR code within the camera frame to scan your private key
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <div id={qrCodeRegionId} className="w-full" />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QRScanner;
