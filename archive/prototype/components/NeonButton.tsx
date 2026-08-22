import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, gradients, radius } from '../lib/theme';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export function NeonButton({ label, onPress, variant = 'primary', disabled = false, style }: Props) {
  if (variant === 'primary' && !disabled) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [style, pressed && styles.pressed]}>
        <LinearGradient
          colors={[...gradients.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.base}
        >
          <Text style={styles.primaryText}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'outline' || disabled ? styles.outline : styles.ghost,
        style,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.altText, disabled && { color: colors.textDim }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  ghost: { backgroundColor: colors.surfaceHi },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  altText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  pressed: { opacity: 0.8 },
});
