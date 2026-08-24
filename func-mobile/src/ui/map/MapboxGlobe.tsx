import Mapbox from '@rnmapbox/maps';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LatLng } from '@/domain/types';
import { useReducedMotion } from '../useReducedMotion';
import { DEFAULT_CENTER, GLOBE_ZOOM, LOCAL_ZOOM, MAPBOX_TOKEN, MAP_STYLE_CONFIG, MAP_STYLE_URL } from './mapConfig';
import type { MapPin } from './content';
import { accessibilityLabelForGroup, groupPins } from './grouping';
import {
  BusinessClusterView,
  BusinessPinView,
  InviteClusterView,
  InvitePinView,
  PersonClusterView,
  PersonPinView,
  VenueClusterView,
  VenuePinView,
} from './Pins';

if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
  Mapbox.setTelemetryEnabled(false);
}

export interface MapHandle {
  flyTo(target: LatLng, zoom?: number): void;
}

type Props = {
  pins: MapPin[];
  selectedId: string | null;
  onSelect: (pin: MapPin | null) => void;
  /** Fly in from the globe on first load — the "one continuous surface" moment. */
  introFromGlobe?: boolean;
  onCenterChange?: (c: LatLng) => void;
  initialCenter?: LatLng;
  initialZoom?: number;
  interactiveCenter?: boolean;
};

/**
 * The real map: a Mapbox globe that interpolates to mercator as the user zooms
 * in. One continuous zoomable surface — no mode toggle, no second screen.
 */
export const MapboxGlobe = forwardRef<MapHandle, Props>(function MapboxGlobe(
  { pins, selectedId, onSelect, introFromGlobe, onCenterChange, initialCenter, initialZoom },
  ref,
) {
  const camera = useRef<Mapbox.Camera>(null);
  const reduceMotion = useReducedMotion();
  const center = initialCenter ?? DEFAULT_CENTER;
  const startZoom = introFromGlobe ? GLOBE_ZOOM : (initialZoom ?? LOCAL_ZOOM);

  // Tracks the live camera zoom so pin density can be re-grouped as the user
  // pinches/zooms. Rounded to the nearest half-zoom so a continuous gesture
  // doesn't force a re-cluster on every intermediate camera frame.
  const [zoom, setZoom] = useState(startZoom);
  const roundedZoom = Math.round(zoom * 2) / 2;
  const groups = useMemo(() => groupPins(pins, roundedZoom), [pins, roundedZoom]);

  useImperativeHandle(ref, () => ({
    flyTo(target, zoom = 14) {
      camera.current?.setCamera({
        centerCoordinate: [target.lng, target.lat],
        zoomLevel: zoom,
        animationMode: 'flyTo',
        animationDuration: reduceMotion ? 0 : 1200,
      });
    },
  }));

  useEffect(() => {
    if (!introFromGlobe) return;
    const t = setTimeout(() => {
      camera.current?.setCamera({
        centerCoordinate: [center.lng, center.lat],
        zoomLevel: initialZoom ?? LOCAL_ZOOM,
        animationMode: 'flyTo',
        animationDuration: reduceMotion ? 0 : 2800,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [introFromGlobe, center.lat, center.lng, initialZoom, reduceMotion]);

  return (
    <Mapbox.MapView
      style={StyleSheet.absoluteFill}
      styleURL={MAP_STYLE_URL}
      projection="globe"
      logoEnabled={false}
      scaleBarEnabled={false}
      attributionPosition={{ bottom: 8, right: 8 }}
      onPress={() => onSelect(null)}
      onCameraChanged={(st) => {
        if (st.properties.zoom != null) setZoom(st.properties.zoom);
        if (onCenterChange) {
          const [lng, lat] = st.properties.center;
          if (lng != null && lat != null) onCenterChange({ lat, lng });
        }
      }}
    >
      <Mapbox.Camera
        ref={camera}
        defaultSettings={{ centerCoordinate: [center.lng, center.lat], zoomLevel: startZoom, pitch: 0 }}
      />
      <Mapbox.StyleImport id="basemap" existing config={MAP_STYLE_CONFIG} />
      <Mapbox.Atmosphere
        style={{
          color: 'rgb(198, 216, 237)',
          highColor: 'rgb(245, 249, 255)',
          horizonBlend: 0.08,
          spaceColor: 'rgb(127, 160, 198)',
          starIntensity: 0,
        }}
      />
      {groups.map((group) => {
        const pin = group.pins.length === 1 ? group.pins[0] : null;
        const label = accessibilityLabelForGroup(group);
        return (
          <Mapbox.MarkerView
            key={group.id}
            id={group.id}
            coordinate={[group.location.lng, group.location.lat]}
            anchor={{ x: 0.5, y: 0.5 }}
            allowOverlap
          >
            {pin ? (
              <Pressable
                onPress={() => onSelect(pin)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint="Shows a preview"
              >
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
              <View accessible accessibilityLabel={label}>
                <VenueClusterView count={group.pins.length} glow={group.pins.some((p) => p.glow)} />
              </View>
            ) : group.kind === 'invite' ? (
              <View accessible accessibilityLabel={label}>
                <InviteClusterView count={group.pins.length} />
              </View>
            ) : group.kind === 'business' ? (
              <View accessible accessibilityLabel={label}>
                <BusinessClusterView />
              </View>
            ) : (
              <View accessible accessibilityLabel={label}>
                <PersonClusterView
                  people={group.pins.map((p) => p.person)}
                  hasHeartbeat={group.pins.some((p) => p.disclosure.status === 'dtf')}
                />
              </View>
            )}
          </Mapbox.MarkerView>
        );
      })}
    </Mapbox.MapView>
  );
});
