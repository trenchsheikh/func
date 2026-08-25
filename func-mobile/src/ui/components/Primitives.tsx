import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, font, radius, space } from '../theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[font.title, style]}>{children}</Text>;
}

export function H2({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[font.h2, style]}>{children}</Text>;
}

export function Body({ children, style, numberOfLines }: { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return <Text style={[font.body, style]} numberOfLines={numberOfLines}>{children}</Text>;
}

export function Small({ children, style, numberOfLines }: { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return <Text style={[font.small, style]} numberOfLines={numberOfLines}>{children}</Text>;
}

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[font.tiny, style]}>{children}</Text>;
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

type SurfaceProps = { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string };

function Surface({ children, style, onPress, accessibilityLabel, surfaceStyle }: SurfaceProps & { surfaceStyle: ViewStyle }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [surfaceStyle, pressed && styles.pressed, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[surfaceStyle, style]}>{children}</View>;
}

/** Dark translucent material for information-first surfaces. */
export function GlassCard(props: SurfaceProps) {
  return <Surface {...props} surfaceStyle={styles.glassCard} />;
}

/** Neutral chrome-edged material; it carries no entitlement or account meaning. */
export function ChromeSurface(props: SurfaceProps) {
  return <Surface {...props} surfaceStyle={styles.chromeSurface} />;
}

export function Row({ children, style, gap = space.sm }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[styles.row, { gap }, style]}>{children}</View>;
}

export function Pill({ label, color, filled, style }: { label: string; color?: string; filled?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = color ?? colors.muted;
  return (
    <View
      style={[
        styles.pill,
        { borderColor: c },
        filled ? { backgroundColor: c } : null,
        style,
      ]}
    >
      <Text style={[styles.pillText, { color: filled ? colors.bg : c }]}>{label}</Text>
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  small,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === 'primary' ? colors.accent
    : variant === 'danger' ? colors.danger
    : variant === 'success' ? colors.dtf
    : variant === 'secondary' ? colors.surfaceRaised
    : 'transparent';
  const fg = variant === 'primary' ? colors.bg : variant === 'ghost' ? colors.muted : colors.text;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      hitSlop={small ? { top: 6, bottom: 6, left: 4, right: 4 } : undefined}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.buttonText, small && { fontSize: 13 }, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** Two-to-four option segmented control. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  colorFor,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  colorFor?: (v: T) => string;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        const c = colorFor?.(o.value) ?? colors.accent;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: c }]}
          >
            <Text style={[styles.segmentText, active && { color: colors.bg, fontWeight: '600' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[font.body, { color: colors.muted }]}>{title}</Text>
      {hint ? <Text style={[font.small, { textAlign: 'center', marginTop: 4 }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  glassCard: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space.lg,
  },
  chromeSurface: {
    backgroundColor: colors.glassRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.chromeMid,
    padding: space.lg,
  },
  pressed: { opacity: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pillText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm },
  buttonText: { fontSize: 15, fontWeight: '600' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segment: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
  segmentText: { color: colors.muted, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.md },
  empty: { padding: space.xl, alignItems: 'center' },
});
