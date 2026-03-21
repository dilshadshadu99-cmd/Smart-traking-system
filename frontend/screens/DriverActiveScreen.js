import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { socket } from '../services/socket';

export default function DriverActiveScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [locationSub, setLocationSub] = useState(null);
  const busId = "bus_123"; // In prod, get this via Auth Context

  const startTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'GPS is required to track the bus.');
      return;
    }

    if (!socket.connected) socket.connect();

    setIsTracking(true);
    
    // Broadcast location to socket every 10 seconds approx
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, 
        distanceInterval: 10,
      },
      (loc) => {
        socket.emit('update_location', {
          busId,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          timestamp: Date.now(),
        });
        console.log("📍 GPS Broadcasted", loc.coords.latitude, loc.coords.longitude);
      }
    );

    setLocationSub(sub);
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (locationSub) {
      locationSub.remove();
      setLocationSub(null);
    }
    socket.disconnect();
  };

  // ----------------------------------
  // UI RENDER (Premium & Minimal)
  // ----------------------------------
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Console</Text>
        <Text style={styles.subtitle}>Vehicle: {busId}</Text>
      </View>

      <View style={styles.statusBox}>
        <View style={[styles.indicator, { backgroundColor: isTracking ? '#10B981' : '#EF4444' }]} />
        <Text style={styles.statusText}>{isTracking ? 'Broadcasting LIVE...' : 'Offline'}</Text>
      </View>

      <View style={styles.actionArea}>
        {!isTracking ? (
          <TouchableOpacity style={[styles.mainButton, styles.startBtn]} onPress={startTracking}>
            <Text style={styles.btnText}>Start Trip</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.mainButton, styles.stopBtn]} onPress={stopTracking}>
            <Text style={styles.btnText}>Stop Trip</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.emergencyBtn} 
          activeOpacity={0.8}
          onPress={() => Alert.alert('SOS', 'Emergency Alert dispatched!')}
        >
          <Text style={styles.emergencyText}>SOS EMERGENCY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    padding: 24,
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    fontSize: 28, fontWeight: '800', color: '#0F172A'
  },
  subtitle: {
    fontSize: 16, color: '#64748B', marginTop: 4
  },
  statusBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 60,
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  indicator: {
    width: 12, height: 12, borderRadius: 6, marginRight: 10
  },
  statusText: {
    fontSize: 16, fontWeight: '600', color: '#334155'
  },
  actionArea: { gap: 20 },
  mainButton: {
    width: '100%', paddingVertical: 24, borderRadius: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6
  },
  startBtn: { backgroundColor: '#1D4ED8' },
  stopBtn: { backgroundColor: '#0F172A' },
  btnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  emergencyBtn: {
    width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA'
  },
  emergencyText: { color: '#EF4444', fontSize: 16, fontWeight: '800', letterSpacing: 1 }
});
