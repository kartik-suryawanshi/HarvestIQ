import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, MapPin, Wheat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PredictionHistoryProps {
  onSelectPrediction?: (prediction: any) => void;
}

interface Prediction {
  id: string;
  district: string;
  crop: string;
  season: string;
  scenario: string;
  yield_prediction: number;
  confidence_score: number;
  risk_level: string;
  created_at: string;
}

const PredictionHistory: React.FC<PredictionHistoryProps> = ({ onSelectPrediction }) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPredictions();
    }
  }, [user]);

  const fetchPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch prediction history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePrediction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('predictions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPredictions(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Deleted",
        description: "Prediction removed from history",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prediction",
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Wheat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Predictions Yet</h3>
          <p className="text-muted-foreground">
            Generate your first crop forecast to see your prediction history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">Prediction History</h3>
      {predictions.map((prediction) => (
        <Card key={prediction.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {prediction.district}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Wheat className="w-3 h-3" />
                    {prediction.crop}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(prediction.created_at), 'MMM dd, yyyy')}
                  </span>
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletePrediction(prediction.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Yield</p>
                <p className="font-semibold">{prediction.yield_prediction} t/ha</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="font-semibold">{prediction.confidence_score}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <Badge className={getRiskColor(prediction.risk_level)} variant="outline">
                  {prediction.risk_level}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scenario</p>
                <p className="font-semibold capitalize">{prediction.scenario}</p>
              </div>
            </div>
            {onSelectPrediction && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => onSelectPrediction(prediction)}
              >
                View Details
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PredictionHistory;