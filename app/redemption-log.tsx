import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    useColorScheme,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URLS } from '@/constants/api';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

interface Redemption {
  _id: string;
  userId: { // Populated user data
    _id: string;
    name: string;
  };
  rewardName: string;
  pointCost: number;
  timestamp: string;
}

export default function RedemptionLogScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const { token } = useAuth();

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRedemptions = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const response = await fetch(API_URLS.REDEMPTIONS, {
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) throw new Error('Failed to fetch redemption log');
      const data = await response.json();
      setRedemptions(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not load redemption log');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRedemptions();
    }, [])
  );

  const renderItem = ({ item }: { item: Redemption }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemRow}>
         <Ionicons name="person-circle-outline" size={20} color={Colors[colorScheme].textSecondary} style={styles.icon}/>
         <ThemedText style={styles.userName}>{item.userId?.name || 'Unknown User'}</ThemedText>
      </View>
      <View style={styles.itemRow}>
          <Ionicons name="gift-outline" size={20} color={Colors[colorScheme].textSecondary} style={styles.icon}/>
          <ThemedText style={styles.rewardName}>{item.rewardName}</ThemedText>
          <ThemedText style={styles.pointCost}>({item.pointCost} pts)</ThemedText>
      </View>
      <View style={styles.itemRow}>
          <Ionicons name="calendar-outline" size={20} color={Colors[colorScheme].textSecondary} style={styles.icon}/>
          <ThemedText style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleString()}
          </ThemedText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Configure Header */}
      <Stack.Screen options={{ title: 'Redemption Log' }} />

      <ThemedView style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.light.tint} />
        ) : (
          <FlatList
            data={redemptions}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                No rewards have been redeemed yet.
              </ThemedText>
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors[colorScheme].background },
    container: {
      flex: 1,
      padding: 20,
    },
    itemContainer: {
      backgroundColor: Colors[colorScheme].backgroundMuted,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        marginRight: 10,
    },
    userName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors[colorScheme].text,
    },
    rewardName: {
      fontSize: 16,
      color: Colors[colorScheme].text,
      flexShrink: 1, // Allow text to wrap if needed
    },
    pointCost: {
      fontSize: 14,
      color: Colors[colorScheme].textSecondary,
      marginLeft: 10,
    },
    timestamp: {
      fontSize: 14,
      color: Colors[colorScheme].textSecondary,
      marginTop: 5,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 50,
      color: Colors[colorScheme].textSecondary,
    },
  });