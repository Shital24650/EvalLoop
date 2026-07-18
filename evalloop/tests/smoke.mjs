import assert from 'node:assert/strict';
import app from '../backend/server.js';

assert.equal(typeof app, 'function');
console.log('EvalLoop smoke test passed');
