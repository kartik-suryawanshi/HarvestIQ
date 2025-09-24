import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import ControlPanel from '@/components/ControlPanel';
import DashboardCards from '@/components/DashboardCards';
import InsightsPanel from '@/components/InsightsPanel';
import PredictionHistory from '@/components/PredictionHistory';
import { Button } from '@/components/ui/button';
import { mockApiCall, ForecastData } from '@/lib/mockData';
import { Save, History } from 'lucide-react';

const WEATHER_API_KEY = '903fb6f8bda543aebc491957252409'; // Replace with your actual WeatherAPI.com key
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

const Dashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State management
  const [scenario, setScenario] = useState('normal');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [weeklyForecastData, setWeeklyForecastData] = useState<any[]>([]); // New state for 7-day forecast

  // Fetch 7-day forecast when selectedDistrict changes
  useEffect(() => {
    if (selectedDistrict) {
      setIsLoading(true); // Set loading to true before fetching
      fetchWeeklyForecast(selectedDistrict);
    } else {
      setWeeklyForecastData([]);
    }
  }, [selectedDistrict]);

  const fetchWeeklyForecast = async (district: string) => {
    try {
      const response = await fetch(
        `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${district}&days=7`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const formattedForecast = data.forecast.forecastday.map((day: any) => ({
        day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: day.day.avgtemp_c,
        rain: day.day.totalprecip_mm,
        conditionIcon: day.day.condition.icon,
      }));
      setWeeklyForecastData(formattedForecast);
    } catch (error) {
      console.error('Error fetching weekly forecast:', error);
      toast({
        title: 'Weather Forecast Error',
        description: 'Failed to fetch 7-day weather forecast. Please try again later.',
        variant: 'destructive',
        duration: 4000,
      });
      setWeeklyForecastData([]);
    } finally {
      setIsLoading(false); // Set loading to false after fetch attempt
    }
  };

  const handleScenarioChange = (newScenario: string) => {
    setScenario(newScenario);
    
    // Show toast notification
    const scenarioLabels = {
      normal: 'Normal Season',
      drought: 'Drought Alert',
      wet: 'Wet Season'
    };
    
    toast({
      title: "Scenario Updated",
      description: `Switched to ${scenarioLabels[newScenario as keyof typeof scenarioLabels]} simulation`,
      duration: 3000,
    });

    // If we have existing data, regenerate with new scenario
    if (forecastData && selectedDistrict && selectedCrop && selectedSeason) {
      handleGenerateForecast();
    }
  };

  const handleGenerateForecast = async () => {
    if (!selectedDistrict || !selectedCrop || !selectedSeason) {
      toast({
        title: "Missing Information",
        description: "Please select district, crop, and season before generating forecast",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Show loading progress toast
      const progressToast = toast({
        title: "Generating Forecast",
        description: "Analyzing satellite data → Computing crop model → Optimizing irrigation",
        duration: 8000,
      });

      const data = await mockApiCall(selectedDistrict, selectedCrop, selectedSeason, scenario);
      
      setForecastData(data);
      
      // Success toast
      toast({
        title: "Forecast Generated Successfully",
        description: `Yield prediction ready for ${selectedCrop} in ${selectedDistrict}`,
        duration: 4000,
      });

    } catch (error) {
      toast({
        title: "Forecast Generation Failed",
        description: "Unable to generate forecast. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePrediction = async () => {
    if (!forecastData || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('predictions')
        .insert({
          user_id: user.id,
          district: selectedDistrict,
          crop: selectedCrop,
          season: selectedSeason,
          scenario: scenario,
          yield_prediction: parseFloat(forecastData.yieldPrediction.value),
          confidence_score: forecastData.yieldPrediction.confidence,
          risk_level: forecastData.riskAssessment.level > 70 ? 'high' : forecastData.riskAssessment.level > 40 ? 'moderate' : 'low',
          irrigation_schedule: forecastData.irrigationSchedule,
          weather_data: {
            currentWeather: forecastData.currentWeather,
            weatherTrend: forecastData.weatherTrend,
            weeklyForecast: forecastData.weeklyForecast
          },
        });

      if (error) throw error;

      toast({
        title: "Prediction Saved",
        description: "Your forecast has been saved to history",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save prediction to history",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header scenario={scenario} onScenarioChange={handleScenarioChange} />
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-3 lg:sticky lg:top-6 lg:self-start h-max">
            <ControlPanel
              selectedDistrict={selectedDistrict}
              selectedCrop={selectedCrop}
              selectedSeason={selectedSeason}
              isLoading={isLoading}
              onDistrictChange={setSelectedDistrict}
              onCropChange={setSelectedCrop}
              onSeasonChange={setSelectedSeason}
              onGenerateForecast={handleGenerateForecast}
            />
          </div>

          {/* Main Dashboard - Cards */}
          <div className="lg:col-span-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {showHistory ? 'Prediction History' : 'Forecast Dashboard'}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? <History className="w-4 h-4 mr-2" /> : <History className="w-4 h-4 mr-2" />}
                    {showHistory ? 'Back to Dashboard' : 'View History'}
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  {showHistory 
                    ? 'Your saved crop predictions and forecasts'
                    : forecastData 
                      ? `Showing results for ${selectedCrop} in ${selectedDistrict}` 
                      : 'Select location and crop to generate AI-powered forecast'
                  }
                </p>
              </div>
              {!showHistory && forecastData && (
                <Button
                  onClick={savePrediction}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Prediction'}
                </Button>
              )}
            </div>
            
            {showHistory ? (
              <PredictionHistory />
            ) : (
              <DashboardCards 
                forecastData={forecastData} 
                scenario={scenario}
                weeklyForecast={weeklyForecastData} // Pass weekly forecast data
              />
            )}
          </div>

          {/* Right Panel - Insights */}
          <div className="lg:col-span-3 lg:sticky lg:top-6 lg:self-start h-max">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Additional Insights</h3>
              <p className="text-sm text-muted-foreground">
                Satellite data and model information
              </p>
            </div>
            
            <InsightsPanel hasData={!!forecastData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;