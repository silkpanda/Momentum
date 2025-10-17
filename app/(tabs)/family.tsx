import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { API_URLS } from '../../constants/api';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function FamilyScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);

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

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to send invite');
      }

      Alert.alert('Success', data.msg);
      setEmail('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Manage Family</ThemedText>
      <ThemedText style={styles.subtitle}>
        Invite a member to your family. They must already have an account.
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
      
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.light.tint} />
      ) : (
        // --- MODIFICATION ---
        // The color prop must always be the accent color, not the theme's tint.
        // Colors.dark.tint is 'white', which makes the button text invisible.
        // Colors.light.tint is the blue accent color for both themes.
        <Button title="Send Invite" onPress={handleInvite} color={Colors.light.tint} />
        // --- END MODIFICATION ---
      )}
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
});