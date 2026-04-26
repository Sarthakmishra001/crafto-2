import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { Share } from 'react-native';

// ─── Category Data ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'aAll', label: 'All', icon: '' },
  { id: 'days_special', label: "Day's Special", icon: '⭐' },
  { id: 'birthday', label: 'Birthday', icon: '🎂' },
  { id: 'good_morning', label: 'Good Morning', icon: '' },
  { id: 'political', label: 'Political', icon: '🏛️' },
  { id: 'suvichar', label: 'Suvichar', icon: '' },
  { id: 'motivation', label: 'Motivation', icon: '' },
  { id: 'bhagwan', label: 'Bhagwan', icon: '🙏' },
  { id: 'love', label: 'Love', icon: '' },
  { id: 'anniversary', label: 'Anniversary', icon: '' },
  { id: 'new', label: 'New', icon: '' },
  { id: 'more', label: 'More', icon: '🔽' },
];

// ─── Dummy Post Data ───────────────────────────────────────────────────────────
const DUMMY_POSTS = [
  { id: '1', title: 'प्रेरणा', image: require('../../assets/images/one.jpeg') },
  { id: '2', title: 'सुविचार', image: require('../../assets/images/two.jpeg') },
  { id: '3', title: 'नया', image: require('../../assets/images/three.png') },
];

// ─── Utility: Capture & Save Image ─────────────────────────────────────────────
/**
 * Captures a ViewShot reference and saves it to the device's media gallery.
 * Handles permissions and error reporting.
 * @param viewShotRef - Reference to the ViewShot component
 * @returns boolean indicating success or failure
 */
const captureAndSaveImage = async (viewShotRef: any): Promise<boolean> => {
  try {
    // ✅ Correct permission (NO true param)
    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to save images to your gallery.'
      );
      return false;
    }

    // ✅ Safety check
    if (!viewShotRef.current) {
      throw new Error('ViewShot ref not found');
    }

    // ✅ Small delay (important for proper rendering)
    await new Promise(resolve => setTimeout(resolve, 200));

    // ✅ Capture image
    const uri = await viewShotRef.current.capture();

    // ✅ Save to gallery
    await MediaLibrary.saveToLibraryAsync(uri);

    return true;
  } catch (err: any) {
    console.log('Download Error:', err);
    Alert.alert(
      'Download Failed',
      err?.message || 'Something went wrong while saving image.'
    );
    return false;
  }
};

/**
 * Captures a ViewShot reference and opens the native share sheet using React Native's Share API.
 * Handles errors and verifies sharing availability.
 * @param viewShotRef - Reference to the ViewShot component
 * @returns boolean indicating success or failure
 */
const captureAndShareImage = async (viewShotRef: any): Promise<boolean> => {
  try {
    // Ensure capture method is available
    if (!viewShotRef.current) {
      throw new Error('ViewShot ref not found');
    }

    // Small delay to ensure the UI is fully painted
    await new Promise(resolve => setTimeout(resolve, 200));

    // Capture the view as a high-quality URI
    const uri = await viewShotRef.current.capture();

    // Use React Native's Share API to share the image URI
    await Share.share({ url: uri, title: 'Share Template' });
    return true;
  } catch (err: any) {
    console.log('Share Error:', err);
    Alert.alert('Share Failed', err?.message || 'Something went wrong while sharing the image.');
    return false;
  }
};

// ─── PostCard Component ────────────────────────────────────────────────────────
const PostCard = ({ item, user }: { item: any; user: any }) => {
  const viewShotRef = useRef<ViewShot>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  
  // Track image loading state to prevent capturing blank images
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [userPhotoLoaded, setUserPhotoLoaded] = useState(!user?.photo);

  const handleDownload = async () => {
    // Ensure images are fully loaded before capturing
    if (!templateLoaded || (user?.photo && !userPhotoLoaded)) {
      Alert.alert('Please Wait', 'Images are still loading. Please try again in a moment.');
      return;
    }

    try {
      setDownloading(true);
      
      // Small delay to ensure the UI is fully painted before capturing
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const success = await captureAndSaveImage(viewShotRef);
      if (success) {
        Alert.alert('✅ Saved!', 'Image has been saved to your gallery.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    // Ensure images are fully loaded before capturing
    if (!templateLoaded || (user?.photo && !userPhotoLoaded)) {
      Alert.alert('Please Wait', 'Images are still loading. Please try again in a moment.');
      return;
    }

    try {
      setSharing(true);
      
      // Small delay to ensure the UI is fully painted before capturing
      await new Promise(resolve => setTimeout(resolve, 150));
      
      await captureAndShareImage(viewShotRef);
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.postCard}>
      {/* Template Image — wrapped in ViewShot for capture */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 1 }}
        style={styles.postImageContainer}
      >
        <Image 
          source={item.image} 
          style={styles.postImage} 
          onLoad={() => setTemplateLoaded(true)}
        />

        {/* User photo — top-right corner */}
        {user?.photo && (
          <Image
            source={{ uri: user.photo }}
            style={styles.userPhotoOverlay}
            onLoad={() => setUserPhotoLoaded(true)}
          />
        )}

        {/* Username — bottom of template, bold */}
        {user?.username && (
          <View style={styles.usernameContainer}>
            <Text style={styles.usernameText}>{user.username}</Text>
          </View>
        )}
      </ViewShot>

      {/* Post Actions Section */}
      <View style={styles.postActionsContainer}>
        {/* Main Actions Row */}
        <View style={styles.mainActionsRow}>
          {/* Share Button with loading state */}
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#25D366' }, sharing && { opacity: 0.7 }]} 
            activeOpacity={0.8}
            onPress={handleShare}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="logo-whatsapp" size={16} color="#fff" />
            )}
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
              {sharing ? 'Sharing...' : 'Share'}
            </Text>
          </TouchableOpacity>

          {/* Download Button with loading state */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#71658B' }, downloading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={16} color="#fff" />
            )}
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
              {downloading ? 'Saving...' : 'Download'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F0F0F0' }]} activeOpacity={0.8}>
            <Ionicons name="pencil" size={16} color="#444" />
            <Text style={[styles.actionButtonText, { color: '#444' }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Button */}
        <TouchableOpacity style={styles.changePhotoButton} activeOpacity={0.8}>
          <Text style={styles.changePhotoText}>अपनी फोटो बदलें</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Home Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState<string | null>(null);

  // Load user data from AsyncStorage on every screen focus
  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        const [storedPhone, storedUsername, storedPhoto] = await Promise.all([
          AsyncStorage.getItem('userPhone'),
          AsyncStorage.getItem('userUsername'),
          AsyncStorage.getItem('userPhoto'),
        ]);
        setPhone(storedPhone);
        setUser({
          phone: storedPhone,
          username: storedUsername ?? 'Crafto User', // fallback for testing
          photo: storedPhoto,
        });
      };
      loadUser();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <View style={[styles.navbarWrapper, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#7E349D', '#A43A8C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.navbarGradient}
        >
          <View style={styles.navbarContent}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#fff" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.createButton}>
                <Ionicons name="add" size={18} color="#6A1B9A" />
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>

              {/* Profile Avatar → navigates to /profile */}
              <TouchableOpacity
                style={styles.profileContainer}
                onPress={() => router.push('/profile' as any)}
              >
                {user?.photo ? (
                  <Image source={{ uri: user.photo }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, styles.profilePlaceholder]}>
                    <Ionicons name="person" size={18} color="#fff" />
                  </View>
                )}
                <View style={styles.dropdownIndicator}>
                  <Ionicons name="chevron-down" size={10} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* ─── Category Chips ──────────────────────────────────────────────────── */}
      <View style={styles.chipsContainer}>
        <View style={styles.chipsWrapper}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                {cat.icon ? <Text style={styles.chipIcon}>{cat.icon}</Text> : null}
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Dropdown Menu ────────────────────────────────────────────────────── */}
      {dropdownVisible && (
        <View style={[styles.dropdownMenu, { top: insets.top + 55 }]}>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => { setDropdownVisible(false); router.push('/profile' as any); }}>
            <Ionicons name="person-outline" size={18} color="#333" />
            <Text style={styles.dropdownItemText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => setDropdownVisible(false)}>
            <Ionicons name="settings-outline" size={18} color="#333" />
            <Text style={styles.dropdownItemText}>Settings</Text>
          </TouchableOpacity>
          <View style={styles.dropdownDivider} />
          <TouchableOpacity style={styles.dropdownItem} onPress={() => setDropdownVisible(false)}>
            <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
            <Text style={[styles.dropdownItemText, { color: '#e74c3c' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Scrollable Feed ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
        onScrollBeginDrag={() => { if (dropdownVisible) setDropdownVisible(false); }}
        showsVerticalScrollIndicator={false}
      >
        {DUMMY_POSTS.map(post => (
          <PostCard key={post.id} item={post} user={user} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCEFDC' },

  // Navbar
  navbarWrapper: {
    backgroundColor: '#7E349D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  navbarGradient: { paddingHorizontal: 15, paddingBottom: 15, paddingTop: 10 },
  navbarContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20,
    paddingHorizontal: 12, height: 40, marginRight: 10,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, height: '100%' },
  actionsContainer: { flexDirection: 'row', alignItems: 'center' },
  createButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 12,
    elevation: 2,
  },
  createButtonText: { color: '#7E349D', fontWeight: '700', fontSize: 14, marginLeft: 4 },
  profileContainer: { flexDirection: 'row', alignItems: 'flex-end', position: 'relative' },
  profileImage: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#fff' },
  profilePlaceholder: { backgroundColor: '#1a0033', justifyContent: 'center', alignItems: 'center' },
  dropdownIndicator: {
    position: 'absolute', bottom: -4, right: -6,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 2,
  },

  // Chips
  chipsContainer: {
    backgroundColor: '#FCEFDC', paddingHorizontal: 10, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', zIndex: 5,
  },
  chipsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#C8A2C8',
  },
  chipSelected: { backgroundColor: '#4A2B73', borderColor: '#4A2B73' },
  chipIcon: { fontSize: 14, marginRight: 4 },
  chipText: { fontSize: 13, color: '#4A2B73', fontWeight: '600' },
  chipTextSelected: { color: '#fff' },

  // Dropdown
  dropdownMenu: {
    position: 'absolute', right: 15, backgroundColor: '#fff',
    borderRadius: 12, paddingVertical: 5, width: 160,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 10, zIndex: 20,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 },
  dropdownItemText: { fontSize: 16, color: '#333', marginLeft: 12, fontWeight: '500' },
  dropdownDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 4 },

  // Feed
  scrollContent: { flex: 1 },
  scrollContentInner: { padding: 15, paddingBottom: 40 },

  // Post Card
  postCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, overflow: 'hidden',
  },
  postImageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#000', position: 'relative' },
  postImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  userPhotoOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: '#fff',
  },
  usernameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  usernameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  postActionsContainer: { padding: 15, backgroundColor: '#fff' },
  mainActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 25,
    flex: 1, marginHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  actionButtonText: { fontWeight: '600', fontSize: 13, marginLeft: 6 },
  changePhotoButton: {
    width: '100%', paddingVertical: 12, borderRadius: 25,
    borderWidth: 1.5, borderColor: '#7E349D', justifyContent: 'center', alignItems: 'center',
  },
  changePhotoText: { color: '#7E349D', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
});
