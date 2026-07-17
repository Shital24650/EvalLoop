import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import Header from './components/Header.jsx';
import AgentTypeSelector from './components/AgentTypeSelector.jsx';
import PromptInput, { DEMO_PROMPT } from './components/PromptInput.jsx';
import AutopsyFeed from './components/AutopsyFeed.jsx';
import ResultsDashboard from './components/ResultsDashboard.jsx';
import ActionButtons from './components/ActionButtons.jsx';
import VersionComparison from './components/VersionComparison.jsx';
import AgentHistory from './components/AgentHistory.jsx';
import Footer from './components/Footer.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const failureLabels = { hallucination: 'Hallucination', prompt_misread: 'Prompt Misread', bad_tool_call: 'Bad Tool Call', context_overflow: 'Context Overflow', reasoning_loop: 'Reasoning Loop' };
const fallbackTests = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, input: `Adversarial edge case ${i + 1}`, targetFailure: ['hallucination','prompt_misread','bad_tool_call','context_overflow','reasoning_loop'][i % 5], description: 'Demo fallback test' }));
const fallbackRewrite = { improvedPrompt: 'You are a careful customer support agent for ShopEase. Use only confirmed policies and customer-provided identifiers. If unsure, say you do not know and escalate. Never invent order numbers, tracking data, refund timelines, or policies.', changes: [ { type: 'removed', original: 'make your best guess', replacement: "say I don't know if unsure", reason: 'Triggered hallucination in uncertainty tests.' }, { type: 'added', original: 'Always give a specific refund timeline', replacement: 'Only use confirmed information', reason: 'Prevents fabricated timelines.' }, { type: 'added', original: '', replacement: 'never reference order numbers unless provided by customer', reason: 'Prevents made-up customer data.' } ] };

async function postJson(path, body) {
  const response = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error((await response.json()).error || 'Request failed');
  return response.json();
}

function demoResult(test, iteration) {
  const failSet = iteration === 1 ? new Set([2,4,6,8,10,11,12,14,16,17,19]) : new Set([8]);
  const passed = !failSet.has(test.id);
  const failureType = passed ? null : ['hallucination','prompt_misread','bad_tool_call','context_overflow','reasoning_loop'][test.id % 5];
  return { testId: test.id, passed, failureType, evidence: passed ? 'Agent stayed within prompt boundaries.' : failureType === 'hallucination' ? 'Agent fabricated refund timeline not in system prompt.' : 'Agent crossed an unsafe instruction boundary.', severity: test.id % 3 === 0 ? 'low' : test.id % 2 === 0 ? 'medium' : 'critical' };
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
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('evalloop-history') || '[]'));

  useEffect(() => localStorage.setItem('evalloop-history', JSON.stringify(history.slice(0, 5))), [history]);
  const addLine = async (text, type = 'neutral') => { setLines((prev) => [...prev, { text, type }]); await sleep(300); };

  async function runEvalLoop(sourcePrompt = prompt, forceDemo = false) {
    if (!sourcePrompt.trim()) { setError('Paste an agent system prompt before running EvalLoop.'); return; }
    setError(''); setRunning(true); setLoading(true); setResults(null); setLines([]);
    try {
      await addLine('[00:01] 🔍 Analyzing agent prompt...');
      await addLine(`[00:03] ⚡ Generating 20 edge case tests for ${agentType} agent...`, 'section');
      let tests = fallbackTests;
      if (!forceDemo) tests = (await postJson('/generate-tests', { agentPrompt: sourcePrompt, agentType })).tests;
      let currentPrompt = sourcePrompt, allFailures = [], before = 0, after = 0, iterations = 0;
      let rewrite = { improvedPrompt: sourcePrompt, changes: [] };
      for (let iteration = 1; iteration <= maxIterations; iteration++) {
        iterations = iteration;
        const passCountStart = allFailures.length;
        for (const test of tests) {
          let result = forceDemo ? demoResult(test, iteration) : await postJson('/run-test', { agentPrompt: currentPrompt, testInput: test.input, testId: test.id });
          await addLine(`[00:${String(6 + test.id).padStart(2,'0')}] 🧪 Test ${String(test.id).padStart(2,'0')}/20 — ${result.passed ? 'PASS ✅' : 'FAIL ❌'}`, result.passed ? 'pass' : 'fail');
          if (!result.passed) { allFailures.push(result); await addLine(`         → Failure: ${failureLabels[result.failureType] || 'Failure'} detected`, 'evidence'); await addLine(`         → Evidence: ${result.evidence}`, 'evidence'); }
        }
        const iterationFailures = allFailures.length - passCountStart;
        const score = Math.round(((20 - iterationFailures) / 20) * 100);
        if (iteration === 1) before = score; after = score;
        await addLine('[00:28] ━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'section');
        await addLine(`[00:28] ${score >= threshold ? '✅' : '💀'} ITERATION ${iteration} COMPLETE\n         Reliability Score: ${score}%\n         Passed: ${20 - iterationFailures}/20 tests\n         Failed: ${iterationFailures}/20 tests`, 'section');
        if (score >= threshold || iteration === maxIterations) break;
        await addLine('[00:29] 🔧 Analyzing failure patterns...', 'section');
        await addLine('[00:31] 📝 Rewriting weak prompt sections...', 'section');
        rewrite = forceDemo ? fallbackRewrite : await postJson('/rewrite-prompt', { originalPrompt: currentPrompt, failures: allFailures, agentType });
        currentPrompt = rewrite.improvedPrompt;
        await addLine(`[00:33] 🔁 Starting Iteration ${iteration + 1}...`, 'section');
      }
      await addLine(after >= threshold ? '[00:51] 🎯 THRESHOLD REACHED\n         Agent is production-ready.' : '[00:51] ⚠️ MAX ITERATIONS REACHED', after >= threshold ? 'pass' : 'section');
      const final = { agentType, originalPrompt: sourcePrompt, fixedPrompt: rewrite.improvedPrompt, before, after, improvement: after - before, iterations, failures: allFailures, changes: rewrite.changes };
      setResults(final); setHistory((h) => [{ name: `${agentType} Bot v${h.length + 1}`, score: after, when: 'just now', session: final }, ...h].slice(0, 5));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setRunning(false); }
  }

  const demo = () => { setAgentType('Customer Support'); setPrompt(DEMO_PROMPT); setTimeout(() => runEvalLoop(DEMO_PROMPT, true), 0); };
  return <main className="app"><Header /><AgentTypeSelector selected={agentType} onSelect={setAgentType}/><PromptInput prompt={prompt} setPrompt={setPrompt} threshold={threshold} setThreshold={setThreshold} maxIterations={maxIterations} setMaxIterations={setMaxIterations} onRun={() => runEvalLoop()} onDemo={demo} loading={loading}/>{error && <div className="error-banner">Something went wrong: {error}<button onClick={() => runEvalLoop()}>🔄 Retry</button></div>}{loading && <div className="thinking"><span/> EvalLoop is thinking...</div>}{!lines.length && !results && <section className="empty">Ready to evaluate your agent.<br/>Choose an agent type above, paste your system prompt, then click Run EvalLoop.<br/>Not sure where to start?<br/><button onClick={demo}>▶ Try the Demo Agent</button></section>} {!!lines.length && <AutopsyFeed lines={lines} running={running}/>} {results && <><ResultsDashboard results={results}/><ActionButtons results={results} onRunAgain={() => runEvalLoop(results.originalPrompt, false)}/></>}<VersionComparison agentType={agentType} api={API}/><AgentHistory history={history} onLoad={(s)=>{setResults(s); setPrompt(s.originalPrompt); setAgentType(s.agentType)}}/><Footer /></main>;
}

createRoot(document.getElementById('root')).render(<App />);
