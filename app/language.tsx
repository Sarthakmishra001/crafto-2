import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function LanguageScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectLanguage = async (language: string) => {
    if (!phone || typeof phone !== 'string') {
      setError("User session lost. Please try logging in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const userDocRef = doc(db, 'users', phone);

      // Save language preference
      await setDoc(userDocRef, {
        language: language
      }, { merge: true });

      // Navigate to Religion Selection
      router.replace({
        pathname: '/religion',
        params: { phone }
      });
    } catch (err: any) {
      setError("Failed to save language. Please check your connection.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Language</Text>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={() => handleSelectLanguage('English')}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#8a2be2" />
          ) : (
            <Text style={styles.buttonText}>English</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#1a0033',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 20,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 60,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
  }
});
