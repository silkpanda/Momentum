import { Ionicons } from '@expo/vector-icons'; // <-- Import Ionicons
import { useRouter } from 'expo-router'; // <-- Import useRouter
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { API_URLS } from '../../constants/api';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

type Mode = 'invite' | 'addChild';

export default function FamilyScreen() {
  const router = useRouter(); // <-- Add router hook
  const [mode, setMode] = useState<Mode>('invite');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);

  // State for Invite User
  const [email, setEmail] = useState('');
  
  // State for Add Child
  const [childName, setChildName] = useState('');
  const [childPassword, setChildPassword] = useState('');

  const handleInvite = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(API_URLS.FAMILY_INVITE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || '',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to send invite');
      Alert.alert('Success', data.msg);
      setEmail('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!childName || !childPassword) {
      Alert.alert('Error', 'Please enter a name and password for the child.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(API_URLS.FAMILY_ADD_CHILD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || '',
        },
        body: JSON.stringify({ name: childName, password: childPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to add child');
      Alert.alert('Success', data.msg);
      setChildName('');
      setChildPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderForm = () => {
    if (mode === 'invite') {
      return (
        <>
          <ThemedText style={styles.subtitle}>
            Invite an existing user to your family. They must already have an account.
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="User's Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={Colors[colorScheme].textSecondary}
          />
          <Button title="Send Invite" onPress={handleInvite} color={Colors.light.tint} />
        </>
      );
    }

    if (mode === 'addChild') {
      return (
        <>
          <ThemedText style={styles.subtitle}>
            Create a new 'Child' account in your family. No email required.
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Child's Name"
            value={childName}
            onChangeText={setChildName}
            autoCapitalize="words"
            placeholderTextColor={Colors[colorScheme].textSecondary}
          />
          <TextInput
            style={styles.input}
            placeholder="Create Password"
            value={childPassword}
            onChangeText={setChildPassword}
            autoCapitalize="none"
            secureTextEntry
            placeholderTextColor={Colors[colorScheme].textSecondary}
          />
          <Button title="Create Account" onPress={handleAddChild} color={Colors.light.tint} />
        </>
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Manage Family</ThemedText>
      
      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, mode === 'invite' && styles.segmentButtonActive]}
          onPress={() => setMode('invite')}>
          <Text style={[styles.segmentText, mode === 'invite' && styles.segmentTextActive]}>
            Invite User
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, mode === 'addChild' && styles.segmentButtonActive]}
          onPress={() => setMode('addChild')}>
          <Text style={[styles.segmentText, mode === 'addChild' && styles.segmentTextActive]}>
            Add Child
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 20 }} />
      ) : (
        renderForm()
      )}

      {/* --- NEW: Redemption Log Button --- */}
      <TouchableOpacity 
        style={styles.logButton} 
        onPress={() => router.push('/redemption-log')}
      >
        <Ionicons name="receipt-outline" size={20} color={Colors.light.tint} />
        <Text style={styles.logButtonText}>View Redemption Log</Text>
      </TouchableOpacity>
      {/* --- END NEW --- */}

    </ThemedView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 10,
  },
  subtitle: {
    marginBottom: 20,
    fontSize: 16,
    color: Colors[colorScheme].textSecondary,
    minHeight: 50, // Ensure layout doesn't jump
  },
  input: {
    backgroundColor: Colors[colorScheme].backgroundMuted,
    color: Colors[colorScheme].text,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors[colorScheme].border,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors[colorScheme].backgroundMuted,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors[colorScheme].border,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 7,
  },
  segmentButtonActive: {
    backgroundColor: Colors.light.tint,
    margin: 2,
  },
  segmentText: {
    color: Colors[colorScheme].textSecondary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  segmentTextActive: {
    color: '#fff',
  },
  // --- NEW STYLES ---
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 30, // Add space above the button
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 8,
  },
  logButtonText: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // --- END NEW STYLES ---
});