// client/src/features/geofences/components/GeofenceLayer.jsx
import { Circle, Tooltip } from 'react-leaflet';

export default function GeofenceLayer({ geofences }) {
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
              color: fence.color,
              fillColor: fence.color,
              fillOpacity: 0.12,
              weight: 2,
            }}
          >
            <Tooltip permanent direction="center" className="!bg-transparent !border-0 !shadow-none !text-xs !font-medium">
              {fence.name}
            </Tooltip>
          </Circle>
        ))}
    </>
  );
}