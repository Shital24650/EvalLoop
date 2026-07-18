import { useEffect, useState } from 'react';

function gaugeColor(score) {
  if (score < 40) return '#EF4444';
  if (score < 60) return '#F97316';
  if (score < 75) return '#F59E0B';
  if (score < 90) return '#10B981';
  return '#3B82F6';
}

export default function TrustGauge({ score = 0 }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    let frame;
    const startedAt = performance.now();
    const animate = (time) => {
      const progress = Math.min(1, (time - startedAt) / 900);
      setAnimatedScore(Math.round(score * progress));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <section className="trust-gauge-card" aria-label={`Agent Trust Score ${score}`}>
      <svg viewBox="0 0 140 140" role="img">
        <circle className="gauge-track" cx="70" cy="70" r={radius} />
        <circle
          className="gauge-value"
          cx="70"
          cy="70"
          r={radius}
          stroke={gaugeColor(score)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div>
        <span>Agent Trust Score</span>
        <strong style={{ color: gaugeColor(score) }}>{animatedScore}</strong>
        <button className="why-button" type="button">Why?</button>
        <p>Trust combines reliability, confidence, severity, and risk reduction.</p>
      </div>
    </section>
  );
}
