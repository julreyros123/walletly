import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import { useRouter } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { GameSceneIllustration, GameSceneType } from '@/features/arcade/components/GameSceneIllustration';
import { safeHaptic } from '@/utils/haptics';

const Text = (props: any) => <TamaguiText {...props} />;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.82;

interface MiniGameItem {
  id: string;
  title: string;
  category: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  description: string;
  sceneType: GameSceneType;
  route: string;
  xpReward: string;
  timeEstimate: string;
  borderColor: string;
  playBtnColor: string;
}

export const MINI_GAMES_LIST: MiniGameItem[] = [
  {
    id: 'headline-trader',
    title: 'Headline Trader',
    category: 'Wall Street Sentiment',
    tag: 'LIVE NOW 🔥',
    tagColor: '#047857',
    tagBg: '#A7F3D0',
    description: 'Swipe breaking company news right to BUY 📈 or left to SELL 📉 with 2x combo streaks!',
    sceneType: 'trader',
    route: '/headline-trader',
    xpReward: '+150 XP',
    timeEstimate: '5 Cards • 60s',
    borderColor: '#10B981',
    playBtnColor: '#10B981',
  },
  {
    id: 'crypto-rocket',
    title: 'Crypto Rocket',
    category: 'Space Volatility',
    tag: 'MOON SHOT 🚀',
    tagColor: '#7E22CE',
    tagBg: '#E9D5FF',
    description: 'Ride the candlestick rocket to 10x! Tap Cash Out before the space thrusters explode!',
    sceneType: 'rocket',
    route: '/crypto-rocket',
    xpReward: '+200 XP',
    timeEstimate: 'High Stakes',
    borderColor: '#A855F7',
    playBtnColor: '#A855F7',
  },
  {
    id: 'portfolio-balancer',
    title: 'Portfolio Balancer',
    category: 'Asset Strategist',
    tag: 'STRATEGY 🥧',
    tagColor: '#854D0E',
    tagBg: '#FEF08A',
    description: 'Distribute 100% across Tech, Dividends, Gold & Cash to survive 4 dynamic market cycles!',
    sceneType: 'balancer',
    route: '/portfolio-balancer',
    xpReward: '+180 XP',
    timeEstimate: '4 Cycles • 90s',
    borderColor: '#F59E0B',
    playBtnColor: '#F59E0B',
  },
  {
    id: 'dividend-snowball',
    title: 'Dividend Snowball',
    category: 'Alpine Compound DRIP',
    tag: 'DRIP ARCADE ❄️',
    tagColor: '#0E7490',
    tagBg: '#CFFAFE',
    description: 'Tap falling quarterly dividend coin bubbles (DRIP) to multiply your passive income snowball!',
    sceneType: 'snowball',
    route: '/dividend-snowball',
    xpReward: '+160 XP',
    timeEstimate: 'Fast Tapping',
    borderColor: '#06B6D4',
    playBtnColor: '#06B6D4',
  },
];

export function ArcadeGameList() {
  const router = useRouter();

  const handleGamePress = (game: MiniGameItem) => {
    safeHaptic('medium');
    router.push(game.route as any);
  };

  return (
    <View>
      {/* Row Header */}
      <XStack justifyContent="space-between" alignItems="center" marginBottom={14} marginTop={4}>
        <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.bold} letterSpacing={0.6} textTransform="uppercase">
          FEATURED MINI-GAMES
        </Text>
        <Text color="#10B981" fontSize={11.5} fontFamily={Fonts.bold}>
          {MINI_GAMES_LIST.length} Games Ready
        </Text>
      </XStack>

      {/* Horizontal Row of Scenic Game Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalRowContainer}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 14}
      >
        {MINI_GAMES_LIST.map((game) => (
          <TouchableOpacity
            key={game.id}
            onPress={() => handleGamePress(game)}
            activeOpacity={0.9}
            style={[
              styles.gameCardItem,
              {
                borderColor: game.borderColor,
                shadowColor: game.borderColor,
              },
            ]}
          >
            {/* 1. SCENIC SETTING ILLUSTRATION BANNER */}
            <View style={styles.bannerContainer}>
              <GameSceneIllustration type={game.sceneType} width={CARD_WIDTH - 24} height={140} />

              {/* Overlay Badges */}
              <View style={styles.tagOverlay}>
                <View style={[styles.tagPill, { backgroundColor: game.tagBg }]}>
                  <Text color={game.tagColor} fontSize={9.5} fontFamily={Fonts.bold}>
                    {game.tag}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. CARD INFO DETAILS */}
            <YStack gap={4} marginTop={12}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="#FFFFFF" fontSize={18} fontFamily={Fonts.bold}>
                  {game.title}
                </Text>
                <Text color="#94A3B8" fontSize={11} fontFamily={Fonts.bold}>
                  {game.category}
                </Text>
              </XStack>

              <Text color="#94A3B8" fontSize={12} fontFamily={Fonts.medium} lineHeight={17}>
                {game.description}
              </Text>
            </YStack>

            {/* 3. CARD FOOTER */}
            <XStack justifyContent="space-between" alignItems="center" paddingTop={12} borderTopWidth={1} borderTopColor="#1E293B" marginTop={12}>
              <Text color="#64748B" fontSize={11.5} fontFamily={Fonts.medium}>
                {game.timeEstimate}
              </Text>

              <View style={[styles.playBtn, { backgroundColor: game.playBtnColor }]}>
                <Text color="#FFFFFF" fontSize={13} fontFamily={Fonts.bold}>
                  Play Now ➔
                </Text>
              </View>
            </XStack>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalRowContainer: {
    paddingVertical: 6,
    gap: 14,
  },
  gameCardItem: {
    width: CARD_WIDTH,
    backgroundColor: '#131D31',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  bannerContainer: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  tagOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  playBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6.5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
