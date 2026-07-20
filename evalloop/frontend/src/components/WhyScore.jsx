export default function WhyScore({ metrics = {}, failures = [] }) {
  const bullets = [];

  if ((metrics.hallucinationProbability || 0) < 10) {
    bullets.push({ ok: true, text: 'No hallucinations detected' });
  } else {
    bullets.push({ ok: false, text: 'Potential hallucination risk detected' });
  }

  if ((metrics.toolMisuseProbability || 0) < 20) {
    bullets.push({ ok: true, text: 'Tool usage verified' });
  } else {
    bullets.push({ ok: false, text: 'Tool misuse observed in tests' });
  }

  if ((metrics.promptInjectionProbability || 0) < 10) {
    bullets.push({ ok: true, text: 'Prompt consistency maintained' });
  } else {
    bullets.push({ ok: false, text: 'Prompt-injection risk detected' });
  }

  if ((metrics.contextOverflowProbability || 0) > 25) {
    bullets.push({ ok: false, text: 'Minor context overflow risk' });
  } else {
    bullets.push({ ok: true, text: 'Context maintained' });
  }

  if ((metrics.riskScore || 0) < 30 && (!failures || failures.length === 0)) {
    bullets.push({ ok: true, text: 'Security best practices followed' });
  } else {
    bullets.push({ ok: false, text: 'Security issues were found (see vulnerabilities)' });
  }

  return (
    <article className="card why-score polished">
      <h4>Why this score?</h4>
      <ul>
        {bullets.slice(0, 5).map((b, idx) => (
          <li key={idx} className={b.ok ? 'ok' : 'warn'}>
            {b.ok ? '✓' : '⚠'} {b.text}
          </li>
        ))}
      </ul>
    </article>
  );
}
