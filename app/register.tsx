import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URLS } from '../constants/api';

const RegisterScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth(); 

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);

    // --- MODIFICATION: Add logging ---
    const targetUrl = API_URLS.REGISTER;
    console.log(`[AXIOM_LOG_CLIENT] Attempting registration to: ${targetUrl}`);
    // --- END MODIFICATION ---

    try {
      const response = await fetch(targetUrl, { // <-- Use targetUrl
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to register');
      }
      
      login(data.token);

    } catch (error: any) {
      // --- MODIFICATION: Add logging ---
      console.error('[AXIOM_LOG_CLIENT] REGISTRATION FAILED:', error);
      Alert.alert('Registration Error', `[AXIOM_LOG] ${error.message}. Is the server running and reachable?`);
      // --- END MODIFICATION ---
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
        <ThemedText style={styles.title}>Create Account</ThemedText>
        <TextInput style={styles.input} placeholder="Name" placeholderTextColor={Colors[colorScheme].icon} value={name} onChangeText={setName} autoCapitalize="words" />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors[colorScheme].icon} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors[colorScheme].icon} value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <ThemedText>Already have an account?</ThemedText>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.linkText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
};

export default RegisterScreen;