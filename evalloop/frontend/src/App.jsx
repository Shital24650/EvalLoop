import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import ActionButtons from './components/ActionButtons.jsx';
import AgentHistory from './components/AgentHistory.jsx';
import AgentTypeSelector from './components/AgentTypeSelector.jsx';
import AutopsyFeed from './components/AutopsyFeed.jsx';
import ChainTester from './components/ChainTester.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import PromptInput, { DEMO_PROMPT } from './components/PromptInput.jsx';
import RegressionAnalysis from './components/RegressionAnalysis.jsx';
import ResultsDashboard from './components/ResultsDashboard.jsx';
import VersionComparison from './components/VersionComparison.jsx';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const HISTORY_KEY = 'evalloop-history';
const TEST_COUNT = 20;

const failureLabels = {
  hallucination: 'Hallucination',
  prompt_misread: 'Prompt Misread',
  bad_tool_call: 'Bad Tool Call',
  context_overflow: 'Context Overflow',
  reasoning_loop: 'Reasoning Loop',
};

const failureTypes = Object.keys(failureLabels);

const fallbackTests = Array.from({ length: TEST_COUNT }, (_, index) => ({
  id: index + 1,
  input: `Adversarial edge case ${index + 1}`,
  targetFailure: failureTypes[index % failureTypes.length],
  description: 'Demo fallback test',
}));

const fallbackRewrite = {
  improvedPrompt:
    'You are a careful customer support agent for ShopEase. Use only confirmed policies and customer-provided identifiers. If unsure, say you do not know and escalate. Never invent order numbers, tracking data, refund timelines, or policies.',
  changes: [
    {
      type: 'removed',
      original: 'make your best guess',
      replacement: "say I don't know if unsure",
      reason: 'Triggered hallucination in uncertainty tests.',
    },
    {
      type: 'added',
      original: 'Always give a specific refund timeline',
      replacement: 'Only use confirmed information',
      reason: 'Prevents fabricated timelines.',
    },
    {
      type: 'added',
      original: '',
      replacement: 'never reference order numbers unless provided by customer',
      reason: 'Prevents made-up customer data.',
    },
  ],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getApiUrl(path) {
  return `${API_URL.replace(/\/$/, '')}${path}`;
}

async function postJson(path, body) {
  const response = await fetch(getApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }
  return payload;
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function createDemoResult(test, iteration) {
  const failingTests = iteration === 1 ? new Set([2, 4, 6, 8, 10, 11, 12, 14, 16, 17, 19]) : new Set([8]);
  const passed = !failingTests.has(test.id);
  const failureType = passed ? null : failureTypes[test.id % failureTypes.length];

  return {
    testId: test.id,
    passed,
    failureType,
    evidence: passed
      ? 'Agent stayed within prompt boundaries.'
      : failureType === 'hallucination'
        ? 'Agent fabricated refund timeline not in system prompt.'
        : 'Agent crossed an unsafe instruction boundary.',
    severity: test.id % 3 === 0 ? 'low' : test.id % 2 === 0 ? 'medium' : 'critical',
  };
}

function buildSession(agentType, originalPrompt, rewrittenPrompt, before, after, iterations, failures, changes) {
  return {
    agentType,
    originalPrompt,
    fixedPrompt: rewrittenPrompt,
    before,
    after,
    improvement: after - before,
    iterations,
    failures,
    changes,
  };
}

function App() {
  const [agentType, setAgentType] = useState('Customer Support');
  const [prompt, setPrompt] = useState('');
  const [threshold, setThreshold] = useState(90);
  const [maxIterations, setMaxIterations] = useState(3);
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState(getHistory);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
  }, [history]);

  const addLine = useCallback(async (text, type = 'neutral') => {
    setLines((currentLines) => [...currentLines, { text, type }]);
    await sleep(300);
  }, []);

  const runEvalLoop = useCallback(
    async (sourcePrompt = prompt, forceDemo = false, overrideAgentType = agentType) => {
      if (loading) return;
      if (!sourcePrompt.trim()) {
        setError('Paste an agent system prompt before running EvalLoop.');
        return;
      }

      const activeAgentType = overrideAgentType || agentType;

      setError('');
      setRunning(true);
      setLoading(true);
      setResults(null);
      setLines([]);

      try {
        await addLine('[00:01] 🔍 Analyzing agent prompt...');
        await addLine(`[00:03] ⚡ Generating 20 edge case tests for ${activeAgentType} agent...`, 'section');

        const tests = forceDemo
          ? fallbackTests
          : (await postJson('/generate-tests', { agentPrompt: sourcePrompt, agentType: activeAgentType })).tests || [];

        if (tests.length !== TEST_COUNT) {
          throw new Error(`Expected ${TEST_COUNT} generated tests, received ${tests.length}.`);
        }

        let currentPrompt = sourcePrompt;
        let allFailures = [];
        let before = 0;
        let after = 0;
        let iterations = 0;
        let rewrite = { improvedPrompt: sourcePrompt, changes: [] };

        for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
          iterations = iteration;
          const failureCountBeforeIteration = allFailures.length;
          const batchPayload = forceDemo
            ? { results: tests.map((test) => createDemoResult(test, iteration)) }
            : await postJson('/run-tests-batch', { agentPrompt: currentPrompt, tests, agentType: activeAgentType });
          const iterationResults = Array.isArray(batchPayload.results) ? batchPayload.results : [];

          if (iterationResults.length !== TEST_COUNT) {
            throw new Error(`Expected ${TEST_COUNT} test results, received ${iterationResults.length}.`);
          }

          for (const result of iterationResults) {
            await addLine(
              `[00:${String(6 + result.testId).padStart(2, '0')}] 🧪 Test ${String(result.testId).padStart(2, '0')}/20 — ${result.passed ? 'PASS ✅' : 'FAIL ❌'}`,
              result.passed ? 'pass' : 'fail',
            );

            if (!result.passed) {
              allFailures.push(result);
              await addLine(`         → Failure: ${failureLabels[result.failureType] || 'Failure'} detected`, 'evidence');
              await addLine(`         → Evidence: ${result.evidence || 'No evidence provided.'}`, 'evidence');
            }
          }

          const iterationFailures = allFailures.length - failureCountBeforeIteration;
          const score = Math.round(((TEST_COUNT - iterationFailures) / TEST_COUNT) * 100);
          if (iteration === 1) before = score;
          after = score;

          await addLine('[00:28] ━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'section');
          await addLine(
            `[00:28] ${score >= threshold ? '✅' : '💀'} ITERATION ${iteration} COMPLETE\n         Reliability Score: ${score}%\n         Passed: ${TEST_COUNT - iterationFailures}/20 tests\n         Failed: ${iterationFailures}/20 tests`,
            'section',
          );

          if (score >= threshold || iteration === maxIterations) break;

          await addLine('[00:29] 🔧 Analyzing failure patterns...', 'section');
          await addLine('[00:31] 📝 Rewriting weak prompt sections...', 'section');
          rewrite = forceDemo
            ? fallbackRewrite
            : await postJson('/rewrite-prompt', { originalPrompt: currentPrompt, failures: allFailures, agentType: activeAgentType });
          currentPrompt = rewrite.improvedPrompt || currentPrompt;
          await addLine(`[00:33] 🔁 Starting Iteration ${iteration + 1}...`, 'section');
        }

        await addLine(
          after >= threshold
            ? '[00:51] 🎯 THRESHOLD REACHED\n         Agent is production-ready.'
            : '[00:51] ⚠️ MAX ITERATIONS REACHED',
          after >= threshold ? 'pass' : 'section',
        );

        const finalSession = buildSession(
          activeAgentType,
          sourcePrompt,
          rewrite.improvedPrompt || currentPrompt,
          before,
          after,
          iterations,
          allFailures,
          rewrite.changes || [],
        );

        setResults(finalSession);
        setHistory((currentHistory) => [
          { name: `${activeAgentType} Bot v${currentHistory.length + 1}`, score: after, when: 'just now', session: finalSession },
          ...currentHistory,
        ].slice(0, 5));
      } catch (runError) {
        setError(runError.message);
      } finally {
        setLoading(false);
        setRunning(false);
      }
    },
    [addLine, agentType, loading, maxIterations, prompt, threshold],
  );

  const runDemo = useCallback(() => {
    setAgentType('Customer Support');
    setPrompt(DEMO_PROMPT);
    setTimeout(() => runEvalLoop(DEMO_PROMPT, true, 'Customer Support'), 0);
  }, [runEvalLoop]);

  const loadSession = useCallback((session) => {
    setResults(session);
    setPrompt(session.originalPrompt);
    setAgentType(session.agentType);
  }, []);

  const showEmptyState = useMemo(() => !lines.length && !results, [lines.length, results]);

  return (
    <main className="app">
      <Header />
      <AgentTypeSelector selected={agentType} onSelect={setAgentType} />
      <PromptInput
        prompt={prompt}
        setPrompt={setPrompt}
        threshold={threshold}
        setThreshold={setThreshold}
        maxIterations={maxIterations}
        setMaxIterations={setMaxIterations}
        onRun={() => runEvalLoop()}
        onDemo={runDemo}
        loading={loading}
      />
      {error && (
        <div className="error-banner" role="alert">
          <span>Something went wrong: {error}</span>
          <button onClick={() => runEvalLoop()}>🔄 Retry</button>
        </div>
      )}
      {loading && (
        <div className="thinking" aria-live="polite">
          <span /> EvalLoop is thinking...
        </div>
      )}
      {showEmptyState && (
        <section className="empty">
          Ready to evaluate your agent.
          <br />
          Choose an agent type above, paste your system prompt, then click Run EvalLoop.
          <br />
          Not sure where to start?
          <br />
          <button onClick={runDemo}>▶ Try the Demo Agent</button>
        </section>
      )}
      {lines.length > 0 && <AutopsyFeed lines={lines} running={running} />}
      {results && (
        <>
          <ResultsDashboard results={results} />
          <ActionButtons results={results} onRunAgain={() => runEvalLoop(results.originalPrompt, false)} />
          <RegressionAnalysis current={results} history={history} />
        </>
      )}
      <VersionComparison agentType={agentType} api={API_URL} />
      <ChainTester agentType={agentType} />
      <AgentHistory history={history} onLoad={loadSession} />
      <Footer />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
