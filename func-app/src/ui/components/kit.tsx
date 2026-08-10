/**
 * The small shared pieces every screen is built from.
 *
 * Restrained on purpose — Layer 5 is out of scope for this phase, so these are
 * correct and plain rather than finished. They obey the one identity rule that
 * is already settled: emerald means life, everything else is chrome or glass.
 */

import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colour, radius, space, type as typeScale } from '../theme';

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

type TextTone = 'default' | 'dim' | 'dimmer' | 'life' | 'danger' | 'amber' | 'premium';

const toneColour: Record<TextTone, string> = {
  default: colour.fg,
  dim: colour.fg2,
  dimmer: colour.fg3,
  life: colour.em,
  danger: colour.danger,
  amber: colour.amber,
  premium: colour.disco,
};

export function Display({ children, tone = 'default', style }: { children: ReactNode; tone?: TextTone; style?: StyleProp<TextStyle> }) {
  return <Text style={[typeScale.display as TextStyle, { color: toneColour[tone] }, style]}>{children}</Text>;
}

export function H1({ children, tone = 'default', style }: { children: ReactNode; tone?: TextTone; style?: StyleProp<TextStyle> }) {
  return <Text style={[typeScale.h1 as TextStyle, { color: toneColour[tone] }, style]}>{children}</Text>;
}

export function H2({ children, tone = 'default', style }: { children: ReactNode; tone?: TextTone; style?: StyleProp<TextStyle> }) {
  return <Text style={[typeScale.h2 as TextStyle, { color: toneColour[tone] }, style]}>{children}</Text>;
}

export function Body({ children, tone = 'dim', style }: { children: ReactNode; tone?: TextTone; style?: StyleProp<TextStyle> }) {
  return <Text style={[typeScale.body as TextStyle, { color: toneColour[tone] }, style]}>{children}</Text>;
}

export function Small({ children, tone = 'dimmer', style }: { children: ReactNode; tone?: TextTone; style?: StyleProp<TextStyle> }) {
  return <Text style={[typeScale.small as TextStyle, { color: toneColour[tone] }, style]}>{children}</Text>;
}

export function Label({ children, tone = 'dimmer', style }: { children: ReactNode; tone?: TextTone; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[typeScale.label as TextStyle, { color: toneColour[tone] }, style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Spacer({ h = space.md }: { h?: number }) {
  return <View style={{ height: h }} />;
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'ghost' | 'danger';
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled, style, testID }: ButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled === true }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.buttonPrimary,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'danger' && styles.buttonDanger,
        disabled === true && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          isPrimary && { color: colour.ink },
          variant === 'danger' && { color: colour.danger },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  tone,
  testID,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: string;
  testID?: string;
}) {
  const accent = tone ?? colour.em;
  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[
        styles.chip,
        active === true && { backgroundColor: `${accent}22`, borderColor: accent },
      ]}
    >
      <Text style={[styles.chipLabel, active === true && { color: accent, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({
  on,
  onChange,
  testID,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={() => onChange(!on)}
      style={[styles.toggle, on && { backgroundColor: colour.emDim, borderColor: colour.em }]}
    >
      <View style={[styles.toggleKnob, on && { backgroundColor: colour.em, alignSelf: 'flex-end' }]} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Sheet
// ---------------------------------------------------------------------------

export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.sheet}>
        <View style={styles.sheetGrabber} />
        <ScrollView contentContainerStyle={styles.sheetBody}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export function Notice({ text, tone = 'dim' }: { text: string; tone?: TextTone }) {
  return (
    <View style={styles.notice}>
      <Small tone={tone}>{text}</Small>
    </View>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.empty}>
      <H2 tone="dim">{title}</H2>
      {body ? (
        <>
          <Spacer h={space.sm} />
          <Small style={{ textAlign: 'center' }}>{body}</Small>
        </>
      ) : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colour.em} />
    </View>
  );
}

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colour.ink },
  card: {
    backgroundColor: colour.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colour.hairline,
    padding: space.md,
  },
  divider: { height: 1, backgroundColor: colour.hairline, marginVertical: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  button: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  buttonPrimary: { backgroundColor: colour.em },
  buttonGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colour.hairline },
  buttonDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colour.danger },
  buttonDisabled: { opacity: 0.35 },
  buttonPressed: { opacity: 0.8 },
  buttonLabel: { fontSize: 15, fontWeight: '700', color: colour.fg },
  chip: {
    height: 34,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colour.hairline,
    backgroundColor: colour.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: { fontSize: 13, color: colour.fg2 },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colour.hairline,
    backgroundColor: colour.surface2,
    padding: 3,
    justifyContent: 'center',
  },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colour.fg4 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(2,6,4,0.72)' },
  sheet: {
    backgroundColor: colour.ink2,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: colour.hairline,
    maxHeight: '86%',
  },
  sheetGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colour.fg4,
    alignSelf: 'center',
    marginTop: space.sm,
  },
  sheetBody: { padding: space.lg, paddingBottom: space.xxl },
  notice: {
    backgroundColor: colour.surface2,
    borderRadius: radius.sm,
    padding: space.md,
    borderWidth: 1,
    borderColor: colour.hairline,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
});
