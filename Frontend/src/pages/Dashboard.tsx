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
import { predictCrop, getIrrigationSchedule } from '@/lib/mlClient';
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
  // Soil state (user-provided)
  const [soilType, setSoilType] = useState('');
  const [soilPh, setSoilPh] = useState('');
  const [soilOrganicMatter, setSoilOrganicMatter] = useState('');
  const [soilDrainage, setSoilDrainage] = useState<'' | 'poor' | 'moderate' | 'good'>('');
  // ML Inputs
  const [avgTemp, setAvgTemp] = useState('');
  const [tmax, setTmax] = useState('');
  const [tmin, setTmin] = useState('');
  const [sowingDate, setSowingDate] = useState('');

  // Weekly forecast (optional external API)
  const WEATHER_API_BASE_URL = (import.meta as any).env?.VITE_WEATHER_API_BASE_URL || 'https://api.weatherapi.com/v1';
  const WEATHER_API_KEY = (import.meta as any).env?.VITE_WEATHER_API_KEY;
  const [weeklyForecastData, setWeeklyForecastData] = useState<any[]>([]);
  const [weatherTrendData, setWeatherTrendData] = useState<any[]>([]);

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
      const daysArr = (data?.forecast?.forecastday || []);
      const formattedForecast = daysArr.map((day: any) => ({
        day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
        temp: day.day.avgtemp_c,
        rain: day.day.totalprecip_mm,
        humidity: day.day.avghumidity,
        conditionText: day.day.condition?.text,
        conditionIcon: day.day.condition?.icon,
      }));
      setWeeklyForecastData(formattedForecast);
      // Build a simple 30-day trend from daily precip (repeat pattern if fewer than 30)
      const trend: any[] = [];
      const source = daysArr.map((d: any) => ({
        day: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rainfall: d.day.totalprecip_mm,
        temperature: d.day.avgtemp_c,
      }));
      for (let i = 0; i < 30; i++) {
        const s = source[i % source.length] || { day: `D${i+1}`, rainfall: 0, temperature: 0 };
        trend.push({ day: s.day, rainfall: s.rainfall, temperature: s.temperature });
      }
      setWeatherTrendData(trend);
    } catch (error) {
      console.error('Error fetching weekly forecast:', error);
      toast({
        title: 'Weather Forecast Error',
        description: 'Failed to fetch 7-day weather forecast. Please try again later.',
        variant: 'destructive',
        duration: 4000,
      });
      setWeeklyForecastData([]);
      setWeatherTrendData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const computeRisk = (
    weekly: Array<{ temp: number; rain: number; humidity?: number }>,
    soil: { type?: string; drainage?: string },
    crop: string,
    sowDate?: string
  ) => {
    if (!weekly || !weekly.length) return { level: 40, reason: 'Insufficient data; using default risk.' };
    const hotDays = weekly.filter((d) => (Number(d.temp) || 0) >= 34).length;
    const veryHotDays = weekly.filter((d) => (Number(d.temp) || 0) >= 38).length;
    const totalRain = weekly.reduce((a, b) => a + (Number(b.rain) || 0), 0);
    const avgHumidity = weekly.reduce((a, b) => a + (Number(b.humidity ?? 0)), 0) / weekly.length || 0;

    let risk = 20;
    risk += hotDays * 6 + veryHotDays * 8;
    if (totalRain < 20) risk += 20; else if (totalRain < 50) risk += 10;
    if ((crop || '').toLowerCase().includes('rice') && avgHumidity >= 80) risk += 10;
    const drainage = (soil.drainage || '').toLowerCase();
    if (drainage === 'poor' && totalRain > 60) risk += 10;
    if (drainage === 'good' && totalRain < 20) risk += 5;
    if (sowDate) {
      const s = new Date(sowDate);
      const now = new Date();
      const das = Math.max(0, Math.round((now.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      if (das >= 40 && das <= 70) risk += 8;
    }
    risk = Math.max(0, Math.min(100, Math.round(risk)));
    const reasons: string[] = [];
    if (veryHotDays) reasons.push(`${veryHotDays} very hot day(s) (>38°C)`);
    if (hotDays) reasons.push(`${hotDays} hot day(s) (>34°C)`);
    reasons.push(`Rain next 7 days: ${Math.round(totalRain)} mm`);
    if (avgHumidity) reasons.push(`Avg humidity: ${Math.round(avgHumidity)}%`);
    if (drainage === 'poor' && totalRain > 60) reasons.push('Waterlogging risk on poorly drained soil');
    if (drainage === 'good' && totalRain < 20) reasons.push('Fast drainage may increase drought stress');
    return { level: risk, reason: reasons.join(' • ') };
  };

  const handleScenarioChange = (newScenario: string) => {
    setScenario(newScenario);
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
    if (forecastData && selectedDistrict && selectedCrop && selectedSeason) {
      handleGenerateForecast();
    }
  };

  const handleGenerateForecast = async () => {
    if (!selectedDistrict || !selectedCrop || !selectedSeason || !sowingDate) {
      toast({
        title: "Missing Information",
        description: "Please select district, crop, season, and sowing date before generating forecast",
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

      // If weekly forecast fetched, derive temps from it; otherwise use ML inputs if provided
      if (weeklyForecastData.length) {
        const temps = weeklyForecastData.map(d => d.temp);
        const avg = temps.reduce((a:number,b:number)=>a+b,0) / temps.length;
        const max = Math.max(...temps);
        const min = Math.min(...temps);
        setAvgTemp(String(avg.toFixed(1)));
        setTmax(String(max.toFixed(1)));
        setTmin(String(min.toFixed(1)));

        const ml = await predictCrop({
          crop_type: selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1),
          avg_temp: avg,
          tmax: max,
          tmin: min,
          sowing_date: sowingDate,
        });
        // Get irrigation schedule using ML crop_cycle and weekly weather
        let irrigationScheduleResp: any = null;
        try {
          irrigationScheduleResp = await getIrrigationSchedule({
            crop_type: selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1),
            sowing_date: sowingDate,
            weekly_forecast: weeklyForecastData,
            crop_cycle: ml,
            soil_profile: soilType ? { type: soilType, ph: soilPh ? Number(soilPh) : undefined, organicMatterPct: soilOrganicMatter ? Number(soilOrganicMatter) : undefined, drainage: soilDrainage || undefined } : undefined,
          });
        } catch (e) {
          irrigationScheduleResp = null;
        }

        const normalizeFeatureName = (n: string) => {
          if (!n) return '';
          if (n.startsWith('Crop_')) {
            const pretty = selectedCrop ? (selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)) : n.replace('Crop_', '');
            return pretty;
          }
          return n.replace(/_/g, ' ');
        };

        const liveRisk = computeRisk(weeklyForecastData as any, { type: soilType, drainage: soilDrainage || undefined }, selectedCrop, sowingDate);
        const today = (weeklyForecastData as any)[0];
        const mapped: ForecastData = {
          currentWeather: {
            temperature: avg,
            humidity: today?.humidity ?? 70,
            conditions: today?.conditionText || '—'
          },
          riskAssessment: liveRisk,
          weatherTrend: weatherTrendData.length ? weatherTrendData : (forecastData?.weatherTrend || []),
          weeklyForecast: weeklyForecastData.length ? weeklyForecastData : (forecastData?.weeklyForecast || []),
          yieldPrediction: { value: (ml.prediction.yield_t_ha ?? 0).toFixed(2), confidence: 80, vsHistorical: 0 },
          featureImportance: (ml.feature_importances || []).map(f => ({ name: normalizeFeatureName(f.name), impact: Math.round((f.impact || 0) * 100) })),
          explanation: ml.explanation_text || '',
          irrigationSchedule: irrigationScheduleResp?.irrigation_schedule || (forecastData?.irrigationSchedule || []),
          waterSavings: typeof irrigationScheduleResp?.water_savings === 'number' ? irrigationScheduleResp.water_savings : 0,
          soilProfile: forecastData?.soilProfile || { type: 'Loam', ph: 6.5, organicMatterPct: 1.5, drainage: 'moderate' },
        };
        setForecastData(mapped);
      } else if (avgTemp && tmax && tmin && sowingDate) {
        const ml = await predictCrop({
          crop_type: selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1),
          avg_temp: parseFloat(avgTemp),
          tmax: parseFloat(tmax),
          tmin: parseFloat(tmin),
          sowing_date: sowingDate,
        });
        // Get irrigation schedule using ML crop_cycle and weekly weather
        let irrigationScheduleResp: any = null;
        try {
          irrigationScheduleResp = await getIrrigationSchedule({
            crop_type: selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1),
            sowing_date: sowingDate,
            weekly_forecast: weeklyForecastData,
            crop_cycle: ml,
            soil_profile: soilType ? { type: soilType, ph: soilPh ? Number(soilPh) : undefined, organicMatterPct: soilOrganicMatter ? Number(soilOrganicMatter) : undefined, drainage: soilDrainage || undefined } : undefined,
          });
        } catch (e) {
          irrigationScheduleResp = null;
        }

        // Map ML response to our ForecastData shape minimally
        const normalizeFeatureName2 = (n: string) => {
          if (!n) return '';
          if (n.startsWith('Crop_')) {
            const pretty = selectedCrop ? (selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)) : n.replace('Crop_', '');
            return pretty;
          }
          return n.replace(/_/g, ' ');
        };

        const liveRisk2 = computeRisk(weeklyForecastData as any, { type: soilType, drainage: soilDrainage || undefined }, selectedCrop, sowingDate);
        const today2 = (weeklyForecastData as any)[0];
        const mapped: ForecastData = {
          currentWeather: {
            temperature: parseFloat(avgTemp),
            humidity: today2?.humidity ?? 70,
            conditions: today2?.conditionText || '—'
          },
          riskAssessment: liveRisk2,
          weatherTrend: weatherTrendData.length ? weatherTrendData : (forecastData?.weatherTrend || []),
          weeklyForecast: weeklyForecastData.length ? weeklyForecastData : (forecastData?.weeklyForecast || []),
          yieldPrediction: {
            value: (ml.prediction.yield_t_ha ?? 0).toFixed(2),
            confidence: 80,
            vsHistorical: 0,
          },
          featureImportance: (ml.feature_importances || []).map(f => ({ name: normalizeFeatureName2(f.name), impact: Math.round((f.impact || 0) * 100) })),
          explanation: ml.explanation_text || '',
          irrigationSchedule: irrigationScheduleResp?.irrigation_schedule || (forecastData?.irrigationSchedule || []),
          waterSavings: typeof irrigationScheduleResp?.water_savings === 'number' ? irrigationScheduleResp.water_savings : 0,
          soilProfile: forecastData?.soilProfile || { type: 'Loam', ph: 6.5, organicMatterPct: 1.5, drainage: 'moderate' },
        };
        setForecastData(mapped);
      } else {
        const data = await mockApiCall(selectedDistrict, selectedCrop, selectedSeason, scenario);
        const enriched: ForecastData = {
          ...data,
          weeklyForecast: weeklyForecastData.length ? weeklyForecastData : data.weeklyForecast,
          weatherTrend: weatherTrendData.length ? weatherTrendData : data.weatherTrend,
        };
        if (weeklyForecastData.length) {
          const today3 = (weeklyForecastData as any)[0];
          enriched.currentWeather = {
            temperature: today3?.temp ?? data.currentWeather.temperature,
            humidity: today3?.humidity ?? data.currentWeather.humidity,
            conditions: today3?.conditionText || data.currentWeather.conditions,
          };
          enriched.riskAssessment = computeRisk(weeklyForecastData as any, { type: soilType, drainage: soilDrainage || undefined }, selectedCrop, sowingDate);
        }
        setForecastData(enriched);
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
              sowingDate={sowingDate}
              onSowingDateChange={setSowingDate}
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
              {!showHistory && (
                <div className="flex items-center gap-3">
                  {forecastData && (
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
              )}
            </div>
            
            {showHistory ? (
              <PredictionHistory />
            ) : (
              <DashboardCards 
                forecastData={forecastData}
                scenario={scenario}
                weeklyForecast={weeklyForecastData}
                sowingDate={sowingDate}
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