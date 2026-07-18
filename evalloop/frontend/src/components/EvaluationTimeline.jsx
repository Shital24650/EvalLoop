const stages = [
  'Generate adversarial tests',
  'Security scan',
  'Batch evaluation',
  'Failure clustering',
  'Prompt rewrite',
  'Re-test',
  'Final report',
];

export default function EvaluationTimeline({ progress }) {
  const percent = progress?.percent || 0;
  return (
    <section className="timeline-card" aria-label="Live evaluation timeline">
      <h3>LIVE EVALUATION TIMELINE</h3>
      {stages.map((stage, index) => {
        const stagePercent = ((index + 1) / stages.length) * 100;
        const complete = percent >= stagePercent;
        const active = !complete && percent >= (index / stages.length) * 100;
        return <div className={active ? 'timeline-stage active' : complete ? 'timeline-stage complete' : 'timeline-stage'} key={stage}><span>{complete ? '✓' : active ? '●' : '○'}</span>{stage}</div>;
      })}
    </section>
  );
}
