import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext'; // Import the useAuth hook
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URLS } from '../constants/api';

const LoginScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); // Get the login function from context

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URLS.BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to log in');
      }
      
      // --- Use the login function to save the token ---
      login(data.token);
      // Navigation is now handled by the AuthContext

    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors[colorScheme].background },
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderColor: Colors[colorScheme].icon, color: Colors[colorScheme].text, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, fontSize: 16, marginBottom: 15 },
    button: { backgroundColor: Colors[colorScheme].tint, justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 8, marginTop: 10 },
    buttonText: { color: Colors[colorScheme].background, fontSize: 18, fontWeight: 'bold' },
    linkContainer: { marginTop: 20, alignItems: 'center' },
    linkText: { color: Colors[colorScheme].tint },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Welcome Back</ThemedText>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors[colorScheme].icon} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors[colorScheme].icon} value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Logging In...' : 'Log In'}</Text>
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <ThemedText>Don't have an account?</ThemedText>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>Register</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
};

export default LoginScreen;