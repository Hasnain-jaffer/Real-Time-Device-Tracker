// mobile/src/components/LeafletMap.js
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
.bus-pin{width:34px;height:34px;border-radius:50%;background:#5E8C61;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;position:relative}
.bus-pin svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.bus-pin.selected{width:42px;height:42px;background:#173B32}
.bus-pin.selected svg{width:22px;height:22px}
.bus-pin.selected::after{content:'';position:absolute;inset:-9px;border-radius:50%;border:2px solid #5E8C61;animation:pulse 1.6s ease-out infinite}
@keyframes pulse{0%{transform:scale(.7);opacity:.9}100%{transform:scale(1.5);opacity:0}}
.leaflet-tooltip{font-size:12px;font-weight:600}
.leaflet-container{background:#d9d3c4}

/* FIX: Style attribution properly */
.leaflet-control-attribution {
  background: rgba(255,255,255,0.85) !important;
  color: #888 !important;
  font-size: 9px !important;
  padding: 2px 6px !important;
  border-radius: 4px 0 0 0 !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
}
.leaflet-control-attribution a {
  color: #5E8C61 !important;
  text-decoration: none !important;
}
.leaflet-control-attribution a:hover {
  text-decoration: underline !important;
}
</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
if (typeof L === 'undefined') {
  document.getElementById('map').innerHTML = '<div style="padding:24px;font:14px sans-serif;color:#555">Map failed to load. Check internet connection.</div>';
} else {
  var TILE_URLS = {
    light: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };
  
  var map = L.map('map', { zoomControl: false }).setView([25.4610, 68.7183], 13);
  map.attributionControl.setPrefix(false);
  L.control.zoom({ position: 'topright' }).addTo(map);

  var tileLayer = null, currentTheme = null;
  var busMarkers = {}, userMarker = null;
  var didFit = false, lastNonce = -1;

  var BUS_SVG = '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 18v2"/><path d="M18 18v2"/><path d="M6 10h12"/></svg>';

  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }
  
  function setTheme(theme) {
    if (currentTheme === theme) return;
    currentTheme = theme;
    if (tileLayer) map.removeLayer(tileLayer);
    
    var url = TILE_URLS[theme] || TILE_URLS.light;
    tileLayer = L.tileLayer(url, {
      maxZoom: 19,
      attribution: '&copy; Esri'
    }).addTo(map);
  }
  
  function busIcon(selected) {
    var size = selected ? 42 : 34;
    return L.divIcon({
      className: '',
      html: '<div class="bus-pin' + (selected ? ' selected' : '') + '">' + BUS_SVG + '</div>',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }
  
  function nameLabel(name) {
    var el = document.createElement('span');
    el.textContent = name;
    return el;
  }

  window.addEventListener('resize', function () { map.invalidateSize(); });

  window.__setState = function (state) {
    setTheme(state.theme || 'light');

    var seen = {};
    state.buses.forEach(function (b) {
      seen[b.id] = true;
      var sel = b.id === state.selectedId;
      var m = busMarkers[b.id];
      if (!m) {
        m = L.marker([b.lat, b.lng], { icon: busIcon(sel), zIndexOffset: sel ? 1000 : 0 }).addTo(map);
        m.on('click', function () { post({ type: 'select', id: b.id }); });
        m.bindTooltip(nameLabel(b.name), { direction: 'top', offset: [0, -20] });
        m.__sel = sel;
        m.__name = b.name;
        busMarkers[b.id] = m;
      } else {
        m.setLatLng([b.lat, b.lng]);
        if (m.__sel !== sel) {
          m.setIcon(busIcon(sel));
          m.setZIndexOffset(sel ? 1000 : 0);
          m.__sel = sel;
        }
        if (m.__name !== b.name) {
          m.unbindTooltip();
          m.bindTooltip(nameLabel(b.name), { direction: 'top', offset: [0, -20] });
          m.__name = b.name;
        }
      }
    });
    
    Object.keys(busMarkers).forEach(function (id) {
      if (!seen[id]) { map.removeLayer(busMarkers[id]); delete busMarkers[id]; }
    });

    if (state.user) {
      if (!userMarker) {
        userMarker = L.circleMarker([state.user.lat, state.user.lng], {
          radius: 8, color: '#ffffff', weight: 3, fillColor: '#2563EB', fillOpacity: 1
        }).addTo(map);
      } else {
        userMarker.setLatLng([state.user.lat, state.user.lng]);
      }
    } else if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }

    if (!didFit) {
      var pts = state.buses.map(function (b) { return [b.lat, b.lng]; });
      if (state.user) pts.push([state.user.lat, state.user.lng]);
      if (pts.length) {
        didFit = true;
        if (pts.length === 1) map.setView(pts[0], 15);
        else map.fitBounds(pts, { padding: [50, 50], maxZoom: 16 });
      }
    }

    if (state.focus && state.focus.nonce !== lastNonce) {
      lastNonce = state.focus.nonce;
      var target = null;
      if (state.focus.target === 'user' && state.user) target = [state.user.lat, state.user.lng];
      else if (state.focus.target === 'bus' && busMarkers[state.focus.id]) target = busMarkers[state.focus.id].getLatLng();
      if (target) map.setView(target, Math.max(map.getZoom(), 15), { animate: true });
    }
  };
}
</script></body></html>`;

export default function LeafletMap({ buses, user, selectedId, isDark, focus, onSelect }) {
  const { colors } = useTheme();
  const webRef = useRef(null);
  const [loadCount, setLoadCount] = useState(0);
  const [mapLayer, setMapLayer] = useState('normal');

  const getTheme = () => {
    if (mapLayer === 'satellite') return 'satellite';
    if (mapLayer === 'dark') return 'dark';
    return isDark ? 'dark' : 'light';
  };

  const payload = useMemo(
    () =>
      JSON.stringify({
        buses: buses.map((b) => ({ id: b.id, lat: b.latitude, lng: b.longitude, name: b.name })),
        user: user ? { lat: user.latitude, lng: user.longitude } : null,
        selectedId,
        theme: getTheme(),
        focus,
      }),
    [buses, user, selectedId, isDark, mapLayer, focus]
  );

  useEffect(() => {
    if (loadCount === 0 || !webRef.current) return;
    webRef.current.injectJavaScript(
      `window.__setState && window.__setState(JSON.parse(${JSON.stringify(payload)})); true;`
    );
  }, [loadCount, payload]);

  function handleMessage(event) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'select') onSelect?.(msg.id);
    } catch {
      // ignore malformed messages
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ html: HTML }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onLoad={() => setLoadCount((c) => c + 1)}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      <View style={[styles.layerSwitcher, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
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
  container: {
    flex: 1,
  },
  layerSwitcher: {
    position: 'absolute',
    bottom: 20,
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