import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, // <-- Import FlatList
  Button, // <-- Import Modal
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '../../constants/theme';
import { useAuth, User } from '../../context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user, viewingAs, familyMembers, setViewAs, logout, isLoading } = useAuth();
  
  // --- NEW: State for modal visibility ---
  const [isSwapModalVisible, setSwapModalVisible] = useState(false);

  const styles = getStyles(colorScheme);

  // --- MODIFIED: Profile Selection Logic ---
  const selectProfile = (userToView: User) => {
    setViewAs(userToView);
    setSwapModalVisible(false);
  };
  // --- END MODIFICATION ---

  const renderHeaderRight = () => (
    <View style={styles.headerRightContainer}>
      {isLoading ? (
        <ActivityIndicator color={Colors[colorScheme].text} />
      ) : viewingAs ? (
        <>
          {/* --- Profile Swap Button (Parent Only) --- */}
          {user?.role === 'Parent' && familyMembers.length > 1 && (
            // --- MODIFIED: Opens modal instead of cycling ---
            <TouchableOpacity onPress={() => setSwapModalVisible(true)} style={styles.swapButton}>
              <Ionicons name="person-circle-outline" size={20} color={Colors.light.tint} />
              <Text style={styles.swapButtonText}>Viewing: {viewingAs.name}</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.statItem}>
            <Ionicons name="shield-checkmark" size={20} color={Colors[colorScheme].text} />
            <Text style={styles.headerRightText}>Lvl {viewingAs.level}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color={Colors[colorScheme].text} />
            <Text style={styles.headerRightText}>{viewingAs.points}</Text>
          </View>
          
          {user?._id === viewingAs._id && (
             <TouchableOpacity onPress={logout} style={styles.statItem}>
               <Ionicons name="log-out-outline" size={24} color={Colors[colorScheme].text} />
             </TouchableOpacity>
          )}
        </>
      ) : null}
    </View>
  );

  return (
    // --- MODIFICATION: Wrap in Fragment to allow Modal sibling ---
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          headerShown: true,
          tabBarStyle: { backgroundColor: Colors[colorScheme].background },
          headerStyle: { backgroundColor: Colors[colorScheme].background },
          headerTintColor: Colors[colorScheme].text,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tasks',
            headerRight: renderHeaderRight,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'archive' : 'archive-outline'} size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="routines"
          options={{
            title: 'Routines',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'list' : 'list-outline'} size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="store"
          options={{
            title: 'Store',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="family"
          options={{
            href: user?.role === 'Parent' ? '/family' : null,
            title: 'Family',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={28} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* --- NEW: Profile Swap Modal --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isSwapModalVisible}
        onRequestClose={() => setSwapModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>Select Profile</ThemedText>
            <FlatList
              data={familyMembers}
              keyExtractor={(item) => item._id}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.profileButton,
                    viewingAs?._id === item._id && styles.profileButtonActive
                  ]} 
                  onPress={() => selectProfile(item)}
                >
                  <Ionicons 
                    name={item.role === 'Parent' ? 'person-circle' : 'person-circle-outline'} 
                    size={24} 
                    color={viewingAs?._id === item._id ? Colors.light.tint : Colors[colorScheme].text}
                  />
                  <Text 
                    style={[
                      styles.profileButtonText,
                      viewingAs?._id === item._id && styles.profileButtonTextActive
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <Button title="Cancel" onPress={() => setSwapModalVisible(false)} color={Colors.light.tint} />
          </View>
        </View>
      </Modal>
    </>
    // --- END MODIFICATION ---
  );
}

const getStyles = (colorScheme: 'light' | 'dark') =>
  StyleSheet.create({
    headerRightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 15,
      gap: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerRightText: {
      color: Colors[colorScheme].text,
      marginLeft: 5,
      fontSize: 16,
      fontWeight: 'bold',
    },
    swapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 20,
      backgroundColor: Colors[colorScheme].backgroundMuted,
      borderWidth: 1,
      borderColor: Colors.light.tint,
    },
    swapButtonText: {
      color: Colors.light.tint,
      fontWeight: 'bold',
      fontSize: 14,
    },
    // --- NEW MODAL STYLES ---
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContent: {
      backgroundColor: Colors[colorScheme].background,
      borderRadius: 15,
      padding: 20,
      width: '80%',
      maxHeight: '60%',
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    modalTitle: {
      marginBottom: 20,
      textAlign: 'center',
    },
    list: {
      marginBottom: 20,
    },
    profileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderRadius: 8,
      marginBottom: 10,
      backgroundColor: Colors[colorScheme].backgroundMuted,
    },
    profileButtonActive: {
      backgroundColor: Colors[colorScheme].backgroundMuted,
      borderWidth: 1,
      borderColor: Colors.light.tint,
    },
    profileButtonText: {
      fontSize: 18,
      color: Colors[colorScheme].text,
    },
    profileButtonTextActive: {
      fontWeight: 'bold',
      color: Colors.light.tint,
    },
    // --- END NEW MODAL STYLES ---
  });