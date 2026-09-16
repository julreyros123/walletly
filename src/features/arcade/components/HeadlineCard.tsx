import React, { useRef } from 'react';
import { StyleSheet, View, Text as RNText, Animated, PanResponder, Dimensions, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import { StockHeadline } from '@/constants/gameHeadlines';
import { Fonts } from '@/constants/theme';
import { safeHaptic } from '@/utils/haptics';
import { soundFX } from '@/utils/soundEffects';
import { PhosphorIcon } from '@/components/ui/PhosphorIcon';

const Text = (props: any) => <TamaguiText {...props} />;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface HeadlineCardProps {
  headline: StockHeadline;
  onSwipe: (action: 'BUY' | 'SELL') => void;
  isCurrent: boolean;
}

export function HeadlineCard({ headline, onSwipe, isCurrent }: HeadlineCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isCurrent,
      onMoveShouldSetPanResponder: () => isCurrent,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (!isCurrent) return;

        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swiped Right -> BUY
          soundFX.playSwipe();
          Animated.timing(pan, {
            toValue: { x: SCREEN_WIDTH + 100, y: gestureState.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => onSwipe('BUY'));
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swiped Left -> SELL
          soundFX.playSwipe();
          Animated.timing(pan, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gestureState.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => onSwipe('SELL'));
        } else {
          // Reset card to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const buyOpacity = pan.x.interpolate({
    inputRange: [10, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const sellOpacity = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, -10],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Dynamic Buy / Sell Watermark Stamps */}
      <Animated.View style={[styles.stampContainer, styles.buyStamp, { opacity: buyOpacity }]}>
        <RNText style={[styles.stampText, { color: '#10B981', borderColor: '#10B981' }]}>
          📈 BUY
        </RNText>
      </Animated.View>

      <Animated.View style={[styles.stampContainer, styles.sellStamp, { opacity: sellOpacity }]}>
        <RNText style={[styles.stampText, { color: '#EF4444', borderColor: '#EF4444' }]}>
          📉 SELL
        </RNText>
      </Animated.View>

      {/* Card Header: Company Logo, Ticker & Sector */}
      <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
        <XStack alignItems="center" gap={12} flex={1}>
          <View style={[styles.logoBox, { backgroundColor: headline.logoBg }]}>
            <RNText style={styles.logoIcon}>{headline.categoryIcon}</RNText>
          </View>
          <YStack flex={1}>
            <Text color="#FFFFFF" fontSize={17} fontFamily={Fonts.bold} numberOfLines={1}>
              {headline.companyName}
            </Text>
            <XStack alignItems="center" gap={6} marginTop={2}>
              <Text color="#38BDF8" fontSize={11.5} fontFamily={Fonts.bold}>
                ${headline.ticker}
              </Text>
              <View style={styles.sectorTag}>
                <Text color="#94A3B8" fontSize={10} fontFamily={Fonts.bold}>
                  {headline.sector}
                </Text>
              </View>
            </XStack>
          </YStack>
        </XStack>

        <View style={styles.tradeSizePill}>
          <Text color="#A7F3D0" fontSize={11} fontFamily={Fonts.bold}>
            ₱{headline.virtualBaseBet} Bet
          </Text>
        </View>
      </XStack>

      {/* News Badge */}
      <View style={styles.newsBadge}>
        <PhosphorIcon name="Newspaper" size={12} color="#38BDF8" weight="duotone" />
        <Text color="#38BDF8" fontSize={10.5} fontFamily={Fonts.bold} letterSpacing={0.5}>
          BREAKING NEWS
        </Text>
      </View>

      {/* Headline Title */}
      <Text color="#FFFFFF" fontSize={19} fontFamily={Fonts.bold} lineHeight={25} marginVertical={10}>
        "{headline.headline}"
      </Text>

      {/* Detail Paragraph */}
      <Text color="#94A3B8" fontSize={13} fontFamily={Fonts.medium} lineHeight={19.5} flex={1}>
        {headline.detail}
      </Text>

      {/* Footer Swipe Hint */}
      <XStack justifyContent="space-between" alignItems="center" paddingTop={12} borderTopWidth={1} borderTopColor="#1E293B">
        <XStack alignItems="center" gap={6}>
          <PhosphorIcon name="ArrowLeft" size={13} color="#EF4444" weight="bold" />
          <Text color="#EF4444" fontSize={11.5} fontFamily={Fonts.bold}>
            Swipe Left: SELL
          </Text>
        </XStack>

        <XStack alignItems="center" gap={6}>
          <Text color="#10B981" fontSize={11.5} fontFamily={Fonts.bold}>
            Swipe Right: BUY
          </Text>
          <PhosphorIcon name="ArrowRight" size={13} color="#10B981" weight="bold" />
        </XStack>
      </XStack>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: SCREEN_WIDTH - 32,
    maxHeight: 420,
    minHeight: 380,
    backgroundColor: '#131D31',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
    justifyContent: 'space-between',
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectorTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  logoIcon: {
    fontSize: 22,
  },
  tradeSizePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  newsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stampContainer: {
    position: 'absolute',
    top: 20,
    zIndex: 99,
  },
  buyStamp: {
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
  sellStamp: {
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  stampText: {
    fontSize: 22,
    fontWeight: '900',
    borderWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
