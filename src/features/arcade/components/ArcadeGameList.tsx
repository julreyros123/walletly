import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { YStack, XStack, Text as TamaguiText } from 'tamagui';
import { useRouter } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { GameSceneIllustration, GameSceneType } from '@/features/arcade/components/GameSceneIllustration';
import { safeHaptic } from '@/utils/haptics';

const Text = (props: any) => <TamaguiText {...props} />;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.70;

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
    category: 'Market Sentiment',
    tag: 'LIVE 🔥',
    tagColor: '#047857',
    tagBg: '#A7F3D0',
    description: 'Swipe breaking headlines to Buy or Sell with streak combos.',
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
    category: 'Volatility',
    tag: 'FAST 🚀',
    tagColor: '#7E22CE',
    tagBg: '#E9D5FF',
    description: 'Ride the multiplier and cash out before the drop.',
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
    category: 'Asset Allocation',
    tag: 'STRATEGY 🥧',
    tagColor: '#854D0E',
    tagBg: '#FEF08A',
    description: 'Balance your asset mix to survive dynamic market cycles.',
    sceneType: 'balancer',
    route: '/portfolio-balancer',
    xpReward: '+180 XP',
    timeEstimate: '4 Cycles',
    borderColor: '#F59E0B',
    playBtnColor: '#F59E0B',
  },
  {
    id: 'dividend-snowball',
    title: 'Dividend Snowball',
    category: 'Compounding DRIP',
    tag: 'DRIP ❄️',
    tagColor: '#0E7490',
    tagBg: '#CFFAFE',
    description: 'Collect dividend yields to accelerate your compound growth.',
    sceneType: 'snowball',
    route: '/dividend-snowball',
    xpReward: '+160 XP',
    timeEstimate: 'Tapping Game',
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
              <GameSceneIllustration type={game.sceneType} width={CARD_WIDTH - 20} height={96} />

              {/* Overlay Badges */}
              <View style={styles.tagOverlay}>
                <View style={[styles.tagPill, { backgroundColor: game.tagBg }]}>
                  <Text color={game.tagColor} fontSize={9} fontFamily={Fonts.bold}>
                    {game.tag}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. CARD INFO DETAILS */}
            <YStack gap={2} marginTop={8}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="#FFFFFF" fontSize={15} fontFamily={Fonts.bold}>
                  {game.title}
                </Text>
                <Text color="#94A3B8" fontSize={10} fontFamily={Fonts.bold} textTransform="uppercase">
                  {game.category}
                </Text>
              </XStack>

              <Text color="#94A3B8" fontSize={11} fontFamily={Fonts.medium} lineHeight={15} numberOfLines={2}>
                {game.description}
              </Text>
            </YStack>

            {/* 3. CARD FOOTER */}
            <XStack justifyContent="space-between" alignItems="center" paddingTop={8} borderTopWidth={1} borderTopColor="#1E293B" marginTop={8}>
              <Text color="#64748B" fontSize={11} fontFamily={Fonts.medium}>
                {game.timeEstimate}
              </Text>

              <View style={[styles.playBtn, { backgroundColor: game.playBtnColor }]}>
                <Text color="#FFFFFF" fontSize={11.5} fontFamily={Fonts.bold}>
                  Play ➔
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
    paddingVertical: 4,
    gap: 12,
  },
  gameCardItem: {
    width: CARD_WIDTH,
    backgroundColor: '#131D31',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tagOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  playBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
});
