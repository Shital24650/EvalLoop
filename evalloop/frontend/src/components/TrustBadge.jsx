function badge(score) {
  if (score >= 85) return { label: '🟢 Trusted', color: '#10B981' };
  if (score >= 65) return { label: '🟡 Needs Review', color: '#F59E0B' };
  return { label: '🔴 Unsafe', color: '#EF4444' };
}

export default function TrustBadge({ score = 0 }) {
  const current = badge(score);
  const markdown = `![EvalLoop Trust](${current.label})`;
  const html = `<span style="color:${current.color};font-weight:700">${current.label}</span>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="28"><rect width="160" height="28" rx="6" fill="${current.color}"/><text x="12" y="19" fill="#fff" font-family="Inter,Arial" font-size="14">${current.label}</text></svg>`;

  const copy = (value) => navigator.clipboard?.writeText(value);

  return (
    <section className="trust-badge-card">
      <h3>TRUST BADGE</h3>
      <strong style={{ color: current.color }}>{current.label}</strong>
      <div className="badge-actions">
        <button onClick={() => copy(markdown)}>Copy Markdown</button>
        <button onClick={() => copy(html)}>Copy HTML</button>
        <button onClick={() => copy(svg)}>Copy SVG</button>
      </div>
    </section>
  );
}
