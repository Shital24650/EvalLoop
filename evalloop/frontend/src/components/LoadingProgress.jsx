export default function LoadingProgress({ progress }) {
  const stageMap = {
    'Analyzing prompt': 'Analyzing Prompt...',
    'Generating tests': 'Generating Test Cases...',
    Starting: 'Preparing evaluation...',
    'Rewriting prompt': 'Building Trust Report...',
    Complete: 'Finalizing...',
  };
  const label = stageMap[progress.stage] || progress.stage || 'Working...';

  return (
    <section className="progress-panel polished" aria-live="polite">
      <div className="progress-header">
        <b>{label}</b>
        <span className="percent">{Math.round(progress.percent)}%</span>
      </div>
      <div className="progress-bar">
        <i style={{ width: `${Math.max(2, progress.percent)}%` }} />
      </div>
      <div className="progress-rows">
        <div>Elapsed: {Math.round(progress.elapsedMs / 1000)}s · Remaining: {Math.max(0, Math.round(progress.remainingMs / 1000))}s</div>
        <div className="muted">Current: {progress.currentEvaluation} · API: {progress.apiRequest}</div>
      </div>
    </section>
  );
}
