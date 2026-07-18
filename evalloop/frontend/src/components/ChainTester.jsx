import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

const fallbackChain = {
  chainScore: 74,
  agents: [
    {
      id: 1,
      label: 'Agent 1 (Research)',
      score: 94,
      status: 'strong',
      failures: [],
    },
    {
      id: 2,
      label: 'Agent 2 (Analysis)',
      score: 61,
      status: 'weak',
      failures: ['Hallucination on ambiguous input', 'Context overflow on long chains'],
    },
    {
      id: 3,
      label: 'Agent 3 (Writer)',
      score: 88,
      status: 'strong',
      failures: [],
    },
  ],
  weakLink: 2,
  recommendation: 'Agent 2 needs stronger boundary instructions and context management',
};

function statusIcon(status) {
  if (status === 'critical') return '❌';
  if (status === 'weak') return '⚠️ WEAK LINK';
  return '✅';
}

async function testChain(agents, agentType) {
  const response = await fetch(`${API}/test-chain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agents, agentType }),
  });

  if (!response.ok) {
    throw new Error((await response.json()).error || 'Chain test failed');
  }

  return response.json();
}

export default function ChainTester({ agentType }) {
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState(['', '', '']);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateAgent = (index, value) => {
    setAgents((currentAgents) => currentAgents.map((agent, agentIndex) => (agentIndex === index ? value : agent)));
  };

  const runChainTest = async () => {
    setLoading(true);
    setError('');

    try {
      setResult(await testChain(agents, agentType));
    } catch (chainError) {
      setResult(fallbackChain);
      setError(chainError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="chain-tester">
      <h3>🔗 PROMPT CHAIN TESTER</h3>
      <p>Test multi-agent pipelines</p>
      <button className="collapse" onClick={() => setOpen(!open)}>
        {open ? '▾ Collapse' : '▸ Expand'}
      </button>
      {open && (
        <div>
          {['Agent 1 (Research)', 'Agent 2 (Analysis)', 'Agent 3 (Writer)'].map((label, index) => (
            <label key={label}>
              {label}
              <textarea value={agents[index]} onChange={(event) => updateAgent(index, event.target.value)} />
            </label>
          ))}
          <button className="primary" disabled={loading} onClick={runChainTest}>
            {loading ? 'TESTING CHAIN...' : '▶ TEST CHAIN'}
          </button>
          {error && <p className="hint">Demo chain result shown because API returned: {error}</p>}
          {result && (
            <div className="chain-results">
              {result.agents.map((agent) => (
                <div className={`chain-agent ${agent.status}`} key={agent.id}>
                  <span>
                    {agent.label}: {agent.score}% reliable
                  </span>
                  <b>{statusIcon(agent.status)}</b>
                </div>
              ))}
              <div className="chain-weak-link">
                🔴 Chain failure at Agent {result.weakLink}
                <br />
                Recommendation: {result.recommendation}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
