// mobile/src/components/HistoryMap.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../context/ThemeContext';

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
.leaflet-container{background:#d9d3c4}
.leaflet-control-attribution {
  background: rgba(255,255,255,0.7) !important;
  color: #999 !important;
  font-size: 8px !important;
  padding: 1px 4px !important;
  white-space: nowrap !important;
  border-radius: 3px 0 0 0 !important;
}
.leaflet-control-attribution a { color: #5E8C61 !important; text-decoration: none !important; }
</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
if (typeof L === 'undefined') {
  document.getElementById('map').innerHTML = '<div style="padding:24px;font:14px sans-serif;color:#555">The map could not load. Check your internet connection and reopen this tab.</div>';
} else {
    var TILES = {
    light: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri',
      maxNativeZoom: 17,
      bg: '#d9d3c4'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri',
      maxNativeZoom: 17,
      bg: '#1b2a26'
    },
    dark: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      overlay: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap contributors',
      maxNativeZoom: 16,
      bg: '#2b2b2b'
    }
  };
  var overlayLayer = null;
  
  var map = L.map('map', { zoomControl: false }).setView([25.4610, 68.7183], 13);
  map.attributionControl.setPrefix(false);
  L.control.zoom({ position: 'topright' }).addTo(map);

  var tileLayer = null, currentTheme = null, pathLayer = null, pathSig = '', pathPts = [], playMarker = null;

    function setTheme(theme) {
    if (currentTheme === theme) return;
    currentTheme = theme;
    if (tileLayer) map.removeLayer(tileLayer);
    if (overlayLayer) { map.removeLayer(overlayLayer); overlayLayer = null; }

    var cfg = TILES[theme] || TILES.light;
    document.getElementById('map').style.background = cfg.bg;

    tileLayer = L.tileLayer(cfg.url, {
      maxNativeZoom: cfg.maxNativeZoom,
      maxZoom: 19,
      attribution: cfg.attribution
    }).addTo(map);

    // Dark layer: labels (roads, places) come from a separate reference layer
    if (cfg.overlay) {
      overlayLayer = L.tileLayer(cfg.overlay, {
        maxNativeZoom: cfg.maxNativeZoom,
        maxZoom: 19
      }).addTo(map);
    }
  }
    
  window.addEventListener('resize', function () { map.invalidateSize(); });

  window.__setPath = function (state) {
    setTheme(state.theme || 'light');
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

export default function HistoryMap({ path, playIndex, isDark, follow = true, topOffset = 0 }) {
  const { colors } = useTheme();
  const webRef = useRef(null);
  const [loadCount, setLoadCount] = useState(0);
  const [mapLayer, setMapLayer] = useState('normal'); // 'normal' | 'satellite' | 'dark'

  const getTheme = () => {
    if (mapLayer === 'satellite') return 'satellite';
    if (mapLayer === 'dark') return 'dark';
    return isDark ? 'dark' : 'light';
  };

  const pathPayload = useMemo(
    () => JSON.stringify({ 
      path: path.map((p) => [p.latitude, p.longitude]), 
      theme: getTheme() 
    }),
    [path, isDark, mapLayer]
  );

  useEffect(() => {
    if (loadCount === 0 || !webRef.current) return;
    webRef.current.injectJavaScript(`window.__setPath && window.__setPath(JSON.parse(${JSON.stringify(pathPayload)})); true;`);
  }, [loadCount, pathPayload]);

  useEffect(() => {
    if (loadCount === 0 || !webRef.current) return;
    webRef.current.injectJavaScript(`window.__setPlayhead && window.__setPlayhead(${playIndex}, ${follow ? 'true' : 'false'}); true;`);
  }, [loadCount, playIndex, follow, pathPayload]);

  return (
    <View style={{ flex: 1 }}>
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

      {/* Layer Switcher — same position as LeafletMap */}
      <View style={[styles.layerSwitcher, { backgroundColor: colors.bgSurface, borderColor: colors.border, top: 12 + topOffset, }]}>
        {[
          { key: 'normal', label: 'Map' },
          { key: 'satellite', label: 'Sat' },
          { key: 'dark', label: 'Dark' },
        ].map((layer) => (
          <TouchableOpacity
            key={layer.key}
            onPress={() => setMapLayer(layer.key)}
            style={[
              styles.layerButton,
              mapLayer === layer.key && { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: mapLayer === layer.key ? '#fff' : colors.textPrimary,
              }}
            >
              {layer.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layerSwitcher: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    flexDirection: 'column',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  layerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});