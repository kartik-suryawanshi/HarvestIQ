import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Satellite, 
  Droplets, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Database,
  Wifi,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';

interface InsightsPanelProps {
  hasData: boolean;
  soilProfile?: any;
  suggestedCrops?: string[] | null;
  suggestionRationale?: string | null;
}

const InsightsPanel = ({ hasData }: InsightsPanelProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { t } = useI18n();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!hasData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{t('additional_insights')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* NDVI Satellite Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Satellite className="h-5 w-5 text-primary" />
            <span>{t('satellite_insights')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Satellite className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm font-medium">{t('ndvi_image')}</div>
              <div className="text-xs text-muted-foreground">{t('last_updated')}: 2 days ago</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">{t('ndvi_index')}</div>
              <div className="text-2xl font-bold text-success">0.68</div>
              <Badge variant="outline" className="text-xs">{t('healthy')}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('coverage')}</div>
              <div className="text-2xl font-bold text-primary">94%</div>
              <Badge variant="outline" className="text-xs">{t('excellent')}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Soil Moisture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Droplets className="h-5 w-5 text-water" />
            <span>{t('soil_conditions')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('soil_moisture')}</span>
              <span className="text-sm font-bold">72%</span>
            </div>
            <Progress value={72} className="h-3" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('ph_level')}</span>
              <span className="text-sm font-bold">6.8</span>
            </div>
            <Progress value={68} className="h-3" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('organic_matter')}</span>
              <span className="text-sm font-bold">2.3%</span>
            </div>
            <Progress value={46} className="h-3" />
          </div>
          
          <div className="p-3 bg-success/10 rounded-lg border border-success/30">
            <div className="text-sm font-medium text-success">{t('soil_status_optimal')}</div>
            <div className="text-xs text-success/80 mt-1">{t('soil_status_note')}</div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources & Limitations */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('datasources')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <span>{t('data_sources_limits')}</span>
            </div>
            {expandedSection === 'datasources' ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CardTitle>
        </CardHeader>
        {expandedSection === 'datasources' && (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Wifi className="h-4 w-4 text-success" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{t('weather_data')}</div>
                  <div className="text-xs text-muted-foreground">
                    IMD (Indian Meteorological Department)
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{t('live')}</Badge>
              </div>

              <div className="flex items-center space-x-3">
                <Satellite className="h-4 w-4 text-success" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{t('satellite_imagery')}</div>
                  <div className="text-xs text-muted-foreground">
                    Sentinel-2, MODIS (NASA/ESA)
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{t('two_days')}</Badge>
              </div>

              <div className="flex items-center space-x-3">
                <Database className="h-4 w-4 text-success" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{t('historical_yields')}</div>
                  <div className="text-xs text-muted-foreground">
                    Ministry of Agriculture & Farmers Welfare
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{t('annual')}</Badge>
              </div>

              <div className="flex items-center space-x-3">
                <Shield className="h-4 w-4 text-warning" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{t('soil_data')}</div>
                  <div className="text-xs text-muted-foreground">
                    National Bureau of Soil Survey
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{t('modeled')}</Badge>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <h4 className="text-sm font-medium mb-2">Important Limitations:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Predictions are based on historical patterns and may not account for extreme weather events</li>
                <li>• Local microclimatic conditions may vary from regional forecasts</li>
                <li>• Soil data is interpolated from nearby sampling points</li>
                <li>• Consider local agricultural practices and variety-specific requirements</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Model Performance */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('performance')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              <span>{t('model_performance')}</span>
            </div>
            {expandedSection === 'performance' ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CardTitle>
        </CardHeader>
        {expandedSection === 'performance' && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Accuracy (R²)</div>
                <div className="text-lg font-bold text-primary">0.87</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">RMSE</div>
                <div className="text-lg font-bold text-primary">0.43</div>
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">{t('training_data')}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Model trained on 15 years of yield data (2008-2023) across 680 districts
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Last model update: January 2024<br />
              Next scheduled update: January 2025
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default InsightsPanel;