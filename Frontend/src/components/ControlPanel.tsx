import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Wheat, Loader2 } from 'lucide-react';
import IndiaMap from './IndiaMap';
import { useI18n } from '@/contexts/I18nContext';

interface ControlPanelProps {
  selectedDistrict: string;
  selectedCrop: string;
  selectedSeason: string;
  isLoading: boolean;
  onDistrictChange: (district: string) => void;
  onCropChange: (crop: string) => void;
  onSeasonChange: (season: string) => void;
  onGenerateForecast: () => void;
}

const crops = [
  { value: 'rice', label: 'Rice', season: 'Kharif' },
  { value: 'wheat', label: 'Wheat', season: 'Rabi' },
  { value: 'maize', label: 'Maize', season: 'Kharif' },
  { value: 'sugarcane', label: 'Sugarcane', season: 'Annual' }
];

const seasons = [
  { value: 'kharif-2024', label: 'Kharif 2024 (Jun-Nov)', months: 'June - November 2024' },
  { value: 'rabi-2024', label: 'Rabi 2024-25 (Nov-Apr)', months: 'November 2024 - April 2025' }
];

const ControlPanel = ({
  selectedDistrict,
  selectedCrop,
  selectedSeason,
  isLoading,
  onDistrictChange,
  onCropChange,
  onSeasonChange,
  onGenerateForecast
}: ControlPanelProps) => {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span>{t('location_selection')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <IndiaMap onDistrictSelect={onDistrictChange} selectedDistrict={selectedDistrict} />
          
          {selectedDistrict && (
            <div className="p-3 bg-accent rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('selected_location')}</span>
                <Badge variant="secondary">{selectedDistrict}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wheat className="h-5 w-5 text-primary" />
            <span>{t('crop_selection')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedCrop} onValueChange={onCropChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('choose_crop')} />
            </SelectTrigger>
            <SelectContent>
              {crops.map((crop) => (
                <SelectItem key={crop.value} value={crop.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{crop.label}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {crop.season}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>{t('growing_season')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedSeason} onValueChange={onSeasonChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('select_season')} />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.value} value={season.value}>
                  <div>
                    <div className="font-medium">{season.label}</div>
                    <div className="text-xs text-muted-foreground">{season.months}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button 
        onClick={onGenerateForecast}
        disabled={!selectedDistrict || !selectedCrop || !selectedSeason || isLoading}
        className="w-full h-12 text-base font-medium bg-primary hover:bg-primary-dark"
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t('generate_forecast')}</span>
          </div>
        ) : (
          <span>{t('generate_forecast')}</span>
        )}
      </Button>
    </div>
  );
};

export default ControlPanel;