import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import MenuPage from "@/pages/menu-page";
import CartPage from "@/pages/cart-page";
import ProfilePage from "@/pages/profile-page";
import AdminPage from "@/pages/admin-page";
import SignupPage from "./pages/signup-page";
import SubscriptionsPage from "@/pages/subscriptions-page";
import WalletPage from "@/pages/wallet-page";
import OrdersPage from "@/pages/orders-page";
import PaymentSuccessPage from "@/pages/payment-success-page";
import { ProtectedRoute } from "./lib/protected-route";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <ProtectedRoute path="/" component={MenuPage} />
      )} />
      
      <Route path="/cart" component={() => (
        <ProtectedRoute path="/cart" component={CartPage} />
      )} />
      
      <Route path="/profile" component={() => (
        <ProtectedRoute path="/profile" component={ProfilePage} />
      )} />
      
      <Route path="/admin" component={() => (
        <ProtectedRoute path="/admin" component={AdminPage} />
      )} />
      
      <Route path="/subscriptions" component={() => (
        <ProtectedRoute path="/subscriptions" component={SubscriptionsPage} />
      )} />
      
      <Route path="/wallet" component={() => (
        <ProtectedRoute path="/wallet" component={WalletPage} />
      )} />
      
      <Route path="/orders" component={() => (
        <ProtectedRoute path="/orders" component={OrdersPage} />
      )} />
      
      <Route path="/payment-success" component={() => (
        <ProtectedRoute path="/payment-success" component={PaymentSuccessPage} />
      )} />
      
      <Route path="/auth" component={AuthPage} />
      <Route path="/signup" component={SignupPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;
