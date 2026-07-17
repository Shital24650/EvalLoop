export default function RewriteExplanation({ changes }) {
  return (
    <article className="card stagger">
      <h3>WHY EVALLOOP MADE THESE CHANGES</h3>
      {changes.map((change, index) => (
        <div className="why" key={`${change.reason}-${index}`}>
          <b>{change.type === 'removed' ? '❌ Removed' : '✅ Added'}:</b>
          <q>{change.type === 'removed' ? change.original : change.replacement}</q>
          <p>Reason: {change.reason}</p>
        </div>
      ))}
    </article>
  );
}
