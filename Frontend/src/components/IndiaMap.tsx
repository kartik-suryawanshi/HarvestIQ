import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface IndiaMapProps {
  onDistrictSelect: (district: string) => void;
  selectedDistrict: string;
  heightClass?: string; // e.g., 'h-64', 'h-96'
  enableLocate?: boolean;
}

// Mock districts with coordinates for demo (Maharashtra only)
const mockDistricts = [
  { name: 'Mumbai, Maharashtra', coordinates: [72.8777, 19.0760] },
  { name: 'Thane, Maharashtra', coordinates: [72.9716, 19.2183] },
  { name: 'Pune, Maharashtra', coordinates: [73.8567, 18.5204] },
  { name: 'Nashik, Maharashtra', coordinates: [73.7898, 19.9975] },
  { name: 'Aurangabad, Maharashtra', coordinates: [75.3433, 19.8762] },
  { name: 'Nagpur, Maharashtra', coordinates: [79.0882, 21.1458] },
  { name: 'Kolhapur, Maharashtra', coordinates: [74.2433, 16.7040] },
  { name: 'Satara, Maharashtra', coordinates: [74.0183, 17.6805] },
  { name: 'Solapur, Maharashtra', coordinates: [75.9064, 17.6599] }
];

const IndiaMap = ({ onDistrictSelect, selectedDistrict, heightClass = 'h-64', enableLocate = false }: IndiaMapProps) => {
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  // Fix Leaflet default icon URLs for Vite builds
  const defaultIcon = useMemo(() => {
    const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString();
    const iconRetinaUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString();
    const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString();
    return new Icon({
      iconUrl,
      iconRetinaUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }, []);

  return (
    <div className={`w-full ${heightClass} rounded-lg overflow-hidden border border-border`}>
      <MapContainer
        center={defaultCenter}
        zoom={5}
        minZoom={4}
        maxZoom={8}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {enableLocate && (
          <></>
        )}

        {mockDistricts.map((district) => {
          const isSelected = selectedDistrict === district.name;
          const activeIcon = isSelected
            ? new Icon({
                iconUrl: defaultIcon.options.iconUrl as string,
                iconRetinaUrl: defaultIcon.options.iconRetinaUrl as string,
                shadowUrl: defaultIcon.options.shadowUrl as string,
                iconSize: [30, 50],
                iconAnchor: [15, 50],
                popupAnchor: [1, -40],
                shadowSize: [50, 50]
              })
            : defaultIcon;

          return (
            <Marker
              key={district.name}
              position={[district.coordinates[1], district.coordinates[0]]}
              icon={activeIcon}
              eventHandlers={{
                click: () => onDistrictSelect(district.name)
              }}
            >
              <Popup>
                <div className="font-medium">{district.name}</div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default IndiaMap;