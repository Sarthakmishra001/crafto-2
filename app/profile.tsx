import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load saved data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      const [storedPhone, storedUsername, storedPhoto] = await Promise.all([
        AsyncStorage.getItem('userPhone'),
        AsyncStorage.getItem('userUsername'),
        AsyncStorage.getItem('userPhoto'),
      ]);
      setPhone(storedPhone);
      setUsername(storedUsername);
      setPhotoUri(storedPhoto);
    };
    loadData();
  }, []);

  const pickImage = async () => {
    // Request gallery permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow gallery access to upload a photo.');
      return;
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    try {
      setLoading(true);
      const uri = result.assets[0].uri;

      // Save URI locally in AsyncStorage
      await AsyncStorage.setItem('userPhoto', uri);
      setPhotoUri(uri);
    } catch (err) {
      Alert.alert('Error', 'Could not save the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a0033" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={52} color="#fff" />
          </View>
        )}

        {/* Camera badge */}
        <TouchableOpacity style={styles.cameraBadge} onPress={pickImage} disabled={loading}>
          <Ionicons name="camera" size={16} color="#fff" />
        </TouchableOpacity>

        {loading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>

      {/* User Info */}
      {username && <Text style={styles.username}>{username}</Text>}
      {phone && <Text style={styles.phoneText}>{phone}</Text>}

      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadBtn, loading && styles.uploadBtnDisabled]}
        onPress={pickImage}
        disabled={loading}
      >
        <Ionicons name="image-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.uploadBtnText}>
          {loading ? 'Saving...' : photoUri ? 'Change Profile Picture' : 'Upload Profile Picture'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3ff',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede7f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a0033',
  },
  avatarSection: {
    marginTop: 30,
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: '#7E349D',
  },
  avatarPlaceholder: {
    backgroundColor: '#1a0033',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7E349D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 65,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a0033',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 15,
    color: '#888',
    marginBottom: 34,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7E349D',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#7E349D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadBtnDisabled: {
    backgroundColor: '#b39ddb',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
