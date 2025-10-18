import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user, logout, isLoading } = useAuth(); // Get user from context

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
      
      {/* --- MODIFICATION: Use absolute path '/family' --- */}
      <Tabs.Screen
        name="family"
        options={{
          // Use the absolute path '/family' to show, or null to hide.
          href: user?.role === 'Parent' ? '/family' : null,
          title: 'Family',
          tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'people' : 'people-outline'} size={28} color={color} />),
        }}
      />
      {/* --- END MODIFICATION --- */}
      
    </Tabs>
  );
}