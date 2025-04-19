import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubscriptionPayment } from "@/components/payment-section";
import { Loader2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionPlan } from "@shared/schema";

export function SubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const {
    data: plans,
    isLoading,
    error,
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const { data: activeSubscription, isLoading: loadingActiveSubscription } = 
    useQuery({
      queryKey: ["/api/user/active-subscription"],
      retry: false, // Don't retry on 404
      onError: () => {} // Silently ignore 404 error
    });

  if (isLoading || loadingActiveSubscription) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          Loading subscription plans...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load subscription plans. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubscribe = (planId: number) => {
    setSelectedPlan(planId);
    setPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentOpen(false);
    // Force a refetch of the active subscription
    window.location.reload();
  };

  if (activeSubscription) {
    // Find the plan details
    const plan = plans?.find((p) => p.id === activeSubscription.planId);
    
    return (
      <div className="w-full max-w-3xl mx-auto">
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Active Subscription</AlertTitle>
          <AlertDescription>
            You have an active subscription plan until{" "}
            {new Date(activeSubscription.endDate).toLocaleDateString()}.
            <br />
            Remaining meals: {activeSubscription.remainingMeals}
          </AlertDescription>
        </Alert>
        
        <div className="p-4 border rounded-lg bg-muted/50">
          <h3 className="text-lg font-semibold">{plan?.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{plan?.description}</p>
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">Duration:</span>
              <span>{plan?.duration} days</span>
            </div>
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">Meals/day:</span>
              <span>{plan?.mealsPerDay}</span>
            </div>
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">Start date:</span>
              <span>{new Date(activeSubscription.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">End date:</span>
              <span>{new Date(activeSubscription.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Choose a Subscription Plan
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans?.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(plan.price)}
              </div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>{plan.duration} days of meal subscription</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>{plan.mealsPerDay} meals per day</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Total meals: {plan.duration * plan.mealsPerDay}</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(plan.id)}
              >
                Subscribe Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Subscribe to Plan</DialogTitle>
          {selectedPlan && (
            <SubscriptionPayment
              planId={selectedPlan}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setPaymentOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}