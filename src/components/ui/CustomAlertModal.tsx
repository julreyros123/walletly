import React from 'react';
import { Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { View, Text, XStack, YStack, Button } from 'tamagui';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/hooks/use-theme';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  variant?: 'primary' | 'destructive' | 'secondary';
}

interface CustomAlertModalProps {
  visible: boolean;
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  onClose: () => void;
  buttons?: AlertButton[];
}

export function CustomAlertModal({
  visible,
  type = 'info',
  title,
  description,
  onClose,
  buttons,
}: CustomAlertModalProps) {
  const theme = useTheme();

  // Get color and icon based on type
  const getTypeDetails = () => {
    switch (type) {
      case 'success':
        return {
          icon: { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' } as const,
          color: theme.success,
          bg: `${theme.success}15`,
        };
      case 'error':
        return {
          icon: { ios: 'xmark.octagon.fill', android: 'report', web: 'report' } as const,
          color: theme.error,
          bg: `${theme.error}15`,
        };
      case 'warning':
        return {
          icon: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' } as const,
          color: theme.warning,
          bg: `${theme.warning}15`,
        };
      case 'info':
      default:
        return {
          icon: { ios: 'info.circle.fill', android: 'info', web: 'info' } as const,
          color: theme.primary,
          bg: `${theme.primary}15`,
        };
    }
  };

  const details = getTypeDetails();
  const alertButtons = buttons && buttons.length > 0 
    ? buttons 
    : [{ text: 'OK', onPress: () => {}, variant: 'primary' as const }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        
        <YStack
          backgroundColor={theme.surface}
          borderColor={theme.border}
          borderWidth={1}
          borderRadius={6}
          padding={20}
          width="85%"
          maxWidth={320}
          alignItems="center"
          gap={14}
          elevation={0}
        >
          {/* Header Icon Indicator */}
          <View
            width={52}
            height={52}
            borderRadius={26}
            backgroundColor={details.bg as any}
            alignItems="center"
            justifyContent="center"
          >
            <SymbolView
              name={details.icon}
              size={24}
              tintColor={details.color}
            />
          </View>

          {/* Texts */}
          <YStack gap={6} width="100%" alignItems="center">
            <Text color={theme.text} fontSize={15} fontWeight="800" textAlign="center">
              {title}
            </Text>
            <Text color={theme.textSecondary} fontSize={12} textAlign="center" lineHeight={17} paddingHorizontal={4}>
              {description}
            </Text>
          </YStack>

          {/* Action Row */}
          <XStack gap={8} width="100%" marginTop={6}>
            {alertButtons.map((btn, idx) => {
              const isPrimary = btn.variant === 'primary' || !btn.variant;
              const isDestructive = btn.variant === 'destructive';
              
              let bg = theme.backgroundElement;
              let borderCol = theme.border;
              let borderW = 1;
              let txtColor = theme.text;

              if (isPrimary) {
                bg = theme.primary;
                borderCol = 'transparent';
                borderW = 0;
                txtColor = '#FFFFFF';
              } else if (isDestructive) {
                bg = theme.error;
                borderCol = 'transparent';
                borderW = 0;
                txtColor = '#FFFFFF';
              }

              return (
                <Button
                  key={idx}
                  flex={1}
                  height={38}
                  backgroundColor={bg as any}
                  borderRadius={6}
                  borderWidth={borderW}
                  borderColor={borderCol as any}
                  pressStyle={{ opacity: 0.85 }}
                  onPress={() => {
                    onClose();
                    if (btn.onPress) {
                      btn.onPress();
                    }
                  }}
                >
                  <Text color={txtColor as any} fontSize={12} fontWeight="700">
                    {btn.text}
                  </Text>
                </Button>
              );
            })}
          </XStack>
        </YStack>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 2000,
  },
});
