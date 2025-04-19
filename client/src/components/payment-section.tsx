import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || ""
);

interface CheckoutFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/payment-success",
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Thank you for your payment!",
        });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex justify-between space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </div>
    </form>
  );
}

interface PaymentSectionProps {
  amount: number;
  orderId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentSection({
  amount,
  orderId,
  onSuccess,
  onCancel,
}: PaymentSectionProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount,
          orderId,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to initialize payment"
          );
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Payment intent error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize payment. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [amount, orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          Initializing payment...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
        <p className="text-sm font-medium text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="rounded-lg border p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Could not initialize payment. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-lg font-medium">Payment Details</h3>
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance: { theme: "stripe" } }}
      >
        <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </div>
  );
}

interface SubscriptionPaymentProps {
  planId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubscriptionPayment({
  planId,
  onSuccess,
  onCancel,
}: SubscriptionPaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<any>(null);

  useEffect(() => {
    const fetchSubscriptionPayment = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiRequest(
          "POST",
          "/api/create-subscription-payment",
          { planId }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to initialize subscription"
          );
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPlanDetails(data.plan);
      } catch (err) {
        console.error("Subscription payment error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize subscription. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionPayment();
  }, [planId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          Initializing subscription...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
        <p className="text-sm font-medium text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!clientSecret || !planDetails) {
    return (
      <div className="rounded-lg border p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Could not initialize subscription. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-lg font-medium">Subscribe to {planDetails.name}</h3>
      <div className="mb-4 rounded-md bg-muted p-3">
        <p className="font-medium">{planDetails.name} - ₹{planDetails.price}</p>
        <p className="text-sm text-muted-foreground">{planDetails.description}</p>
        <p className="mt-2 text-sm">
          {planDetails.mealsPerDay} meals per day for {planDetails.duration} days
        </p>
      </div>
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance: { theme: "stripe" } }}
      >
        <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </div>
  );
}