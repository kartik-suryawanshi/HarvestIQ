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
import { useI18n } from '@/contexts/I18nContext';
import { getCropSuggestion } from '@/lib/cropSuggest';

// Weather config is read from environment via Vite.

const Dashboard = () => {
  const { toast } = useToast();
  const { t } = useI18n();
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
  const [suggestedCrops, setSuggestedCrops] = useState<string[] | null>(null);
  const [suggestionRationale, setSuggestionRationale] = useState<string | null>(null);
  // Soil state (user-provided)
  const [soilType, setSoilType] = useState('');
  const [soilPh, setSoilPh] = useState('');
  const [soilOrganicMatter, setSoilOrganicMatter] = useState('');
  const [soilDrainage, setSoilDrainage] = useState<'' | 'poor' | 'moderate' | 'good'>('');

  // Weekly forecast (optional external API)
  const WEATHER_API_BASE_URL = (import.meta as any).env?.VITE_WEATHER_API_BASE_URL;
  const WEATHER_API_KEY = (import.meta as any).env?.VITE_WEATHER_API_KEY;
  const [weeklyForecastData, setWeeklyForecastData] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedDistrict) {
      setWeeklyForecastData([]);
      return;
    }
    // Only attempt fetch if API config provided
    if (WEATHER_API_BASE_URL && WEATHER_API_KEY) {
      setIsLoading(true);
      fetchWeeklyForecast(selectedDistrict);
    }
  }, [selectedDistrict]);

  const fetchWeeklyForecast = async (district: string) => {
    try {
      const response = await fetch(
        `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(district)}&days=7`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const formattedForecast = (data?.forecast?.forecastday || []).map((day: any) => ({
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
      setIsLoading(false);
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

      // Also fetch Gemini crop suggestions using provided soil inputs (if any provided)
      const hasUserSoil = Boolean(
        (soilType && soilType.trim()) ||
        (soilDrainage && soilDrainage.trim && soilDrainage.trim()) ||
        (soilPh && String(soilPh).trim()) ||
        (soilOrganicMatter && String(soilOrganicMatter).trim())
      );
      if (hasUserSoil) {
        try {
          const res = await getCropSuggestion({
            soilType: soilType?.trim().toLowerCase() || undefined,
            ph: soilPh?.toString().trim() || undefined,
            organicMatterPct: soilOrganicMatter?.toString().trim() || undefined,
            drainage: (typeof soilDrainage === 'string' ? soilDrainage : '')?.toLowerCase() || undefined,
            location: selectedDistrict || undefined,
            crop: selectedCrop || undefined,
          });
          setSuggestedCrops(res.crops ?? []);
          setSuggestionRationale(res.rationale ?? null);
        } catch (e: any) {
          console.error('Gemini suggestion failed:', e);
          setSuggestedCrops(null);
          setSuggestionRationale(null);
        }
      } else {
        setSuggestedCrops(null);
        setSuggestionRationale(null);
      }
      
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
      const payload = {
        user_id: user.id,
        district: selectedDistrict,
        crop: selectedCrop,
        season: selectedSeason,
        scenario: scenario,
        yield_prediction: Number(parseFloat(forecastData.yieldPrediction.value).toFixed(2)),
        confidence_score: Math.round(forecastData.yieldPrediction.confidence),
        risk_level: forecastData.riskAssessment.level > 70 ? 'high' : forecastData.riskAssessment.level > 40 ? 'moderate' : 'low',
        irrigation_schedule: forecastData.irrigationSchedule,
        weather_data: {
          currentWeather: forecastData.currentWeather,
          weatherTrend: forecastData.weatherTrend,
          weeklyForecast: forecastData.weeklyForecast
        },
      } as const;

      const { error } = await supabase
        .from('predictions')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Prediction Saved",
        description: "Your forecast has been saved to history",
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Save prediction failed:', error);
      toast({
        title: "Save Failed",
        description: error?.message || "Could not save prediction to history",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Removed manual Suggest button; suggestions now fetched during forecast generation

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
              soilType={soilType}
              soilPh={soilPh}
              soilOrganicMatter={soilOrganicMatter}
              soilDrainage={soilDrainage}
              onSoilTypeChange={setSoilType}
              onSoilPhChange={setSoilPh}
              onSoilOrganicMatterChange={setSoilOrganicMatter}
              onSoilDrainageChange={(v) => setSoilDrainage(v)}
            />
          </div>
    
          {/* Main Dashboard - Cards */}
          <div className="lg:col-span-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {showHistory ? t('prediction_history') : t('forecast_dashboard')}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? <History className="w-4 h-4 mr-2" /> : <History className="w-4 h-4 mr-2" />}
                    {showHistory ? t('back_to_dashboard') : t('view_history')}
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  {showHistory 
                    ? t('saved_predictions_subtitle')
                    : forecastData 
                      ? `Showing results for ${selectedCrop} in ${selectedDistrict}` 
                      : t('select_to_generate_subtitle')
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
                  {isSaving ? 'Saving...' : t('save_prediction')}
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
            
            <InsightsPanel
              hasData={!!forecastData || (suggestedCrops && suggestedCrops.length > 0)}
              soilProfile={
                soilType && soilDrainage && soilPh
                  ? {
                      type: soilType,
                      ph: parseFloat(soilPh) || (forecastData?.soilProfile?.ph ?? 6.5),
                      organicMatterPct: parseFloat(soilOrganicMatter) || (forecastData?.soilProfile?.organicMatterPct ?? 1.5),
                      drainage: soilDrainage,
                    }
                  : forecastData?.soilProfile
              }
              suggestedCrops={suggestedCrops}
              suggestionRationale={suggestionRationale}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;