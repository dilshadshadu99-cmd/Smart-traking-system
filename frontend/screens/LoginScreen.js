import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// ----------------------------------------------------
// LOGIN SCREEN: Simulates Magic Link/OTP Role Selection
// ----------------------------------------------------
export default function LoginScreen({ onLogin }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Track Your Bus</Text>
        <Text style={styles.subtitle}>Secure, fast, and real-time.</Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* Simulate parent login */}
        <TouchableOpacity 
          style={[styles.button, styles.parentBtn]} 
          onPress={() => onLogin('parent')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Login as Parent</Text>
        </TouchableOpacity>

        {/* Simulate driver login */}
        <TouchableOpacity 
          style={[styles.button, styles.driverBtn]} 
          onPress={() => onLogin('driver')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnTextDriver}>Login as Driver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Soft modern background
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A', // Slate 900
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B', // Slate 500
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  parentBtn: {
    backgroundColor: '#1D4ED8', // Deep premium blue
  },
  driverBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnTextDriver: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  }
});
