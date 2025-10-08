import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, FlatList, Platform, Keyboard, UIManager } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, interpolateColor } from 'react-native-reanimated';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY = '@momentum_inboxItems';
interface InboxItemData { id: string; text: string; author?: string }

// --- Types for SwipeableListItem Props ---
interface SwipeableListItemProps {
  item: InboxItemData;
  onSwipeRight: (item: InboxItemData) => void;
  onSwipeLeft: (id: string) => void;
}

// --- Swipeable List Item Component ---
const SwipeableListItem = ({ item, onSwipeRight, onSwipeLeft }: SwipeableListItemProps) => {
  const translateX = useSharedValue(0);
  const itemOpacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > 100) { // Swipe Right Threshold
        runOnJS(onSwipeRight)(item);
        translateX.value = withTiming(0); // Reset position after action
      } else if (event.translationX < -100) { // Swipe Left Threshold
        itemOpacity.value = withTiming(0, { duration: 300 });
        translateX.value = withTiming(-500, { duration: 300 }, () => {
          runOnJS(onSwipeLeft)(item.id);
        });
      } else {
        translateX.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translateX.value,
      [-100, 0, 100],
      ['#E57373', '#FFFFFF', '#b3cde4']
    ),
  }));
  
  const rightIconStyle = useAnimatedStyle(() => ({
    opacity: interpolateColor(translateX.value, [0, 80], [0, 1])
  }));

  const leftIconStyle = useAnimatedStyle(() => ({
    opacity: interpolateColor(translateX.value, [-80, 0], [1, 0])
  }));


  return (
    <View style={styles.swipeableContainer}>
       <Animated.View style={[styles.backgroundIcons, backgroundStyle]}>
          <Animated.View style={[styles.icon, { left: 20 }, rightIconStyle]}>
            <Ionicons name={"arrow-forward-circle"} size={24} color={"#537692"} />
          </Animated.View>
          <Animated.View style={[styles.icon, { right: 20 }, leftIconStyle]}>
            <Ionicons name={"trash"} size={24} color={"#FFF"} />
          </Animated.View>
        </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.listItem, animatedStyle, { opacity: itemOpacity }]}>
          <ThemedText style={styles.listItemText}>{item.text}</ThemedText>
          {item.author && <ThemedText style={styles.authorText}>- {item.author}</ThemedText>}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// --- Main Inbox Screen ---
export default function InboxScreen() {
  const [items, setItems] = useState<InboxItemData[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [currentUser, setCurrentUser] = useState('Mom'); // Add state for current user
  const router = useRouter();
  const users = ['Mom', 'Dad', 'Kid']; // Predefined users

  useEffect(() => {
    const loadItems = async () => {
      try {
        const storedItems = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedItems) {
          setItems(JSON.parse(storedItems));
        }
      } catch (e) {
        console.error("Failed to load items.", e);
      }
    };
    loadItems();
  }, []);
  
  const saveItems = useCallback(async (newItems: InboxItemData[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed to save items.", e);
    }
  }, []);

  const handleAddItem = useCallback(() => {
    if (newItemText.trim() === '') return;
    const newItem: InboxItemData = { id: uuidv4(), text: newItemText.trim(), author: currentUser };
    const updatedItems = [newItem, ...items];
    setItems(updatedItems);
    saveItems(updatedItems);
    setNewItemText('');
    Keyboard.dismiss();
  }, [newItemText, items, saveItems, currentUser]);

  const handleDeleteItem = useCallback((id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveItems(updatedItems);
  }, [items, saveItems]);
  
  const handleFocusItem = useCallback((item: InboxItemData) => {
     router.push({ pathname: '/focus-mode', params: { task: item.text, id: item.id } });
  }, [router]);


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Brain Dump</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Capture your thoughts</ThemedText>
          <View style={styles.userSwitcherContainer}>
            {users.map((user) => (
              <TouchableOpacity
                key={user}
                style={[
                  styles.userButton,
                  currentUser === user && styles.activeUserButton,
                ]}
                onPress={() => setCurrentUser(user)}
              >
                <ThemedText style={[styles.userButtonText, currentUser === user && styles.activeUserButtonText]}>{user}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor="#999"
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAddItem}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Ionicons name="add-circle" size={48} color="#ffdf7c" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SwipeableListItem 
              item={item} 
              onSwipeLeft={handleDeleteItem} 
              onSwipeRight={handleFocusItem}
            />
          )}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </ThemedView>
    </GestureHandlerRootView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef3f9', // Very Light Blue
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#537692', // Muted Blue
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#b3cde4', // Soft Blue
    marginBottom: 15,
  },
  userSwitcherContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  userButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 5,
  },
  activeUserButton: {
    backgroundColor: '#ffdf7c', // Vibrant Yellow for active user
  },
  userButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  activeUserButtonText: {
    color: '#537692'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    fontSize: 16,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    // Add button styles
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  swipeableContainer: {
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
  },
  backgroundIcons: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 15,
  },
  icon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  listItem: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
  },
  authorText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  }
});

