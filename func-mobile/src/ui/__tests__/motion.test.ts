import assert from 'node:assert/strict';
import test from 'node:test';
import * as entrance from '../map/entrance';

test('map entrance resolves to a still state when reduced motion is enabled', () => {
  const animation = (entrance as typeof entrance & {
    entranceAnimation?: (reduceMotion: boolean) => { initialScale: number; initialOpacity: number; duration: number };
  }).entranceAnimation;

  assert.equal(typeof animation, 'function');
  assert.deepEqual(animation?.(true), { initialScale: 1, initialOpacity: 1, duration: 0 });
  assert.deepEqual(animation?.(false), { initialScale: 0.92, initialOpacity: 0, duration: 420 });
});
