import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="focus-mode" 
        options={{ 
          // Set back to transparent
          presentation: 'transparentModal', 
          // We will handle the animation manually, so disable the navigator's
          animation: 'none', 
          headerShown: false, 
        }} 
      />
    </Stack>
  );
}

