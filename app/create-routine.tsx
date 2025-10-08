import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Keyboard, View, FlatList } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const ROUTINES_STORAGE_KEY = '@momentum_routines';
// Re-using our data structures
interface Step { id: string; text: string; completed: boolean; }
interface Routine { id: string; name: string; steps: Step[]; }

export default function CreateRoutineScreen() {
  const [routineName, setRoutineName] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [steps, setSteps] = useState<Omit<Step, 'completed'>[]>([]); // We only need id and text here
  const router = useRouter();

  const handleAddStep = () => {
    if (currentStep.trim() === '') return;
    const newStep = {
      id: Date.now().toString(),
      text: currentStep,
    };
    setSteps(prevSteps => [...prevSteps, newStep]);
    setCurrentStep(''); // Clear the input for the next step
  };

  const handleDeleteStep = (stepId: string) => {
    setSteps(prevSteps => prevSteps.filter(step => step.id !== stepId));
  };

  const handleSaveRoutine = async () => {
    if (routineName.trim() === '') {
      alert('Please enter a routine name.');
      return;
    }

    const newRoutine: Routine = {
      id: Date.now().toString(),
      name: routineName,
      // Map our temporary steps into the final structure, adding 'completed: false'
      steps: steps.map(step => ({ ...step, completed: false })),
    };

    try {
      const storedRoutines = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      const allRoutines: Routine[] = storedRoutines ? JSON.parse(storedRoutines) : [];
      const updatedRoutines = [newRoutine, ...allRoutines];
      await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(updatedRoutines));

      Keyboard.dismiss();
      router.back();
    } catch (e) {
      console.error("Failed to save the new routine", e);
      alert("There was an error saving your routine.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'New Routine' }} />
      
      <ThemedText style={styles.label}>Routine Name</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="e.g., Morning Routine"
        placeholderTextColor="#999"
        value={routineName}
        onChangeText={setRoutineName}
      />

      <ThemedText style={styles.label}>Steps</ThemedText>
      <View style={styles.addStepContainer}>
        <TextInput
          style={[styles.input, styles.stepInput]}
          placeholder="Add a new step..."
          placeholderTextColor="#999"
          value={currentStep}
          onChangeText={setCurrentStep}
          onSubmitEditing={handleAddStep} // Allows adding by pressing 'return'
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddStep}>
            <Ionicons name="add-circle" size={32} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={steps}
        renderItem={({ item }) => (
          <View style={styles.stepListItem}>
            <ThemedText style={styles.stepText}>{item.text}</ThemedText>
            <TouchableOpacity onPress={() => handleDeleteStep(item.id)}>
              <Ionicons name="remove-circle-outline" size={24} color="#999" />
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        style={styles.stepList}
      />

      <TouchableOpacity style={styles.button} onPress={handleSaveRoutine}>
        <ThemedText style={styles.buttonText}>Save Routine</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, marginBottom: 10, color: '#AAA' },
  input: { height: 50, borderColor: '#333', backgroundColor: '#1C1C1E', borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, color: 'white', fontSize: 16 },
  addStepContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepInput: { flex: 1, marginRight: 10 },
  addButton: { padding: 5 },
  stepList: { flex: 1, marginBottom: 20 },
  stepListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2C2C2E', padding: 15, borderRadius: 8, marginBottom: 10 },
  stepText: { color: 'white', fontSize: 16 },
  button: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});