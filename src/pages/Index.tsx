import WalletConverter from '@/components/WalletConverter';
import headerImage from '@/assets/lana-header.png';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        <img 
          src={headerImage} 
          alt="LANA Paper Wallet" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] text-center px-4">
            LANA Paper Wallet
          </h1>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <WalletConverter />
      </div>
    </div>
  );
};

export default Index;
