import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { LivePin } from '@/domain/liveStatus';
import type { PoolInvite, Venue } from '@/domain/types';
import { DiscoBall, type DiscoTint } from '../components/DiscoBall';
import { categoryColor, colors, statusColor } from '../theme';

/** Fixed box so MarkerView and the schematic renderer agree on hit areas. */
export const PIN_SIZE = 36;

export function VenuePinView({ venue, selected }: { venue: Venue; selected?: boolean }) {
  const c = categoryColor(venue.category);
  return (
    <View style={styles.box}>
      <View style={[styles.venueDot, { backgroundColor: c }, selected && styles.selectedRing]} />
    </View>
  );
}

export function InvitePinView({ invite, selected }: { invite: PoolInvite; selected?: boolean }) {
  const business = invite.createdByAccountType === 'business';
  return (
    <View style={styles.box}>
      <View style={[styles.inviteBadge, selected && styles.selectedRing, business && styles.inviteBusiness]}>
        <Text style={styles.inviteGlyph}>{invite.access.mode === 'private' ? '🔒' : '🪩'}</Text>
      </View>
    </View>
  );
}

function Pulse({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.6, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulse, { backgroundColor: color, transform: [{ scale }], opacity }]}
    />
  );
}

export function LivePinView({ live, selected }: { live: LivePin; selected?: boolean }) {
  if (live.kind === 'business') {
    // Business accounts: plain silver disco ball, always.
    return (
      <View style={styles.box}>
        <View style={selected ? styles.selectedHalo : null}>
          <DiscoBall size={24} tint="silver" />
        </View>
      </View>
    );
  }
  const { status, premium, elapsedHours } = live;
  const c = statusColor(status);

  if (status === 'off') {
    // Frozen, greyed — shows how stale the last fix is.
    return (
      <View style={styles.box}>
        {premium ? (
          <DiscoBall size={18} tint="grey" />
        ) : (
          <View style={[styles.liveDot, { backgroundColor: colors.off, opacity: 0.7 }]} />
        )}
        <Text style={styles.elapsed}>{elapsedHours}h</Text>
      </View>
    );
  }

  if (premium) {
    const tint: DiscoTint = status === 'dtf' ? 'green' : 'amber';
    return (
      <View style={styles.box}>
        {status === 'dtf' ? <Pulse color={colors.dtf} /> : null}
        <DiscoBall size={24} tint={tint} ring={status === 'dtf' ? colors.chrome : undefined} />
      </View>
    );
  }

  return (
    <View style={styles.box}>
      {status === 'dtf' ? <Pulse color={colors.dtf} /> : null}
      <View style={[styles.liveDot, { backgroundColor: c, shadowColor: c }, selected && styles.selectedRing]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: PIN_SIZE, height: PIN_SIZE, alignItems: 'center', justifyContent: 'center' },
  venueDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#16161a',
  },
  inviteBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f2f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#16161a',
  },
  inviteBusiness: { backgroundColor: colors.club },
  inviteGlyph: { fontSize: 13 },
  liveDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  pulse: { position: 'absolute', width: 22, height: 22, borderRadius: 11 },
  elapsed: { position: 'absolute', bottom: -2, fontSize: 9, color: colors.muted, fontWeight: '600' },
  selectedRing: { borderColor: '#ffffff', borderWidth: 2 },
  selectedHalo: { borderRadius: 16, borderWidth: 2, borderColor: '#fff', padding: 1 },
});
