const axes = ['Hallucination', 'Injection', 'Tool Misuse', 'Context Overflow', 'Reasoning', 'Policy Violations'];

function points(values) {
  const center = 70;
  const max = 54;
  return values.map((value, index) => {
    const angle = (-90 + index * (360 / values.length)) * (Math.PI / 180);
    const radius = max * (value / 100);
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
  }).join(' ');
}

export default function SecurityRadar({ metrics = {} }) {
  const values = [
    metrics.hallucinationProbability || 0,
    metrics.promptInjectionProbability || 0,
    metrics.toolMisuseProbability || 0,
    metrics.contextOverflowProbability || 0,
    metrics.reasoningLoopProbability || 0,
    metrics.policyViolationProbability || Math.min(100, metrics.riskScore || 0),
  ];

  return (
    <section className="radar-card">
      <h3>SECURITY RADAR</h3>
      <svg viewBox="0 0 140 140" role="img" aria-label="Security risk radar chart">
        {[18, 36, 54].map((radius) => <circle key={radius} cx="70" cy="70" r={radius} className="radar-ring" />)}
        <polygon className="radar-shape" points={points(values)} />
        {axes.map((axis, index) => {
          const angle = (-90 + index * 60) * (Math.PI / 180);
          return <text key={axis} x={70 + Math.cos(angle) * 64} y={74 + Math.sin(angle) * 64}>{axis}</text>;
        })}
      </svg>
    </section>
  );
}
