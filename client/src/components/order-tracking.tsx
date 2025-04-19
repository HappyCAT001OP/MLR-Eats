import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PaymentSection } from "@/components/payment-section";
import { getOrderStatusLabel, formatDate } from "@/lib/utils";
import { Loader2, Clock, Check, Truck, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const OrderStatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "pending":
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case "preparing":
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case "out-for-delivery":
      return <Truck className="h-5 w-5 text-purple-500" />;
    case "delivered":
      return <Check className="h-5 w-5 text-green-500" />;
    case "cancelled":
      return <X className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const PaymentStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-100 text-green-800">Paid</Badge>;
    case "failed":
      return <Badge variant="outline" className="bg-red-100 text-red-800">Failed</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

interface OrderItemsDisplayProps {
  items: any[];
}

const OrderItemsDisplay = ({ items }: OrderItemsDisplayProps) => {
  const parsedItems = typeof items === 'string' 
    ? JSON.parse(items) 
    : items;
    
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parsedItems.map((item: any, index: number) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-right">{item.quantity}</TableCell>
            <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

interface OrderCardProps {
  order: Order;
  onOpenQrCode: (order: Order) => void;
  onPay: (order: Order) => void;
}

const OrderCard = ({ order, onOpenQrCode, onPay }: OrderCardProps) => {
  const { status, statusLabel, statusColor } = getOrderStatusLabel(order.status);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Order #{order.id}</CardTitle>
          <Badge 
            variant="outline" 
            className={`bg-${statusColor}-100 text-${statusColor}-800`}
          >
            {statusLabel}
          </Badge>
        </div>
        <CardDescription>
          Placed on {formatDate(order.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <OrderItemsDisplay items={order.items} />
          
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-medium">Payment Status:</span>
            <PaymentStatusBadge status={order.paymentStatus || "pending"} />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Total:</span>
            <span className="text-lg font-bold">₹{order.total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {order.paymentStatus !== "completed" && (
          <Button onClick={() => onPay(order)} variant="secondary">
            Pay Now
          </Button>
        )}
        
        {(order.status === "out-for-delivery" || order.status === "delivered") && (
          <Button onClick={() => onOpenQrCode(order)} variant="outline">
            {order.qrCode ? "View QR Code" : "Generate QR Code"}
          </Button>
        )}
        
        {order.status === "delivered" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="ml-auto">
                  Leave Review
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rate your meal experience</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
};

export function OrderTracking() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const handleOpenQrCode = (order: Order) => {
    setSelectedOrder(order);
    setQrDialogOpen(true);
    
    // If QR code doesn't exist yet, generate one
    if (!order.qrCode && order.status === "out-for-delivery") {
      generateQrCode(order.id);
    }
  };
  
  const handlePay = (order: Order) => {
    setSelectedOrder(order);
    setPaymentDialogOpen(true);
  };
  
  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({
      title: "Payment Successful",
      description: "Your order has been paid for and is being prepared.",
    });
  };
  
  const generateQrCode = async (orderId: number) => {
    try {
      // Generate a simple QR code string (in a real app, this would be more sophisticated)
      const qrCode = `MLRIT-ORDER-${orderId}-${Date.now()}`;
      
      const response = await apiRequest("PATCH", `/api/admin/orders/${orderId}/qr-code`, {
        qrCode,
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate QR code");
      }
      
      // Update the order in the cache
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      toast({
        title: "QR Code Generated",
        description: "Your QR code has been generated for order verification.",
      });
    } catch (error) {
      console.error("QR code generation error:", error);
      toast({
        title: "QR Code Generation Failed",
        description: "Could not generate QR code. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          Loading your orders...
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <X className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load orders</h3>
        <p className="text-muted-foreground mb-4">
          We couldn't load your order history. Please try again later.
        </p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/orders"] })}
        >
          Retry
        </Button>
      </div>
    );
  }
  
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
        <p className="text-muted-foreground mb-4">
          You haven't placed any orders yet.
        </p>
        <Button variant="outline" onClick={() => window.location.href = "/menu"}>
          Browse Menu
        </Button>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Your Orders</h2>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onOpenQrCode={handleOpenQrCode}
            onPay={handlePay}
          />
        ))}
      </div>
      
      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Verification QR Code</DialogTitle>
            <DialogDescription>
              Show this QR code to the delivery person to verify your order.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder?.qrCode ? (
            <div className="py-6 flex flex-col items-center">
              {/* In a real app, use a proper QR code generator */}
              <div className="border-4 border-black p-4 w-48 h-48 flex items-center justify-center text-center mb-4">
                QR: {selectedOrder.qrCode.substring(0, 12)}...
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Order #{selectedOrder.id} • {formatDate(selectedOrder.createdAt)}
              </p>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Generating QR code...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Payment</DialogTitle>
            <DialogDescription>
              Pay for your order to proceed with preparation.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <PaymentSection
              amount={selectedOrder.total}
              orderId={selectedOrder.id}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}