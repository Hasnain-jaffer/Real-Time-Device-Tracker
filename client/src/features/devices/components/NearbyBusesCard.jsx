// client/src/features/devices/components/NearbyBusesCard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as deviceApi from '../api/deviceApi';
import { useUserLocation } from '../../tracking/hooks/useUserLocation';

/* ─── SVG Icons ─── */
const IconBus = ({ size = 16, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M8 6v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M16 15a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2" />
    <path d="M4 10h16v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z" />
    <path d="M6 17v3" />
    <path d="M18 17v3" />
    <path d="M6 10V6h12v4" />
  </svg>
);

const IconLocate = ({ size = 32, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
  </svg>
);

const IconArrowRight = ({ size = 14, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function NearbyBusesCard({ tokens }) {
  const { position } = useUserLocation();
  const [nearby, setNearby] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!position) return;
    setIsLoading(true);
    deviceApi
      .getNearbyDevices(position.latitude, position.longitude)
      .then(setNearby)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [position]);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: cardShadow,
      }}
    >
      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: 'var(--accent-primary)' + '18',
            color: 'var(--accent-primary)',
          }}
        >
          <IconBus size={14} style={{ backgroundColor: 'var(--bg-page)' }} />
        </div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Buses near you
        </h2>
      </div>

      {/* No location state */}
      {!position && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <IconLocate size={28} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Enable location to see nearby buses.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {position && isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 rounded-xl animate-pulse"
              style={{ backgroundColor: 'var(--bg-page)' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {position && !isLoading && nearby.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'var(--bg-page)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            <IconBus size={18} style={{ backgroundColor: 'var(--bg-page)' }} />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No buses currently online nearby.
          </p>
        </div>
      )}

      {/* Bus list */}
      {position && !isLoading && nearby.length > 0 && (
        <div className="space-y-1.5">
          {nearby.map((bus) => (
            <Link
              key={bus._id}
              to={`/devices/${bus._id}`}
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-colors"
              style={{
                color: 'var(--text-primary)',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-page)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--accent-primary)' + '15',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <IconBus size={14} style={{ backgroundColor: 'var(--bg-page)' }} />
                </span>
                <span className="text-sm font-medium truncate">{bus.name}</span>
              </span>

              <span className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {(bus.distanceMeters / 1000).toFixed(2)} km
                </span>
                <IconArrowRight
                  size={13}
                  style={{ color: 'var(--text-muted)' }}
                />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}