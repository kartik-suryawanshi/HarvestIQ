import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The agricultural forecast page you're looking for doesn't exist. 
            Let's get you back to the dashboard.
          </p>
          
          <Button asChild className="w-full">
            <a href="/" className="flex items-center justify-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
