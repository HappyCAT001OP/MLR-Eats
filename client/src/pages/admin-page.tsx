import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FoodItem, Order } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { useToastNotification } from "@/components/toast-notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  ShoppingCart,
  Package,
  Check,
  AlertCircle,
  Utensils,
  Coffee,
  BookOpen,
  LucideIcon
} from "lucide-react";

type FoodCategory = "Breakfast" | "Lunch" | "Dinner" | "Snacks" | "Beverages";

type FoodItemForm = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: FoodCategory;
  available: boolean;
};

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("food-items");
  const [isAddFoodItemOpen, setIsAddFoodItemOpen] = useState(false);
  const [isEditFoodItemOpen, setIsEditFoodItemOpen] = useState(false);
  const [isDeleteFoodItemOpen, setIsDeleteFoodItemOpen] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [cartItems, setCartItems] = useState([]);
  const showToast = useToastNotification();

  const [formData, setFormData] = useState<FoodItemForm>({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    category: "Snacks",
    available: true,
  });

  // Load cart from localStorage
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

  // Fetch food items
  const { 
    data: foodItems, 
    isLoading: foodItemsLoading,
    refetch: refetchFoodItems
  } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
  });

  // Fetch all orders
  const { 
    data: orders, 
    isLoading: ordersLoading,
    refetch: refetchOrders
  } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!user?.isAdmin,
  });

  // Add food item mutation
  const addFoodItemMutation = useMutation({
    mutationFn: async (data: FoodItemForm) => {
      const res = await apiRequest("POST", "/api/admin/food-items", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      showToast({ message: "Food item added successfully", type: "success" });
      setIsAddFoodItemOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      showToast({ message: `Failed to add food item: ${error.message}`, type: "error" });
    }
  });

  // Update food item mutation
  const updateFoodItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<FoodItem> }) => {
      const res = await apiRequest("PUT", `/api/admin/food-items/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      showToast({ message: "Food item updated successfully", type: "success" });
      setIsEditFoodItemOpen(false);
    },
    onError: (error: Error) => {
      showToast({ message: `Failed to update food item: ${error.message}`, type: "error" });
    }
  });

  // Delete food item mutation
  const deleteFoodItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/food-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      showToast({ message: "Food item deleted successfully", type: "success" });
      setIsDeleteFoodItemOpen(false);
    },
    onError: (error: Error) => {
      showToast({ message: `Failed to delete food item: ${error.message}`, type: "error" });
    }
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      showToast({ message: "Order status updated successfully", type: "success" });
    },
    onError: (error: Error) => {
      showToast({ message: `Failed to update order status: ${error.message}`, type: "error" });
    }
  });

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      category: "Snacks",
      available: true,
    });
  };

  // Handle edit food item
  const handleEditFoodItem = (foodItem: FoodItem) => {
    setSelectedFoodItem(foodItem);
    setFormData({
      name: foodItem.name,
      description: foodItem.description,
      price: foodItem.price,
      imageUrl: foodItem.imageUrl,
      category: foodItem.category as FoodCategory,
      available: foodItem.available,
    });
    setIsEditFoodItemOpen(true);
  };

  // Handle delete food item
  const handleDeleteFoodItem = (foodItem: FoodItem) => {
    setSelectedFoodItem(foodItem);
    setIsDeleteFoodItemOpen(true);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle switch change
  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      available: checked,
    });
  };

  // Handle add food item form submission
  const handleAddFoodItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFoodItemMutation.mutate(formData);
  };

  // Handle edit food item form submission
  const handleEditFoodItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFoodItem) {
      updateFoodItemMutation.mutate({
        id: selectedFoodItem.id,
        data: formData,
      });
    }
  };

  // Handle delete food item confirmation
  const handleDeleteFoodItemConfirm = () => {
    if (selectedFoodItem) {
      deleteFoodItemMutation.mutate(selectedFoodItem.id);
    }
  };

  // Handle update order status
  const handleUpdateOrderStatus = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  // Get category icon
  const getCategoryIcon = (category: string): LucideIcon => {
    switch (category) {
      case "Breakfast":
        return Coffee;
      case "Lunch":
      case "Dinner":
        return Utensils;
      case "Beverages":
        return Coffee;
      case "Snacks":
      default:
        return BookOpen;
    }
  };

  // Get order status badge
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "preparing":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Preparing</Badge>;
      case "out-for-delivery":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Out for Delivery</Badge>;
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pending</Badge>;
    }
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Access Required</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              You need admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Header cartItems={cartItems} />
      
      <div className="pb-20 lg:pb-0">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Manage food items and orders</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="food-items">Food Items</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>

            {/* Food Items Tab */}
            <TabsContent value="food-items">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Food Items</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchFoodItems()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      resetForm();
                      setIsAddFoodItemOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              {foodItemsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Loading food items...</p>
                </div>
              ) : foodItems && foodItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {foodItems.map((item) => {
                    const CategoryIcon = getCategoryIcon(item.category);
                    
                    return (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="h-48 relative">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Badge 
                              className={`${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            >
                              {item.available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{item.name}</CardTitle>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <CategoryIcon className="h-4 w-4 mr-1" />
                                <span>{item.category}</span>
                              </div>
                            </div>
                            <div>
                              <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditFoodItem(item)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteFoodItem(item)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No food items found</h3>
                  <p className="text-gray-600 mb-4">Add some food items to get started.</p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setIsAddFoodItemOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Food Item
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">All Orders</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchOrders()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {ordersLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Loading orders...</p>
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Delivery Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate" title={order.items.map(item => `${item.name} x${item.quantity}`).join(", ")}>
                              {order.items.map(item => `${item.name} x${item.quantity}`).join(", ")}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(order.total)}</TableCell>
                          <TableCell>
                            {order.deliveryType === "hostel" 
                              ? `${order.hostelType} Hostel, Block ${order.hostelBlock}, Room ${order.roomNumber}`
                              : "Pickup"
                            }
                          </TableCell>
                          <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            <Select
                              defaultValue={order.status}
                              onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Update Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="preparing">Preparing</SelectItem>
                                <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600">Orders will appear here once customers place them.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Food Item Dialog */}
      <Dialog open={isAddFoodItemOpen} onOpenChange={setIsAddFoodItemOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Food Item</DialogTitle>
            <DialogDescription>
              Add a new food item to the menu.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddFoodItemSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Chicken Biryani"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. Aromatic rice with tender chicken pieces"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="e.g. https://example.com/image.jpg"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="available">Available for ordering</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddFoodItemOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addFoodItemMutation.isPending}>
                {addFoodItemMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Food Item Dialog */}
      <Dialog open={isEditFoodItemOpen} onOpenChange={setIsEditFoodItemOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Food Item</DialogTitle>
            <DialogDescription>
              Update the details of the food item.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditFoodItemSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Chicken Biryani"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. Aromatic rice with tender chicken pieces"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price (₹)</Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <select
                    id="edit-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-imageUrl">Image URL</Label>
                <Input
                  id="edit-imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="e.g. https://example.com/image.jpg"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-available"
                  checked={formData.available}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="edit-available">Available for ordering</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditFoodItemOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateFoodItemMutation.isPending}>
                {updateFoodItemMutation.isPending ? "Updating..." : "Update Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Food Item Dialog */}
      <Dialog open={isDeleteFoodItemOpen} onOpenChange={setIsDeleteFoodItemOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Food Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this food item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFoodItem && (
            <div className="py-4">
              <p className="font-medium">{selectedFoodItem.name}</p>
              <p className="text-sm text-gray-600">{selectedFoodItem.description}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteFoodItemOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteFoodItemConfirm}
              disabled={deleteFoodItemMutation.isPending}
            >
              {deleteFoodItemMutation.isPending ? "Deleting..." : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNav cartItems={cartItems} />
    </>
  );
}
