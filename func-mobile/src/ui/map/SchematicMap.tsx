import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { LatLng } from '@/domain/types';
import { colors } from '../theme';
import type { MapHandle } from './MapboxGlobe';
import type { MapPin } from './content';
import { InvitePinView, LivePinView, PIN_SIZE, VenuePinView } from './Pins';

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
        <View pointerEvents="none" style={{ position: 'absolute', left: project(placed).x - 12, top: project(placed).y - 24 }}>
          <Text style={{ fontSize: 24 }}>📍</Text>
        </View>
      ) : null}
      {size.w > 0 &&
        pins.map((pin) => {
          const { x, y } = project(pin.location);
          return (
            <Pressable
              key={pin.id}
              onPress={() => onSelect(pin)}
              style={{ position: 'absolute', left: x - PIN_SIZE / 2, top: y - PIN_SIZE / 2 }}
            >
              {pin.kind === 'venue' ? (
                <VenuePinView venue={pin.venue} selected={selectedId === pin.id} />
              ) : pin.kind === 'invite' ? (
                <InvitePinView invite={pin.invite} selected={selectedId === pin.id} />
              ) : (
                <LivePinView live={pin.live} selected={selectedId === pin.id} />
              )}
            </Pressable>
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
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#111115' },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridLine: { position: 'absolute', backgroundColor: '#1f1f26' },
  banner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(31,31,37,0.92)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerTitle: { color: colors.casual, fontSize: 12, fontWeight: '700' },
  bannerBody: { color: colors.muted, fontSize: 11, marginTop: 2 },
});
