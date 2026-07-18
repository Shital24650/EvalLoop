export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'EvalLoop API',
    version: '1.0.0',
    description: 'AI agent prompt evaluation, security scanning, regression, and reporting API.',
  },
  servers: [{ url: '/api' }],
  paths: {
    '/generate-tests': { post: { summary: 'Generate 20 adversarial tests' } },
    '/run-tests-batch': { post: { summary: 'Evaluate a prompt against a batch of adversarial tests' } },
    '/rewrite-prompt': { post: { summary: 'Rewrite prompt sections based on failures' } },
    '/security-scan': { post: { summary: 'Run prompt-injection and security evaluation' } },
    '/test-chain': { post: { summary: 'Evaluate a three-agent prompt chain' } },
    '/compare-versions': { post: { summary: 'Compare two prompt versions' } },
  },
};
