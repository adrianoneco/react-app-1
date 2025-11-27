import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/home";
import UsersPage from "@/pages/users";
import ResetPasswordPage from "@/pages/reset-password";
import { AuthProvider, ProtectedRoute, useAuth } from "@/lib/auth";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/auth">
        {user ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      <Route path="/reset-password">
        <ResetPasswordPage />
      </Route>
      
      {/* Protected Routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/users" component={UsersPage} />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
