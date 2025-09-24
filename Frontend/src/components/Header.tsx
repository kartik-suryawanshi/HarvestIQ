import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf, CloudRain, Sun, AlertTriangle, User, LogOut, Zap } from 'lucide-react';

interface HeaderProps {
  scenario: string;
  onScenarioChange: (scenario: string) => void;
}

const scenarios = {
  normal: { label: 'Normal Season', icon: Sun, color: 'success' },
  drought: { label: 'Drought Alert', icon: AlertTriangle, color: 'warning' },
  wet: { label: 'Wet Season', icon: CloudRain, color: 'water' }
};

const Header = ({ scenario, onScenarioChange }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const currentScenario = scenarios[scenario as keyof typeof scenarios];
  const IconComponent = currentScenario?.icon || Sun;

  return (
    <header className="bg-card border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Leaf className="h-7 w-7 md:h-8 md:w-8 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Agri-Forecasting Hub</h1>
            <Badge variant="secondary" className="hidden md:inline-flex text-xs md:text-sm">
              AI-Powered Crop Prediction for Indian Agriculture
            </Badge>
          </div>

          <div className="flex flex-1 md:flex-none items-center gap-3 md:gap-4 min-w-0">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="hidden sm:inline text-sm font-medium text-muted-foreground">Scenario:</span>
              <Select value={scenario} onValueChange={onScenarioChange}>
                <SelectTrigger className="w-full sm:w-56">
                  <div className="flex items-center gap-2 truncate">
                    <IconComponent className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(scenarios).map(([key, { label, icon: Icon }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto flex items-center gap-3 md:gap-4">
              <Badge variant="secondary" className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20">
                <Zap className="w-3 h-3 mr-1" />
                Mock API
              </Badge>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground max-w-[200px] truncate">
                  <User className="w-4 h-4" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;