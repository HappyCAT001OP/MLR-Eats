import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, CheckCircle2 } from "lucide-react";

// Helper function to parse query parameters
function getQueryParams(url: string) {
  const paramString = url.split('?')[1];
  if (!paramString) return {};
  
  const params: Record<string, string> = {};
  paramString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    params[key] = decodeURIComponent(value || '');
  });
  
  return params;
}

export default function PaymentSuccessPage() {
  const isMobile = useIsMobile();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentType, setPaymentType] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  
  useEffect(() => {
    const params = getQueryParams(window.location.search);
    const { payment_intent, payment_intent_client_secret, redirect_status, type, order_id } = params;
    
    // If we have type and order_id directly, we're handling an internal redirect
    if (type && order_id) {
      setPaymentType(type);
      setOrderId(parseInt(order_id, 10));
      setIsProcessing(false);
      return;
    }
    
    // If we have payment_intent, we're handling a Stripe redirect
    if (payment_intent && redirect_status === 'succeeded') {
      const processPayment = async () => {
        try {
          // Verify payment status with our backend
          const response = await apiRequest('POST', '/api/confirm-payment', {
            paymentIntentId: payment_intent,
          });
          
          if (!response.ok) {
            throw new Error('Failed to confirm payment');
          }
          
          const data = await response.json();
          setPaymentType(data.type);
          if (data.orderId) setOrderId(data.orderId);
          
          toast({
            title: 'Payment Successful',
            description: 'Your payment has been processed successfully.',
          });
          
          // Invalidate relevant queries
          if (data.type === 'order') {
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          } else if (data.type === 'subscription') {
            queryClient.invalidateQueries({ queryKey: ['/api/user/active-subscription'] });
          } else if (data.type === 'wallet') {
            queryClient.invalidateQueries({ queryKey: ['/api/user/wallet'] });
          }
        } catch (error) {
          console.error('Payment confirmation error:', error);
          toast({
            title: 'Payment Confirmation Error',
            description: 'There was an issue confirming your payment. Please contact support.',
            variant: 'destructive',
          });
        } finally {
          setIsProcessing(false);
        }
      };
      
      processPayment();
    } else {
      // No payment information found, redirect to home
      navigate('/');
    }
  }, [location, navigate, toast]);
  
  function getSuccessMessage() {
    if (paymentType === 'order') {
      return {
        title: 'Order Payment Successful',
        description: 'Your order has been placed and payment processed successfully.',
        buttonText: 'View My Order',
        buttonLink: '/orders',
      };
    } else if (paymentType === 'subscription') {
      return {
        title: 'Subscription Activated',
        description: 'Your meal subscription has been activated successfully.',
        buttonText: 'View My Subscription',
        buttonLink: '/subscriptions',
      };
    } else if (paymentType === 'wallet') {
      return {
        title: 'Wallet Recharge Successful',
        description: 'Your wallet has been recharged successfully.',
        buttonText: 'Go to My Wallet',
        buttonLink: '/wallet',
      };
    }
    
    return {
      title: 'Payment Successful',
      description: 'Your payment has been processed successfully.',
      buttonText: 'Go to Home',
      buttonLink: '/',
    };
  }
  
  const successMessage = getSuccessMessage();
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isMobile && <Header cartItems={[]} />}
      <main className="flex-1 container mx-auto py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          {isProcessing ? (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
              <p className="text-muted-foreground mb-8">
                Please wait while we confirm your payment...
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">{successMessage.title}</h1>
              <p className="text-muted-foreground mb-8">{successMessage.description}</p>
              
              {orderId && (
                <p className="font-medium mb-6">
                  Order ID: #{orderId}
                </p>
              )}
              
              <Button size="lg" onClick={() => navigate(successMessage.buttonLink)}>
                {successMessage.buttonText}
              </Button>
            </>
          )}
        </div>
      </main>
      {isMobile && <MobileNav cartItems={[]} />}
    </div>
  );
}