import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebaseConfig';

export default function LoginScreen() {
  const router = useRouter();
  
  const [phone, setPhone] = useState("+91");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    // Basic validation
    if (username.trim().length < 2) {
      setError("Please enter a valid username");
      return;
    }
    if (phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    
    try {
      setLoading(true);
      setError("");

      // Use the phone number as the document ID
      const userDocRef = doc(db, 'users', phone);

      // Save user data including username
      await setDoc(userDocRef, {
        phone: phone,
        username: username.trim(),
        createdAt: serverTimestamp()
      }, { merge: true });

      // Persist user data to AsyncStorage for future use
      await AsyncStorage.setItem('userPhone', phone);
      await AsyncStorage.setItem('userUsername', username.trim());

      // Navigate to Language Selection and pass the phone number
      router.replace({
        pathname: '/language',
        params: { phone }
      });
    } catch (err: any) {
      setError("Failed to save data. Please check your connection.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crafto</Text>
      <Text style={styles.subtitle}>Create your profile to continue</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
        editable={!loading}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="+91XXXXXXXXXX"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        editable={!loading}
      />

      <Pressable 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleContinue} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
    color: '#1a0033',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 20,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 55,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 18,
    marginBottom: 20,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  button: {
    width: '100%',
    backgroundColor: '#8a2be2',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#8a2be2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#b388ff',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  }
});
