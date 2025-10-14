// app/(tabs)/index.tsx
import React, { useState, useCallback } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, FlatList, Platform, Keyboard, UIManager } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS, interpolate, interpolateColor } from 'react-native-reanimated';
import { API_URLS } from '@/constants/api'; // Import our API URLs

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Update interface to match MongoDB `_id`
interface InboxItemData { _id: string; text: string; }

interface SwipeableListItemProps {
  item: InboxItemData;
  onSwipeRight: (item: InboxItemData) => void;
  onSwipeLeft: (id: string) => void;
}

const SwipeableListItem = ({ item, onSwipeRight, onSwipeLeft }: SwipeableListItemProps) => {
  const translateX = useSharedValue(0);
  const itemOpacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > 100) {
        runOnJS(onSwipeRight)(item);
        translateX.value = withTiming(0);
      } else if (event.translationX < -100) {
        itemOpacity.value = withTiming(0, { duration: 300 });
        translateX.value = withTiming(-500, { duration: 300 }, () => {
          runOnJS(onSwipeLeft)(item._id); // Use _id
        });
      } else {
        translateX.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(translateX.value, [-100, 0, 100], ['#E57373', '#FFFFFF', '#b3cde4']),
  }));

  const rightIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 80], [0, 1])
  }));

  const leftIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-80, 0], [1, 0])
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
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default function InboxScreen() {
  const [items, setItems] = useState<InboxItemData[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const fetchTasks = async () => {
        try {
          const response = await fetch(API_URLS.TASKS);
          const data = await response.json();
          setItems(data);
        } catch (error) {
          console.error("Failed to fetch tasks:", error);
        }
      };
      fetchTasks();
    }, [])
  );

  const handleAddItem = async () => {
    if (newItemText.trim() === '') return;
    try {
      const response = await fetch(API_URLS.TASKS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newItemText.trim() }),
      });
      const newTask = await response.json();
      setItems(prevItems => [newTask, ...prevItems]);
      setNewItemText('');
      Keyboard.dismiss();
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch(`${API_URLS.TASKS}/${id}`, { method: 'DELETE' });
      setItems(prevItems => prevItems.filter(item => item._id !== id));
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };
  
  const handleFocusItem = useCallback((item: InboxItemData) => {
     router.push({ pathname: '/focus-mode', params: { task: item.text, id: item._id } });
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Brain Dump</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Capture your thoughts</ThemedText>
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
          keyExtractor={(item) => item._id} // Use _id
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

// Styles remain the same
const styles = StyleSheet.create({
    container:{flex:1,backgroundColor:"#eef3f9"},header:{padding:20,paddingTop:60,backgroundColor:"#537692",borderBottomLeftRadius:20,borderBottomRightRadius:20},headerTitle:{fontSize:32,fontWeight:"bold",color:"#FFF"},headerSubtitle:{fontSize:16,color:"#b3cde4"},inputContainer:{flexDirection:"row",padding:20,alignItems:"center"},input:{flex:1,backgroundColor:"#FFF",padding:15,borderRadius:15,fontSize:16,marginRight:10,shadowColor:"#000",shadowOffset:{width:0,height:2},shadowOpacity:.1,shadowRadius:4,elevation:3},addButton:{},listContainer:{paddingHorizontal:20,paddingBottom:20},swipeableContainer:{justifyContent:"center",backgroundColor:"white",borderRadius:15},backgroundIcons:{position:"absolute",top:0,bottom:0,left:0,right:0,flexDirection:"row",justifyContent:"space-between",alignItems:"center",borderRadius:15},icon:{position:"absolute",top:0,bottom:0,justifyContent:"center"},listItem:{backgroundColor:"#FFF",padding:20,borderRadius:15,shadowColor:"#000",shadowOffset:{width:0,height:2},shadowOpacity:.1,shadowRadius:4,elevation:3},listItemText:{fontSize:16,color:"#333"}
});