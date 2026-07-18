import { useState } from 'react';

export default function VersionComparison({ agentType, api }) {
  const [open, setOpen] = useState(false);
  const [promptV1, setPromptV1] = useState('');
  const [promptV2, setPromptV2] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function compareVersions() {
    setError('');

    try {
      const response = await fetch(`${api}/compare-versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptV1, promptV2, agentType }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error);
      }

      setResult(await response.json());
    } catch (comparisonError) {
      setResult({
        v1Score: 67,
        v2Score: 94,
        winner: 'v2',
        reason: 'Better uncertainty handling and cleaner boundaries on edge case inputs.',
        keyDifferences: ['Uncertainty handling', 'No fabricated identifiers'],
      });
      setError(comparisonError.message);
    }
  }

  return (
    <section className="compare">
      <button className="collapse" onClick={() => setOpen(!open)}>
        Compare Two Agent Versions {open ? '▾' : '▸'}
      </button>
      {open && (
        <div className="panel">
          <p>Find out which version of your agent is more reliable</p>
          <div className="compare-grid">
            <label>
              Agent Version 1
              <textarea value={promptV1} onChange={(event) => setPromptV1(event.target.value)} />
            </label>
            <label>
              Agent Version 2
              <textarea value={promptV2} onChange={(event) => setPromptV2(event.target.value)} />
            </label>
          </div>
          <button className="primary" onClick={compareVersions}>
            ▶ COMPARE NOW
          </button>
          {error && <p className="hint">Demo comparison shown because API returned: {error}</p>}
          {result && (
            <div className="compare-result">
              <p>Version 1: {result.v1Score}% reliable</p>
              <i style={{ width: `${result.v1Score}%` }} />
              <p>
                Version 2: {result.v2Score}% reliable {result.winner === 'v2' ? '✅ WIN' : ''}
              </p>
              <i style={{ width: `${result.v2Score}%` }} />
              <b>Winner: Version {result.winner === 'v1' ? '1' : '2'}</b>
              <p>Reason: {result.reason}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
