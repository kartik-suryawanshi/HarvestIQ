import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRef } from 'react';
import { 
  CloudRain, 
  Thermometer, 
  Droplets, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Download,
  Target,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useI18n } from '@/contexts/I18nContext';

interface DashboardCardsProps {
  forecastData: any;
  scenario: string;
  weeklyForecast?: Array<{
    day: string;
    temp: number;
    rain: number;
    conditionIcon?: string;
  }>;
}

const DashboardCards = ({ forecastData, scenario, weeklyForecast }: DashboardCardsProps) => {
  const { t } = useI18n();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const input = dashboardRef.current;
    if (input) {
      // Try browser bundle first for better compatibility with Vite
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - module has no types
      let html2pdf: any;
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - module has no types
        const mod = await import('html2pdf.js/dist/html2pdf.bundle.min.js');
        html2pdf = (mod as any).default ?? mod;
      } catch {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - module has no types
        const mod = await import('html2pdf.js');
        html2pdf = (mod as any).default ?? mod;
      }
      html2pdf().from(input).save(`HarvestIQ_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };
  if (!forecastData) {
    return (
      <div className="flex flex-col gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'success';
    if (risk < 70) return 'warning';
    return 'destructive';
  };

  const getRiskLabel = (risk: number) => {
    if (risk < 30) return 'Low Risk';
    if (risk < 70) return 'Moderate Risk';
    return 'High Risk';
  };

  const weekly = weeklyForecast || forecastData.weeklyForecast || [];

  return (
    <div className="flex flex-col gap-6" ref={dashboardRef}>
      {/* Weather & Risk Assessment Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CloudRain className="h-5 w-5 text-water" />
            <span>{t('weather_risk')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Weather */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 text-warning" />
              <div>
                <div className="text-sm text-muted-foreground">{t('temperature')}</div>
                <div className="font-semibold">{forecastData.currentWeather.temperature}°C</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Droplets className="h-4 w-4 text-water" />
              <div>
                <div className="text-sm text-muted-foreground">{t('humidity')}</div>
                <div className="font-semibold">{forecastData.currentWeather.humidity}%</div>
              </div>
            </div>
          </div>

          {/* Risk Alert */}
          <div className="p-3 rounded-lg border" style={{ 
            backgroundColor: `hsl(var(--${getRiskColor(forecastData.riskAssessment.level)} / 0.1))`,
            borderColor: `hsl(var(--${getRiskColor(forecastData.riskAssessment.level)} / 0.3))`
          }}>
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className={`h-4 w-4 text-${getRiskColor(forecastData.riskAssessment.level)}`} />
              <span className={`font-semibold text-${getRiskColor(forecastData.riskAssessment.level)}`}>
                {getRiskLabel(forecastData.riskAssessment.level)} - {forecastData.riskAssessment.level}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{forecastData.riskAssessment.reason}</p>
          </div>

          {/* 30-day Weather Trend */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>{t('trend_30d')}</span>
            </h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData.weatherTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="rainfall" 
                    stroke="hsl(var(--water))" 
                    fill="hsl(var(--water) / 0.3)"
                    name="Rainfall (mm)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div>
            <h4 className="text-sm font-medium mb-3">{t('next_7_days')}</h4>
            <div className="grid grid-cols-7 gap-1">
              {weekly.map((day: any, index: number) => (
                <div key={index} className="text-center p-1">
                  <div className="text-xs text-muted-foreground">{day.day}</div>
                  {day.conditionIcon && (
                    <img 
                      src={`https:${day.conditionIcon}`}
                      alt={day.conditionText || 'Weather icon'}
                      className="h-6 w-6 mx-auto my-1"
                    />
                  )}
                  {!day.conditionIcon && <CloudRain className="h-4 w-4 mx-auto my-1 text-water" />}
                  <div className="text-xs font-medium">{day.temp}°C</div>
                  <div className="text-xs text-water">{day.rain}mm</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yield Prediction Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-success" />
            <span>{t('yield_prediction')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Yield Number */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {forecastData.yieldPrediction.value} tonnes/hectare
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-muted-foreground">{t('confidence')}:</span>
              <Progress value={forecastData.yieldPrediction.confidence} className="w-20 h-2" />
              <span className="text-sm font-medium">{forecastData.yieldPrediction.confidence}%</span>
            </div>
          </div>

          {/* vs Historical Comparison */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('vs_historical')}</span>
              <Badge variant={forecastData.yieldPrediction.vsHistorical > 0 ? "default" : "secondary"}>
                {forecastData.yieldPrediction.vsHistorical > 0 ? '+' : ''}{forecastData.yieldPrediction.vsHistorical}%
              </Badge>
            </div>
          </div>

          {/* Feature Importance */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>{t('key_factors')}</span>
            </h4>
            <div className="space-y-2">
              {forecastData.featureImportance.map((feature: any, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-16 text-xs text-muted-foreground">{feature.name}</div>
                  <Progress value={feature.impact} className="flex-1 h-2" />
                  <div className="w-8 text-xs font-medium text-right">{feature.impact}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Plain English Explanation */}
          <div className="p-3 bg-accent rounded-lg">
            <p className="text-sm font-medium text-accent-foreground">
              {forecastData.explanation}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Irrigation Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Droplets className="h-5 w-5 text-water" />
            <span>{t('irrigation_schedule')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weekly Calendar */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{t('recommended_schedule')}</span>
            </h4>
            <div className="space-y-2">
              {forecastData.irrigationSchedule.map((week: any, index: number) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    week.action === 'Irrigate' 
                      ? 'bg-water/10 border-water/30' 
                      : 'bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium">{week.week}</div>
                      <Badge variant={week.action === 'Irrigate' ? "default" : "secondary"}>
                        {week.action}
                      </Badge>
                    </div>
                    {week.action === 'Irrigate' && (
                      <div className="text-sm font-semibold text-water">{week.amount}mm</div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{week.reason}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Water Savings */}
          <div className="p-3 bg-success/10 rounded-lg border border-success/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-success">{t('water_savings')}</span>
              <span className="font-bold text-success">{forecastData.waterSavings}%</span>
            </div>
          </div>

          {/* Download Button */}
          <Button className="w-full" variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            {t('download_schedule')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCards;