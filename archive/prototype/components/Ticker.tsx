import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../lib/theme';

// "Happening now" marquee. One long line scrolling forever — cheap liveliness.
export function Ticker({ items }: { items: string[] }) {
  const { width: screenW } = useWindowDimensions();
  const x = useRef(new Animated.Value(screenW)).current;
  const [textW, setTextW] = useState(0);

  useEffect(() => {
    if (!textW) return;
    x.setValue(screenW);
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: -textW,
        duration: (screenW + textW) * 14,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [textW, screenW, x]);

  return (
    <View style={styles.strip} pointerEvents="none">
      {/* Outer view is far wider than any line so the Text lays out at its natural
          width; onLayout then reports the true scroll distance. */}
      <Animated.View style={{ width: 6000, flexDirection: 'row', transform: [{ translateX: x }] }}>
        <Text
          style={styles.text}
          numberOfLines={1}
          onLayout={(e) => setTextW(e.nativeEvent.layout.width)}
        >
          {items.join('      ·      ')}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 34,
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,15,0.88)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    overflow: 'hidden',
  },
  text: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
});
