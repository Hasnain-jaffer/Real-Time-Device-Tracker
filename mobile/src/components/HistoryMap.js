import { useEffect, useMemo, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';

const HTML = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
html,body,#map{height:100%;width:100%;margin:0;padding:0}
body{background:#d9d3c4}
.play-pin{width:30px;height:30px;border-radius:50%;background:#173B32;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;position:relative}
.play-pin::after{content:'';position:absolute;inset:-8px;border-radius:50%;border:2px solid #5E8C61;animation:pulse 1.6s ease-out infinite}
@keyframes pulse{0%{transform:scale(.7);opacity:.9}100%{transform:scale(1.5);opacity:0}}
.leaflet-tooltip{font-size:12px;font-weight:600}
</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
if (typeof L === 'undefined') {
  document.getElementById('map').innerHTML = '<div style="padding:24px;font:14px sans-serif;color:#555">The map could not load. Check your internet connection and reopen this tab.</div>';
} else {
  var TILE_URLS = {
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  };
  var map = L.map('map', { zoomControl: false }).setView([25.4610, 68.7183], 13);
  map.attributionControl.setPrefix(false);
  L.control.zoom({ position: 'topright' }).addTo(map);

  var tileLayer = null, currentTheme = null, pathLayer = null, pathSig = '', pathPts = [], playMarker = null;

  function setTheme(isDark) {
    var key = isDark ? 'dark' : 'light';
    if (currentTheme === key) return;
    currentTheme = key;
    if (tileLayer) map.removeLayer(tileLayer);
    tileLayer = L.tileLayer(TILE_URLS[key], {
      subdomains: 'abcd', maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);
  }

  window.addEventListener('resize', function () { map.invalidateSize(); });

  window.__setPath = function (state) {
    setTheme(state.isDark);
    var pts = state.path;
    var sig = pts.length + ':' + (pts[0] || []).join(',') + ':' + (pts[pts.length - 1] || []).join(',');
    if (sig === pathSig) return;
    pathSig = sig;
    pathPts = pts;
    if (pathLayer) { map.removeLayer(pathLayer); pathLayer = null; }
    if (playMarker) { map.removeLayer(playMarker); playMarker = null; }
    if (!pts.length) return;

    pathLayer = L.layerGroup().addTo(map);
    if (pts.length > 1) L.polyline(pts, { color: '#5E8C61', weight: 4, opacity: 0.9 }).addTo(pathLayer);
    L.circleMarker(pts[0], { radius: 8, color: '#ffffff', weight: 3, fillColor: '#5E8C61', fillOpacity: 1 })
      .bindTooltip('Start', { direction: 'top' }).addTo(pathLayer);
    if (pts.length > 1) {
      L.circleMarker(pts[pts.length - 1], { radius: 8, color: '#ffffff', weight: 3, fillColor: '#B94A3A', fillOpacity: 1 })
        .bindTooltip('End', { direction: 'top' }).addTo(pathLayer);
    }
    if (pts.length === 1) map.setView(pts[0], 16);
    else map.fitBounds(pts, { padding: [30, 30], maxZoom: 17 });
  };

  window.__setPlayhead = function (i, follow) {
    var p = pathPts[i];
    if (!p) return;
    if (!playMarker) {
      // SVG bus icon inside the pin -- no emoji, renders identically on every device
      playMarker = L.marker(p, {
        icon: L.divIcon({ className: '', html: '<div class="play-pin"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 18v2"/><path d="M18 18v2"/><path d="M6 10h12"/></svg></div>', iconSize: [30, 30], iconAnchor: [15, 15] }),
        zIndexOffset: 1000
      }).addTo(map);
    } else {
      playMarker.setLatLng(p);
    }
    if (follow && !map.getBounds().pad(-0.2).contains(p)) map.panTo(p, { animate: true, duration: 0.25 });
  };
}
</script></body></html>`;

export default function HistoryMap({ path, playIndex, isDark, follow = true }) {
  const webRef = useRef(null);
  const [loadCount, setLoadCount] = useState(0);

  const pathPayload = useMemo(
    () => JSON.stringify({ path: path.map((p) => [p.latitude, p.longitude]), isDark }),
    [path, isDark]
  );

  // The path is sent only when it changes; the moving marker is a tiny separate message
  useEffect(() => {
    if (loadCount === 0 || !webRef.current) return;
    webRef.current.injectJavaScript(`window.__setPath && window.__setPath(JSON.parse(${JSON.stringify(pathPayload)})); true;`);
  }, [loadCount, pathPayload]);

  useEffect(() => {
    if (loadCount === 0 || !webRef.current) return;
    webRef.current.injectJavaScript(`window.__setPlayhead && window.__setPlayhead(${playIndex}, ${follow ? 'true' : 'false'}); true;`);
  }, [loadCount, playIndex, follow, pathPayload]);

  return (
    <WebView
      ref={webRef}
      source={{ html: HTML }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      onLoad={() => setLoadCount((c) => c + 1)}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      style={{ flex: 1 }}
    />
  );
}