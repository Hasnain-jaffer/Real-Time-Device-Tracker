// client/src/pages/LiveTrackingPage.jsx
import { useState } from 'react';
import LiveMap from '../components/map/LiveMap';
import TrackingPanel from '../features/tracking/components/TrackingPanel';
import DistanceEtaCard from '../features/tracking/components/DistanceEtaCard';
import { useTrackedDevices } from '../features/tracking/hooks/useTrackedDevices';
import { useUserLocation } from '../features/tracking/hooks/useUserLocation';
import { useGeofences } from '../features/geofences/hooks/useGeofences';

export default function LiveTrackingPage() {
  const { trackedDevices, hiddenIds, toggleVisibility } = useTrackedDevices();
  const { position: userPosition } = useUserLocation();
  const { geofences } = useGeofences();
  const [selectedKey, setSelectedKey] = useState(null);

  const selectedDevice = trackedDevices.find((d) => d.key === selectedKey) || null;

  return (
    <div className="h-screen flex flex-col p-4 gap-4">
      <h1 className="text-2xl font-semibold px-2">Live Tracking</h1>

      {selectedDevice && (
        <div className="px-2">
          <DistanceEtaCard userPosition={userPosition} device={selectedDevice} />
        </div>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 min-h-[300px]">
          <LiveMap
            devices={trackedDevices}
            selectedKey={selectedKey}
            onSelectDevice={setSelectedKey}
            geofences={geofences}
          />
        </div>
        <div className="lg:col-span-1 min-h-[300px]">
          <TrackingPanel
            devices={trackedDevices}
            hiddenIds={hiddenIds}
            onToggleVisibility={toggleVisibility}
            onSelectDevice={setSelectedKey}
            selectedKey={selectedKey}
          />
        </div>
      </div>
    </div>
  );
}