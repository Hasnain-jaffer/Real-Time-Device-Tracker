// mobile/src/components/TrackerControl.js
import { useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';

function AdminTracker() {
  const { colors } = useTheme();
  const { socket, isConnected } = useSocket();
  const [buses, setBuses] = useState([]);
  const [busId, setBusId] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState('');

  const subscription = useRef(null);
  const socketRef = useRef(null);
  socketRef.current = socket; // the socket object is replaced on every reconnect
  const busIdRef = useRef(null);
  busIdRef.current = busId;

  useEffect(() => {
    apiClient
      .get('/devices')
      .then(({ data }) => setBuses(data.devices || []))
      .catch(() => {});
  }, []);

  function stop() {
    if (!subscription.current) return;
    subscription.current.remove();
    subscription.current = null;
    if (socketRef.current?.connected) socketRef.current.emit('stop-location');
    setSharing(false);
  }
  const stopRef = useRef(stop);
  stopRef.current = stop;

  async function start() {
    if (subscription.current) return;
    if (!busId) {
      setMessage('Choose a bus first.');
      return;
    }
    setMessage('');
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setMessage('Location permission is needed to share your position.');
      return;
    }
    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      ({ coords }) => {
        const s = socketRef.current;
        if (!s?.connected) return;
        s.emit('send-location', {
          latitude: coords.latitude,
          longitude: coords.longitude,
          deviceId: busIdRef.current,
        });
      }
    );
    setSharing(true);
  }

  // The app keeps its connection only while it is on screen, so sharing stops when it leaves the foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') stopRef.current();
    });
    return () => {
      sub.remove();
      stopRef.current();
    };
  }, []);

  const selected = buses.find((b) => b._id === busId);

  return (
    <View
      style={{
        backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1,
        borderRadius: 14, padding: 12, marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.textPrimary }}>
            {sharing ? `Sharing as ${selected?.name || 'a bus'}` : 'Share my location as a bus'}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
            {sharing ? 'Keep the screen on while sharing.' : 'Your phone works as a tracker. Keep the screen on.'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={sharing ? stop : start}
          disabled={!sharing && (!busId || !isConnected)}
          style={{
            backgroundColor: sharing ? colors.critical : colors.accent,
            borderRadius: 9, paddingVertical: 8, paddingHorizontal: 14,
            opacity: !sharing && (!busId || !isConnected) ? 0.5 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12.5 }}>{sharing ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
      </View>

      {!sharing && buses.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10, flexGrow: 0 }}
          contentContainerStyle={{ gap: 6 }}
        >
          {buses.map((b) => {
            const isSel = b._id === busId;
            return (
              <TouchableOpacity
                key={b._id}
                onPress={() => setBusId(b._id)}
                style={{
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
                  backgroundColor: isSel ? colors.accent : colors.bgPage,
                  borderColor: isSel ? colors.accent : colors.border,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: isSel ? '#fff' : colors.textPrimary }} numberOfLines={1}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {!!message && <Text style={{ fontSize: 12, color: colors.critical, marginTop: 8 }}>{message}</Text>}
    </View>
  );
}

export default function TrackerControl() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminTracker /> : null;
}