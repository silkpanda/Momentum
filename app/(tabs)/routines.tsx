import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import theme-aware components and color constants
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

const RoutinesScreen = () => {
  const colorScheme = useColorScheme() ?? 'light';

  // Dynamic styles that change based on the color scheme
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors[colorScheme].background,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    button: {
      backgroundColor: Colors[colorScheme].tint,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    buttonText: {
      color: Colors[colorScheme].background,
      fontSize: 16,
      fontWeight: 'bold',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        <View style={styles.headerContainer}>
          <ThemedText style={styles.title}>My Routines</ThemedText>
          {/* Link component navigates to the create-routine screen */}
          <Link href="/create-routine" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Placeholder for the list of routines */}
        <View style={styles.centered}>
          <ThemedText>No routines created yet.</ThemedText>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
};

export default RoutinesScreen;