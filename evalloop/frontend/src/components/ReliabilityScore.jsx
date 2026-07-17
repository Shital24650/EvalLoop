import { useEffect, useState } from 'react';

function scoreClass(score) {
  if (score < 60) return 'bad';
  if (score < 80) return 'warn';
  return 'good';
}

export default function ReliabilityScore({ results }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let currentScore = 0;
    const interval = setInterval(() => {
      currentScore += 2;
      setAnimatedScore(Math.min(currentScore, results.after));

      if (currentScore >= results.after) {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [results.after]);

  return (
    <article className="card stagger">
      <h3>RELIABILITY SCORE</h3>
      <div className="score-row">
        <div>
          <b>BEFORE</b>
          <strong className={scoreClass(results.before)}>{results.before}%</strong>
          <i style={{ width: `${results.before}%` }} />
        </div>
        <span>→</span>
        <div>
          <b>AFTER</b>
          <strong className={scoreClass(results.after)}>{animatedScore}%</strong>
          <i style={{ width: `${results.after}%` }} />
        </div>
      </div>
      <p>+{results.improvement}% improvement</p>
      <p>{results.iterations} iterations completed</p>
      <p>~8 minutes of testing saved</p>
    </article>
  );
}
