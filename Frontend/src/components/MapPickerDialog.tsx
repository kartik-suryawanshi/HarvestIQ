import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import IndiaMap from '@/components/IndiaMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Crosshair } from 'lucide-react';

interface MapPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDistrict: string;
  onSelect: (district: string) => void;
}

const knownDistricts = [
  'Mumbai, Maharashtra',
  'Thane, Maharashtra',
  'Pune, Maharashtra',
  'Nashik, Maharashtra',
  'Aurangabad, Maharashtra',
  'Nagpur, Maharashtra',
  'Kolhapur, Maharashtra',
  'Satara, Maharashtra',
  'Solapur, Maharashtra'
];

const MapPickerDialog = ({ open, onOpenChange, selectedDistrict, onSelect }: MapPickerDialogProps) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return knownDistricts.filter(d => d.toLowerCase().includes(q));
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[860px] p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-lg">Select Location</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search district or taluka"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => navigator.geolocation?.getCurrentPosition(() => {})}>
              <Crosshair className="h-4 w-4 mr-2" /> Locate me
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <IndiaMap onDistrictSelect={onSelect} selectedDistrict={selectedDistrict} heightClass="h-[420px]" />
            </div>
            <div className="border rounded-md p-2 overflow-auto max-h-[420px]">
              {filtered.map((d) => (
                <button
                  key={d}
                  className={`w-full text-left px-2 py-2 rounded hover:bg-muted ${d === selectedDistrict ? 'bg-primary/10' : ''}`}
                  onClick={() => onSelect(d)}
                >
                  {d}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground px-2 py-6">No matches</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapPickerDialog;


