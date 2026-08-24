import assert from 'node:assert/strict';
import test from 'node:test';
import { scanForForbiddenTokens } from '../../devtools/privacyScan';

test('no forbidden raw-data token or import appears under app/ or src/ui/', () => {
  const hits = scanForForbiddenTokens(['app', 'src/ui']);
  assert.deepEqual(hits, [], `forbidden tokens found: ${JSON.stringify(hits)}`);
});
