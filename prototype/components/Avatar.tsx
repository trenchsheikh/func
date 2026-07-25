import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { photos } from '../assets/people';
import { colors, gradientFor } from '../lib/theme';

interface Props {
  userId: string;
  name: string;
  size?: number;
  verified?: boolean;
}

// Neon gradient monogram (Decision 005); switches to a photo if one exists in assets/people.
export function Avatar({ userId, name, size = 44, verified = false }: Props) {
  const photo = photos[userId];
  const [c1, c2] = gradientFor(userId);
  const badge = Math.max(14, size * 0.32);

  return (
    <View style={{ width: size, height: size }}>
      {photo ? (
        <Image source={photo} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <LinearGradient
          colors={[c1, c2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{name.charAt(0)}</Text>
        </LinearGradient>
      )}
      {verified && (
        <View style={[styles.badge, { width: badge, height: badge, borderRadius: badge / 2 }]}>
          <Ionicons name="checkmark" size={badge * 0.65} color="#0A0A0F" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#FFFFFF', fontWeight: '800' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
});
