import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { type ConversionResult } from '@/lib/crypto';

interface PrintableWalletProps {
  walletName: string;
  result: ConversionResult;
  wifInput: string;
}

const PrintableWallet: React.FC<PrintableWalletProps> = ({ walletName, result, wifInput }) => {
  return (
    <div className="wallet-card bg-white text-black p-8 break-inside-avoid">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Lana Wallet</h2>
      </div>

      <div className="space-y-4">
        <div>
          <p className="font-semibold text-gray-700 mb-2">Wallet Name:</p>
          <p className="text-lg min-h-[40px] border-b-2 border-gray-400 pb-2">{walletName}</p>
        </div>

        <div>
          <p className="font-semibold text-gray-700 mb-2">Notes:</p>
          <div className="min-h-[60px] border-b-2 border-gray-400 pb-2"></div>
        </div>

        <div>
          <p className="font-semibold text-gray-700 mb-2">Wallet Address:</p>
          <p className="text-sm font-mono break-all border-b-2 border-gray-400 pb-2">{result.walletId}</p>
        </div>

        <div>
          <p className="font-semibold text-gray-700 mb-2">Private Key (WIF):</p>
          <p className="text-sm font-mono break-all border-b-2 border-gray-400 pb-2">{wifInput}</p>
        </div>

        <div className="flex justify-around pt-6 pb-4">
          <div className="text-center">
            <div className="border-2 border-gray-800 p-2 inline-block">
              <QRCodeSVG value={result.walletId} size={150} level="H" />
            </div>
            <p className="text-sm mt-2 font-semibold">Wallet Address QR</p>
          </div>
          <div className="text-center">
            <div className="border-2 border-gray-800 p-2 inline-block">
              <QRCodeSVG value={wifInput} size={150} level="H" />
            </div>
            <p className="text-sm mt-2 font-semibold">Private Key QR</p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-600 mt-6 pt-4 border-t border-gray-300">
          <p>You can create a new Lana Wallet anytime at www.offline.com and</p>
          <p>securely send Lana using the Safe Transactions System at</p>
          <p>www.SafeLana.com to another Lana Wallet.</p>
        </div>
      </div>
    </div>
  );
};

export default PrintableWallet;
