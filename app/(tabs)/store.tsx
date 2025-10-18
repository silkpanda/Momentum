import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { API_URLS } from '../../constants/api';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface Reward {
  _id: string;
  name: string;
  pointCost: number;
}

export default function StoreScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  // Use viewingAs to check role and display points
  const { token, viewingAs, refreshUserData } = useAuth(); 

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- NEW: State for Admin Modal ---
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardName, setRewardName] = useState('');
  const [rewardCost, setRewardCost] = useState('');

  // Check if the current view is a Parent view
  const isParentView = viewingAs?.role === 'Parent';

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-auth-token': token || '',
  });

  const fetchRewards = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await fetch(API_URLS.REWARDS, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch rewards');
      const data = await response.json();
      setRewards(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not load store');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRewards();
    }, [])
  );

  // --- REWARD REDEMPTION (No change) ---
  const handleRedeem = async (reward: Reward) => {
    if (!token || !viewingAs) return;
    if (viewingAs.points < reward.pointCost) {
      Alert.alert('Not enough points', 'Complete more tasks to earn this reward!');
      return;
    }
    Alert.alert(
      'Redeem Reward',
      `Spend ${reward.pointCost} points on "${reward.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              const response = await fetch(API_URLS.REWARD_REDEEM(reward._id), {
                method: 'POST',
                headers: getAuthHeaders(),
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.msg || 'Failed to redeem');
              Alert.alert('Success!', data.msg);
              await refreshUserData(); // Refresh points display
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  // --- NEW: ADMIN FUNCTIONS ---
  const openModal = (reward: Reward | null = null) => {
    if (reward) {
      setEditingReward(reward);
      setRewardName(reward.name);
      setRewardCost(String(reward.pointCost));
    } else {
      setEditingReward(null);
      setRewardName('');
      setRewardCost('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingReward(null);
    setRewardName('');
    setRewardCost('');
  };

  const handleSaveReward = async () => {
    if (!token || !rewardName || !rewardCost) {
      Alert.alert('Error', 'Please enter a name and point cost.');
      return;
    }

    const isEditing = !!editingReward;
    const url = isEditing
      ? API_URLS.REWARD_BY_ID(editingReward._id)
      : API_URLS.REWARDS;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: rewardName,
          pointCost: Number(rewardCost),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to save reward');

      closeModal();
      fetchRewards(); // Refresh the list
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteReward = (reward: Reward) => {
    Alert.alert(
      'Delete Reward',
      `Are you sure you want to delete "${reward.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(API_URLS.REWARD_BY_ID(reward._id), {
                method: 'DELETE',
                headers: getAuthHeaders(),
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.msg || 'Failed to delete');
              Alert.alert('Success', data.msg);
              fetchRewards(); // Refresh list
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };
  // --- END NEW ADMIN FUNCTIONS ---

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <ThemedText type="title">Reward Store</ThemedText>
      <View style={styles.pointsContainer}>
        <Ionicons name="star" size={24} color={Colors.light.tint} />
        <ThemedText style={styles.pointsText}>
          {viewingAs ? viewingAs.points : 0} Points Available
        </ThemedText>
      </View>
      {/* --- NEW: Admin Add Button --- */}
      {isParentView && (
        <TouchableOpacity style={styles.adminAddButton} onPress={() => openModal()}>
          <Ionicons name="add-circle" size={24} color={Colors.light.tint} />
          <Text style={styles.adminAddButtonText}>Add New Reward</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRewardItem = ({ item }: { item: Reward }) => {
    const canAfford = viewingAs ? viewingAs.points >= item.pointCost : false;
    return (
      <View style={[styles.rewardItem, !canAfford && styles.rewardItemDisabled]}>
        <View style={styles.rewardInfo}>
          <ThemedText style={styles.rewardName}>{item.name}</ThemedText>
          {/* --- NEW: Admin Edit/Delete Buttons --- */}
          {isParentView && (
            <View style={styles.adminActions}>
              <TouchableOpacity onPress={() => openModal(item)}>
                <Ionicons name="pencil" size={20} color={Colors[colorScheme].textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteReward(item)}>
                <Ionicons name="trash-outline" size={22} color={Colors[colorScheme].textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.redeemButton, !canAfford && styles.redeemButtonDisabled]}
          onPress={() => handleRedeem(item)}
          disabled={!canAfford}
        >
          <Text style={styles.redeemButtonText}>
            {item.pointCost} {item.pointCost === 1 ? 'Point' : 'Points'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ThemedView style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.light.tint} />
        ) : (
          <FlatList
            data={rewards}
            renderItem={renderRewardItem}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                No rewards have been added yet.
              </ThemedText>
            }
          />
        )}
      </ThemedView>

      {/* --- NEW: Admin Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>
              {editingReward ? 'Edit Reward' : 'Create Reward'}
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Reward Name (e.g., Ice Cream)"
              placeholderTextColor={Colors[colorScheme].textSecondary}
              value={rewardName}
              onChangeText={setRewardName}
            />
            <TextInput
              style={styles.input}
              placeholder="Point Cost (e.g., 100)"
              placeholderTextColor={Colors[colorScheme].textSecondary}
              value={rewardCost}
              onChangeText={setRewardCost}
              keyboardType="number-pad"
            />
            <View style={styles.modalButtonContainer}>
              <Button title="Cancel" onPress={closeModal} color={Colors[colorScheme].textSecondary} />
              <Button title="Save" onPress={handleSaveReward} color={Colors.light.tint} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors[colorScheme].background },
    container: {
      flex: 1,
      paddingHorizontal: 20,
    },
    headerContainer: {
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme].border,
      marginBottom: 10,
    },
    pointsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 15,
      backgroundColor: Colors[colorScheme].backgroundMuted,
      padding: 15,
      borderRadius: 10,
    },
    pointsText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme].text,
    },
    adminAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 15,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: Colors.light.tint,
      borderRadius: 10,
    },
    adminAddButtonText: {
      color: Colors.light.tint,
      fontSize: 16,
      fontWeight: 'bold',
    },
    rewardItem: {
      justifyContent: 'space-between',
      padding: 20,
      backgroundColor: Colors[colorScheme].backgroundMuted,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    rewardItemDisabled: {
      backgroundColor: Colors[colorScheme].background,
    },
    rewardInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15, // Space between name and button
    },
    rewardName: {
      fontSize: 18,
      flex: 1,
      color: Colors[colorScheme].text,
      fontWeight: 'bold',
    },
    adminActions: {
      flexDirection: 'row',
      gap: 15,
      marginLeft: 10,
    },
    redeemButton: {
      backgroundColor: Colors.light.tint,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    redeemButtonDisabled: {
      backgroundColor: Colors[colorScheme].textSecondary,
    },
    redeemButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 50,
      color: Colors[colorScheme].textSecondary,
    },
    // Modal Styles
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
      width: '90%',
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    modalTitle: {
      marginBottom: 20,
      textAlign: 'center',
    },
    input: {
      backgroundColor: Colors[colorScheme].backgroundMuted,
      color: Colors[colorScheme].text,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 8,
      fontSize: 16,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    modalButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
  });