import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface ToastNotificationProps {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

export function useToastNotification() {
  const { toast } = useToast();

  const showToast = ({ message, type, duration = 3000 }: ToastNotificationProps) => {
    let icon;
    
    switch (type) {
      case "success":
        icon = <CheckCircle2 className="h-5 w-5" />;
        break;
      case "error":
        icon = <AlertCircle className="h-5 w-5" />;
        break;
      case "info":
      default:
        icon = <Info className="h-5 w-5" />;
        break;
    }

    toast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === "error" ? "destructive" : "default",
      duration: duration,
    });
  };

  return showToast;
}
