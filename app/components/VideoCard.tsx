import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface VideoCardProps {
  /** Local video source — use require('../../assets/videos/one.mp4') */
  videoSource: any;
  /** User data to overlay on the video (profile pic top-right, username below) */
  user?: {
    username?: string;
    photo?: string | null;
  };
  /** Optional: override default share handler */
  onShare?: () => void;  /** Optional: override default download handler */
  onDownload?: () => void;
}

// ─── Helper: Resolve local video asset URI ───────────────────────────────────────
/**
 * Resolves a require()-based video module to a local file URI.
 *
 * WHY overlay is NOT included in downloaded video:
 * ──────────────────────────────────────────────────
 * The overlay (View/Image/Text) is a React Native UI layer rendered by the
 * JavaScript thread on top of the video surface. It is NOT baked into the
 * video frames. When you share/download the video file, you get the raw MP4
 * file bytes — the native video data — without any overlay.
 *
 * To include the overlay in the exported video you need to composite the
 * overlay onto each frame using FFmpeg (via ffmpeg-kit-react-native).
 * See the comment at the bottom of this file for guidance.
 */
const resolveVideoUri = async (videoSource: any): Promise<string> => {
  const asset = Asset.fromModule(videoSource);
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('Could not resolve local URI for video asset.');
  }
  return asset.localUri;
};

// ─── VideoCard Component ────────────────────────────────────────────────────────
/**
 * Reusable card component that plays a local video with a user overlay.
 *
 * Layout matches PostCard (image template):
 * - Profile picture:  top-right, circular with white border
 * - Username text:    bottom strip, bold white, full width
 * - Aspect ratio:     1:1 (square, same as PostCard)
 * - No title badge
 *
 * NOTE: Share/Download exports the raw video file. The overlay is visual-only
 * in the app. See bottom of file for FFmpeg-based compositing approach.
 */
const VideoCard: React.FC<VideoCardProps> = ({
  videoSource,
  user,
  onShare,
  onDownload,
}) => {
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // ─── Video Player ─────────────────────────────────────────────────────────
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // ─── Download Handler ─────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (onDownload) {
      try { setDownloading(true); await onDownload(); }
      finally { setDownloading(false); }
      return;
    }
    try {
      setDownloading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save videos to your gallery.');
        return;
      }
      const localUri = await resolveVideoUri(videoSource);
      const asset = await MediaLibrary.createAssetAsync(localUri);
      await MediaLibrary.createAlbumAsync('Crafto Videos', asset, false);
      Alert.alert(
        '✅ Saved!',
        'Video saved to gallery.\n\nNote: Overlay (name/photo) is visual-only and not baked into the video file.'
      );
    } catch (err: any) {
      Alert.alert('Download Failed', err?.message || 'Something went wrong while saving video.');
    } finally {
      setDownloading(false);
    }
  };

  // ─── Share Handler ────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (onShare) {
      try { setSharing(true); await onShare(); }
      finally { setSharing(false); }
      return;
    }
    try {
      setSharing(true);
      const available = await Sharing.isAvailableAsync();
      if (!available) { Alert.alert('Error', 'Sharing is not supported on this device.'); return; }
      const localUri = await resolveVideoUri(videoSource);
      await Sharing.shareAsync(localUri, { mimeType: 'video/mp4', dialogTitle: 'Share Video Template' });
    } catch (err: any) {
      Alert.alert('Share Failed', err?.message || 'Something went wrong.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* ─── Video Container (square 1:1) ─────────────────────────────────── */}
      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="cover"
        />

        {/* ─── Bottom gradient for username readability ───────────────────── */}
        <View style={styles.bottomGradient} />

        {/* ─── Profile picture — top-right (matches PostCard) ────────────── */}
        {user?.photo ? (
          <Image source={{ uri: user.photo }} style={styles.userPhotoOverlay} />
        ) : (
          <View style={[styles.userPhotoOverlay, styles.userPhotoPlaceholder]}>
            <Ionicons name="person" size={22} color="#fff" />
          </View>
        )}

        {/* ─── Username — bottom strip (matches PostCard) ─────────────────── */}
        {user?.username ? (
          <View style={styles.usernameContainer}>
            <Text style={styles.usernameText} numberOfLines={1}>
              {user.username}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ─── Action Buttons ──────────────────────────────────────────────── */}
      <View style={styles.actionsContainer}>
        <View style={styles.mainActionsRow}>
          {/* Share */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#25D366' }, sharing && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleShare}
            disabled={sharing}
          >
            {sharing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="logo-whatsapp" size={16} color="#fff" />}
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
              {sharing ? 'Sharing...' : 'Share'}
            </Text>
          </TouchableOpacity>

          {/* Download */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#71658B' }, downloading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="download-outline" size={16} color="#fff" />}
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
              {downloading ? 'Saving...' : 'Download'}
            </Text>
          </TouchableOpacity>

          {/* Edit */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F0F0F0' }]}
            activeOpacity={0.8}
          >
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

export default VideoCard;

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },

  // ── Square video (1:1) — same as PostCard postImageContainer ─────────────
  videoContainer: {
    width: '100%',
    aspectRatio: 1,           // ← SQUARE (was 9/16 which caused the tall card)
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },

  // Bottom dark strip for username readability
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },

  // ── Profile picture — top-right (matches PostCard userPhotoOverlay) ───────
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
  userPhotoPlaceholder: {
    backgroundColor: '#4A2B73',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Username — bottom full-width strip (matches PostCard usernameContainer)
  usernameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
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

  // ── Action Buttons ────────────────────────────────────────────────────────
  actionsContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  mainActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  changePhotoButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#7E349D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#7E349D',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * WHY THE OVERLAY IS NOT INCLUDED IN THE DOWNLOADED VIDEO
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * The profile picture and username are React Native Views rendered by the JS
 * thread OVER the video surface — they are screen-level UI, not video frames.
 * When you call MediaLibrary.saveToLibraryAsync(uri) or Sharing.shareAsync(uri),
 * you are exporting the raw .mp4 file bytes. The overlay never touches those
 * bytes, so it cannot appear in the output.
 *
 * ───────────────────────────────────────────────────────────────────────────────
 * BEST PRODUCTION SOLUTION: ffmpeg-kit-react-native
 * ───────────────────────────────────────────────────────────────────────────────
 *
 * 1. Install (bare workflow required — eject from Expo Go):
 *      npx expo install ffmpeg-kit-react-native
 *    Or in bare: npm install ffmpeg-kit-react-native
 *
 * 2. Overlay concept with FFmpeg filter:
 *    - Save the profile image locally (expo-file-system)
 *    - Build an FFmpeg drawtext + overlay filter command:
 *
 *    import { FFmpegKit } from 'ffmpeg-kit-react-native';
 *    import * as FileSystem from 'expo-file-system';
 *
 *    const exportCustomizedVideo = async (videoUri, profileImageUri, username, outputUri) => {
 *      // Square crop + add profile image overlay (top-right) + username text (bottom)
 *      const cmd = [
 *        `-i ${videoUri}`,
 *        `-i ${profileImageUri}`,
 *        `-filter_complex`,
 *        `"[0:v]crop=min(iw\\,ih):min(iw\\,ih),scale=720:720[base];` +
 *        `[1:v]scale=80:80,geq=r='r(X,Y)':a='if(lte((X-40)^2+(Y-40)^2,40^2),255,0)'[avatar];` +
 *        `[base][avatar]overlay=W-90:10[vid];` +
 *        `[vid]drawtext=text='${username}':fontsize=36:fontcolor=white:x=14:y=H-50:` +
 *        `shadowcolor=black:shadowx=1:shadowy=1"`,
 *        `-codec:a copy`,
 *        outputUri
 *      ].join(' ');
 *
 *      await FFmpegKit.execute(cmd);
 *    };
 *
 * 3. PRACTICAL WORKAROUND (if you cannot use FFmpeg / need Expo Go):
 *    - Screenshot-based export: capture a THUMBNAIL image (using react-native-view-shot)
 *      of the video frame + overlay together and share that as a preview image.
 *    - This gives users a customized POSTER image they can share, while the
 *      raw video is shared separately.
 *    - This is what most Crafto-like apps do at MVP stage.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */
