import { Ionicons } from '@expo/vector-icons';
import { Tabs, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { API_URLS } from '../../constants/api';

interface User {
  name: string;
  points: number;
  currentStreak: number;
  level: number;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const [user, setUser] = useState<User | null>(null);
  const { token, logout, isLoading } = useAuth(); // Get the token, logout, and isLoading state

  const fetchUser = async () => {
    if (!token) return; // Don't fetch if no token
    try {
      const response = await fetch(API_URLS.USER_ME, {
        headers: {
          'x-auth-token': token, // Send the token
        },
      });
      if (!response.ok) {
        if (response.status === 401) logout(); // If token is bad, log out
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  };

  // Re-fetch user when the screen is focused or the token changes
  useFocusEffect(
    useCallback(() => {
      // --- MODIFICATION: Only fetch if auth is not loading and token exists ---
      if (!isLoading && token) {
        fetchUser();
      }
    }, [token, isLoading]) // Add isLoading to dependency array
  );

  const styles = StyleSheet.create({
    headerRightContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 15, gap: 12 },
    statItem: { flexDirection: 'row', alignItems: 'center' },
    headerRightText: { color: Colors[colorScheme].text, marginLeft: 5, fontSize: 16, fontWeight: 'bold' }
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: true,
        tabBarStyle: { backgroundColor: Colors[colorScheme].background },
        headerStyle: { backgroundColor: Colors[colorScheme].background },
        headerTintColor: Colors[colorScheme].text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inbox',
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {/* --- MODIFICATION: Show a loader while user data is fetching --- */}
              {isLoading ? (
                <ActivityIndicator color={Colors[colorScheme].text} />
              ) : user ? (
                <>
                  <View style={styles.statItem}><Ionicons name="shield-checkmark" size={20} color={Colors[colorScheme].text} /><Text style={styles.headerRightText}>Lvl {user.level}</Text></View>
                  <View style={styles.statItem}><Ionicons name="flame" size={20} color={Colors[colorScheme].text} /><Text style={styles.headerRightText}>{user.currentStreak}</Text></View>
                  <View style={styles.statItem}><Ionicons name="star" size={20} color={Colors[colorScheme].text} /><Text style={styles.headerRightText}>{user.points}</Text></View>
                  <TouchableOpacity onPress={logout} style={styles.statItem}><Ionicons name="log-out-outline" size={24} color={Colors[colorScheme].text} /></TouchableOpacity>
                </>
              ) : null}
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'archive' : 'archive-outline'} size={28} color={color} />),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'list' : 'list-outline'} size={28} color={color} />),
        }}
      />
    </Tabs>
  );
}