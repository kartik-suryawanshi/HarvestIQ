import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface IndiaMapProps {
  onDistrictSelect: (district: string) => void;
  selectedDistrict: string;
}

// Mock districts with coordinates for demo
const mockDistricts = [
  { name: 'Pune, Maharashtra', coordinates: [73.8567, 18.5204] },
  { name: 'Nashik, Maharashtra', coordinates: [73.7898, 19.9975] },
  { name: 'Aurangabad, Maharashtra', coordinates: [75.3433, 19.8762] },
  { name: 'Bharatpur, Rajasthan', coordinates: [77.4977, 27.2152] },
  { name: 'Kota, Rajasthan', coordinates: [75.8648, 25.2138] },
  { name: 'Ludhiana, Punjab', coordinates: [75.8573, 30.9010] },
  { name: 'Amritsar, Punjab', coordinates: [74.8723, 31.6340] },
  { name: 'Mysore, Karnataka', coordinates: [76.6394, 12.2958] },
  { name: 'Belgaum, Karnataka', coordinates: [74.4977, 15.8497] }
];

const IndiaMap = ({ onDistrictSelect, selectedDistrict }: IndiaMapProps) => {
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
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border">
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