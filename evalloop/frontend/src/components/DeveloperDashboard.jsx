const categories = ['hallucination', 'prompt_misread', 'bad_tool_call', 'context_overflow', 'reasoning_loop'];
const riskKeys = [
  ['Hallucination', 'hallucinationProbability'],
  ['Injection', 'promptInjectionProbability'],
  ['Tool Misuse', 'toolMisuseProbability'],
  ['Context Overflow', 'contextOverflowProbability'],
];

function grade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

export default function DeveloperDashboard({ results }) {
  const failures = results.failures || [];
  const metrics = results.metrics || {};
  const successRate = Math.max(0, 100 - failures.length * 5);
  const promptQuality = Math.round(((metrics.reliabilityScore || results.after) + successRate) / 2);

  return (
    <section className="developer-dashboard">
      <h3>PREMIUM DEVELOPER DASHBOARD</h3>
      <div className="metric-grid">
        <div><b>Agent Trust</b><strong>{metrics.agentTrustScore ?? results.after}</strong></div>
        <div><b>Reliability</b><strong>{metrics.reliabilityScore ?? results.after}%</strong></div>
        <div><b>Confidence</b><strong>{metrics.confidenceScore ?? 90}%</strong></div>
        <div><b>Risk Score</b><strong>{metrics.riskScore ?? failures.length * 5}</strong></div>
        <div><b>Prompt Quality</b><strong>{grade(promptQuality)}</strong></div>
        <div><b>Latency</b><strong>{metrics.latencyMs ? `${metrics.latencyMs}ms` : '~300ms/line'}</strong></div>
        <div><b>Estimated Cost</b><strong>${metrics.estimatedApiCostUsd ?? '0.0000'}</strong></div>
        <div><b>API Calls</b><strong>{metrics.apiRequestCount ?? results.iterations}</strong></div>
        <div><b>Iterations</b><strong>{results.iterations}</strong></div>
      </div>
      <h4>Risk Breakdown</h4>
      <div className="risk-bars">
        {riskKeys.map(([label, key]) => (
          <div key={key}><span>{label}</span><i><em style={{ width: `${metrics[key] || 0}%` }} /></i><b>{metrics[key] || 0}%</b></div>
        ))}
      </div>
      <h4>Failure Heatmap</h4>
      <div className="heatmap">
        {categories.map((category) => {
          const count = failures.filter((failure) => failure.failureType === category).length;
          return <span className={`heat-${Math.min(count, 4)}`} key={category}>{category.replace('_', ' ')} · {count}</span>;
        })}
      </div>
      {Boolean(results.securityFindings?.length) && (
        <div className="security-findings">
          <h4>Detected Prompt Security Issues</h4>
          {results.securityFindings.map((finding) => (
            <p key={finding.attackType}><b>{finding.attackType}</b> · {finding.severity} · {finding.suggestedFix}</p>
          ))}
        </div>
      )}
    </section>
  );
}
