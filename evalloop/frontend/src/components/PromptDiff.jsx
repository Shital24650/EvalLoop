export default function PromptDiff({ changes }) {
  return (
    <article className="card stagger">
      <h3>PROMPT DIFF</h3>
      <p>What EvalLoop changed</p>
      <div className="diff">
        {changes.map((change, index) => (
          <div className="diff-row" key={`${change.replacement}-${index}`}>
            <div className="removed">❌ {change.original || 'Unsafe gap'}</div>
            <div className="added">✅ {change.replacement}</div>
          </div>
        ))}
      </div>
    </article>
  );
}
