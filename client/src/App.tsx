import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/home";
import { useEffect } from "react";

function Router() {
  const [location, setLocation] = useLocation();

  // Simple redirect for demo purposes - in a real app this would check auth state
  useEffect(() => {
    if (location === "/login") {
      setLocation("/auth");
    }
  }, [location, setLocation]);

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={Dashboard} />
      {/* Add more routes as needed */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
