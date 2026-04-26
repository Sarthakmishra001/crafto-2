import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  Easing, 
  runOnJS 
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  // Reanimated shared values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // Start animations
    logoOpacity.value = withTiming(1, { 
      duration: 800, 
      easing: Easing.out(Easing.exp) 
    });
    logoScale.value = withTiming(1, { 
      duration: 800, 
      easing: Easing.out(Easing.back(1.5)) 
    });
    
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));

    // Navigate to Login after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, textOpacity, taglineOpacity, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  const taglineAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: taglineOpacity.value,
      transform: [{ translateY: withTiming(taglineOpacity.value === 1 ? 0 : 10, { duration: 600 }) }]
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#2A0845', '#6441A5']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoLetter}>C</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.appName}>Crafto</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineContainer, taglineAnimatedStyle]}>
          <Text style={styles.tagline}>Create. Personalize. Share.</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoLetter: {
    fontSize: 64,
    fontWeight: '900',
    color: '#ffffff',
  },
  textContainer: {
    marginBottom: 8,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
  },
  taglineContainer: {
    marginTop: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.5,
  },
});
