import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Wallet, PlusCircle, CreditCard } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || ""
);

const addMoneySchema = z.object({
  amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number()
      .min(50, "Minimum amount is ₹50")
      .max(10000, "Maximum amount is ₹10,000")
  ),
});

type AddMoneyFormValues = z.infer<typeof addMoneySchema>;

function PaymentForm({ amount, onSuccess, onCancel }: { amount: number, onSuccess: () => void, onCancel: () => void }) {
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
          return_url: window.location.origin + "/wallet",
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
          description: `₹${amount} has been added to your wallet.`,
        });
        onSuccess();
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
      <div className="rounded-md bg-muted p-3 mb-4">
        <p className="font-medium">Adding ₹{amount} to your wallet</p>
        <p className="text-sm text-muted-foreground">Enter your payment details below</p>
      </div>
      
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
            "Add Money"
          )}
        </Button>
      </div>
    </form>
  );
}

function AddMoneyDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [amount, setAmount] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<AddMoneyFormValues>({
    resolver: zodResolver(addMoneySchema),
    defaultValues: {
      amount: undefined,
    },
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      const res = await apiRequest("POST", "/api/create-payment-intent", {
        amount: data.amount,
        orderId: 0, // Use a special value to indicate wallet recharge
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create payment intent");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addToWalletMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      const res = await apiRequest("POST", "/api/user/wallet/add", {
        amount: data.amount,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add money to wallet");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `₹${amount} has been added to your wallet.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] });
      resetDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AddMoneyFormValues) => {
    setAmount(values.amount);
    createPaymentIntentMutation.mutate({ amount: values.amount });
  };

  const handlePaymentSuccess = () => {
    if (amount) {
      addToWalletMutation.mutate({ amount });
    }
  };

  const resetDialog = () => {
    setAmount(null);
    setClientSecret(null);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Money to Wallet</DialogTitle>
          <DialogDescription>
            Enter the amount you want to add to your wallet.
          </DialogDescription>
        </DialogHeader>
        
        {!clientSecret ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Min: ₹50, Max: ₹10,000
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createPaymentIntentMutation.isPending ||
                    !form.formState.isValid
                  }
                >
                  {createPaymentIntentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Continue to Payment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <PaymentForm
              amount={amount || 0}
              onSuccess={handlePaymentSuccess}
              onCancel={resetDialog}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function WalletPage() {
  const [addMoneyDialogOpen, setAddMoneyDialogOpen] = useState(false);
  
  const {
    data: walletData,
    isLoading,
    error,
  } = useQuery<{ balance: number }>({
    queryKey: ["/api/user/wallet"],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          Loading wallet information...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Failed to load wallet information. Please try again later.
        </p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/user/wallet"] })}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Your Wallet</h2>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Current Balance</CardTitle>
          <CardDescription>
            Available funds for purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="text-3xl font-bold">
              ₹{walletData?.balance.toFixed(2) || "0.00"}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => setAddMoneyDialogOpen(true)}
            className="w-full"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Money
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Methods</CardTitle>
          <CardDescription>
            Manage your payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center space-x-4 p-3 border rounded-md">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Stripe</p>
              <p className="text-sm text-muted-foreground">
                Pay with credit/debit card
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-muted-foreground w-full">
            We use Stripe to process payments securely. Your card information is never stored on our servers.
          </p>
        </CardFooter>
      </Card>
      
      <AddMoneyDialog
        open={addMoneyDialogOpen}
        onOpenChange={setAddMoneyDialogOpen}
      />
    </div>
  );
}