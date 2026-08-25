import assert from 'node:assert/strict';
import test from 'node:test';
import { MAP_STYLE_CONFIG, MAP_STYLE_URL } from '../map/mapConfig';

test('M2 uses the maintained bright Mapbox Standard style', () => {
  assert.equal(MAP_STYLE_URL, 'mapbox://styles/mapbox/standard');
  assert.deepEqual(MAP_STYLE_CONFIG, {
    lightPreset: 'day',
    theme: 'faded',
    show3dObjects: true,
    show3dBuildings: true,
  });
});
