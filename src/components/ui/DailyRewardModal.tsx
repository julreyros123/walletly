import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { useTheme } from '@/hooks/use-theme';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useGamificationStore } from '@/store/gamificationStore';
import { FormButton } from '@/components/ui/FormButton';

interface DailyRewardModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DailyRewardModal({ visible, onClose }: DailyRewardModalProps) {
  const theme = useTheme();
  const store = useGamificationStore();
  const [claimedReward, setClaimedReward] = useState<{ xp: number; cash: number } | null>(null);

  // Determine current day in 1-7 cycle
  const currentDayInCycle = ((store.streakDays - 1) % 7) + 1;

  const handleClaim = () => {
    const res = store.claimDailyReward();
    if (res.success) {
      setClaimedReward({ xp: res.xp, cash: res.cash });
      // Close automatically after 3 seconds or user can close manually
      setTimeout(() => {
        onClose();
        setClaimedReward(null);
      }, 3500);
    } else {
      onClose(); // Already claimed, just close
    }
  };

  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <Modal visible={visible} transparent animationType="none">
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.85)" alignItems="center" justifyContent="center" padding={20}>
        <Animated.View entering={FadeInDown.duration(100)} exiting={FadeOut.duration(80)}>
          <YStack
            backgroundColor={theme.background}
            width="100%"
            maxWidth={360}
            borderRadius={24}
            borderWidth={1}
            borderColor={theme.border}
            overflow="hidden"
          >
            {/* Header Area */}
            <YStack
              backgroundColor="rgba(62, 180, 125, 0.1)"
              position="absolute"
              top={0}
              left={0}
              right={0}
              height={120}
            />
            
            <YStack padding={24} gap={20} alignItems="center">
              
              <YStack alignItems="center" gap={4}>
                <SymbolView name={{ ios: 'gift.fill', android: 'card_giftcard', web: 'card_giftcard' } as any} size={42} tintColor={theme.primary as any} />
                <Text color={theme.text} fontSize={22} fontWeight="800" marginTop={8}>
                  Daily Check-In
                </Text>
                <Text color={theme.textSecondary} fontSize={14} textAlign="center">
                  Come back every day to earn XP and Simulator Cash!
                </Text>
              </YStack>

              {/* 7-Day Grid */}
              <XStack flexWrap="wrap" justifyContent="center" gap={8} width="100%">
                {days.map((day) => {
                  const isPast = day < currentDayInCycle;
                  const isCurrent = day === currentDayInCycle;
                  const isFuture = day > currentDayInCycle;
                  
                  let xp = day * 10;
                  let cash = day === 3 ? 500 : day === 7 ? 2000 : 0;

                  return (
                    <YStack
                      key={day}
                      width="30%"
                      backgroundColor={isCurrent ? (`${theme.primary}15` as any) : theme.surface}
                      borderWidth={isCurrent ? 2 : 1}
                      borderColor={isCurrent ? theme.primary : theme.border}
                      borderRadius={12}
                      padding={10}
                      alignItems="center"
                      gap={4}
                      opacity={isFuture ? 0.6 : 1}
                    >
                      <Text color={isCurrent ? theme.primary as any : theme.textSecondary} fontSize={10} fontWeight="700" textTransform="uppercase">
                        Day {day}
                      </Text>
                      
                      {isPast ? (
                        <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } as any} size={24} tintColor={theme.success} />
                      ) : (
                        <SymbolView 
                          name={cash > 0 ? ({ ios: 'banknote.fill', android: 'payments', web: 'payments' } as any) : ({ ios: 'star.fill', android: 'star', web: 'star' } as any)} 
                          size={24} 
                          tintColor={isCurrent ? theme.primary as any : theme.textSecondary} 
                        />
                      )}
                      
                      <Text color={theme.text} fontSize={12} fontWeight="800">
                        {cash > 0 ? `₱${cash}` : `+${xp} XP`}
                      </Text>
                    </YStack>
                  );
                })}
              </XStack>

              {/* Action Button */}
              {claimedReward ? (
                <Animated.View entering={FadeIn.duration(80)}>
                  <YStack alignItems="center" gap={8} marginTop={10}>
                    <Text color={theme.success} fontSize={16} fontWeight="700">
                      Reward Claimed! 🎉
                    </Text>
                    <Text color={theme.textSecondary} fontSize={13}>
                      +{claimedReward.xp} XP {claimedReward.cash > 0 && `| +₱${claimedReward.cash} Sim Cash`}
                    </Text>
                  </YStack>
                </Animated.View>
              ) : (
                <FormButton variant="primary" width="100%" height={50} onPress={handleClaim} marginTop={10}>
                  Claim Day {currentDayInCycle} Reward
                </FormButton>
              )}
              
            </YStack>
            
            {/* Close button (top right) */}
            <Button
              position="absolute"
              top={12}
              right={12}
              width={36}
              height={36}
              borderRadius={18}
              backgroundColor="rgba(255,255,255,0.1)"
              padding={0}
              alignItems="center"
              justifyContent="center"
              onPress={() => {
                onClose();
                setClaimedReward(null);
              }}
            >
              <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' } as any} size={14} tintColor={theme.text} />
            </Button>
            
          </YStack>
        </Animated.View>
      </YStack>
    </Modal>
  );
}
