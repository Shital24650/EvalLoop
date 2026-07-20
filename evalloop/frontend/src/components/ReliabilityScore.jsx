import { useEffect, useState } from 'react';

function scoreClass(score) {
  if (score < 60) return 'bad';
  if (score < 80) return 'warn';
  return 'good';
}

export default function ReliabilityScore({ results }) {
  const target = results?.after ?? 0;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let currentScore = 0;
    setAnimatedScore(0);
    const interval = setInterval(() => {
      currentScore += Math.max(1, Math.round((target - currentScore) / 6));
      setAnimatedScore(Math.min(currentScore, target));

      if (currentScore >= target) {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [target]);

  return (
    <article className="card stagger polished">
      <h3>RELIABILITY SCORE</h3>
      <div className="score-row">
        <div className="score-col">
          <b>BEFORE</b>
          <strong className={scoreClass(results.before)}>{results.before}%</strong>
          <div className="bar-bg"><i style={{ width: `${results.before}%` }} /></div>
        </div>
        <div className="arrow">→</div>
        <div className="score-col">
          <b>AFTER</b>
          <strong className={scoreClass(results.after)}>{animatedScore}%</strong>
          <div className="bar-bg"><i style={{ width: `${results.after}%` }} /></div>
        </div>
      </div>
      <p className="muted">+{results.improvement}% improvement • {results.iterations} iterations completed</p>
    </article>
  );
}
