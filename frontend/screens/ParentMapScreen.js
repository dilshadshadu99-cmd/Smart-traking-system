import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { socket } from '../services/socket';

const { width, height } = Dimensions.get('window');

// TIME CALCULATOR (For "Updated X mins ago")
const timeSince = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  return `${Math.floor(seconds / 60)} mins ago`;
};

export default function ParentMapScreen() {
  const mapRef = useRef(null);
  const busId = "bus_123"; // Matches dummy driver config
  const [busData, setBusData] = useState(null);
  
  // Connect and join tracking room
  useEffect(() => {
    if (!socket.connected) socket.connect();
    
    socket.emit('join_bus_room', busId);

    const onLocationUpdate = (data) => {
      // data: { busId, lat, lng, timestamp }
      setBusData(data);
      
      // Animate Camera Smoothly if bus moves significantly (optional enhancement)
      mapRef.current?.animateToRegion({
        latitude: data.lat,
        longitude: data.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000); 
    };

    socket.on('bus_location_update', onLocationUpdate);

    return () => {
      socket.off('bus_location_update', onLocationUpdate);
      socket.emit('leave_bus_room', busId);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* MAP VIEW */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={{
          latitude: 37.78825, // Fallback lat
          longitude: -122.4324,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsTraffic={true}
      >
        {busData && (
          <Marker
            coordinate={{ latitude: busData.lat, longitude: busData.lng }}
            title="School Bus"
            description="Live Location"
          >
            {/* Custom Bus Icon/Dot */}
            <View style={styles.busMarker}>
              <View style={styles.busMarkerCore} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* OVERLAY: Clean, Minimal Uber-style Card */}
      <View style={styles.overlayCard}>
        <View style={styles.dragHandle} />
        <View style={styles.infoRow}>
          <View>
            <Text style={styles.busLabel}>Bus 42 - Sector 9</Text>
            <Text style={styles.statusText}>
               {busData ? "In Transit" : "Waiting for Driver..."}
            </Text>
          </View>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>
              {busData ? timeSince(busData.timestamp) : "--"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  map: { width, height },
  busMarker: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(29, 78, 216, 0.2)', // Outer ring
    justifyContent: 'center', alignItems: 'center',
  },
  busMarkerCore: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#1D4ED8', // Solid interior dot
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  overlayCard: {
    position: 'absolute', bottom: 0, width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 15
  },
  dragHandle: {
    width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 20
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  busLabel: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  statusText: { fontSize: 15, fontWeight: '500', color: '#10B981' }, // Safety Green
  timeBadge: {
    backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12
  },
  timeBadgeText: { fontSize: 13, fontWeight: '600', color: '#475569' }
});
