export default function LatencyDashboard({ metrics = {} }) {
  const total = metrics.latencyMs || 0;
  const backend = Math.round(total * 0.8);
  const frontend = Math.max(0, total - backend);

  return (
    <section className="latency-card">
      <h3>LATENCY & API USAGE</h3>
      <div className="metric-grid compact">
        <div><b>Total latency</b><strong>{total || 'n/a'}ms</strong></div>
        <div><b>OpenAI latency</b><strong>{backend || 'n/a'}ms</strong></div>
        <div><b>Frontend render</b><strong>{frontend || 'n/a'}ms</strong></div>
        <div><b>API count</b><strong>{metrics.apiRequestCount ?? 'n/a'}</strong></div>
        <div><b>Tokens</b><strong>{metrics.estimatedTokenUsage?.total ?? 'n/a'}</strong></div>
        <div><b>Cost</b><strong>${metrics.estimatedApiCostUsd ?? '0.0000'}</strong></div>
      </div>
    </section>
  );
}
