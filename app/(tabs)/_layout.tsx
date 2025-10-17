import { Ionicons } from '@expo/vector-icons';
import { Tabs, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';
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

  const fetchUser = async () => {
    try {
      const response = await fetch(API_URLS.USER_ME);
      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  };

  useFocusEffect(useCallback(() => { fetchUser(); }, []));

  const styles = StyleSheet.create({
    headerRightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 15,
      gap: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerRightText: {
      color: Colors[colorScheme].text,
      marginLeft: 5,
      fontSize: 16,
      fontWeight: 'bold',
    }
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          // --- CORRECTION: The 'border' property does not exist. Line removed. ---
        },
        headerStyle: {
          backgroundColor: Colors[colorScheme].background,
        },
        headerTintColor: Colors[colorScheme].text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inbox',
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              {user && (
                <>
                  <View style={styles.statItem}>
                    <Ionicons name="shield-checkmark" size={20} color={Colors[colorScheme].text} />
                    <Text style={styles.headerRightText}>Lvl {user.level}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="flame" size={20} color={Colors[colorScheme].text} />
                    <Text style={styles.headerRightText}>{user.currentStreak}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="star" size={20} color={Colors[colorScheme].text} />
                    <Text style={styles.headerRightText}>{user.points}</Text>
                  </View>
                </>
              )}
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'archive' : 'archive-outline'} size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}