import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';
import { useTheme } from '@/hooks/use-theme';
import { safeHaptic } from '@/utils/haptics';

export const PRESET_AVATARS = [
  { emoji: '💼', name: 'Executive' },
  { emoji: '🚀', name: 'Investor' },
  { emoji: '👑', name: 'Champion' },
  { emoji: '💎', name: 'Diamond' },
  { emoji: '⚡', name: 'Trader' },
  { emoji: '🎯', name: 'Strategist' },
  { emoji: '🦊', name: 'Fox' },
  { emoji: '🦁', name: 'Leader' },
  { emoji: '🐼', name: 'Zen' },
  { emoji: '🦉', name: 'Scholar' },
  { emoji: '🤖', name: 'Algo' },
  { emoji: '🌟', name: 'Star' },
  { emoji: '💰', name: 'Saver' },
  { emoji: '🏆', name: 'Achiever' },
  { emoji: '🛡️', name: 'Guardian' },
  { emoji: '🦄', name: 'Builder' },
  { emoji: '🎩', name: 'Aristocrat' },
  { emoji: '☕', name: 'Minimalist' },
  { emoji: '🎮', name: 'Gamer' },
  { emoji: '📈', name: 'Analyst' },
];

export const PRESET_COLORS = [
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#0EA5E9', // Sky Blue
  '#3B82F6', // Cobalt
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#FB923C', // Orange
  '#1E293B', // Slate
  '#047857', // Forest
];

export interface AvatarSelection {
  avatarUrl: string | null;
  avatarEmoji: string;
  avatarColor: string;
}

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  initialAvatarUrl?: string | null;
  initialEmoji?: string;
  initialColor?: string;
  onSelectAvatar: (selection: AvatarSelection) => void;
}

export function AvatarPickerModal({
  visible,
  onClose,
  initialAvatarUrl,
  initialEmoji = '💼',
  initialColor = '#10B981',
  onSelectAvatar,
}: AvatarPickerModalProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const primaryAccent = '#10B981';

  const [activeTab, setActiveTab] = useState<'presets' | 'gallery'>('presets');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(initialAvatarUrl || null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>(initialEmoji || '💼');
  const [selectedColor, setSelectedColor] = useState<string>(initialColor || '#10B981');
  const [isPickingImage, setIsPickingImage] = useState(false);

  // Sync state when modal is opened
  useEffect(() => {
    if (visible) {
      setSelectedAvatarUrl(initialAvatarUrl || null);
      setSelectedEmoji(initialEmoji || '💼');
      setSelectedColor(initialColor || '#10B981');
      if (initialAvatarUrl) {
        setActiveTab('gallery');
      } else {
        setActiveTab('presets');
      }
    }
  }, [visible, initialAvatarUrl, initialEmoji, initialColor]);

  const handlePickFromGallery = async () => {
    safeHaptic('light');
    setIsPickingImage(true);
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Photo Permission Required',
            'Please grant photo library access in your device settings to choose a custom profile picture.'
          );
          setIsPickingImage(false);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].uri) {
        setSelectedAvatarUrl(result.assets[0].uri);
        setActiveTab('gallery');
        safeHaptic('success');
      }
    } catch (err) {
      console.warn('[AvatarPicker] Image picker error:', err);
      Alert.alert('Selection Failed', 'Could not open your photo library. Please try again.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSelectPresetEmoji = (emoji: string) => {
    safeHaptic('light');
    setSelectedEmoji(emoji);
    setSelectedAvatarUrl(null); // Switching to preset clears custom URL
  };

  const handleSelectPresetColor = (color: string) => {
    safeHaptic('light');
    setSelectedColor(color);
  };

  const handleRemoveCustomPhoto = () => {
    safeHaptic('medium');
    setSelectedAvatarUrl(null);
    setActiveTab('presets');
  };

  const handleApply = () => {
    safeHaptic('medium');
    onSelectAvatar({
      avatarUrl: selectedAvatarUrl,
      avatarEmoji: selectedEmoji,
      avatarColor: selectedColor,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#131D31' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
              paddingBottom: Math.max(insets.bottom, 20) + 16,
            },
          ]}
        >
          {/* Top Drag Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Change Profile Avatar</Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Choose from app presets or your device photo gallery
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <PhosphorIcon name="X" size={18} color={theme.text} weight="bold" />
            </TouchableOpacity>
          </View>

          {/* Live Avatar Preview */}
          <View style={styles.previewContainer}>
            <View
              style={[
                styles.previewAvatarCircle,
                {
                  backgroundColor: selectedAvatarUrl ? '#0F172A' : selectedColor,
                  borderColor: isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              {selectedAvatarUrl ? (
                <Image
                  source={{ uri: selectedAvatarUrl }}
                  style={styles.previewImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
              )}
            </View>

            <View style={styles.previewInfoBadge}>
              <Text style={[styles.previewInfoText, { color: theme.textSecondary }]}>
                {selectedAvatarUrl ? 'Custom Photo' : `App Character • ${selectedEmoji}`}
              </Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View
            style={[
              styles.tabBar,
              {
                backgroundColor: isDark ? '#0A0F1D' : '#F1F5F9',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'presets' && [
                  styles.tabItemActive,
                  { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                ],
              ]}
              onPress={() => {
                safeHaptic('light');
                setActiveTab('presets');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === 'presets' ? primaryAccent : theme.textSecondary,
                    fontWeight: activeTab === 'presets' ? '700' : '500',
                  },
                ]}
              >
                App Avatars
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'gallery' && [
                  styles.tabItemActive,
                  { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                ],
              ]}
              onPress={() => {
                safeHaptic('light');
                setActiveTab('gallery');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === 'gallery' ? primaryAccent : theme.textSecondary,
                    fontWeight: activeTab === 'gallery' ? '700' : '500',
                  },
                ]}
              >
                From Gallery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'presets' ? (
              <View style={styles.presetsSection}>
                {/* Character Grid */}
                <Text style={[styles.sectionHeading, { color: theme.text }]}>Choose Character</Text>
                <View style={styles.emojiGrid}>
                  {PRESET_AVATARS.map((item) => {
                    const isSelected = !selectedAvatarUrl && selectedEmoji === item.emoji;
                    return (
                      <TouchableOpacity
                        key={item.emoji}
                        onPress={() => handleSelectPresetEmoji(item.emoji)}
                        activeOpacity={0.7}
                        style={[
                          styles.emojiItem,
                          {
                            backgroundColor: isSelected
                              ? primaryAccent + '25'
                              : isDark
                              ? '#0A0F1D'
                              : '#F8FAFC',
                            borderColor: isSelected
                              ? primaryAccent
                              : isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : '#E2E8F0',
                          },
                        ]}
                      >
                        <Text style={styles.emojiText}>{item.emoji}</Text>
                        <Text
                          style={[
                            styles.emojiName,
                            { color: isSelected ? primaryAccent : theme.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Color Swatches */}
                <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 18 }]}>
                  Background Color
                </Text>
                <View style={styles.colorGrid}>
                  {PRESET_COLORS.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <TouchableOpacity
                        key={color}
                        onPress={() => handleSelectPresetColor(color)}
                        activeOpacity={0.8}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: color },
                          isSelected && styles.colorSwatchSelected,
                        ]}
                      >
                        {isSelected && (
                          <PhosphorIcon name="Check" size={16} color="#FFFFFF" weight="bold" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.gallerySection}>
                <View
                  style={[
                    styles.galleryCard,
                    {
                      backgroundColor: isDark ? '#0A0F1D' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.galleryIconWrap,
                      { backgroundColor: primaryAccent + '20' },
                    ]}
                  >
                    <PhosphorIcon name="Images" size={32} color={primaryAccent} weight="bold" />
                  </View>

                  <Text style={[styles.galleryTitle, { color: theme.text }]}>
                    Photo Library
                  </Text>
                  <Text style={[styles.galleryDesc, { color: theme.textSecondary }]}>
                    Select a photo from your camera roll. It will be cropped to a square and displayed as your profile avatar.
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.galleryPickButton,
                      { backgroundColor: primaryAccent },
                      isPickingImage && { opacity: 0.7 },
                    ]}
                    onPress={handlePickFromGallery}
                    disabled={isPickingImage}
                    activeOpacity={0.85}
                  >
                    <PhosphorIcon name="Camera" size={20} color="#FFFFFF" weight="bold" />
                    <Text style={styles.galleryPickButtonText}>
                      {selectedAvatarUrl ? 'Choose Different Photo' : 'Select Photo from Gallery'}
                    </Text>
                  </TouchableOpacity>

                  {selectedAvatarUrl && (
                    <TouchableOpacity
                      style={[
                        styles.removePhotoButton,
                        { borderColor: isDark ? '#334155' : '#CBD5E1' },
                      ]}
                      onPress={handleRemoveCustomPhoto}
                      activeOpacity={0.8}
                    >
                      <PhosphorIcon name="Trash" size={16} color="#EF4444" weight="bold" />
                      <Text style={styles.removePhotoButtonText}>
                        Remove Photo & Use App Avatar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Confirm Button */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: primaryAccent }]}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Text style={styles.applyButtonText}>Confirm Avatar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  previewAvatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewEmoji: {
    fontSize: 44,
  },
  previewInfoBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  previewInfoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tabLabel: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  presetsSection: {},
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  emojiItem: {
    width: '22%',
    aspectRatio: 0.95,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  emojiText: {
    fontSize: 26,
    marginBottom: 2,
  },
  emojiName: {
    fontSize: 10,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  colorSwatch: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gallerySection: {
    paddingVertical: 10,
  },
  galleryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  galleryIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  galleryTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  galleryDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  galleryPickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
  },
  galleryPickButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  removePhotoButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  applyButton: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
