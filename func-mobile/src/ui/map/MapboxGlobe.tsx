import Mapbox from '@rnmapbox/maps';
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { LatLng } from '@/domain/types';
import { DEFAULT_CENTER, GLOBE_ZOOM, LOCAL_ZOOM, MAPBOX_TOKEN } from './mapConfig';
import type { MapPin } from './content';
import { InvitePinView, LivePinView, VenuePinView } from './Pins';

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
  const center = initialCenter ?? DEFAULT_CENTER;
  const startZoom = introFromGlobe ? GLOBE_ZOOM : (initialZoom ?? LOCAL_ZOOM);

  useImperativeHandle(ref, () => ({
    flyTo(target, zoom = 14) {
      camera.current?.setCamera({
        centerCoordinate: [target.lng, target.lat],
        zoomLevel: zoom,
        animationMode: 'flyTo',
        animationDuration: 1200,
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
        animationDuration: 2800,
      });
    }, 600);
    return () => clearTimeout(t);
  }, [introFromGlobe, center.lat, center.lng, initialZoom]);

  return (
    <Mapbox.MapView
      style={StyleSheet.absoluteFill}
      styleURL={Mapbox.StyleURL.Dark}
      projection="globe"
      logoEnabled={false}
      scaleBarEnabled={false}
      attributionPosition={{ bottom: 8, right: 8 }}
      onPress={() => onSelect(null)}
      onCameraChanged={onCenterChange ? (st) => {
        const [lng, lat] = st.properties.center;
        if (lng != null && lat != null) onCenterChange({ lat, lng });
      } : undefined}
    >
      <Mapbox.Camera
        ref={camera}
        defaultSettings={{ centerCoordinate: [center.lng, center.lat], zoomLevel: startZoom, pitch: 0 }}
      />
      <Mapbox.Atmosphere
        style={{
          color: 'rgb(22, 22, 26)',
          highColor: 'rgb(40, 40, 64)',
          horizonBlend: 0.02,
          spaceColor: 'rgb(8, 8, 12)',
          starIntensity: 0.6,
        }}
      />
      {pins.map((pin) => (
        <Mapbox.MarkerView
          key={pin.id}
          id={pin.id}
          coordinate={[pin.location.lng, pin.location.lat]}
          anchor={{ x: 0.5, y: 0.5 }}
          allowOverlap
        >
          <Pressable onPress={() => onSelect(pin)} hitSlop={6}>
            {pin.kind === 'venue' ? (
              <VenuePinView venue={pin.venue} selected={selectedId === pin.id} />
            ) : pin.kind === 'invite' ? (
              <InvitePinView invite={pin.invite} selected={selectedId === pin.id} />
            ) : (
              <LivePinView live={pin.live} selected={selectedId === pin.id} />
            )}
          </Pressable>
        </Mapbox.MarkerView>
      ))}
    </Mapbox.MapView>
  );
});
