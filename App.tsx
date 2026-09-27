import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Calendar, Clock, Settings } from 'lucide-react-native';

import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme/colors';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            // Header disembunyikan — tiap screen menampilkan judulnya sendiri
            // sesuai design.md §9 (Display title di dalam konten layar)
            headerShown: false,
            tabBarActiveTintColor: colors.action,
            tabBarInactiveTintColor: colors.inkSoft,
            tabBarStyle: {
              backgroundColor: colors.paperRaised,
              borderTopColor: colors.rule,
              borderTopWidth: 1,
              elevation: 0,
              shadowOpacity: 0,
              height: 56,
            },
            tabBarLabelStyle: {
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 6,
            },
            tabBarIconStyle: {
              marginTop: 6,
            },
          }}
        >
          <Tab.Screen
            name="Hari Ini"
            component={HomeScreen}
            options={{
              // eslint-disable-next-line react/no-unstable-nested-components
              tabBarIcon: ({ color }) => (
                <Calendar color={color} size={22} strokeWidth={1.75} />
              ),
            }}
          />
          <Tab.Screen
            name="Riwayat"
            component={HistoryScreen}
            options={{
              // eslint-disable-next-line react/no-unstable-nested-components
              tabBarIcon: ({ color }) => (
                <Clock color={color} size={22} strokeWidth={1.75} />
              ),
            }}
          />
          <Tab.Screen
            name="Pengaturan"
            component={SettingsScreen}
            options={{
              // eslint-disable-next-line react/no-unstable-nested-components
              tabBarIcon: ({ color }) => (
                <Settings color={color} size={22} strokeWidth={1.75} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
