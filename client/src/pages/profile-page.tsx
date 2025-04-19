import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, getOrderStatusLabel } from "@/lib/utils";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToastNotification } from "@/components/toast-notification";
import { Order } from "@shared/schema";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [userType, setUserType] = useState<"hostel" | "non-hostel">(
    user?.userType as "hostel" | "non-hostel" || "hostel"
  );
  const [hostelType, setHostelType] = useState<"boys" | "girls">(
    user?.hostelType as "boys" | "girls" || "boys"
  );
  const [hostelBlock, setHostelBlock] = useState(user?.hostelBlock || "A");
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || "");
  const [cartItems, setCartItems] = useState([]);
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

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const res = await apiRequest("PUT", "/api/profile", profileData);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      // Update user data in auth context
      queryClient.setQueryData(["/api/user"], updatedUser);
      showToast({ message: "Profile updated successfully", type: "success" });
    },
    onError: (error: Error) => {
      showToast({ message: `Failed to update profile: ${error.message}`, type: "error" });
    }
  });

  // Handle profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileData: any = {
      name,
      userType,
    };
    
    if (userType === "hostel") {
      profileData.hostelType = hostelType;
      profileData.hostelBlock = hostelBlock;
      profileData.roomNumber = roomNumber;
    } else {
      profileData.hostelType = null;
      profileData.hostelBlock = null;
      profileData.roomNumber = null;
    }
    
    updateProfileMutation.mutate(profileData);
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Function to reorder
  const handleReorder = (order: Order) => {
    try {
      // Get the items from the previous order
      const newCartItems = order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));
      
      // Set the new cart
      localStorage.setItem('mlrit-bites-cart', JSON.stringify(newCartItems));
      showToast({ message: "Items added to cart", type: "success" });
      
      // Reload the page to reflect cart changes
      window.location.href = '/cart';
    } catch (error) {
      showToast({ message: "Failed to reorder", type: "error" });
    }
  };

  if (!user) return null;

  // Get first letter of first and last name for avatar
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <Header cartItems={cartItems} />
      
      <div className="pb-20 lg:pb-0">
        <div className="container mx-auto px-4 py-6 lg:py-8 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>

          {/* Profile Information */}
          <Card className="p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-medium">
                {getInitials(user.name)}
              </div>
              <div className="ml-4">
                <h2 className="font-medium text-lg">{user.name}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <Input 
                  type="email" 
                  value={user.email} 
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">User Type</p>
                <RadioGroup 
                  value={userType}
                  onValueChange={(value) => setUserType(value as "hostel" | "non-hostel")}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hostel" id="profile-hostel" />
                    <label htmlFor="profile-hostel">Hostel Student</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-hostel" id="profile-non-hostel" />
                    <label htmlFor="profile-non-hostel">Non-Hostel Student</label>
                  </div>
                </RadioGroup>
              </div>

              {userType === "hostel" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hostel Type</label>
                    <RadioGroup 
                      value={hostelType}
                      onValueChange={(value) => setHostelType(value as "boys" | "girls")}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="boys" id="profile-boys" />
                        <label htmlFor="profile-boys">Boys Hostel</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="girls" id="profile-girls" />
                        <label htmlFor="profile-girls">Girls Hostel</label>
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
                      <Input 
                        type="text" 
                        placeholder="e.g. 101" 
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Card>

          {/* Order History */}
          <Card className="p-6 mb-6">
            <h2 className="font-medium text-lg mb-4">Order History</h2>
            
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => {
                  const { label, bgColor, textColor } = getOrderStatusLabel(order.status);
                  
                  return (
                    <div key={order.id} className="border-b pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">Order #{order.id}</h3>
                          <p className="text-gray-600 text-sm">
                            {formatDate(order.createdAt)} · {formatCurrency(order.total)}
                          </p>
                        </div>
                        <span className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-medium`}>
                          {label}
                        </span>
                      </div>
                      <p className="text-sm">
                        {order.items
                          .map(item => `${item.name} x${item.quantity}`)
                          .join(", ")}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary text-sm font-medium mt-2"
                        onClick={() => handleReorder(order)}
                      >
                        Reorder
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600">You haven't placed any orders yet.</p>
                <Button 
                  variant="link" 
                  className="text-primary mt-2"
                  onClick={() => window.location.href = '/'}
                >
                  Browse menu
                </Button>
              </div>
            )}
          </Card>

          {/* Logout Button */}
          <Button 
            variant="outline"
            className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>

      <MobileNav cartItems={cartItems} />
    </>
  );
}
