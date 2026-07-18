import assert from 'node:assert/strict';
import { openApiDocument } from '../backend/openapi.js';

for (const path of ['/generate-tests', '/run-tests-batch', '/rewrite-prompt', '/security-scan', '/test-chain', '/compare-versions']) {
  assert.ok(openApiDocument.paths[path], `${path} should be documented`);
}

console.log('EvalLoop API contract test passed');
