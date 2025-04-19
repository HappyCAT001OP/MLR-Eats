import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Utensils } from "lucide-react";
import { CartItem } from "@/lib/utils";

interface MobileNavProps {
  cartItems: CartItem[];
}

export function MobileNav({ cartItems }: MobileNavProps) {
  const [location] = useLocation();
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-30">
      <div className="flex justify-around">
        <Link href="/">
          <div className={`py-3 px-6 flex flex-col items-center ${location === '/' ? 'text-primary' : 'text-gray-600'}`}>
            <Utensils className="h-5 w-5" />
            <span className="text-xs mt-1">Menu</span>
          </div>
        </Link>
        <Link href="/cart">
          <div className={`py-3 px-6 flex flex-col items-center ${location === '/cart' ? 'text-primary' : 'text-gray-600'}`}>
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">Cart</span>
          </div>
        </Link>
        <Link href="/profile">
          <div className={`py-3 px-6 flex flex-col items-center ${location === '/profile' ? 'text-primary' : 'text-gray-600'}`}>
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
