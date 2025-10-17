import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { useColorScheme } from 'react-native';

import { useAuth } from '@/context/AuthContext';

// ... (Interface User) ...

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const [user, setUser] = useState<User | null>(null);
  const { token, logout, isLoading } = useAuth(); 

  // ... (fetchUser function) ...
  // ... (useFocusEffect hook) ...
  // ... (styles object) ...

  return (
    <Tabs
      // ... (screenOptions) ...
      >
      <Tabs.Screen
        name="index"
        // ... (options for 'index') ...
      />
      <Tabs.Screen
        name="routines"
        // ... (options for 'routines') ...
      />
      
      {/* --- ADD THIS SCREEN --- */}
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? 'people' : 'people-outline'} size={28} color={color} />),
        }}
      />
      {/* --- END ADDITION --- */}

    </Tabs>
  );
}