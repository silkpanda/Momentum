import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // A standard icon library included with Expo

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // We'll let each screen manage its own title
        tabBarActiveTintColor: '#007AFF', // Color for the active tab
        tabBarStyle: {
          backgroundColor: '#1C1C1E', // Dark background for the tab bar
          borderTopColor: '#333',
        },
      }}>
      <Tabs.Screen
        name="index" // This links to index.tsx
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <Ionicons name="mail-outline" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routines" // This links to routines.tsx
        options={{
          title: 'Routines',
          tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}