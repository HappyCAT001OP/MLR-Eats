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
import SignupPage from "@/pages/signup-page";
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
