import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

const STORAGE_KEY = '@momentum_inboxItems';
interface InboxItemData { id: string; text: string; }

export default function FocusModeScreen() {
  const { task, id } = useLocalSearchParams();
  const router = useRouter();
  
  // Create a shared value for opacity, starting at 0 (invisible)
  const opacity = useSharedValue(0);

  // Create an animated style that reacts to the opacity value
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Animate the screen in when it mounts
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const handleDone = async () => {
    // 1. Define the cleanup and navigation logic as a separate function
    const navigateBack = async () => {
        if (typeof id === 'string') {
            try {
                const storedItems = await AsyncStorage.getItem(STORAGE_KEY);
                if (storedItems) {
                    let items: InboxItemData[] = JSON.parse(storedItems);
                    items = items.filter(item => item.id !== id);
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
                }
            } catch (e) { 
                console.error("Failed to delete item from focus mode", e); 
            }
        }
        router.back();
    };

    // 2. Animate the opacity back to 0
    // The third argument to withTiming is a callback that runs when the animation is complete
    opacity.value = withTiming(0, { duration: 300 }, (isFinished) => {
      if (isFinished) {
        // 3. Run the navigation logic on the JS thread after the animation is 100% done
        runOnJS(navigateBack)();
      }
    });
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Focus Mode</ThemedText>
          <TouchableOpacity onPress={handleDone} style={styles.closeButton}>
            <Ionicons name="close-circle" size={32} color="#555" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <ThemedText style={styles.prompt}>Just one thing...</ThemedText>
          <ThemedText style={styles.taskText}>{task || "No task selected"}</ThemedText>
        </View>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Ionicons name="checkmark-done-circle" size={80} color="#4CAF50" />
          <ThemedText style={styles.doneButtonText}>I'm Done!</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  }, 
  header: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 15, 
    paddingTop: Platform.OS === 'android' ? 25 : 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#222' 
  }, 
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#FFF' 
  }, 
  closeButton: { 
    position: 'absolute', 
    right: 15, 
    top: Platform.OS === 'android' ? 20 : 10 
  }, 
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  }, 
  prompt: { 
    fontSize: 24, 
    color: '#888', 
    marginBottom: 20 
  }, 
  taskText: { 
    fontSize: 40, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    color: '#FFF' 
  }, 
  doneButton: { 
    alignItems: 'center', 
    marginBottom: 40 
  }, 
  doneButtonText: { 
    fontSize: 20, 
    color: '#4CAF50', 
    marginTop: 10 
  } 
});

