import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { FoodItem } from "@shared/schema";
import { CartItem } from "@/lib/utils";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { FoodItemCard } from "@/components/food-item-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToastNotification } from "@/components/toast-notification";

export default function MenuPage() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All Items");
  const showToast = useToastNotification();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('mlrit-bites-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse saved cart:", e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mlrit-bites-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Fetch menu items
  const { data: foodItems, isLoading, error } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
  });

  // Add to cart function
  const addToCart = (foodItem: FoodItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === foodItem.id);
      
      if (existingItem) {
        return prev.map(item => 
          item.id === foodItem.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, { 
          id: foodItem.id, 
          name: foodItem.name, 
          price: foodItem.price, 
          quantity: 1,
          imageUrl: foodItem.imageUrl
        }];
      }
    });
    
    showToast({ message: `Added ${foodItem.name} to cart`, type: "success" });
  };

  // Remove from cart function
  const removeFromCart = (foodItemId: number) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === foodItemId);
      
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(item => 
          item.id === foodItemId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      } else {
        return prev.filter(item => item.id !== foodItemId);
      }
    });
  };

  // Get categories from food items
  const categories = foodItems
    ? ['All Items', ...new Set(foodItems.map(item => item.category))]
    : ['All Items'];

  // Filter food items by category
  const filteredFoodItems = foodItems?.filter(item => 
    activeCategory === 'All Items' || item.category === activeCategory
  );

  // Get quantity of an item in cart
  const getItemQuantity = (foodItemId: number) => {
    const item = cartItems.find(item => item.id === foodItemId);
    return item ? item.quantity : 0;
  };

  if (!user) return null;

  return (
    <>
      <Header cartItems={cartItems} />
      
      <div className="pb-20 lg:pb-0">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Today's Menu</h1>
            <p className="text-gray-600">Order fresh and tasty food</p>
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 py-2 mb-6 scrollbar-hide">
            {categories.map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className={`whitespace-nowrap ${activeCategory === category ? 'bg-primary text-white' : 'bg-white text-gray-800'}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 p-4 rounded-lg text-center mb-8">
              <p className="text-red-600">Failed to load menu items. Please try again later.</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>
          )}

          {/* Menu Items */}
          {!isLoading && filteredFoodItems && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filteredFoodItems.map(foodItem => (
                <FoodItemCard
                  key={foodItem.id}
                  foodItem={foodItem}
                  onAddToCart={addToCart}
                  onRemoveFromCart={removeFromCart}
                  quantity={getItemQuantity(foodItem.id)}
                />
              ))}
            </div>
          )}

          {/* No items in category */}
          {!isLoading && filteredFoodItems && filteredFoodItems.length === 0 && (
            <div className="bg-gray-50 p-6 rounded-lg text-center mb-8">
              <p className="text-gray-600">No items available in this category.</p>
            </div>
          )}
        </div>
      </div>

      <MobileNav cartItems={cartItems} />
    </>
  );
}
