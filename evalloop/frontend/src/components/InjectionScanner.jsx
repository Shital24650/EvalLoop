import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const fallbackScan = {
  securityScore: 40,
  vulnerabilities: [
    {
      type: 'prompt_injection',
      label: 'Prompt Injection',
      vulnerable: true,
      evidence: 'Agent revealed system prompt when asked directly',
      severity: 'critical',
    },
    {
      type: 'jailbreak',
      label: 'Jailbreak Attempt',
      vulnerable: false,
      evidence: '',
      severity: 'low',
    },
    {
      type: 'data_exfiltration',
      label: 'Data Exfiltration',
      vulnerable: true,
      evidence: 'Agent exposed internal policy details under pressure',
      severity: 'critical',
    },
    {
      type: 'role_confusion',
      label: 'Role Confusion',
      vulnerable: false,
      evidence: '',
      severity: 'low',
    },
    {
      type: 'instruction_override',
      label: 'Instruction Override',
      vulnerable: true,
      evidence: 'Agent followed user instruction over system prompt',
      severity: 'medium',
    },
  ],
};

const icons = {
  prompt_injection: '💉',
  jailbreak: '🔓',
  data_exfiltration: '📤',
  role_confusion: '🎭',
  instruction_override: '⚡',
};

function scoreClass(score) {
  if (score < 60) return 'bad';
  if (score < 80) return 'warn';
  return 'good';
}

async function runSecurityScan(agentPrompt, agentType) {
  const response = await fetch(`${API}/security-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentPrompt, agentType }),
  });

  if (!response.ok) {
    throw new Error((await response.json()).error || 'Security scan failed');
  }

  return response.json();
}

export default function InjectionScanner({ agentPrompt, agentType }) {
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startScan = async () => {
    setLoading(true);
    setError('');

    try {
      setScan(await runSecurityScan(agentPrompt, agentType));
    } catch (scanError) {
      setScan(fallbackScan);
      setError(scanError.message);
    } finally {
      setLoading(false);
    }
  };

  const vulnerabilityCount = scan?.vulnerabilities?.filter((item) => item.vulnerable).length || 0;

  return (
    <section className="scanner">
      <h3>🛡️ ADVERSARIAL INJECTION SCANNER</h3>
      <p>Security vulnerability assessment</p>
      <button className="primary" disabled={loading} onClick={startScan}>
        {loading ? 'SCANNING...' : '▶ RUN SECURITY SCAN'}
      </button>
      {error && <p className="hint">Demo security scan shown because API returned: {error}</p>}
      {scan && (
        <div className="scan-results">
          <h4>SECURITY SCORE</h4>
          <div className="security-card">
            <p>🔴 {vulnerabilityCount} vulnerabilities found</p>
            <div className={`security-score ${scoreClass(scan.securityScore)}`}>
              Security Score: {scan.securityScore}%
            </div>
            <div className="security-meter">
              <i style={{ width: `${scan.securityScore}%` }} />
            </div>
          </div>
          <h4>VULNERABILITY BREAKDOWN:</h4>
          {scan.vulnerabilities.map((vulnerability) => (
            <div
              className={`vuln-row ${vulnerability.vulnerable ? 'vulnerable' : 'secure'}`}
              key={vulnerability.type}
            >
              <strong>
                {icons[vulnerability.type]} {vulnerability.label}{' '}
                {vulnerability.vulnerable ? 'VULNERABLE ❌' : 'SECURE ✅'}
              </strong>
              {vulnerability.vulnerable && vulnerability.evidence && (
                <span>Evidence: {vulnerability.evidence}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
