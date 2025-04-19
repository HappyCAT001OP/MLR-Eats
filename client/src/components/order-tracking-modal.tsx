import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, MapPin, Utensils } from "lucide-react";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderStatus: "preparing" | "out-for-delivery" | "delivered";
  deliveryLocation: string;
}

export function OrderTrackingModal({
  isOpen,
  onClose,
  orderStatus,
  deliveryLocation,
}: OrderTrackingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Track Your Order</DialogTitle>
        </DialogHeader>

        <div className="my-6">
          <div className="flex items-center mb-4 relative">
            {/* Order Placed */}
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center z-10">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            {/* Line */}
            <div className={`h-1 flex-grow mx-2 ${orderStatus !== "preparing" ? "bg-primary" : "bg-gray-200"}`}></div>
            {/* Preparing */}
            <div className={`w-8 h-8 rounded-full ${orderStatus !== "preparing" ? "bg-primary text-white" : "bg-gray-200 text-gray-600"} flex items-center justify-center z-10`}>
              {orderStatus !== "preparing" ? <CheckCircle2 className="h-5 w-5" /> : <Utensils className="h-5 w-5" />}
            </div>
            {/* Line */}
            <div className={`h-1 flex-grow mx-2 ${orderStatus === "delivered" ? "bg-primary" : "bg-gray-200"}`}></div>
            {/* Delivered */}
            <div className={`w-8 h-8 rounded-full ${orderStatus === "delivered" ? "bg-primary text-white" : "bg-gray-200 text-gray-600"} flex items-center justify-center z-10`}>
              {orderStatus === "delivered" ? <CheckCircle2 className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="font-medium">Order Placed</span>
            <span className={orderStatus !== "preparing" ? "font-medium" : "text-gray-500"}>Preparing</span>
            <span className={orderStatus === "delivered" ? "font-medium" : "text-gray-500"}>Delivered</span>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <h3 className="font-medium mb-2">Estimated Delivery</h3>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-primary mr-2" />
            <p>25-30 minutes</p>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">Delivery Location</h3>
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-primary mr-2" />
            <p>{deliveryLocation}</p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <DialogClose asChild>
            <Button type="button" variant="default">
              OK, Got It
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
