import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { type ConversionResult } from '@/lib/crypto';
import { translations, type Language } from '@/lib/translations';

interface PrintDocumentProps {
  customText: string;
  result: ConversionResult;
  wifInput: string;
  showNostrData: boolean;
  language: Language;
}

interface WalletCardProps {
  title: string;
  value: string;
  qrValue: string;
  hideValue?: boolean;
}

const WalletCard: React.FC<WalletCardProps> = ({ title, value, qrValue, hideValue = false }) => {
  return (
    <div className="wallet-card bg-white text-black p-4 break-inside-avoid border-2 border-gray-300 rounded-lg mb-3">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-gray-800 text-left">{title}</h2>
      </div>

      {!hideValue && (
        <div className="mb-3">
          <p className="text-[10px] font-mono break-all border-b-2 border-gray-400 pb-2">{value}</p>
        </div>
      )}

      <div className="flex justify-center pt-1">
        <div className="text-center">
          <div className="border-2 border-gray-800 p-2 inline-block bg-white">
            <QRCodeCanvas 
              value={qrValue} 
              size={150} 
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const PrintDocument: React.FC<PrintDocumentProps> = ({ 
  customText, 
  result, 
  wifInput, 
  showNostrData,
  language 
}) => {
  const t = translations[language].printDoc;
  const cards = showNostrData ? [
    {
      title: t.lanaPrivateKey,
      value: wifInput,
      qrValue: wifInput
    },
    {
      title: t.walletId,
      value: result.walletId,
      qrValue: result.walletId
    },
    {
      title: t.nostrHexId,
      value: result.nostrHexId,
      qrValue: result.nostrHexId
    },
    {
      title: t.nostrNpubId,
      value: result.nostrNpubId,
      qrValue: result.nostrNpubId,
      hideValue: true
    },
    {
      title: t.nostrPrivateKeyHex,
      value: result.privateKeyHex,
      qrValue: result.privateKeyHex
    }
  ] : [
    {
      title: t.lanaPrivateKey,
      value: wifInput,
      qrValue: wifInput
    },
    {
      title: t.walletId,
      value: result.walletId,
      qrValue: result.walletId
    }
  ];

  return (
    <div className="print-document">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
        
        .print-document {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 15mm;
          box-sizing: border-box;
        }
        
        .wallet-card {
          margin-bottom: 8mm;
        }
        
        .custom-header {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8mm;
          padding-bottom: 4mm;
          border-bottom: 3px solid #333;
          color: #000;
        }
        
        .security-warning {
          margin-top: 8mm;
          padding: 4mm;
          background-color: #f5f5f5;
          border: 2px solid #333;
          border-radius: 4px;
          text-align: center;
          color: #000;
        }
        
        .cards-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 180mm;
          margin: 0 auto;
        }
        
        .cards-container.two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5mm;
          max-width: 180mm;
          margin: 0 auto;
          align-items: start;
        }
        
        .cards-container.single-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 90mm;
          margin: 0 auto;
        }
        
        @media screen {
          .print-document {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      <div className="custom-header">
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{t.walletTitle}</div>
        {customText && <div>{customText}</div>}
      </div>

      <div className={`cards-container ${showNostrData ? 'two-column' : 'single-column'}`}>
        {cards.map((card, index) => (
          <WalletCard
            key={index}
            title={card.title}
            value={card.value}
            qrValue={card.qrValue}
            hideValue={card.hideValue}
          />
        ))}
      </div>

      {!showNostrData && (
        <div className="security-warning">
          <p className="font-bold text-base mb-2">{t.securityWarningTitle}</p>
          <p className="text-xs">
            {t.securityWarningText}
          </p>
        </div>
      )}
    </div>
  );
};

export default PrintDocument;
