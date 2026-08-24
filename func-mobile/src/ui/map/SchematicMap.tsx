import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { LatLng } from '@/domain/types';
import { colors } from '../theme';
import { LocateIcon } from '../components/Icons';
import type { MapHandle } from './MapboxGlobe';
import type { MapPin } from './content';
import { accessibilityLabelForGroup, groupPins } from './grouping';
import { LOCAL_ZOOM } from './mapConfig';
import {
  BusinessClusterView,
  BusinessPinView,
  InviteClusterView,
  InvitePinView,
  PersonClusterView,
  PersonPinView,
  PIN_SIZE,
  VenueClusterView,
  VenuePinView,
} from './Pins';

type Props = {
  pins: MapPin[];
  selectedId: string | null;
  onSelect: (pin: MapPin | null) => void;
  onCenterChange?: (c: LatLng) => void;
  onPlace?: (c: LatLng) => void;
  placed?: LatLng | null;
  /** Frame around this point when there are no pins (the Create picker). */
  initialCenter?: LatLng;
  compact?: boolean;
};

/**
 * Token-less fallback. NOT the map — a flat equirectangular sketch of the
 * current content so pin taps, cards and flows can be exercised before a
 * Mapbox token is configured. Replaced wholesale by MapboxGlobe once
 * EXPO_PUBLIC_MAPBOX_TOKEN is set.
 */
export const SchematicMap = forwardRef<MapHandle, Props>(function SchematicMap(
  { pins, selectedId, onSelect, onPlace, placed, initialCenter, compact },
  ref,
) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useImperativeHandle(ref, () => ({ flyTo() {/* no camera in the sketch */} }));

  const bounds = useMemo(() => {
    if (!pins.length) {
      const c = initialCenter ?? { lat: 0, lng: 0 };
      return { minLat: c.lat - 0.03, maxLat: c.lat + 0.03, minLng: c.lng - 0.04, maxLng: c.lng + 0.04 };
    }
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const p of pins) {
      minLat = Math.min(minLat, p.location.lat);
      maxLat = Math.max(maxLat, p.location.lat);
      minLng = Math.min(minLng, p.location.lng);
      maxLng = Math.max(maxLng, p.location.lng);
    }
    const padLat = (maxLat - minLat) * 0.12 || 0.01;
    const padLng = (maxLng - minLng) * 0.12 || 0.01;
    return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLng: minLng - padLng, maxLng: maxLng + padLng };
  }, [pins, initialCenter]);

  // No pinch-zoom exists in this flat fallback, so grouping uses a fixed
  // "city" density rather than a live camera zoom.
  const groups = useMemo(() => groupPins(pins, LOCAL_ZOOM), [pins]);

  const project = (ll: LatLng) => ({
    x: ((ll.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * size.w,
    y: (1 - (ll.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * size.h,
  });
  const unproject = (x: number, y: number): LatLng => ({
    lng: bounds.minLng + (x / size.w) * (bounds.maxLng - bounds.minLng),
    lat: bounds.minLat + (1 - y / size.h) * (bounds.maxLat - bounds.minLat),
  });

  return (
    <Pressable
      style={styles.fill}
      onLayout={(e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      onPress={(e) => {
        onSelect(null);
        if (onPlace && size.w) onPlace(unproject(e.nativeEvent.locationX, e.nativeEvent.locationY));
      }}
    >
      <View pointerEvents="none" style={styles.grid}>
        {[0.25, 0.5, 0.75].map((f) => (
          <View key={`h${f}`} style={[styles.gridLine, { top: size.h * f, left: 0, right: 0, height: 1 }]} />
        ))}
        {[0.25, 0.5, 0.75].map((f) => (
          <View key={`v${f}`} style={[styles.gridLine, { left: size.w * f, top: 0, bottom: 0, width: 1 }]} />
        ))}
      </View>
      {size.w > 0 && placed ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', left: project(placed).x - 12, top: project(placed).y - 24 }}
        >
          <LocateIcon size={24} color={colors.highlightSoft} />
        </View>
      ) : null}
      {size.w > 0 &&
        groups.map((group) => {
          const { x, y } = project(group.location);
          const pin = group.pins.length === 1 ? group.pins[0] : null;
          const interactive = pin != null;
          return (
            <View
              key={group.id}
              pointerEvents={interactive ? 'auto' : 'none'}
              accessible
              accessibilityRole={interactive ? 'button' : undefined}
              accessibilityLabel={accessibilityLabelForGroup(group)}
              accessibilityHint={interactive ? 'Shows a preview' : undefined}
              style={{ position: 'absolute', left: x - PIN_SIZE / 2, top: y - PIN_SIZE / 2 }}
            >
              {pin ? (
                <Pressable onPress={() => onSelect(pin)} hitSlop={6}>
                  {pin.kind === 'venue' ? (
                    <VenuePinView venue={pin.venue} glow={pin.glow} selected={selectedId === pin.id} />
                  ) : pin.kind === 'invite' ? (
                    <InvitePinView invite={pin.invite} selected={selectedId === pin.id} />
                  ) : pin.kind === 'person' ? (
                    <PersonPinView person={pin.person} disclosure={pin.disclosure} selected={selectedId === pin.id} />
                  ) : (
                    <BusinessPinView selected={selectedId === pin.id} />
                  )}
                </Pressable>
              ) : group.kind === 'venue' ? (
                <VenueClusterView count={group.pins.length} glow={group.pins.some((p) => p.glow)} />
              ) : group.kind === 'invite' ? (
                <InviteClusterView count={group.pins.length} />
              ) : group.kind === 'business' ? (
                <BusinessClusterView />
              ) : (
                <PersonClusterView
                  people={group.pins.map((p) => p.person)}
                  hasHeartbeat={group.pins.some((p) => p.disclosure.status === 'dtf')}
                />
              )}
            </View>
          );
        })}
      <View pointerEvents="none" style={styles.banner}>
        <Text style={styles.bannerTitle}>{compact ? 'Schematic — tap to place' : 'Schematic fallback — no Mapbox token'}</Text>
        {!compact ? (
          <Text style={styles.bannerBody}>
            Set EXPO_PUBLIC_MAPBOX_TOKEN in .env and rebuild to get the 3D globe.
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.mapLand },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridLine: { position: 'absolute', backgroundColor: colors.mapGrid },
  banner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: colors.mapOverlay,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  bannerTitle: { color: colors.mapText, fontSize: 12, fontWeight: '700' },
  bannerBody: { color: colors.mapTextMuted, fontSize: 11, marginTop: 2 },
});
