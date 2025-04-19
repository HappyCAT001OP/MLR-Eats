import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { ShoppingCart, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/lib/utils";

interface HeaderProps {
  cartItems: CartItem[];
}

export function Header({ cartItems }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-primary text-xl font-bold">MLRIT Bites</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          <Link href="/">
            <span className={`${location === '/' ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}>
              Menu
            </span>
          </Link>
          {user.isAdmin && (
            <Link href="/admin">
              <span className={`${location === '/admin' ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}>
                Admin Dashboard
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white shadow-md py-2 px-4">
          <nav className="flex flex-col space-y-2">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
              <span className={`block py-2 ${location === '/' ? 'text-primary font-medium' : 'text-gray-600'}`}>
                Menu
              </span>
            </Link>
            {user.isAdmin && (
              <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                <span className={`block py-2 ${location === '/admin' ? 'text-primary font-medium' : 'text-gray-600'}`}>
                  Admin Dashboard
                </span>
              </Link>
            )}
            <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
              <span className={`block py-2 ${location === '/profile' ? 'text-primary font-medium' : 'text-gray-600'}`}>
                Profile
              </span>
            </Link>
            <Link href="/cart" onClick={() => setIsMenuOpen(false)}>
              <span className={`block py-2 ${location === '/cart' ? 'text-primary font-medium' : 'text-gray-600'}`}>
                Cart {cartCount > 0 && `(${cartCount})`}
              </span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
