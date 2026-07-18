const categories = ['hallucination', 'prompt_misread', 'bad_tool_call', 'context_overflow', 'reasoning_loop'];

function grade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

export default function DeveloperDashboard({ results }) {
  const failures = results.failures || [];
  const successRate = Math.max(0, 100 - failures.length * 5);
  const promptQuality = Math.round((results.after + successRate) / 2);

  return (
    <section className="developer-dashboard">
      <h3>DEVELOPER DASHBOARD</h3>
      <div className="metric-grid">
        <div><b>Reliability</b><strong>{results.after}%</strong></div>
        <div><b>Prompt Quality</b><strong>{grade(promptQuality)}</strong></div>
        <div><b>Success Rate</b><strong>{successRate}%</strong></div>
        <div><b>Iterations</b><strong>{results.iterations}</strong></div>
        <div><b>Avg Latency</b><strong>~300ms/line</strong></div>
        <div><b>Failures</b><strong>{failures.length}</strong></div>
      </div>
      <h4>Failure Heatmap</h4>
      <div className="heatmap">
        {categories.map((category) => {
          const count = failures.filter((failure) => failure.failureType === category).length;
          return <span className={`heat-${Math.min(count, 4)}`} key={category}>{category.replace('_', ' ')} · {count}</span>;
        })}
      </div>
    </section>
  );
}
