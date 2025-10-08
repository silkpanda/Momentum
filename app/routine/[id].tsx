import { StyleSheet, FlatList, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; // Import the icon library

const ROUTINES_STORAGE_KEY = '@momentum_routines';
interface Step { id: string; text: string; completed: boolean; }
interface Routine { id: string; name: string; steps: Step[]; }

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const [routine, setRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    // This function remains the same, it loads the initial data
    const fetchRoutine = async () => {
      try {
        const storedRoutines = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
        if (storedRoutines) {
          const allRoutines: Routine[] = JSON.parse(storedRoutines);
          const foundRoutine = allRoutines.find(r => r.id === id);
          setRoutine(foundRoutine || null);
        }
      } catch (e) { console.error("Failed to fetch routine details", e); }
    };

    if (id) { fetchRoutine(); }
  }, [id]);

  // NEW: Function to toggle a step's completion and save immediately
  const handleToggleStep = async (stepId: string) => {
    if (!routine) return;

    // Create a new version of the routine with the updated step
    const newSteps = routine.steps.map(step => 
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );
    const updatedRoutine = { ...routine, steps: newSteps };
    
    // Update the UI immediately for a responsive feel
    setRoutine(updatedRoutine);

    // Now, save this change back to the full list in storage
    try {
      const storedRoutines = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      if (storedRoutines) {
        let allRoutines: Routine[] = JSON.parse(storedRoutines);
        // Find the index of our current routine in the main array
        const routineIndex = allRoutines.findIndex(r => r.id === id);
        if (routineIndex !== -1) {
          // Replace the old routine with our updated one
          allRoutines[routineIndex] = updatedRoutine;
          // Save the entire updated array back to storage
          await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(allRoutines));
        }
      }
    } catch (e) {
      console.error("Failed to save step completion", e);
    }
  };

  if (!routine) {
    return <ThemedView style={styles.container}><ThemedText>Loading...</ThemedText></ThemedView>;
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: routine.name }} />
      <ThemedText style={styles.title}>{routine.name}</ThemedText>
      
      <FlatList
        data={routine.steps}
        renderItem={({ item }) => (
          // UPDATED: The whole item is now a button
          <TouchableOpacity onPress={() => handleToggleStep(item.id)}>
            <View style={[styles.stepContainer, item.completed && styles.stepContainerCompleted]}>
              <Ionicons 
                name={item.completed ? "checkmark-circle" : "radio-button-off-outline"}
                size={24} 
                color={item.completed ? "#4CAF50" : "#999"}
                style={styles.stepIcon}
              />
              <ThemedText style={[styles.stepText, item.completed && styles.stepTextCompleted]}>
                {item.text}
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E', // Start with a matching border
  },
  stepContainerCompleted: {
    backgroundColor: '#1C331D', // A subtle green background for completed items
    borderColor: '#4CAF50', // A green border to highlight completion
  },
  stepIcon: {
    marginRight: 15,
  },
  stepText: {
    fontSize: 16,
    flex: 1, // Ensure text wraps correctly
  },
  stepTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#888', // Dim the text of completed items
  },
});