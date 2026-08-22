import React, { forwardRef } from 'react';
import type { LatLng } from '@/domain/types';
import { hasMapboxToken } from './mapConfig';
import { MapboxGlobe, type MapHandle } from './MapboxGlobe';
import { SchematicMap } from './SchematicMap';
import type { MapPin } from './content';

export type { MapHandle, MapPin };

type Props = {
  pins: MapPin[];
  selectedId: string | null;
  onSelect: (pin: MapPin | null) => void;
  introFromGlobe?: boolean;
  onCenterChange?: (c: LatLng) => void;
  /** Schematic only: tap-to-place (used by the Create location picker). */
  onPlace?: (c: LatLng) => void;
  placed?: LatLng | null;
  initialCenter?: LatLng;
  initialZoom?: number;
  compact?: boolean;
};

/** Picks the real globe when a token is present, the schematic otherwise. */
export const FuncMap = forwardRef<MapHandle, Props>(function FuncMap(props, ref) {
  if (hasMapboxToken) {
    return (
      <MapboxGlobe
        ref={ref}
        pins={props.pins}
        selectedId={props.selectedId}
        onSelect={props.onSelect}
        introFromGlobe={props.introFromGlobe}
        onCenterChange={props.onCenterChange}
        initialCenter={props.initialCenter}
        initialZoom={props.initialZoom}
      />
    );
  }
  return (
    <SchematicMap
      ref={ref}
      pins={props.pins}
      selectedId={props.selectedId}
      onSelect={props.onSelect}
      onCenterChange={props.onCenterChange}
      onPlace={props.onPlace}
      placed={props.placed}
      initialCenter={props.initialCenter}
      compact={props.compact}
    />
  );
});
