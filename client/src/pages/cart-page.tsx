import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { CartItem as CartItemType, calculateCartTotal, formatCurrency, loadRazorpayScript } from "@/lib/utils";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { CartItem } from "@/components/cart-item";
import { OrderTrackingModal } from "@/components/order-tracking-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToastNotification } from "@/components/toast-notification";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingCart } from "lucide-react";

export default function CartPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [deliveryType, setDeliveryType] = useState<"hostel" | "non-hostel">(
    user?.userType === "hostel" ? "hostel" : "non-hostel"
  );
  const [hostelType, setHostelType] = useState<"boys" | "girls">(
    user?.hostelType as "boys" | "girls" || "boys"
  );
  const [hostelBlock, setHostelBlock] = useState<string>(user?.hostelBlock || "A");
  const [roomNumber, setRoomNumber] = useState<string>(user?.roomNumber || "");
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<"preparing" | "out-for-delivery" | "delivered">("preparing");
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

  const { subtotal, deliveryFee, total } = calculateCartTotal(cartItems);

  // Cart item management functions
  const incrementItem = (itemId: number) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      )
    );
  };

  const decrementItem = (itemId: number) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === itemId);
      
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      } else {
        return prev.filter(item => item.id !== itemId);
      }
    });
  };

  const removeItem = (itemId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      return res.json();
    },
    onSuccess: (data) => {
      // Clear cart
      setCartItems([]);
      localStorage.removeItem('mlrit-bites-cart');
      
      // Show success message and tracking modal
      showToast({ message: "Order placed successfully!", type: "success" });
      setIsOrderTrackingOpen(true);
    },
    onError: (error: Error) => {
      showToast({ message: `Failed to place order: ${error.message}`, type: "error" });
    },
  });

  // Handle Razorpay payment
  const handlePayment = async () => {
    if (cartItems.length === 0) {
      showToast({ message: "Your cart is empty", type: "error" });
      return;
    }

    if (deliveryType === "hostel" && (!hostelBlock || !roomNumber)) {
      showToast({ message: "Please provide hostel and room details", type: "error" });
      return;
    }

    // Validate room number format (simple validation)
    if (deliveryType === "hostel" && !/^\d+$/.test(roomNumber)) {
      showToast({ message: "Please enter a valid room number", type: "error" });
      return;
    }

    // Load Razorpay script
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      showToast({ message: "Failed to load payment gateway", type: "error" });
      return;
    }

    // Get Razorpay from window
    const Razorpay = (window as any).Razorpay;
    
    // Create Razorpay instance
    const razorpay = new Razorpay({
      key: 'rzp_test_kTgwDJ0XjRIEUa', // Test key for demo purposes
      amount: total * 100, // Amount in paisa
      currency: 'INR',
      name: 'MLRIT Bites',
      description: 'Food Order Payment',
      image: 'https://i.ibb.co/DgtMSMw/mlrit-logo.png',
      handler: function(response: any) {
        // Process payment success
        const paymentId = response.razorpay_payment_id;
        
        // Create order with payment details
        createOrderMutation.mutate({
          items: cartItems,
          subtotal,
          deliveryFee,
          total,
          deliveryType,
          hostelType: deliveryType === "hostel" ? hostelType : null,
          hostelBlock: deliveryType === "hostel" ? hostelBlock : null,
          roomNumber: deliveryType === "hostel" ? roomNumber : null,
          paymentId,
        });
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: {
        color: '#2ecc71',
      },
    });
    
    razorpay.open();
  };

  // Get delivery location string for tracking modal
  const getDeliveryLocation = () => {
    if (deliveryType === "hostel") {
      return `${hostelType === "boys" ? "Boys" : "Girls"} Hostel, Block ${hostelBlock}, Room ${roomNumber}`;
    } else {
      return "MLRIT Main Canteen (Pickup)";
    }
  };

  if (!user) return null;

  return (
    <>
      <Header cartItems={cartItems} />
      
      <div className="pb-20 lg:pb-0">
        <div className="container mx-auto px-4 py-6 lg:py-8 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Your Cart</h1>
            <p className="text-gray-600">Review and confirm your order</p>
          </div>

          {/* Cart Items */}
          <div className="mb-6 space-y-4">
            {cartItems.length === 0 ? (
              <Card className="p-6 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="font-medium text-lg mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-4">Add items from the menu to get started</p>
                <Button 
                  onClick={() => navigate("/")}
                  className="bg-primary hover:bg-primary/90"
                >
                  Browse Menu
                </Button>
              </Card>
            ) : (
              cartItems.map(item => (
                <CartItem 
                  key={item.id}
                  item={item}
                  onIncrement={incrementItem}
                  onDecrement={decrementItem}
                  onRemove={removeItem}
                />
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <>
              {/* Delivery Details */}
              <Card className="p-6 mb-6">
                <h3 className="font-medium text-lg mb-4">Delivery Details</h3>
                
                {/* User Type Selection */}
                <div className="mb-4">
                  <RadioGroup 
                    value={deliveryType}
                    onValueChange={(value) => setDeliveryType(value as "hostel" | "non-hostel")}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hostel" id="hostel-delivery" />
                      <label htmlFor="hostel-delivery">Hostel Delivery</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-hostel" id="pickup" />
                      <label htmlFor="pickup">Pickup from Canteen</label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Hostel Details */}
                {deliveryType === "hostel" && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Hostel Type</label>
                      <RadioGroup 
                        value={hostelType}
                        onValueChange={(value) => setHostelType(value as "boys" | "girls")}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="boys" id="boys-hostel" />
                          <label htmlFor="boys-hostel">Boys Hostel</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="girls" id="girls-hostel" />
                          <label htmlFor="girls-hostel">Girls Hostel</label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Block</label>
                        <select 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                          value={hostelBlock}
                          onChange={(e) => setHostelBlock(e.target.value)}
                        >
                          <option value="A">Block A</option>
                          <option value="B">Block B</option>
                          <option value="C">Block C</option>
                          <option value="D">Block D</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Room Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 101" 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Pickup Details */}
                {deliveryType === "non-hostel" && (
                  <div className="mt-4">
                    <p className="text-gray-600 mb-2">Your order will be available for pickup at:</p>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="font-medium">MLRIT Main Canteen</p>
                      <p className="text-sm text-gray-600">Pickup Time: 30 minutes after order confirmation</p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Order Summary */}
              <Card className="p-6 mb-6">
                <h3 className="font-medium text-lg mb-4">Order Summary</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                </div>
                <div className="border-t pt-3 flex justify-between font-medium">
                  <span>Total Amount</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </Card>

              {/* Payment Button */}
              <Button 
                className="w-full"
                onClick={handlePayment}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? "Processing..." : "Proceed to Payment"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Order Tracking Modal */}
      <OrderTrackingModal 
        isOpen={isOrderTrackingOpen}
        onClose={() => setIsOrderTrackingOpen(false)}
        orderStatus={orderStatus}
        deliveryLocation={getDeliveryLocation()}
      />

      <MobileNav cartItems={cartItems} />
    </>
  );
}
