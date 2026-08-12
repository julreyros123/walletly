import React from 'react';
import { XStack, YStack, Text, View } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { WallyHelper } from './WallyHelper';

interface WallyBubbleProps {
  text: string;
  expression: 'smiling' | 'happy' | 'sad' | 'mad';
  helperSize?: number;
}

export const WallyBubble: React.FC<WallyBubbleProps> = ({ text, expression, helperSize = 65 }) => {
  const theme = useTheme() as any;

  return (
    <XStack gap={12} alignItems="center" width="100%" marginVertical={8}>
      {/* Wally Mascot */}
      <WallyHelper expression={expression} size={helperSize} />

      {/* Speech Bubble Container */}
      <YStack
        flex={1}
        backgroundColor={theme.surface}
        borderColor={
          expression === 'mad'
            ? theme.error
            : expression === 'sad'
            ? theme.warning
            : theme.border
        }
        borderWidth={1}
        borderRadius={12}
        padding={12}
        position="relative"
        style={{
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: 1,
        } as any}
      >
        {/* Triangle speech pointer (pointing left to Wally) */}
        <View
          position="absolute"
          left={-6}
          top="50%"
          marginTop={-6}
          width={10}
          height={10}
          backgroundColor={theme.surface}
          borderColor={
            expression === 'mad'
              ? theme.error
              : expression === 'sad'
              ? theme.warning
              : theme.border
          }
          borderBottomWidth={1}
          borderLeftWidth={1}
          style={{ transform: [{ rotate: '45deg' }] } as any}
        />
        <Text color={theme.text} fontSize={12} lineHeight={16} fontWeight="500">
          {text}
        </Text>
      </YStack>
    </XStack>
  );
};
