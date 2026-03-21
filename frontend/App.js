import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ParentMapScreen from './screens/ParentMapScreen';
import DriverActiveScreen from './screens/DriverActiveScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  // Mock Auth State (In production, grab from Firebase Auth)
  const [userRole, setUserRole] = useState(null); // 'parent' or 'driver' or null

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false, // Premium feel - hide default nav bars
            animation: 'fade',
          }}
        >
          {/* SIMULATED LOGIN FOR DEMONSTRATION */}
          {!userRole ? (
            <Stack.Screen 
              name="Login" 
            >
              {props => <LoginScreen {...props} onLogin={setUserRole} />}
            </Stack.Screen>
          ) : userRole === 'parent' ? (
            <Stack.Screen name="ParentMap" component={ParentMapScreen} />
          ) : (
            <Stack.Screen name="DriverActive" component={DriverActiveScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
