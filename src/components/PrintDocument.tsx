import React from 'react';
import PrintableWallet from './PrintableWallet';
import { type ConversionResult } from '@/lib/crypto';

interface PrintDocumentProps {
  customText: string;
  result: ConversionResult;
  wifInput: string;
  walletsPerPage: number;
}

const PrintDocument: React.FC<PrintDocumentProps> = ({ 
  customText, 
  result, 
  wifInput, 
  walletsPerPage 
}) => {
  return (
    <div className="print-document">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
        
        .print-document {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 20mm;
          box-sizing: border-box;
        }
        
        .wallet-card {
          margin-bottom: 15mm;
        }
        
        .custom-header {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10mm;
          padding-bottom: 5mm;
          border-bottom: 2px solid #333;
          color: #000;
        }
        
        .security-warning {
          margin-top: 10mm;
          padding: 5mm;
          background-color: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 4px;
          text-align: center;
          color: #000;
        }
        
        @media screen {
          .print-document {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {customText && (
        <div className="custom-header">
          {customText}
        </div>
      )}

      {Array.from({ length: walletsPerPage }).map((_, index) => (
        <PrintableWallet
          key={index}
          walletName=""
          result={result}
          wifInput={wifInput}
        />
      ))}

      <div className="security-warning">
        <p className="font-bold text-lg mb-2">⚠️ IMPORTANT SECURITY NOTICE ⚠️</p>
        <p className="text-sm">
          Store this document securely in THREE separate locations. Keep it away from moisture, 
          fire, and unauthorized access. Anyone with access to the Private Key can access your funds. 
          Never share your private key with anyone.
        </p>
      </div>
    </div>
  );
};

export default PrintDocument;
