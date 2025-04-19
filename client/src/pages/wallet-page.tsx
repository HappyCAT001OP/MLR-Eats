import { WalletPage as WalletComponent } from "@/components/wallet-page";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { useIsMobile } from "@/hooks/use-mobile";

export default function WalletPage() {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isMobile && <Header cartItems={[]} />}
      <main className="flex-1 container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Wallet</h1>
          <p className="text-muted-foreground mb-8">
            Manage your wallet balance and add money for quick payments.
          </p>
          <WalletComponent />
        </div>
      </main>
      {isMobile && <MobileNav cartItems={[]} />}
    </div>
  );
}