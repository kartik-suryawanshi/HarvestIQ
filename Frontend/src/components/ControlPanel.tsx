import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input'; // Import Input component
import { MapPin, Calendar, Wheat, Loader2, Maximize2, Sprout } from 'lucide-react'; // Add Sprout icon
import IndiaMap from './IndiaMap';
import { useI18n } from '@/contexts/I18nContext';
import MapPickerDialog from '@/components/MapPickerDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ControlPanelProps {
  selectedDistrict: string;
  selectedCrop: string;
  selectedSeason: string;
  isLoading: boolean;
  onDistrictChange: (district: string) => void;
  onCropChange: (crop: string) => void;
  onSeasonChange: (season: string) => void;
  onGenerateForecast: () => void;
  // New soil parameters
  selectedSoilType: string;
  onSoilTypeChange: (soilType: string) => void;
  soilPH: string;
  onSoilPHChange: (ph: string) => void;
  organicMatter: string;
  onOrganicMatterChange: (organicMatter: string) => void;
  drainage: string;
  onDrainageChange: (drainage: string) => void;
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

const soilTypes = [
  { value: 'loamy', label: 'Loamy' },
  { value: 'sandy', label: 'Sandy' },
  { value: 'clay', label: 'Clay' },
  { value: 'silt', label: 'Silt' },
];

const drainageOptions = [
  { value: 'well-drained', label: 'Well-drained' },
  { value: 'moderately-drained', label: 'Moderately drained' },
  { value: 'poorly-drained', label: 'Poorly drained' },
];

const ControlPanel = ({
  selectedDistrict,
  selectedCrop,
  selectedSeason,
  isLoading,
  onDistrictChange,
  onCropChange,
  onSeasonChange,
  onGenerateForecast,
  // New soil parameters
  selectedSoilType,
  onSoilTypeChange,
  soilPH,
  onSoilPHChange,
  organicMatter,
  onOrganicMatterChange,
  drainage,
  onDrainageChange,
}: ControlPanelProps) => {
  const { t } = useI18n();
  const [mapOpen, setMapOpen] = useState(false);
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
          <div className="relative pb-12">
            <IndiaMap onDistrictSelect={onDistrictChange} selectedDistrict={selectedDistrict} heightClass="h-72" />
            <div className="absolute right-3 bottom-3 z-20 pointer-events-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setMapOpen(true)}
                    className="shadow-md"
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Expand Map
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Tap to open full map and choose your district/taluka</span>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
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

      <MapPickerDialog
        open={mapOpen}
        onOpenChange={setMapOpen}
        selectedDistrict={selectedDistrict}
        onSelect={(d) => { onDistrictChange(d); setMapOpen(false); }}
      />

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

          {/* Taluka selection (placeholder, non-empty values) */}
          <Select onValueChange={() => {}}>
            <SelectTrigger>
              <SelectValue placeholder="Select Taluka (coming soon)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
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

      {/* Soil Parameters Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sprout className="h-5 w-5 text-primary" />
            <span>{t('soil_parameters')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedSoilType} onValueChange={onSoilTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('select_soil_type')} />
            </SelectTrigger>
            <SelectContent>
              {soilTypes.map((soil) => (
                <SelectItem key={soil.value} value={soil.value}>
                  {soil.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input 
            type="number" 
            placeholder={t('ph_level')} 
            value={soilPH}
            onChange={(e) => onSoilPHChange(e.target.value)}
            step="0.1"
            min="0"
            max="14"
          />

          <Input 
            type="number" 
            placeholder={t('organic_matter')} 
            value={organicMatter}
            onChange={(e) => onOrganicMatterChange(e.target.value)}
            step="0.1"
            min="0"
            max="100"
            suffix="%"
          />

          <Select value={drainage} onValueChange={onDrainageChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('select_drainage')} />
            </SelectTrigger>
            <SelectContent>
              {drainageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button 
        onClick={onGenerateForecast}
        disabled={!selectedDistrict || !selectedCrop || !selectedSeason || !selectedSoilType || !soilPH || !organicMatter || !drainage || isLoading}
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