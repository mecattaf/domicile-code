import assert from 'node:assert/strict';
import { mapViewerPoint as point } from '../tools/viewer/coordinates.js';

const box = { x: 0, y: 0, width: 200, height: 200 };
const viewport = { width: 100, height: 50 };
assert.deepEqual(point(100, 50, box, viewport, 100, 100), { x: 50, y: 25 }, 'vertical letterbox center');
assert.equal(point(100, 50, box, viewport, 100, 25), null, 'top letterbox is not desktop input');
assert.equal(point(100, 50, box, viewport, 100, 150), null, 'bottom boundary excluded');
assert.deepEqual(point(50, 100, box, { width: 50, height: 100 }, 100, 100), { x: 25, y: 50 }, 'horizontal letterbox center');
assert.equal(point(50, 100, box, viewport, 25, 100), null, 'left letterbox is not desktop input');
assert.deepEqual(point(100, 50, { ...box, x: -50, y: -50 }, viewport, 50, 50), { x: 50, y: 25 }, 'negative window position is valid');
assert.equal(point(100, 50, box, viewport, NaN, 50), null, 'nonfinite pointer refused');
assert.equal(point(0, 50, box, viewport, 0, 0), null, 'empty image refused');
assert.equal(point(100, 50, box, { width: 0, height: 50 }, 50, 50), null, 'empty target refused');
assert.equal(point(100, 50, { ...box, width: 0 }, viewport, 50, 50), null, 'empty container refused');
assert.deepEqual(point(100, 50, box, viewport, 25, 75), { x: 12.5, y: 12.5 }, 'fractional coordinates preserved');
console.log('11 independent geometry checks passed');
