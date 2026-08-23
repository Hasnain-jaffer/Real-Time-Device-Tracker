// client/src/components/map/MapSizeFix.jsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapSizeFix() {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    function handleResize() {
      map.invalidateSize();
    }
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}