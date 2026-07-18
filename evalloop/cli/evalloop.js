#!/usr/bin/env node
const commandAliases = { run: 'evaluate', benchmark: 'evaluate', export: 'report' };
const command = commandAliases[process.argv[2]] || process.argv[2];
const api = process.env.EVALLOOP_API_URL || 'http://localhost:4000/api';
const input = process.argv.slice(3).join(' ');
const color = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  amber: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

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

async function evaluatePrompt(prompt, ciMode = false) {
  console.log(color.cyan('EvalLoop: generating adversarial tests...'));
  const tests = (await post('/generate-tests', { agentPrompt: prompt, agentType: 'CLI Agent' })).tests;
  console.log(color.cyan('EvalLoop: running batched evaluation...'));
  const batch = await post('/run-tests-batch', { agentPrompt: prompt, tests, agentType: 'CLI Agent' });
  const score = batch.metrics?.reliabilityScore ?? Math.round(((20 - batch.results.filter((result) => !result.passed).length) / 20) * 100);
  const summary = { score, metrics: batch.metrics, results: batch.results };
  console.log(score >= 90 ? color.green(JSON.stringify(summary, null, 2)) : color.amber(JSON.stringify(summary, null, 2)));
  if (ciMode && score < Number(process.env.EVALLOOP_THRESHOLD || 90)) process.exit(1);
}

async function main() {
  if (!command || ['evaluate', 'compare', 'report', 'rewrite', 'history', 'security', 'ci'].includes(command) === false) {
    console.log('Usage: evalloop <run|evaluate|compare|benchmark|export|report|rewrite|history|security|ci> [prompt]');
    process.exit(command ? 1 : 0);
  }

  if (command === 'evaluate' || command === 'ci') {
    await evaluatePrompt(input || 'You are a careful AI agent.', command === 'ci');
    return;
  }

  if (command === 'security') {
    console.log(color.cyan(JSON.stringify(await post('/security-scan', { agentPrompt: input, agentType: 'CLI Agent' }), null, 2)));
    return;
  }

  if (command === 'rewrite') {
    console.log(JSON.stringify(await post('/rewrite-prompt', { originalPrompt: input, failures: [{ evidence: 'CLI requested rewrite' }], agentType: 'CLI Agent' }), null, 2));
    return;
  }

  console.log(`${command} is available through the web app export/history workflow.`);
}

main().catch((error) => {
  console.error(color.red(error.message));
  process.exit(1);
});
