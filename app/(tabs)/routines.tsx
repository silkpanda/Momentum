import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { StyleSheet, TouchableOpacity, Platform, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Link, useFocusEffect } from 'expo-router'; // Import useFocusEffect
import { SwipeListView } from 'react-native-swipe-list-view';

const ROUTINES_STORAGE_KEY = '@momentum_routines';
interface Step { id: string; text: string; completed: boolean; }
interface Routine { id: string; name: string; steps: Step[]; }

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  
  // THIS IS THE CRITICAL FIX:
  // useFocusEffect runs every time the user navigates TO this screen.
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const storedRoutines = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
          if (storedRoutines !== null) {
            setRoutines(JSON.parse(storedRoutines));
          } else {
            setRoutines([]); // Ensure list is empty if nothing is in storage
          }
        } catch (e) { 
          console.error('Failed to load routines.', e); 
        }
      };
      
      loadData();
      
      // The useCallback hook is a performance optimization.
    }, [])
  );

  // The 'save' effect is no longer needed here, as saving happens in other screens.
  // But we need a way to update storage when we delete.
  const updateStorage = async (updatedRoutines: Routine[]) => {
    try {
        await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(updatedRoutines));
    } catch (e) { console.error('Failed to save routines.', e); }
  };

  const handleDeleteRoutine = (routineId: string) => {
    const updatedRoutines = routines.filter(routine => routine.id !== routineId);
    setRoutines(updatedRoutines);

    // Manually trigger the save after deleting
    updateStorage(updatedRoutines);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>My Routines</ThemedText>
      
      <SwipeListView
        data={routines}
        renderItem={({ item }) => (
          <Link href={`/routine/${item.id}`} asChild>
            <TouchableOpacity>
              <ThemedView style={styles.listItemContainer}>
                <ThemedText style={styles.listItemText}>{item.name}</ThemedText>
                <ThemedText style={{ color: '#999' }}>&gt;</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          </Link>
        )}
        renderHiddenItem={({ item }) => (
          <View style={styles.rowBack}>
            <TouchableOpacity
              style={[styles.backRightBtn, styles.backRightBtnRight]}
              onPress={() => handleDeleteRoutine(item.id)}
            >
              <ThemedText style={{ color: 'white' }}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        rightOpenValue={-75}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={() => (
          <ThemedText style={styles.emptyListText}>No routines yet. Create one!</ThemedText>
        )}
      />

      <Link href="/create-routine" asChild>
        <TouchableOpacity style={styles.button}>
          <ThemedText style={styles.buttonText}>Create New Routine</ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
  );
}

// --- Styles remain the same ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: Platform.OS === 'android' ? 60 : 40 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  list: { flex: 1 },
  listItemContainer: {
    backgroundColor: '#2C2C2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  listItemText: { fontSize: 18, fontWeight: '500' },
  emptyListText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' },
  button: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#DD2C00',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderRadius: 12,
    marginBottom: 10,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
  },
  backRightBtnRight: {
    backgroundColor: '#DD2C00',
    right: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});