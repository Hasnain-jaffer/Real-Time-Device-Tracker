// client/src/pages/LiveTrackingPage.jsx
import LiveMap from '../components/map/LiveMap';

export default function LiveTrackingPage() {
  return (
    <div className="h-screen flex flex-col p-4 gap-4">
      <h1 className="text-2xl font-semibold px-2">Live Tracking</h1>
      <div className="flex-1 min-h-0">
        <LiveMap />
      </div>
    </div>
  );
}