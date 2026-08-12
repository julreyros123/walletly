import React, { useEffect } from 'react';
import { Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const MASCOT_IMAGES = {
  smiling: require('../../../assets/images/wally_smiling.png'),
  happy: require('../../../assets/images/wally_happy.png'),
  sad: require('../../../assets/images/wally_sad.png'),
  mad: require('../../../assets/images/wally_mad.png'),
};

interface WallyHelperProps {
  expression: 'smiling' | 'happy' | 'sad' | 'mad';
  size?: number;
}

export const WallyHelper: React.FC<WallyHelperProps> = ({ expression, size = 60 }) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Float animation: move up and down continuously
    translateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1500 }),
        withTiming(4, { duration: 1500 })
      ),
      -1, // Infinite repeat
      true // Reverse direction each loop
    );
    
    // Breathe animation: scale slightly to feel organic
    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1800 }),
        withTiming(0.98, { duration: 1800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Image
        source={MASCOT_IMAGES[expression]}
        style={{ width: size, height: size, resizeMode: 'contain' }}
      />
    </Animated.View>
  );
};
