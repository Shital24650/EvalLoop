#!/usr/bin/env node
const command = process.argv[2];
const api = process.env.EVALLOOP_API_URL || 'http://localhost:4000/api';
const input = process.argv.slice(3).join(' ');

async function post(path, body) {
  const response = await fetch(`${api}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

async function main() {
  if (!command || ['evaluate', 'compare', 'report', 'rewrite', 'history', 'security', 'ci'].includes(command) === false) {
    console.log('Usage: evalloop <evaluate|compare|report|rewrite|history|security|ci> [prompt]');
    process.exit(command ? 1 : 0);
  }

  if (command === 'evaluate' || command === 'ci') {
    const prompt = input || 'You are a careful AI agent.';
    const tests = (await post('/generate-tests', { agentPrompt: prompt, agentType: 'CLI Agent' })).tests;
    const results = (await post('/run-tests-batch', { agentPrompt: prompt, tests, agentType: 'CLI Agent' })).results;
    const score = Math.round(((20 - results.filter((result) => !result.passed).length) / 20) * 100);
    console.log(JSON.stringify({ score, results }, null, 2));
    if (command === 'ci' && score < Number(process.env.EVALLOOP_THRESHOLD || 90)) process.exit(1);
    return;
  }

  if (command === 'security') {
    console.log(JSON.stringify(await post('/security-scan', { agentPrompt: input, agentType: 'CLI Agent' }), null, 2));
    return;
  }

  if (command === 'rewrite') {
    console.log(JSON.stringify(await post('/rewrite-prompt', { originalPrompt: input, failures: [{ evidence: 'CLI requested rewrite' }], agentType: 'CLI Agent' }), null, 2));
    return;
  }

  console.log(`${command} is available through the web app export/history workflow.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
