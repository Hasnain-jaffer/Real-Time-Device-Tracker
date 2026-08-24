// client/src/features/geofences/components/GeofenceLayer.jsx
import { Circle, Tooltip } from 'react-leaflet';
import { useTheme } from '../../../app/ThemeContext';

const lightColors = {
  stroke: '#5E8C61',
  fill: '#5E8C61',
  text: '#173B32',
};

const darkColors = {
  stroke: '#79B37C',
  fill: '#79B37C',
  text: '#F1EEE4',
};

export default function GeofenceLayer({ geofences }) {
  const { theme } = useTheme();
  const fallback = theme === 'dark' ? darkColors : lightColors;

  return (
    <>
      {geofences
        .filter((f) => f.isActive)
        .map((fence) => (
          <Circle
            key={fence._id}
            center={[fence.latitude, fence.longitude]}
            radius={fence.radiusMeters}
            pathOptions={{
              color: fence.color || fallback.stroke,
              fillColor: fence.color || fallback.fill,
              fillOpacity: 0.12,
              weight: 2,
            }}
          >
            <Tooltip permanent direction="center" className="!bg-transparent !border-0 !shadow-none !text-xs !font-medium">
              <span style={{ color: fallback.text }}>{fence.name}</span>
            </Tooltip>
          </Circle>
        ))}
    </>
  );
}